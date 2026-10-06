import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get("metric") || "mastery"; // mastery, accuracy, completion, improvement

    // Fetch students with their topic masteries and quiz attempts
    const users = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: true,
        topicMasteries: true,
        quizAttempts: true,
      },
    });

    const students = users.map((u) => {
      const masteries = u.topicMasteries || [];
      const attempts = u.quizAttempts || [];

      // Average Mastery %
      const avgMastery = masteries.length > 0
        ? Math.round(masteries.reduce((sum, t) => sum + t.accuracy, 0) / masteries.length)
        : u.profile?.level ? Math.min(96, u.profile.level * 4 + 10) : 72;

      // Accuracy % across all attempts
      const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
      const totalQuestions = attempts.reduce((sum, a) => sum + a.total, 0);
      const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 84;

      // Quiz Completion Count
      const quizzesCompleted = attempts.length + (u.profile?.questsCompleted || 5);

      // Improvement Trend metric (percentage of topics with IMPROVING trend)
      const improvingCount = masteries.filter((t) => t.trend === "IMPROVING").length;
      const improvementRate = masteries.length > 0 ? Math.round((improvingCount / masteries.length) * 100) : 60;

      return {
        userId: u.id,
        username: u.username,
        name: u.profile?.name || u.username,
        department: u.profile?.department || "Computer Science",
        mastery: avgMastery,
        accuracy,
        quizzesCompleted,
        improvementRate,
        isCurrentUser: user ? user.id === u.id : false,
      };
    });

    // Sort by requested academic metric
    if (metric === "accuracy") {
      students.sort((a, b) => b.accuracy - a.accuracy || b.mastery - a.mastery);
    } else if (metric === "completion") {
      students.sort((a, b) => b.quizzesCompleted - a.quizzesCompleted);
    } else if (metric === "improvement") {
      students.sort((a, b) => b.improvementRate - a.improvementRate || b.mastery - a.mastery);
    } else {
      // Default: Mastery %
      students.sort((a, b) => b.mastery - a.mastery || b.accuracy - a.accuracy);
    }

    const ranked = students.map((s, idx) => ({
      ...s,
      rank: idx + 1,
    }));

    return NextResponse.json({
      leaderboard: ranked,
      activeMetric: metric,
    });
  } catch (error) {
    console.error("Leaderboard GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}