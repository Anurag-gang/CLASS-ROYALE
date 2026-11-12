/**
 * =============================================================================
 * KNOWLEDGE KINGDOM: Faculty Question Bank Management Service
 * Target: src/lib/questions/facultyQuestionService.ts
 *
 * Provides authoritative administrative CRUD, status transition workflows,
 * audit logging, stable UUID option generation, and version incrementing.
 * =============================================================================
 */

import { prisma } from "@/lib/db";
import crypto from "node:crypto";

export type QuestionValidationStatus =
  | "DRAFT"
  | "NEEDS_REVIEW"
  | "VALIDATED"
  | "PUBLISHED"
  | "ARCHIVED";

export const VALID_STATUSES: readonly QuestionValidationStatus[] = [
  "DRAFT",
  "NEEDS_REVIEW",
  "VALIDATED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

export const LEGAL_STATUS_TRANSITIONS: Record<
  QuestionValidationStatus,
  QuestionValidationStatus[]
> = {
  DRAFT: ["NEEDS_REVIEW", "VALIDATED", "ARCHIVED"],
  NEEDS_REVIEW: ["VALIDATED", "DRAFT", "ARCHIVED"],
  VALIDATED: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "NEEDS_REVIEW"],
  ARCHIVED: ["DRAFT"],
};

