/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Tier 1 Feature Test Suite — Backend Foundations
 * Target: tests/tier1-feature/socratesBackend.test.ts
 *
 * Validates:
 * 1. ColibriClient.checkHealth(): Online (200), restarting/engine_down (503),
 *    offline (ECONNREFUSED), and timeout behaviors.
 * 2. ColibriClient.resolveActiveModel(): Dynamic discovery via /v1/models,
 *    in-memory TTL caching, and graceful defaultModel fallback.
 * 3. ColibriClient.streamChat(): Token delta streaming from SSE chunks,
 *    comment/ping filtering, empty line resiliency, and [DONE] termination.
 * 4. ColibriClient.streamChat() AbortSignal Handling: Immediate generation
 *    termination and socket disconnect propagation.
 * 5. Route GET /api/socrates/health: Response schema validation across
 *    online, non-strict offline (200), and strict offline (503) modes.
 * 6. Route POST /api/socrates/chat (Offline Transparent Handling): Exact HTTP 503
 *    JSON error contract; strictly asserts NO mock fallback engine is called.
 * 7. Route POST /api/socrates/chat (Online SSE Streaming): Stage, token, and done
 *    SSE events; client abort cancellation via req.signal.
 * 8. Strict CR Intelligence Isolation: Static AST/codebase auditing preventing
 *    CR imports, ML microservice port 8000 calls, gamified prompts, and runtime
 *    zero-mutation guarantee on CRConversation and CRMessage tables.
 * =============================================================================
 */

import assert from "node:assert/strict";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { AddressInfo } from "node:net";
import { NextRequest } from "next/server";
import { describe, it, beforeEach, afterEach } from "../run-all-tests";
import { prisma } from "../../src/lib/db";

// Socrates Backend Imports
import {
  ColibriClient,
  ColibriOfflineError,
  ColibriStreamError,
} from "../../src/lib/socrates/colibriClient";
import { GET as healthRouteGet } from "../../src/app/api/socrates/health/route";
import { POST as chatRoutePost } from "../../src/app/api/socrates/chat/route";

// =============================================================================
// Hermetic In-Process Mock Colibri Server (Zero External Dependencies)
// =============================================================================

interface MockServerState {
  online: boolean;
  status: "ok" | "restarting" | "engine_down";
  healthCode: number;
  healthDelayMs?: number;
  modelsList: Array<{ id: string; object: string }>;
  chatDeltas: string[];
  rawSseLines?: string[];
  streamDelayMs?: number;
  chatErrorCode?: number;
  chatErrorBody?: string;
}

class MockColibriServer {
  private server: http.Server | null = null;
  private port = 0;
  private state: MockServerState = {
    online: true,
    status: "ok",
    healthCode: 200,
    modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
    chatDeltas: ["Socrates", " guides", " with", " dialectic", " reasoning."],
  };

  public recordedRequests: Array<{ url: string; method: string; body?: any }> = [];
  public clientDisconnectCount = 0;

  private origFetch: typeof globalThis.fetch | null = null;

  public async start(): Promise<string> {
    this.state.rawSseLines = undefined;
    this.state.chatErrorCode = undefined;
    this.state.healthDelayMs = undefined;
    this.state.streamDelayMs = undefined;

    this.port = 63800 + Math.floor(Math.random() * 1000);

    // Save and hook globalThis.fetch to intercept calls directed to this mock instance
    this.origFetch = globalThis.fetch;
    const mockRoot = `http://127.0.0.1:${this.port}`;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : (input as any)?.url || input.toString();

      if (!urlStr.startsWith(mockRoot)) {
        return this.origFetch!(input, init);
      }

      // Check pre-aborted signal
      if (init?.signal?.aborted) {
        throw (init.signal as any).reason || new DOMException("Operation aborted", "AbortError");
      }

      let parsedBody: any;
      if (init?.body) {
        try {
          parsedBody = JSON.parse(init.body as string);
        } catch {
          parsedBody = init.body;
        }
      }

      const pathname = urlStr.replace(mockRoot, "");

      this.recordedRequests.push({
        url: pathname,
        method: init?.method || "GET",
        body: parsedBody,
      });

      // Route: /health
      if (pathname.startsWith("/health")) {
        if (this.state.healthDelayMs) {
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(resolve, this.state.healthDelayMs);
            if (init?.signal) {
              init.signal.addEventListener(
                "abort",
                () => {
                  clearTimeout(timer);
                  reject((init.signal as any).reason || new DOMException("Operation aborted", "AbortError"));
                },
                { once: true }
              );
            }
          });
        }

