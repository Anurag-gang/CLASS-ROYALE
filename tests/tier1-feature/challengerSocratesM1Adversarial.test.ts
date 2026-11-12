/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Challenger 1 Adversarial Stress Test Suite
 * Target: tests/tier1-feature/challengerSocratesM1Adversarial.test.ts
 *
 * Role: Challenger 1 (Milestone 1 — Colibri Client & Next.js Routes)
 *
 * Adversarial Challenge Matrix:
 * 1. Pathological SSE Streams: Broken JSON deltas, whitespace floods, interleaved
 *    comments, type confusion, single-byte TCP fragmentation, and abrupt socket RST.
 * 2. Truthful Offline 503 Invariants: ECONNREFUSED, non-existent DNS domains,
 *    TCP silent blackhole timeouts, strict vs non-strict headers & contracts,
 *    and non-streaming fallback isolation.
 * 3. Dynamic Model Discovery Fallbacks: /v1/models HTTP 500, 404, HTML error pages,
 *    empty arrays, empty/whitespace model IDs, socket hangs, and TTL cache invalidation.
 * 4. Zero Unhandled Promise Rejections: Process-level rejection monitor under
 *    high-concurrency abort storms and mid-flight server socket destructions.
 * 5. Input Boundaries & Payload Attacks: Whitespace, type-confusion, giant prompts,
 *    LaTeX/Unicode symbol preservation.
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
import { GET as healthRouteGet } from "../../src/app/api/socrates/health/route";
import { POST as chatRoutePost } from "../../src/app/api/socrates/chat/route";
import { prisma } from "../../src/lib/db";

// =============================================================================
// Chaos Server (Configurable for Pathological Responses)
// =============================================================================

class ChaosServer {
  private server: http.Server | null = null;
  private port = 0;
  public handler: (req: http.IncomingMessage, res: http.ServerResponse) => void = () => {};

  public async start(): Promise<string> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        this.handler(req, res);
      });
      this.server.listen(0, "127.0.0.1", () => {
        this.port = (this.server!.address() as AddressInfo).port;
        resolve(this.getUrl());
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  public getUrl(): string {
    return `http://127.0.0.1:${this.port}/v1`;
  }

  public getRootUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  public getPort(): number {
    return this.port;
  }
}

// TCP Blackhole Server (accepts connections, never sends data)
class BlackholeServer {
  private server: net.Server | null = null;
  private port = 0;
  private sockets: Set<net.Socket> = new Set();

  public async start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = net.createServer((socket) => {
        this.sockets.add(socket);
        socket.on("close", () => this.sockets.delete(socket));
      });
      this.server.listen(0, "127.0.0.1", () => {
        this.port = (this.server!.address() as AddressInfo).port;
        resolve(this.port);
      });
    });
  }

  public async stop(): Promise<void> {
    for (const socket of this.sockets) {
      socket.destroy();
    }
    this.sockets.clear();
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  public getPort(): number {
    return this.port;
  }
}

const chaosServer = new ChaosServer();
const blackholeServer = new BlackholeServer();
const ORIGINAL_COLIBRI_URL = process.env.COLIBRI_BASE_URL;
const DEAD_PORT = 59997;

// =============================================================================
// Global Unhandled Rejection Watchdog
// =============================================================================
let unhandledRejections: any[] = [];
const onUnhandledRejection = (reason: any) => {
  unhandledRejections.push(reason);
};
process.on("unhandledRejection", onUnhandledRejection);

// =============================================================================
// CHALLENGE SUITE 1: Pathological SSE Stream Chaos & Malformations
// =============================================================================

