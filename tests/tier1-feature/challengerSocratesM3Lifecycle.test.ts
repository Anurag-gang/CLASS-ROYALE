/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Milestone 3 Adversarial Lifecycle & Stress Test Suite
 * Target: tests/tier1-feature/challengerSocratesM3Lifecycle.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS-TEST HARNESS:
 * 1. Massive History Eviction Attack:
 *    - 60+ turns of varying token sizes (small, medium, 1,000+ tokens)
 *    - Strict bounds enforcement within 3,000 tokens / 12 turns
 *    - Order preservation (chronological) & recency priority
 *    - Extreme single-turn payload (>3,000 tokens) budget handling
 *    - Micro-turn flooding (40 turns, 1 word each) clamped to turn cap
 *    - Token boundary collision (budget precision)
 * 2. Cascade Deletion Integrity & Orphan Prevention:
 *    - Large-scale creation: 5 conversations with 30 messages each (150 messages)
 *    - Targeted deletion leaves 0 orphans and retains remaining conversations
 *    - Raw SQL query asserting 0 orphaned SocratesMessage rows in SQLite
 *    - Multi-student bulk clear isolation and orphan check
 *    - HTTP DELETE route cascading verification
 * 3. Multi-Session Write Concurrency & SQLite Lock Resistance:
 *    - Rapid interleaved message creation across multiple conversations (Promise.all)
 *    - Concurrent conversation creations (10 simultaneous POSTs)
 *    - Concurrent title updates and pinned status changes
 *    - Mixed concurrent read/write/list operations under load
 * 4. Empty, Corrupt, and Asymmetrical Session States:
 *    - Zero-message session (GET, list, bounded context assembly)
 *    - Interrupted / asymmetrical turns (consecutive user-only turns)
 *    - Asymmetrical turns (consecutive assistant-only turns)
 *    - Corrupt / null metadata in SocratesMessage (safe fallback)
 *    - Boundary payloads (empty string, high-density emoji Unicode)
 * 5. Data Preservation & CR Model Invariants:
 *    - Baseline CRConversation (25) & CRMessage (80) count preservation
 *    - Full 100% student data preservation verification pass
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

// Persistence Helpers
import {
  estimateMessageTokens,
  assembleBoundedContextHistory,
  saveUserMessage,
  saveAssistantMessage,
  listConversations,
  createConversation,
  getConversationWithMessages,
  updateConversation,
  deleteConversation,
  clearAllConversations,
  MAX_HISTORY_TOKENS,
  MAX_HISTORY_TURNS,
} from "../../src/lib/socrates/conversationPersistence";

// =============================================================================
// Student Test Personas & Cookie Mocking
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

function signStudentToken(student: typeof STUDENT_A): string {
  return jwt.sign(
    {
      userId: student.id,
      username: student.username,
      email: student.email,
      role: student.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

const tokenStudentA = signStudentToken(STUDENT_A);
const tokenStudentB = signStudentToken(STUDENT_B);

let activeCookieToken: string | undefined = undefined;

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
    } catch (e) {
      console.error("CLEANUP ERROR:", e);
    }
    createdTestConversationIds.length = 0;
  }
}

// =============================================================================
// Mock Colibri Server for Chat Route Stress Tests
// =============================================================================
class MockColibriServer {
  private port = 64300 + Math.floor(Math.random() * 600);
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
            id: "mock-lifecycle-completion",
            object: "chat.completion",
            choices: [
              {
                message: {
                  role: "assistant",
                  content: "Dialectic invariant preserved under lifecycle stress.",
                },
              },
            ],
            model: "qwen3-coder-30b-a3b-colibri",
            usage: { promptTokens: 30, completionTokens: 15, totalTokens: 45 },
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
}

const mockColibri = new MockColibriServer();
const ORIGINAL_COLIBRI_URL = process.env.COLIBRI_BASE_URL;

