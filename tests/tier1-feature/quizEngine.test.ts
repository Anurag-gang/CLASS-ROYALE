/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Tier 1 Feature Test Suite — Authoritative Quiz Engine
 * Target: tests/tier1-feature/quizEngine.test.ts
 *
 * Validates:
 * 1. 12-Question Selector: exactly 12 questions selected across all 42 realm & level combinations.
 * 2. Level 1 Anti-Collision Cycling: distance >= 4, 0 consecutive duplicates.
 * 3. Levels 2-6 Prerequisite Spiral Sampling: exactly 12 distinct questions (0 duplicates).
 * 4. Level 7 Capstone Broad-Spectrum Trials: exactly 12 distinct questions across all 7 levels.
 * 5. Pre-Submission Sanitization & Zero Answer Leakage in startQuizAttempt.
 * 6. Server-Side 35s Timer Authority (+2.5s grace = 37.5s max elapsed).
 * 7. Idempotency & Replay Attack Defense.
 * 8. Timed Hint Gating (<= 15s unlock, strict HTTP 403 lockout on Level 7 Crown Trial).
 * 9. Transparent Scoring & Progression Engine (9/12 passing threshold unlocks Level N+1).
 * 10. Immutable Attempt Snapshots in QuizAttemptAnswer.
 * 11. REST API Route Handler Integration & Security Gates.
 * =============================================================================
 */

import assert from "node:assert/strict";
import { describe, it } from "../run-all-tests";
import { prisma } from "../../src/lib/db";
import {
  select12QuestionsForAttempt,
  startQuizAttempt,
  submitQuizAnswer,
  requestQuizHint,
  finalizeQuizAttempt,
  getActiveQuizAttempt,
  PASSING_SCORE_THRESHOLD,
  TOTAL_QUESTIONS_PER_ATTEMPT,
} from "../../src/lib/quiz/authoritativeQuizEngine";
import { getAllAcademicRealms } from "../../src/lib/realms/academicRealms";

// Route handlers for direct HTTP contract testing
import { POST as startRoutePost } from "../../src/app/api/quiz/attempts/start/route";
import { POST as hintRoutePost } from "../../src/app/api/quiz/attempts/[id]/hint/route";
import { POST as finalizeRoutePost } from "../../src/app/api/quiz/attempts/[id]/finalize/route";

const TEST_STUDENT_ID = "cmuve7bip001e31zcc516w4iw"; // anurag (STUDENT)
const TEST_SUBJECT_SLUG = "data-structures-and-algorithms";

// Helper to track and cleanup any created test records to ensure zero data preservation pollution
const createdSessionIds: string[] = [];
const createdXpTransactionIds: string[] = [];

async function cleanupTestData() {
  if (createdSessionIds.length > 0) {
    await prisma.quizAttemptAnswer.deleteMany({
      where: { sessionId: { in: createdSessionIds } },
    });
    await prisma.quizSession.deleteMany({
      where: { id: { in: createdSessionIds } },
    });
    createdSessionIds.length = 0;
  }

  // Clean up any XP transactions generated during testing to preserve 19 XP transactions count
  await prisma.xPTransaction.deleteMany({
    where: { source: "ACADEMIC_LEVEL_PASS" },
  });

  // Clean up studentLevelProgress for level > 1 that might have been unlocked during tests
  await prisma.studentLevelProgress.deleteMany({
    where: {
      userId: TEST_STUDENT_ID,
      levelNumber: { gt: 1 },
    },
  });

  // Reset Level 1 progress for TEST_STUDENT_ID to pristine state
  await prisma.studentLevelProgress.updateMany({
    where: {
      userId: TEST_STUDENT_ID,
      subjectSlug: TEST_SUBJECT_SLUG,
      levelNumber: 1,
    },
    data: {
      isCompleted: false,
      bestScore: 0,
      latestScore: 0,
      attemptsCount: 0,
      totalHintsUsed: 0,
    },
  });
}

