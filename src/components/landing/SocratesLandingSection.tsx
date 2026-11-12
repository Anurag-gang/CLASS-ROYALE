"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Brain, Zap, Code2, ShieldCheck } from "lucide-react";
import { SectionHeader, CornerFrame, TechnicalBorder } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function SocratesLandingSection() {
  const sampleDialectics = [
    {
      icon: Zap,
      label: "Complexity & Proofs",
      text: "Rigorous Big-O space/time derivations and recurrence relations.",
    },
    {
      icon: Code2,
      label: "Code & Invariant Verification",
      text: "Isolates memory leaks, race conditions, and boundary edge cases.",
    },
    {
      icon: ShieldCheck,
      label: "Zero-Latency Local Engine",
      text: "Runs 100% privately on your machine without cloud dependencies.",
    },
  ];

  return (
    <section id="socrates-section" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-cyan-500/5 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-14 relative z-10">
        {/* Section Header */}
        <SectionHeader
          number="AI"
          title="MEET SOCRATES — YOUR DIALECTIC AI PARTNER."
        />

        <TechnicalBorder />

        {/* Two-Column Minimal Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Conceptual Overview & Direct CTA */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-mono tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Socratic Reasoning &middot; Local Intellect</span>
            </div>

            <h3 className="font-condensed font-black text-3xl sm:text-4xl text-white tracking-wide uppercase leading-tight">
              NEVER JUST HANDS ANSWERS. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-white">
                TEACHES YOU HOW TO THINK.
              </span>
            </h3>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-sans max-w-xl">
              Engineered natively into Class Royale, Socrates uses guided dialectic inquiry to probe your understanding of computer science fundamentals. Test your algorithmic invariants, verify tricky edge cases, and dissect formal proofs through conversational discovery.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {sampleDialectics.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <CornerFrame key={idx} className="p-3.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-semibold text-white tracking-wide">{item.label}</h4>
                    <p className="text-[11px] text-zinc-400 leading-snug">{item.text}</p>
                  </CornerFrame>
                );
              })}
            </div>

            {/* Launch Button */}
            <div className="pt-4">
              <Link
                href="/socrates"
                onClick={() => retroSound.playClick()}
                className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] active:scale-95"
              >
                <span>Launch Socrates Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Sleek Dialectic Preview Card */}
          <div className="lg:col-span-6">
            <CornerFrame size={12} className="p-6 sm:p-8 rounded-2xl bg-[#080d17]/80 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-5">
              {/* Minimal Top Window Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] text-xs font-mono text-zinc-500">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  <span className="text-white font-semibold tracking-wider uppercase">SOCRATES DIALECTIC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">
                    INTERACTIVE
                  </span>
                </div>
              </div>

              {/* Sample User Prompt */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5 text-xs text-cyan-100 leading-relaxed font-sans">
                  What memory invariants must be preserved when implementing a lock-free queue with atomic compare-and-swap?
                </div>
              </div>

              {/* Sample Socrates Reply */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 text-xs text-zinc-300 leading-relaxed font-sans space-y-2">
                <p>
                  Consider the relationship between the <span className="font-mono text-cyan-300">head</span> and <span className="font-mono text-cyan-300">tail</span> pointers in a Michael-Scott lock-free queue.
                </p>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[11px] text-cyan-200">
                  Invariant: Tail never lags more than one node behind the true terminal node.
                </div>
                <p className="text-zinc-400">
                  Before performing CAS, what prevents the ABA problem when an old node address is recycled by another thread?
                </p>
              </div>

              {/* Interactive Minimalist Pill Preview */}
              <div className="pt-2">
                <div className="rounded-full bg-[#131720] border border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500 font-sans truncate">Ask Socrates about algorithms, systems, or code...</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-zinc-300 text-[11px] font-sans">
                      Qwen 30B
                    </span>
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                      &rarr;
                    </div>
                  </div>
                </div>
              </div>
            </CornerFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
