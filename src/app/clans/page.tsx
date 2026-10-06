"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, ArrowRight, Shield, Sparkles, Key, CheckCircle2 } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function ClansPage() {
  const [clans, setClans] = useState<any[]>([]);
  const [myClans, setMyClans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "MY">("ALL");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinMessage, setJoinMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClans = () => {
    fetch("/api/clans")
      .then((res) => res.json())
      .then((data) => {
        setClans(data.clans || []);
        setMyClans(data.myClans || []);
      })
      .catch((err) => console.error("Clans fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClans();
  }, []);

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoining(true);
    setJoinMessage(null);
    retroSound.playClick();

    try {
      const res = await fetch("/api/clans/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCodeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        retroSound.playLevelUp();
        setJoinMessage("Successfully joined clan!");
        setJoinCodeInput("");
        fetchClans();
      } else {
        retroSound.playWrong();
        setJoinMessage(data.error || "Failed to join clan");
      }
    } catch {
      setJoinMessage("Network error. Please try again.");
    } finally {
      setJoining(false);
      setTimeout(() => setJoinMessage(null), 4000);
    }
  };

  const displayedClans = activeTab === "ALL" ? clans : myClans;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading academic clans...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            ACADEMIC STUDY GROUPS &amp; CLASSROOMS
          </span>
          <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            Learning Clans
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-400 max-w-xl">
            Join your university course cohort or form a peer study clan. Share diagnostic quizzes, compare
            topic masteries, and learn together.
          </p>
        </div>

        <Link
          href="/clans/create"
          onClick={() => retroSound.playLevelUp()}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-display text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create a Clan</span>
        </Link>
      </div>

      {/* Join Code Quick Box & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab switch */}
        <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ALL");
              retroSound.playClick();
            }}
            className={`px-4 py-1.5 rounded-lg font-display text-xs font-semibold transition-all ${
              activeTab === "ALL" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            All Clans ({clans.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("MY");
              retroSound.playClick();
            }}
            className={`px-4 py-1.5 rounded-lg font-display text-xs font-semibold transition-all ${
              activeTab === "MY" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            My Clans ({myClans.length})
          </button>
        </div>

        {/* Join Code Form */}
        <form onSubmit={handleJoinWithCode} className="flex items-center gap-2">
          <div className="relative">
            <Key className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter join code (e.g. UPES-DO-B3)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 w-64 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={joining || !joinCodeInput.trim()}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-display text-xs font-semibold transition-colors"
          >
            Join
          </button>
        </form>
      </div>

      {joinMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-xs font-mono text-cyan-200">
          {joinMessage}
        </div>
      )}

      {/* Grid of Clans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayedClans.map((clan) => (
          <Link
            key={clan.id}
            href={`/clans/${clan.id}`}
            onClick={() => retroSound.playClick()}
            className="rounded-2xl p-6 bg-[#070c20]/80 border border-violet-500/20 hover:border-cyan-400/50 hover:shadow-xl transition-all duration-300 backdrop-blur-xl flex flex-col justify-between space-y-6 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                      {clan.name}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      Code: {clan.joinCode}
                    </span>
                  </div>
                </div>

                <span className="font-hud text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                  {clan.category}
                </span>
              </div>

              <p className="font-body text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {clan.description || "Peer-led engineering cohort for collaborative syllabus mastery."}
              </p>
            </div>

            {/* Metrics Footer */}
            <div className="pt-3 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-4 text-zinc-400">
                  <span>{clan.memberCount} Members</span>
                  <span>•</span>
                  <span>{clan.activityCount || 0} Activities</span>
                </div>
                <span className="text-cyan-300 font-bold">{clan.avgMastery}% Avg Mastery</span>
              </div>

              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 rounded-full"
                  style={{ width: `${clan.avgMastery}%` }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {displayedClans.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="font-display font-medium text-zinc-400 text-sm">
            {activeTab === "MY"
              ? "You haven't joined or created any clans yet."
              : "No clans available yet. Create the first one!"}
          </p>
          <Link
            href="/clans/create"
            className="text-xs font-mono text-cyan-400 underline"
          >
            Create a Clan
          </Link>
        </div>
      )}
    </div>
  );
}
