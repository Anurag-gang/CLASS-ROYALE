"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Swords,
  Shield,
  Trophy,
  Sparkles,
  Flame,
  Zap,
  BookOpen,
  Cpu,
  Database,
  Network,
  Brain,
  Cloud,
  ChevronRight,
  Target,
  Skull,
  Crown,
} from "lucide-react";
import { SubjectWithStats } from "@/types/quiz";
import { retroSound } from "@/lib/sound";

interface TerritoryMapProps {
  onSelectTerritory?: (subjectSlug: string) => void;
  showBattleAction?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  BinaryTree: <Swords className="w-6 h-6 text-emerald-400" />,
  Database: <Database className="w-6 h-6 text-cyan-400" />,
  Cpu: <Cpu className="w-6 h-6 text-violet-400" />,
  Network: <Network className="w-6 h-6 text-amber-400" />,
  Brain: <Brain className="w-6 h-6 text-pink-400" />,
  Cloud: <Cloud className="w-6 h-6 text-blue-400" />,
  BookOpen: <BookOpen className="w-6 h-6 text-purple-400" />,
};

const COLOR_MAP: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  "data-structures-and-algorithms": {
    border: "border-emerald-500/40 hover:border-emerald-400",
    glow: "shadow-emerald-500/10",
    text: "text-emerald-400",
    bg: "bg-emerald-950/20",
  },
  "database-management-systems": {
    border: "border-cyan-500/40 hover:border-cyan-400",
    glow: "shadow-cyan-500/10",
    text: "text-cyan-400",
    bg: "bg-cyan-950/20",
  },
  "operating-systems": {
    border: "border-violet-500/40 hover:border-violet-400",
    glow: "shadow-violet-500/10",
    text: "text-violet-400",
    bg: "bg-violet-950/20",
  },
  "computer-networks": {
    border: "border-amber-500/40 hover:border-amber-400",
    glow: "shadow-amber-500/10",
    text: "text-amber-400",
    bg: "bg-amber-950/20",
  },
  "ai-and-machine-learning": {
    border: "border-pink-500/40 hover:border-pink-400",
    glow: "shadow-pink-500/10",
    text: "text-pink-400",
    bg: "bg-pink-950/20",
  },
  "web-dev-and-devops": {
    border: "border-blue-500/40 hover:border-blue-400",
    glow: "shadow-blue-500/10",
    text: "text-blue-400",
    bg: "bg-blue-950/20",
  },
};

export function TerritoryMap({ onSelectTerritory, showBattleAction = true }: TerritoryMapProps) {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTerritories() {
      try {
        const res = await fetch("/api/questions/subjects");
        const data = await res.json();
        if (data.success && data.subjects) {
          setSubjects(data.subjects);
        }
      } catch (err) {
        console.error("Failed to load territory map:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTerritories();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl p-8 bg-[#090e24]/80 border border-violet-500/20 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-inter text-xs text-cyan-400 font-medium tracking-wide">
          Scanning Kingdom Territories...
        </span>
      </div>
    );
  }

  const totalQuestions = subjects.reduce((acc, s) => acc + s.total_questions, 0);
  const totalXp = subjects.reduce((acc, s) => acc + s.total_xp, 0);

  return (
    <div className="space-y-6">
      {/* Kingdom Map Header Stats */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#080d22]/90 border border-violet-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="font-condensed font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
            Kingdom Realms
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center">
            <span className="block font-inter text-[10px] font-semibold tracking-wider text-cyan-400 uppercase">Questions</span>
            <span className="font-mono font-bold text-sm text-white">{totalQuestions} Active</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
            <span className="block font-inter text-[10px] font-semibold tracking-wider text-amber-400 uppercase">Purse</span>
            <span className="font-mono font-bold text-sm text-amber-300">+{totalXp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      {/* Territory Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((sub) => {
          const colors = COLOR_MAP[sub.slug] || {
            border: "border-violet-500/30 hover:border-violet-400",
            glow: "shadow-violet-500/10",
            text: "text-violet-400",
            bg: "bg-violet-950/20",
          };

          const isSelected = selectedSlug === sub.slug;

          return (
            <div
              key={sub.id}
              onClick={() => {
                setSelectedSlug(sub.slug);
                if (onSelectTerritory) onSelectTerritory(sub.slug);
              }}
              className={`rounded-2xl p-6 bg-[#070c20]/90 border ${colors.border} transition-all duration-300 hover:scale-[1.015] hover:shadow-xl ${colors.glow} flex flex-col justify-between space-y-5 cursor-pointer relative overflow-hidden group ${
                isSelected ? "ring-2 ring-cyan-400" : ""
              }`}
            >
              {/* Scanline glow accent */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl -z-0 pointer-events-none group-hover:opacity-100 opacity-60 transition-opacity`}
              />

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {ICON_MAP[sub.icon_name] || ICON_MAP.BookOpen}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-inter font-medium tracking-wide bg-white/5 border border-white/10 text-zinc-300 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-cyan-400" />
                    {sub.total_questions} Trials
                  </span>
                </div>

                <div>
                  <span className={`font-inter text-[11px] font-semibold uppercase tracking-wider ${colors.text}`}>
                    {sub.territory_name}
                  </span>
                  <h3 className="font-condensed font-black text-xl text-white mt-0.5 leading-snug">
                    {sub.name}
                  </h3>
                </div>

                {/* Difficulty Tier Counters */}
                <div className="pt-2 border-t border-white/5 grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <span className="block font-inter text-[10px] font-bold text-emerald-400 tracking-wider">EASY</span>
                    <span className="font-mono text-xs font-bold text-white">
                      {sub.difficulty_counts?.Easy || 12}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
                    <span className="block font-inter text-[10px] font-bold text-cyan-400 tracking-wider">MED</span>
                    <span className="font-mono text-xs font-bold text-white">
                      {sub.difficulty_counts?.Medium || 14}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/20">
                    <span className="block font-inter text-[10px] font-bold text-amber-400 tracking-wider">HARD</span>
                    <span className="font-mono text-xs font-bold text-white">
                      {sub.difficulty_counts?.Hard || 7}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-red-950/30 border border-red-500/30">
                    <span className="block font-inter text-[10px] font-bold text-red-400 tracking-wider flex items-center justify-center gap-0.5">
                      <Skull className="w-2.5 h-2.5" /> BOSS
                    </span>
                    <span className="font-mono text-xs font-bold text-red-300">
                      {sub.difficulty_counts?.Boss || 2}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 relative z-10 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] font-inter text-amber-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>+{sub.total_xp.toLocaleString()} XP Max</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/realm/${sub.slug}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      retroSound.playClick();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/40 text-violet-300 font-inter font-semibold text-xs tracking-wide hover:opacity-95 shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Realm Trail
                  </Link>

                  {showBattleAction && (
                    <Link
                      href={`/arena?territory=${sub.slug}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        retroSound.playClick();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-inter font-semibold text-xs tracking-wide hover:opacity-95 shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      Battle
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
