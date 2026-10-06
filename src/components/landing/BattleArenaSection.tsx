"use client";

import React, { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Swords, Sparkles, CheckCircle, XCircle, Flame, RefreshCw, Zap, ArrowRight, ShieldAlert, Award } from "lucide-react";
import { retroSound } from "@/lib/sound";

interface QuizDuel {
  id: number;
  domain: string;
  opponent: string;
  opponentAvatar: string;
  opponentLevel: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  socraticHint: string;
  xpReward: number;
}

const duelDatabase: QuizDuel[] = [
  {
    id: 1,
    domain: "Algorithms & Trees",
    opponent: "The AVL Minotaur",
    opponentAvatar: "🐂",
    opponentLevel: 24,
    question: "In a balanced AVL tree with N nodes, what is the tight asymptotic upper bound for searching a key?",
    options: [
      { key: "A", text: "O(1) constant time" },
      { key: "B", text: "O(log N) logarithmic time" },
      { key: "C", text: "O(N) linear scan time" },
      { key: "D", text: "O(N log N) linearized sort" },
    ],
    correctAnswer: "B",
    explanation: "Correct! Because an AVL tree strictly enforces a height balance factor of {-1, 0, +1} across every subtree, its height is strictly bounded by ~1.44 log2(N), guaranteeing logarithmic worst-case search.",
    socraticHint: "Remember: AVL trees perform self-balancing rotations upon insertion to prevent degeneration into a linked list.",
    xpReward: 150,
  },
  {
    id: 2,
    domain: "Distributed Systems",
    opponent: "The Consensus Colossus",
    opponentAvatar: "🗿",
    opponentLevel: 28,
    question: "Which distributed consensus protocol partitions node roles into Leader, Follower, and Candidate states?",
    options: [
      { key: "A", text: "Two-Phase Commit (2PC)" },
      { key: "B", text: "Raft Consensus Algorithm" },
      { key: "C", text: "Vector Clocks Protocol" },
      { key: "D", text: "Byzantine Gossip Matrix" },
    ],
    correctAnswer: "B",
    explanation: "Victory! Raft decomposes state machine consensus into leader election, log replication, and safety, utilizing Leader, Follower, and Candidate roles to ensure clarity and fault tolerance.",
    socraticHint: "This protocol was designed at Stanford specifically as an understandable alternative to Paxos.",
    xpReward: 180,
  },
  {
    id: 3,
    domain: "Discrete Mathematics",
    opponent: "The Boolean Sphinx",
    opponentAvatar: "🦁",
    opponentLevel: 22,
    question: "Which mathematical proof framework establishes P(n) for all natural numbers by validating P(0) and proving P(k) ⇒ P(k+1)?",
    options: [
      { key: "A", text: "Mathematical Induction" },
      { key: "B", text: "Pigeonhole Principle" },
      { key: "C", text: "Cantor's Diagonalization" },
      { key: "D", text: "Reductio ad Absurdum" },
    ],
    correctAnswer: "A",
    explanation: "Flawless strike! Mathematical Induction establishes a base case and an inductive domino step, proving the predicate holds across the entire well-ordered set of natural numbers.",
    socraticHint: "Think of setting up a chain reaction like falling dominoes starting from the initial base piece.",
    xpReward: 140,
  },
];

