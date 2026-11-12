import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("=================================================");
  console.log("CLASS ROYALE: COMPREHENSIVE REPOSITORY AUDIT");
  console.log("=================================================");

  // 1. Prisma Subjects & Courses
  const legacySubjects = await prisma.subject.findMany({
    include: {
      courses: {
        include: {
          questions: true,
          lessons: true,
        },
      },
    },
  });

  console.log("\n--- 1. LEGACY SUBJECTS & COURSES (Prisma Subject/Course) ---");
  let totalLegacyQuestions = 0;
  legacySubjects.forEach((s) => {
    console.log(`Subject: [${s.code}] ${s.title} (slug: ${s.slug})`);
    s.courses.forEach((c) => {
      totalLegacyQuestions += c.questions.length;
      console.log(`  └─ Course/Topic: ${c.title} (slug: ${c.slug}, xpReward: ${c.xpReward}) -> ${c.questions.length} questions, ${c.lessons.length} lessons`);
    });
  });
  console.log(`Total Legacy QuizQuestions in DB: ${totalLegacyQuestions}`);

  // 2. Territory Subjects & Bank Questions
  const territorySubjects = await prisma.territorySubject.findMany({
    include: {
      questions: true,
    },
  });

  console.log("\n--- 2. TERRITORY SUBJECTS & BANK QUESTIONS (Prisma TerritorySubject/BankQuestion) ---");
  let totalBankQuestions = 0;
  const bankQuestionDiffMap: Record<string, number> = {};
  territorySubjects.forEach((ts) => {
    totalBankQuestions += ts.questions.length;
    console.log(`Territory: ${ts.name} (slug: ${ts.slug}, realm: "${ts.territoryName}") -> ${ts.questions.length} questions`);
    const diffs: Record<string, number> = {};
    ts.questions.forEach((q) => {
      diffs[q.difficulty] = (diffs[q.difficulty] || 0) + 1;
      bankQuestionDiffMap[q.difficulty] = (bankQuestionDiffMap[q.difficulty] || 0) + 1;
    });
    console.log(`   Difficulties:`, diffs);
  });
  console.log(`Total BankQuestions in DB: ${totalBankQuestions}`);
  console.log(`Overall Difficulty Breakdown:`, bankQuestionDiffMap);

  // 3. Fallback Questions File
  const fallbackPath = path.join(process.cwd(), "src/data/questions-fallback.json");
  let fallbackData: any = null;
  if (fs.existsSync(fallbackPath)) {
    fallbackData = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
    console.log("\n--- 3. FALLBACK QUESTIONS (src/data/questions-fallback.json) ---");
    console.log(`Version: ${fallbackData.version}, Total Questions: ${fallbackData.questions.length}`);
    const fallbackSubjectCounts: Record<string, number> = {};
    const fallbackDiffs: Record<string, number> = {};
    let missingExplanationCount = 0;
    let missingHintCount = 0;
    let duplicateQuestionTextCount = 0;
    const seenTexts = new Set<string>();

    fallbackData.questions.forEach((q: any) => {
      fallbackSubjectCounts[q.subject_slug] = (fallbackSubjectCounts[q.subject_slug] || 0) + 1;
      fallbackDiffs[q.difficulty] = (fallbackDiffs[q.difficulty] || 0) + 1;
      if (!q.explanation || q.explanation.trim() === "") missingExplanationCount++;
      if (!q.hint) missingHintCount++;
      if (seenTexts.has(q.question_text)) {
        duplicateQuestionTextCount++;
      } else {
        seenTexts.add(q.question_text);
      }
    });

    console.log("Counts per Subject Slug:", fallbackSubjectCounts);
    console.log("Difficulty Distribution:", fallbackDiffs);
    console.log(`Missing Explanations: ${missingExplanationCount}`);
    console.log(`Missing Hints: ${missingHintCount}`);
    console.log(`Duplicate Question Texts: ${duplicateQuestionTextCount}`);
  }

  // 4. Detailed Validation on BankQuestions & Legacy Questions
  console.log("\n--- 4. DETAILED VALIDATION OF EXISTING QUESTIONS ---");
  const allBankQuestions = await prisma.bankQuestion.findMany();
  let invalidOptionFormat = 0;
  let correctOptionNotFound = 0;
  let missingBankExplanation = 0;

  allBankQuestions.forEach((bq) => {
    try {
      const opts = JSON.parse(bq.optionsJson);
      if (!Array.isArray(opts) || opts.length < 2) {
        invalidOptionFormat++;
      } else {
        const hasCorrect = opts.some((o: any) => o.id === bq.correctOptionId);
        if (!hasCorrect) {
          correctOptionNotFound++;
        }
      }
    } catch {
      invalidOptionFormat++;
    }
    if (!bq.explanation || bq.explanation.trim() === "") {
      missingBankExplanation++;
    }
  });

  console.log(`Bank Questions with Invalid Option Format: ${invalidOptionFormat}`);
  console.log(`Bank Questions where correctOptionId is not in options: ${correctOptionNotFound}`);
  console.log(`Bank Questions with Missing Explanation: ${missingBankExplanation}`);

  // 5. Legacy QuizQuestions Validation
  const allLegacyQuizQuestions = await prisma.quizQuestion.findMany();
  let legacyInvalidOptions = 0;
  let legacyInvalidAnswerIndex = 0;
  allLegacyQuizQuestions.forEach((lq) => {
    try {
      const opts = JSON.parse(lq.optionsJson);
      if (!Array.isArray(opts) || lq.answerIndex < 0 || lq.answerIndex >= opts.length) {
        legacyInvalidAnswerIndex++;
      }
    } catch {
      legacyInvalidOptions++;
    }
  });
  console.log(`Legacy Questions with Invalid Options JSON: ${legacyInvalidOptions}`);
  console.log(`Legacy Questions with Out-of-bounds answerIndex: ${legacyInvalidAnswerIndex}`);

  // 6. Student Attempts & History
  console.log("\n--- 6. STUDENT ATTEMPTS & PROGRESSION ---");
  const attempts = await prisma.quizAttempt.findMany({
    include: { user: { select: { username: true } } },
    take: 5,
  });
  console.log("Sample QuizAttempts (first 5 of 27):");
  attempts.forEach((a) => {
    console.log(`  - Attempt ${a.id}: User ${a.user.username}, Course ${a.courseId}, Score: ${a.score}/${a.total}, Perfect: ${a.perfect}, XP: ${a.xpEarned}, Date: ${a.createdAt.toISOString()}`);
  });

  // 7. CR AI Conversations & Quizzes
  const crQuizCount = await prisma.cRQuiz.count();
  const crQuestionCount = await prisma.cRQuizQuestion.count();
  console.log(`CRQuizzes in DB: ${crQuizCount}, CRQuizQuestions: ${crQuestionCount}`);

  await prisma.$disconnect();
}

runAudit().catch(console.error);
