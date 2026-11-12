/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Tier 1 Feature Test Suite — Challenger 2 Stress Tests
 * Target: tests/tier1-feature/challengerSocratesM1.test.ts
 *
 * Adversarial stress testing for:
 * 1. Rapid aborts: pre-fetch, during initial headers, mid-stream, partial chunks.
 * 2. High concurrency: 20 simultaneous streams with interleaved abort signals.
 * 3. Zero socket leaks, zero unhandled errors, clean stream termination.
 * 4. Colibri hardware cancellation semantics (TCP socket close).
 * =============================================================================
 */

import assert from "node:assert/strict";
import * as http from "node:http";
import * as net from "node:net";
import { AddressInfo } from "node:net";
import { NextRequest } from "next/server";
import { describe, it, beforeEach, afterEach } from "../run-all-tests";

import {
  ColibriClient,
  ColibriOfflineError,
  ColibriTimeoutError,
  ColibriStreamError,
} from "../../src/lib/socrates/colibriClient";
import { POST as chatRoutePost } from "../../src/app/api/socrates/chat/route";
import { GET as healthRouteGet } from "../../src/app/api/socrates/health/route";

// =============================================================================
// Robust Mock Colibri Server with Telemetry Tracking
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
  headerDelayMs?: number;
  chatErrorCode?: number;
  chatErrorBody?: string;
  stallAfterIndex?: number;
  destroySocketAfterIndex?: number;
}

class TelemetryMockColibriServer {
  private server: http.Server | null = null;
  public port = 0;
  public activeSockets = new Set<net.Socket>();
  public clientDisconnectCount = 0;
  public inFlightChatRequests = 0;
  public totalRequests = 0;
  public recordedRequests: Array<{ url: string; method: string; body?: any }> = [];

  private state: MockServerState = {
    online: true,
    status: "ok",
    healthCode: 200,
    modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
    chatDeltas: ["Chunk1", "Chunk2", "Chunk3", "Chunk4", "Chunk5"],
  };

  public setState(partial: Partial<MockServerState>): void {
    this.state = { ...this.state, ...partial };
  }

  public reset(): void {
    this.clientDisconnectCount = 0;
    this.inFlightChatRequests = 0;
    this.totalRequests = 0;
    this.recordedRequests = [];
    this.state = {
      online: true,
      status: "ok",
      healthCode: 200,
      modelsList: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
      chatDeltas: ["Chunk1", "Chunk2", "Chunk3", "Chunk4", "Chunk5"],
    };
  }

