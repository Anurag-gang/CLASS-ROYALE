import { prisma } from "@/lib/db";
import { awardUserXp } from "@/lib/game-mechanics";
import fallbackData from "@/data/questions-fallback.json";
import { REALM_LEVEL_DEFINITIONS } from "../../../scripts/seed_levels";
import { mlClient } from "@/lib/ml/client";

const TIME_LIMIT_SECONDS = 35;
const HINT_UNLOCK_REMAINING_SECONDS = 15;
const NETWORK_GRACE_SECONDS = 3;

export interface StartLevelAttemptParams {
  userId: string;
  subjectSlug: string;
  levelNumber: number;
}

export interface SubmitAnswerParams {
  userId: string;
  sessionId: string;
  questionId: string;
  selectedOptionId: "A" | "B" | "C" | "D";
}

export interface RequestHintParams {
  userId: string;
  sessionId: string;
  questionId: string;
}

/**
 * 1. Get all 7 levels for a subject with student unlock & progress status
 */
export async function getSubjectLevelsWithProgress(subjectSlug: string, userId?: string) {
  const levels = await prisma.quizLevel.findMany({
    where: { subjectSlug },
    orderBy: { levelNumber: "asc" },
  });

  const subject = await prisma.territorySubject.findUnique({
    where: { slug: subjectSlug },
  });

  let studentProgress: Record<number, any> = {};
  if (userId) {
    const progressList = await prisma.studentLevelProgress.findMany({
      where: { userId, subjectSlug },
    });
    progressList.forEach((p) => {
      studentProgress[p.levelNumber] = p;
    });
  }

  // Count available validated questions per level
  const bankQuestions = await prisma.bankQuestion.findMany({
    where: {
      subject: { slug: subjectSlug },
      validationStatus: "VALIDATED",
    },
    select: { id: true, levelNumber: true },
  });

  const countByLevel: Record<number, number> = {};
  bankQuestions.forEach((q) => {
    countByLevel[q.levelNumber] = (countByLevel[q.levelNumber] || 0) + 1;
  });

  return levels.map((lvl) => {
    const prog = studentProgress[lvl.levelNumber];
    const isUnlocked = lvl.levelNumber === 1 || Boolean(prog?.isUnlocked);
    const isCompleted = Boolean(prog?.isCompleted);
    const availableQuestions = countByLevel[lvl.levelNumber] || 0;

    return {
      id: lvl.id,
      subjectSlug: lvl.subjectSlug,
      realmName: subject?.territoryName || "Academic Realm",
      subjectName: subject?.name || subjectSlug,
      levelNumber: lvl.levelNumber,
      title: lvl.title,
      subtitle: lvl.subtitle,
      purpose: lvl.purpose,
      difficulty: lvl.difficulty,
      passingThreshold: lvl.passingThreshold,
      totalQuestions: lvl.totalQuestions,
      timeLimitPerQuestion: lvl.timeLimitPerQuestion,
      allowHints: lvl.allowHints,
      hintUnlockSeconds: lvl.hintUnlockSeconds,
      xpReward: lvl.xpReward,
      order: lvl.order,
      status: availableQuestions >= 6 ? "ACTIVE" : "INCOMPLETE",
      availableQuestionsCount: availableQuestions,
      isUnlocked,
      isCompleted,
      bestScore: prog?.bestScore || 0,
      latestScore: prog?.latestScore || 0,
      attemptsCount: prog?.attemptsCount || 0,
    };
  });
}

/**
 * 2. Start a new authoritative level attempt session
 */