describe("Authoritative Quiz Engine — 12-Question Stratified Spiral Selector", () => {
  it("exhaustively selects exactly 12 validated PUBLISHED questions for all 42 realm & level configurations", async () => {
    const realms = getAllAcademicRealms();
    assert.equal(realms.length, 6, "Expected 6 academic realms");

    for (const realm of realms) {
      for (let level = 1; level <= 7; level++) {
        const questions = await select12QuestionsForAttempt(realm.slug, level);
        assert.equal(
          questions.length,
          TOTAL_QUESTIONS_PER_ATTEMPT,
          `Failed 12-question count invariant for realm '${realm.slug}' Level ${level}: got ${questions.length}`
        );

        // Verify every item is PUBLISHED
        for (const q of questions) {
          assert.equal(
            q.status,
            "PUBLISHED",
            `Question ${q.id} in ${realm.slug} Level ${level} is not PUBLISHED (status: ${q.status})`
          );
        }
      }
    }
  });

  it("verifies Level 1 anti-collision double-pass cycling: 0 consecutive duplicates and distance >= 4", async () => {
    const realms = getAllAcademicRealms();

    for (const realm of realms) {
      const questions = await select12QuestionsForAttempt(realm.slug, 1);
      assert.equal(questions.length, 12, "Level 1 must contain exactly 12 questions");

      // All questions must strictly originate from Level 1 syllabus
      for (const q of questions) {
        assert.equal(
          q.levelNumber,
          1,
          `Level 1 attempt in '${realm.slug}' leaked out-of-syllabus question ${q.id} with levelNumber ${q.levelNumber}`
        );
      }

      // Check distance between identical questions
      for (let i = 0; i < questions.length; i++) {
        for (let j = i + 1; j < questions.length; j++) {
          if (questions[i].id === questions[j].id) {
            const distance = j - i;
            assert.ok(
              distance >= 4,
              `Level 1 duplicate spacing violation in '${realm.slug}': question ${questions[i].id} at index ${i} and ${j} has distance ${distance} < 4`
            );
          }
        }
      }

      // Check 0 consecutive duplicates
      for (let i = 0; i < questions.length - 1; i++) {
        assert.notEqual(
          questions[i].id,
          questions[i + 1].id,
          `Level 1 consecutive duplicate violation in '${realm.slug}' at index ${i}`
        );
      }
    }
  });

  it("verifies Levels 2-6 prerequisite spiral sampling: exactly 12 distinct questions with 0 duplicates", async () => {
    const realms = getAllAcademicRealms();

    for (const realm of realms) {
      for (let level = 2; level <= 6; level++) {
        const questions = await select12QuestionsForAttempt(realm.slug, level);
        assert.equal(questions.length, 12);

        // Verify 0 duplicates across all 12 questions
        const uniqueIds = new Set(questions.map((q) => q.id));
        assert.equal(
          uniqueIds.size,
          12,
          `Levels 2-6 duplicate question violation in '${realm.slug}' Level ${level}: expected 12 distinct questions, got ${uniqueIds.size}`
        );

        // Verify no supplementary question exceeds target level
        for (const q of questions) {
          assert.ok(
            q.levelNumber <= level,
            `Prerequisite leak: question ${q.id} has levelNumber ${q.levelNumber} > target level ${level}`
          );
        }
      }
    }
  });

  it("verifies Level 7 Crown Trial capstone sampling: 0 duplicates across all 7 levels", async () => {
    const realms = getAllAcademicRealms();

    for (const realm of realms) {
      const questions = await select12QuestionsForAttempt(realm.slug, 7);
      assert.equal(questions.length, 12, "Level 7 Crown Trial must have 12 questions");

      const uniqueIds = new Set(questions.map((q) => q.id));
      assert.equal(
        uniqueIds.size,
        12,
        `Level 7 Crown Trial duplicate violation in '${realm.slug}': expected 12 distinct questions, got ${uniqueIds.size}`
      );

      // Verify broad-spectrum representation: contains questions from target Level 7 and prerequisites
      const levelsRepresented = new Set(questions.map((q) => q.levelNumber));
      assert.ok(
        levelsRepresented.has(7),
        `Level 7 trial in '${realm.slug}' must include Level 7 capstone questions`
      );
      assert.ok(
        levelsRepresented.size >= 4,
        `Level 7 trial in '${realm.slug}' must represent a broad spectrum across multiple levels (got ${levelsRepresented.size} distinct levels)`
      );
    }
  });
});

