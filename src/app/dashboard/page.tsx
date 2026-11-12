"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  ChevronRight,
  Flame,
  Zap,
  Target,
  Brain,
  Shield,
} from "lucide-react";
import { retroSound } from "@/lib/sound";
import { TerritoryMap } from "@/components/territory/TerritoryMap";
import { SocratesAvatar } from "@/components/avatar/SocratesAvatar";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [clans, setClans] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, recRes, subRes, clanRes, telemRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/recommendations"),
          fetch("/api/subjects"),
          fetch("/api/clans"),
          fetch("/api/cr/context").catch(() => null),
        ]);

        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p);
        }
        if (recRes.ok) {
          const r = await recRes.json();
          setRecommendation(r.recommendation);
        }
        if (subRes.ok) {
          const s = await subRes.json();
          setSubjects(s.subjects || []);
        }
        if (clanRes.ok) {
          const c = await clanRes.json();
          setClans(c.myClans || c.clans || []);
        }
        if (telemRes && telemRes.ok) {
          const t = await telemRes.json();
          setTelemetry(t.context);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-zinc-400">Synchronizing scholar workspace...</span>
      </div>
    );
  }

  const primaryClan = clans[0];
  const greeting = getGreeting();
  const scholarName = profile?.user?.profile?.name || profile?.user?.username || "Engineering Scholar";
  const scholarLevel = profile?.user?.level || 4;
  const scholarStreak = profile?.user?.streak || 7;
  const weakTopic = telemetry?.mastery?.weakTopics?.[0] || recommendation?.topic || "Data Structures";
  const accuracy = telemetry?.progress?.averageQuizScorePercent || 74;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* 1. Header & Scholar Status Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold">
              {greeting} // ACADEMIC COCKPIT
            </span>
          </div>
          <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            {scholarName}
          </h1>
          <p className="font-inter text-xs text-zinc-400">
            Real-time Bayesian mastery, diagnostic trajectory, and AI Socratic mentoring.
          </p>
        </div>

        {/* Scholar Quick Stats Chips */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#080d24] border border-cyan-500/30 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">Streak</span>
              <span className="font-inter font-bold text-sm text-white">{scholarStreak} Days</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#0e0a24] border border-violet-500/30 flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-violet-400" />
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">Rank Level</span>
              <span className="font-inter font-bold text-sm text-white">LVL {scholarLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Socrates AI Learning Companion Widget */}
      <section className="rounded-2xl p-6 bg-gradient-to-r from-[#0d162d]/90 via-[#0a1024]/80 to-[#120e2e]/90 border border-cyan-500/30 shadow-[0_15px_40px_rgba(6,182,212,0.12)] backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#080d24] border border-cyan-400/40 p-1 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)] overflow-hidden">
              <SocratesAvatar size={56} status="idle" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-condensed font-black text-lg text-white uppercase tracking-wide">
                  SOCRATES <span className="text-cyan-400">AI COMPANION</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-400 font-semibold uppercase">
                  ONLINE
                </span>
              </div>

              <p className="font-inter text-xs text-zinc-300 max-w-xl leading-relaxed">
                Diagnostic update: Overall academic accuracy is{" "}
                <strong className="text-emerald-400 font-semibold">{accuracy}%</strong>. Socrates recommends a focused 10-minute battle drill on{" "}
                <strong className="text-violet-400 font-semibold">{weakTopic}</strong> to solidify core algorithmic invariants.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <Link
              href={`/cr?prompt=${encodeURIComponent(`Socrates, drill me on ${weakTopic} invariants and ask me a diagnostic question.`)}`}
              onClick={() => retroSound.playClick()}
              className="px-4 py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-400/40 text-violet-200 font-inter text-xs font-semibold transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] flex items-center gap-1.5"
            >
              <Brain className="w-3.5 h-3.5 text-violet-300" />
              <span>CONSULT SOCRATES</span>
            </Link>

            <Link
              href="/ai-tutor"
              onClick={() => retroSound.playClick()}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-inter text-xs font-semibold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-1.5"
            >
              <span>OPEN TUTOR</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Continue Learning Hero Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
          <span>Continue Learning</span>
          <Link href="/subjects" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            All Subjects
          </Link>
        </div>

        <div className="rounded-2xl p-6 bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl space-y-4 hover:border-violet-500/40 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">CS-202</span>
              <h2 className="font-display font-bold text-lg text-white">OPERATING SYSTEMS</h2>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 font-semibold">
              68% Mastery
            </span>
          </div>

          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: "68%" }} />
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="font-inter text-xs text-zinc-300">
              Up Next: <strong>CPU Scheduling Algorithms &amp; Context Switching</strong>
            </span>

            <Link
              href="/quiz/operating-systems"
              onClick={() => retroSound.playClick()}
              className="inline-flex items-center gap-1.5 text-xs font-inter font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <span>Continue Lesson</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Recommended for You (Diagnostic Card) */}
      {recommendation && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <span>Recommended for You</span>
            <Link href="/recommendations" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              <span>View Diagnostic Matrix</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="rounded-2xl p-6 bg-[#061226]/80 border border-cyan-500/30 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-white uppercase tracking-wide">
                  {recommendation.topic}
                </h3>
              </div>
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                {recommendation.difficulty} Quiz
              </span>
            </div>

            <p className="font-inter text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{recommendation.rationale}&rdquo;
            </p>

            <Link
              href={`/quiz/${recommendation.quizId}`}
              onClick={() => retroSound.playLevelUp()}
              className="inline-flex items-center justify-between w-full p-3.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 font-inter text-xs font-semibold transition-all group"
            >
              <span>START RECOMMENDED QUIZ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* 5. My Subjects Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
          <span>My Subjects</span>
          <Link href="/subjects" className="text-cyan-400 hover:text-cyan-300">
            View Syllabus Map
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#070c20]/60 divide-y divide-white/5 overflow-hidden">
          {[
            { name: "Data Structures & Algorithms", code: "CS-201", mastery: 72 },
            { name: "Database Management Systems", code: "CS-203", mastery: 81 },
            { name: "Computer Networks", code: "CS-204", mastery: 54 },
            { name: "Operating Systems", code: "CS-202", mastery: 68 },
          ].map((sub) => (
            <Link
              key={sub.code}
              href="/subjects"
              onClick={() => retroSound.playClick()}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors gap-4"
            >
              <div>
                <span className="font-inter font-medium text-sm text-white">{sub.name}</span>
                <span className="text-[11px] font-mono text-zinc-500 block">{sub.code}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold text-cyan-300">{sub.mastery}%</span>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Kingdom Territory Map */}
      <section className="space-y-4">
        <TerritoryMap />
      </section>

      {/* 7. Recent Badges & Clan Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Recent Badges */}
        <section className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Recent Badges
          </div>

          <div className="rounded-2xl p-5 bg-[#070c20]/80 border border-emerald-500/20 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-lg">
                  🗄️
                </div>
                <div>
                  <h4 className="font-inter font-bold text-xs text-white">DATABASE SYSTEMS</h4>
                  <span className="font-inter text-[10px] text-emerald-400 font-medium">MASTERED</span>
                </div>
              </div>

              <Link
                href="/badges"
                onClick={() => retroSound.playClick()}
                className="text-xs font-inter text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View Badges
              </Link>
            </div>
          </div>
        </section>

        {/* Clan Status */}
        <section className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Clan Cohort
          </div>

          <div className="rounded-2xl p-5 bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-inter font-bold text-xs text-white">
                  {primaryClan?.name || "UPES — DEVOPS BATCH 3"}
                </h4>
                <span className="text-[11px] font-inter text-zinc-400">
                  Clan Rank: <strong className="text-cyan-300 font-semibold">#12</strong> / {primaryClan?.memberCount || 128} Scholars
                </span>
              </div>

              <Link
                href={`/clans/${primaryClan?.id || "default"}`}
                onClick={() => retroSound.playClick()}
                className="text-xs font-inter text-cyan-400 hover:text-cyan-300 font-medium"
              >
                View Clan
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}
