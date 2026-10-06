"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function Section06Clans() {
  const [activeMetric, setActiveMetric] = useState<"MASTERY" | "ACCURACY" | "IMPROVEMENT">("MASTERY");

  const clanMembers = [
    { rank: "01", name: "AARAV SHARMA", mastery: "94%", accuracy: "96%", growth: "+14%", role: "STUDENT" },
    { rank: "02", name: "RIYA SEN", mastery: "91%", accuracy: "92%", growth: "+18%", role: "STUDENT" },
    { rank: "03", name: "ANURAG VERMA", mastery: "88%", accuracy: "89%", growth: "+12%", role: "CLAN LEADER" },
    { rank: "04", name: "MEERA KAPOOR", mastery: "85%", accuracy: "87%", growth: "+09%", role: "STUDENT" },
  ];

  return (
    <section id="clans" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <SectionHeader
          number="06"
          category="PEER COHORTS"
          title="LEARN TOGETHER."
          subtitle="University classes and competitive study clans driven by collective subject mastery."
        />

        <TechnicalBorder />

        {/* Clan Interface Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Clan Profile Card */}
          <div className="lg:col-span-5 flex flex-col">
            <CornerFrame size={14} borderColor="border-white/20" className="p-8 bg-[#08090d] border border-white/10 flex flex-col justify-between h-full space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between font-mono text-xs text-white/40 uppercase">
                  <span>COHORT // CLASSROOM</span>
                  <Crosshair />
                </div>

                <div className="space-y-1">
                  <span className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest">
                    UPES DEHRADUN
                  </span>
                  <h3 className="font-condensed font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
                    DEVOPS BATCH 3
                  </h3>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-white/40">
                  <span>CODE: <code className="text-white">CR-DEVOPS-26</code></span>
                  <span>•</span>
                  <span>128 ENROLLED</span>
                </div>
              </div>

              {/* Clan Average Mastery Gauge */}
              <div className="p-5 bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-white/40">COHORT SYLLABUS RETENTION</span>
                  <span className="text-emerald-400 font-bold">76% AVERAGE</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 w-[76%]" />
                </div>
                <span className="font-tech text-xs text-white/40 uppercase block">
                  ACTIVE SPRINTS: CI/CD PIPELINES &amp; KUBERNETES CNI
                </span>
              </div>

              <div className="pt-2">
                <Link
                  href="/clans"
                  onClick={() => retroSound.playClick()}
                  className="w-full py-3.5 px-4 bg-white/5 hover:bg-cyan-400/10 border border-white/20 hover:border-cyan-400 text-white font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-between group"
                  data-cursor="CLANS"
                >
                  <span>BROWSE ALL STUDY CLANS</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                </Link>
              </div>
            </CornerFrame>
          </div>

          {/* Right: Academic Merit Leaderboard */}
          <div className="lg:col-span-7">
            <CornerFrame size={14} borderColor="border-white/20" className="p-8 bg-[#08090d] border border-white/10 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-condensed font-extrabold text-xl text-white uppercase tracking-wider">
                    ACADEMIC RANKINGS
                  </span>
                  <span className="font-mono text-xs text-white/30 hidden sm:inline">// TOP SCHOLARS</span>
                </div>

                {/* Metric Filter Tabs */}
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  {(["MASTERY", "ACCURACY", "IMPROVEMENT"] as const).map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => {
                        retroSound.playClick();
                        setActiveMetric(metric);
                      }}
                      className={`px-2.5 py-1 transition-colors ${
                        activeMetric === metric
                          ? "bg-cyan-400 text-slate-950 font-bold"
                          : "text-white/50 hover:text-white bg-white/5"
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roster Stream */}
              <div className="divide-y divide-white/5 font-mono">
                {clanMembers.map((m) => (
                  <div
                    key={m.rank}
                    className="py-4 flex items-center justify-between gap-4 group hover:bg-white/[0.02] px-2 transition-colors"
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      <span className="text-sm font-bold text-cyan-400 w-6">
                        {m.rank}
                      </span>
                      <div>
                        <div className="font-condensed font-black text-xl sm:text-2xl text-white uppercase tracking-tight group-hover:text-cyan-200 transition-colors">
                          {m.name}
                        </div>
                        <span className="text-[10px] text-white/40 block">
                          ROLE: {m.role}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-condensed font-black text-2xl sm:text-3xl text-white block">
                        {activeMetric === "MASTERY" ? m.mastery : activeMetric === "ACCURACY" ? m.accuracy : m.growth}
                      </span>
                      <span className="text-[9px] text-white/30 uppercase tracking-widest">
                        {activeMetric}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
                <span>FAIR ACADEMIC METRICS ONLY</span>
                <span>NO XP GRINDING</span>
              </div>
            </CornerFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
