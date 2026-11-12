"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Swords, Flame, Sparkles, CheckCircle2, Trophy, ArrowRight, Target } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function QuestsPage() {
  const [quests, setQuests] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "DAILY" | "STORY">("ALL");
  const [loading, setLoading] = useState(true);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const fetchQuests = async () => {
    try {
      const res = await fetch("/api/quests");
      const data = await res.json();
      setQuests(data.quests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, []);

  const handleClaim = async (id: string) => {
    retroSound.playCoin();
    try {
      const res = await fetch(`/api/quests/${id}/claim`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        retroSound.playLevelUp();
        setClaimMsg(data.message || "Reward claimed successfully!");
        fetchQuests();
        setTimeout(() => setClaimMsg(null), 3000);
      } else {
        retroSound.playWrong();
        setClaimMsg(data.error || "Failed to claim reward");
        setTimeout(() => setClaimMsg(null), 3000);
      }
    } catch {
      setClaimMsg("Failed to claim quest");
      setTimeout(() => setClaimMsg(null), 3000);
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (filter === "DAILY") return q.isDaily;
    if (filter === "STORY") return !q.isDaily;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-inter text-xs text-zinc-400 font-medium">Loading academic quest board...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            Quest Objectives
          </h1>
          <p className="font-inter text-xs text-zinc-400 mt-1">
            Active syllabus missions, problem-solving bounties, and territory milestones.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 self-start md:self-auto">
          {(["ALL", "DAILY", "STORY"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                retroSound.playClick();
                setFilter(tab);
              }}
              className={`px-4 py-1.5 rounded-lg font-inter text-xs font-semibold transition-all ${
                filter === tab
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab === "ALL" ? `All (${quests.length})` : tab === "DAILY" ? "Daily" : "Campaign"}
            </button>
          ))}
        </div>
      </div>

      {claimMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 font-inter text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{claimMsg}</span>
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </div>
      )}

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuests.map((q) => {
          const percent = Math.min(100, Math.round((q.userProgress / q.targetCount) * 100));

          return (
            <div
              key={q.id}
              className={`rounded-2xl p-6 bg-[#070c20]/80 border transition-all duration-300 backdrop-blur-xl flex flex-col justify-between space-y-6 ${
                q.isDaily
                  ? "border-pink-500/30 hover:border-pink-400/50 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)]"
                  : "border-violet-500/20 hover:border-cyan-400/50 hover:shadow-xl"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-inter font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${
                      q.isDaily
                        ? "bg-pink-950/50 border-pink-500/30 text-pink-300"
                        : "bg-cyan-950/50 border-cyan-500/30 text-cyan-300"
                    }`}
                  >
                    {q.isDaily ? <Flame className="w-3 h-3 text-pink-400" /> : <Target className="w-3 h-3 text-cyan-400" />}
                    {q.isDaily ? "Daily Mission" : "Story Campaign"}
                  </span>

                  <span className="font-inter text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                    {q.category}
                  </span>
                </div>

                <div>
                  <h3 className="font-condensed font-bold text-lg text-white leading-snug">
                    {q.title}
                  </h3>
                  <p className="font-inter text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {q.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs font-inter">
                    <span className="text-zinc-400">Progress</span>
                    <span className="text-zinc-200 font-mono font-medium">
                      {q.userProgress} / {q.targetCount} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        q.isDaily
                          ? "bg-gradient-to-r from-pink-500 to-rose-400"
                          : "bg-gradient-to-r from-violet-500 to-cyan-400"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-inter text-amber-300 pt-1">
                  <span className="text-zinc-400">Reward</span>
                  <span className="font-mono font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    +{q.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-white/5">
                {q.canClaim ? (
                  <button
                    onClick={() => handleClaim(q.id)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-inter text-xs font-semibold hover:opacity-95 shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Claim +{q.xpReward} XP</span>
                  </button>
                ) : q.isClaimed ? (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-inter text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed & Claimed</span>
                  </div>
                ) : (
                  <Link
                    href="/arena"
                    onClick={() => retroSound.playClick()}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-inter text-xs font-semibold flex items-center justify-between border border-white/10 transition-colors"
                  >
                    <span>Enter Combat Trial</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
