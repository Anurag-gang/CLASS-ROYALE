"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { RetroButton } from "@/components/retro/RetroButton";
import { ArrowRight, Frown, Sparkles, Swords, Zap, Trophy } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const ProblemScene: React.FC = () => {
  const [swapped, setSwapped] = useState(false);

  const toggleTransformation = () => {
    retroSound.playClick();
    setSwapped(!swapped);
    if (!swapped) {
      retroSound.playLevelUp();
    }
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t-4 border-[#3b1c5a] bg-[#070110]">
      <div className="max-w-6xl mx-auto space-y-12 text-center">
        {/* Header */}
        <div className="space-y-3">
          <PixelBadge variant="crimson">SHIFT</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            NO MORE <span className="text-[#de1659]">GRIND</span>
          </h2>
          <p className="font-retro text-xl text-[#a79bb7] max-w-xl mx-auto">
            Swap boring lectures for quests, boss battles, and XP.
          </p>
        </div>

        {/* Interactive Comparison Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Boring Legacy Method */}
          <div className="pixel-box p-6 bg-[#0a0512] border-gray-700 text-left space-y-6 opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 font-pixel text-xs">
                <Frown className="w-5 h-5 text-gray-400" />
                <span>THE BORING OLD WAY</span>
              </div>
              <span className="font-pixel text-[9px] text-gray-500 bg-gray-900 px-2 py-0.5">
                STATUS: ASLEEP
              </span>
            </div>

            <div className="space-y-3 font-pixel text-xs text-gray-400">
              <div className="p-3 bg-gray-900/50 border border-gray-800 flex items-center gap-3">
                <span className="text-gray-600">01</span>
                <span>MONOTONE 90-MIN LECTURE</span>
              </div>
              <div className="p-3 bg-gray-900/50 border border-gray-800 flex items-center gap-3">
                <span className="text-gray-600">02</span>
                <span>PASSIVE TEXTBOOK HIGHLIGHTING</span>
              </div>
              <div className="p-3 bg-gray-900/50 border border-gray-800 flex items-center gap-3">
                <span className="text-gray-600">03</span>
                <span>STRESS-INDUCING EXAMS</span>
              </div>
              <div className="p-3 bg-gray-900/50 border border-gray-800 flex items-center gap-3">
                <span className="text-gray-600">04</span>
                <span>REPEAT UNTIL BURNOUT</span>
              </div>
            </div>

            <div className="text-[10px] font-pixel text-gray-500 text-center pt-2">
              RESULT: 0 XP • 0 ENTHUSIASM • FORGOTTEN IN 1 WEEK
            </div>
          </div>

          {/* The Class Royale Game Way */}
          <div className="pixel-box-pink p-6 bg-[#130321] text-left space-y-6 relative overflow-hidden shadow-[0_0_30px_rgba(247,85,188,0.15)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f755bc]/40">
              <div className="flex items-center gap-2 text-[#f755bc] font-pixel text-xs">
                <Sparkles className="w-5 h-5 text-[#f755bc]" />
                <span>THE CLASS ROYALE WAY</span>
              </div>
              <span className="font-pixel text-[9px] text-[#f755bc] bg-[#29083b] px-2 py-0.5 border border-[#f755bc]">
                STATUS: ADDICTIVE
              </span>
            </div>

            <div className="space-y-3 font-pixel text-xs text-white">
              <div className="p-3 bg-[#1e0733] border border-[#f755bc]/50 flex items-center gap-3 hover:translate-x-1 transition-transform">
                <span className="text-[#f755bc]">01</span>
                <span>ACCEPT CODING QUEST</span>
                <span className="ml-auto text-[10px] text-amber-300">+500 XP</span>
              </div>
              <div className="p-3 bg-[#1e0733] border border-[#f755bc]/50 flex items-center gap-3 hover:translate-x-1 transition-transform">
                <span className="text-[#f755bc]">02</span>
                <span>ENGAGE IN BOSS QUIZ BATTLE</span>
                <span className="ml-auto text-[10px] text-amber-300">⚔️ COMBAT</span>
              </div>
              <div className="p-3 bg-[#1e0733] border border-[#f755bc]/50 flex items-center gap-3 hover:translate-x-1 transition-transform">
                <span className="text-[#f755bc]">03</span>
                <span>LEVEL UP & UNLOCK RANKS</span>
                <span className="ml-auto text-[10px] text-[#f755bc]">LV. +1</span>
              </div>
              <div className="p-3 bg-[#1e0733] border border-[#f755bc]/50 flex items-center gap-3 hover:translate-x-1 transition-transform">
                <span className="text-[#f755bc]">04</span>
                <span>CLIMB ARENA LEADERBOARD</span>
                <span className="ml-auto text-[10px] text-emerald-400">#01 HIGH SCORE</span>
              </div>
            </div>

            <div className="text-[10px] font-pixel text-[#f755bc] text-center pt-2">
              RESULT: MASTERY ACHIEVED • REAL RETENTION • UNSTOPPABLE STREAK
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};