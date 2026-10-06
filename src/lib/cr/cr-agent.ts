import { crOrchestrator, CRMode } from "@/lib/ai/orchestrator";

export interface CRActionResponse {
  type: "message" | "lesson" | "quiz" | "study_plan" | "revision" | "recommendation";
  message: string;
  reply: string; // Alias for client compatibility
  payload?: any;
  toolCall?: { name: string; data: any };
  assistantMessageId?: string;
  suggestedActions?: string[];
  conversationId: string;
}

export const CR_SYSTEM_INSTRUCTION = `You are CR, the official educational AI companion for Class Royale.

CR ROLE & RESPONSIBILITIES:
1. Purpose: Guide, teach, quiz, diagnose misconceptions, prepare study schedules, and build student confidence.
2. Tone: Highly intelligent, concise, encouraging, pedagogically sound, arcade-inspired.
3. Educational Process:
   - Determine prior knowledge
   - Explain with clean intuitive analogies (e.g. kingdoms, nodes as knights, arrays as inventory slots)
   - Check understanding with a bite-sized question
   - Avoid massive unstructured walls of text
4. Class Royale Terminology:
   - Naturally integrate Quest, Battle, Mastery, XP, Kingdom, and Arena.
   - Never fabricate grades, XP, or levels; progression is verified by the backend.`;

export async function processCRMessage(
  userId: string,
  userMessage: string,
  options?: {
    conversationId?: string;
    action?: "TEACH" | "QUIZ" | "EXAM_PREP" | "REVISE" | "WEAK_AREAS" | "STUDY_PLAN" | string;
    topic?: string;
    contextPayload?: any;
  }
): Promise<CRActionResponse> {
  const modeMap: Record<string, CRMode> = {
    TEACH: "TUTOR",
    QUIZ: "QUIZ",
    EXAM_PREP: "EXAM_PREP",
    REVISE: "REVISION",
    WEAK_AREAS: "PERFORMANCE",
    STUDY_PLAN: "STUDY_PLAN",
  };

  const mode = options?.action ? (modeMap[options.action] || "TUTOR") : undefined;

  const result = await crOrchestrator.processMessage(userId, userMessage, {
    conversationId: options?.conversationId,
    mode,
    topic: options?.topic,
  });

  return {
    type: result.type,
    message: result.message,
    reply: result.reply,
    payload: result.payload,
    toolCall: result.toolCall,
    assistantMessageId: result.assistantMessageId,
    suggestedActions: result.suggestedActions,
    conversationId: result.conversationId,
  };
}