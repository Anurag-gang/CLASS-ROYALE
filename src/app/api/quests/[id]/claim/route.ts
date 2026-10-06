import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardUserXp } from "@/lib/game-mechanics";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const quest = await prisma.quest.findUnique({
    where: { id },
  });

  if (!quest) {
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });
  }

  const userQuest = await prisma.userQuest.findUnique({
    where: {
      userId_questId: {
        userId: user.id,
        questId: id,
      },
    },
  });

  if (!userQuest || !userQuest.completed) {
    return NextResponse.json({ error: "Quest is not completed yet" }, { status: 400 });
  }

  if (userQuest.completedAt) {
    return NextResponse.json({ error: "Quest reward already claimed" }, { status: 400 });
  }

  // Mark claimed
  await prisma.userQuest.update({
    where: { id: userQuest.id },
    data: { completedAt: new Date() },
  });

  // Increment questsCompleted counter
  await prisma.profile.update({
    where: { userId: user.id },
    data: { questsCompleted: { increment: 1 } },
  });

  // Award Server-calculated XP (+500 XP)
  const xpReward = quest.xpReward || 500;
  const xpResult = await awardUserXp(
    user.id,
    xpReward,
    "QUEST_CLAIM",
    `Claimed reward for quest: ${quest.title}`
  );

  return NextResponse.json({
    success: true,
    message: `Quest reward claimed! +${xpReward} XP awarded.`,
    xpEarned: xpReward,
    xpResult,
  });
}