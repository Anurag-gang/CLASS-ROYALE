/**
 * Socrates Conversation Detail, Update, and Delete API Route
 * File: src/app/api/socrates/conversations/[id]/route.ts
 *
 * GET: Retrieves session detail and ordered messages with student ownership verification.
 * PATCH: Renames title or updates pinned status with student ownership verification.
 * DELETE: Cascades session and messages with student ownership verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthenticatedSocratesUser } from "@/lib/socrates/socratesAuth";
import {
  getConversationWithMessages,
  deleteConversation,
} from "@/lib/socrates/conversationPersistence";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/socrates/conversations/[id]
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid conversation ID", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const conversation = await getConversationWithMessages(id, user.id);

    if (conversation === null) {
      return NextResponse.json(
        { error: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (conversation === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden: You do not own this conversation", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(conversation, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch conversation", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// PATCH /api/socrates/conversations/[id]
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid conversation ID", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    const updates: { title?: string; pinned?: boolean } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Title cannot be empty.", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      updates.title = body.title.trim().slice(0, 150);
    }

    if (body.pinned !== undefined) {
      if (typeof body.pinned !== "boolean") {
        return NextResponse.json(
          { error: "Pinned must be a boolean", code: "VALIDATION_ERROR" },
          { status: 400 }
        );
      }
      updates.pinned = body.pinned;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided to update.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const socratesPrisma = prisma as any;
    const existing = await socratesPrisma.socratesConversation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Student Ownership Verification
    if (existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this conversation", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const updated = await socratesPrisma.socratesConversation.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json(
      {
        id: updated.id,
        title: updated.title,
        pinned: updated.pinned,
        updatedAt:
          updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : updated.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update conversation", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// DELETE /api/socrates/conversations/[id]
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid conversation ID", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const result = await deleteConversation(id, user.id);

    if (result === null) {
      return NextResponse.json(
        { error: "Conversation not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (result === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Forbidden: You do not own this conversation", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Conversation deleted successfully",
        deletedId: id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete conversation", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
