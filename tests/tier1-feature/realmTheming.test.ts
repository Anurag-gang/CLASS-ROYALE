/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Tier 1 Feature Test Suite
 * Target: tests/tier1-feature/realmTheming.test.ts
 *
 * Validates:
 * 1. Complete Academic Realm Definitions (R1): 6 realms, course codes (CS-201..CS-302),
 *    80% academic domain + 20% RPG identity, accent colors, icons.
 * 2. Progression Levels (Levels 1 to 7): 12 questions per level, 35s timer,
 *    passing threshold 9/12 (75%).
 * 3. Timed Hint Rules: Enabled with 15s gate on Levels 1-6; strictly disabled on Level 7.
 * 4. Helper Functions: getAllAcademicRealms(), getAcademicRealmBySlug(), getLevelConfig().
 * 5. Student Data Preservation: 100% intact verification for 19 users, 19 profiles,
 *    27 quiz attempts, 76 masteries, 25 convos, 19 XP transactions, 0 orphans.
 * =============================================================================
 */

import assert from "node:assert/strict";
import { describe, it } from "../run-all-tests";

async function loadRealmsModule() {
  try {
    return await import("../../src/lib/realms/academicRealms");
  } catch (err: any) {
    throw new Error(
      `Cannot load academicRealms module at src/lib/realms/academicRealms.ts. Has Phase 1/2 implementation created it? Error: ${err.message}`
    );
  }
}

async function loadPreservationModule() {
  try {
    return await import("../../scripts/verify_data_preservation");
  } catch (err: any) {
    throw new Error(
      `Cannot load verify_data_preservation script at scripts/verify_data_preservation.ts. Has Phase 1/2 implementation created it? Error: ${err.message}`
    );
  }
}

const CANONICAL_REALM_SLUGS = [
  "data-structures-and-algorithms",
  "database-management-systems",
  "operating-systems",
  "computer-networks",
  "ai-and-machine-learning",
  "web-dev-and-devops",
] as const;

const EXPECTED_COURSE_CODES: Record<string, string> = {
  "data-structures-and-algorithms": "CS-201",
  "database-management-systems": "CS-202",
  "operating-systems": "CS-203",
  "computer-networks": "CS-204",
  "ai-and-machine-learning": "CS-301",
  "web-dev-and-devops": "CS-302",
};

const EXPECTED_REALM_NAMES: Record<string, string> = {
  "data-structures-and-algorithms": "Algorithmic Citadel",
  "database-management-systems": "Relational Vault",
  "operating-systems": "Kernel Keep",
  "computer-networks": "Network Nexus",
  "ai-and-machine-learning": "Neural Sanctum",
  "web-dev-and-devops": "Cloud Spire Bastion",
};