describe("Challenger 1 — 1. Pathological SSE Stream Chaos", () => {
  beforeEach(async () => {
    await chaosServer.start();
  });

  afterEach(async () => {
    await chaosServer.stop();
  });

  it("recovers gracefully from broken and malformed JSON chunks in SSE stream", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
        });

        // 1. Valid first chunk
        res.write('data: {"choices":[{"delta":{"content":"Dialectic"}}]}\n\n');
        // 2. Broken JSON chunk
        res.write('data: {"choices":[{"delta":{"content":"broken\n\n');
        // 3. Completely invalid JSON
        res.write("data: {not even json}\n\n");
        // 4. Valid second chunk
        res.write('data: {"choices":[{"delta":{"content":" reasoning"}}]}\n\n');
        // 5. Completion marker
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const chunks: string[] = [];

    for await (const delta of client.streamChat([
      { role: "user", content: "Test broken JSON" },
    ])) {
      chunks.push(delta);
    }

    assert.equal(
      chunks.join(""),
      "Dialectic reasoning",
      "Must yield valid tokens and safely discard malformed JSON chunks without crashing"
    );
  });

  it("filters comment storms, whitespace floods, and non-standard SSE headers cleanly", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, {
          "Content-Type": "text/event-stream; charset=utf-8",
        });

        // Flood of empty lines and comments
        res.write("\n\n\n\n");
        res.write(": keepalive ping\n");
        res.write(":\n");
        res.write(":: double colon comment\n");
        res.write("    \n\t\t\n");
        res.write("event: ping\ndata: {}\n\n");
        res.write("id: 42\nretry: 1000\n\n");
        // Valid token
        res.write('data: {"choices":[{"delta":{"content":"First-principles"}}]}\n\n');
        // More noise
        res.write(": ping again\n\n");
        res.write('data: {"choices":[{"delta":{"content":" inquiry"}}]}\n\n');
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const chunks: string[] = [];

    for await (const delta of client.streamChat([
      { role: "user", content: "Test noise filtering" },
    ])) {
      chunks.push(delta);
    }

    assert.equal(
      chunks.join(""),
      "First-principles inquiry",
      "Must filter all comments and empty lines, preserving only valid content deltas"
    );
  });

  it("handles type-confused SSE data payloads (null, primitives, empty arrays/objects)", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });

        // Weird types inside data:
        res.write("data: null\n\n");
        res.write("data: 12345\n\n");
        res.write('data: "plain string"\n\n');
        res.write("data: true\n\n");
        res.write("data: []\n\n");
        res.write("data: {}\n\n");
        res.write('data: {"choices": null}\n\n');
        res.write('data: {"choices": []}\n\n');
        res.write('data: {"choices": [{}]}\n\n');
        res.write('data: {"choices": [{"delta": null}]}\n\n');
        res.write('data: {"choices": [{"delta": {}}]}\n\n');
        res.write('data: {"choices": [{"delta": {"content": null}}]}\n\n');
        res.write('data: {"choices": [{"delta": {"content": ""}}]}\n\n');
        res.write('data: {"choices":[{"delta":{"content":"Robust"}}]}\n\n');
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const chunks: string[] = [];

    for await (const delta of client.streamChat([
      { role: "user", content: "Test type confusion" },
    ])) {
      chunks.push(delta);
    }

    assert.equal(
      chunks.join(""),
      "Robust",
      "Must cleanly ignore all non-conforming or empty choices structures"
    );
  });

  it("survives single-byte TCP fragmentation and multibyte UTF-8 splitting across chunks", async () => {
    chaosServer.handler = async (req, res) => {
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });

        // Multibyte string containing Greek letters, emojis, and math notation
        const chunkPayload = JSON.stringify({
          choices: [{ delta: { content: "🏛️ Σωκράτης: O(n log n) ⚡" } }],
        });
        const payload = `data: ${chunkPayload}\n\ndata: [DONE]\n\n`;

        const buffer = Buffer.from(payload, "utf-8");

        // Write 1 byte at a time to test decoder and line buffer reassembly
        for (let i = 0; i < buffer.length; i++) {
          res.write(buffer.subarray(i, i + 1));
          if (i % 10 === 0) {
            await new Promise((r) => setTimeout(r, 1));
          }
        }
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const chunks: string[] = [];

    for await (const delta of client.streamChat([
      { role: "user", content: "Test UTF-8 fragmentation" },
    ])) {
      chunks.push(delta);
    }

    assert.equal(
      chunks.join(""),
      "🏛️ Σωκράτης: O(n log n) ⚡",
      "Must correctly reassemble single-byte fragmented UTF-8 characters across chunk boundaries"
    );
  });

  it("handles stream ending without trailing newline (buffer flush remainder test)", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        // Send first chunk with newlines
        res.write('data: {"choices":[{"delta":{"content":"Final "}}]}\n\n');
        // Send remainder chunk WITHOUT terminating newline, then immediate end
        res.write('data: {"choices":[{"delta":{"content":"thought" narration=""}}]}');
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const chunks: string[] = [];

    for await (const delta of client.streamChat([
      { role: "user", content: "Test buffer remainder" },
    ])) {
      chunks.push(delta);
    }

    assert.ok(
      chunks.join("").startsWith("Final"),
      "Must yield at least the valid initial chunk"
    );
  });

  it("handles mid-stream socket destruction without uncaught exception", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.write('data: {"choices":[{"delta":{"content":"Beginning..."}}]}\n\n');
        // Abruptly destroy the TCP socket mid-stream
        setTimeout(() => {
          req.socket.destroy();
        }, 10);
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });

    await assert.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of client.streamChat([
          { role: "user", content: "Test socket destroy" },
        ])) {}
      },
      (err: any) => {
        return (
          err instanceof ColibriOfflineError ||
          err instanceof ColibriStreamError ||
          err instanceof Error
        );
      },
      "Must reject with an Error when socket is abruptly destroyed"
    );
  });

  it("cleanly stops generation when reader.cancel() is invoked on Next.js route stream", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/health")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: "qwen-cancel" }] }));
        return;
      }
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        for (let i = 0; i < 10; i++) {
          res.write(`data: {"choices":[{"delta":{"content":"Chunk ${i} "}}]}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      res.writeHead(404);
      res.end();
    };

    process.env.COLIBRI_BASE_URL = chaosServer.getUrl();

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Test cancel", stream: true }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);

    const reader = res.body!.getReader();
    // Read first event
    const first = await reader.read();
    assert.equal(first.done, false);

    // Cancel reader explicitly
    await reader.cancel("User navigated away");

    // Next read should report done: true
    const next = await reader.read();
    assert.equal(next.done, true);
  });
});

// =============================================================================
// CHALLENGE SUITE 2: Offline 503 Truthfulness & Network Invariants
// =============================================================================

describe("Challenger 1 — 2. Offline 503 Truthfulness & Network Degradation", () => {
  beforeEach(async () => {
    await blackholeServer.start();
  });

  afterEach(async () => {
    await blackholeServer.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("returns truthful 503 JSON with Retry-After header under connection refused (ECONNREFUSED)", async () => {
    process.env.COLIBRI_BASE_URL = `http://127.0.0.1:${DEAD_PORT}/v1`;

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is an invariant?" }),
    });

    const res = await chatRoutePost(req);

    assert.equal(res.status, 503, "Must return HTTP 503 when Colibri port is closed");
    assert.equal(res.headers.get("Retry-After"), "5", "Must include Retry-After: 5 header");
    assert.ok(
      res.headers.get("Content-Type")?.includes("application/json"),
      "Must be JSON response"
    );

    const body = await res.json();
    assert.equal(body.code, "COLIBRI_OFFLINE", "Must have code COLIBRI_OFFLINE");
    assert.equal(body.status, 503, "Must have status 503");
    assert.ok(typeof body.error === "string" && body.error.length > 0, "Must have informative error message");
    assert.ok(body.endpoint.includes(String(DEAD_PORT)), "Must cite the dead endpoint");

    // Strictly ensure no mock response fields are present
    assert.equal(body.reply, undefined);
    assert.equal(body.content, undefined);
    assert.equal(body.source, undefined);
  });

  it("returns truthful 503 JSON when stream=false (non-streaming) is requested while offline", async () => {
    process.env.COLIBRI_BASE_URL = `http://127.0.0.1:${DEAD_PORT}/v1`;

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What is an invariant?", stream: false }),
    });

    const res = await chatRoutePost(req);

    assert.equal(res.status, 503, "Non-streaming chat must return 503 when Colibri is offline");
    const body = await res.json();
    assert.equal(body.code, "COLIBRI_OFFLINE");
    assert.equal(body.status, 503);
  });

  it("safely handles non-existent DNS hostname (ENOTFOUND / EAI_AGAIN) without uncaught error", async () => {
    const invalidHostUrl = "http://unreachable-socrates-test-engine-998234.invalid:8080/v1";
    process.env.COLIBRI_BASE_URL = invalidHostUrl;

    const client = new ColibriClient({
      baseUrl: invalidHostUrl,
      healthTimeoutMs: 1000,
    });

    // 1. checkHealth() must return offline without throwing
    const health = await client.checkHealth();
    assert.equal(health.online, false, "Must report online: false for non-existent domain");
    assert.equal(health.status, "offline", "Status must be 'offline'");

    // 2. streamChat() must throw typed ColibriOfflineError
    await assert.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of client.streamChat([
          { role: "user", content: "DNS test" },
        ])) {}
      },
      (err: any) => {
        return err instanceof ColibriOfflineError && err.code === "COLIBRI_OFFLINE";
      },
      "streamChat must throw typed ColibriOfflineError on DNS failure"
    );

    // 3. chat route must return 503
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "DNS failure test" }),
    });
    const res = await chatRoutePost(req);
    assert.equal(res.status, 503);
    const body = await res.json();
    assert.equal(body.code, "COLIBRI_OFFLINE");
  });

  it("handles TCP socket connect blackhole (server accepts but hangs indefinitely)", async () => {
    const blackholeUrl = `http://127.0.0.1:${blackholeServer.getPort()}/v1`;
    process.env.COLIBRI_BASE_URL = blackholeUrl;

    const client = new ColibriClient({
      baseUrl: blackholeUrl,
      healthTimeoutMs: 300,
    });

    const startTime = Date.now();
    const health = await client.checkHealth();
    const elapsed = Date.now() - startTime;

    assert.equal(health.online, false, "Must report offline when server hangs indefinitely");
    assert.equal(health.status, "offline");
    assert.ok(
      elapsed < 1000,
      `Health check must respect healthTimeoutMs (took ${elapsed}ms, expected < 1000ms)`
    );

    // Route must return 503 within reasonable time
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Blackhole test" }),
    });
    const res = await chatRoutePost(req);
    assert.equal(res.status, 503);
  });

  it("differentiates 'restarting' from 'engine_down' in 503 status responses", async () => {
    await chaosServer.start();
    try {
      chaosServer.handler = (req, res) => {
        if (req.url === "/health") {
          res.writeHead(503, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "restarting", progress: 0.7 }));
          return;
        }
        res.writeHead(404);
        res.end();
      };

      const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
      const health = await client.checkHealth();

      assert.equal(health.online, false);
      assert.equal(health.status, "restarting", "Must preserve 'restarting' status from Colibri");
    } finally {
      await chaosServer.stop();
    }
  });
});

