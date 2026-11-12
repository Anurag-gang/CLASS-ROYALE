/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Milestone 1 Adversarial Progression & Timer Test Suite
 * Target: tests/tier1-feature/adversarialProgression.test.ts
 *
 * Challenger 2 Adversarial Stress Test:
 * 1. Exhaustive verification of all 42 realm/level configurations:
 *    - 6 realms * 7 levels = 42 configurations.
 *    - totalQuestions === 12 (both totalQuestions and questionCount aliases).
 *    - timeLimitSeconds === 35 (both timeLimitSeconds and timeLimitPerQuestionSeconds).
 *    - passingThreshold === 9 (both passingThreshold and passingScoreThreshold, 75%).
 *    - hintsAvailable: true for L1-6, false for L7.
 *    - hintUnlockSeconds: 15 for L1-6, null/undefined for L7.
 *    - Aliased selector resolution across canonical realm slugs, subject slugs, and course codes.
 * 2. Boundary and out-of-bounds selector resilience (levels 0, 8, -1, non-integers, invalid slugs).
 * 3. Empirical boundary stress-testing of getTimerVisualConfig:
 *    - Boundary points: 36s, 35s, 21s, 20s, 16s, 15s, 10s, 9s, 1s, 0s, -1s.
 *    - Phase transitions: normal (35-21s), warning (20-11s), critical (10-0s and negative).
 *    - Behavioral analysis of hintStatusLabel at boundary transitions.
 * =============================================================================
 */

import assert from "node:assert/strict";
import { describe, it } from "../run-all-tests";
import {
  getAllAcademicRealms,
  getAcademicRealmBySlug,
  getLevelConfig,
  getPassingCriteria,
  isValidLevelNumber,
  isValidRealmSlug,
  AcademicRealm,
  LevelNumber,
} from "../../src/lib/realms/academicRealms";
import {
  getTimerVisualConfig,
  TimerVisualConfig,
  getRealmTheme,
} from "../../src/lib/realms/themeTokens";

const EXPECTED_REALMS: Array<{
  subjectSlug: string;
  realmSlug: string;
  courseCode: string;
  name: string;
}> = [
  {
    subjectSlug: "data-structures-and-algorithms",
    realmSlug: "algorithmic-citadel",
    courseCode: "CS-201",
    name: "Algorithmic Citadel",
  },
  {
    subjectSlug: "database-management-systems",
    realmSlug: "relational-vault",
    courseCode: "CS-202",
    name: "Relational Vault",
  },
  {
    subjectSlug: "operating-systems",
    realmSlug: "kernel-keep",
    courseCode: "CS-203",
    name: "Kernel Keep",
  },
  {
    subjectSlug: "computer-networks",
    realmSlug: "network-nexus",
    courseCode: "CS-204",
    name: "Network Nexus",
  },
  {
    subjectSlug: "ai-and-machine-learning",
    realmSlug: "neural-sanctum",
    courseCode: "CS-301",
    name: "Neural Sanctum",
  },
  {
    subjectSlug: "web-dev-and-devops",
    realmSlug: "cloud-spire-bastion",
    courseCode: "CS-302",
    name: "Cloud Spire Bastion",
  },
];

