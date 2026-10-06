"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileQuestion,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Swords,
  GraduationCap,
  ExternalLink,
} from "lucide-react";

interface FacultySidebarProps {
  currentUser?: {
    username: string;
    name?: string;
    department?: string;
    facultyId?: string;
    role: string;
  } | null;
  onCloseMobile?: () => void;
}

export const FacultySidebar: React.FC<FacultySidebarProps> = ({
  currentUser,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/classes", label: "Classes & Students", icon: Users },
    { href: "/faculty/courses", label: "Course Management", icon: BookOpen },
    { href: "/faculty/quizzes", label: "Quizzes & Quests", icon: FileQuestion },
    { href: "/faculty/ai-generator", label: "AI Quiz Generator", icon: Sparkles, badge: "CR" },
    { href: "/faculty/analytics", label: "Academic Analytics", icon: BarChart3 },
    { href: "/faculty/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-screen shrink-0 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <Link
          href="/faculty/dashboard"
          className="flex items-center gap-2.5 group"
          onClick={onCloseMobile}
        >
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#de1659] to-[#f755bc] flex items-center justify-center text-white shadow-sm">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <div className="font-sans font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>CLASS ROYALE</span>
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                FACULTY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">University Academic LMS</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Teaching Command
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-pink-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-5 px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Student Arena Access
        </div>
        <Link
          href="/dashboard"
          className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-cyan-400 hover:bg-cyan-950/30 transition-colors border border-cyan-500/20"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Switch to Student View
          </span>
          <span className="text-[10px]">🎮</span>
        </Link>
      </nav>

      {/* Faculty Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm">
              <GraduationCap className="w-4 h-4 text-pink-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {currentUser?.name || currentUser?.username || "Faculty Member"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.department || "Dept. of Computer Applications"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
