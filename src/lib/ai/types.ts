// AI Provider Types & Interfaces for Class Royale AI "CR"

export type AIMessageRole = "system" | "user" | "assistant";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
  name?: string;
}

export interface AIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  responseFormat?: { type: "json_object" | "text" };
  signal?: AbortSignal;
  mlTelemetry?: any;
  mode?: string;
}

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIChatResponse {
  content: string;
  role: AIMessageRole;
  model: string;
  usage?: AITokenUsage;
  latencyMs: number;
}

export type QuizQuestionType = "mcq" | "true_false" | "fill_blank" | "short_answer" | "code";

export interface QuizQuestionItem {
  id?: string;
  question: string;
  type: QuizQuestionType;
  options: string[];
  answerIndex?: number;
  correctAnswer: string;
  explanation: string;
  difficulty: number; // 1 (Beginner) to 5 (Expert)
  topic: string;
  subtopic: string;
}

export interface QuizGenerationParams {
  courseId?: string;
  topic: string;
  difficulty: number;
  questionCount: number;
  questionTypes?: QuizQuestionType[];
  learningObjective?: string;
}

export interface AnswerEvaluationParams {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  questionType?: string;
  rubric?: string;
}

export interface AnswerEvaluationResult {
  correct: boolean;
  score: number; // e.g. 0 to 10
  maxScore: number;
  feedback: string;
  conceptualMistake?: string;
  recommendedRevision?: string;
}

export interface StudyPlanTask {
  timeMin: number;
  action: "LEARN" | "PRACTICE" | "QUIZ" | "REVISE" | "ARENA";
  description: string;
}

export interface StudyPlanDay {
  day: number;
  dateStr?: string;
  topic: string;
  tasks: StudyPlanTask[];
}

export interface StudyPlanParams {
  subject: string;
  examDate?: string;
  availableHoursPerWeek?: number;
  currentKnowledge?: string;
  weakTopics?: string[];
}

export interface StudyPlanResult {
  planId?: string;
  subject: string;
  targetDate?: string;
  schedule: StudyPlanDay[];
  pedagogicalAdvice?: string;
}

export interface RevisionCardItem {
  id: string;
  front: string;
  back: string;
  category: string;
}

export interface RevisionParams {
  topic: string;
  category?: string;
  cardCount?: number;
}

export interface RevisionResult {
  packId?: string;
  topic: string;
  summary: string;
  cards: RevisionCardItem[];
  keyFormulas?: string[];
  commonMistakes?: string[];
}

export interface StudentLearningContext {
  studentId: string;
  userId: string;
  username: string;
  name: string;
  level: number;
  xp: number;
  rank: string;
  streak: number;
  averageAccuracy: number;
  weakTopics: string[];
  strongTopics: string[];
  enrolledCourses: Array<{ id: string; title: string }>;
  recentScores: Array<{ topic: string; scorePercent: number }>;
}

export interface PerformanceAnalysisResult {
  overallAssessment: string;
  strongTopics: string[];
  weakTopics: string[];
  recommendedRevision: string[];
  suggestedAction: string;
}

export interface AIProvider {
  id: string;
  name: string;
  chat(messages: AIMessage[], options?: AIChatOptions): Promise<AIChatResponse>;
  streamChat(messages: AIMessage[], options?: AIChatOptions): AsyncGenerator<string, void, unknown>;
  generateQuiz(params: QuizGenerationParams, context?: StudentLearningContext): Promise<QuizQuestionItem[]>;
  evaluateAnswer(params: AnswerEvaluationParams, context?: StudentLearningContext): Promise<AnswerEvaluationResult>;
  generateExplanation(topic: string, studentQuery: string, context?: StudentLearningContext): Promise<string>;
  generateStudyPlan(params: StudyPlanParams, context?: StudentLearningContext): Promise<StudyPlanResult>;
  generateRevision(params: RevisionParams, context?: StudentLearningContext): Promise<RevisionResult>;
  analyzePerformance(context: StudentLearningContext): Promise<PerformanceAnalysisResult>;
}
