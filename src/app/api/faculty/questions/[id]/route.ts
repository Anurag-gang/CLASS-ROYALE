/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Faculty Question Detail API (Read, Update, Archive)
 * Target: src/app/api/faculty/questions/[id]/route.ts
 *
 * GET    - Retrieve question detail with complete QuestionAuditLog history
 * PUT    - Update question, increment version, and record QuestionAuditLog diff
 * DELETE - Soft-delete (transition status to ARCHIVED)
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFacultyOrAdminUser } from "@/lib/questions/facultyAuthHelper";
import {
  getFacultyQuestionById,
  updateFacultyQuestion,
  archiveFacultyQuestion,
} from "@/lib/questions/facultyQuestionService";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const question = await getFacultyQuestionById(id);

    if (!question) {
      return NextResponse.json(
        { success: false, error: `Question with ID '${id}' not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error: any) {
    console.error("API /api/faculty/questions/[id] GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve question details" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const ipAddress =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const updated = await updateFacultyQuestion(
      id,
      {
        subjectSlug: body.subjectSlug,
        levelNumber: body.levelNumber ? parseInt(body.levelNumber, 10) : undefined,
        topic: body.topic,
        subtopic: body.subtopic,
        difficulty: body.difficulty,
        bloomTaxonomy: body.bloomTaxonomy,
        questionText: body.questionText,
        codeSnippet: body.codeSnippet,
        questionType: body.questionType,
        options: body.options,
        correctOptionIds: body.correctOptionIds,
        academicPoints: body.academicPoints ? parseInt(body.academicPoints, 10) : undefined,
        xpReward: body.xpReward ? parseInt(body.xpReward, 10) : undefined,
        timeLimitSeconds: body.timeLimitSeconds ? parseInt(body.timeLimitSeconds, 10) : undefined,
        explanation: body.explanation,
        hint: body.hint,
        misconceptions: body.misconceptions,
        misconceptionExplanation: body.misconceptionExplanation,
        referenceSource: body.referenceSource,
        tags: body.tags,
        reason: body.reason || "Faculty content update",
      },
      auth.user.id,
      ipAddress
    );

    return NextResponse.json({
      success: true,
      message: `Question updated successfully to version ${updated.version}`,
      question: updated,
    });
  } catch (error: any) {
    console.error("API /api/faculty/questions/[id] PUT error:", error);
    const status = error.message?.includes("not found") ? 404 : 400;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update question" },
      { status }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    let reason = "Soft-deleted by faculty";

    try {
      const body = await req.json();
      if (body.reason) reason = body.reason;
    } catch {
      // Body is optional for DELETE
    }

    const ipAddress =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const archived = await archiveFacultyQuestion(id, reason, auth.user.id, ipAddress);

    return NextResponse.json({
      success: true,
      message: "Question archived successfully",
      question: archived,
    });
  } catch (error: any) {
    console.error("API /api/faculty/questions/[id] DELETE error:", error);
    const status = error.message?.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to archive question" },
      { status }
    );
  }
}
