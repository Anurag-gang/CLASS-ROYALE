import { prisma } from "@/lib/db";
import { getAIProvider } from "./provider";
import { buildStudentContext } from "./context";
import { defaultRAGRetriever, formatRAGContext } from "./rag";
import { CR_TOOLS_REGISTRY } from "./tools";
import { mlClient } from "@/lib/ml/client";
import { MLTelemetry, LearningAction } from "@/lib/ml/types";
import {
  AIMessage,
  StudentLearningContext,
  QuizQuestionItem,
  StudyPlanResult,
  RevisionResult,
} from "./types";
import {
  CR_CORE_SYSTEM_PROMPT,
  CR_MODE_PROMPTS,
  formatStudentContextPrompt,
  formatMLAdaptivePrompt,
} from "./prompts";
import { socraticEngine } from "./socratic-engine";

export type CRMode =
  | "TUTOR"
  | "QUIZ"
  | "EXAM_PREP"
  | "REVISION"
  | "STUDY_PLAN"
  | "PERFORMANCE"
  | "CHAT";

export interface CROrchestratorOptions {
  conversationId?: string;
  mode?: CRMode | string;
  topic?: string;
  courseId?: string;
  signal?: AbortSignal;
  history?: AIMessage[];
}

export interface AutomaticSuggestion {
  label: string;
  prompt: string;
  action: string;
  icon?: string;
  category?: "quiz" | "deep_dive" | "revision" | "roadmap";
}

export interface CROrchestratorResponse {
  type: "message" | "quiz" | "study_plan" | "revision" | "recommendation";
  message: string;
  reply: string; // Alias for client compatibility
  conversationId: string;
  assistantMessageId: string;
  payload?: any;
  toolCall?: { name: string; data: any };
  suggestedActions?: string[];
  automaticSuggestions?: AutomaticSuggestion[];
  mlTelemetry?: MLTelemetry;
  thoughtSteps?: string[];
  mode: CRMode;
}

/**
 * Dynamically synthesizes agentic next-step suggestions based on topic & ML diagnostics
 */
export function generateAutomaticSuggestions(
  topic: string,
  userMessage: string,
  mode: string,
  mlTelemetry?: MLTelemetry
): AutomaticSuggestion[] {
  const cleanTopic = topic || "Computer Science Fundamentals";
  const action = mlTelemetry?.learningAction || "ANSWER_NEXT_QUESTION";
  const mastery = mlTelemetry?.masteryPercent ?? 55;

  const suggestions: AutomaticSuggestion[] = [];

  // 1. Diagnostic / Adaptive Quiz based on ML action
  if (action === "INCREASE_DIFFICULTY" || mastery >= 80) {
    suggestions.push({
      label: `⚔️ Challenge Quiz: ${cleanTopic}`,
      prompt: `Quiz me on hard edge cases and advanced traps in ${cleanTopic}`,
      action: "QUIZ",
      icon: "swords",
      category: "quiz",
    });
  } else if (action === "LOWER_DIFFICULTY" || action === "REVISE_TOPIC" || mastery < 50) {
    suggestions.push({
      label: `🎯 Diagnostic Fundamentals Quiz`,
      prompt: `Quiz me on the core fundamentals of ${cleanTopic} with step-by-step checks`,
      action: "QUIZ",
      icon: "target",
      category: "quiz",
    });
  } else {
    suggestions.push({
      label: `⚔️ 5-Question Arena Quiz`,
      prompt: `Quiz me on ${cleanTopic} with 5 questions to test my understanding`,
      action: "QUIZ",
      icon: "swords",
      category: "quiz",
    });
  }

  // 2. Deep Dive / Invariant Analysis
  if (userMessage.toLowerCase().includes("code") || userMessage.toLowerCase().includes("implement")) {
    suggestions.push({
      label: `⚡ Complexity & Hardware Tradeoffs`,
      prompt: `What are the cache-locality, time, and space tradeoffs for ${cleanTopic}?`,
      action: "TUTOR",
      icon: "cpu",
      category: "deep_dive",
    });
  } else {
    suggestions.push({
      label: `⚡ Code Walkthrough with Invariants`,
      prompt: `Show me a clean, annotated implementation of ${cleanTopic} with loop invariants explained`,
      action: "TUTOR",
      icon: "code",
      category: "deep_dive",
    });
  }

  // 3. Active Recall Revision Flashcards
  suggestions.push({
    label: `⚡ Active Recall Flashcards`,
    prompt: `Generate an active recall revision flashcard vault for ${cleanTopic}`,
    action: "REVISION",
    icon: "sparkles",
    category: "revision",
  });

  // 4. Adaptive Study Plan or Production Architecture
  if (mastery < 65) {
    suggestions.push({
      label: `📜 7-Day Study Roadmap`,
      prompt: `Create a 7-day adaptive study plan to master ${cleanTopic} from scratch`,
      action: "STUDY_PLAN",
      icon: "calendar",
      category: "roadmap",
    });
  } else {
    suggestions.push({
      label: `🚀 Real-World Architecture`,
      prompt: `How is ${cleanTopic} implemented in real production systems (e.g. Linux kernel, Redis, or distributed databases)?`,
      action: "TUTOR",
      icon: "zap",
      category: "deep_dive",
    });
  }

  return suggestions;
}

