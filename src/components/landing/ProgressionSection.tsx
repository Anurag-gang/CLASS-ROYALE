"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, Flame, Shield, Award, Crown, ArrowRight, Star, ChevronRight, Zap } from "lucide-react";
import { retroSound } from "@/lib/sound";

interface StudentRank {
  tier: string;
  levels: string;
  color: string;
  badge: string;
  description: string;
}

const ranks: StudentRank[] = [
  {
    tier: "Novice Apprentice",
    levels: "LV. 1 - 5",
    color: "from-zinc-400 to-zinc-600",
    badge: "🌱",
    description: "Beginning the journey. Learning fundamental syntax and logic gates.",
  },
  {
    tier: "Pixel Squire",
    levels: "LV. 6 - 12",
    color: "from-blue-400 to-blue-600",
    badge: "🛡️",
    description: "Conquering arrays, linked structures, and basic recursion.",
  },
  {
    tier: "Code Paladin",
    levels: "LV. 13 - 20",
    color: "from-emerald-400 to-emerald-600",
    badge: "⚔️",
    description: "Defeating dynamic programming bosses and balancing binary search trees.",
  },
  {
    tier: "Knowledge Knight",
    levels: "LV. 21 - 34",
    color: "from-cyan-400 to-cyan-600",
    badge: "⚡",
    description: "Architecting distributed systems and proving structural induction.",
  },
  {
    tier: "Archmage",
    levels: "LV. 35 - 49",
    color: "from-violet-400 to-fuchsia-600",
    badge: "🔮",
    description: "Mastering zero-knowledge cryptography, concurrency models, and compilers.",
  },
  {
    tier: "Grandmaster",
    levels: "LV. 50+",
    color: "from-amber-300 to-amber-500",
    badge: "👑",
    description: "Legendary status. Guiding peer cohorts and dominating university arena tournaments.",
  },
];

interface LeaderboardEntry {
  rank: number;
  handle: string;
  tier: string;
  level: number;
  xp: string;
  streak: number;
  accuracy: string;
}

const sampleLeaderboard: LeaderboardEntry[] = [
  { rank: 1, handle: "Kaelen_V", tier: "Archmage", level: 48, xp: "34,920 XP", streak: 28, accuracy: "99.2%" },
  { rank: 2, handle: "Elena_R", tier: "Archmage", level: 42, xp: "31,450 XP", streak: 21, accuracy: "98.7%" },
  { rank: 3, handle: "Devon_X", tier: "Knowledge Knight", level: 38, xp: "28,110 XP", streak: 19, accuracy: "97.5%" },
  { rank: 4, handle: "Sarah_M", tier: "Knowledge Knight", level: 35, xp: "25,600 XP", streak: 14, accuracy: "96.8%" },
  { rank: 5, handle: "Tariq_Z", tier: "Code Paladin", level: 27, xp: "21,340 XP", streak: 12, accuracy: "95.1%" },
];

export const ProgressionSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tiers" | "leaderboard">("tiers");

  return (
    <section id="progression" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background illumination */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-950/20 blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-hud tracking-widest text-violet-300">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>ACADEMIC PROGRESSION</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          Ascend The Ranks of <br />
          <span className="text-gradient-gold">Computational Scholarship</span>
        </h2>
        <p className="font-body text-base text-zinc-400">
          In Class Royale, learning isn&apos;t locked away behind a report card delivered at semester&apos;s end.
          Every verified proof, defeated quiz boss, and quest completed elevates your rank.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex p-1.5 rounded-2xl bg-[#090e24] border border-violet-500/20">
          <button
            type="button"
            onClick={() => {
              setActiveTab("tiers");
              retroSound.playClick();
            }}
            className={`px-5 py-2 rounded-xl font-display text-xs font-semibold transition-all ${
              activeTab === "tiers"
                ? "bg-violet-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Rank Tiers &amp; Badges
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("leaderboard");
              retroSound.playClick();
            }}
            className={`px-5 py-2 rounded-xl font-display text-xs font-semibold transition-all ${
              activeTab === "leaderboard"
                ? "bg-violet-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Live Cohort Leaderboard
          </button>
        </div>
      </div>

      {/* Content View: Tiers */}
      {activeTab === "tiers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ranks.map((r, idx) => (
            <div
              key={r.tier}
              className="realm-surface rounded-2xl p-6 border border-white/10 hover:border-violet-500/50 hover:shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all duration-300 relative group"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {r.badge}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base text-white">{r.tier}</h4>
                    <span className="font-mono text-xs text-amber-400 font-semibold">{r.levels}</span>
                  </div>
                </div>
                <span className="font-hud text-xs text-zinc-500">TIER 0{idx + 1}</span>
              </div>

              <p className="font-body text-xs text-zinc-300 leading-relaxed">
                {r.description}
              </p>

              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>XP Multiplier: 1.{idx + 1}x</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Unlocked Quests
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content View: Leaderboard */}
      {activeTab === "leaderboard" && (
        <div className="max-w-4xl mx-auto realm-surface rounded-2xl border border-violet-500/30 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="px-6 py-4 bg-[#050818] border-b border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-display font-bold text-sm text-white">Fall 2026 CS Grand Championship</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Updates
            </span>
          </div>

          <div className="divide-y divide-white/5">
            {sampleLeaderboard.map((student) => (
              <div
                key={student.rank}
                className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors gap-4"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-hud text-xs font-bold ${
                      student.rank === 1
                        ? "bg-amber-400 text-black shadow-[0_0_15px_#f59e0b]"
                        : student.rank === 2
                        ? "bg-zinc-300 text-black"
                        : student.rank === 3
                        ? "bg-amber-700 text-white"
                        : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    {student.rank}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-sm text-white">{student.handle}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950/60 border border-violet-500/30 text-violet-300">
                        {student.tier}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">Level {student.level}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-1.5 text-amber-400 text-xs font-hud">
                    <Flame className="w-4 h-4" />
                    <span>{student.streak}D STREAK</span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-sm font-bold text-cyan-300">{student.xp}</div>
                    <div className="text-[11px] font-mono text-emerald-400">{student.accuracy} Accuracy</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-[#050818] border-t border-violet-500/20 text-center">
            <Link
              href="/register"
              onClick={() => retroSound.playClick()}
              className="font-display text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5"
            >
              <span>Join Your University Cohort</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};
