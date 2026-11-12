/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Empirical Challenger Adversarial Stress Test Suite
 * Target: tests/tier1-feature/challengerAdversarial.test.ts
 *
 * Role: Challenger 1 (Milestone 1 — Phases 1 & 2)
 *
 * Verifies:
 * 1. Boundary & Type-Confusion Attacks on Realm & Level Selectors
 * 2. Invariant Rigidity across all 6 Realms and 42 Levels
 * 3. Falsifiability & Oracle Stress-Testing on verify_data_preservation.ts
 * 4. Independent Direct SQLite Database Audit (Foreign Keys, Counts, Orphans)
 * =============================================================================
 */

import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaClient } from "@prisma/client";
import { describe, it } from "../run-all-tests";
import {
  ACADEMIC_REALMS,
  getAllAcademicRealms,
  getAcademicRealmBySlug,
  getLevelConfig,
  getRealmTheme,
  isValidLevelNumber,
  isValidRealmSlug,
  getAllRealmSlugs,
  getPassingCriteria,
} from "../../src/lib/realms/academicRealms";
import { runDataPreservationVerification } from "../../scripts/verify_data_preservation";

describe("Challenger 1 — Realm Slugs & Level Boundaries Adversarial Stress", () => {
  it("rejects non-integer, out-of-bounds, and malformed level numbers", () => {
    // Non-integer numbers
    const nonIntegers = [0.5, 1.0001, 1.9999, 2.5, 3.14159, 6.999, 7.0001, NaN, Infinity, -Infinity];
    for (const val of nonIntegers) {
      assert.equal(
        isValidLevelNumber(val as any),
        false,
        `isValidLevelNumber must reject non-integer ${val}`
      );
      assert.equal(
        getLevelConfig("algorithmic-citadel", val as any),
        undefined,
        `getLevelConfig must return undefined for non-integer level ${val}`
      );
      assert.equal(
        getPassingCriteria("algorithmic-citadel", val as any),
        undefined,
        `getPassingCriteria must return undefined for non-integer level ${val}`
      );
    }

    // Out-of-bounds integers (< 1 or > 7)
    const outOfBounds = [
      0, -1, -2, -100, -999999, Number.MIN_SAFE_INTEGER,
      8, 9, 10, 100, 999999, Number.MAX_SAFE_INTEGER,
    ];
    for (const val of outOfBounds) {
      assert.equal(
        isValidLevelNumber(val as any),
        false,
        `isValidLevelNumber must reject out-of-bounds integer ${val}`
      );
      assert.equal(
        getLevelConfig("algorithmic-citadel", val as any),
        undefined,
        `getLevelConfig must return undefined for out-of-bounds level ${val}`
      );
      assert.equal(
        getPassingCriteria("algorithmic-citadel", val as any),
        undefined,
        `getPassingCriteria must return undefined for out-of-bounds level ${val}`
      );
    }

    // Wrong types passed via type-cast (simulating untrusted API payloads)
    const wrongTypes: any[] = [
      "1", "7", "4", "", "null", null, undefined, {}, [], true, false,
      Symbol("1"), () => 1, BigInt(1),
    ];
    for (const val of wrongTypes) {
      assert.equal(
        isValidLevelNumber(val),
        false,
        `isValidLevelNumber must reject non-number type: ${typeof val}`
      );
      assert.equal(
        getLevelConfig("algorithmic-citadel", val),
        undefined,
        `getLevelConfig must return undefined for non-number level type: ${typeof val}`
      );
      assert.equal(
        getPassingCriteria("algorithmic-citadel", val),
        undefined,
        `getPassingCriteria must return undefined for non-number level type: ${typeof val}`
      );
    }

    // Valid boundaries: exactly 1 and 7 must pass
    assert.equal(isValidLevelNumber(1), true, "Level 1 must be valid");
    assert.equal(isValidLevelNumber(7), true, "Level 7 must be valid");
  });

  it("handles malicious, empty, malformed, and non-existent realm slugs safely", () => {
    const maliciousOrInvalidSlugs: any[] = [
      "",
      "   ",
      "\t\r\n",
      "null",
      "undefined",
      null,
      undefined,
      123,
      {},
      [],
      true,
      false,
      "../../etc/passwd",
      "'; DROP TABLE User; --",
      "<script>alert(1)</script>",
      "algorithmic",         // Substring of valid slug
      "citadel",             // Substring of valid slug
      "CS-20",               // Incomplete course code
      "CS-201-EXTENDED",     // Superset
      "unknown-realm-slug",
      "data_structures_and_algorithms", // Underscores instead of hyphens
      "neural.sanctum",      // Dots instead of hyphens
    ];

    for (const slug of maliciousOrInvalidSlugs) {
      assert.equal(
        isValidRealmSlug(slug),
        false,
        `isValidRealmSlug must return false for invalid slug: ${JSON.stringify(slug)}`
      );
      assert.equal(
        getAcademicRealmBySlug(slug),
        undefined,
        `getAcademicRealmBySlug must return undefined for invalid slug: ${JSON.stringify(slug)}`
      );
      assert.equal(
        getRealmTheme(slug),
        undefined,
        `getRealmTheme must return undefined for invalid slug: ${JSON.stringify(slug)}`
      );
      assert.equal(
        getLevelConfig(slug, 1),
        undefined,
        `getLevelConfig must return undefined for invalid slug: ${JSON.stringify(slug)}`
      );
      assert.equal(
        getPassingCriteria(slug, 1),
        undefined,
        `getPassingCriteria must return undefined for invalid slug: ${JSON.stringify(slug)}`
      );
    }
  });

  it("robustly resolves valid slugs with whitespace trimming and case insensitivity", () => {
    const testCases = [
      { input: "data-structures-and-algorithms", expectedSlug: "algorithmic-citadel" },
      { input: "DATA-STRUCTURES-AND-ALGORITHMS", expectedSlug: "algorithmic-citadel" },
      { input: "  data-structures-and-algorithms  ", expectedSlug: "algorithmic-citadel" },
      { input: "algorithmic-citadel", expectedSlug: "algorithmic-citadel" },
      { input: "ALGORITHMIC-CITADEL", expectedSlug: "algorithmic-citadel" },
      { input: "  algorithmic-citadel  ", expectedSlug: "algorithmic-citadel" },
      { input: "CS-201", expectedSlug: "algorithmic-citadel" },
      { input: "cs-201", expectedSlug: "algorithmic-citadel" },
      { input: "  Cs-201  ", expectedSlug: "algorithmic-citadel" },
      { input: "database-management-systems", expectedSlug: "relational-vault" },
      { input: "relational-vault", expectedSlug: "relational-vault" },
      { input: "CS-202", expectedSlug: "relational-vault" },
      { input: "operating-systems", expectedSlug: "kernel-keep" },
      { input: "kernel-keep", expectedSlug: "kernel-keep" },
      { input: "CS-203", expectedSlug: "kernel-keep" },
      { input: "computer-networks", expectedSlug: "network-nexus" },
      { input: "network-nexus", expectedSlug: "network-nexus" },
      { input: "CS-204", expectedSlug: "network-nexus" },
      { input: "ai-and-machine-learning", expectedSlug: "neural-sanctum" },
      { input: "neural-sanctum", expectedSlug: "neural-sanctum" },
      { input: "CS-301", expectedSlug: "neural-sanctum" },
      { input: "web-dev-and-devops", expectedSlug: "cloud-spire-bastion" },
      { input: "cloud-spire-bastion", expectedSlug: "cloud-spire-bastion" },
      { input: "CS-302", expectedSlug: "cloud-spire-bastion" },
    ];

    for (const tc of testCases) {
      const realm = getAcademicRealmBySlug(tc.input);
      assert.ok(realm, `Expected realm for input: ${tc.input}`);
      assert.equal(
        realm.realmSlug,
        tc.expectedSlug,
        `Input ${tc.input} should resolve to ${tc.expectedSlug}`
      );
      assert.equal(isValidRealmSlug(tc.input), true);
    }
  });

  it("empirically verifies all 42 realm levels adhere to progression, timer, and hint invariants", () => {
    const realms = getAllAcademicRealms();
    assert.equal(realms.length, 6, "Must have exactly 6 academic realms");

    let totalLevelsVerified = 0;

    for (const realm of realms) {
      assert.equal(realm.levels.length, 7, `Realm ${realm.realmSlug} must have 7 levels`);
      assert.equal(realm.totalLevels, 7);
      assert.equal(realm.totalQuestionsPerAttempt, 12);
      assert.equal(realm.passingThresholdScore, 9);
      assert.equal(realm.passingThresholdPercentage, 75);

      let prevXp = 0;

      for (let lvl = 1; lvl <= 7; lvl++) {
        const levelConfig = realm.levels[lvl - 1];
        totalLevelsVerified++;

        assert.equal(levelConfig.levelNumber, lvl);
        assert.equal(levelConfig.questionCount, 12);
        assert.equal(levelConfig.totalQuestions, 12);
        assert.equal(levelConfig.timeLimitPerQuestionSeconds, 35);
        assert.equal(levelConfig.timeLimitSeconds, 35);
        assert.equal(levelConfig.passingScoreThreshold, 9);
        assert.equal(levelConfig.passingThreshold, 9);
        assert.equal(levelConfig.passingPercentage, 75);

        // Timed Hint Gating Invariant:
        // Levels 1-6: hintsAvailable === true, hintUnlockSeconds === 15, isBossLevel === false
        // Level 7: hintsAvailable === false, hintUnlockSeconds === null, isBossLevel === true
        if (lvl <= 6) {
          assert.equal(
            levelConfig.hintsAvailable,
            true,
            `Level ${lvl} in ${realm.realmSlug} must have hintsAvailable === true`
          );
          assert.equal(
            levelConfig.hintUnlockSeconds,
            15,
            `Level ${lvl} in ${realm.realmSlug} must have hintUnlockSeconds === 15`
          );
          assert.equal(
            levelConfig.isBossLevel,
            false,
            `Level ${lvl} in ${realm.realmSlug} must not be a boss level`
          );
        } else {
          assert.equal(
            levelConfig.hintsAvailable,
            false,
            `Level 7 in ${realm.realmSlug} must have hintsAvailable === false`
          );
          assert.equal(
            levelConfig.hintUnlockSeconds,
            null,
            `Level 7 in ${realm.realmSlug} must have hintUnlockSeconds === null`
          );
          assert.equal(
            levelConfig.isBossLevel,
            true,
            `Level 7 in ${realm.realmSlug} must be marked isBossLevel === true`
          );
        }

        // Progression scaling: XP reward should scale positively
        assert.ok(
          levelConfig.xpReward > prevXp,
          `Level ${lvl} XP reward (${levelConfig.xpReward}) must exceed level ${lvl - 1} XP reward (${prevXp})`
        );
        prevXp = levelConfig.xpReward;

        // Syllabus academic topics non-empty
        assert.ok(
          Array.isArray(levelConfig.academicTopics) && levelConfig.academicTopics.length >= 2,
          `Level ${lvl} in ${realm.realmSlug} must list at least 2 syllabus topics`
        );
      }
    }

    assert.equal(totalLevelsVerified, 42, "Exactly 42 levels across 6 realms must be verified");
  });
});

