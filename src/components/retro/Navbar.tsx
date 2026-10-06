"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SoundToggle } from "./SoundToggle";
import {
  Menu,
  X,
  Swords,
  BookOpen,
  Users,
  Trophy,
  Award,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({
            username: data.user.username,
            role: data.user.role,
          });
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    retroSound.playClick();
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    router.push("/login");
    router.refresh();
  };

  // The landing page renders its own LandingNavbar
  if (pathname === "/") {
    return null;
  }

  const studentNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { href: "/subjects", label: "Subjects", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { href: "/clans", label: "Clans", icon: <Users className="w-3.5 h-3.5" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Trophy className="w-3.5 h-3.5" /> },
    { href: "/badges", label: "Badges", icon: <Award className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/90 backdrop-blur-xl border-b border-violet-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={() => retroSound.playClick()}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[1.5px] transition-transform duration-300 group-hover:scale-105">
            <div className="w-full h-full bg-[#070b19] rounded-[10px] flex items-center justify-center">
              <Swords className="w-4 h-4 text-violet-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-wider text-white flex items-center gap-1">
              CLASS <span className="text-gradient-violet">ROYALE</span>
            </span>
            <span className="font-hud text-[8px] uppercase tracking-widest text-cyan-400/80 -mt-1 font-semibold">
              Adaptive Engineering
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0b0f24]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-violet-500/20">
          {studentNavLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => retroSound.playClick()}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-all rounded-full ${
                  isActive
                    ? "bg-violet-600/30 text-white font-semibold border border-violet-400/40 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Quick link for faculty/admin users */}
          {(currentUser?.role === "FACULTY" || currentUser?.role === "ADMIN") && (
            <Link
              href="/faculty"
              onClick={() => retroSound.playClick()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-blue-950/60 text-blue-300 border border-blue-500/30 hover:bg-blue-900/50 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Faculty Suite</span>
            </Link>
          )}
        </nav>

        {/* Right Section: Sound, Profile & Auth */}
        <div className="hidden sm:flex items-center gap-3">
          <SoundToggle />

          {currentUser ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                onClick={() => retroSound.playClick()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-950/40 border border-violet-500/30 hover:border-violet-400/60 text-zinc-200 transition-colors text-xs font-medium"
              >
                <div className="w-6 h-6 rounded-lg bg-violet-600/30 flex items-center justify-center text-[10px] font-hud text-violet-300 font-bold">
                  {currentUser.username.slice(0, 2).toUpperCase()}
                </div>
                <span>{currentUser.username}</span>
                {currentUser.role && currentUser.role !== "STUDENT" && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30">
                    {currentUser.role}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-xl bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                onClick={() => retroSound.playClick()}
                className="px-3 py-1.5 text-xs text-zinc-300 hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => retroSound.playLevelUp()}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-display text-xs font-semibold shadow-md transition-all"
              >
                Start Learning
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          <SoundToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-violet-500/20 text-zinc-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#070b1a]/95 backdrop-blur-2xl border-b border-violet-500/20 px-6 py-5 space-y-3">
          <nav className="flex flex-col space-y-1.5">
            {studentNavLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  retroSound.playClick();
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-violet-600/30 text-white"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            {(currentUser?.role === "FACULTY" || currentUser?.role === "ADMIN") && (
              <Link
                href="/faculty"
                onClick={() => {
                  retroSound.playClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-300 bg-blue-950/40 border border-blue-500/30"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Faculty Suite</span>
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-300 font-medium"
                >
                  Signed in as <strong>{currentUser.username}</strong>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg bg-white/5 text-zinc-300"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-lg bg-violet-600 text-white font-medium"
                >
                  Start Learning
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};