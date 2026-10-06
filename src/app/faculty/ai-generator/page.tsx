"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import {
  Sparkles,
  CheckCircle2,
  Edit2,
  RefreshCw,
  Send,
  HelpCircle,
  BookOpen,
  Check,
} from "lucide-react";

interface QuestionProposal {
  question: string;
  optionsJson?: string;
  options?: string[];
  answerIndex: number;
  explanation: string;
  subtopic?: string;
}

function AIQuizGeneratorContent() {
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId") || "";
  const initialTopic = searchParams.get("topic") || "Binary Search Trees";

  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questionCount, setQuestionCount] = useState(5);
  const [learningObjective, setLearningObjective] = useState(
    "Verify student comprehension of node insertion, balancing conditions, and tree search complexity."
  );

  const [generating, setGenerating] = useState(false);
  const [proposedQuiz, setProposedQuiz] = useState<any>(null);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);
  const [editedText, setEditedText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch("/api/faculty/classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
          if (!selectedClassId && data.classes?.[0]) {
            setSelectedClassId(data.classes[0].id);
          }
        }
      } catch (err) {
        console.error("Failed loading classes", err);
      }
    }
    loadClasses();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    setPublishSuccess("");

    try {
      const res = await fetch("/api/faculty/ai-generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic,
          difficulty,
          questionCount,
          learningObjective,
          classId: selectedClassId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.proposedQuiz) {
        setProposedQuiz(data.proposedQuiz);
      } else {
        setError(data.error || "Failed generating quiz proposals");
      }
    } catch {
      setError("AI generation gateway timed out");
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveAndAssign = async () => {
    if (!proposedQuiz || !selectedClassId) return;
    setPublishing(true);
    setError("");

    try {
      const res = await fetch("/api/faculty/ai-generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          classId: selectedClassId,
          quizData: proposedQuiz,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPublishSuccess(data.message);
      } else {
        setError(data.error || "Failed approving and assigning quiz");
      }
    } catch {
      setError("Network error publishing quiz");
    } finally {
      setPublishing(false);
    }
  };

  const handleEditQuestion = (index: number) => {
    setEditingQuestionIdx(index);
    setEditedText(proposedQuiz.questions[index].question);
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...proposedQuiz.questions];
    updated[index].question = editedText;
    setProposedQuiz({ ...proposedQuiz, questions: updated });
    setEditingQuestionIdx(null);
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title="AI Quiz Generator & Curricular Review"
        subtitle="Generate adaptive, curriculum-aligned questions with CR. Review, edit, and authorize before publishing to cohorts."
      />

      <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
        {/* Configuration Panel */}
        <section aria-label="AI Quiz Parameters">
          <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Curricular Parameters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Class Cohort</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject Topic</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Binary Search Trees, Relational Normalization"
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Academic Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="Novice">Novice (Foundational / Definitions)</option>
                  <option value="Intermediate">Intermediate (Conceptual & Analysis)</option>
                  <option value="Advanced">Advanced (Complex Problem Solving)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Questions Count</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Learning Objective</label>
                <input
                  type="text"
                  value={learningObjective}
                  onChange={(e) => setLearningObjective(e.target.value)}
                  placeholder="e.g. Ensure students understand logarithmic tree traversal..."
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="py-2.5 px-5 rounded-md bg-[#de1659] hover:bg-[#c2134d] disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? "CR is Synthesizing Quiz Questions..." : "Generate with CR"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="p-4 rounded-md bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {publishSuccess && (
          <div className="p-4 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{publishSuccess}</span>
          </div>
        )}

        {/* Proposed Questions Review Panel */}
        {proposedQuiz && (
          <section aria-label="Question Review & Approval" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Proposed Quiz: {proposedQuiz.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {proposedQuiz.questions?.length} Questions • Topic: {proposedQuiz.topic} • Difficulty: {proposedQuiz.difficulty}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="py-1.5 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={handleApproveAndAssign}
                  disabled={publishing}
                  className="py-1.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  {publishing ? "Publishing..." : "Approve & Assign to Cohort"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {proposedQuiz.questions?.map((q: QuestionProposal, idx: number) => {
                const options = q.options || (q.optionsJson ? JSON.parse(q.optionsJson) : []);
                const isEditing = editingQuestionIdx === idx;

                return (
                  <div
                    key={idx}
                    className="p-5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {q.subtopic || "Core Concept"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleEditQuestion(idx)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingQuestionIdx(null)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-[11px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(idx)}
                            className="px-2.5 py-1 rounded bg-[#de1659] text-white text-[11px] font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="font-semibold text-slate-100 text-sm">{q.question}</p>
                    )}

                    {/* Options List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {options.map((opt: string, optIdx: number) => (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded border text-xs flex items-center justify-between ${
                            optIdx === q.answerIndex
                              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300 font-semibold"
                              : "bg-slate-950 border-slate-800 text-slate-300"
                          }`}
                        >
                          <span>{opt}</span>
                          {optIdx === q.answerIndex && (
                            <span className="text-[10px] font-mono uppercase text-emerald-400">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <strong className="text-slate-300 font-medium">Pedagogical Explanation:</strong>{" "}
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function FacultyAIQuizGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 font-mono text-xs text-center">Loading AI Generator...</div>}>
      <AIQuizGeneratorContent />
    </Suspense>
  );
}