describe("Challenger 1 — Falsifiability & Oracle Stress-Testing (verify_data_preservation.ts)", () => {
  // Helper to create a base mock dataset matching valid prisma/dev.db state
  function createBaseMockPrisma() {
    return {
      user: {
        count: async () => 19,
        findMany: async () => [
          { id: "usr_admin_1", username: "admin", role: "ADMIN" },
          { id: "usr_fac_1", username: "prof_turing", role: "FACULTY" },
          { id: "usr_fac_2", username: "prof_knuth", role: "FACULTY" },
          { id: "usr_fac_3", username: "prof_hopper", role: "FACULTY" },
          { id: "usr_anurag", username: "anurag", role: "STUDENT" },
          ...Array.from({ length: 14 }, (_, i) => ({
            id: `usr_stu_${i + 2}`,
            username: `student_${i + 2}`,
            role: "STUDENT",
          })),
        ],
      },
      profile: {
        count: async () => 19,
        findMany: async () => [
          { userId: "usr_admin_1" },
          { userId: "usr_fac_1" },
          { userId: "usr_fac_2" },
          { userId: "usr_fac_3" },
          { userId: "usr_anurag" },
          ...Array.from({ length: 14 }, (_, i) => ({ userId: `usr_stu_${i + 2}` })),
        ],
      },
      quizAttempt: {
        count: async () => 27,
        aggregate: async () => ({
          _sum: { score: 53, total: 96, xpEarned: 2426 },
        }),
        findMany: async () => Array.from({ length: 27 }, () => ({ userId: "usr_anurag" })),
      },
      topicMastery: {
        count: async () => 76,
        findMany: async () =>
          Array.from({ length: 76 }, () => ({
            studentId: "usr_anurag",
            accuracy: 75.0,
          })),
      },
      cRConversation: {
        count: async () => 25,
        findMany: async () =>
          Array.from({ length: 25 }, (_, i) => ({
            id: `conv_${i + 1}`,
            userId: "usr_anurag",
          })),
      },
      cRMessage: {
        count: async () => 80,
        findMany: async () =>
          Array.from({ length: 80 }, (_, i) => ({
            conversationId: `conv_${(i % 25) + 1}`,
          })),
      },
      xPTransaction: {
        count: async () => 19,
        aggregate: async () => ({ _sum: { amount: 2490 } }),
        findMany: async () => Array.from({ length: 19 }, () => ({ userId: "usr_anurag" })),
      },
      clan: {
        count: async () => 2,
      },
      clanMember: {
        count: async () => 3,
        findMany: async () => Array.from({ length: 3 }, () => ({ userId: "usr_anurag" })),
      },
      clanActivity: {
        count: async () => 3,
      },
      $disconnect: async () => {},
    };
  }

  it("correctly fails when entity record counts drop (Simulated Record Deletion)", async () => {
    // Drop User count from 19 to 18
    const mockPrisma = createBaseMockPrisma();
    mockPrisma.user.count = async () => 18;

    const report = await runDataPreservationVerification(mockPrisma as any);
    assert.equal(report.success, false, "Verification MUST fail if User count drops");
    assert.ok(
      report.errors.some((e) => e.includes("Entity count mismatch for User")),
      `Errors must include User mismatch: ${report.errors.join("; ")}`
    );

    // Drop QuizAttempt count from 27 to 26
    const mockPrismaAttempts = createBaseMockPrisma();
    mockPrismaAttempts.quizAttempt.count = async () => 26;

    const reportAttempts = await runDataPreservationVerification(mockPrismaAttempts as any);
    assert.equal(reportAttempts.success, false, "Verification MUST fail if QuizAttempt count drops");
    assert.ok(
      reportAttempts.errors.some((e) => e.includes("Entity count mismatch for QuizAttempt")),
      `Errors must include QuizAttempt mismatch: ${reportAttempts.errors.join("; ")}`
    );
  });

  it("correctly fails when aggregate sums are altered (Simulated Score/XP Mutation)", async () => {
    // Mutate QuizAttempt score sum from 53 to 52
    const mockPrismaScore = createBaseMockPrisma();
    mockPrismaScore.quizAttempt.aggregate = async () => ({
      _sum: { score: 52, total: 96, xpEarned: 2426 },
    });

    const reportScore = await runDataPreservationVerification(mockPrismaScore as any);
    assert.equal(reportScore.success, false, "Verification MUST fail on QuizAttempt score sum divergence");
    assert.ok(
      reportScore.errors.some((e) => e.includes("QuizAttempt score sum")),
      `Errors must flag score sum mismatch: ${reportScore.errors.join("; ")}`
    );

    // Mutate XPTransaction amount sum from 2490 to 2000
    const mockPrismaXp = createBaseMockPrisma();
    mockPrismaXp.xPTransaction.aggregate = async () => ({ _sum: { amount: 2000 } });

    const reportXp = await runDataPreservationVerification(mockPrismaXp as any);
    assert.equal(reportXp.success, false, "Verification MUST fail on XPTransaction sum divergence");
    assert.ok(
      reportXp.errors.some((e) => e.includes("XPTransaction amount sum")),
      `Errors must flag XP mismatch: ${reportXp.errors.join("; ")}`
    );
  });

  it("correctly fails when foreign key relationships contain orphaned records", async () => {
    // Inject an orphaned Profile pointing to non-existent userId 'ghost_user'
    const mockPrismaProfile = createBaseMockPrisma();
    mockPrismaProfile.profile.findMany = async () => [
      { userId: "usr_admin_1" },
      { userId: "ghost_user" }, // Orphan!
      ...Array.from({ length: 17 }, (_, i) => ({ userId: `usr_stu_${i + 2}` })),
    ];

    const reportProfile = await runDataPreservationVerification(mockPrismaProfile as any);
    assert.equal(reportProfile.success, false, "Verification MUST fail on orphaned Profile");
    assert.ok(
      reportProfile.errors.some((e) => e.includes("Profile -> User")),
      `Errors must flag orphaned Profile: ${reportProfile.errors.join("; ")}`
    );

    // Inject an orphaned CRMessage pointing to non-existent conversationId 'ghost_conv'
    const mockPrismaMessage = createBaseMockPrisma();
    mockPrismaMessage.cRMessage.findMany = async () => [
      { conversationId: "ghost_conv" }, // Orphan!
      ...Array.from({ length: 79 }, (_, i) => ({ conversationId: `conv_${(i % 25) + 1}` })),
    ];

    const reportMessage = await runDataPreservationVerification(mockPrismaMessage as any);
    assert.equal(reportMessage.success, false, "Verification MUST fail on orphaned CRMessage");
    assert.ok(
      reportMessage.errors.some((e) => e.includes("CRMessage -> CRConversation")),
      `Errors must flag orphaned CRMessage: ${reportMessage.errors.join("; ")}`
    );
  });

  it("correctly fails when critical student record 'anurag' or role distribution is violated", async () => {
    // Simulate critical student 'anurag' deleted or renamed
    const mockPrismaNoAnurag = createBaseMockPrisma();
    mockPrismaNoAnurag.user.findMany = async () => [
      { id: "usr_admin_1", username: "admin", role: "ADMIN" },
      { id: "usr_fac_1", username: "prof_turing", role: "FACULTY" },
      { id: "usr_fac_2", username: "prof_knuth", role: "FACULTY" },
      { id: "usr_fac_3", username: "prof_hopper", role: "FACULTY" },
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `usr_stu_${i + 1}`,
        username: `student_${i + 1}`,
        role: "STUDENT",
      })),
    ];

    const reportNoAnurag = await runDataPreservationVerification(mockPrismaNoAnurag as any);
    assert.equal(reportNoAnurag.success, false, "Verification MUST fail if 'anurag' is missing");
    assert.ok(
      reportNoAnurag.errors.some((e) => e.includes("'anurag'")),
      `Errors must mention anurag: ${reportNoAnurag.errors.join("; ")}`
    );

    // Simulate role distribution mismatch (e.g. 2 ADMIN, 2 FACULTY)
    const mockPrismaRoleMismatch = createBaseMockPrisma();
    mockPrismaRoleMismatch.user.findMany = async () => [
      { id: "usr_admin_1", username: "admin", role: "ADMIN" },
      { id: "usr_admin_2", username: "admin2", role: "ADMIN" }, // Extra admin
      { id: "usr_fac_1", username: "prof_turing", role: "FACULTY" },
      { id: "usr_fac_2", username: "prof_knuth", role: "FACULTY" }, // Missing faculty
      { id: "usr_anurag", username: "anurag", role: "STUDENT" },
      ...Array.from({ length: 14 }, (_, i) => ({
        id: `usr_stu_${i + 2}`,
        username: `student_${i + 2}`,
        role: "STUDENT",
      })),
    ];

    const reportRole = await runDataPreservationVerification(mockPrismaRoleMismatch as any);
    assert.equal(reportRole.success, false, "Verification MUST fail on role distribution mismatch");
    assert.ok(
      reportRole.errors.some((e) => e.includes("Role distribution mismatch")),
      `Errors must mention role mismatch: ${reportRole.errors.join("; ")}`
    );
  });

  it("correctly fails when TopicMastery accuracy exceeds bounds [0, 100]", async () => {
    const mockPrismaMastery = createBaseMockPrisma();
    mockPrismaMastery.topicMastery.findMany = async () => [
      { studentId: "usr_anurag", accuracy: 150.0 }, // Out of bounds!
      ...Array.from({ length: 75 }, () => ({
        studentId: "usr_anurag",
        accuracy: 75.0,
      })),
    ];

    const reportMastery = await runDataPreservationVerification(mockPrismaMastery as any);
    assert.equal(reportMastery.success, false, "Verification MUST fail on accuracy > 100");
    assert.ok(
      reportMastery.errors.some((e) => e.includes("TopicMastery records with accuracy outside [0, 100]")),
      `Errors must mention accuracy bounds: ${reportMastery.errors.join("; ")}`
    );
  });
});

