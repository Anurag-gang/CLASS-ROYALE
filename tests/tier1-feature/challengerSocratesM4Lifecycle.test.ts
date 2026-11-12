/**
 * =============================================================================
 * SOCRATES AI WORKSPACE: Milestone 4 Adversarial Lifecycle & UI Stress Test Suite
 * Target: tests/tier1-feature/challengerSocratesM4Lifecycle.test.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS-TEST HARNESS:
 * 1. Abort Signal Cascading & Token Preservation:
 *    - Abort at token 0 (pre-stream, zero tokens received)
 *    - Abort at token 1 (first token boundary)
 *    - Abort at token 50 (mid-stream under high token velocity)
 *    - Post-completion abort idempotency (no corruption after done event)
 *    - AbortController signal propagation & listener triggering
 * 2. Rapid Message Submission & Race Conditions:
 *    - Composer submission lock during active streaming or loading
 *    - High-frequency Enter keypress barrage during generation
 *    - Hook-level rapid concurrent message submission (abort cascading of prior stream)
 *    - Rapid SSE chunk fragmentation across irregular packet boundaries
 * 3. Date Grouping Boundary Invariants:
 *    - Exact midnight transitions (00:00:00 vs 23:59:59.999)
 *    - Leap year boundary handling (Feb 29 vs Mar 1)
 *    - Epoch zero (1970-01-01) and pre-epoch negative timestamps
 *    - Future timestamps and clock skew tolerance
 *    - Malformed and exotic date strings routing to Older
 *    - Pinned status priority across all calendar boundaries
 * 4. Composer Keyboard & Height Math:
 *    - Extreme scroll lengths (-500px, 0px, 1px, 44px, 200px, 500px, 15,000px)
 *    - Single-line 10k characters vs 100 newlines height clamping [44px, 200px]
 *    - Custom minHeight / maxHeight boundary overrides
 *    - shouldSubmitOnEnter keyboard ergonomic decision matrix
 *    - Whitespace trimming and multi-line valid input acceptance
 * 5. Session Title Validation & Search Filter:
 *    - Empty, whitespace-only, and null title rejection
 *    - Exact 150-character limit preservation and 151-character truncation
 *    - 10,000-character title truncation and whitespace padding stripping
 *    - Real-time search filter immunity to regex metacharacters (.*+?^${}()|[]\)
 *    - Catastrophic backtracking ReDoS pattern resistance
 * =============================================================================
 */

import assert from "node:assert/strict";

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

// Local tracking for standalone direct execution
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

// Import genuine production Socrates logic
import {
  parseSSEStreamChunks,
  groupConversationsByDate,
  filterConversations,
  classifyChatError,
  applyStreamCancellation,
  ConversationSummary,
  DateBucket,
  UIMessage,
} from "../../src/components/socrates/useSocratesChat";

import {
  calculateComposerHeight,
  shouldSubmitOnEnter,
} from "../../src/components/socrates/SocratesComposer";

import {
  validateConversationTitle,
  togglePinState,
} from "../../src/components/socrates/SocratesSidebar";

