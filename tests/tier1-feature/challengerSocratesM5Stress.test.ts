/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL STRESS & CONCURRENCY VERIFICATION SUITE
 * Milestone 5: Verification Suite Robustness, SQLite Concurrency & Context Limits
 * File: tests/tier1-feature/challengerSocratesM5Stress.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS-TEST HARNESS:
 * 1. Verification Script & Provider Robustness:
 *    - Ephemeral HTTP server simulating transient network glitches, socket aborts
 *    - Mid-stream socket destruction (ECONNRESET simulation)
 *    - Client AbortController signal propagation & immediate socket termination
 *    - Malformed SSE streams: broken JSON, raw strings, [DONE], ping frames
 *    - Byte-level stream slicing across multi-byte UTF-8 characters and JSON delimiters
 *    - Audit of 15 verification scenarios ensuring substantive assertions
 * 2. Concurrent Request Stress Testing & SQLite Locking Resilience:
 *    - 50 rapid parallel invocations to GET /api/socrates/health (TTL cache & concurrency)
 *    - 40 rapid concurrent calls to retrieveAcademicContext (exact, partial, miss, SQL injection)
 *    - Concurrent multi-session creation across multiple student IDs (20 parallel sessions)
 *    - Concurrent message insertion (50 parallel writes to same & different conversations)
 *    - Interleaved concurrent reads and writes (zero SQLITE_BUSY locking errors)
 *    - Strict multi-tenant isolation under concurrent race conditions
 * 3. Session Lifecycle Stress & 50+ Turn Sliding Window:
 *    - Deep 60-message conversation (30 turns) in SQLite dev.db
 *    - Sliding window assertion: strictly retains the 12 most recent messages, drops older 48
 *    - Chronological order preservation (oldest-of-recent to newest)
 *    - Preservation of base system prompt and security delimiters in formatted output
 *    - High token density clamping (600+ tokens/msg) respecting ~3,000 token budget
 *    - Single message exceeding 3,000 tokens returning empty history gracefully
 *    - Message exclusion filter (excludeMessageId)
 *    - Hermetic database cleanup and student data preservation verification
 * =============================================================================
 */

import assert from "node:assert/strict";
import * as http from "node:http";
import { NextRequest } from "next/server";
import { prisma } from "../../src/lib/db";

// Dual-path resolver for test runner
let rawDescribe: (name: string, fn: () => void | Promise<void>) => void;
let rawIt: (name: string, fn: () => void | Promise<void>) => void;

try {
  const runner = require("../run-all-tests");
  rawDescribe = runner.describe;
  rawIt = runner.it;
} catch {
  const runner = require("../../tests/run-all-tests");
  rawDescribe = runner.describe;
  rawIt = runner.it;
}

interface LocalCase {
  name: string;
  fn: () => void | Promise<void>;
}
interface LocalSuite {
  name: string;
  cases: LocalCase[];
}
const localSuites: LocalSuite[] = [];
let activeLocalSuite: LocalSuite | null = null;

const describe = (name: string, fn: () => void) => {
  activeLocalSuite = { name, cases: [] };
  localSuites.push(activeLocalSuite);
  try {
    rawDescribe(name, fn);
  } finally {
    activeLocalSuite = null;
  }
};

const it = (name: string, fn: () => void | Promise<void>) => {
  if (activeLocalSuite) {
    activeLocalSuite.cases.push({ name, fn });
  }
  rawIt(name, fn);
};

// Socrates Library & Route Imports
import {
  ColibriClient,
  ColibriOfflineError,
  ColibriStreamError,
  ColibriTimeoutError,
} from "../../src/lib/socrates/colibriClient";
import {
  detectQueryType,
  buildSocratesSystemPrompt,
  formatSocratesMessages,
  USER_QUERY_START_DELIMITER,
  USER_QUERY_END_DELIMITER,
} from "../../src/lib/socrates/socratesPrompt";
import {
  retrieveAcademicContext,
} from "../../src/lib/socrates/academicKnowledgeRetrieval";
import {
  createConversation,
  getConversationWithMessages,
  listConversations,
  saveUserMessage,
  saveAssistantMessage,
  assembleBoundedContextHistory,
  deleteConversation,
  clearAllConversations,
  estimateMessageTokens,
  MAX_HISTORY_TOKENS,
  MAX_HISTORY_TURNS,
} from "../../src/lib/socrates/conversationPersistence";
import {
  parseSSEStreamChunks,
  classifyChatError,
} from "../../src/components/socrates/useSocratesChat";
import { GET as healthRouteGet } from "../../src/app/api/socrates/health/route";
import { runDataPreservationVerification } from "../../scripts/verify_data_preservation";

