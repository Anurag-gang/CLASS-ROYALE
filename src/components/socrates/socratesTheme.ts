/**
 * Socrates AI Workspace Glassmorphism Design Tokens
 * File: src/components/socrates/socratesTheme.ts
 *
 * Implements strict Blue-Black Glassmorphism visual tokens for full-screen Socrates workspace.
 */

export const socratesTheme = {
  // Canvas & Base Viewport (Deep obsidian blue-black)
  canvas: "bg-[#02040a] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-white",

  // Ambient Lighting & Background
  ambientGlowTop: "absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-sky-500/5 to-transparent blur-[120px] pointer-events-none",
  ambientGlowBottom: "absolute bottom-0 right-0 w-[500px] h-[350px] bg-blue-600/5 blur-[100px] pointer-events-none",
  techGrid: "absolute inset-0 bg-tech-grid opacity-15 pointer-events-none",

  // Glass Surfaces
  header: "bg-[#040814]/80 backdrop-blur-xl border-b border-white/[0.08]",
  sidebar: "bg-[#060a14]/95 md:bg-[#060a14]/85 backdrop-blur-2xl border-r border-white/[0.08]",
  card: "bg-[#080d1a]/60 backdrop-blur-xl border border-white/[0.06] hover:border-cyan-500/20 transition-all",
  composer: "bg-[#070c18]/85 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.1)] focus-within:border-cyan-400/50 focus-within:shadow-[0_0_35px_rgba(6,182,212,0.2)] transition-all",

  // Message Bubbles
  userBubble: "bg-cyan-500/10 border border-cyan-500/30 text-cyan-50 backdrop-blur-md rounded-2xl rounded-tr-sm px-4 py-3 shadow-[0_2px_12px_rgba(6,182,212,0.1)]",
  assistantTurn: "bg-[#080d1a]/60 border border-white/[0.06] backdrop-blur-xl rounded-2xl px-5 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)]",

  // Status & Badges
  pillCyan: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0a1122]/80 border border-cyan-500/20 text-xs font-mono text-cyan-300",
  pillOnline: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs font-mono text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  pillOffline: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-xs font-mono text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
  offlineBanner: "bg-gradient-to-r from-rose-950/80 via-[#190812]/90 to-amber-950/70 backdrop-blur-xl border-b border-rose-500/30 px-4 sm:px-6 py-2.5 shadow-[0_4px_20px_rgba(244,63,94,0.12)]",
} as const;