describe("Authoritative Quiz Engine — Session Lifecycle & Delivery Sanitization", () => {
  it("initializes attempt session and guarantees zero pre-submission answer leakage", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });

      createdSessionIds.push(startResult.attemptId);

      assert.ok(startResult.attemptId, "Attempt ID must be defined");
      assert.ok(startResult.sessionToken, "Session token must be generated");
      assert.equal(startResult.totalQuestions, 12);
      assert.equal(startResult.currentQuestionIndex, 0);
      assert.equal(startResult.timeLimitSeconds, 35);
      assert.equal(startResult.passingThreshold, 9);
      assert.equal(startResult.hintsAvailable, true, "Hints must be available for Level 1");

      const q = startResult.question;
      assert.ok(q.id, "Question ID must be present");
      assert.ok(q.questionText, "Question text must be present");
      assert.ok(Array.isArray(q.options), "Options array must be present");
      assert.equal(q.options.length, 4, "Expected 4 MCQ options");

      // STRICT ZERO-LEAKAGE INVARIANTS:
      assert.equal(
        (q as any).correctOptionIds,
        undefined,
        "SECURITY LEAK: correctOptionIds must NOT be sent to client!"
      );
      assert.equal(
        (q as any).correctOptionId,
        undefined,
        "SECURITY LEAK: correctOptionId must NOT be sent to client!"
      );
      assert.equal(
        (q as any).explanation,
        undefined,
        "SECURITY LEAK: explanation must NOT be sent to client!"
      );
      assert.equal(
        (q as any).hint,
        undefined,
        "SECURITY LEAK: hint text must NOT be sent in question payload!"
      );
      assert.equal(
        (q as any).misconceptionsJson,
        undefined,
        "SECURITY LEAK: misconceptionsJson must NOT be sent to client!"
      );

      // Verify database session record
      const dbSession = await prisma.quizSession.findUnique({
        where: { id: startResult.attemptId },
      });
      assert.ok(dbSession);
      assert.equal(dbSession.status, "IN_PROGRESS");
      assert.equal(dbSession.currentQuestionIndex, 0);
      assert.equal(dbSession.score, 0);
      assert.equal(dbSession.academicScore, 0);
    } finally {
      await cleanupTestData();
    }
  });

  it("strictly enforces progression gate: blocks startAttempt for locked Level > 1", async () => {
    try {
      // Level 5 is initially locked for student
      let errorThrown = false;
      try {
        await startQuizAttempt({
          userId: TEST_STUDENT_ID,
          subjectSlug: TEST_SUBJECT_SLUG,
          levelNumber: 5,
          forceNew: true,
        });
      } catch (err: any) {
        errorThrown = true;
        assert.equal(err.statusCode, 403, "Expected HTTP 403 Forbidden for locked level");
        assert.ok(err.message.includes("locked"), "Error message must indicate level is locked");
      }
      assert.ok(errorThrown, "startAttempt must reject locked level with 403");
    } finally {
      await cleanupTestData();
    }
  });
});

