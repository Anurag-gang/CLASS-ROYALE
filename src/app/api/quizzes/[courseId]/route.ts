import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;

  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseId }, { slug: courseId }],
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Never return correct answers in the GET payload to prevent client-side cheating!
  const sanitized = course.questions.map((q) => ({
    id: q.id,
    question: q.question,
    options: JSON.parse(q.optionsJson),
    order: q.order,
  }));

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      xpReward: course.xpReward,
    },
    questions: sanitized,
  });
}