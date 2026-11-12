/**
 * Academic Knowledge Retrieval Engine (Non-Gating Enrichment)
 * File: src/lib/socrates/academicKnowledgeRetrieval.ts
 *
 * Principles:
 * 1. Non-Gating Pipeline: Enriches explanations when relevant, but NEVER gates general conversation
 *    or causes failures when no matching academic document is found (returns null context).
 * 2. 3-Stage Pipeline:
 *    - Stage 1: Intent & Keyword Extraction (detects explicit question IDs, strips stopwords, skips conversational greetings).
 *    - Stage 2: Prisma Multi-Field Search over 215 QuestionBankItems (topic, subtopic, questionText, tagsJson).
 *    - Stage 3: Token Overlap Relevance Scoring & Filtering (threshold >= 0.35).
 * 3. Strict CR Intelligence Isolation: Zero coupling to ML microservice (port 8000), gamified arena mechanics, or CR prompts.
 */

import { prisma } from "@/lib/db";

export interface AcademicContextResult {
  hasContext: boolean;
  topic?: string;
  subtopic?: string;
  subjectName?: string;
  subjectSlug?: string;
  difficulty?: string;
  bloomTaxonomy?: string;
  questionText?: string;
  codeSnippet?: string;
  explanation?: string;
  hint?: string;
  misconceptions?: string;
  referenceSource?: string;
  relevanceScore: number;
}

// -----------------------------------------------------------------------------
// Stopwords & Conversational Filter Constants
// -----------------------------------------------------------------------------
const STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
  "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
  "but", "by", "can", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
  "doing", "don't", "down", "during", "each", "explain", "few", "for", "from", "further", "had",
  "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
  "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd",
  "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
  "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
  "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "please", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "show",
  "so", "some", "such", "tell", "than", "that", "that's", "the", "their", "theirs", "them",
  "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
  "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when",
  "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
  "won't", "would", "wouldn't", "write", "you", "you'd", "you'll", "you're", "you've", "your",
  "yours", "yourself", "yourselves",
]);

const CONVERSATIONAL_GREETINGS = new Set([
  "hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening",
  "who are you", "what can you do", "help", "thank you", "thanks", "bye", "goodbye",
  "ok", "okay", "sure", "cool", "yes", "no",
]);

/**
 * Extracts searchable keywords from user input by filtering out punctuation and stopwords.
 */
export function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Checks whether a token appears in a field with word/token boundary precision,
 * preventing false substring matches (e.g., "select" matching "QuickSelect").
 */
