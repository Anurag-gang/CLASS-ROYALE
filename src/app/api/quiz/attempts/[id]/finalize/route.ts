import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { finalizeQuizAttempt } from "@/lib/quiz/authoritativeQuizEngine";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id?: string; attemptId?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login to finalize attempt." },
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

    const result = await finalizeQuizAttempt({
      userId: user.id,
      sessionId: attemptId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/quiz/attempts/[id]/finalize error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to finalize quiz attempt." },
      { status }
    );
  }
}
