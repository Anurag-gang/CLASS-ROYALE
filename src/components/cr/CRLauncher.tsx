"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Sparkles } from "lucide-react";
import { retroSound } from "@/lib/sound";

export const CRLauncher: React.FC = () => {
  const pathname = usePathname();
  const [hovered, setHovered] = useState(false);

  if (
    pathname === "/cr" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <aside aria-label="Class Royale AI Companion" className="fixed bottom-6 right-6 z-40">
      <Link
        href="/cr"
        onClick={() => retroSound.playClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
        title="Open CR Socratic Tutor"
      >
        {/* Dynamic Ambient Cyan/Purple Glow */}
        <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-500/30 via-sky-500/20 to-purple-600/30 blur-xl group-hover:from-cyan-400/50 group-hover:to-purple-500/50 transition-all pointer-events-none" />

        {/* Outer Circular Ring with High Contrast */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-cyan-400/40 bg-[#090b10]/95 shadow-[0_0_25px_rgba(6,182,212,0.35)] backdrop-blur-xl flex items-center justify-center group-hover:border-cyan-400 group-hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all">
          {/* Subtle concentric grid background */}
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.15)_0%,transparent_70%)] pointer-events-none" />

          {/* Robot Icon */}
          <Bot
            className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400 group-hover:text-cyan-300 transition-all duration-300 transform group-hover:scale-110 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]"
            strokeWidth={1.8}
          />

          {/* Sparkle badge */}
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 absolute top-2 right-2 animate-pulse opacity-80" />

          {/* Live Online Status Indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#090b10] shadow-[0_0_6px_#10b981]" />
          </span>
        </div>

        {/* Minimal Tooltip on Hover */}
        <div
          className={`absolute right-full mr-3.5 px-3 py-1.5 rounded-xl bg-[#0e0f13]/95 border border-white/10 text-white shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
            hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="font-mono text-xs font-semibold text-white tracking-wide">
            CR TUTOR
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            // SOCRATIC AI
          </span>
        </div>
      </Link>
    </aside>
  );
};
