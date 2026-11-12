import { NextResponse } from "next/server";
import { getQuestionsBySubject, createQuestion } from "@/lib/services/questionService";
import { getCurrentUser } from "@/lib/auth";
import { DifficultyLevel, CreateQuestionPayload } from "@/types/quiz";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subjectSlug = searchParams.get("subject") || searchParams.get("slug") || "data-structures-and-algorithms";
    const difficulty = (searchParams.get("difficulty") as DifficultyLevel | "ALL") || "ALL";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const questions = await getQuestionsBySubject(subjectSlug, difficulty, limit, false);

    return NextResponse.json({
      success: true,
      subject_slug: subjectSlug,
      difficulty,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("API /api/questions GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch question bank" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    // Strict Role Authorization: Only authenticated FACULTY, ADMIN, or SUPER_ADMIN users can register questions
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const ALLOWED_ROLES = ["FACULTY", "ADMIN", "SUPER_ADMIN"];
    const isAuthorized = ALLOWED_ROLES.includes(user.role);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Faculty or Admin permissions required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.subject_id || !body.question_text || !body.options || !body.correct_option_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: subject_id, question_text, options, correct_option_id" },
        { status: 400 }
      );
    }

    const payload: CreateQuestionPayload = {
      subject_id: body.subject_id,
      question_text: body.question_text,
      code_snippet: body.code_snippet,
      options: body.options,
      correct_option_id: body.correct_option_id,
      difficulty: body.difficulty || "Medium",
      xp_reward: body.xp_reward,
      time_limit_seconds: body.time_limit_seconds,
      explanation: body.explanation || "No explanation provided.",
      tags: body.tags || [],
    };

    const newQuestion = await createQuestion(payload);

    return NextResponse.json({
      success: true,
      message: "Question successfully registered in the Question Bank",
      question: newQuestion,
    });
  } catch (error) {
    console.error("API /api/questions POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create question" },
      { status: 500 }
    );
  }
}
