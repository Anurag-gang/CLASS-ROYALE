import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AIProviderFactory } from "@/lib/ai/providers/AIProviderFactory";
import { AIMessage } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

// Standard Socratic Knowledge Matrix Fallback
const PRESET_TOPICS: Record<string, string> = {
  "binary search": `🏛️ **SOCRATES ON BINARY SEARCH**
1. **The Core Intuition:** Imagine looking for a word in a 1,000-page dictionary. You don't read page by page; you open directly to the middle. If your word is further ahead, you throw away the first 500 pages.
2. **First Principle:** The sequence must be sorted (monotonic).
3. **Execution Steps:**
   - \`low = 0\`, \`high = n - 1\`.
   - \`mid = Math.floor((low + high) / 2)\`.
   - If \`target === arr[mid]\`, you found it!
   - If \`target < arr[mid]\`, discard the right half: \`high = mid - 1\`.
   - Else, discard the left half: \`low = mid + 1\`.
4. **Time Complexity:** **O(log n)** — Even for 1,000,000 elements, it takes at most 20 comparisons!
5. **Dialectic Question:** *Why would Binary Search completely fail if an array is unsorted?*`,

  "next.js": `🏛️ **SOCRATES ON NEXT.JS APP ROUTER**
1. **The Server-First Paradigm:** Components run on the server by default. No client JavaScript bundle is downloaded for static UI.
2. **The Client Boundary:** Only add \`"use client"\` when you need browser interactivity (like \`useState\`, \`useEffect\`, or \`onClick\`).
3. **Dynamic Routes:** In modern Next.js, route parameters are asynchronous promises: always await them!
4. **Dialectic Question:** *If a component only renders HTML and never changes, why should the user's browser execute JavaScript to build it?*`,

  "dynamic programming": `🏛️ **SOCRATES ON DYNAMIC PROGRAMMING**
1. **The Golden Rule:** Never solve the exact same subproblem twice. If you calculate \`fib(4)\`, remember it!
2. **Two Key Invariants:**
   - **Overlapping Subproblems:** The problem breaks down into identical smaller questions.
   - **Optimal Substructure:** The optimal solution to the large problem is built from optimal solutions to its parts.
3. **Approaches:**
   - *Top-Down with Memoization:* Natural recursive thinking + cache dictionary.
   - *Bottom-Up Tabulation:* Iterative table filling from base cases up.
4. **Dialectic Question:** *How does a dynamic programming cache transform an O(2^n) exponential tree into an O(n) linear line?*`,

  "big o": `🏛️ **SOCRATES ON TIME COMPLEXITY**
- **O(1) [Instant]:** Direct array index or hash map lookup.
- **O(log n) [Bisection]:** Halving the problem space each iteration (Binary Search).
- **O(n) [Linear]:** Single loop over all elements.
- **O(n log n) [Linearithmic]:** Optimal comparison sorting (Merge Sort, Quick Sort).
- **O(n²) [Quadratic]:** Nested loops comparing all pairs.
- **Dialectic Question:** *If an algorithm takes 10 seconds for 1,000 items, how long will it take for 2,000 items under O(n) versus O(n²)?*`,
};

