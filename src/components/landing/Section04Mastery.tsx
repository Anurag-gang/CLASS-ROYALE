"use client";

import React, { useState } from "react";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";

export function Section04Mastery() {
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("TREES");

  const subtopics = [
    { name: "ARRAYS & STRINGS", score: 100, status: "MASTERED", color: "text-emerald-400 stroke-emerald-400" },
    { name: "SORTING & SEARCHING", score: 84, status: "HIGH RETENTION", color: "text-cyan-400 stroke-cyan-400" },
    { name: "TREES & HEAPS", score: 41, status: "ATTENTION NEEDED", color: "text-amber-400 stroke-amber-400" },
    { name: "GRAPHS & TRAVERSAL", score: 32, status: "DEFICIT ISOLATED", color: "text-red-400 stroke-red-400" },
  ];

  return (
    <section id="mastery" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Section Header */}
        <SectionHeader
          number="04"
          category="TOPIC MASTERY SYSTEM"
          title="KNOW WHERE YOU STAND."
          subtitle="Empirical retention modeling tracks exact conceptual boundaries."
        />

        <TechnicalBorder />

        {/* Circular Technical Mastery System */}
        <CornerFrame size={16} borderColor="border-white/20" className="p-8 sm:p-12 md:p-16 bg-[#08090d] border border-white/10 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Giant Circular Technical Radar Gauge */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                {/* Rotating Outer Radar Ring */}
                <svg className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite]" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="95" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
                  <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 6" fill="none" />
                  <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="0" y1="100" x2="200" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                </svg>

                {/* SVG Progress Circle for Core Subject */}
                <svg className="w-52 h-52 sm:w-64 sm:h-64 -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="85" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeDasharray={534}
                    strokeDashoffset={534 - (534 * 72) / 100}
                    strokeLinecap="square"
                    fill="none"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Inner Central Readout */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">
                    OVERALL MASTERY
                  </span>
                  <div className="font-condensed font-black text-6xl sm:text-7xl text-white tracking-tighter">
                    72%
                  </div>
                  <span className="font-mono text-[9px] text-white/40 uppercase tracking-widest mt-1">
                    DATA STRUCTURES
                  </span>
                </div>
              </div>

              <div className="mt-4 font-mono text-[10px] text-white/30 tracking-widest uppercase">
                GAUGE CALIBRATION // MULTI-TOPIC AGGREGATE
              </div>
            </div>

            {/* Right: Subtopic Telemetry Breakdown */}
            <div className="lg:col-span-6 space-y-6">
              <div className="border-b border-white/10 pb-4 flex items-center justify-between font-mono text-xs text-white/40">
                <span>SUBTOPIC AUDIT INDEX</span>
                <Crosshair />
              </div>

              <div className="space-y-4">
                {subtopics.map((st) => (
                  <div
                    key={st.name}
                    className="p-4 bg-white/[0.02] border border-white/10 hover:border-white/30 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white tracking-wider">{st.name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] uppercase font-bold ${st.color}`}>
                          {st.status}
                        </span>
                        <span className="font-mono font-bold text-white text-sm">{st.score}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          st.score >= 80 ? "bg-emerald-400" : st.score >= 60 ? "bg-cyan-400" : "bg-amber-400"
                        }`}
                        style={{ width: `${st.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="font-tech text-xs text-white/40 tracking-wider uppercase">
                Every topic remains in perpetual evaluation. As intervals lapse, unpracticed memory traces decay slightly to trigger timely retrieval drills.
              </p>
            </div>
          </div>
        </CornerFrame>
      </div>
    </section>
  );
}
