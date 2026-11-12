/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Authoritative Server-Side Quiz Engine & Progression Service
 * File: src/lib/quiz/authoritativeQuizEngine.ts
 *
 * Implements:
 * 1. Stratified Spiral Selection Algorithm (drawing exactly 12 validated PUBLISHED questions):
 *    - Level 1: Anti-collision double-pass cycling (distance >= 4) with runtime option re-shuffling.
 *    - Levels 2-6: Prerequisite spiral sampling with 0 duplicate questions.
 *    - Level 7: Capstone broad-spectrum trials (across all 7 levels) with 0 duplicate questions.
 * 2. Session Lifecycle State Machine:
 *    - startAttempt: Initializes QuizSession with 12 questions, pre-sanitizes Question 0, generates sessionToken.
 *    - submitAnswer: Authoritative 35s server timer (+2.5s network grace = 37.5s max), idempotency,
 *      immutable snapshot storage in QuizAttemptAnswer, sequence advancement.
 *    - getHint: Timed hint gating (<= 15s remaining + 2.5s grace), strict 403 lockout on Level 7.
 *    - finalizeAttempt: Transparent academic scoring (1 pt per correct, 75% / 9-of-12 passing threshold),
 *      unlocks Level N+1 in StudentLevelProgress, decoupled XP rewards, immutable 12-question review.
 * =============================================================================
 */

import { prisma } from "@/lib/db";
import {
  shuffleArray,
  sanitizeQuestionForDelivery,
  evaluateAnswerSubmission,
} from "@/lib/questions/questionDeliveryService";
import {
  SanitizedQuizQuestion,
  SanitizedQuestionOption,
} from "@/lib/questions/types";
import { getAcademicRealmBySlug, getLevelConfig } from "@/lib/realms/academicRealms";
import { awardUserXp } from "@/lib/game-mechanics";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

export const QUESTION_TIME_LIMIT_SECONDS = 35;
export const NETWORK_GRACE_SECONDS = 2.5;
export const MAX_ALLOWED_LATENCY_MS = (QUESTION_TIME_LIMIT_SECONDS + NETWORK_GRACE_SECONDS) * 1000; // 37,500 ms
export const PASSING_SCORE_THRESHOLD = 9; // 75% of 12 questions
export const TOTAL_QUESTIONS_PER_ATTEMPT = 12;

export interface QuestionBankItemRecord {
  id: string;
  subjectSlug: string;
  levelNumber: number;
  topic: string;
  subtopic: string;
  difficulty: string;
  bloomTaxonomy: string;
  questionText: string;
  codeSnippet: string | null;
  questionType: string;
  optionsJson: string;
  correctOptionIdsJson: string | null;
  primaryCorrectOptionId: string | null;
  academicPoints: number;
  xpReward: number;
  timeLimitSeconds: number;
  explanation: string;
  hint: string | null;
  misconceptionsJson: string | null;
  misconceptionExplanation: string | null;
  referenceSource: string | null;
  tagsJson: string | null;
  status: string;
  version: number;
}

export interface ShuffledQuestionEntry {
  questionId: string;
  shuffledOptions: SanitizedQuestionOption[];
}

export interface StartAttemptInput {
  userId: string;
  realmSlug?: string;
  subjectSlug?: string;
  levelNumber: number;
  forceNew?: boolean;
}

export interface StartAttemptResult {
  attemptId: string;
  sessionToken: string;
  realmSlug: string;
  subjectSlug: string;
  realmTitle: string;
  levelNumber: number;
  levelTitle: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  serverStartedAt: string;
  serverDeadline: string;
  timeLimitSeconds: number;
  passingThreshold: number;
  hintsAvailable: boolean;
  question: SanitizedQuizQuestion;
  activeSessionResumed?: boolean;
}

export interface SubmitAnswerInput {
  userId: string;
  sessionId: string;
  sessionToken?: string;
  questionIndex: number;
  selectedOptionIds: string[];
  idempotencyKey?: string;
}

export interface SubmitAnswerResult {
  attemptId: string;
  questionIndex: number;
  questionId: string;
  isCorrect: boolean;
  academicPointsEarned: 0 | 1;
  correctOptionIds: string[];
  explanation: string;
  misconceptionExplanation: string | null;
  currentAcademicScore: number;
  totalQuestions: number;
  nextQuestionIndex: number | null;
  isExpired: boolean;
  latencyMs: number;
  sessionStatus: string;
  nextQuestion?: SanitizedQuizQuestion | null;
  // Backward compatibility aliases
  score: number;
  selectedOptionId: string;
  correctOptionId: string;
  hasNextQuestion: boolean;
  levelComplete: boolean;
}

export interface RequestHintInput {
  userId: string;
  sessionId: string;
  questionId?: string;
}

export interface RequestHintResult {
  questionId: string;
  hint: string;
  secondsRemaining: number;
  hintsUsedCount: number;
}

export interface FinalizeAttemptInput {
  userId: string;
  sessionId: string;
}

export interface FinalizeAttemptResult {
  attemptId: string;
  realmSlug: string;
  subjectSlug: string;
  levelNumber: number;
  academicScore: number;
  totalQuestions: number;
  academicPercentage: number;
  passingScoreThreshold: number;
  passingPercentageThreshold: number;
  isPassed: boolean;
  unlockedNextLevel: boolean;
  nextLevelNumber: number | null;
  xpEarned: number;
  hintsUsedCount: number;
  startedAt: Date;
  completedAt: Date;
  reviewItems: Array<{
    questionIndex: number;
    questionId: string;
    questionText: string;
    codeSnippet: string | null;
    options: SanitizedQuestionOption[];
    selectedOptionIds: string[];
    correctOptionIds: string[];
    isCorrect: boolean;
    timeSpentSeconds: number;
    latencyMs: number;
    isTimedOut: boolean;
    hintUsed: boolean;
    explanation: string;
    misconceptionExplanation: string | null;
  }>;
}

