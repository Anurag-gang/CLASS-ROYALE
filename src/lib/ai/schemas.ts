import { z } from "zod";

export const QuizQuestionSchema = z.object({
  question: z.string().min(5),
  type: z.enum(["mcq", "true_false", "fill_blank", "short_answer", "code"]).default("mcq"),
  options: z.array(z.string()).default([]),
  answerIndex: z.number().int().min(0).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(5),
  difficulty: z.number().int().min(1).max(5).default(3),
  topic: z.string().default("General"),
  subtopic: z.string().default("Core Concept"),
});

export const QuizGenerationResponseSchema = z.object({
  title: z.string().default("Battle Quiz Challenge"),
  topic: z.string(),
  difficulty: z.number().int().min(1).max(5).default(3),
  questions: z.array(QuizQuestionSchema).min(1),
});

export const AnswerEvaluationResponseSchema = z.object({
  correct: z.boolean(),
  score: z.number().min(0).max(10),
  maxScore: z.number().default(10),
  feedback: z.string().min(3),
  conceptualMistake: z.string().optional(),
  recommendedRevision: z.string().optional(),
});

export const StudyPlanTaskSchema = z.object({
  timeMin: z.number().int().min(5).max(180).default(20),
  action: z.enum(["LEARN", "PRACTICE", "QUIZ", "REVISE", "ARENA"]).default("LEARN"),
  description: z.string().min(3),
});

export const StudyPlanDaySchema = z.object({
  day: z.number().int().min(1),
  dateStr: z.string().optional(),
  topic: z.string().min(2),
  tasks: z.array(StudyPlanTaskSchema).min(1),
});

export const StudyPlanResponseSchema = z.object({
  subject: z.string(),
  targetDate: z.string().optional(),
  schedule: z.array(StudyPlanDaySchema).min(1),
  pedagogicalAdvice: z.string().optional(),
});

export const RevisionCardSchema = z.object({
  id: z.string().default(() => "card-" + Math.random().toString(36).substring(2, 9)),
  front: z.string().min(3),
  back: z.string().min(3),
  category: z.string().default("Active Recall"),
});

export const RevisionPackResponseSchema = z.object({
  topic: z.string(),
  summary: z.string().min(10),
  cards: z.array(RevisionCardSchema).min(1),
  keyFormulas: z.array(z.string()).optional(),
  commonMistakes: z.array(z.string()).optional(),
});

export const PerformanceAnalysisResponseSchema = z.object({
  overallAssessment: z.string().min(10),
  strongTopics: z.array(z.string()),
  weakTopics: z.array(z.string()),
  recommendedRevision: z.array(z.string()),
  suggestedAction: z.string().min(5),
});
