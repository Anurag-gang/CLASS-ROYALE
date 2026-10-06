import { prisma } from "@/lib/db";
import { recordAuditLog } from "@/lib/audit";
import { getAIProvider } from "./provider";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (userId: string, args: any) => Promise<any>;
}

export const CR_TOOLS_REGISTRY: Record<string, ToolDefinition> = {
  get_student_profile: {
    name: "get_student_profile",
    description: "Fetch student profile, level, streak, XP, and rank.",
    parameters: { type: "object", properties: {} },
    execute: async (userId: string) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      });
      return user?.profile || null;
    },
  },

  get_topic_mastery: {
    name: "get_topic_mastery",
    description: "Retrieve topic mastery levels and identified weak areas for the student.",
    parameters: { type: "object", properties: {} },
    execute: async (userId: string) => {
      return prisma.topicMastery.findMany({
        where: { studentId: userId },
        orderBy: { accuracy: "asc" },
      });
    },
  },

  get_quiz_history: {
    name: "get_quiz_history",
    description: "Fetch recent quiz battle scores and performance attempts.",
    parameters: { type: "object", properties: { limit: { type: "number", default: 5 } } },
    execute: async (userId: string, args: { limit?: number }) => {
      return prisma.cRQuiz.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: args.limit || 5,
        include: { questions: true },
      });
    },
  },

  generate_quiz: {
    name: "generate_quiz",
    description: "Synthesize an adaptive battle quiz on a specific academic topic.",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string" },
        difficulty: { type: "number", default: 3 },
        questionCount: { type: "number", default: 5 },
      },
      required: ["topic"],
    },
    execute: async (userId: string, args: { topic: string; difficulty?: number; questionCount?: number }) => {
      const provider = getAIProvider();
      const questions = await provider.generateQuiz({
        topic: args.topic,
        difficulty: args.difficulty || 3,
        questionCount: args.questionCount || 5,
      });

      // Persist to CRQuiz in database
      const quiz = await prisma.cRQuiz.create({
        data: {
          userId,
          title: `Battle Quiz: ${args.topic}`,
          topic: args.topic,
          difficulty: `Level ${args.difficulty || 3}`,
          totalQuestions: questions.length,
          questions: {
            create: questions.map((q, idx) => ({
              question: q.question,
              optionsJson: JSON.stringify(q.options),
              answerIndex: q.answerIndex ?? 0,
              explanation: q.explanation,
              subtopic: q.subtopic || "Core Concept",
              order: idx + 1,
            })),
          },
        },
        include: { questions: true },
      });

      await recordAuditLog({
        actorId: userId,
        action: "CR_QUIZ_GENERATED",
        targetType: "CRQuiz",
        targetId: quiz.id,
        metadata: { topic: args.topic, questionsCount: questions.length },
      });

      return {
        quizId: quiz.id,
        title: quiz.title,
        topic: quiz.topic,
        questions: questions.map((q, i) => ({
          ...q,
          id: quiz.questions[i]?.id,
        })),
      };
    },
  },

  create_study_plan: {
    name: "create_study_plan",
    description: "Generate and store a structured study plan for an academic exam or subject.",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string" },
        examDate: { type: "string" },
      },
      required: ["subject"],
    },
    execute: async (userId: string, args: { subject: string; examDate?: string }) => {
      const provider = getAIProvider();
      const plan = await provider.generateStudyPlan({
        subject: args.subject,
        examDate: args.examDate,
      });

      const saved = await prisma.cRStudyPlan.create({
        data: {
          userId,
          subject: plan.subject,
          targetDate: plan.targetDate,
          planJson: JSON.stringify(plan.schedule),
        },
      });

      return { ...plan, planId: saved.id };
    },
  },

  search_course_material: {
    name: "search_course_material",
    description: "Search enrolled course materials, syllabus, and lecture notes.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    execute: async (userId: string, args: { query: string }) => {
      // Course-scoped search respecting permissions
      const lessons = await prisma.lesson.findMany({
        where: {
          course: {
            enrollments: { some: { studentId: userId } },
          },
          OR: [
            { title: { contains: args.query } },
            { content: { contains: args.query } },
            { description: { contains: args.query } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          content: true,
          course: { select: { title: true } },
        },
        take: 3,
      });

      return lessons.map((l) => ({
        title: l.title,
        course: l.course.title,
        excerpt: l.content.slice(0, 300) + "...",
      }));
    },
  },
};
