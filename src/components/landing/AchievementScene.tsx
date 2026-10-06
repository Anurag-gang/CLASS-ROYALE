"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { retroSound } from "@/lib/sound";

const achievements = [
  {
    icon: "🏆",
    title: "FIRST QUEST",
    desc: "Complete your initial quest on the mission board.",
    xp: 250,
    rarity: "COMMON",
    color: "border-[#10b981] text-[#4ade80]",
    unlocked: true,
  },
  {
    icon: "🔥",
    title: "7 DAY STREAK",
    desc: "Maintain daily battle presence for 7 consecutive days.",
    xp: 500,
    rarity: "RARE",
    color: "border-[#f59e0b] text-[#fbbf24]",
    unlocked: true,
  },
  {
    icon: "⚔️",
    title: "BOSS DEFEATED",
    desc: "Score 100% on any course final quiz battle.",
    xp: 600,
    rarity: "EPIC",
    color: "border-[#de1659] text-[#ff4d79]",
    unlocked: true,
  },
  {
    icon: "🧠",
    title: "SUBJECT MASTER",
    desc: "Complete all lessons in a full subject curriculum.",
    xp: 1000,
    rarity: "EPIC",
    color: "border-[#8b5cf6] text-[#c084fc]",
    unlocked: true,
  },
  {
    icon: "💎",
    title: "KNOWLEDGE HOARDER",
    desc: "Accumulate over 5,000 lifetime XP in your profile.",
    xp: 750,
    rarity: "RARE",
    color: "border-[#06b6d4] text-[#38bdf8]",
    unlocked: true,
  },
  {
    icon: "👑",
    title: "GRANDMASTER",
    desc: "Reach Level 25 and enter top 5 arena leaderboard.",
    xp: 1500,
    rarity: "LEGENDARY",
    color: "border-[#facc15] text-[#fde047]",
    unlocked: false,
  },
];

export const AchievementScene: React.FC = () => {
  const [inspected, setInspected] = useState<number | null>(null);

  const handleClick = (idx: number) => {
    retroSound.playClick();
    setInspected(idx === inspected ? null : idx);
  };

  return (
    <section id="achievements" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#070110] border-t-4 border-[#3b1c5a]">
      <div className="max-w-6xl mx-auto space-y-16 text-center">
        <div className="space-y-3">
          <PixelBadge variant="pink">TROPHIES</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            HALL OF <span className="text-[#f755bc]">ACHIEVEMENTS</span>
          </h2>
          <p className="font-retro text-xl text-[#a79bb7] max-w-xl mx-auto">
            Rare pixel trophies and badges unlocked as you conquer courses.
          </p>
        </div>

        {/* 6 Trophy Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {achievements.map((ach, idx) => {
            const isInspected = inspected === idx;
            return (
              <div
                key={ach.title}
                onClick={() => handleClick(idx)}
                className={`pixel-box p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                  ach.unlocked ? "bg-[#0d0417]" : "bg-[#08020e] opacity-60 grayscale hover:grayscale-0"
                } ${isInspected ? "border-[#f755bc] shadow-[0_0_20px_rgba(247,85,188,0.3)]" : ""}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-[#1b072c] border-2 border-[#3b1c5a] flex items-center justify-center text-3xl shadow-[3px_3px_0px_0px_#000000]">
                    {ach.icon}
                  </div>
                  <PixelBadge variant={ach.unlocked ? "pink" : "purple"}>
                    {ach.rarity}
                  </PixelBadge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-pixel text-xs text-white tracking-wider">
                      {ach.title}
                    </h3>
                    <span className="font-pixel text-[10px] text-amber-300">
                      +{ach.xp} XP
                    </span>
                  </div>
                  <p className="font-retro text-lg text-[#a79bb7] leading-relaxed">
                    {ach.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#3b1c5a] flex items-center justify-between text-[9px] font-pixel">
                  <span className={ach.unlocked ? "text-emerald-400" : "text-gray-500"}>
                    {ach.unlocked ? "✦ UNLOCKED" : "🔒 LOCKED"}
                  </span>
                  <span className="text-[#a79bb7]">COLLECTIBLE</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};