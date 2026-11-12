"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Swords,
  Shield,
  Heart,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Trophy,
  Zap,
  BookOpen,
  ChevronRight,
  Skull,
} from "lucide-react";
import { Question, QuestionVerificationResult, DifficultyLevel } from "@/types/quiz";
import { retroSound } from "@/lib/sound";

interface BattleArenaEngineProps {
  subjectSlug: string;
  subjectName: string;
  territoryName: string;
  difficulty?: DifficultyLevel | "ALL";
  onExit?: () => void;
}

export function BattleArenaEngine({
  subjectSlug,
  subjectName,
  territoryName,
  difficulty = "ALL",
  onExit,
}: BattleArenaEngineProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Battle Combat State
  const [hp, setHp] = useState(100);
  const [comboStreak, setComboStreak] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Per-Question State
  const [selectedOptionId, setSelectedOptionId] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [verification, setVerification] = useState<QuestionVerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Timer
  const [secondsLeft, setSecondsLeft] = useState(45);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Battle Over State
  const [battleFinished, setBattleFinished] = useState(false);
  const [isVictory, setIsVictory] = useState(false);

  // 1. Fetch Questions for this Subject Territory
  useEffect(() => {
    async function loadQuestions() {
      setLoading(true);
      try {
        const url = `/api/questions?subject=${encodeURIComponent(subjectSlug)}&difficulty=${difficulty}&limit=10`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success && data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setSecondsLeft(data.questions[0].time_limit_seconds || 45);
        }
      } catch (err) {
        console.error("Failed to load battle questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [subjectSlug, difficulty]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loading || isAnswered || battleFinished || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isAnswered, battleFinished, currentIndex, questions]);

  // Time Out Handler
  const handleTimeOut = useCallback(async () => {
    if (isAnswered) return;
    setIsAnswered(true);
    retroSound.playWrong();

    const currQ = questions[currentIndex];
    const damage = currQ.difficulty === "Boss" ? 35 : currQ.difficulty === "Hard" ? 25 : 15;

    setHp((prev) => Math.max(0, prev - damage));
    setComboStreak(0);

    setVerification({
      questionId: currQ.id,
      isCorrect: false,
      selectedOptionId: "A",
      correctOptionId: "A", // Placeholder until verified
      explanation: "Time Expired! In the heat of battle, hesitating against algorithms yields damage. " + currQ.explanation,
      xpEarned: 0,
      streakMultiplier: 1.0,
      damageTaken: damage,
    });
  }, [currentIndex, isAnswered, questions]);

  // 3. Option Selection & Answer Verification
  const handleOptionSelect = async (optionId: "A" | "B" | "C" | "D") => {
    if (isAnswered || verifying) return;
    setSelectedOptionId(optionId);
    setVerifying(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const currQ = questions[currentIndex];

    try {
      const res = await fetch("/api/questions/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currQ.id,
          selectedOptionId: optionId,
          comboStreak: comboStreak + 1,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        const vResult: QuestionVerificationResult = data.result;
        setVerification(vResult);
        setIsAnswered(true);

        if (vResult.isCorrect) {
          retroSound.playCorrect();
          const newCombo = comboStreak + 1;
          setComboStreak(newCombo);
          if (newCombo > maxCombo) setMaxCombo(newCombo);
          setTotalXpEarned((prev) => prev + vResult.xpEarned);
          setCorrectAnswersCount((prev) => prev + 1);
        } else {
          retroSound.playWrong();
          setComboStreak(0);
          const damage = vResult.damageTaken || 15;
          setHp((prev) => {
            const nextHp = Math.max(0, prev - damage);
            if (nextHp <= 0) {
              setTimeout(() => finishBattle(false), 1500);
            }
            return nextHp;
          });
        }
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnswered || verifying || battleFinished) return;
      const key = e.key.toUpperCase();
      if (key === "A" || key === "1") handleOptionSelect("A");
      else if (key === "B" || key === "2") handleOptionSelect("B");
      else if (key === "C" || key === "3") handleOptionSelect("C");
      else if (key === "D" || key === "4") handleOptionSelect("D");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, verifying, battleFinished, currentIndex, questions, comboStreak]);

  // 4. Advance to Next Question or Finish
  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsAnswered(false);
      setSelectedOptionId(null);
      setVerification(null);
      setSecondsLeft(questions[nextIdx]?.time_limit_seconds || 45);
      retroSound.playClick();
    } else {
      finishBattle(true);
    }
  };

  // 5. Finish Battle (Victory or Defeat)
  const finishBattle = (won: boolean) => {
    setBattleFinished(true);
    setIsVictory(won);

    if (won) {
      retroSound.playLevelUp();
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#de1659", "#06b6d4", "#10b981", "#fbbf24"],
        });
      } catch {}
    } else {
      retroSound.playWrong();
    }
  };

  // Restart Battle
  const handleRestart = () => {
    setCurrentIndex(0);
    setHp(100);
    setComboStreak(0);
    setMaxCombo(0);
    setTotalXpEarned(0);
    setCorrectAnswersCount(0);
    setIsAnswered(false);
    setSelectedOptionId(null);
    setVerification(null);
    setBattleFinished(false);
    setIsVictory(false);
    setSecondsLeft(questions[0]?.time_limit_seconds || 45);
    retroSound.playClick();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        <div className="font-inter text-xs text-cyan-400 font-medium animate-pulse tracking-wide">
          Summoning Territory Guardians...
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-5 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h2 className="font-condensed font-black text-2xl text-white">No active trials found for this realm.</h2>
        <p className="font-inter text-xs text-zinc-400 max-w-md">
          The guardians in this territory have retreated. Return to the Territory Map to select another realm.
        </p>
        <Link href="/arena" className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-inter font-semibold text-xs">
          Return to Arena
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // BATTLE FINISHED SCREEN (VICTORY / DEFEAT)
  // ---------------------------------------------------------------------------
  if (battleFinished) {
    const accuracy = Math.round((correctAnswersCount / questions.length) * 100);
    const perfectRun = correctAnswersCount === questions.length;

    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#090d24]/95 border-2 border-violet-500/30 backdrop-blur-2xl shadow-2xl space-y-8 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
            {isVictory ? (perfectRun ? "👑" : "🏆") : "💀"}
          </div>

          <span className="font-inter font-semibold text-xs text-cyan-400 tracking-wider uppercase">
            {territoryName}
          </span>

          <h2 className="font-condensed font-black text-4xl sm:text-5xl uppercase tracking-tight text-white">
            {isVictory ? (perfectRun ? "FLAWLESS CONQUEST!" : "TERRITORY CONQUERED!") : "DEFEAT IN BATTLE"}
          </h2>

          <p className="font-inter text-sm text-zinc-400 max-w-md mx-auto">
            {isVictory
              ? `You have vanquished the knowledge golems of ${subjectName} and claimed territorial glory.`
              : `Your defenses collapsed in ${territoryName}. Regroup, study the Socratic transcripts, and re-engage.`}
          </p>
        </div>

        {/* Battle Stats Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="block font-inter text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">TOTAL XP</span>
            <span className="font-mono font-black text-xl text-amber-300">+{totalXpEarned}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="block font-inter text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">ACCURACY</span>
            <span className="font-mono font-black text-xl text-cyan-300">{accuracy}%</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="block font-inter text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">MAX COMBO</span>
            <span className="font-mono font-black text-xl text-pink-400">{maxCombo}x</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <span className="block font-inter text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">REMAINING HP</span>
            <span className={`font-mono font-black text-xl ${hp > 30 ? "text-emerald-400" : "text-red-400"}`}>
              {hp}/100
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <button
            onClick={handleRestart}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-inter font-semibold text-xs tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            BATTLE AGAIN
          </button>

          <Link
            href="/arena"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-inter font-semibold text-xs tracking-wider hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <Swords className="w-4 h-4" />
            TERRITORY MAP
          </Link>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-inter font-semibold text-xs tracking-wider hover:bg-cyan-950/60 transition-colors flex items-center justify-center gap-2"
          >
            DASHBOARD
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // ACTIVE BATTLE TRIAL VIEW
  // ---------------------------------------------------------------------------
  const currentQ = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const timeProgress = Math.round((secondsLeft / (currentQ.time_limit_seconds || 45)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. TOP COMBAT HUD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090d24]/90 border border-violet-500/30 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Territory & Question Counter */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-inter text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/40">
              {territoryName}
            </span>
            <span
              className={`font-inter text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                currentQ.difficulty === "Boss"
                  ? "bg-red-950/80 text-red-300 border-red-500/50"
                  : currentQ.difficulty === "Hard"
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                  : "bg-cyan-950/80 text-cyan-300 border-cyan-500/50"
              }`}
            >
              {currentQ.difficulty.toUpperCase()} TRIAL
            </span>
          </div>
          <span className="font-inter text-xs text-zinc-400 block pt-0.5">
            Encounter <strong className="text-white font-mono">{currentIndex + 1}</strong> of <span className="font-mono">{questions.length}</span>
          </span>
        </div>

        {/* Center: HP & Shield Gauge */}
        <div className="flex items-center gap-3">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-1.5 justify-end text-xs font-mono font-bold text-red-400">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
              <span>{hp} HP</span>
            </div>
            <div className="w-28 sm:w-36 h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  hp > 50 ? "bg-emerald-500" : hp > 25 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${hp}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Combo Multiplier & Live XP */}
        <div className="flex items-center gap-3">
          {comboStreak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/40 text-amber-300 font-inter font-bold text-xs animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{comboStreak}x COMBO</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>+{totalXpEarned} XP</span>
          </div>
        </div>
      </div>

      {/* 2. TIMER & ENCOUNTER PROGRESS BAR */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className={`w-3.5 h-3.5 ${secondsLeft <= 10 ? "text-red-400 animate-pulse" : "text-cyan-400"}`} />
            <strong className={secondsLeft <= 10 ? "text-red-400 font-bold" : "text-white"}>
              {secondsLeft}s
            </strong>{" "}
            remaining
          </span>
          <span>Progress: {progressPercent}%</span>
        </div>

        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsLeft <= 10 ? "bg-red-500" : "bg-gradient-to-r from-cyan-500 to-violet-500"
            }`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>
      </div>

      {/* 3. QUESTION CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#070b1e]/90 border border-violet-500/25 backdrop-blur-2xl shadow-2xl space-y-6">
        {/* Question Header & Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {currentQ.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-400"
            >
              #{tag}
            </span>
          ))}
          <span className="ml-auto font-mono text-xs text-amber-400 font-semibold">
            Reward: +{currentQ.xp_reward} XP
          </span>
        </div>

        {/* Question Text */}
        <h3 className="font-condensed font-bold text-xl sm:text-2xl text-white leading-relaxed">
          {currentQ.question_text}
        </h3>

        {/* Code Snippet if applicable */}
        {currentQ.code_snippet && (
          <div className="p-4 rounded-xl bg-black/70 border border-white/10 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto shadow-inner">
            <pre>
              <code>{currentQ.code_snippet}</code>
            </pre>
          </div>
        )}

        {/* 4. INTERACTIVE 4-OPTION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
          {currentQ.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrect = verification?.correctOptionId === opt.id;
            const isWrongSelection = isAnswered && isSelected && !verification?.isCorrect;

            let cardStyle = "bg-white/5 border-white/10 hover:border-cyan-400/60 hover:bg-white/[0.08] text-white";
            let badgeStyle = "bg-white/10 text-zinc-300 border-white/20";

            if (isAnswered) {
              if (isCorrect) {
                cardStyle = "bg-emerald-950/60 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400/40";
                badgeStyle = "bg-emerald-500 text-black border-emerald-400";
              } else if (isWrongSelection) {
                cardStyle = "bg-red-950/60 border-red-500 text-red-200 ring-2 ring-red-500/40";
                badgeStyle = "bg-red-500 text-white border-red-400";
              } else {
                cardStyle = "bg-black/30 border-white/5 text-zinc-500 opacity-60";
              }
            } else if (isSelected) {
              cardStyle = "bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/30";
              badgeStyle = "bg-cyan-400 text-black";
            }

            return (
              <button
                key={opt.id}
                disabled={isAnswered || verifying}
                onClick={() => handleOptionSelect(opt.id)}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all duration-200 ${cardStyle} disabled:cursor-not-allowed`}
              >
                <span
                  className={`w-7 h-7 shrink-0 rounded-lg border font-mono text-xs flex items-center justify-center font-bold ${badgeStyle}`}
                >
                  {opt.id}
                </span>

                <span className="font-inter text-xs sm:text-sm font-medium leading-snug pt-0.5">
                  {opt.text}
                </span>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 ml-auto shrink-0 text-emerald-400" />
                )}
                {isAnswered && isWrongSelection && (
                  <XCircle className="w-5 h-5 ml-auto shrink-0 text-red-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* 5. EXPLANATION POPUP PANEL */}
        {isAnswered && verification && (
          <div
            className={`p-5 rounded-2xl border animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3 ${
              verification.isCorrect
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                : "bg-red-950/30 border-red-500/30 text-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-inter text-xs tracking-wide font-bold flex items-center gap-1.5">
                {verification.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Battle Advantage: +{verification.xpEarned} XP Awarded!
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    Damage Sustained: -{verification.damageTaken} HP
                  </>
                )}
              </span>

              <span className="font-mono text-xs text-zinc-400">
                Correct: <strong className="text-white">Option {verification.correctOptionId}</strong>
              </span>
            </div>

            <p className="font-inter text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {verification.explanation}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-xl bg-white text-black font-inter font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg"
              >
                <span>{currentIndex + 1 < questions.length ? "Next Encounter" : "Claim Rewards"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