describe("Authoritative Quiz Engine — Server-Side 35s Timer Authority", () => {
  it("accepts on-time answer submissions and awards academic score", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      // Fetch the true correct option from DB to test correct evaluation
      const dbQuestion = await prisma.questionBankItem.findUnique({
        where: { id: startResult.question.id },
      });
      const correctOptionIds: string[] = JSON.parse(dbQuestion!.correctOptionIdsJson || "[]");

      const answerResult = await submitQuizAnswer({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionIndex: 0,
        selectedOptionIds: correctOptionIds,
      });

      assert.equal(answerResult.isCorrect, true);
      assert.equal(answerResult.academicPointsEarned, 1);
      assert.equal(answerResult.currentAcademicScore, 1);
      assert.equal(answerResult.isExpired, false);
      assert.equal(answerResult.nextQuestionIndex, 1);
      assert.ok(answerResult.explanation, "Pedagogical explanation must be returned upon answer");
    } finally {
      await cleanupTestData();
    }
  });

  it("accepts submissions arriving within 2.5s network grace period (36.5s elapsed)", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      // Artificially simulate 36.5s elapsed time on server clock (within 35s + 2.5s grace)
      const simulatedStartTime = new Date(Date.now() - 36500);
      await prisma.quizSession.update({
        where: { id: startResult.attemptId },
        data: { currentQuestionStartedAt: simulatedStartTime },
      });

      const dbQuestion = await prisma.questionBankItem.findUnique({
        where: { id: startResult.question.id },
      });
      const correctOptionIds: string[] = JSON.parse(dbQuestion!.correctOptionIdsJson || "[]");

      const answerResult = await submitQuizAnswer({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionIndex: 0,
        selectedOptionIds: correctOptionIds,
      });

      assert.equal(
        answerResult.isExpired,
        false,
        "Submission at 36.5s should be accepted under 2.5s network grace"
      );
      assert.equal(answerResult.isCorrect, true);
      assert.equal(answerResult.academicPointsEarned, 1);
    } finally {
      await cleanupTestData();
    }
  });

  it("strictly enforces 35s deadline: marks submissions after 37.5s as timed out with 0 points", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      // Artificially simulate 38.5s elapsed time on server clock (exceeds 37.5s hard cutoff)
      const simulatedStartTime = new Date(Date.now() - 38500);
      await prisma.quizSession.update({
        where: { id: startResult.attemptId },
        data: { currentQuestionStartedAt: simulatedStartTime },
      });

      const dbQuestion = await prisma.questionBankItem.findUnique({
        where: { id: startResult.question.id },
      });
      const correctOptionIds: string[] = JSON.parse(dbQuestion!.correctOptionIdsJson || "[]");

      // Even though the student selected the correct answer, it arrived after 37.5s
      const answerResult = await submitQuizAnswer({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionIndex: 0,
        selectedOptionIds: correctOptionIds,
      });

      assert.equal(answerResult.isExpired, true, "Must be marked isExpired: true");
      assert.equal(answerResult.isCorrect, false, "Expired submission must be marked incorrect");
      assert.equal(answerResult.academicPointsEarned, 0, "Expired submission must receive 0 points");
      assert.equal(answerResult.currentAcademicScore, 0);
      assert.ok(
        answerResult.misconceptionExplanation?.includes("Time limit exceeded"),
        "Misconception explanation must reflect time limit expiration"
      );
    } finally {
      await cleanupTestData();
    }
  });
});

describe("Authoritative Quiz Engine — Idempotency & Replay Defense", () => {
  it("returns cached evaluation idempotently and prevents duplicate score increments", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      const dbQuestion = await prisma.questionBankItem.findUnique({
        where: { id: startResult.question.id },
      });
      const correctOptionIds: string[] = JSON.parse(dbQuestion!.correctOptionIdsJson || "[]");

      // 1. First submission
      const firstSubmission = await submitQuizAnswer({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionIndex: 0,
        selectedOptionIds: correctOptionIds,
        idempotencyKey: "key-12345",
      });

      assert.equal(firstSubmission.academicPointsEarned, 1);
      assert.equal(firstSubmission.currentAcademicScore, 1);

      // 2. Duplicate submission for question index 0
      const secondSubmission = await submitQuizAnswer({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionIndex: 0,
        selectedOptionIds: correctOptionIds,
        idempotencyKey: "key-12345",
      });

      // Verify identical response returned
      assert.equal(secondSubmission.questionIndex, 0);
      assert.equal(secondSubmission.isCorrect, true);
      assert.equal(
        secondSubmission.currentAcademicScore,
        1,
        "Score must NOT increment on duplicate submission!"
      );

      // Verify database has exactly 1 QuizAttemptAnswer row
      const answerRows = await prisma.quizAttemptAnswer.findMany({
        where: { sessionId: startResult.attemptId, questionIndex: 0 },
      });
      assert.equal(answerRows.length, 1, "Expected exactly 1 database answer row for question index 0");
    } finally {
      await cleanupTestData();
    }
  });

  it("strictly rejects out-of-order sequence submissions with HTTP 400", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      // Attempt to jump directly to question index 5 while active is 0
      let outOfOrderRejected = false;
      try {
        await submitQuizAnswer({
          userId: TEST_STUDENT_ID,
          sessionId: startResult.attemptId,
          questionIndex: 5,
          selectedOptionIds: ["opt_dummy"],
        });
      } catch (err: any) {
        outOfOrderRejected = true;
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes("Out-of-order"));
      }
      assert.ok(outOfOrderRejected, "Out-of-order submission must be rejected with 400");
    } finally {
      await cleanupTestData();
    }
  });
});

