/**
 * Socrates Conversations API Route
 * File: src/app/api/socrates/conversations/route.ts
 *
 * GET: Lists all conversations for authenticated student.
 * POST: Creates a new conversation for authenticated student.
 * DELETE: Bulk clear alias for student conversations.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSocratesUser } from "@/lib/socrates/socratesAuth";
import {
  listConversations,
  createConversation,
  clearAllConversations,
} from "@/lib/socrates/conversationPersistence";

export const dynamic = "force-dynamic";

// GET /api/socrates/conversations
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    const search = req.nextUrl?.searchParams?.get("search")?.trim() || "";
    const rawLimit = req.nextUrl?.searchParams?.get("limit");
    const limit = rawLimit ? Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 100) : 50;

    const result = await listConversations(user.id, search, limit);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load conversations", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/socrates/conversations
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let title = "New Dialectic";
    if (typeof body.title === "string" && body.title.trim()) {
      title = body.title.trim().slice(0, 150);
    }

    const pinned = typeof body.pinned === "boolean" ? body.pinned : false;
    const contextQuestionId =
      typeof body.contextQuestionId === "string" ? body.contextQuestionId.trim() : null;

    const conversation = await createConversation(user.id, title, pinned, contextQuestionId);

    return NextResponse.json(
      {
        id: conversation.id,
        userId: conversation.userId,
        title: conversation.title,
        pinned: conversation.pinned,
        contextQuestionId: conversation.contextQuestionId,
        createdAt:
          conversation.createdAt instanceof Date
            ? conversation.createdAt.toISOString()
            : conversation.createdAt,
        updatedAt:
          conversation.updatedAt instanceof Date
            ? conversation.updatedAt.toISOString()
            : conversation.updatedAt,
        messages: [],
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create conversation", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/socrates/conversations (Bulk Clear alias)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    const deleted = await clearAllConversations(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "All conversations cleared successfully",
        deletedCount: deleted.count,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to clear conversations", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
