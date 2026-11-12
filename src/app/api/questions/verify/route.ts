import { NextResponse } from "next/server";
import { verifyAnswer } from "@/lib/services/questionService";
import { getCurrentUser } from "@/lib/auth";
import { awardUserXp } from "@/lib/game-mechanics";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { questionId, selectedOptionId, comboStreak = 1 } = body;

    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "Missing questionId or selectedOptionId" },
        { status: 400 }
      );
    }

    const verification = await verifyAnswer(questionId, selectedOptionId, comboStreak);

    // If student is logged in and answer is correct, award XP
    let userXpProfile = null;
    if (verification.isCorrect && verification.xpEarned > 0) {
      const user = await getCurrentUser();
      if (user) {
        userXpProfile = await awardUserXp(
          user.id,
          verification.xpEarned,
          "ARENA_TRIAL",
          `Conquered Arena Question (${verification.xpEarned} XP earned with ${verification.streakMultiplier}x combo)`
        );
      }
    }

    return NextResponse.json({
      success: true,
      result: verification,
      user_xp: userXpProfile,
    });
  } catch (error: any) {
    console.error("API /api/questions/verify error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify question" },
      { status: 500 }
    );
  }
}
