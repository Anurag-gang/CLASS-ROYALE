import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/provider";
import { toolEvaluateQuiz } from "@/lib/cr/cr-tools";
import { buildStudentContext } from "@/lib/ai/context";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { quizId, answers, question, studentAnswer, correctAnswer, rubric } = body;

    // Case 1: Evaluate whole quiz by ID
    if (quizId && answers) {
      const evaluation = await toolEvaluateQuiz(user.id, quizId, answers);
      return NextResponse.json({ success: true, evaluation });
    }

    // Case 2: Socratic rubric evaluation of an individual open-ended or code answer
    if (question && studentAnswer) {
      const provider = getAIProvider();
      const studentContext = await buildStudentContext(user.id);
      const evalResult = await provider.evaluateAnswer(
        {
          question,
          studentAnswer,
          correctAnswer: correctAnswer || "",
          rubric,
        },
        studentContext
      );

      return NextResponse.json({ success: true, evaluation: evalResult });
    }

    return NextResponse.json(
      { error: "Provide either { quizId, answers } or { question, studentAnswer, correctAnswer }" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[CR Quiz Evaluate API] Error:", error);
    return NextResponse.json(
      { error: "Evaluation failed: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
