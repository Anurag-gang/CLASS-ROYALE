"use client";

import React from "react";
import Link from "next/link";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { PixelProgress } from "@/components/retro/PixelProgress";
import CRTWarp from "@/components/retro/CRTWarp";
import { Swords, Zap, Shield, Flame, Sparkles, ChevronRight, Trophy } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const HeroScene: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
      {/* CRT Warp Canvas Background Layer */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <CRTWarp
          color="#f755bc"
          backgroundColor="#05010a"
          speed={0.8}
          curvature={0.22}
          scanlineStrength={0.5}
          scanlineFrequency={220}
          waveAmplitude={0.4}
          waveFrequency={2.5}
          bloom={1.8}
          bloomRadius={1}
          noise={0.08}
          vignette={0.2}
          brightness={1.2}
          pixelation="1"
          rgbShift={0.015}
          mouseReact
          mouseStrength={0.3}
          dpr="1"
          fps="60"
          paused={false}
          className="w-full h-full"
        />
      </div>

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b1c5a15_1px,transparent_1px),linear-gradient(to_bottom,#3b1c5a15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 animate-float">
          <PixelBadge variant="pink">
            <Sparkles className="w-3.5 h-3.5 text-[#f755bc]" />
            <span>SEASON 01 • ARCADE ACADEMY</span>
          </PixelBadge>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white uppercase drop-shadow-[0_4px_0_#de1659]">
            CLASS <span className="text-neon-pink">ROYALE</span>
          </h1>
          <p className="font-pixel text-xs sm:text-sm md:text-lg text-amber-300 tracking-wider">
            TURN LEARNING INTO A GAME.
          </p>
        </div>

        {/* Narrative Subtitle */}
        <p className="font-retro text-xl sm:text-2xl text-[#d4cae3] max-w-2xl mx-auto leading-relaxed">
          Quests, boss battles, level-ups, and streaks. Pure 8-bit learning.
        </p>

        {/* Interactive HUD Mini-Card */}
        <div className="max-w-md mx-auto pixel-box-pink p-4 bg-[#0d0617]/90 text-left space-y-3">
          <div className="flex items-center justify-between text-[11px] font-pixel">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧙‍♂️</span>
              <span className="text-white">PLAYER_ONE</span>
            </div>
            <span className="text-[#f755bc]">LV. 27 KNIGHT</span>
          </div>
          <PixelProgress
            value={850}
            max={1000}
            label="EXP"
            sublabel="850 / 1000 XP"
            variant="pink"
            showPercent
          />
          <div className="flex items-center justify-between text-[10px] font-pixel text-[#a79bb7] pt-1 border-t border-[#3b1c5a]">
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>12 DAYS</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>RANK #02</span>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/signup">
            <RetroButton variant="pink" size="lg" className="w-full sm:w-auto">
              <Swords className="w-4 h-4 mr-2" />
              START QUEST
            </RetroButton>
          </Link>
          <Link href="/ai-tutor">
            <RetroButton variant="pink" size="lg" className="w-full sm:w-auto">
              🧙‍♂️ AI SAGE
            </RetroButton>
          </Link>
          <Link href="/#battle">
            <RetroButton variant="secondary" size="lg" className="w-full sm:w-auto">
              <Shield className="w-4 h-4 mr-2" />
              ARENA
            </RetroButton>
          </Link>
        </div>

        {/* Floating Feature Tickers */}
        <div className="pt-4 flex flex-wrap justify-center items-center gap-3 text-[10px] font-pixel text-[#a79bb7]">
          <span className="px-3 py-1 bg-[#120320] border border-[#3b1c5a] text-[#f755bc]">
            CRT SHADERS
          </span>
          <span className="px-3 py-1 bg-[#120320] border border-[#3b1c5a] text-[#c084fc]">
            AI TUTOR
          </span>
          <span className="px-3 py-1 bg-[#120320] border border-[#3b1c5a] text-emerald-400">
            CODE BATTLES
          </span>
          <span className="px-3 py-1 bg-[#120320] border border-[#3b1c5a] text-yellow-400">
            XP TRACKING
          </span>
        </div>
      </div>
    </section>
  );
};