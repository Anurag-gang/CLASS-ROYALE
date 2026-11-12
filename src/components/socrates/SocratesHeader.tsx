"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  ArrowLeft,
  Cpu,
  Plus,
} from "lucide-react";
import { socratesTheme } from "./socratesTheme";

export interface SocratesHeaderProps {
  modelName: string;
  isOnline: boolean;
  latencyMs?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

export const SocratesHeader: React.FC<SocratesHeaderProps> = ({
  modelName,
  isOnline,
  latencyMs,
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
}) => {
  return (
    <header className={`relative z-20 h-14 w-full flex items-center justify-between px-4 sm:px-6 select-none shrink-0 ${socratesTheme.header}`}>
      {/* Left: Sidebar Toggle, Exit Link & Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          aria-label={sidebarOpen ? "Close Conversation Drawer" : "Open Conversation Drawer"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/5 transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          title="Exit to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit</span>
        </Link>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
          <span className="font-condensed font-black tracking-widest text-white text-lg uppercase">
            SOCRATES
          </span>
          <span className="hidden md:inline-block text-[10px] font-mono tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
            AI WORKSPACE
          </span>
        </div>
      </div>

      {/* Center: Active Colibri Model Badge */}
      <div className="hidden md:flex items-center">
        <div className={socratesTheme.pillCyan}>
          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="truncate max-w-[220px]" title={modelName}>
            {modelName}
          </span>
        </div>
      </div>

      {/* Right: Live Status Pill & New Chat Action */}
      <div className="flex items-center gap-3">
        {isOnline ? (
          <div className={socratesTheme.pillOnline}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </span>
            <span>ONLINE</span>
            {latencyMs !== undefined && latencyMs > 0 && (
              <span className="text-[10px] text-emerald-400/70 hidden sm:inline">
                {latencyMs}ms
              </span>
            )}
          </div>
        ) : (
          <div className={socratesTheme.pillOffline}>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <span>OFFLINE</span>
          </div>
        )}

        <button
          onClick={onNewChat}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-mono text-cyan-300 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Dialectic</span>
        </button>
      </div>
    </header>
  );
};
