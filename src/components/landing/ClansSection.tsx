"use client";

import React from "react";
import Link from "next/link";
import { Users, Trophy, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const ClansSection: React.FC = () => {
  return (
    <section id="clans" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Minimal Messaging */}
        <div className="lg:col-span-6 space-y-6">
          <span className="font-hud text-xs text-cyan-400 tracking-widest uppercase font-semibold">
            ACADEMIC PEER GROUPS
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            LEARN TOGETHER. <br />
            <span className="text-gradient-cyan">COMPETE TOGETHER.</span>
          </h2>

          <div className="space-y-3 font-body text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Create or join a Clan for your university classroom or study group.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span>Compare meaningful academic progress across subjects.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Participate in scheduled quizzes and challenges.</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/clans"
              onClick={() => retroSound.playClick()}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-display text-xs font-semibold shadow-md transition-colors flex items-center gap-2"
            >
              <span>Explore Clans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/clans/create"
              onClick={() => retroSound.playClick()}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white font-display text-xs font-medium transition-colors"
            >
              <span>Create a Clan</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Beautiful Clan UI Preview */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl bg-[#070c20]/90 border border-cyan-500/30 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl space-y-6">
            {/* Clan Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">UPES — DEVOPS BATCH 3</h3>
                  <span className="text-xs font-mono text-zinc-400">Classroom Cohort • Code: UPES-DO-B3</span>
                </div>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold">
                128 Members
              </span>
            </div>

            {/* Average Mastery Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Average Class Mastery</span>
                <span className="text-cyan-300 font-bold">76%</span>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full" style={{ width: "76%" }} />
              </div>
            </div>

            {/* Clan Leaderboard Preview */}
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                TOP COHORT SCHOLARS
              </div>
              <div className="space-y-2">
                {[
                  { rank: 1, name: "Aarav", mastery: "94% Mastery", accuracy: "98% Accuracy" },
                  { rank: 2, name: "Riya", mastery: "91% Mastery", accuracy: "95% Accuracy" },
                  { rank: 3, name: "Anurag", mastery: "88% Mastery", accuracy: "92% Accuracy" },
                ].map((item) => (
                  <div
                    key={item.rank}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] ${
                        item.rank === 1 ? "bg-amber-400 text-black" : "bg-white/10 text-zinc-300"
                      }`}>
                        #{item.rank}
                      </span>
                      <span className="font-display font-semibold text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-300 font-bold">{item.mastery}</span>
                      <span className="text-zinc-400 hidden sm:inline">{item.accuracy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
