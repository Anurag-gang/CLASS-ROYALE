"use client";

import React, { useState } from "react";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { Clock, Zap, CheckCircle2, ShieldAlert } from "lucide-react";
import { retroSound } from "@/lib/sound";

const sampleQuests = [
  {
    id: "042",
    title: "MASTER BINARY TREES",
    desc: "Traverse balanced BST nodes, solve left-right subtree ordering, and calculate logarithmic heights.",
    xp: 500,
    difficulty: 4,
    duration: "20 MIN",
    category: "COMP SCI",
    status: "AVAILABLE",
  },
  {
    id: "019",
    title: "MODULAR CIPHER ASSAULT",
    desc: "Calculate modulo congruences and decipher RSA public-key encryption math.",
    xp: 450,
    difficulty: 3,
    duration: "15 MIN",
    category: "MATH",
    status: "AVAILABLE",
  },
  {
    id: "088",
    title: "NEXT.JS HYDRATION SHIELD",
    desc: "Neutralize hydration mismatches and orchestrate streaming Server Components.",
    xp: 600,
    difficulty: 5,
    duration: "25 MIN",
    category: "WEB ENG",
    status: "AVAILABLE",
  },
];

export const QuestScene: React.FC = () => {
  const [acceptedIds, setAcceptedIds] = useState<Record<string, boolean>>({});

  const handleAccept = (id: string) => {
    retroSound.playCoin();
    setAcceptedIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="quests" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#05010a] border-t-4 border-[#3b1c5a]">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <PixelBadge variant="crimson">BOUNTIES</PixelBadge>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white uppercase tracking-tight">
            ACTIVE <span className="text-[#de1659]">QUESTS</span>
          </h2>
          <p className="font-retro text-xl text-[#a79bb7] max-w-xl mx-auto">
            Take on targeted missions, clear objectives, and claim XP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleQuests.map((q) => {
            const isAccepted = acceptedIds[q.id];
            return (
              <div
                key={q.id}
                className="pixel-box p-6 bg-[#0c0316] text-left flex flex-col justify-between space-y-5 hover:border-[#de1659] transition-colors"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-xs text-[#a79bb7]">QUEST #{q.id}</span>
                    <PixelBadge variant={q.id === "042" ? "crimson" : "purple"}>
                      {q.category}
                    </PixelBadge>
                  </div>

                  {/* Title */}
                  <h3 className="font-pixel text-sm text-white tracking-wide leading-relaxed">
                    {q.title}
                  </h3>

                  <p className="font-retro text-lg text-[#a79bb7] leading-normal">{q.desc}</p>

                  {/* Meta Specs */}
                  <div className="space-y-2 pt-2 border-t border-[#3b1c5a] text-[10px] font-pixel">
                    <div className="flex justify-between items-center text-amber-300">
                      <span>XP REWARD</span>
                      <span>+{q.xp} XP</span>
                    </div>
                    <div className="flex justify-between items-center text-white">
                      <span>DIFFICULTY</span>
                      <span className="text-[#de1659]">
                        {"█".repeat(q.difficulty)}
                        {"░".repeat(5 - q.difficulty)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#a79bb7]">
                      <span>DURATION</span>
                      <span>{q.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  {isAccepted ? (
                    <div className="w-full py-3 bg-[#032412] border-2 border-[#10b981] text-[#4ade80] font-pixel text-center text-[10px] flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                      <span>QUEST ACCEPTED!</span>
                    </div>
                  ) : (
                    <RetroButton
                      variant={q.id === "042" ? "crimson" : "pink"}
                      size="sm"
                      className="w-full"
                      onClick={() => handleAccept(q.id)}
                    >
                      [ ACCEPT QUEST ]
                    </RetroButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};