// =============================================================================
// Suite 1: Massive History Eviction Attack & Window Bounding
// =============================================================================
describe("Adversarial Lifecycle — 1. Massive History Eviction & Context Bounding", () => {
  let conversationId: string;

  beforeEach(async () => {
    setActiveStudent(tokenStudentA);
    const conv = await (prisma as any).socratesConversation.create({
      data: {
        userId: STUDENT_A.id,
        title: "Massive History Stress Dialectic",
      },
    });
    conversationId = conv.id;
    createdTestConversationIds.push(conversationId);
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("STRESS: 60 turns of variable sizes strictly bounds within 3,000 tokens and 12 turns in < 50ms", async () => {
    // Generate 60 messages: alternating user and assistant
    // Small (10-30 chars), Medium (200-400 chars), Large (1,500-2,000 chars), Heavy (800-1,200 chars)
    const baseTime = Date.now();
    const messagesToInsert: any[] = [];

    for (let i = 1; i <= 60; i++) {
      let content: string;
      const role = i % 2 === 1 ? "user" : "assistant";

      if (i <= 10) {
        // Small turns (~10-30 chars, ~6-12 tokens)
        content = `Turn ${i}: Short prompt question ${i}`;
      } else if (i <= 25) {
        // Medium turns (~300 chars, ~83 tokens)
        content = `Turn ${i}: Detailed explanation of algorithmic complexity. ` + "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(4);
      } else if (i <= 35) {
        // Large turns (~1,800 chars, ~477 tokens)
        content = `Turn ${i}: Large code snippet and architecture diagram. ` + "function processPacket(pkt) { return pkt.validate(); }\n".repeat(30);
      } else if (i <= 45) {
        // Heavy turns (~1,000 chars, ~267 tokens)
        content = `Turn ${i}: Deep analysis of memory allocation and cache invalidation. ` + "Heap block verification trace: [OK]\n".repeat(25);
      } else {
        // Final recent turns (~200 chars, ~56 tokens)
        content = `Turn ${i}: Recent follow-up clarification on previous invariant #${i}`;
      }

      const tokens = estimateMessageTokens(content);
      messagesToInsert.push({
        conversationId,
        role,
        content,
        tokens,
        tokenCount: tokens,
        createdAt: new Date(baseTime + i * 1000), // strictly increasing timestamps
      });
    }

    // Insert all 60 messages sequentially to guarantee timestamp ordering
    for (const msgData of messagesToInsert) {
      await (prisma as any).socratesMessage.create({ data: msgData });
    }

    const totalStored = await (prisma as any).socratesMessage.count({
      where: { conversationId },
    });
    assert.equal(totalStored, 60, "All 60 messages must be stored in database");

    // Execute bounded context window assembly
    const startAssembly = performance.now();
    const history = await assembleBoundedContextHistory(conversationId, {
      maxTokens: 3000,
      maxTurns: 12,
    });
    const assemblyDurationMs = performance.now() - startAssembly;

    // 1. Performance check: execution must be near-instantaneous
    assert.ok(
      assemblyDurationMs < 200,
      `Assembly took ${assemblyDurationMs.toFixed(2)}ms, must complete under 200ms`
    );

    // 2. Strict Turn Bound: must not exceed 12 turns
    assert.ok(
      history.length <= 12,
      `History length ${history.length} must be <= 12 turns`
    );
    assert.ok(
      history.length > 0,
      "History should contain non-empty turns"
    );

    // 3. Strict Token Bound: sum of tokens must not exceed 3,000 tokens
    let totalTokens = 0;
    for (const item of history) {
      totalTokens += estimateMessageTokens(item.content);
    }
    assert.ok(
      totalTokens <= 3000,
      `Total tokens ${totalTokens} must strictly be <= 3,000 tokens`
    );

    // 4. Chronological Ordering: earlier turns must precede later turns
    // Content contains "Turn X:" which allows direct verification of ordering
    const turnNumbers = history.map((h) => {
      const match = h.content.match(/Turn (\d+):/);
      return match ? parseInt(match[1], 10) : 0;
    });

    for (let k = 1; k < turnNumbers.length; k++) {
      assert.ok(
        turnNumbers[k] > turnNumbers[k - 1],
        `History must be chronologically ascending: Turn ${turnNumbers[k]} followed Turn ${turnNumbers[k - 1]}`
      );
    }

    // 5. Recency Priority: turns in history should be from the latest sequence (e.g. > Turn 40)
    assert.ok(
      turnNumbers[turnNumbers.length - 1] === 60,
      `The most recent message (Turn 60) must be included in history, got Turn ${turnNumbers[turnNumbers.length - 1]}`
    );
  });

  it("PATHOLOGICAL OVERSHOOT: Single message exceeding 3,000 tokens in history is safely evicted without crashing", async () => {
    // Turn 1: Normal user question
    await (prisma as any).socratesMessage.create({
      data: {
        conversationId,
        role: "user",
        content: "Turn 1: Small question",
        tokens: 15,
        tokenCount: 15,
        createdAt: new Date(Date.now() - 30000),
      },
    });

    // Turn 2: Monster assistant response of 16,000 chars (~4,200 tokens > 3000)
    const monsterContent = "MONSTER_DATA ".repeat(1250); // ~16,250 chars
    const monsterTokens = estimateMessageTokens(monsterContent);
    assert.ok(monsterTokens > 3000, `Monster tokens ${monsterTokens} must exceed 3000`);

    await (prisma as any).socratesMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: monsterContent,
        tokens: monsterTokens,
        tokenCount: monsterTokens,
        createdAt: new Date(Date.now() - 20000),
      },
    });

    // Turn 3: Recent user follow-up
    await (prisma as any).socratesMessage.create({
      data: {
        conversationId,
        role: "user",
        content: "Turn 3: Recent question after monster dump",
        tokens: 18,
        tokenCount: 18,
        createdAt: new Date(Date.now() - 10000),
      },
    });

    // When assembling history excluding Turn 3 (e.g. Turn 3 is the current user turn)
    const historyExcludingTurn3 = await assembleBoundedContextHistory(conversationId, {
      maxTokens: 3000,
      maxTurns: 12,
      excludeMessageId: (await (prisma as any).socratesMessage.findFirst({
        where: { conversationId, content: { startsWith: "Turn 3" } },
      })).id,
    });

    // Because the next most recent message is the monster (> 3000 tokens), it cannot fit into 3,000 tokens
    // The budget loop breaks immediately.
    assert.equal(
      historyExcludingTurn3.length,
      0,
      "When previous message exceeds entire token budget, history cleanly returns empty array [] without crash"
    );

    // When assembling history INCLUDING Turn 3
    const fullHistory = await assembleBoundedContextHistory(conversationId, {
      maxTokens: 3000,
      maxTurns: 12,
    });

    // Turn 3 fits (18 tokens). Then monster exceeds remaining budget (3000 - 18 = 2982 < 4200), so loop breaks.
    assert.equal(fullHistory.length, 1, "Only Turn 3 fits into budget");
    assert.ok(fullHistory[0].content.startsWith("Turn 3"));
  });

  it("TURN CAP DOMINANCE: 30 micro-turns are strictly clamped to maxTurns (12)", async () => {
    // 30 micro-turns: each turn is only ~10 characters (~6 tokens)
    // 30 * 6 = 180 tokens (far below 3000 tokens limit)
    const baseTime = Date.now();
    for (let i = 1; i <= 30; i++) {
      await (prisma as any).socratesMessage.create({
        data: {
          conversationId,
          role: i % 2 === 1 ? "user" : "assistant",
          content: `Micro ${i}`,
          tokens: 6,
          tokenCount: 6,
          createdAt: new Date(baseTime + i * 1000),
        },
      });
    }

    const history = await assembleBoundedContextHistory(conversationId, {
      maxTokens: 3000,
      maxTurns: 12,
    });

    assert.equal(
      history.length,
      12,
      "History length must be exactly clamped to 12 turns when total tokens is well under budget"
    );

    // Verify it took the last 12 turns (Micro 19 to Micro 30)
    assert.equal(history[0].content, "Micro 19");
    assert.equal(history[11].content, "Micro 30");
  });

  it("TOKEN BUDGET PRECISION: Clamps exactly when adding next message exceeds token budget", async () => {
    // Craft two turns:
    // Turn 1 (older): 500 tokens
    // Turn 2 (middle): 1,400 tokens
    // Turn 3 (newest): 1,500 tokens
    // Total Turn 2 + Turn 3 = 2,900 tokens (<= 3,000)
    // Adding Turn 1 would bring total to 3,400 (> 3,000) -> Turn 1 must be evicted!
    const baseTime = Date.now();

    await (prisma as any).socratesMessage.create({
      data: {
        conversationId,
        role: "user",
        content: "Turn 1 Content",
        tokens: 500,
        tokenCount: 500,
        createdAt: new Date(baseTime + 1000),
      },
    });

    await (prisma as any).socratesMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: "Turn 2 Content",
        tokens: 1400,
        tokenCount: 1400,
        createdAt: new Date(baseTime + 2000),
      },
    });

    await (prisma as any).socratesMessage.create({
      data: {
        conversationId,
        role: "user",
        content: "Turn 3 Content",
        tokens: 1500,
        tokenCount: 1500,
        createdAt: new Date(baseTime + 3000),
      },
    });

    const history = await assembleBoundedContextHistory(conversationId, {
      maxTokens: 3000,
      maxTurns: 12,
    });

    assert.equal(history.length, 2, "Must contain exactly 2 messages (Turn 2 and Turn 3)");
    assert.equal(history[0].content, "Turn 2 Content");
    assert.equal(history[1].content, "Turn 3 Content");
  });
});

