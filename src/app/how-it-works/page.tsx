"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Target,
  Cpu,
  Sparkles,
  Users,
  Award,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { LearningLoopStroke } from "@/components/motion/LearningLoopStroke";
import { SectionConnectorStroke } from "@/components/motion/SectionConnectorStroke";
import { retroSound } from "@/lib/sound";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-400 selection:text-slate-950 font-body py-16 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto space-y-20">
        {/* Page Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
          <h1 className="font-condensed font-black text-5xl sm:text-7xl md:text-8xl uppercase tracking-tight text-white leading-none">
            HOW CLASS ROYALE <br />
            <span className="text-cyan-400">ENGINEERS MASTERY</span>
          </h1>
        </div>

        {/* 5-Stage Interactive Learning Loop */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-condensed font-bold uppercase text-white tracking-wider">
              Feedback Loop
            </h2>
          </div>

          <LearningLoopStroke />
        </div>

        <SectionConnectorStroke variant="s-curve" />

        {/* Core Principles Grid */}
        <div className="space-y-10">
          <div className="text-center">
            <h2 className="font-condensed font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
              ENGINEERED FOR DEEP RETRIEVAL
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-[#080a12]/90 border border-white/[0.08] hover:border-cyan-400/40 transition-all space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 text-xl font-bold">
                01
              </div>
              <h3 className="font-condensed font-black text-2xl uppercase tracking-tight text-white">
                Item Response Theory
              </h3>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-[#080a12]/90 border border-white/[0.08] hover:border-cyan-400/40 transition-all space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center text-violet-400 text-xl font-bold">
                02
              </div>
              <h3 className="font-condensed font-black text-2xl uppercase tracking-tight text-white">
                Bayesian Knowledge Tracing
              </h3>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-[#080a12]/90 border border-white/[0.08] hover:border-cyan-400/40 transition-all space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                03
              </div>
              <h3 className="font-condensed font-black text-2xl uppercase tracking-tight text-white">
                Cohort Clan Dynamics
              </h3>
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-[#0a0d18] to-violet-950/40 border border-cyan-400/20 text-center space-y-6">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            READY TO COMMENCE?
          </span>
          <h2 className="font-condensed font-black text-3xl sm:text-5xl uppercase tracking-tight text-white max-w-2xl mx-auto leading-tight">
            START YOUR ACADEMIC DIAGNOSTIC TODAY
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-inter max-w-xl mx-auto leading-relaxed">
            Choose your engineering subject, complete your baseline diagnostic assessment, and let the Class Royale adaptive engine build your personal roadmap.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/subjects"
              onClick={() => retroSound.playClick()}
              className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              Explore Subject Catalog &rarr;
            </Link>
            <Link
              href="/dashboard"
              onClick={() => retroSound.playClick()}
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs uppercase tracking-wider transition-all"
            >
              Enter Student Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
