/**
 * Machine Learning Engine Type Definitions for Class Royale
 * Matches schemas from ml-service/app/schemas/
 */

export type LearningAction =
  | "ANSWER_NEXT_QUESTION"
  | "REVISE_TOPIC"
  | "LOWER_DIFFICULTY"
  | "INCREASE_DIFFICULTY"
  | "PRACTICE_WEAK_TOPIC"
  | "REVIEW_CONCEPT"
  | "TAKE_BREAK";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD" | "EXPERT";

export interface MasteryScore {
  score: number;
  confidence: number;
  algorithm_used: string;
  contributing_factors: Record<string, number>;
}

export interface TopicStatusResult {
  topic_id: string;
  status: "WEAK" | "NORMAL" | "STRONG" | "MASTERED";
  accuracy: number;
  attempts_count: number;
  trend: "IMPROVING" | "DECLINING" | "STABLE";
}

export interface AdaptiveActionRequest {
  student_id: string;
  topic_id: string;
  current_question_id?: string;
  last_answer_correct?: boolean;
  consecutive_correct?: number;
  consecutive_wrong?: number;
  time_taken_seconds?: number;
  recent_interactions?: StudentInteraction[];
  available_questions?: QuestionCandidate[];
}

export interface AdaptiveActionResponse {
  status: string;
  student_id: string;
  topic_id: string;
  action: LearningAction;
  action_rationale: string;
  mastery?: MasteryScore;
  topic_status?: TopicStatusResult | null;
  recommended_question_ids?: string[];
  model_versions?: Record<string, string>;
  is_live?: boolean;
}

export interface StudentInteraction {
  student_id: string;
  topic_id: string;
  question_id?: string;
  attempt_number?: number;
  previous_accuracy?: number;
  recent_accuracy?: number;
  time_taken_seconds?: number;
  answer_correct: boolean;
  timestamp?: string;
}

export interface QuestionCandidate {
  question_id: string;
  topic_id: string;
  difficulty?: number;
  difficulty_level?: DifficultyLevel;
  times_seen_by_student?: number;
}

export interface StudentProfilePredictionResponse {
  status: string;
  student_id: string;
  overall_mastery: number;
  topic_masteries: Record<string, number>;
  weak_topics: string[];
  strong_topics: string[];
  recommended_action: LearningAction;
  model_versions?: Record<string, string>;
}

export interface MLTelemetry {
  isAvailable: boolean;
  activeEndpoint: string;
  masteryScore: number;
  masteryPercent: number;
  confidence: number;
  learningAction: LearningAction;
  actionRationale: string;
  contributingFactors: Record<string, number>;
  modelVersion: string;
}
