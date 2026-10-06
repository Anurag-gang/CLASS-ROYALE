"use client";

import React from "react";
import { Activity, GitFork, Crosshair, Sliders, Brain, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

interface LoopStep {
  step: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  metric: string;
}

const steps: LoopStep[] = [
  {
    step: "01",
    title: "Continuous Diagnostic Telemetry",
    subtitle: "Real-Time Telemetry",
    icon: <Activity className="w-5 h-5 text-cyan-400" />,
    color: "cyan",
    description: "Every duel response, time latency, and hesitation pattern is ingested into the cognitive state tracker without requiring manual surveys.",
    metric: "< 80ms latency capture",
  },
  {
    step: "02",
    title: "Cognitive Knowledge Graph",
    subtitle: "DAG Topology",
    icon: <GitFork className="w-5 h-5 text-violet-400" />,
    color: "violet",
    description: "Your university curriculum is modeled as a directed acyclic graph. Prerequisites and downstream theorems are interconnected dynamically.",
    metric: "400+ concept nodes",
  },
  {
    step: "03",
    title: "Micro-Deficit Isolation",
    subtitle: "Root Cause Pinpoint",
    icon: <Crosshair className="w-5 h-5 text-red-400" />,
    color: "red",
    description: "Instead of saying 'You failed Graph Theory', the engine isolates the precise misconception: e.g. 'Confusing back-edges with cross-edges in directed DFS'.",
    metric: "Sub-topic precision",
  },
  {
    step: "04",
    title: "Dynamic Difficulty Scaling",
    subtitle: "Zone of Proximal Development",
    icon: <Sliders className="w-5 h-5 text-amber-400" />,
    color: "amber",
    description: "Problems automatically adjust their parameters to keep you in the optimal flow state — never too trivial, never hopelessly demoralizing.",
    metric: "Adaptive ELO rating",
  },
  {
    step: "05",
    title: "Socratic Scaffolding",
    subtitle: "Guided Discovery",
    icon: <Brain className="w-5 h-5 text-fuchsia-400" />,
    color: "fuchsia",
    description: "CR intervenes with targeted inquiries that guide your own deductive reasoning, cementing synaptic connections that rote copying cannot achieve.",
    metric: "Zero spoon-feeding",
  },
  {
    step: "06",
    title: "Spaced Spire Retention",
    subtitle: "Permanent Memory Encoding",
    icon: <Clock className="w-5 h-5 text-emerald-400" />,
    color: "emerald",
    description: "Conquered territories resurface in micro-boss skirmishes right at the edge of the Ebbinghaus forgetting curve, ensuring permanent recall.",
    metric: "98.4% long-term recall",
  },
];

export const AdaptiveLoopSection: React.FC = () => {
  return (
    <section id="adaptive-loop" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background illumination */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-900/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-hud tracking-widest text-cyan-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>CLOSED-LOOP COGNITION</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          The Neural Mastery Engine: <br />
          <span className="text-gradient-cyan">How You Truly Learn</span>
        </h2>
        <p className="font-body text-base text-zinc-400">
          Traditional classes follow a rigid linear calendar regardless of whether you understood week 3.
          Class Royale operates as a closed feedback loop that adapts constantly to your individual mind.
        </p>
      </div>

      {/* 6-Step Visual Pipeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {steps.map((s, idx) => {
          return (
            <div
              key={s.step}
              className="relative rounded-2xl p-6 bg-[#070c20]/80 border border-violet-500/20 hover:border-cyan-400/50 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] transition-all duration-300 backdrop-blur-xl group flex flex-col justify-between"
            >
              {/* Step indicator & icon */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {s.icon}
                    </div>
                    <div>
                      <span className="font-hud text-xs text-zinc-500 font-bold tracking-widest">
                        PHASE {s.step}
                      </span>
                      <h4 className="font-display font-bold text-sm text-white">{s.subtitle}</h4>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    {s.metric}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-base text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {s.title}
                </h3>
                <p className="font-body text-xs text-zinc-400 leading-relaxed">
                  {s.description}
                </p>
              </div>

              {/* Step Connector Indicator */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Autonomous Pipeline</span>
                </span>
                <span>0{idx + 1} / 06</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
