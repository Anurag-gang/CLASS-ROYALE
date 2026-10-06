"use client";

import React from "react";
import Link from "next/link";
import { Award, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const BadgesSection: React.FC = () => {
  const badges = [
    {
      code: "CS-201",
      subject: "DATA STRUCTURES",
      status: "MASTERED",
      icon: "⚡",
      color: "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      statusColor: "text-emerald-400 bg-emerald-950/80 border-emerald-500/40",
      progress: 100,
    },
    {
      code: "CS-203",
      subject: "DATABASE SYSTEMS",
      status: "MASTERED",
      icon: "🗄️",
      color: "border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      statusColor: "text-emerald-400 bg-emerald-950/80 border-emerald-500/40",
      progress: 100,
    },
    {
      code: "CS-204",
      subject: "COMPUTER NETWORKS",
      status: "72% IN PROGRESS",
      icon: "🌐",
      color: "border-cyan-500/30 bg-cyan-950/20",
      statusColor: "text-cyan-400 bg-cyan-950/80 border-cyan-500/40",
      progress: 72,
    },
    {
      code: "CS-202",
      subject: "OPERATING SYSTEMS",
      status: "81% IN PROGRESS",
      icon: "💻",
      color: "border-violet-500/30 bg-violet-950/20",
      statusColor: "text-violet-400 bg-violet-950/80 border-violet-500/40",
      progress: 81,
    },
  ];

  return (
    <section id="badges" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
        <div className="space-y-2 max-w-2xl">
          <span className="font-hud text-xs text-amber-400 tracking-widest uppercase font-semibold">
            ACADEMIC CREDENTIALS
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            MASTER SUBJECTS. <br />
            <span className="text-gradient-gold">EARN PROOF.</span>
          </h2>
          <p className="font-body text-xs sm:text-sm text-zinc-400">
            Meaningful academic badges. Earning a badge means you truly mastered the subject.
          </p>
        </div>

        <Link
          href="/badges"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>Explore All Badges</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {badges.map((b) => (
          <div
            key={b.subject}
            className={`rounded-2xl p-6 border ${b.color} backdrop-blur-xl space-y-4 hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                {b.icon}
              </div>
              <span className={`font-pixel text-[9px] px-2.5 py-1 rounded border font-semibold tracking-wider ${b.statusColor}`}>
                {b.status}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">{b.code}</span>
              <h3 className="font-display font-bold text-sm text-white tracking-wide mt-0.5">
                {b.subject}
              </h3>
            </div>

            <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  b.progress === 100
                    ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                    : "bg-gradient-to-r from-violet-500 to-cyan-400"
                }`}
                style={{ width: `${b.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
