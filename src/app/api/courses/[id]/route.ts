import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      subject: true,
      lessons: {
        orderBy: { order: "asc" },
      },
      questions: {
        select: { id: true },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let completedLessonIds: Set<string> = new Set();
  if (user) {
    const progress = await prisma.userProgress.findMany({
      where: {
        userId: user.id,
        lessonId: { in: course.lessons.map((l) => l.id) },
      },
      select: { lessonId: true },
    });
    completedLessonIds = new Set(progress.map((p) => p.lessonId));
  }

  const lessonsWithStatus = course.lessons.map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    xpReward: lesson.xpReward,
    order: lesson.order,
    completed: completedLessonIds.has(lesson.id),
  }));

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      xpReward: course.xpReward,
      subject: course.subject,
      totalQuestions: course.questions.length,
      lessons: lessonsWithStatus,
    },
  });
}