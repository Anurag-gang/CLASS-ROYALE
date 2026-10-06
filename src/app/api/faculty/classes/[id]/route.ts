import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, checkClassAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const classId = params.id;

    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hasAccess = await checkClassAccess(user.id, classId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You do not teach or have access to this class." }, { status: 403 });
    }

    const classRecord = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        department: true,
        program: true,
        academicTerm: true,
        courses: {
          include: {
            course: {
              include: {
                _count: { select: { lessons: true, questions: true } },
              },
            },
          },
        },
        members: {
          include: {
            student: {
              include: {
                profile: true,
                topicMasteries: true,
                quizAttempts: {
                  orderBy: { createdAt: "desc" },
                  take: 5,
                },
              },
            },
          },
          orderBy: { student: { username: "asc" } },
        },
        quizzes: {
          orderBy: { assignedAt: "desc" },
        },
        interventions: {
          include: {
            student: { include: { profile: true } },
            faculty: { include: { profile: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Map students with diagnostic analytics
    const students = classRecord.members.map((m) => {
      const s = m.student;
      const p = s.profile;

      let overallMastery = 75;
      if (s.topicMasteries.length > 0) {
        overallMastery = Math.round(
          s.topicMasteries.reduce((sum, tm) => sum + tm.accuracy, 0) / s.topicMasteries.length
        );
      }

      let quizAccuracy = 0;
      if (s.quizAttempts.length > 0) {
        const totalScore = s.quizAttempts.reduce((acc, q) => acc + q.score, 0);
        const totalPossible = s.quizAttempts.reduce((acc, q) => acc + q.total, 0);
        quizAccuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
      }

      // Determine activity and risk flag
      const decliningTopics = s.topicMasteries.filter((tm) => tm.trend === "DECLINING" || tm.accuracy < 60);
      const isAtRisk = decliningTopics.length > 0 || overallMastery < 60;
      const activityStatus = isAtRisk
        ? "AT_RISK"
        : overallMastery >= 85
        ? "HIGH"
        : overallMastery >= 70
        ? "MEDIUM"
        : "LOW";

      return {
        id: s.id,
        studentId: p?.studentId || "N/A",
        name: p?.name || s.username,
        username: s.username,
        email: s.email,
        level: p?.level || 1,
        xp: p?.xp || 0,
        rank: p?.rank || "Novice Apprentice",
        streak: p?.streak || 1,
        questsCompleted: p?.questsCompleted || 0,
        overallMastery,
        quizAccuracy: quizAccuracy || overallMastery,
        activityStatus,
        isAtRisk,
        weakTopic: decliningTopics[0]?.topic || null,
        joinedAt: m.joinedAt,
      };
    });

    // Topic mastery aggregate for this class
    const topicAverages: Record<string, { total: number; count: number }> = {};
    classRecord.members.forEach((m) => {
      m.student.topicMasteries.forEach((tm) => {
        if (!topicAverages[tm.topic]) {
          topicAverages[tm.topic] = { total: 0, count: 0 };
        }
        topicAverages[tm.topic].total += tm.accuracy;
        topicAverages[tm.topic].count += 1;
      });
    });

    const topicMasteryList = Object.entries(topicAverages).map(([topic, data]) => ({
      topic,
      averageAccuracy: Math.round(data.total / (data.count || 1)),
      studentsCount: data.count,
    }));

    return NextResponse.json({
      success: true,
      class: {
        id: classRecord.id,
        name: classRecord.name,
        code: classRecord.code,
        department: classRecord.department?.name || "Computer Applications",
        program: classRecord.program?.name || "BCA",
        semester: classRecord.semester,
        section: classRecord.section,
        term: classRecord.academicTerm?.name || "Fall 2026-27",
        studentsCount: students.length,
        courses: classRecord.courses.map((cc) => ({
          id: cc.course.id,
          title: cc.course.title,
          slug: cc.course.slug,
          difficulty: cc.course.difficulty,
          xpReward: cc.course.xpReward,
          lessonsCount: cc.course._count.lessons,
        })),
        quizzes: classRecord.quizzes,
        interventions: classRecord.interventions,
        topicMasteryList,
      },
      students,
    });
  } catch (error: any) {
    console.error("Class detail API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