describe("Authoritative Quiz Engine — Timed Hint Gating & Level 7 Crown Trial Lockout", () => {
  it("rejects hint requests when remaining time > 15s (+2.5s network grace)", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      // Attempt immediately after start (35s remaining, > 17.5s)
      let earlyRejected = false;
      try {
        await requestQuizHint({
          userId: TEST_STUDENT_ID,
          sessionId: startResult.attemptId,
          questionId: startResult.question.id,
        });
      } catch (err: any) {
        earlyRejected = true;
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes("Hint will unlock when 15 seconds remain"));
      }
      assert.ok(earlyRejected, "Early hint request must be rejected with 400");
    } finally {
      await cleanupTestData();
    }
  });

  it("delivers hint when remaining time <= 15s (+2.5s grace) and tracks hintsUsedCount idempotently", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      // Advance server clock so 20s have elapsed (15s remaining)
      const simulatedStartTime = new Date(Date.now() - 20000);
      await prisma.quizSession.update({
        where: { id: startResult.attemptId },
        data: { currentQuestionStartedAt: simulatedStartTime },
      });

      const hintResult = await requestQuizHint({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionId: startResult.question.id,
      });

      assert.ok(hintResult.hint, "Hint text must be returned");
      assert.ok(hintResult.secondsRemaining <= 16, "Remaining seconds must be <= 16");
      assert.equal(hintResult.hintsUsedCount, 1);

      // Second request in same question window must be idempotent
      const hintResult2 = await requestQuizHint({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionId: startResult.question.id,
      });
      assert.equal(hintResult2.hintsUsedCount, 1, "hintsUsedCount must not increment twice for same question");
    } finally {
      await cleanupTestData();
    }
  });

  it("strictly forbids hints on Level 7 (Crown Trial) with HTTP 403 Forbidden regardless of time", async () => {
    try {
      // Temporarily unlock Level 7 for student to test hint gating
      await prisma.studentLevelProgress.upsert({
        where: {
          userId_subjectSlug_levelNumber: {
            userId: TEST_STUDENT_ID,
            subjectSlug: TEST_SUBJECT_SLUG,
            levelNumber: 7,
          },
        },
        update: { isUnlocked: true },
        create: {
          userId: TEST_STUDENT_ID,
          subjectSlug: TEST_SUBJECT_SLUG,
          levelNumber: 7,
          isUnlocked: true,
        },
      });

      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 7,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      assert.equal(startResult.hintsAvailable, false, "Level 7 must declare hintsAvailable: false");

      // Even when 25s elapsed (10s remaining, well within the normal hint window)
      const simulatedStartTime = new Date(Date.now() - 25000);
      await prisma.quizSession.update({
        where: { id: startResult.attemptId },
        data: { currentQuestionStartedAt: simulatedStartTime },
      });

      let crownTrialLockoutEnforced = false;
      try {
        await requestQuizHint({
          userId: TEST_STUDENT_ID,
          sessionId: startResult.attemptId,
          questionId: startResult.question.id,
        });
      } catch (err: any) {
        crownTrialLockoutEnforced = true;
        assert.equal(
          err.statusCode,
          403,
          `Level 7 hint must return HTTP 403 Forbidden, got ${err.statusCode}`
        );
        assert.ok(
          err.message.includes("Crown Trial") && err.message.includes("disabled"),
          "Error message must specify Crown Trial closed-book exam conditions"
        );
      }
      assert.ok(crownTrialLockoutEnforced, "Level 7 hint request must be rejected with 403");
    } finally {
      await cleanupTestData();
    }
  });
});

