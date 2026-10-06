"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { PixelProgress } from "@/components/retro/PixelProgress";
import { Swords, Check, X, Sparkles, RefreshCw, Zap } from "lucide-react";
import confetti from "canvas-confetti";
import { retroSound } from "@/lib/sound";

export const BattleScene: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const options = [
    { label: "A", text: "O(n)", correct: false },
    { label: "B", text: "O(log n)", correct: true },
    { label: "C", text: "O(n²)", correct: false },
    { label: "D", text: "O(1)", correct: false },
  ];

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelectedIdx(idx);
    setHasAnswered(true);

    if (options[idx].correct) {
      retroSound.playCorrect();
      setXpGained(150);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f755bc", "#de1659", "#facc15", "#4ade80"],
        });
      } catch {}
    } else {
      retroSound.playWrong();
      setXpGained(0);
    }
  };

  const handleReset = () => {
    retroSound.playClick();
    setSelectedIdx(null);
    setHasAnswered(false);
    setXpGained(0);
  };

  return (
    <section id="battle" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#080112] border-t-4 border-[#3b1c5a]">
      <div className="max-w-4xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <PixelBadge variant="pink">COMBAT TRIAL</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            ARENA <span className="text-[#f755bc]">BATTLE</span>
          </h2>
          <p className="font-retro text-xl text-[#a79bb7] max-w-xl mx-auto">
            Solve the objective below to trigger real-time feedback and earn XP.
          </p>
        </div>

        {/* Battle Arena Window */}
        <div className="pixel-box-pink p-6 sm:p-8 bg-[#0e021c] text-left max-w-2xl mx-auto space-y-6 shadow-[0_0_40px_rgba(247,85,188,0.2)]">
          {/* Battle Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#3b1c5a]">
            <div className="flex items-center gap-2 text-white font-pixel text-xs sm:text-sm">
              <Swords className="w-5 h-5 text-[#de1659]" />
              <span>BATTLE #017 • BOSS: BINARY GOLEM</span>
            </div>
            <PixelBadge variant="yellow">+150 XP LOOT</PixelBadge>
          </div>

          {/* Question Box */}
          <div className="p-4 bg-[#18042a] border-2 border-[#f755bc] space-y-2">
            <span className="font-pixel text-[10px] text-[#f755bc]">OBJECTIVE:</span>
            <p className="font-pixel text-xs sm:text-sm text-white leading-relaxed">
              WHAT IS THE AVERAGE TIME COMPLEXITY OF BINARY SEARCH ON A SORTED ARRAY?
            </p>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const isSelected = selectedIdx === i;
              let btnStyle = "bg-[#130324] border-[#3b1c5a] text-white hover:border-[#f755bc]";

              if (hasAnswered) {
                if (opt.correct) {
                  btnStyle = "bg-[#032915] border-[#10b981] text-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.4)]";
                } else if (isSelected && !opt.correct) {
                  btnStyle = "bg-[#29030a] border-[#ff3344] text-red-300";
                }
              }

              return (
                <button
                  key={opt.label}
                  disabled={hasAnswered}
                  onClick={() => handleSelect(i)}
                  className={`p-4 border-2 font-pixel text-xs text-left flex items-center justify-between transition-all duration-150 cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[#f755bc] font-bold">{opt.label})</span>
                    <span>{opt.text}</span>
                  </div>
                  {hasAnswered && opt.correct && <Check className="w-4 h-4 text-[#4ade80]" />}
                  {hasAnswered && isSelected && !opt.correct && <X className="w-4 h-4 text-red-400" />}
                </button>
              );
            })}
          </div>

          {/* Feedback & Result Panel */}
          {hasAnswered && (
            <div className="pt-4 border-t-2 border-[#3b1c5a] space-y-4 animate-in fade-in duration-300">
              {selectedIdx !== null && options[selectedIdx].correct ? (
                <div className="p-4 bg-[#032915] border-2 border-[#10b981] text-left space-y-2">
                  <div className="flex items-center gap-2 font-pixel text-xs text-[#4ade80]">
                    <Sparkles className="w-4 h-4" />
                    <span>CRITICAL HIT! PERFECT ANSWER (+150 XP)</span>
                  </div>
                  <p className="font-retro text-lg text-emerald-200">
                    Each comparison cuts the remaining search space in half, yielding logarithmic O(log n) efficiency.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-[#29030a] border-2 border-[#ff3344] text-left space-y-2">
                  <div className="flex items-center gap-2 font-pixel text-xs text-red-400">
                    <span>SHIELD DEFLECTED!</span>
                  </div>
                  <p className="font-retro text-lg text-red-200">
                    Binary search does not check every item linearly. It divides the array in half at every step, meaning O(log n) is the correct answer.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#1f0b35] border-2 border-[#f755bc] font-pixel text-[10px] text-[#f755bc] hover:bg-[#f755bc] hover:text-black transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>TRY AGAIN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};