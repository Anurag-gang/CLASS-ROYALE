// =============================================================================
// KNOWLEDGE KINGDOM: Theme Tokens & UI Styling Architecture
// Module: src/lib/realms/themeTokens.ts
//
// 80% Modern Academic Learning Platform + 20% Fantasy RPG Flourishes
// =============================================================================

export interface RealmTheme {
  slug: string;
  courseCode: string;
  academicRealm: string;
  rpgIdentity: string;
  accentHex: string;
  accentRgb: string;
  accentLightHex: string;
  surfaceBg: string;
  borderSubtle: string;
  borderAccent: string;
  glowShadow: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  progressGradient: string;
  iconName: string;
}

export const REALM_THEMES: Record<string, RealmTheme> = {
  "data-structures-and-algorithms": {
    slug: "data-structures-and-algorithms",
    courseCode: "CS-201",
    academicRealm: "Algorithmic Citadel",
    rpgIdentity: "Gates of Recursion, Citadel Spires",
    accentHex: "#de1659",
    accentRgb: "222, 22, 89",
    accentLightHex: "#fb7185",
    surfaceBg: "rgba(222, 22, 89, 0.08)",
    borderSubtle: "rgba(222, 22, 89, 0.2)",
    borderAccent: "rgba(222, 22, 89, 0.5)",
    glowShadow: "0 0 25px -5px rgba(222, 22, 89, 0.3)",
    badgeBg: "bg-rose-950/70",
    badgeText: "text-rose-300",
    badgeBorder: "border-rose-500/40",
    progressGradient: "from-rose-500 to-crimson-600",
    iconName: "GitFork",
  },
  "database-management-systems": {
    slug: "database-management-systems",
    courseCode: "CS-202",
    academicRealm: "Relational Vault",
    rpgIdentity: "Vault of Lore, Query Crucible",
    accentHex: "#3b82f6",
    accentRgb: "59, 130, 246",
    accentLightHex: "#60a5fa",
    surfaceBg: "rgba(59, 130, 246, 0.08)",
    borderSubtle: "rgba(59, 130, 246, 0.2)",
    borderAccent: "rgba(59, 130, 246, 0.5)",
    glowShadow: "0 0 25px -5px rgba(59, 130, 246, 0.3)",
    badgeBg: "bg-blue-950/70",
    badgeText: "text-blue-300",
    badgeBorder: "border-blue-500/40",
    progressGradient: "from-blue-500 to-indigo-600",
    iconName: "Database",
  },
  "operating-systems": {
    slug: "operating-systems",
    courseCode: "CS-203",
    academicRealm: "Kernel Keep",
    rpgIdentity: "Core Kernel Keep, Thread Bastion",
    accentHex: "#8b5cf6",
    accentRgb: "139, 92, 246",
    accentLightHex: "#a78bfa",
    surfaceBg: "rgba(139, 92, 246, 0.08)",
    borderSubtle: "rgba(139, 92, 246, 0.2)",
    borderAccent: "rgba(139, 92, 246, 0.5)",
    glowShadow: "0 0 25px -5px rgba(139, 92, 246, 0.3)",
    badgeBg: "bg-purple-950/70",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/40",
    progressGradient: "from-purple-500 to-violet-600",
    iconName: "Cpu",
  },
  "computer-networks": {
    slug: "computer-networks",
    courseCode: "CS-204",
    academicRealm: "Network Nexus",
    rpgIdentity: "Wirelands Nexus, Protocol Spire",
    accentHex: "#06b6d4",
    accentRgb: "6, 182, 212",
    accentLightHex: "#22d3ee",
    surfaceBg: "rgba(6, 182, 212, 0.08)",
    borderSubtle: "rgba(6, 182, 212, 0.2)",
    borderAccent: "rgba(6, 182, 212, 0.5)",
    glowShadow: "0 0 25px -5px rgba(6, 182, 212, 0.3)",
    badgeBg: "bg-cyan-950/70",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/40",
    progressGradient: "from-cyan-500 to-teal-600",
    iconName: "Network",
  },
  "ai-and-machine-learning": {
    slug: "ai-and-machine-learning",
    courseCode: "CS-301",
    academicRealm: "Neural Sanctum",
    rpgIdentity: "Tensor Tower, Latent Arena",
    accentHex: "#10b981",
    accentRgb: "16, 185, 129",
    accentLightHex: "#34d399",
    surfaceBg: "rgba(16, 185, 129, 0.08)",
    borderSubtle: "rgba(16, 185, 129, 0.2)",
    borderAccent: "rgba(16, 185, 129, 0.5)",
    glowShadow: "0 0 25px -5px rgba(16, 185, 129, 0.3)",
    badgeBg: "bg-emerald-950/70",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    progressGradient: "from-emerald-500 to-green-600",
    iconName: "Brain",
  },
  "web-dev-and-devops": {
    slug: "web-dev-and-devops",
    courseCode: "CS-302",
    academicRealm: "Cloud Spire Bastion",
    rpgIdentity: "Cloud Spire, Gateway of Deployments",
    accentHex: "#f59e0b",
    accentRgb: "245, 158, 11",
    accentLightHex: "#fbbf24",
    surfaceBg: "rgba(245, 158, 11, 0.08)",
    borderSubtle: "rgba(245, 158, 11, 0.2)",
    borderAccent: "rgba(245, 158, 11, 0.5)",
    glowShadow: "0 0 25px -5px rgba(245, 158, 11, 0.3)",
    badgeBg: "bg-amber-950/70",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/40",
    progressGradient: "from-amber-500 to-yellow-600",
    iconName: "Cloud",
  },
};