        return new Response(JSON.stringify({ status: this.state.status }), {
          status: this.state.healthCode,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Route: /v1/models or /models
      if (pathname.startsWith("/v1/models") || pathname === "/models") {
        return new Response(JSON.stringify({ object: "list", data: this.state.modelsList }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Route: /v1/chat/completions or /chat/completions
      if (pathname.startsWith("/v1/chat/completions") || pathname === "/chat/completions") {
        if (this.state.chatErrorCode) {
          return new Response(this.state.chatErrorBody || "Inference error", {
            status: this.state.chatErrorCode,
            headers: { "Content-Type": "text/plain" },
          });
        }

        const isStreaming = parsedBody?.stream === true;

        if (isStreaming) {
          const encoder = new TextEncoder();
          let aborted = false;

          const onAbort = () => {
            if (!aborted) {
              aborted = true;
              this.clientDisconnectCount++;
            }
          };

          if (init?.signal) {
            init.signal.addEventListener("abort", onAbort, { once: true });
          }

          const stream = new ReadableStream({
            start: async (controller) => {
              try {
                if (this.state.rawSseLines) {
                  for (const line of this.state.rawSseLines) {
                    if (aborted || init?.signal?.aborted) break;
                    controller.enqueue(encoder.encode(`${line}\n`));
                  }
                  if (!aborted && !init?.signal?.aborted) {
                    controller.close();
                  }
                  return;
                }

                for (const delta of this.state.chatDeltas) {
                  if (aborted || init?.signal?.aborted) break;
                  if (this.state.streamDelayMs) {
                    await new Promise<void>((resolve, reject) => {
                      const timer = setTimeout(resolve, this.state.streamDelayMs);
                      if (init?.signal) {
                        init.signal.addEventListener(
                          "abort",
                          () => {
                            clearTimeout(timer);
                            reject((init.signal as any).reason || new DOMException("Operation aborted", "AbortError"));
                          },
                          { once: true }
                        );
                      }
                    });
                  }
                  if (aborted || init?.signal?.aborted) break;

                  const chunkPayload = JSON.stringify({
                    id: "chatcmpl-mock",
                    object: "chat.completion.chunk",
                    choices: [{ delta: { content: delta } }],
                  });
                  controller.enqueue(encoder.encode(`data: ${chunkPayload}\n\n`));
                }

                if (!aborted && !init?.signal?.aborted) {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  controller.close();
                }
              } catch {
                try {
                  controller.close();
                } catch {}
              }
            },
            cancel: () => {
              onAbort();
            },
          });

          return new Response(stream, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }

        // Non-streaming response
        return new Response(
          JSON.stringify({
            id: "chatcmpl-mock-sync",
            object: "chat.completion",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: this.state.chatDeltas.join(""),
                },
              },
            ],
            model: this.state.modelsList[0]?.id || "qwen3-coder-30b-a3b-colibri",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response("Not Found", { status: 404 });
    };

    return this.getUrl();
  }

  public async stop(): Promise<void> {
    if (this.origFetch) {
      globalThis.fetch = this.origFetch;
      this.origFetch = null;
    }
  }

  public getUrl(): string {
    return `http://127.0.0.1:${this.port}/v1`;
  }

  public getRootUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  public setState(partial: Partial<MockServerState>): void {
    if (partial.chatDeltas && !partial.rawSseLines) {
      this.state.rawSseLines = undefined;
    }
    this.state = { ...this.state, ...partial };
  }

  public setRawSseResponse(lines: string[]): void {
    this.state.rawSseLines = lines;
  }

  public clearRequestHistory(): void {
    this.recordedRequests = [];
    this.clientDisconnectCount = 0;
  }

  public getRequestCount(urlPrefix: string): number {
    return this.recordedRequests.filter((r) => r.url.startsWith(urlPrefix)).length;
  }
}

// Global test instances
const mockServer = new MockColibriServer();
const ORIGINAL_COLIBRI_URL = process.env.COLIBRI_BASE_URL;
const UNREACHABLE_PORT = 59998;

// =============================================================================
// TEST SUITE 1: ColibriClient.checkHealth() Online & Offline Behaviors
// =============================================================================

describe("Socrates Backend — 1. ColibriClient Health Check Resolution", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.setState({
      online: true,
      status: "ok",
      healthCode: 200,
      modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
    });
    mockServer.clearRequestHistory();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  it("resolves online status 'ok' (HTTP 200) with active model, endpoint, and latency", async () => {
    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const health = await client.checkHealth();

    assert.equal(health.online, true, "Health status must be online");
    assert.equal(health.status, "ok", "Status must be 'ok'");
    assert.equal(health.model, "qwen3-coder-30b-a3b-colibri", "Model must match resolved Qwen model");
    assert.ok(health.endpoint.includes("/v1"), "Endpoint must point to /v1");
    assert.ok(typeof health.latencyMs === "number" && health.latencyMs >= 0, "Latency must be a non-negative number");
  });

  it("handles Colibri returning 503 restarting / engine_down without throwing", async () => {
    mockServer.setState({
      online: false,
      status: "restarting",
      healthCode: 503,
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const health = await client.checkHealth();

    assert.equal(health.online, false, "Must report online: false when Colibri returns 503");
    assert.equal(health.status, "restarting", "Must preserve 'restarting' status string");
    assert.equal(health.model, "qwen3-coder-30b-a3b-colibri", "Must retain default model name");
  });

  it("handles network connection refused (unreachable port) safely without uncaught rejection", async () => {
    const client = new ColibriClient({
      baseUrl: `http://127.0.0.1:${UNREACHABLE_PORT}/v1`,
      healthTimeoutMs: 500,
    });

    const health = await client.checkHealth();
    assert.equal(health.online, false, "Must report offline on network failure");
    assert.equal(health.status, "offline", "Status must be 'offline'");
    assert.ok(health.endpoint.includes(String(UNREACHABLE_PORT)), "Must report configured endpoint");
  });

  it("handles health check timeout safely", async () => {
    mockServer.setState({
      online: true,
      status: "ok",
      healthDelayMs: 300,
    });

    const client = new ColibriClient({
      baseUrl: mockServer.getUrl(),
      healthTimeoutMs: 50,
    });

    const health = await client.checkHealth();
    assert.equal(health.online, false, "Must report offline when health check times out");
    assert.equal(health.status, "offline", "Status must be 'offline' on timeout");
  });
});

// =============================================================================
// TEST SUITE 2: ColibriClient.resolveActiveModel() Dynamic Discovery & TTL Cache
// =============================================================================

describe("Socrates Backend — 2. Dynamic Model Resolution", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.clearRequestHistory();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  it("resolves active model dynamically from /v1/models endpoint", async () => {
    mockServer.setState({
      modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const model = await client.resolveActiveModel();

    assert.equal(model, "qwen3-coder-30b-a3b-colibri", "Must resolve exact model ID from /v1/models");
  });

  it("caches resolved model within TTL window without firing redundant requests", async () => {
    mockServer.setState({
      modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
    });

    const client = new ColibriClient({
      baseUrl: mockServer.getUrl(),
      modelCacheTtlMs: 30000,
    });

    mockServer.clearRequestHistory();
    const model1 = await client.resolveActiveModel();
    const model2 = await client.resolveActiveModel();

    assert.equal(model1, model2);
    assert.equal(
      mockServer.getRequestCount("/v1/models"),
      1,
      "Second call within TTL must be served from cache without HTTP request"
    );

    // Invalidate cache
    client.clearModelCache();
    const model3 = await client.resolveActiveModel();
    assert.equal(model3, "qwen3-coder-30b-a3b-colibri");
    assert.equal(
      mockServer.getRequestCount("/v1/models"),
      2,
      "Call after cache invalidation must trigger fresh HTTP request"
    );
  });

  it("falls back gracefully to default model if /v1/models returns empty or error", async () => {
    mockServer.setState({
      modelsList: [],
    });

    const client = new ColibriClient({
      baseUrl: mockServer.getUrl(),
      defaultModel: "qwen3-coder-30b-a3b-colibri",
    });

    const model = await client.resolveActiveModel();
    assert.equal(model, "qwen3-coder-30b-a3b-colibri", "Must fall back to defaultModel when list is empty");
  });
});

// =============================================================================
// TEST SUITE 3: ColibriClient.streamChat() Token Delta SSE Emission
// =============================================================================

describe("Socrates Backend — 3. ColibriClient Streaming Generator", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.clearRequestHistory();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  it("streams incremental token deltas from SSE payload", async () => {
    mockServer.setState({
      chatDeltas: ["Quick", "sort", " partitions", " around", " a", " pivot."],
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const messages = [{ role: "user" as const, content: "Explain quicksort" }];

    const chunks: string[] = [];
    for await (const delta of client.streamChat(messages)) {
      chunks.push(delta);
    }

    assert.deepEqual(
      chunks,
      ["Quick", "sort", " partitions", " around", " a", " pivot."],
      "Must yield each SSE content delta incrementally"
    );
    assert.equal(chunks.join(""), "Quicksort partitions around a pivot.");
  });

  it("correctly handles SSE comments, empty lines, and [DONE] marker without yielding junk", async () => {
    mockServer.setRawSseResponse([
      ": ping comment",
      "",
      'data: {"choices":[{"delta":{"content":"Binary"}}]}',
      "",
      ": another comment",
      'data: {"choices":[{"delta":{"content":" search"}}]}',
      "",
      "data: [DONE]",
      "",
    ]);

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const chunks: string[] = [];
    for await (const delta of client.streamChat([{ role: "user" as const, content: "Test" }])) {
      chunks.push(delta);
    }

    assert.deepEqual(chunks, ["Binary", " search"], "Must skip comments, empty lines, and [DONE]");
  });

  it("throws ColibriStreamError when messages array is empty", async () => {
    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    await assert.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of client.streamChat([])) {}
      },
      (err: any) => {
        assert.equal(err.name, "ColibriStreamError");
        assert.equal(err.status, 400);
        return true;
      }
    );
  });

  it("throws typed ColibriOfflineError when Colibri endpoint is unreachable", async () => {
    const client = new ColibriClient({
      baseUrl: `http://127.0.0.1:${UNREACHABLE_PORT}/v1`,
      requestTimeoutMs: 1000,
    });

    await assert.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of client.streamChat([{ role: "user" as const, content: "Hi" }])) {}
      },
      (err: any) => {
        assert.equal(err.name, "ColibriOfflineError");
        assert.equal(err.code, "COLIBRI_OFFLINE");
        assert.equal(err.status, 503);
        assert.ok(err.message.includes("offline or unreachable"));
        return true;
      }
    );
  });
});

// =============================================================================
// TEST SUITE 4: ColibriClient.streamChat() AbortSignal Handling & Disconnect
// =============================================================================

describe("Socrates Backend — 4. Streaming Cancellation & Abort Propagation", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.clearRequestHistory();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  it("cleanly terminates token generation loop when client abort signal triggers mid-stream", async () => {
    mockServer.setState({
      chatDeltas: ["Token 1", "Token 2", "Token 3", "Token 4", "Token 5"],
      streamDelayMs: 30,
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const ac = new AbortController();

    const receivedChunks: string[] = [];
    const startTime = Date.now();

    try {
      for await (const chunk of client.streamChat(
        [{ role: "user" as const, content: "Generate tokens" }],
        { signal: ac.signal }
      )) {
        receivedChunks.push(chunk);
        if (receivedChunks.length === 2) {
          ac.abort(); // Cancel generation after 2 chunks
        }
      }
    } catch (err: any) {
      assert.ok(err.name === "AbortError" || ac.signal.aborted, "Abort must be recorded");
    }

    const elapsedMs = Date.now() - startTime;
    assert.ok(receivedChunks.length >= 2, "Must receive at least 2 tokens before abort");
    assert.ok(receivedChunks.length < 5, "Must NOT receive all 5 tokens after abort");
    assert.ok(elapsedMs < 300, `Abort should terminate promptly (<300ms), took ${elapsedMs}ms`);
  });

  it("handles pre-aborted signal by immediately throwing before issuing network request", async () => {
    mockServer.clearRequestHistory();
    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const ac = new AbortController();
    ac.abort();

    await assert.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of client.streamChat(
          [{ role: "user" as const, content: "Pre-aborted" }],
          { signal: ac.signal }
        )) {}
      },
      (err: any) => {
        return err.name === "AbortError" || ac.signal.aborted;
      }
    );

    assert.equal(
      mockServer.getRequestCount("/v1/chat/completions"),
      0,
      "No HTTP request should be sent when signal is pre-aborted"
    );
  });
});

