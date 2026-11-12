import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { submitQuizAnswer } from "@/lib/quiz/authoritativeQuizEngine";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id?: string; attemptId?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to submit quiz answers." },
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

    // Normalize option IDs
    let selectedOptionIds: string[] = [];
    if (Array.isArray(body.selectedOptionIds)) {
      selectedOptionIds = body.selectedOptionIds.map((s: any) => String(s).trim());
    } else if (body.selectedOptionId) {
      selectedOptionIds = [String(body.selectedOptionId).trim()];
    }

    if (selectedOptionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid submission: at least one option must be selected." },
        { status: 400 }
      );
    }

    // Resolve question index (supports canonical questionIndex and legacy questionId lookup)
    let questionIndex: number | undefined = body.questionIndex;
    if (typeof questionIndex !== "number" && body.questionId) {
      const session = await prisma.quizSession.findUnique({
        where: { id: attemptId },
        select: { questionIdsJson: true },
      });
      if (session) {
        const questionIds: string[] = JSON.parse(session.questionIdsJson || "[]");
        const foundIdx = questionIds.indexOf(body.questionId);
        if (foundIdx !== -1) {
          questionIndex = foundIdx;
        }
      }
    }

    if (typeof questionIndex !== "number") {
      questionIndex = 0;
    }

    const evaluation = await submitQuizAnswer({
      userId: user.id,
      sessionId: attemptId,
      sessionToken: body.sessionToken,
      questionIndex,
      selectedOptionIds,
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      ...evaluation,
      result: evaluation, // Backward compatibility alias for UI components
    });
  } catch (error: any) {
    console.error("POST /api/quiz/attempts/[id]/answer error:", error);
    const status = error.statusCode || 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate answer." },
      { status }
    );
  }
}
