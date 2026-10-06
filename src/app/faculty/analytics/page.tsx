"use client";

import React, { useEffect, useState } from "react";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import {
  TrendingUp,
  BarChart3,
  Users,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Filter,
  CheckCircle2,
} from "lucide-react";

export default function FacultyAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [dateRange, setDateRange] = useState("30d");

  const loadAnalytics = async (classId: string) => {
    try {
      setLoading(true);
      const url =
        classId && classId !== "all"
          ? `/api/faculty/analytics?classId=${classId}&range=${dateRange}`
          : `/api/faculty/analytics?range=${dateRange}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed loading analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics(selectedClassId);
  }, [selectedClassId, dateRange]);

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title="Academic Analytics & Diagnostic Insights"
        subtitle="Cohort mastery trends, curricular struggle points, and aggregated CR student inquiries."
      />

      <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* Filters Bar */}
        <section aria-label="Analytics Filters" className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="p-2 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="all">All Assigned Classes</option>
                {data?.filters?.classes?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="p-2 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days (Current Term)</option>
                <option value="90d">Full Semester</option>
              </select>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Active Cohort: {data?.kpis?.totalStudents || 0} Students Evaluated
          </span>
        </section>

        {/* 4 Core Academic Metrics */}
        <section aria-label="Class Performance KPIs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Average Mastery</span>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400 mt-2">
                {data?.kpis?.averageMastery || 78}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">across assessed curriculum</p>
            </div>

            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Quiz Accuracy</span>
              <div className="text-2xl md:text-3xl font-bold text-white mt-2">
                {data?.kpis?.averageQuizAccuracy || 81}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">arena battle challenges</p>
            </div>

            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Active Engagement</span>
              <div className="text-2xl md:text-3xl font-bold text-cyan-400 mt-2">
                {data?.kpis?.activeRatePercent || 86}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                avg {data?.kpis?.averageStreakDays || 6} days streak
              </p>
            </div>

            <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Students Needing Attention</span>
              <div className="text-2xl md:text-3xl font-bold text-amber-400 mt-2">
                {data?.kpis?.studentsNeedingAttention || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">mastery decline detected</p>
            </div>
          </div>
        </section>

        {/* Curricular Topic Mastery & Extremes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topic Mastery Progress Table */}
          <div className="lg:col-span-2 rounded-lg border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Curricular Topic Mastery Distribution
              </h3>
              <span className="text-[11px] text-slate-400">Class Average</span>
            </div>

            <div className="space-y-4">
              {data?.topicBreakdown?.map((tb: any) => (
                <div key={tb.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{tb.topic}</span>
                    <div className="flex items-center gap-3">
                      {tb.studentsStruggling > 0 && (
                        <span className="text-[10px] text-amber-400 font-mono">
                          {tb.studentsStruggling} struggling
                        </span>
                      )}
                      <span className="font-mono font-semibold text-white">
                        {tb.averageAccuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        tb.averageAccuracy >= 80
                          ? "bg-emerald-500"
                          : tb.averageAccuracy >= 65
                          ? "bg-cyan-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${tb.averageAccuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strongest vs Weakest Topic Card */}
          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strongest Curriculum Area</span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {data?.kpis?.strongestTopic || "Data Structures"}
              </div>
              <p className="text-[11px] text-slate-400">
                Highest cohort comprehension and retention across quizzes.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-amber-950/20 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Needs Curricular Attention</span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {data?.kpis?.weakestTopic || "Algorithms"}
              </div>
              <p className="text-[11px] text-slate-400">
                Lowest average score. Recommended for review during upcoming lecture sessions.
              </p>
            </div>
          </div>
        </div>

        {/* Aggregated CR AI Inquiry Insights (Privacy-Preserving) */}
        <section aria-label="CR Learning Inquiries" className="rounded-lg border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                Aggregated CR Inquiries & Learning Bottlenecks
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
              PRIVACY PRESERVED // COHORT METRICS
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            These metrics represent aggregated topics that students most frequently consult the AI
            Learning Companion (<strong>CR</strong>) about. Individual student chat transcripts
            remain private.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {data?.crInquiryInsights?.map((item: any) => (
              <div
                key={item.topic}
                className="p-3.5 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center">
                    #{item.rank}
                  </span>
                  <span className="text-slate-200 font-medium">{item.topic}</span>
                </div>
                <span className="text-[11px] font-mono font-semibold text-pink-400">
                  {item.inquiriesCount} inquiries
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