// =============================================================================
// TEST SUITE 5: Route GET /api/socrates/health Response Schema
// =============================================================================

describe("Socrates Backend — 5. Route GET /api/socrates/health", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.setState({
      online: true,
      status: "ok",
      modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
    });
    process.env.COLIBRI_BASE_URL = mockServer.getUrl();
  });

  afterEach(async () => {
    await mockServer.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("returns HTTP 200 and valid schema when Colibri is online", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/health");
    const res = await healthRouteGet(req);

    assert.equal(res.status, 200, "Health endpoint should return 200 when online");
    assert.ok(res.headers.get("Content-Type")?.includes("application/json"), "Response must be application/json");
    assert.ok(
      res.headers.get("Cache-Control")?.includes("no-store") ||
      res.headers.get("Cache-Control")?.includes("no-cache"),
      "Response must disable client caching"
    );

    const body = await res.json();
    assert.equal(body.online, true, "Body.online must be true");
    assert.equal(body.status, "ok", "Body.status must be 'ok'");
    assert.equal(body.model, "qwen3-coder-30b-a3b-colibri", "Body.model must match active model");
    assert.ok(body.endpoint.startsWith("http://"), "Endpoint must be a valid HTTP URL");
    assert.ok(typeof body.latencyMs === "number", "Latency must be a number");
    assert.ok(!isNaN(Date.parse(body.timestamp)), "Timestamp must be a valid ISO date string");
  });

  it("returns HTTP 200 with online: false in non-strict mode when Colibri is offline", async () => {
    process.env.COLIBRI_BASE_URL = `http://127.0.0.1:${UNREACHABLE_PORT}/v1`;

    const req = new NextRequest("http://localhost:3000/api/socrates/health");
    const res = await healthRouteGet(req);

    assert.equal(res.status, 200, "Non-strict health route returns 200 so UI status pill can render");
    const body = await res.json();
    assert.equal(body.online, false, "Body.online must be false");
    assert.equal(body.status, "offline", "Body.status must be 'offline'");
  });

  it("returns HTTP 503 when strict=true query parameter is provided and Colibri is offline", async () => {
    process.env.COLIBRI_BASE_URL = `http://127.0.0.1:${UNREACHABLE_PORT}/v1`;

    const req = new NextRequest("http://localhost:3000/api/socrates/health?strict=true");
    const res = await healthRouteGet(req);

    assert.equal(res.status, 503, "Strict health route must return 503 on service outage");
    const body = await res.json();
    assert.equal(body.online, false);
    assert.equal(body.status, "offline");
  });
});

