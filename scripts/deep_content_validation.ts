import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface QuestionAuditDetail {
  id: string;
  subjectSlug: string;
  questionText: string;
  difficulty: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  tags: string[];
  issues: string[];
}

async function deepContentValidation() {
  const fallbackPath = path.join(process.cwd(), "src/data/questions-fallback.json");
  const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));

  const auditReport: {
    totalQuestions: number;
    validatedQuestions: number;
    flaggedQuestions: number;
    subjectBreakdown: Record<string, { total: number; easy: number; medium: number; hard: number; boss: number; flagged: number }>;
    flaggedDetails: QuestionAuditDetail[];
    hintsCoverage: { withHint: number; missingHint: number };
    explanationsCoverage: { withExplanation: number; missingExplanation: number };
    misconceptionsCoverage: { withMisconception: number; missingMisconception: number };
  } = {
    totalQuestions: fallbackData.questions.length,
    validatedQuestions: 0,
    flaggedQuestions: 0,
    subjectBreakdown: {},
    flaggedDetails: [],
    hintsCoverage: { withHint: 0, missingHint: 0 },
    explanationsCoverage: { withExplanation: 0, missingExplanation: 0 },
    misconceptionsCoverage: { withMisconception: 0, missingMisconception: 0 },
  };

  const seenQuestionTexts = new Map<string, string>();

  fallbackData.questions.forEach((q: any, idx: number) => {
    const slug = q.subject_slug;
    if (!auditReport.subjectBreakdown[slug]) {
      auditReport.subjectBreakdown[slug] = { total: 0, easy: 0, medium: 0, hard: 0, boss: 0, flagged: 0 };
    }
    const sb = auditReport.subjectBreakdown[slug];
    sb.total++;
    const diff = (q.difficulty || "Medium").toLowerCase();
    if (diff === "easy") sb.easy++;
    else if (diff === "medium") sb.medium++;
    else if (diff === "hard") sb.hard++;
    else if (diff === "boss") sb.boss++;

    const issues: string[] = [];

    // Check duplicate texts
    const normalizedText = q.question_text.trim().toLowerCase();
    if (seenQuestionTexts.has(normalizedText)) {
      issues.push(`Duplicate question text detected (matches question ${seenQuestionTexts.get(normalizedText)})`);
    } else {
      seenQuestionTexts.set(normalizedText, q.id || `idx-${idx}`);
    }

    // Check options
    if (!Array.isArray(q.options) || q.options.length < 2) {
      issues.push("Invalid options array (less than 2 options)");
    } else {
      const optionIds = new Set<string>();
      const optionTexts = new Set<string>();
      let foundCorrect = false;

      q.options.forEach((opt: any) => {
        if (!opt.id || !opt.text) {
          issues.push(`Malformed option: ${JSON.stringify(opt)}`);
        }
        if (optionIds.has(opt.id)) {
          issues.push(`Duplicate option ID: ${opt.id}`);
        }
        optionIds.add(opt.id);

        const normOpt = opt.text.trim().toLowerCase();
        if (optionTexts.has(normOpt)) {
          issues.push(`Duplicate option text: "${opt.text}"`);
        }
        optionTexts.add(normOpt);

        if (opt.id === q.correct_option_id) {
          foundCorrect = true;
        }
      });

      if (!foundCorrect) {
        issues.push(`correct_option_id "${q.correct_option_id}" does not exist in options array`);
      }
    }

    // Check explanation
    if (!q.explanation || q.explanation.trim() === "") {
      issues.push("Missing explanation");
      auditReport.explanationsCoverage.missingExplanation++;
    } else {
      auditReport.explanationsCoverage.withExplanation++;
      // Check if explanation references a different option letter than correct_option_id
      const explMatch = q.explanation.match(/\bOption ([A-D])\b/i);
      if (explMatch && explMatch[1].toUpperCase() !== q.correct_option_id.toUpperCase()) {
        issues.push(`Suspected answer key discrepancy: explanation explicitly mentions Option ${explMatch[1]} but correct_option_id is ${q.correct_option_id}`);
      }
    }

    // Check hint
    if (!q.hint || q.hint.trim() === "") {
      auditReport.hintsCoverage.missingHint++;
    } else {
      auditReport.hintsCoverage.withHint++;
    }

    // Check misconception
    if (!q.misconception_explanation || q.misconception_explanation.trim() === "") {
      auditReport.misconceptionsCoverage.missingMisconception++;
    } else {
      auditReport.misconceptionsCoverage.withMisconception++;
    }

    if (issues.length > 0) {
      auditReport.flaggedQuestions++;
      sb.flagged++;
      auditReport.flaggedDetails.push({
        id: q.id || `idx-${idx}`,
        subjectSlug: slug,
        questionText: q.question_text,
        difficulty: q.difficulty,
        options: q.options,
        correctOptionId: q.correct_option_id,
        explanation: q.explanation,
        tags: q.tags || [],
        issues,
      });
    } else {
      auditReport.validatedQuestions++;
    }
  });

  console.log("=================================================");
  console.log("DEEP CONTENT VALIDATION REPORT");
  console.log("=================================================");
  console.log(`Total Questions Scanned: ${auditReport.totalQuestions}`);
  console.log(`Validated Clean Questions: ${auditReport.validatedQuestions}`);
  console.log(`Flagged Questions: ${auditReport.flaggedQuestions}`);
  console.log(`Explanations: ${auditReport.explanationsCoverage.withExplanation} / ${auditReport.totalQuestions}`);
  console.log(`Hints Present: ${auditReport.hintsCoverage.withHint} / ${auditReport.totalQuestions} (Missing: ${auditReport.hintsCoverage.missingHint})`);
  console.log(`Misconception Explanations: ${auditReport.misconceptionsCoverage.withMisconception} / ${auditReport.totalQuestions} (Missing: ${auditReport.misconceptionsCoverage.missingMisconception})`);

  console.log("\nSubject Breakdown:");
  for (const [slug, stats] of Object.entries(auditReport.subjectBreakdown)) {
    console.log(`- ${slug}: Total ${stats.total} (Easy: ${stats.easy}, Med: ${stats.medium}, Hard: ${stats.hard}, Boss: ${stats.boss}) | Flagged: ${stats.flagged}`);
  }

  if (auditReport.flaggedDetails.length > 0) {
    console.log("\nFlagged Question Issues Sample:");
    auditReport.flaggedDetails.slice(0, 5).forEach((d) => {
      console.log(`[${d.subjectSlug}] "${d.questionText.slice(0, 60)}..."`);
      d.issues.forEach((iss) => console.log(`   ⚠ ${iss}`));
    });
  }

  // Also write the full validation report to an audit JSON file in scripts
  fs.writeFileSync(
    path.join(process.cwd(), "scripts/audit_validation_result.json"),
    JSON.stringify(auditReport, null, 2)
  );

  console.log("\nFull validation results written to scripts/audit_validation_result.json");
  await prisma.$disconnect();
}

deepContentValidation().catch(console.error);