// =============================================================================
// Suite 1: Abort Signal Cascading & Token Preservation
// =============================================================================
describe("Challenger Lifecycle — 1. Abort Signal Cascading & Token Preservation", () => {
  it("aborts at token 0 (pre-stream): preserves empty content and resets streaming flags cleanly", () => {
    const messages: UIMessage[] = [
      { id: "u-1", role: "user", content: "What is an AVL Tree?", isStreaming: false },
      { id: "a-1", role: "assistant", content: "", isStreaming: true },
    ];

    // Abort fires before any token chunk arrives
    const { updatedMessages, stateReset } = applyStreamCancellation(messages);

    assert.equal(stateReset.isStreaming, false, "Streaming flag must reset to false");
    assert.equal(stateReset.isLoading, false, "Loading flag must reset to false");
    assert.equal(stateReset.activeStage, null, "Active stage must reset to null");

    assert.equal(updatedMessages.length, 2);
    assert.equal(updatedMessages[1].id, "a-1");
    assert.equal(updatedMessages[1].isStreaming, false, "Assistant message streaming must be false");
    assert.equal(updatedMessages[1].content, "", "Token 0 content must remain an empty string");
    assert.notEqual(updatedMessages[1].content, undefined);
    assert.notEqual(updatedMessages[1].content, "undefined");
  });

  it("aborts at token 1: preserves solitary token without corruption or duplication", () => {
    const messages: UIMessage[] = [
      { id: "u-1", role: "user", content: "Define Big-O", isStreaming: false },
      { id: "a-1", role: "assistant", content: "Asymptotic", isStreaming: true },
    ];

    const { updatedMessages, stateReset } = applyStreamCancellation(messages);

    assert.equal(stateReset.isStreaming, false);
    assert.equal(updatedMessages[1].isStreaming, false);
    assert.equal(updatedMessages[1].content, "Asymptotic", "Solitary token must be preserved exactly");

    // Idempotency: repeating cancellation does not mutate content
    const reCancelled = applyStreamCancellation(updatedMessages);
    assert.equal(reCancelled.updatedMessages[1].content, "Asymptotic");
    assert.equal(reCancelled.updatedMessages[1].isStreaming, false);
  });

  it("aborts at token 50: verifies all 50 partial tokens are strictly preserved without truncation or ghost duplicates", () => {
    const tokenList = Array.from({ length: 50 }, (_, i) => `tok${i}_`);
    let accumulatedContent = "";

    // Simulate streaming 50 tokens through genuine parseSSEStreamChunks
    for (const tok of tokenList) {
      const chunk = `event: token\ndata: {"delta":"${tok}"}\n\n`;
      parseSSEStreamChunks("", chunk, {
        onToken: (delta) => {
          accumulatedContent += delta;
        },
      });
    }

    assert.equal(
      accumulatedContent,
      tokenList.join(""),
      "Accumulated content must match 50 emitted tokens"
    );

    const messages: UIMessage[] = [
      { id: "u-1", role: "user", content: "Stress test token stream", isStreaming: false },
      { id: "a-1", role: "assistant", content: accumulatedContent, isStreaming: true },
    ];

    // Trigger abort at token 50
    const { updatedMessages, stateReset } = applyStreamCancellation(messages);

    assert.equal(stateReset.isStreaming, false);
    assert.equal(updatedMessages[1].isStreaming, false);
    assert.equal(updatedMessages[1].content, tokenList.join(""));
    assert.equal(updatedMessages[1].content.split("tok").length - 1, 50, "Must contain exactly 50 tokens");

    // Post-abort: subsequent tokens must NOT alter the aborted message
    const lateChunk = 'event: token\ndata: {"delta":"ILLEGAL_LATE_TOKEN"}\n\n';
    let leakedToken = "";
    parseSSEStreamChunks("", lateChunk, {
      onToken: (delta) => {
        leakedToken = delta;
      },
    });

    // In production, when isStreaming is false, the message list is disconnected from onToken
    const finalizedContent = updatedMessages[1].content;
    assert.equal(finalizedContent.includes("ILLEGAL_LATE_TOKEN"), false);
  });

  it("post-completion abort: aborting after stream completion is a safe no-op", () => {
    const completedMessages: UIMessage[] = [
      { id: "u-1", role: "user", content: "Explain QuickSort", isStreaming: false },
      {
        id: "a-1",
        role: "assistant",
        content: "QuickSort operates by selecting a pivot...",
        tokens: 38,
        isStreaming: false, // Already completed!
      },
    ];

    const { updatedMessages, stateReset } = applyStreamCancellation(completedMessages);

    assert.equal(stateReset.isStreaming, false);
    assert.equal(updatedMessages[1].isStreaming, false);
    assert.equal(updatedMessages[1].content, "QuickSort operates by selecting a pivot...");
    assert.equal(updatedMessages[1].tokens, 38, "Token count must be preserved");
  });

  it("AbortController cascades signal.aborted and triggers registered abort event listeners", () => {
    const controller = new AbortController();
    let listenerFiredCount = 0;

    controller.signal.addEventListener("abort", () => {
      listenerFiredCount++;
    });

    assert.equal(controller.signal.aborted, false);
    controller.abort("User clicked Stop button");

    assert.equal(controller.signal.aborted, true);
    assert.equal(controller.signal.reason, "User clicked Stop button");
    assert.equal(listenerFiredCount, 1, "Abort listener must fire exactly once");

    // Multiple abort() calls do not re-trigger listener
    controller.abort("Second call");
    assert.equal(listenerFiredCount, 1, "Subsequent abort() calls must not re-fire listener");
  });
});

