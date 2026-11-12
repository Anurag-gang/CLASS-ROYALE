/**
 * Socrates Streaming Chat API Route Handler
 * File: src/app/api/socrates/chat/route.ts
 *
 * Endpoint: POST /api/socrates/chat
 *
 * Principles:
 * 1. Primary Brain Integration: Direct connection to local Colibri Qwen inference engine.
 * 2. Transparent Offline Signaling: Emits explicit HTTP 503 JSON if Colibri is offline.
 *    ZERO silent fallback to mock heuristic engines or canned regex templates.
 * 3. Web Streams SSE: Standards-compliant text/event-stream with stage, token, done, error events.
 * 4. Client AbortSignal & Disconnect: Propagates req.signal to cancel fetch and trigger Colibri TCP peek disconnect.
 * 5. Bounded Context Window & Non-Gating Academic Grounding: Enriches when relevant, never gates.
 * 6. Conversation Memory & SQLite Persistence: Persists user messages before inference and assistant
 *    responses upon finish, bounds history turns to ~3,000 tokens / 10-12 turns.
 * 7. Strict CR Intelligence Isolation: Zero imports from CR orchestrator, ML microservice, or CR prompts.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  ColibriClient,
  ColibriOfflineError,
  ColibriTimeoutError,
  ChatMessage,
} from "@/lib/socrates/colibriClient";
import {
  buildSocratesSystemPrompt,
  detectQueryType,
  sanitizeUserPrompt,
  USER_QUERY_START_DELIMITER,
  USER_QUERY_END_DELIMITER,
  SOCRATES_BASE_SYSTEM_PROMPT,
} from "@/lib/socrates/socratesPrompt";
import {
  retrieveAcademicContext,
  AcademicContextResult,
} from "@/lib/socrates/academicKnowledgeRetrieval";
import { getAuthenticatedSocratesUser } from "@/lib/socrates/socratesAuth";
import {
  assembleBoundedContextHistory,
  saveUserMessage,
  saveAssistantMessage,
  createConversation,
} from "@/lib/socrates/conversationPersistence";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Initialize singleton ColibriClient
const colibriClient = new ColibriClient();

// Default Socratic System Prompt (exported for backward compatibility)
export const DEFAULT_SOCRATES_PROMPT = SOCRATES_BASE_SYSTEM_PROMPT;

export async function POST(req: NextRequest) {
  try {
    // -------------------------------------------------------------------------
    // 1. Parse & Validate Request Body
    // -------------------------------------------------------------------------
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
          code: "INVALID_JSON",
          status: 400,
        },
        { status: 400 }
      );
    }

    const {
      message,
      conversationId,
      contextQuestionId,
      stream = true,
      temperature = 0.5,
      maxTokens = 512,
    } = body;
    const effectiveMaxTokens = Math.min(typeof maxTokens === "number" ? maxTokens : 512, 1024);

    const trimmedMsg = typeof message === "string" ? message.trim() : "";
    if (!trimmedMsg) {
      return NextResponse.json(
        {
          error: "Message is required and cannot be empty.",
          code: "VALIDATION_ERROR",
          status: 400,
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // 2. User Authentication & Session Resolution
    // -------------------------------------------------------------------------
    const auth = await getAuthenticatedSocratesUser(req);
    if (auth.errorResponse) return auth.errorResponse;
    const { user } = auth;

    // -------------------------------------------------------------------------
    // 3. Resolve Active Conversation & Verify Student Ownership
    // -------------------------------------------------------------------------
    let activeConversationId = conversationId;
    if (activeConversationId) {
      const conv = await (prisma as any).socratesConversation.findUnique({
        where: { id: activeConversationId },
      });

      if (!conv) {
        return NextResponse.json(
          { error: "Conversation not found.", code: "NOT_FOUND", status: 404 },
          { status: 404 }
        );
      }

      if (conv.userId !== user.id) {
        return NextResponse.json(
          { error: "Access denied to conversation.", code: "FORBIDDEN", status: 403 },
          { status: 403 }
        );
      }
    }

    // -------------------------------------------------------------------------
    // 4. Pre-flight Colibri Liveness Check (Requirement R1, Acceptance Criteria)
    // -------------------------------------------------------------------------
    const health = await colibriClient.checkHealth();
    if (!health.online) {
      return NextResponse.json(
        {
          error: `Colibri Qwen inference service is currently offline or unreachable at ${colibriClient.getRootUrl()}. Please ensure the local Colibri engine is running.`,
          code: "COLIBRI_OFFLINE",
          status: 503,
          endpoint: colibriClient.getBaseUrl(),
        },
        {
          status: 503,
          headers: {
            "Retry-After": "5",
          },
        }
      );
    }

    // Auto-create conversation if omitted
    if (!activeConversationId) {
      const autoTitle = trimmedMsg.length > 36 ? trimmedMsg.slice(0, 33) + "..." : trimmedMsg;
      const newConv = await createConversation(
        user.id,
        autoTitle || "New Dialectic",
        false,
        contextQuestionId || null
      );
      activeConversationId = newConv.id;
    }

    // -------------------------------------------------------------------------
    // 5. Persist User Query to SQLite BEFORE Inference (Requirement R6)
    // -------------------------------------------------------------------------
    const userMsgRecord = await saveUserMessage(activeConversationId, trimmedMsg);

    // -------------------------------------------------------------------------
    // 6. Non-Gating Academic Curriculum Enrichment (Requirement R2)
    // -------------------------------------------------------------------------
    let academicResult: AcademicContextResult | null = null;
    let academicGroundingStage = false;

    try {
      academicResult = await retrieveAcademicContext(trimmedMsg, contextQuestionId);
      if (academicResult?.hasContext && (academicResult.relevanceScore >= 0.70 || contextQuestionId)) {
        academicGroundingStage = true;
      } else {
        academicResult = null;
        academicGroundingStage = false;
      }
    } catch {
      // Non-gating: Failures in academic retrieval must never block the user
      academicResult = null;
      academicGroundingStage = false;
    }

    // -------------------------------------------------------------------------
    // 7. Assemble Bounded Context History (~300 tokens / 2 turns)
    // -------------------------------------------------------------------------
    const historyMessages = await assembleBoundedContextHistory(activeConversationId, {
      maxTokens: 300,
      maxTurns: 2,
      excludeMessageId: userMsgRecord.id,
    });

    // -------------------------------------------------------------------------
    // 8. Construct Adaptive Socratic System Prompt & Messages
    // -------------------------------------------------------------------------
    const queryType = detectQueryType(trimmedMsg);
    const systemContent = buildSocratesSystemPrompt({
      queryType,
      academicContext: academicResult,
    });

    const sanitizedUserMsg = sanitizeUserPrompt(trimmedMsg);
    const wrappedUserMsg = `${USER_QUERY_START_DELIMITER}\n${sanitizedUserMsg}\n${USER_QUERY_END_DELIMITER}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...historyMessages,
      { role: "user", content: wrappedUserMsg },
    ];

    // -------------------------------------------------------------------------
    // 9. Non-Streaming Request Handler (stream === false)
    // -------------------------------------------------------------------------
    if (!stream) {
      try {
        const chatRes = await colibriClient.chat(messages, {
          signal: req.signal,
          temperature,
          maxTokens: effectiveMaxTokens,
        });

        const assistantRecord = await saveAssistantMessage(
          activeConversationId,
          chatRes.content,
          chatRes.usage?.completionTokens,
          chatRes.model
        );

        return NextResponse.json({
          conversationId: activeConversationId,
          messageId: assistantRecord.id,
          content: chatRes.content,
          role: "assistant",
          model: chatRes.model,
          latencyMs: chatRes.latencyMs,
        });
      } catch (err: unknown) {
        if (err instanceof ColibriOfflineError) {
          return NextResponse.json(
            {
              error: err.message,
              code: "COLIBRI_OFFLINE",
              status: 503,
              endpoint: err.endpoint,
            },
            { status: 503 }
          );
        }
        if (err instanceof ColibriTimeoutError) {
          return NextResponse.json(
            {
              error: err.message,
              code: "COLIBRI_TIMEOUT",
              status: 504,
              endpoint: err.endpoint,
            },
            { status: 504 }
          );
        }
        return NextResponse.json(
          {
            error: err instanceof Error ? err.message : "Inference failed",
            code: "INFERENCE_ERROR",
            status: 500,
          },
          { status: 500 }
        );
      }
    }

    // -------------------------------------------------------------------------
    // 10. Web Streams SSE Response Handler (stream === true)
    // -------------------------------------------------------------------------
    const encoder = new TextEncoder();
    let isAborted = false;

    // Propagate req.signal directly into Colibri stream generator
    const streamGen = colibriClient.streamChat(messages, {
      signal: req.signal,
      temperature,
      maxTokens: effectiveMaxTokens,
    });

    const readable = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          if (isAborted) return;
          try {
            const payload = `event: ${event}\ndata: ${typeof data === "string" ? data : JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch {
            // Stream closed by consumer
          }
        };

        const onAbort = () => {
          isAborted = true;
          try {
            controller.close();
          } catch {}
        };

        req.signal.addEventListener("abort", onAbort, { once: true });

        try {
          // 1. Emit grounding activity stage if academic context was loaded
          if (academicGroundingStage) {
            sendEvent("stage", {
              stage: "grounding",
              text: "Searching academic curriculum invariants...",
            });
          }

          // 2. Emit inference activity stage
          const isBusy = (health?.details as any)?.scheduler?.active > 0;
          sendEvent("stage", {
            stage: "inference",
            text: isBusy
              ? "Colibri is preparing dialectic execution slot..."
              : `Synthesizing dialectic response via ${health.model}...`,
          });

          let fullResponseText = "";
          let tokenCount = 0;

          // 3. Stream token deltas
          for await (const chunk of streamGen) {
            if (isAborted) break;
            fullResponseText += chunk;
            tokenCount += 1;
            sendEvent("token", { delta: chunk });
          }

          // 4. Emit done event upon full completion and persist assistant message
          if (!isAborted) {
            let savedMessageId: string | null = null;
            if (fullResponseText.length > 0) {
              const assistantRecord = await saveAssistantMessage(
                activeConversationId,
                fullResponseText,
                tokenCount,
                health.model
              );
              savedMessageId = assistantRecord.id;
              console.log("[Socrates Chat Stream Complete]: Saved assistant record:", savedMessageId);
            }

            sendEvent("done", {
              conversationId: activeConversationId,
              messageId: savedMessageId,
              totalTokens: tokenCount,
            });
            try {
              controller.close();
            } catch {}
          } else {
            // If aborted mid-stream with partial response, persist partial generation
            if (fullResponseText.length > 0) {
              try {
                await saveAssistantMessage(
                  activeConversationId,
                  fullResponseText,
                  tokenCount,
                  health.model
                );
              } catch {}
            }
          }
        } catch (err: unknown) {
          console.error("[Socrates Chat Stream Error]:", err);
          if (isAborted || (err as any)?.name === "AbortError") {
            try {
              controller.close();
            } catch {}
            return;
          }

          if (err instanceof ColibriOfflineError) {
            sendEvent("error", {
              error: err.message,
              code: "COLIBRI_OFFLINE",
              status: 503,
            });
          } else if (
            err instanceof ColibriTimeoutError ||
            (err as any)?.name === "TimeoutError" ||
            (err as any)?.code === 23
          ) {
            sendEvent("error", {
              error: "Inference timed out. The local 30B model is computing complex operations. Please retry with a concise question.",
              code: "COLIBRI_TIMEOUT",
              status: 504,
            });
          } else {
            sendEvent("error", {
              error: err instanceof Error ? err.message : "Inference stream failed",
              code: "STREAM_ERROR",
              status: 500,
            });
          }

          try {
            controller.close();
          } catch {}
        } finally {
          req.signal.removeEventListener("abort", onAbort);
        }
      },
      cancel(reason) {
        isAborted = true;
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Internal server error.",
        code: "SERVER_ERROR",
        status: 500,
      },
      { status: 500 }
    );
  }
}
