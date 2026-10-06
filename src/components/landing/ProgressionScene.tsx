"use client";

import React, { useState } from "react";
import { RetroPanel } from "@/components/retro/RetroPanel";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { retroSound } from "@/lib/sound";
import { BookOpen, CheckSquare, Zap, ArrowUpCircle, Award, Compass } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "CHOOSE YOUR CLASS",
    desc: "Specialize in Computer Science, Discrete Mathematics, Fullstack Web Dev, or Cybersecurity.",
    icon: Compass,
    color: "text-[#f755bc]",
    badge: "SELECT PATH",
  },
  {
    step: "02",
    title: "ACCEPT QUESTS",
    desc: "Lessons transform into bite-sized missions with clear objectives, timers, and loot drops.",
    icon: BookOpen,
    color: "text-[#38bdf8]",
    badge: "MISSION BOARD",
  },
  {
    step: "03",
    title: "COMPLETE CHALLENGES",
    desc: "Fight through interactive quizzes, code puzzles, and conceptual battles against retro AI bosses.",
    icon: CheckSquare,
    color: "text-[#facc15]",
    badge: "BATTLE TRIAL",
  },
  {
    step: "04",
    title: "EARN XP",
    desc: "Every completed exercise, quiz question, and active day fuels your server-calculated experience pool.",
    icon: Zap,
    color: "text-[#4ade80]",
    badge: "XP INTAKE",
  },
  {
    step: "05",
    title: "LEVEL UP",
    desc: "Climb from Novice Apprentice to Grandmaster, unlocking customizable pixel titles and trophies.",
    icon: ArrowUpCircle,
    color: "text-[#c084fc]",
    badge: "TIER ADVANCE",
  },
  {
    step: "06",
    title: "MASTER THE SUBJECT",
    desc: "Achieve 100% curriculum completion, build unshakeable confidence, and dominate the arena.",
    icon: Award,
    color: "text-[#de1659]",
    badge: "FINAL CONQUEST",
  },
];

export const ProgressionScene: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="learn" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#05010a] border-t-4 border-[#3b1c5a]">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Title */}
        <div className="text-center space-y-3">
          <PixelBadge variant="yellow">ROADMAP</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            CAMPAIGN <span className="text-[#f755bc]">PROGRESSION</span>
          </h2>
          <p className="font-retro text-xl text-[#a79bb7] max-w-xl mx-auto">
            Choose your class, accept bounties, conquer quizzes, and dominate the ranks.
          </p>
        </div>

        {/* 6 Step RPG Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={s.step}
                onClick={() => {
                  retroSound.playClick();
                  setActiveStep(idx);
                }}
                className={`pixel-box p-6 text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
                  isSelected ? "border-[#f755bc] bg-[#170526] shadow-[0_0_20px_rgba(247,85,188,0.2)]" : "bg-[#0c0416]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-pixel text-lg text-white/50">{s.step}</span>
                  <PixelBadge variant={isSelected ? "pink" : "purple"}>{s.badge}</PixelBadge>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-[#05010a] border border-[#3b1c5a] ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-pixel text-xs text-white tracking-wider">{s.title}</h3>
                </div>
                <p className="font-retro text-lg text-[#a79bb7] leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};