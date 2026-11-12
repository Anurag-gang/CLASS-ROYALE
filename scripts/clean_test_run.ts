import { prisma } from "../src/lib/db";

async function clean() {
  await prisma.xPTransaction.deleteMany({ where: { source: "LEVEL_COMPLETE" } });
  await prisma.quizAttemptAnswer.deleteMany({});
  await prisma.quizSession.deleteMany({});
  await prisma.studentLevelProgress.deleteMany({ where: { levelNumber: { gt: 1 } } });
  await prisma.$disconnect();
  console.log("✔ Test artifacts cleaned, baseline restored.");
}

clean().catch(console.error);
