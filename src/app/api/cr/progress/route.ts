import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/provider";
import { buildStudentContext } from "@/lib/ai/context";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const context = await buildStudentContext(user.id);
    const provider = getAIProvider();

    const analysis = await provider.analyzePerformance(context);

    return NextResponse.json({
      success: true,
      context,
      analysis,
    });
  } catch (error: any) {
    console.error("[CR Progress API] Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze student progress: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
