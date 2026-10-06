"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import { Plus, Users, BookOpen, GraduationCap, Clock, FileText, ArrowRight, X } from "lucide-react";

interface ClassRow {
  id: string;
  name: string;
  code: string;
  department: string;
  program: string;
  semester: number;
  section: string;
  term: string;
  studentCount: number;
  coursesCount: number;
  quizzesCount: number;
}

interface ImportLog {
  id: string;
  fileName: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  status: string;
  createdAt: string;
  class?: { name: string };
}

export default function FacultyClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [importHistory, setImportHistory] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programId, setProgramId] = useState("");
  const [semester, setSemester] = useState(5);
  const [section, setSection] = useState("A");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadClasses = async () => {
    try {
      setLoading(true);
      const [resClasses, resImports] = await Promise.all([
        fetch("/api/faculty/classes"),
        fetch("/api/faculty/imports"),
      ]);

      if (resClasses.ok) {
        const data = await resClasses.json();
        setClasses(data.classes || []);
        setDepartments(data.departments || []);
        if (data.departments?.[0]) {
          setDepartmentId(data.departments[0].id);
          if (data.departments[0].programs?.[0]) {
            setProgramId(data.departments[0].programs[0].id);
          }
        }
      }

      if (resImports.ok) {
        const iData = await resImports.json();
        setImportHistory(iData.history || []);
      }
    } catch (err) {
      console.error("Failed loading classes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/faculty/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          departmentId,
          programId,
          semester,
          section,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreateModalOpen(false);
        setName("");
        setCode("");
        loadClasses();
      } else {
        setCreateError(data.error || "Failed creating class");
      }
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title="Class Management"
        subtitle="View your teaching sections, configure course curricula, and monitor student imports."
        primaryAction={{
          label: "Create Class",
          onClick: () => setCreateModalOpen(true),
          icon: Plus,
        }}
      />

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Classes Grid */}
        <section aria-label="Teaching Sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Active Sections ({classes.length})
              </h2>
              <p className="text-xs text-slate-400">Classes assigned to your academic profile</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="rounded-lg bg-slate-900/90 border border-slate-800/90 p-5 space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-semibold">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Sem {c.semester} • Sec {c.section}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-2.5">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.program} // {c.department}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center">
                  <div>
                    <div className="text-sm font-bold text-white">{c.studentCount}</div>
                    <div className="text-[10px] text-slate-400">Students</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{c.coursesCount}</div>
                    <div className="text-[10px] text-slate-400">Courses</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{c.quizzesCount}</div>
                    <div className="text-[10px] text-slate-400">Quizzes</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-mono">{c.term}</span>
                  <Link
                    href={`/faculty/classes/${c.id}`}
                    className="py-1.5 px-3 rounded-md bg-[#de1659] hover:bg-[#c2134d] text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    Open Roster <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Import History Table */}
        <section aria-label="Student Import Logs" className="space-y-4 pt-4 border-t border-slate-800">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Roster Import History
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail of previous CSV student imports and batch enrollments.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Batch Date</th>
                    <th className="p-3.5">Target Class</th>
                    <th className="p-3.5">CSV File</th>
                    <th className="p-3.5">Total Records</th>
                    <th className="p-3.5">Successful</th>
                    <th className="p-3.5">Failed</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {importHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/40">
                      <td className="p-3.5 font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-medium text-white">{log.class?.name || "General"}</td>
                      <td className="p-3.5 font-mono text-slate-300">{log.fileName}</td>
                      <td className="p-3.5 font-semibold text-white">{log.totalRecords}</td>
                      <td className="p-3.5 text-emerald-400 font-semibold">{log.successfulRecords}</td>
                      <td className="p-3.5 text-red-400 font-semibold">{log.failedRecords}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            log.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {importHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500 font-mono text-xs">
                        No previous import logs on file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Create Class Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white">Create Academic Class</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded bg-red-950/60 border border-red-500/30 text-red-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Class Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BCA — Semester 5C"
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Class Code (Unique)</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. BCA-SEM5-C"
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(Number(e.target.value))}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Section</label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value.toUpperCase())}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white uppercase focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    const dept = departments.find((d) => d.id === e.target.value);
                    if (dept?.programs?.[0]) setProgramId(dept.programs[0].id);
                  }}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Program</label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                >
                  {departments
                    .find((d) => d.id === departmentId)
                    ?.programs.map((prog: any) => (
                      <option key={prog.id} value={prog.id}>
                        {prog.name} ({prog.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="py-2 px-4 rounded bg-[#de1659] hover:bg-[#c2134d] text-white font-semibold transition-colors"
                >
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
