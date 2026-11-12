/**
 * Socrates Conversations Bulk Clear API Route
 * File: src/app/api/socrates/conversations/clear/route.ts
 *
 * DELETE: Bulk deletes all conversations and messages belonging to the authenticated student.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedSocratesUser } from "@/lib/socrates/socratesAuth";
import { clearAllConversations } from "@/lib/socrates/conversationPersistence";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    const result = await clearAllConversations(user.id);

    return NextResponse.json(
      {
        success: true,
        message: "All conversations cleared successfully",
        deletedCount: result.count,
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
