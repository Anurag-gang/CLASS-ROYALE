/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Question Delivery & Anti-Skew Shuffling Service
 * Target: src/lib/questions/questionDeliveryService.ts
 *
 * Implements:
 * 1. Uniform Fisher-Yates runtime option shuffling (eliminating 95.7% position bias)
 * 2. Pre-submission delivery sanitization (stripping correct keys and explanations)
 * 3. Authoritative server-side timed hint gating (<= 15s remaining, disabled on Level 7)
 * 4. Distractor-specific misconception evaluation and diagnostic resolution
 * =============================================================================
 */

import {
  SanitizedQuizQuestion,
  SanitizedQuestionOption,
  AnswerEvaluationResult,
  HintDeliveryResult,
  MisconceptionCatalog,
} from "./types";

/**
 * 1. Pure Durstenfeld / Fisher-Yates array shuffling
 * Guarantees uniform permutation distribution O(n)
 */
export function shuffleArray<T>(items: readonly T[], prng: () => number = Math.random): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * 2. Sanitize and Shuffle Question for Secure Client Delivery
 * Strictly omits correct answer keys, hints, and explanations prior to submission.
 */
export function sanitizeQuestionForDelivery(
  question: {
    id: string;
    questionText: string;
    codeSnippet?: string | null;
    optionsJson?: string | null;
    options?: SanitizedQuestionOption[];
    levelNumber?: number;
    hint?: string | null;
    questionType?: string;
  },
  context: {
    realmSlug: string;
    levelNumber: number;
  }
): SanitizedQuizQuestion {
  let rawOptions: SanitizedQuestionOption[] = [];
  if (Array.isArray(question.options)) {
    rawOptions = question.options;
  } else if (question.optionsJson) {
    try {
      rawOptions = JSON.parse(question.optionsJson);
    } catch {
      rawOptions = [];
    }
  }

  // Runtime option shuffling eliminates position bias
  const shuffledOptions = shuffleArray(rawOptions);

  // Timed hints available only for Levels 1-6, strictly locked on Level 7 (Crown Trial)
  const isLevel7 = context.levelNumber === 7;
  const hintsAvailable = !isLevel7 && Boolean(question.hint && question.hint.trim().length > 0);

  return {
    id: question.id,
    questionText: question.questionText,
    codeSnippet: question.codeSnippet || null,
    options: shuffledOptions,
    timeLimitSeconds: 35,
    hintsAvailable,
    levelNumber: context.levelNumber,
    realmSlug: context.realmSlug,
    questionType: question.questionType || "SINGLE_MCQ",
  };
}

/**
 * 3. Authoritative Answer Evaluation with Misconception Diagnostic
 */
export function evaluateAnswerSubmission(
  question: {
    id: string;
    correctOptionId?: string | null;
    correctOptionIdsJson?: string | null;
    correctOptionIds?: string[];
    explanation: string;
    hint?: string | null;
    misconceptionExplanation?: string | null;
    misconceptionsJson?: string | null;
    misconceptions?: MisconceptionCatalog;
    referenceSource?: string | null;
  },
  selectedOptionIds: string[]
): AnswerEvaluationResult {
  let correctOptionIds: string[] = [];

  if (Array.isArray(question.correctOptionIds) && question.correctOptionIds.length > 0) {
    correctOptionIds = question.correctOptionIds;
  } else if (question.correctOptionIdsJson) {
    try {
      correctOptionIds = JSON.parse(question.correctOptionIdsJson);
    } catch {
      if (question.correctOptionId) {
        correctOptionIds = [question.correctOptionId];
      }
    }
  } else if (question.correctOptionId) {
    correctOptionIds = [question.correctOptionId];
  }

  // Set match comparison for correctness
  const normalizedSelected = selectedOptionIds.map((s) => s.trim().toLowerCase()).sort();
  const normalizedCorrect = correctOptionIds.map((c) => c.trim().toLowerCase()).sort();
  const isCorrect =
    normalizedSelected.length === normalizedCorrect.length &&
    normalizedSelected.every((val, idx) => val === normalizedCorrect[idx]);

  // Resolve targeted misconception if incorrect
  let misconceptionExplanation: string | null = null;
  if (!isCorrect) {
    let catalog: MisconceptionCatalog = {};
    if (question.misconceptions && typeof question.misconceptions === "object") {
      catalog = question.misconceptions;
    } else if (question.misconceptionsJson) {
      try {
        catalog = JSON.parse(question.misconceptionsJson);
      } catch {
        catalog = {};
      }
    }

    const chosenDistractor = selectedOptionIds[0];
    if (chosenDistractor && catalog[chosenDistractor]) {
      misconceptionExplanation = catalog[chosenDistractor];
    } else if (chosenDistractor && catalog[chosenDistractor.toLowerCase()]) {
      misconceptionExplanation = catalog[chosenDistractor.toLowerCase()];
    } else if (chosenDistractor && catalog[chosenDistractor.toUpperCase()]) {
      misconceptionExplanation = catalog[chosenDistractor.toUpperCase()];
    } else {
      misconceptionExplanation =
        question.misconceptionExplanation ||
        "This selection violates the fundamental invariants and constraints required by this concept.";
    }
  }

  return {
    questionId: question.id,
    isCorrect,
    academicPointsEarned: isCorrect ? 1 : 0,
    selectedOptionIds,
    correctOptionIds,
    explanation: question.explanation,
    misconceptionExplanation,
    referenceSource: question.referenceSource || null,
  };
}

/**
 * 4. Authoritative Server-Side Hint Gating
 */
export function evaluateHintRequest(
  session: {
    levelNumber: number;
    currentQuestionStartedAt: Date | string;
    hintsUsedCount: number;
    status: string;
  },
  question: {
    id: string;
    hint?: string | null;
  },
  serverNow: Date = new Date(),
  timeLimitSeconds: number = 35
): HintDeliveryResult {
  if (session.status !== "IN_PROGRESS") {
    throw new Error("Cannot request hints for an inactive quiz attempt.");
  }

  if (session.levelNumber === 7) {
    throw new Error(
      "Crown Trial (Level 7) assessment enforces strict exam conditions: timed hints are disabled."
    );
  }

  const startedAt = new Date(session.currentQuestionStartedAt).getTime();
  const elapsedSec = Math.floor((serverNow.getTime() - startedAt) / 1000);
  const remainingSec = Math.max(0, timeLimitSeconds - elapsedSec);

  const HINT_UNLOCK_REMAINING_SECONDS = 15;
  const NETWORK_GRACE_SECONDS = 2.5;

  if (remainingSec > HINT_UNLOCK_REMAINING_SECONDS + NETWORK_GRACE_SECONDS) {
    throw new Error(`Hint will unlock when 15 seconds remain. (${remainingSec}s remaining)`);
  }

  return {
    questionId: question.id,
    hint:
      question.hint ||
      "Deconstruct the problem invariants step-by-step; eliminate choices violating boundary conditions.",
    secondsRemaining: remainingSec,
    hintsUsedCount: session.hintsUsedCount + 1,
  };
}
