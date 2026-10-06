"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Users, Sparkles } from "lucide-react";
import { retroSound } from "@/lib/sound";
import { applyMagneticEffect } from "@/lib/animations/gsap";

export const FinalCTA: React.FC = () => {
  const ctaBtnRef = useRef<HTMLAnchorElement>(null);
  const clanBtnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    if (ctaBtnRef.current) cleanups.push(applyMagneticEffect(ctaBtnRef.current, 0.2));
    if (clanBtnRef.current) cleanups.push(applyMagneticEffect(clanBtnRef.current, 0.15));
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 border-t border-violet-500/20 bg-gradient-to-b from-[#030712] to-[#050818] overflow-hidden">
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
        <span className="font-hud text-xs text-cyan-400 tracking-widest uppercase font-semibold">
          GET STARTED TODAY
        </span>

        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
          READY TO MASTER <br />
          <span className="text-gradient-violet">YOUR ENGINEERING SUBJECTS?</span>
        </h2>

        <p className="font-body text-sm sm:text-base text-zinc-300 max-w-lg mx-auto">
          Start structured quizzes, understand your weak topics, and master your university curriculum with adaptive learning.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            ref={ctaBtnRef}
            href="/register"
            onClick={() => retroSound.playLevelUp()}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-display font-semibold text-sm text-white bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all flex items-center justify-center gap-2 group"
          >
            <span>START LEARNING</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            ref={clanBtnRef}
            href="/clans/create"
            onClick={() => retroSound.playClick()}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-display font-medium text-sm text-zinc-300 hover:text-white bg-[#0b0f24]/80 hover:bg-[#121938] border border-violet-500/30 hover:border-cyan-400/50 backdrop-blur-md transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>CREATE A CLAN</span>
          </Link>
        </div>
      </div>
    </section>
  );
};