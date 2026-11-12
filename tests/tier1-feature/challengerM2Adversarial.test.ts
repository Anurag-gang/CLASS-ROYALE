/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Empirical Challenger Adversarial Stress Test Suite (M2)
 * Target: tests/tier1-feature/challengerM2Adversarial.test.ts
 *
 * Role: Challenger 1 (Milestone 2 — Phases 3, 4 & 5)
 *
 * Verifies:
 * 1. Anti-Skew Shuffling & Option Uniformity:
 *    - Monte Carlo simulations (10,000+ iterations) testing shuffleArray and delivery.
 *    - Verification that legacy 95.7% position A/B bias is completely eradicated.
 *    - Goodness-of-fit Chi-square test (alpha=0.01, df=3) and binomial bounds (~25% per slot).
 *    - Permutation coverage and uniformity across all 24 permutations of 4 elements.
 *    - Independent Monte Carlo testing across all 6 Academic Realms.
 * 2. Invariant Integrity Across the Question Bank:
 *    - 100% database audit of all 215 items in QuestionBankItem (209 PUBLISHED, 6 NEEDS_REVIEW).
 *    - Stable option UUID uniqueness (within questions and globally across 860 options).
 *    - Invariant that primaryCorrectOptionId exists and accurately maps to optionsJson.
 *    - Immutability verification: shuffleArray never mutates inputs or frozen objects.
 *    - Misconception mapping verification (distractor keys).
 * 3. Edge Cases & Adversarial Inputs:
 *    - 2-option questions (binary/true-false) distribution (df=1 Chi-square).
 *    - Identical option text disambiguation via stable UUIDs.
 *    - Empty options array and 1-element options array resilience.
 *    - Duplicate IDs in selectedOptionIds anti-tampering rejection.
 *    - Whitespace and casing tolerance in answer evaluation.
 *    - Zero data leakage in SanitizedQuizQuestion.
 *    - Malformed JSON resilience.
 * =============================================================================
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "../run-all-tests";
import { prisma } from "../../src/lib/db";
import {
  shuffleArray,
  sanitizeQuestionForDelivery,
  evaluateAnswerSubmission,
  evaluateHintRequest,
} from "../../src/lib/questions/questionDeliveryService";

