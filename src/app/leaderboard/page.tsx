"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Target, Award, TrendingUp, CheckCircle2 } from "lucide-react";
import { retroSound } from "@/lib/sound";

type MetricType = "mastery" | "accuracy" | "completion" | "improvement";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeMetric, setActiveMetric] = useState<MetricType>("mastery");
  const [loading, setLoading] = useState(true);

  const fetchRankings = (metric: MetricType) => {
    setLoading(true);
    fetch(`/api/leaderboard?metric=${metric}`)
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.leaderboard || []))
      .catch((err) => console.error("Leaderboard fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRankings(activeMetric);
  }, [activeMetric]);

  const handleMetricChange = (metric: MetricType) => {
    retroSound.playClick();
    setActiveMetric(metric);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <span className="font-mono text-xs text-amber-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ACADEMIC BENCHMARK
          </span>
          <h1 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            Scholastic Leaderboard
          </h1>
          <p className="font-body text-xs sm:text-sm text-zinc-400 max-w-xl">
            Rankings calibrated on verified subject mastery, answer precision, and empirical syllabus progress.
          </p>
        </div>

        {/* Metric Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto self-start md:self-auto">
          {[
            { id: "mastery", label: "Mastery" },
            { id: "accuracy", label: "Accuracy" },
            { id: "completion", label: "Quizzes" },
            { id: "improvement", label: "Improvement" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleMetricChange(m.id as MetricType)}
              className={`px-3.5 py-1.5 rounded-lg font-display text-xs font-semibold transition-all whitespace-nowrap ${
                activeMetric === m.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings List */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="font-hud text-xs text-zinc-400">Loading academic rankings...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#070c20]/60 divide-y divide-white/5 overflow-hidden backdrop-blur-xl">
          {leaderboard.map((student) => {
            const isTop1 = student.rank === 1;
            const isTop2 = student.rank === 2;
            const isTop3 = student.rank === 3;

            let rankBadgeStyle = "bg-white/5 text-zinc-400 border border-white/10";
            if (isTop1) rankBadgeStyle = "bg-amber-400 text-black font-bold shadow-[0_0_12px_#f59e0b]";
            else if (isTop2) rankBadgeStyle = "bg-zinc-300 text-black font-bold";
            else if (isTop3) rankBadgeStyle = "bg-amber-700 text-white font-bold";

            return (
              <div
                key={student.userId}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors ${
                  student.isCurrentUser
                    ? "bg-violet-950/30 border-l-4 border-l-cyan-400"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-hud text-xs shrink-0 ${rankBadgeStyle}`}
                  >
                    #{student.rank}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm text-white">
                        {student.name}
                      </span>
                      {student.isCurrentUser && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-zinc-500 block">
                      @{student.username} • {student.department}
                    </span>
                  </div>
                </div>

                {/* Score & Secondary Stats */}
                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block text-xs font-mono text-zinc-400 space-y-0.5">
                    <div>{student.accuracy}% Accuracy</div>
                    <div className="text-[11px] text-zinc-500">{student.quizzesCompleted} Quizzes</div>
                  </div>

                  <div className="min-w-20">
                    <div className="font-mono text-base font-bold text-cyan-300">
                      {activeMetric === "mastery" && `${student.mastery}%`}
                      {activeMetric === "accuracy" && `${student.accuracy}%`}
                      {activeMetric === "completion" && `${student.quizzesCompleted} done`}
                      {activeMetric === "improvement" && `+${student.improvementRate}%`}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {activeMetric}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}