"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Search, Filter, ChevronRight, Award, Layers, Sparkles } from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then((data) => setSubjects(data.subjects || []))
      .catch((err) => console.error("Subjects fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());

    const matchesDiff =
      selectedDifficulty === "ALL" || s.difficulty.toUpperCase() === selectedDifficulty.toUpperCase();

    return matchesSearch && matchesDiff;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading engineering subjects...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            ENGINEERING SYLLABUS MAP
          </span>
          <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            Subjects &amp; Topics
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-400 max-w-xl">
            Explore database-driven engineering subjects. Complete diagnostic quizzes, strengthen weak areas,
            and earn verified subject mastery badges.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 w-56"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#090e24] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:border-cyan-400/50"
          >
            <option value="ALL">All Levels</option>
            <option value="FOUNDATIONAL">Foundational</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((sub) => {
          const isMastered = sub.mastery >= 85;
          return (
            <Link
              key={sub.id}
              href={`/subjects/${sub.slug || sub.id}`}
              onClick={() => retroSound.playClick()}
              className="rounded-2xl p-6 bg-[#070c20]/80 border border-violet-500/20 hover:border-cyan-400/50 hover:shadow-xl transition-all duration-300 backdrop-blur-xl flex flex-col justify-between group space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                    {sub.icon}
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2.5 py-1 rounded-full border font-semibold tracking-wider uppercase ${
                      isMastered
                        ? "text-emerald-400 bg-emerald-950/80 border-emerald-500/40"
                        : sub.mastery > 0
                        ? "text-cyan-400 bg-cyan-950/80 border-cyan-500/40"
                        : "text-zinc-500 bg-zinc-950 border-zinc-800"
                    }`}
                  >
                    {sub.badgeStatus}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                    {sub.code} • {sub.difficulty}
                  </span>
                  <h2 className="font-display font-bold text-base text-white group-hover:text-cyan-300 transition-colors mt-0.5">
                    {sub.title}
                  </h2>
                  <p className="font-body text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {sub.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 pt-1">
                  <span>{sub.totalTopics} Topics</span>
                  <span>•</span>
                  <span>{sub.totalQuizzes} Quizzes</span>
                </div>
              </div>

              {/* Mastery Progress Bar Footer */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-400">Subject Mastery</span>
                  <span className="text-cyan-300 font-bold">{sub.mastery}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMastered
                        ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                        : "bg-gradient-to-r from-violet-500 to-cyan-400"
                    }`}
                    style={{ width: `${sub.mastery}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filteredSubjects.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="font-display font-medium text-zinc-400 text-sm">
            No subjects matched your filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedDifficulty("ALL");
            }}
            className="text-xs font-mono text-cyan-400 underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
