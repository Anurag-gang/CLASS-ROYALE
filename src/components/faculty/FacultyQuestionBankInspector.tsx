"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Crown,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
} from "lucide-react";

interface QuestionItem {
  id: string;
  subjectId: string;
  subjectName?: string;
  subjectSlug?: string;
  questionText: string;
  codeSnippet?: string | null;
  options: { id: string; text: string }[];
  correctOptionId: string;
  difficulty: string;
  xpReward: number;
  timeLimitSeconds: number;
  explanation: string;
  hint?: string | null;
  misconceptionExplanation?: string | null;
  referenceSource?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  levelNumber?: number | null;
  validationStatus: "VALIDATED" | "NEEDS_REVIEW" | "DRAFT" | "PUBLISHED";
  tags: string[];
}

const REALM_OPTIONS = [
  { slug: "data-structures-and-algorithms", name: "Data Structures & Algorithms" },
  { slug: "database-management-systems", name: "Database Management Systems" },
  { slug: "operating-systems", name: "Operating Systems" },
  { slug: "computer-networks", name: "Computer Networks" },
  { slug: "ai-and-machine-learning", name: "AI & Machine Learning" },
  { slug: "web-dev-and-devops", name: "Web Development & DevOps" },
];

export function FacultyQuestionBankInspector() {
  const [selectedSubject, setSelectedSubject] = useState("data-structures-and-algorithms");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [editHint, setEditHint] = useState("");
  const [editMisconception, setEditMisconception] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editStatus, setEditStatus] = useState<"VALIDATED" | "NEEDS_REVIEW">("VALIDATED");
  const [editLevel, setEditLevel] = useState(1);
  const [saving, setSaving] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubject) params.set("subjectSlug", selectedSubject);
      if (selectedLevel !== "ALL") params.set("levelNumber", selectedLevel);
      if (selectedStatus !== "ALL") params.set("validationStatus", selectedStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/faculty/questions?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions || []);
        setSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedSubject, selectedLevel, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const openEditModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setEditHint(q.hint || "");
    setEditMisconception(q.misconceptionExplanation || "");
    setEditExplanation(q.explanation || "");
    setEditStatus((q.validationStatus === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "VALIDATED") as any);
    setEditLevel(q.levelNumber || 1);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    setSaving(true);
    try {
      const res = await fetch("/api/faculty/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingQuestion.id,
          hint: editHint,
          misconceptionExplanation: editMisconception,
          explanation: editExplanation,
          validationStatus: editStatus,
          levelNumber: editLevel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === editingQuestion.id
              ? {
                  ...q,
                  hint: editHint,
                  misconceptionExplanation: editMisconception,
                  explanation: editExplanation,
                  validationStatus: editStatus,
                  levelNumber: editLevel,
                }
              : q
          )
        );
        setEditingQuestion(null);
      }
    } catch (err) {
      console.error("Save question error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Kingdom Filter Controls */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="font-condensed font-black text-lg text-white uppercase tracking-tight">
                Knowledge Kingdom Question Bank &amp; Tier Curator
              </h3>
            </div>
            <p className="font-inter text-xs text-slate-400">
              Audit the canonical curriculum across all 7 academic tiers, review hints and misconception notes.
            </p>
          </div>

          {/* Quick Health Stats */}
          {summary && (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <span className="block font-inter text-[10px] font-semibold text-emerald-400 uppercase">
                  Validated
                </span>
                <span className="font-mono font-bold text-xs text-white">
                  {summary.validatedCount} / {summary.totalSubjectQuestions}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                <span className="block font-inter text-[10px] font-semibold text-amber-400 uppercase">
                  Under Review
                </span>
                <span className="font-mono font-bold text-xs text-amber-300">
                  {summary.needsReviewCount}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 7-Tier Distribution Meter */}
        {summary && summary.levelCounts && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="block font-inter text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              7-Tier Realm Question Distribution
            </span>
            <div className="grid grid-cols-7 gap-2 text-center font-inter text-xs">
              {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                const count = summary.levelCounts[lvl] || 0;
                const isSelected = selectedLevel === String(lvl);
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(isSelected ? "ALL" : String(lvl))}
                    className={`p-2 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400"
                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span className="block font-mono text-[10px] text-slate-400 uppercase">
                      Tier {lvl}
                    </span>
                    <span className="font-mono font-black text-sm text-white">
                      {count} Qs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Interactive Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-inter font-semibold uppercase text-slate-400 mb-1">
              Academic Realm
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-inter text-white focus:border-cyan-400 outline-none"
            >
              {REALM_OPTIONS.map((r) => (
                <option key={r.slug} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Level Filter */}
          <div>
            <label className="block text-[10px] font-inter font-semibold uppercase text-slate-400 mb-1">
              Tier Progression Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-inter text-white focus:border-cyan-400 outline-none"
            >
              <option value="ALL">All Tiers (1–7)</option>
              <option value="1">Tier 1: Foundations</option>
              <option value="2">Tier 2: Exploration</option>
              <option value="3">Tier 3: Applied Mechanics</option>
              <option value="4">Tier 4: Architecture</option>
              <option value="5">Tier 5: Diagnostics</option>
              <option value="6">Tier 6: Synthesis</option>
              <option value="7">Tier 7: The Crown Trial</option>
            </select>
          </div>

          {/* Validation Status Filter */}
          <div>
            <label className="block text-[10px] font-inter font-semibold uppercase text-slate-400 mb-1">
              Validation State
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-inter text-white focus:border-cyan-400 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="VALIDATED">Validated (Production)</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
            </select>
          </div>

          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit}>
            <label className="block text-[10px] font-inter font-semibold uppercase text-slate-400 mb-1">
              Search Concepts
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Topic, keyword, or query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-950 border border-slate-800 text-xs font-inter text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="font-inter text-xs text-slate-400">Loading curricular questions...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center font-inter text-xs text-slate-400">
          No questions matched the selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-inter text-slate-400">
            <span>Showing {questions.length} Questions</span>
            <span>Click any item to inspect options &amp; hints</span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isExpanded = expandedCardId === q.id;
              const isValidated = q.validationStatus === "VALIDATED";

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedCardId(isExpanded ? null : q.id)}
                    className="p-5 flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0">
                        {idx + 1}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                            Tier {q.levelNumber || 1}
                          </span>
                          <span className="text-[10px] font-inter font-medium px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400">
                            {q.difficulty}
                          </span>
                          <span className="text-[10px] font-inter font-semibold px-2 py-0.5 rounded-full bg-slate-950 border border-cyan-500/30 text-cyan-300">
                            {q.topic || "Core"}
                          </span>
                          {q.subtopic && (
                            <span className="text-[10px] font-inter text-slate-400">
                              • {q.subtopic}
                            </span>
                          )}
                        </div>

                        <h4 className="font-inter font-medium text-sm text-white leading-relaxed">
                          {q.questionText}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] font-inter font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                          isValidated
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {isValidated ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{q.validationStatus}</span>
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(q);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Question Attributes"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Academic Details */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-4 font-inter text-xs">
                      {q.codeSnippet && (
                        <pre className="p-3.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                          <code>{q.codeSnippet}</code>
                        </pre>
                      )}

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt) => {
                          const isCorrect = opt.id === q.correctOptionId;
                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                                isCorrect
                                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-semibold"
                                  : "bg-slate-900/60 border-slate-800 text-slate-300"
                              }`}
                            >
                              <span className="font-mono font-bold">{opt.id}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pedagogical Breakdown */}
                      <div className="space-y-2 pt-2">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="font-bold text-[10px] text-cyan-400 uppercase tracking-wider block">
                            Academic Explanation
                          </span>
                          <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                        </div>

                        {q.misconceptionExplanation && (
                          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-1 text-amber-200">
                            <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Common Misconception
                            </span>
                            <p className="text-slate-300 leading-relaxed">
                              {q.misconceptionExplanation}
                            </p>
                          </div>
                        )}

                        {q.hint && (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
                            <span className="font-bold text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Timed Hint (15s Unlock)
                            </span>
                            <p className="text-slate-300 leading-relaxed">{q.hint}</p>
                          </div>
                        )}

                        {q.referenceSource && (
                          <span className="text-[10px] font-mono text-slate-500 block">
                            Canonical Citation: {q.referenceSource}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 font-inter text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-condensed font-black text-lg text-white uppercase tracking-tight">
                Curate Question Details
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Question Text
                </label>
                <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                  {editingQuestion.questionText}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Assigned Tier Level
                  </label>
                  <select
                    value={editLevel}
                    onChange={(e) => setEditLevel(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                      <option key={l} value={l}>
                        Tier {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Validation Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none"
                  >
                    <option value="VALIDATED">VALIDATED (Production)</option>
                    <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Timed Hint (Unlocked at 15s in Tiers 1–6)
                </label>
                <textarea
                  rows={2}
                  value={editHint}
                  onChange={(e) => setEditHint(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Common Misconception Callout
                </label>
                <textarea
                  rows={2}
                  value={editMisconception}
                  onChange={(e) => setEditMisconception(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Academic Explanation
                </label>
                <textarea
                  rows={3}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}