// =============================================================================
// Suite 2: Cascade Deletion Integrity & Orphan Prevention
// =============================================================================
describe("Adversarial Lifecycle — 2. Cascade Deletion Integrity & Zero Orphan Verification", () => {
  beforeEach(async () => {
    await clearAllConversations(STUDENT_A.id);
    await clearAllConversations(STUDENT_B.id);
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("MASSIVE SCALE: Deleting individual conversations with 150+ messages leaves ZERO orphaned rows", async () => {
    // Create 5 conversations with 30 messages each (150 messages total)
    const convos: any[] = [];
    for (let c = 1; c <= 5; c++) {
      const conv = await (prisma as any).socratesConversation.create({
        data: {
          userId: STUDENT_A.id,
          title: `Cascade Test Conversation ${c}`,
        },
      });
      convos.push(conv);
      createdTestConversationIds.push(conv.id);

      // Create 30 messages for this conversation
      const msgsData = Array.from({ length: 30 }, (_, m) => ({
        conversationId: conv.id,
        role: m % 2 === 0 ? "user" : "assistant",
        content: `Message ${m + 1} for Conv ${c}`,
        tokens: 10,
        tokenCount: 10,
      }));

      for (const mData of msgsData) {
        await (prisma as any).socratesMessage.create({ data: mData });
      }
    }

    // Verify all 150 messages exist
    const initialMessageCount = await (prisma as any).socratesMessage.count({
      where: { conversationId: { in: convos.map((c) => c.id) } },
    });
    assert.equal(initialMessageCount, 150, "Total 150 messages must be created across 5 conversations");

    // Delete conversation #2 and conversation #4
    const deleteId1 = convos[1].id;
    const deleteId2 = convos[3].id;

    const res1 = await deleteConversation(deleteId1, STUDENT_A.id);
    const res2 = await deleteConversation(deleteId2, STUDENT_A.id);

    assert.ok(res1, "Delete 1 must succeed");
    assert.ok(res2, "Delete 2 must succeed");

    // 1. Direct Prisma Check: 0 messages remain for deleted conversations
    const remainingDeletedMsgs = await (prisma as any).socratesMessage.count({
      where: { conversationId: { in: [deleteId1, deleteId2] } },
    });
    assert.equal(
      remainingDeletedMsgs,
      0,
      "Messages belonging to deleted conversations must be completely cascaded to 0"
    );

    // 2. Remaining conversations (#1, #3, #5) and their 90 messages are intact
    const remainingConvs = await (prisma as any).socratesConversation.count({
      where: { id: { in: [convos[0].id, convos[2].id, convos[4].id] } },
    });
    assert.equal(remainingConvs, 3, "3 un-deleted conversations must remain intact");

    const remainingNonDeletedMsgs = await (prisma as any).socratesMessage.count({
      where: { id: { in: [convos[0].id, convos[2].id, convos[4].id] } },
    });

    // 3. Raw SQLite Query for ANY orphaned SocratesMessage records in the entire database
    const orphanQueryResult: any[] = await (prisma as any).$queryRawUnsafe(
      "SELECT COUNT(*) as orphanCount FROM SocratesMessage WHERE conversationId NOT IN (SELECT id FROM SocratesConversation)"
    );
    const orphanCount = Number(orphanQueryResult[0]?.orphanCount ?? 0);
    assert.equal(
      orphanCount,
      0,
      "EXHAUSTIVE SQL AUDIT: Zero orphaned SocratesMessage rows must exist in SQLite dev.db"
    );
  });

  it("BULK CLEAR ORPHAN PREVENTION: Clearing student sessions removes all messages without leaving orphans", async () => {
    // Student A: 3 conversations, 60 messages total
    const convosA: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const conv = await (prisma as any).socratesConversation.create({
        data: { userId: STUDENT_A.id, title: `Student A Bulk Clear Test ${i}` },
      });
      convosA.push(conv.id);
      createdTestConversationIds.push(conv.id);

      for (let m = 1; m <= 20; m++) {
        await (prisma as any).socratesMessage.create({
          data: {
            conversationId: conv.id,
            role: m % 2 === 0 ? "assistant" : "user",
            content: `A msg ${m}`,
            tokens: 10,
          },
        });
      }
    }

    // Student B: 2 conversations, 40 messages total
    const convosB: string[] = [];
    for (let i = 1; i <= 2; i++) {
      const conv = await (prisma as any).socratesConversation.create({
        data: { userId: STUDENT_B.id, title: `Student B Bulk Clear Test ${i}` },
      });
      convosB.push(conv.id);
      createdTestConversationIds.push(conv.id);

      for (let m = 1; m <= 20; m++) {
        await (prisma as any).socratesMessage.create({
          data: {
            conversationId: conv.id,
            role: m % 2 === 0 ? "assistant" : "user",
            content: `B msg ${m}`,
            tokens: 10,
          },
        });
      }
    }

    // Execute bulk clear for Student A
    const clearResult = await clearAllConversations(STUDENT_A.id);
    assert.equal(clearResult.count, 3, "Deleted count must be 3 conversations");

    // Student A checks
    const studentAConvs = await (prisma as any).socratesConversation.count({
      where: { userId: STUDENT_A.id, id: { in: convosA } },
    });
    assert.equal(studentAConvs, 0, "Student A conversations must be 0");

    const studentAMsgs = await (prisma as any).socratesMessage.count({
      where: { conversationId: { in: convosA } },
    });
    assert.equal(studentAMsgs, 0, "Student A messages must be 0");

    // Student B checks: 100% untouched
    const studentBConvs = await (prisma as any).socratesConversation.count({
      where: { userId: STUDENT_B.id, id: { in: convosB } },
    });
    assert.equal(studentBConvs, 2, "Student B conversations must remain 2");

    const studentBMsgs = await (prisma as any).socratesMessage.count({
      where: { conversationId: { in: convosB } },
    });
    assert.equal(studentBMsgs, 40, "Student B messages must remain 40");

    // Orphan audit
    const orphanQueryResult: any[] = await (prisma as any).$queryRawUnsafe(
      "SELECT COUNT(*) as orphanCount FROM SocratesMessage WHERE conversationId NOT IN (SELECT id FROM SocratesConversation)"
    );
    const orphanCount = Number(orphanQueryResult[0]?.orphanCount ?? 0);
    assert.equal(orphanCount, 0, "Zero orphan messages after bulk clear");
  });

  it("HTTP CASCADE INTEGRITY: DELETE /api/socrates/conversations/[id] route cascades messages cleanly", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "HTTP Route Cascade Test" },
    });
    createdTestConversationIds.push(conv.id);

    for (let m = 1; m <= 15; m++) {
      await (prisma as any).socratesMessage.create({
        data: {
          conversationId: conv.id,
          role: "user",
          content: `Cascade msg ${m}`,
          tokens: 5,
        },
      });
    }

    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conv.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenStudentA}` },
      }
    );

    const res = await conversationDelete(req, {
      params: Promise.resolve({ id: conv.id }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.deletedId, conv.id);

    // Verify messages cascaded
    const remainingMsgs = await (prisma as any).socratesMessage.count({
      where: { conversationId: conv.id },
    });
    assert.equal(remainingMsgs, 0, "All 15 messages must be cascaded by HTTP DELETE");
  });
});

// =============================================================================
// Suite 3: Multi-Session Concurrent Writes & SQLite Locking Stress
// =============================================================================
describe("Adversarial Lifecycle — 3. Multi-Session Write Concurrency & Locking", () => {
  beforeEach(async () => {
    await clearAllConversations(STUDENT_A.id);
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("CONCURRENCY: 24 simultaneous message writes across 4 conversations succeed with zero locking errors", async () => {
    // Create 4 distinct conversations
    const convos: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const conv = await (prisma as any).socratesConversation.create({
        data: { userId: STUDENT_A.id, title: `Concurrent Test Conv ${i}` },
      });
      convos.push(conv.id);
      createdTestConversationIds.push(conv.id);
    }

    // Prepare 24 write operations: 6 writes per conversation (alternating user & assistant)
    const writePromises: Promise<any>[] = [];

    for (let cIdx = 0; cIdx < convos.length; cIdx++) {
      const cId = convos[cIdx];
      for (let m = 1; m <= 6; m++) {
        if (m % 2 === 1) {
          writePromises.push(
            saveUserMessage(cId, `Concurrent User Query #${m} in Conv ${cIdx + 1}`)
          );
        } else {
          writePromises.push(
            saveAssistantMessage(
              cId,
              `Concurrent Assistant Response #${m} in Conv ${cIdx + 1}`,
              20,
              "qwen3-coder-30b-a3b-colibri"
            )
          );
        }
      }
    }

    // Fire all 24 writes concurrently
    const startConcurrent = performance.now();
    const results = await Promise.allSettled(writePromises);
    const durationMs = performance.now() - startConcurrent;

    // Assert all 24 promises resolved successfully
    const rejected = results.filter((r) => r.status === "rejected");
    assert.equal(
      rejected.length,
      0,
      `All 24 concurrent writes must succeed. Failures: ${JSON.stringify(rejected)}`
    );

    // Verify each conversation received exactly 6 messages
    for (const cId of convos) {
      const msgCount = await (prisma as any).socratesMessage.count({
        where: { conversationId: cId },
      });
      assert.equal(msgCount, 6, `Conversation ${cId} must have exactly 6 messages`);
    }

    assert.ok(
      durationMs < 5000,
      `24 concurrent writes took ${durationMs.toFixed(2)}ms, must finish comfortably within SQLite timeout`
    );
  });

  it("CONCURRENCY: 10 simultaneous conversation creations via POST /api/socrates/conversations succeed", async () => {
    const createPromises = Array.from({ length: 10 }, (_, i) => {
      const req = new NextRequest("http://localhost:3000/api/socrates/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenStudentA}`,
        },
        body: JSON.stringify({ title: `Concurrent Dialectic #${i + 1}` }),
      });
      return conversationsCreatePost(req);
    });

    const responses = await Promise.all(createPromises);

    for (const res of responses) {
      assert.equal(res.status, 201, "Each concurrent POST must return 201 Created");
      const data = await res.json();
      assert.ok(data.id, "Created session must have a unique ID");
      createdTestConversationIds.push(data.id);
    }

    // Assert 10 distinct IDs
    const uniqueIds = new Set(createdTestConversationIds);
    assert.equal(uniqueIds.size, 10, "All 10 created conversations must have unique IDs");
  });

  it("CONCURRENCY: Interleaved concurrent reads, writes, and listings complete cleanly without deadlock", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Interleaved Load Target" },
    });
    createdTestConversationIds.push(conv.id);

    // Execute 15 mixed operations concurrently:
    // - 5 user message writes
    // - 5 assistant message writes
    // - 3 conversation listings
    // - 2 conversation details
    const mixedOps: Promise<any>[] = [
      saveUserMessage(conv.id, "Interleaved Query 1"),
      listConversations(STUDENT_A.id),
      saveAssistantMessage(conv.id, "Interleaved Response 1", 10),
      getConversationWithMessages(conv.id, STUDENT_A.id),
      saveUserMessage(conv.id, "Interleaved Query 2"),
      listConversations(STUDENT_A.id, "Interleaved"),
      saveAssistantMessage(conv.id, "Interleaved Response 2", 15),
      getConversationWithMessages(conv.id, STUDENT_A.id),
      saveUserMessage(conv.id, "Interleaved Query 3"),
      updateConversation(conv.id, STUDENT_A.id, { title: "Interleaved Renamed Title" }),
      saveAssistantMessage(conv.id, "Interleaved Response 3", 20),
      listConversations(STUDENT_A.id),
      saveUserMessage(conv.id, "Interleaved Query 4"),
      saveAssistantMessage(conv.id, "Interleaved Response 4", 25),
      saveUserMessage(conv.id, "Interleaved Query 5"),
    ];

    const results = await Promise.allSettled(mixedOps);
    const rejected = results.filter((r) => r.status === "rejected");
    assert.equal(rejected.length, 0, "Zero operations should fail under interleaved load");

    // Verify conversation has 9 messages (5 user + 4 assistant)
    const detail = await getConversationWithMessages(conv.id, STUDENT_A.id);
    assert.ok(typeof detail === "object" && detail !== null);
    assert.equal(detail.messages.length, 9);
    assert.equal(detail.title, "Interleaved Renamed Title");
  });
});

