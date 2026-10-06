import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  const allAchievements = await prisma.achievement.findMany({
    orderBy: { xpReward: "asc" },
  });

  let unlockedIds = new Set<string>();
  let unlockedAtMap = new Map<string, Date>();

  if (user) {
    const userAchs = await prisma.userAchievement.findMany({
      where: { userId: user.id },
    });
    userAchs.forEach((ua) => {
      unlockedIds.add(ua.achievementId);
      unlockedAtMap.set(ua.achievementId, ua.unlockedAt);
    });
  }

  const formatted = allAchievements.map((ach) => ({
    id: ach.id,
    code: ach.code,
    title: ach.title,
    description: ach.description,
    icon: ach.icon,
    xpReward: ach.xpReward,
    rarity: ach.rarity,
    isUnlocked: unlockedIds.has(ach.id),
    unlockedAt: unlockedAtMap.get(ach.id) || null,
  }));

  return NextResponse.json({ achievements: formatted });
}