"use client";

import React from "react";
import Link from "next/link";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";
import { AnimatedCounterText } from "@/components/motion/AnimatedCounterText";
import { retroSound } from "@/lib/sound";

export function Section07Faculty() {
  const telemetryKpis = [
    { label: "AVERAGE MASTERY", num: 76, suffix: "%", delta: "+4.2% THIS WEEK", status: "POSITIVE" },
    { label: "QUIZ COMPLETION", num: 82, suffix: "%", delta: "HIGH PARTICIPATION", status: "STABLE" },
    { label: "ACTIVE STUDENTS", num: 104, suffix: "", delta: "ACROSS ACTIVE MODULES", status: "ACTIVE" },
    { label: "ATTENTION REQUIRED", num: 18, suffix: "", delta: "KUBERNETES DEFICIT", status: "WARNING" },
  ];

  const weakTopics = [
    { topic: "KUBERNETES POD NETWORKING", accuracy: 61, strugglingCount: 18 },
    { topic: "TERRAFORM STATE ISOLATION", accuracy: 54, strugglingCount: 22 },
  ];

  return (
    <section id="faculty" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header with 3-Layer Parallax */}
        <SectionHeader
          title="SEE WHERE YOUR CLASS NEEDS HELP."
          subtitle="Real-time curricular struggle points and automated remediation diagnostics for faculty."
        />

        <TechnicalBorder />

        {/* Minimal Professional Faculty Console Preview */}
        <CornerFrame size={16} borderColor="border-white/20" className="p-8 sm:p-12 bg-[#08090d] border border-white/10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-white/40 uppercase tracking-widest border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-white font-bold">FACULTY COMMAND CENTER</span>
            </div>
            <Crosshair />
          </div>

          {/* 4 KPIs Grid with Animated Counter */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {telemetryKpis.map((kpi) => (
              <div key={kpi.label} className="p-4 bg-white/[0.02] border border-white/10 space-y-1">
                <span className="font-mono text-[10px] text-white/40 uppercase block">
                  {kpi.label}
                </span>
                <div
                  className={`font-condensed font-black text-3xl sm:text-4xl ${
                    kpi.status === "WARNING" ? "text-amber-400" : "text-white"
                  }`}
                >
                  <AnimatedCounterText value={kpi.num} suffix={kpi.suffix} />
                </div>
                <span className="font-mono text-[9px] text-white/40 block">
                  {kpi.delta}
                </span>
              </div>
            ))}
          </div>

          {/* Curricular Weak Areas Alert */}
          <div className="p-5 bg-amber-950/10 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-amber-300">
              <span className="font-bold uppercase tracking-wider">
                DEFICIT SIGNALS REQUIRING ATTENTION
              </span>
              <span className="text-[10px] uppercase font-mono">AUTOMATED SIGNAL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakTopics.map((wt) => (
                <div key={wt.topic} className="p-3 bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-white font-bold">{wt.topic}</span>
                    <span className="text-amber-400 font-bold">{wt.accuracy}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${wt.accuracy}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-white/40 block">
                    {wt.strugglingCount} STUDENTS STRUGGLING // DRILL RECOMMENDED
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Link to Faculty Dashboard */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-4">
            <Link
              href="/faculty"
              onClick={() => retroSound.playClick()}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-mono text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
              data-cursor="FACULTY"
            >
              <span>ACCESS FACULTY SUITE</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </CornerFrame>
      </div>
    </section>
  );
}
