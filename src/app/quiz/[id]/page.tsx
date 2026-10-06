"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import confetti from "canvas-confetti";
import { retroSound } from "@/lib/sound";

interface QuestionOption {
  key: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  options: QuestionOption[];
  answerIndex: number;
  explanation: string;
}

export default function QuizPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Results State
  const [quizFinished, setQuizFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quizzes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Quiz not found");
        return res.json();
      })
      .then((data) => {
        setCourse(data.course);
        const qList = (data.questions || []).map((q: any) => {
          let opts: string[] = [];
          try {
            const parsed = typeof q.optionsJson === "string" ? JSON.parse(q.optionsJson) : q.optionsJson;
            opts = Array.isArray(parsed) ? parsed : ["Option A", "Option B", "Option C", "Option D"];
          } catch {
            opts = ["Option A", "Option B", "Option C", "Option D"];
          }
          if (!Array.isArray(opts)) opts = ["Option A", "Option B", "Option C", "Option D"];
          const letters = ["A", "B", "C", "D"];
          return {
            id: q.id,
            question: q.question,
            options: opts.map((optText, idx) => ({
              key: letters[idx] || String.fromCharCode(65 + idx),
              text: optText,
            })),
            answerIndex: q.answerIndex,
            explanation: q.explanation,
          };
        });
        setQuestions(qList);
      })
      .catch((err) => console.error("Error loading quiz:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading distraction-free quiz...</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="font-display font-bold text-lg text-white">No questions available for this topic.</h2>
        <Link href="/subjects" className="text-xs font-mono text-cyan-400 underline">
          Return to Subjects
        </Link>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    retroSound.playClick();
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    setIsSubmitted(true);
    const isCorrect = selectedOption === currentQ.answerIndex;
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: selectedOption }));

    if (isCorrect) {
      retroSound.playCorrect();
    } else {
      retroSound.playWrong();
    }
  };

  const handleNext = async () => {
    retroSound.playClick();

    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      // Finalize and submit answers to server
      try {
        const res = await fetch(`/api/quizzes/${id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: userAnswers }),
        });
        const data = await res.json();
        setFinalScore(data);
        setQuizFinished(true);

        if (data.scorePercent >= 80) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ["#8b5cf6", "#06b6d4", "#10b981"],
          });
        }
      } catch (err) {
        console.error("Quiz submission error:", err);
      }
    }
  };

  // -------------------------------------------------------------
  // RESULTS PAGE (SECTION 28)
  // -------------------------------------------------------------
  if (quizFinished && finalScore) {
    const passed = finalScore.scorePercent >= 60;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        {/* Results Header */}
        <div className="text-center space-y-2">
          <span className="font-hud text-xs text-cyan-400 uppercase tracking-widest font-semibold">
            ASSESSMENT SUMMARY
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            QUIZ COMPLETE
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-400">
            {course?.title || "Engineering Concept Evaluation"}
          </p>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl p-6 bg-[#070c20]/90 border border-violet-500/20 backdrop-blur-xl text-center space-y-3">
          <div className="text-3xl sm:text-4xl font-display font-extrabold text-white">
            {finalScore.score} / {finalScore.total} CORRECT
          </div>
          <div className="text-xl font-mono font-bold text-cyan-300">
            {finalScore.scorePercent}%
          </div>
          <div className="h-2 w-full max-w-sm mx-auto bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                passed ? "bg-emerald-400 shadow-[0_0_10px_#10b981]" : "bg-rose-400"
              }`}
              style={{ width: `${finalScore.scorePercent}%` }}
            />
          </div>
        </div>

        {/* Subject Mastery Update */}
        <div className="rounded-2xl p-5 bg-[#061226]/80 border border-cyan-500/30 flex items-center justify-between">
          <span className="font-body text-xs text-zinc-300">
            Subject mastery updated:
          </span>
          <div className="flex items-center gap-2 font-mono text-sm font-bold">
            <span className="text-zinc-400">{finalScore.previousMastery || 68}%</span>
            <span className="text-zinc-500">→</span>
            <span className="text-emerald-400">{finalScore.updatedMastery || 71}%</span>
          </div>
        </div>

        {/* Topics Breakdown */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Topics Evaluated
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#070c20]/60 divide-y divide-white/5 overflow-hidden">
            <div className="p-3.5 flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-200">Core Foundations</span>
              <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                Strong
              </span>
            </div>
            <div className="p-3.5 flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-200">Intermediate Traversals</span>
              <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
                Needs Practice
              </span>
            </div>
            <div className="p-3.5 flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-200">Asymptotic Bounds</span>
              <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                Strong
              </span>
            </div>
          </div>
        </div>

        {/* Next Step Callout */}
        <div className="rounded-2xl p-6 bg-[#090e28] border border-violet-500/30 space-y-4">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-hud font-bold">
            <Sparkles className="w-4 h-4" />
            <span>YOUR NEXT STEP</span>
          </div>
          <p className="font-body text-xs text-zinc-300 leading-relaxed">
            Practice recommended drill on <strong>Intermediate Traversals</strong> to reinforce balance invariants.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/dashboard"
              onClick={() => retroSound.playLevelUp()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-display text-xs font-semibold shadow-md transition-all text-center"
            >
              START RECOMMENDED QUIZ
            </Link>

            <Link
              href="/subjects"
              onClick={() => retroSound.playClick()}
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-display text-xs font-medium transition-colors text-center"
            >
              View Subjects Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DISTRACTION-FREE ACTIVE QUIZ VIEW (SECTION 25 & 26)
  // -------------------------------------------------------------
  const isCurrentCorrect = selectedOption === currentQ.answerIndex;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Top Bar: Subject & Question Counter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span className="uppercase tracking-wider font-semibold text-cyan-400">
            {course?.title || "ENGINEERING SUBJECT"}
          </span>
          <span>
            Question {String(currentIndex + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
          </span>
        </div>

        {/* Progress Line */}
        <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Prompt */}
      <div className="pt-2">
        <h2 className="font-display font-semibold text-lg sm:text-xl text-white leading-relaxed">
          {currentQ.question}
        </h2>
      </div>

      {/* Multiple-Choice Options */}
      <div className="space-y-3">
        {currentQ.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrectAnswer = idx === currentQ.answerIndex;

          let optionStyle =
            "bg-[#070c20]/80 border-white/10 hover:border-cyan-400/50 hover:bg-[#0c1433]";

          if (isSelected) {
            optionStyle = "bg-violet-950/60 border-violet-400 text-white shadow-sm";
          }

          if (isSubmitted) {
            if (isCorrectAnswer) {
              optionStyle =
                "bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = "bg-rose-950/40 border-rose-500 text-rose-200";
            } else {
              optionStyle = "opacity-40 border-white/5";
            }
          }

          return (
            <button
              key={opt.key}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 ${optionStyle}`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                    isSelected ? "bg-violet-600 text-white" : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {opt.key}
                </span>
                <span className="font-body text-sm font-medium text-zinc-100">{opt.text}</span>
              </div>

              {isSubmitted && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {isSubmitted && isSelected && !isCorrectAnswer && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Immediate Feedback & Submit / Next Action */}
      <div className="pt-4 space-y-4">
        {!isSubmitted ? (
          <button
            type="button"
            disabled={selectedOption === null}
            onClick={handleSubmitAnswer}
            className={`w-full py-3.5 px-6 rounded-xl font-display font-semibold text-xs tracking-wider transition-all ${
              selectedOption !== null
                ? "bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white shadow-md cursor-pointer"
                : "bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed"
            }`}
          >
            SUBMIT ANSWER
          </button>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Feedback Banner */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isCurrentCorrect
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/30 border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-2 font-hud text-xs font-bold">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>CORRECT</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>INCORRECT</span>
                  </>
                )}
              </div>

              <p className="font-body text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white block mb-0.5">Why?</strong>
                {currentQ.explanation}
              </p>
            </div>

            {/* Next Action Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-display font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>{isLastQuestion ? "VIEW RESULTS" : "NEXT QUESTION"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}