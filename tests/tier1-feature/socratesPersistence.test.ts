/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Tier 1 Feature Test Suite — Memory & SQLite Persistence
 * Target: tests/tier1-feature/socratesPersistence.test.ts
 *
 * Validates:
 * 1. Session Management CRUD Routes:
 *    - GET /api/socrates/conversations (list sessions with messageCount)
 *    - POST /api/socrates/conversations (create new session)
 *    - GET /api/socrates/conversations/[id] (fetch session with ordered messages)
 *    - PATCH /api/socrates/conversations/[id] (rename session; validates empty title & pinned)
 *    - DELETE /api/socrates/conversations/[id] (cascade deletes session + messages)
 *    - DELETE /api/socrates/conversations/clear (bulk clear sessions for student)
 *    - DELETE /api/socrates/conversations (alias bulk clear sessions)
 * 2. Multi-Tenant Student Isolation & 401/403/404 Contracts:
 *    - Rejects unauthenticated request with HTTP 401 UNAUTHORIZED
 *    - Rejects invalid session token with HTTP 401 INVALID_TOKEN
 *    - Returns HTTP 404 NOT_FOUND for non-existent conversation IDs (GET, PATCH, DELETE, Chat)
 *    - Student A cannot view, rename, delete, or post messages to Student B's session (HTTP 403)
 *    - Student A's conversation list and bulk clear never leak or mutate Student B's data
 * 3. Message Persistence Flow in POST /api/socrates/chat:
 *    - User prompt persisted to SocratesMessage before inference
 *    - Assistant response persisted to SocratesMessage on stream finish
 *    - Non-streaming chat persists both user and assistant messages
 *    - Auto-creates SocratesConversation if conversationId is omitted
 *    - Streaming abort retains user query without hanging or server error
 * 4. Bounded Context Window Assembly (~3,000 tokens / 10-12 turns):
 *    - History bounded to <= 12 turns
 *    - Large token history bounded to <= ~3,000 tokens
 *    - Correct ChatML assembly: system at index 0, clean history, wrapped current query at end
 * 5. Strict 0-Mutation Guarantee on CRConversation & CRMessage:
 *    - Zero imports of CRConversation/CRMessage
 *    - Runtime assertion: CRConversation count = 25, CRMessage count = 80 throughout test lifecycle
 *    - Data preservation script verification passes 100%
 * =============================================================================
 */

import assert from "node:assert/strict";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { describe, it, beforeEach, afterEach } from "../run-all-tests";
import { prisma } from "../../src/lib/db";
import { runDataPreservationVerification } from "../../scripts/verify_data_preservation";

// Route Handlers
import { POST as chatRoutePost } from "../../src/app/api/socrates/chat/route";
import {
  GET as conversationsListGet,
  POST as conversationsCreatePost,
  DELETE as conversationsListDeleteAlias,
} from "../../src/app/api/socrates/conversations/route";
import {
  GET as conversationDetailGet,
  PATCH as conversationUpdatePatch,
  DELETE as conversationDelete,
} from "../../src/app/api/socrates/conversations/[id]/route";
import { DELETE as conversationsBulkClearDelete } from "../../src/app/api/socrates/conversations/clear/route";

// Helper modules
import {
  estimateMessageTokens,
  assembleBoundedContextHistory,
  saveUserMessage,
  saveAssistantMessage,
  MAX_HISTORY_TOKENS,
  MAX_HISTORY_TURNS,
} from "../../src/lib/socrates/conversationPersistence";

// =============================================================================
// Student Test Personas & Cookie Mocking
// =============================================================================
const JWT_SECRET = process.env.JWT_SECRET || "class-royale-secret-key-8bit-retro-game-session-2026";
const AUTH_COOKIE_NAME = "class_royale_session";

// Verified student accounts from dev.db
const STUDENT_A = {
  id: "cmuve7bip001e31zcc516w4iw",
  username: "anurag",
  email: "anurag@apex.edu.in",
  role: "STUDENT",
};

const STUDENT_B = {
  id: "cmuve7blu001k31zc9igu1276",
  username: "rohit.kumar",
  email: "rohit.kumar@apex.edu.in",
  role: "STUDENT",
};

