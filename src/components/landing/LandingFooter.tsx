"use client";

import React from "react";
import Link from "next/link";
import { Crosshair, RegistrationMark } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function LandingFooter() {
  const scrollToTop = () => {
    retroSound.playClick();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#050505] border-t border-white/10 text-white/50 py-12 px-6 sm:px-10 md:px-14 font-mono text-xs uppercase tracking-wider">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <RegistrationMark />
          <div>
            <span className="font-condensed font-black text-xl text-white tracking-wider block">
              CLASS ROYALE
            </span>
            <span className="text-[10px] text-white/40 block">
              ADAPTIVE ENGINEERING LEARNING &amp; QUIZ PLATFORM // ©2026
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-[11px] text-white/40">
          <Link href="#subjects" className="hover:text-white transition-colors">01 SUBJECTS</Link>
          <Link href="#quizzes" className="hover:text-white transition-colors">02 QUIZZES</Link>
          <Link href="#adaptive" className="hover:text-white transition-colors">03 ADAPTIVE</Link>
          <Link href="#mastery" className="hover:text-white transition-colors">04 MASTERY</Link>
          <Link href="#badges" className="hover:text-white transition-colors">05 BADGES</Link>
          <Link href="#clans" className="hover:text-white transition-colors">06 CLANS</Link>
          <Link href="/faculty" className="hover:text-white transition-colors">07 FACULTY</Link>
        </div>

        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-colors text-[10px]"
          data-cursor="TOP"
        >
          <Crosshair />
          <span>TOP &uarr;</span>
        </button>
      </div>
    </footer>
  );
}
