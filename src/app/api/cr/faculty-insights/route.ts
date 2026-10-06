import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalStudents = await prisma.user.count();
    const totalQuizzes = await prisma.cRQuiz.count();
    const completedQuizzes = await prisma.cRQuiz.findMany({
      where: { isCompleted: true },
      select: {
        accuracy: true,
        topic: true,
        weakAreasJson: true,
      },
    });

    const averageAccuracy =
      completedQuizzes.length > 0
        ? Math.round(
            completedQuizzes.reduce((acc, q) => acc + (q.accuracy || 0), 0) /
              completedQuizzes.length
          )
        : 0;

    const topicStruggles: Record<string, number> = {};
    for (const q of completedQuizzes) {
      if (q.weakAreasJson) {
        try {
          const areas: string[] = JSON.parse(q.weakAreasJson);
          for (const area of areas) {
            topicStruggles[area] = (topicStruggles[area] || 0) + 1;
          }
        } catch {}
      }
    }

    const topStruggles = Object.entries(topicStruggles)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalPlans = await prisma.cRStudyPlan.count();
    const totalRevisionPacks = await prisma.cRRevisionPack.count();

    return NextResponse.json({
      insights: {
        totalStudents,
        totalQuizzesConducted: totalQuizzes,
        averageAccuracy,
        topStruggles,
        totalPlansGenerated: totalPlans,
        totalRevisionPacksGenerated: totalRevisionPacks,
        pedagogicalRecommendation:
          topStruggles.length > 0
            ? `Cohort exhibits recurrent misconceptions in "${topStruggles[0].topic}". Recommend dedicating a lecture or review workshop.`
            : "Cohort metrics are healthy and progressing on schedule.",
      },
    });
  } catch (error) {
    console.error("[CR_FACULTY_INSIGHTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