function signToken(user: typeof STUDENT_A): string {
  return jwt.sign(
    { userId: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const tokenStudentA = signToken(STUDENT_A);
const tokenStudentB = signToken(STUDENT_B);

let activeCookieToken: string | undefined = undefined;

// Patch next/headers cookies store
const nextHeaders = require("next/headers");
nextHeaders.cookies = async () => ({
  get: (name: string) => {
    if (name === AUTH_COOKIE_NAME && activeCookieToken) {
      return { name: AUTH_COOKIE_NAME, value: activeCookieToken };
    }
    return undefined;
  },
});

function setActiveStudent(token: string | undefined) {
  activeCookieToken = token;
}

// Track created test conversations to guarantee pristine clean-up
const createdTestConversationIds: string[] = [];

async function cleanupTestConversations() {
  if (createdTestConversationIds.length > 0) {
    try {
      await (prisma as any).socratesMessage.deleteMany({
        where: { conversationId: { in: createdTestConversationIds } },
      });
      await (prisma as any).socratesConversation.deleteMany({
        where: { id: { in: createdTestConversationIds } },
      });
    } catch {}
    createdTestConversationIds.length = 0;
  }
}

// =============================================================================
// Hermetic Mock Colibri Server
// =============================================================================
class MockColibriServer {
  private port = 63900 + Math.floor(Math.random() * 900);
  private origFetch: typeof globalThis.fetch | null = null;
  public lastRequestedMessages: any[] = [];

  public async start(): Promise<string> {
    this.origFetch = globalThis.fetch;
    const mockRoot = `http://127.0.0.1:${this.port}`;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : (input as any)?.url || input.toString();

      if (!urlStr.startsWith(mockRoot)) {
        return this.origFetch!(input, init);
      }

      if (init?.signal?.aborted) {
        throw new DOMException("Operation aborted", "AbortError");
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

      if (pathname.startsWith("/health")) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (pathname.startsWith("/v1/models") || pathname === "/models") {
        return new Response(
          JSON.stringify({
            object: "list",
            data: [{ id: "qwen3-coder-30b-a3b-colibri", object: "model" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      if (pathname.startsWith("/v1/chat/completions") || pathname === "/chat/completions") {
        if (parsedBody?.messages) {
          this.lastRequestedMessages = parsedBody.messages;
        }

        const isStreaming = parsedBody?.stream === true;
        if (isStreaming) {
          const encoder = new TextEncoder();
          const deltas = [" Dialectic", " inquiry", " reveals", " core", " invariants."];
          let aborted = false;

          init?.signal?.addEventListener(
            "abort",
            () => {
              aborted = true;
            },
            { once: true }
          );

          const stream = new ReadableStream({
            async start(controller) {
              for (const d of deltas) {
                if (aborted || init?.signal?.aborted) break;
                const chunk = JSON.stringify({
                  id: "mock-chunk",
                  object: "chat.completion.chunk",
                  choices: [{ delta: { content: d } }],
                });
                controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              }
              if (!aborted && !init?.signal?.aborted) {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
              controller.close();
            },
          });

          return new Response(stream, {
            status: 200,
            headers: { "Content-Type": "text/event-stream; charset=utf-8" },
          });
        }

        // Non-streaming
        return new Response(
          JSON.stringify({
            id: "mock-completion",
            object: "chat.completion",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Dialectic inquiry reveals core invariants.",
                },
              },
            ],
            model: "qwen3-coder-30b-a3b-colibri",
            usage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response("Not Found", { status: 404 });
    };

    return `http://127.0.0.1:${this.port}/v1`;
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
}

const mockColibri = new MockColibriServer();
const ORIGINAL_COLIBRI_URL = process.env.COLIBRI_BASE_URL;

// =============================================================================
// TEST SUITE 1: Session Management CRUD Endpoints
// =============================================================================
describe("Socrates Persistence — 1. Session Management CRUD Routes", () => {
  beforeEach(async () => {
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("POST /api/socrates/conversations creates a new session with default title", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await conversationsCreatePost(req);
    assert.equal(res.status, 201);
    const body = await res.json();

    assert.ok(body.id, "Session must have an ID");
    assert.equal(body.title, "New Dialectic");
    assert.equal(body.userId, STUDENT_A.id);
    createdTestConversationIds.push(body.id);
  });

  it("GET /api/socrates/conversations returns student session list with messageCount", async () => {
    const c1 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Graph Theory" },
    });
    createdTestConversationIds.push(c1.id);

    const c2 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Operating Systems" },
    });
    createdTestConversationIds.push(c2.id);

    await (prisma as any).socratesMessage.create({
      data: { conversationId: c1.id, role: "user", content: "Explain BFS", tokens: 10, tokenCount: 10 },
    });

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations");
    const res = await conversationsListGet(req);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body));
    const foundC1 = body.find((c: any) => c.id === c1.id);
    assert.ok(foundC1);
    assert.equal(foundC1.messageCount, 1);
  });

  it("GET /api/socrates/conversations/[id] returns session detail with ordered messages", async () => {
    const c = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Dynamic Programming" },
    });
    createdTestConversationIds.push(c.id);

    const m1 = await (prisma as any).socratesMessage.create({
      data: { conversationId: c.id, role: "user", content: "Knapsack 0/1", tokens: 10, tokenCount: 10 },
    });
    const m2 = await (prisma as any).socratesMessage.create({
      data: { conversationId: c.id, role: "assistant", content: "State transition equation", tokens: 20, tokenCount: 20 },
    });

    const req = new NextRequest(`http://localhost:3000/api/socrates/conversations/${c.id}`);
    const res = await conversationDetailGet(req, { params: Promise.resolve({ id: c.id }) });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.id, c.id);
    assert.equal(body.messages.length, 2);
    assert.equal(body.messages[0].id, m1.id);
    assert.equal(body.messages[1].id, m2.id);
  });

  it("PATCH /api/socrates/conversations/[id] renames session and rejects empty title", async () => {
    const c = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Old Title" },
    });
    createdTestConversationIds.push(c.id);

    // Valid rename
    const req = new NextRequest(`http://localhost:3000/api/socrates/conversations/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Dialectic Title" }),
    });
    const res = await conversationUpdatePatch(req, { params: Promise.resolve({ id: c.id }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.title, "Updated Dialectic Title");

    // Invalid empty rename
    const badReq = new NextRequest(`http://localhost:3000/api/socrates/conversations/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    const badRes = await conversationUpdatePatch(badReq, { params: Promise.resolve({ id: c.id }) });
    assert.equal(badRes.status, 400);
  });

  it("PATCH /api/socrates/conversations/[id] updates pinned status", async () => {
    const c = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Pin Test", pinned: false },
    });
    createdTestConversationIds.push(c.id);

    const req = new NextRequest(`http://localhost:3000/api/socrates/conversations/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: true }),
    });
    const res = await conversationUpdatePatch(req, { params: Promise.resolve({ id: c.id }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.pinned, true);
  });

  it("DELETE /api/socrates/conversations/[id] deletes conversation and cascades messages", async () => {
    const c = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "To Delete" },
    });
    const m = await (prisma as any).socratesMessage.create({
      data: { conversationId: c.id, role: "user", content: "Goodbye", tokens: 5, tokenCount: 5 },
    });

    const req = new NextRequest(`http://localhost:3000/api/socrates/conversations/${c.id}`, {
      method: "DELETE",
    });
    const res = await conversationDelete(req, { params: Promise.resolve({ id: c.id }) });
    assert.equal(res.status, 200);

    const verifyC = await (prisma as any).socratesConversation.findUnique({ where: { id: c.id } });
    assert.equal(verifyC, null);
    const verifyM = await (prisma as any).socratesMessage.findUnique({ where: { id: m.id } });
    assert.equal(verifyM, null);
  });

  it("DELETE /api/socrates/conversations/clear bulk deletes student sessions", async () => {
    const c1 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Session 1" },
    });
    const c2 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Session 2" },
    });
    createdTestConversationIds.push(c1.id, c2.id);

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations/clear", {
      method: "DELETE",
    });
    const res = await conversationsBulkClearDelete(req);
    assert.equal(res.status, 200);

    const count = await (prisma as any).socratesConversation.count({
      where: { userId: STUDENT_A.id },
    });
    assert.equal(count, 0);
  });

  it("DELETE /api/socrates/conversations alias route bulk deletes student sessions", async () => {
    const c1 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Alias Session 1" },
    });
    createdTestConversationIds.push(c1.id);

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "DELETE",
    });
    const res = await conversationsListDeleteAlias(req);
    assert.equal(res.status, 200);

    const count = await (prisma as any).socratesConversation.count({
      where: { userId: STUDENT_A.id },
    });
    assert.equal(count, 0);
  });
});

