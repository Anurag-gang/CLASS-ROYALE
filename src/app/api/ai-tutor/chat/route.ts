import { NextRequest, NextResponse } from "next/server";

// 8-Bit Knowledge Matrix for PixelSage AI Mentor
const PRESET_TOPICS: Record<string, string> = {
  "binary search": `⚔️ **PIXEL SAGE: BINARY SEARCH**
1. Array MUST be sorted in ascending order.
2. Initialize pointers: \`low = 0\`, \`high = n - 1\`.
3. Compute midpoint: \`mid = Math.floor((low + high) / 2)\`.
4. If \`target === arr[mid]\`, target acquired! Return \`mid\`.
5. If \`target < arr[mid]\`, search left half: \`high = mid - 1\`.
6. Else, search right half: \`low = mid + 1\`.
*Complexity:* **O(log n)** — Logarithmic precision.`,

  "next.js": `🛡️ **PIXEL SAGE: NEXT.JS APP ROUTER**
- Server Components by default for zero client-bundle overhead.
- Add \`"use client"\` only for interactivity or browser listeners.
- Dynamic route params must be awaited: \`const { id } = await params;\`.
- Wrap components reading \`useSearchParams()\` inside a \`<Suspense>\` boundary.`,

  "dynamic programming": `💎 **PIXEL SAGE: DYNAMIC PROGRAMMING**
- **Core Rule:** Never compute the same subproblem twice.
- **1. State:** Define \`dp[i]\` (e.g. max XP at step \`i\`).
- **2. Transition:** \`dp[i] = Math.max(dp[i-1], dp[i-2] + loot[i])\`.
- **3. Base Case:** \`dp[0] = 0\`, \`dp[1] = loot[1]\`.
- Choose memoization (top-down) or tabulation (bottom-up).`,

  "rsa": `📜 **PIXEL SAGE: RSA CIPHER**
1. Pick primes: \`p\` and \`q\`.
2. Compute modulus: \`n = p * q\` and totient \`phi(n) = (p-1)*(q-1)\`.
3. Pick public exponent \`e\` coprime to \`phi(n)\`.
4. Compute private key: \`d = e^(-1) mod phi(n)\`.
*Key Pair:* Public \`(e, n)\` / Private \`(d, n)\`.`,

  "big o": `⚡ **PIXEL SAGE: TIME COMPLEXITY RANKS**
- \`O(1)\` -> God Tier (Direct Hash Map lookup)
- \`O(log n)\` -> Hero Tier (Binary Search tree partition)
- \`O(n)\` -> Knight Tier (Single loop linear scan)
- \`O(n log n)\` -> Warrior Tier (Merge Sort / Quick Sort)
- \`O(n^2)\` -> Slime Tier (Nested loops - optimize this!)`,
};

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

    const { message, mode = "mentor" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message prompt is required." }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const lower = trimmedMsg.toLowerCase();

    // 1. Pluggable custom external model endpoint
    const customAiEndpoint = process.env.AI_TUTOR_API_ENDPOINT;
    const customAiKey = process.env.AI_TUTOR_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (customAiEndpoint && customAiKey) {
      try {
        const externalRes = await fetch(customAiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${customAiKey}`,
          },
          body: JSON.stringify({
            model: process.env.AI_TUTOR_MODEL || "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are PixelSage, an authentic 8-bit retro AI mentor for Class Royale. Keep responses concise, structured, minimal, punchy, and arcade-themed. Use bullet points and clean code blocks. Zero fluff.",
              },
              { role: "user", content: trimmedMsg },
            ],
          }),
        });

        if (externalRes.ok) {
          const externalData = await externalRes.json();
          const reply =
            externalData.choices?.[0]?.message?.content ||
            externalData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return NextResponse.json({ reply, mode, source: "external-model" });
          }
        }
      } catch (err) {
        console.warn("External AI call fallback to 8-bit engine:", err);
      }
    }

    // 2. High-speed local 8-bit knowledge engine
    let matchedReply = "";
    for (const [key, text] of Object.entries(PRESET_TOPICS)) {
      if (lower.includes(key)) {
        matchedReply = text;
        break;
      }
    }

    if (!matchedReply) {
      if (mode === "quiz") {
        matchedReply = `⚔️ **PIXEL SAGE BATTLE DRILL**
When tackling algorithmic quiz challenges:
- Check constraints: N <= 10^5 requires O(n log n) or O(n).
- Verify edge cases: empty input, duplicates, extremes.
- Formulate loop invariants before writing code.
Ask for a battle drill on *Binary Search* or *Big O*!`;
      } else if (mode === "code") {
        matchedReply = `💻 **PIXEL SAGE CODE LAB**
\`\`\`typescript
// Minimal 8-bit functional pattern
export function processNodes<T>(items: T[]): T[] {
  return items.filter(Boolean);
}
\`\`\`
Paste your code snippet or error stack here to inspect!`;
      } else {
        matchedReply = `🧙‍♂️ **PIXEL SAGE:**
*"Greetings, young Knight! Prompt received: '${trimmedMsg}'"*

- **Directive:** Deconstruct the problem into minimal atomic steps.
- **Tip:** Query me on *Binary Search*, *Next.js*, *Dynamic Programming*, or *Big O* for instant scrolls of wisdom.`;
      }
    }

    return NextResponse.json({
      reply: matchedReply,
      mode,
      source: "pixelsage-engine",
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