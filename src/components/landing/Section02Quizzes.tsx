"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function Section02Quizzes() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const question = {
    index: "07 / 15",
    domain: "DATA STRUCTURES // BINARY TREE ALGORITHMS",
    prompt: "Which binary tree traversal algorithm visits the root node before inspecting its child subtrees?",
    options: [
      { id: 0, key: "A", label: "INORDER TRAVERSAL", correct: false, explanation: "Visits Left -> Root -> Right." },
      { id: 1, key: "B", label: "PREORDER TRAVERSAL", correct: true, explanation: "Correct. Evaluates Root -> Left -> Right." },
      { id: 2, key: "C", label: "POSTORDER TRAVERSAL", correct: false, explanation: "Visits Left -> Right -> Root." },
      { id: 3, key: "D", label: "LEVEL ORDER TRAVERSAL", correct: false, explanation: "Evaluates breadth-first across depth levels using a FIFO queue." },
    ],
  };

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    if (question.options[idx].correct) {
      retroSound.playCorrect();
    } else {
      retroSound.playWrong();
    }
  };

  const selectedData = selectedOption !== null ? question.options[selectedOption] : null;

  return (
    <section id="quizzes" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <SectionHeader
          number="02"
          category="ACTIVE RETRIEVAL ENGINE"
          title="TEST WHAT YOU KNOW."
          subtitle="Distraction-free assessment console engineered for immediate cognitive feedback."
        />

        <TechnicalBorder />

        {/* Giant In-Situ Interactive Quiz Console */}
        <CornerFrame size={16} borderColor="border-white/20" className="p-6 sm:p-10 md:p-14 bg-[#08090d] border border-white/10 space-y-8">
          {/* Console Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-white/40 uppercase tracking-widest border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-bold">LIVE CONSOLE</span>
              <span>//</span>
              <span className="text-white/70">{question.domain}</span>
            </div>

            <div className="flex items-center gap-4">
              <span>QUESTION {question.index}</span>
              <Crosshair />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-4">
            <h3 className="font-condensed font-bold text-2xl sm:text-4xl text-white uppercase tracking-tight leading-tight">
              {question.prompt}
            </h3>
          </div>

          {/* Interactive Option Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let statusClasses = "border-white/10 bg-white/[0.02] text-white/80 hover:border-white/40 hover:bg-white/[0.04]";

              if (isSelected) {
                if (opt.correct) {
                  statusClasses = "border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.15)]";
                } else {
                  statusClasses = "border-red-500 bg-red-950/40 text-red-200";
                }
              }

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`p-5 text-left border transition-all flex items-center justify-between group cursor-pointer ${statusClasses}`}
                  data-cursor="ANSWER"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center font-mono text-xs font-bold border border-current">
                      {opt.key}
                    </span>
                    <span className="font-condensed font-bold text-lg sm:text-xl uppercase tracking-wide">
                      {opt.label}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">
                    [SELECT]
                  </span>
                </button>
              );
            })}
          </div>

          {/* Instant Technical Verification Banner */}
          {selectedData && (
            <div
              className={`p-5 border transition-all animate-in fade-in duration-200 ${
                selectedData.correct
                  ? "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
                  : "bg-red-950/30 border-red-500/40 text-red-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <span className="font-bold uppercase tracking-wider">
                    {selectedData.correct ? "STATUS: VERIFIED // CORRECT" : "STATUS: INCORRECT // DISCORDANCE"}
                  </span>
                  <span>—</span>
                  <span className="text-white/80">{selectedData.explanation}</span>
                </div>

                <Link
                  href="/quiz/data-structures"
                  onClick={() => retroSound.playLevelUp()}
                  className="font-bold underline uppercase tracking-widest text-white hover:text-cyan-300"
                >
                  Take Full Diagnostic Drill &rarr;
                </Link>
              </div>
            </div>
          )}
        </CornerFrame>
      </div>
    </section>
  );
}
