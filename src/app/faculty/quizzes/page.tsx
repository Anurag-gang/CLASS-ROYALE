"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import { FileQuestion, Sparkles, Plus, CheckCircle2, ArrowRight } from "lucide-react";

export default function FacultyQuizzesPage() {
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
        title="Quizzes & Quests Management"
        subtitle="Manage assigned academic quizzes, review completion scores, and generate new challenges."
        primaryAction={{
          label: "Generate AI Quiz",
          href: "/faculty/ai-generator",
          icon: Sparkles,
        }}
      />

      <main className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
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
      </main>
    </div>
  );
}
