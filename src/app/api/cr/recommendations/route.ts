import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildStudentContext } from "@/lib/ai/context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const context = await buildStudentContext(user.id);

    const primaryWeak = context.weakTopics[0] || "Data Structures";
    const secondaryWeak = context.weakTopics[1] || "Algorithms";

    const recommendations = {
      recommendedNextQuest: {
        topic: primaryWeak,
        title: `Conquer ${primaryWeak}`,
        description: `Your mastery in ${primaryWeak} is currently in the danger zone. Engage with CR for diagnostic questions and step-by-step guidance.`,
        action: "QUIZ",
        prompt: `CR, quiz me on ${primaryWeak} so I can diagnose my weak points.`,
        potentialXp: 250,
      },
      revisionPacks: [
        {
          topic: primaryWeak,
          title: `${primaryWeak} Active Recall Pack`,
          prompt: `CR, generate an active recall revision flashcard vault for ${primaryWeak}.`,
        },
        {
          topic: secondaryWeak,
          title: `${secondaryWeak} Cheatsheet`,
          prompt: `CR, generate an active recall revision flashcard vault for ${secondaryWeak}.`,
        },
      ],
      studyPlanProposal: {
        topic: primaryWeak,
        prompt: `CR, generate a 7-day battle study plan to master ${primaryWeak} before exams.`,
      },
    };

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error: any) {
    console.error("[CR Recommendations API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
