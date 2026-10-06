"use client";

import React from "react";
import Link from "next/link";
import { Crosshair, RegistrationMark, CornerFrame } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function SectionFinalCTA() {
  return (
    <section className="relative w-full min-h-[80vh] flex items-center justify-center py-32 px-6 sm:px-10 md:px-14 bg-[#050505] overflow-hidden">
      {/* Subtle Luminous Grid Background */}
      <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-[#050505] pointer-events-none" />



      {/* Center Cinematic Action */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
        <span className="font-mono text-xs sm:text-sm text-cyan-400 font-bold uppercase tracking-widest block">
          START LEARNING
        </span>

        <h2 className="font-condensed font-black text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] tracking-tighter text-white uppercase leading-[0.82] select-none">
          CLASS ROYALE
        </h2>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            onClick={() => retroSound.playLevelUp()}
            className="w-full sm:w-auto px-10 py-4 bg-white hover:bg-cyan-300 text-slate-950 font-condensed font-black text-base sm:text-lg uppercase tracking-wider transition-all shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)]"
            data-cursor="ENTER"
          >
            ENTER CLASS ROYALE
          </Link>

          <Link
            href="/subjects"
            onClick={() => retroSound.playClick()}
            className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/5 border border-white/20 hover:border-white/60 text-white font-condensed font-bold text-base sm:text-lg uppercase tracking-wider transition-all"
            data-cursor="SYLLABUS"
          >
            EXPLORE SYLLABUS
          </Link>
        </div>
      </div>
    </section>
  );
}
