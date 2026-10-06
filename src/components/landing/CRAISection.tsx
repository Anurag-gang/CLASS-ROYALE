"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Brain, Sparkles, MessageSquare, Terminal, HelpCircle, Flame, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { retroSound } from "@/lib/sound";

type CRMode = "tutor" | "quiz" | "exam" | "revision" | "diagnostic";

interface ModeDetail {
  id: CRMode;
  name: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  sampleStudentQuery: string;
  sampleCRResponse: {
    intent: string;
    thoughtTrace: string;
    socraticGuidance: string;
    followUpPrompt: string;
  };
}

const crModes: ModeDetail[] = [
  {
    id: "tutor",
    name: "Socratic Sage Tutor",
    badge: "SOCRATIC INQUIRY",
    icon: <Brain className="w-4 h-4 text-violet-400" />,
    description: "Never leaks raw answers. Asks targeted, diagnostic questions that scaffold the student toward their own deductive breakthrough.",
    sampleStudentQuery: "Why does Dijkstra's algorithm fail when a graph has negative edge weights?",
    sampleCRResponse: {
      intent: "Algorithmic Invariant Clarification // Graph Theory",
      thoughtTrace: "Student misunderstands the greedy choice property. Do not provide Bellman-Ford code yet. Guide them to consider when the shortest distance to a vertex is permanently finalized.",
      socraticGuidance:
        "Consider Dijkstra's core greedy invariant: once a vertex is extracted from the priority queue and marked 'visited', its shortest distance from the source is assumed to be finalized.\n\nNow imagine a 3-node graph: S → A with weight 5, S → B with weight 2, and B → A with weight -4.\n\nWhich path will Dijkstra visit first, and what happens to vertex A's distance after B is relaxed?",
      followUpPrompt: "What fundamental assumption of greedy algorithms is violated when edge weights can be negative?",
    },
  },
  {
    id: "quiz",
    name: "Dynamic Quiz Master",
    badge: "PROCEDURAL DUELS",
    icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    description: "Synthesizes fresh, adversarial university-level challenge problems mapped directly to your current knowledge gaps.",
    sampleStudentQuery: "Quiz me on cache coherence protocols and false sharing in multi-threaded C++.",
    sampleCRResponse: {
      intent: "Evaluative Challenge Generation // Concurrency",
      thoughtTrace: "Student requested advanced concurrency test. Focus on MESI protocol invalidation queues and cache line padding.",
      socraticGuidance:
        "⚔️ CHALLENGE ENCOUNTER: Two threads run on distinct cores, each repeatedly incrementing adjacent 64-bit integers stored contiguously in the same struct on a standard x86-64 CPU.\n\nEven though neither thread writes to the other's variable, their throughput drops by 90%.\n\n1. What hardware phenomenon is occurring?\n2. What is the standard byte-alignment padding required to resolve this?",
      followUpPrompt: "Select your defense: [A] Deadlock [B] False Sharing [C] Memory Leak [D] Atomic Tear",
    },
  },
  {
    id: "exam",
    name: "Midterm Exam Simulator",
    badge: "RIGOROUS EVALUATION",
    icon: <Terminal className="w-4 h-4 text-amber-400" />,
    description: "Simulates time-pressured university midterm exams with strict academic rubric scoring and conceptual gap breakdowns.",
    sampleStudentQuery: "Prepare me for the CS204 Discrete Math Midterm on structural induction.",
    sampleCRResponse: {
      intent: "Midterm Simulation // Proof Rigor",
      thoughtTrace: "Targeting structural induction on recursively defined binary trees. Enforcing base case, inductive hypothesis, and inductive step rubric.",
      socraticGuidance:
        "PROVE: For every full binary tree T, the number of leaf nodes L(T) equals the number of internal nodes I(T) + 1.\n\nStep 1: State the minimal base case (single vertex tree) and verify.\nStep 2: State your inductive hypothesis for subtrees T1 and T2.\nStep 3: Construct T by attaching root r to T1 and T2, and demonstrate the inductive step.",
      followUpPrompt: "Submit your base case and inductive hypothesis to receive line-by-line rubric scoring.",
    },
  },
  {
    id: "revision",
    name: "Intuition Synthesizer",
    badge: "MENTAL MODELS",
    icon: <HelpCircle className="w-4 h-4 text-emerald-400" />,
    description: "Transforms dense, esoteric mathematical notation into vivid mechanical metaphors and intuition bridges.",
    sampleStudentQuery: "Explain the Raft consensus algorithm like I am a first-year student.",
    sampleCRResponse: {
      intent: "Intuitive Schema Deconstruction // Distributed Systems",
      thoughtTrace: "Abstract away state machine replication into an elected town council where only one leader can write down laws in a shared ledger.",
      socraticGuidance:
        "Imagine a team of 5 librarians who must keep identical record books, but messages between them can get delayed or lost.\n\nTo prevent chaos, they elect one 'Chief Librarian' (Leader) via a majority vote. When a town citizen requests a record entry, ONLY the Chief accepts it, writes a draft, and sends carbon copies to all 4 assistants. Once 3 out of 5 have copied it, the law is officially committed.",
      followUpPrompt: "What happens if the Chief Librarian suddenly disconnects from the telephone line?",
    },
  },
  {
    id: "diagnostic",
    name: "Cognitive Diagnostics",
    badge: "GAP ISOLATION",
    icon: <Cpu className="w-4 h-4 text-fuchsia-400" />,
    description: "Continuously tracks your error patterns across duels to map out your exact cognitive deficits before exams arrive.",
    sampleStudentQuery: "Analyze my recent quiz mistakes in Algorithms.",
    sampleCRResponse: {
      intent: "Metacognitive Deficit Analysis // Performance Vector",
      thoughtTrace: "Aggregated user attempts across 18 quests in Chapter 4. Notice persistent confusion between BFS queue ordering vs DFS recursion stack on directed cyclic graphs.",
      socraticGuidance:
        "📊 DIAGNOSTIC MATRIX:\n• Dynamic Programming: 94% Mastery (High)\n• Binary Search Trees: 88% Mastery (Solid)\n• Graph Cycle Detection: 52% Deficit Detected ⚠️\n\nPattern Isolated: In 3 recent duels, you applied BFS where topological sort cycle detection was required. BFS does not naturally identify back-edges in directed graphs without vertex coloration (White/Gray/Black).",
      followUpPrompt: "Recommended Remedy: 3 targeted micro-duels on 'Three-Color DFS Cycle Detection' (+180 XP).",
    },
  },
];