describe("Authoritative Quiz Engine — Transparent Scoring & Progression Engine", () => {
  it("enforces 75% passing threshold (9/12): unlocks Level 2 on score >= 9", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      const session = await prisma.quizSession.findUnique({
        where: { id: startResult.attemptId },
      });
      const questionIds: string[] = JSON.parse(session!.questionIdsJson);

      // Simulate answers: answer 9 correctly, 3 incorrectly
      for (let i = 0; i < 12; i++) {
        const qItem = await prisma.questionBankItem.findUnique({
          where: { id: questionIds[i] },
        });
        const correctIds: string[] = JSON.parse(qItem!.correctOptionIdsJson || "[]");

        // First 9 are correct, last 3 are incorrect
        const selectedIds = i < 9 ? correctIds : ["opt_wrong_distractor"];

        // Advance question start time to keep it on-time
        await prisma.quizSession.update({
          where: { id: startResult.attemptId },
          data: { currentQuestionStartedAt: new Date() },
        });

        await submitQuizAnswer({
          userId: TEST_STUDENT_ID,
          sessionId: startResult.attemptId,
          questionIndex: i,
          selectedOptionIds: selectedIds,
        });
      }

      // Finalize attempt
      const finalResult = await finalizeQuizAttempt({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
      });

      assert.equal(finalResult.academicScore, 9, "Academic score must be 9");
      assert.equal(finalResult.totalQuestions, 12);
      assert.equal(finalResult.academicPercentage, 75);
      assert.equal(finalResult.isPassed, true, "9/12 must pass the 75% threshold");
      assert.equal(finalResult.unlockedNextLevel, true, "Passing Level 1 must unlock Level 2");
      assert.equal(finalResult.nextLevelNumber, 2);

      // Check database progression record for Level 2
      const level2Progress = await prisma.studentLevelProgress.findUnique({
        where: {
          userId_subjectSlug_levelNumber: {
            userId: TEST_STUDENT_ID,
            subjectSlug: TEST_SUBJECT_SLUG,
            levelNumber: 2,
          },
        },
      });
      assert.ok(level2Progress, "Level 2 progress row must exist");
      assert.equal(level2Progress.isUnlocked, true, "Level 2 must be unlocked in database");
    } finally {
      await cleanupTestData();
    }
  });

  it("enforces 75% passing threshold: does NOT unlock Level 2 on score < 9 (e.g. 8/12)", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      const session = await prisma.quizSession.findUnique({
        where: { id: startResult.attemptId },
      });
      const questionIds: string[] = JSON.parse(session!.questionIdsJson);

      // Simulate answers: 8 correctly, 4 incorrectly
      for (let i = 0; i < 12; i++) {
        const qItem = await prisma.questionBankItem.findUnique({
          where: { id: questionIds[i] },
        });
        const correctIds: string[] = JSON.parse(qItem!.correctOptionIdsJson || "[]");
        const selectedIds = i < 8 ? correctIds : ["opt_wrong_distractor"];

        await prisma.quizSession.update({
          where: { id: startResult.attemptId },
          data: { currentQuestionStartedAt: new Date() },
        });

        await submitQuizAnswer({
          userId: TEST_STUDENT_ID,
          sessionId: startResult.attemptId,
          questionIndex: i,
          selectedOptionIds: selectedIds,
        });
      }

      const finalResult = await finalizeQuizAttempt({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
      });

      assert.equal(finalResult.academicScore, 8);
      assert.equal(finalResult.isPassed, false, "8/12 (66.7%) must NOT pass threshold");
      assert.equal(finalResult.unlockedNextLevel, false, "Failed attempt must not unlock next level");
      assert.equal(finalResult.nextLevelNumber, null);

      // Verify Level 2 is NOT unlocked
      const level2Progress = await prisma.studentLevelProgress.findUnique({
        where: {
          userId_subjectSlug_levelNumber: {
            userId: TEST_STUDENT_ID,
            subjectSlug: TEST_SUBJECT_SLUG,
            levelNumber: 2,
          },
        },
      });
      assert.ok(!level2Progress || !level2Progress.isUnlocked, "Level 2 must remain locked");
    } finally {
      await cleanupTestData();
    }
  });
});

