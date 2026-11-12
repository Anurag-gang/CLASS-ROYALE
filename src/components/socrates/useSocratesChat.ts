/**
 * Socrates Client Chat Hook & Controller
 * File: src/components/socrates/useSocratesChat.ts
 *
 * Core Architecture & Guarantees:
 * 1. Standards-Compliant SSE Stream Consumer:
 *    - Consumes Web Streams from POST /api/socrates/chat.
 *    - Buffers and decodes SSE events (event: stage, event: token, event: done, event: error).
 *    - Token accumulation: Smoothly streams tokens into active assistant message.
 * 2. Client Cancellation via AbortController:
 *    - Immediate UI generation termination on stopGeneration().
 *    - Propagates req.signal to abort server socket and Colibri inference.
 *    - Preserves partial assistant generation in message history.
 * 3. Transparent Offline Handling:
 *    - Detects HTTP 503 Service Unavailable / COLIBRI_OFFLINE.
 *    - Sets isOffline = true and exposes retry handler.
 *    - Zero silent fallback to mock heuristic bots.
 * 4. Multi-Turn Session Persistence:
 *    - Auto-manages activeConversationId, loads session history from GET /api/socrates/conversations/[id].
 *    - Supports session CRUD (list, create, rename, pin, delete, clear all).
 * 5. Strict CR Intelligence Isolation:
 *    - Connects strictly to /api/socrates/* routes; zero CR imports or dependencies.
 */

import { useState, useRef, useCallback, useEffect } from "react";

// =============================================================================
// Interface & Type Definitions
// =============================================================================

export interface UIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  tokens?: number;
  model?: string;
  stage?: string;
  isStreaming?: boolean;
  isError?: boolean;
}

export interface ConversationSummary {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string;
}

export interface ActiveStage {
  stage: "grounding" | "inference" | "streaming" | string;
  text: string;
}

export interface ChatError {
  message: string;
  code?: string;
  status?: number;
}

export type DateBucket = "Pinned" | "Today" | "Yesterday" | "Previous 7 Days" | "Older";

export interface SSECallbacks {
  onStage?: (stage: { stage: string; text: string }) => void;
  onToken?: (delta: string) => void;
  onDone?: (doneData: { conversationId?: string; messageId?: string; totalTokens?: number }) => void;
  onError?: (errData: { error: string; code?: string; status?: number }) => void;
}

// =============================================================================
// Pure Logic Helpers (Exported for Unit Testing)
// =============================================================================

/**
 * Parses raw SSE chunk data with cross-packet frame buffering.
 * Handles `event: <type>\ndata: <json>\n\n` frames.
 */
export function parseSSEStreamChunks(
  existingBuffer: string,
  newChunk: string,
  callbacks: SSECallbacks
): { remainingBuffer: string } {
  const combined = existingBuffer + newChunk;
  const endsWithCarriage = combined.endsWith("\r");
  const safeChunk = endsWithCarriage ? combined.slice(0, -1) : combined;
  const pendingCarriage = endsWithCarriage ? "\r" : "";

  const normalized = safeChunk.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized.split("\n\n");
  const remainingBuffer = (parts.pop() || "") + pendingCarriage;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.startsWith(":")) continue; // Skip comments/keepalives

    let eventType = "token";
    let dataStr = "";

    const lines = trimmed.split("\n");
    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataStr = line.slice(5).trim();
      }
    }

    if (!dataStr) continue;

    try {
      const parsed = JSON.parse(dataStr);
      switch (eventType) {
        case "stage":
          callbacks.onStage?.(parsed);
          break;
        case "token":
          callbacks.onToken?.(parsed.delta !== undefined ? parsed.delta : dataStr);
          break;
        case "done":
          callbacks.onDone?.(parsed);
          break;
        case "error":
          callbacks.onError?.(parsed);
          break;
        default:
          if (parsed.delta) {
            callbacks.onToken?.(parsed.delta);
          }
          break;
      }
    } catch {
      // Non-JSON token fallback
      if (eventType === "token") {
        callbacks.onToken?.(dataStr);
      }
    }
  }

  return { remainingBuffer };
}

