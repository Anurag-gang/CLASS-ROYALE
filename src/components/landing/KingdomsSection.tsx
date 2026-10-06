"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Network, Cpu, Database, ShieldCheck, ChevronRight, Trophy, Flame, Zap, ArrowUpRight } from "lucide-react";
import { retroSound } from "@/lib/sound";
import { applyCard3DTilt } from "@/lib/animations/gsap";

interface Kingdom {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  colorScheme: "violet" | "cyan" | "emerald" | "amber";
  icon: React.ReactNode;
  boss: string;
  territories: string[];
  levelReq: string;
  bounty: string;
  activePlayers: number;
}

const kingdomsData: Kingdom[] = [
  {
    id: "algo",
    name: "Algorithms & Data Structures",
    badge: "CORE FOUNDATION",
    tagline: "Navigate computational complexity, tree balancing, dynamic programming, and asymptotic bounds.",
    colorScheme: "violet",
    icon: <Cpu className="w-6 h-6 text-violet-400" />,
    boss: "The AVL Hydra & Graph Minotaur",
    territories: ["Red-Black Balancing", "Dynamic Programming Caches", "Dijkstra & A* Pathfinding", "Amortized Bounds"],
    levelReq: "LV. 10+",
    bounty: "+450 XP",
    activePlayers: 1420,
  },
  {
    id: "math",
    name: "Discrete Mathematics & Logic",
    badge: "FORMAL PROOFS",
    tagline: "Master induction, graph topologies, combinatorics, modular arithmetic, and Boolean logic gates.",
    colorScheme: "cyan",
    icon: <Network className="w-6 h-6 text-cyan-400" />,
    boss: "The Boolean Sphinx",
    territories: ["Structural Induction", "Planar Graph Topologies", "Pigeonhole Principle", "Modular Cryptography"],
    levelReq: "LV. 8+",
    bounty: "+380 XP",
    activePlayers: 980,
  },
  {
    id: "systems",
    name: "Fullstack Systems & Concurrency",
    badge: "HIGH-SCALE INFRA",
    tagline: "Architect distributed message brokers, atomic transactions, microservice sagas, and cache invalidation.",
    colorScheme: "emerald",
    icon: <Database className="w-6 h-6 text-emerald-400" />,
    boss: "The Concurrency Colossus",
    territories: ["Raft Distributed Consensus", "Event Sourcing & CQRS", "Cache Stampede Defenses", "Multi-Threaded Race Shields"],
    levelReq: "LV. 18+",
    bounty: "+520 XP",
    activePlayers: 1150,
  },
  {
    id: "security",
    name: "Cybersecurity & Defense Matrix",
    badge: "ADVERSARIAL HARDENING",
    tagline: "Dissect memory safety exploits, zero-trust protocols, cryptographic primitives, and attack trees.",
    colorScheme: "amber",
    icon: <ShieldCheck className="w-6 h-6 text-amber-400" />,
    boss: "The Zero-Day Leviathan",
    territories: ["Buffer Overflow Forensics", "RSA & Elliptic Curve Math", "Zero-Knowledge Proofs", "Side-Channel Defenses"],
    levelReq: "LV. 25+",
    bounty: "+600 XP",
    activePlayers: 840,
  },
];

export const KingdomsSection: React.FC = () => {
  const [selectedKingdom, setSelectedKingdom] = useState<string>("algo");
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    cardRefs.current.forEach((el) => {
      if (el) cleanups.push(applyCard3DTilt(el, 10));
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section id="kingdoms" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Ambience */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-violet-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-hud tracking-widest text-violet-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>TERRITORIAL MAP</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
            The Four Academic <span className="text-gradient-violet">Kingdoms</span>
          </h2>
          <p className="font-body text-base text-zinc-400">
            Higher education broken down into conquerable, gamified territories. Each realm contains progressive quest
            lines, interactive coding battles, and legendary milestone bosses.
          </p>
        </div>

        <Link
          href="/register"
          onClick={() => retroSound.playClick()}
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group"
        >
          <span>Explore All Territories</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Kingdoms Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kingdomsData.map((k, index) => {
          const isSelected = selectedKingdom === k.id;
          const isViolet = k.colorScheme === "violet";
          const isCyan = k.colorScheme === "cyan";
          const isEmerald = k.colorScheme === "emerald";
          const isAmber = k.colorScheme === "amber";

          return (
            <div
              key={k.id}
              ref={(el) => { cardRefs.current[index] = el; }}
              onMouseEnter={() => {
                setSelectedKingdom(k.id);
                retroSound.playClick();
              }}
              className={`relative rounded-2xl p-7 transition-all duration-300 cursor-pointer overflow-hidden border backdrop-blur-xl ${
                isViolet
                  ? "bg-[#080d22]/80 border-violet-500/30 hover:border-violet-400/70 hover:shadow-[0_0_30px_rgba(139,92,246,0.25)]"
                  : isCyan
                  ? "bg-[#061325]/80 border-cyan-500/30 hover:border-cyan-400/70 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]"
                  : isEmerald
                  ? "bg-[#051a1a]/80 border-emerald-500/30 hover:border-emerald-400/70 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                  : "bg-[#181105]/80 border-amber-500/30 hover:border-amber-400/70 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]"
              }`}
            >
              {/* Corner Aura */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20 ${
                  isViolet ? "bg-violet-500" : isCyan ? "bg-cyan-500" : isEmerald ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />

              {/* Kingdom Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {k.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-hud tracking-widest text-zinc-400 uppercase">
                      {k.badge}
                    </span>
                    <h3 className="font-display font-bold text-lg text-white">{k.name}</h3>
                  </div>
                </div>

                <span className="font-mono text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-zinc-300">
                  {k.levelReq}
                </span>
              </div>

              {/* Tagline */}
              <p className="font-body text-xs text-zinc-300 leading-relaxed mb-5">
                {k.tagline}
              </p>

              {/* Territories List */}
              <div className="space-y-2 mb-6">
                <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Key Territories:</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {k.territories.map((t, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-zinc-300 truncate"
                    >
                      • {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Boss & Bounty Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-zinc-300">Boss: {k.boss}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{k.bounty}</span>
                  <Link
                    href="/register"
                    onClick={(e) => {
                      e.stopPropagation();
                      retroSound.playLevelUp();
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
