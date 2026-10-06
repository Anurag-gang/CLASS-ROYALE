"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import { BookOpen, Plus, Sparkles, Layers, ArrowRight } from "lucide-react";

export default function FacultyCoursesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/faculty/classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const standardCourses = [
    {
      id: "course-1",
      title: "Data Structures & Algorithms",
      code: "CS-301",
      difficulty: "Intermediate",
      modulesCount: 5,
      lessonsCount: 18,
      xpReward: 500,
      description: "Binary Search Trees, Hash Tables, Heaps, Dynamic Programming, and Graph Traversals.",
    },
    {
      id: "course-2",
      title: "Database Management Systems",
      code: "CS-302",
      difficulty: "Intermediate",
      modulesCount: 4,
      lessonsCount: 14,
      xpReward: 450,
      description: "Relational Algebra, SQL normalization (1NF-BCNF), Indexing, and Concurrency Control.",
    },
    {
      id: "course-3",
      title: "Computer Networks & Protocols",
      code: "CS-303",
      difficulty: "Advanced",
      modulesCount: 4,
      lessonsCount: 12,
      xpReward: 400,
      description: "OSI Model, TCP/IP, Subnetting, Routing Algorithms, and Transport Layer Security.",
    },
  ];

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title="Course Management"
        subtitle="Manage academic courses, learning modules, lessons, and assignments across class sections."
      />

      <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {standardCourses.map((c) => (
            <div
              key={c.id}
              className="rounded-lg bg-slate-900/90 border border-slate-800 p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-semibold">
                    {c.code}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{c.difficulty}</span>
                </div>
                <h3 className="text-base font-semibold text-white mt-2.5">{c.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Modules / Lessons:</span>
                  <span className="font-semibold text-slate-200">
                    {c.modulesCount} modules • {c.lessonsCount} lessons
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Completion Reward:</span>
                  <span className="font-semibold text-emerald-400">+{c.xpReward} XP</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Link
                  href={`/faculty/ai-generator?topic=${encodeURIComponent(c.title)}`}
                  className="w-full py-2 text-center rounded-md bg-[#de1659] hover:bg-[#c2134d] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Generate Quiz with CR
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