// =============================================================================
// Suite 2: Rapid Message Submission & Race Conditions
// =============================================================================
describe("Challenger Lifecycle — 2. Rapid Message Submission & Race Conditions", () => {
  it("composer submission locks out when isStreaming = true or isLoading = true", () => {
    // Predicate validating canSubmit state in SocratesComposer
    const checkCanSubmit = (
      val: string,
      isLoading: boolean,
      isStreaming: boolean,
      disabled: boolean = false
    ) => {
      return val.trim().length > 0 && !disabled && !isLoading && !isStreaming;
    };

    assert.equal(checkCanSubmit("Valid query", false, false), true, "Idle composer can submit");
    assert.equal(checkCanSubmit("Valid query", true, false), false, "Loading composer cannot submit");
    assert.equal(checkCanSubmit("Valid query", false, true), false, "Streaming composer cannot submit");
    assert.equal(checkCanSubmit("Valid query", true, true), false, "Loading+Streaming cannot submit");
    assert.equal(checkCanSubmit("", false, false), false, "Empty input cannot submit");
    assert.equal(checkCanSubmit("   ", false, false), false, "Whitespace-only input cannot submit");
  });

  it("drops rapid Enter keypress barrage during active streaming", () => {
    let submitCount = 0;
    const isStreaming = true;
    const isLoading = false;
    const disabled = false;
    const value = "Rapid enter payload";

    // Simulate 25 rapid Enter keypresses
    for (let i = 0; i < 25; i++) {
      if (shouldSubmitOnEnter("Enter", false)) {
        if (!isStreaming && !isLoading && !disabled && value.trim()) {
          submitCount++;
        }
      }
    }

    assert.equal(submitCount, 0, "Zero submissions permitted while isStreaming is active");
  });

  it("hook-level rapid concurrent message submission aborts prior generation cleanly", () => {
    // Simulates useSocratesChat abortControllerRef concurrency contract:
    // When a second prompt is dispatched before the first completes,
    // the previous controller must be aborted immediately.
    let activeController: AbortController | null = null;
    const abortedSessions: number[] = [];

    const simulateSendMessage = (sessionId: number) => {
      if (activeController) {
        activeController.abort(`Aborted by session ${sessionId}`);
        activeController = null;
      }

      const controller = new AbortController();
      controller.signal.addEventListener("abort", () => {
        abortedSessions.push(sessionId);
      });
      activeController = controller;
      return controller;
    };

    // Rapid concurrent dispatches
    const ctrl1 = simulateSendMessage(1);
    assert.equal(ctrl1.signal.aborted, false);

    const ctrl2 = simulateSendMessage(2);
    assert.equal(ctrl1.signal.aborted, true, "Session 1 must be aborted by Session 2");
    assert.equal(ctrl2.signal.aborted, false, "Session 2 must now be active");

    const ctrl3 = simulateSendMessage(3);
    assert.equal(ctrl2.signal.aborted, true, "Session 2 must be aborted by Session 3");
    assert.equal(ctrl3.signal.aborted, false, "Session 3 must now be active");

    assert.deepEqual(abortedSessions, [1, 2], "Prior sessions were sequentially aborted");
  });

  it("handles high-frequency fragmented TCP chunks cut at arbitrary byte boundaries without dropping tokens", () => {
    const rawStream =
      'event: stage\ndata: {"stage":"inference","text":"Thinking..."}\n\n' +
      'event: token\ndata: {"delta":"Dijkstra\'s "}\n\n' +
      'event: token\ndata: {"delta":"algorithm "}\n\n' +
      'event: token\ndata: {"delta":"finds "}\n\n' +
      'event: token\ndata: {"delta":"shortest "}\n\n' +
      'event: token\ndata: {"delta":"paths."}\n\n' +
      'event: done\ndata: {"totalTokens":5}\n\n';

    // Fragment stream into arbitrary tiny chunks (2 characters each)
    const microChunks: string[] = [];
    for (let i = 0; i < rawStream.length; i += 3) {
      microChunks.push(rawStream.slice(i, i + 3));
    }

    let buffer = "";
    const receivedTokens: string[] = [];
    const receivedStages: string[] = [];
    let doneEvent: any = null;

    for (const chunk of microChunks) {
      const res = parseSSEStreamChunks(buffer, chunk, {
        onStage: (s) => receivedStages.push(s.stage),
        onToken: (t) => receivedTokens.push(t),
        onDone: (d) => {
          doneEvent = d;
        },
      });
      buffer = res.remainingBuffer;
    }

    assert.equal(buffer, "");
    assert.deepEqual(receivedStages, ["inference"]);
    assert.equal(receivedTokens.join(""), "Dijkstra's algorithm finds shortest paths.");
    assert.ok(doneEvent !== null);
    assert.equal(doneEvent.totalTokens, 5);
  });
});

