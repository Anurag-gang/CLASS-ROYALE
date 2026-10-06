"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, BarChart2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const FacultyLandingSection: React.FC = () => {
  return (
    <section id="faculty" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <span className="font-hud text-xs text-blue-400 tracking-widest uppercase font-semibold">
          FACULTY &amp; INSTRUCTORS
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          A SMARTER VIEW <br />
          <span className="text-gradient-cyan">OF YOUR CLASS.</span>
        </h2>
        <p className="font-body text-base text-zinc-300">
          Faculty can create quizzes, manage Clans, and understand where students need help.
        </p>
      </div>

      {/* Clean Faculty Dashboard Preview */}
      <div className="rounded-2xl bg-[#070b1c] border border-blue-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-white">DEVOPS — BATCH 3</h3>
              <span className="text-xs font-mono text-zinc-400">128 Students Enrolled</span>
            </div>
          </div>

          <Link
            href="/faculty"
            onClick={() => retroSound.playClick()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs font-semibold text-blue-200 hover:bg-blue-600/30 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Faculty Console</span>
          </Link>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-xs font-mono text-zinc-400">AVERAGE MASTERY</span>
            <div className="text-2xl font-display font-bold text-cyan-300">76%</div>
            <span className="text-[11px] font-mono text-emerald-400">+4% this week</span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-xs font-mono text-zinc-400">QUIZ COMPLETION</span>
            <div className="text-2xl font-display font-bold text-white">82%</div>
            <span className="text-[11px] font-mono text-zinc-400">105 of 128 active</span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
            <span className="text-xs font-mono text-zinc-400">ACTIVE STUDENTS</span>
            <div className="text-2xl font-display font-bold text-violet-300">104</div>
            <span className="text-[11px] font-mono text-zinc-400">Past 48 hours</span>
          </div>
        </div>

        {/* Topic Breakdown & Attention Required */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Topic Performance */}
          <div className="space-y-3">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
              TOPIC PERFORMANCE
            </span>
            {[
              { topic: "Docker & Containers", score: 84, color: "bg-emerald-400" },
              { topic: "CI/CD GitHub Actions", score: 79, color: "bg-cyan-400" },
              { topic: "Kubernetes & Pods", score: 61, color: "bg-amber-400" },
              { topic: "Terraform IaC", score: 54, color: "bg-rose-400" },
            ].map((t) => (
              <div key={t.topic} className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-300">{t.topic}</span>
                  <span className="text-white font-bold">{t.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className={`h-full ${t.color}`} style={{ width: `${t.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Attention Required */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>ATTENTION REQUIRED</span>
            </div>
            <div className="text-xs font-body text-zinc-300 space-y-2">
              <p>• <strong>18 students</strong> struggling with Kubernetes scheduling</p>
              <p>• <strong>12 students</strong> haven&apos;t attempted a quiz this week</p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-cyan-300">
                Action: Assigned 1-click diagnostic drill to struggling subgroup.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
