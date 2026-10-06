"use client";

import React from "react";
import { FacultyHeader } from "@/components/faculty/FacultyHeader";
import { ShieldCheck, School, Bell, Key, Database } from "lucide-react";

export default function FacultySettingsPage() {
  return (
    <div className="flex-1 min-h-screen bg-slate-950">
      <FacultyHeader
        title="Faculty Academic Settings"
        subtitle="Configure academic preferences, university SSO status, and notification rules."
      />

      <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              University SSO & Identity Configuration
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Active identity federation and Student Information System (SIS) sync status.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">University Identity Provider (IdP)</div>
                <div className="text-slate-400 mt-0.5">SAML 2.0 / OpenID Connect (OIDC)</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                FEDERATED ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Student Information System (SIS) Sync</div>
                <div className="text-slate-400 mt-0.5">Automated overnight batch sync via CSV / API Gateway</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-semibold">
                READY
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Diagnostic & At-Risk Alert Thresholds
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Set the sensitivity for automatic student struggle detection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                At-Risk Mastery Threshold (%)
              </label>
              <input
                type="number"
                defaultValue={65}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Inactivity Warning Window (Days)
              </label>
              <input
                type="number"
                defaultValue={4}
                className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
