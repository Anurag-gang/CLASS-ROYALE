// AI Provider Abstraction for Class Royale AI Agent "CR"

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
  private endpoint?: string;
  private apiKey?: string;
  private modelName: string;

  constructor() {
    this.endpoint = process.env.CR_AI_ENDPOINT || process.env.AI_TUTOR_API_ENDPOINT;
    this.apiKey =
      process.env.CR_AI_KEY ||
      process.env.AI_TUTOR_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY;
    this.modelName = process.env.CR_AI_MODEL || "gpt-4o-mini";
  }

  public async generateResponse(context: CRAgentPromptContext): Promise<string> {
    if (this.endpoint && this.apiKey) {
      try {
        const messages = [
          { role: "system", content: context.systemPrompt },
          ...context.conversationHistory.map((m) => ({
            role: m.role === "model" ? "assistant" : m.role,
            content: m.content,
          })),
          { role: "user", content: context.userMessage },
        ];

        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelName,
            messages,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply =
            data.choices?.[0]?.message?.content ||
            data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        }
      } catch (err) {
        console.warn("External AI call failed, switching to local CR intelligence engine:", err);
      }
    }

    return this.localEngineFallback(context.userMessage, context.learningContext);
  }

  public async generateStructured<T>(context: CRAgentPromptContext, schemaPrompt: string): Promise<T | null> {
    if (this.endpoint && this.apiKey) {
      try {
        const messages = [
          { role: "system", content: `${context.systemPrompt}\n\nIMPORTANT: Output ONLY valid JSON matching this schema:\n${schemaPrompt}` },
          ...context.conversationHistory.map((m) => ({
            role: m.role === "model" ? "assistant" : m.role,
            content: m.content,
          })),
          { role: "user", content: context.userMessage },
        ];

        const res = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelName,
            messages,
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const raw =
            data.choices?.[0]?.message?.content ||
            data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            return JSON.parse(raw) as T;
          }
        }
      } catch (err) {
        console.warn("External structured AI call failed, falling back to local generator:", err);
      }
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