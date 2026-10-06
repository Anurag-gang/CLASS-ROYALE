"use client";

import React from "react";
import { PixelBadge } from "./PixelBadge";
import { PixelProgress } from "./PixelProgress";
import { Flame, Trophy, Swords, Zap } from "lucide-react";
import { calculateLevelFromXp } from "@/lib/game-mechanics";

export interface PlayerHUDProps {
  user: {
    username: string;
    profile?: {
      level: number;
      xp: number;
      rank: string;
      streak: number;
      avatar: string;
      title?: string;
      questsCompleted?: number;
      achievementsUnlocked?: number;
    } | null;
  } | null;
}

export const PlayerHUD: React.FC<PlayerHUDProps> = ({ user }) => {
  if (!user || !user.profile) {
    return null;
  }

  const { xp = 0, streak = 1, avatar = "⚔️", title = "Player" } = user.profile;
  const levelInfo = calculateLevelFromXp(xp);

  return (
    <div className="pixel-box-pink p-3 md:p-4 bg-[#0d0617]/95 backdrop-blur-md mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Avatar & Name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1f0b35] border-2 border-[#f755bc] flex items-center justify-center text-2xl md:text-3xl shadow-[3px_3px_0px_0px_#000000]">
            {avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-sm md:text-base text-white tracking-wide">
                {user.username}
              </span>
              <PixelBadge variant="pink">LV. {levelInfo.level}</PixelBadge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-retro text-base text-[#a79bb7] uppercase">
                {levelInfo.rank} • {title}
              </span>
            </div>
          </div>
        </div>

        {/* Center: XP Progress Bar */}
        <div className="flex-1 max-w-md">
          <PixelProgress
            value={levelInfo.currentLevelXp}
            max={levelInfo.nextLevelXp}
            label="EXP PROGRESS"
            sublabel={`${levelInfo.currentLevelXp} / ${levelInfo.nextLevelXp} XP`}
            variant="pink"
            showPercent
          />
        </div>

        {/* Right: Badges / Quick Stats */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#180829] border border-[#3b1c5a] text-xs font-pixel text-amber-400">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streak} DAYS</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#180829] border border-[#3b1c5a] text-xs font-pixel text-[#f755bc]">
            <Zap className="w-4 h-4 text-[#f755bc]" />
            <span>{xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
};