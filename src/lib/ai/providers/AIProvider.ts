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

export interface AIProvider {
  id: string;
  name: string;
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse>;
  streamChat(messages: AIMessage[], options?: AIChatOptions): AsyncGenerator<string, void, unknown>;
  isHealthy(): Promise<boolean>;
  getModelId(): Promise<string>;

  // Educational AI capabilities
  generateQuiz?(params: QuizGenerationParams, context?: StudentLearningContext): Promise<QuizQuestionItem[]>;
  evaluateAnswer?(params: AnswerEvaluationParams, context?: StudentLearningContext): Promise<AnswerEvaluationResult>;
  generateExplanation?(topic: string, studentQuery: string, context?: StudentLearningContext): Promise<string>;
  generateStudyPlan?(params: StudyPlanParams, context?: StudentLearningContext): Promise<StudyPlanResult>;
  generateRevision?(params: RevisionParams, context?: StudentLearningContext): Promise<RevisionResult>;
  analyzePerformance?(context: StudentLearningContext): Promise<PerformanceAnalysisResult>;
}
