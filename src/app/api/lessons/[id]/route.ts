import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const lesson = await prisma.lesson.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      course: {
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true, slug: true, title: true, order: true },
          },
        },
      },
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  let isCompleted = false;
  if (user) {
    const prog = await prisma.userProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
    });
    isCompleted = !!prog;
  }

  // Find prev / next lesson
  const allLessons = lesson.course.lessons;
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      xpReward: lesson.xpReward,
      course: {
        id: lesson.course.id,
        slug: lesson.course.slug,
        title: lesson.course.title,
      },
      completed: isCompleted,
      prevLesson,
      nextLesson,
    },
  });
}