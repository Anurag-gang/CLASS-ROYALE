"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import {
  FileQuestion,
  Sparkles,
  Plus,
  CheckCircle2,
  ArrowRight,
  Database,
  Layers,
  Check,
  X,
  Code,
  Tag,
  Swords,
} from "lucide-react";
import { SubjectWithStats, DifficultyLevel } from "@/types/quiz";
import { FacultyQuestionBankInspector } from "@/components/faculty/FacultyQuestionBankInspector";

export default function FacultyQuizzesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  // New Question Form Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [formSubjectId, setFormSubjectId] = useState("");
  const [formQuestionText, setFormQuestionText] = useState("");
  const [formCodeSnippet, setFormCodeSnippet] = useState("");
  const [formOptA, setFormOptA] = useState("");
  const [formOptB, setFormOptB] = useState("");
  const [formOptC, setFormOptC] = useState("");
  const [formOptD, setFormOptD] = useState("");
  const [formCorrectOption, setFormCorrectOption] = useState<"A" | "B" | "C" | "D">("A");
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>("Medium");
  const [formExplanation, setFormExplanation] = useState("");
  const [formTags, setFormTags] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [classRes, subRes] = await Promise.all([
          fetch("/api/faculty/classes"),
          fetch("/api/questions/subjects"),
        ]);

        if (classRes.ok) {
          const data = await classRes.json();
          setClasses(data.classes || []);
        }

        if (subRes.ok) {
          const data = await subRes.json();
          if (data.subjects) {
            setSubjects(data.subjects);
            if (data.subjects[0]) {
              setFormSubjectId(data.subjects[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Faculty Quizzes load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    if (!formSubjectId || !formQuestionText || !formOptA || !formOptB || !formOptC || !formOptD) {
      setSubmitError("Please fill out all required fields (Question & 4 Options).");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: formSubjectId,
          question_text: formQuestionText,
          code_snippet: formCodeSnippet.trim() || undefined,
          options: [
            { id: "A", text: formOptA },
            { id: "B", text: formOptB },
            { id: "C", text: formOptC },
            { id: "D", text: formOptD },
          ],
          correct_option_id: formCorrectOption,
          difficulty: formDifficulty,
          explanation: formExplanation || "Standard faculty-curated answer.",
          tags: formTags
            ? formTags.split(",").map((t) => t.trim()).filter(Boolean)
            : ["Faculty Authoring"],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess("Question successfully published live to the Kingdom Question Bank!");
        // Refresh subjects
        const subRes = await fetch("/api/questions/subjects");
        const subData = await subRes.json();
        if (subData.subjects) setSubjects(subData.subjects);

        // Reset fields
        setFormQuestionText("");
        setFormCodeSnippet("");
        setFormOptA("");
        setFormOptB("");
        setFormOptC("");
        setFormOptD("");
        setFormExplanation("");
        setFormTags("");
        setTimeout(() => setShowCreateModal(false), 1200);
      } else {
        setSubmitError(data.error || "Failed to publish question.");
      }
    } catch {
      setSubmitError("Network gateway timed out.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalBankQuestions = subjects.reduce((acc, s) => acc + s.total_questions, 0);

  const activeQuizzes = [
    {
      id: "q-1",
      title: "Binary Search Tree Traversals & Balancing",
      topic: "Data Structures",
      className: "BCA — Semester 5A",
      classId: classes[0]?.id || "",
      questionsCount: 5,
      submissionsCount: 15,
      averageScore: 84,
      status: "ACTIVE",
    },
    {
      id: "q-2",
      title: "Relational Normalization & BCNF Diagnostics",
      topic: "DBMS",
      className: "BCA — Semester 5A",
      classId: classes[0]?.id || "",
      questionsCount: 5,
      submissionsCount: 14,
      averageScore: 78,
      status: "ACTIVE",
    },
    {
      id: "q-3",
      title: "Dynamic Programming: Tabulation vs Memoization",
      topic: "Algorithms",
      className: "BCA — Semester 5B",
      classId: classes[1]?.id || "",
      questionsCount: 5,
      submissionsCount: 12,
      averageScore: 68,
      status: "ACTIVE",
    },
  ];

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title="Quizzes & Question Bank Management"
        subtitle="Curate the production question bank, assign class quizzes, and authorize AI-generated curricular items."
        primaryAction={{
          label: "Generate AI Quiz",
          href: "/faculty/ai-generator",
          icon: Sparkles,
        }}
      />

      <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        {/* 1. Live Question Bank Inventory Banner */}
        <div className="rounded-2xl p-6 bg-slate-900/80 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">
                Live Question Bank Database
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Direct connection to Supabase / SQLite. Questions added here render immediately in the Battle Arena.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="block text-[10px] font-mono text-slate-400">TOTAL QUESTIONS</span>
              <span className="font-mono font-bold text-sm text-cyan-400">{totalBankQuestions} Active</span>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Author New Question
            </button>
          </div>
        </div>

        {/* 2. Territory Question Bank Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-pink-400 uppercase">
                    {s.territory_name}
                  </span>
                  <span className="text-xs font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded">
                    {s.total_questions} Qs
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-white mt-1">{s.name}</h3>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>Easy: {s.difficulty_counts?.Easy} | Med: {s.difficulty_counts?.Medium}</span>
                <span className="text-pink-400 font-mono">+{s.total_xp} XP</span>
              </div>
            </div>
          ))}
        </div>

        {/* 3. Assigned Cohort Quizzes Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Assigned Class Quizzes
          </h3>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Quiz Title / Topic</th>
                    <th className="p-3.5">Assigned Class</th>
                    <th className="p-3.5">Questions</th>
                    <th className="p-3.5">Submissions</th>
                    <th className="p-3.5">Average Score</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeQuizzes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-850/40">
                      <td className="p-3.5">
                        <div className="font-semibold text-white">{q.title}</div>
                        <span className="text-[11px] text-pink-400 font-mono">{q.topic}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">{q.className}</td>
                      <td className="p-3.5 font-mono text-slate-300">{q.questionsCount}</td>
                      <td className="p-3.5 font-mono text-slate-300">{q.submissionsCount}</td>
                      <td className="p-3.5 font-semibold text-emerald-400">{q.averageScore}%</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={q.classId ? `/faculty/classes/${q.classId}` : "/faculty/classes"}
                          className="text-pink-400 hover:text-pink-300 font-medium inline-flex items-center gap-1"
                        >
                          View Class <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Sovereign Question Bank & Level Curator Inspector */}
        <FacultyQuestionBankInspector />
      </main>

      {/* 4. MODAL: Author New Question */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">Author Question into Question Bank</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {submitError && (
              <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              {/* Subject Selector & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Territory Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.territory_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Difficulty Tier</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Easy">Easy (50 XP / 30s)</option>
                    <option value="Medium">Medium (100 XP / 45s)</option>
                    <option value="Hard">Hard (200 XP / 60s)</option>
                    <option value="Boss">Boss Encounter (500 XP / 90s)</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Question Text</label>
                <textarea
                  required
                  rows={3}
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  placeholder="Formulate a rigorous computer science concept or inquiry..."
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Optional Code Snippet */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  Code Snippet (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formCodeSnippet}
                  onChange={(e) => setFormCodeSnippet(e.target.value)}
                  placeholder="void solve() { ... }"
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Options A, B, C, D */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-medium">4 Answer Choices</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      A
                    </span>
                    <input
                      required
                      type="text"
                      value={formOptA}
                      onChange={(e) => setFormOptA(e.target.value)}
                      placeholder="Choice A..."
                      className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      B
                    </span>
                    <input
                      required
                      type="text"
                      value={formOptB}
                      onChange={(e) => setFormOptB(e.target.value)}
                      placeholder="Choice B..."
                      className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      C
                    </span>
                    <input
                      required
                      type="text"
                      value={formOptC}
                      onChange={(e) => setFormOptC(e.target.value)}
                      placeholder="Choice C..."
                      className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-800 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0">
                      D
                    </span>
                    <input
                      required
                      type="text"
                      value={formOptD}
                      onChange={(e) => setFormOptD(e.target.value)}
                      placeholder="Choice D..."
                      className="w-full p-2 rounded bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Correct Option Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Correct Answer Choice</label>
                <div className="flex items-center gap-3">
                  {(["A", "B", "C", "D"] as const).map((key) => (
                    <label key={key} className="flex items-center gap-1.5 cursor-pointer text-white">
                      <input
                        type="radio"
                        name="correct_choice"
                        checked={formCorrectOption === key}
                        onChange={() => setFormCorrectOption(key)}
                        className="text-pink-500"
                      />
                      <span>Option {key}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Pedagogical Explanation</label>
                <textarea
                  rows={2}
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Explain why this choice is correct and why other choices are invalid..."
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Topic Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. Asymptotics, Master Theorem, Divide and Conquer"
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {submitting ? "Publishing..." : "Publish Live to Question Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
