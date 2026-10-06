import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, checkStudentAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { studentId, type, title, message, classId } = body;

    if (!studentId || !type || !title) {
      return NextResponse.json({ error: "studentId, type, and title are required" }, { status: 400 });
    }

    const hasAccess = await checkStudentAccess(user.id, studentId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to target student" }, { status: 403 });
    }

    const intervention = await prisma.studentIntervention.create({
      data: {
        facultyId: user.id,
        studentId,
        classId: classId || null,
        type, // ASSIGN_QUEST, ASSIGN_QUIZ, SEND_RECOMMENDATION
        title,
        message: message || "Targeted pedagogical intervention assigned by faculty.",
        status: "PENDING",
      },
    });

    await recordAuditLog({
      actorId: user.id,
      action: "FACULTY_INTERVENTION_ASSIGNED",
      targetType: "StudentIntervention",
      targetId: intervention.id,
      metadata: { studentId, type, title },
    });

    return NextResponse.json({
      success: true,
      message: "Intervention successfully dispatched to student",
      intervention,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
