/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Flagged Questions Review Queue API
 * Target: src/app/api/faculty/questions/flagged/route.ts
 *
 * GET - Retrieve all questions currently flagged as NEEDS_REVIEW with quarantine reasons
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFacultyOrAdminUser } from "@/lib/questions/facultyAuthHelper";
import { getFlaggedQuestions } from "@/lib/questions/facultyQuestionService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const result = await getFlaggedQuestions(page, limit);

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      quarantinedCount: result.pagination.total,
    });
  } catch (error: any) {
    console.error("API /api/faculty/questions/flagged GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve flagged questions queue" },
      { status: 500 }
    );
  }
}