  public async start(): Promise<string> {
    this.reset();
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        this.totalRequests++;
        const url = req.url || "";
        const isChat = url.startsWith("/v1/chat/completions") || url === "/chat/completions";

        if (isChat) {
          this.inFlightChatRequests++;
        }

        let completed = false;
        const markComplete = () => {
          if (isChat && !completed) {
            completed = true;
            this.inFlightChatRequests = Math.max(0, this.inFlightChatRequests - 1);
          }
        };

        res.on("finish", markComplete);
        res.on("close", markComplete);

        req.on("close", () => {
          if (!res.writableEnded) {
            this.clientDisconnectCount++;
          }
        });

        let bodyText = "";
        req.on("data", (chunk) => {
          bodyText += chunk.toString();
        });

        await new Promise((r) => req.on("end", r));

        let parsedBody: any;
        try {
          parsedBody = bodyText ? JSON.parse(bodyText) : undefined;
        } catch {
          parsedBody = bodyText;
        }

        this.recordedRequests.push({
          url,
          method: req.method || "",
          body: parsedBody,
        });

        // Route: /health
        if (url.startsWith("/health")) {
          if (this.state.healthDelayMs) {
            await new Promise((r) => setTimeout(r, this.state.healthDelayMs));
          }
          res.writeHead(this.state.healthCode, {
            "Content-Type": "application/json",
            Connection: "close",
          });
          res.end(JSON.stringify({ status: this.state.status }));
          return;
        }

        // Route: /v1/models
        if (url.startsWith("/v1/models") || url === "/models") {
          res.writeHead(200, {
            "Content-Type": "application/json",
            Connection: "close",
          });
          res.end(JSON.stringify({ object: "list", data: this.state.modelsList }));
          return;
        }

        // Route: /v1/chat/completions
        if (isChat) {
          if (this.state.headerDelayMs) {
            await new Promise((r) => setTimeout(r, this.state.headerDelayMs));
            if (res.writableEnded || res.closed) return;
          }

          if (this.state.chatErrorCode) {
            res.writeHead(this.state.chatErrorCode, {
              "Content-Type": "text/plain",
              Connection: "close",
            });
            res.end(this.state.chatErrorBody || "Inference error");
            return;
          }

          const isStreaming = parsedBody?.stream === true;

          if (isStreaming) {
            res.writeHead(200, {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            });

            if (this.state.rawSseLines) {
              for (const line of this.state.rawSseLines) {
                if (res.writableEnded || res.closed) break;
                res.write(`${line}\n`);
              }
              res.end();
              return;
            }

            for (let i = 0; i < this.state.chatDeltas.length; i++) {
              if (res.writableEnded || res.closed) break;

              if (this.state.streamDelayMs) {
                await new Promise((r) => setTimeout(r, this.state.streamDelayMs));
                if (res.writableEnded || res.closed) break;
              }

              if (this.state.destroySocketAfterIndex === i) {
                req.socket?.destroy();
                return;
              }

              if (this.state.stallAfterIndex === i) {
                return; // Stalls without ending
              }

              const delta = this.state.chatDeltas[i];
              const chunkPayload = JSON.stringify({
                id: `chatcmpl-${i}`,
                object: "chat.completion.chunk",
                choices: [{ delta: { content: delta } }],
              });
              res.write(`data: ${chunkPayload}\n\n`);
            }

            if (!res.writableEnded && !res.closed) {
              res.write("data: [DONE]\n\n");
              res.end();
            }
            return;
          }

          // Non-streaming response
          res.writeHead(200, {
            "Content-Type": "application/json",
            Connection: "close",
          });
          res.end(
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
            })
          );
          return;
        }

        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      });

      this.server.on("connection", (socket) => {
        this.activeSockets.add(socket);
        socket.on("close", () => {
          this.activeSockets.delete(socket);
        });
      });

      this.server.listen(0, "127.0.0.1", () => {
        this.port = (this.server!.address() as AddressInfo).port;
        resolve(this.getUrl());
      });

      this.server.on("error", reject);
    });
  }

  public getUrl(): string {
    return `http://127.0.0.1:${this.port}/v1`;
  }

  public async stop(): Promise<void> {
    if (!this.server) return;
    for (const socket of this.activeSockets) {
      socket.destroy();
    }
    this.activeSockets.clear();
    return new Promise((resolve) => {
      this.server!.close(() => {
        this.server = null;
        resolve();
      });
    });
  }
}

const mockServer = new TelemetryMockColibriServer();
const ORIGINAL_COLIBRI_URL = process.env.COLIBRI_BASE_URL;

// =============================================================================
// TEST SUITE 1: Rapid Aborts & Early Termination
// =============================================================================

