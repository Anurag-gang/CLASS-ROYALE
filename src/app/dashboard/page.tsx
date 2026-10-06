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
} from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [profRes, recRes, subRes, clanRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/recommendations"),
          fetch("/api/subjects"),
          fetch("/api/clans"),
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
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading student workspace...</span>
      </div>
    );
  }

  const primaryClan = clans[0];
  const greeting = getGreeting();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-12">
      {/* 1. Header & Greeting */}
      <div className="space-y-1">
        <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {greeting}
        </span>
        <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
          {profile?.user?.profile?.name || profile?.user?.username || "Engineering Scholar"}
        </h1>
        <p className="font-body text-xs sm:text-sm text-zinc-400">
          What should you conquer today? Here is your personalized roadmap.
        </p>
      </div>

      {/* 2. Continue Learning */}
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
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-violet-950 text-violet-300 font-semibold">
              68% Mastery
            </span>
          </div>

          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" style={{ width: "68%" }} />
          </div>

          <div className="pt-1 flex items-center justify-between">
            <span className="font-body text-xs text-zinc-400">
              Up Next: <strong>CPU Scheduling Algorithms &amp; Context Switching</strong>
            </span>

            <Link
              href="/quiz/operating-systems"
              onClick={() => retroSound.playClick()}
              className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Recommended for You */}
      {recommendation && (
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
            <span>Recommended for You</span>
            <Link href="/recommendations" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
              <span>View Diagnostic</span>
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
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300">
                {recommendation.difficulty} Quiz
              </span>
            </div>

            <p className="font-body text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{recommendation.rationale}&rdquo;
            </p>

            <Link
              href={`/quiz/${recommendation.quizId}`}
              onClick={() => retroSound.playLevelUp()}
              className="inline-flex items-center justify-between w-full p-3.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-200 font-display text-xs font-semibold transition-all group"
            >
              <span>START RECOMMENDED QUIZ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* 4. My Subjects */}
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
                <span className="font-display font-medium text-sm text-white">{sub.name}</span>
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

      {/* 5. Recent Badges & Clan Grid */}
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
                  <h4 className="font-display font-bold text-xs text-white">DATABASE SYSTEMS</h4>
                  <span className="font-pixel text-[9px] text-emerald-400">MASTERED</span>
                </div>
              </div>

              <Link
                href="/badges"
                onClick={() => retroSound.playClick()}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
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
                <h4 className="font-display font-bold text-xs text-white">
                  {primaryClan?.name || "UPES — DEVOPS BATCH 3"}
                </h4>
                <span className="text-[11px] font-mono text-zinc-400">
                  Clan Rank: <strong className="text-cyan-300 font-semibold">#12</strong> / {primaryClan?.memberCount || 128}
                </span>
              </div>

              <Link
                href={`/clans/${primaryClan?.id || "default"}`}
                onClick={() => retroSound.playClick()}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
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