export async function startLevelAttempt({
  userId,
  subjectSlug,
  levelNumber,
}: StartLevelAttemptParams) {
  // Check unlock status
  if (levelNumber > 1) {
    const prog = await prisma.studentLevelProgress.findUnique({
      where: {
        userId_subjectSlug_levelNumber: {
          userId,
          subjectSlug,
          levelNumber,
        },
      },
    });
    if (!prog || !prog.isUnlocked) {
      throw new Error(`Level ${levelNumber} is locked. You must conquer Level ${levelNumber - 1} first.`);
    }
  }

  const level = await prisma.quizLevel.findUnique({
    where: {
      subjectSlug_levelNumber: {
        subjectSlug,
        levelNumber,
      },
    },
    include: { subject: true },
  });

  if (!level) {
    throw new Error(`Level ${levelNumber} configuration not found for ${subjectSlug}`);
  }

  // Fetch validated questions for this subject & level
  let questions = await prisma.bankQuestion.findMany({
    where: {
      subject: { slug: subjectSlug },
      levelNumber,
      validationStatus: "VALIDATED",
    },
  });

  // If fewer questions in DB for this exact level, supplement from subject questions
  if (questions.length < 12) {
    const extraQuestions = await prisma.bankQuestion.findMany({
      where: {
        subject: { slug: subjectSlug },
        validationStatus: "VALIDATED",
        id: { notIn: questions.map((q) => q.id) },
      },
      take: 12 - questions.length,
    });
    questions = [...questions, ...extraQuestions];
  }

  if (questions.length === 0) {
    throw new Error(`Content gap: No validated questions found for ${subjectSlug} Level ${levelNumber}`);
  }

  // Shuffle and pick 12 questions (or max available)
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(12, shuffled.length));
  const questionIds = selected.map((q) => q.id);

  const now = new Date();

  // Create authoritative session
  const session = await prisma.quizSession.create({
    data: {
      userId,
      levelId: level.id,
      subjectSlug,
      levelNumber,
      currentQuestionIndex: 0,
      questionIdsJson: JSON.stringify(questionIds),
      totalQuestions: questionIds.length,
      status: "IN_PROGRESS",
      startedAt: now,
      currentQuestionStartedAt: now,
    },
  });

  // Return the first question without correct_option_id, explanation, or hint!
  const firstQ = selected[0];
  const options = JSON.parse(firstQ.optionsJson);

  return {
    sessionId: session.id,
    subjectSlug,
    realmName: level.subject?.territoryName || "Academic Realm",
    levelNumber,
    levelTitle: level.title,
    levelSubtitle: level.subtitle,
    purpose: level.purpose,
    passingThreshold: Math.min(level.passingThreshold, questionIds.length),
    totalQuestions: questionIds.length,
    currentQuestionIndex: 0,
    timeLimitSeconds: level.timeLimitPerQuestion || TIME_LIMIT_SECONDS,
    allowHints: level.allowHints,
    secondsRemaining: level.timeLimitPerQuestion || TIME_LIMIT_SECONDS,
    currentQuestion: {
      id: firstQ.id,
      question_text: firstQ.questionText,
      code_snippet: firstQ.codeSnippet,
      options,
      difficulty: firstQ.difficulty,
      xp_reward: firstQ.xpReward,
      topic: firstQ.topic,
      subtopic: firstQ.subtopic,
      tags: JSON.parse(firstQ.tagsJson || "[]"),
    },
    score: 0,
  };
}

/**
 * 3. Request hint for active question
 */
export async function requestQuestionHint({
  userId,
  sessionId,
  questionId,
}: RequestHintParams) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { level: true },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Invalid session or unauthorized attempt access");
  }

  if (session.status !== "IN_PROGRESS") {
    throw new Error("This quiz session is no longer active");
  }

  if (session.level && !session.level.allowHints) {
    throw new Error("Timed hints are disabled for this Crown Trial assessment");
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson);
  const activeQuestionId = questionIds[session.currentQuestionIndex];

  if (activeQuestionId !== questionId) {
    throw new Error("Hint requested for an inactive question in the sequence");
  }

  // Server-side timer check: at least (35 - 15) = 20s must have elapsed
  const now = Date.now();
  const startedAt = new Date(session.currentQuestionStartedAt).getTime();
  const elapsedSec = Math.floor((now - startedAt) / 1000);
  const remainingSec = Math.max(0, (session.level?.timeLimitPerQuestion || TIME_LIMIT_SECONDS) - elapsedSec);

  if (remainingSec > HINT_UNLOCK_REMAINING_SECONDS + NETWORK_GRACE_SECONDS) {
    throw new Error(`Hint will unlock when 15 seconds remain. (${remainingSec}s remaining)`);
  }

  const question = await prisma.bankQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question not found in database");
  }

  // Increment hints used count in session
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { hintsUsedCount: { increment: 1 } },
  });

  return {
    questionId,
    hint: question.hint || "Deconstruct the question invariants step-by-step; eliminate choices violating boundary conditions.",
    secondsRemaining: remainingSec,
  };
}

