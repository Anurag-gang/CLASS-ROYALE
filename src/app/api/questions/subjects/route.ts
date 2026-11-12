import { NextResponse } from "next/server";
import { getSubjectsWithStats } from "@/lib/services/questionService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subjects = await getSubjectsWithStats();
    return NextResponse.json({
      success: true,
      subjects,
      total_subjects: subjects.length,
      total_questions: subjects.reduce((acc, s) => acc + s.total_questions, 0),
      total_xp_claimable: subjects.reduce((acc, s) => acc + s.total_xp, 0),
    });
  } catch (error) {
    console.error("API /api/questions/subjects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch territory subjects" },
      { status: 500 }
    );
  }
}