describe("Challenger 2 — 1. Rapid Aborts & Early Termination", () => {
  beforeEach(async () => {
    await mockServer.start();
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

  it("rapid abort: pre-aborted signal to colibriClient.streamChat() throws immediately with 0 requests", async () => {
    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const ac = new AbortController();
    ac.abort(new DOMException("Pre-aborted by test", "AbortError"));

    await assert.rejects(
      async () => {
        for await (const _ of client.streamChat(
          [{ role: "user", content: "Pre-abort test" }],
          { signal: ac.signal }
        )) {}
      },
      (err: any) => {
        assert.ok(err.name === "AbortError" || ac.signal.aborted);
        return true;
      }
    );

    assert.equal(mockServer.totalRequests, 0, "Pre-aborted call must make zero network requests");
    assert.equal(mockServer.inFlightChatRequests, 0, "Pre-aborted call must leave zero in-flight requests");
  });

  it("rapid abort: pre-aborted signal to POST /api/socrates/chat terminates cleanly without unhandled rejection", async () => {
    const ac = new AbortController();
    ac.abort(new DOMException("Client cancelled request", "AbortError"));

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Test pre-abort on route", stream: true }),
      signal: ac.signal,
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200, "Route should return 200 response holding ReadableStream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let streamText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamText += decoder.decode(value);
      }
    } catch {
      // Abort exception during reading is acceptable
    }

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(mockServer.inFlightChatRequests, 0, "Zero in-flight requests after pre-aborted route call");
  });

  it("rapid abort: abort during initial HTTP headers cancels fetch and closes server socket", async () => {
    mockServer.setState({
      headerDelayMs: 80,
      streamDelayMs: 10,
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const ac = new AbortController();

    setTimeout(() => ac.abort(), 20);

    const startTime = Date.now();
    await assert.rejects(
      async () => {
        for await (const _ of client.streamChat(
          [{ role: "user", content: "Header delay test" }],
          { signal: ac.signal }
        )) {}
      },
      (err: any) => {
        assert.ok(err.name === "AbortError" || ac.signal.aborted);
        return true;
      }
    );

    const elapsedMs = Date.now() - startTime;
    assert.ok(elapsedMs < 75, `Abort during headers must exit promptly (<75ms), took ${elapsedMs}ms`);

    await new Promise((r) => setTimeout(r, 80));
    assert.ok(mockServer.clientDisconnectCount >= 1, "Server must record client disconnect during headers");
    assert.equal(mockServer.inFlightChatRequests, 0, "No in-flight requests after header abort");
  });

  it("rapid abort: mid-stream abort after partial tokens terminates loop immediately", async () => {
    mockServer.setState({
      chatDeltas: ["Part1", "Part2", "Part3", "Part4", "Part5", "Part6", "Part7"],
      streamDelayMs: 30,
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl(), requestTimeoutMs: 5000 });
    const ac = new AbortController();
    const chunks: string[] = [];
    const startTime = Date.now();

    try {
      for await (const chunk of client.streamChat(
        [{ role: "user", content: "Mid-stream abort test" }],
        { signal: ac.signal }
      )) {
        chunks.push(chunk);
        if (chunks.length === 2) {
          ac.abort();
        }
      }
    } catch (err: any) {
      assert.ok(err.name === "AbortError" || ac.signal.aborted);
    }

    const elapsedMs = Date.now() - startTime;
    assert.ok(chunks.length >= 2, "Must receive at least 2 chunks");
    assert.ok(chunks.length < 7, "Must not receive all 7 chunks");
    assert.ok(elapsedMs < 180, `Stream must abort quickly (<180ms), took ${elapsedMs}ms`);

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(mockServer.inFlightChatRequests, 0, "In-flight chat request must drop to 0 after abort");
  });

  it("rapid abort: non-streaming colibriClient.chat() aborts mid-flight cleanly", async () => {
    mockServer.setState({
      headerDelayMs: 70,
      chatDeltas: ["Completed sync response"],
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });
    const ac = new AbortController();

    setTimeout(() => ac.abort(), 20);

    await assert.rejects(
      async () => {
        await client.chat([{ role: "user", content: "Sync abort test" }], {
          signal: ac.signal,
        });
      },
      (err: any) => {
        assert.ok(err.name === "AbortError" || ac.signal.aborted);
        return true;
      }
    );

    await new Promise((r) => setTimeout(r, 60));
    assert.ok(mockServer.clientDisconnectCount >= 1, "Server must record client disconnect for sync abort");
    assert.equal(mockServer.inFlightChatRequests, 0, "No hanging in-flight requests after sync abort");
  });
});

// =============================================================================
// TEST SUITE 2: Colibri Hardware Cancellation & Resource Cleanup
// =============================================================================

describe("Challenger 2 — 2. Colibri Hardware Cancellation Semantics & Socket Cleanup", () => {
  beforeEach(async () => {
    await mockServer.start();
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

  it("hardware cancellation: mid-stream abort physically triggers TCP disconnect on Colibri server", async () => {
    mockServer.setState({
      chatDeltas: ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8"],
      streamDelayMs: 25,
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl(), requestTimeoutMs: 5000 });
    const ac = new AbortController();
    const chunks: string[] = [];

    try {
      for await (const chunk of client.streamChat(
        [{ role: "user", content: "Hardware cancel test" }],
        { signal: ac.signal }
      )) {
        chunks.push(chunk);
        if (chunks.length === 2) {
          ac.abort();
        }
      }
    } catch (err: any) {
      assert.ok(err.name === "AbortError" || ac.signal.aborted);
    }

    assert.equal(chunks.length, 2, "Stream must stop at 2 tokens");

    await new Promise((r) => setTimeout(r, 50));
    assert.ok(
      mockServer.clientDisconnectCount >= 1,
      `Colibri server must detect client socket close! clientDisconnectCount: ${mockServer.clientDisconnectCount}`
    );
    assert.equal(mockServer.inFlightChatRequests, 0, "Zero in-flight requests remaining on server");
  });

  it("hardware cancellation: Colibri server stall triggers request timeout and closes connection", async () => {
    mockServer.setState({
      chatDeltas: ["Starting", "Token"],
      streamDelayMs: 15,
      stallAfterIndex: 0,
    });

    const client = new ColibriClient({
      baseUrl: mockServer.getUrl(),
      requestTimeoutMs: 120,
    });

    const startTime = Date.now();
    await assert.rejects(
      async () => {
        for await (const _ of client.streamChat([{ role: "user", content: "Stall test" }])) {}
      },
      (err: any) => {
        assert.equal(err.name, "ColibriTimeoutError");
        assert.equal(err.code, "COLIBRI_TIMEOUT");
        assert.equal(err.status, 504);
        return true;
      }
    );

    const elapsedMs = Date.now() - startTime;
    assert.ok(elapsedMs >= 100 && elapsedMs < 350, `Must time out close to 120ms, took ${elapsedMs}ms`);

    await new Promise((r) => setTimeout(r, 50));
    assert.equal(mockServer.inFlightChatRequests, 0, "No in-flight requests after timeout abort");
  });

  it("abrupt TCP reset: Colibri socket destroyed mid-stream is safely handled without process crash", async () => {
    mockServer.setState({
      chatDeltas: ["Alpha", "Beta", "Gamma"],
      streamDelayMs: 20,
      destroySocketAfterIndex: 1,
    });

    const client = new ColibriClient({ baseUrl: mockServer.getUrl() });

    await assert.rejects(
      async () => {
        for await (const _ of client.streamChat([{ role: "user", content: "TCP reset test" }])) {}
      },
      (err: any) => {
        assert.ok(err instanceof Error, "Must throw clean Error on socket destroy");
        return true;
      }
    );

    await new Promise((r) => setTimeout(r, 40));
    assert.equal(mockServer.inFlightChatRequests, 0, "In-flight must be 0 after reset");
  });

  it("route handler abort: POST /api/socrates/chat mid-stream abort propagates TCP socket close", async () => {
    mockServer.setState({
      chatDeltas: ["ChunkA", "ChunkB", "ChunkC", "ChunkD", "ChunkE"],
      streamDelayMs: 35,
    });

    const ac = new AbortController();
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Test route mid-stream abort", stream: true }),
      signal: ac.signal,
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let tokenEvents = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        if (text.includes("event: token")) {
          tokenEvents++;
          if (tokenEvents === 1) {
            ac.abort();
          }
        }
      }
    } catch {
      // Abort exception caught
    }

    assert.ok(tokenEvents >= 1, "Must have received at least 1 token before abort");
    assert.ok(tokenEvents < 5, "Must not receive all tokens after abort");

    await new Promise((r) => setTimeout(r, 60));
    assert.ok(
      mockServer.clientDisconnectCount >= 1,
      "Route abort must trigger client disconnect on Colibri socket"
    );
    assert.equal(mockServer.inFlightChatRequests, 0, "Zero in-flight chat requests after route abort");
  });
});

// =============================================================================
// TEST SUITE 3: High Concurrency Stress Test (20 Simultaneous Streams)
// =============================================================================

describe("Challenger 2 — 3. High Concurrency (20 Simultaneous Streams)", () => {
  beforeEach(async () => {
    await mockServer.start();
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

  it("concurrency: 20 simultaneous streams without abort complete with full fidelity and zero leaks", async () => {
    const NUM_STREAMS = 20;
    mockServer.setState({
      chatDeltas: ["C1", "C2", "C3", "C4"],
      streamDelayMs: 10,
    });

    const unhandledErrors: any[] = [];
    const onUnhandled = (err: any) => unhandledErrors.push(err);
    process.on("unhandledRejection", onUnhandled);

    try {
      const client = new ColibriClient({ baseUrl: mockServer.getUrl() });

      const streamPromises = Array.from({ length: NUM_STREAMS }, async (_, i) => {
        const chunks: string[] = [];
        for await (const chunk of client.streamChat([
          { role: "user", content: `Concurrent query ${i}` },
        ])) {
          chunks.push(chunk);
        }
        return chunks;
      });

      const results = await Promise.all(streamPromises);

      assert.equal(results.length, NUM_STREAMS, `All ${NUM_STREAMS} streams must resolve`);
      for (let i = 0; i < NUM_STREAMS; i++) {
        assert.deepEqual(results[i], ["C1", "C2", "C3", "C4"], `Stream ${i} must receive all tokens`);
      }

      assert.equal(unhandledErrors.length, 0, "Zero unhandled rejections during 20 concurrent streams");

      await new Promise((r) => setTimeout(r, 60));
      assert.equal(mockServer.inFlightChatRequests, 0, "Zero in-flight requests after 20 concurrent streams");
    } finally {
      process.removeListener("unhandledRejection", onUnhandled);
    }
  });

  it("concurrency: 20 simultaneous streams with interleaved rapid and mid-stream aborts", async () => {
    const NUM_STREAMS = 20;
    mockServer.setState({
      chatDeltas: ["T1", "T2", "T3", "T4", "T5", "T6"],
      streamDelayMs: 20,
    });

    const unhandledErrors: any[] = [];
    const onUnhandled = (err: any) => unhandledErrors.push(err);
    process.on("unhandledRejection", onUnhandled);

    try {
      const client = new ColibriClient({ baseUrl: mockServer.getUrl(), requestTimeoutMs: 5000 });

      // Partition 20 requests:
      // Index 0-4: Run to full completion (no abort)
      // Index 5-9: Pre-aborted (immediate)
      // Index 10-14: Mid-stream abort (after 2 tokens)
      // Index 15-19: Late abort (after 4 tokens)

      const streamPromises = Array.from({ length: NUM_STREAMS }, async (_, i) => {
        const ac = new AbortController();
        const chunks: string[] = [];

        if (i >= 5 && i <= 9) {
          ac.abort();
        }

        try {
          for await (const chunk of client.streamChat(
            [{ role: "user", content: `Interleaved query ${i}` }],
            { signal: ac.signal }
          )) {
            chunks.push(chunk);

            if (i >= 10 && i <= 14 && chunks.length === 2) {
              ac.abort();
            } else if (i >= 15 && i <= 19 && chunks.length === 4) {
              ac.abort();
            }
          }
          return { index: i, chunks, status: "completed" as const };
        } catch (err: any) {
          return { index: i, chunks, status: "aborted" as const, errName: err.name };
        }
      });

      const results = await Promise.all(streamPromises);

      assert.equal(results.length, NUM_STREAMS);

      // Verify Group 0-4: Completed
      for (let i = 0; i <= 4; i++) {
        const res = results[i];
        assert.equal(res.status, "completed", `Stream ${i} should have completed`);
        assert.equal(res.chunks.length, 6, `Stream ${i} should have all 6 tokens`);
      }

      // Verify Group 5-9: Pre-aborted
      for (let i = 5; i <= 9; i++) {
        const res = results[i];
        assert.equal(res.status, "aborted", `Stream ${i} should be aborted`);
        assert.equal(res.chunks.length, 0, `Pre-aborted stream ${i} should have 0 tokens`);
      }

      // Verify Group 10-14: Aborted at 2 tokens
      for (let i = 10; i <= 14; i++) {
        const res = results[i];
        assert.equal(res.status, "aborted", `Stream ${i} should be aborted`);
        assert.equal(res.chunks.length, 2, `Stream ${i} should abort at exactly 2 tokens`);
      }

      // Verify Group 15-19: Aborted at 4 tokens
      for (let i = 15; i <= 19; i++) {
        const res = results[i];
        assert.equal(res.status, "aborted", `Stream ${i} should be aborted`);
        assert.equal(res.chunks.length, 4, `Stream ${i} should abort at exactly 4 tokens`);
      }

      assert.equal(unhandledErrors.length, 0, "Zero unhandled rejections during interleaved abort stress");

      await new Promise((r) => setTimeout(r, 80));

      assert.ok(
        mockServer.clientDisconnectCount >= 10,
        `Expected at least 10 client disconnects on server, observed: ${mockServer.clientDisconnectCount}`
      );

      assert.equal(
        mockServer.inFlightChatRequests,
        0,
        `Zero in-flight requests after 20 concurrent streams! Remaining: ${mockServer.inFlightChatRequests}`
      );
    } finally {
      process.removeListener("unhandledRejection", onUnhandled);
    }
  });

  it("concurrency: 20 simultaneous POST /api/socrates/chat route requests with interleaved aborts", async () => {
    const NUM_STREAMS = 20;
    mockServer.setState({
      chatDeltas: ["A", "B", "C", "D", "E"],
      streamDelayMs: 20,
    });

    const unhandledErrors: any[] = [];
    const onUnhandled = (err: any) => unhandledErrors.push(err);
    process.on("unhandledRejection", onUnhandled);

    try {
      const requests = Array.from({ length: NUM_STREAMS }, async (_, i) => {
        const ac = new AbortController();

        if (i >= 10 && i <= 14) {
          ac.abort();
        }

        const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Concurrent route test ${i}`, stream: true }),
          signal: ac.signal,
        });

        const res = await chatRoutePost(req);
        assert.equal(res.status, 200);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let tokenCount = 0;
        let gotDone = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value);
            if (text.includes("event: token")) {
              tokenCount++;
              if (i >= 15 && i <= 19 && tokenCount === 2) {
                ac.abort();
              }
            }
            if (text.includes("event: done")) {
              gotDone = true;
            }
          }
          return { index: i, tokenCount, gotDone, status: "completed" as const };
        } catch (err: any) {
          return { index: i, tokenCount, gotDone, status: "aborted" as const };
        }
      });

      const results = await Promise.all(requests);
      assert.equal(results.length, NUM_STREAMS);

      // Verify completed requests (0-9)
      for (let i = 0; i <= 9; i++) {
        assert.equal(results[i].gotDone, true, `Stream ${i} must receive event: done`);
        assert.equal(results[i].tokenCount, 5, `Stream ${i} must receive all 5 tokens`);
      }

      // Verify mid-stream aborts (15-19)
      for (let i = 15; i <= 19; i++) {
        assert.ok(results[i].tokenCount >= 2, `Stream ${i} must receive tokens before abort`);
        assert.ok(results[i].tokenCount < 5, `Stream ${i} must not receive all tokens`);
        assert.equal(results[i].gotDone, false, `Stream ${i} must NOT receive event: done`);
      }

      assert.equal(unhandledErrors.length, 0, "Zero unhandled rejections across 20 route streams");

      await new Promise((r) => setTimeout(r, 80));
      assert.equal(
        mockServer.inFlightChatRequests,
        0,
        `Zero in-flight requests after 20 concurrent route streams! Remaining: ${mockServer.inFlightChatRequests}`
      );
    } finally {
      process.removeListener("unhandledRejection", onUnhandled);
    }
  });
});

// =============================================================================
// Standalone CLI Runner Invocation
// =============================================================================
if (process.argv[1]?.endsWith("challengerSocratesM1.test.ts")) {
  import("node:child_process").then(({ spawnSync }) => {
    const res = spawnSync("npx", ["tsx", "tests/run-all-tests.ts", "challengerSocratesM1.test.ts"], {
      stdio: "inherit",
      shell: true,
    });
    process.exit(res.status ?? 0);
  });
}
