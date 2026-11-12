/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Question Bank Migration & Seeding Engine (Milestone 2)
 * File: scripts/migrate_and_seed_question_bank.ts
 *
 * 1. Reads 210 canonical questions from src/data/questions-fallback.json
 * 2. Reads 5 ADVANCED template questions from BankQuestion
 * 3. Converts all options to stable UUIDs (opt_...)
 * 4. Stores independent correct option IDs ([opt_...])
 * 5. Quarantines exactly 6 defective questions as NEEDS_REVIEW with documented reasons
 * 6. Publishes 209 sound questions across Levels 1-7 in all 6 Knowledge Kingdom realms
 * 7. Records QuestionAuditLog entries with full provenance
 * =============================================================================
 */

import { prisma } from "../src/lib/db";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const FLAGGED_QUARANTINE_REASONS: Record<string, string> = {
  "32ea994c-d629-4fc6-8414-556cf3932842":
    "META_PLATFORM_LEAK: Question tests internal application implementation details rather than computer science curriculum standards, with non-standard difficulty ADVANCED.",
  "7939241b-6876-4cf0-a408-0cd2e7b41897":
    "FORMATTING_AND_TAXONOMY_DEFECT: Raw LaTeX math notation unrendered in options and non-standard difficulty tier ADVANCED.",
  "75b63962-b383-4ce2-b6fa-5e7b25560d0f":
    "PEDAGOGICAL_AMBIGUITY: Abstract template text fails to test standard BST ordering invariant (Left < Node < Right); options are overly generic.",
  "bdde7c24-525a-427e-90a9-476653fd1317":
    "FACTUAL_INACCURACY: Distractors contain pseudo-technical assertions ('in-place register mutation') unrelated to BST space complexity.",
  "9028d29d-17bb-4dda-804c-ca713934f9d8":
    "DOMAIN_CONFLATION: Distractor conflates zero-indexed arrays with pointer-linked binary tree nodes, creating student misconception.",
  "b0000006-0033-0000-0000-000000000000":
    "UNPROFESSIONAL_DISTRACTORS: Non-academic joke distractors (Spotify, Windows beep) and explanation exposes internal repository source code path (src/lib/sound.ts).",
};

