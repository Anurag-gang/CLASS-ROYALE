/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Student Data Preservation Verification Script
 * Target: scripts/verify_data_preservation.ts
 *
 * Verifies that existing student records in prisma/dev.db remain 100% intact:
 * - 19 Users (1 ADMIN, 3 FACULTY, 15 STUDENT)
 * - 19 Profiles (1:1 with Users)
 * - 27 QuizAttempts (Sum score: 53, total questions: 96, xpEarned: 2426)
 * - 76 TopicMasteries (Across 6 CS domains, accuracy bounded [0, 100])
 * - 25 CRConversations & 80 CRMessages
 * - 19 XPTransactions (Sum amount: 2490)
 * - 2 Clans, 3 ClanMembers, 3 ClanActivities
 * - Zero orphaned foreign key relationships
 * =============================================================================
 */

import { PrismaClient } from "@prisma/client";

export interface EntityCheck {
  entity: string;
  expected: number;
  actual: number;
  passed: boolean;
}

export interface AggregateCheck {
  name: string;
  expected: number;
  actual: number;
  passed: boolean;
}

export interface IntegrityCheck {
  relation: string;
  orphans: number;
  passed: boolean;
}

export interface PreservationReport {
  success: boolean;
  timestamp: string;
  entityChecks: EntityCheck[];
  aggregateChecks: AggregateCheck[];
  integrityChecks: IntegrityCheck[];
  roleDistribution: Record<string, number>;
  errors: string[];
}

export async function runDataPreservationVerification(
  prismaClient?: PrismaClient
): Promise<PreservationReport> {
  const prisma = prismaClient || new PrismaClient();
  const errors: string[] = [];

  try {
    // 1. Entity Record Counts
    const [
      users,
      profiles,
      quizAttempts,
      topicMasteries,
      crConversations,
      crMessages,
      xpTransactions,
      clans,
      clanMembers,
      clanActivities,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.quizAttempt.count(),
      prisma.topicMastery.count(),
      prisma.cRConversation.count(),
      prisma.cRMessage.count(),
      prisma.xPTransaction.count(),
      prisma.clan.count(),
      prisma.clanMember.count(),
      prisma.clanActivity.count(),
    ]);

    const entityExpected: Record<string, number> = {
      User: 19,
      Profile: 19,
      QuizAttempt: 27,
      TopicMastery: 76,
      CRConversation: 25,
      CRMessage: 80,
      XPTransaction: 19,
      Clan: 2,
      ClanMember: 3,
      ClanActivity: 3,
    };

    const actualMap: Record<string, number> = {
      User: users,
      Profile: profiles,
      QuizAttempt: quizAttempts,
      TopicMastery: topicMasteries,
      CRConversation: crConversations,
      CRMessage: crMessages,
      XPTransaction: xpTransactions,
      Clan: clans,
      ClanMember: clanMembers,
      ClanActivity: clanActivities,
    };

    const entityChecks: EntityCheck[] = Object.entries(entityExpected).map(
      ([entity, expected]) => {
        const actual = actualMap[entity] ?? 0;
        const passed = actual >= expected;
        if (!passed) {
          errors.push(
            `Entity count mismatch for ${entity}: expected at least ${expected}, got ${actual}`
          );
        }
        return { entity, expected, actual, passed };
      }
    );

    // 2. User Roles & Key Accounts Check
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true, role: true },
    });
    const roleDistribution: Record<string, number> = {};
    for (const u of allUsers) {
      roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1;
    }

    if (
      roleDistribution["ADMIN"] !== 1 ||
      roleDistribution["FACULTY"] !== 3 ||
      roleDistribution["STUDENT"] !== 15
    ) {
      errors.push(
        `Role distribution mismatch: expected 1 ADMIN, 3 FACULTY, 15 STUDENT. Got: ${JSON.stringify(
          roleDistribution
        )}`
      );
    }

    const anuragUser = allUsers.find((u) => u.username === "anurag");
    if (!anuragUser) {
      errors.push("Critical student record 'anurag' not found in User table");
    }

    // 3. Aggregate Invariants
    const attemptAgg = await prisma.quizAttempt.aggregate({
      _sum: { score: true, total: true, xpEarned: true },
    });
    const xpAgg = await prisma.xPTransaction.aggregate({
      _sum: { amount: true },
    });

    const aggregateChecks: AggregateCheck[] = [
      {
        name: "QuizAttempt score sum",
        expected: 53,
        actual: attemptAgg._sum.score ?? 0,
        passed: (attemptAgg._sum.score ?? 0) === 53,
      },
      {
        name: "QuizAttempt total questions sum",
        expected: 96,
        actual: attemptAgg._sum.total ?? 0,
        passed: (attemptAgg._sum.total ?? 0) === 96,
      },
      {
        name: "QuizAttempt xpEarned sum",
        expected: 2426,
        actual: attemptAgg._sum.xpEarned ?? 0,
        passed: (attemptAgg._sum.xpEarned ?? 0) === 2426,
      },
      {
        name: "XPTransaction amount sum",
        expected: 2490,
        actual: xpAgg._sum.amount ?? 0,
        passed: (xpAgg._sum.amount ?? 0) === 2490,
      },
    ];

    for (const chk of aggregateChecks) {
      if (!chk.passed) {
        errors.push(
          `Aggregate invariant failed for ${chk.name}: expected ${chk.expected}, got ${chk.actual}`
        );
      }
    }

    // 4. Foreign Key & Referential Integrity (0 Orphans)
    const userIds = new Set(allUsers.map((u) => u.id));

    const [
      allProfiles,
      allAttempts,
      allMasteries,
      allConvos,
      allMessages,
      allXp,
      allClanMembers,
    ] = await Promise.all([
      prisma.profile.findMany({ select: { userId: true } }),
      prisma.quizAttempt.findMany({ select: { userId: true } }),
      prisma.topicMastery.findMany({ select: { studentId: true, accuracy: true } }),
      prisma.cRConversation.findMany({ select: { id: true, userId: true } }),
      prisma.cRMessage.findMany({ select: { conversationId: true } }),
      prisma.xPTransaction.findMany({ select: { userId: true } }),
      prisma.clanMember.findMany({ select: { userId: true } }),
    ]);

    const convoIds = new Set(allConvos.map((c) => c.id));

    const orphanedProfiles = allProfiles.filter((p) => !userIds.has(p.userId)).length;
    const orphanedAttempts = allAttempts.filter((a) => !userIds.has(a.userId)).length;
    const orphanedMasteries = allMasteries.filter((m) => !userIds.has(m.studentId)).length;
    const orphanedConvos = allConvos.filter((c) => !userIds.has(c.userId)).length;
    const orphanedMessages = allMessages.filter((m) => !convoIds.has(m.conversationId)).length;
    const orphanedXp = allXp.filter((x) => !userIds.has(x.userId)).length;
    const orphanedClanMembers = allClanMembers.filter((cm) => !userIds.has(cm.userId)).length;

    // Accuracy range check for TopicMastery [0, 100]
    const outOfBoundsMasteries = allMasteries.filter(
      (m) => m.accuracy < 0 || m.accuracy > 100
    ).length;
    if (outOfBoundsMasteries > 0) {
      errors.push(`Found ${outOfBoundsMasteries} TopicMastery records with accuracy outside [0, 100]`);
    }

    const integrityChecks: IntegrityCheck[] = [
      { relation: "Profile -> User", orphans: orphanedProfiles, passed: orphanedProfiles === 0 },
      { relation: "QuizAttempt -> User", orphans: orphanedAttempts, passed: orphanedAttempts === 0 },
      { relation: "TopicMastery -> User", orphans: orphanedMasteries, passed: orphanedMasteries === 0 },
      { relation: "CRConversation -> User", orphans: orphanedConvos, passed: orphanedConvos === 0 },
      { relation: "CRMessage -> CRConversation", orphans: orphanedMessages, passed: orphanedMessages === 0 },
      { relation: "XPTransaction -> User", orphans: orphanedXp, passed: orphanedXp === 0 },
      { relation: "ClanMember -> User", orphans: orphanedClanMembers, passed: orphanedClanMembers === 0 },
    ];

    for (const chk of integrityChecks) {
      if (!chk.passed) {
        errors.push(`Foreign key violation in ${chk.relation}: ${chk.orphans} orphaned records found`);
      }
    }

    const success = errors.length === 0;

    return {
      success,
      timestamp: new Date().toISOString(),
      entityChecks,
      aggregateChecks,
      integrityChecks,
      roleDistribution,
      errors,
    };
  } finally {
    if (!prismaClient) {
      await prisma.$disconnect();
    }
  }
}

