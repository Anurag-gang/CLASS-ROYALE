"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Brain,
  Target,
  Compass,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

interface RecommendationData {
  recommendation: {
    subject: string;
    subjectCode: string;
    topic: string;
    difficulty: string;
    quizId: string;
    rationale: string;
    currentAccuracy: number;
    action: string;
  };
  learningPath: Array<{
    step: number;
    title: string;
    topic: string;
    subject: string;
    subjectCode: string;
    difficulty: string;
    estimatedMinutes: number;
    quizId: string;
    reason: string;
    status: string;
  }>;
  weakTopics: Array<{
    id: string;
    topic: string;
    accuracy: number;
    trend: string;
  }>;
  strongTopics: Array<{
    id: string;
    topic: string;
    accuracy: number;
    trend: string;
  }>;
  readinessScore: number;
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed loading recommendations:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-zinc-400">Computing topic deficit diagnostic...</span>
      </div>
    );
  }

  if (!data?.recommendation) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="font-display font-bold text-xl text-white">NO RECOMMENDATIONS YET</h2>
        <p className="text-xs text-zinc-400">Complete at least one quiz to calibrate the adaptive engine.</p>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
        >
          Browse Subjects <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const { recommendation, learningPath, weakTopics, strongTopics, readinessScore } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold">
            ADAPTIVE LEARNING ENGINE
          </span>
        </div>
        <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
          Recommended Learning Path
        </h1>
        <p className="font-body text-xs sm:text-sm text-zinc-400 max-w-2xl">
          Your next quiz isn’t random. Class Royale continuously analyzes your retrieval accuracy, identifies
          conceptual deficits, and designs a personalized sequence to maximize retention and exam readiness.
        </p>
      </div>

      {/* Top Diagnostics Strip */}
      <section aria-label="Diagnostic Metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-xs text-zinc-400 font-mono">Curricular Readiness</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{readinessScore}%</span>
            <span className="text-xs text-emerald-400 font-mono">Exam Prepared</span>
          </div>
          <p className="text-[11px] text-zinc-500">Based on coverage across core topics</p>
        </div>

        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/20 space-y-1">
          <span className="text-xs text-amber-300/80 font-mono">Identified Deficits</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 tracking-tight">{weakTopics.length}</span>
            <span className="text-xs text-amber-300 font-mono">Topics Needing Review</span>
          </div>
          <p className="text-[11px] text-zinc-500">Sub-70% accuracy on recent drills</p>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
          <span className="text-xs text-emerald-300/80 font-mono">Confirmed Strengths</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{strongTopics.length}</span>
            <span className="text-xs text-emerald-300 font-mono">High Retention Topics</span>
          </div>
          <p className="text-[11px] text-zinc-500">Mastered foundational concepts</p>
        </div>
      </section>

      {/* Primary Hero Recommendation Card */}
      <section aria-label="Top Priority Recommendation">
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#071329] via-[#09152e] to-[#0d0722] border-2 border-cyan-500/40 backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span className="font-mono text-xs text-cyan-300 uppercase tracking-wider font-semibold">
                TOP PRIORITY RETRIEVAL DRILL
              </span>
            </div>

            <span className="font-mono text-xs px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-medium">
              {recommendation.difficulty} Difficulty
            </span>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
              {recommendation.subjectCode} • {recommendation.subject}
            </span>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              {recommendation.topic}
            </h2>
          </div>

          {/* Rationale Callout Box */}
          <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span>Why This Quiz Was Selected</span>
            </div>
            <p className="font-body text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {recommendation.rationale}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-cyan-500/20">
            <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Current Accuracy: <strong className="text-white">{recommendation.currentAccuracy}%</strong></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Est. 8 Mins</span>
              </div>
            </div>

            <Link
              href={`/quiz/${recommendation.quizId}`}
              onClick={() => retroSound.playLevelUp()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-display font-extrabold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <span>{recommendation.action}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3-Step Guided Learning Path */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display font-bold text-xl text-white">
            Sequential Learning Sequence
          </h2>
          <p className="text-xs text-zinc-400">
            Recommended progression designed to bridge foundational deficits before attempting complex system integration.
          </p>
        </div>

        <div className="space-y-3">
          {learningPath.map((item) => (
            <div
              key={item.step}
              className={`p-5 rounded-2xl border transition-all ${
                item.status === "NEXT_UP"
                  ? "bg-slate-900/80 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.08)]"
                  : "bg-slate-950/40 border-slate-800/80 opacity-75"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                      item.status === "NEXT_UP"
                        ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        : "bg-slate-800 text-zinc-400"
                    }`}
                  >
                    0{item.step}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-zinc-400">
                        {item.subjectCode} • {item.subject}
                      </span>
                      {item.status === "NEXT_UP" && (
                        <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                          RECOMMENDED NEXT
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-white">
                      {item.title}: <span className="text-cyan-300">{item.topic}</span>
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </div>

                <div className="sm:self-center shrink-0">
                  {item.status === "NEXT_UP" ? (
                    <Link
                      href={`/quiz/${item.quizId}`}
                      onClick={() => retroSound.playClick()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      <span>Begin Drill</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span className="font-mono text-xs text-zinc-500 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      Unlocks After Step 01
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Two-Column Diagnostic Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Identified Deficits */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Topics Requiring Review</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">&lt; 70% Accuracy</span>
          </div>

          <div className="space-y-3">
            {weakTopics.map((wt) => (
              <div
                key={wt.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{wt.topic}</h4>
                  <span className="text-[10px] font-mono text-amber-400">
                    Trend: {wt.trend}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {Math.round(wt.accuracy)}%
                  </span>
                  <Link
                    href={`/quiz/${recommendation.quizId}`}
                    onClick={() => retroSound.playClick()}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-300"
                    title="Practice this topic"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Confirmed Strengths */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Strong Foundations</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">&ge; 70% Accuracy</span>
          </div>

          <div className="space-y-3">
            {strongTopics.map((st) => (
              <div
                key={st.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{st.topic}</h4>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Mastery Confirmed
                  </span>
                </div>

                <span className="font-mono text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  {Math.round(st.accuracy)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