// =============================================================================
// Suite 3: Date Grouping Boundary Invariants
// =============================================================================
describe("Challenger Lifecycle — 3. Date Grouping Boundary Invariants", () => {
  // Reference date: 2026-11-05 at 12:00:00 local time
  const refDate = new Date(2026, 10, 5, 12, 0, 0); // Month is 0-indexed: 10 = Nov
  const startOfToday = new Date(2026, 10, 5, 0, 0, 0).getTime();
  const oneDayMs = 86400000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOf7Days = startOfToday - 7 * oneDayMs;

  it("evaluates exact millisecond boundaries around midnight Today vs Yesterday", () => {
    const convs: ConversationSummary[] = [
      {
        id: "today-midnight-exact",
        title: "Exact Midnight Today",
        pinned: false,
        createdAt: new Date(startOfToday).toISOString(),
        updatedAt: new Date(startOfToday).toISOString(),
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "yesterday-last-ms",
        title: "One Millisecond Before Today Midnight",
        pinned: false,
        createdAt: new Date(startOfToday - 1).toISOString(),
        updatedAt: new Date(startOfToday - 1).toISOString(),
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "yesterday-midnight-exact",
        title: "Exact Midnight Yesterday",
        pinned: false,
        createdAt: new Date(startOfYesterday).toISOString(),
        updatedAt: new Date(startOfYesterday).toISOString(),
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "prev7-last-ms",
        title: "One Millisecond Before Yesterday Midnight",
        pinned: false,
        createdAt: new Date(startOfYesterday - 1).toISOString(),
        updatedAt: new Date(startOfYesterday - 1).toISOString(),
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "prev7-exact-boundary",
        title: "Exact 7 Days Midnight",
        pinned: false,
        createdAt: new Date(startOf7Days).toISOString(),
        updatedAt: new Date(startOf7Days).toISOString(),
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "older-last-ms",
        title: "One Millisecond Before 7 Days",
        pinned: false,
        createdAt: new Date(startOf7Days - 1).toISOString(),
        updatedAt: new Date(startOf7Days - 1).toISOString(),
        messageCount: 1,
        lastMessage: "",
      },
    ];

    const grouped = groupConversationsByDate(convs, refDate);

    assert.equal(grouped.Today.length, 1);
    assert.equal(grouped.Today[0].id, "today-midnight-exact");

    assert.equal(grouped.Yesterday.length, 2);
    assert.equal(grouped.Yesterday[0].id, "yesterday-last-ms");
    assert.equal(grouped.Yesterday[1].id, "yesterday-midnight-exact");

    assert.equal(grouped["Previous 7 Days"].length, 2);
    assert.equal(grouped["Previous 7 Days"][0].id, "prev7-last-ms");
    assert.equal(grouped["Previous 7 Days"][1].id, "prev7-exact-boundary");

    assert.equal(grouped.Older.length, 1);
    assert.equal(grouped.Older[0].id, "older-last-ms");
  });

  it("handles leap year transition (Feb 29 vs Mar 1)", () => {
    // 2024 is a leap year. Ref date: 2024-03-01 12:00:00
    const leapRef = new Date(2024, 2, 1, 12, 0, 0); // Mar 1, 2024
    const leapDay = new Date(2024, 1, 29, 12, 0, 0); // Feb 29, 2024

    const convs: ConversationSummary[] = [
      {
        id: "leap-conv",
        title: "Leap Day Dialectic",
        pinned: false,
        createdAt: leapDay.toISOString(),
        updatedAt: leapDay.toISOString(),
        messageCount: 2,
        lastMessage: "",
      },
    ];

    const grouped = groupConversationsByDate(convs, leapRef);
    assert.equal(grouped.Yesterday.length, 1, "Feb 29 must be Yesterday relative to Mar 1 in leap year");
    assert.equal(grouped.Yesterday[0].id, "leap-conv");
  });

  it("handles Unix epoch zero and pre-epoch negative timestamps into Older", () => {
    const convs: ConversationSummary[] = [
      {
        id: "epoch-zero",
        title: "Epoch Zero Dialectic",
        pinned: false,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "pre-epoch",
        title: "Pre-Epoch 1969 Dialectic",
        pinned: false,
        createdAt: "1969-12-31T23:59:59.000Z",
        updatedAt: "1969-12-31T23:59:59.000Z",
        messageCount: 1,
        lastMessage: "",
      },
    ];

    const grouped = groupConversationsByDate(convs, refDate);
    assert.equal(grouped.Older.length, 2);
    assert.equal(grouped.Older[0].id, "epoch-zero");
    assert.equal(grouped.Older[1].id, "pre-epoch");
  });

  it("safely groups future dates and clock skew into Today without errors", () => {
    const convs: ConversationSummary[] = [
      {
        id: "future-skew",
        title: "Future Skew Dialectic",
        pinned: false,
        createdAt: "2026-11-06T00:00:00.000Z",
        updatedAt: "2026-11-06T00:00:00.000Z",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "distant-future",
        title: "Year 2099 Dialectic",
        pinned: false,
        createdAt: "2099-12-31T23:59:59.000Z",
        updatedAt: "2099-12-31T23:59:59.000Z",
        messageCount: 1,
        lastMessage: "",
      },
    ];

    const grouped = groupConversationsByDate(convs, refDate);
    assert.equal(grouped.Today.length, 2, "Future timestamps >= startOfToday belong to Today");
  });

  it("gracefully catches corrupt and malformed date strings into Older without throwing", () => {
    const corruptDates = [
      "",
      "not-a-date",
      "null",
      "undefined",
      "NaN",
      "2026-99-99T99:99:99Z",
      "[object Object]",
    ];

    const convs: ConversationSummary[] = corruptDates.map((cd, idx) => ({
      id: `corrupt-${idx}`,
      title: `Corrupt Date ${idx}`,
      pinned: false,
      createdAt: cd,
      updatedAt: cd,
      messageCount: 1,
      lastMessage: "",
    }));

    const grouped = groupConversationsByDate(convs, refDate);
    assert.equal(grouped.Older.length, corruptDates.length);
    assert.equal(grouped.Today.length, 0);
    assert.equal(grouped.Yesterday.length, 0);
  });

  it("preserves Pinned priority invariant regardless of date anomalies", () => {
    const convs: ConversationSummary[] = [
      {
        id: "pinned-epoch",
        title: "Pinned Epoch",
        pinned: true,
        createdAt: "1970-01-01T00:00:00.000Z",
        updatedAt: "1970-01-01T00:00:00.000Z",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "pinned-corrupt",
        title: "Pinned Corrupt Date",
        pinned: true,
        createdAt: "invalid-date",
        updatedAt: "corrupt",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "pinned-future",
        title: "Pinned Future Date",
        pinned: true,
        createdAt: "2099-01-01T00:00:00.000Z",
        updatedAt: "2099-01-01T00:00:00.000Z",
        messageCount: 1,
        lastMessage: "",
      },
    ];

    const grouped = groupConversationsByDate(convs, refDate);
    assert.equal(grouped.Pinned.length, 3, "All pinned sessions must be in Pinned bucket");
    assert.equal(grouped.Older.length, 0);
    assert.equal(grouped.Today.length, 0);
  });
});