export class CROrchestrator {
  /**
   * Intelligently detects the user's educational intent
   */
  public detectIntent(userMessage: string, explicitMode?: string): { mode: CRMode; topic: string } {
    const text = userMessage.trim().toLowerCase();

    // 1. Explicit mode overrides
    if (explicitMode) {
      const normalized = explicitMode.toUpperCase();
      if (["TUTOR", "QUIZ", "EXAM_PREP", "REVISION", "STUDY_PLAN", "PERFORMANCE"].includes(normalized)) {
        return { mode: normalized as CRMode, topic: this.extractTopic(userMessage) };
      }
    }

    // 2. Keyword heuristic detection
    if (
      text.startsWith("/quiz") ||
      text.includes("quiz me") ||
      text.includes("test me") ||
      text.includes("combat arena") ||
      text.includes("practice questions")
    ) {
      return { mode: "QUIZ", topic: this.extractTopic(userMessage) };
    }

    if (
      text.includes("study plan") ||
      text.includes("exam schedule") ||
      text.includes("roadmap") ||
      text.includes("prepare for my exam")
    ) {
      return { mode: "STUDY_PLAN", topic: this.extractTopic(userMessage) };
    }

    if (
      text.includes("flashcard") ||
      text.includes("flash cards") ||
      text.includes("revise") ||
      text.includes("cheatsheet") ||
      text.includes("formula sheet") ||
      text.includes("quick summary")
    ) {
      return { mode: "REVISION", topic: this.extractTopic(userMessage) };
    }

    if (
      text.includes("exam prep") ||
      text.includes("upcoming test") ||
      text.includes("likely exam question") ||
      text.includes("common trap")
    ) {
      return { mode: "EXAM_PREP", topic: this.extractTopic(userMessage) };
    }

    if (
      text.includes("my progress") ||
      text.includes("how am i doing") ||
      text.includes("weak areas") ||
      text.includes("mastery level")
    ) {
      return { mode: "PERFORMANCE", topic: this.extractTopic(userMessage) };
    }

    return { mode: "TUTOR", topic: this.extractTopic(userMessage) };
  }

