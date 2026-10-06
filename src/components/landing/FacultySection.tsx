"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, BarChart3, Users, UploadCloud, Brain, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const FacultySection: React.FC = () => {
  const [activeMetricTab, setActiveMetricTab] = useState<"mastery" | "diagnostics" | "export">("mastery");

  return (
    <section id="faculty" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-[700px] h-[500px] bg-blue-900/10 blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-xs font-hud tracking-widest text-blue-300">
          <GraduationCap className="w-4 h-4 text-blue-400" />
          <span>INSTITUTIONAL GRADE LMS</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          A Precision Command Center for <br />
          <span className="text-gradient-cyan">University Faculty &amp; Deans</span>
        </h2>
        <p className="font-body text-base text-zinc-400 leading-relaxed">
          While students experience an immersive cognitive adventure, professors get an ultra-clean, high-density
          institutional analytics dashboard to monitor cohorts, detect syllabus stumbling blocks, and sync grades.
        </p>
      </div>

      {/* Faculty Console Mockup */}
      <div className="rounded-2xl bg-[#090d1c] border border-blue-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden">
        {/* Modern Clean App Bar */}
        <div className="px-6 py-4 bg-[#050814] border-b border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-white">Faculty Command Suite</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300">
                  CS-201: Data Structures
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">148 Active Students // Fall Semester</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              onClick={() => retroSound.playClick()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs font-semibold text-blue-200 hover:bg-blue-600/30 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Faculty Portal Login</span>
            </Link>
          </div>
        </div>

        {/* Faculty Dashboard Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Real-Time Cohort Telemetry Heatmap */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h4 className="font-display font-bold text-base text-white">Curriculum Topic Mastery Matrix</h4>
                <p className="font-body text-xs text-zinc-400">Real-time aggregate understanding across all active enrolled students</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">91.4% Avg Class Score</span>
            </div>

            {/* Mastery Matrix Grid */}
            <div className="space-y-3">
              {[
                { topic: "Asymptotic Notation & Recurrence Relations", mastery: 96, status: "Mastered", color: "bg-emerald-500" },
                { topic: "Balanced AVL & Red-Black Tree Invariants", mastery: 74, status: "Review Needed", color: "bg-amber-500" },
                { topic: "Dijkstra & Priority Queue Implementations", mastery: 89, status: "Mastered", color: "bg-emerald-500" },
                { topic: "Dynamic Programming Memoization vs Tabulation", mastery: 68, status: "Critical Attention", color: "bg-rose-500" },
                { topic: "Graph Topological Sorting & DAG Cycle Traversal", mastery: 92, status: "Mastered", color: "bg-emerald-500" },
              ].map((row, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-display font-medium text-white">{row.topic}</span>
                    <span className="font-mono font-bold text-zinc-300">{row.mastery}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.mastery}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Micro AI Syllabus Upload CTA */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-violet-950/40 border border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-display font-bold text-sm text-white">AI Quest Generator</h5>
                  <p className="font-body text-xs text-zinc-400">Convert your syllabus PDF or lecture slides into 10 game quests in seconds</p>
                </div>
              </div>

              <Link
                href="/login"
                onClick={() => retroSound.playClick()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-display text-xs font-semibold transition-all inline-flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Syllabus</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Automated Alerts & Export */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Pedagogical Alerts */}
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-hud font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>DIAGNOSTIC INTERVENTIONS</span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs space-y-1">
                  <div className="font-semibold text-rose-200">DP Tabulation Confusion</div>
                  <p className="text-zinc-400 leading-relaxed">
                    32% of students missed the bottom-up table initialization step in Quiz 4.
                  </p>
                  <span className="text-[10px] font-mono text-cyan-300 block pt-1">
                    Recommendation: Deploy CR targeted revision session before Friday.
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                  <div className="font-semibold text-emerald-200">Asymptotics Milestone</div>
                  <p className="text-zinc-400 leading-relaxed">
                    96% of the cohort successfully verified Big-O proofs on their first attempt.
                  </p>
                </div>
              </div>
            </div>

            {/* Seamless Grade Export */}
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-display font-semibold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Institutional LMS Integration</span>
              </div>

              <p className="font-body text-xs text-zinc-400 leading-relaxed">
                Export verified quest grades, quiz battle scores, and diagnostic reports directly into Canvas,
                Blackboard, or standard CSV format.
              </p>

              <div className="pt-2 flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>Format: Canvas / CSV</span>
                <span className="text-emerald-400">FERPA Compliant</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
