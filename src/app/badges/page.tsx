"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Award, CheckCircle2, Lock, Sparkles, ArrowRight, Shield } from "lucide-react";
import { retroSound } from "@/lib/sound";

interface SubjectBadge {
  id: string;
  slug: string;
  code: string;
  title: string;
  icon: string;
  mastery: number;
  status: "MASTERED" | "IN_PROGRESS" | "LOCKED";
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<SubjectBadge[]>([]);
  const [filter, setFilter] = useState<"ALL" | "MASTERED" | "IN_PROGRESS" | "LOCKED">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => {
        const list: SubjectBadge[] = (data.subjects || []).map((s: any) => {
          let status: "MASTERED" | "IN_PROGRESS" | "LOCKED" = "LOCKED";
          if (s.mastery >= 85) status = "MASTERED";
          else if (s.mastery > 0) status = "IN_PROGRESS";

          return {
            id: s.id,
            slug: s.slug,
            code: s.code,
            title: s.title,
            icon: s.icon,
            mastery: s.mastery,
            status,
          };
        });
        setBadges(list);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredBadges = badges.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  const masteredCount = badges.filter((b) => b.status === "MASTERED").length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading academic badges...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <span className="font-mono text-xs text-amber-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ACADEMIC MASTERY BADGES
          </span>
          <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            Subject Badges
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-400 max-w-xl">
            Verified academic milestones. Earning a badge signifies that you achieved rigorous empirical mastery
            across all subtopics of an engineering discipline.
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
          <Award className="w-5 h-5 text-amber-400" />
          <span>{masteredCount} of {badges.length} Subjects Mastered</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "MASTERED", "IN_PROGRESS", "LOCKED"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setFilter(tab);
              retroSound.playClick();
            }}
            className={`px-4 py-2 rounded-xl font-display text-xs font-semibold transition-all ${
              filter === tab
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBadges.map((badge) => {
          const isMastered = badge.status === "MASTERED";
          const isInProgress = badge.status === "IN_PROGRESS";
          const isLocked = badge.status === "LOCKED";

          let cardStyle = "bg-[#070c20]/80 border-white/10";
          let badgeTagStyle = "text-zinc-500 bg-zinc-900 border-zinc-700";

          if (isMastered) {
            cardStyle = "bg-[#061814]/90 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]";
            badgeTagStyle = "text-emerald-400 bg-emerald-950/80 border-emerald-500/40";
          } else if (isInProgress) {
            cardStyle = "bg-[#070e24]/90 border-cyan-500/30";
            badgeTagStyle = "text-cyan-400 bg-cyan-950/80 border-cyan-500/40";
          } else if (isLocked) {
            cardStyle = "bg-[#050814]/50 border-white/5 opacity-60";
          }

          return (
            <div
              key={badge.id}
              className={`rounded-2xl p-6 border ${cardStyle} backdrop-blur-xl flex flex-col justify-between space-y-6 transition-all hover:scale-[1.01]`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                    {badge.icon}
                  </div>
                  <span className={`font-pixel text-[9px] px-2.5 py-1 rounded border font-semibold tracking-wider ${badgeTagStyle}`}>
                    {badge.status.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">{badge.code}</span>
                  <h3 className="font-display font-bold text-base text-white mt-0.5">
                    {badge.title}
                  </h3>
                </div>

                {/* Status Specific Description */}
                {isMastered && (
                  <div className="flex items-center gap-2 text-xs font-body text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Empirical syllabus mastery verified at 85%+</span>
                  </div>
                )}
                {isInProgress && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-400">Current Progress</span>
                      <span className="text-cyan-300 font-bold">{badge.mastery}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                        style={{ width: `${badge.mastery}%` }}
                      />
                    </div>
                  </div>
                )}
                {isLocked && (
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Complete diagnostic quiz to unlock</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-white/5">
                <Link
                  href={`/subjects/${badge.slug || badge.id}`}
                  onClick={() => retroSound.playClick()}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-display text-xs font-semibold transition-colors flex items-center justify-between"
                >
                  <span>{isMastered ? "Review Subject" : "Continue Practice"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
