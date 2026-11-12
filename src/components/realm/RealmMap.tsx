"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Crown,
  Lock,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  HelpCircle,
  CheckCircle2,
  Trophy,
  Swords,
  ChevronRight,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { QuizLevelDTO } from "@/types/quiz";
import { retroSound } from "@/lib/sound";

interface RealmMapProps {
  subjectSlug: string;
  onSelectLevel: (levelNumber: number) => void;
}

const LEVEL_ICONS: Record<number, string> = {
  1: "🌱",
  2: "🧭",
  3: "⚔️",
  4: "🛡️",
  5: "🔮",
  6: "👑",
  7: "🐉",
};

export function RealmMap({ subjectSlug, onSelectLevel }: RealmMapProps) {
  const [levels, setLevels] = useState<QuizLevelDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntroLevel, setSelectedIntroLevel] = useState<QuizLevelDTO | null>(null);

  const fetchLevels = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/subjects/${encodeURIComponent(subjectSlug)}/levels`);
      const data = await res.json();
      if (data.success && data.levels) {
        setLevels(data.levels);
      }
    } catch (err) {
      console.error("Failed to load realm levels:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [subjectSlug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-inter text-xs text-cyan-400 font-medium">
          Surveying Academic Realm Path...
        </span>
      </div>
    );
  }

  const completedCount = levels.filter((l) => l.isCompleted).length;
  const progressPercent = levels.length > 0 ? Math.round((completedCount / levels.length) * 100) : 0;
  const realmTitle = levels[0]?.title ? (levels as any)[0]?.realmName || "Academic Realm" : "Academic Realm";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Realm Progress Header */}
      <div className="p-6 rounded-3xl bg-[#080d22]/90 border border-violet-500/30 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-[11px] font-inter font-semibold tracking-wider text-cyan-400 uppercase">
              The Knowledge Kingdom
            </span>
          </div>
          <h2 className="font-condensed font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
            {realmTitle}
          </h2>
          <p className="font-inter text-xs text-zinc-400">
            Progress through the 7 academic tiers to claim full sovereign mastery.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center">
            <span className="block font-inter text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
              Conquered
            </span>
            <span className="font-mono font-bold text-base text-white">
              {completedCount} / {levels.length} Levels
            </span>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
            <span className="block font-inter text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
              Realm Mastery
            </span>
            <span className="font-mono font-bold text-base text-amber-300">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-inter text-zinc-400">
          <span>Campaign Journey</span>
          <span className="font-mono font-semibold text-cyan-300">{completedCount} of {levels.length} Tier Milestones</span>
        </div>
        <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Connected Adventure Trail Nodes */}
      <div className="relative py-6 space-y-6">
        {levels.map((lvl, index) => {
          const isCrownTrial = lvl.levelNumber === 7;
          const isCurrent = lvl.isUnlocked && !lvl.isCompleted;
          const isPassed = lvl.isCompleted;
          const isLocked = !lvl.isUnlocked;

          // Trail alignment zigzag pattern
          const alignments = ["justify-start", "justify-center", "justify-end", "justify-center"];
          const alignClass = alignments[index % alignments.length];

          return (
            <div key={lvl.id} className="relative">
              {/* Connector stroke to next node */}
              {index < levels.length - 1 && (
                <div
                  className={`absolute left-1/2 -bottom-6 w-1 h-8 -translate-x-1/2 z-0 ${
                    isPassed ? "bg-cyan-500 shadow-[0_0_8px_#06b6d4]" : "bg-white/10"
                  }`}
                />
              )}

              <div className={`flex ${alignClass} relative z-10`}>
                <div
                  onClick={() => {
                    if (isLocked) {
                      retroSound.playWrong();
                      return;
                    }
                    retroSound.playClick();
                    setSelectedIntroLevel(lvl);
                  }}
                  className={`group w-full sm:w-[420px] p-5 rounded-2xl border transition-all duration-300 backdrop-blur-xl cursor-pointer ${
                    isLocked
                      ? "bg-[#060914]/60 border-white/5 opacity-60 hover:border-white/10"
                      : isPassed
                      ? "bg-[#061814]/80 border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                      : isCurrent
                      ? "bg-[#09112a]/95 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)] ring-2 ring-cyan-400/40 hover:scale-[1.02]"
                      : "bg-[#070c20]/80 border-violet-500/20 hover:border-violet-400/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-105 ${
                          isLocked
                            ? "bg-black/50 border border-white/5 text-zinc-600"
                            : isPassed
                            ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                            : isCurrent
                            ? "bg-cyan-950/80 border-2 border-cyan-400 text-cyan-200 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                            : "bg-white/5 border border-white/10 text-white"
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="w-5 h-5 text-zinc-500" />
                        ) : isPassed ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <span>{LEVEL_ICONS[lvl.levelNumber] || "⚔️"}</span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-inter font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isCrownTrial
                                ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                                : "bg-white/5 text-zinc-400 border-white/10"
                            }`}
                          >
                            Tier {lvl.levelNumber}
                          </span>
                          <span className="font-mono text-xs text-zinc-400 font-medium">
                            {lvl.difficulty}
                          </span>
                        </div>

                        <h3 className="font-condensed font-black text-lg text-white group-hover:text-cyan-300 transition-colors leading-tight">
                          {lvl.title}
                        </h3>
                        <p className="font-inter text-xs text-zinc-400 line-clamp-1">
                          {lvl.subtitle || lvl.purpose}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {isPassed ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-inter font-semibold text-emerald-400 uppercase tracking-wider block">
                            Conquered
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {lvl.bestScore || 12}/12
                          </span>
                        </div>
                      ) : isCurrent ? (
                        <div className="px-3 py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-inter font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-1">
                          <span>Enter</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Level Metrics Footer */}
                  <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-inter text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      35s per Trial
                    </span>
                    <span className="flex items-center gap-1 text-amber-300 font-mono font-medium">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      +{lvl.xpReward} XP
                    </span>
                    <span className="flex items-center gap-1">
                      {lvl.allowHints ? "💡 Hints at 15s" : "👑 No Hints"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen B: Level Introduction Modal */}
      {selectedIntroLevel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#090e24] border-2 border-cyan-500/40 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                {LEVEL_ICONS[selectedIntroLevel.levelNumber] || "⚔️"}
              </div>
              <span className="text-[10px] font-inter font-bold uppercase tracking-widest text-cyan-400 block pt-1">
                Tier {selectedIntroLevel.levelNumber} Trial
              </span>
              <h3 className="font-condensed font-black text-2xl text-white uppercase tracking-tight">
                {selectedIntroLevel.title}
              </h3>
              <p className="font-inter text-xs text-zinc-300 leading-relaxed">
                {selectedIntroLevel.purpose}
              </p>
            </div>

            {/* Trial Specs Bento */}
            <div className="grid grid-cols-2 gap-3 text-xs font-inter">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Trials Count</span>
                <span className="font-mono font-bold text-white text-sm">12 Questions</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Time Per Question</span>
                <span className="font-mono font-bold text-white text-sm">35 Seconds</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Passing Mark</span>
                <span className="font-mono font-bold text-cyan-300 text-sm">{selectedIntroLevel.passingThreshold}/12 (75%)</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Hint Assistance</span>
                <span className={`font-mono font-bold text-sm ${selectedIntroLevel.allowHints ? "text-amber-300" : "text-red-400"}`}>
                  {selectedIntroLevel.allowHints ? "Unlocks at 15s" : "Strict Exam (None)"}
                </span>
              </div>
            </div>

            {selectedIntroLevel.bestScore && selectedIntroLevel.bestScore > 0 ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs font-inter text-emerald-300">
                <span>Personal Best Score:</span>
                <span className="font-mono font-bold text-white">{selectedIntroLevel.bestScore}/12</span>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedIntroLevel(null)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-inter font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const num = selectedIntroLevel.levelNumber;
                  setSelectedIntroLevel(null);
                  onSelectLevel(num);
                }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-inter font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all"
              >
                <span>Commence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
