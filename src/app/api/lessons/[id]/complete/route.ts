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

  const lesson = await prisma.lesson.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Check if already completed
  const existing = await prisma.userProgress.findUnique({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json({
      message: "Lesson already completed previously",
      alreadyCompleted: true,
      xpEarned: 0,
    });
  }

  // Record progress
  await prisma.userProgress.create({
    data: {
      userId: user.id,
      lessonId: lesson.id,
      completed: true,
    },
  });

  // Calculate server-side XP (+100 XP base reward)
  const xpReward = lesson.xpReward || 100;
  const xpResult = await awardUserXp(
    user.id,
    xpReward,
    "LESSON_COMPLETE",
    `Completed lesson: ${lesson.title}`
  );

  // Update Quests progress for requirement = "COMPLETE_LESSON"
  const userQuests = await prisma.userQuest.findMany({
    where: {
      userId: user.id,
      completed: false,
      quest: { requirement: "COMPLETE_LESSON" },
    },
    include: { quest: true },
  });

  for (const uq of userQuests) {
    const newProgress = uq.progress + 1;
    const isFinished = newProgress >= uq.quest.targetCount;
    await prisma.userQuest.update({
      where: { id: uq.id },
      data: {
        progress: newProgress,
        completed: isFinished,
        completedAt: isFinished ? new Date() : null,
      },
    });
  }

  // Check first quest achievement
  const firstQuestAch = await prisma.achievement.findUnique({ where: { code: "FIRST_QUEST" } });
  if (firstQuestAch) {
    const hasAch = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId: user.id, achievementId: firstQuestAch.id } },
    });
    if (!hasAch) {
      await prisma.userAchievement.create({
        data: { userId: user.id, achievementId: firstQuestAch.id },
      });
      if (xpResult) {
        xpResult.unlockedAchievements.push(firstQuestAch.title);
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: `Quest Cleared! +${xpReward} XP Awarded`,
    xpEarned: xpReward,
    xpResult,
  });
}