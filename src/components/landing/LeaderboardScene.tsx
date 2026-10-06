"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { Trophy, Medal, Crown, Flame } from "lucide-react";

const initialLeaderboard = [
  { rank: "01", name: "PIXELMAGE", xp: 9820, level: 29, avatar: "🧙‍♂️", streak: 18 },
  { rank: "02", name: "ANURAG", xp: 9450, level: 27, avatar: "⚔️", streak: 12 },
  { rank: "03", name: "BYTEKNIGHT", xp: 9410, level: 27, avatar: "🛡️", streak: 15 },
  { rank: "04", name: "CODEWIZ", xp: 9120, level: 26, avatar: "⚡", streak: 9 },
  { rank: "05", name: "PLAYER_004", xp: 8890, level: 25, avatar: "👾", streak: 14 },
  { rank: "06", name: "NEONSLAYER", xp: 8430, level: 24, avatar: "🗡️", streak: 7 },
];

export const LeaderboardScene: React.FC = () => {
  return (
    <section id="leaderboard" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#05010a] border-t-4 border-[#3b1c5a]">
      <div className="max-w-4xl mx-auto space-y-12 text-center">
        <div className="space-y-3">
          <PixelBadge variant="yellow">RANKINGS</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            HIGH <span className="text-[#facc15]">SCORES</span>
          </h2>
          <p className="font-retro text-xl text-[#a79bb7] max-w-xl mx-auto">
            Live global rankings updated with every battle won.
          </p>
        </div>

        {/* Arcade Leaderboard Cabinet Frame */}
        <div className="pixel-box-yellow p-6 sm:p-8 bg-[#0c0802] text-left max-w-2xl mx-auto space-y-4 shadow-[0_0_35px_rgba(250,204,21,0.15)]">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#713f12]">
            <div className="flex items-center gap-2 text-amber-400 font-pixel text-xs">
              <Trophy className="w-4 h-4" />
              <span>ARCADE TOP RANKS</span>
            </div>
            <span className="font-pixel text-[9px] text-[#facc15] animate-pulse">
              LIVE ARENA TICKER
            </span>
          </div>

          {/* Table Rows */}
          <div className="space-y-2 font-pixel text-xs">
            <div className="grid grid-cols-12 text-[10px] text-[#a79bb7] pb-2 border-b border-gray-800 px-2">
              <span className="col-span-2">RANK</span>
              <span className="col-span-6">PLAYER</span>
              <span className="col-span-4 text-right">TOTAL XP</span>
            </div>

            {initialLeaderboard.map((player) => {
              const isFirst = player.rank === "01";
              const isSecond = player.rank === "02";
              return (
                <div
                  key={player.name}
                  className={`grid grid-cols-12 items-center p-3 border transition-transform hover:scale-[1.01] ${
                    isFirst
                      ? "bg-[#2b1f02] border-[#facc15] text-[#facc15]"
                      : isSecond
                      ? "bg-[#1f0322] border-[#f755bc] text-white"
                      : "bg-[#0f0714] border-[#3b1c5a] text-gray-300"
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-1">
                    {isFirst ? (
                      <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
                    ) : (
                      <span>#{player.rank}</span>
                    )}
                  </div>
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    <span className="text-base">{player.avatar}</span>
                    <span className="font-bold truncate">{player.name}</span>
                    <span className="text-[9px] text-[#a79bb7] hidden sm:inline">
                      LV.{player.level}
                    </span>
                  </div>
                  <div className="col-span-4 text-right font-bold tracking-wider">
                    {player.xp.toLocaleString()} XP
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="pt-3 border-t border-[#713f12] flex items-center justify-between text-[10px] font-pixel text-[#854d0e]">
            <span>TOP 10 ADVANCE TO SEASON FINALS</span>
            <span>UPDATED REAL-TIME</span>
          </div>
        </div>
      </div>
    </section>
  );
};