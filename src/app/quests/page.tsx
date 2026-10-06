"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { RetroCard } from "@/components/retro/RetroCard";
import { RetroButton } from "@/components/retro/RetroButton";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { PixelProgress } from "@/components/retro/PixelProgress";
import { Swords, Flame, Clock, CheckCircle2, ShieldAlert, Sparkles, Filter } from "lucide-react";
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
        setClaimMsg(data.message);
        fetchQuests();
        setTimeout(() => setClaimMsg(null), 3000);
      } else {
        retroSound.playWrong();
        setClaimMsg(data.error);
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="font-pixel text-xs text-[#f755bc] animate-pulse">
          FETCHING QUEST BOARD DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#3b1c5a] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Swords className="w-5 h-5 text-[#de1659]" />
            <h1 className="font-pixel text-xl sm:text-3xl text-white uppercase tracking-tight">
              QUEST LOG
            </h1>
          </div>
          <p className="font-retro text-xl text-[#a79bb7]">
            Active missions, bounties, and trials awaiting your character.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              retroSound.playClick();
              setFilter("ALL");
            }}
            className={`px-3 py-1.5 font-pixel text-[10px] border-2 ${
              filter === "ALL"
                ? "bg-[#1f0b35] text-[#f755bc] border-[#f755bc]"
                : "bg-[#0c0316] text-[#a79bb7] border-[#3b1c5a]"
            }`}
          >
            ALL ({quests.length})
          </button>
          <button
            onClick={() => {
              retroSound.playClick();
              setFilter("DAILY");
            }}
            className={`px-3 py-1.5 font-pixel text-[10px] border-2 ${
              filter === "DAILY"
                ? "bg-[#1f0b35] text-[#f755bc] border-[#f755bc]"
                : "bg-[#0c0316] text-[#a79bb7] border-[#3b1c5a]"
            }`}
          >
            DAILY
          </button>
          <button
            onClick={() => {
              retroSound.playClick();
              setFilter("STORY");
            }}
            className={`px-3 py-1.5 font-pixel text-[10px] border-2 ${
              filter === "STORY"
                ? "bg-[#1f0b35] text-[#f755bc] border-[#f755bc]"
                : "bg-[#0c0316] text-[#a79bb7] border-[#3b1c5a]"
            }`}
          >
            CAMPAIGN
          </button>
        </div>
      </div>

      {claimMsg && (
        <div className="p-3 bg-gradient-to-r from-[#170526] to-[#042416] border-2 border-[#10b981] font-pixel text-xs text-[#4ade80] flex items-center justify-between animate-in fade-in">
          <span>{claimMsg}</span>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
      )}

      {/* Quests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuests.map((q) => (
          <div
            key={q.id}
            className={`pixel-box p-6 flex flex-col justify-between space-y-4 ${
              q.isDaily ? "border-[#de1659] bg-[#12020e]" : "bg-[#0c0316]"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-pixel text-[10px] text-[#a79bb7]">
                  {q.isDaily ? "🔥 DAILY" : "⚔️ STORY"}
                </span>
                <PixelBadge variant={q.isDaily ? "crimson" : "purple"}>
                  {q.category}
                </PixelBadge>
              </div>

              <h3 className="font-pixel text-sm text-white leading-relaxed">
                {q.title}
              </h3>
              <p className="font-retro text-lg text-[#a79bb7]">
                {q.description}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-[#3b1c5a]">
                <PixelProgress
                  value={q.userProgress}
                  max={q.targetCount}
                  label="PROGRESS"
                  sublabel={`${q.userProgress}/${q.targetCount}`}
                  variant={q.isDaily ? "crimson" : "pink"}
                  showPercent
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-pixel text-amber-300 pt-1">
                <span>XP REWARD</span>
                <span>+{q.xpReward} XP</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#3b1c5a]">
              {q.canClaim ? (
                <RetroButton
                  variant="green"
                  size="sm"
                  className="w-full"
                  onClick={() => handleClaim(q.id)}
                >
                  CLAIM +{q.xpReward} XP
                </RetroButton>
              ) : q.isClaimed ? (
                <div className="w-full py-2 bg-[#042416] border border-[#10b981] font-pixel text-center text-[10px] text-[#4ade80] flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>QUEST COMPLETED & CLAIMED</span>
                </div>
              ) : (
                <Link href="/learn">
                  <RetroButton variant="pink" size="sm" className="w-full">
                    ACCEPT MISSION
                  </RetroButton>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}