"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import { CSVImportModal } from "@/components/faculty/CSVImportModal";
import {
  Users,
  Search,
  Upload,
  ArrowRight,
  BookOpen,
  FileQuestion,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";

interface StudentRow {
  id: string;
  studentId: string;
  name: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  rank: string;
  streak: number;
  overallMastery: number;
  quizAccuracy: number;
  activityStatus: "HIGH" | "MEDIUM" | "LOW" | "AT_RISK";
  isAtRisk: boolean;
  weakTopic?: string | null;
}

export default function FacultyClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "courses" | "quizzes" | "analytics"
  >("students");

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "AT_RISK" | "HIGH" | "INACTIVE">("ALL");
  const [importModalOpen, setImportModalOpen] = useState(false);

  const loadClassDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/faculty/classes/${classId}`);
      if (res.ok) {
        const data = await res.json();
        setClassData(data.class);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed loading class detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassDetail();
  }, [classId]);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.includes(searchQuery) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "AT_RISK") return s.isAtRisk;
    if (filterType === "HIGH") return s.overallMastery >= 85;
    if (filterType === "INACTIVE") return s.activityStatus === "LOW" || s.streak <= 1;

    return true;
  });

  if (loading && !classData) {
    return (
      <div className="flex-1 p-8 text-slate-400 font-mono text-xs text-center">
        Synchronizing class roster and telemetry...
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex-1 p-8 text-center text-slate-400 font-mono text-xs">
        Class not found or access denied.
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title={classData.name}
        subtitle={`${classData.program} // ${classData.department} • Semester ${classData.semester}, Section ${classData.section}`}
        primaryAction={{
          label: "Import Students",
          onClick: () => setImportModalOpen(true),
          icon: Upload,
        }}
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-medium">
          {[
            { id: "students", label: `Students (${students.length})` },
            { id: "overview", label: "Cohort Overview" },
            { id: "courses", label: `Courses (${classData.courses?.length || 0})` },
            { id: "quizzes", label: `Quizzes & Quests (${classData.quizzes?.length || 0})` },
            { id: "analytics", label: "Topic Analytics" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 transition-colors border-b-2 tracking-wide ${
                activeTab === tab.id
                  ? "border-[#de1659] text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: STUDENTS */}
        {activeTab === "students" && (
          <section aria-label="Student Roster" className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students by name, ID, or email..."
                  className="w-full pl-9 pr-4 py-2 rounded-md bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {[
                  { id: "ALL", label: "All Students" },
                  { id: "AT_RISK", label: "Needs Attention ⚠" },
                  { id: "HIGH", label: "High Performing" },
                  { id: "INACTIVE", label: "Low Activity" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors text-xs ${
                      filterType === f.id
                        ? "bg-slate-800 text-white border border-slate-700 font-semibold"
                        : "text-slate-400 hover:text-slate-200 bg-slate-900/40"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Students Table */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Student Name / ID</th>
                      <th className="p-3.5">Level & Rank</th>
                      <th className="p-3.5">Mastery</th>
                      <th className="p-3.5">Quiz Accuracy</th>
                      <th className="p-3.5">Learning Activity</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="p-3.5">
                          <Link
                            href={`/faculty/students/${s.id}`}
                            className="font-semibold text-white hover:text-pink-400 transition-colors block"
                          >
                            {s.name}
                          </Link>
                          <span className="text-[11px] font-mono text-slate-400">
                            ID: {s.studentId} • {s.email}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-[10px] font-bold">
                              LV.{s.level}
                            </span>
                            <span className="text-slate-300 text-[11px]">{s.rank}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-semibold ${
                                s.overallMastery >= 80
                                  ? "text-emerald-400"
                                  : s.overallMastery >= 65
                                  ? "text-slate-200"
                                  : "text-amber-400"
                              }`}
                            >
                              {s.overallMastery}%
                            </span>
                            <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  s.overallMastery >= 80
                                    ? "bg-emerald-500"
                                    : s.overallMastery >= 65
                                    ? "bg-slate-400"
                                    : "bg-amber-500"
                                }`}
                                style={{ width: `${s.overallMastery}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-200 font-medium">
                          {s.quizAccuracy}%
                        </td>
                        <td className="p-3.5">
                          {s.isAtRisk ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Needs Attention
                            </span>
                          ) : s.activityStatus === "HIGH" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3" /> High Presence
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {s.streak}d streak
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/faculty/students/${s.id}`}
                            className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 font-semibold text-xs transition-colors"
                          >
                            Performance <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                          No students matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: COHORT OVERVIEW */}
        {activeTab === "overview" && (
          <section aria-label="Class Overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Total Enrollment</span>
                <div className="text-2xl font-bold text-white mt-1">{students.length} Students</div>
                <p className="text-[11px] text-slate-500 mt-1">Class section capacity: 65</p>
              </div>
              <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">Active Curricula</span>
                <div className="text-2xl font-bold text-white mt-1">
                  {classData.courses?.length || 0} Courses
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Data Structures, DBMS</p>
              </div>
              <div className="p-5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium">At-Risk Interventions</span>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  {students.filter((s) => s.isAtRisk).length} Flagged
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Targeted practice recommended</p>
              </div>
            </div>

            {/* Recent Faculty Interventions */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Recent Dispatched Interventions
              </h3>
              <div className="divide-y divide-slate-800/80 text-xs">
                {classData.interventions?.map((inv: any) => (
                  <div key={inv.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white">{inv.title}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Assigned to: <strong className="text-slate-200">{inv.student.profile?.name || inv.student.username}</strong> • {inv.message}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {inv.type}
                    </span>
                  </div>
                ))}
                {(!classData.interventions || classData.interventions.length === 0) && (
                  <p className="text-slate-500 py-3 text-xs">No active interventions dispatched yet.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: COURSES */}
        {activeTab === "courses" && (
          <section aria-label="Assigned Courses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classData.courses?.map((c: any) => (
                <div
                  key={c.id}
                  className="rounded-lg bg-slate-900/80 border border-slate-800 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-semibold">
                      {c.difficulty}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {c.lessonsCount} Modules / Lessons
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{c.title}</h3>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <span>Reward: {c.xpReward} XP</span>
                    <Link
                      href={`/faculty/ai-generator?classId=${classId}&topic=${encodeURIComponent(c.title)}`}
                      className="text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Generate Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 4: QUIZZES */}
        {activeTab === "quizzes" && (
          <section aria-label="Class Quizzes" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Assigned Quizzes & Challenge Arenas
                </h3>
                <p className="text-xs text-slate-400">Quizzes active for this cohort</p>
              </div>
              <Link
                href={`/faculty/ai-generator?classId=${classId}`}
                className="py-1.5 px-3 rounded-md bg-[#de1659] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Generate with CR
              </Link>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/80 text-xs">
              {classData.quizzes?.map((q: any) => (
                <div key={q.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{q.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Topic: {q.topic} • Assigned: {new Date(q.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ACTIVE
                  </span>
                </div>
              ))}

              {(!classData.quizzes || classData.quizzes.length === 0) && (
                <div className="p-8 text-center text-slate-500">
                  No active quizzes assigned yet. Use the AI Quiz Generator to publish one.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 5: ANALYTICS */}
        {activeTab === "analytics" && (
          <section aria-label="Topic Mastery Breakdown" className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Curricular Topic Mastery Aggregate
            </h3>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              {classData.topicMasteryList?.map((tm: any) => (
                <div key={tm.topic} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{tm.topic}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{tm.averageAccuracy}% avg</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        tm.averageAccuracy >= 80
                          ? "bg-emerald-500"
                          : tm.averageAccuracy >= 65
                          ? "bg-cyan-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${tm.averageAccuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* CSV Student Import Modal */}
      <CSVImportModal
        classId={classId}
        classNameTitle={classData.name}
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          loadClassDetail();
        }}
      />
    </div>
  );
}
