import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CR_TOOLS_REGISTRY } from "@/lib/ai/tools";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      topic = "Computer Science Fundamentals",
      difficulty = 3,
      questionCount = 5,
    } = body;

    const quizData = await CR_TOOLS_REGISTRY.generate_quiz.execute(user.id, {
      topic,
      difficulty: Number(difficulty) || 3,
      questionCount: Number(questionCount) || 5,
    });

    return NextResponse.json({
      success: true,
      quiz: quizData,
    });
  } catch (error: any) {
    console.error("[CR Quiz Generate API] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
