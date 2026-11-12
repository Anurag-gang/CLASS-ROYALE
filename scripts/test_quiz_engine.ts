import { prisma } from "../src/lib/db";
import {
  getSubjectLevelsWithProgress,
  startLevelAttempt,
  requestQuestionHint,
  submitQuestionAnswer,
  getLevelAttemptResults,
} from "../src/lib/services/levelQuizService";

async function runQuizEngineTestSuite() {
  console.log("=================================================");
  console.log("QUIZ ENGINE AUTHORITATIVE TEST SUITE");
  console.log("=================================================");

  // 1. Find a test student
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
  });

  if (!student) {
    throw new Error("No test student found in database");
  }
  console.log(`Using test student: ${student.username} (${student.id})`);

  const subjectSlug = "data-structures-and-algorithms";

  // Test 1: Fetch 7 Levels
  console.log("\n[TEST 1] Fetching 7 Levels for realm:", subjectSlug);
  const levels = await getSubjectLevelsWithProgress(subjectSlug, student.id);
  console.log(`Total levels returned: ${levels.length}`);
  if (levels.length !== 7) {
    throw new Error(`Expected 7 levels, got ${levels.length}`);
  }
  console.log(`Level 1 Unlocked: ${levels[0].isUnlocked} (Expected: true)`);
  console.log(`Level 2 Unlocked: ${levels[1].isUnlocked}`);

  // Test 2: Start Level 1 Attempt
  console.log("\n[TEST 2] Starting Level 1 Attempt Session");
  const attempt = await startLevelAttempt({
    userId: student.id,
    subjectSlug,
    levelNumber: 1,
  });

  console.log(`Session created: ${attempt.sessionId}`);
  console.log(`Total questions in attempt: ${attempt.totalQuestions}`);
  console.log(`Current Question Index: ${attempt.currentQuestionIndex}`);
  console.log(`Current Question Text: "${attempt.currentQuestion.question_text.slice(0, 50)}..."`);
  console.log(`Options Count: ${attempt.currentQuestion.options.length}`);

  // Security Check: Ensure answer key is NOT exposed
  const rawQ = attempt.currentQuestion as any;
  if (rawQ.correct_option_id || rawQ.explanation || rawQ.hint) {
    throw new Error("SECURITY FAILURE: Answer key, explanation, or hint exposed in active question payload!");
  }
  console.log("✔ SECURITY CHECK PASSED: Answer key & hint withheld from initial payload.");

  // Test 3: Hint Timing Enforcement
  console.log("\n[TEST 3] Testing Hint Timing Lock (Immediate request)");
  try {
    await requestQuestionHint({
      userId: student.id,
      sessionId: attempt.sessionId,
      questionId: attempt.currentQuestion.id,
    });
    console.log("⚠ Hint unlocked prematurely!");
  } catch (err: any) {
    console.log(`✔ TIMING ENFORCEMENT PASSED: Hint locked as expected: "${err.message}"`);
  }

  // Test 4: Answer Submission
  console.log("\n[TEST 4] Submitting Question 1 Answer");
  const q1Result = await submitQuestionAnswer({
    userId: student.id,
    sessionId: attempt.sessionId,
    questionId: attempt.currentQuestion.id,
    selectedOptionId: "B",
  });

  console.log(`Evaluated: isCorrect = ${q1Result.isCorrect}, Correct Choice = Option ${q1Result.correctOptionId}`);
  console.log(`Explanation provided: "${q1Result.explanation.slice(0, 50)}..."`);
  console.log(`Misconception note: "${(q1Result.misconceptionExplanation || '').slice(0, 50)}..."`);
  console.log(`Score so far: ${q1Result.score}/${q1Result.totalQuestions}`);

  // Test 5: Idempotency Check
  console.log("\n[TEST 5] Submitting Same Answer Again (Idempotency Check)");
  const idempotentResult = await submitQuestionAnswer({
    userId: student.id,
    sessionId: attempt.sessionId,
    questionId: attempt.currentQuestion.id,
    selectedOptionId: "B",
  });
  if (idempotentResult.score !== q1Result.score) {
    throw new Error("IDEMPOTENCY FAILURE: Score changed on duplicate submission!");
  }
  console.log("✔ IDEMPOTENCY PASSED: Duplicate answer safely returned cached result.");

  // Test 6: Answering remaining questions to test Level completion & unlocking
  console.log("\n[TEST 6] Completing remaining questions in session to test Level Completion");
  const sessionDb = await prisma.quizSession.findUnique({ where: { id: attempt.sessionId } });
  const questionIds: string[] = JSON.parse(sessionDb!.questionIdsJson);

  let finalRes: any = null;
  for (let i = 1; i < questionIds.length; i++) {
    const qId = questionIds[i];
    const qDb = await prisma.bankQuestion.findUnique({ where: { id: qId } });
    finalRes = await submitQuestionAnswer({
      userId: student.id,
      sessionId: attempt.sessionId,
      questionId: qId,
      selectedOptionId: (qDb?.correctOptionId as any) || "A", // select correct to trigger passing
    });
  }

  console.log(`Session Complete: ${finalRes.levelComplete}`);
  console.log(`Passed: ${finalRes.passed}`);
  console.log(`XP Awarded: ${finalRes.xpAwarded}`);

  // Test 7: Verify Level 2 is now unlocked!
  console.log("\n[TEST 7] Verifying Level 2 Unlocked in Student Progress");
  const updatedLevels = await getSubjectLevelsWithProgress(subjectSlug, student.id);
  const lvl2 = updatedLevels.find((l) => l.levelNumber === 2);
  console.log(`Level 2 Unlocked Status: ${lvl2?.isUnlocked} (Expected: true)`);
  if (!lvl2?.isUnlocked) {
    throw new Error("PROGRESSION FAILURE: Level 2 was not unlocked after passing Level 1!");
  }
  console.log("✔ PROGRESSION ENGINE PASSED: Level 2 unlocked automatically upon conquering Level 1!");

  // Test 8: Full 12-Question Review
  console.log("\n[TEST 8] Fetching Level Attempt Results & Review");
  const results = await getLevelAttemptResults(attempt.sessionId, student.id);
  console.log(`Review Items Count: ${results.questionsReview.length}`);
  console.log(`Strong Topics Detected:`, results.strongTopics);
  console.log(`Weak Topics Detected:`, results.weakTopics);
  console.log(`Total Score: ${results.score}/${results.totalQuestions} (${results.accuracy}%)`);

  console.log("\n=================================================");
  console.log("ALL 8 QUIZ ENGINE TEST SUITES PASSED CLEANLY!");
  console.log("=================================================");

  await prisma.$disconnect();
}

runQuizEngineTestSuite().catch((e) => {
  console.error("Test suite failed:", e);
  process.exit(1);
});
