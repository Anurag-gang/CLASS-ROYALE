import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const classLinks = await prisma.classFaculty.findMany({
      where: user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? {} : { facultyId: user.id },
      include: {
        class: {
          include: {
            program: true,
            department: true,
            academicTerm: true,
            _count: {
              select: {
                members: true,
                courses: true,
                quizzes: true,
              },
            },
          },
        },
      },
      orderBy: { class: { createdAt: "desc" } },
    });

    const classes = classLinks.map((cl) => ({
      id: cl.class.id,
      name: cl.class.name,
      code: cl.class.code,
      department: cl.class.department?.name || "Computer Applications",
      program: cl.class.program?.name || "BCA",
      semester: cl.class.semester,
      section: cl.class.section,
      term: cl.class.academicTerm?.name || "Fall 2026-27",
      studentCount: cl.class._count.members,
      coursesCount: cl.class._count.courses,
      quizzesCount: cl.class._count.quizzes,
    }));

    // Also get departments and programs for class creation dialog
    const departments = await prisma.department.findMany({
      include: { programs: true },
    });

    return NextResponse.json({
      success: true,
      classes,
      departments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, departmentId, programId, semester = 1, section = "A" } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Class Name and Code are required" }, { status: 400 });
    }

    const existing = await prisma.class.findUnique({
      where: { code },
    });
    if (existing) {
      return NextResponse.json({ error: "A class with this code already exists" }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        code,
        departmentId: departmentId || null,
        programId: programId || null,
        semester: Number(semester),
        section,
        faculty: {
          create: {
            facultyId: user.id,
            role: "PRIMARY_INSTRUCTOR",
          },
        },
      },
      include: {
        department: true,
        program: true,
      },
    });

    await recordAuditLog({
      actorId: user.id,
      action: "CLASS_CREATED",
      targetType: "Class",
      targetId: newClass.id,
      metadata: { name: newClass.name, code: newClass.code },
    });

    return NextResponse.json({
      success: true,
      message: "Class successfully created",
      class: newClass,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
