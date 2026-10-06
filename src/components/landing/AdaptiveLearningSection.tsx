"use client";

import React from "react";
import { Activity, Target, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";

export const AdaptiveLearningSection: React.FC = () => {
  const flowNodes = [
    {
      title: "Your Performance",
      desc: "Instant quiz results & response patterns",
      icon: <Activity className="w-5 h-5 text-cyan-400" />,
      color: "border-cyan-500/30 bg-cyan-950/20",
    },
    {
      title: "Topic Mastery",
      desc: "Continuous percentage tracking per concept",
      icon: <Target className="w-5 h-5 text-violet-400" />,
      color: "border-violet-500/30 bg-violet-950/20",
    },
    {
      title: "Weak Areas",
      desc: "Automatic pinpointing of knowledge deficits",
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/30 bg-amber-950/20",
    },
    {
      title: "Recommended Quiz",
      desc: "Tailored questions that bridge the specific gap",
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-500/30 bg-emerald-950/20",
    },
  ];

  return (
    <section id="adaptive" className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="font-hud text-xs text-cyan-400 tracking-widest uppercase font-semibold">
          INTELLIGENT ADAPTATION
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          YOUR NEXT QUIZ <br />
          <span className="text-gradient-cyan">ISN&apos;T RANDOM.</span>
        </h2>
        <p className="font-body text-base text-zinc-300">
          Class Royale adapts your next challenge to what you actually need to learn.
        </p>
      </div>

      {/* Visual Flow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {flowNodes.map((node, idx) => (
          <div
            key={node.title}
            className={`rounded-2xl p-6 border ${node.color} backdrop-blur-xl space-y-3 relative`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              {node.icon}
            </div>

            <div className="font-hud text-[11px] text-zinc-500 font-bold">
              STEP 0{idx + 1}
            </div>

            <h3 className="font-display font-bold text-base text-white">
              {node.title}
            </h3>

            <p className="font-body text-xs text-zinc-400 leading-relaxed">
              {node.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