/**
 * 1. Stratified Spiral Selection Algorithm
 * Draws exactly 12 validated PUBLISHED questions per attempt.
 */
export async function select12QuestionsForAttempt(
  subjectSlug: string,
  levelNumber: number
): Promise<QuestionBankItemRecord[]> {
  // Query all PUBLISHED questions for the target level
  const targetQuestions = (await prisma.questionBankItem.findMany({
    where: {
      subjectSlug,
      levelNumber,
      status: "PUBLISHED",
    },
  })) as QuestionBankItemRecord[];

  if (targetQuestions.length === 0) {
    throw new Error(
      `Content gap: No published questions found for ${subjectSlug} Level ${levelNumber}.`
    );
  }

  // Case 1: Target level has >= 12 questions (CMS future scale)
  if (targetQuestions.length >= TOTAL_QUESTIONS_PER_ATTEMPT) {
    return shuffleArray(targetQuestions).slice(0, TOTAL_QUESTIONS_PER_ATTEMPT);
  }

  // Case 2: Level 1 (Foundations) — Double-pass cycling with distance >= 4
  if (levelNumber === 1) {
    const n = targetQuestions.length;
    // Pass 1: Fisher-Yates shuffle of the 6 Level 1 questions
    const pass1 = shuffleArray(targetQuestions);

    // Pass 2: Cyclic shift by 2 to guarantee distance >= 4 between identical items
    // For n=6: indices in pass 1 are 0,1,2,3,4,5.
    // In pass 2 (shifted by 2):
    // item at pass1[0] appears at pass2[4] -> index 6+4=10 (distance 10 >= 4)
    // item at pass1[1] appears at pass2[5] -> index 6+5=11 (distance 10 >= 4)
    // item at pass1[2] appears at pass2[0] -> index 6+0=6  (distance 4 >= 4)
    // item at pass1[3] appears at pass2[1] -> index 6+1=7  (distance 4 >= 4)
    // item at pass1[4] appears at pass2[2] -> index 6+2=8  (distance 4 >= 4)
    // item at pass1[5] appears at pass2[3] -> index 6+3=9  (distance 4 >= 4)
    const shift = Math.min(2, Math.floor(n / 2));
    const pass2 = [...pass1.slice(shift), ...pass1.slice(0, shift)];

    const combined = [...pass1, ...pass2];
    while (combined.length < TOTAL_QUESTIONS_PER_ATTEMPT) {
      combined.push(...shuffleArray(targetQuestions).slice(0, TOTAL_QUESTIONS_PER_ATTEMPT - combined.length));
    }
    return combined.slice(0, TOTAL_QUESTIONS_PER_ATTEMPT);
  }

  // Case 3: Levels 2 to 6 — Stratified Prerequisite Spiral Sampling (0 duplicate questions)
  if (levelNumber >= 2 && levelNumber <= 6) {
    const deficit = TOTAL_QUESTIONS_PER_ATTEMPT - targetQuestions.length;

    // Fetch published prerequisite questions (levels < levelNumber) in the same realm
    const prerequisiteQuestions = (await prisma.questionBankItem.findMany({
      where: {
        subjectSlug,
        levelNumber: { lt: levelNumber },
        status: "PUBLISHED",
      },
      orderBy: { levelNumber: "desc" },
    })) as QuestionBankItemRecord[];

    const supplementary: QuestionBankItemRecord[] = [];
    const questionsByLevel = new Map<number, QuestionBankItemRecord[]>();

    for (const q of prerequisiteQuestions) {
      if (!questionsByLevel.has(q.levelNumber)) questionsByLevel.set(q.levelNumber, []);
      questionsByLevel.get(q.levelNumber)!.push(q);
    }

    // Allocate quota prioritizing immediate prerequisite level (L-1 down to 1)
    let needed = deficit;
    for (let lvl = levelNumber - 1; lvl >= 1 && needed > 0; lvl--) {
      const available = questionsByLevel.get(lvl) || [];
      if (available.length > 0) {
        const countToTake = Math.min(
          needed,
          Math.max(1, Math.ceil(deficit / (levelNumber - 1))),
          available.length
        );
        supplementary.push(...shuffleArray(available).slice(0, countToTake));
        needed = deficit - supplementary.length;
      }
    }

    // Fill any remainder from unused shuffled prerequisites to reach exact deficit
    if (supplementary.length < deficit) {
      const remainingPrereqs = prerequisiteQuestions.filter(
        (pq) => !supplementary.some((s) => s.id === pq.id)
      );
      supplementary.push(
        ...shuffleArray(remainingPrereqs).slice(0, deficit - supplementary.length)
      );
    }

    // Combine target level questions with unique supplementary prerequisite questions
    const combined12 = shuffleArray([...targetQuestions, ...supplementary.slice(0, deficit)]);
    return combined12.slice(0, TOTAL_QUESTIONS_PER_ATTEMPT);
  }

  // Case 4: Level 7 (Crown Trial / Capstone) — Broad Spectrum Across All 7 Levels (0 duplicate questions)
  if (levelNumber === 7) {
    const deficit = TOTAL_QUESTIONS_PER_ATTEMPT - targetQuestions.length; // 12 - 2 = 10

    const prereqQuestions = (await prisma.questionBankItem.findMany({
      where: {
        subjectSlug,
        levelNumber: { lt: 7 },
        status: "PUBLISHED",
      },
    })) as QuestionBankItemRecord[];

    // Quota distribution: 2 from L6, 2 from L5, 2 from L4, 2 from L3, 1 from L2, 1 from L1 (total 10)
    const quotaMap: Record<number, number> = { 6: 2, 5: 2, 4: 2, 3: 2, 2: 1, 1: 1 };
    const supplementary: QuestionBankItemRecord[] = [];

    for (const [lvlStr, quota] of Object.entries(quotaMap)) {
      const lvl = parseInt(lvlStr, 10);
      const levelPool = prereqQuestions.filter((q) => q.levelNumber === lvl);
      supplementary.push(...shuffleArray(levelPool).slice(0, quota));
    }

    // Fill any shortfall from unused prerequisites
    if (supplementary.length < deficit) {
      const remainingPrereqs = prereqQuestions.filter(
        (pq) => !supplementary.some((s) => s.id === pq.id)
      );
      supplementary.push(
        ...shuffleArray(remainingPrereqs).slice(0, deficit - supplementary.length)
      );
    }

    const combined12 = shuffleArray([...targetQuestions, ...supplementary.slice(0, deficit)]);
    return combined12.slice(0, TOTAL_QUESTIONS_PER_ATTEMPT);
  }

  // Generic fallback if unexpected level number
  return targetQuestions.slice(0, TOTAL_QUESTIONS_PER_ATTEMPT);
}

