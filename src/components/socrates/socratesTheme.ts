/**
 * Socrates AI Workspace Minimalist Design Tokens
 * File: src/components/socrates/socratesTheme.ts
 *
 * Implements clean, spacious, minimalist dark theme referencing modern ChatGPT/Claude ergonomics.
 */

export const socratesTheme = {
  // Canvas & Base Viewport (Deep charcoal midnight #0d0f12)
  canvas: "bg-[#0d0f12] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-white",

  // Ambient Lighting (Ultra subtle)
  ambientGlowTop: "absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/[0.03] blur-[140px] pointer-events-none",
  ambientGlowBottom: "absolute bottom-0 right-0 w-[400px] h-[300px] bg-blue-600/[0.02] blur-[120px] pointer-events-none",
  techGrid: "absolute inset-0 bg-tech-grid opacity-[0.04] pointer-events-none",

  // Glass Surfaces
  header: "bg-[#0d0f12]/90 backdrop-blur-md border-b border-white/[0.06]",
  sidebar: "bg-[#0d0f12] border-r border-white/[0.08]",
  card: "bg-[#14171d] border border-white/[0.06] hover:border-white/15 transition-all",
  composer: "bg-[#181b21] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] focus-within:border-white/20 transition-all",

  // Message Bubbles (Minimal, uncluttered, no extra small text)
  userBubble: "bg-[#1e2229] border border-white/[0.08] text-zinc-100 rounded-3xl px-5 py-3 text-sm leading-relaxed shadow-sm",
  assistantTurn: "text-zinc-100 leading-relaxed font-sans py-2",

  // Status & Badges
  pillCyan: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-zinc-300 font-sans",
  pillOnline: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-xs font-sans text-emerald-400",
  pillOffline: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/30 border border-rose-500/20 text-xs font-sans text-rose-400",
  offlineBanner: "bg-rose-950/80 border-b border-rose-500/30 px-4 sm:px-6 py-2.5 text-xs text-rose-200",
} as const;