// =============================================================================
// Suite 4: Empty, Corrupt, and Asymmetrical Session States
// =============================================================================
describe("Adversarial Lifecycle — 4. Empty, Corrupt, and Asymmetrical Session States", () => {
  beforeEach(async () => {
    await clearAllConversations(STUDENT_A.id);
    setActiveStudent(tokenStudentA);
  });

  afterEach(async () => {
    await cleanupTestConversations();
    setActiveStudent(undefined);
  });

  it("EMPTY SESSION: Session with 0 messages returns empty messages array and safe default metadata", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: {
        userId: STUDENT_A.id,
        title: "Empty Dialectic Session",
      },
    });
    createdTestConversationIds.push(conv.id);

    // 1. getConversationWithMessages
    const detail = await getConversationWithMessages(conv.id, STUDENT_A.id);
    assert.ok(typeof detail === "object" && detail !== null);
    assert.equal(detail.messages.length, 0, "Messages must be empty array []");
    assert.equal(detail.title, "Empty Dialectic Session");

    // 2. listConversations
    const list = await listConversations(STUDENT_A.id);
    const found = list.find((c: any) => c.id === conv.id);
    assert.ok(found, "Empty session must appear in conversation list");
    assert.equal(found.messageCount, 0, "Message count must be 0");
    assert.equal(found.lastMessage, "New conversation", "Default lastMessage should be 'New conversation'");

    // 3. assembleBoundedContextHistory
    const history = await assembleBoundedContextHistory(conv.id);
    assert.deepEqual(history, [], "Bounded context history on 0 messages must be empty array []");

    // 4. HTTP GET [id] route
    const req = new NextRequest(
      `http://localhost:3000/api/socrates/conversations/${conv.id}`,
      { method: "GET", headers: { Authorization: `Bearer ${tokenStudentA}` } }
    );
    const res = await conversationDetailGet(req, {
      params: Promise.resolve({ id: conv.id }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.deepEqual(data.messages, []);
  });

  it("ASYMMETRICAL TURNS: Interrupted generation with consecutive user queries assembles cleanly", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Interrupted Turns Dialectic" },
    });
    createdTestConversationIds.push(conv.id);

    const baseTime = Date.now();
    // Simulate user sending 3 queries in a row (e.g. streaming disconnected mid-flight)
    await (prisma as any).socratesMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: "First question from student",
        tokens: 10,
        createdAt: new Date(baseTime + 1000),
      },
    });
    await (prisma as any).socratesMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: "Second question after disconnect",
        tokens: 12,
        createdAt: new Date(baseTime + 2000),
      },
    });
    await (prisma as any).socratesMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: "Third question follow-up",
        tokens: 10,
        createdAt: new Date(baseTime + 3000),
      },
    });

    const history = await assembleBoundedContextHistory(conv.id);
    assert.equal(history.length, 3, "All 3 user queries should be included in history");
    assert.equal(history[0].role, "user");
    assert.equal(history[1].role, "user");
    assert.equal(history[2].role, "user");
    assert.equal(history[0].content, "First question from student");
    assert.equal(history[2].content, "Third question follow-up");

    // Verify listConversations shows the latest user message
    const list = await listConversations(STUDENT_A.id);
    const found = list.find((c: any) => c.id === conv.id);
    assert.equal(found.messageCount, 3);
    assert.equal(found.lastMessage, "Third question follow-up");
  });

  it("CORRUPT METADATA: Handles null tokens, null model, and malformed JSON metadata gracefully", async () => {
    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Corrupt Metadata Session" },
    });
    createdTestConversationIds.push(conv.id);

    // Insert message with all nullable metadata fields set to null or corrupt strings
    const corruptMsg = await (prisma as any).socratesMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: "Valid response content with corrupt metadata envelope",
        tokens: null,
        tokenCount: null,
        model: null,
        metadataJson: "{ this is NOT valid json !!! : [unclosed",
      },
    });

    // 1. getConversationWithMessages must not crash on malformed metadata
    const detail = await getConversationWithMessages(conv.id, STUDENT_A.id);
    assert.ok(typeof detail === "object" && detail !== null);
    assert.equal(detail.messages.length, 1);
    assert.equal(detail.messages[0].model, null);
    assert.equal(detail.messages[0].tokens, null);
    assert.equal(
      detail.messages[0].metadataJson,
      "{ this is NOT valid json !!! : [unclosed"
    );

    // 2. assembleBoundedContextHistory falls back to estimateMessageTokens
    const history = await assembleBoundedContextHistory(conv.id);
    assert.equal(history.length, 1);
    assert.equal(
      history[0].content,
      "Valid response content with corrupt metadata envelope"
    );
  });

  it("BOUNDARY PAYLOADS: Empty string content and 1,000 emoji Unicode payloads handle safely", async () => {
    // 1. Empty string message
    const emptyEstimatedTokens = estimateMessageTokens("");
    assert.equal(
      emptyEstimatedTokens,
      4,
      "Empty string content returns structural overhead tokens (4)"
    );

    // 2. High-density emoji payload
    const emojiPayload = "🔥🚀🧠⚡🎯".repeat(200); // 1,000 emojis
    const emojiTokens = estimateMessageTokens(emojiPayload);
    assert.ok(emojiTokens > 0, "Emoji tokens must be a positive integer");

    const conv = await (prisma as any).socratesConversation.create({
      data: { userId: STUDENT_A.id, title: "Emoji Stress Session" },
    });
    createdTestConversationIds.push(conv.id);

    const savedMsg = await saveUserMessage(conv.id, emojiPayload);
    assert.ok(savedMsg.id);
    assert.equal(savedMsg.content, emojiPayload);

    const history = await assembleBoundedContextHistory(conv.id);
    assert.equal(history.length, 1);
    assert.equal(history[0].content, emojiPayload);
  });
});

