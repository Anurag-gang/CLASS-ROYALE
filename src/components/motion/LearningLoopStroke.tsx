"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Target, Cpu, Sparkles, Users, Award } from "lucide-react";

const STAGES = [
  {
    step: "01",
    title: "Curriculum Mapping",
    subtitle: "Formal university syllabus breakdown into discrete concept atoms",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Diagnostic Quizzes",
    subtitle: "Calibrated multi-tier retrieval questions with Item Response Theory",
    icon: Target,
  },
  {
    step: "03",
    title: "ML Engine Calibration",
    subtitle: "Real-time Bayesian knowledge state updating across all engineering topics",
    icon: Cpu,
  },
  {
    step: "04",
    title: "Targeted Recommendations",
    subtitle: "Smart weak-topic intervention generating customized practice queues",
    icon: Sparkles,
  },
  {
    step: "05",
    title: "Clan & Peer Battles",
    subtitle: "Cohort-wide knowledge leagues, sprint challenges, and department ranking",
    icon: Users,
  },
];

export function LearningLoopStroke() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const pathLength = useTransform(scrollYProgress, [0.15, 0.85], [0, 1]);

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-12 px-6">
      {/* Central SVG Line on Desktop */}
      <div className="hidden md:block absolute left-1/2 top-16 bottom-16 -translate-x-1/2 w-4 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 16 800" fill="none" preserveAspectRatio="none">
          {/* Subtle static track */}
          <line
            x1="8"
            y1="0"
            x2="8"
            y2="800"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          {/* Animated active stroke */}
          <motion.line
            x1="8"
            y1="0"
            x2="8"
            y2="800"
            stroke="#22d3ee"
            strokeWidth="2.5"
            style={{
              pathLength,
              filter: "drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))",
            }}
          />
        </svg>
      </div>

      {/* 5 Stages Alternating */}
      <div className="space-y-12 sm:space-y-16">
        {STAGES.map((stage, idx) => {
          const isEven = idx % 2 === 0;
          const Icon = stage.icon;

          return (
            <motion.div
              key={stage.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Text Card */}
              <div
                className={`w-full md:w-1/2 ${
                  isEven ? "md:text-right" : "md:text-left"
                }`}
              >
                <div className="p-6 rounded-2xl bg-[#080a12]/90 border border-white/[0.08] hover:border-cyan-400/40 backdrop-blur-xl transition-all shadow-xl group">
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold block mb-1">
                    PHASE {stage.step}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-condensed font-black text-white uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
                    {stage.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 font-body leading-relaxed">
                    {stage.subtitle}
                  </p>
                </div>
              </div>

              {/* Center Node Icon */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#07090e] border-2 border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
                <Icon className="w-5 h-5" />
              </div>

              {/* Blank balance spacer for alternating grid on desktop */}
              <div className="hidden md:block w-1/2" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