describe("Authoritative Quiz Engine — Immutable Snapshots", () => {
  it("freezes question text, options, explanations, and latency into QuizAttemptAnswer snapshots", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      const session = await prisma.quizSession.findUnique({
        where: { id: startResult.attemptId },
      });
      const questionIds: string[] = JSON.parse(session!.questionIdsJson);

      const qItem0 = await prisma.questionBankItem.findUnique({ where: { id: questionIds[0] } });
      const correctIds: string[] = JSON.parse(qItem0!.correctOptionIdsJson || "[]");

      await submitQuizAnswer({
        userId: TEST_STUDENT_ID,
        sessionId: startResult.attemptId,
        questionIndex: 0,
        selectedOptionIds: correctIds,
      });

      // Query recorded snapshot in QuizAttemptAnswer
      const recordedAnswer = await prisma.quizAttemptAnswer.findUnique({
        where: {
          sessionId_questionIndex: {
            sessionId: startResult.attemptId,
            questionIndex: 0,
          },
        },
      });

      assert.ok(recordedAnswer, "Answer record must exist");
      assert.ok(recordedAnswer.questionTextSnapshot, "questionTextSnapshot must be frozen");
      assert.equal(recordedAnswer.questionTextSnapshot, qItem0!.questionText);
      assert.ok(recordedAnswer.optionsSnapshotJson, "optionsSnapshotJson must be frozen");
      assert.ok(recordedAnswer.explanationSnapshot, "explanationSnapshot must be frozen");
      assert.equal(recordedAnswer.explanationSnapshot, qItem0!.explanation);
      assert.equal(recordedAnswer.isCorrect, true);
      assert.equal(recordedAnswer.isTimedOut, false);
      assert.ok(recordedAnswer.serverLatencyMs >= 0, "serverLatencyMs must be positive integer");
    } finally {
      await cleanupTestData();
    }
  });
});

describe("Authoritative Quiz Engine — REST API Route Handlers Integration", () => {
  it("POST /api/quiz/attempts/start creates session, sanitizes question 0, and returns HTTP 201", async () => {
    try {
      const request = new Request("http://localhost:3000/api/quiz/attempts/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectSlug: TEST_SUBJECT_SLUG, levelNumber: 1, forceNew: true }),
      });

      const response = await startRoutePost(request);
      assert.equal(response.status, 201, "start endpoint must return HTTP 201 Created");
      const json = await response.json();
      assert.equal(json.success, true);
      assert.ok(json.attemptId);
      assert.ok(json.sessionToken);
      assert.equal(json.totalQuestions, 12);
      assert.equal(json.currentQuestionIndex, 0);
      assert.ok(json.question);
      assert.equal(json.question.options.length, 4);

      createdSessionIds.push(json.attemptId);
    } finally {
      await cleanupTestData();
    }
  });

  it("POST /api/quiz/attempts/[id]/hint enforces Level 7 Crown Trial HTTP 403 Forbidden lockout", async () => {
    try {
      // Temporarily unlock Level 7
      await prisma.studentLevelProgress.upsert({
        where: {
          userId_subjectSlug_levelNumber: {
            userId: TEST_STUDENT_ID,
            subjectSlug: TEST_SUBJECT_SLUG,
            levelNumber: 7,
          },
        },
        update: { isUnlocked: true },
        create: {
          userId: TEST_STUDENT_ID,
          subjectSlug: TEST_SUBJECT_SLUG,
          levelNumber: 7,
          isUnlocked: true,
        },
      });

      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 7,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      const request = new Request(`http://localhost:3000/api/quiz/attempts/${startResult.attemptId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: startResult.question.id }),
      });

      const response = await hintRoutePost(request, {
        params: Promise.resolve({ id: startResult.attemptId }),
      });

      assert.equal(response.status, 403, "Crown trial hint request must return HTTP 403 Forbidden");
      const json = await response.json();
      assert.equal(json.success, false);
      assert.ok(json.error.includes("Crown Trial") && json.error.includes("disabled"));
    } finally {
      await cleanupTestData();
    }
  });

  it("POST /api/quiz/attempts/[id]/finalize finalizes attempt and returns full results", async () => {
    try {
      const startResult = await startQuizAttempt({
        userId: TEST_STUDENT_ID,
        subjectSlug: TEST_SUBJECT_SLUG,
        levelNumber: 1,
        forceNew: true,
      });
      createdSessionIds.push(startResult.attemptId);

      const request = new Request(`http://localhost:3000/api/quiz/attempts/${startResult.attemptId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const response = await finalizeRoutePost(request, {
        params: Promise.resolve({ id: startResult.attemptId }),
      });

      assert.equal(response.status, 200, "Finalize must return HTTP 200 OK");
      const json = await response.json();
      assert.equal(json.success, true);
      assert.equal(json.attemptId, startResult.attemptId);
      assert.equal(json.totalQuestions, 12);
      assert.equal(json.reviewItems.length, 12);
    } finally {
      await cleanupTestData();
    }
  });
});
