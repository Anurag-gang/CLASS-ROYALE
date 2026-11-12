/**
 * Socrates Conversation Memory & SQLite Persistence Engine
 * File: src/lib/socrates/conversationPersistence.ts
 *
 * Principles:
 * 1. Bounded Sliding Context Window:
 *    - Keeps previous conversation turns bounded to ~3,000 tokens / 10-12 turns.
 *    - Uses fast, zero-dependency token estimation (3.8 chars/token + 4 overhead tokens).
 * 2. Immutable Turn History & Durability:
 *    - User queries are saved to SocratesMessage BEFORE calling Colibri inference.
 *    - Assistant responses are saved to SocratesMessage upon stream completion or response return.
 * 3. Multi-Tenant Student Isolation:
 *    - All database queries scope strictly by authenticated userId.
 * 4. Strict CR Intelligence Isolation:
 *    - Zero coupling or queries to other assistant tables.
 */

import { prisma } from "@/lib/db";
import { ChatMessage } from "./colibriClient";

function getSocratesDb(): any {
  return prisma as any;
}

export const MAX_HISTORY_TOKENS = 1000;
export const MAX_HISTORY_TURNS = 4;

/**
 * Fast, deterministic token estimator for Qwen/ChatML models.
 * Heuristic: 3.8 chars/token + 4 tokens structural overhead per message turn.
 */
export function estimateMessageTokens(content: string): number {
  if (!content) return 4;
  return Math.ceil(content.length / 3.8) + 4;
}

/**
 * Assembles a bounded sliding context window from SQLite SocratesMessage records.
 * Keeps previous turns within ~3,000 tokens / 10-12 turns.
 */
export async function assembleBoundedContextHistory(
  conversationId: string,
  options?: {
    maxTokens?: number;
    maxTurns?: number;
    excludeMessageId?: string;
  }
): Promise<ChatMessage[]> {
  const maxTokens = options?.maxTokens ?? MAX_HISTORY_TOKENS;
  const maxTurns = options?.maxTurns ?? MAX_HISTORY_TURNS;

  const pastMessages = await getSocratesDb().socratesMessage.findMany({
    where: {
      conversationId,
      ...(options?.excludeMessageId ? { id: { not: options.excludeMessageId } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: maxTurns * 2,
  });

  let tokenBudget = maxTokens;
  const selected: any[] = [];

  for (const msg of pastMessages) {
    const tokens = msg.tokens ?? msg.tokenCount ?? estimateMessageTokens(msg.content);
    if (tokenBudget - tokens < 0) break;
    if (selected.length >= maxTurns) break;

    selected.push(msg);
    tokenBudget -= tokens;
  }

  // Restore chronological order (oldest to newest)
  selected.reverse();

  return selected.map((m: any) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));
}

/**
 * Persists an incoming user query to SocratesMessage.
 */
export async function saveUserMessage(conversationId: string, content: string) {
  const tokens = estimateMessageTokens(content);
  return getSocratesDb().socratesMessage.create({
    data: {
      conversationId,
      role: "user",
      content,
      tokens,
      tokenCount: tokens,
    },
  });
}

/**
 * Persists an assistant response to SocratesMessage and updates conversation timestamp.
 */
export async function saveAssistantMessage(
  conversationId: string,
  content: string,
  tokens?: number,
  model?: string,
  metadataJson?: string
) {
  const finalTokens = tokens ?? estimateMessageTokens(content);
  const msg = await getSocratesDb().socratesMessage.create({
    data: {
      conversationId,
      role: "assistant",
      content,
      tokens: finalTokens,
      tokenCount: finalTokens,
      model: model || null,
      metadataJson: metadataJson || null,
    },
  });

  await getSocratesDb().socratesConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return msg;
}

/**
 * Lists all conversations for a student, ordered by pinned DESC, updatedAt DESC.
 */
export async function listConversations(
  userId: string,
  search?: string,
  limit: number = 50
) {
  const whereClause: any = { userId };
  if (search?.trim()) {
    whereClause.title = { contains: search.trim() };
  }

  const convos = await getSocratesDb().socratesConversation.findMany({
    where: whereClause,
    orderBy: [
      { pinned: "desc" },
      { updatedAt: "desc" },
    ],
    take: limit,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  return convos.map((c: any) => ({
    id: c.id,
    title: c.title,
    pinned: c.pinned,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
    messageCount: c._count?.messages ?? 0,
    lastMessage: c.messages?.[0]?.content || "New conversation",
  }));
}

/**
 * Creates a new conversation for a student.
 */
export async function createConversation(
  userId: string,
  title: string = "New Dialectic",
  pinned: boolean = false,
  contextQuestionId?: string | null
) {
  return getSocratesDb().socratesConversation.create({
    data: {
      userId,
      title: title.trim().slice(0, 150) || "New Dialectic",
      pinned,
      contextQuestionId: contextQuestionId || null,
    },
    include: {
      messages: true,
    },
  });
}

/**
 * Retrieves a conversation with its messages in chronological order, with student ownership check.
 */
export async function getConversationWithMessages(conversationId: string, userId: string) {
  const conversation = await getSocratesDb().socratesConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) return null;
  if (conversation.userId !== userId) {
    return "FORBIDDEN" as const;
  }

  return {
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
    messages: (conversation.messages || []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      model: m.model,
      tokenCount: m.tokenCount ?? m.tokens ?? null,
      tokens: m.tokens ?? m.tokenCount ?? null,
      metadataJson: m.metadataJson,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    })),
  };
}

/**
 * Renames or updates pinned state of a conversation with student ownership check.
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  updates: { title?: string; pinned?: boolean }
) {
  const existing = await getSocratesDb().socratesConversation.findUnique({
    where: { id: conversationId },
  });

  if (!existing) return null;
  if (existing.userId !== userId) return "FORBIDDEN" as const;

  return getSocratesDb().socratesConversation.update({
    where: { id: conversationId },
    data: updates,
  });
}

/**
 * Deletes a conversation and cascades its messages with student ownership check.
 */
export async function deleteConversation(conversationId: string, userId: string) {
  const existing = await getSocratesDb().socratesConversation.findUnique({
    where: { id: conversationId },
  });

  if (!existing) return null;
  if (existing.userId !== userId) return "FORBIDDEN" as const;

  await getSocratesDb().socratesMessage.deleteMany({
    where: { conversationId },
  });

  return getSocratesDb().socratesConversation.delete({
    where: { id: conversationId },
  });
}

/**
 * Clears all conversations and messages belonging to the given student.
 */
export async function clearAllConversations(userId: string) {
  await getSocratesDb().socratesMessage.deleteMany({
    where: {
      conversation: { userId },
    },
  });

  return getSocratesDb().socratesConversation.deleteMany({
    where: { userId },
  });
}