describe("Milestone 1 — Academic Realm Theming (R1)", () => {
  it("verifies all 6 canonical academic realms are defined and registered", async () => {
    const realmsMod = await loadRealmsModule();
    assert.ok(
      typeof realmsMod.getAllAcademicRealms === "function",
      "getAllAcademicRealms must be an exported function"
    );

    const realms = realmsMod.getAllAcademicRealms();
    assert.equal(realms.length, 6, "Expected exactly 6 registered academic realms");

    const retrievedSlugs = realms.map((r: any) => r.slug);
    assert.deepEqual(
      retrievedSlugs.sort(),
      [...CANONICAL_REALM_SLUGS].sort(),
      "Registered realm slugs must match the 6 canonical slugs"
    );
  });

  it("verifies each realm maps to correct course code, title, and theme metadata", async () => {
    const realmsMod = await loadRealmsModule();
    const realms = realmsMod.getAllAcademicRealms();

    for (const realm of realms) {
      assert.ok(realm.slug, "Realm must define slug");
      assert.equal(
        realm.name,
        EXPECTED_REALM_NAMES[realm.slug],
        `Realm ${realm.slug} name must match Knowledge Kingdom title`
      );
      assert.equal(
        realm.courseCode,
        EXPECTED_COURSE_CODES[realm.slug],
        `Realm ${realm.slug} courseCode must match expected academic code`
      );
      assert.ok(
        realm.academicDomain && realm.academicDomain.length >= 10,
        `Realm ${realm.slug} must define a substantive 80% academic domain syllabus description`
      );
      assert.ok(
        realm.rpgFlavor && realm.rpgFlavor.length >= 5,
        `Realm ${realm.slug} must define 20% RPG fantasy flavor`
      );
      assert.match(
        realm.accentColor,
        /^#[0-9a-fA-F]{6}$/,
        `Realm ${realm.slug} accentColor must be a valid 6-character hex string`
      );
      assert.ok(realm.icon, `Realm ${realm.slug} must specify an icon identifier`);
    }
  });

  it("verifies every realm configures exactly 7 levels with 12 questions and 35s timers", async () => {
    const realmsMod = await loadRealmsModule();
    const realms = realmsMod.getAllAcademicRealms();

    for (const realm of realms) {
      assert.ok(
        Array.isArray(realm.levels),
        `Realm ${realm.slug} must define a levels array`
      );
      assert.equal(
        realm.levels.length,
        7,
        `Realm ${realm.slug} must contain exactly 7 progression levels`
      );

      realm.levels.forEach((lvl: any, index: number) => {
        const expectedLevel = index + 1;
        assert.equal(
          lvl.levelNumber,
          expectedLevel,
          `Level index ${index} must have levelNumber ${expectedLevel}`
        );
        assert.equal(
          lvl.totalQuestions,
          12,
          `Level ${lvl.levelNumber} in ${realm.slug} must enforce exactly 12 questions`
        );
        assert.equal(
          lvl.timeLimitSeconds,
          35,
          `Level ${lvl.levelNumber} in ${realm.slug} must enforce authoritative 35s timer`
        );
        assert.equal(
          lvl.passingThreshold,
          9,
          `Level ${lvl.levelNumber} in ${realm.slug} must enforce 9/12 (75%) passing threshold`
        );
      });
    }
  });

  it("verifies hint availability rules: enabled for Levels 1–6 (15s gate), disabled on Level 7", async () => {
    const realmsMod = await loadRealmsModule();
    const realms = realmsMod.getAllAcademicRealms();

    for (const realm of realms) {
      // Levels 1 to 6
      for (let lvl = 1; lvl <= 6; lvl++) {
        const config = realm.levels[lvl - 1];
        assert.equal(
          config.hintsAvailable,
          true,
          `Level ${lvl} in ${realm.slug} must have hintsAvailable === true`
        );
        assert.equal(
          config.hintUnlockSeconds,
          15,
          `Level ${lvl} in ${realm.slug} must unlock hints at <= 15 seconds remaining`
        );
      }

      // Level 7: Boss Crucible
      const level7Config = realm.levels[6];
      assert.equal(
        level7Config.hintsAvailable,
        false,
        `Level 7 in ${realm.slug} must strictly enforce hintsAvailable === false (Boss Crucible lockout)`
      );
    }
  });

  it("verifies realm helper functions and boundary behavior", async () => {
    const realmsMod = await loadRealmsModule();

    // getAcademicRealmBySlug
    const dsa = realmsMod.getAcademicRealmBySlug("data-structures-and-algorithms");
    assert.ok(dsa, "getAcademicRealmBySlug must return realm object for valid slug");
    assert.equal(dsa.name, "Algorithmic Citadel");

    const nonExistent = realmsMod.getAcademicRealmBySlug("invalid-slug-12345");
    assert.equal(nonExistent, undefined, "Invalid slug must return undefined");

    // getLevelConfig
    const l1 = realmsMod.getLevelConfig("data-structures-and-algorithms", 1);
    assert.ok(l1, "getLevelConfig must return valid config for level 1");
    assert.equal(l1.levelNumber, 1);
    assert.equal(l1.hintsAvailable, true);

    const l7 = realmsMod.getLevelConfig("data-structures-and-algorithms", 7);
    assert.ok(l7, "getLevelConfig must return valid config for level 7");
    assert.equal(l7.levelNumber, 7);
    assert.equal(l7.hintsAvailable, false);

    const l8 = realmsMod.getLevelConfig("data-structures-and-algorithms", 8);
    assert.equal(l8, undefined, "Out-of-bounds level 8 must return undefined");

    const l0 = realmsMod.getLevelConfig("data-structures-and-algorithms", 0);
    assert.equal(l0, undefined, "Out-of-bounds level 0 must return undefined");
  });
});

describe("Milestone 1 — Student Data Preservation Baseline", () => {
  it("verifies 100% student data preservation in prisma/dev.db (19 Users, 19 Profiles, 27 Attempts)", async () => {
    const preservationMod = await loadPreservationModule();
    assert.ok(
      typeof preservationMod.runDataPreservationVerification === "function",
      "runDataPreservationVerification must be exported from verify_data_preservation script"
    );

    const report = await preservationMod.runDataPreservationVerification();
    assert.equal(
      report.success,
      true,
      `Student data preservation check failed! Errors: ${report.errors.join("; ")}`
    );
    assert.equal(report.errors.length, 0, "Preservation report must contain zero errors");

    const entityMap = Object.fromEntries(
      report.entityChecks.map((c: any) => [c.entity, c.actual])
    );

    assert.equal(entityMap["User"], 19, "Must preserve exactly 19 Users");
    assert.equal(entityMap["Profile"], 19, "Must preserve exactly 19 Profiles");
    assert.equal(entityMap["QuizAttempt"], 27, "Must preserve exactly 27 QuizAttempts");
    assert.equal(entityMap["TopicMastery"], 76, "Must preserve exactly 76 TopicMasteries");
    assert.equal(entityMap["CRConversation"], 25, "Must preserve exactly 25 CRConversations");
    assert.equal(entityMap["CRMessage"], 80, "Must preserve exactly 80 CRMessages");
    assert.equal(entityMap["XPTransaction"], 19, "Must preserve exactly 19 XPTransactions");

    // Foreign key integrity
    for (const check of report.integrityChecks) {
      assert.equal(
        check.orphans,
        0,
        `Foreign key integrity violated for relation: ${check.relation}`
      );
    }

    // Role distribution
    assert.equal(report.roleDistribution["ADMIN"], 1);
    assert.equal(report.roleDistribution["FACULTY"], 3);
    assert.equal(report.roleDistribution["STUDENT"], 15);
  });
});
