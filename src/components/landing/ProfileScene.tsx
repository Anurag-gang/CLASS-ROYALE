"use client";

import React from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { PixelProgress } from "@/components/retro/PixelProgress";
import { Flame, Trophy, Swords, Zap, Award, Target, Shield } from "lucide-react";

export const ProfileScene: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#070110] border-t-4 border-[#3b1c5a]">
      <div className="max-w-4xl mx-auto space-y-12 text-center">
        <div className="space-y-4">
          <PixelBadge variant="pink">CHARACTER SHEET</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            YOUR <span className="text-[#f755bc]">PLAYER PROFILE</span>
          </h2>
          <p className="font-retro text-xl sm:text-2xl text-[#a79bb7] max-w-xl mx-auto">
            Every problem solved, quest cleared, and streak preserved is recorded permanently on your character card.
          </p>
        </div>

        {/* Big Retro RPG Profile Card */}
        <div className="pixel-box-pink p-6 sm:p-8 bg-[#0e031a] text-left max-w-2xl mx-auto space-y-6 shadow-[0_0_35px_rgba(247,85,188,0.2)]">
          {/* Top Header with Avatar */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b-2 border-[#3b1c5a]">
            <div className="w-20 h-20 bg-[#1f0b35] border-4 border-[#f755bc] flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_#000000]">
              ⚔️
            </div>
            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-pixel text-xl text-white tracking-wider">ANURAG</h3>
                  <p className="font-retro text-lg text-[#a79bb7]">CLASS: COMPUTER SCIENCE</p>
                </div>
                <PixelBadge variant="pink" className="self-center sm:self-auto">
                  LV. 27
                </PixelBadge>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <span className="font-pixel text-[11px] text-amber-300">
                  RANK: KNOWLEDGE KNIGHT
                </span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="space-y-2">
            <PixelProgress
              value={9450}
              max={10000}
              label="TOTAL EXPERIENCE"
              sublabel="9,450 / 10,000 XP"
              variant="pink"
              showPercent
            />
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-[#170526] border-2 border-[#3b1c5a] text-left">
              <div className="flex items-center gap-1.5 text-xs font-pixel text-[#a79bb7] mb-1">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                <span>STREAK</span>
              </div>
              <div className="font-pixel text-base text-white">12 DAYS</div>
            </div>

            <div className="p-3 bg-[#170526] border-2 border-[#3b1c5a] text-left">
              <div className="flex items-center gap-1.5 text-xs font-pixel text-[#a79bb7] mb-1">
                <Target className="w-4 h-4 text-[#f755bc]" />
                <span>QUESTS</span>
              </div>
              <div className="font-pixel text-base text-white">128 CLEAR</div>
            </div>

            <div className="p-3 bg-[#170526] border-2 border-[#3b1c5a] text-left col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs font-pixel text-[#a79bb7] mb-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>TROPHIES</span>
              </div>
              <div className="font-pixel text-base text-white">24 UNLOCKED</div>
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="flex items-center justify-between text-[10px] font-pixel text-[#7e6e91] pt-3 border-t border-[#3b1c5a]">
            <span>CARD SERIAL: #CR-0027-ANURAG</span>
            <span className="text-emerald-400">ONLINE IN ARENA</span>
          </div>
        </div>
      </div>
    </section>
  );
};