"use client";

import React from "react";
import Link from "next/link";
import { retroSound } from "@/lib/sound";

export function UnifiedFooter() {
  return (
    <footer className="relative bg-[#050505] text-white py-12 px-6 sm:px-10 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Minimal Wordmark */}
        <Link
          href="/"
          onClick={() => retroSound.playClick()}
          className="font-condensed font-black text-xl tracking-wider text-white uppercase flex items-center gap-2"
        >
          <span>CLASS ROYALE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </Link>

        {/* Primary Clean Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-mono tracking-wider text-zinc-400">
          <Link href="/subjects" onClick={() => retroSound.playClick()} className="cr-link hover:text-white transition-colors">
            Subjects
          </Link>
          <Link href="/how-it-works" onClick={() => retroSound.playClick()} className="cr-link hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="/clans" onClick={() => retroSound.playClick()} className="cr-link hover:text-white transition-colors">
            Clans
          </Link>
          <Link href="/leaderboard" onClick={() => retroSound.playClick()} className="cr-link hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/login" onClick={() => retroSound.playClick()} className="cr-link hover:text-white transition-colors">
            Sign In
          </Link>
        </div>

        {/* Minimal Copyright */}
        <div className="text-xs font-mono text-zinc-600">
          &copy; {new Date().getFullYear()} Class Royale
        </div>
      </div>
    </footer>
  );
}
