"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import {
  GraduationCap,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Send,
  Sparkles,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";

export default function FacultyStudentPerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const studentId = resolvedParams.id;

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Intervention modal state
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [interventionType, setInterventionType] = useState<
    "ASSIGN_QUEST" | "ASSIGN_QUIZ" | "SEND_RECOMMENDATION"
  >("ASSIGN_QUEST");
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionMsg, setInterventionMsg] = useState("");
  const [submittingIntervention, setSubmittingIntervention] = useState(false);
  const [interventionSuccess, setInterventionSuccess] = useState("");

  const loadStudentData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/faculty/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
      }
    } catch (err) {
      console.error("Failed loading student performance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const openIntervention = (
    type: "ASSIGN_QUEST" | "ASSIGN_QUIZ" | "SEND_RECOMMENDATION",
    defaultTitle?: string
  ) => {
    setInterventionType(type);
    setInterventionTitle(
      defaultTitle ||
        (type === "ASSIGN_QUEST"
          ? `Targeted Practice: ${student?.weakTopics?.[0]?.topic || "Algorithms"}`
          : type === "ASSIGN_QUIZ"
          ? `Diagnostic Challenge: ${student?.weakTopics?.[0]?.topic || "Algorithms"}`
          : `Pedagogical Recommendation`)
    );
    setInterventionMsg(
      type === "ASSIGN_QUEST"
        ? `Please complete a 15-minute diagnostic drill on ${student?.weakTopics?.[0]?.topic || "core concepts"} before next lecture.`
        : type === "ASSIGN_QUIZ"
        ? `Attempt this diagnostic quiz to evaluate recent progress and unlock bonus XP.`
        : `Focus revision on ${student?.weakTopics?.[0]?.topic || "weak areas"} using CR flashcards.`
    );
    setInterventionSuccess("");
    setInterventionModalOpen(true);
  };

  const handleSubmitIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIntervention(true);

    try {
      const res = await fetch("/api/faculty/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          classId: student.classId,
          type: interventionType,
          title: interventionTitle,
          message: interventionMsg,
        }),
      });

      if (res.ok) {
        setInterventionSuccess("Intervention successfully assigned!");
        setTimeout(() => {
          setInterventionModalOpen(false);
          loadStudentData();
        }, 1200);
      }
    } catch (err) {
      console.error("Intervention submission failed", err);
    } finally {
      setSubmittingIntervention(false);
    }
  };

  if (loading && !student) {
    return (
      <div className="flex-1 p-8 text-slate-400 font-mono text-xs text-center">
        Gathering student academic & gamification telemetry...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex-1 p-8 text-slate-400 font-mono text-xs text-center">
        Student profile not found or access restricted.
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title={student.name}
        subtitle={`ID: ${student.studentId} • ${student.className} • ${student.email}`}
        primaryAction={{
          label: "Back to Class",
          href: student.classId ? `/faculty/classes/${student.classId}` : "/faculty/classes",
          icon: ArrowLeft,
        }}
      />

      <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Student Header Bar: Academic + Gamification KPIs */}
        <section aria-label="Student Identity & Overview">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-[#f755bc] flex items-center justify-center text-2xl shadow-sm">
                🎓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">{student.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 text-xs font-semibold border border-pink-500/20">
                    LV.{student.level} {student.rank}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Program: <strong className="text-slate-200">{student.program}</strong> • Semester {student.semester}, Section {student.section}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons for Faculty */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => openIntervention("ASSIGN_QUEST")}
                className="py-1.5 px-3 rounded-md bg-[#de1659] hover:bg-[#c2134d] text-white text-xs font-semibold transition-colors"
              >
                + Assign Quest
              </button>
              <button
                onClick={() => openIntervention("ASSIGN_QUIZ")}
                className="py-1.5 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              >
                + Assign Quiz
              </button>
              <button
                onClick={() => openIntervention("SEND_RECOMMENDATION")}
                className="py-1.5 px-3 rounded-md bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 text-xs font-semibold transition-colors border border-cyan-500/30"
              >
                + Recommendation
              </button>
            </div>
          </div>
        </section>

        {/* At-Risk Diagnostic Signal */}
        {student.atRiskSignal?.required && (
          <section aria-label="At Risk Diagnostic Signal">
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{student.atRiskSignal.title}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {student.atRiskSignal.message}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs text-amber-300/90 border-t border-amber-500/20">
                <span>
                  <strong>Suggested Action:</strong> {student.atRiskSignal.suggestedIntervention}
                </span>
                <button
                  onClick={() => openIntervention("ASSIGN_QUEST")}
                  className="underline font-semibold hover:text-amber-200"
                >
                  Dispatch Intervention Now
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 4 Primary Academic Metrics */}
        <section aria-label="Academic Metric Cards">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Overall Mastery</span>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {student.overallMastery}%
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">across evaluated subjects</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Quiz Accuracy</span>
              <div className="text-2xl font-bold text-white mt-1">
                {student.quizAccuracy}%
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">arena evaluation average</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Active Streak</span>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {student.streak} Days
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">consecutive platform presence</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Quests Completed</span>
              <div className="text-2xl font-bold text-cyan-400 mt-1">
                {student.questsCompleted}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Total XP: {student.xp.toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Topic Mastery & Strengths/Weaknesses Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Topic Mastery Progress Bars */}
          <section aria-label="Topic Mastery Breakdown" className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Curricular Topic Mastery
              </h3>
              <span className="text-[11px] text-slate-500">Live Accuracy</span>
            </div>

            <div className="space-y-3.5">
              {student.topicMastery?.map((tm: any) => (
                <div key={tm.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{tm.topic}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-1 rounded ${
                          tm.trend === "IMPROVING"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : tm.trend === "DECLINING"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {tm.trend}
                      </span>
                      <span className="font-mono font-semibold text-white">{tm.accuracy}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        tm.accuracy >= 80
                          ? "bg-emerald-500"
                          : tm.accuracy >= 65
                          ? "bg-cyan-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${tm.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Strengths and Needs Attention (Data-Driven) */}
          <section aria-label="Strengths and Needs Attention" className="space-y-4">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Demonstrated Strong Areas (&gt;80%)</span>
              </div>
              <div className="space-y-2">
                {student.strongTopics?.map((s: any) => (
                  <div
                    key={s.topic}
                    className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-medium">✓ {s.topic}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{s.accuracy}%</span>
                  </div>
                ))}
                {(!student.strongTopics || student.strongTopics.length === 0) && (
                  <p className="text-xs text-slate-500">No topics currently above 80% threshold.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Needs Attention / Declining (&lt;68%)</span>
              </div>
              <div className="space-y-2">
                {student.weakTopics?.map((w: any) => (
                  <div
                    key={w.topic}
                    className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200 font-medium">⚠ {w.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-400 uppercase font-mono">{w.trend}</span>
                      <span className="font-mono text-amber-400 font-semibold">{w.accuracy}%</span>
                    </div>
                  </div>
                ))}
                {(!student.weakTopics || student.weakTopics.length === 0) && (
                  <p className="text-xs text-slate-500">No critical weaknesses recorded.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Assigned Interventions History */}
        <section aria-label="Interventions History" className="rounded-lg border border-slate-800 bg-slate-900/70 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Intervention History & Faculty Actions
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {student.interventions?.length || 0} Total Records
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 text-xs">
            {student.interventions?.map((inv: any) => (
              <div key={inv.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{inv.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {inv.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{inv.message}</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Dispatched by {inv.facultyName} on {new Date(inv.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    inv.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))}

            {(!student.interventions || student.interventions.length === 0) && (
              <p className="py-4 text-center text-slate-500 text-xs">
                No targeted interventions have been dispatched to this student yet.
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Intervention Modal */}
      {interventionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">
                Dispatch Targeted Intervention
              </h3>
              <button
                onClick={() => setInterventionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {interventionSuccess && (
              <div className="p-3 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{interventionSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitIntervention} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Intervention Type</label>
                <select
                  value={interventionType}
                  onChange={(e) => setInterventionType(e.target.value as any)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="ASSIGN_QUEST">Assign Practice Quest (+XP)</option>
                  <option value="ASSIGN_QUIZ">Assign Diagnostic Quiz Battle</option>
                  <option value="SEND_RECOMMENDATION">Send Pedagogical Note</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={interventionTitle}
                  onChange={(e) => setInterventionTitle(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Guidance Message</label>
                <textarea
                  rows={3}
                  required
                  value={interventionMsg}
                  onChange={(e) => setInterventionMsg(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInterventionModalOpen(false)}
                  className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIntervention}
                  className="py-2 px-4 rounded bg-[#de1659] hover:bg-[#c2134d] text-white font-semibold transition-colors"
                >
                  {submittingIntervention ? "Dispatching..." : "Confirm & Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
