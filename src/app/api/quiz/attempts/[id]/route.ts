import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveQuizAttempt } from "@/lib/quiz/authoritativeQuizEngine";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string; attemptId?: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const attemptId = rawParams.id || rawParams.attemptId;

    if (!attemptId) {
      return NextResponse.json(
        { success: false, error: "Missing attemptId in route params." },
        { status: 400 }
      );
    }

    const session = await getActiveQuizAttempt(attemptId, user.id);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("GET /api/quiz/attempts/[id] error:", error);
    const status = error.statusCode || 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attempt details." },
      { status }
    );
  }
}
