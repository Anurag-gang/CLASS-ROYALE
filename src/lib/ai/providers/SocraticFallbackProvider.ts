/**
 * Socratic Fallback AI Provider
 * High-speed, in-process, deterministic educational inference engine.
 * Guaranteed 100% uptime when local Colibri is offline, loading weights, or restarting.
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
import { socraticEngine } from "../socratic-engine";

export class SocraticFallbackProvider implements AIProvider {
  public readonly id = "socratic-offline-fallback";
  public readonly name = "Class Royale Socratic Fallback Engine";

  public async getModelId(): Promise<string> {
    return "cr-socratic-pedagogy-v2";
  }

  public async isHealthy(): Promise<boolean> {
    // In-process memory engine is always healthy
    return true;
  }

  public async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const startTime = performance.now();
    const content = socraticEngine.generate(
      messages,
      options?.mlTelemetry,
      options?.mode || "TUTOR"
    );
    const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      content,
      role: "assistant",
      model: "cr-socratic-pedagogy-v2",
      usage: {
        promptTokens: Math.round(messages.reduce((acc, m) => acc + m.content.length / 4, 0)),
        completionTokens: Math.round(content.length / 4),
        totalTokens: Math.round(
          messages.reduce((acc, m) => acc + m.content.length / 4, 0) + content.length / 4
        ),
      },
      latencyMs,
    };
  }

  public async *streamChat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): AsyncGenerator<string, void, unknown> {
    const fullText = socraticEngine.generate(
      messages,
      options?.mlTelemetry,
      options?.mode || "TUTOR"
    );

    // Yield in small token batches for smooth streaming UI
    const tokens = fullText.split(/(\s+)/);
    const batchSize = 3;

    for (let i = 0; i < tokens.length; i += batchSize) {
      const chunk = tokens.slice(i, i + batchSize).join("");
      yield chunk;
      await new Promise((r) => setTimeout(r, 15));
    }
  }

  public async generateQuiz(
    params: QuizGenerationParams,
    _context?: StudentLearningContext
  ): Promise<QuizQuestionItem[]> {
    return socraticEngine.generateQuizQuestions(params);
  }

  public async evaluateAnswer(
    params: AnswerEvaluationParams,
    _context?: StudentLearningContext
  ): Promise<AnswerEvaluationResult> {
    return socraticEngine.evaluateAnswer(params);
  }

  public async generateExplanation(
    topic: string,
    studentQuery: string,
    _context?: StudentLearningContext
  ): Promise<string> {
    const syntheticMessages: AIMessage[] = [
      {
        role: "user",
        content: `Explain the concept "${topic}". Specific question from student: "${studentQuery}"`,
      },
    ];
    return socraticEngine.generate(syntheticMessages, undefined, "EXPLAIN");
  }

  public async generateStudyPlan(
    params: StudyPlanParams,
    _context?: StudentLearningContext
  ): Promise<StudyPlanResult> {
    return socraticEngine.generateStudyPlan(params);
  }

  public async generateRevision(
    params: RevisionParams,
    _context?: StudentLearningContext
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