/**
 * Classifies HTTP and SSE stream errors for Socrates dialectic sessions.
 * Maps status 503 or COLIBRI_OFFLINE code to transparent offline indicators.
 */
export function classifyChatError(
  status: number,
  errorData?: any
): { isOffline: boolean; message: string; code: string; status: number } {
  const isOffline = status === 503 || errorData?.code === "COLIBRI_OFFLINE";
  const defaultOfflineMsg =
    "Colibri Qwen inference service is currently offline. Please ensure the local Colibri engine is running.";
  const message =
    errorData?.error ||
    errorData?.message ||
    (status === 503 ? defaultOfflineMsg : `Request failed with status ${status}`);
  const code = errorData?.code || (isOffline ? "COLIBRI_OFFLINE" : "REQUEST_FAILED");

  return {
    isOffline,
    message,
    code,
    status,
  };
}

/**
 * Pure state reducer applying stream cancellation:
 * marks any in-flight streaming messages as non-streaming while preserving their accumulated content,
 * and resets streaming/loading flags.
 */
export function applyStreamCancellation<T extends { isStreaming?: boolean }>(
  messages: T[]
): {
  updatedMessages: T[];
  stateReset: { isStreaming: false; isLoading: false; activeStage: null };
} {
  return {
    updatedMessages: messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    stateReset: {
      isStreaming: false,
      isLoading: false,
      activeStage: null,
    },
  };
}

/**
 * Groups conversation sessions into canonical date buckets.
 * Respects pinned status and chronological recency.
 */
