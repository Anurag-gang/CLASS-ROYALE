import { NextResponse } from "next/server";
import { startLevelAttempt } from "@/lib/services/levelQuizService";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login to enter the Level Trials." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subjectSlug, levelNumber } = body;

    if (!subjectSlug || typeof levelNumber !== "number") {
      return NextResponse.json(
        { success: false, error: "Missing subjectSlug or levelNumber" },
        { status: 400 }
      );
    }

    const session = await startLevelAttempt({
      userId: user.id,
      subjectSlug,
      levelNumber,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("POST /api/quiz/attempts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start level trial" },
      { status: 400 }
    );
  }
}
