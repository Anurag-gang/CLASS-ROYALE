import {
  AIProvider,
  AIMessage,
  AIChatOptions,
  AIChatResponse,
  QuizQuestionItem,
  QuizGenerationParams,
  AnswerEvaluationParams,
  AnswerEvaluationResult,
  StudyPlanParams,
  StudyPlanResult,
  RevisionParams,
  RevisionResult,
  StudentLearningContext,
  PerformanceAnalysisResult,
} from "./types";
import {
  QuizGenerationResponseSchema,
  AnswerEvaluationResponseSchema,
  StudyPlanResponseSchema,
  RevisionPackResponseSchema,
  PerformanceAnalysisResponseSchema,
} from "./schemas";
import { CR_CORE_SYSTEM_PROMPT, formatStudentContextPrompt } from "./prompts";
import { socraticEngine } from "./socratic-engine";

export class OpenRouterProvider implements AIProvider {
  public id = "openrouter";
  public name = "OpenRouter AI Provider";

  private apiKey: string;
  private defaultModel: string;
  private fastModel: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    this.defaultModel = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    this.fastModel = process.env.OPENROUTER_FAST_MODEL || "anthropic/claude-3-haiku";
    this.baseUrl = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "HTTP-Referer": "https://classroyale.gg",
      "X-Title": "Class Royale Educational AI (CR)",
    };
  }

  /**
   * Helper to execute API requests with exponential backoff for rate limits (429) & server errors (5xx)
   */
  private async executeWithRetry(
    fn: () => Promise<Response>,
    maxRetries = 2,
    initialDelayMs = 800
  ): Promise<Response> {
    let attempt = 0;
    let delay = initialDelayMs;

    while (true) {
      attempt++;
      try {
        const res = await fn();
        if (res.ok) return res;

        // Rate limited or server error -> retry
        if ((res.status === 429 || res.status >= 500) && attempt <= maxRetries) {
          console.warn(`[OpenRouter] Received status ${res.status}. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }

        return res;
      } catch (err: any) {
        if (attempt <= maxRetries) {
          console.warn(`[OpenRouter] Network failure: ${err?.message}. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
  }

  public async chat(messages: AIMessage[], options: AIChatOptions = {}): Promise<AIChatResponse> {
    if (!this.apiKey) {
      const isJsonRequested = options.responseFormat?.type === "json_object";
      const fallbackContent = isJsonRequested
        ? this.generateStructuredFallback(messages)
        : this.generatePedagogicalFallback(messages, options.mlTelemetry, options.mode);
      return {
        content: fallbackContent,
        role: "assistant",
        model: "cr-socratic-engine",
        latencyMs: 15,
      };
    }

    const model = options.model || this.defaultModel;
    const startTime = Date.now();

    const requestBody: Record<string, any> = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? Number(process.env.AI_MAX_OUTPUT_TOKENS || 2048),
    };

    if (options.responseFormat) {
      requestBody.response_format = options.responseFormat;
    }

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 4500);
      const combinedSignal = options.signal || abortController.signal;

      const res = await this.executeWithRetry(() =>
        fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(requestBody),
          signal: combinedSignal,
        })
      );
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text();
        console.warn("[OpenRouter API notice]", res.status, errText);
        const isJsonRequested = options.responseFormat?.type === "json_object";
        const fallbackContent = isJsonRequested
          ? this.generateStructuredFallback(messages)
          : this.generatePedagogicalFallback(messages, options.mlTelemetry, options.mode);
        return {
          content: fallbackContent,
          role: "assistant",
          model: "cr-socratic-engine",
          latencyMs,
        };
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      const content = choice?.message?.content || "";

      return {
        content,
        role: choice?.message?.role || "assistant",
        model: data.model || model,
        usage: data.usage
          ? {
              promptTokens: data.usage.prompt_tokens || 0,
              completionTokens: data.usage.completion_tokens || 0,
              totalTokens: data.usage.total_tokens || 0,
            }
          : undefined,
        latencyMs,
      };
    } catch (err: any) {
      console.warn("[OpenRouter Chat] Reverting to Socratic Engine:", err?.message);
      const isJsonRequested = options.responseFormat?.type === "json_object";
      const fallbackContent = isJsonRequested
        ? this.generateStructuredFallback(messages)
        : this.generatePedagogicalFallback(messages, options.mlTelemetry, options.mode);
      return {
        content: fallbackContent,
        role: "assistant",
        model: "cr-socratic-engine",
        latencyMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Streaming completion yielding progressive text chunks
   */
  public async *streamChat(messages: AIMessage[], options: AIChatOptions = {}): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      const fallbackContent = this.generatePedagogicalFallback(messages, options.mlTelemetry, options.mode);
      const words = fallbackContent.split(" ");
      for (const word of words) {
        yield word + " ";
        await new Promise((r) => setTimeout(r, 12));
      }
      return;
    }

    const model = options.model || this.defaultModel;

    const requestBody = {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? Number(process.env.AI_MAX_OUTPUT_TOKENS || 2048),
      stream: true,
    };

    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 4000);
      const combinedSignal = options.signal || abortController.signal;

      const res = await this.executeWithRetry(() =>
        fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(requestBody),
          signal: combinedSignal,
        })
      );
      clearTimeout(timeoutId);

      if (!res.ok || !res.body) {
        const errText = await res.text();
        console.warn("[OpenRouter Stream API notice]", res.status, errText);
        const fallbackContent = this.generatePedagogicalFallback(messages, options.mlTelemetry, options.mode);
        const words = fallbackContent.split(" ");
        for (const word of words) {
          yield word + " ";
          await new Promise((r) => setTimeout(r, 12));
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  yield delta;
                }
              } catch {
                // Ignore partial parse
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (err: any) {
      console.warn("[OpenRouter Stream error, streaming Socratic response]:", err?.message);
      const fallbackContent = this.generatePedagogicalFallback(messages, options.mlTelemetry, options.mode);
      const words = fallbackContent.split(" ");
      for (const word of words) {
        yield word + " ";
        await new Promise((r) => setTimeout(r, 12));
      }
    }
  }

  /**
   * AI Quiz Generator with Zod Schema Validation & Automatic Self-Correction Retry
   */
  public async generateQuiz(params: QuizGenerationParams, context?: StudentLearningContext): Promise<QuizQuestionItem[]> {
    const studentContextStr = formatStudentContextPrompt(context);
    const difficultyName = ["", "Beginner", "Easy", "Intermediate", "Hard", "Expert"][params.difficulty] || "Intermediate";

    const systemPrompt = `${CR_CORE_SYSTEM_PROMPT}
${studentContextStr}
Generate a rigorous, engaging ${params.questionCount}-question academic battle quiz on the topic "${params.topic}".
Difficulty: Level ${params.difficulty} (${difficultyName}).
${params.learningObjective ? `Learning Objective: ${params.learningObjective}` : ""}

CRITICAL: Return ONLY valid JSON matching this schema:
{
  "title": "Title of Quiz",
  "topic": "${params.topic}",
  "difficulty": ${params.difficulty},
  "questions": [
    {
      "question": "Question text...",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answerIndex": 0,
      "correctAnswer": "Option A",
      "explanation": "Clear explanation...",
      "difficulty": ${params.difficulty},
      "topic": "${params.topic}",
      "subtopic": "Subtopic name"
    }
  ]
}`;

    const promptMessages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate the ${params.questionCount}-question quiz for topic: ${params.topic}. Output raw JSON only.` },
    ];

    try {
      const response = await this.chat(promptMessages, {
        temperature: 0.3,
        responseFormat: { type: "json_object" },
      });

      const parsedJson = JSON.parse(this.cleanJsonText(response.content));
      const validation = QuizGenerationResponseSchema.safeParse(parsedJson);

      if (validation.success) {
        return validation.data.questions as QuizQuestionItem[];
      }

      // Retry once with error correction instruction
      console.warn("[OpenRouter Quiz] Schema validation failed. Executing corrective retry...", validation.error.issues);
      const retryMessages: AIMessage[] = [
        ...promptMessages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: `Your previous output had validation errors: ${JSON.stringify(validation.error.issues)}. Please fix and output strictly valid JSON matching the exact schema.`,
        },
      ];

      const retryResponse = await this.chat(retryMessages, {
        temperature: 0.1,
        responseFormat: { type: "json_object" },
      });

      const retryJson = JSON.parse(this.cleanJsonText(retryResponse.content));
      const retryValidation = QuizGenerationResponseSchema.safeParse(retryJson);

      if (retryValidation.success) {
        return retryValidation.data.questions as QuizQuestionItem[];
      }
    } catch (err) {
      console.error("[OpenRouter Quiz Generation Failed]", err);
    }

    // Controlled fallback if LLM schema fails
    return this.getFallbackQuizQuestions(params);
  }

  /**
   * Deterministic & AI-Assisted Answer Evaluation
   */
  public async evaluateAnswer(params: AnswerEvaluationParams, context?: StudentLearningContext): Promise<AnswerEvaluationResult> {
    const studentAns = params.studentAnswer.trim().toLowerCase();
    const correctAns = params.correctAnswer.trim().toLowerCase();

    // Objective deterministic check
    if (studentAns === correctAns) {
      return {
        correct: true,
        score: 10,
        maxScore: 10,
        feedback: "Flawless mastery! Your answer is precisely accurate.",
        recommendedRevision: undefined,
      };
    }

    // Subjective / partial evaluation via LLM
    try {
      const systemPrompt = `${CR_CORE_SYSTEM_PROMPT}
You are evaluating a student's answer against the rubric.
Question: "${params.question}"
Correct / Reference Answer: "${params.correctAnswer}"
Rubric: "${params.rubric || "Standard university conceptual accuracy"}"

Return ONLY valid JSON matching:
{
  "correct": boolean,
  "score": number (0 to 10),
  "maxScore": 10,
  "feedback": "constructive guidance",
  "conceptualMistake": "specific point of confusion",
  "recommendedRevision": "concept to revisit"
}`;

      const res = await this.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Student Answer to evaluate: "${params.studentAnswer}". Output JSON only.` },
        ],
        { temperature: 0.2, responseFormat: { type: "json_object" } }
      );

      const parsed = JSON.parse(this.cleanJsonText(res.content));
      const val = AnswerEvaluationResponseSchema.safeParse(parsed);
      if (val.success) {
        return val.data;
      }
    } catch (err) {
      console.warn("[OpenRouter Answer Evaluation Failed]", err);
    }

    // Controlled fallback
    return socraticEngine.evaluateAnswer(params);
  }

  public async generateExplanation(topic: string, studentQuery: string, context?: StudentLearningContext): Promise<string> {
    try {
      const res = await this.chat([
        { role: "system", content: CR_CORE_SYSTEM_PROMPT },
        { role: "user", content: studentQuery },
      ]);
      if (res.content) return res.content;
    } catch {}
    return socraticEngine.generate([{ role: "user", content: studentQuery }]);
  }

  public async generateStudyPlan(params: StudyPlanParams, context?: StudentLearningContext): Promise<StudyPlanResult> {
    const systemPrompt = `${CR_CORE_SYSTEM_PROMPT}
Generate a structured, milestone-based academic study plan for "${params.subject}".
Target Exam Date: ${params.examDate || "Upcoming Midterm / Final"}
Available Hours: ${params.availableHoursPerWeek || 10} hours/week
Weak Areas to prioritize: ${params.weakTopics?.join(", ") || "Foundations"}

Return ONLY valid JSON:
{
  "subject": "${params.subject}",
  "targetDate": "${params.examDate || "In 7 Days"}",
  "pedagogicalAdvice": "Brief advice...",
  "schedule": [
    {
      "day": 1,
      "dateStr": "Day 1",
      "topic": "Core Topic",
      "tasks": [
        { "timeMin": 25, "action": "LEARN", "description": "Review fundamentals..." },
        { "timeMin": 20, "action": "QUIZ", "description": "Battle trial on basic concepts..." }
      ]
    }
  ]
}`;

    try {
      const res = await this.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate study plan for ${params.subject}` },
        ],
        { temperature: 0.3, responseFormat: { type: "json_object" } }
      );

      const parsed = JSON.parse(this.cleanJsonText(res.content));
      const val = StudyPlanResponseSchema.safeParse(parsed);
      if (val.success) {
        return val.data;
      }
    } catch (err) {
      console.warn("[OpenRouter Study Plan Failed]", err);
    }

    return socraticEngine.generateStudyPlan(params);
  }

  public async generateRevision(params: RevisionParams, context?: StudentLearningContext): Promise<RevisionResult> {
    const systemPrompt = `${CR_CORE_SYSTEM_PROMPT}
Generate a high-yield Active Recall Revision Pack for "${params.topic}".
Count: ${params.cardCount || 4} flashcards.

Return ONLY valid JSON:
{
  "topic": "${params.topic}",
  "summary": "High-density summary of key principles...",
  "cards": [
    { "id": "c1", "front": "Active recall question / prompt", "back": "Precise answer / explanation", "category": "${params.category || "Core Concept"}" }
  ],
  "keyFormulas": ["Key formula or invariant"],
  "commonMistakes": ["Common exam mistake to avoid"]
}`;

    try {
      const res = await this.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate revision flashcards for ${params.topic}` },
        ],
        { temperature: 0.3, responseFormat: { type: "json_object" } }
      );

      const parsed = JSON.parse(this.cleanJsonText(res.content));
      const val = RevisionPackResponseSchema.safeParse(parsed);
      if (val.success) {
        return val.data;
      }
    } catch (err) {
      console.warn("[OpenRouter Revision Failed]", err);
    }

    return socraticEngine.generateRevision(params);
  }

  public async analyzePerformance(context: StudentLearningContext): Promise<PerformanceAnalysisResult> {
    const systemPrompt = `${CR_CORE_SYSTEM_PROMPT}
${formatStudentContextPrompt(context)}
Analyze the student's learning progress and diagnostic results.
Return ONLY valid JSON:
{
  "overallAssessment": "Diagnostic summary...",
  "strongTopics": ["Strong Topic 1", "Strong Topic 2"],
  "weakTopics": ["Weak Topic 1", "Weak Topic 2"],
  "recommendedRevision": ["Specific revision drill 1", "Specific revision drill 2"],
  "suggestedAction": "Immediate next step recommendation"
}`;

    try {
      const res = await this.chat(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze my recent performance and tell me what to practice next." },
        ],
        { temperature: 0.3, responseFormat: { type: "json_object" } }
      );

      const parsed = JSON.parse(this.cleanJsonText(res.content));
      const val = PerformanceAnalysisResponseSchema.safeParse(parsed);
      if (val.success) {
        return val.data;
      }
    } catch (err) {
      console.warn("[OpenRouter Performance Analysis Failed]", err);
    }

    return {
      overallAssessment: `Current mastery accuracy is ${context.averageAccuracy}%. Consistent study streak of ${context.streak} days.`,
      strongTopics: context.strongTopics.length > 0 ? context.strongTopics : ["Foundational Concepts"],
      weakTopics: context.weakTopics.length > 0 ? context.weakTopics : ["Advanced Algorithms"],
      recommendedRevision: [`Review ${context.weakTopics[0] || "Algorithms"} with diagnostic battle drill.`],
      suggestedAction: `Initiate a 10-minute battle quiz on ${context.weakTopics[0] || "Data Structures"} to reinforce weak areas.`,
    };
  }

  private cleanJsonText(raw: string): string {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return cleaned;
  }

  private getFallbackQuizQuestions(params: QuizGenerationParams): QuizQuestionItem[] {
    return socraticEngine.generateQuizQuestions(params);
  }

  public generatePedagogicalFallback(messages: AIMessage[], mlTelemetry?: any, mode?: string): string {
    return socraticEngine.generate(messages, mlTelemetry, mode);
  }

  public generateStructuredFallback(messages: AIMessage[]): string {
    const sysPrompt = messages.find((m) => m.role === "system")?.content || "";
    const userPrompt = messages.find((m) => m.role === "user")?.content || "";
    const lower = (sysPrompt + " " + userPrompt).toLowerCase();

    if (lower.includes("quiz") || lower.includes("questions")) {
      const topicMatch = userPrompt.match(/topic:\s*([^.]+)/i) || ["", "Computer Science"];
      const topic = topicMatch[1].trim() || "Computer Science";
      return JSON.stringify({
        topic,
        questions: [
          {
            question: `What is the average time complexity of searching a balanced structure in ${topic}?`,
            type: "mcq",
            options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
            answerIndex: 1,
            correctAnswer: "O(log n)",
            explanation: "Each step cuts the search space in half, resulting in logarithmic complexity.",
            difficulty: 3,
            topic,
            subtopic: "Complexity Analysis",
          },
          {
            question: `Which fundamental invariant must be preserved in ${topic}?`,
            type: "mcq",
            options: ["FIFO ordering", "Left subtree < node < right subtree", "LIFO execution stack", "Unbounded random distribution"],
            answerIndex: 1,
            correctAnswer: "Left subtree < node < right subtree",
            explanation: "Maintains optimal ordered searchability across all subtrees.",
            difficulty: 3,
            topic,
            subtopic: "Structural Invariants",
          },
          {
            question: `What is the worst-case degradation of an un-balanced structure in ${topic}?`,
            type: "mcq",
            options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
            answerIndex: 1,
            correctAnswer: "O(n)",
            explanation: "Without balancing, the structure degrades into a linear linked list.",
            difficulty: 3,
            topic,
            subtopic: "Worst-Case Analysis",
          },
        ],
      });
    }

    if (lower.includes("evaluate") || lower.includes("rubric") || lower.includes("student answer")) {
      return JSON.stringify({
        correct: true,
        score: 9,
        maxScore: 10,
        feedback: "Solid understanding demonstrated. Key theoretical concepts are accurately stated.",
        conceptualMistake: undefined,
        recommendedRevision: "Review edge cases and formal asymptotic proofs.",
      });
    }

    if (lower.includes("study plan") || lower.includes("schedule")) {
      return JSON.stringify({
        subject: "Computer Science",
        schedule: [
          {
            day: 1,
            dateStr: "Day 1",
            topic: "Foundations & Primitives",
            tasks: [
              { timeMin: 20, action: "LEARN", description: "Review definitions and memory layout." },
              { timeMin: 15, action: "PRACTICE", description: "Solve 3 warm-up problems." },
              { timeMin: 10, action: "QUIZ", description: "Diagnostic combat arena test." },
            ],
          },
          {
            day: 2,
            dateStr: "Day 2",
            topic: "Key Invariants & Edge Cases",
            tasks: [
              { timeMin: 25, action: "LEARN", description: "Examine boundary conditions and overflows." },
              { timeMin: 20, action: "PRACTICE", description: "Implement algorithms handling edge cases." },
            ],
          },
        ],
        pedagogicalAdvice: "Dedicate 45 minutes daily and review missed questions with CR.",
      });
    }

    if (lower.includes("revision") || lower.includes("flashcard")) {
      return JSON.stringify({
        topic: "Computer Science",
        summary: "High-yield flashcard vault for core algorithms and data structures.",
        cards: [
          {
            id: "rc-1",
            front: "What is the primary trade-off of hash tables?",
            back: "Trades O(n) auxiliary memory to achieve expected O(1) time lookups and insertions.",
            category: "Data Structures",
          },
          {
            id: "rc-2",
            front: "What is the worst-case time complexity of Quick Sort?",
            back: "O(n²) when pivot selection consistently yields empty partitions (e.g. sorted input with naive pivot).",
            category: "Algorithms",
          },
        ],
        keyFormulas: ["O(log n) < O(n) < O(n log n) < O(n²) < O(2^n)"],
        commonMistakes: ["Neglecting base case in recursion", "Off-by-one errors in binary search"],
      });
    }

    return "{}";
  }
}