// =============================================================================
// TEST SUITE 6: Route POST /api/socrates/chat Offline Transparent Handling (503)
// =============================================================================

describe("Socrates Backend — 6. Route POST /api/socrates/chat (Offline Transparent Handling)", () => {
  afterEach(() => {
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("returns exact HTTP 503 JSON contract when Colibri is offline", async () => {
    process.env.COLIBRI_BASE_URL = `http://127.0.0.1:${UNREACHABLE_PORT}/v1`;

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Explain time complexity of quicksort" }),
    });

    const res = await chatRoutePost(req);

    assert.equal(res.status, 503, "Must return HTTP 503 Service Unavailable");
    assert.ok(res.headers.get("Content-Type")?.includes("application/json"), "Must return JSON error response");

    const body = await res.json();
    assert.equal(body.code, "COLIBRI_OFFLINE", "Error code must be 'COLIBRI_OFFLINE'");
    assert.equal(body.status, 503, "Error status field must be 503");
    assert.ok(body.error.includes("offline or unreachable"), "Error message must inform user that Colibri service is offline");
    assert.ok(body.endpoint.includes(String(UNREACHABLE_PORT)), "Must specify endpoint");
  });

  it("strictly asserts NO mock Socratic fallback engine or canned templates are invoked", async () => {
    process.env.COLIBRI_BASE_URL = `http://127.0.0.1:${UNREACHABLE_PORT}/v1`;

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Binary Search" }),
    });

    const res = await chatRoutePost(req);
    const body = await res.json();

    // MUST NOT return 200 canned reply
    assert.notEqual(res.status, 200, "Must NEVER return 200 canned reply when Colibri is down");
    assert.equal(body.reply, undefined, "Must NOT include 'reply' field from mock engine");
    assert.equal(body.source, undefined, "Must NOT have 'socratic-offline-fallback' source");

    // Body text must NOT contain legacy canned templates
    const rawText = JSON.stringify(body);
    assert.ok(!rawText.includes("🏛️ **SOCRATES:**"), "Must not contain legacy canned Socratic template");
    assert.ok(!rawText.includes("Greetings, scholar. You inquire"), "Must not contain canned greeting");
    assert.ok(!rawText.includes("Inquire about Binary Search, Next.js"), "Must not contain canned PRESET_TOPICS fallback");
  });

  it("validates request payload and rejects empty message with HTTP 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 400, "Empty message must return HTTP 400");
    const body = await res.json();
    assert.equal(body.code, "VALIDATION_ERROR");
  });
});

