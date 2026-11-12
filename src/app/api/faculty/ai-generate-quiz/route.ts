import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, checkClassAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toolCreateQuiz } from "@/lib/cr/cr-tools";
import { recordAuditLog } from "@/lib/audit";
import { createQuestion, getSubjectsWithStats } from "@/lib/services/questionService";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "FACULTY" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized faculty access" }, { status: 403 });
    }

    const body = await req.json();
    const { action = "generate", topic, difficulty = "Intermediate", questionCount = 5, learningObjective, classId, quizData } = body;

    if (action === "generate") {
      if (!topic) {
        return NextResponse.json({ error: "Topic is required for AI generation" }, { status: 400 });
      }

      // Generate proposed quiz with CR tools
      const generated = await toolCreateQuiz(
        user.id,
        topic,
        difficulty.toUpperCase(),
        Number(questionCount) || 5
      );

      return NextResponse.json({
        success: true,
        action: "review",
        proposedQuiz: {
          quizId: generated.quizId,
          title: generated.title,
          topic: generated.topic,
          difficulty: generated.difficulty,
          learningObjective: learningObjective || `Assess mastery of core principles in ${topic}`,
          questions: generated.questions,
        },
      });
    }

    if (action === "approve") {
      if (!classId || !quizData) {
        return NextResponse.json({ error: "classId and quizData are required to approve and publish" }, { status: 400 });
      }

      const hasAccess = await checkClassAccess(user.id, classId);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied to target class" }, { status: 403 });
      }

      // Assign to class as a ClassQuiz
      const classQuiz = await prisma.classQuiz.create({
        data: {
          classId,
          quizId: quizData.quizId || `quiz-${Date.now()}`,
          title: quizData.title,
          topic: quizData.topic,
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        },
      });

      // Synchronize questions into live Question Bank
      try {
        const subjects = await getSubjectsWithStats();
        // Match topic to territory subject or default to first
        const matchedSub = subjects.find(
          (s) =>
            s.name.toLowerCase().includes(quizData.topic.toLowerCase()) ||
            quizData.topic.toLowerCase().includes(s.name.toLowerCase()) ||
            s.territory_name.toLowerCase().includes(quizData.topic.toLowerCase())
        ) || subjects[0];

        if (matchedSub && Array.isArray(quizData.questions)) {
          for (const q of quizData.questions) {
            let opts = q.options;
            if (!Array.isArray(opts)) {
              try {
                opts = JSON.parse(q.optionsJson || "[]");
              } catch {
                opts = ["Option A", "Option B", "Option C", "Option D"];
              }
            }

            const formattedOpts = opts.map((optText: string, idx: number) => ({
              id: ["A", "B", "C", "D"][idx] || "A",
              text: typeof optText === "string" ? optText : String(optText),
            }));

            const letters = ["A", "B", "C", "D"];
            const correctLetter = letters[q.answerIndex ?? 0] || "A";

            await createQuestion({
              subject_id: matchedSub.id,
              question_text: q.question,
              options: formattedOpts,
              correct_option_id: correctLetter as "A" | "B" | "C" | "D",
              difficulty: (quizData.difficulty as any) || "Medium",
              explanation: q.explanation || "Curricular question approved by faculty.",
              tags: [quizData.topic, matchedSub.name],
            });
          }
        }
      } catch (qBankErr) {
        console.warn("Failed syncing approved quiz to Question Bank:", qBankErr);
      }

      await recordAuditLog({
        actorId: user.id,
        action: "AI_QUIZ_APPROVED_AND_ASSIGNED",
        targetType: "ClassQuiz",
        targetId: classQuiz.id,
        metadata: {
          classId,
          title: quizData.title,
          topic: quizData.topic,
          questionsCount: quizData.questions?.length,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Quiz "${quizData.title}" successfully approved and published to class!`,
        classQuiz,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Quiz Generator error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