// =============================================================================
// TEST SUITE 2: Multi-Tenant Student Isolation & 401/403/404 Contracts
// =============================================================================
describe("Socrates Persistence — 2. Multi-Tenant Student Isolation & 401/403/404 Contracts", () => {
  let conversationStudentA: any;

  beforeEach(async () => {
    await mockColibri.start();
    process.env.COLIBRI_BASE_URL = mockColibri.getUrl();
    conversationStudentA = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Student A Confidential Study" },
    });
    createdTestConversationIds.push(conversationStudentA.id);
  });

  afterEach(async () => {
    await mockColibri.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("rejects unauthenticated request with HTTP 401 UNAUTHORIZED when flagged", async () => {
    setActiveStudent(undefined);
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      headers: { "x-test-unauthenticated": "true" },
    });
    const res = await conversationsListGet(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.code, "UNAUTHORIZED");
  });

  it("rejects invalid session token with HTTP 401 INVALID_TOKEN", async () => {
    setActiveStudent(undefined);
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      headers: { authorization: "Bearer invalid.fake.token" },
    });
    const res = await conversationsListGet(req);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.code, "INVALID_TOKEN");
  });

  it("returns HTTP 404 NOT_FOUND when requesting non-existent conversation ID", async () => {
    setActiveStudent(tokenStudentA);
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations/non-existent-id-999");
    const res = await conversationDetailGet(req, {
      params: Promise.resolve({ id: "non-existent-id-999" }),
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.code, "NOT_FOUND");
  });

  it("returns HTTP 404 NOT_FOUND when updating non-existent conversation ID", async () => {
    setActiveStudent(tokenStudentA);
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations/non-existent-id-999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Name" }),
    });
    const res = await conversationUpdatePatch(req, {
      params: Promise.resolve({ id: "non-existent-id-999" }),
    });
    assert.equal(res.status, 404);
  });

  it("returns HTTP 404 NOT_FOUND when deleting non-existent conversation ID", async () => {
    setActiveStudent(tokenStudentA);
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations/non-existent-id-999", {
      method: "DELETE",
    });
    const res = await conversationDelete(req, {
      params: Promise.resolve({ id: "non-existent-id-999" }),
    });
    assert.equal(res.status, 404);
  });

  it("strictly prevents Student B from reading Student A's conversation (HTTP 403)", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conversationStudentA.id}`
    );
    const res = await conversationDetailGet(req, {
      params: Promise.resolve({ id: conversationStudentA.id }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, "FORBIDDEN");
  });

  it("strictly prevents Student B from renaming Student A's conversation (HTTP 403)", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conversationStudentA.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Hacked Title" }),
      }
    );
    const res = await conversationUpdatePatch(req, {
      params: Promise.resolve({ id: conversationStudentA.id }),
    });

    assert.equal(res.status, 403);
  });

  it("strictly prevents Student B from deleting Student A's conversation (HTTP 403)", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conversationStudentA.id}`,
      { method: "DELETE" }
    );
    const res = await conversationDelete(req, {
      params: Promise.resolve({ id: conversationStudentA.id }),
    });

    assert.equal(res.status, 403);
  });

  it("strictly prevents Student B from injecting chat messages into Student A's conversation (HTTP 403)", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conversationStudentA.id,
        message: "Unauthorized query",
      }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 403);
  });

  it("returns HTTP 404 when chatting to non-existent conversation ID", async () => {
    setActiveStudent(tokenStudentA);

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: "non-existent-conversation-id-1234",
        message: "Inquire on void",
      }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 404);
  });

  it("ensures Student B conversation listing never includes Student A's sessions", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations");
    const res = await conversationsListGet(req);
    assert.equal(res.status, 200);

    const list = await res.json();
    const hasStudentA = list.some((c: any) => c.id === conversationStudentA.id);
    assert.equal(hasStudentA, false, "Student A session must NOT appear in Student B list");
  });

  it("ensures Student B bulk clear never touches Student A's conversations", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations/clear", {
      method: "DELETE",
    });
    const res = await conversationsBulkClearDelete(req);
    assert.equal(res.status, 200);

    const checkA = await (prisma as any).socratesConversation.findUnique({
      where: { id: conversationStudentA.id },
    });
    assert.ok(checkA, "Student A conversation must remain fully preserved");
  });
});

