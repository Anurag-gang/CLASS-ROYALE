import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardUserXp } from "@/lib/game-mechanics";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseId }, { slug: courseId }],
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const body = await req.json();
  const { answers } = body; // Record<questionId, selectedOptionIndex>

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
  }

  let correctCount = 0;
  const questionResults = course.questions.map((q) => {
    const selected = answers[q.id];
    const isCorrect = selected === q.answerIndex;
    if (isCorrect) correctCount++;
    return {
      id: q.id,
      question: q.question,
      selectedAnswer: selected,
      correctAnswer: q.answerIndex,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const total = course.questions.length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const isPerfect = correctCount === total && total > 0;
  const passed = scorePercent >= 60;

  // Server-side XP calculation:
  // Base quiz completion: +150 XP
  // Perfect score bonus: +100 XP
  let xpAwarded = 0;
  if (passed) {
    xpAwarded = 150;
    if (isPerfect) {
      xpAwarded += 100;
    }
  }

  // Record QuizAttempt
  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      courseId: course.id,
      score: correctCount,
      total,
      perfect: isPerfect,
      xpEarned: xpAwarded,
    },
  });

  let xpResult = null;
  if (xpAwarded > 0) {
    xpResult = await awardUserXp(
      user.id,
      xpAwarded,
      "QUIZ_COMPLETE",
      `Battle Conquered: ${course.title} (${correctCount}/${total} correct)`
    );
  }

  // Check achievements:
  // 1. BOSS_DEFEATED (100% score)
  if (isPerfect) {
    const bossAch = await prisma.achievement.findUnique({ where: { code: "BOSS_DEFEATED" } });
    if (bossAch) {
      const existing = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId: user.id, achievementId: bossAch.id } },
      });
      if (!existing) {
        await prisma.userAchievement.create({
          data: { userId: user.id, achievementId: bossAch.id },
        });
        if (xpResult) xpResult.unlockedAchievements.push(bossAch.title);
      }
    }
  }

  // 2. PERFECT_RUN (Flawless victory)
  if (isPerfect && total >= 5) {
    const perfAch = await prisma.achievement.findUnique({ where: { code: "PERFECT_RUN" } });
    if (perfAch) {
      const existing = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId: user.id, achievementId: perfAch.id } },
      });
      if (!existing) {
        await prisma.userAchievement.create({
          data: { userId: user.id, achievementId: perfAch.id },
        });
        if (xpResult) xpResult.unlockedAchievements.push(perfAch.title);
      }
    }
  }

  // Advance user quests
  if (isPerfect) {
    const perfQuests = await prisma.userQuest.findMany({
      where: {
        userId: user.id,
        completed: false,
        quest: { requirement: "PERFECT_QUIZ" },
      },
      include: { quest: true },
    });
    for (const pq of perfQuests) {
      await prisma.userQuest.update({
        where: { id: pq.id },
        data: {
          progress: pq.progress + 1,
          completed: pq.progress + 1 >= pq.quest.targetCount,
          completedAt: pq.progress + 1 >= pq.quest.targetCount ? new Date() : null,
        },
      });
    }
  }

  // Update or create TopicMastery for this topic
  const topicName = course.title;
  let previousMastery = 68;
  let updatedMastery = scorePercent;

  const existingMastery = await prisma.topicMastery.findFirst({
    where: {
      studentId: user.id,
      topic: { contains: topicName.slice(0, 10) },
    },
  });

  if (existingMastery) {
    previousMastery = Math.round(existingMastery.accuracy);
    updatedMastery = Math.round(
      (existingMastery.accuracy * existingMastery.attemptsCount + scorePercent) /
        (existingMastery.attemptsCount + 1)
    );
    await prisma.topicMastery.update({
      where: { id: existingMastery.id },
      data: {
        accuracy: updatedMastery,
        attemptsCount: existingMastery.attemptsCount + 1,
        trend: updatedMastery >= existingMastery.accuracy ? "IMPROVING" : "DECLINING",
        lastAssessed: new Date(),
      },
    });
  } else {
    await prisma.topicMastery.create({
      data: {
        studentId: user.id,
        topic: topicName,
        accuracy: scorePercent,
        attemptsCount: 1,
        trend: "STABLE",
      },
    });
  }

  return NextResponse.json({
    success: true,
    score: correctCount,
    total,
    scorePercent,
    isPerfect,
    passed,
    previousMastery,
    updatedMastery,
    results: questionResults,
  });
}