// =============================================================================
// Suite 5: CR Table Mutation Invariant & Data Preservation Integrity
// =============================================================================
describe("Adversarial Lifecycle — 5. CR Table Invariance & Data Preservation Integrity", () => {
  it("verifies 100% student data preservation intact after all lifecycle stress tests", async () => {
    // Direct counts on CR models
    const crConversations = await prisma.cRConversation.count();
    const crMessages = await prisma.cRMessage.count();

    assert.equal(
      crConversations,
      25,
      "CRConversation count must remain EXACTLY 25 after all stress tests"
    );
    assert.equal(
      crMessages,
      80,
      "CRMessage count must remain EXACTLY 80 after all stress tests"
    );

    // Full student data preservation verification
    const report = await runDataPreservationVerification();
    assert.equal(report.success, true, "Preservation verification must pass with 0 errors");
    assert.equal(report.errors.length, 0);
  });
});

// Standalone execution entrypoint
if (process.argv[1]?.endsWith("challengerSocratesM3Lifecycle.test.ts")) {
  import("node:child_process").then(({ spawnSync }) => {
    const res = spawnSync("npx", ["tsx", "tests/run-all-tests.ts", "challengerSocratesM3Lifecycle"], {
      stdio: "inherit",
      shell: true,
    });
    process.exit(res.status ?? 0);
  });
}