export const CRAISection: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<CRMode>("tutor");

  const currentMode = crModes.find((m) => m.id === selectedMode) || crModes[0];

  return (
    <section id="cr-ai" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background aura */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/10 blur-[150px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-xs font-hud tracking-widest text-violet-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
          <span>AUTONOMOUS COGNITIVE AGENT</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          Meet CR: Your Autonomous <br />
          <span className="text-gradient-violet">Socratic AI Co-Pilot</span>
        </h2>
        <p className="font-body text-base text-zinc-400">
          Not another generic chatbot. CR is an education-engineered learning companion integrated with OpenRouter
          that understands university curricula, pinpoints mental model flaws, and guides you toward true mastery.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
        {crModes.map((mode) => {
          const isActive = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setSelectedMode(mode.id);
                retroSound.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-violet-400"
                  : "bg-[#0b0f24]/80 text-zinc-400 hover:text-white hover:bg-[#121938] border border-violet-500/20"
              }`}
            >
              {mode.icon}
              <span>{mode.name}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive CR Console Showcase */}
      <div className="max-w-4xl mx-auto realm-surface rounded-2xl border border-violet-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden">
        {/* Terminal Window Header Bar */}
        <div className="px-6 py-4 bg-[#050816] border-b border-violet-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="font-hud text-xs font-bold text-white tracking-wider">CR AI ORCHESTRATOR</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                {currentMode.badge}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MODEL: OPENROUTER / MULTI-LLM</span>
          </div>
        </div>

        {/* Console Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Mode Description Banner */}
          <div className="p-3.5 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs font-body text-zinc-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <span>{currentMode.description}</span>
            </div>
            <span className="font-mono text-violet-400 shrink-0 hidden sm:inline">Active Routine</span>
          </div>

          {/* Student Query Bubble */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-400/40 flex items-center justify-center font-hud text-xs text-violet-300 shrink-0">
              ST
            </div>
            <div className="flex-1 bg-[#090f29]/90 border border-violet-500/20 rounded-2xl rounded-tl-sm p-4 text-sm font-body text-zinc-200">
              <div className="text-[11px] font-mono text-zinc-400 mb-1 flex items-center justify-between">
                <span>Student Inquiry // CS201</span>
                <span>Just now</span>
              </div>
              <p className="font-medium text-white">{currentMode.sampleStudentQuery}</p>
            </div>
          </div>

          {/* CR Agent Internal Cognitive Trace */}
          <div className="ml-12 p-3.5 rounded-xl bg-[#040612] border border-cyan-500/20 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 pb-1 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>INTENT: {currentMode.sampleCRResponse.intent}</span>
              </div>
              <span className="text-zinc-500">Latency: 142ms</span>
            </div>
            <div className="text-zinc-400 italic">
              🧠 Pedagogical Reasoning: &ldquo;{currentMode.sampleCRResponse.thoughtTrace}&rdquo;
            </div>
          </div>

          {/* CR Socratic Response Bubble */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 p-[1px] shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <div className="w-full h-full bg-[#080d21] rounded-[11px] flex items-center justify-center font-hud text-xs text-cyan-300 font-bold">
                CR
              </div>
            </div>
            <div className="flex-1 bg-[#061226]/80 border border-cyan-500/30 rounded-2xl rounded-tl-sm p-5 text-sm font-body text-zinc-200 space-y-4">
              <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-between">
                <span>CR Socratic Response</span>
                <span className="text-emerald-400 font-semibold">Verified Curriculum Match</span>
              </div>

              <div className="whitespace-pre-line text-zinc-200 leading-relaxed font-body">
                {currentMode.sampleCRResponse.socraticGuidance}
              </div>

              {/* Socratic Prompt Callout */}
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block mb-0.5">Socratic Checkpoint:</span>
                  <span>{currentMode.sampleCRResponse.followUpPrompt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Console Action Bar */}
        <div className="px-6 py-4 bg-[#050816] border-t border-violet-500/20 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-mono text-zinc-400">
            Integrated across every quest, arena duel, and exam review.
          </span>
          <Link
            href="/register"
            onClick={() => retroSound.playLevelUp()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-display text-xs font-semibold hover:from-violet-500 hover:to-cyan-400 transition-all shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Launch Live CR Session</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};