const SOCRATES_SYSTEM_PROMPT = `You are Socrates, the classical philosophical AI tutor for Class Royale.
Your mission is to guide scholars through the Socratic method:
1. Question assumptions and examine first principles.
2. Never give away the multiple-choice answer outright; help the student realize the answer themselves through guided reasoning.
3. If provided with a question or code dilemma, deconstruct invariants, edge cases, and algorithmic complexity.
4. Keep explanations structured, punchy, and academically rigorous.
5. Use markdown formatting with clean code blocks and LaTeX math notation: $\\mathcal{O}(\\cdot)$.
6. Always end with a thought-provoking dialectic question to test understanding.`;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = {};
      }
    }

    const { message, questionId, questionText, mode = "mentor", stream = false } = body;

    const trimmedMsg = (message || questionText || "").trim();
    if (!trimmedMsg && !questionId) {
      return NextResponse.json({ error: "Message prompt or questionId is required." }, { status: 400 });
    }

    const lower = trimmedMsg.toLowerCase();

    // -------------------------------------------------------------------------
    // STEP 1: Ground in Canonical Question Bank (Prisma)
    // -------------------------------------------------------------------------
    let canonicalQuestion: any = null;

    if (questionId) {
      canonicalQuestion = await prisma.bankQuestion.findUnique({
        where: { id: questionId },
        include: { subject: true },
      });
    }

    if (!canonicalQuestion && trimmedMsg.length > 5) {
      const matching = await prisma.bankQuestion.findMany({
        where: {
          OR: [
            { questionText: { contains: trimmedMsg.slice(0, 35) } },
            { topic: { contains: trimmedMsg.slice(0, 25) } },
            { subtopic: { contains: trimmedMsg.slice(0, 25) } },
          ],
        },
        include: { subject: true },
        take: 1,
      });

      if (matching.length > 0) {
        canonicalQuestion = matching[0];
      }
    }

    // -------------------------------------------------------------------------
    // STEP 2: Resolve AI Provider (Colibri local inference or Socratic fallback)
    // -------------------------------------------------------------------------
    const provider = await AIProviderFactory.getProvider();
    const isColibriActive = provider.id === "colibri-local";

    // -------------------------------------------------------------------------
    // STEP 3: If Streaming is Requested
    // -------------------------------------------------------------------------
    if (stream) {
      const contextPrompt = buildSocratesPrompt(trimmedMsg, canonicalQuestion, mode);
      const messages: AIMessage[] = [
        { role: "system", content: SOCRATES_SYSTEM_PROMPT },
        { role: "user", content: contextPrompt },
      ];

      const encoder = new TextEncoder();
      const streamGenerator = provider.streamChat(messages, { mode });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamGenerator) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err: any) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err?.message || "Stream error" })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // -------------------------------------------------------------------------
    // STEP 4: Non-Streaming Request
    // -------------------------------------------------------------------------
    let reply = "";

    // If Colibri is healthy and active, let Colibri synthesize the Socratic dialogue
    if (isColibriActive) {
      try {
        const contextPrompt = buildSocratesPrompt(trimmedMsg, canonicalQuestion, mode);
        const res = await provider.chat([
          { role: "system", content: SOCRATES_SYSTEM_PROMPT },
          { role: "user", content: contextPrompt },
        ]);
        if (res.content && res.content.trim()) {
          reply = res.content.trim();
        }
      } catch (err) {
        console.warn("[Socrates Route] Colibri chat call failed, falling back to canonical matrix:", err);
      }
    }

    // If Colibri was unavailable or returned empty, use Canonical Database Grounding or Matrix
    if (!reply) {
      if (canonicalQuestion) {
        const options = JSON.parse(canonicalQuestion.optionsJson || "[]");
        const correctOpt = options.find((o: any) => o.id === canonicalQuestion.correctOptionId);
        const correctText = correctOpt ? correctOpt.text : canonicalQuestion.correctOptionId;

        reply = `🏛️ **SOCRATES DIALECTIC: ${canonicalQuestion.topic || "ACADEMIC CHALLENGE"}**

*"Let us examine this proposition together, Scholar."*

### 📋 The Challenge:
> ${canonicalQuestion.questionText}

${canonicalQuestion.codeSnippet ? `\`\`\`${canonicalQuestion.codeSnippet.includes("SELECT") ? "sql" : "typescript"}\n${canonicalQuestion.codeSnippet}\n\`\`\`\n` : ""}

### 💡 Core First Principle:
${canonicalQuestion.explanation}

### 🎯 Correct Resolution:
- **Option ${canonicalQuestion.correctOptionId}:** \`${correctText}\`
- **Why this holds true:** This directly satisfies the fundamental invariant of ${canonicalQuestion.topic || "the domain"}.

${canonicalQuestion.misconceptionExplanation ? `### ⚠️ Common Pitfall & Misconception:\n${canonicalQuestion.misconceptionExplanation}\n` : ""}

${canonicalQuestion.hint ? `### 🧭 Socratic Hint:\n*${canonicalQuestion.hint}*\n` : ""}

${canonicalQuestion.referenceSource ? `📚 *Canonical Reference: ${canonicalQuestion.referenceSource}*\n` : ""}

---
**Socratic Check for Understanding:**
*If we altered the constraints or input state, how would your reasoning adapt? Propose your hypothesis below.*`;
      } else {
        // High-speed Local Socratic Knowledge Engine Match
        for (const [key, text] of Object.entries(PRESET_TOPICS)) {
          if (lower.includes(key)) {
            reply = text;
            break;
          }
        }

        if (!reply) {
          const related = await prisma.bankQuestion.findMany({
            where: {
              OR: [
                { topic: { contains: trimmedMsg.split(" ")[0] } },
                { tagsJson: { contains: trimmedMsg.split(" ")[0] } },
              ],
            },
            take: 3,
          });

          if (related.length > 0) {
            const topicList = Array.from(new Set(related.map((q: any) => q.topic).filter(Boolean))).join(", ");
            reply = `🏛️ **SOCRATES:**
*"You inquire regarding '${trimmedMsg}'."*

Let us deconstruct this concept from first principles:
1. **Core Premise:** What fundamental state or invariant must hold before we apply an algorithm or system design here?
2. **Related Canonical Topics in our Question Bank:** ${topicList}
3. **Step-by-Step Dialectic:** Propose your current hypothesis or edge-case scenario, and we shall test its validity together.

*What is the primary constraint or bottleneck you are examining?*`;
          } else if (mode === "quiz") {
            reply = `⚔️ **SOCRATES ARENA COACH**
Before facing a battle challenge, consider:
- **Constraint Boundaries:** Does N <= 10^5 demand O(n log n) or O(n)?
- **Corner Invariants:** Have you tested empty inputs, duplicates, or extreme values?
- **Inductive Step:** What invariant guarantees loop termination?
Inquire on *Binary Search* or *Big O* for a targeted dialectic drill.`;
          } else if (mode === "code") {
            reply = `💻 **SOCRATES CODE LAB**
\`\`\`typescript
// Socratic functional invariant
export function filterTruth<T>(items: T[]): T[] {
  return items.filter(Boolean);
}
\`\`\`
Submit your code snippet or algorithmic dilemma to examine together from first principles.`;
          } else {
            reply = `🏛️ **SOCRATES:**
*"Greetings, scholar. You inquire: '${trimmedMsg}'"*

- **First Principle:** What core assumption underpins this question?
- **Dialectic Inquiry:** Can we break it into minimal irreducible components?
- Inquire about *Binary Search*, *Next.js*, *Dynamic Programming*, or *Big O* for immediate dialectic analysis.`;
          }
        }
      }
    }

    return NextResponse.json({
      reply,
      mode,
      source: isColibriActive ? "colibri-local" : "socratic-offline-fallback",
      provider: provider.id,
      model: await provider.getModelId(),
      questionId: canonicalQuestion?.id,
      topic: canonicalQuestion?.topic,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("AI Tutor Route Error:", error);
    return NextResponse.json(
      { error: "AI Tutor connection failed: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}

function buildSocratesPrompt(userMessage: string, canonicalQuestion: any, mode: string): string {
  if (!canonicalQuestion) {
    return `Student Query: "${userMessage}"\nMode: ${mode}\nApply Socratic dialectic questioning.`;
  }

  const options = JSON.parse(canonicalQuestion.optionsJson || "[]");
  return `CANONICAL ACADEMIC QUESTION CONTEXT (FROM DATABASE):
- Topic: ${canonicalQuestion.topic}
- Question Text: "${canonicalQuestion.questionText}"
- Code Snippet: ${canonicalQuestion.codeSnippet || "None"}
- Options: ${JSON.stringify(options)}
- Correct Option: ${canonicalQuestion.correctOptionId}
- Explanation: ${canonicalQuestion.explanation}
- Common Misconception: ${canonicalQuestion.misconceptionExplanation || "None"}
- Pedagogical Hint: ${canonicalQuestion.hint || "None"}

STUDENT INQUIRY: "${userMessage}"
MODE: ${mode}

INSTRUCTIONS:
Lead the student to understand the principle behind this question without directly revealing Option ${canonicalQuestion.correctOptionId} immediately. Unpack the misconception, test their assumptions, and ask a follow-up dialectic question.`;
}
