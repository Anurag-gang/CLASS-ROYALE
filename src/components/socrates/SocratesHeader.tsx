"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  ArrowLeft,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { socratesTheme } from "./socratesTheme";

export interface SocratesHeaderProps {
  modelName?: string;
  isOnline?: boolean;
  latencyMs?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

export const SocratesHeader: React.FC<SocratesHeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onNewChat,
}) => {
  return (
    <header className={`relative z-20 h-14 w-full flex items-center justify-between px-4 sm:px-6 select-none shrink-0 ${socratesTheme.header}`}>
      {/* Left: Sidebar Toggle, Brand & Dashboard Link */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          type="button"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white tracking-wide text-base">
            Socrates
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block mx-1" />

        <Link
          href="/dashboard"
          className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          title="Exit to Dashboard"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Dashboard</span>
        </Link>
      </div>

      {/* Center: EMPTY (Model name strictly displayed only inside composer pill) */}
      <div className="flex-1" />

      {/* Right: New Chat Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewChat}
          type="button"
          aria-label="New chat"
          title="New chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs text-zinc-200 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New chat</span>
        </button>
      </div>
    </header>
  );
};

export default SocratesHeader;
