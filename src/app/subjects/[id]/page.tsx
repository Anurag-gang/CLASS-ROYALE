"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  HelpCircle,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

export default function SubjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/subjects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setSubject(data.subject))
      .catch((err) => {
        console.error("Subject fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <span className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
        <span className="font-hud text-xs text-zinc-400">Loading syllabus hierarchy...</span>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="font-display font-bold text-xl text-white">THIS SUBJECT DOESN&apos;T EXIST.</h2>
        <Link href="/subjects" className="text-xs font-mono text-cyan-400 underline">
          Return to Subjects Map
        </Link>
      </div>
    );
  }

  const isMastered = subject.mastery >= 85;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back Link */}
      <div>
        <Link
          href="/subjects"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Subjects</span>
        </Link>
      </div>

      {/* Subject Header */}
      <div className="rounded-2xl p-6 sm:p-8 bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
              {subject.icon}
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                {subject.code} • {subject.difficulty}
              </span>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
                {subject.title}
              </h1>
            </div>
          </div>

          <span
            className={`font-pixel text-[10px] px-3 py-1.5 rounded border font-semibold tracking-wider ${
              isMastered
                ? "text-emerald-400 bg-emerald-950/80 border-emerald-500/40"
                : subject.mastery > 0
                ? "text-cyan-400 bg-cyan-950/80 border-cyan-500/40"
                : "text-zinc-500 bg-zinc-950 border-zinc-800"
            }`}
          >
            {subject.badgeStatus}
          </span>
        </div>

        <p className="font-body text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
          {subject.description}
        </p>

        {/* Primary Subject Mastery Progress */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-zinc-400 uppercase tracking-wider">Subject Mastery Level</span>
            <span className="text-cyan-300 font-bold text-sm">{subject.mastery}%</span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isMastered
                  ? "bg-emerald-400 shadow-[0_0_10px_#10b981]"
                  : "bg-gradient-to-r from-violet-500 to-cyan-400"
              }`}
              style={{ width: `${subject.mastery}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next Recommended Step Callout */}
      {subject.recommendedNext && (
        <section className="space-y-3">
          <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Next Recommended Action
          </div>
          <div className="rounded-2xl p-6 bg-[#061226]/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-bold text-sm text-white">
                  Practice Topic: {subject.recommendedNext.topic}
                </h3>
              </div>
              <p className="font-body text-xs text-zinc-300">
                {subject.recommendedNext.rationale}
              </p>
            </div>

            <Link
              href={`/quiz/${subject.recommendedNext.quizId}`}
              onClick={() => retroSound.playLevelUp()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-display text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <span>Start Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Topic Mastery Breakdown */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase tracking-wider">
          <span>Topic Mastery Breakdown</span>
          <span>{subject.topics.length} Evaluated Topics</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#070c20]/60 p-6 space-y-4">
          {subject.topics.map((t: any) => {
            const isStrong = t.accuracy >= 75;
            const isWeak = t.accuracy < 60;
            return (
              <div key={t.topic} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-zinc-200 font-medium">{t.topic}</span>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        isStrong
                          ? "text-emerald-400 bg-emerald-950/60 border border-emerald-500/30"
                          : isWeak
                          ? "text-rose-400 bg-rose-950/60 border border-rose-500/30"
                          : "text-amber-400 bg-amber-950/60 border border-amber-500/30"
                      }`}
                    >
                      {isStrong ? "Strong" : isWeak ? "Needs Practice" : "In Progress"}
                    </span>
                    <span className="font-bold text-white w-10 text-right">{t.accuracy}%</span>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isStrong ? "bg-emerald-400" : isWeak ? "bg-rose-400" : "bg-cyan-400"
                    }`}
                    style={{ width: `${t.accuracy}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Structured Quizzes for This Subject */}
      <section className="space-y-4">
        <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Subject Quizzes
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subject.quizzes.map((quiz: any) => (
            <div
              key={quiz.id}
              className="rounded-2xl p-5 bg-[#070c20]/80 border border-violet-500/20 hover:border-violet-400/50 backdrop-blur-xl flex flex-col justify-between space-y-4 transition-colors"
            >
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  {quiz.difficulty} Level
                </span>
                <h4 className="font-display font-bold text-sm text-white mt-1">
                  {quiz.title}
                </h4>
                <span className="text-xs font-mono text-zinc-400 block mt-1">
                  {quiz.questionsCount} Multiple-Choice Questions
                </span>
              </div>

              <Link
                href={`/quiz/${quiz.id}`}
                onClick={() => retroSound.playClick()}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-display text-xs font-semibold transition-colors flex items-center justify-between"
              >
                <span>Take Quiz</span>
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
