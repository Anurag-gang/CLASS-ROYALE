"use client";

import React, { useState } from "react";
import { XCircle, CheckCircle2, Zap, ArrowRight, Brain, AlertTriangle, Swords, Sparkles } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const ProblemShiftSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"comparison" | "legacy" | "royale">("comparison");

  const legacyDrawbacks = [
    {
      title: "90-Minute Passive Monologues",
      desc: "Attention spans decay within 15 minutes. Students become passive observers rather than active problem solvers.",
    },
    {
      title: "The Cram-and-Purge Cycle",
      desc: "Information memorized under stress 48 hours before finals dissolves within 72 hours of exam completion.",
    },
    {
      title: "Cryptic, Delayed Feedback",
      desc: "Assignments returned two weeks later with red ink fail to correct foundational mental model flaws when it matters.",
    },
    {
      title: "Isolated Cognitive Frustration",
      desc: "Students hit compiler barriers or proof deadlocks late at night with zero guidance or personalized scaffolding.",
    },
  ];

  const royaleAdvantages = [
    {
      title: "Active Retrieval Duels",
      desc: "Every concept is immediately tested through high-stakes interactive challenge encounters that forge durable neural pathways.",
    },
    {
      title: "Spaced Spire Progression",
      desc: "Algorithmic interval scheduling re-engages previously conquered territories right before memory decay occurs.",
    },
    {
      title: "Instant Socratic Interventions",
      desc: "CR AI pinpoints cognitive misconceptions in real time, asking guiding questions rather than handing out lazy answers.",
    },
    {
      title: "Tangible XP & Mastery Ranks",
      desc: "Progress is visible, measurable, and intrinsically rewarding. Students climb from Novice Apprentice to Grandmaster.",
    },
  ];

  return (
    <section id="shift" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-violet-900/10 blur-[140px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-hud tracking-widest text-cyan-300">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <span>PARADIGM INVERSION</span>
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          The Shift: From Passive Spectating to <br />
          <span className="text-gradient-cyan">Active Cognitive Conquest</span>
        </h2>

        <p className="font-body text-base text-zinc-400 leading-relaxed">
          Traditional universities lecture at students. Class Royale immerses students in an active proving ground where
          every computational concept is conquered through practice, battles, and empirical verification.
        </p>
      </div>

      {/* Side-by-Side Dual Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: The Legacy Lecture Monologue */}
        <div className="relative rounded-2xl p-7 bg-[#070b1a]/70 border border-red-500/20 shadow-lg backdrop-blur-md overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-5 border-b border-red-500/15 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">The Lecture Hall Model</h3>
                <span className="text-xs font-mono text-red-400 uppercase tracking-wider">
                  Legacy Higher Ed Paradigm
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-[11px] font-mono text-red-400 font-semibold">
              Low Retention
            </span>
          </div>

          {/* List of Drawbacks */}
          <div className="space-y-4">
            {legacyDrawbacks.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-red-950/15 border border-red-900/20">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-semibold text-zinc-200">{item.title}</h4>
                  <p className="font-body text-xs text-zinc-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Outcome Footer */}
          <div className="mt-6 pt-4 border-t border-red-500/15 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Result: Passive Cramming</span>
            <span className="text-red-400 font-semibold">~18% 30-Day Retention</span>
          </div>
        </div>

        {/* Right: The Class Royale Conquest Engine */}
        <div className="relative rounded-2xl p-7 realm-surface border border-cyan-500/30 shadow-[0_10px_40px_rgba(6,182,212,0.15)] backdrop-blur-md overflow-hidden group hover:border-cyan-400/60 transition-colors">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header */}
          <div className="flex items-center justify-between pb-5 border-b border-cyan-500/20 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#070b19] rounded-[10px] flex items-center justify-center text-cyan-300">
                  <Swords className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">The Class Royale Arena</h3>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  Active Gamified Mastery
                </span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Sparkles className="w-3 h-3 text-cyan-300 animate-spin" />
              Empirical Mastery
            </span>
          </div>

          {/* List of Advantages */}
          <div className="space-y-4">
            {royaleAdvantages.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-display text-sm font-semibold text-white">{item.title}</h4>
                  <p className="font-body text-xs text-zinc-300 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Outcome Footer */}
          <div className="mt-6 pt-4 border-t border-cyan-500/20 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Result: Durable Fluency</span>
            <span className="text-cyan-300 font-bold">~98.4% Empirical Recall</span>
          </div>
        </div>
      </div>
    </section>
  );
};