  public extractTopic(text: string): string {
    const clean = text
      .replace(
        /^(cr,|cr|please|quiz me on|teach me|explain|create a study plan for|revise|summary of|what is|how does|what are the)\s+/i,
        ""
      )
      .replace(/[?!.]+$/, "")
      .trim();

    if (!clean) return "Computer Science Fundamentals";

    const lower = clean.toLowerCase();
    if (lower.includes("dijkstra") || lower.includes("shortest path")) return "Dijkstra's Algorithm";
    if (lower.includes("dynamic programming") || lower.includes(" dp ")) return "Dynamic Programming";
    if (lower.includes("binary search tree") || lower.includes("bst") || lower.includes("avl"))
      return "Binary Search Trees & AVL Rotations";
    if (lower.includes("process") || lower.includes("semaphore") || lower.includes("deadlock"))
      return "Process Synchronization & Semaphores";
    if (lower.includes("b-tree") || lower.includes("indexing") || lower.includes("acid"))
      return "Database Indexing & B-Trees";
    if (lower.includes("tcp") || lower.includes("handshake") || lower.includes("network"))
      return "TCP/IP & Computer Networking";

    return clean.slice(0, 50);
  }

  /**
   * Builds the comprehensive prompt context for the LLM enriched with ML telemetry
   */
  public async buildEnrichedPrompt(
    userId: string,
    mode: CRMode,
    userQuery: string,
    courseId?: string
  ): Promise<{
    systemPrompt: string;
    context: StudentLearningContext;
    mlTelemetry: MLTelemetry;
    topic: string;
  }> {
    // 1. Fetch sanitized student telemetry
    const context = await buildStudentContext(userId);
    const { topic } = this.detectIntent(userQuery, mode);

    // 2. Query Machine Learning Adaptive Engine
    const isWeak = context.weakTopics.some((w) => w.toLowerCase().includes(topic.toLowerCase()));
    const lowerQuery = userQuery.toLowerCase();

    let consecutiveWrong = isWeak ? 2 : 0;
    let consecutiveCorrect = context.streak > 3 ? 3 : 1;
    let lastAnswerCorrect: boolean | undefined = undefined;

    if (
      lowerQuery.includes("don't understand") ||
      lowerQuery.includes("dont understand") ||
      lowerQuery.includes("confused") ||
      lowerQuery.includes("too hard") ||
      lowerQuery.includes("help") ||
      lowerQuery.includes("simpler") ||
      lowerQuery.includes("struggling") ||
      lowerQuery.includes("wrong")
    ) {
      consecutiveWrong = 3;
      consecutiveCorrect = 0;
      lastAnswerCorrect = false;
    } else if (
      lowerQuery.includes("harder") ||
      lowerQuery.includes("challenge") ||
      lowerQuery.includes("advanced") ||
      lowerQuery.includes("easy") ||
      lowerQuery.includes("solved") ||
      lowerQuery.includes("next level")
    ) {
      consecutiveCorrect = 4;
      consecutiveWrong = 0;
      lastAnswerCorrect = true;
    }

    const adaptiveReq = {
      student_id: userId,
      topic_id: topic.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      consecutive_correct: consecutiveCorrect,
      consecutive_wrong: consecutiveWrong,
      last_answer_correct: lastAnswerCorrect,
      time_taken_seconds: 45,
    };

    const adaptiveRes = await mlClient.getAdaptiveAction(adaptiveReq);
    const mlTelemetry = mlClient.formatTelemetry(adaptiveRes);

    // 3. Retrieve relevant course documents via RAG
    const ragDocs = await defaultRAGRetriever.retrieve(userId, userQuery, courseId, 2);
    const ragPrompt = formatRAGContext(ragDocs);

    // 4. Assemble pedagogical system prompt
    const studentTelemetryPrompt = formatStudentContextPrompt(context);
    const mlAdaptivePrompt = formatMLAdaptivePrompt(mlTelemetry);
    const modePrompt = CR_MODE_PROMPTS[mode] || CR_MODE_PROMPTS.TUTOR;

    const systemPrompt = `${CR_CORE_SYSTEM_PROMPT}

${studentTelemetryPrompt}

${mlAdaptivePrompt}

${modePrompt}
${ragPrompt ? "\n" + ragPrompt : ""}`;

    return { systemPrompt, context, mlTelemetry, topic };
  }

