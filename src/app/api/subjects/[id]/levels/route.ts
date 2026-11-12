import { NextResponse } from "next/server";
import { getSubjectLevelsWithProgress } from "@/lib/services/levelQuizService";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const levels = await getSubjectLevelsWithProgress(id, user?.id);

    return NextResponse.json({
      success: true,
      subjectSlug: id,
      levels,
    });
  } catch (error: any) {
    console.error("GET /api/subjects/[id]/levels error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load realm levels" },
      { status: 500 }
    );
  }
}