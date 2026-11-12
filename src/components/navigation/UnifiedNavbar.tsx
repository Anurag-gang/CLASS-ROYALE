"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronRight,
  BookOpen,
  Users,
  Trophy,
  Sparkles,
  LayoutDashboard,
  GraduationCap,
  Award,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

interface MenuLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

interface MenuSection {
  category: string;
  links: MenuLinkItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    category: "PLATFORM",
    links: [
      { label: "Socrates AI", href: "/socrates", icon: Sparkles, desc: "Dialectic AI reasoning and code mastery" },
      { label: "Subjects & Syllabus", href: "/subjects", icon: BookOpen, desc: "" },
      { label: "How It Works", href: "/how-it-works", icon: Sparkles, desc: "" },
      { label: "AI Recommendations", href: "/recommendations", icon: Sparkles, desc: "" },
    ],
  },
  {
    category: "MASTERY",
    links: [
      { label: "Study Clans", href: "/clans", icon: Users, desc: "" },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy, desc: "" },
      { label: "Verified Badges", href: "/badges", icon: Award, desc: "" },
    ],
  },
  {
    category: "PORTALS",
    links: [
      { label: "Student Dashboard", href: "/dashboard", icon: LayoutDashboard, desc: "" },
      { label: "Faculty Portal", href: "/faculty/dashboard", icon: GraduationCap, desc: "" },
      { label: "User Profile", href: "/profile", icon: UserIcon, desc: "" },
    ],
  },
];

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.15 } },
};

const drawerVariants: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.07,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: {
      duration: 0.22,
      ease: [0.7, 0, 0.84, 0] as const,
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

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

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll and manage focus trap
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      // Focus close button on open
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = "";
      triggerButtonRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Keyboard navigation: Escape to close & Focus trap inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!menuOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        retroSound.playClick();
        setMenuOpen(false);
        return;
      }

      if (e.key === "Tab" && menuRef.current) {
        const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const closeMenu = () => {
    retroSound.playClick();
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505]/90 backdrop-blur-md border-b border-white/[0.08] py-3.5"
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

          {/* Streamlined Right Controls: User Session + Consolidated Menu Trigger */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono uppercase tracking-wider">
            {/* Direct Socrates Dialectic Link */}
            <Link
              href="/socrates"
              onClick={() => retroSound.playClick()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/30 hover:border-cyan-400/60 text-cyan-300 hover:text-white transition-all text-[11px] font-semibold tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.12)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SOCRATES AI</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={currentUser.role === "FACULTY" ? "/faculty/dashboard" : "/dashboard"}
                  onClick={() => retroSound.playClick()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 text-white transition-all"
                >
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold hidden sm:inline">{currentUser.username}</span>
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
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/login"
                  onClick={() => retroSound.playClick()}
                  className="cr-link text-white/60 hover:text-white px-2 py-1 transition-colors hidden sm:inline-block"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => retroSound.playClick()}
                  className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold tracking-wider transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)] text-[11px] sm:text-xs"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Consolidated Collapsible Menu Trigger */}
            <button
              ref={triggerButtonRef}
              type="button"
              onClick={() => {
                retroSound.playClick();
                setMenuOpen((prev) => !prev);
              }}
              aria-expanded={menuOpen}
              aria-controls="collapsible-nav-menu"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400/50 text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <Menu className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-semibold tracking-wider">MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* Lightweight Collapsible Menu Drawer with Staggered Rise-Up Animation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="nav-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 md:p-16 select-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeMenu();
            }}
          >
            <motion.div
              ref={menuRef}
              id="collapsible-nav-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation Index"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col justify-between h-full w-full max-w-6xl mx-auto"
            >
              {/* Header inside Menu */}
              <div className="flex items-center justify-between text-xs font-mono tracking-widest text-white/50 uppercase border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                  <span className="text-white/90 font-bold">CLASS ROYALE // NAVIGATION HUB</span>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400/50 text-white hover:text-cyan-400 transition-all font-mono text-xs uppercase focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <X className="w-4 h-4" />
                  <span>CLOSE [ESC]</span>
                </button>
              </div>

              {/* Staggered Navigation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 py-8 my-auto w-full">
                {MENU_SECTIONS.map((section, sIdx) => (
                  <motion.div key={sIdx} variants={itemVariants} className="space-y-4">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold border-b border-white/5 pb-2">
                      {section.category}
                    </span>
                    <ul className="space-y-3 font-condensed font-black text-2xl sm:text-3xl text-white uppercase">
                      {section.links.map((link, lIdx) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                          <motion.li key={lIdx} variants={itemVariants}>
                            <Link
                              href={link.href}
                              onClick={closeMenu}
                              className={`group flex items-center justify-between py-1.5 transition-colors ${
                                isActive ? "text-cyan-400 font-bold" : "text-white/80 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                <span className="block leading-tight group-hover:translate-x-1 transition-transform">
                                  {link.label}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-cyan-400" />
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </motion.div>
                ))}
              </div>

              {/* Footer info */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40 uppercase border-t border-white/10 pt-5"
              >
                <span>Engineering Education Platform // Next.js &amp; ML Adaptive Engine</span>
                <span className="text-cyan-400/70">Press [ESC] to Exit</span>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