  /**
   * Process a message synchronously / return standard JSON payload with suggestions & ML telemetry
   */
  public async processMessage(
    userId: string,
    userMessage: string,
    options: CROrchestratorOptions = {}
  ): Promise<CROrchestratorResponse> {
    const { mode, topic } = this.detectIntent(userMessage, options.mode);

    // Resolve valid student id for DB relations if in guest mode
    let actualUserId = userId;
    let isGuest = !userId || userId === "guest" || userId.startsWith("guest-");
    if (isGuest) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      if (defaultStudent) {
        actualUserId = defaultStudent.id;
      }
    }

    // 1. Ensure or retrieve conversation
    let conversation: any = null;
    try {
      if (options.conversationId) {
        conversation = await prisma.cRConversation.findFirst({
          where: { id: options.conversationId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 12 } },
        });
      }

      if (!conversation && actualUserId) {
        conversation = await prisma.cRConversation.create({
          data: {
            userId: actualUserId,
            title: topic ? `${topic.toUpperCase()} Quest` : userMessage.slice(0, 30) || "CR Study Session",
          },
          include: { messages: true },
        });
      }
    } catch (err) {
      console.warn("[CROrchestrator] DB Conversation fallback:", err);
      conversation = { id: "conv-temp-" + Date.now(), messages: [] };
    }

    // 2. Persist user message if conversation exists in DB
    try {
      if (conversation?.id && !conversation.id.startsWith("conv-temp-")) {
        await prisma.cRMessage.create({
          data: {
            conversationId: conversation.id,
            sender: "user",
            text: userMessage.trim(),
            type: "message",
          },
        });
      }
    } catch {}

    const provider = getAIProvider();
    const { systemPrompt, context, mlTelemetry } = await this.buildEnrichedPrompt(
      actualUserId,
      mode,
      userMessage,
      options.courseId
    );

    let responseType: CROrchestratorResponse["type"] = "message";
    let replyText = "";
    let payload: any = null;
    let toolCall: { name: string; data: any } | undefined;

    // 3. Handle Special Tool-Generating Modes
    if (mode === "QUIZ") {
      try {
        const quizData = await CR_TOOLS_REGISTRY.generate_quiz.execute(actualUserId, {
          topic: topic || "Data Structures",
          difficulty: mlTelemetry.learningAction === "INCREASE_DIFFICULTY" ? 4 : 3,
          questionCount: 5,
        });

        responseType = "quiz";
        replyText = `⚔️ **CR COMBAT ARENA: ${topic.toUpperCase()}**\nI've generated a 5-question adaptive trial calibrated to your ML mastery profile (${mlTelemetry.masteryPercent}%). Complete all questions to diagnose your mastery and claim bonus XP!`;
        payload = quizData;
        toolCall = { name: "toolCreateQuiz", data: quizData };
      } catch (err) {
        console.warn("[CROrchestrator] Quiz tool error, falling back to chat:", err);
      }
    } else if (mode === "STUDY_PLAN") {
      try {
        const planData = await CR_TOOLS_REGISTRY.create_study_plan.execute(actualUserId, {
          subject: topic || "Algorithms & Data Structures",
        });

        responseType = "study_plan";
        replyText = `📜 **CR BATTLE TIMELINE: ${topic.toUpperCase()}**\nHere is your adaptive study roadmap calibrated to your recent ML performance and mastery gaps:`;
        payload = planData;
        toolCall = { name: "toolCreateStudyPlan", data: planData };
      } catch (err) {
        console.warn("[CROrchestrator] Study plan tool error, falling back to chat:", err);
      }
    } else if (mode === "REVISION") {
      try {
        const revResult = await provider.generateRevision(
          {
            topic: topic || "Computer Science",
            cardCount: 6,
          },
          context
        );

        let savedPackId = "pack-" + Date.now();
        try {
          const savedPack = await prisma.cRRevisionPack.create({
            data: {
              userId: actualUserId,
              topic: revResult.topic,
              summary: revResult.summary,
              cardsJson: JSON.stringify(revResult.cards),
            },
          });
          savedPackId = savedPack.id;
        } catch {}

        responseType = "revision";
        replyText = `⚡ **CR REVISION VAULT: ${revResult.topic.toUpperCase()}**\n${revResult.summary}\n\nHigh-yield active recall flashcards are ready for review:`;
        payload = { ...revResult, packId: savedPackId };
        toolCall = { name: "toolCreateRevisionPack", data: payload };
      } catch (err) {
        console.warn("[CROrchestrator] Revision tool error, falling back to chat:", err);
      }
    }

    // 4. Default LLM Generation for conversational or fallback
    if (!replyText) {
      const history: AIMessage[] = (
        conversation?.messages && conversation.messages.length > 0
          ? conversation.messages.map((m: any) => ({
              role: m.sender === "cr" ? "assistant" : "user",
              content: m.text,
            }))
          : options.history || []
      );

      // Append latest user message if not already last
      if (history.length === 0 || history[history.length - 1].content !== userMessage.trim()) {
        history.push({ role: "user", content: userMessage.trim() });
      }
      const trimmedHistory = history.slice(-10);

      try {
        const aiResponse = await provider.chat(
          [{ role: "system", content: systemPrompt }, ...trimmedHistory],
          { temperature: 0.7, mlTelemetry, mode }
        );
        replyText = aiResponse.content;
      } catch (err) {
        console.warn("[CROrchestrator] Provider chat failed, generating via Socratic Engine:", err);
        replyText = socraticEngine.generate(
          [{ role: "system", content: systemPrompt }, ...trimmedHistory],
          mlTelemetry,
          mode
        );
      }

      responseType = "message";
    }

    // 5. Persist CR Message to Database
    let assistantMessageId = "msg-" + Date.now();
    try {
      if (conversation?.id && !conversation.id.startsWith("conv-temp-")) {
        const crMessage = await prisma.cRMessage.create({
          data: {
            conversationId: conversation.id,
            sender: "cr",
            text: replyText,
            type: responseType,
            payloadJson: payload ? JSON.stringify(payload) : null,
          },
        });
        assistantMessageId = crMessage.id;

        await prisma.cRConversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      }
    } catch {}

    // 6. Generate Automatic Agentic Suggestions
    const automaticSuggestions = generateAutomaticSuggestions(topic, userMessage, mode, mlTelemetry);

    return {
      type: responseType,
      message: replyText,
      reply: replyText,
      conversationId: conversation?.id || "conv-default",
      assistantMessageId,
      payload,
      toolCall,
      suggestedActions: automaticSuggestions.map((s) => `[ ${s.label.toUpperCase()} ]`),
      automaticSuggestions,
      mlTelemetry,
      thoughtSteps: [
        `🧠 ML Diagnostics: Evaluated ${topic} mastery at ${mlTelemetry.masteryPercent}%`,
        `🎯 Prescribed Action: ${mlTelemetry.learningAction} (${mlTelemetry.actionRationale})`,
        `📚 Retrieved curriculum invariants & boundary cases`,
        `⚡ Synthesized comprehensive verified explanation`,
      ],
      mode,
    };
  }

  /**
   * Stream a chat response with real-time SSE, emitting ML telemetry and automatic suggestions
   */
  public async *streamMessage(
    userId: string,
    userMessage: string,
    options: CROrchestratorOptions = {}
  ): AsyncGenerator<
    { event: "token" | "telemetry" | "suggestions" | "done" | "error"; data: string },
    void,
    unknown
  > {
    try {
      const { mode, topic } = this.detectIntent(userMessage, options.mode);

    let actualUserId = userId;
    let isGuest = !userId || userId === "guest" || userId.startsWith("guest-");
    if (isGuest) {
      const defaultStudent = await prisma.user.findFirst({ where: { role: "STUDENT" } });
      if (defaultStudent) {
        actualUserId = defaultStudent.id;
      }
    }

    // 1. Ensure conversation
    let conversation: any = null;
    try {
      if (options.conversationId) {
        conversation = await prisma.cRConversation.findFirst({
          where: { id: options.conversationId },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 12 } },
        });
      }

      if (!conversation && actualUserId) {
        conversation = await prisma.cRConversation.create({
          data: {
            userId: actualUserId,
            title: topic ? `${topic.toUpperCase()} Quest` : userMessage.slice(0, 30) || "CR Study Session",
          },
          include: { messages: true },
        });
      }
    } catch {
      conversation = { id: "conv-temp-" + Date.now(), messages: [] };
    }

    // 2. Persist user message
    try {
      if (conversation?.id && !conversation.id.startsWith("conv-temp-")) {
        await prisma.cRMessage.create({
          data: {
            conversationId: conversation.id,
            sender: "user",
            text: userMessage.trim(),
            type: "message",
          },
        });
      }
    } catch {}

    const provider = getAIProvider();
    const { systemPrompt, mlTelemetry } = await this.buildEnrichedPrompt(
      actualUserId,
      mode,
      userMessage,
      options.courseId
    );

    // Yield initial ML Telemetry event immediately
    yield {
      event: "telemetry",
      data: JSON.stringify(mlTelemetry),
    };

    const history: AIMessage[] = (
      conversation?.messages && conversation.messages.length > 0
        ? conversation.messages.map((m: any) => ({
            role: m.sender === "cr" ? "assistant" : "user",
            content: m.text,
          }))
        : options.history || []
    );
    if (history.length === 0 || history[history.length - 1].content !== userMessage.trim()) {
      history.push({ role: "user", content: userMessage.trim() });
    }
    const trimmedHistory = history.slice(-10);

    let accumulatedText = "";

    try {
      const tokenStream = provider.streamChat(
        [{ role: "system", content: systemPrompt }, ...trimmedHistory],
        { temperature: 0.7, signal: options.signal, mlTelemetry, mode }
      );

      for await (const token of tokenStream) {
        accumulatedText += token;
        yield { event: "token", data: token };
      }
    } catch (err: any) {
      console.warn("[CROrchestrator] Provider stream failed, streaming via Socratic Engine:", err?.message);
      const fallbackContent = socraticEngine.generate(
        [{ role: "system", content: systemPrompt }, ...trimmedHistory],
        mlTelemetry,
        mode
      );
      const words = fallbackContent.split(" ");
      for (const word of words) {
        accumulatedText += word + " ";
        yield { event: "token", data: word + " " };
        await new Promise((r) => setTimeout(r, 12));
      }
    }

    // Generate automatic suggestions
    const automaticSuggestions = generateAutomaticSuggestions(topic, userMessage, mode, mlTelemetry);
    yield {
      event: "suggestions",
      data: JSON.stringify(automaticSuggestions),
    };

      // 3. Persist CR assistant message once stream finishes
      let crMessageId = "msg-" + Date.now();
      try {
        if (conversation?.id && !conversation.id.startsWith("conv-temp-")) {
          const crMessage = await prisma.cRMessage.create({
            data: {
              conversationId: conversation.id,
              sender: "cr",
              text: accumulatedText || "Understood. Let us continue.",
              type: "message",
            },
          });
          crMessageId = crMessage.id;

          await prisma.cRConversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });
        }
      } catch {}

      yield {
        event: "done",
        data: JSON.stringify({
          conversationId: conversation?.id || "conv-default",
          assistantMessageId: crMessageId,
          mode,
          mlTelemetry,
          automaticSuggestions,
        }),
      };
    } catch (err: any) {
      console.error("[CROrchestrator] Stream error:", err);
      yield {
        event: "error",
        data: JSON.stringify({ error: err?.message || "Stream interrupted" }),
      };
    }
  }
}

export const crOrchestrator = new CROrchestrator();
