import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  const allQuests = await prisma.quest.findMany({
    orderBy: { isDaily: "desc" },
  });

  let userQuestsMap: Record<string, { progress: number; completed: boolean; claimed: boolean }> = {};

  if (user) {
    const userQuests = await prisma.userQuest.findMany({
      where: { userId: user.id },
    });
    userQuests.forEach((uq) => {
      userQuestsMap[uq.questId] = {
        progress: uq.progress,
        completed: uq.completed,
        claimed: !!uq.completedAt,
      };
    });
  }

  const formatted = allQuests.map((q) => {
    const userStatus = userQuestsMap[q.id] || {
      progress: 0,
      completed: false,
      claimed: false,
    };
    return {
      id: q.id,
      title: q.title,
      description: q.description,
      xpReward: q.xpReward,
      difficulty: q.difficulty,
      durationMin: q.durationMin,
      category: q.category,
      isDaily: q.isDaily,
      targetCount: q.targetCount,
      userProgress: userStatus.progress,
      isCompleted: userStatus.completed,
      isClaimed: userStatus.claimed,
      canClaim: userStatus.completed && !userStatus.claimed,
    };
  });

  return NextResponse.json({ quests: formatted });
}