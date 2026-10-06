import { prisma } from "@/lib/db";
import { StudentLearningContext } from "./types";

/**
 * Builds lightweight, sanitized student learning context for AI tutoring
 */
export async function buildStudentContext(userId: string): Promise<StudentLearningContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      courseEnrollments: {
        include: { course: { select: { id: true, title: true } } },
        take: 5,
      },
      topicMasteries: {
        orderBy: { accuracy: "asc" },
        take: 10,
      },
      quizAttempts: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return {
      studentId: "guest",
      userId: "guest",
      username: "Player",
      name: "Guest Student",
      level: 1,
      xp: 0,
      rank: "Novice",
      streak: 1,
      averageAccuracy: 75,
      weakTopics: ["Data Structures"],
      strongTopics: ["Basics"],
      enrolledCourses: [],
      recentScores: [],
    };
  }

  const p = user.profile;
  const weakTopics = user.topicMasteries
    .filter((tm) => tm.accuracy < 68 || tm.trend === "DECLINING")
    .map((tm) => tm.topic);

  const strongTopics = user.topicMasteries
    .filter((tm) => tm.accuracy >= 80)
    .map((tm) => tm.topic);

  let averageAccuracy = 75;
  if (user.topicMasteries.length > 0) {
    averageAccuracy = Math.round(
      user.topicMasteries.reduce((sum, tm) => sum + tm.accuracy, 0) / user.topicMasteries.length
    );
  }

  const recentScores = user.quizAttempts.map((qa) => ({
    topic: "General Quiz",
    scorePercent: qa.total > 0 ? Math.round((qa.score / qa.total) * 100) : 70,
  }));

  const enrolledCourses = user.courseEnrollments.map((ce) => ({
    id: ce.course.id,
    title: ce.course.title,
  }));

  return {
    studentId: p?.studentId || user.id,
    userId: user.id,
    username: user.username,
    name: p?.name || user.username,
    level: p?.level || 1,
    xp: p?.xp || 0,
    rank: p?.rank || "Novice Apprentice",
    streak: p?.streak || 1,
    averageAccuracy,
    weakTopics: weakTopics.slice(0, 4),
    strongTopics: strongTopics.slice(0, 4),
    enrolledCourses,
    recentScores,
  };
}