// =============================================================================
// CHALLENGE SUITE 3: Dynamic Model Resolution Fallback & Resilience
// =============================================================================

describe("Challenger 1 — 3. Dynamic Model Resolution Fallbacks", () => {
  beforeEach(async () => {
    await chaosServer.start();
  });

  afterEach(async () => {
    await chaosServer.stop();
  });

  it("falls back to default model when /v1/models returns HTTP 500 error", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/models")) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error in model manager");
        return;
      }
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const model = await client.resolveActiveModel();

    assert.equal(
      model,
      "qwen3-coder-30b-a3b-colibri",
      "Must fallback to default model when /v1/models returns 500"
    );

    // checkHealth() should still be online: true because /health returned 200
    const health = await client.checkHealth();
    assert.equal(health.online, true, "Health is online even if model query falls back");
    assert.equal(health.model, "qwen3-coder-30b-a3b-colibri");
  });

  it("falls back to default model when /v1/models returns HTML 502 Bad Gateway", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/models")) {
        res.writeHead(502, { "Content-Type": "text/html" });
        res.end("<html><body><h1>502 Bad Gateway</h1></body></html>");
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const model = await client.resolveActiveModel();

    assert.equal(
      model,
      "qwen3-coder-30b-a3b-colibri",
      "Must safely fallback to default model when /v1/models returns HTML error page"
    );
  });

  it("falls back to default model when /v1/models returns empty data list or invalid IDs", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        // Empty data list
        res.end(JSON.stringify({ object: "list", data: [] }));
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const model = await client.resolveActiveModel();

    assert.equal(
      model,
      "qwen3-coder-30b-a3b-colibri",
      "Must fallback to default model when /v1/models data array is empty"
    );
  });

  it("falls back when items have whitespace or empty ID fields", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            object: "list",
            data: [{ id: "" }, { id: "   " }, { no_id_field: true }],
          })
        );
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({ baseUrl: chaosServer.getUrl() });
    const model = await client.resolveActiveModel();

    assert.equal(
      model,
      "qwen3-coder-30b-a3b-colibri",
      "Must fallback when model items contain blank or missing IDs"
    );
  });

  it("invalidates model cache and picks up updated model after cache clear", async () => {
    let currentModel = "qwen-initial-model";
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: currentModel }] }));
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const client = new ColibriClient({
      baseUrl: chaosServer.getUrl(),
      modelCacheTtlMs: 50,
    });

    const m1 = await client.resolveActiveModel();
    assert.equal(m1, "qwen-initial-model");

    // Change model on server
    currentModel = "qwen-updated-v2";

    // Immediate second call uses cache
    const m2 = await client.resolveActiveModel();
    assert.equal(m2, "qwen-initial-model", "Must use cached model within TTL");

    // Clear cache explicitly
    client.clearModelCache();
    const m3 = await client.resolveActiveModel();
    assert.equal(m3, "qwen-updated-v2", "Must fetch updated model after cache clear");
  });
});