/**
 * 4. Submit an answer to the active question with authoritative validation
 */
export async function submitQuestionAnswer({
  userId,
  sessionId,
  questionId,
  selectedOptionId,
}: SubmitAnswerParams) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { level: true, user: true },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Invalid quiz session or unauthorized access");
  }

  if (session.status !== "IN_PROGRESS") {
    throw new Error("This quiz session has already completed or expired");
  }

  // 1. Idempotency check: see if already answered previously in this session
  const existingAnswer = await prisma.quizAttemptAnswer.findFirst({
    where: {
      sessionId,
      questionId,
    },
  });

  const question = await prisma.bankQuestion.findUnique({
    where: { id: questionId },
  });

  if (!question) {
    throw new Error("Question record not found");
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson);
  const currentIndex = session.currentQuestionIndex;
  const isLastQuestion = currentIndex >= questionIds.length - 1;

  const nextQId = !isLastQuestion ? questionIds[currentIndex + 1] : null;
  const nextQ = nextQId ? await prisma.bankQuestion.findUnique({ where: { id: nextQId } }) : null;
  const nextQuestionPayload = nextQ
    ? {
        id: nextQ.id,
        question_text: nextQ.questionText,
        code_snippet: nextQ.codeSnippet,
        options: JSON.parse(nextQ.optionsJson),
        difficulty: nextQ.difficulty,
        xp_reward: nextQ.xpReward,
        topic: nextQ.topic,
        subtopic: nextQ.subtopic,
        tags: JSON.parse(nextQ.tagsJson || "[]"),
      }
    : null;

  if (existingAnswer) {
    // Return existing evaluation idempotently without out-of-order error
    return {
      questionId,
      isCorrect: existingAnswer.isCorrect,
      selectedOptionId: existingAnswer.selectedOptionId as "A" | "B" | "C" | "D",
      correctOptionId: question.correctOptionId as "A" | "B" | "C" | "D",
      explanation: question.explanation,
      misconceptionExplanation: question.misconceptionExplanation,
      referenceSource: question.referenceSource,
      score: session.score,
      totalQuestions: session.totalQuestions,
      currentIndex,
      hasNextQuestion: currentIndex < questionIds.length - 1,
      levelComplete: (session.status as string) === "COMPLETED",
      nextQuestion: nextQuestionPayload,
    };
  }

  // 2. Out-of-order sequence check for new submissions
  const activeQuestionId = questionIds[currentIndex];
  if (activeQuestionId !== questionId) {
    throw new Error("Out-of-order submission: question does not match current sequence");
  }

  // Server-side timing check
  const now = new Date();
  const startedAt = new Date(session.currentQuestionStartedAt).getTime();
  const timeSpentSec = Math.floor((now.getTime() - startedAt) / 1000);
  const timeLimit = session.level?.timeLimitPerQuestion || TIME_LIMIT_SECONDS;
  const isExpired = timeSpentSec > timeLimit + NETWORK_GRACE_SECONDS;

  // Evaluate correctness
  const isCorrect = !isExpired && selectedOptionId.toUpperCase() === question.correctOptionId.toUpperCase();
  const newScore = isCorrect ? session.score + 1 : session.score;

  // Record answer
  await prisma.quizAttemptAnswer.create({
    data: {
      sessionId,
      questionId,
      selectedOptionId,
      isCorrect,
      timeSpentSeconds: timeSpentSec,
      answeredAt: now,
    },
  });

  let levelComplete = false;
  let passed = false;
  let finalAccuracy = 0;
  let xpAwarded = 0;

  if (isLastQuestion) {
    levelComplete = true;
    finalAccuracy = Math.round((newScore / session.totalQuestions) * 100);
    const threshold = session.level?.passingThreshold || 9;
    passed = newScore >= Math.min(threshold, session.totalQuestions);

    if (passed) {
      xpAwarded = session.level?.xpReward || 200;
      await awardUserXp(
        userId,
        xpAwarded,
        "LEVEL_COMPLETE",
        `Conquered Level ${session.levelNumber} in ${session.subjectSlug} (${newScore}/${session.totalQuestions} score)`
      );

      // Unlock next level (Level + 1)
      const nextLevelNum = session.levelNumber + 1;
      if (nextLevelNum <= 7) {
        await prisma.studentLevelProgress.upsert({
          where: {
            userId_subjectSlug_levelNumber: {
              userId,
              subjectSlug: session.subjectSlug,
              levelNumber: nextLevelNum,
            },
          },
          update: { isUnlocked: true },
          create: {
            userId,
            subjectSlug: session.subjectSlug,
            levelNumber: nextLevelNum,
            isUnlocked: true,
          },
        });
      }
    }

    // Update current level progress record
    const existingProgress = await prisma.studentLevelProgress.findUnique({
      where: {
        userId_subjectSlug_levelNumber: {
          userId,
          subjectSlug: session.subjectSlug,
          levelNumber: session.levelNumber,
        },
      },
    });

    const best = Math.max(existingProgress?.bestScore || 0, newScore);
    await prisma.studentLevelProgress.upsert({
      where: {
        userId_subjectSlug_levelNumber: {
          userId,
          subjectSlug: session.subjectSlug,
          levelNumber: session.levelNumber,
        },
      },
      update: {
        isCompleted: passed || Boolean(existingProgress?.isCompleted),
        bestScore: best,
        latestScore: newScore,
        attemptsCount: { increment: 1 },
        completedAt: passed ? now : existingProgress?.completedAt,
      },
      create: {
        userId,
        subjectSlug: session.subjectSlug,
        levelNumber: session.levelNumber,
        isUnlocked: true,
        isCompleted: passed,
        bestScore: newScore,
        latestScore: newScore,
        attemptsCount: 1,
        completedAt: passed ? now : null,
      },
    });

    // Update session status
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        score: newScore,
        passed,
        accuracy: finalAccuracy,
        completedAt: now,
      },
    });
  } else {
    // Advance to next question & reset server countdown start timestamp
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: {
        score: newScore,
        currentQuestionIndex: currentIndex + 1,
        currentQuestionStartedAt: now,
      },
    });
  }

  return {
    questionId,
    isCorrect,
    selectedOptionId,
    correctOptionId: question.correctOptionId as "A" | "B" | "C" | "D",
    explanation: question.explanation,
    misconceptionExplanation: question.misconceptionExplanation,
    referenceSource: question.referenceSource,
    score: newScore,
    totalQuestions: session.totalQuestions,
    currentIndex,
    hasNextQuestion: !isLastQuestion,
    levelComplete,
    passed,
    xpAwarded,
    isExpired,
    nextQuestion: nextQuestionPayload,
  };
}

