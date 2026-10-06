"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  Calendar,
  Flame,
  ArrowRight,
  Sparkles,
  BookOpen,
  Edit3,
  Check,
  Shield,
  Clock,
  Layers,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

const avatarOptions = ["👨‍💻", "👩‍💻", "🧙‍♂️", "🔬", "⚡", "👾", "🛡️", "🏹", "👑", "🔮"];

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Edit form state
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [avatar, setAvatar] = useState("👨‍💻");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState<number>(5);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setName(json.profile?.name || "");
        setTitle(json.profile?.title || "");
        setAvatar(json.profile?.avatar || "👨‍💻");
        setDepartment(json.profile?.department || "");
        setSemester(json.profile?.semester || 5);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    retroSound.playClick();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, avatar, department, semester }),
      });
      if (res.ok) {
        retroSound.playLevelUp();
        setSaveMessage("Profile updated successfully!");
        setEditing(false);
        fetchProfile();
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch {
      retroSound.playWrong();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono text-xs text-zinc-400">Loading student profile...</span>
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="font-display font-bold text-xl text-white">PROFILE NOT FOUND</h2>
      </div>
    );
  }

  const { user, profile, metrics, clan, subjectMasteries = [], recentQuizzes = [] } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-10">
      {/* 1. Header Profile Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#0a1226]/90 to-[#070b16]/90 border border-cyan-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-cyan-400/50 flex items-center justify-center text-4xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              {profile.avatar}
            </div>

            {/* Identity details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                  {profile.name}
                </h1>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                  @{user.username}
                </span>
              </div>

              <p className="font-body text-xs sm:text-sm text-cyan-300 font-medium">
                {profile.title} • {profile.department}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-zinc-400 font-mono">
                <span>ID: <strong className="text-zinc-200">{profile.studentId}</strong></span>
                <span>•</span>
                <span>Semester {profile.semester} (Sec {profile.section})</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {profile.streak} Day Streak
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => {
              retroSound.playClick();
              setEditing(!editing);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400/60 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{editing ? "Cancel Editing" : "Edit Profile"}</span>
          </button>
        </div>

        {/* Edit Form Modal/Expansion */}
        {editing && (
          <form onSubmit={handleSave} className="mt-8 pt-6 border-t border-slate-800 space-y-5 animate-in fade-in">
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Customize Scholar Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Academic Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Researcher"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Select Scholar Icon</label>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      retroSound.playClick();
                      setAvatar(emoji);
                    }}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      avatar === emoji
                        ? "bg-cyan-950 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                        : "bg-slate-900 border border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}

        {saveMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveMessage}</span>
          </div>
        )}
      </div>

      {/* 2. Four Academic Performance KPIs */}
      <section aria-label="Academic Performance Overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Mastery */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Average Mastery</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {metrics.averageMastery}%
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">Curricular proficiency</p>
        </div>

        {/* Quiz Accuracy */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Quiz Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics.accuracyPercent}%
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">Average active retrieval</p>
        </div>

        {/* Quizzes Completed */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Quizzes Solved</span>
            <BookOpen className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {metrics.quizzesCompleted}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">Verified assessments</p>
        </div>

        {/* Badges Earned */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span>Subject Badges</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            {metrics.masteredBadgesCount}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono">
            {metrics.inProgressBadgesCount} in progress
          </p>
        </div>
      </section>

      {/* 3. Clan Affiliation Banner */}
      {clan && (
        <section aria-label="Clan Standing">
          <div className="rounded-2xl p-6 bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-slate-900/40 border border-violet-500/20 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-[11px] font-mono uppercase text-violet-300 tracking-wider">
                  Academic Clan Affiliation
                </span>
              </div>
              <h2 className="font-display font-bold text-xl text-white">
                {clan.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                <span>Role: <strong className="text-cyan-300">{clan.role}</strong></span>
                <span>•</span>
                <span>Standing: <strong className="text-amber-400">Rank #{clan.rank}</strong> of {clan.totalMembers}</span>
                <span>•</span>
                <span>Code: <code className="text-zinc-300">{clan.joinCode}</code></span>
              </div>
            </div>

            <Link
              href={`/clans/${clan.id}`}
              onClick={() => retroSound.playClick()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-display font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(139,92,246,0.2)]"
            >
              <span>Clan Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* 4. Subject Mastery Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Subject Mastery Matrix
            </h2>
            <p className="text-xs text-zinc-400">
              Empirical mastery index across foundational engineering curriculum.
            </p>
          </div>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Explore Syllabus <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectMasteries.map((sm: any) => (
            <div
              key={sm.id}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-lg">
                    {sm.icon}
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      sm.status === "MASTERED"
                        ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                        : sm.status === "IN_PROGRESS"
                        ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                        : "bg-zinc-900 border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {sm.status === "MASTERED" ? "MASTERED" : sm.status === "IN_PROGRESS" ? "IN PROGRESS" : "LOCKED"}
                  </span>
                </div>

                <div className="mt-3">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">{sm.code}</span>
                  <h3 className="font-display font-bold text-sm text-white mt-0.5">
                    {sm.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Mastery</span>
                  <span className="font-bold text-white">{sm.mastery}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sm.mastery >= 85
                        ? "bg-gradient-to-r from-amber-400 to-yellow-300"
                        : "bg-gradient-to-r from-cyan-400 to-violet-500"
                    }`}
                    style={{ width: `${sm.mastery}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Quiz Attempts */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display font-bold text-lg text-white">
            Recent Assessments &amp; Quizzes
          </h2>
          <p className="text-xs text-zinc-400">
            Audit log of completed quiz challenges and retrieval drills.
          </p>
        </div>

        {recentQuizzes.length > 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden divide-y divide-slate-800/80">
            {recentQuizzes.map((quiz: any) => (
              <div
                key={quiz.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-zinc-400 uppercase">
                      {quiz.subjectTitle}
                    </span>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">
                      {quiz.courseTitle}
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Completed: {new Date(quiz.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <span
                    className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      quiz.accuracy >= 75
                        ? "bg-emerald-950/60 border-emerald-500/30 text-emerald-300"
                        : "bg-amber-950/60 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    {quiz.accuracy}% Accuracy
                  </span>
                  <Link
                    href={`/quiz/${quiz.courseId}`}
                    onClick={() => retroSound.playClick()}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-300 transition-colors"
                    title="Retake Quiz"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Quizzes Completed Yet</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Start with an engineering subject quiz to begin tracking your mastery and accuracy.
            </p>
            <Link
              href="/subjects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-display font-bold text-xs uppercase"
            >
              Browse Subjects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}