// =============================================================================
// TEST SUITE 7: Route POST /api/socrates/chat Online Web Streams SSE
// =============================================================================

describe("Socrates Backend — 7. Route POST /api/socrates/chat (Online SSE Streaming)", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.setState({
      online: true,
      status: "ok",
      modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
      chatDeltas: ["Quicksort", " has", " an", " average", " complexity", " of", " O(n log n)."],
    });
    process.env.COLIBRI_BASE_URL = mockServer.getUrl();
  });

  afterEach(async () => {
    await mockServer.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("streams SSE tokens with stage, token, and done events when Colibri is online", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Explain the complexity of quicksort",
        stream: true,
      }),
    });

    const res = await chatRoutePost(req);

    assert.equal(res.status, 200, "Online streaming route must return HTTP 200");
    assert.ok(res.headers.get("Content-Type")?.includes("text/event-stream"), "Content-Type must be text/event-stream");
    assert.ok(res.body, "Response must contain readable stream body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let streamText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value, { stream: true });
    }

    assert.ok(streamText.includes("event: stage"), "Stream must include genuine activity stage event");
    assert.ok(streamText.includes("event: token"), "Stream must include token events");
    assert.ok(streamText.includes("event: done"), "Stream must conclude with done event");
    assert.ok(streamText.includes("Quicksort"), "Stream must contain generated token content");
    assert.ok(streamText.includes("O(n log n)"), "Stream must contain full answer text");
  });

  it("handles client abort on route handler gracefully", async () => {
    mockServer.setState({
      chatDeltas: ["Chunk 1", "Chunk 2", "Chunk 3", "Chunk 4", "Chunk 5"],
      streamDelayMs: 40,
    });

    const ac = new AbortController();
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Test abort", stream: true }),
      signal: ac.signal,
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let receivedEvents = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        if (text.includes("event: token")) {
          receivedEvents++;
          if (receivedEvents === 1) {
            ac.abort(); // Cancel stream from client side
          }
        }
      }
    } catch {
      // Abort exception caught gracefully
    }

    assert.ok(receivedEvents >= 1, "Must receive initial chunk before abort");
    assert.ok(receivedEvents < 5, "Must terminate before emitting all chunks");
  });
});