export function canTransitionStatus(
  from: QuestionValidationStatus,
  to: QuestionValidationStatus
): boolean {
  if (from === to) return true;
  return LEGAL_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface QuestionOptionDTO {
  id: string; // Stable UUID: "opt_..."
  text: string;
}

export interface FacultyQuestionFilters {
  realmSlug?: string;
  levelNumber?: number;
  status?: QuestionValidationStatus | "ALL";
  difficulty?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "levelNumber" | "difficulty";
  sortOrder?: "asc" | "desc";
}

export interface CreateQuestionDraftInput {
  subjectSlug: string;
  levelNumber?: number;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  bloomTaxonomy?: string;
  questionText: string;
  codeSnippet?: string | null;
  questionType?: string;
  options: Array<{ id?: string; text: string }>;
  correctOptionIds: string[]; // Stable option IDs matching options
  academicPoints?: number;
  xpReward?: number;
  timeLimitSeconds?: number;
  explanation: string;
  hint?: string | null;
  misconceptions?: Record<string, string>; // map of optionId -> misconception explanation
  misconceptionExplanation?: string | null;
  referenceSource?: string | null;
  tags?: string[];
  status?: QuestionValidationStatus;
}

export interface UpdateQuestionInput {
  subjectSlug?: string;
  levelNumber?: number;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  bloomTaxonomy?: string;
  questionText?: string;
  codeSnippet?: string | null;
  questionType?: string;
  options?: Array<{ id: string; text: string }>;
  correctOptionIds?: string[];
  academicPoints?: number;
  xpReward?: number;
  timeLimitSeconds?: number;
  explanation?: string;
  hint?: string | null;
  misconceptions?: Record<string, string>;
  misconceptionExplanation?: string | null;
  referenceSource?: string | null;
  tags?: string[];
  reason?: string;
}

export interface AuditLogRecord {
  id: string;
  questionId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorRole?: string | null;
  action: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface FormattedFacultyQuestion {
  id: string;
  subjectSlug: string;
  levelNumber: number;
  topic: string;
  subtopic: string;
  difficulty: string;
  bloomTaxonomy: string;
  questionText: string;
  codeSnippet: string | null;
  questionType: string;
  options: QuestionOptionDTO[];
  correctOptionIds: string[];
  academicPoints: number;
  xpReward: number;
  timeLimitSeconds: number;
  explanation: string;
  hint: string | null;
  misconceptions: Record<string, string>;
  misconceptionExplanation: string | null;
  referenceSource: string | null;
  tags: string[];
  status: QuestionValidationStatus;
  quarantineReason: string | null;
  version: number;
  isLatest: boolean;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  auditLogs?: AuditLogRecord[];
}

/**
 * Generate stable option UUIDs if not supplied
 */
export function ensureStableOptionIds(
  options: Array<{ id?: string; text: string }>
): QuestionOptionDTO[] {
  return options.map((opt) => ({
    id:
      opt.id && opt.id.trim() !== ""
        ? opt.id
        : `opt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    text: opt.text.trim(),
  }));
}

/**
 * 1. List questions with filtering, search, and pagination
 */
export async function listFacultyQuestions(filters: FacultyQuestionFilters = {}) {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (filters.realmSlug) {
    whereClause.subjectSlug = filters.realmSlug;
  }
  if (filters.levelNumber !== undefined && filters.levelNumber !== null) {
    whereClause.levelNumber = Number(filters.levelNumber);
  }
  if (filters.status && filters.status !== "ALL") {
    whereClause.status = filters.status;
  }
  if (filters.difficulty) {
    whereClause.difficulty = filters.difficulty;
  }
  if (filters.search && filters.search.trim() !== "") {
    const term = filters.search.trim();
    whereClause.OR = [
      { questionText: { contains: term } },
      { topic: { contains: term } },
      { subtopic: { contains: term } },
    ];
  }

  // Check if QuestionBankItem model exists in Prisma
  const hasQuestionBankItem = "questionBankItem" in prisma;

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const [total, items] = await Promise.all([
      model.count({ where: whereClause }),
      model.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [filters.sortBy || "updatedAt"]: filters.sortOrder || "desc" },
      }),
    ]);

    const formatted: FormattedFacultyQuestion[] = items.map((q: any) =>
      formatQuestionRecord(q)
    );

    return {
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      filters,
    };
  }

  // Fallback to BankQuestion table if QuestionBankItem migration is pending
  const bankWhere: any = {};
  if (filters.status && filters.status !== "ALL") {
    bankWhere.validationStatus = filters.status;
  }
  if (filters.levelNumber) {
    bankWhere.levelNumber = Number(filters.levelNumber);
  }
  if (filters.search) {
    bankWhere.questionText = { contains: filters.search.trim() };
  }

  const [total, bankItems] = await Promise.all([
    prisma.bankQuestion.count({ where: bankWhere }),
    prisma.bankQuestion.findMany({
      where: bankWhere,
      skip,
      take: limit,
      include: { subject: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const fallbackFormatted = bankItems.map((q) => formatBankQuestionRecord(q));

  return {
    success: true,
    data: fallbackFormatted,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    filters,
  };
}

/**
 * 2. Create Question Draft
 */
export async function createFacultyQuestionDraft(
  input: CreateQuestionDraftInput,
  actorId?: string,
  ipAddress?: string
): Promise<FormattedFacultyQuestion> {
  const options = ensureStableOptionIds(input.options);

  if (options.length < 2) {
    throw new Error("Questions must contain at least 2 options");
  }

  const validOptionIds = new Set(options.map((o) => o.id));
  const validCorrectIds = input.correctOptionIds.filter((id) => validOptionIds.has(id));

  if (validCorrectIds.length === 0) {
    throw new Error("At least one valid correct option ID must be designated");
  }

  const hasQuestionBankItem = "questionBankItem" in prisma;
  const newId = crypto.randomUUID();

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const initialStatus = input.status || "DRAFT";

    const created = await model.create({
      data: {
        id: newId,
        subjectSlug: input.subjectSlug,
        levelNumber: input.levelNumber || 1,
        topic: input.topic || "Core Concepts",
        subtopic: input.subtopic || "Fundamentals",
        difficulty: input.difficulty || "Medium",
        bloomTaxonomy: input.bloomTaxonomy || "UNDERSTAND",
        questionText: input.questionText.trim(),
        codeSnippet: input.codeSnippet || null,
        questionType: input.questionType || "SINGLE_MCQ",
        optionsJson: JSON.stringify(options),
        correctOptionIdsJson: JSON.stringify(validCorrectIds),
        primaryCorrectOptionId: validCorrectIds[0] || null,
        academicPoints: input.academicPoints || 1,
        xpReward: input.xpReward || 50,
        timeLimitSeconds: input.timeLimitSeconds || 35,
        explanation: input.explanation.trim(),
        hint: input.hint || null,
        misconceptionsJson: input.misconceptions
          ? JSON.stringify(input.misconceptions)
          : null,
        misconceptionExplanation: input.misconceptionExplanation || null,
        referenceSource: input.referenceSource || null,
        tagsJson: JSON.stringify(input.tags || []),
        status: initialStatus,
        version: 1,
        isLatest: true,
        authorId: actorId || null,
      },
    });

    // Record audit log
    await recordQuestionAudit({
      questionId: newId,
      actorId,
      action: "CREATE",
      newState: JSON.stringify(formatQuestionRecord(created)),
      reason: "Initial question draft creation",
      ipAddress,
    });

    return formatQuestionRecord(created);
  }

  // Fallback: BankQuestion
  const createdBank = await prisma.bankQuestion.create({
    data: {
      id: newId,
      subjectId: input.subjectSlug,
      questionText: input.questionText.trim(),
      codeSnippet: input.codeSnippet || null,
      optionsJson: JSON.stringify(options),
      correctOptionId: validCorrectIds[0] || "A",
      difficulty: input.difficulty || "Medium",
      xpReward: input.xpReward || 50,
      timeLimitSeconds: input.timeLimitSeconds || 35,
      explanation: input.explanation.trim(),
      hint: input.hint || null,
      misconceptionExplanation: input.misconceptionExplanation || null,
      referenceSource: input.referenceSource || null,
      topic: input.topic || "Core Concepts",
      subtopic: input.subtopic || "Fundamentals",
      levelNumber: input.levelNumber || 1,
      validationStatus: input.status || "DRAFT",
      version: 1,
      questionType: input.questionType || "SINGLE_MCQ",
      tagsJson: JSON.stringify(input.tags || []),
    },
  });

  return formatBankQuestionRecord(createdBank);
}

/**
 * 3. Get single question with full audit history
 */
export async function getFacultyQuestionById(
  questionId: string
): Promise<FormattedFacultyQuestion | null> {
  const hasQuestionBankItem = "questionBankItem" in prisma;

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const item = await model.findUnique({
      where: { id: questionId },
      include: {
        auditLogs: {
          include: {
            actor: {
              select: {
                id: true,
                username: true,
                role: true,
                profile: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!item) return null;
    return formatQuestionRecord(item);
  }

  const bankItem = await prisma.bankQuestion.findUnique({
    where: { id: questionId },
    include: { subject: true },
  });

  if (!bankItem) return null;
  return formatBankQuestionRecord(bankItem);
}

/**
 * 4. Update Question (increments version, logs audit diff)
 */
export async function updateFacultyQuestion(
  questionId: string,
  input: UpdateQuestionInput,
  actorId?: string,
  ipAddress?: string
): Promise<FormattedFacultyQuestion> {
  const existing = await getFacultyQuestionById(questionId);
  if (!existing) {
    throw new Error(`Question ${questionId} not found`);
  }

  const hasQuestionBankItem = "questionBankItem" in prisma;

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const nextVersion = existing.version + 1;

    let updatedOptions = existing.options;
    if (input.options) {
      updatedOptions = ensureStableOptionIds(input.options);
    }

    let updatedCorrectOptionIds = existing.correctOptionIds;
    if (input.correctOptionIds) {
      const validIds = new Set(updatedOptions.map((o) => o.id));
      updatedCorrectOptionIds = input.correctOptionIds.filter((id) => validIds.has(id));
      if (updatedCorrectOptionIds.length === 0) {
        throw new Error("At least one valid correct option ID must be designated");
      }
    }

    const updated = await model.update({
      where: { id: questionId },
      data: {
        subjectSlug: input.subjectSlug ?? existing.subjectSlug,
        levelNumber: input.levelNumber ?? existing.levelNumber,
        topic: input.topic ?? existing.topic,
        subtopic: input.subtopic ?? existing.subtopic,
        difficulty: input.difficulty ?? existing.difficulty,
        bloomTaxonomy: input.bloomTaxonomy ?? existing.bloomTaxonomy,
        questionText:
          input.questionText !== undefined ? input.questionText.trim() : existing.questionText,
        codeSnippet: input.codeSnippet !== undefined ? input.codeSnippet : existing.codeSnippet,
        questionType: input.questionType ?? existing.questionType,
        optionsJson: JSON.stringify(updatedOptions),
        correctOptionIdsJson: JSON.stringify(updatedCorrectOptionIds),
        primaryCorrectOptionId: updatedCorrectOptionIds[0] || null,
        academicPoints: input.academicPoints ?? existing.academicPoints,
        xpReward: input.xpReward ?? existing.xpReward,
        timeLimitSeconds: input.timeLimitSeconds ?? existing.timeLimitSeconds,
        explanation:
          input.explanation !== undefined ? input.explanation.trim() : existing.explanation,
        hint: input.hint !== undefined ? input.hint : existing.hint,
        misconceptionsJson:
          input.misconceptions !== undefined
            ? JSON.stringify(input.misconceptions)
            : JSON.stringify(existing.misconceptions),
        misconceptionExplanation:
          input.misconceptionExplanation !== undefined
            ? input.misconceptionExplanation
            : existing.misconceptionExplanation,
        referenceSource:
          input.referenceSource !== undefined
            ? input.referenceSource
            : existing.referenceSource,
        tagsJson: input.tags ? JSON.stringify(input.tags) : JSON.stringify(existing.tags),
        version: nextVersion,
      },
    });

    const formatted = formatQuestionRecord(updated);

    await recordQuestionAudit({
      questionId,
      actorId,
      action: "UPDATE",
      previousState: JSON.stringify(existing),
      newState: JSON.stringify(formatted),
      reason: input.reason || `Updated to version ${nextVersion}`,
      ipAddress,
    });

    return formatted;
  }

  // Fallback: BankQuestion
  const updatedBank = await prisma.bankQuestion.update({
    where: { id: questionId },
    data: {
      questionText: input.questionText ?? existing.questionText,
      explanation: input.explanation ?? existing.explanation,
      version: { increment: 1 },
    },
  });

  return formatBankQuestionRecord(updatedBank);
}

/**
 * 5. Soft-Delete (Archive) Question
 */
export async function archiveFacultyQuestion(
  questionId: string,
  reason: string = "Archived by faculty",
  actorId?: string,
  ipAddress?: string
): Promise<FormattedFacultyQuestion> {
  const existing = await getFacultyQuestionById(questionId);
  if (!existing) {
    throw new Error(`Question ${questionId} not found`);
  }

  const hasQuestionBankItem = "questionBankItem" in prisma;

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const updated = await model.update({
      where: { id: questionId },
      data: {
        status: "ARCHIVED",
      },
    });

    const formatted = formatQuestionRecord(updated);

    await recordQuestionAudit({
      questionId,
      actorId,
      action: "ARCHIVE",
      previousState: JSON.stringify(existing),
      newState: JSON.stringify(formatted),
      reason,
      ipAddress,
    });

    return formatted;
  }

  const updatedBank = await prisma.bankQuestion.update({
    where: { id: questionId },
    data: { validationStatus: "ARCHIVED" },
  });

  return formatBankQuestionRecord(updatedBank);
}

/**
 * 6. Get Flagged Questions (status === 'NEEDS_REVIEW')
 */
export async function getFlaggedQuestions(page = 1, limit = 50) {
  return listFacultyQuestions({
    status: "NEEDS_REVIEW",
    page,
    limit,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
}

/**
 * 7. Review Question (approve to VALIDATED or reject back to DRAFT)
 */
export async function reviewFacultyQuestion(
  questionId: string,
  decision: "APPROVE" | "REJECT",
  reviewNotes: string,
  actorId?: string,
  ipAddress?: string
): Promise<FormattedFacultyQuestion> {
  const existing = await getFacultyQuestionById(questionId);
  if (!existing) {
    throw new Error(`Question ${questionId} not found`);
  }

  const targetStatus: QuestionValidationStatus =
    decision === "APPROVE" ? "VALIDATED" : "DRAFT";

  const hasQuestionBankItem = "questionBankItem" in prisma;

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const updated = await model.update({
      where: { id: questionId },
      data: {
        status: targetStatus,
        quarantineReason: decision === "APPROVE" ? null : existing.quarantineReason,
      },
    });

    const formatted = formatQuestionRecord(updated);

    await recordQuestionAudit({
      questionId,
      actorId,
      action: decision === "APPROVE" ? "REVIEW_APPROVE" : "REVIEW_REJECT",
      previousState: JSON.stringify(existing),
      newState: JSON.stringify(formatted),
      reason: reviewNotes || `Decision: ${decision}`,
      ipAddress,
    });

    return formatted;
  }

  const updatedBank = await prisma.bankQuestion.update({
    where: { id: questionId },
    data: { validationStatus: targetStatus },
  });

  return formatBankQuestionRecord(updatedBank);
}

/**
 * 8. Publish Question (transitions from VALIDATED to PUBLISHED)
 */
export async function publishFacultyQuestion(
  questionId: string,
  actorId?: string,
  ipAddress?: string
): Promise<FormattedFacultyQuestion> {
  const existing = await getFacultyQuestionById(questionId);
  if (!existing) {
    throw new Error(`Question ${questionId} not found`);
  }

  if (existing.status !== "VALIDATED") {
    throw new Error(
      `Cannot publish question with status '${existing.status}'. Question must be 'VALIDATED' before publishing.`
    );
  }

  const hasQuestionBankItem = "questionBankItem" in prisma;

  if (hasQuestionBankItem) {
    const model = (prisma as any).questionBankItem;
    const updated = await model.update({
      where: { id: questionId },
      data: {
        status: "PUBLISHED",
      },
    });

    const formatted = formatQuestionRecord(updated);

    await recordQuestionAudit({
      questionId,
      actorId,
      action: "PUBLISH",
      previousState: JSON.stringify(existing),
      newState: JSON.stringify(formatted),
      reason: "Promoted to PUBLISHED status for quiz delivery",
      ipAddress,
    });

    return formatted;
  }

  const updatedBank = await prisma.bankQuestion.update({
    where: { id: questionId },
    data: { validationStatus: "PUBLISHED" },
  });

  return formatBankQuestionRecord(updatedBank);
}

/**
 * Helper to write QuestionAuditLog
 */
async function recordQuestionAudit(params: {
  questionId: string;
  actorId?: string | null;
  action: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  ipAddress?: string | null;
}) {
  try {
    if ("questionAuditLog" in prisma) {
      await (prisma as any).questionAuditLog.create({
        data: {
          questionId: params.questionId,
          actorId: params.actorId || null,
          action: params.action,
          previousState: params.previousState || null,
          newState: params.newState || null,
          reason: params.reason || null,
          ipAddress: params.ipAddress || null,
        },
      });
    } else if ("auditLog" in (prisma as any)) {
      await (prisma as any).auditLog.create({
        data: {
          actorId: params.actorId || null,
          action: `QUESTION_${params.action}`,
          targetType: "QuestionBankItem",
          targetId: params.questionId,
          metadataJson: JSON.stringify({
            previousState: params.previousState,
            newState: params.newState,
            reason: params.reason,
          }),
          ipAddress: params.ipAddress || null,
        },
      });
    }
  } catch (err) {
    console.warn("Failed to write question audit log:", err);
  }
}

function safeJsonParse<T>(jsonStr: string | null | undefined, fallback: T): T {
  if (!jsonStr) return fallback;
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}

function formatQuestionRecord(q: any): FormattedFacultyQuestion {
  return {
    id: q.id,
    subjectSlug: q.subjectSlug,
    levelNumber: q.levelNumber,
    topic: q.topic,
    subtopic: q.subtopic,
    difficulty: q.difficulty,
    bloomTaxonomy: q.bloomTaxonomy,
    questionText: q.questionText,
    codeSnippet: q.codeSnippet,
    questionType: q.questionType,
    options: safeJsonParse<QuestionOptionDTO[]>(q.optionsJson, []),
    correctOptionIds: safeJsonParse<string[]>(q.correctOptionIdsJson, []),
    academicPoints: q.academicPoints,
    xpReward: q.xpReward,
    timeLimitSeconds: q.timeLimitSeconds,
    explanation: q.explanation,
    hint: q.hint,
    misconceptions: safeJsonParse<Record<string, string>>(q.misconceptionsJson, {}),
    misconceptionExplanation: q.misconceptionExplanation,
    referenceSource: q.referenceSource,
    tags: safeJsonParse<string[]>(q.tagsJson, []),
    status: q.status,
    quarantineReason: q.quarantineReason,
    version: q.version,
    isLatest: q.isLatest,
    authorId: q.authorId,
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
    updatedAt: q.updatedAt instanceof Date ? q.updatedAt.toISOString() : q.updatedAt,
    auditLogs: q.auditLogs
      ? q.auditLogs.map((log: any) => ({
          id: log.id,
          questionId: log.questionId,
          actorId: log.actorId,
          actorName: log.actor?.profile?.name || log.actor?.username || null,
          actorRole: log.actor?.role || null,
          action: log.action,
          previousState: log.previousState,
          newState: log.newState,
          reason: log.reason,
          ipAddress: log.ipAddress,
          createdAt:
            log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
        }))
      : undefined,
  };
}

function formatBankQuestionRecord(q: any): FormattedFacultyQuestion {
  const parsedOptions = safeJsonParse<QuestionOptionDTO[]>(q.optionsJson, []);
  return {
    id: q.id,
    subjectSlug: q.subject?.slug || q.subjectId || "data-structures-and-algorithms",
    levelNumber: q.levelNumber || 1,
    topic: q.topic || "Core Concepts",
    subtopic: q.subtopic || "Fundamentals",
    difficulty: q.difficulty || "Medium",
    bloomTaxonomy: "UNDERSTAND",
    questionText: q.questionText,
    codeSnippet: q.codeSnippet,
    questionType: q.questionType || "SINGLE_MCQ",
    options: parsedOptions,
    correctOptionIds: [q.correctOptionId],
    academicPoints: 1,
    xpReward: q.xpReward,
    timeLimitSeconds: q.timeLimitSeconds || 35,
    explanation: q.explanation,
    hint: q.hint,
    misconceptions: {},
    misconceptionExplanation: q.misconceptionExplanation,
    referenceSource: q.referenceSource,
    tags: safeJsonParse<string[]>(q.tagsJson, []),
    status: (q.validationStatus as QuestionValidationStatus) || "VALIDATED",
    quarantineReason: null,
    version: q.version || 1,
    isLatest: true,
    authorId: null,
    createdAt: q.createdAt instanceof Date ? q.createdAt.toISOString() : q.createdAt,
    updatedAt: q.updatedAt instanceof Date ? q.updatedAt.toISOString() : q.updatedAt,
  };
}