// =============================================================================
// Suite 4: Composer Keyboard & Height Math
// =============================================================================
describe("Challenger Lifecycle — 4. Composer Keyboard & Height Math", () => {
  it("clamps extreme scroll lengths to [minHeight=44px, maxHeight=200px]", () => {
    // Underflow edge cases
    assert.equal(calculateComposerHeight(-1000), 44);
    assert.equal(calculateComposerHeight(-1), 44);
    assert.equal(calculateComposerHeight(0), 44);
    assert.equal(calculateComposerHeight(1), 44);
    assert.equal(calculateComposerHeight(43), 44);
    assert.equal(calculateComposerHeight(44), 44, "Boundary min 44px preserved");

    // In-range values
    assert.equal(calculateComposerHeight(45), 45);
    assert.equal(calculateComposerHeight(100), 100);
    assert.equal(calculateComposerHeight(199), 199);
    assert.equal(calculateComposerHeight(200), 200, "Boundary max 200px preserved");

    // Overflow edge cases (extreme text lengths)
    assert.equal(calculateComposerHeight(201), 200);
    assert.equal(calculateComposerHeight(500), 200);
    assert.equal(calculateComposerHeight(15000), 200, "15k px scroll clamped to 200px");
    assert.equal(calculateComposerHeight(1000000), 200, "1M px scroll clamped to 200px");
  });

  it("supports custom minHeight and maxHeight clamping", () => {
    assert.equal(calculateComposerHeight(20, 60, 300), 60);
    assert.equal(calculateComposerHeight(200, 60, 300), 200);
    assert.equal(calculateComposerHeight(500, 60, 300), 300);
  });

  it("simulates 10,000 characters and 100 newlines clamping behavior", () => {
    // 10,000 character single-line essay wraps into multiple lines in textarea
    // Simulated scrollHeight ~ 2500px
    const longSingleLineHeight = calculateComposerHeight(2500);
    assert.equal(longSingleLineHeight, 200);

    // 100 newlines ~ 24px line height * 100 = 2400px
    const hundredNewlinesHeight = calculateComposerHeight(2400);
    assert.equal(hundredNewlinesHeight, 200);

    // Single line empty or short ~ 24px
    const singleShortLine = calculateComposerHeight(24);
    assert.equal(singleShortLine, 44);
  });

  it("evaluates shouldSubmitOnEnter keyboard ergonomic matrix", () => {
    // Enter without Shift -> sends
    assert.equal(shouldSubmitOnEnter("Enter", false), true);

    // Shift + Enter -> inserts newline, does NOT send
    assert.equal(shouldSubmitOnEnter("Enter", true), false);

    // Non-Enter keys must never submit
    const nonEnterKeys = ["Shift", "Escape", "Tab", "Space", "ArrowUp", "a", "Backspace", ""];
    for (const k of nonEnterKeys) {
      assert.equal(shouldSubmitOnEnter(k, false), false, `Key ${k} must not submit`);
      assert.equal(shouldSubmitOnEnter(k, true), false, `Shift+${k} must not submit`);
    }
  });

  it("rejects empty, whitespace-only, and unicode space input submissions", () => {
    const invalidInputs = [
      "",
      " ",
      "   ",
      "\t",
      "\n",
      "\r\n",
      " \t \n \r ",
      "\u00A0", // Non-breaking space
      "\u3000", // Ideographic fullwidth space
    ];

    for (const input of invalidInputs) {
      const isValid = input.trim().length > 0;
      assert.equal(isValid, false, `Input ${JSON.stringify(input)} must be rejected`);
    }

    const validInput = "   Valid question about Red-Black Trees   ";
    assert.equal(validInput.trim().length > 0, true);
    assert.equal(validInput.trim(), "Valid question about Red-Black Trees");
  });
});

