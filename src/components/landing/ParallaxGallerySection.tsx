"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { retroSound } from "@/lib/sound";

interface EngineeringCard {
  src: string;
  category: string;
  title: string;
  description: string;
}

const GALLERY_ITEMS: EngineeringCard[] = [
  // Column 1
  {
    src: "/images/gallery/img1.jpg",
    category: "Architecture",
    title: "Neural Network Topology",
    description: "Deep computation graphs, tensor parallelization, and backpropagation flow.",
  },
  {
    src: "/images/gallery/img2.jpg",
    category: "Hardware",
    title: "Silicon Micro-Architecture",
    description: "Instruction pipelining, speculative execution, and cache hierarchies.",
  },
  {
    src: "/images/gallery/img3.jpg",
    category: "Algorithms",
    title: "Dynamic Programming",
    description: "Optimal substructure analysis, state space memoization, and graph DAGs.",
  },

  // Column 2
  {
    src: "/images/gallery/img4.jpg",
    category: "Distributed",
    title: "Raft Consensus Protocols",
    description: "Leader election, quorum validation, and resilient replicated log states.",
  },
  {
    src: "/images/gallery/img5.jpg",
    category: "Operating Systems",
    title: "Virtual Memory & Paging",
    description: "Multi-level page tables, TLB cache eviction, and kernel memory isolation.",
  },
  {
    src: "/images/gallery/img6.jpg",
    category: "Networks",
    title: "Congestion Control & BBR",
    description: "TCP buffer management, packet pacing, and bottleneck bandwidth estimation.",
  },

  // Column 3
  {
    src: "/images/gallery/img7.jpg",
    category: "Compilers",
    title: "Abstract Syntax Trees",
    description: "Lexical tokenization, static single assignment, and dead code elimination.",
  },
  {
    src: "/images/gallery/img8.jpg",
    category: "Databases",
    title: "B+ Tree Index Internals",
    description: "Write-ahead logging, ACID transaction barriers, and MVCC concurrency.",
  },
  {
    src: "/images/gallery/img9.jpg",
    category: "Cryptography",
    title: "Zero-Knowledge Proofs",
    description: "Arithmetic circuits, polynomial commitments, and non-interactive verifiers.",
  },
];

export function ParallaxGallerySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth, balanced parallax offsets for each column (no extreme jumps or stutters)
  const y1 = useTransform(scrollYProgress, [0, 1], [40, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-60, 100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [60, -100]);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-gradient-to-b from-[#050505] via-[#080a12] to-[#050505] text-white overflow-hidden py-24 sm:py-32"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-3">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              ENGINEERING DISCIPLINES IN FOCUS
            </span>
            <h2 className="font-condensed font-black text-4xl sm:text-6xl uppercase tracking-tight text-white leading-none cr-heading-hover">
              APPLIED SYSTEMS <br />
              <span className="text-cyan-400">IN CONTINUOUS PARALLAX</span>
            </h2>
          </div>

          <p className="max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed font-body">
            Real engineering challenges mapped to structured learning tracks. From silicon micro-architecture to distributed consensus and cryptographic proofs.
          </p>
        </div>
      </div>

      {/* 3-Column Parallax Gallery */}
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {/* Column 1 */}
          <motion.div style={{ y: y1 }} className="flex flex-col gap-6 sm:gap-8">
            {GALLERY_ITEMS.slice(0, 3).map((item, idx) => (
              <CleanImageCard key={idx} item={item} />
            ))}
          </motion.div>

          {/* Column 2 */}
          <motion.div style={{ y: y2 }} className="flex flex-col gap-6 sm:gap-8">
            {GALLERY_ITEMS.slice(3, 6).map((item, idx) => (
              <CleanImageCard key={idx} item={item} />
            ))}
          </motion.div>

          {/* Column 3 */}
          <motion.div style={{ y: y3 }} className="flex flex-col gap-6 sm:gap-8">
            {GALLERY_ITEMS.slice(6, 9).map((item, idx) => (
              <CleanImageCard key={idx} item={item} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Section Footer Call to Action */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.08]">
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          Curriculum mapped across 12 university engineering faculties
        </div>

        <Link
          href="/subjects"
          onClick={() => retroSound.playClick()}
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400 text-xs sm:text-sm font-mono text-cyan-400 uppercase tracking-wider font-semibold transition-all"
        >
          <span>Explore All 12 Engineering Tracks</span>
          <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

function CleanImageCard({ item }: { item: EngineeringCard }) {
  return (
    <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full rounded-2xl overflow-hidden group shadow-[0_12px_32px_rgba(0,0,0,0.85)] border border-white/[0.08] hover:border-cyan-400/50 transition-all duration-500">
      {/* Full-bleed background image */}
      <Image
        src={item.src}
        alt={item.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />

      {/* Elegant dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

      {/* Content directly overlaying image with drop shadow */}
      <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end pointer-events-none">
        <span className="text-cyan-400 font-mono text-[11px] uppercase tracking-widest font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mb-1.5">
          {item.category}
        </span>
        <h3 className="text-white font-condensed font-black text-2xl sm:text-3xl uppercase tracking-tight leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] group-hover:text-cyan-300 transition-colors">
          {item.title}
        </h3>
        <p className="text-zinc-300 text-xs sm:text-sm mt-2 font-body leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] opacity-90 group-hover:opacity-100 transition-opacity">
          {item.description}
        </p>
      </div>
    </div>
  );
}
