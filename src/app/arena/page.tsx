"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { TerritoryMap } from "@/components/territory/TerritoryMap";
import { BattleArenaEngine } from "@/components/arena/BattleArenaEngine";
import { Swords, ArrowLeft, Trophy, Sparkles, Shield, Flame, RotateCcw } from "lucide-react";
import { retroSound } from "@/lib/sound";

const TERRITORY_NAMES: Record<string, { title: string; realm: string }> = {
  "data-structures-and-algorithms": {
    title: "Data Structures & Algorithms",
    realm: "The Citadel of Algorithms",
  },
  "database-management-systems": {
    title: "Database Management Systems",
    realm: "The Vault of Relational Lore",
  },
  "operating-systems": {
    title: "Operating Systems",
    realm: "The Core Kernel Fortress",
  },
  "computer-networks": {
    title: "Computer Networks",
    realm: "The Whispering Wirelands",
  },
  "ai-and-machine-learning": {
    title: "Artificial Intelligence & Machine Learning",
    realm: "The Neural Sanctum",
  },
  "web-dev-and-devops": {
    title: "Web Development & DevOps",
    realm: "The Cloud Spire Bastion",
  },
};

function ArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const territoryParam = searchParams.get("territory");
  const difficultyParam = (searchParams.get("difficulty") as any) || "ALL";

  const [activeTerritory, setActiveTerritory] = useState<string | null>(territoryParam);

  useEffect(() => {
    setActiveTerritory(territoryParam);
  }, [territoryParam]);

  const handleStartBattle = (slug: string) => {
    setActiveTerritory(slug);
    router.push(`/arena?territory=${encodeURIComponent(slug)}`);
    retroSound.playClick();
  };

  const handleExitBattle = () => {
    setActiveTerritory(null);
    router.push("/arena");
    retroSound.playClick();
  };

  // 1. ACTIVE LIVE BATTLE ENGINE
  if (activeTerritory) {
    const meta = TERRITORY_NAMES[activeTerritory] || {
      title: activeTerritory.replace(/-/g, " ").toUpperCase(),
      realm: "Kingdom Realm",
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <button
            onClick={handleExitBattle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-inter text-zinc-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Retreat to Territory Map</span>
          </button>

          <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-cyan-300 uppercase tracking-widest font-semibold">
            LIVE COMBAT TRIAL
          </span>
        </div>

        <BattleArenaEngine
          subjectSlug={activeTerritory}
          subjectName={meta.title}
          territoryName={meta.realm}
          difficulty={difficultyParam}
          onExit={handleExitBattle}
        />
      </div>
    );
  }

  // 2. ARENA TERRITORY SELECTION COLISEUM
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
            <Swords className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <h1 className="font-condensed font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
              THE ARENA <span className="text-cyan-400">COLISEUM</span>
            </h1>
            <p className="font-inter text-xs text-zinc-400">
              Live knowledge duels, territory defenses, and boss battles across academic domains.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-3 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/30 text-violet-300 font-semibold uppercase tracking-wider">
            6 TERRITORIES CLAIMABLE
          </span>
        </div>
      </div>

      {/* Live Territory Map Component with Real DB Question Counts */}
      <TerritoryMap onSelectTerritory={handleStartBattle} showBattleAction={true} />
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="font-mono text-xs text-zinc-400 tracking-wider">
            PREPARING ARENA COLISEUM...
          </span>
        </div>
      }
    >
      <ArenaContent />
    </Suspense>
  );
}
