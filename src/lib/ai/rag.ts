import { prisma } from "@/lib/db";

export interface RetrievedDocument {
  id: string;
  courseTitle: string;
  sourceType: "lesson" | "assignment" | "syllabus" | "question";
  title: string;
  content: string;
  relevanceScore?: number;
}

export interface RAGRetriever {
  retrieve(userId: string, query: string, courseId?: string, limit?: number): Promise<RetrievedDocument[]>;
}

/**
 * Default Course Material Retriever:
 * Searches lessons and course content strictly scoped to the student's enrolled courses.
 * Prevents data leakage across unauthorized courses while grounding CR answers in verified curriculum.
 */
export class EnrolledCourseMaterialRetriever implements RAGRetriever {
  public async retrieve(
    userId: string,
    query: string,
    courseId?: string,
    limit: number = 3
  ): Promise<RetrievedDocument[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();
    const keywords = cleanQuery
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    try {
      // 1. Fetch user's enrolled course IDs
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: userId },
        select: { courseId: true },
      });

      const allowedCourseIds = enrollments.map((e) => e.courseId);

      // If filtering by specific course, ensure user is enrolled
      const targetCourseIds = courseId
        ? allowedCourseIds.filter((id) => id === courseId)
        : allowedCourseIds;

      if (targetCourseIds.length === 0) {
        return [];
      }

      // 2. Search Lessons in enrolled courses
      const lessons = await prisma.lesson.findMany({
        where: {
          courseId: { in: targetCourseIds },
          OR: [
            { title: { contains: cleanQuery } },
            { content: { contains: cleanQuery } },
            { description: { contains: cleanQuery } },
            ...keywords.map((kw) => ({ title: { contains: kw } })),
            ...keywords.map((kw) => ({ content: { contains: kw } })),
          ],
        },
        include: {
          course: { select: { title: true } },
        },
        take: limit,
      });

      const docs: RetrievedDocument[] = lessons.map((l) => ({
        id: l.id,
        courseTitle: l.course.title,
        sourceType: "lesson",
        title: l.title,
        content: l.content || l.description || "",
        relevanceScore: 0.85,
      }));

      return docs;
    } catch (error) {
      console.warn("[RAG] Course material retrieval failed:", error);
      return [];
    }
  }
}

export const defaultRAGRetriever = new EnrolledCourseMaterialRetriever();

/**
 * Format retrieved documents into an LLM-friendly context injection string
 */
export function formatRAGContext(docs: RetrievedDocument[]): string {
  if (!docs || docs.length === 0) return "";

  return `\nRELEVANT COURSE SYLLABUS & LESSON MATERIALS:\n` +
    docs
      .map(
        (d, idx) =>
          `[Source ${idx + 1}: ${d.courseTitle} - "${d.title}"]\n${d.content.slice(0, 400)}`
      )
      .join("\n\n") +
    `\n\nDirectives: Use the above verified course material to ground your explanation when applicable. If explaining outside this scope, make it clear.`;
}
