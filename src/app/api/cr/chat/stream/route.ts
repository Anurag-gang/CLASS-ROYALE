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
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { message, conversationId, mode, courseId, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const generator = crOrchestrator.streamMessage(userId, message, {
      conversationId,
      mode,
      courseId,
      history,
      signal: req.signal,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of generator) {
            const ssePayload = `event: ${chunk.event}\ndata: ${chunk.event === "token" ? JSON.stringify(chunk.data) : chunk.data}\n\n`;
            controller.enqueue(encoder.encode(ssePayload));
          }
          controller.close();
        } catch (err: any) {
          console.error("[CR Stream API] Stream error:", err);
          const errPayload = `event: error\ndata: ${JSON.stringify({ error: err?.message || "Stream terminated" })}\n\n`;
          controller.enqueue(encoder.encode(errPayload));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[CR Stream API] Handler error:", error);
    return NextResponse.json(
      { error: "Stream initiation failed: " + (error?.message || String(error)) },
      { status: 500 }
    );
  }
}
