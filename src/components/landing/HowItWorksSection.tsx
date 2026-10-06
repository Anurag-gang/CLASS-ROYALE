"use client";

import React from "react";
import { BookOpen, HelpCircle, Sparkles, Award, ArrowRight } from "lucide-react";

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: "01",
      title: "LEARN",
      subtitle: "Explore engineering subjects.",
      icon: <BookOpen className="w-5 h-5 text-violet-400" />,
      color: "border-violet-500/30 bg-violet-950/20",
    },
    {
      step: "02",
      title: "QUIZ",
      subtitle: "Test your understanding.",
      icon: <HelpCircle className="w-5 h-5 text-cyan-400" />,
      color: "border-cyan-500/30 bg-cyan-950/20",
    },
    {
      step: "03",
      title: "ADAPT",
      subtitle: "Get recommendations based on your performance.",
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/30 bg-amber-950/20",
    },
    {
      step: "04",
      title: "MASTER",
      subtitle: "Complete the subject and earn your badge.",
      icon: <Award className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-500/30 bg-emerald-950/20",
    },
  ];

  return (
    <section id="how-it-works" className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <span className="font-hud text-xs text-cyan-400 tracking-widest uppercase font-semibold">
          THE LEARNING LOOP
        </span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          How It Works
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, idx) => (
          <div
            key={s.step}
            className={`rounded-2xl p-6 border ${s.color} backdrop-blur-xl space-y-4 relative group hover:border-white/30 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                {s.icon}
              </div>
              <span className="font-hud text-xs text-zinc-500 font-bold">
                {s.step}
              </span>
            </div>

            <div>
              <h3 className="font-display font-extrabold text-lg text-white tracking-wide">
                {s.title}
              </h3>
              <p className="font-body text-xs text-zinc-400 mt-1 leading-relaxed">
                {s.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
