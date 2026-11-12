import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { startQuizAttempt } from "@/lib/quiz/authoritativeQuizEngine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to enter quiz attempt." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { realmSlug, subjectSlug, levelNumber, forceNew } = body;

    if (typeof levelNumber !== "number") {
      return NextResponse.json(
        { success: false, error: "levelNumber must be an integer between 1 and 7." },
        { status: 400 }
      );
    }

    const result = await startQuizAttempt({
      userId: user.id,
      realmSlug,
      subjectSlug,
      levelNumber,
      forceNew: Boolean(forceNew),
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/quiz/attempts/start error:", error);
    const status = error.statusCode || 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to start quiz attempt." },
      { status }
    );
  }
}
