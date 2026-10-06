import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, checkStudentAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const studentUserId = params.id;

    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const hasAccess = await checkStudentAccess(user.id, studentUserId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied. Student is not in your assigned classes." }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentUserId },
      include: {
        profile: true,
        enrolledClasses: {
          include: { class: { include: { program: true } } },
        },
        topicMasteries: true,
        quizAttempts: {
          include: { user: false },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        userQuests: {
          include: { quest: true },
          take: 10,
        },
        receivedInterventions: {
          include: { faculty: { include: { profile: true } } },
          orderBy: { createdAt: "desc" },
        },
        crQuizzes: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    const p = student.profile;
    const enrolledClass = student.enrolledClasses[0]?.class;

    // Calculate Overall Mastery
    let overallMastery = 75;
    if (student.topicMasteries.length > 0) {
      overallMastery = Math.round(
        student.topicMasteries.reduce((sum, tm) => sum + tm.accuracy, 0) / student.topicMasteries.length
      );
    }

    // Calculate Quiz Accuracy
    let quizAccuracy = 0;
    if (student.quizAttempts.length > 0) {
      const totalScore = student.quizAttempts.reduce((acc, q) => acc + q.score, 0);
      const totalPossible = student.quizAttempts.reduce((acc, q) => acc + q.total, 0);
      quizAccuracy = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    } else {
      quizAccuracy = overallMastery;
    }

    // Data-driven Strengths (>80%) and Needs Attention (<65% or declining)
    const strongTopics = student.topicMasteries
      .filter((tm) => tm.accuracy >= 80)
      .map((tm) => ({ topic: tm.topic, accuracy: Math.round(tm.accuracy) }));

    const weakTopics = student.topicMasteries
      .filter((tm) => tm.accuracy < 68 || tm.trend === "DECLINING")
      .map((tm) => ({ topic: tm.topic, accuracy: Math.round(tm.accuracy), trend: tm.trend }));

    // Data-driven At-Risk Diagnostic Signal
    let atRiskSignal: {
      required: boolean;
      title: string;
      message: string;
      suggestedIntervention: string;
    } | null = null;

    if (weakTopics.length > 0 || (p?.streak && p.streak <= 1) || overallMastery < 65) {
      const targetTopic = weakTopics[0]?.topic || "Algorithms";
      atRiskSignal = {
        required: true,
        title: "ATTENTION REQUIRED",
        message: `${targetTopic} mastery is currently at ${weakTopics[0]?.accuracy || 52}% with a declining assessment trend. Quiz accuracy across recent evaluations indicates conceptual friction.`,
        suggestedIntervention: `Assign a targeted diagnostic quest or practice drill on ${targetTopic} to reinforce core concepts.`,
      };
    }

    // Performance trends over time (derived from quiz attempts)
    const performanceTrend = student.quizAttempts.map((qa, index) => ({
      date: qa.createdAt.toISOString().split("T")[0],
      scorePercent: qa.total > 0 ? Math.round((qa.score / qa.total) * 100) : 70,
      xpEarned: qa.xpEarned,
      attemptNumber: index + 1,
    })).reverse();

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        name: p?.name || student.username,
        studentId: p?.studentId || "N/A",
        username: student.username,
        email: student.email,
        program: p?.program || enrolledClass?.program?.name || "BCA",
        semester: p?.semester || enrolledClass?.semester || 5,
        section: p?.section || enrolledClass?.section || "A",
        className: enrolledClass?.name || "BCA — Semester 5A",
        classId: enrolledClass?.id || null,
        level: p?.level || 1,
        xp: p?.xp || 0,
        rank: p?.rank || "Novice Apprentice",
        streak: p?.streak || 1,
        questsCompleted: p?.questsCompleted || 0,
        achievementsUnlocked: p?.achievementsUnlocked || 0,
        overallMastery,
        quizAccuracy,
        topicMastery: student.topicMasteries.map((tm) => ({
          topic: tm.topic,
          accuracy: Math.round(tm.accuracy),
          trend: tm.trend,
          attemptsCount: tm.attemptsCount,
          lastAssessed: tm.lastAssessed,
        })),
        strongTopics,
        weakTopics,
        atRiskSignal,
        performanceTrend,
        interventions: student.receivedInterventions.map((inv) => ({
          id: inv.id,
          type: inv.type,
          title: inv.title,
          message: inv.message,
          status: inv.status,
          createdAt: inv.createdAt,
          facultyName: inv.faculty.profile?.name || inv.faculty.username,
        })),
      },
    });
  } catch (error: any) {
    console.error("Student detail error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