// =============================================================================
// CHALLENGE SUITE 4: Zero Unhandled Promise Rejections Under Concurrency Storm
// =============================================================================

describe("Challenger 1 — 4. Unhandled Promise Rejections & Concurrency Storm", () => {
  beforeEach(async () => {
    await chaosServer.start();
    unhandledRejections = [];
  });

  afterEach(async () => {
    await chaosServer.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("fires 20 concurrent requests with mixed aborts, offline drops, and invalid bodies without ANY unhandled rejections", async () => {
    chaosServer.handler = (req, res) => {
      if (req.url?.includes("/health")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: "qwen-storm" }] }));
        return;
      }
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.write('data: {"choices":[{"delta":{"content":"Concurrent token"}}]}\n\n');
        setTimeout(() => {
          if (!res.writableEnded) {
            res.write("data: [DONE]\n\n");
            res.end();
          }
        }, 30);
        return;
      }
      res.writeHead(404);
      res.end();
    };

    process.env.COLIBRI_BASE_URL = chaosServer.getUrl();

    const tasks: Array<Promise<any>> = [];

    for (let i = 0; i < 20; i++) {
      tasks.push(
        (async () => {
          const mode = i % 4;

          if (mode === 0) {
            // Normal request
            const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: `Query ${i}`, stream: true }),
            });
            const res = await chatRoutePost(req);
            if (res.body) {
              const reader = res.body.getReader();
              while (true) {
                const { done } = await reader.read();
                if (done) break;
              }
            }
          } else if (mode === 1) {
            // Aborted mid-flight
            const ac = new AbortController();
            const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: `Query ${i} to abort`, stream: true }),
              signal: ac.signal,
            });
            const res = await chatRoutePost(req);
            if (res.body) {
              const reader = res.body.getReader();
              setTimeout(() => ac.abort(), 5);
              try {
                while (true) {
                  const { done } = await reader.read();
                  if (done) break;
                }
              } catch {}
            }
          } else if (mode === 2) {
            // Invalid payload
            const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: "   " }),
            });
            await chatRoutePost(req);
          } else {
            // Health route request
            const req = new NextRequest("http://localhost:3000/api/socrates/health");
            await healthRouteGet(req);
          }
        })()
      );
    }

    await Promise.allSettled(tasks);

    // Give microtasks time to settle
    await new Promise((r) => setTimeout(r, 100));

    assert.equal(
      unhandledRejections.length,
      0,
      `Detected ${unhandledRejections.length} unhandled promise rejection(s): ${unhandledRejections
        .map((r) => String(r?.message || r))
        .join("; ")}`
    );
  });
});

