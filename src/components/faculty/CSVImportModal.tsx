"use client";

import React, { useState } from "react";
import { Upload, X, CheckCircle2, AlertTriangle, XCircle, FileText, Download } from "lucide-react";

interface CSVImportModalProps {
  classId: string;
  classNameTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  classId,
  classNameTitle,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      handleParsePreview(content, selected.name);
    };
    reader.readAsText(selected);
  };

  const handleParsePreview = async (rawContent: string, fileName?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/faculty/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preview",
          classId,
          csvText: rawContent,
          fileName: fileName || file?.name || "import.csv",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPreviewData(data);
      } else {
        setError(data.error || "Failed parsing CSV preview");
      }
    } catch {
      setError("Network error while validating CSV");
    } finally {
      setLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || previewData.validCount === 0) return;
    setImporting(true);
    setError("");

    try {
      const res = await fetch("/api/faculty/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          classId,
          fileName: file?.name || "students_batch.csv",
          records: previewData.validRows,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Failed committing student records");
      }
    } catch {
      setError("Network error during student provisioning");
    } finally {
      setImporting(false);
    }
  };

  const sampleCsvContent = `student_id,name,email,program,semester,section
500120201,Kunal Verma,kunal.verma@apex.edu.in,BCA,5,A
500120202,Rhea Kapoor,rhea.kapoor@apex.edu.in,BCA,5,A
500120203,Devansh Joshi,devansh.j@apex.edu.in,BCA,5,A`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class_royale_student_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Import Students via CSV</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Class: <strong className="text-pink-400">{classNameTitle}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-md bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {!previewData ? (
            <div className="space-y-4">
              {/* File Drop Area */}
              <label className="border-2 border-dashed border-slate-700 hover:border-pink-500/60 bg-slate-950/50 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group text-center">
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-pink-400 transition-colors mb-2" />
                <span className="text-xs font-semibold text-white">
                  {file ? file.name : "Click or drag CSV file to upload"}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Required columns: student_id, name, email (program, semester, section optional)
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>Need a pre-formatted template?</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Validation Summary Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-md bg-emerald-950/30 border border-emerald-500/30 text-center">
                  <div className="text-lg font-bold text-emerald-400">{previewData.validCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">Valid Records</div>
                </div>
                <div className="p-3 rounded-md bg-amber-950/30 border border-amber-500/30 text-center">
                  <div className="text-lg font-bold text-amber-400">{previewData.duplicateCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">Duplicates / Existing</div>
                </div>
                <div className="p-3 rounded-md bg-red-950/30 border border-red-500/30 text-center">
                  <div className="text-lg font-bold text-red-400">{previewData.invalidCount}</div>
                  <div className="text-[11px] text-slate-400 font-medium">Invalid / Malformed</div>
                </div>
              </div>

              {/* Itemized Preview List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Verification Breakdown ({previewData.totalCount} records detected)
                </h4>
                <div className="rounded-md border border-slate-800 bg-slate-950/60 max-h-60 overflow-y-auto divide-y divide-slate-800/80 text-xs">
                  {previewData.validRows.map((v: any, idx: number) => (
                    <div key={`valid-${idx}`} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-white">{v.name}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">{v.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ID: {v.studentId}
                      </span>
                    </div>
                  ))}

                  {previewData.duplicateRows.map((d: any, idx: number) => (
                    <div key={`dup-${idx}`} className="p-2.5 flex items-center justify-between bg-amber-950/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-300">{d.name}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">{d.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-300 font-mono">{d.error}</span>
                    </div>
                  ))}

                  {previewData.invalidRows.map((inv: any, idx: number) => (
                    <div key={`inv-${idx}`} className="p-2.5 flex items-center justify-between bg-red-950/20">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-300">{inv.name}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-mono">{inv.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-red-400 font-mono">{inv.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          {previewData ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  setFile(null);
                }}
                className="py-2 px-3 text-xs font-medium text-slate-400 hover:text-white rounded transition-colors"
              >
                Upload Different File
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={importing || previewData.validCount === 0}
                  className="py-2 px-4 text-xs font-semibold text-white bg-[#de1659] hover:bg-[#c2134d] disabled:opacity-50 rounded shadow-sm transition-colors flex items-center gap-1.5"
                >
                  {importing ? "Importing & Provisioning..." : `Import ${previewData.validCount} Students`}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
