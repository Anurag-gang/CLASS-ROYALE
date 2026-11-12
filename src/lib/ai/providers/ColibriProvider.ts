/**
 * Class Royale Colibri Local Inference Provider
 * Connects Next.js to locally hosted Colibri OpenAI-compatible engine (e.g. Qwen3-Coder-30B)
 * Supports non-streaming, SSE streaming, circuit breaker, retry logic, and dynamic model discovery.
 */

import {
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
} from "../types";
import { AIProvider } from "./AIProvider";
import { AIProviderConfig, getAIConfig } from "./AIConfig";
import { socraticEngine } from "../socratic-engine";

interface SSEChoice {
  delta?: {
    content?: string;
  };
  text?: string;
  finish_reason?: string | null;
}

interface SSEChunk {
  id?: string;
  choices?: SSEChoice[];
}

export class ColibriProvider implements AIProvider {
  public readonly id = "colibri-local";
  public readonly name = "Colibri Local Inference Engine";
  private config: AIProviderConfig;
  private consecutiveFailures = 0;
  private circuitOpenedAt = 0;
  private resolvedModelId: string | null = null;

  constructor(customConfig?: Partial<AIProviderConfig>) {
    this.config = { ...getAIConfig(), ...customConfig };
  }

  /**
   * Check if circuit breaker is currently open (blocking requests)
   */
  private isCircuitOpen(): boolean {
    if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      const elapsed = Date.now() - this.circuitOpenedAt;
      if (elapsed < this.config.circuitBreakerResetMs) {
        return true;
      }
      // Half-open state: allow attempt to probe
      return false;
    }
    return false;
  }

  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenedAt = 0;
  }

  private recordFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      this.circuitOpenedAt = Date.now();
    }
  }

  /**
   * Dynamically query /v1/models to get the exact model ID currently served by Colibri
   */
  public async getModelId(): Promise<string> {
    if (this.resolvedModelId) return this.resolvedModelId;

    try {
      const res = await fetch(`${this.config.baseUrl}/models`, {
        signal: AbortSignal.timeout(5000),
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const first = data?.data?.[0]?.id;
        if (first) {
          this.resolvedModelId = first;
          return first;
        }
      }
    } catch {
      // Fallback to configured model if unreachable
    }

    return this.config.model;
  }

  /**
   * Check engine health via /health endpoint or /v1/models
   */
  public async isHealthy(): Promise<boolean> {
    if (this.isCircuitOpen()) {
      return false;
    }

    try {
      const rootUrl = this.config.baseUrl.replace(/\/v1\/?$/, "");
      const res = await fetch(`${rootUrl}/health`, {
        signal: AbortSignal.timeout(4000),
        headers: this.getHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        const healthy = data?.status === "ok";
        if (healthy) this.recordSuccess();
        return healthy;
      }
    } catch {
      // Try /v1/models as fallback probe
      try {
        const modelRes = await fetch(`${this.config.baseUrl}/models`, {
          signal: AbortSignal.timeout(4000),
          headers: this.getHeaders(),
        });
        if (modelRes.ok) {
          this.recordSuccess();
          return true;
        }
      } catch {
        // Both probes failed
      }
    }

    this.recordFailure();
    return false;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "ClassRoyale-ColibriClient/2.0",
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    return headers;
  }

  /**
   * Standard non-streaming chat completion
   */
  public async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    if (this.isCircuitOpen()) {
      throw new Error(
        `Colibri Circuit Breaker is OPEN due to ${this.consecutiveFailures} consecutive failures. Will retry in ${Math.round((this.config.circuitBreakerResetMs - (Date.now() - this.circuitOpenedAt)) / 1000)}s`
      );
    }

    const startTime = performance.now();
    const model = options?.model || (await this.getModelId());

    const bodyPayload: Record<string, any> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: false,
    };

    if (options?.responseFormat?.type === "json_object") {
      bodyPayload.response_format = { type: "json_object" };
    }

    let lastError: Error | null = null;
    const maxAttempts = 1 + this.config.maxRetries;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

        const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(bodyPayload),
          signal: options?.signal || controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errText = await res.text().catch(() => "Unknown Colibri error");
          throw new Error(`Colibri HTTP ${res.status}: ${errText}`);
        }

        const data = await res.json();
        this.recordSuccess();

        const latencyMs = Math.round(performance.now() - startTime);
        const choice = data?.choices?.[0];
        const content = choice?.message?.content || "";

        return {
          content,
          role: "assistant",
          model: data?.model || model,
          usage: data?.usage
            ? {
                promptTokens: data.usage.prompt_tokens || 0,
                completionTokens: data.usage.completion_tokens || 0,
                totalTokens: data.usage.total_tokens || 0,
              }
            : undefined,
          latencyMs,
        };
      } catch (err: any) {
        lastError = err;
        if (attempt < maxAttempts) {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
        }
      }
    }

    this.recordFailure();
    throw lastError || new Error("Colibri inference failed after retries.");
  }

  /**
   * Streaming chat completion with Server-Sent Events (SSE)
   */
  public async *streamChat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): AsyncGenerator<string, void, unknown> {
    if (this.isCircuitOpen()) {
      throw new Error("Colibri Circuit Breaker is OPEN. Stream request rejected.");
    }

    const model = options?.model || (await this.getModelId());

    const bodyPayload: Record<string, any> = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      stream: true,
    };

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(bodyPayload),
      signal: options?.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown Colibri error");
      this.recordFailure();
      throw new Error(`Colibri Stream HTTP ${res.status}: ${errText}`);
    }

    if (!res.body) {
      this.recordFailure();
      throw new Error("Colibri response body is empty");
    }

    this.recordSuccess();

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last partial line in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":") || trimmed === "data: [DONE]") {
            continue;
          }

          if (trimmed.startsWith("data: ")) {
            const jsonStr = trimmed.slice(6).trim();
            try {
              const chunk: SSEChunk = JSON.parse(jsonStr);
              const deltaContent = chunk.choices?.[0]?.delta?.content;
              if (deltaContent) {
                yield deltaContent;
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      // Flush remaining buffer
      if (buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
        try {
          const chunk: SSEChunk = JSON.parse(buffer.trim().slice(6).trim());
          const deltaContent = chunk.choices?.[0]?.delta?.content;
          if (deltaContent) {
            yield deltaContent;
          }
        } catch {
          // Ignore
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  public async generateQuiz(
    params: QuizGenerationParams,
    context?: StudentLearningContext
  ): Promise<QuizQuestionItem[]> {
    try {
      const prompt = `Generate a ${params.difficulty}-level quiz with ${params.questionCount} questions on topic "${params.topic}". Output valid JSON matching QuizQuestionItem schema.`;
      const res = await this.chat(
        [
          { role: "system", content: "You are an expert computer science educator." },
          { role: "user", content: prompt },
        ],
        { responseFormat: { type: "json_object" } }
      );
      const parsed = JSON.parse(res.content);
      if (Array.isArray(parsed?.questions)) return parsed.questions;
    } catch {
      // Fallback to local engine
    }
    return socraticEngine.generateQuizQuestions(params);
  }

  public async evaluateAnswer(
    params: AnswerEvaluationParams,
    context?: StudentLearningContext
  ): Promise<AnswerEvaluationResult> {
    try {
      const prompt = `Evaluate student answer:
Question: ${params.question}
Correct Answer: ${params.correctAnswer}
Student Answer: ${params.studentAnswer}
Return JSON: { "correct": boolean, "score": number (0-10), "maxScore": 10, "feedback": string, "conceptualMistake": string }`;
      const res = await this.chat(
        [
          { role: "system", content: "You are a precise academic evaluator." },
          { role: "user", content: prompt },
        ],
        { responseFormat: { type: "json_object" } }
      );
      const parsed = JSON.parse(res.content);
      if (typeof parsed?.correct === "boolean") return parsed;
    } catch {
      // Fallback
    }
    return socraticEngine.evaluateAnswer(params);
  }

  public async generateExplanation(
    topic: string,
    studentQuery: string,
    context?: StudentLearningContext
  ): Promise<string> {
    try {
      const res = await this.chat([
        {
          role: "system",
          content:
            "You are Socrates, a classical philosophical mentor. Provide clear, dialectic explanations from first principles. Keep it structured and minimal.",
        },
        {
          role: "user",
          content: `Explain "${topic}". Question: "${studentQuery}"`,
        },
      ]);
      if (res.content) return res.content;
    } catch {
      // Fallback
    }
    return socraticEngine.generate(
      [{ role: "user", content: `Explain "${topic}". ${studentQuery}` }],
      undefined,
      "EXPLAIN"
    );
  }

  public async generateStudyPlan(
    params: StudyPlanParams,
    context?: StudentLearningContext
  ): Promise<StudyPlanResult> {
    return socraticEngine.generateStudyPlan(params);
  }

  public async generateRevision(
    params: RevisionParams,
    context?: StudentLearningContext
  ): Promise<RevisionResult> {
    return socraticEngine.generateRevision(params);
  }

  public async analyzePerformance(
    context: StudentLearningContext
  ): Promise<PerformanceAnalysisResult> {
    const strongTopics = context.strongTopics?.length
      ? context.strongTopics
      : ["Core Foundations", "Problem Solving"];
    const weakTopics = context.weakTopics?.length
      ? context.weakTopics
      : ["Advanced Pointers", "Graph Traversal"];

    return {
      overallAssessment: `Student ${context.name || context.username} is performing at Level ${context.level} (${context.rank}) with ${context.streak}-day persistence and ${context.averageAccuracy}% accuracy. Ready for deeper conceptual mastery.`,
      strongTopics,
      weakTopics,
      recommendedRevision: weakTopics.map(
        (t) => `Review fundamental invariants and space/time tradeoffs in ${t}`
      ),
      suggestedAction: "PRACTICE_ACTIVE_RECALL",
    };
  }
}