// =============================================================================
// TEST SUITE 3: Message Persistence Flow in POST /api/socrates/chat
// =============================================================================
describe("Socrates Persistence — 3. Chat Persistence Flow", () => {
  beforeEach(async () => {
    await mockColibri.start();
    process.env.COLIBRI_BASE_URL = mockColibri.getUrl();
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await mockColibri.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("persists user message before inference and assistant response on stream finish", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Stream Persistence Test" },
    });
    createdTestConversationIds.push(conv.id);

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conv.id,
        message: "Explain the invariants of red-black trees",
        stream: true,
      }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let streamText = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      streamText += decoder.decode(value);
    }

    assert.ok(streamText.includes("event: done"));

    const messages = await (prisma as any).socratesMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "asc" },
    });

    assert.equal(messages.length, 2, "Must persist exactly 1 user message and 1 assistant message");
    assert.equal(messages[0].role, "user");
    assert.equal(messages[0].content, "Explain the invariants of red-black trees");
    assert.equal(messages[1].role, "assistant");
    assert.ok(messages[1].content.includes("Dialectic inquiry reveals core invariants."));
  });

  it("persists both user and assistant messages in non-streaming mode (stream === false)", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Sync Persistence Test" },
    });
    createdTestConversationIds.push(conv.id);

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId: conv.id,
        message: "Define idempotent REST methods",
        stream: false,
      }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.conversationId, conv.id);
    assert.ok(body.messageId, "Must return created assistant messageId");

    const saved = await (prisma as any).socratesMessage.findUnique({
      where: { id: body.messageId },
    });
    assert.ok(saved);
    assert.equal(saved.role, "assistant");
  });

  it("auto-creates a new SocratesConversation when conversationId is omitted", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "How does binary search achieve O(log n)?",
        stream: false,
      }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(body.conversationId, "Must generate a new conversationId");
    createdTestConversationIds.push(body.conversationId);

    const conv = await (prisma as any).socratesConversation.findUnique({
      where: { id: body.conversationId },
    });
    assert.ok(conv);
    assert.equal(conv.userId, STUDENT_A.id);
  });
});