export function groupConversationsByDate(
  conversations: ConversationSummary[],
  referenceDate: Date = new Date()
): Record<DateBucket, ConversationSummary[]> {
  const groups: Record<DateBucket, ConversationSummary[]> = {
    Pinned: [],
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  const startOfToday = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();
  const oneDayMs = 86400000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOf7Days = startOfToday - 7 * oneDayMs;

  for (const conv of conversations) {
    if (conv.pinned) {
      groups.Pinned.push(conv);
      continue;
    }

    const convDate = new Date(conv.updatedAt || conv.createdAt).getTime();
    if (isNaN(convDate)) {
      groups.Older.push(conv);
      continue;
    }

    if (convDate >= startOfToday) {
      groups.Today.push(conv);
    } else if (convDate >= startOfYesterday) {
      groups.Yesterday.push(conv);
    } else if (convDate >= startOf7Days) {
      groups["Previous 7 Days"].push(conv);
    } else {
      groups.Older.push(conv);
    }
  }

  return groups;
}

/**
 * Real-time client-side filter by session title.
 */
export function filterConversations(
  conversations: ConversationSummary[],
  query: string
): ConversationSummary[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return conversations;
  return conversations.filter((c) => c.title.toLowerCase().includes(trimmed));
}

// =============================================================================
// Main React Hook: useSocratesChat
// =============================================================================

export interface UseSocratesChatOptions {
  initialConversationId?: string | null;
  onConversationCreated?: (id: string) => void;
  onError?: (error: ChatError) => void;
}

export function useSocratesChat(options: UseSocratesChatOptions = {}) {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<ActiveStage | null>(null);
  const [error, setError] = useState<ChatError | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    options.initialConversationId || null
  );
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserPromptRef = useRef<string>("");

  // ---------------------------------------------------------------------------
  // 1. Fetch Conversations List
  // ---------------------------------------------------------------------------
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/socrates/conversations");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
      } else if (Array.isArray(data.conversations)) {
        setConversations(
          data.conversations.map((c: any) => ({
            id: c.id,
            title: c.title,
            pinned: Boolean(c.pinned),
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            messageCount: c.messageCount || 0,
            lastMessage: c.lastMessageSnippet || c.lastMessage || "",
          }))
        );
      }
    } catch {
      // Non-blocking background fetch failure
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ---------------------------------------------------------------------------
  // 2. Load Messages for Active Conversation
  // ---------------------------------------------------------------------------
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const res = await fetch(`/api/socrates/conversations/${conversationId}`);
      if (res.status === 404) {
        setError({ message: "Conversation not found", status: 404 });
        setMessages([]);
        return;
      }
      if (res.status === 403) {
        setError({ message: "Access denied to conversation", status: 403 });
        setMessages([]);
        return;
      }
      if (!res.ok) {
        throw new Error(`Failed to load messages (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            tokens: m.tokenCount || m.tokens,
            model: m.model,
          }))
        );
      }
    } catch (err: any) {
      setError({ message: err?.message || "Failed to load conversation history" });
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadConversationMessages]);

  // ---------------------------------------------------------------------------
  // 3. Check Colibri Health
  // ---------------------------------------------------------------------------
  const checkColibriHealth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/socrates/health");
      const data = await res.json();
      if (data.online) {
        setIsOffline(false);
        setError(null);
        return true;
      } else {
        setIsOffline(true);
        setError({
          message: data.message || "Colibri inference engine is currently offline.",
          code: "COLIBRI_OFFLINE",
          status: 503,
        });
        return false;
      }
    } catch {
      setIsOffline(true);
      setError({
        message: "Cannot connect to Socrates health service.",
        code: "HEALTH_CHECK_FAILED",
        status: 503,
      });
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 4. Send Message & Consume SSE Stream
  // ---------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (contentOverride?: string, contextQuestionId?: string) => {
      const promptToSend = (contentOverride !== undefined ? contentOverride : input).trim();
      if (!promptToSend) return;

      // Abort any active generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      lastUserPromptRef.current = promptToSend;
      setInput("");
      setError(null);
      setActiveStage(null);

      // Optimistic user message
      const tempUserMsgId = `user-${Date.now()}`;
      const userMsg: UIMessage = {
        id: tempUserMsgId,
        role: "user",
        content: promptToSend,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/socrates/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: promptToSend,
            conversationId: activeConversationId || undefined,
            contextQuestionId: contextQuestionId || undefined,
            stream: true,
          }),
          signal: controller.signal,
        });

        // Handle HTTP error responses (including 503 Transparent Offline)
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const classified = classifyChatError(response.status, errData);
          if (classified.isOffline) {
            setIsOffline(true);
          }
          const chatErr: ChatError = {
            message: classified.message,
            code: classified.code,
            status: classified.status,
          };
          setError(chatErr);
          options.onError?.(chatErr);
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        // If response is SSE
        if (!response.body) {
          throw new Error("No response body received from server");
        }

        setIsLoading(false);
        setIsStreaming(true);

        const tempAssistantId = `assistant-${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: tempAssistantId,
            role: "assistant",
            content: "",
            isStreaming: true,
            createdAt: new Date().toISOString(),
          },
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let streamBuffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const { remainingBuffer } = parseSSEStreamChunks(streamBuffer, chunkText, {
            onStage: (stage) => {
              setActiveStage(stage as any);
            },
            onToken: (delta) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantId
                    ? { ...m, content: m.content + delta, isStreaming: true }
                    : m
                )
              );
            },
            onDone: (doneData) => {
              if (doneData.conversationId && doneData.conversationId !== activeConversationId) {
                setActiveConversationId(doneData.conversationId);
                options.onConversationCreated?.(doneData.conversationId);
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantId
                    ? {
                        ...m,
                        id: doneData.messageId || m.id,
                        tokens: doneData.totalTokens,
                        isStreaming: false,
                      }
                    : m
                )
              );
              fetchConversations();
            },
            onError: (errData) => {
              if (errData.code === "COLIBRI_OFFLINE" || errData.status === 503) {
                setIsOffline(true);
              }
              setError({
                message: errData.error || "Streaming error encountered",
                code: errData.code,
                status: errData.status,
              });
            },
          });
          streamBuffer = remainingBuffer;
        }

        // Flush any trailing buffer
        if (streamBuffer.trim()) {
          parseSSEStreamChunks(streamBuffer, "\n\n", {
            onToken: (delta) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === tempAssistantId ? { ...m, content: m.content + delta } : m
                )
              );
            },
          });
        }

        // Mark completion
        setMessages((prev) =>
          prev.map((m) => (m.id === tempAssistantId ? { ...m, isStreaming: false } : m))
        );
      } catch (err: any) {
        if (err.name === "AbortError" || controller.signal.aborted) {
          // Graceful client stop: preserve partial content and mark non-streaming
          setMessages((prev) => applyStreamCancellation(prev).updatedMessages);
        } else {
          const fetchErr: ChatError = {
            message: err?.message || "Failed to send message",
            code: "NETWORK_ERROR",
          };
          setError(fetchErr);
          options.onError?.(fetchErr);
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setActiveStage(null);
        abortControllerRef.current = null;
      }
    },
    [input, activeConversationId, options, fetchConversations]
  );

  // ---------------------------------------------------------------------------
  // 5. Client Abort / Stop Generation
  // ---------------------------------------------------------------------------
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const { stateReset } = applyStreamCancellation([]);
    setIsStreaming(stateReset.isStreaming);
    setIsLoading(stateReset.isLoading);
    setActiveStage(stateReset.activeStage);
    setMessages((prev) => applyStreamCancellation(prev).updatedMessages);
  }, []);

  // ---------------------------------------------------------------------------
  // 6. Session Selection & New Dialectic
  // ---------------------------------------------------------------------------
  const selectConversation = useCallback(
    (id: string) => {
      if (isStreaming) {
        stopGeneration();
      }
      setActiveConversationId(id);
    },
    [isStreaming, stopGeneration]
  );

  const newConversation = useCallback(() => {
    if (isStreaming) {
      stopGeneration();
    }
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setActiveStage(null);
    setInput("");
  }, [isStreaming, stopGeneration]);

  // ---------------------------------------------------------------------------
  // 7. Session Actions: Rename, Toggle Pin, Delete, Bulk Clear
  // ---------------------------------------------------------------------------
  const renameConversation = useCallback(
    async (id: string, newTitle: string) => {
      const trimmed = newTitle.trim().slice(0, 150);
      if (!trimmed) return;

      const previous = conversations;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );

      try {
        const res = await fetch(`/api/socrates/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        });
        if (!res.ok) {
          setConversations(previous);
        }
      } catch {
        setConversations(previous);
      }
    },
    [conversations]
  );

  const togglePinConversation = useCallback(
    async (id: string, pinned: boolean) => {
      const previous = conversations;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned } : c))
      );

      try {
        const res = await fetch(`/api/socrates/conversations/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinned }),
        });
        if (!res.ok) {
          setConversations(previous);
        }
      } catch {
        setConversations(previous);
      }
    },
    [conversations]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      const previous = conversations;
      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }

      try {
        const res = await fetch(`/api/socrates/conversations/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setConversations(previous);
        }
      } catch {
        setConversations(previous);
      }
    },
    [conversations, activeConversationId]
  );

  const clearAllConversations = useCallback(async () => {
    const previous = conversations;
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);

    try {
      const res = await fetch("/api/socrates/conversations/clear", {
        method: "DELETE",
      });
      if (!res.ok) {
        setConversations(previous);
      }
    } catch {
      setConversations(previous);
    }
  }, [conversations]);

  const retryLastMessage = useCallback(() => {
    if (lastUserPromptRef.current) {
      sendMessage(lastUserPromptRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    isStreaming,
    activeStage,
    error,
    isOffline,
    activeConversationId,
    conversations,
    isLoadingHistory,
    sendMessage,
    stopGeneration,
    selectConversation,
    newConversation,
    renameConversation,
    togglePinConversation,
    deleteConversation,
    clearAllConversations,
    retryLastMessage,
    checkColibriHealth,
    refreshConversations: fetchConversations,
  };
}