// Helper: Chi-Square goodness-of-fit statistic
function calculateChiSquare(observed: number[], expected: number): number {
  return observed.reduce((acc, obs) => acc + Math.pow(obs - expected, 2) / expected, 0);
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe("Challenger 2 — Anti-Skew Shuffling & Monte Carlo Uniformity (Fisher-Yates)", () => {
  const sampleOptions = [
    { id: "opt_correct", text: "Correct Choice" },
    { id: "opt_distractor_1", text: "Distractor 1" },
    { id: "opt_distractor_2", text: "Distractor 2" },
    { id: "opt_distractor_3", text: "Distractor 3" },
  ];

  it("eradicates legacy 95.7% A/B bias and satisfies Chi-Square uniformity across 10,000 iterations", () => {
    const N = 10000;
    const expectedPerSlot = N / 4; // 2500
    const slotCounts = [0, 0, 0, 0];

    for (let i = 0; i < N; i++) {
      const shuffled = shuffleArray(sampleOptions);
      const correctIndex = shuffled.findIndex((o) => o.id === "opt_correct");
      assert.ok(correctIndex >= 0 && correctIndex < 4, "Option must be present in shuffled result");
      slotCounts[correctIndex]++;
    }

    const chiSquare = calculateChiSquare(slotCounts, expectedPerSlot);
    // Critical value for df = 3 at alpha = 0.01 is 11.345; at alpha = 0.05 is 7.815
    assert.ok(
      chiSquare < 11.345,
      `Chi-square statistic ${chiSquare.toFixed(4)} exceeds critical threshold 11.345 (p < 0.01)`
    );

    // Standard deviation sigma = sqrt(N * p * (1 - p)) = sqrt(10000 * 0.25 * 0.75) ≈ 43.3
    // 3-sigma bound ≈ 130 counts -> expected range [2370, 2630], or [23.7%, 26.3%]
    // We test generous 4-sigma bound [2325, 2675] to avoid false flake
    for (let s = 0; s < 4; s++) {
      const pct = (slotCounts[s] / N) * 100;
      assert.ok(
        pct >= 23.0 && pct <= 27.0,
        `Slot ${s} frequency was ${pct.toFixed(2)}%, outside 4-sigma uniform bounds [23.0%, 27.0%]`
      );
    }

    // Combined A+B percentage: In legacy data, this was 95.7%. Under Fisher-Yates, it must be ~50.0%
    const combinedAB = ((slotCounts[0] + slotCounts[1]) / N) * 100;
    assert.ok(
      combinedAB >= 47.0 && combinedAB <= 53.0,
      `Combined A+B percentage was ${combinedAB.toFixed(2)}%, expected ~50.0% (eradicating 95.7% bias)`
    );
  });

  it("verifies uniform permutation distribution across all 24 permutations (df = 23)", () => {
    const N = 24000;
    const expectedPerPerm = N / 24; // 1000
    const permCounts = new Map<string, number>();

    for (let i = 0; i < N; i++) {
      const shuffled = shuffleArray(sampleOptions);
      const permKey = shuffled.map((o) => o.id.replace("opt_", "")).join(",");
      permCounts.set(permKey, (permCounts.get(permKey) || 0) + 1);
    }

    // Must generate all 4! = 24 distinct permutations
    assert.equal(
      permCounts.size,
      24,
      `Expected exactly 24 unique permutations, observed ${permCounts.size}`
    );

    const counts = Array.from(permCounts.values());
    const chiSquare = calculateChiSquare(counts, expectedPerPerm);
    // Critical value for df = 23 at alpha = 0.01 is 41.638; at alpha = 0.05 is 35.172
    assert.ok(
      chiSquare < 41.638,
      `Permutation Chi-square ${chiSquare.toFixed(4)} exceeds critical threshold 41.638 (p < 0.01)`
    );
  });

  it("empirically verifies question delivery uniformity across all 6 Academic Realms", async () => {
    const realms = [
      "data-structures-and-algorithms",
      "database-management-systems",
      "operating-systems",
      "computer-networks",
      "ai-and-machine-learning",
      "web-dev-and-devops",
    ];

    for (const realmSlug of realms) {
      const realmQuestions = await prisma.questionBankItem.findMany({
        where: { subjectSlug: realmSlug, status: "PUBLISHED" },
      });
      assert.ok(
        realmQuestions.length >= 30,
        `Realm ${realmSlug} must have >= 30 published questions`
      );

      const N = 2000;
      const expected = N / 4; // 500
      const positionCounts = [0, 0, 0, 0];

      for (let i = 0; i < N; i++) {
        const q = realmQuestions[i % realmQuestions.length];
        const sanitized = sanitizeQuestionForDelivery(
          {
            id: q.id,
            questionText: q.questionText,
            optionsJson: q.optionsJson,
            hint: q.hint,
          },
          { realmSlug, levelNumber: q.levelNumber }
        );

        const correctIdx = sanitized.options.findIndex((o) => o.id === q.primaryCorrectOptionId);
        assert.ok(correctIdx >= 0 && correctIdx < 4, `Correct option not found in delivery for ${q.id}`);
        positionCounts[correctIdx]++;
      }

      const chiSquare = calculateChiSquare(positionCounts, expected);
      // Critical value for df = 3 at alpha = 0.01 is 11.345
      assert.ok(
        chiSquare < 11.345,
        `Realm ${realmSlug} failed Chi-Square uniformity: chi2=${chiSquare.toFixed(3)}`
      );
    }
  });

  it("supports deterministic custom PRNG injection for reproducible shuffling", () => {
    // Linear Congruential Generator (LCG)
    let state = 123456789;
    const lcgPrng = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };

    const firstRun = shuffleArray([1, 2, 3, 4, 5], lcgPrng);

    // Reset PRNG seed
    state = 123456789;
    const secondRun = shuffleArray([1, 2, 3, 4, 5], lcgPrng);

    assert.deepEqual(
      firstRun,
      secondRun,
      "Deterministic PRNG must produce bit-for-bit identical shuffled array"
    );
  });
});