describe("Challenger 1 — Independent Direct SQLite Database Audit (prisma/dev.db)", () => {
  let prisma: PrismaClient;

  it("independently queries and verifies the actual production SQLite database", async () => {
    prisma = new PrismaClient();

    try {
      // 1. Direct raw SQL count inspection
      const userCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM User")) as any[];
      assert.equal(Number(userCountRes[0].count), 19, "Direct SQL: User count must be 19");

      const profileCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM Profile")) as any[];
      assert.equal(Number(profileCountRes[0].count), 19, "Direct SQL: Profile count must be 19");

      const attemptCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM QuizAttempt")) as any[];
      assert.equal(Number(attemptCountRes[0].count), 27, "Direct SQL: QuizAttempt count must be 27");

      const masteryCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM TopicMastery")) as any[];
      assert.equal(Number(masteryCountRes[0].count), 76, "Direct SQL: TopicMastery count must be 76");

      const convoCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM CRConversation")) as any[];
      assert.equal(Number(convoCountRes[0].count), 25, "Direct SQL: CRConversation count must be 25");

      const messageCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM CRMessage")) as any[];
      assert.equal(Number(messageCountRes[0].count), 80, "Direct SQL: CRMessage count must be 80");

      const xpCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM XPTransaction")) as any[];
      assert.equal(Number(xpCountRes[0].count), 19, "Direct SQL: XPTransaction count must be 19");

      const clanCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM Clan")) as any[];
      assert.equal(Number(clanCountRes[0].count), 2, "Direct SQL: Clan count must be 2");

      const clanMemberCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM ClanMember")) as any[];
      assert.equal(Number(clanMemberCountRes[0].count), 3, "Direct SQL: ClanMember count must be 3");

      const clanActCountRes = (await prisma.$queryRawUnsafe("SELECT COUNT(*) as count FROM ClanActivity")) as any[];
      assert.equal(Number(clanActCountRes[0].count), 3, "Direct SQL: ClanActivity count must be 3");

      // 2. Direct SQL Orphan Checks across all foreign keys
      const orphanChecks: Array<{ name: string; sql: string }> = [
        {
          name: "Profile -> User",
          sql: "SELECT COUNT(*) as c FROM Profile WHERE userId NOT IN (SELECT id FROM User)",
        },
        {
          name: "QuizAttempt -> User",
          sql: "SELECT COUNT(*) as c FROM QuizAttempt WHERE userId NOT IN (SELECT id FROM User)",
        },
        {
          name: "TopicMastery -> User",
          sql: "SELECT COUNT(*) as c FROM TopicMastery WHERE studentId NOT IN (SELECT id FROM User)",
        },
        {
          name: "CRConversation -> User",
          sql: "SELECT COUNT(*) as c FROM CRConversation WHERE userId NOT IN (SELECT id FROM User)",
        },
        {
          name: "CRMessage -> CRConversation",
          sql: "SELECT COUNT(*) as c FROM CRMessage WHERE conversationId NOT IN (SELECT id FROM CRConversation)",
        },
        {
          name: "XPTransaction -> User",
          sql: "SELECT COUNT(*) as c FROM XPTransaction WHERE userId NOT IN (SELECT id FROM User)",
        },
        {
          name: "ClanMember -> User",
          sql: "SELECT COUNT(*) as c FROM ClanMember WHERE userId NOT IN (SELECT id FROM User)",
        },
        {
          name: "ClanMember -> Clan",
          sql: "SELECT COUNT(*) as c FROM ClanMember WHERE clanId NOT IN (SELECT id FROM Clan)",
        },
        {
          name: "ClanActivity -> Clan",
          sql: "SELECT COUNT(*) as c FROM ClanActivity WHERE clanId NOT IN (SELECT id FROM Clan)",
        },
      ];

      for (const chk of orphanChecks) {
        const res = (await prisma.$queryRawUnsafe(chk.sql)) as any[];
        const orphanCount = Number(res[0].c);
        assert.equal(
          orphanCount,
          0,
          `Direct SQL check: Found ${orphanCount} orphaned rows in foreign key ${chk.name}`
        );
      }

      // 3. User 'anurag' integrity
      const anuragRes = (await prisma.$queryRawUnsafe(
        "SELECT id, username, role FROM User WHERE username = 'anurag'"
      )) as any[];
      assert.equal(anuragRes.length, 1, "Student 'anurag' must exist in User table");
      assert.equal(anuragRes[0].role, "STUDENT", "Student 'anurag' must have role 'STUDENT'");

      const anuragProfileRes = (await prisma.$queryRawUnsafe(
        "SELECT * FROM Profile WHERE userId = ?",
        anuragRes[0].id
      )) as any[];
      assert.equal(anuragProfileRes.length, 1, "Student 'anurag' must have a 1:1 Profile record");

      // 4. Invariant range assertions via SQL
      const invalidMasteryRes = (await prisma.$queryRawUnsafe(
        "SELECT COUNT(*) as c FROM TopicMastery WHERE accuracy < 0 OR accuracy > 100"
      )) as any[];
      assert.equal(Number(invalidMasteryRes[0].c), 0, "No TopicMastery record should have accuracy outside [0, 100]");

      const invalidScoreRes = (await prisma.$queryRawUnsafe(
        "SELECT COUNT(*) as c FROM QuizAttempt WHERE score < 0 OR score > total"
      )) as any[];
      assert.equal(Number(invalidScoreRes[0].c), 0, "No QuizAttempt should have score < 0 or score > total");
    } finally {
      await prisma.$disconnect();
    }
  });
});
