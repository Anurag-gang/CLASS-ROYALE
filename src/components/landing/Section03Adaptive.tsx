"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function Section03Adaptive() {
  const [activeStep, setActiveStep] = useState(2); // default highlighting weak area

  const steps = [
    {
      id: 0,
      number: "01",
      title: "RETRIEVAL SIGNALS",
      desc: "Every quiz answer registers accuracy, response time, and concept stability.",
      status: "INPUT STREAM",
      color: "border-white/20 text-white/70",
    },
    {
      id: 1,
      number: "02",
      title: "TOPIC MAPPING",
      desc: "Performance maps into multi-dimensional syllabus nodes across all subjects.",
      status: "CONTINUOUS EVALUATION",
      color: "border-cyan-500/40 text-cyan-300",
    },
    {
      id: 2,
      number: "03",
      title: "DEFICIT ISOLATION",
      desc: "Pinpoints subtopic decay before it cascades into comprehensive exam failure.",
      status: "DEFICIT DETECTED // 54% ACCURACY",
      color: "border-amber-500/60 text-amber-300",
    },
    {
      id: 3,
      number: "04",
      title: "TARGETED QUIZ PATH",
      desc: "Assembles custom 10-question sequence focused strictly on your identified gap.",
      status: "RECOMMENDED QUIZ READY",
      color: "border-cyan-400 text-cyan-400",
    },
  ];

  return (
    <section id="adaptive" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <SectionHeader
          number="03"
          category="ADAPTIVE ENGINE"
          title="YOUR NEXT QUESTION ADAPTS TO YOU."
          subtitle="Empirical topic deficit analysis routes you to maximum retention."
        />

        <TechnicalBorder />

        {/* Dynamic Topology Flow Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 4-Step Narrative Architecture */}
          <div className="lg:col-span-6 space-y-4">
            {steps.map((s, idx) => {
              const isSelected = activeStep === idx;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    retroSound.playClick();
                    setActiveStep(idx);
                  }}
                  className={`p-5 border transition-all cursor-pointer ${
                    isSelected
                      ? "border-cyan-400 bg-white/[0.04] shadow-[0_0_25px_rgba(6,182,212,0.1)]"
                      : "border-white/10 hover:border-white/30 bg-transparent opacity-60 hover:opacity-100"
                  }`}
                  data-cursor="INSPECT"
                >
                  <div className="flex items-center justify-between font-mono text-xs mb-2">
                    <span className="text-cyan-400 font-bold">STAGE // {s.number}</span>
                    <span className={`text-[10px] tracking-wider uppercase ${s.color}`}>
                      [{s.status}]
                    </span>
                  </div>

                  <h3 className="font-condensed font-extrabold text-2xl text-white uppercase tracking-tight">
                    {s.title}
                  </h3>

                  <p className="font-tech text-sm text-white/50 tracking-wider uppercase mt-1">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Technical Neural Topology Preview */}
          <div className="lg:col-span-6">
            <CornerFrame size={16} borderColor="border-cyan-500/40" className="p-8 bg-[#080a11] border border-white/10 space-y-6">
              <div className="flex items-center justify-between font-mono text-xs text-white/40 uppercase tracking-widest border-b border-white/10 pb-4">
                <span>ACTIVE TOPIC TOPOLOGY</span>
                <span className="text-cyan-400">STATE: OPTIMIZING</span>
              </div>

              {/* Vector Neural Node Map */}
              <div className="relative h-64 sm:h-72 w-full bg-[#05060a] border border-white/5 flex items-center justify-center p-4 overflow-hidden">
                <svg viewBox="0 0 300 200" className="w-full h-full fill-none">
                  {/* Connecting Data Vectors */}
                  <line x1="50" y1="100" x2="120" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line x1="50" y1="100" x2="120" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line x1="120" y1="50" x2="200" y2="70" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="120" y1="150" x2="200" y2="130" stroke="#ef4444" strokeWidth="2" />
                  <line x1="200" y1="130" x2="260" y2="100" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4 4" />

                  {/* Left Source Node: Student */}
                  <circle cx="50" cy="100" r="14" fill="#0c1322" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="50" y="104" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace">STUDENT</text>

                  {/* Intermediate Nodes: Topics */}
                  <circle cx="120" cy="50" r="12" fill="#091b16" stroke="#10b981" strokeWidth="1.5" />
                  <text x="120" y="54" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">ARRAYS</text>

                  <circle cx="120" cy="150" r="12" fill="#1f0e0c" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="120" y="154" textAnchor="middle" fill="#fde047" fontSize="7" fontFamily="monospace">TREES</text>

                  {/* Highlighted Deficit Node */}
                  <circle cx="200" cy="130" r="16" fill="#2d0b12" stroke="#ef4444" strokeWidth="2" className="animate-pulse" />
                  <text x="200" y="133" textAnchor="middle" fill="#fca5a5" fontSize="6.5" fontFamily="monospace" fontWeight="bold">ROTATIONS</text>
                  <text x="200" y="142" textAnchor="middle" fill="#ef4444" fontSize="6" fontFamily="monospace">54% DEFICIT</text>

                  {/* High Retention Node */}
                  <circle cx="200" cy="70" r="12" fill="#091b16" stroke="#10b981" strokeWidth="1.5" />
                  <text x="200" y="74" textAnchor="middle" fill="#4ade80" fontSize="7" fontFamily="monospace">92% PASS</text>

                  {/* Target Node: Recommended Quiz */}
                  <polygon points="260,86 274,100 260,114 246,100" fill="#04202e" stroke="#22d3ee" strokeWidth="2" />
                  <text x="260" y="103" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">DRILL</text>
                </svg>

                <div className="absolute bottom-3 left-4 font-mono text-[9px] text-white/40 uppercase">
                  ACTIVE ROUTING // FOCUS: AVL ROTATIONS
                </div>
              </div>

              {/* Rationale Callout Box */}
              <div className="p-4 bg-white/[0.02] border border-white/10 space-y-2">
                <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
                  RECOMMENDATION RATIONALE
                </span>
                <p className="font-tech text-xs sm:text-sm text-white/70 tracking-wider uppercase leading-relaxed">
                  &ldquo;Recent attempts show high mastery in Arrays (92%), but significant struggle in AVL tree balance rotations (54%). Next 8-minute quiz focused precisely on balance factors.&rdquo;
                </p>
              </div>

              <Link
                href="/recommendations"
                onClick={() => retroSound.playLevelUp()}
                className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-condensed font-black text-sm uppercase tracking-wider transition-colors flex items-center justify-between"
                data-cursor="DIAGNOSTIC"
              >
                <span>OPEN PERSONALIZED DIAGNOSTIC</span>
                <span>&rarr;</span>
              </Link>
            </CornerFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