describe("Adversarial Stress Test: 42 Realm & Level Configurations", () => {
  it("exhaustively verifies all 42 configurations across all 6 realms via realm.levels", () => {
    const realms = getAllAcademicRealms();
    assert.equal(realms.length, 6, "Must define exactly 6 academic realms");

    let combinationsTested = 0;

    for (const realm of realms) {
      assert.equal(realm.levels.length, 7, `Realm ${realm.slug} must have exactly 7 levels`);
      assert.equal(realm.totalLevels, 7, `Realm ${realm.slug} totalLevels must be 7`);
      assert.equal(realm.totalQuestionsPerAttempt, 12, `Realm ${realm.slug} totalQuestionsPerAttempt must be 12`);
      assert.equal(realm.passingThresholdScore, 9, `Realm ${realm.slug} passingThresholdScore must be 9`);
      assert.equal(realm.passingThresholdPercentage, 75, `Realm ${realm.slug} passingThresholdPercentage must be 75`);

      for (let lvl = 1; lvl <= 7; lvl++) {
        combinationsTested++;
        const levelConfig = realm.levels[lvl - 1];

        assert.ok(levelConfig, `Configuration must exist for ${realm.slug} Level ${lvl}`);
        assert.equal(levelConfig.levelNumber, lvl, `levelNumber mismatch in ${realm.slug} L${lvl}`);

        // Total questions assertions
        assert.strictEqual(
          levelConfig.totalQuestions,
          12,
          `Strict equality failure: ${realm.slug} L${lvl} totalQuestions must be 12 (saw ${levelConfig.totalQuestions})`
        );
        assert.strictEqual(
          levelConfig.questionCount,
          12,
          `Strict equality failure: ${realm.slug} L${lvl} questionCount must be 12 (saw ${levelConfig.questionCount})`
        );

        // Timer limit assertions
        assert.strictEqual(
          levelConfig.timeLimitSeconds,
          35,
          `Strict equality failure: ${realm.slug} L${lvl} timeLimitSeconds must be 35 (saw ${levelConfig.timeLimitSeconds})`
        );
        assert.strictEqual(
          levelConfig.timeLimitPerQuestionSeconds,
          35,
          `Strict equality failure: ${realm.slug} L${lvl} timeLimitPerQuestionSeconds must be 35 (saw ${levelConfig.timeLimitPerQuestionSeconds})`
        );

        // Passing threshold assertions (75% -> 9/12)
        assert.strictEqual(
          levelConfig.passingThreshold,
          9,
          `Strict equality failure: ${realm.slug} L${lvl} passingThreshold must be 9 (saw ${levelConfig.passingThreshold})`
        );
        assert.strictEqual(
          levelConfig.passingScoreThreshold,
          9,
          `Strict equality failure: ${realm.slug} L${lvl} passingScoreThreshold must be 9 (saw ${levelConfig.passingScoreThreshold})`
        );
        assert.strictEqual(
          levelConfig.passingPercentage,
          75,
          `Strict equality failure: ${realm.slug} L${lvl} passingPercentage must be 75 (saw ${levelConfig.passingPercentage})`
        );

        // Hint availability and gating assertions
        if (lvl <= 6) {
          assert.strictEqual(
            levelConfig.hintsAvailable,
            true,
            `Strict equality failure: ${realm.slug} L${lvl} hintsAvailable must be true`
          );
          assert.strictEqual(
            levelConfig.hintUnlockSeconds,
            15,
            `Strict equality failure: ${realm.slug} L${lvl} hintUnlockSeconds must be strictly 15 (saw ${levelConfig.hintUnlockSeconds})`
          );
          assert.strictEqual(
            levelConfig.isBossLevel,
            false,
            `L${lvl} must not be flagged as a boss level`
          );
        } else {
          // Level 7: Boss Crucible
          assert.strictEqual(
            levelConfig.hintsAvailable,
            false,
            `Strict equality failure: ${realm.slug} L7 hintsAvailable must be false (saw ${levelConfig.hintsAvailable})`
          );
          assert.strictEqual(
            levelConfig.hintUnlockSeconds,
            null,
            `Strict equality failure: ${realm.slug} L7 hintUnlockSeconds must be null (saw ${levelConfig.hintUnlockSeconds})`
          );
          assert.strictEqual(
            levelConfig.isBossLevel,
            true,
            `L7 must be flagged as a boss level`
          );
        }
      }
    }

    assert.equal(combinationsTested, 42, "Must have tested exactly 42 realm/level configurations");
  });

  it("verifies all 42 configurations via getLevelConfig and getPassingCriteria across slug aliases", () => {
    let selectorQueries = 0;

    for (const expected of EXPECTED_REALMS) {
      const identifiers = [expected.subjectSlug, expected.realmSlug, expected.courseCode];

      for (const id of identifiers) {
        for (let lvl = 1; lvl <= 7; lvl++) {
          selectorQueries++;
          const config = getLevelConfig(id, lvl);
          assert.ok(config, `getLevelConfig("${id}", ${lvl}) returned undefined`);

          assert.strictEqual(config.totalQuestions, 12);
          assert.strictEqual(config.timeLimitSeconds, 35);
          assert.strictEqual(config.passingThreshold, 9);

          const criteria = getPassingCriteria(id, lvl);
          assert.ok(criteria, `getPassingCriteria("${id}", ${lvl}) returned undefined`);
          assert.strictEqual(criteria.totalQuestions, 12);
          assert.strictEqual(criteria.timeLimitPerQuestionSeconds, 35);
          assert.strictEqual(criteria.passingScoreThreshold, 9);
          assert.strictEqual(criteria.passingPercentage, 75);

          if (lvl <= 6) {
            assert.strictEqual(config.hintsAvailable, true);
            assert.strictEqual(config.hintUnlockSeconds, 15);
            assert.strictEqual(criteria.hintsAvailable, true);
            assert.strictEqual(criteria.hintUnlockSeconds, 15);
          } else {
            assert.strictEqual(config.hintsAvailable, false);
            assert.strictEqual(config.hintUnlockSeconds, null);
            assert.strictEqual(criteria.hintsAvailable, false);
            assert.strictEqual(criteria.hintUnlockSeconds, null);
          }
        }
      }
    }

    // 6 realms * 3 identifier variants * 7 levels = 126 queries
    assert.equal(selectorQueries, 126, "Must have verified 126 aliased selector queries");
  });

  it("adversarially stress-tests level boundary conditions and out-of-bounds inputs", () => {
    const invalidLevels = [-100, -1, 0, 8, 9, 10, 100, 1.5, NaN, Infinity, -Infinity];

    for (const realm of EXPECTED_REALMS) {
      for (const badLevel of invalidLevels) {
        assert.strictEqual(
          isValidLevelNumber(badLevel),
          false,
          `isValidLevelNumber(${badLevel}) should return false`
        );
        const config = getLevelConfig(realm.realmSlug, badLevel);
        assert.strictEqual(
          config,
          undefined,
          `getLevelConfig("${realm.realmSlug}", ${badLevel}) must return undefined for invalid level`
        );
        const criteria = getPassingCriteria(realm.realmSlug, badLevel);
        assert.strictEqual(
          criteria,
          undefined,
          `getPassingCriteria("${realm.realmSlug}", ${badLevel}) must return undefined for invalid level`
        );
      }
    }

    // Invalid realm slugs
    const invalidSlugs = ["", "   ", "unknown-realm", "cs-999", "undefined", "null"];
    for (const badSlug of invalidSlugs) {
      assert.strictEqual(isValidRealmSlug(badSlug), false);
      assert.strictEqual(getAcademicRealmBySlug(badSlug), undefined);
      assert.strictEqual(getLevelConfig(badSlug, 1), undefined);
    }
  });
});

