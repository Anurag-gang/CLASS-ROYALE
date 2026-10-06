"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  BookOpen,
  Users,
  Trophy,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  LogOut,
  User as UserIcon,
  Compass,
  ChevronRight,
  Shield,
} from "lucide-react";
import { retroSound } from "@/lib/sound";
import { ThreeUIDockNav } from "./ThreeUIDockNav";

export function UnifiedNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    role?: string;
    name?: string;
  } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Check current session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({
            username: data.user.username,
            role: data.user.role,
            name: data.user.profile?.name || data.user.username,
          });
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, [pathname]);

  // Handle scroll backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      retroSound.playClick();
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/login");
      router.refresh();
    } catch {
      // ignore
    }
  };

  const navLinks = [
    { label: "Subjects", href: "/subjects" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Clans", href: "/clans" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Recommendations", href: "/recommendations" },
    { label: "Faculty", href: "/faculty/dashboard" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505]/85 backdrop-blur-md border-b border-white/[0.07] py-3.5"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/"
            onClick={() => retroSound.playClick()}
            className="group flex items-center gap-2.5 font-condensed font-black text-xl sm:text-2xl tracking-wider text-white uppercase focus:outline-none"
          >
            <span>CLASS ROYALE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-80 group-hover:scale-150 transition-transform" />
          </Link>

          {/* ThreeUI Animated Top Dock */}
          <ThreeUIDockNav />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-mono tracking-widest uppercase">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => retroSound.playClick()}
                  className={`cr-link transition-colors ${
                    isActive
                      ? "text-cyan-400 font-bold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Action Dock */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <Link
                  href={currentUser.role === "FACULTY" ? "/faculty/dashboard" : "/dashboard"}
                  onClick={() => retroSound.playClick()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-white transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">{currentUser.username}</span>
                  {currentUser.role && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-cyan-400/10 text-cyan-300 rounded font-mono border border-cyan-400/20">
                      {currentUser.role}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  onClick={() => retroSound.playClick()}
                  className="cr-link text-white/60 hover:text-white px-2 py-1 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => retroSound.playClick()}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Menu Trigger Button */}
            <button
              type="button"
              onClick={() => {
                retroSound.playClick();
                setMenuOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400/50 text-white transition-all"
              aria-label="Open Navigation Index"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline text-[11px] font-semibold">INDEX</span>
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => {
                retroSound.playClick();
                setMenuOpen(true);
              }}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-cyan-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Navigation Index Overlay */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 md:p-16 animate-in fade-in duration-200"
        >
          {/* Top Bar inside Overlay */}
          <div className="flex items-center justify-between text-xs font-mono tracking-widest text-white/40 uppercase border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-white/80 font-bold">CLASS ROYALE // NAVIGATION INDEX</span>
            </div>

            <button
              type="button"
              onClick={() => {
                retroSound.playClick();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-white hover:text-cyan-400 hover:border-cyan-400 transition-all font-mono text-xs uppercase"
            >
              <X className="w-4 h-4" />
              <span>CLOSE [ESC]</span>
            </button>
          </div>

          {/* Main Index Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-8 my-auto max-w-6xl w-full mx-auto">
            {/* Column 1: Core Curricular Navigation */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                01 // ACADEMIC PLATFORM
              </span>
              <ul className="space-y-3 font-condensed font-black text-2xl sm:text-3xl text-white uppercase">
                <li>
                  <Link
                    href="/subjects"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>SUBJECTS & SYLLABUS</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/how-it-works"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>HOW IT WORKS</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/recommendations"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>AI RECOMMENDATIONS</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Collaborative Mastery */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                02 // COLLABORATION & MASTERY
              </span>
              <ul className="space-y-3 font-condensed font-black text-2xl sm:text-3xl text-white uppercase">
                <li>
                  <Link
                    href="/clans"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>STUDY CLANS</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/leaderboard"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>LEADERBOARD</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/badges"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>VERIFIED BADGES</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Portals & Workspaces */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                03 // WORKSPACES
              </span>
              <ul className="space-y-3 font-condensed font-black text-2xl sm:text-3xl text-white uppercase">
                <li>
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>STUDENT DASHBOARD</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faculty/dashboard"
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>FACULTY LMS PORTAL</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
                <li>
                  <Link
                    href={currentUser ? "/profile" : "/login"}
                    onClick={() => {
                      retroSound.playClick();
                      setMenuOpen(false);
                    }}
                    className="group flex items-center justify-between hover:text-cyan-400 transition-colors"
                  >
                    <span>{currentUser ? "MY PROFILE" : "ACCOUNT SIGN IN"}</span>
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer inside Overlay */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40 uppercase border-t border-white/10 pt-6">
            <span>Engineering Education Platform // Next.js &amp; ML Adaptive Engine</span>
            <span>Zero-Downtime Architecture</span>
          </div>
        </div>
      )}
    </>
  );
}