/**
 * 5. Fetch full results review for a completed session (all 12 questions)
 */
export async function getLevelAttemptResults(sessionId: string, userId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      level: { include: { subject: true } },
      answers: true,
    },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Session not found or unauthorized");
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson);
  const questions = await prisma.bankQuestion.findMany({
    where: { id: { in: questionIds } },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const answerMap = new Map(session.answers.map((a) => [a.questionId, a]));

  const reviewItems = questionIds.map((qId, idx) => {
    const q = questionMap.get(qId);
    const ans = answerMap.get(qId);
    return {
      index: idx + 1,
      questionId: qId,
      questionText: q?.questionText || "",
      codeSnippet: q?.codeSnippet,
      options: q ? JSON.parse(q.optionsJson) : [],
      selectedOptionId: ans?.selectedOptionId || null,
      correctOptionId: q?.correctOptionId || "A",
      isCorrect: Boolean(ans?.isCorrect),
      timeSpentSeconds: ans?.timeSpentSeconds || 0,
      hintRequested: Boolean(ans?.hintRequested),
      explanation: q?.explanation || "",
      misconceptionExplanation: q?.misconceptionExplanation,
      referenceSource: q?.referenceSource,
      topic: q?.topic,
      subtopic: q?.subtopic,
    };
  });

  const passingThreshold = session.level?.passingThreshold || 9;
  const passed = session.score >= Math.min(passingThreshold, session.totalQuestions);

  // Group performance by topic
  const topicStats: Record<string, { total: number; correct: number }> = {};
  reviewItems.forEach((item) => {
    const t = item.topic || "Core Concept";
    if (!topicStats[t]) topicStats[t] = { total: 0, correct: 0 };
    topicStats[t].total++;
    if (item.isCorrect) topicStats[t].correct++;
  });

  const strongTopics: string[] = [];
  const weakTopics: string[] = [];

  for (const [top, st] of Object.entries(topicStats)) {
    const pct = Math.round((st.correct / st.total) * 100);
    if (pct >= 75) strongTopics.push(top);
    else weakTopics.push(top);
  }

  // ML Service Telemetry: Predict student profile from attempt interactions
  let mlRecommendation = null;
  try {
    const interactions = reviewItems.map((item) => ({
      student_id: userId,
      topic_id: item.topic || session.subjectSlug,
      question_id: item.questionId,
      answer_correct: item.isCorrect,
      time_taken_seconds: item.timeSpentSeconds,
      timestamp: new Date().toISOString(),
    }));

    const prediction = await mlClient.predictStudentProfile(userId, interactions);
    mlRecommendation = {
      action: prediction.recommended_action,
      overallMastery: prediction.overall_mastery,
      suggestedWeakTopics: prediction.weak_topics,
      suggestedStrongTopics: prediction.strong_topics,
    };
  } catch (e) {
    // Graceful fallback
  }

  return {
    sessionId: session.id,
    subjectSlug: session.subjectSlug,
    realmName: session.level?.subject?.territoryName || "Academic Realm",
    levelNumber: session.levelNumber,
    levelTitle: session.level?.title || `Level ${session.levelNumber}`,
    score: session.score,
    totalQuestions: session.totalQuestions,
    accuracy: session.accuracy,
    passed,
    passingThreshold,
    hintsUsedCount: session.hintsUsedCount,
    xpAwarded: passed ? session.level?.xpReward || 200 : 0,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    strongTopics,
    weakTopics,
    mlRecommendation,
    questionsReview: reviewItems,
  };
}

/**
 * 6. Get active session state (with current question and remaining timer)
 */
export async function getActiveQuizSession(sessionId: string, userId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      level: { include: { subject: true } },
    },
  });

  if (!session || session.userId !== userId) {
    throw new Error("Session not found or unauthorized");
  }

  if (session.status === "COMPLETED") {
    const results = await getLevelAttemptResults(sessionId, userId);
    return {
      isCompleted: true,
      results,
    };
  }

  const questionIds: string[] = JSON.parse(session.questionIdsJson);
  const activeQuestionId = questionIds[session.currentQuestionIndex];
  const q = await prisma.bankQuestion.findUnique({ where: { id: activeQuestionId } });

  if (!q) {
    throw new Error("Question not found in question bank");
  }

  const now = new Date();
  const startedAt = new Date(session.currentQuestionStartedAt).getTime();
  const elapsedSec = Math.floor((now.getTime() - startedAt) / 1000);
  const timeLimit = session.level?.timeLimitPerQuestion || TIME_LIMIT_SECONDS;
  const secondsRemaining = Math.max(0, timeLimit - elapsedSec);

  return {
    isCompleted: false,
    session: {
      sessionId: session.id,
      subjectSlug: session.subjectSlug,
      realmName: session.level?.subject?.territoryName || "Academic Realm",
      levelNumber: session.levelNumber,
      levelTitle: session.level?.title || `Level ${session.levelNumber}`,
      levelSubtitle: session.level?.subtitle,
      purpose: session.level?.purpose,
      passingThreshold: Math.min(session.level?.passingThreshold || 9, questionIds.length),
      totalQuestions: questionIds.length,
      currentQuestionIndex: session.currentQuestionIndex,
      timeLimitSeconds: timeLimit,
      allowHints: session.level?.allowHints ?? true,
      secondsRemaining,
      currentQuestion: {
        id: q.id,
        question_text: q.questionText,
        code_snippet: q.codeSnippet,
        options: JSON.parse(q.optionsJson),
        difficulty: q.difficulty,
        xp_reward: q.xpReward,
        topic: q.topic,
        subtopic: q.subtopic,
        tags: JSON.parse(q.tagsJson || "[]"),
      },
      score: session.score,
    },
  };
}
