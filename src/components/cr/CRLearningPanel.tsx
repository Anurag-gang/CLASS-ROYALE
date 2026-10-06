"use client";

import React from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { PixelProgress } from "@/components/retro/PixelProgress";

interface CRLearningPanelProps {
  telemetry: any;
  onQuickAction?: (actionPrompt: string) => void;
}

export const CRLearningPanel: React.FC<CRLearningPanelProps> = ({
  telemetry,
  onQuickAction,
}) => {
  if (!telemetry) {
    return (
      <div className="p-4 text-center font-mono text-xs text-zinc-500">
        Telemetry Synchronizing...
      </div>
    );
  }

  const { user, progress, mastery, activeQuests } = telemetry;

  return (
    <div className="space-y-4">
      <RetroCard variant="default" className="p-3 bg-[#0a101d] border border-[#00ffcc]/40">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div>
            <h4 className="font-arcade text-xs text-[#00ffcc]">{user.username}</h4>
            <p className="font-mono text-[10px] text-zinc-400">{user.title || "Novice Challenger"}</p>
          </div>
          <PixelBadge variant="cyan" className="font-arcade text-[10px]">
            LVL {user.level}
          </PixelBadge>
        </div>

        <div className="mt-2 space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-zinc-400">
            <span>XP Progress</span>
            <span className="text-[#ffe600]">{user.levelInfo?.progressXp} / {user.levelInfo?.xpForNextLevel}</span>
          </div>
          <PixelProgress value={user.levelInfo?.percentage || 0} variant="yellow" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center font-mono text-[10px]">
          <div className="rounded border border-zinc-800 bg-black/40 p-1.5">
            <span className="text-zinc-500 block">STREAK</span>
            <span className="text-orange-400 font-bold">🔥 {user.streak} DAYS</span>
          </div>
          <div className="rounded border border-zinc-800 bg-black/40 p-1.5">
            <span className="text-zinc-500 block">AVG ACCURACY</span>
            <span className="text-[#00ff66] font-bold">{progress.averageQuizScorePercent}%</span>
          </div>
        </div>
      </RetroCard>

      <RetroCard variant="pink" className="p-3 bg-[#130d1d] border border-[#ff00ff]/40">
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
          <span className="text-sm">🎯</span>
          <h4 className="font-arcade text-[11px] text-[#ff00ff] uppercase">CR Diagnostic Focus</h4>
        </div>

        <div className="mt-2 space-y-2 font-mono text-[11px]">
          {mastery.weakTopics && mastery.weakTopics.length > 0 ? (
            <div>
              <span className="text-red-400 text-[10px] block mb-1">MISCONCEPTION DETECTED:</span>
              <div className="flex flex-wrap gap-1">
                {mastery.weakTopics.map((topic: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => onQuickAction && onQuickAction(`CR, teach me the core concepts of ${topic} and then quiz me on it.`)}
                    className="rounded border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-[10px] text-red-300 hover:border-red-400 hover:bg-red-900/60 text-left transition-all"
                  >
                    ⚔️ Drill {topic}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-zinc-400 text-[10px]">No critical weak points detected. Mastery healthy!</p>
          )}

          {mastery.strongTopics && mastery.strongTopics.length > 0 && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80">
              <span className="text-[#00ff66] text-[10px] block mb-1">STRONG DOMAINS:</span>
              <div className="flex flex-wrap gap-1">
                {mastery.strongTopics.map((topic: string, i: number) => (
                  <span
                    key={i}
                    className="border border-[#00ff66]/30 bg-[#00ff66]/10 px-1.5 py-0.5 text-[10px] text-[#00ff66]"
                  >
                    ✓ {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </RetroCard>

      {activeQuests && activeQuests.length > 0 && (
        <RetroCard variant="yellow" className="p-3 bg-[#141208] border border-[#ffe600]/40">
          <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
            <span className="text-sm">📜</span>
            <h4 className="font-arcade text-[11px] text-[#ffe600] uppercase">Suggested Quest</h4>
          </div>

          <div className="mt-2 font-mono text-[11px]">
            <p className="text-white font-semibold">{activeQuests[0].title}</p>
            <p className="text-zinc-400 text-[10px] mt-0.5">{activeQuests[0].description}</p>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">
                Progress: {activeQuests[0].progress}/{activeQuests[0].targetCount}
              </span>
              <span className="text-[#ffe600]">+{activeQuests[0].xpReward} XP</span>
            </div>
          </div>
        </RetroCard>
      )}
    </div>
  );
};
