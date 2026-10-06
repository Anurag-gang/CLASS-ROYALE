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
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            METHODOLOGY &amp; ARCHITECTURE
          </span>
          <h1 className="font-condensed font-black text-5xl sm:text-7xl md:text-8xl uppercase tracking-tight text-white leading-none">
            HOW CLASS ROYALE <br />
            <span className="text-cyan-400">ENGINEERS MASTERY</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed font-body">
            Engineering education shouldn&apos;t be passive video consumption or guesswork. Class Royale transforms university syllabi into continuous, measurable, active mastery loops powered by machine learning.
          </p>
        </div>

        {/* 5-Stage Interactive Learning Loop */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-condensed font-bold uppercase text-white tracking-wider">
              The 5-Step Continuous Feedback Loop
            </h2>
            <p className="text-xs font-mono text-zinc-500 uppercase mt-1">
              From syllabus atomization to cohort competition
            </p>
          </div>

          <LearningLoopStroke />
        </div>

        <SectionConnectorStroke variant="s-curve" />

        {/* Core Principles Grid */}
        <div className="space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              ACADEMIC RIGOR
            </span>
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
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Questions are mathematically calibrated according to latent difficulty, discrimination, and student capability. No more arbitrary quiz scores.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-[#080a12]/90 border border-white/[0.08] hover:border-cyan-400/40 transition-all space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-violet-400/10 border border-violet-400/30 flex items-center justify-center text-violet-400 text-xl font-bold">
                02
              </div>
              <h3 className="font-condensed font-black text-2xl uppercase tracking-tight text-white">
                Bayesian Knowledge Tracing
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Our supervised ML model predicts your exact probability of mastering each concept topic based on interaction histories, response times, and error patterns.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-[#080a12]/90 border border-white/[0.08] hover:border-cyan-400/40 transition-all space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                03
              </div>
              <h3 className="font-condensed font-black text-2xl uppercase tracking-tight text-white">
                Cohort Clan Dynamics
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Study clans allow students to tackle engineering problems collaboratively, compare mastery metrics across university departments, and participate in timed sprints.
              </p>
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
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
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
