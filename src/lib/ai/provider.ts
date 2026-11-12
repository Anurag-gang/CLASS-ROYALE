/**
 * Class Royale AI Provider Resolver
 * Dispatches to Colibri local inference engine or Socratic fallback engine
 */

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
import { AIProviderFactory } from "./providers/AIProviderFactory";

class DynamicAIProvider implements AIProvider {
  public id = "dynamic-class-royale-provider";
  public name = "Class Royale Dynamic AI Provider";

  public async getModelId(): Promise<string> {
    const provider = await AIProviderFactory.getProvider();
    return provider.getModelId();
  }

  public async isHealthy(): Promise<boolean> {
    const provider = await AIProviderFactory.getProvider();
    return provider.isHealthy();
  }

  public async chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse> {
    const provider = await AIProviderFactory.getProvider();
    return provider.chat(messages, options);
  }

  public async *streamChat(
    messages: AIMessage[],
    options?: AIChatOptions
  ): AsyncGenerator<string, void, unknown> {
    const provider = await AIProviderFactory.getProvider();
    for await (const chunk of provider.streamChat(messages, options)) {
      yield chunk;
    }
  }

  public async generateQuiz(
    params: QuizGenerationParams,
    context?: StudentLearningContext
  ): Promise<QuizQuestionItem[]> {
    const provider = await AIProviderFactory.getProvider();
    if (provider.generateQuiz) {
      return provider.generateQuiz(params, context);
    }
    return AIProviderFactory.getFallbackProvider().generateQuiz(params, context);
  }

  public async evaluateAnswer(
    params: AnswerEvaluationParams,
    context?: StudentLearningContext
  ): Promise<AnswerEvaluationResult> {
    const provider = await AIProviderFactory.getProvider();
    if (provider.evaluateAnswer) {
      return provider.evaluateAnswer(params, context);
    }
    return AIProviderFactory.getFallbackProvider().evaluateAnswer(params, context);
  }

  public async generateExplanation(
    topic: string,
    studentQuery: string,
    context?: StudentLearningContext
  ): Promise<string> {
    const provider = await AIProviderFactory.getProvider();
    if (provider.generateExplanation) {
      return provider.generateExplanation(topic, studentQuery, context);
    }
    return AIProviderFactory.getFallbackProvider().generateExplanation(topic, studentQuery, context);
  }

  public async generateStudyPlan(
    params: StudyPlanParams,
    context?: StudentLearningContext
  ): Promise<StudyPlanResult> {
    const provider = await AIProviderFactory.getProvider();
    if (provider.generateStudyPlan) {
      return provider.generateStudyPlan(params, context);
    }
    return AIProviderFactory.getFallbackProvider().generateStudyPlan(params, context);
  }

  public async generateRevision(
    params: RevisionParams,
    context?: StudentLearningContext
  ): Promise<RevisionResult> {
    const provider = await AIProviderFactory.getProvider();
    if (provider.generateRevision) {
      return provider.generateRevision(params, context);
    }
    return AIProviderFactory.getFallbackProvider().generateRevision(params, context);
  }

  public async analyzePerformance(
    context: StudentLearningContext
  ): Promise<PerformanceAnalysisResult> {
    const provider = await AIProviderFactory.getProvider();
    if (provider.analyzePerformance) {
      return provider.analyzePerformance(context);
    }
    return AIProviderFactory.getFallbackProvider().analyzePerformance(context);
  }
}

let singletonDynamicProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!singletonDynamicProvider) {
    singletonDynamicProvider = new DynamicAIProvider();
  }
  return singletonDynamicProvider;
}

export function setCustomAIProvider(customProvider: AIProvider) {
  singletonDynamicProvider = customProvider;
}