describe("Adversarial Stress Test: getTimerVisualConfig Boundary Analysis", () => {
  // Boundary points specified in DISPATCH.md:
  // 36s, 35s, 21s, 20s, 16s, 15s, 10s, 9s, 1s, 0s, -1s
  const BOUNDARY_POINTS = [36, 35, 21, 20, 16, 15, 10, 9, 1, 0, -1] as const;

  it("evaluates getTimerVisualConfig across all 11 required boundary points", () => {
    const results: Record<number, TimerVisualConfig> = {};

    for (const sec of BOUNDARY_POINTS) {
      const cfg = getTimerVisualConfig(sec, 35);
      assert.ok(cfg, `getTimerVisualConfig(${sec}) must return a configuration object`);
      assert.ok(cfg.phase, `Phase must be defined at ${sec}s`);
      assert.ok(cfg.colorClass, `colorClass must be defined at ${sec}s`);
      assert.ok(cfg.bgSurfaceClass, `bgSurfaceClass must be defined at ${sec}s`);
      assert.ok(cfg.borderClass, `borderClass must be defined at ${sec}s`);
      assert.ok(cfg.barGradient, `barGradient must be defined at ${sec}s`);
      assert.ok(cfg.hintStatusLabel, `hintStatusLabel must be defined at ${sec}s`);
      results[sec] = cfg;
    }

    // Point 1: 36s (> 35s initial deadline, overflow/grace period)
    assert.strictEqual(results[36].phase, "normal", "At 36s phase must be 'normal'");
    assert.strictEqual(results[36].hintStatusLabel, "Hint unlocks in 21s");

    // Point 2: 35s (Standard starting countdown mark)
    assert.strictEqual(results[35].phase, "normal", "At 35s phase must be 'normal'");
    assert.strictEqual(results[35].hintStatusLabel, "Hint unlocks in 20s");

    // Point 3: 21s (Just before normal/warning boundary)
    assert.strictEqual(results[21].phase, "normal", "At 21s phase must be 'normal'");
    assert.strictEqual(results[21].hintStatusLabel, "Hint unlocks in 6s");

    // Point 4: 20s (Warning boundary)
    assert.strictEqual(results[20].phase, "warning", "At 20s phase must transition to 'warning'");
    // Note: Behavior at 20s - themeTokens marks "💡 Hint Available", though actual 15s unlock is at <= 15s.
    assert.strictEqual(results[20].hintStatusLabel, "💡 Hint Available");

    // Point 5: 16s (Inside warning zone, 1s before 15s hint unlock threshold)
    assert.strictEqual(results[16].phase, "warning", "At 16s phase must be 'warning'");
    assert.strictEqual(results[16].hintStatusLabel, "💡 Hint Available");

    // Point 6: 15s (Exact authoritative hint gate unlock threshold)
    assert.strictEqual(results[15].phase, "warning", "At 15s phase must be 'warning'");
    assert.strictEqual(results[15].hintStatusLabel, "💡 Hint Available");

    // Point 7: 10s (Exact warning/critical boundary)
    assert.strictEqual(results[10].phase, "critical", "At 10s phase must transition to 'critical'");
    assert.strictEqual(results[10].hintStatusLabel, "Critical Time");

    // Point 8: 9s (Inside critical zone)
    assert.strictEqual(results[9].phase, "critical", "At 9s phase must be 'critical'");
    assert.strictEqual(results[9].hintStatusLabel, "Critical Time");

    // Point 9: 1s (Last active second before expiration)
    assert.strictEqual(results[1].phase, "critical", "At 1s phase must be 'critical'");
    assert.strictEqual(results[1].hintStatusLabel, "Critical Time");

    // Point 10: 0s (Exact expiration)
    assert.strictEqual(results[0].phase, "critical", "At 0s phase must remain 'critical'");
    assert.strictEqual(results[0].hintStatusLabel, "Critical Time");

    // Point 11: -1s (Post-expiration / network latency / grace period buffer)
    assert.strictEqual(results[-1].phase, "critical", "At -1s phase must remain 'critical'");
    assert.strictEqual(results[-1].hintStatusLabel, "Critical Time");
  });

  it("verifies phase partition monotonicity and complete interval coverage", () => {
    // Test every integer second from -5 to 40
    for (let sec = -5; sec <= 40; sec++) {
      const cfg = getTimerVisualConfig(sec);

      if (sec > 20) {
        assert.strictEqual(cfg.phase, "normal", `Seconds ${sec} must be 'normal'`);
        assert.ok(
          cfg.hintStatusLabel.startsWith("Hint unlocks in"),
          `Seconds ${sec} label should indicate countdown until hint`
        );
      } else if (sec > 10) {
        assert.strictEqual(cfg.phase, "warning", `Seconds ${sec} must be 'warning'`);
        assert.strictEqual(cfg.hintStatusLabel, "💡 Hint Available");
      } else {
        assert.strictEqual(cfg.phase, "critical", `Seconds ${sec} must be 'critical'`);
        assert.strictEqual(cfg.hintStatusLabel, "Critical Time");
        assert.ok(cfg.pulseClass.includes("animate-pulse"));
      }
    }
  });

  it("analyzes architectural divergence between timer warning boundary (20s) and hint gate (15s)", () => {
    // Critical Challenge: getTimerVisualConfig currently displays "💡 Hint Available"
    // starting at 20s remaining, but the server hint gate unlocks at <= 15s remaining.
    // At seconds = 20, 19, 18, 17, 16 (a 5-second window), the UI visually indicates
    // the hint is available, while server-side gating (Phase 7 / M3) will reject requests.
    const preUnlockSeconds = [20, 19, 18, 17, 16];
    for (const sec of preUnlockSeconds) {
      const cfg = getTimerVisualConfig(sec);
      assert.strictEqual(
        cfg.hintStatusLabel,
        "💡 Hint Available",
        `Divergence confirmed: at ${sec}s remaining, getTimerVisualConfig reports hint available`
      );
    }
  });
});
