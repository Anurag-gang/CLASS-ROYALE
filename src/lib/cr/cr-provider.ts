// AI Provider Abstraction for Class Royale AI Agent "CR" (CR Intelligence)
import { AIProviderFactory } from "@/lib/ai/providers/AIProviderFactory";
import { AIMessage } from "@/lib/ai/types";

export interface CRAgentPromptContext {
  systemPrompt: string;
  userMessage: string;
  conversationHistory: { role: "user" | "model" | "assistant"; content: string }[];
  learningContext?: Record<string, unknown>;
}

export interface AIProvider {
  generateResponse(context: CRAgentPromptContext): Promise<string>;
  generateStructured<T>(context: CRAgentPromptContext, schemaPrompt: string): Promise<T | null>;
}

class PluggableAIProvider implements AIProvider {
  public async generateResponse(context: CRAgentPromptContext): Promise<string> {
    try {
      const provider = await AIProviderFactory.getProvider();
      const messages: AIMessage[] = [
        { role: "system", content: context.systemPrompt },
        ...context.conversationHistory.map((m) => ({
          role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: context.userMessage },
      ];

      const res = await provider.chat(messages, { temperature: 0.7, maxTokens: 128 });
      if (res.content && res.content.trim()) {
        return res.content.trim();
      }
    } catch (err) {
      console.warn("[CR Intelligence] Colibri/Primary provider call failed, falling back to local strategist engine:", err);
    }

    return this.localEngineFallback(context.userMessage, context.learningContext);
  }

  public async generateStructured<T>(context: CRAgentPromptContext, schemaPrompt: string): Promise<T | null> {
    try {
      const provider = await AIProviderFactory.getProvider();
      const messages: AIMessage[] = [
        {
          role: "system",
          content: `${context.systemPrompt}\n\nIMPORTANT: Output ONLY valid JSON matching this schema:\n${schemaPrompt}`,
        },
        ...context.conversationHistory.map((m) => ({
          role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: context.userMessage },
      ];

      const res = await provider.chat(messages, {
        temperature: 0.2,
        maxTokens: 256,
        responseFormat: { type: "json_object" },
      });

      if (res.content) {
        return JSON.parse(res.content) as T;
      }
    } catch (err) {
      console.warn("[CR Intelligence] Structured generation failed, falling back to null:", err);
    }

    return null;
  }

  private localEngineFallback(query: string, context?: Record<string, unknown>): string {
    const q = query.toLowerCase();

    if (q.includes("binary search") || q.includes("search tree") || q.includes("bst")) {
      return `👑 **CR LEARNING BRIEF: BINARY TREES & SEARCH**
Let's conquer this concept step by step:

1. **The Kingdom Analogy:** Imagine the root node as the High King. Every knight weaker than the king goes to the *Left Realm*, and every knight stronger goes to the *Right Realm*.
2. **Search Invariant:** At each step, comparing your target against the current node eliminates half of the remaining kingdom.
3. **Complexity:** Because the search space divides by 2 on each step, balanced tree search runs in **O(log n)** time!

Would you like to try a **5-question battle trial** on this topic to test your knowledge and claim +150 XP?`;
    }

    if (q.includes("recursion") || q.includes("recursive")) {
      return `👑 **CR DECONSTRUCTION: RECURSION**
Recursion is solving a problem by having a function call itself with a smaller subproblem.

Three Sacred Rules:
1. **Base Case:** The condition under which the function stops (e.g. \`if (n <= 1) return 1;\`). Without this, your stack overflows into the void!
2. **Recursive Step:** Progressively shrinking the problem state towards the base case.
3. **Call Stack Invariant:** Each recursive frame pauses execution while waiting for the child call to return.

Shall we do a quick trace exercise or would you prefer beginner analogies?`;
    }

    if (q.includes("dynamic programming") || q.includes("dp")) {
      return `👑 **CR STRATEGY: DYNAMIC PROGRAMMING**
Dynamic Programming is fundamentally **smart recursion with memory**.

**The 3 Core Pillars:**
1. **Optimal Substructure:** The optimal solution to the main quest consists of optimal solutions to its sub-quests.
2. **Overlapping Subproblems:** You solve the identical subproblem repeatedly (e.g. Fibonacci numbers).
3. **Memoization / Tabulation:** Store solutions in a table or array (\`dp[i]\`) so every subproblem is solved exactly once.

Ready to practice formulating recurrence relations?`;
    }

    return `👑 **CR LEARNING COMPANION:**
Greetings, Player! I've analyzed your current learning profile.

I can help you:
- **[ TEACH ME ]**: Break down any complex CS or Math topic with intuitive analogies.
- **[ QUIZ ME ]**: Generate an adaptive 5-question combat arena test.
- **[ PREPARE FOR EXAM ]**: Draft an optimal study schedule calibrated to your weak areas.
- **[ REVISE ]**: Generate instant flashcard summaries and key formula sheets.

What challenge shall we tackle next?`;
  }
}

export const crAIProvider: AIProvider = new PluggableAIProvider();