// Aliases lookup map mapping realm slugs and course codes to canonical themes
const SLUG_ALIASES: Record<string, string> = {
  "algorithmic-citadel": "data-structures-and-algorithms",
  "cs-201": "data-structures-and-algorithms",
  "relational-vault": "database-management-systems",
  "cs-202": "database-management-systems",
  "kernel-keep": "operating-systems",
  "cs-203": "operating-systems",
  "network-nexus": "computer-networks",
  "cs-204": "computer-networks",
  "neural-sanctum": "ai-and-machine-learning",
  "cs-301": "ai-and-machine-learning",
  "cloud-spire-bastion": "web-dev-and-devops",
  "cs-302": "web-dev-and-devops",
};

export function getRealmTheme(slugOrCode: string): RealmTheme {
  if (!slugOrCode) return REALM_THEMES["operating-systems"];
  const normalized = slugOrCode.trim().toLowerCase();
  
  if (REALM_THEMES[normalized]) {
    return REALM_THEMES[normalized];
  }

  const aliasTarget = SLUG_ALIASES[normalized];
  if (aliasTarget && REALM_THEMES[aliasTarget]) {
    return REALM_THEMES[aliasTarget];
  }

  return REALM_THEMES["operating-systems"];
}

// -----------------------------------------------------------------------------
// Level Node Progression Styling (Duolingo-inspired 7-level journey)
// -----------------------------------------------------------------------------
export type LevelNodeState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "PERFECT_MASTERY";

export interface LevelNodeVisualConfig {
  containerClass: string;
  iconClass: string;
  badgeClass: string;
  starColor: string;
  glowClass: string;
  pulse: boolean;
}

export function getLevelNodeVisualConfig(
  state: LevelNodeState,
  realmSlug: string,
  isBoss: boolean = false
): LevelNodeVisualConfig {
  const theme = getRealmTheme(realmSlug);

  if (isBoss) {
    if (state === "PERFECT_MASTERY" || state === "COMPLETED") {
      return {
        containerClass: "bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-400 text-amber-300 shadow-2xl scale-110",
        iconClass: "text-amber-300",
        badgeClass: "bg-amber-400 text-slate-950 font-bold",
        starColor: "text-amber-300 fill-amber-300",
        glowClass: "shadow-[0_0_30px_rgba(245,158,11,0.4)]",
        pulse: false,
      };
    }
    if (state === "AVAILABLE" || state === "IN_PROGRESS") {
      return {
        containerClass: "bg-slate-900/95 border-2 border-rose-500 text-rose-300 shadow-2xl scale-110 ring-2 ring-rose-500/40",
        iconClass: "text-rose-400",
        badgeClass: "bg-rose-950 text-rose-300 border border-rose-500/50",
        starColor: "text-slate-600",
        glowClass: "shadow-[0_0_25px_rgba(244,63,94,0.35)]",
        pulse: true,
      };
    }
  }

  switch (state) {
    case "LOCKED":
      return {
        containerClass: "bg-slate-900/60 border border-slate-800 text-slate-600 opacity-60 cursor-not-allowed",
        iconClass: "text-slate-600",
        badgeClass: "bg-slate-800/80 text-slate-500 border border-slate-700/50",
        starColor: "text-slate-700",
        glowClass: "",
        pulse: false,
      };

    case "AVAILABLE":
    case "IN_PROGRESS":
      return {
        containerClass: "bg-slate-900/95 border-2 text-white hover:scale-105 transition-all duration-300 shadow-xl cursor-pointer ring-2 ring-offset-2 ring-offset-[#0b0f19]",
        iconClass: "text-white",
        badgeClass: `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} border font-semibold`,
        starColor: "text-slate-600",
        glowClass: `shadow-[0_0_20px_rgba(${theme.accentRgb},0.35)]`,
        pulse: true,
      };

    case "COMPLETED":
      return {
        containerClass: "bg-slate-900/90 border border-slate-700 text-slate-200 hover:border-slate-500 cursor-pointer transition-all duration-200",
        iconClass: theme.badgeText,
        badgeClass: `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} border font-semibold`,
        starColor: "text-amber-400 fill-amber-400",
        glowClass: `shadow-[0_0_12px_rgba(${theme.accentRgb},0.2)]`,
        pulse: false,
      };

    case "PERFECT_MASTERY":
      return {
        containerClass: "bg-gradient-to-b from-slate-900 to-amber-950/20 border-2 border-amber-400/90 text-amber-200 shadow-2xl hover:scale-105 transition-all duration-300 ring-1 ring-amber-400/50",
        iconClass: "text-amber-300",
        badgeClass: "bg-amber-950/80 text-amber-300 border border-amber-400/50 font-bold",
        starColor: "text-amber-300 fill-amber-300",
        glowClass: "shadow-[0_0_25px_rgba(245,158,11,0.35)]",
        pulse: false,
      };
  }
}

