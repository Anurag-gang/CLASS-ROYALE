// =============================================================================
// CLASS ROYALE: Question Bank, Territory Map & Battle Arena Type Definitions
// =============================================================================

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Boss" | "Foundational" | "Novice" | "Intermediate" | "Advanced" | "Comprehensive";

export interface QuizOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface Question {
  id: string;
  subject_id: string;
  question_text: string;
  code_snippet?: string | null;
  options: QuizOption[];
  correct_option_id?: "A" | "B" | "C" | "D"; // Hidden from student before submission
  difficulty: DifficultyLevel;
  xp_reward: number;
  time_limit_seconds: number;
  explanation: string;
  hint?: string;
  misconception_explanation?: string;
  reference_source?: string;
  topic?: string;
  subtopic?: string;
  level_number?: number;
  validation_status?: "DRAFT" | "NEEDS_REVIEW" | "VALIDATED" | "PUBLISHED" | "ARCHIVED";
  question_type?: "SINGLE_MCQ" | "MULTIPLE_MCQ" | "TRUE_FALSE" | "CODE_OUTPUT";
  version?: number;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizLevelDTO {
  id: string;
  subjectSlug: string;
  levelNumber: number;
  title: string;
  subtitle?: string | null;
  purpose: string;
  difficulty: string;
  passingThreshold: number;
  totalQuestions: number;
  timeLimitPerQuestion: number;
  allowHints: boolean;
  hintUnlockSeconds: number;
  xpReward: number;
  order: number;
  status: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  bestScore?: number;
  attemptsCount?: number;
}

export interface QuizSessionDTO {
  sessionId: string;
  subjectSlug: string;
  realmName: string;
  levelNumber: number;
  levelTitle: string;
  passingThreshold: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  currentQuestion: Omit<Question, "correct_option_id">;
  secondsRemaining: number;
  hintAvailable: boolean;
  hintUnlocked: boolean;
  hintText?: string | null;
  score: number;
  isCompleted: boolean;
}

export interface QuizAnswerSubmissionDTO {
  sessionId: string;
  questionId: string;
  selectedOptionId: "A" | "B" | "C" | "D";
  hintRequested?: boolean;
}

export interface QuizAnswerResultDTO {
  questionId: string;
  isCorrect: boolean;
  selectedOptionId: "A" | "B" | "C" | "D";
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
  misconceptionExplanation?: string | null;
  referenceSource?: string | null;
  score: number;
  totalQuestions: number;
  currentIndex: number;
  hasNextQuestion: boolean;
  levelComplete: boolean;
  passed?: boolean;
  xpAwarded?: number;
  isExpired?: boolean;
  nextQuestion?: Omit<Question, "correct_option_id"> | null;
}

export interface SubjectWithStats {
  id: string;
  name: string;
  slug: string;
  territory_name: string;
  description: string;
  icon_name: string;
  total_questions: number;
  total_xp: number;
  difficulty_counts: {
    Easy: number;
    Medium: number;
    Hard: number;
    Boss: number;
  };
  mastery_percentage?: number;
  status?: "UNCONQUERED" | "CONQUERING" | "MASTERED";
}

export interface BattleSession {
  sessionId: string;
  subject: SubjectWithStats;
  difficulty?: DifficultyLevel | "ALL";
  questions: Omit<Question, "correct_option_id">[];
  totalQuestions: number;
  currentQuestionIndex: number;
  startTime: number;
  timeRemaining: number;
  hp: number; // 0 - 100
  comboStreak: number;
  multiplier: number;
  totalXpEarned: number;
  isComplete: boolean;
}

export interface QuestionVerificationResult {
  questionId: string;
  isCorrect: boolean;
  selectedOptionId: "A" | "B" | "C" | "D";
  correctOptionId: "A" | "B" | "C" | "D";
  explanation: string;
  xpEarned: number;
  streakMultiplier: number;
  damageTaken?: number;
}

export interface QuizSubmission {
  subjectSlug: string;
  answers: {
    questionId: string;
    selectedOptionId: "A" | "B" | "C" | "D";
    timeTakenSeconds?: number;
  }[];
  finalHp?: number;
  maxStreak?: number;
}

export interface BattleSummary {
  subjectName: string;
  territoryName: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  totalXpAwarded: number;
  maxComboStreak: number;
  isVictory: boolean;
  perfectRun: boolean;
  territoryConquered: boolean;
  details: QuestionVerificationResult[];
}

export interface CreateQuestionPayload {
  subject_id: string;
  question_text: string;
  code_snippet?: string;
  options: QuizOption[];
  correct_option_id: "A" | "B" | "C" | "D";
  difficulty: DifficultyLevel;
  xp_reward?: number;
  time_limit_seconds?: number;
  explanation: string;
  tags: string[];
}
