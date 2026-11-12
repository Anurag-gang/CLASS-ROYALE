/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Question Publish API
 * Target: src/app/api/faculty/questions/[id]/publish/route.ts
 *
 * POST - Transition question status from VALIDATED to PUBLISHED
 *        Makes question active and eligible for quiz engine level attempts
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFacultyOrAdminUser } from "@/lib/questions/facultyAuthHelper";
import { publishFacultyQuestion } from "@/lib/questions/facultyQuestionService";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const ipAddress =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const published = await publishFacultyQuestion(id, auth.user.id, ipAddress);

    return NextResponse.json({
      success: true,
      message: "Question successfully published and active in quiz level pools",
      question: published,
    });
  } catch (error: any) {
    console.error("API /api/faculty/questions/[id]/publish POST error:", error);
    const status = error.message?.includes("not found")
      ? 404
      : error.message?.includes("must be 'VALIDATED'")
      ? 400
      : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to publish question" },
      { status }
    );
  }
}
