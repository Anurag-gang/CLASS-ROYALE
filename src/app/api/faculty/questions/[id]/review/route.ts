/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Question Review Decision API
 * Target: src/app/api/faculty/questions/[id]/review/route.ts
 *
 * POST - Review decision on a flagged/draft question
 *        Transitions to VALIDATED (approved) or DRAFT (changes requested)
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFacultyOrAdminUser } from "@/lib/questions/facultyAuthHelper";
import { reviewFacultyQuestion } from "@/lib/questions/facultyQuestionService";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();

    const decision: "APPROVE" | "REJECT" =
      body.decision === "APPROVE" || body.decision === "VALIDATE"
        ? "APPROVE"
        : body.decision === "REJECT" || body.decision === "REQUEST_CHANGES"
        ? "REJECT"
        : (null as any);

    if (!decision) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid decision. Must be 'APPROVE' (transitions to VALIDATED) or 'REJECT' (returns to DRAFT)",
        },
        { status: 400 }
      );
    }

    const reviewNotes = body.reviewNotes || body.notes || body.reason || "";
    const ipAddress =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const updated = await reviewFacultyQuestion(
      id,
      decision,
      reviewNotes,
      auth.user.id,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      message: `Question review recorded: ${
        decision === "APPROVE" ? "VALIDATED" : "Returned to DRAFT"
      }`,
      decision,
      reviewNotes,
      question: updated,
    });
  } catch (error: any) {
    console.error("API /api/faculty/questions/[id]/review POST error:", error);
    const status = error.message?.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process question review" },
      { status }
    );
  }
}
