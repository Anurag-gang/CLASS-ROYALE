"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { retroSound } from "@/lib/sound";

interface SubjectPreview {
  code: string;
  name: string;
  icon: string;
  topics: number;
  quizzes: number;
  sampleMastery: number;
  color: string;
}

const subjectsList: SubjectPreview[] = [
  { code: "CS-201", name: "Data Structures & Algorithms", icon: "⚡", topics: 18, quizzes: 24, sampleMastery: 72, color: "border-violet-500/30" },
  { code: "CS-202", name: "Operating Systems", icon: "💻", topics: 14, quizzes: 19, sampleMastery: 68, color: "border-cyan-500/30" },
  { code: "CS-203", name: "Database Management Systems", icon: "🗄️", topics: 16, quizzes: 21, sampleMastery: 81, color: "border-emerald-500/30" },
  { code: "CS-204", name: "Computer Networks", icon: "🌐", topics: 15, quizzes: 18, sampleMastery: 54, color: "border-blue-500/30" },
  { code: "CS-301", name: "DevOps & Cloud Engineering", icon: "⚙️", topics: 12, quizzes: 16, sampleMastery: 65, color: "border-amber-500/30" },
  { code: "MATH-201", name: "Discrete Mathematics", icon: "📐", topics: 14, quizzes: 17, sampleMastery: 58, color: "border-fuchsia-500/30" },
];

export const SubjectsSection: React.FC = () => {
  return (
    <section id="subjects" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div className="space-y-2 max-w-2xl">
          <span className="font-hud text-xs text-violet-400 tracking-widest uppercase font-semibold">
            CURRICULUM ARCHITECTURE
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
            YOUR ENGINEERING SYLLABUS. <br />
            <span className="text-gradient-violet">TURNED INTO A LEARNING MAP.</span>
          </h2>
          <p className="font-body text-xs sm:text-sm text-zinc-400">
            Database-driven subjects broken down into clear modules, topics, and focused diagnostic quizzes.
          </p>
        </div>

        <Link
          href="/subjects"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-1.5 font-display text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>View All Subjects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjectsList.map((sub) => (
          <div
            key={sub.code}
            className={`rounded-2xl p-5 bg-[#070c20]/80 border ${sub.color} hover:border-cyan-400/50 hover:shadow-lg transition-all backdrop-blur-xl flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-2xl">{sub.icon}</span>
                <span className="font-hud text-[11px] text-zinc-400 font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {sub.code}
                </span>
              </div>

              <h3 className="font-display font-bold text-sm text-white mb-2">{sub.name}</h3>

              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono mb-4">
                <span>{sub.topics} Topics</span>
                <span>•</span>
                <span>{sub.quizzes} Quizzes</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Subject Mastery</span>
                <span className="text-cyan-300 font-bold">{sub.sampleMastery}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full"
                  style={{ width: `${sub.sampleMastery}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
