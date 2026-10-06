"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Crosshair, RegistrationMark, CornerFrame } from "./TechnicalSystem";
import { retroSound } from "@/lib/sound";

export function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when menu is open
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

  const navItems = [
    { num: "01", label: "SUBJECTS", href: "#subjects" },
    { num: "02", label: "QUIZZES", href: "#quizzes" },
    { num: "03", label: "ADAPTIVE", href: "#adaptive" },
    { num: "04", label: "MASTERY", href: "#mastery" },
    { num: "05", label: "BADGES", href: "#badges" },
    { num: "06", label: "CLANS", href: "#clans" },
    { num: "07", label: "FACULTY", href: "#faculty" },
    { num: "08", label: "DASHBOARD", href: "/dashboard" },
  ];

  return (
    <>
      {/* Extremely Minimal Floating Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 sm:px-10 md:px-14 py-6 flex items-center justify-between pointer-events-none">
        {/* Brand Link */}
        <Link
          href="/"
          onClick={() => retroSound.playClick()}
          className="pointer-events-auto group focus:outline-none flex items-center gap-2 font-condensed font-extrabold text-xl sm:text-2xl tracking-wider text-white uppercase"
          data-cursor="HOME"
        >
          <span>CLASS ROYALE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 opacity-80 group-hover:scale-150 transition-transform" />
        </Link>

        {/* Action Controls */}
        <div className="pointer-events-auto flex items-center gap-4 sm:gap-6 font-mono text-xs uppercase tracking-widest">
          <Link
            href="/login"
            onClick={() => retroSound.playClick()}
            className="hidden sm:inline text-white/50 hover:text-white transition-colors"
            data-cursor="SIGN IN"
          >
            LOGIN
          </Link>

          {/* Minimal MENU Button */}
          <button
            type="button"
            onClick={() => {
              retroSound.playClick();
              setMenuOpen(true);
            }}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-none bg-black/40 border border-white/20 hover:border-cyan-400 text-white font-medium transition-all group backdrop-blur-md"
            data-cursor="MENU"
          >
            <span className="w-1.5 h-1.5 bg-cyan-400 group-hover:scale-125 transition-transform" />
            <span className="text-white/80 group-hover:text-white">MENU</span>
          </button>
        </div>
      </header>

      {/* Full-Screen Cinematic Navigation Overlay */}
      {menuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 md:p-16 animate-in fade-in duration-300"
        >
          {/* Top Bar inside Overlay */}
          <div className="flex items-center justify-between text-xs font-mono tracking-widest text-white/40 uppercase border-b border-white/10 pb-6">
            <div className="flex items-center gap-3">
              <RegistrationMark />
              <span className="text-white/70">NAVIGATION INDEX // CR-2026</span>
            </div>

            <button
              type="button"
              onClick={() => {
                retroSound.playClick();
                setMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 text-white transition-colors font-mono text-xs uppercase"
              data-cursor="CLOSE"
            >
              <Crosshair />
              <span>CLOSE [ESC]</span>
            </button>
          </div>

          {/* Nav Items List */}
          <nav className="my-auto py-8 flex flex-col gap-2 sm:gap-4 max-w-4xl">
            {navItems.map((item) => (
              <a
                key={item.num}
                href={item.href}
                onClick={() => {
                  retroSound.playClick();
                  setMenuOpen(false);
                }}
                className="group flex items-baseline gap-4 sm:gap-8 transition-transform hover:translate-x-3 focus:outline-none"
                data-cursor="SELECT"
              >
                <span className="font-mono text-xs sm:text-sm text-cyan-400/80 font-bold group-hover:text-cyan-300 transition-colors">
                  {item.num}
                </span>
                <span className="font-condensed font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight text-white/80 group-hover:text-white transition-colors uppercase">
                  {item.label}
                </span>
                <span className="hidden sm:inline font-mono text-xs text-white/20 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all">
                  &rarr;
                </span>
              </a>
            ))}
          </nav>

          {/* Bottom Coordinates & Quick Login */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-white/30 uppercase tracking-wider border-t border-white/10 pt-6">
            <div className="flex items-center gap-4">
              <span>LAT 28.4595 // LON 77.0266</span>
              <span>•</span>
              <span className="text-cyan-400">ENGINEERING EDUCATION</span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-white hover:text-cyan-400 font-semibold transition-colors"
              >
                STUDENT LOGIN &rarr;
              </Link>
              <Link
                href="/faculty"
                onClick={() => setMenuOpen(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                FACULTY SUITE &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