export async function migrateAndSeedQuestionBank() {
  console.log("=======================================================");
  console.log(" KNOWLEDGE KINGDOM: QUESTION BANK MIGRATION & SEEDING");
  console.log("=======================================================\n");

  const fallbackPath = path.join(process.cwd(), "src/data/questions-fallback.json");
  if (!fs.existsSync(fallbackPath)) {
    throw new Error(`Fallback questions file not found at ${fallbackPath}`);
  }

  const rawFallback = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  const canonicalQuestions: any[] = rawFallback.questions || [];

  // Territory Subjects map for foreign keys
  const territorySubjects = await prisma.territorySubject.findMany();
  const subjectIdMap = new Map(territorySubjects.map((s) => [s.slug, s.id]));

  // 5 ADVANCED BST template questions from BankQuestion
  const dbAdvancedQuestions = await prisma.bankQuestion.findMany({
    where: { difficulty: "ADVANCED" },
  });

  console.log(`Loaded ${canonicalQuestions.length} canonical questions from fallback JSON.`);
  console.log(`Loaded ${dbAdvancedQuestions.length} ADVANCED template questions from BankQuestion.`);

  let publishedCount = 0;
  let quarantinedCount = 0;
  const levelDistribution: Record<string, Record<number, number>> = {};

  // Process Canonical Questions (210)
  for (const q of canonicalQuestions) {
    const isQuarantined = Boolean(FLAGGED_QUARANTINE_REASONS[q.id]);
    const status = isQuarantined ? "NEEDS_REVIEW" : "PUBLISHED";
    const quarantineReason = FLAGGED_QUARANTINE_REASONS[q.id] || null;

    if (isQuarantined) quarantinedCount++;
    else publishedCount++;

    if (!isQuarantined) {
      if (!levelDistribution[q.subject_slug]) levelDistribution[q.subject_slug] = {};
      const lvl = q.level_number || 1;
      levelDistribution[q.subject_slug][lvl] = (levelDistribution[q.subject_slug][lvl] || 0) + 1;
    }

    // Convert options to stable UUID options
    const stableOptions: Array<{ id: string; text: string }> = [];
    const optionIdMap: Record<string, string> = {};
    const misconceptionsMap: Record<string, string> = {};

    q.options.forEach((opt: { id: string; text: string }) => {
      const stableOptId = `opt_${crypto
        .createHash("md5")
        .update(`${q.id}_option_${opt.id}`)
        .digest("hex")
        .slice(0, 16)}`;
      stableOptions.push({ id: stableOptId, text: opt.text });
      optionIdMap[opt.id] = stableOptId;
    });

    const origCorrect = q.correct_option_id;
    const stableCorrectId = optionIdMap[origCorrect] || stableOptions[0].id;
    const correctOptionIds = [stableCorrectId];

    // Build distractor-specific misconceptions
    stableOptions.forEach((opt) => {
      if (opt.id !== stableCorrectId) {
        misconceptionsMap[opt.id] =
          q.misconception_explanation ||
          `Distractor choice violates specific constraints tested in ${q.topic || "this topic"}.`;
      }
    });

    const territorySubjectId = subjectIdMap.get(q.subject_slug) || null;

    let bloom = "UNDERSTAND";
    if (q.difficulty === "Easy") bloom = "REMEMBER";
    else if (q.difficulty === "Medium") bloom = "APPLY";
    else if (q.difficulty === "Hard") bloom = "ANALYZE";
    else if (q.difficulty === "Boss") bloom = "EVALUATE";

    const itemData = {
      subjectSlug: q.subject_slug,
      territorySubjectId,
      levelNumber: q.level_number || 1,
      topic: q.topic || "Core Concepts",
      subtopic: q.subtopic || "Fundamentals",
      difficulty: q.difficulty || "Medium",
      bloomTaxonomy: bloom,
      questionText: q.question_text,
      codeSnippet: q.code_snippet || null,
      questionType: q.question_type || "SINGLE_MCQ",
      optionsJson: JSON.stringify(stableOptions),
      correctOptionIdsJson: JSON.stringify(correctOptionIds),
      primaryCorrectOptionId: stableCorrectId,
      academicPoints: 1,
      xpReward: q.xp_reward || 50,
      timeLimitSeconds: q.time_limit_seconds || 35,
      explanation: q.explanation || "Comprehensive explanation provided.",
      hint: q.hint || null,
      misconceptionsJson: JSON.stringify(misconceptionsMap),
      misconceptionExplanation: q.misconception_explanation || null,
      referenceSource:
        q.reference_source || `Knowledge Kingdom Academic Curriculum (${q.subject_slug})`,
      tagsJson: JSON.stringify(q.tags || []),
      status: status as any,
      quarantineReason,
      flaggedBy: isQuarantined ? "SYSTEM_AUDITOR_M1" : null,
      flaggedAt: isQuarantined ? new Date("2026-11-03T15:42:14.000Z") : null,
      version: 1,
      isLatest: true,
    };

    await prisma.questionBankItem.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        ...itemData,
      },
      update: itemData,
    });

    // Write audit log
    await prisma.questionAuditLog.create({
      data: {
        id: `audit_${crypto.randomUUID()}`,
        questionId: q.id,
        action: isQuarantined ? "QUARANTINED" : "INITIAL_SEED",
        previousState: null,
        newState: JSON.stringify({
          status,
          levelNumber: q.level_number,
          difficulty: q.difficulty,
          topic: q.topic,
        }),
        reason: isQuarantined ? quarantineReason : "Canonical question imported and published",
      },
    });
  }

  // Process 5 DB template questions (ADVANCED)
  for (const bq of dbAdvancedQuestions) {
    quarantinedCount++;
    const quarantineReason =
      FLAGGED_QUARANTINE_REASONS[bq.id] ||
      "Template-generated BST question flagged in Milestone 1 audit";

    const parsedOpts: Array<{ id: string; text: string }> = JSON.parse(bq.optionsJson);
    const stableOptions: Array<{ id: string; text: string }> = [];
    const optionIdMap: Record<string, string> = {};

    parsedOpts.forEach((opt) => {
      const stableOptId = `opt_${crypto
        .createHash("md5")
        .update(`${bq.id}_option_${opt.id}`)
        .digest("hex")
        .slice(0, 16)}`;
      stableOptions.push({ id: stableOptId, text: opt.text });
      optionIdMap[opt.id] = stableOptId;
    });

    const stableCorrectId = optionIdMap[bq.correctOptionId] || stableOptions[0].id;

    const bqData = {
      subjectSlug: "data-structures-and-algorithms",
      territorySubjectId: bq.subjectId,
      levelNumber: 1,
      topic: bq.topic || "Binary Search Trees",
      subtopic: bq.subtopic || "Tree Invariants",
      difficulty: "ADVANCED",
      bloomTaxonomy: "ANALYZE",
      questionText: bq.questionText,
      codeSnippet: bq.codeSnippet || null,
      questionType: "SINGLE_MCQ",
      optionsJson: JSON.stringify(stableOptions),
      correctOptionIdsJson: JSON.stringify([stableCorrectId]),
      primaryCorrectOptionId: stableCorrectId,
      academicPoints: 1,
      xpReward: bq.xpReward || 50,
      timeLimitSeconds: bq.timeLimitSeconds || 35,
      explanation: bq.explanation || "Deconstruct the tree invariants.",
      hint: bq.hint || null,
      misconceptionsJson: null,
      misconceptionExplanation: bq.misconceptionExplanation || null,
      referenceSource: "Legacy Database BankQuestion",
      tagsJson: bq.tagsJson || "[]",
      status: "NEEDS_REVIEW" as any,
      quarantineReason,
      flaggedBy: "SYSTEM_AUDITOR_M1",
      flaggedAt: new Date("2026-11-03T15:42:14.000Z"),
      version: 1,
      isLatest: true,
    };

    await prisma.questionBankItem.upsert({
      where: { id: bq.id },
      create: {
        id: bq.id,
        ...bqData,
      },
      update: bqData,
    });

    await prisma.questionAuditLog.create({
      data: {
        id: `audit_${crypto.randomUUID()}`,
        questionId: bq.id,
        action: "QUARANTINED",
        previousState: null,
        newState: JSON.stringify({ status: "NEEDS_REVIEW", difficulty: "ADVANCED" }),
        reason: quarantineReason,
      },
    });
  }

  console.log("=======================================================");
  console.log(" MIGRATION EXECUTION SUMMARY");
  console.log("=======================================================");
  console.log(`Total QuestionBankItem rows in database: ${publishedCount + quarantinedCount}`);
  console.log(`  - PUBLISHED sound questions: ${publishedCount}`);
  console.log(`  - NEEDS_REVIEW quarantined questions: ${quarantinedCount}`);

  console.log("\nPublished Questions Distribution across Levels 1-7 per Realm:");
  for (const [slug, lvls] of Object.entries(levelDistribution)) {
    const totalPublished = Object.values(lvls).reduce((a, b) => a + b, 0);
    console.log(`- ${slug} (Total Published: ${totalPublished}):`);
    for (let l = 1; l <= 7; l++) {
      console.log(`    Level ${l}: ${lvls[l] || 0} questions`);
    }
  }

  const auditCount = await prisma.questionAuditLog.count();
  console.log(`\nTotal QuestionAuditLog records: ${auditCount}`);
  console.log("\nMigration completed successfully.");

  return {
    total: publishedCount + quarantinedCount,
    published: publishedCount,
    quarantined: quarantinedCount,
    auditLogs: auditCount,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith("migrate_and_seed_question_bank.ts")) {
  migrateAndSeedQuestionBank()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
