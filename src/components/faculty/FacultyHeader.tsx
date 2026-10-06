"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, Bell, Search, Sparkles } from "lucide-react";

interface FacultyHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ElementType;
  };
}

export const FacultyHeader: React.FC<FacultyHeaderProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  primaryAction,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md border border-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 font-normal mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Term Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Fall Term 2026–27</span>
        </div>

        {primaryAction && (
          primaryAction.href ? (
            <Link
              href={primaryAction.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#de1659] hover:bg-[#c2134d] text-white text-xs font-medium shadow-sm transition-colors"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{primaryAction.label}</span>
            </Link>
          ) : (
            <button
              onClick={primaryAction.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#de1659] hover:bg-[#c2134d] text-white text-xs font-medium shadow-sm transition-colors"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>{primaryAction.label}</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