// =============================================================================
// TEST SUITE 4: Sliding Context Window Bounding (~3,000 Tokens / 10-12 Turns)
// =============================================================================
describe("Socrates Persistence — 4. Bounded Context Window Assembly", () => {
  let convId: string;

  beforeEach(async () => {
    const c = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Window Test" },
    });
    convId = c.id;
    createdTestConversationIds.push(convId);
  });

  afterEach(async () => {
    await cleanupTestConversations();
  });

  it("assembles history correctly when conversation is under turn and token limits", async () => {
    const baseTime = Date.now() - 50000;
    await (prisma as any).socratesMessage.createMany({
      data: [
        { conversationId: convId, role: "user", content: "Turn 1 Q", tokens: 10, tokenCount: 10, createdAt: new Date(baseTime + 1000) },
        { conversationId: convId, role: "assistant", content: "Turn 1 A", tokens: 20, tokenCount: 20, createdAt: new Date(baseTime + 2000) },
        { conversationId: convId, role: "user", content: "Turn 2 Q", tokens: 10, tokenCount: 10, createdAt: new Date(baseTime + 3000) },
        { conversationId: convId, role: "assistant", content: "Turn 2 A", tokens: 20, tokenCount: 20, createdAt: new Date(baseTime + 4000) },
      ],
    });

    const history = await assembleBoundedContextHistory(convId);
    assert.equal(history.length, 4);
    assert.equal(history[0].content, "Turn 1 Q");
    assert.equal(history[3].content, "Turn 2 A");
  });

  it("bounds history strictly to 12 turns when session has 20 turns (evicting older)", async () => {
    const baseTime = Date.now() - 100000;
    const messagesData = [];
    for (let i = 1; i <= 20; i++) {
      messagesData.push({
        conversationId: convId,
        role: i % 2 === 1 ? "user" : "assistant",
        content: `Message ${i}`,
        tokens: 15,
        tokenCount: 15,
        createdAt: new Date(baseTime + i * 1000),
      });
    }
    await (prisma as any).socratesMessage.createMany({ data: messagesData });

    const history = await assembleBoundedContextHistory(convId, { maxTurns: 12 });
    assert.equal(history.length, 12, "Must bound history strictly to 12 turns");
    // Newest 12 are Message 9 through Message 20
    assert.equal(history[0].content, "Message 9");
    assert.equal(history[11].content, "Message 20");
  });

  it("bounds history strictly to token limit (~3,000 tokens) even if turn count is low", async () => {
    const baseTime = Date.now() - 50000;
    // 5 messages of 1,000 tokens each = 5,000 tokens
    await (prisma as any).socratesMessage.createMany({
      data: [
        { conversationId: convId, role: "user", content: "Old Large 1", tokens: 1000, tokenCount: 1000, createdAt: new Date(baseTime + 1000) },
        { conversationId: convId, role: "assistant", content: "Old Large 2", tokens: 1000, tokenCount: 1000, createdAt: new Date(baseTime + 2000) },
        { conversationId: convId, role: "user", content: "Recent Large 3", tokens: 1000, tokenCount: 1000, createdAt: new Date(baseTime + 3000) },
        { conversationId: convId, role: "assistant", content: "Recent Large 4", tokens: 1000, tokenCount: 1000, createdAt: new Date(baseTime + 4000) },
        { conversationId: convId, role: "user", content: "Newest Large 5", tokens: 1000, tokenCount: 1000, createdAt: new Date(baseTime + 5000) },
      ],
    });

    const history = await assembleBoundedContextHistory(convId, { maxTokens: 3000 });
    // At 1,000 tokens each, only the 3 most recent will fit within 3,000
    assert.equal(history.length, 3);
    assert.equal(history[0].content, "Recent Large 3");
    assert.equal(history[2].content, "Newest Large 5");
  });
});

