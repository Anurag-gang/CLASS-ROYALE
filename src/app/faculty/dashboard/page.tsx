"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Sparkles,
  Upload,
  Plus,
  CheckCircle2,
  ChevronDown,
  BarChart2,
  Calendar,
  Layers,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";

interface CohortItem {
  id: string;
  name: string;
  code: string;
  type: "CLASS" | "CLAN";
  studentCount: number;
}

interface TopicPerformance {
  topic: string;
  accuracy: number;
  studentCount: number;
  strugglingCount: number;
  status: "STRONG" | "ON_TRACK" | "ATTENTION";
}

interface AtRiskStudent {
  id: string;
  name: string;
  studentId: string;
  avatar: string;
  issueTopic: string;
  issueAccuracy: number;
  trend: string;
  streak: number;
}

interface ClassItem {
  id: string;
  name: string;
  code: string;
  semester: number;
  section: string;
  programName: string;
  studentCount: number;
  averageMastery: number;
  coursesCount: number;
}

export default function FacultyDashboardPage() {
  const [cohorts, setCohorts] = useState<CohortItem[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<string>("all");
  const [metrics, setMetrics] = useState<{
    averageMastery: number;
    quizCompletionRate: number;
    activeStudents: number;
    attentionRequiredCount: number;
    classesCount: number;
  } | null>(null);
  const [topicPerformance, setTopicPerformance] = useState<TopicPerformance[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async (cohortId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/faculty/overview?cohortId=${encodeURIComponent(cohortId)}`);
      if (res.ok) {
        const data = await res.json();
        setCohorts(data.cohorts || []);
        setMetrics(data.metrics || null);
        setTopicPerformance(data.topicPerformance || []);
        setAtRiskStudents(data.atRiskStudents || []);
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error("Failed loading faculty overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(selectedCohort);
  }, [selectedCohort]);

  const activeCohortName = cohorts.find((c) => c.id === selectedCohort)?.name || "All Cohorts (Aggregated)";

  return (
    <div className="flex-1 min-h-screen bg-[#070b16] text-slate-100 pb-16">
      <FacultyHeader
        title="Faculty Command Center"
        subtitle="Academic performance, diagnostic signals, and curricular struggle points across cohorts."
        primaryAction={{
          label: "Generate AI Quiz",
          href: "/faculty/ai-generator",
          icon: Sparkles,
        }}
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Cohort Selector & Date Bar */}
        <section
          aria-label="Cohort Filter Bar"
          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Active Cohort:
            </span>

            <div className="relative">
              <select
                value={selectedCohort}
                onChange={(e) => setSelectedCohort(e.target.value)}
                className="appearance-none py-1.5 pl-3 pr-8 rounded-lg bg-slate-950 border border-slate-700/80 text-white text-xs font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.studentCount > 0 ? `(${c.studentCount} students)` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
              {activeCohortName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Academic Term 2026-27</span>
          </div>
        </section>

        {/* 4 Core High-Level KPIs */}
        <section aria-label="Academic Performance Metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Average Mastery */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Average Mastery</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {loading ? "..." : `${metrics?.averageMastery || 76}%`}
                </span>
                <span className="text-[11px] font-mono text-emerald-500/90 font-medium">
                  +4.2% this week
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Across assessed syllabus topics</p>
            </div>

            {/* 2. Quiz Completion Rate */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Quiz Completion</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? "..." : `${metrics?.quizCompletionRate || 82}%`}
                </span>
                <span className="text-[11px] font-mono text-cyan-400/90 font-medium">
                  high submission rate
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Active participation index</p>
            </div>

            {/* 3. Active Students */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Active Students</span>
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {loading ? "..." : metrics?.activeStudents || 104}
                </span>
                <span className="text-[11px] font-mono text-slate-400">enrolled</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Across currently active modules</p>
            </div>

            {/* 4. Attention Required */}
            <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/50 transition-colors">
              <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                <span>Attention Required</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                  {loading ? "..." : metrics?.attentionRequiredCount || 18}
                </span>
                <span className="text-[11px] font-mono text-amber-400/90">students</span>
              </div>
              <p className="text-[11px] text-amber-500/80 mt-1">Struggling with core concepts</p>
            </div>
          </div>
        </section>

        {/* Curricular Topic Performance & Attention Required Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Curricular Topic Performance */}
          <section className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Curricular Topic Performance
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time mastery index calculated from student quiz submissions.
                </p>
              </div>

              <Link
                href="/faculty/ai-generator"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate Remediation Drill
              </Link>
            </div>

            <div className="space-y-4">
              {topicPerformance.map((tp) => (
                <div key={tp.topic} className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          tp.status === "STRONG"
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                            : tp.status === "ON_TRACK"
                            ? "bg-cyan-400"
                            : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                        }`}
                      />
                      <span className="text-xs font-medium text-slate-200">{tp.topic}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {tp.strugglingCount > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {tp.strugglingCount} struggling
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-bold ${
                          tp.status === "STRONG"
                            ? "text-emerald-400"
                            : tp.status === "ON_TRACK"
                            ? "text-cyan-400"
                            : "text-amber-400"
                        }`}
                      >
                        {tp.accuracy}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        tp.status === "STRONG"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : tp.status === "ON_TRACK"
                          ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                          : "bg-gradient-to-r from-amber-500 to-orange-400"
                      }`}
                      style={{ width: `${tp.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column: Attention Required Intervention List */}
          <section className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Attention Required</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded">
                Deficit Alert
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Students identified with &lt; 65% accuracy or declining trends. Recommended for targeted active retrieval.
            </p>

            <div className="space-y-3 pt-1">
              {atRiskStudents.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{s.avatar || "🎓"}</span>
                      <div>
                        <h3 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                          {s.name}
                        </h3>
                        <p className="text-[10px] font-mono text-slate-400">ID: {s.studentId}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      {s.issueAccuracy}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                    <span className="truncate max-w-[180px] text-slate-300" title={s.issueTopic}>
                      {s.issueTopic}
                    </span>
                    <Link
                      href={`/faculty/ai-generator?topic=${encodeURIComponent(s.issueTopic)}`}
                      className="text-cyan-400 hover:text-cyan-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Assign Quiz</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Assigned Classes & Roster Cards */}
        <section aria-label="Assigned Classes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Assigned Classes &amp; Cohorts
              </h2>
              <p className="text-xs text-slate-400">
                Manage student rosters, inspect individual performance, or launch classroom quizzes.
              </p>
            </div>
            <Link
              href="/faculty/classes"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              Manage Classes <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 uppercase">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {c.studentCount} Students
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-2.5">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.programName} • Semester {c.semester}, Section {c.section}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Class Average Mastery</span>
                    <span className="font-bold text-emerald-400">{c.averageMastery}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${c.averageMastery}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Link
                    href={`/faculty/classes/${c.id}`}
                    className="flex-1 py-2 px-3 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                  >
                    Open Roster
                  </Link>
                  <Link
                    href={`/faculty/ai-generator?classId=${c.id}`}
                    title="Generate Adaptive Quiz"
                    className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 hover:bg-cyan-900/50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Tools Bar */}
        <section aria-label="Faculty Suite Navigation" className="pt-4 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/faculty/classes"
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 flex items-center gap-3 transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Student CSV Importer</h3>
                <p className="text-[11px] text-slate-400">Batch upload student rosters with verification</p>
              </div>
            </Link>

            <Link
              href="/faculty/ai-generator"
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 flex items-center gap-3 transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">CR AI Quiz Generator</h3>
                <p className="text-[11px] text-slate-400">Create adaptive quizzes with faculty review</p>
              </div>
            </Link>

            <Link
              href="/faculty/analytics"
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 flex items-center gap-3 transition-colors"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Cohort Performance</h3>
                <p className="text-[11px] text-slate-400">Deep dive topic mastery & CR inquiry signals</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
