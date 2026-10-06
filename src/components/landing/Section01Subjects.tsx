"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

interface SubjectSector {
  id: string;
  code: string;
  title: string;
  slug: string;
  sector: string;
  mastery: number;
  quizzes: number;
  topics: number;
  topology: string;
  diagram: React.ReactNode;
}

export function Section01Subjects() {
  const [activeIdx, setActiveIdx] = useState(0);

  const subjects: SubjectSector[] = [
    {
      id: "dsa",
      code: "CS-201",
      title: "DATA STRUCTURES",
      slug: "data-structures",
      sector: "SECTOR_01A // COMPUTATION",
      mastery: 72,
      quizzes: 12,
      topics: 24,
      topology: "DIRECTED ACYCLIC GRAPH & BALANCE TREES",
      diagram: (
        <svg viewBox="0 0 200 120" className="w-full h-full stroke-cyan-400 fill-none">
          <circle cx="100" cy="20" r="10" strokeWidth="1.5" className="fill-cyan-950/60" />
          <circle cx="50" cy="60" r="8" strokeWidth="1.5" className="fill-cyan-950/60" />
          <circle cx="150" cy="60" r="8" strokeWidth="1.5" className="fill-cyan-950/60" />
          <circle cx="30" cy="100" r="6" strokeWidth="1.5" className="fill-cyan-950/60" />
          <circle cx="70" cy="100" r="6" strokeWidth="1.5" className="fill-cyan-950/60" />
          <circle cx="130" cy="100" r="6" strokeWidth="1.5" className="fill-cyan-950/60" />
          <circle cx="170" cy="100" r="6" strokeWidth="1.5" className="fill-cyan-950/60" />
          <line x1="93" y1="27" x2="57" y2="53" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="107" y1="27" x2="143" y2="53" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="45" y1="67" x2="33" y2="94" strokeWidth="1.2" />
          <line x1="55" y1="67" x2="67" y2="94" strokeWidth="1.2" />
          <line x1="145" y1="67" x2="133" y2="94" strokeWidth="1.2" />
          <line x1="155" y1="67" x2="167" y2="94" strokeWidth="1.2" />
        </svg>
      ),
    },
    {
      id: "os",
      code: "CS-202",
      title: "OPERATING SYSTEMS",
      slug: "operating-systems",
      sector: "SECTOR_02B // KERNEL ARCHITECTURE",
      mastery: 68,
      quizzes: 10,
      topics: 20,
      topology: "PREEMPTIVE SCHEDULING & VIRTUAL MEMORY",
      diagram: (
        <svg viewBox="0 0 200 120" className="w-full h-full stroke-violet-400 fill-none">
          <rect x="20" y="20" width="160" height="20" rx="3" strokeWidth="1.5" className="fill-violet-950/40" />
          <rect x="35" y="50" width="60" height="22" rx="3" strokeWidth="1.5" className="fill-violet-950/40" />
          <rect x="105" y="50" width="60" height="22" rx="3" strokeWidth="1.5" className="fill-violet-950/40" />
          <rect x="50" y="85" width="100" height="18" rx="3" strokeWidth="1.5" className="fill-violet-950/40" />
          <line x1="65" y1="40" x2="65" y2="50" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="135" y1="40" x2="135" y2="50" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="100" y1="72" x2="100" y2="85" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      id: "dbms",
      code: "CS-203",
      title: "DATABASES",
      slug: "dbms",
      sector: "SECTOR_03C // RELATIONAL STORAGE",
      mastery: 84,
      quizzes: 14,
      topics: 26,
      topology: "B+ TREE INDEXING & ACID ISOLATION",
      diagram: (
        <svg viewBox="0 0 200 120" className="w-full h-full stroke-cyan-400 fill-none">
          <ellipse cx="60" cy="30" rx="40" ry="12" strokeWidth="1.5" className="fill-cyan-950/40" />
          <path d="M 20,30 v 30 a 40,12 0 0,0 80,0 v -30" strokeWidth="1.5" />
          <ellipse cx="140" cy="60" rx="40" ry="12" strokeWidth="1.5" className="fill-cyan-950/40" />
          <path d="M 100,60 v 30 a 40,12 0 0,0 80,0 v -30" strokeWidth="1.5" />
          <line x1="60" y1="60" x2="140" y2="60" strokeWidth="1.2" strokeDasharray="3 3" />
        </svg>
      ),
    },
    {
      id: "networks",
      code: "CS-204",
      title: "NETWORKS",
      slug: "networks",
      sector: "SECTOR_04D // PROTOCOL SUITE",
      mastery: 62,
      quizzes: 11,
      topics: 18,
      topology: "PACKET ROUTING & CONGESTION AVOIDANCE",
      diagram: (
        <svg viewBox="0 0 200 120" className="w-full h-full stroke-emerald-400 fill-none">
          <circle cx="40" cy="60" r="14" strokeWidth="1.5" className="fill-emerald-950/40" />
          <circle cx="100" cy="30" r="14" strokeWidth="1.5" className="fill-emerald-950/40" />
          <circle cx="100" cy="90" r="14" strokeWidth="1.5" className="fill-emerald-950/40" />
          <circle cx="160" cy="60" r="14" strokeWidth="1.5" className="fill-emerald-950/40" />
          <line x1="53" y1="52" x2="88" y2="38" strokeWidth="1.5" />
          <line x1="53" y1="68" x2="88" y2="82" strokeWidth="1.5" />
          <line x1="100" y1="44" x2="100" y2="76" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="112" y1="38" x2="147" y2="52" strokeWidth="1.5" />
          <line x1="112" y1="82" x2="147" y2="68" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: "devops",
      code: "CS-205",
      title: "DEVOPS",
      slug: "devops",
      sector: "SECTOR_05E // CLOUD INFRASTRUCTURE",
      mastery: 79,
      quizzes: 13,
      topics: 22,
      topology: "CONTAINER RUNTIMES & DECLARATIVE IAC",
      diagram: (
        <svg viewBox="0 0 200 120" className="w-full h-full stroke-amber-400 fill-none">
          <circle cx="60" cy="60" r="30" strokeWidth="1.5" className="fill-amber-950/20" />
          <circle cx="140" cy="60" r="30" strokeWidth="1.5" className="fill-amber-950/20" />
          <path d="M 60,30 C 100,30 100,90 140,90 C 180,90 180,30 140,30 C 100,30 100,90 60,90 C 20,90 20,30 60,30 Z" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: "security",
      code: "CS-206",
      title: "CYBER SECURITY",
      slug: "cyber-security",
      sector: "SECTOR_06F // ADVERSARIAL DEFENSE",
      mastery: 55,
      quizzes: 9,
      topics: 16,
      topology: "ASYMMETRIC CIPHERS & ZERO-TRUST AUTH",
      diagram: (
        <svg viewBox="0 0 200 120" className="w-full h-full stroke-red-400 fill-none">
          <path d="M 100,15 L 150,35 V 70 C 150,95 100,110 100,110 C 100,110 50,95 50,70 V 35 Z" strokeWidth="1.5" className="fill-red-950/20" />
          <circle cx="100" cy="55" r="8" strokeWidth="1.5" />
          <line x1="100" y1="63" x2="100" y2="78" strokeWidth="2" />
        </svg>
      ),
    },
  ];

  const current = subjects[activeIdx];

  return (
    <section id="subjects" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <SectionHeader
          number="01"
          category="CURRICULAR TERRITORIES"
          title="ENGINEERING, ORGANIZED."
          subtitle="Explore foundational domains mapped into structured active retrieval sectors."
        />

        <TechnicalBorder />

        {/* Interactive Subject System: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Big Typographic Subject Selector */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-2">
            {subjects.map((sub, idx) => {
              const isActive = activeIdx === idx;
              return (
                <div
                  key={sub.id}
                  onMouseEnter={() => {
                    retroSound.playClick();
                    setActiveIdx(idx);
                  }}
                  className={`group relative p-4 sm:p-5 transition-all cursor-pointer border-b ${
                    isActive ? "border-cyan-400/80 bg-white/[0.03]" : "border-white/10 hover:border-white/30"
                  }`}
                  data-cursor="INSPECT"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex items-baseline gap-4 sm:gap-6">
                      <span className={`font-mono text-xs font-bold ${isActive ? "text-cyan-400" : "text-white/30"}`}>
                        0{idx + 1}
                      </span>
                      <h3
                        className={`font-condensed font-extrabold text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight transition-colors ${
                          isActive ? "text-white translate-x-1" : "text-white/40 group-hover:text-white/80"
                        }`}
                      >
                        {sub.title}
                      </h3>
                    </div>

                    <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest hidden sm:inline">
                      {sub.code}
                    </span>
                  </div>

                  {/* Active highlight line */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-violet-500" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Engineering Sector Telemetry HUD */}
          <div className="lg:col-span-5 flex flex-col">
            <CornerFrame
              size={12}
              borderColor="border-cyan-500/40"
              className="h-full p-6 sm:p-8 bg-[#080a10] border border-white/10 flex flex-col justify-between space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">
                    {current.sector}
                  </span>
                  <div className="font-condensed font-black text-2xl sm:text-3xl text-white uppercase">
                    {current.title}
                  </div>
                </div>
                <Crosshair />
              </div>

              {/* Vector Topological Diagram */}
              <div className="relative h-44 sm:h-52 w-full bg-[#05060a] border border-white/5 p-4 flex items-center justify-center">
                {current.diagram}
                <span className="absolute bottom-2 right-2 font-mono text-[9px] text-white/30 uppercase">
                  TOPOLOGY // VECTOR PREVIEW
                </span>
              </div>

              {/* Live Syllabus Telemetry Metrics */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white/50">COHORT MASTERY</span>
                  <span className="text-cyan-300 font-bold">{current.mastery}%</span>
                </div>

                <div className="w-full bg-white/10 h-1 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500"
                    style={{ width: `${current.mastery}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs font-mono">
                  <div>
                    <span className="text-white/40 block text-[10px]">ASSESSMENTS</span>
                    <span className="text-white font-bold">{current.quizzes} QUIZZES</span>
                  </div>
                  <div>
                    <span className="text-white/40 block text-[10px]">SUBTOPICS</span>
                    <span className="text-white font-bold">{current.topics} TOPICS</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href={`/subjects/${current.slug}`}
                    onClick={() => retroSound.playLevelUp()}
                    className="w-full py-3 px-4 bg-white/5 hover:bg-cyan-400/10 border border-white/20 hover:border-cyan-400 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-between group"
                    data-cursor="EXPLORE"
                  >
                    <span>ENTER {current.code} SECTOR</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </Link>
                </div>
              </div>
            </CornerFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