export const BattleArenaSection: React.FC = () => {
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const activeDuel = duelDatabase[currentDuelIndex];

  const handleSelectOption = (key: string) => {
    if (isAnswered) return;

    setSelectedAnswer(key);
    setIsAnswered(true);

    const correct = key === activeDuel.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      retroSound.playCorrect();
      retroSound.playLevelUp();
      setStreak((prev) => prev + 1);
      setTotalXpEarned((prev) => prev + activeDuel.xpReward);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#8b5cf6", "#06b6d4", "#f59e0b"],
      });
    } else {
      retroSound.playWrong();
      setStreak(0);
    }
  };

  const handleNextDuel = () => {
    retroSound.playClick();
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);
    setCurrentDuelIndex((prev) => (prev + 1) % duelDatabase.length);
  };

  return (
    <section id="arena" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-violet-900/15 via-cyan-900/15 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-xs font-hud tracking-widest text-cyan-300">
          <Swords className="w-3.5 h-3.5 text-cyan-400" />
          <span>PROVING GROUNDS</span>
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
          The Battle Arena: <span className="text-gradient-cyan">Test-Drive Live Combat</span>
        </h2>
        <p className="font-body text-base text-zinc-400">
          Every concept in Class Royale is forged in real-time quiz duels. Strike down misconceptions, trigger
          XP combos, and receive instant diagnostic feedback right in your browser.
        </p>
      </div>

      {/* Playable Arena Combat Box */}
      <div className="max-w-3xl mx-auto realm-surface rounded-2xl p-6 sm:p-8 border border-cyan-500/30 shadow-[0_15px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative overflow-hidden">
        {/* Boss Encounter Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          {/* Opponent Info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-red-500/40 flex items-center justify-center text-2xl shadow-inner">
              {activeDuel.opponentAvatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-white">{activeDuel.opponent}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-300 font-semibold">
                  BOSS LV. {activeDuel.opponentLevel}
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">{activeDuel.domain}</span>
            </div>
          </div>

          {/* Player HUD Live Counters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-hud">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{streak}x COMBO</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-hud">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>+{totalXpEarned} XP</span>
            </div>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="py-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>QUESTION {currentDuelIndex + 1} OF {duelDatabase.length}</span>
            <span className="text-amber-400 font-bold">REWARD: +{activeDuel.xpReward} XP</span>
          </div>
          <p className="font-display font-semibold text-lg sm:text-xl text-white leading-relaxed">
            {activeDuel.question}
          </p>
        </div>

        {/* Multiple Choice Options */}
        <div className="space-y-3">
          {activeDuel.options.map((opt) => {
            const isChosen = selectedAnswer === opt.key;
            const isThisCorrect = opt.key === activeDuel.correctAnswer;

            let buttonStyles = "bg-[#080d24]/70 border-white/10 hover:border-cyan-400/50 hover:bg-[#0c1433]";
            if (isAnswered) {
              if (isThisCorrect) {
                buttonStyles = "bg-emerald-950/40 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
              } else if (isChosen && !isThisCorrect) {
                buttonStyles = "bg-red-950/40 border-red-500 text-red-200";
              } else {
                buttonStyles = "opacity-40 border-white/5";
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt.key)}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all duration-200 ${buttonStyles}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-zinc-300">
                    {opt.key}
                  </span>
                  <span className="font-body text-sm font-medium text-white">{opt.text}</span>
                </div>

                {isAnswered && isThisCorrect && (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                {isAnswered && isChosen && !isThisCorrect && (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Debrief Drawer */}
        {isAnswered && (
          <div
            className={`mt-6 p-4 rounded-xl border space-y-3 animate-fade-in ${
              isCorrect
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-100"
                : "bg-red-950/30 border-red-500/40 text-red-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-hud text-xs font-bold flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>CRITICAL STRIKE! +{activeDuel.xpReward} XP AWARDED</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>PARRIED! BOSS STRIKES BACK</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={handleNextDuel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-display font-medium transition-colors"
              >
                <span>Next Duel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="font-body text-xs text-zinc-300 leading-relaxed">
              {activeDuel.explanation}
            </p>
          </div>
        )}

        {/* Socratic Hint Trigger */}
        {!isAnswered && (
          <div className="mt-4 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setShowHint(!showHint);
                retroSound.playClick();
              }}
              className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showHint ? "Hide Socratic Hint" : "Request Socratic Hint from CR"}</span>
            </button>
            <span className="text-zinc-500 font-mono text-[11px]">Instant live feedback</span>
          </div>
        )}

        {showHint && !isAnswered && (
          <div className="mt-3 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs font-mono text-cyan-200">
            💡 CR Socratic Hint: {activeDuel.socraticHint}
          </div>
        )}

        {/* Footer Link to Full Arena */}
        <div className="mt-8 pt-5 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-zinc-400 font-mono">Ready for competitive multiplayer ranked duels?</span>
          <Link
            href="/register"
            onClick={() => retroSound.playLevelUp()}
            className="font-display font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            <span>Enter Ranked Arena</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