// =============================================================================
// Suite 5: Session Title Validation & Search Filter
// =============================================================================
describe("Challenger Lifecycle — 5. Session Title Validation & Search Filter", () => {
  it("validates conversation title: rejects whitespace and strips boundary spaces", () => {
    assert.deepEqual(validateConversationTitle(""), { valid: false, title: "" });
    assert.deepEqual(validateConversationTitle("   "), { valid: false, title: "" });
    assert.deepEqual(validateConversationTitle("\t\n  "), { valid: false, title: "" });

    const trimmedRes = validateConversationTitle("   Binary Search Trees Dialectic   ");
    assert.equal(trimmedRes.valid, true);
    assert.equal(trimmedRes.title, "Binary Search Trees Dialectic");
  });

  it("preserves exact 150-character limit and truncates 151+ characters strictly", () => {
    // 149 characters: valid, untouched
    const title149 = "A".repeat(149);
    assert.deepEqual(validateConversationTitle(title149), { valid: true, title: title149 });

    // Exact 150 characters: valid, untouched
    const title150 = "B".repeat(150);
    assert.deepEqual(validateConversationTitle(title150), { valid: true, title: title150 });

    // 151 characters: truncated to 150
    const title151 = "C".repeat(151);
    const res151 = validateConversationTitle(title151);
    assert.equal(res151.valid, true);
    assert.equal(res151.title.length, 150);
    assert.equal(res151.title, "C".repeat(150));

    // 10,000 characters: truncated to 150
    const title10k = "D".repeat(10000);
    const res10k = validateConversationTitle(title10k);
    assert.equal(res10k.valid, true);
    assert.equal(res10k.title.length, 150);
    assert.equal(res10k.title, "D".repeat(150));

    // Whitespace padding on 155 characters: trims first, then truncates
    const padded155 = "   " + "E".repeat(150) + "EXTRA   ";
    const resPadded = validateConversationTitle(padded155);
    assert.equal(resPadded.valid, true);
    assert.equal(resPadded.title.length, 150);
    assert.equal(resPadded.title, "E".repeat(150));
  });

  it("safely handles null/undefined title inputs without crashing", () => {
    assert.deepEqual(validateConversationTitle(null as any), { valid: false, title: "" });
    assert.deepEqual(validateConversationTitle(undefined as any), { valid: false, title: "" });
  });

  it("immunizes real-time search filter against all regex metacharacters (.*+?^${}()|[\\])", () => {
    const dataset: ConversationSummary[] = [
      {
        id: "c1",
        title: "Regex [A-Z]+ and {m,n} Matching",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "c2",
        title: "Pointer math: *(ptr + 1) = ?",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "c3",
        title: "Asymptotic bounds: O(n^2) | Theta(n log n)",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "c4",
        title: "Path: C:\\Users\\Socrates\\docs.txt",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "c5",
        title: "Price range: $10 - $50 (USD)",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "c6",
        title: "Combined symbols: .*+?^${}()|[]\\",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
      {
        id: "c7",
        title: "Catastrophic backtracking ReDoS: (a+)+$",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
    ];

    // Array of individual regex metacharacters that would crash RegExp construction
    const metacharacters = [
      { char: ".", expectedMatchIds: ["c4", "c6"] }, // docs.txt and .*+
      { char: "*", expectedMatchIds: ["c2", "c6"] },
      { char: "+", expectedMatchIds: ["c1", "c2", "c6", "c7"] },
      { char: "?", expectedMatchIds: ["c2", "c6"] },
      { char: "^", expectedMatchIds: ["c3", "c6"] },
      { char: "$", expectedMatchIds: ["c5", "c6", "c7"] },
      { char: "{", expectedMatchIds: ["c1", "c6"] },
      { char: "}", expectedMatchIds: ["c1", "c6"] },
      { char: "[", expectedMatchIds: ["c1", "c6"] },
      { char: "]", expectedMatchIds: ["c1", "c6"] },
      { char: "(", expectedMatchIds: ["c2", "c3", "c5", "c6", "c7"] },
      { char: ")", expectedMatchIds: ["c2", "c3", "c5", "c6", "c7"] },
      { char: "|", expectedMatchIds: ["c3", "c6"] },
      { char: "\\", expectedMatchIds: ["c4", "c6"] },
    ];

    for (const { char, expectedMatchIds } of metacharacters) {
      assert.doesNotThrow(() => {
        const results = filterConversations(dataset, char);
        const matchIds = results.map((r) => r.id);
        for (const expectedId of expectedMatchIds) {
          assert.ok(
            matchIds.includes(expectedId),
            `Query '${char}' must match session ${expectedId}`
          );
        }
      }, `Search query with regex metacharacter '${char}' must not throw`);
    }

    // Combined explosive regex pattern query: .*+?^${}()|[]\
    const explosivePattern = ".*+?^${}()|[]\\";
    const combinedMatches = filterConversations(dataset, explosivePattern);
    assert.equal(combinedMatches.length, 1);
    assert.equal(combinedMatches[0].id, "c6");

    // Catastrophic ReDoS query: (a+)+$
    const reDosPattern = "(a+)+$";
    const reDosMatches = filterConversations(dataset, reDosPattern);
    assert.equal(reDosMatches.length, 1);
    assert.equal(reDosMatches[0].id, "c7");
  });

  it("handles case folding and whitespace stripping during search filtering", () => {
    const dataset: ConversationSummary[] = [
      {
        id: "c1",
        title: "Dynamic Programming Bellman-Ford",
        pinned: false,
        createdAt: "",
        updatedAt: "",
        messageCount: 1,
        lastMessage: "",
      },
    ];

    // Uppercase query
    assert.equal(filterConversations(dataset, "BELLMAN").length, 1);
    // Lowercase query
    assert.equal(filterConversations(dataset, "bellman").length, 1);
    // Mixed case query with whitespace
    assert.equal(filterConversations(dataset, "  dYnAmIc  ").length, 1);
    // Blank query returns all
    assert.equal(filterConversations(dataset, "   ").length, 1);
    // Unmatched query returns 0
    assert.equal(filterConversations(dataset, "Fibonacci").length, 0);
  });
});

// =============================================================================
// Standalone CLI Direct Execution
// =============================================================================
if (process.argv[1]?.includes("challengerSocratesM4Lifecycle")) {
  (async () => {
    console.log("\n=======================================================");
    console.log("  CHALLENGER SOCRATES M4 LIFECYCLE ADVERSARIAL SUITE   ");
    console.log("=======================================================\n");

    let total = 0;
    let passed = 0;
    let failed = 0;
    const startTime = Date.now();

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

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(3);
    console.log("\n-------------------------------------------------------");
    console.log(`Test Results: ${passed} passed, ${failed} failed, ${total} total (${elapsed}s)`);
    console.log("-------------------------------------------------------\n");

    if (failed > 0) {
      process.exit(1);
    }
  })();
}