describe("Challenger 2 — Invariant Integrity Across the Question Bank", () => {
  it("audits all 215 QuestionBankItem rows for stable option UUIDs and primaryCorrectOptionId integrity", async () => {
    const allQuestions = await prisma.questionBankItem.findMany();
    assert.equal(allQuestions.length, 215, "Database must contain exactly 215 QuestionBankItems");

    const globalOptionIds = new Set<string>();

    for (const q of allQuestions) {
      assert.ok(q.id && q.id.length > 0, "Question id must not be empty");
      assert.ok(q.primaryCorrectOptionId, `Question ${q.id} missing primaryCorrectOptionId`);
      assert.ok(
        q.primaryCorrectOptionId.startsWith("opt_"),
        `primaryCorrectOptionId '${q.primaryCorrectOptionId}' must start with 'opt_' in ${q.id}`
      );

      // Validate optionsJson
      const options: Array<{ id: string; text: string }> = JSON.parse(q.optionsJson);
      assert.ok(
        Array.isArray(options) && options.length >= 2,
        `Question ${q.id} optionsJson must be array of >= 2 options`
      );

      const localOptionIds = new Set<string>();
      for (const opt of options) {
        assert.ok(
          opt.id.startsWith("opt_"),
          `Option id '${opt.id}' in question ${q.id} must start with 'opt_'`
        );
        assert.ok(
          !localOptionIds.has(opt.id),
          `Duplicate option id '${opt.id}' within question ${q.id}`
        );
        localOptionIds.add(opt.id);

        assert.ok(
          !globalOptionIds.has(opt.id),
          `Global option id collision on '${opt.id}' across question bank`
        );
        globalOptionIds.add(opt.id);
      }

      // Invariant: primaryCorrectOptionId MUST exist in options
      assert.ok(
        localOptionIds.has(q.primaryCorrectOptionId),
        `primaryCorrectOptionId '${q.primaryCorrectOptionId}' does NOT exist in options for ${q.id}`
      );

      // Invariant: correctOptionIdsJson MUST contain primaryCorrectOptionId
      const correctOptionIds: string[] = JSON.parse(q.correctOptionIdsJson);
      assert.ok(
        Array.isArray(correctOptionIds) && correctOptionIds.includes(q.primaryCorrectOptionId),
        `correctOptionIdsJson does not contain primaryCorrectOptionId in question ${q.id}`
      );

      // Validate misconceptionsJson if present
      if (q.misconceptionsJson) {
        const catalog: Record<string, string> = JSON.parse(q.misconceptionsJson);
        for (const [distractorId, explanation] of Object.entries(catalog)) {
          assert.ok(
            localOptionIds.has(distractorId),
            `Misconception key '${distractorId}' does not belong to question ${q.id} options`
          );
          assert.notEqual(
            distractorId,
            q.primaryCorrectOptionId,
            `Misconception key '${distractorId}' must NOT be the correct option in ${q.id}`
          );
          assert.ok(
            explanation && explanation.trim().length > 5,
            `Misconception explanation empty for option '${distractorId}' in ${q.id}`
          );
        }
      }
    }

    // Exactly 215 * 4 = 860 unique options across the entire repository
    assert.equal(
      globalOptionIds.size,
      860,
      `Expected 860 unique option UUIDs globally, found ${globalOptionIds.size}`
    );
  });

  it("verifies immutability: shuffleArray never mutates input arrays or frozen objects", () => {
    const rawItems = Object.freeze([
      Object.freeze({ id: "opt_1", text: "Alpha" }),
      Object.freeze({ id: "opt_2", text: "Beta" }),
      Object.freeze({ id: "opt_3", text: "Gamma" }),
      Object.freeze({ id: "opt_4", text: "Delta" }),
    ]);

    // Shuffling frozen objects must succeed and not throw TypeError
    const shuffled = shuffleArray(rawItems);
    assert.equal(shuffled.length, 4);

    // Original array order and elements must remain completely untouched
    assert.equal(rawItems[0].id, "opt_1");
    assert.equal(rawItems[1].id, "opt_2");
    assert.equal(rawItems[2].id, "opt_3");
    assert.equal(rawItems[3].id, "opt_4");

    // Mutating returned shuffled array must NOT affect input
    shuffled.pop();
    assert.equal(shuffled.length, 3);
    assert.equal(rawItems.length, 4);
  });

  it("verifies sanitizeQuestionForDelivery creates decoupled option instances", () => {
    const originalOptions = [
      { id: "opt_1", text: "Choice 1" },
      { id: "opt_2", text: "Choice 2" },
    ];
    const q = {
      id: "q_test_decouple",
      questionText: "Decouple check",
      options: originalOptions,
      hint: "Hint",
    };

    const sanitized1 = sanitizeQuestionForDelivery(q, { realmSlug: "test", levelNumber: 1 });
    const sanitized2 = sanitizeQuestionForDelivery(q, { realmSlug: "test", levelNumber: 1 });

    assert.notEqual(sanitized1.options, sanitized2.options, "Each delivery must have independent array");
    assert.notEqual(sanitized1.options, originalOptions, "Delivery array must not reference input array");
  });
});

