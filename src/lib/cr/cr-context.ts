import { prisma } from "../db";
import { calculateLevelFromXp } from "../game-mechanics";

export interface StudentLearningContext {
  user: {
    id: string;
    username: string;
    level: number;
    xp: number;
    rank: string;
    streak: number;
    avatar: string;
    title: string;
    levelInfo: ReturnType<typeof calculateLevelFromXp>;
  };
  progress: {
    completedLessonsCount: number;
    completedQuestsCount: number;
    totalQuizAttempts: number;
    averageQuizScorePercent: number;
    perfectQuizzesCount: number;
  };
  mastery: {
    topSubjects: { title: string; completedLessons: number; totalLessons: number; masteryPercent: number }[];
    weakTopics: string[];
    strongTopics: string[];
  };
  activeQuests: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    progress: number;
    targetCount: number;
  }[];
  recentActivity: {
    type: string;
    description: string;
    date: Date;
  }[];
  recommendedNextQuest: {
    topic: string;
    reason: string;
    actionType: "LESSON" | "QUIZ" | "PRACTICE";
    targetSlug?: string;
  };
}

export async function getStudentLearningContext(userId: string): Promise<StudentLearningContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      progress: {
        include: {
          lesson: {
            include: { course: { include: { subject: true } } },
          },
        },
      },
      quizAttempts: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      userQuests: {
        where: { completed: false },
        include: { quest: true },
        take: 3,
      },
      crQuizzes: {
        where: { isCompleted: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user || !user.profile) return null;

  const levelInfo = calculateLevelFromXp(user.profile.xp);
  const subjects = await prisma.subject.findMany({
    include: {
      courses: {
        include: { lessons: true },
      },
    },
  });

  // Calculate mastery per subject
  const completedLessonIds = new Set(user.progress.map((p) => p.lessonId));
  const topSubjects = subjects.map((sub) => {
    let totalLessons = 0;
    let completedLessons = 0;
    sub.courses.forEach((c) => {
      totalLessons += c.lessons.length;
      c.lessons.forEach((l) => {
        if (completedLessonIds.has(l.id)) completedLessons++;
      });
    });
    const masteryPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return {
      title: sub.title,
      completedLessons,
      totalLessons,
      masteryPercent,
    };
  });

  // Average quiz score
  const totalQuizAttempts = user.quizAttempts.length;
  let averageQuizScorePercent = 75;
  let perfectQuizzesCount = 0;

  if (totalQuizAttempts > 0) {
    let sumPercent = 0;
    user.quizAttempts.forEach((qa) => {
      if (qa.perfect) perfectQuizzesCount++;
      sumPercent += qa.total > 0 ? (qa.score / qa.total) * 100 : 0;
    });
    averageQuizScorePercent = Math.round(sumPercent / totalQuizAttempts);
  }

  // Derive weak topics from recent quizzes and CR quizzes
  const weakTopicsSet = new Set<string>();
  const strongTopicsSet = new Set<string>();

  user.crQuizzes.forEach((crq) => {
    if (crq.weakAreasJson) {
      try {
        const parsed = JSON.parse(crq.weakAreasJson);
        if (Array.isArray(parsed)) parsed.forEach((t) => weakTopicsSet.add(t));
      } catch {}
    }
    if (crq.accuracy >= 80) {
      strongTopicsSet.add(crq.topic);
    }
  });

  // Default weak topics fallback if new player
  if (weakTopicsSet.size === 0) {
    if (averageQuizScorePercent < 80) {
      weakTopicsSet.add("Recursion & Tree Balancing");
      weakTopicsSet.add("Dynamic Programming");
    } else {
      weakTopicsSet.add("Graph Cycle Detection");
    }
  }

  if (strongTopicsSet.size === 0) {
    strongTopicsSet.add("Binary Search Arrays");
    strongTopicsSet.add("Propositional Logic");
  }

  const weakTopics = Array.from(weakTopicsSet);
  const strongTopics = Array.from(strongTopicsSet);

  // Active user quests
  const activeQuests = user.userQuests.map((uq) => ({
    id: uq.quest.id,
    title: uq.quest.title,
    description: uq.quest.description,
    xpReward: uq.quest.xpReward,
    progress: uq.progress,
    targetCount: uq.quest.targetCount,
  }));

  // Recommended next quest
  const primaryWeak = weakTopics[0] || "Data Structures";
  const recommendedNextQuest = {
    topic: primaryWeak,
    reason: `Accuracy in ${primaryWeak} has room for mastery. A targeted battle or lesson will unlock level-up XP.`,
    actionType: "QUIZ" as const,
    targetSlug: "data-structures-101",
  };

  return {
    user: {
      id: user.id,
      username: user.username,
      level: user.profile.level,
      xp: user.profile.xp,
      rank: user.profile.rank,
      streak: user.profile.streak,
      avatar: user.profile.avatar,
      title: user.profile.title,
      levelInfo,
    },
    progress: {
      completedLessonsCount: user.progress.length,
      completedQuestsCount: user.profile.questsCompleted,
      totalQuizAttempts,
      averageQuizScorePercent,
      perfectQuizzesCount,
    },
    mastery: {
      topSubjects,
      weakTopics,
      strongTopics,
    },
    activeQuests,
    recentActivity: user.quizAttempts.slice(0, 3).map((qa) => ({
      type: "QUIZ_ATTEMPT",
      description: `Scored ${qa.score}/${qa.total} (${Math.round((qa.score / (qa.total || 1)) * 100)}%)`,
      date: qa.createdAt,
    })),
    recommendedNextQuest,
  };
}