// Standalone CLI Execution
if (
  process.argv[1]?.endsWith("verify_data_preservation.ts") ||
  process.argv[1]?.endsWith("proposed_verify_data_preservation.ts")
) {
  runDataPreservationVerification()
    .then((report) => {
      console.log("\n=======================================================");
      console.log(" KNOWLEDGE KINGDOM: STUDENT DATA PRESERVATION REPORT");
      console.log(` Timestamp: ${report.timestamp}`);
      console.log("=======================================================\n");

      console.log("--- 1. Entity Record Counts ---");
      report.entityChecks.forEach((chk) => {
        const symbol = chk.passed ? "✔ PASS" : "✖ FAIL";
        console.log(
          `  [${symbol}] ${chk.entity.padEnd(16)} Expected: ${String(chk.expected).padStart(3)} | Observed: ${String(chk.actual).padStart(3)}`
        );
      });

      console.log("\n--- 2. Aggregate Invariants ---");
      report.aggregateChecks.forEach((chk) => {
        const symbol = chk.passed ? "✔ PASS" : "✖ FAIL";
        console.log(
          `  [${symbol}] ${chk.name.padEnd(34)} Expected: ${String(chk.expected).padStart(5)} | Observed: ${String(chk.actual).padStart(5)}`
        );
      });

      console.log("\n--- 3. Foreign Key / Orphan Checks ---");
      report.integrityChecks.forEach((chk) => {
        const symbol = chk.passed ? "✔ PASS" : "✖ FAIL";
        console.log(`  [${symbol}] ${chk.relation.padEnd(34)} Orphans: ${chk.orphans}`);
      });

      console.log("\n--- 4. Role Distribution ---");
      console.log(`  ADMIN: ${report.roleDistribution["ADMIN"] || 0} | FACULTY: ${report.roleDistribution["FACULTY"] || 0} | STUDENT: ${report.roleDistribution["STUDENT"] || 0}`);

      console.log("\n=======================================================");
      if (report.success) {
        console.log(" OVERALL VERDICT: PASSED (100% Student Data Preservation Intact)");
        console.log("=======================================================\n");
        process.exit(0);
      } else {
        console.error(" OVERALL VERDICT: FAILED (Data Loss or Integrity Violation Detected)");
        report.errors.forEach((err) => console.error(`  - ${err}`));
        console.log("=======================================================\n");
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Fatal failure running preservation verification:", err);
      process.exit(1);
    });
}