describe("Challenger 2 — Adversarial Edge Cases & Boundary Analysis", () => {
  it("handles questions with exactly 2 options (Binary / True-False) uniformly", () => {
    const binaryOptions = [
      { id: "opt_true", text: "True" },
      { id: "opt_false", text: "False" },
    ];
    const N = 2000;
    const counts = [0, 0];

    for (let i = 0; i < N; i++) {
      const s = shuffleArray(binaryOptions);
      assert.equal(s.length, 2);
      counts[s.findIndex((o) => o.id === "opt_true")]++;
    }

    const chiSquare = calculateChiSquare(counts, N / 2);
    // Critical value for df = 1 at alpha = 0.01 is 6.635
    assert.ok(
      chiSquare < 6.635,
      `Binary 2-option Chi-square ${chiSquare.toFixed(4)} exceeds critical threshold 6.635`
    );

    // Test evaluation on binary question
    const qBinary = {
      id: "q_bin",
      explanation: "Invariant explanation",
      correctOptionIds: ["opt_true"],
      options: binaryOptions,
    };
    assert.equal(evaluateAnswerSubmission(qBinary, ["opt_true"]).isCorrect, true);
    assert.equal(evaluateAnswerSubmission(qBinary, ["opt_false"]).isCorrect, false);
  });

  it("correctly resolves options with identical text via stable UUIDs", () => {
    const optionsWithIdenticalText = [
      { id: "opt_correct_uuid", text: "Constant 42" },
      { id: "opt_distractor_uuid", text: "Constant 42" }, // Identical text, distinct ID
    ];

    const q = {
      id: "q_identical_text",
      explanation: "Explanation",
      correctOptionIds: ["opt_correct_uuid"],
      options: optionsWithIdenticalText,
    };

    // Selecting correct UUID succeeds
    const evalCorrect = evaluateAnswerSubmission(q, ["opt_correct_uuid"]);
    assert.equal(evalCorrect.isCorrect, true);
    assert.equal(evalCorrect.academicPointsEarned, 1);

    // Selecting distractor with identical text fails
    const evalDistractor = evaluateAnswerSubmission(q, ["opt_distractor_uuid"]);
    assert.equal(evalDistractor.isCorrect, false);
    assert.equal(evalDistractor.academicPointsEarned, 0);
  });

  it("safely handles boundary cases: empty options and single-option arrays", () => {
    // Empty array
    const emptyShuffled = shuffleArray([]);
    assert.deepEqual(emptyShuffled, []);

    const emptyDelivery = sanitizeQuestionForDelivery(
      { id: "q_empty", questionText: "Empty", options: [] },
      { realmSlug: "test", levelNumber: 1 }
    );
    assert.deepEqual(emptyDelivery.options, []);

    // Single item
    const singleShuffled = shuffleArray([{ id: "opt_lone", text: "Solo" }]);
    assert.equal(singleShuffled.length, 1);
    assert.equal(singleShuffled[0].id, "opt_lone");
  });

  it("rejects adversarial duplicate IDs in selectedOptionIds", () => {
    const q = {
      id: "q_dup_check",
      explanation: "Explanation",
      correctOptionIds: ["opt_a"],
      options: [
        { id: "opt_a", text: "A" },
        { id: "opt_b", text: "B" },
      ],
    };

    // Adversary submits ["opt_a", "opt_a"] hoping to bypass single-answer check
    const evalDuplicate = evaluateAnswerSubmission(q, ["opt_a", "opt_a"]);
    assert.equal(evalDuplicate.isCorrect, false);
    assert.equal(evalDuplicate.academicPointsEarned, 0);

    // Adversary submits ["opt_a", "opt_b"]
    const evalBoth = evaluateAnswerSubmission(q, ["opt_a", "opt_b"]);
    assert.equal(evalBoth.isCorrect, false);
    assert.equal(evalBoth.academicPointsEarned, 0);

    // Adversary submits non-existent ID
    const evalNonExistent = evaluateAnswerSubmission(q, ["opt_non_existent"]);
    assert.equal(evalNonExistent.isCorrect, false);
    assert.equal(evalNonExistent.academicPointsEarned, 0);

    // Adversary submits empty array
    const evalEmpty = evaluateAnswerSubmission(q, []);
    assert.equal(evalEmpty.isCorrect, false);
    assert.equal(evalEmpty.academicPointsEarned, 0);
  });

  it("tolerates whitespace and casing in selectedOptionIds", () => {
    const q = {
      id: "q_case_whitespace",
      explanation: "Explanation",
      correctOptionIds: ["opt_canonical_uuid"],
      options: [{ id: "opt_canonical_uuid", text: "Canonical" }],
    };

    // Submitting with leading/trailing whitespace
    const evalWhitespace = evaluateAnswerSubmission(q, ["  opt_canonical_uuid  "]);
    assert.equal(evalWhitespace.isCorrect, true);

    // Submitting in uppercase
    const evalUppercase = evaluateAnswerSubmission(q, ["OPT_CANONICAL_UUID"]);
    assert.equal(evalUppercase.isCorrect, true);
  });

  it("strictly prevents data leakage of answers, explanations, and hints in SanitizedQuizQuestion", () => {
    const complexQuestion = {
      id: "q_leak_test",
      questionText: "What is 2+2?",
      codeSnippet: "console.log(2+2)",
      optionsJson: JSON.stringify([
        { id: "opt_1", text: "4" },
        { id: "opt_2", text: "5" },
      ]),
      correctOptionId: "opt_1",
      correctOptionIds: ["opt_1"],
      correct_option_id: "opt_1",
      primaryCorrectOptionId: "opt_1",
      explanation: "Strict secret explanation",
      hint: "Secret hint text",
      misconceptionExplanation: "Secret misconception",
      misconceptions: { opt_2: "Secret distractor info" },
      misconceptionsJson: JSON.stringify({ opt_2: "Secret distractor info" }),
    };

    const sanitized = sanitizeQuestionForDelivery(complexQuestion as any, {
      realmSlug: "algorithmic-citadel",
      levelNumber: 1,
    });

    // Permitted fields only
    const allowedKeys = new Set([
      "id",
      "questionText",
      "codeSnippet",
      "options",
      "timeLimitSeconds",
      "hintsAvailable",
      "levelNumber",
      "realmSlug",
      "questionType",
    ]);

    const sanitizedKeys = Object.keys(sanitized);
    for (const key of sanitizedKeys) {
      assert.ok(
        allowedKeys.has(key),
        `Prohibited key '${key}' leaked in SanitizedQuizQuestion delivery!`
      );
    }

    // Explicit verification of banned properties
    assert.equal((sanitized as any).correctOptionId, undefined);
    assert.equal((sanitized as any).correctOptionIds, undefined);
    assert.equal((sanitized as any).correct_option_id, undefined);
    assert.equal((sanitized as any).primaryCorrectOptionId, undefined);
    assert.equal((sanitized as any).explanation, undefined);
    assert.equal((sanitized as any).hint, undefined);
    assert.equal((sanitized as any).misconceptionExplanation, undefined);
    assert.equal((sanitized as any).misconceptions, undefined);
    assert.equal((sanitized as any).misconceptionsJson, undefined);
  });

  it("recovers gracefully from malformed JSON in question fields without crashing", () => {
    const malformedQuestion = {
      id: "q_malformed_json",
      questionText: "Resilience check",
      optionsJson: "{ bad json not parseable",
      correctOptionIdsJson: "{ bad json not parseable",
      misconceptionsJson: "{ bad json not parseable",
      explanation: "Default fallback explanation",
    };

    // Delivery sanitization must not throw
    const sanitized = sanitizeQuestionForDelivery(malformedQuestion, {
      realmSlug: "test",
      levelNumber: 1,
    });
    assert.deepEqual(sanitized.options, []);

    // Answer evaluation must not throw
    const evaluated = evaluateAnswerSubmission(malformedQuestion, ["opt_any"]);
    assert.equal(evaluated.isCorrect, false);
    assert.ok(evaluated.misconceptionExplanation?.includes("violates the fundamental invariants"));
  });

  it("enforces authoritative timed hint evaluation rules and session states", () => {
    const activeSession = {
      levelNumber: 3,
      currentQuestionStartedAt: new Date(Date.now() - 22000), // 22s elapsed -> 13s remaining
      hintsUsedCount: 2,
      status: "IN_PROGRESS",
    };
    const question = {
      id: "q_hint_test",
      hint: "Deconstruct the dynamic programming recurrence.",
    };

    // Valid hint request (13s remaining <= 15s)
    const hintResult = evaluateHintRequest(activeSession, question, new Date(), 35);
    assert.equal(hintResult.hint, question.hint);
    assert.equal(hintResult.hintsUsedCount, 3);
    assert.ok(hintResult.secondsRemaining <= 15);

    // Inactive session throws
    assert.throws(
      () =>
        evaluateHintRequest(
          { ...activeSession, status: "COMPLETED" },
          question,
          new Date(),
          35
        ),
      /Cannot request hints for an inactive quiz attempt/
    );

    // Level 7 Crown Trial throws
    assert.throws(
      () =>
        evaluateHintRequest(
          { ...activeSession, levelNumber: 7 },
          question,
          new Date(),
          35
        ),
      /Crown Trial \(Level 7\) assessment enforces strict exam conditions: timed hints are disabled/
    );

    // Requesting too early (remainingSec > 17.5s)
    const tooEarlySession = {
      ...activeSession,
      currentQuestionStartedAt: new Date(Date.now() - 5000), // 30s remaining
    };
    assert.throws(
      () => evaluateHintRequest(tooEarlySession, question, new Date(), 35),
      /Hint will unlock when 15 seconds remain/
    );
  });
});
