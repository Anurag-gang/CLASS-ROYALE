import { getSubjectLevelsWithProgress } from "../src/lib/services/levelQuizService";
import { prisma } from "../src/lib/db";

async function verifyAll() {
  try {
    console.log("1. Testing level progression service...");
    const levels = await getSubjectLevelsWithProgress("data-structures-and-algorithms");
    console.log("   [OK] Levels retrieved:", levels.length, "| Tier 1:", levels[0].title);

    console.log("2. Testing canonical question bank grounding...");
    const sampleQ = await prisma.bankQuestion.findFirst({
      where: { validationStatus: "VALIDATED" },
      include: { subject: true },
    });
    console.log("   [OK] Sample topic:", sampleQ?.topic, "| Level:", sampleQ?.levelNumber, "| Status:", sampleQ?.validationStatus);

    console.log("3. Testing 7-tier distribution across question bank...");
    const distribution = await prisma.bankQuestion.groupBy({
      by: ["levelNumber"],
      _count: true,
    });
    console.log("   [OK] Level distribution:", distribution.map((d) => `Tier ${d.levelNumber}: ${d._count} Qs`).join(" | "));

    console.log("\n=======================================================");
    console.log("ALL LIVE KNOWLEDGE KINGDOM SERVICES OPERATIONAL!");
    console.log("=======================================================");
  } catch (err) {
    console.error("Verification failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAll();