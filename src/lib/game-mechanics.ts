import { prisma } from "./db";

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  rank: string;
  totalXp: number;
}

// Configurable level requirements matching Class Royale RPG progression curve
export function getRequiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level === 2) return 500;
  if (level === 3) return 1200;
  if (level === 4) return 2000;
  if (level === 5) return 2800;
  // Smooth curve aligning Level 27 at ~9,400 XP
  return Math.floor(320 * (level - 1) + 6.8 * Math.pow(level - 1, 2) + 400);
}

export function getRankForLevel(level: number): string {
  if (level >= 45) return "Grandmaster";
  if (level >= 35) return "Archmage";
  if (level >= 25) return "Knowledge Knight";
  if (level >= 15) return "Code Paladin";
  if (level >= 6) return "Pixel Squire";
  return "Novice Apprentice";
}

export function calculateLevelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  while (getRequiredXpForLevel(level + 1) <= totalXp && level < 100) {
    level++;
  }

  const currentLevelFloor = getRequiredXpForLevel(level);
  const nextLevelCeiling = getRequiredXpForLevel(level + 1);
  const xpIntoCurrentLevel = Math.max(0, totalXp - currentLevelFloor);
  const xpNeededForNext = Math.max(1, nextLevelCeiling - currentLevelFloor);
  const progressPercent = Math.min(100, Math.floor((xpIntoCurrentLevel / xpNeededForNext) * 100));

  return {
    level,
    currentLevelXp: xpIntoCurrentLevel,
    nextLevelXp: xpNeededForNext,
    progressPercent,
    rank: getRankForLevel(level),
    totalXp,
  };
}

export async function awardUserXp(
  userId: string,
  amount: number,
  source: string,
  description: string
) {
  if (amount <= 0) return null;

  // 1. Record XP Transaction
  await prisma.xPTransaction.create({
    data: {
      userId,
      amount,
      source,
      description,
    },
  });

  // 2. Fetch current profile
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const newTotalXp = profile.xp + amount;
  const newLevelInfo = calculateLevelFromXp(newTotalXp);
  const leveledUp = newLevelInfo.level > profile.level;

  // 3. Update Profile
  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: {
      xp: newTotalXp,
      level: newLevelInfo.level,
      rank: newLevelInfo.rank,
    },
  });

  // 4. Check for newly eligible achievements
  const unlockedAchievements: string[] = [];

  // Check 5000 XP Knowledge Hoarder
  if (newTotalXp >= 5000) {
    const ach = await prisma.achievement.findUnique({ where: { code: "KNOWLEDGE_HOARDER" } });
    if (ach) {
      const existing = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: ach.id } },
      });
      if (!existing) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: ach.id },
        });
        unlockedAchievements.push(ach.title);
      }
    }
  }

  // Check Level 25 Grandmaster / Knowledge Knight
  if (newLevelInfo.level >= 25) {
    const ach = await prisma.achievement.findUnique({ where: { code: "GRANDMASTER" } });
    if (ach) {
      const existing = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: ach.id } },
      });
      if (!existing) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: ach.id },
        });
        unlockedAchievements.push(ach.title);
      }
    }
  }

  return {
    newTotalXp,
    amountAwarded: amount,
    newLevel: newLevelInfo.level,
    leveledUp,
    newRank: newLevelInfo.rank,
    unlockedAchievements,
    updatedProfile,
  };
}