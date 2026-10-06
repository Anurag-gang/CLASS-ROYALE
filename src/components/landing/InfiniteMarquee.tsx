"use client";

import React from "react";

const DISCIPLINES = [
  "Algorithms & Complexity",
  "Distributed Systems",
  "Computer Architecture",
  "Operating Systems",
  "Machine Learning",
  "Database Internals",
  "Compiler Engineering",
  "Computer Networks",
  "Cryptography",
  "Software Engineering",
  "Embedded Systems",
  "Cloud Infrastructure",
];

export function InfiniteMarquee() {
  return (
    <div className="relative w-full py-8 overflow-hidden bg-gradient-to-b from-[#050505] via-[#07090e] to-[#050505]">
      {/* Edge gradient masks for seamless fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

      {/* Row 1: Forward Marquee */}
      <div className="flex select-none">
        <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
          {DISCIPLINES.concat(DISCIPLINES).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 text-xs sm:text-sm font-mono tracking-widest text-zinc-400 uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_8px_#22d3ee]" />
              <span className="text-white/80 font-bold hover:text-cyan-400 transition-colors">
                {item}
              </span>
              <span className="text-zinc-600 font-normal">/</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