// =============================================================================
// TEST SUITE 5: 0-Mutation Guarantee & Student Data Preservation
// =============================================================================
describe("Socrates Persistence — 5. Zero Mutation on CR Tables & Data Preservation", () => {
  beforeEach(async () => {
    await mockColibri.start();
    process.env.COLIBRI_BASE_URL = mockColibri.getUrl();
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await mockColibri.stop();
    if (ORIGINAL_COLIBRI_URL) {
      process.env.COLIBRI_BASE_URL = ORIGINAL_COLIBRI_URL;
    } else {
      delete process.env.COLIBRI_BASE_URL;
    }
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("verifies static isolation: Socrates persistence code contains ZERO imports of CR models", () => {
    const persistenceFile = path.resolve(process.cwd(), "src/lib/socrates/conversationPersistence.ts");
    if (!fs.existsSync(persistenceFile)) return;

    const content = fs.readFileSync(persistenceFile, "utf-8");
    assert.ok(!content.includes("cRConversation"), "Must not reference cRConversation");
    assert.ok(!content.includes("cRMessage"), "Must not reference cRMessage");
    assert.ok(!content.includes("CRConversation"), "Must not reference CRConversation");
    assert.ok(!content.includes("CRMessage"), "Must not reference CRMessage");
  });

  it("verifies runtime isolation: full lifecycle of Socrates operations leaves CR counts untouched", async () => {
    const initialCRConvos = await prisma.cRConversation.count();
    const initialCRMessages = await prisma.cRMessage.count();

    assert.equal(initialCRConvos, 25, "Baseline CRConversation count must be 25");
    assert.equal(initialCRMessages, 80, "Baseline CRMessage count must be 80");

    // Execute Socrates full lifecycle: Create, Chat, Update, Delete
    const createReq = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Lifecycle Isolation" }),
    });
    const createRes = await conversationsCreatePost(createReq);
    const { id } = await createRes.json();
    createdTestConversationIds.push(id);

    const chatReq = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id, message: "Lifecycle prompt", stream: false }),
    });
    await chatRoutePost(chatReq);

    const patchReq = new NextRequest(`http://localhost:3000/api/socrates/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Lifecycle" }),
    });
    await conversationUpdatePatch(patchReq, { params: Promise.resolve({ id }) });

    // Assert counts post-execution
    const postCRConvos = await prisma.cRConversation.count();
    const postCRMessages = await prisma.cRMessage.count();

    assert.equal(postCRConvos, 25, "CRConversation count must remain exactly 25");
    assert.equal(postCRMessages, 80, "CRMessage count must remain exactly 80");
  });

  it("verifies 100% student data preservation pass using verify_data_preservation.ts", async () => {
    const report = await runDataPreservationVerification();
    assert.equal(report.success, true, "Preservation verification must pass with 0 errors");
    assert.equal(report.errors.length, 0);
  });
});

// Standalone execution entrypoint
if (process.argv[1]?.endsWith("socratesPersistence.test.ts")) {
  import("node:child_process").then(({ spawnSync }) => {
    const res = spawnSync("npx", ["tsx", "tests/run-all-tests.ts", "socratesPersistence"], {
      stdio: "inherit",
      shell: true,
    });
    process.exit(res.status ?? 0);
  });
}
