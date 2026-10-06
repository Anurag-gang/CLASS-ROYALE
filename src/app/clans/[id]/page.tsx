"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Trophy,
  Calendar,
  Layers,
  Sparkles,
  Award,
  CheckCircle2,
  TrendingUp,
  Shield,
  Key,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function SingleClanPage() {
  const params = useParams();
  const id = params?.id as string;

  const [clan, setClan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "MEMBERS" | "ACTIVITIES" | "LEADERBOARD" | "PROGRESS">("OVERVIEW");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/clans/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Clan not found");
        return res.json();
      })
      .then((data) => setClan(data.clan))
      .catch((err) => console.error("Error loading clan:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading clan workspace...</span>
      </div>
    );
  }

  if (!clan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="font-display font-bold text-lg text-white">CLAN NOT FOUND</h2>
        <Link href="/clans" className="text-xs font-mono text-cyan-400 underline">
          Return to Clans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <div>
        <Link
          href="/clans"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clans</span>
        </Link>
      </div>

      {/* Clan Hero Card */}
      <div className="rounded-2xl p-6 sm:p-8 bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  {clan.category}
                </span>
                {clan.isLeader && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                    CLAN LEADER
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight mt-0.5">
                {clan.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-zinc-300">
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>Join Code: <strong className="text-white">{clan.joinCode}</strong></span>
          </div>
        </div>

        <p className="font-body text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
          {clan.description || "Academic classroom cohort collaborating on engineering topic mastery."}
        </p>

        {/* Aggregate Stats */}
        <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-500 uppercase">MEMBERS</span>
            <div className="text-base font-bold text-white mt-0.5">{clan.memberCount} Students</div>
          </div>
          <div>
            <span className="text-zinc-500 uppercase">AVG MASTERY</span>
            <div className="text-base font-bold text-cyan-300 mt-0.5">{clan.avgMastery}%</div>
          </div>
          <div>
            <span className="text-zinc-500 uppercase">ACTIVITIES</span>
            <div className="text-base font-bold text-violet-300 mt-0.5">{clan.activities?.length || 0} Live</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        {(["OVERVIEW", "MEMBERS", "ACTIVITIES", "LEADERBOARD", "PROGRESS"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              retroSound.playClick();
            }}
            className={`px-4 py-2.5 font-display text-xs font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? "border-cyan-400 text-white"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* Average Mastery Banner */}
          <div className="rounded-2xl p-6 bg-[#070c20]/60 border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400 uppercase tracking-wider">Cohort Topic Mastery</span>
              <span className="text-cyan-300 font-bold">{clan.avgMastery}%</span>
            </div>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full"
                style={{ width: `${clan.avgMastery}%` }}
              />
            </div>
          </div>

          {/* Subject Performance */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Subject Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Data Structures & Algorithms", mastery: 82, code: "CS-201" },
                { name: "Operating Systems", mastery: 74, code: "CS-202" },
                { name: "Database Management Systems", mastery: 88, code: "CS-203" },
                { name: "Computer Networks", mastery: 68, code: "CS-204" },
              ].map((s) => (
                <div key={s.code} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-200 font-medium">{s.name}</span>
                    <span className="text-cyan-300 font-bold">{s.mastery}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${s.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                Recent Activities
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab("ACTIVITIES")}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                View all ({clan.activities?.length || 0})
              </button>
            </div>

            <div className="space-y-3">
              {(clan.activities || []).slice(0, 3).map((act: any) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-violet-300 uppercase">
                      {act.type}
                    </span>
                    <h4 className="font-display font-semibold text-sm text-white">{act.title}</h4>
                    <p className="font-body text-xs text-zinc-400">{act.description}</p>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS */}
      {activeTab === "MEMBERS" && (
        <div className="rounded-2xl border border-white/10 bg-[#070c20]/60 divide-y divide-white/5 overflow-hidden">
          {(clan.members || []).map((m: any) => (
            <div key={m.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-hud text-xs text-violet-300">
                  {m.user?.username?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-display font-semibold text-sm text-white">
                    {m.user?.profile?.name || m.user?.username}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 block">
                    {m.role === "LEADER" ? "Clan Leader" : "Student Member"}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono text-cyan-300 font-bold">
                {m.user?.profile?.level ? Math.min(100, m.user.profile.level * 4) : 75}% Mastery
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ACTIVITIES */}
      {activeTab === "ACTIVITIES" && (
        <div className="space-y-4">
          {(clan.activities || []).map((act: any) => (
            <div
              key={act.id}
              className="p-5 rounded-2xl bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                  {act.type}
                </span>
                <h4 className="font-display font-bold text-base text-white">{act.title}</h4>
                <p className="font-body text-xs text-zinc-400">{act.description}</p>
              </div>

              <Link
                href="/subjects"
                onClick={() => retroSound.playLevelUp()}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-display text-xs font-semibold transition-colors self-start sm:self-auto shrink-0"
              >
                Start Activity
              </Link>
            </div>
          ))}

          {(!clan.activities || clan.activities.length === 0) && (
            <div className="text-center py-12 text-zinc-500 text-xs font-mono">
              No activities posted yet. Clan Leader can schedule quizzes here.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEADERBOARD */}
      {activeTab === "LEADERBOARD" && (
        <div className="rounded-2xl border border-white/10 bg-[#070c20]/60 divide-y divide-white/5 overflow-hidden">
          {(clan.leaderboard || []).map((entry: any) => (
            <div key={entry.rank} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded flex items-center justify-center font-hud text-xs font-bold ${
                  entry.rank === 1 ? "bg-amber-400 text-black" : "bg-white/10 text-zinc-300"
                }`}>
                  #{entry.rank}
                </span>
                <div>
                  <span className="font-display font-semibold text-sm text-white">{entry.name}</span>
                  <span className="text-xs font-mono text-zinc-500 block">
                    {entry.quizzesCompleted} Quizzes Attempted
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-sm font-bold text-cyan-300">{entry.mastery}% Mastery</div>
                <div className="text-[11px] font-mono text-zinc-400">{entry.accuracy} Accuracy</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PROGRESS */}
      {activeTab === "PROGRESS" && (
        <div className="rounded-2xl p-6 bg-[#070c20]/60 border border-white/10 space-y-6">
          <div>
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              Cohort Syllabus Trajectory
            </h3>
            <p className="font-body text-xs text-zinc-400 mt-1">
              Aggregate topic completion and benchmark mastery across semester modules.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { module: "Module 1: Asymptotic Foundations", progress: 94 },
              { module: "Module 2: Linear & Hierarchical Structures", progress: 86 },
              { module: "Module 3: Graph Traversal & Networks", progress: 68 },
              { module: "Module 4: Dynamic Programming & Recurrences", progress: 58 },
            ].map((m) => (
              <div key={m.module} className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-200">{m.module}</span>
                  <span className="text-cyan-300 font-bold">{m.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
