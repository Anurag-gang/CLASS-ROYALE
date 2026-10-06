import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toolCreateQuiz } from "@/lib/cr/cr-tools";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const quizzes = await prisma.cRQuiz.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("[CR_QUIZ_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { topic = "Data Structures", difficulty = "ADAPTIVE", count = 5 } = body;

    const quiz = await toolCreateQuiz(user.id, topic, difficulty, count);

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("[CR_QUIZ_POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
