import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/provider";
import { buildStudentContext } from "@/lib/ai/context";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { topic = "Computer Science", query = "Explain the core concept step-by-step" } = body;

    const provider = getAIProvider();
    const context = await buildStudentContext(user.id);

    const explanation = await provider.generateExplanation(topic, query, context);

    return NextResponse.json({
      success: true,
      topic,
      explanation,
    });
  } catch (error: any) {
    console.error("[CR Explain API] Error:", error);
    return NextResponse.json(
      { error: "Explanation generation failed: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
