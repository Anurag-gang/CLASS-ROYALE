import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toolEvaluateQuiz } from "@/lib/cr/cr-tools";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { answers } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Answers object is required" }, { status: 400 });
    }

    const evaluation = await toolEvaluateQuiz(user.id, params.id, answers);

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("[CR_QUIZ_EVALUATE_POST]", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