// -----------------------------------------------------------------------------
// Authoritative 35s Server Timer Visual States
// -----------------------------------------------------------------------------
export type TimerVisualPhase = "normal" | "warning" | "critical";

export interface TimerVisualConfig {
  phase: TimerVisualPhase;
  colorClass: string;
  bgSurfaceClass: string;
  borderClass: string;
  barGradient: string;
  pulseClass: string;
  glowClass: string;
  iconClass: string;
  hintStatusLabel: string;
}

export function getTimerVisualConfig(
  secondsRemaining: number,
  _totalSeconds: number = 35
): TimerVisualConfig {
  if (secondsRemaining > 20) {
    return {
      phase: "normal",
      colorClass: "text-cyan-400",
      bgSurfaceClass: "bg-cyan-950/20",
      borderClass: "border-cyan-500/30",
      barGradient: "from-cyan-500 to-teal-400",
      pulseClass: "",
      glowClass: "shadow-[0_0_10px_rgba(6,182,212,0.15)]",
      iconClass: "text-cyan-400",
      hintStatusLabel: `Hint unlocks in ${Math.max(0, secondsRemaining - 15)}s`,
    };
  }

  if (secondsRemaining > 10) {
    return {
      phase: "warning",
      colorClass: "text-amber-400 font-semibold",
      bgSurfaceClass: "bg-amber-950/25",
      borderClass: "border-amber-500/40",
      barGradient: "from-amber-500 to-yellow-400",
      pulseClass: "",
      glowClass: "shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      iconClass: "text-amber-400",
      hintStatusLabel: "💡 Hint Available",
    };
  }

  return {
    phase: "critical",
    colorClass: "text-rose-400 font-bold animate-pulse",
    bgSurfaceClass: "bg-rose-950/40",
    borderClass: "border-rose-500/60",
    barGradient: "from-rose-500 to-red-600",
    pulseClass: "animate-pulse",
    glowClass: "shadow-[0_0_20px_rgba(244,63,94,0.4)]",
    iconClass: "text-rose-400 animate-bounce",
    hintStatusLabel: "Critical Time",
  };
}

// -----------------------------------------------------------------------------
// Active Quiz Option Card Visual States
// -----------------------------------------------------------------------------
export interface OptionCardParams {
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrect?: boolean;
  isWrongSelection?: boolean;
}

export function getOptionCardStyle({
  isSelected,
  isSubmitted,
  isCorrect,
  isWrongSelection,
}: OptionCardParams): { cardClass: string; badgeClass: string } {
  if (!isSubmitted) {
    if (isSelected) {
      return {
        cardClass: "bg-slate-900/90 border-2 border-cyan-400 ring-2 ring-cyan-400/20 text-white shadow-lg",
        badgeClass: "bg-cyan-400 text-slate-950 font-bold",
      };
    }
    return {
      cardClass: "bg-slate-900/70 border border-slate-800 hover:border-slate-600 hover:bg-slate-850 text-slate-200 transition-all",
      badgeClass: "bg-slate-800 text-slate-300 border border-slate-700",
    };
  }

  if (isCorrect) {
    return {
      cardClass: "bg-emerald-950/50 border-2 border-emerald-500 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      badgeClass: "bg-emerald-500 text-slate-950 font-bold",
    };
  }

  if (isWrongSelection) {
    return {
      cardClass: "bg-rose-950/50 border-2 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]",
      badgeClass: "bg-rose-500 text-white font-bold",
    };
  }

  return {
    cardClass: "bg-slate-950/40 border border-slate-800/60 text-slate-500 opacity-50",
    badgeClass: "bg-slate-900 text-slate-600 border border-slate-800",
  };
}
