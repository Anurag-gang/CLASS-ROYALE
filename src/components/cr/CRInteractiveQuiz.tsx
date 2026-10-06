"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";

interface Question {
  id?: string;
  question: string;
  options: string[];
  optionsJson?: string;
  answerIndex?: number;
  explanation?: string;
  subtopic?: string;
}

interface CRInteractiveQuizProps {
  quizId: string;
  title: string;
  topic: string;
  questions: Question[];
  onComplete?: (result: any) => void;
}

export const CRInteractiveQuiz: React.FC<CRInteractiveQuizProps> = ({
  quizId,
  title,
  topic,
  questions,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  const parsedQuestions = questions.map((q) => ({
    ...q,
    parsedOptions: q.options || (q.optionsJson ? JSON.parse(q.optionsJson) : []),
  }));

  const currentQ = parsedQuestions[currentIndex];

  const handleSelectOption = (optIndex: number) => {
    if (evaluationResult) return;
    const key = currentQ.id || String(currentIndex);
    setSelectedAnswers((prev) => ({ ...prev, [key]: optIndex }));
  };

  const handleNext = () => {
    if (currentIndex < parsedQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cr/quiz/${quizId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: selectedAnswers }),
      });
      const data = await res.json();
      if (res.ok && data.evaluation) {
        setEvaluationResult(data.evaluation);
        if (onComplete) onComplete(data.evaluation);
      }
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentKey = currentQ?.id || String(currentIndex);
  const currentSelected = selectedAnswers[currentKey];
  const allAnswered = parsedQuestions.every(
    (q, idx) => selectedAnswers[q.id || String(idx)] !== undefined
  );

  return (
    <RetroCard
      variant="pink"
      className="my-3 border-2 border-[#ff00ff] bg-[#0c0d1c] p-4 text-white shadow-[0_0_15px_rgba(255,0,255,0.25)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ff00ff]/30 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <div>
            <h4 className="font-arcade text-xs tracking-wider text-[#ff00ff] uppercase">{title}</h4>
            <p className="font-mono text-[10px] text-zinc-400">{topic}</p>
          </div>
        </div>

        {!evaluationResult ? (
          <PixelBadge variant="purple" className="font-arcade text-[10px]">
            QUESTION {currentIndex + 1} / {parsedQuestions.length}
          </PixelBadge>
        ) : (
          <PixelBadge
            variant={evaluationResult.accuracy >= 70 ? "green" : "yellow"}
            className="font-arcade text-[10px]"
          >
            SCORE: {evaluationResult.score}/{evaluationResult.total} ({evaluationResult.accuracy}%)
          </PixelBadge>
        )}
      </div>

      {evaluationResult && (
        <div className="mt-3 rounded border border-[#00ffcc]/40 bg-[#00ffcc]/10 p-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-arcade text-sm text-[#00ffcc]">
              {evaluationResult.isPerfect ? "🌟 PERFECT BATTLE VICTORY!" : "⚔️ BATTLE CONCLUDED"}
            </span>
            <span className="font-arcade text-xs text-[#ffe600]">
              +{evaluationResult.xpAwarded} XP AWARDED!
            </span>
          </div>
          <p className="mt-2 text-[11px] text-zinc-300">{evaluationResult.recommendation}</p>
          {evaluationResult.weakAreas?.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-red-400">FOCUS AREAS:</span>
              {evaluationResult.weakAreas.map((w: string, i: number) => (
                <span key={i} className="border border-red-500/40 bg-red-950/40 px-1.5 py-0.5 text-red-300">
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {currentQ && (
        <div className="mt-4">
          <p className="font-mono text-xs leading-relaxed text-zinc-200">
            <span className="mr-2 font-arcade text-sm text-[#00ffcc]">Q{currentIndex + 1}.</span>
            {currentQ.question}
          </p>

          <div className="mt-3 space-y-2">
            {currentQ.parsedOptions.map((opt: string, optIdx: number) => {
              const isSelected = currentSelected === optIdx;
              let btnClass = "border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:border-zinc-500";

              if (evaluationResult) {
                const evalItem = evaluationResult.evaluationDetails?.[currentIndex];
                const isCorrect = evalItem?.correctAnswer === optIdx;
                const wasChosen = evalItem?.selectedAnswer === optIdx;

                if (isCorrect) {
                  btnClass = "border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_8px_rgba(0,255,102,0.3)]";
                } else if (wasChosen && !isCorrect) {
                  btnClass = "border-red-500 bg-red-950/50 text-red-400";
                }
              } else if (isSelected) {
                btnClass = "border-[#ff00ff] bg-[#ff00ff]/20 text-white shadow-[0_0_8px_rgba(255,0,255,0.4)]";
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={!!evaluationResult}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`flex w-full items-start gap-2.5 rounded border p-2.5 text-left font-mono text-[11px] transition-all ${btnClass}`}
                >
                  <span className="font-arcade text-[10px] text-zinc-400">
                    {String.fromCharCode(65 + optIdx)}.
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {evaluationResult && evaluationResult.evaluationDetails?.[currentIndex] && (
            <div className="mt-3 rounded border border-zinc-800 bg-black/40 p-2 font-mono text-[11px] text-zinc-400">
              <span className="font-arcade text-[9px] text-[#00ffcc] uppercase">CR EXPLANATION: </span>
              {evaluationResult.evaluationDetails[currentIndex].explanation}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3">
        <div className="flex gap-2">
          <RetroButton
            size="sm"
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="text-[10px]"
          >
            ◄ PREV
          </RetroButton>
          <RetroButton
            size="sm"
            variant="secondary"
            disabled={currentIndex === parsedQuestions.length - 1}
            onClick={handleNext}
            className="text-[10px]"
          >
            NEXT ►
          </RetroButton>
        </div>

        {!evaluationResult && (
          <RetroButton
            size="sm"
            variant="crimson"
            disabled={!allAnswered || submitting}
            onClick={handleSubmitQuiz}
            className="font-arcade text-[10px]"
          >
            {submitting ? "EVALUATING..." : allAnswered ? "SUBMIT TRIAL" : "ANSWER ALL"}
          </RetroButton>
        )}
      </div>
    </RetroCard>
  );
};
