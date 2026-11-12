import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requestQuizHint } from "@/lib/quiz/authoritativeQuizEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id?: string; attemptId?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login to access hints." },
        { status: 401 }
      );
    }

    const rawParams = await params;
    const attemptId = rawParams.id || rawParams.attemptId;

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: "Missing attempt ID in route parameters." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { questionId } = body;

    const hintData = await requestQuizHint({
      userId: user.id,
      sessionId: attemptId,
      questionId,
    });

    return NextResponse.json({
      success: true,
      questionId: hintData.questionId,
      hint: hintData.hint,
      secondsRemaining: hintData.secondsRemaining,
      hintsUsedCount: hintData.hintsUsedCount,
    });
  } catch (error: any) {
    console.error("POST /api/quiz/attempts/[id]/hint error:", error);
    const status = error.statusCode || 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to unlock hint." },
      { status }
    );
  }
}
