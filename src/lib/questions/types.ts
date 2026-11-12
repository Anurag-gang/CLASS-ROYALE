/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Centralized Question Bank Domain Types
 * Target: src/lib/questions/types.ts
 * =============================================================================
 */

export interface SanitizedQuestionOption {
  id: string; // Stable UUID (e.g. "opt_a81f3b2c9e0d1234")
  text: string;
}

export interface SanitizedQuizQuestion {
  id: string;
  questionText: string;
  codeSnippet: string | null;
  options: SanitizedQuestionOption[]; // Shuffled at runtime via Fisher-Yates
  timeLimitSeconds: number; // Authoritative 35s server timer
  hintsAvailable: boolean; // true for Levels 1-6, false for Level 7 Crown Trial
  levelNumber: number;
  realmSlug: string;
  questionType: "SINGLE_MCQ" | "MULTI_SELECT" | "CODE_ANALYSIS" | string;
}

export interface AnswerEvaluationResult {
  questionId: string;
  isCorrect: boolean;
  academicPointsEarned: 0 | 1;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  explanation: string;
  misconceptionExplanation: string | null;
  referenceSource: string | null;
}

export interface HintDeliveryResult {
  questionId: string;
  hint: string;
  secondsRemaining: number;
  hintsUsedCount: number;
}

export type MisconceptionCatalog = Record<string, string>; // distractorOptionId -> diagnostic rationale