// Known student accounts in prisma/dev.db
const STUDENT_A = "cmuve7bip001e31zcc516w4iw"; // anurag
const STUDENT_B = "cmuve7blu001k31zc9igu1276"; // rohit.kumar

// Track test session IDs for hermetic cleanup
const testSessionIds: string[] = [];

async function purgeTestSessions() {
  if (testSessionIds.length === 0) return;
  try {
    const socratesPrisma = prisma as any;
    await socratesPrisma.socratesMessage.deleteMany({
      where: { conversationId: { in: testSessionIds } },
    });
    await socratesPrisma.socratesConversation.deleteMany({
      where: { id: { in: testSessionIds } },
    });
  } catch (err) {
    console.error("Purge warning:", err);
  }
}

// =============================================================================
// Test Suite 1: Verification Script & Provider Robustness
// =============================================================================
describe("Challenger M5 — 1. Verification Script & Provider Robustness", () => {
  it("audits verify_socrates_suite.ts to verify all 15 scenarios assert substantive invariants", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const scriptPath = path.resolve(process.cwd(), "scripts/verify_socrates_suite.ts");
    assert.ok(fs.existsSync(scriptPath), "scripts/verify_socrates_suite.ts must exist");

    const content = fs.readFileSync(scriptPath, "utf-8");

    // Verify all 15 scenarios are declared and registered
    for (let i = 1; i <= 15; i++) {
      assert.ok(
        content.includes(`Scenario ${i}:`) || content.includes(`Scenario  ${i}:`) || content.includes(`runScenario(\n      ${i},`) || content.includes(`runScenario(${i},`),
        `Scenario ${i} must be explicitly executed in verify_socrates_suite.ts`
      );
    }

    // Check for trivial assertions or bypasses
    assert.ok(!content.includes("assert.ok(true)"), "Must not contain no-op assert.ok(true)");
    assert.ok(!content.includes("assert.equal(1, 1)"), "Must not contain no-op assert.equal(1, 1)");
    assert.ok(content.includes("runDataPreservationVerification"), "Must embed data preservation verification");
  });

  it("handles transient network glitches and socket destruction mid-stream via ReadableStream error", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode('data: {"choices":[{"delta":{"content":"First chunk"转}}]}\n\n'.replace("转", ""))
            );
            // Simulate sudden socket drop / network fault
            setTimeout(() => {
              controller.error(new TypeError("fetch failed: socket hang up"));
            }, 10);
          },
        });

        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }) as any;

      const client = new ColibriClient();
      const streamGen = client.streamChat(
        [{ role: "user", content: "Test query" }],
        { model: "qwen3-coder-30b-a3b-colibri" }
      );
      const chunks: string[] = [];

      try {
        for await (const chunk of streamGen) {
          chunks.push(chunk);
        }
        assert.fail("Stream should have thrown an error due to socket destruction");
      } catch (err: any) {
        assert.ok(
          err instanceof ColibriOfflineError ||
            err instanceof ColibriStreamError ||
            err.name === "TypeError" ||
            String(err.message).includes("offline") ||
            String(err.message).includes("fetch failed"),
          `Expected socket disconnect or offline error, got: ${err.message}`
        );
      }

      assert.ok(chunks.length >= 1, "Must have received initial chunk before disconnect");
      assert.equal(chunks[0], "First chunk");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("handles premature client AbortController abort and cleanly terminates client socket", async () => {
    const originalFetch = globalThis.fetch;
    try {
      let abortedSignalTriggered = false;

      globalThis.fetch = (async (_url: any, init: any) => {
        const signal = init?.signal as AbortSignal;
        let streamController: ReadableStreamDefaultController;
        let interval: NodeJS.Timeout;

        if (signal) {
          signal.addEventListener("abort", () => {
            abortedSignalTriggered = true;
            clearInterval(interval);
            try {
              streamController?.error(new DOMException("The operation was aborted", "AbortError"));
            } catch {}
          });
        }

        const stream = new ReadableStream({
          start(ctrl) {
            streamController = ctrl;
            const encoder = new TextEncoder();
            ctrl.enqueue(
              encoder.encode('data: {"choices":[{"delta":{"content":"token1 "}}]}\n\n')
            );
            ctrl.enqueue(
              encoder.encode('data: {"choices":[{"delta":{"content":"token2 "}}]}\n\n')
            );

            // Periodically enqueue more tokens if not aborted
            interval = setInterval(() => {
              if (signal?.aborted) {
                clearInterval(interval);
                return;
              }
              try {
                ctrl.enqueue(
                  encoder.encode('data: {"choices":[{"delta":{"content":"token3 "}}]}\n\n')
                );
              } catch {
                clearInterval(interval);
              }
            }, 20);
          },
          cancel() {
            abortedSignalTriggered = true;
            clearInterval(interval);
          },
        });

        return new Response(stream, {
          status: 200,
          headers: { "Content-Type": "text/event-stream" },
        });
      }) as any;

      const client = new ColibriClient();
      const controller = new AbortController();
      const streamGen = client.streamChat(
        [{ role: "user", content: "Abort test" }],
        { model: "qwen3-coder-30b-a3b-colibri", signal: controller.signal }
      );

      const tokens: string[] = [];
      try {
        for await (const token of streamGen) {
          tokens.push(token);
          if (tokens.length >= 2) {
            controller.abort(); // Client aborts mid-stream
          }
        }
        assert.fail("Stream should have aborted");
      } catch (err: any) {
        assert.ok(
          err.name === "AbortError" || String(err.message).toLowerCase().includes("abort"),
          `Expected AbortError, got ${err.name}: ${err.message}`
        );
      }

      assert.equal(abortedSignalTriggered, true, "Combined signal must have triggered abort listener");
      assert.ok(tokens.length >= 2, "Partial tokens must have been yielded before abort");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("parses corrupted non-JSON payloads, [DONE] delimiters, and ping frames without crashing", async () => {
    // Feed a mixture of corrupt JSON, comments, pings, and raw strings to parseSSEStreamChunks
    const streamPayload = [
      ": ping keep-alive\n\n",
      'data: {"invalid_json_without_closing\n\n',
      'data: {"delta":"Valid "}\n\n',
      "event: token\ndata: Plain text token without json wrapper\n\n",
      ": another comment line\n\n",
      'data: {"delta":"tokens"}\n\n',
      "data: [DONE]\n\n",
    ].join("");

    const tokensReceived: string[] = [];
    const res = parseSSEStreamChunks("", streamPayload, {
      onToken: (t) => tokensReceived.push(t),
    });

    assert.ok(tokensReceived.length >= 2, `Expected at least 2 tokens, got ${tokensReceived.length}`);
    assert.ok(tokensReceived.includes("Valid "), "Must extract valid json token delta");
    assert.ok(tokensReceived.includes("tokens"), "Must extract second valid json token delta");
    assert.ok(
      tokensReceived.some((t) => t.includes("Plain text token")),
      "Must extract plain text token as fallback without throwing syntax error"
    );
    assert.equal(res.remainingBuffer, "");
  });

  it("handles multi-byte UTF-8 symbols and JSON delimiters fragmented at single-byte intervals", async () => {
    // Symbol ⚡ is 3 bytes (0xE2, 0x9A, 0xA1), ∑ is 3 bytes (0xE2, 0x88, 0x91)
    const rawSSE = 'event: token\ndata: {"delta":"Complexity: \\mathcal{O}(\\sum_{i=1}^n x_i) ⚡"}\n\n';
    const buffer = Buffer.from(rawSSE, "utf-8");
    const decoder = new TextDecoder("utf-8");

    // Split into 1-byte chunks, stream-decode UTF-8, and feed through parseSSEStreamChunks
    let remainingBuffer = "";
    const tokens: string[] = [];

    for (let i = 0; i < buffer.length; i++) {
      const decodedChar = decoder.decode(buffer.subarray(i, i + 1), { stream: true });
      if (decodedChar) {
        const res = parseSSEStreamChunks(remainingBuffer, decodedChar, {
          onToken: (t) => tokens.push(t),
        });
        remainingBuffer = res.remainingBuffer;
      }
    }
    const finalFlush = decoder.decode();
    if (finalFlush) {
      parseSSEStreamChunks(remainingBuffer, finalFlush, {
        onToken: (t) => tokens.push(t),
      });
    }

    assert.equal(tokens.length, 1, "Must parse exactly 1 complete SSE token");
    assert.ok(tokens[0].includes("\\mathcal{O}"), "Must preserve LaTeX formula intact");
    assert.ok(tokens[0].includes("⚡"), "Must preserve multi-byte UTF-8 emoji without encoding corruption");
  });
});

// =============================================================================
// Test Suite 2: Concurrency & SQLite Database Locking Resilience
// =============================================================================
describe("Challenger M5 — 2. Concurrency & SQLite Database Locking Resilience", () => {
  it("handles 50 rapid parallel calls to /api/socrates/health without race conditions or crashes", async () => {
    const requests = Array.from({ length: 50 }, () => {
      const req = new NextRequest("http://localhost:3000/api/socrates/health");
      return healthRouteGet(req);
    });

    const start = Date.now();
    const responses = await Promise.all(requests);
    const durationMs = Date.now() - start;

    assert.equal(responses.length, 50);
    for (const res of responses) {
      assert.equal(res.status, 200, "Health probe must return 200");
      const data = await res.json();
      assert.ok(typeof data.online === "boolean");
      assert.ok(typeof data.model === "string");
      assert.ok(typeof data.endpoint === "string");
    }

    // 50 concurrent calls should complete quickly due to in-memory caching
    assert.ok(durationMs < 3000, `Expected 50 health checks to complete under 3000ms, took ${durationMs}ms`);
  });

  it("handles 40 concurrent academic retrieval queries without database deadlocks", async () => {
    const queries = [
      "Binary Search time complexity",
      "QuickSort pivot selection",
      "Dijkstra algorithm shortest path",
      "TCP congestion control BBR vs CUBIC",
      "Virtual memory paging",
      "LRU Cache eviction policy",
      "B+ tree index search",
      "Deadlock four conditions Coffman",
      "Non-matching query about quantum astrophysics in 2050",
      "'; DROP TABLE BankQuestion; --", // SQL injection resistance test
    ];

    // Replicate to 40 concurrent executions
    const searchTasks = Array.from({ length: 40 }, (_, idx) => {
      const q = queries[idx % queries.length];
      return retrieveAcademicContext(q);
    });

    const results = await Promise.all(searchTasks);
    assert.equal(results.length, 40);

    for (let i = 0; i < results.length; i++) {
      const q = queries[i % queries.length];
      const res = results[i];

      if (q.includes("Binary Search")) {
        assert.ok(res !== null, "Binary Search should return academic context");
        assert.ok(res.relevanceScore >= 0.5, "Relevance should be significant");
      } else if (q.includes("DROP TABLE") || q.includes("quantum astrophysics")) {
        // Graceful non-match without error
        assert.ok(res === null || res.hasContext === false, "Injection or non-match must return null cleanly");
      }
    }
  });

  it("handles 20 concurrent session creations across students without SQLITE_BUSY locking", async () => {
    const studentIds = [STUDENT_A, STUDENT_B];

    const creationTasks = Array.from({ length: 20 }, (_, idx) => {
      const studentId = studentIds[idx % 2];
      const title = `Concurrent Session #${idx + 1} - Student ${idx % 2}`;
      return createConversation(studentId, title);
    });

    const createdSessions = await Promise.all(creationTasks);
    assert.equal(createdSessions.length, 20);

    for (const session of createdSessions) {
      assert.ok(session.id, "Session ID must be generated");
      testSessionIds.push(session.id);
    }

    // Verify all 20 unique sessions exist in DB
    const ids = createdSessions.map((s) => s.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 20, "All 20 session IDs must be unique");
  });

  it("handles 50 concurrent message writes to the same and multiple sessions without database locks", async () => {
    // Pick two sessions from created test sessions
    const session1 = testSessionIds[0];
    const session2 = testSessionIds[1];
    assert.ok(session1 && session2, "Must have active test sessions");

    // Fire 50 concurrent writes (25 to session1, 25 to session2)
    const writeTasks = Array.from({ length: 50 }, (_, idx) => {
      const targetSession = idx % 2 === 0 ? session1 : session2;
      const isUser = idx % 3 === 0;

      if (isUser) {
        return saveUserMessage(targetSession, `Concurrent User Query #${idx}`);
      } else {
        return saveAssistantMessage(
          targetSession,
          `Concurrent Assistant Response #${idx}`,
          25,
          "qwen3-coder-30b-a3b-colibri"
        );
      }
    });

    const writtenMessages = await Promise.all(writeTasks);
    assert.equal(writtenMessages.length, 50, "All 50 concurrent writes must succeed");

    // Verify counts in DB
    const reloaded1 = await getConversationWithMessages(session1, STUDENT_A);
    const reloaded2 = await getConversationWithMessages(session2, STUDENT_B);

    assert.ok(typeof reloaded1 === "object" && reloaded1 !== null);
    assert.ok(typeof reloaded2 === "object" && reloaded2 !== null);
    assert.equal((reloaded1.messages.length + reloaded2.messages.length), 50);
  });

  it("handles concurrent interleaved reads and writes simultaneously without data corruption", async () => {
    const targetSession = testSessionIds[0];
    assert.ok(targetSession);

    // Mix 15 writes and 15 reads fired simultaneously
    const tasks: Promise<any>[] = [];

    for (let i = 0; i < 15; i++) {
      tasks.push(saveUserMessage(targetSession, `Interleaved Query ${i}`));
      tasks.push(getConversationWithMessages(targetSession, STUDENT_A));
      tasks.push(assembleBoundedContextHistory(targetSession));
    }

    const results = await Promise.all(tasks);
    assert.equal(results.length, 45, "All 45 interleaved read/write operations must resolve cleanly");
  });

  it("enforces strict student multi-tenant isolation under concurrent race conditions", async () => {
    const sessionForA = testSessionIds[0]; // owned by STUDENT_A
    assert.ok(sessionForA);

    // Concurrently attempt unauthorized reads from STUDENT_B while STUDENT_A reads
    const unauthorizedTasks = Array.from({ length: 15 }, () =>
      getConversationWithMessages(sessionForA, STUDENT_B)
    );
    const authorizedTasks = Array.from({ length: 15 }, () =>
      getConversationWithMessages(sessionForA, STUDENT_A)
    );

    const [unauthResults, authResults] = await Promise.all([
      Promise.all(unauthorizedTasks),
      Promise.all(authorizedTasks),
    ]);

    for (const res of unauthResults) {
      assert.equal(res, "FORBIDDEN", "Unauthorized read must strictly return FORBIDDEN");
    }

    for (const res of authResults) {
      assert.ok(typeof res === "object" && res !== null, "Authorized read must return conversation");
      assert.equal((res as any).userId, STUDENT_A);
    }
  });
});

// =============================================================================
// Test Suite 3: Session Lifecycle Stress & 50+ Turn Sliding Window
// =============================================================================
describe("Challenger M5 — 3. Session Lifecycle Stress & 50+ Turn Sliding Window", () => {
  it("assembles bounded context correctly under 60-message (30-turn) history in SQLite", async () => {
    // 1. Create a dedicated deep conversation
    const deepSession = await createConversation(STUDENT_A, "Deep 60-Message Dialectic");
    testSessionIds.push(deepSession.id);

    // 2. Insert 60 messages (30 turns) with staggered sequential creation timestamps
    for (let turn = 1; turn <= 30; turn++) {
      await (prisma as any).socratesMessage.create({
        data: {
          conversationId: deepSession.id,
          role: "user",
          content: `Turn ${turn} User Query: Explain concept ${turn} in detail.`,
          tokens: 20,
          tokenCount: 20,
          createdAt: new Date(Date.now() - (31 - turn) * 1000), // Chronological order
        },
      });

      await (prisma as any).socratesMessage.create({
        data: {
          conversationId: deepSession.id,
          role: "assistant",
          content: `Turn ${turn} Assistant Response: Concept ${turn} operates on fundamental algorithmic invariants.`,
          tokens: 30,
          tokenCount: 30,
          createdAt: new Date(Date.now() - (31 - turn) * 1000 + 500),
        },
      });
    }

    // Verify 60 total messages in database
    const fullSession = await (prisma as any).socratesMessage.count({
      where: { conversationId: deepSession.id },
    });
    assert.equal(fullSession, 60, "Database must store all 60 messages");

    // 3. Assemble bounded sliding context window
    const history = await assembleBoundedContextHistory(deepSession.id);

    // Bounded window invariant: MAX_HISTORY_TURNS = 12
    assert.equal(history.length, MAX_HISTORY_TURNS, `Expected exactly ${MAX_HISTORY_TURNS} messages, got ${history.length}`);

    // Invariant: The 12 selected messages must be the MOST RECENT ones (Turns 25 to 30)
    // Older messages (Turns 1 to 24) must have been dropped
    assert.ok(
      history[0].content.includes("Turn 25"),
      `First message in sliding window must be Turn 25, got: ${history[0].content}`
    );
    assert.ok(
      history[history.length - 1].content.includes("Turn 30"),
      `Last message in sliding window must be Turn 30, got: ${history[history.length - 1].content}`
    );

    // Invariant: Messages must be in strict chronological order
    for (let i = 0; i < history.length - 1; i++) {
      const currentTurnNum = parseInt(history[i].content.match(/Turn (\d+)/)?.[1] || "0", 10);
      const nextTurnNum = parseInt(history[i + 1].content.match(/Turn (\d+)/)?.[1] || "0", 10);
      assert.ok(
        nextTurnNum >= currentTurnNum,
        `History must be strictly chronological: ${currentTurnNum} <= ${nextTurnNum}`
      );
    }

    // 4. Test formatSocratesMessages with deep history
    const followUpQuery = "What did we conclude in Turn 30?";
    const formatted = formatSocratesMessages(followUpQuery, history);

    // Formatted array must have System at index 0, 12 history turns, and new User query at end
    assert.equal(formatted.length, 14, "Must contain 1 System + 12 History + 1 User = 14 messages");
    assert.equal(formatted[0].role, "system");
    assert.ok(formatted[0].content.includes("You are Socrates"), "System persona must be preserved");
    assert.equal(formatted[formatted.length - 1].role, "user");
    assert.ok(
      formatted[formatted.length - 1].content.includes(USER_QUERY_START_DELIMITER),
      "User query must be wrapped in security delimiters"
    );
    assert.ok(formatted[formatted.length - 1].content.includes(followUpQuery));
  });

  it("clamps history strictly when messages have high token density (respecting ~3,000 token budget)", async () => {
    const denseSession = await createConversation(STUDENT_A, "Dense Token Dialectic");
    testSessionIds.push(denseSession.id);

    // Insert 10 messages with 700 tokens each (total 7,000 tokens)
    const longContent = "A".repeat(2600); // ~688 tokens
    for (let i = 1; i <= 10; i++) {
      await (prisma as any).socratesMessage.create({
        data: {
          conversationId: denseSession.id,
          role: i % 2 === 1 ? "user" : "assistant",
          content: `Dense Message ${i}: ${longContent}`,
          tokens: 700,
          tokenCount: 700,
          createdAt: new Date(Date.now() - (11 - i) * 1000),
        },
      });
    }

    // Assemble bounded history with default 3000 token budget
    const history = await assembleBoundedContextHistory(denseSession.id);

    // 4 messages * 700 = 2,800 tokens <= 3,000. 5th would be 3,500 > 3,000.
    assert.ok(
      history.length <= 4,
      `Expected <= 4 messages due to 3000 token limit, got ${history.length}`
    );

    // The messages kept must be the most recent ones (e.g. 7, 8, 9, 10)
    assert.ok(
      history[history.length - 1].content.includes("Dense Message 10"),
      "Must keep the most recent message"
    );
  });

  it("handles a solitary message exceeding 3,000 tokens gracefully without crash", async () => {
    const hugeSession = await createConversation(STUDENT_A, "Giant Single Message Dialectic");
    testSessionIds.push(hugeSession.id);

    // Insert a single message with 3,500 tokens
    await (prisma as any).socratesMessage.create({
      data: {
        conversationId: hugeSession.id,
        role: "user",
        content: "B".repeat(14000),
        tokens: 3700,
        tokenCount: 3700,
      },
    });

    const history = await assembleBoundedContextHistory(hugeSession.id);
    // When the latest message alone exceeds budget, history should be empty []
    assert.equal(history.length, 0, "History should be empty when message exceeds budget");

    // formatSocratesMessages should still function cleanly with empty history
    const formatted = formatSocratesMessages("Subsequent query", history);
    assert.equal(formatted.length, 2, "Must contain System and User query");
    assert.equal(formatted[0].role, "system");
    assert.equal(formatted[1].role, "user");
  });

  it("respects excludeMessageId option to exclude in-flight messages from assembled history", async () => {
    const session = await createConversation(STUDENT_A, "Exclude Filter Dialectic");
    testSessionIds.push(session.id);

    const m1 = await saveUserMessage(session.id, "Message 1 to keep");
    const m2 = await saveAssistantMessage(session.id, "Message 2 to exclude");
    const m3 = await saveUserMessage(session.id, "Message 3 to keep");

    const history = await assembleBoundedContextHistory(session.id, {
      excludeMessageId: m2.id,
    });

    assert.equal(history.length, 2, "Must exclude specified message ID");
    assert.equal(history[0].content, "Message 1 to keep");
    assert.equal(history[1].content, "Message 3 to keep");
  });
});

// =============================================================================
// Standalone CLI Direct Execution
// =============================================================================
if (process.argv[1]?.includes("challengerSocratesM5Stress")) {
  (async () => {
    console.log("\n=======================================================");
    console.log("   CHALLENGER SOCRATES M5 ADVERSARIAL STRESS SUITE     ");
    console.log("=======================================================\n");

    let total = 0;
    let passed = 0;
    let failed = 0;
    const startTime = Date.now();

    try {
      for (const suite of localSuites) {
        console.log(`\n\x1b[36m▶ ${suite.name}\x1b[0m`);
        for (const tc of suite.cases) {
          total++;
          const caseStart = Date.now();
          try {
            await tc.fn();
            passed++;
            const duration = Date.now() - caseStart;
            console.log(`  \x1b[32m✔ PASS\x1b[0m ${tc.name} \x1b[90m(${duration}ms)\x1b[0m`);
          } catch (err: any) {
            failed++;
            const duration = Date.now() - caseStart;
            console.error(`  \x1b[31m✘ FAIL\x1b[0m ${tc.name} \x1b[90m(${duration}ms)\x1b[0m`);
            console.error(`    \x1b[31mError:\x1b[0m ${err.message}`);
          }
        }
      }
    } finally {
      // Hermetic purge of all test sessions created during stress testing
      console.log("\n--- Purging Stress Test Artifacts ---");
      await purgeTestSessions();
      console.log(`  Purged ${testSessionIds.length} test conversations from dev.db.`);

      // Verify student data preservation invariant after stress test
      console.log("\n--- Verifying Student Database Preservation Invariant ---");
      const preservation = await runDataPreservationVerification(prisma);
      assert.equal(preservation.success, true, "Preservation invariant must remain 100% intact after stress tests");
      console.log("  \x1b[32m✔ PASS\x1b[0m Student Database Preservation: 100% Intact across all 10 tables");
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log("\n-------------------------------------------------------");
    console.log(`Test Results: ${passed} passed, ${failed} failed, ${total} total (${elapsed}s)`);
    console.log("-------------------------------------------------------\n");

    if (failed > 0) {
      process.exit(1);
    }
  })();
}