/**
 * 2. Session Lifecycle: Start Attempt
 */
export async function startQuizAttempt(input: StartAttemptInput): Promise<StartAttemptResult> {
  const { userId, levelNumber, forceNew } = input;

  if (typeof levelNumber !== "number" || levelNumber < 1 || levelNumber > 7) {
    const error: any = new Error("levelNumber must be an integer between 1 and 7.");
    error.statusCode = 400;
    throw error;
  }

  const realmIdentifier = input.subjectSlug || input.realmSlug;
  if (!realmIdentifier) {
    const error: any = new Error("subjectSlug or realmSlug is required to start a quiz attempt.");
    error.statusCode = 400;
    throw error;
  }

  const realmConfig = getAcademicRealmBySlug(realmIdentifier);
  if (!realmConfig) {
    const error: any = new Error(`Academic realm or subject '${realmIdentifier}' not recognized.`);
    error.statusCode = 400;
    throw error;
  }

  const subjectSlug = realmConfig.slug;
  const realmSlug = realmConfig.realmSlug;
  const levelConfig = getLevelConfig(subjectSlug, levelNumber);

  // Progression Gate: For Level > 1, check if level is unlocked
  if (levelNumber > 1) {
    const progress = await prisma.studentLevelProgress.findUnique({
      where: {
        userId_subjectSlug_levelNumber: {
          userId,
          subjectSlug,
          levelNumber,
        },
      },
    });

    if (!progress || !progress.isUnlocked) {
      const error: any = new Error(
        `Level ${levelNumber} is locked. You must conquer Level ${levelNumber - 1} first.`
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Existing Session Check: Check for active IN_PROGRESS session
  const activeSession = await prisma.quizSession.findFirst({
    where: {
      userId,
      subjectSlug,
      levelNumber,
      status: "IN_PROGRESS",
    },
    orderBy: { startedAt: "desc" },
  });

  if (activeSession && !forceNew) {
    const elapsedMinutes = (Date.now() - new Date(activeSession.startedAt).getTime()) / 60000;
    if (elapsedMinutes < 45) {
      // Resume active session
      const questionIds: string[] = JSON.parse(activeSession.questionIdsJson || "[]");
      const currentIdx = activeSession.currentQuestionIndex;
      const targetQuestionId = questionIds[currentIdx] || questionIds[0];

      const qItem = (await prisma.questionBankItem.findUnique({
        where: { id: targetQuestionId },
      })) as QuestionBankItemRecord | null;

      let shuffledOptions: SanitizedQuestionOption[] = [];
      if (activeSession.questionShufflesJson) {
        try {
          const shuffles: ShuffledQuestionEntry[] = JSON.parse(activeSession.questionShufflesJson);
          const entry = shuffles[currentIdx];
          if (entry) shuffledOptions = entry.shuffledOptions;
        } catch {
          // fallback to fresh shuffle
        }
      }

      if (shuffledOptions.length === 0 && qItem) {
        try {
          shuffledOptions = shuffleArray(JSON.parse(qItem.optionsJson));
        } catch {
          shuffledOptions = [];
        }
      }

      const sanitizedQ = qItem
        ? sanitizeQuestionForDelivery(
            {
              id: qItem.id,
              questionText: qItem.questionText,
              codeSnippet: qItem.codeSnippet,
              options: shuffledOptions,
              levelNumber,
              hint: qItem.hint,
              questionType: qItem.questionType,
            },
            { realmSlug, levelNumber }
          )
        : null;

      const serverStartedAt = new Date(activeSession.currentQuestionStartedAt).toISOString();
      const serverDeadline = new Date(
        new Date(activeSession.currentQuestionStartedAt).getTime() + QUESTION_TIME_LIMIT_SECONDS * 1000
      ).toISOString();

      return {
        attemptId: activeSession.id,
        sessionToken: activeSession.sessionToken || activeSession.id,
        realmSlug,
        subjectSlug,
        realmTitle: realmConfig.name,
        levelNumber,
        levelTitle: levelConfig?.name || levelConfig?.rpgTitle || `Level ${levelNumber}`,
        totalQuestions: activeSession.totalQuestions,
        currentQuestionIndex: currentIdx,
        serverStartedAt,
        serverDeadline,
        timeLimitSeconds: QUESTION_TIME_LIMIT_SECONDS,
        passingThreshold: PASSING_SCORE_THRESHOLD,
        hintsAvailable: levelNumber < 7,
        question: sanitizedQ!,
        activeSessionResumed: true,
      };
    } else {
      // Mark stale session as ABANDONED
      await prisma.quizSession.update({
        where: { id: activeSession.id },
        data: { status: "ABANDONED" },
      });
    }
  } else if (activeSession && forceNew) {
    await prisma.quizSession.update({
      where: { id: activeSession.id },
      data: { status: "ABANDONED" },
    });
  }

  // Select 12 questions using Stratified Spiral Selection Algorithm
  const selectedQuestions = await select12QuestionsForAttempt(subjectSlug, levelNumber);

  // Pre-generate shuffled options per question to guarantee deterministic reloading
  const questionShuffles: ShuffledQuestionEntry[] = selectedQuestions.map((q) => {
    let rawOptions: SanitizedQuestionOption[] = [];
    try {
      rawOptions = JSON.parse(q.optionsJson);
    } catch {
      rawOptions = [];
    }
    return {
      questionId: q.id,
      shuffledOptions: shuffleArray(rawOptions),
    };
  });

  const sessionToken = randomUUID();
  const serverNow = new Date();
  const serverStartedAt = serverNow.toISOString();
  const serverDeadline = new Date(
    serverNow.getTime() + QUESTION_TIME_LIMIT_SECONDS * 1000
  ).toISOString();

  // Create authoritative QuizSession in database
  const createdSession = await prisma.quizSession.create({
    data: {
      userId,
      sessionToken,
      subjectSlug,
      realmSlug,
      levelNumber,
      totalQuestions: TOTAL_QUESTIONS_PER_ATTEMPT,
      currentQuestionIndex: 0,
      questionIdsJson: JSON.stringify(selectedQuestions.map((q) => q.id)),
      questionShufflesJson: JSON.stringify(questionShuffles),
      score: 0,
      academicScore: 0,
      passed: false,
      accuracy: 0.0,
      hintsUsedCount: 0,
      status: "IN_PROGRESS",
      startedAt: serverNow,
      currentQuestionStartedAt: serverNow,
    },
  });

  // Pre-submission sanitize Question 0
  const q0 = selectedQuestions[0];
  const q0ShuffledOptions = questionShuffles[0].shuffledOptions;
  const sanitizedQuestion0 = sanitizeQuestionForDelivery(
    {
      id: q0.id,
      questionText: q0.questionText,
      codeSnippet: q0.codeSnippet,
      options: q0ShuffledOptions,
      levelNumber,
      hint: q0.hint,
      questionType: q0.questionType,
    },
    { realmSlug, levelNumber }
  );

  return {
    attemptId: createdSession.id,
    sessionToken,
    realmSlug,
    subjectSlug,
    realmTitle: realmConfig.name,
    levelNumber,
    levelTitle: levelConfig?.name || levelConfig?.rpgTitle || `Level ${levelNumber}`,
    totalQuestions: TOTAL_QUESTIONS_PER_ATTEMPT,
    currentQuestionIndex: 0,
    serverStartedAt,
    serverDeadline,
    timeLimitSeconds: QUESTION_TIME_LIMIT_SECONDS,
    passingThreshold: PASSING_SCORE_THRESHOLD,
    hintsAvailable: levelNumber < 7,
    question: sanitizedQuestion0,
    activeSessionResumed: false,
  };
}

/**
 * 3. Session Lifecycle: Submit Answer
 */
export async function submitQuizAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
  const { userId, sessionId, questionIndex, selectedOptionIds, idempotencyKey } = input;
  const serverNow = new Date();

  // 1. Fetch Session and verify ownership
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { answers: true },
  });

  if (!session) {
    const error: any = new Error("Quiz attempt session not found.");
    error.statusCode = 404;
    throw error;
  }

  if (session.userId !== userId) {
    const error: any = new Error("Forbidden: You do not own this quiz attempt session.");
    error.statusCode = 403;
    throw error;
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson || "[]");
  if (questionIndex < 0 || questionIndex >= questionIds.length) {
    const error: any = new Error(
      `Invalid question index ${questionIndex}. Must be between 0 and ${questionIds.length - 1}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const targetQuestionId = questionIds[questionIndex];

  // 2. Idempotency Check: Check if questionIndex has already been answered
  const existingAnswer = session.answers.find((a) => a.questionIndex === questionIndex);

  let questionItem = (await prisma.questionBankItem.findUnique({
    where: { id: targetQuestionId },
  })) as QuestionBankItemRecord | null;

  if (!questionItem) {
    const legacyQ = await prisma.bankQuestion.findUnique({ where: { id: targetQuestionId } });
    if (!legacyQ) {
      const error: any = new Error(`Question ${targetQuestionId} not found in database.`);
      error.statusCode = 404;
      throw error;
    }
    questionItem = {
      id: legacyQ.id,
      subjectSlug: session.subjectSlug,
      levelNumber: legacyQ.levelNumber,
      topic: legacyQ.topic,
      subtopic: legacyQ.subtopic,
      difficulty: legacyQ.difficulty,
      bloomTaxonomy: "UNDERSTAND",
      questionText: legacyQ.questionText,
      codeSnippet: legacyQ.codeSnippet,
      questionType: legacyQ.questionType || "SINGLE_MCQ",
      optionsJson: legacyQ.optionsJson,
      correctOptionIdsJson: JSON.stringify([legacyQ.correctOptionId]),
      primaryCorrectOptionId: legacyQ.correctOptionId,
      academicPoints: 1,
      xpReward: legacyQ.xpReward,
      timeLimitSeconds: legacyQ.timeLimitSeconds,
      explanation: legacyQ.explanation,
      hint: legacyQ.hint,
      misconceptionsJson: null,
      misconceptionExplanation: legacyQ.misconceptionExplanation,
      referenceSource: legacyQ.referenceSource,
      tagsJson: legacyQ.tagsJson,
      status: "PUBLISHED",
      version: legacyQ.version,
    };
  }

  let correctOptionIds: string[] = [];
  try {
    correctOptionIds = JSON.parse(
      questionItem.correctOptionIdsJson || `["${questionItem.primaryCorrectOptionId || "A"}"]`
    );
  } catch {
    correctOptionIds = [questionItem.primaryCorrectOptionId || "A"];
  }

  // If already answered, return recorded evaluation idempotently
  if (existingAnswer) {
    const isFinalQuestion = questionIndex === questionIds.length - 1;
    return {
      attemptId: sessionId,
      questionIndex,
      questionId: targetQuestionId,
      isCorrect: existingAnswer.isCorrect,
      academicPointsEarned: existingAnswer.isCorrect ? 1 : 0,
      correctOptionIds,
      explanation: existingAnswer.explanationSnapshot || questionItem.explanation,
      misconceptionExplanation: existingAnswer.misconceptionSnapshot,
      currentAcademicScore: session.academicScore,
      totalQuestions: questionIds.length,
      nextQuestionIndex: isFinalQuestion ? null : questionIndex + 1,
      isExpired: existingAnswer.isTimedOut,
      latencyMs: existingAnswer.serverLatencyMs,
      sessionStatus: session.status,
      score: session.academicScore,
      selectedOptionId: existingAnswer.selectedOptionId,
      correctOptionId: correctOptionIds[0] || "A",
      hasNextQuestion: !isFinalQuestion,
      levelComplete: isFinalQuestion,
    };
  }

  // 3. Session Status Check: Reject if not IN_PROGRESS
  if (session.status !== "IN_PROGRESS") {
    const error: any = new Error(
      `Cannot submit answer: Quiz attempt is currently in state '${session.status}'.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 4. Sequence Check: Reject out-of-order submissions
  if (questionIndex !== session.currentQuestionIndex) {
    const error: any = new Error(
      `Out-of-order submission: question index ${questionIndex} does not match active sequence index ${session.currentQuestionIndex}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // 5. Server-Side 35s Timer Authority (+2.5s network grace = 37,500ms max elapsed)
  const startedAtMs = new Date(session.currentQuestionStartedAt).getTime();
  const latencyMs = Math.max(0, serverNow.getTime() - startedAtMs);
  const isTimedOut = latencyMs > MAX_ALLOWED_LATENCY_MS;
  const timeSpentSeconds = Math.round(latencyMs / 1000);

  // 6. Pedagogical Evaluation
  const evaluation = evaluateAnswerSubmission(
    {
      id: questionItem.id,
      correctOptionIdsJson: questionItem.correctOptionIdsJson,
      correctOptionId: questionItem.primaryCorrectOptionId,
      explanation: questionItem.explanation,
      hint: questionItem.hint,
      misconceptionExplanation: questionItem.misconceptionExplanation,
      misconceptionsJson: questionItem.misconceptionsJson,
      referenceSource: questionItem.referenceSource,
    },
    selectedOptionIds
  );

  // If timed out: 0 points and mark incorrect regardless of selection
  const isCorrect = !isTimedOut && evaluation.isCorrect;
  const academicPointsEarned: 0 | 1 = isCorrect ? 1 : 0;
  const newAcademicScore = session.academicScore + academicPointsEarned;

  let misconceptionExplanation = evaluation.misconceptionExplanation;
  if (isTimedOut) {
    misconceptionExplanation = `Time limit exceeded: Answer arrived at ${(latencyMs / 1000).toFixed(
      1
    )}s (maximum allowable: 35.0s + 2.5s network grace). 0 academic points awarded.`;
  }

  const isFinalQuestion = questionIndex === questionIds.length - 1;
  const nextQuestionIndex = isFinalQuestion ? null : questionIndex + 1;
  let hintWasRequested = false;
  if (session.questionShufflesJson) {
    try {
      const shuffles = JSON.parse(session.questionShufflesJson);
      hintWasRequested = Boolean(shuffles[questionIndex]?.hintRequested);
    } catch {
      hintWasRequested = false;
    }
  }

  // 7. Atomic Database Mutation with P2002 Concurrency Recovery
  try {
    await prisma.$transaction([
      prisma.quizAttemptAnswer.create({
        data: {
          sessionId,
          questionIndex,
          questionId: targetQuestionId,
          selectedOptionId: selectedOptionIds[0] || "",
          isCorrect,
          timeSpentSeconds,
          serverLatencyMs: latencyMs,
          isTimedOut,
          hintRequested: hintWasRequested,
          idempotencyKey: idempotencyKey || null,
          questionTextSnapshot: questionItem.questionText,
          optionsSnapshotJson: questionItem.optionsJson,
          explanationSnapshot: questionItem.explanation,
          misconceptionSnapshot: misconceptionExplanation,
          answeredAt: serverNow,
        },
      }),
      prisma.quizSession.update({
        where: { id: sessionId },
        data: {
          score: newAcademicScore,
          academicScore: newAcademicScore,
          currentQuestionIndex: isFinalQuestion ? questionIndex : questionIndex + 1,
          currentQuestionStartedAt: serverNow, // Authoritative reset for next question timer
        },
      }),
    ]);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Race condition recovery: Concurrent submission already saved this answer
      const freshAnswer = await prisma.quizAttemptAnswer.findUnique({
        where: {
          sessionId_questionIndex: { sessionId, questionIndex },
        },
      });
      const freshSession = await prisma.quizSession.findUnique({ where: { id: sessionId } });

      return {
        attemptId: sessionId,
        questionIndex,
        questionId: targetQuestionId,
        isCorrect: Boolean(freshAnswer?.isCorrect),
        academicPointsEarned: freshAnswer?.isCorrect ? 1 : 0,
        correctOptionIds,
        explanation: questionItem.explanation,
        misconceptionExplanation: freshAnswer?.misconceptionSnapshot || null,
        currentAcademicScore: freshSession?.academicScore || newAcademicScore,
        totalQuestions: questionIds.length,
        nextQuestionIndex,
        isExpired: Boolean(freshAnswer?.isTimedOut),
        latencyMs: freshAnswer?.serverLatencyMs || latencyMs,
        sessionStatus: freshSession?.status || session.status,
        score: freshSession?.academicScore || newAcademicScore,
        selectedOptionId: freshAnswer?.selectedOptionId || selectedOptionIds[0] || "",
        correctOptionId: correctOptionIds[0] || "A",
        hasNextQuestion: !isFinalQuestion,
        levelComplete: isFinalQuestion,
      };
    }
    throw err;
  }

  // Pre-load next question preview for responsive client transitions
  let nextQuestionSanitized: SanitizedQuizQuestion | null = null;
  if (nextQuestionIndex !== null) {
    const nextQId = questionIds[nextQuestionIndex];
    const nextQItem = (await prisma.questionBankItem.findUnique({
      where: { id: nextQId },
    })) as QuestionBankItemRecord | null;

    if (nextQItem) {
      let nextOptions: SanitizedQuestionOption[] = [];
      if (session.questionShufflesJson) {
        try {
          const shuffles: ShuffledQuestionEntry[] = JSON.parse(session.questionShufflesJson);
          const entry = shuffles[nextQuestionIndex];
          if (entry) nextOptions = entry.shuffledOptions;
        } catch {
          // fallback
        }
      }
      if (nextOptions.length === 0) {
        try {
          nextOptions = shuffleArray(JSON.parse(nextQItem.optionsJson));
        } catch {
          nextOptions = [];
        }
      }

      nextQuestionSanitized = sanitizeQuestionForDelivery(
        {
          id: nextQItem.id,
          questionText: nextQItem.questionText,
          codeSnippet: nextQItem.codeSnippet,
          options: nextOptions,
          levelNumber: session.levelNumber,
          hint: nextQItem.hint,
          questionType: nextQItem.questionType,
        },
        {
          realmSlug: session.realmSlug || session.subjectSlug,
          levelNumber: session.levelNumber,
        }
      );
    }
  }

  return {
    attemptId: sessionId,
    questionIndex,
    questionId: targetQuestionId,
    isCorrect,
    academicPointsEarned,
    correctOptionIds,
    explanation: evaluation.explanation,
    misconceptionExplanation,
    currentAcademicScore: newAcademicScore,
    totalQuestions: questionIds.length,
    nextQuestionIndex,
    isExpired: isTimedOut,
    latencyMs,
    sessionStatus: session.status,
    nextQuestion: nextQuestionSanitized,
    score: newAcademicScore,
    selectedOptionId: selectedOptionIds[0] || "",
    correctOptionId: correctOptionIds[0] || "A",
    hasNextQuestion: !isFinalQuestion,
    levelComplete: isFinalQuestion,
  };
}

/**
 * 4. Session Lifecycle: Get Timed Hint
 */
export async function requestQuizHint(input: RequestHintInput): Promise<RequestHintResult> {
  const { userId, sessionId, questionId } = input;
  const serverNow = new Date();

  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { level: true },
  });

  if (!session) {
    const error: any = new Error("Quiz attempt session not found.");
    error.statusCode = 404;
    throw error;
  }

  if (session.userId !== userId) {
    const error: any = new Error("Forbidden: You do not own this quiz attempt session.");
    error.statusCode = 403;
    throw error;
  }

  if (session.status !== "IN_PROGRESS") {
    const error: any = new Error("Quiz attempt is no longer active.");
    error.statusCode = 400;
    throw error;
  }

  // STRICT LEVEL 7 LOCKOUT: Crown Trial assessments strictly forbid hints (HTTP 403)
  if (session.levelNumber === 7 || (session.level && !session.level.allowHints)) {
    const error: any = new Error(
      "Crown Trial (Level 7) assessment enforces strict exam conditions: timed hints are disabled."
    );
    error.statusCode = 403;
    throw error;
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson || "[]");
  const activeQuestionId = questionIds[session.currentQuestionIndex];

  if (questionId && questionId !== activeQuestionId) {
    const error: any = new Error("Hint requested for inactive question in sequence.");
    error.statusCode = 400;
    throw error;
  }

  // Server-side timer calculation
  const startedAt = new Date(session.currentQuestionStartedAt).getTime();
  const elapsedSec = Math.floor((serverNow.getTime() - startedAt) / 1000);
  const remainingSec = Math.max(0, QUESTION_TIME_LIMIT_SECONDS - elapsedSec);

  // Gating rule: unlocks when remainingSec <= 15s + 2.5s network grace (17.5s)
  if (remainingSec > 15 + NETWORK_GRACE_SECONDS) {
    const error: any = new Error(
      `Hint will unlock when 15 seconds remain. (${remainingSec}s remaining)`
    );
    error.statusCode = 400;
    throw error;
  }

  // Fetch question hint
  const qItem = await prisma.questionBankItem.findUnique({
    where: { id: activeQuestionId },
  });
  const bq = !qItem ? await prisma.bankQuestion.findUnique({ where: { id: activeQuestionId } }) : null;

  const hintText =
    qItem?.hint ||
    bq?.hint ||
    "Deconstruct the problem invariants step-by-step; eliminate choices violating boundary conditions.";

  // Idempotently increment hintsUsedCount only once per questionIndex
  let shuffles: any[] = [];
  try {
    shuffles = session.questionShufflesJson ? JSON.parse(session.questionShufflesJson) : [];
  } catch {
    shuffles = [];
  }

  const currentIdx = session.currentQuestionIndex;
  const currentShuffleEntry = shuffles[currentIdx] || { questionId: activeQuestionId };
  const alreadyRequested = Boolean(currentShuffleEntry.hintRequested);

  let hintsUsedCount = session.hintsUsedCount;
  if (!alreadyRequested) {
    hintsUsedCount = session.hintsUsedCount + 1;
    currentShuffleEntry.hintRequested = true;
    shuffles[currentIdx] = currentShuffleEntry;

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        hintsUsedCount: { increment: 1 },
        questionShufflesJson: JSON.stringify(shuffles),
      },
    });

    const existingAnswer = await prisma.quizAttemptAnswer.findUnique({
      where: {
        sessionId_questionIndex: {
          sessionId,
          questionIndex: currentIdx,
        },
      },
    });

    if (existingAnswer) {
      await prisma.quizAttemptAnswer.update({
        where: { id: existingAnswer.id },
        data: { hintRequested: true, hintRequestedAt: serverNow },
      });
    }
  }

  return {
    questionId: activeQuestionId,
    hint: hintText,
    secondsRemaining: remainingSec,
    hintsUsedCount,
  };
}

/**
 * 5. Session Lifecycle: Finalize Attempt & Progression
 */
export async function finalizeQuizAttempt(input: FinalizeAttemptInput): Promise<FinalizeAttemptResult> {
  const { userId, sessionId } = input;
  const now = new Date();

  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      level: true,
      answers: true,
    },
  });

  if (!session) {
    const error: any = new Error("Quiz attempt session not found.");
    error.statusCode = 404;
    throw error;
  }

  if (session.userId !== userId) {
    const error: any = new Error("Forbidden: You do not own this quiz attempt session.");
    error.statusCode = 403;
    throw error;
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson || "[]");
  const totalQuestions = questionIds.length || TOTAL_QUESTIONS_PER_ATTEMPT;

  // 1. Idempotency Check: If already completed, return cached result
  if (session.status === "COMPLETED") {
    const isPassed = session.academicScore >= PASSING_SCORE_THRESHOLD;
    const reviewItems = session.answers
      .sort((a, b) => a.questionIndex - b.questionIndex)
      .map((ans) => {
        let options: SanitizedQuestionOption[] = [];
        try {
          options = ans.optionsSnapshotJson ? JSON.parse(ans.optionsSnapshotJson) : [];
        } catch {
          options = [];
        }
        return {
          questionIndex: ans.questionIndex,
          questionId: ans.questionId,
          questionText: ans.questionTextSnapshot || "Question",
          codeSnippet: null,
          options,
          selectedOptionIds: ans.selectedOptionId ? [ans.selectedOptionId] : [],
          correctOptionIds: [],
          isCorrect: ans.isCorrect,
          timeSpentSeconds: ans.timeSpentSeconds,
          latencyMs: ans.serverLatencyMs,
          isTimedOut: ans.isTimedOut,
          hintUsed: ans.hintRequested,
          explanation: ans.explanationSnapshot || "",
          misconceptionExplanation: ans.misconceptionSnapshot,
        };
      });

    return {
      attemptId: session.id,
      realmSlug: session.realmSlug || session.subjectSlug,
      subjectSlug: session.subjectSlug,
      levelNumber: session.levelNumber,
      academicScore: session.academicScore,
      totalQuestions: session.totalQuestions,
      academicPercentage: session.accuracy,
      passingScoreThreshold: PASSING_SCORE_THRESHOLD,
      passingPercentageThreshold: 75,
      isPassed,
      unlockedNextLevel: isPassed && session.levelNumber < 7,
      nextLevelNumber: isPassed && session.levelNumber < 7 ? session.levelNumber + 1 : null,
      xpEarned: isPassed ? session.level?.xpReward || 200 : 0,
      hintsUsedCount: session.hintsUsedCount,
      startedAt: session.startedAt,
      completedAt: session.completedAt || now,
      reviewItems,
    };
  }

  // 2. Backfill snapshots for any unanswered questions (if abandoned or finalized early)
  const answerMap = new Map(session.answers.map((a) => [a.questionIndex, a]));
  for (let idx = 0; idx < questionIds.length; idx++) {
    if (!answerMap.has(idx)) {
      const qId = questionIds[idx];
      const qItem = (await prisma.questionBankItem.findUnique({
        where: { id: qId },
      })) as QuestionBankItemRecord | null;

      const createdAns = await prisma.quizAttemptAnswer.create({
        data: {
          sessionId: session.id,
          questionIndex: idx,
          questionId: qId,
          selectedOptionId: "",
          isCorrect: false,
          timeSpentSeconds: QUESTION_TIME_LIMIT_SECONDS,
          serverLatencyMs: QUESTION_TIME_LIMIT_SECONDS * 1000,
          isTimedOut: true,
          hintRequested: false,
          answeredAt: now,
          questionTextSnapshot: qItem?.questionText || "Unanswered Question",
          optionsSnapshotJson: qItem?.optionsJson || "[]",
          explanationSnapshot: qItem?.explanation || "No answer was submitted for this question.",
          misconceptionSnapshot: "Question timed out or was skipped prior to answer submission.",
        },
      });
      answerMap.set(idx, createdAns);
    }
  }

  // 3. Transparent Academic Scoring: exactly 1 pt per correct answer
  const allAnswers = Array.from(answerMap.values()).sort((a, b) => a.questionIndex - b.questionIndex);
  const academicScore = allAnswers.filter((a) => a.isCorrect).length;
  const academicPercentage = Math.round((academicScore / totalQuestions) * 100);
  const isPassed = academicScore >= PASSING_SCORE_THRESHOLD;

  // 4. Progression & Level Unlocking
  const existingProgress = await prisma.studentLevelProgress.findUnique({
    where: {
      userId_subjectSlug_levelNumber: {
        userId,
        subjectSlug: session.subjectSlug,
        levelNumber: session.levelNumber,
      },
    },
  });

  const bestScore = Math.max(existingProgress?.bestScore || 0, academicScore);
  const isNowCompleted = isPassed || Boolean(existingProgress?.isCompleted);

  await prisma.studentLevelProgress.upsert({
    where: {
      userId_subjectSlug_levelNumber: {
        userId,
        subjectSlug: session.subjectSlug,
        levelNumber: session.levelNumber,
      },
    },
    update: {
      isCompleted: isNowCompleted,
      bestScore,
      latestScore: academicScore,
      attemptsCount: { increment: 1 },
      totalHintsUsed: { increment: session.hintsUsedCount },
      completedAt: isPassed ? existingProgress?.completedAt || now : existingProgress?.completedAt,
    },
    create: {
      userId,
      subjectSlug: session.subjectSlug,
      levelNumber: session.levelNumber,
      isUnlocked: true,
      isCompleted: isPassed,
      bestScore: academicScore,
      latestScore: academicScore,
      attemptsCount: 1,
      totalHintsUsed: session.hintsUsedCount,
      completedAt: isPassed ? now : null,
    },
  });

  let unlockedNextLevel = false;
  let nextLevelNumber: number | null = null;

  if (isPassed && session.levelNumber < 7) {
    nextLevelNumber = session.levelNumber + 1;
    await prisma.studentLevelProgress.upsert({
      where: {
        userId_subjectSlug_levelNumber: {
          userId,
          subjectSlug: session.subjectSlug,
          levelNumber: nextLevelNumber,
        },
      },
      update: {
        isUnlocked: true,
      },
      create: {
        userId,
        subjectSlug: session.subjectSlug,
        levelNumber: nextLevelNumber,
        isUnlocked: true,
        isCompleted: false,
        bestScore: 0,
        latestScore: 0,
        attemptsCount: 0,
        totalHintsUsed: 0,
        unlockedAt: now,
      },
    });
    unlockedNextLevel = true;
  }

  // 5. Decoupled Gamification XP Rewards
  let xpEarned = 0;
  const levelConfig = getLevelConfig(session.subjectSlug, session.levelNumber);
  const standardXpReward = levelConfig?.xpReward || session.level?.xpReward || 200;

  if (isPassed) {
    const isFirstTimeCompletion = !existingProgress?.isCompleted;
    xpEarned = isFirstTimeCompletion ? standardXpReward : 25;

    await awardUserXp(
      userId,
      xpEarned,
      "ACADEMIC_LEVEL_PASS",
      `Conquered Level ${session.levelNumber} in ${session.subjectSlug} (${academicScore}/${totalQuestions} correct)`
    );
  }

  // 6. Complete QuizSession
  await prisma.quizSession.update({
    where: { id: session.id },
    data: {
      status: "COMPLETED",
      score: academicScore,
      academicScore,
      passed: isPassed,
      accuracy: academicPercentage,
      completedAt: now,
    },
  });

  // 7. Assemble 12-Question Immutable Snapshots
  const reviewItems = allAnswers.map((ans) => {
    let options: SanitizedQuestionOption[] = [];
    try {
      options = ans.optionsSnapshotJson ? JSON.parse(ans.optionsSnapshotJson) : [];
    } catch {
      options = [];
    }
    return {
      questionIndex: ans.questionIndex,
      questionId: ans.questionId,
      questionText: ans.questionTextSnapshot || "Question",
      codeSnippet: null,
      options,
      selectedOptionIds: ans.selectedOptionId ? [ans.selectedOptionId] : [],
      correctOptionIds: [],
      isCorrect: ans.isCorrect,
      timeSpentSeconds: ans.timeSpentSeconds,
      latencyMs: ans.serverLatencyMs,
      isTimedOut: ans.isTimedOut,
      hintUsed: ans.hintRequested,
      explanation: ans.explanationSnapshot || "",
      misconceptionExplanation: ans.misconceptionSnapshot,
    };
  });

  return {
    attemptId: session.id,
    realmSlug: session.realmSlug || session.subjectSlug,
    subjectSlug: session.subjectSlug,
    levelNumber: session.levelNumber,
    academicScore,
    totalQuestions,
    academicPercentage,
    passingScoreThreshold: PASSING_SCORE_THRESHOLD,
    passingPercentageThreshold: 75,
    isPassed,
    unlockedNextLevel,
    nextLevelNumber,
    xpEarned,
    hintsUsedCount: session.hintsUsedCount,
    startedAt: session.startedAt,
    completedAt: now,
    reviewItems,
  };
}

/**
 * 6. Helper: Fetch Active Quiz Attempt
 */
export async function getActiveQuizAttempt(sessionId: string, userId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      answers: true,
      level: true,
    },
  });

  if (!session) {
    const error: any = new Error("Quiz attempt session not found.");
    error.statusCode = 404;
    throw error;
  }

  if (session.userId !== userId) {
    const error: any = new Error("Forbidden: You do not own this quiz attempt session.");
    error.statusCode = 403;
    throw error;
  }

  return session;
}