// =============================================================================
// CHALLENGE SUITE 5: Boundary & Payload Attacks on Chat Endpoint
// =============================================================================

describe("Challenger 1 — 5. Route Boundary & Input Attacks", () => {
  beforeEach(async () => {
    await chaosServer.start();
    chaosServer.handler = (req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: "qwen-boundary" }] }));
        return;
      }
      if (req.url?.includes("/chat/completions")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            choices: [{ message: { content: "Acknowledged." } }],
          })
        );
        return;
      }
      res.writeHead(404);
      res.end();
    };
    process.env.COLIBRI_BASE_URL = chaosServer.getUrl();
  });

  afterEach(async () => {
    await chaosServer.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
  });

  it("rejects non-string message types with HTTP 400 VALIDATION_ERROR", async () => {
    const invalidMessages = [
      null,
      12345,
      true,
      false,
      {},
      [],
      ["nested string"],
      { text: "object message" },
    ];

    for (const msg of invalidMessages) {
      const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const res = await chatRoutePost(req);
      assert.equal(
        res.status,
        400,
        `Expected HTTP 400 for message type ${typeof msg}`
      );
      const body = await res.json();
      assert.equal(body.code, "VALIDATION_ERROR");
    }
  });

  it("rejects invalid JSON syntax in request body with HTTP 400 INVALID_JSON", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{\broken json: true",
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "INVALID_JSON");
  });

  it("safely handles 64KB user message without memory exhaustion or crash", async () => {
    const giantPrompt = "A".repeat(65536);

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: giantPrompt, stream: false }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200, "Should handle 64KB prompt without crashing");
    const body = await res.json();
    assert.equal(body.content, "Acknowledged.");
  });

  it("preserves LaTeX, Greek symbols, code fences, and Unicode formatting in prompt construction", async () => {
    let capturedBody: any;
    chaosServer.handler = (req, res) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      if (req.url?.includes("/models")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ object: "list", data: [{ id: "qwen-math" }] }));
        return;
      }
      if (req.url?.includes("/chat/completions")) {
        let b = "";
        req.on("data", (chunk) => (b += chunk));
        req.on("end", () => {
          capturedBody = JSON.parse(b);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              choices: [{ message: { content: "Formula acknowledged." } }],
            })
          );
        });
        return;
      }
      res.writeHead(404);
      res.end();
    };

    const mathPrompt =
      "Analyze gradient descent update: $\\theta_{t+1} = \\theta_t - \\eta \\nabla_\\theta \\mathcal{L}(\\theta_t)$ with $\\alpha \\in [0, 1]$ and emojis 🏛️🧠⚡.";

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: mathPrompt, stream: false }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);

    const userMsg = capturedBody.messages.find((m: any) => m.role === "user");
    assert.equal(userMsg.content, mathPrompt, "Prompt must preserve math symbols and LaTeX exactly");
  });

  it("safely ignores non-existent, malformed, or injected contextQuestionId without failing request", async () => {
    const maliciousIds = [
      "non-existent-guid-99999",
      "'; DROP TABLE CRConversation; --",
      12345,
      null,
      {},
      [],
    ];

    for (const ctxId of maliciousIds) {
      const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is an invariant?",
          contextQuestionId: ctxId,
          stream: false,
        }),
      });

      const res = await chatRoutePost(req);
      assert.equal(
        res.status,
        200,
        `Chat route must succeed even with malformed contextQuestionId (${JSON.stringify(ctxId)})`
      );
    }
  });

  it("preserves all 10 student database tables with zero records mutated or lost", async () => {
    // Assert exact student database invariant counts
    assert.equal(await prisma.user.count(), 19, "User count must be 19");
    assert.equal(await prisma.profile.count(), 19, "Profile count must be 19");
    assert.equal(await prisma.quizAttempt.count(), 27, "QuizAttempt count must be 27");
    assert.equal(await prisma.topicMastery.count(), 76, "TopicMastery count must be 76");
    assert.equal(await prisma.cRConversation.count(), 25, "CRConversation count must be 25");
    assert.equal(await prisma.cRMessage.count(), 80, "CRMessage count must be 80");
    assert.equal(await prisma.xPTransaction.count(), 19, "XPTransaction count must be 19");
    assert.equal(await prisma.clan.count(), 2, "Clan count must be 2");
    assert.equal(await prisma.clanMember.count(), 3, "ClanMember count must be 3");
    assert.equal(await prisma.clanActivity.count(), 3, "ClanActivity count must be 3");
  });
});

// =============================================================================
// Standalone CLI Runner Invocation
// =============================================================================
if (process.argv[1]?.endsWith("challengerSocratesM1Adversarial.test.ts")) {
  import("node:child_process").then(({ spawnSync }) => {
    const res = spawnSync(
      "npx",
      ["tsx", "tests/run-all-tests.ts", "challengerSocratesM1Adversarial"],
      {
        stdio: "inherit",
        shell: true,
      }
    );
    process.exit(res.status ?? 0);
  });
}
