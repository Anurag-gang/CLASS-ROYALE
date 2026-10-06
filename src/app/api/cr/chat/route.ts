import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { crOrchestrator } from "@/lib/ai/orchestrator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const userId = user ? user.id : "guest-student";

    let body: any = {};
    try {
      const raw = await req.text();
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }

    const { message, conversationId, mode, action, topic, courseId, history } = body;

    const queryMessage = message || (topic ? `Teach me about ${topic}` : "Hello CR!");

    const response = await crOrchestrator.processMessage(userId, queryMessage, {
      conversationId,
      mode: mode || action,
      topic,
      courseId,
      history,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[CR Chat API] Error:", error);
    return NextResponse.json(
      { error: "CR was unable to process the request: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}