function matchesTokenBoundary(field: string, token: string): boolean {
  if (!field || !token) return false;
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}s?\\b`, "i").test(field);
}

/**
 * Computes token-overlap relevance score between query tokens and an academic document.
 * Returns a normalized score between 0.0 and 1.0.
 */
export function calculateRelevance(
  queryTokens: string[],
  cleanQuery: string,
  item: {
    topic: string;
    subtopic?: string | null;
    questionText: string;
    tagsJson?: string | null;
    explanation?: string | null;
  }
): number {
  if (queryTokens.length === 0) return 0;

  const topicLower = (item.topic || "").toLowerCase();
  const subtopicLower = (item.subtopic || "").toLowerCase();
  const textLower = (item.questionText || "").toLowerCase();
  const tagsLower = (item.tagsJson || "").toLowerCase();
  const explanationLower = (item.explanation || "").toLowerCase();

  // Full-phrase match bonus (e.g. "binary search", "avl tree", "virtual memory")
  let exactPhraseBonus = 0;
  if (topicLower.length > 3 && cleanQuery.includes(topicLower)) {
    exactPhraseBonus += 0.5;
  }
  if (subtopicLower.length > 3 && cleanQuery.includes(subtopicLower)) {
    exactPhraseBonus += 0.3;
  }

  let matchedWeight = 0;
  let totalWeight = 0;

  for (const token of queryTokens) {
    totalWeight += 1.0;
    if (matchesTokenBoundary(topicLower, token)) {
      matchedWeight += 1.0; // High signal: matched in topic with token boundary
    } else if (matchesTokenBoundary(subtopicLower, token)) {
      matchedWeight += 0.8; // High signal: matched in subtopic with token boundary
    } else if (matchesTokenBoundary(tagsLower, token)) {
      matchedWeight += 0.7; // Tag match with token boundary
    } else if (textLower.includes(token)) {
      matchedWeight += 0.5; // Question text match
    } else if (explanationLower.includes(token)) {
      matchedWeight += 0.3; // Explanation match
    }
  }

  const tokenScore = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  const compositeScore = Math.min(1.0, tokenScore + exactPhraseBonus);

  return Math.round(compositeScore * 100) / 100;
}

/**
 * 3-Stage Non-Gating Academic Knowledge Retrieval Pipeline.
 *
 * Enriches the assistant with authoritative curriculum knowledge when a query matches
 * topics or explicit question IDs in the 215 QuestionBankItems.
 *
 * Non-Gating Guarantee:
 * - If no matching document is found, returns null without throwing or blocking.
 * - If a database error occurs, logs a warning and returns null safely.
 */
export async function retrieveAcademicContext(
  userQuery: string,
  explicitQuestionId?: string
): Promise<AcademicContextResult | null> {
  try {
    // -------------------------------------------------------------------------
    // Stage 1: Explicit Question ID Lookup (1.0 Relevance Score)
    // -------------------------------------------------------------------------
    if (explicitQuestionId) {
      try {
        const item = await prisma.questionBankItem.findUnique({
          where: { id: explicitQuestionId },
          include: { territorySubject: true },
        });

        if (item) {
          return {
            hasContext: true,
            topic: item.topic,
            subtopic: item.subtopic,
            subjectName: item.territorySubject?.name || item.subjectSlug,
            subjectSlug: item.subjectSlug,
            difficulty: item.difficulty,
            bloomTaxonomy: item.bloomTaxonomy,
            questionText: item.questionText,
            codeSnippet: item.codeSnippet || undefined,
            explanation: item.explanation,
            hint: item.hint || undefined,
            misconceptions: item.misconceptionExplanation || undefined,
            referenceSource: item.referenceSource || "Class Royale Curriculum",
            relevanceScore: 1.0,
          };
        }

        // Fallback to BankQuestion if questionBankItem is missing by ID
        const bq = await prisma.bankQuestion.findUnique({
          where: { id: explicitQuestionId },
          include: { subject: true },
        });

        if (bq) {
          return {
            hasContext: true,
            topic: bq.topic,
            subtopic: bq.subtopic,
            subjectName: bq.subject?.name,
            subjectSlug: bq.subject?.slug,
            difficulty: bq.difficulty,
            questionText: bq.questionText,
            codeSnippet: bq.codeSnippet || undefined,
            explanation: bq.explanation,
            hint: bq.hint || undefined,
            misconceptions: bq.misconceptionExplanation || undefined,
            referenceSource: bq.referenceSource || "Class Royale Bank",
            relevanceScore: 1.0,
          };
        }
      } catch (err) {
        console.warn("[Socrates Retrieval] Explicit ID lookup error:", err);
      }
    }

    // -------------------------------------------------------------------------
    // Stage 1B: Conversational Filter & Keyword Extraction
    // -------------------------------------------------------------------------
    const trimmed = userQuery.trim().toLowerCase();
    if (trimmed.length < 3 || CONVERSATIONAL_GREETINGS.has(trimmed)) {
      return null;
    }

    const keywords = extractKeywords(trimmed);
    if (keywords.length === 0) {
      return null;
    }

    // -------------------------------------------------------------------------
    // Stage 2: Prisma Multi-Field Search over 215 QuestionBankItems
    // -------------------------------------------------------------------------
    const searchConditions: Array<{
      topic?: { contains: string };
      subtopic?: { contains: string };
      questionText?: { contains: string };
      tagsJson?: { contains: string };
    }> = [];

    // Add query keyword terms
    for (const kw of keywords.slice(0, 5)) {
      searchConditions.push({ topic: { contains: kw } });
      searchConditions.push({ subtopic: { contains: kw } });
      searchConditions.push({ questionText: { contains: kw } });
      searchConditions.push({ tagsJson: { contains: kw } });
    }

    // Add candidate bigrams if query contains multiple keywords
    if (keywords.length >= 2) {
      for (let i = 0; i < Math.min(keywords.length - 1, 3); i++) {
        const bigram = `${keywords[i]} ${keywords[i + 1]}`;
        searchConditions.push({ topic: { contains: bigram } });
        searchConditions.push({ questionText: { contains: bigram } });
      }
    }

    const candidates = await prisma.questionBankItem.findMany({
      where: {
        status: { in: ["PUBLISHED", "VALIDATED", "NEEDS_REVIEW"] },
        OR: searchConditions,
      },
      include: { territorySubject: true },
      take: 10,
    });

    if (!candidates || candidates.length === 0) {
      return null;
    }

    // -------------------------------------------------------------------------
    // Stage 3: Relevance Scoring & Threshold Filtering
    // -------------------------------------------------------------------------
    let bestCandidate: any = null;
    let highestScore = 0;

    for (const candidate of candidates) {
      const score = calculateRelevance(keywords, trimmed, candidate);
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = candidate;
      }
    }

    // Relevance threshold: >= 0.35 required to attach grounding
    if (!bestCandidate || highestScore < 0.35) {
      return null;
    }

    return {
      hasContext: true,
      topic: bestCandidate.topic,
      subtopic: bestCandidate.subtopic,
      subjectName: bestCandidate.territorySubject?.name || bestCandidate.subjectSlug,
      subjectSlug: bestCandidate.subjectSlug,
      difficulty: bestCandidate.difficulty,
      bloomTaxonomy: bestCandidate.bloomTaxonomy,
      questionText: bestCandidate.questionText,
      codeSnippet: bestCandidate.codeSnippet || undefined,
      explanation: bestCandidate.explanation,
      hint: bestCandidate.hint || undefined,
      misconceptions: bestCandidate.misconceptionExplanation || undefined,
      referenceSource: bestCandidate.referenceSource || "Class Royale Curriculum",
      relevanceScore: highestScore,
    };
  } catch (err) {
    // Non-gating guarantee: database retrieval errors must NEVER throw or block conversation
    console.warn("[Socrates Retrieval] Non-gating retrieval error caught safely:", err);
    return null;
  }
}
