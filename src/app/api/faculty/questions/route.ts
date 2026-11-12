/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Faculty Questions API (List & Create)
 * Target: src/app/api/faculty/questions/route.ts
 *
 * GET  - List & filter questions (by realmSlug, levelNumber, status, search, pagination)
 * POST - Create new question draft with stable option UUIDs, hints, misconceptions
 * =============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { requireFacultyOrAdminUser } from "@/lib/questions/facultyAuthHelper";
import {
  listFacultyQuestions,
  createFacultyQuestionDraft,
  FacultyQuestionFilters,
  QuestionValidationStatus,
} from "@/lib/questions/facultyQuestionService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);

    const filters: FacultyQuestionFilters = {
      realmSlug: searchParams.get("realmSlug") || searchParams.get("subjectSlug") || undefined,
      levelNumber: searchParams.get("levelNumber")
        ? parseInt(searchParams.get("levelNumber")!, 10)
        : undefined,
      status: (searchParams.get("status") as QuestionValidationStatus | "ALL") || "ALL",
      difficulty: searchParams.get("difficulty") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 20,
      sortBy: (searchParams.get("sortBy") as any) || "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    const result = await listFacultyQuestions(filters);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/faculty/questions GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve faculty question bank" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireFacultyOrAdminUser();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();

    if (!body.subjectSlug && !body.realmSlug) {
      return NextResponse.json(
        { success: false, error: "Missing required field: subjectSlug" },
        { status: 400 }
      );
    }
    if (
      !body.questionText ||
      typeof body.questionText !== "string" ||
      body.questionText.trim().length < 5
    ) {
      return NextResponse.json(
        { success: false, error: "questionText is required and must be at least 5 characters" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.options) || body.options.length < 2) {
      return NextResponse.json(
        { success: false, error: "options array is required with at least 2 options" },
        { status: 400 }
      );
    }
    if (
      !body.explanation ||
      typeof body.explanation !== "string" ||
      body.explanation.trim().length < 5
    ) {
      return NextResponse.json(
        { success: false, error: "explanation is required and must be at least 5 characters" },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    const created = await createFacultyQuestionDraft(
      {
        subjectSlug: body.subjectSlug || body.realmSlug,
        levelNumber: body.levelNumber ? parseInt(body.levelNumber, 10) : 1,
        topic: body.topic || "Core Concepts",
        subtopic: body.subtopic || "Fundamentals",
        difficulty: body.difficulty || "Medium",
        bloomTaxonomy: body.bloomTaxonomy || "UNDERSTAND",
        questionText: body.questionText,
        codeSnippet: body.codeSnippet || null,
        questionType: body.questionType || "SINGLE_MCQ",
        options: body.options,
        correctOptionIds: Array.isArray(body.correctOptionIds)
          ? body.correctOptionIds
          : body.correctOptionId
          ? [body.correctOptionId]
          : [],
        academicPoints: body.academicPoints ? parseInt(body.academicPoints, 10) : 1,
        xpReward: body.xpReward ? parseInt(body.xpReward, 10) : 50,
        timeLimitSeconds: body.timeLimitSeconds ? parseInt(body.timeLimitSeconds, 10) : 35,
        explanation: body.explanation,
        hint: body.hint || null,
        misconceptions: body.misconceptions || undefined,
        misconceptionExplanation: body.misconceptionExplanation || null,
        referenceSource: body.referenceSource || null,
        tags: body.tags || [],
        status: body.status || "DRAFT",
      },
      auth.user.id,
      ipAddress
    );

    return NextResponse.json(
      {
        success: true,
        message: "Question draft successfully registered in Question Bank",
        question: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API /api/faculty/questions POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create question draft" },
      { status: 500 }
    );
  }
}