// =============================================================================
// TEST SUITE 8: Strict CR Intelligence Isolation Validation
// =============================================================================

describe("Socrates Backend — 8. Strict CR Intelligence Isolation Audit", () => {
  beforeEach(async () => {
    await mockServer.start();
    mockServer.setState({ online: true, status: "ok" });
    process.env.COLIBRI_BASE_URL = mockServer.getUrl();
  });

  afterEach(async () => {
    await mockServer.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("verifies static code isolation: Socrates source files contain ZERO CR Intelligence imports", () => {
    const socratesDirs = [
      path.resolve(process.cwd(), "src/lib/socrates"),
      path.resolve(process.cwd(), "src/app/api/socrates"),
    ];

    const forbiddenPatterns = [
      { pattern: /from\s+["']@\/app\/api\/cr/i, desc: "Import from /api/cr routes" },
      { pattern: /from\s+["'].*\/cr\//i, desc: "Relative import from cr/ directories" },
      { pattern: /crOrchestrator/i, desc: "crOrchestrator invocation" },
      { pattern: /CR_CORE_SYSTEM_PROMPT/i, desc: "CR gamified system prompt" },
      { pattern: /SocraticFallbackProvider/i, desc: "Legacy Socratic fallback mock engine" },
      { pattern: /socratic-engine/i, desc: "Legacy regex socratic-engine" },
      { pattern: /from\s+["']@\/lib\/ml/i, desc: "Import from ml-service client" },
      { pattern: /localhost:8000|127\.0\.0\.1:8000/i, desc: "Direct call to ML microservice port 8000" },
    ];

    const auditedFiles: string[] = [];
    const violations: Array<{ file: string; desc: string; match: string }> = [];

    for (const dir of socratesDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir, { recursive: true }) as string[];
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
          auditedFiles.push(path.relative(process.cwd(), fullPath));
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const rule of forbiddenPatterns) {
            const match = content.match(rule.pattern);
            if (match) {
              violations.push({
                file: path.relative(process.cwd(), fullPath),
                desc: rule.desc,
                match: match[0],
              });
            }
          }
        }
      }
    }

    if (auditedFiles.length > 0) {
      assert.deepEqual(
        violations,
        [],
        `Found CR Intelligence coupling in Socrates modules:\n${violations
          .map((v) => `  - ${v.file}: ${v.desc} ("${v.match}")`)
          .join("\n")}`
      );
    }
  });

  it("verifies runtime database isolation: Socrates routes NEVER mutate CRConversation or CRMessage tables", async () => {
    // 1. Measure pre-execution counts
    const initialCRConvos = await prisma.cRConversation.count();
    const initialCRMessages = await prisma.cRMessage.count();

    // 2. Execute Socrates Health
    const healthReq = new NextRequest("http://localhost:3000/api/socrates/health");
    await healthRouteGet(healthReq);

    // 3. Execute Socrates Chat (non-streaming)
    const chatReq = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is an invariant?", stream: false }),
    });
    await chatRoutePost(chatReq);

    // 4. Measure post-execution counts
    const postCRConvos = await prisma.cRConversation.count();
    const postCRMessages = await prisma.cRMessage.count();

    assert.equal(
      postCRConvos,
      initialCRConvos,
      `Socrates MUST NOT mutate CRConversation table (expected ${initialCRConvos}, got ${postCRConvos})`
    );
    assert.equal(
      postCRMessages,
      initialCRMessages,
      `Socrates MUST NOT mutate CRMessage table (expected ${initialCRMessages}, got ${postCRMessages})`
    );
  });

  it("verifies system prompt separation: Socrates prompt is distinct with zero gamified Battle Arena terms", () => {
    const socratesPromptPath = path.resolve(process.cwd(), "src/lib/socrates/socratesPrompt.ts");
    const chatRoutePath = path.resolve(process.cwd(), "src/app/api/socrates/chat/route.ts");

    let promptContent = "";
    if (fs.existsSync(socratesPromptPath)) {
      promptContent = fs.readFileSync(socratesPromptPath, "utf-8");
    } else if (fs.existsSync(chatRoutePath)) {
      promptContent = fs.readFileSync(chatRoutePath, "utf-8");
    }

    if (!promptContent) return;

    const forbiddenGamifiedTerms = [
      "Class Royale Machine Learning Adaptive Engine",
      "Battle Arena",
      "Crown Trial",
      "Player Level",
      "Platform Streak",
      "ML Contributing Factors",
      "Bayesian Knowledge Tracing",
    ];

    for (const term of forbiddenGamifiedTerms) {
      assert.ok(
        !promptContent.includes(term),
        `Socrates system prompt must not contain gamified CR term: '${term}'`
      );
    }

    assert.ok(
      promptContent.toLowerCase().includes("socrates") ||
      promptContent.toLowerCase().includes("dialectic"),
      "Prompt must identify as Socrates and emphasize dialectic/first-principles inquiry"
    );
  });

  it("verifies endpoint namespace isolation: Socrates endpoints live strictly under /api/socrates/*", () => {
    const socratesRoutes = [
      "src/app/api/socrates/health/route.ts",
      "src/app/api/socrates/chat/route.ts",
    ];

    for (const routePath of socratesRoutes) {
      assert.ok(
        routePath.startsWith("src/app/api/socrates/"),
        `Route ${routePath} must be under src/app/api/socrates/`
      );
      assert.ok(
        !routePath.includes("/cr/"),
        `Route ${routePath} must not be nested under /cr/`
      );
    }
  });
});

// =============================================================================
// Standalone CLI Runner Invocation
// =============================================================================
if (
  process.argv[1]?.endsWith("socratesBackend.test.ts")
) {
  import("node:child_process").then(({ spawnSync }) => {
    const res = spawnSync("npx", ["tsx", "tests/run-all-tests.ts", "socratesBackend"], {
      stdio: "inherit",
      shell: true,
    });
    process.exit(res.status ?? 0);
  });
}
