"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SectionHeader, CornerFrame, Crosshair, TechnicalBorder } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function Section05Badges() {
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null);

  const badges = [
    {
      id: "dsa",
      code: "CS-201",
      title: "DATA STRUCTURES",
      status: "MASTERED",
      verified: "88% RETENTION",
      icon: "⬡",
      date: "04 OCT 2026",
      statusColor: "text-cyan-400 border-cyan-400/40 bg-cyan-950/20",
    },
    {
      id: "dbms",
      code: "CS-203",
      title: "DATABASE SYSTEMS",
      status: "MASTERED",
      verified: "86% RETENTION",
      icon: "◈",
      date: "28 SEP 2026",
      statusColor: "text-cyan-400 border-cyan-400/40 bg-cyan-950/20",
    },
    {
      id: "networks",
      code: "CS-204",
      title: "COMPUTER NETWORKS",
      status: "IN PROGRESS",
      verified: "62% RETENTION",
      icon: "◎",
      date: "ACTIVE TRIAL",
      statusColor: "text-amber-400 border-amber-400/40 bg-amber-950/20",
    },
    {
      id: "devops",
      code: "CS-205",
      title: "DEVOPS & CLOUD",
      status: "IN PROGRESS",
      verified: "74% RETENTION",
      icon: "◬",
      date: "ACTIVE TRIAL",
      statusColor: "text-amber-400 border-amber-400/40 bg-amber-950/20",
    },
  ];

  return (
    <section id="badges" className="relative w-full py-24 sm:py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <SectionHeader
          number="05"
          category="ACADEMIC VERIFICATION"
          title="MASTER IT. KEEP IT."
          subtitle="Verifiable subject mastery badges earned through proven retrieval precision."
        />

        <TechnicalBorder />

        {/* 4 Large Collectible Technical Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((b, idx) => {
            const isHovered = hoveredBadge === idx;
            return (
              <div
                key={b.id}
                onMouseEnter={() => {
                  retroSound.playClick();
                  setHoveredBadge(idx);
                }}
                onMouseLeave={() => setHoveredBadge(null)}
                className="group relative cursor-pointer"
                data-cursor="BADGE"
              >
                <CornerFrame
                  size={10}
                  borderColor={isHovered ? "border-cyan-400" : "border-white/10"}
                  className="p-6 bg-[#08090d] border border-white/10 group-hover:border-cyan-400/50 transition-all flex flex-col justify-between h-96 relative overflow-hidden"
                >
                  {/* Subtle Scan Line on Hover */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse pointer-events-none" />
                  )}

                  {/* Top Badge Metadata */}
                  <div className="flex items-center justify-between font-mono text-[10px] text-white/40 uppercase">
                    <span>{b.code}</span>
                    <Crosshair />
                  </div>

                  {/* Center Emblem Visual */}
                  <div className="flex flex-col items-center justify-center space-y-4 my-auto">
                    <div
                      className={`w-24 h-24 border flex items-center justify-center text-4xl transition-all duration-300 ${
                        isHovered
                          ? "border-cyan-400 bg-cyan-950/40 text-cyan-200 scale-105 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                          : "border-white/20 bg-white/[0.02] text-white/60"
                      }`}
                    >
                      <span>{b.icon}</span>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="font-condensed font-black text-xl text-white uppercase tracking-tight">
                        {b.title}
                      </h3>
                      <span className="font-mono text-[10px] text-white/40 block">
                        VERIFIED: {b.verified}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Status Banner */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 border font-semibold tracking-wider uppercase ${b.statusColor}`}
                    >
                      {b.status}
                    </span>
                    <span className="font-mono text-[9px] text-white/30 uppercase">
                      {b.date}
                    </span>
                  </div>
                </CornerFrame>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <Link
            href="/badges"
            onClick={() => retroSound.playLevelUp()}
            className="px-8 py-3.5 bg-white/5 hover:bg-cyan-400/10 border border-white/20 hover:border-cyan-400 text-white font-mono text-xs uppercase tracking-widest transition-all"
            data-cursor="ALL BADGES"
          >
            VIEW COMPLETE BADGE INDEX &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
