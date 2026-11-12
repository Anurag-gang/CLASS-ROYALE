"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Sparkles,
  Shield,
  Crown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Bot,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  QuizSessionDTO,
  QuizAnswerResultDTO,
  Question,
  QuizOption,
} from "@/types/quiz";
import { retroSound } from "@/lib/sound";

interface KnowledgeKingdomQuizEngineProps {
  initialSession: QuizSessionDTO;
  onExit: () => void;
  onCompleteLevel?: (nextLevelNumber?: number) => void;
}

export function KnowledgeKingdomQuizEngine({
  initialSession,
  onExit,
  onCompleteLevel,
}: KnowledgeKingdomQuizEngineProps) {
  // Session & question state
  const [sessionId] = useState(initialSession.sessionId);
  const [levelNumber] = useState(initialSession.levelNumber);
  const [levelTitle] = useState(initialSession.levelTitle);
  const [realmName] = useState(initialSession.realmName);
  const [passingThreshold] = useState(initialSession.passingThreshold);
  const [totalQuestions] = useState(initialSession.totalQuestions);
  const [allowHints] = useState(initialSession.hintAvailable ?? (levelNumber !== 7));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    initialSession.currentQuestionIndex
  );
  const [currentQuestion, setCurrentQuestion] = useState<Omit<Question, "correct_option_id">>(
    initialSession.currentQuestion
  );
  const [score, setScore] = useState(initialSession.score);

  // Timer & active question interactions
  const [secondsRemaining, setSecondsRemaining] = useState<number>(35);
  const [selectedOption, setSelectedOption] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  // Feedback result (Screen D)
  const [evalResult, setEvalResult] = useState<QuizAnswerResultDTO | null>(null);
  const [storedNextQuestion, setStoredNextQuestion] = useState<Omit<Question, "correct_option_id"> | null>(null);

  // Hint state
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintRequested, setHintRequested] = useState(false);

  // Final Results Review (Screen E)
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // Sound muting state
  const [isMuted, setIsMuted] = useState(false);

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sound mute state
  useEffect(() => {
    setIsMuted(retroSound.isMuted());
  }, []);

  const toggleSound = () => {
    const next = retroSound.toggleMute();
    setIsMuted(next);
  };

  // Submit Answer handler
  const handleSubmitAnswer = useCallback(
    async (optionId?: "A" | "B" | "C" | "D") => {
      const optionToSubmit = optionId || selectedOption || "A";
      if (submitting || isAnswered || isCompleted) return;

      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      try {
        const res = await fetch(`/api/quiz/attempts/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQuestion.id,
            selectedOptionId: optionToSubmit,
            hintRequested,
          }),
        });

        const data = await res.json();
        if (data.success && data.result) {
          const resObj: QuizAnswerResultDTO = data.result;
          setEvalResult(resObj);
          setIsAnswered(true);
          setScore(resObj.score);

          if (resObj.nextQuestion) {
            setStoredNextQuestion(resObj.nextQuestion);
          }

          if (resObj.isCorrect) {
            retroSound.playCorrect();
          } else {
            retroSound.playWrong();
          }

          if (resObj.levelComplete) {
            // Load full results
            setTimeout(async () => {
              try {
                const resReport = await fetch(`/api/quiz/attempts/${sessionId}`);
                const repData = await resReport.json();
                if (repData.success && repData.results) {
                  setResultsData(repData.results);
                }
              } catch (e) {
                console.error("Failed to load attempt summary:", e);
              }
            }, 600);
          }
        }
      } catch (err) {
        console.error("Answer submission failed:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [
      submitting,
      isAnswered,
      isCompleted,
      selectedOption,
      sessionId,
      currentQuestion.id,
      hintRequested,
    ]
  );

  // 35s Authoritative Countdown Timer
  useEffect(() => {
    if (isAnswered || isCompleted) return;

    setSecondsRemaining(35);

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmitAnswer(selectedOption || "A");
          return 0;
        }
        // Critical tick sound
        if (prev <= 6 && prev > 1) {
          retroSound.playClick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion.id, isAnswered, isCompleted, handleSubmitAnswer, selectedOption]);

  // Request Hint handler (unlocks <= 15s)
  const handleRequestHint = async () => {
    if (!allowHints || hintLoading || hintText || secondsRemaining > 15) return;
    setHintLoading(true);
    try {
      retroSound.playClick();
      const res = await fetch(`/api/quiz/attempts/${sessionId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: currentQuestion.id }),
      });
      const data = await res.json();
      if (data.success && data.hint) {
        setHintText(data.hint);
        setHintRequested(true);
      }
    } catch (e) {
      console.error("Hint request failed:", e);
    } finally {
      setHintLoading(false);
    }
  };

  // Advance to Next Question
  const handleAdvance = () => {
    retroSound.playClick();

    if (evalResult?.levelComplete) {
      setIsCompleted(true);
      if (evalResult.passed) {
        retroSound.playLevelUp();
      }
      return;
    }

    if (storedNextQuestion) {
      setCurrentQuestion(storedNextQuestion);
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setEvalResult(null);
      setHintText(null);
      setHintRequested(false);
      setStoredNextQuestion(null);
      setSecondsRemaining(35);
    }
  };

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;

      if (!isAnswered) {
        if (e.key === "1" || e.key.toUpperCase() === "A") setSelectedOption("A");
        if (e.key === "2" || e.key.toUpperCase() === "B") setSelectedOption("B");
        if (e.key === "3" || e.key.toUpperCase() === "C") setSelectedOption("C");
        if (e.key === "4" || e.key.toUpperCase() === "D") setSelectedOption("D");
        if (e.key === "Enter" && selectedOption) {
          handleSubmitAnswer();
        }
      } else {
        if (e.key === "Enter" || e.key === " ") {
          handleAdvance();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAnswered, isCompleted, selectedOption, handleSubmitAnswer]);

  // Timer aura styling
  const isCritical = secondsRemaining <= 5;
  const isWarning = secondsRemaining <= 15 && !isCritical;
  const timerBorderColor = isCritical
    ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] text-rose-400 animate-pulse"
    : isWarning
    ? "border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] text-amber-300"
    : "border-cyan-400/40 text-cyan-300";

  // ---------------------------------------------------------------------------
  // SCREEN E: Final Results & Sovereign Mastery Screen
  // ---------------------------------------------------------------------------
  if (isCompleted && resultsData) {
    const isPassed = resultsData.passed;
    const accuracy = resultsData.accuracy || Math.round((resultsData.score / resultsData.totalQuestions) * 100);

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        {/* Results Hero Banner */}
        <div
          className={`p-8 rounded-3xl border-2 backdrop-blur-xl shadow-2xl relative overflow-hidden ${
            isPassed
              ? "bg-[#051a14]/90 border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
              : "bg-[#18080f]/90 border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.15)]"
          }`}
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                {isPassed ? (
                  <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
                ) : (
                  <Shield className="w-6 h-6 text-zinc-400" />
                )}
                <span className="text-[11px] font-inter font-bold tracking-widest uppercase text-cyan-400">
                  {realmName} • Tier {levelNumber}
                </span>
              </div>
              <h2 className="font-condensed font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">
                {isPassed ? "Trial Conquered!" : "Trial Incomplete"}
              </h2>
              <p className="font-inter text-sm text-zinc-300 max-w-lg">
                {isPassed
                  ? `Sovereign victory! You achieved ${resultsData.score}/${resultsData.totalQuestions} required threshold mastery.`
                  : `You scored ${resultsData.score}/${resultsData.totalQuestions}. Mastery requires at least ${resultsData.passingThreshold}/12 to unlock the subsequent tier.`}
              </p>
            </div>

            {/* Score Radial Metric */}
            <div className="flex items-center gap-6">
              <div className="px-6 py-4 rounded-2xl bg-black/50 border border-white/10 text-center">
                <span className="block font-inter text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                  Final Accuracy
                </span>
                <span
                  className={`font-mono text-3xl font-black ${
                    isPassed ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {accuracy}%
                </span>
                <span className="font-inter text-xs text-zinc-400 block pt-0.5">
                  {resultsData.score} of {resultsData.totalQuestions} Correct
                </span>
              </div>

              {isPassed && resultsData.xpAwarded > 0 && (
                <div className="px-6 py-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center animate-pulse">
                  <span className="block font-inter text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    Bounty Claimed
                  </span>
                  <span className="font-mono text-3xl font-black text-amber-300">
                    +{resultsData.xpAwarded}
                  </span>
                  <span className="font-inter text-xs text-amber-400/80 block pt-0.5">
                    Kingdom XP
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Topic Breakdown & ML Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-[#070c20]/80 border border-white/10 space-y-4">
            <h3 className="font-condensed font-bold text-lg text-white uppercase flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Demonstrated Proficiencies</span>
            </h3>
            {resultsData.strongTopics && resultsData.strongTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resultsData.strongTopics.map((top: string) => (
                  <span
                    key={top}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-inter text-xs font-semibold"
                  >
                    {top}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-inter text-xs text-zinc-400">
                Continue practicing to establish demonstrated mastery.
              </p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-[#070c20]/80 border border-white/10 space-y-4">
            <h3 className="font-condensed font-bold text-lg text-white uppercase flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Areas for Reinforcement</span>
            </h3>
            {resultsData.weakTopics && resultsData.weakTopics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resultsData.weakTopics.map((top: string) => (
                  <span
                    key={top}
                    className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 font-inter text-xs font-semibold"
                  >
                    {top}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-inter text-xs text-emerald-400">
                Flawless coverage across all tested concepts.
              </p>
            )}
          </div>
        </div>

        {/* ML Engine Pedagogical Recommendation */}
        {resultsData.mlRecommendation && (
          <div className="p-5 rounded-2xl bg-[#09102c]/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  ML Adaptive Engine Recommendation
                </span>
              </div>
              <p className="font-inter text-xs text-zinc-300">
                Directed Action: <span className="font-semibold text-white">{resultsData.mlRecommendation.action}</span>
                {resultsData.mlRecommendation.suggestedWeakTopics?.length > 0 && (
                  <span> • Reinforce core topics: {resultsData.mlRecommendation.suggestedWeakTopics.join(", ")}</span>
                )}
              </p>
            </div>
            <Link
              href={`/socrates?subject=${encodeURIComponent(realmName)}`}
              className="px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-400/40 text-cyan-300 font-inter text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dialectic Review</span>
            </Link>
          </div>
        )}

        {/* 12-Question Detailed Review Accordion */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-condensed font-black text-xl text-white uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Complete 12-Question Trial Review</span>
            </h3>
            <span className="font-inter text-xs text-zinc-400">
              Click any question to inspect explanation & misconception notes
            </span>
          </div>

          <div className="space-y-3">
            {resultsData.questionsReview?.map((item: any) => {
              const isOpen = expandedReviewId === item.questionId;
              return (
                <div
                  key={item.questionId}
                  className={`rounded-2xl border transition-all ${
                    item.isCorrect
                      ? "bg-[#061412]/70 border-emerald-500/30 hover:border-emerald-500/50"
                      : "bg-[#14060b]/70 border-rose-500/30 hover:border-rose-500/50"
                  }`}
                >
                  <div
                    onClick={() =>
                      setExpandedReviewId(isOpen ? null : item.questionId)
                    }
                    className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          item.isCorrect
                            ? "bg-emerald-950 border border-emerald-500/50 text-emerald-300"
                            : "bg-rose-950 border border-rose-500/50 text-rose-300"
                        }`}
                      >
                        Q{item.index}
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-inter text-xs font-medium text-white line-clamp-1">
                          {item.questionText}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-inter text-zinc-400">
                          <span>{item.topic || "Core Concept"}</span>
                          <span>•</span>
                          <span>{item.timeSpentSeconds}s elapsed</span>
                          {item.hintRequested && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">Hint Used</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-inter text-xs font-bold uppercase tracking-wider ${
                          item.isCorrect ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-5 border-t border-white/5 space-y-4 bg-black/30 font-inter text-xs">
                      {/* Code Snippet if present */}
                      {item.codeSnippet && (
                        <pre className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                          <code>{item.codeSnippet}</code>
                        </pre>
                      )}

                      {/* Options Review Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.options?.map((opt: QuizOption) => {
                          const isKeyCorrect = opt.id === item.correctOptionId;
                          const isStudentSelected = opt.id === item.selectedOptionId;

                          return (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                                isKeyCorrect
                                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                                  : isStudentSelected
                                  ? "bg-rose-950/60 border-rose-500/50 text-rose-200"
                                  : "bg-white/5 border-white/5 text-zinc-400 opacity-60"
                              }`}
                            >
                              <span className="font-mono font-bold">{opt.id}.</span>
                              <span className="flex-1">{opt.text}</span>
                              {isKeyCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              )}
                              {isStudentSelected && !isKeyCorrect && (
                                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & Misconception */}
                      <div className="space-y-2 pt-2">
                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 space-y-1">
                          <span className="font-bold uppercase text-[10px] tracking-wider block">
                            Academic Explanation
                          </span>
                          <p className="leading-relaxed text-zinc-300">{item.explanation}</p>
                        </div>

                        {item.misconceptionExplanation && (
                          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-300 space-y-1">
                            <span className="font-bold uppercase text-[10px] tracking-wider block">
                              Common Misconception
                            </span>
                            <p className="leading-relaxed text-zinc-300">
                              {item.misconceptionExplanation}
                            </p>
                          </div>
                        )}

                        {item.referenceSource && (
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            Ref: {item.referenceSource}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 rounded-3xl bg-[#080d22]/90 border border-white/10 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onExit}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-inter font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Return to Realm Map</span>
          </button>

          <div className="flex items-center gap-3">
            <Link
              href={`/socrates?subject=${encodeURIComponent(realmName)}`}
              className="px-6 py-3 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-500/40 text-violet-300 font-inter font-semibold text-xs flex items-center gap-2 transition-colors"
            >
              <Bot className="w-4 h-4 text-violet-400" />
              <span>Review with Socrates</span>
            </Link>

            {isPassed && levelNumber < 7 && (
              <button
                onClick={() => {
                  if (onCompleteLevel) onCompleteLevel(levelNumber + 1);
                  else onExit();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-inter font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 transition-all"
              >
                <span>Advance to Tier {levelNumber + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {!isPassed && (
              <button
                onClick={() => {
                  if (onCompleteLevel) onCompleteLevel(levelNumber);
                  else onExit();
                }}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-inter font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Tier Trial</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SCREEN C & D: Active Question HUD & Immediate Feedback
  // ---------------------------------------------------------------------------
  const progressPercent = Math.round(
    ((currentQuestionIndex + 1) / totalQuestions) * 100
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header & HUD */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080d22]/90 border border-white/10 backdrop-blur-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Leave Trial"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-condensed font-black text-sm uppercase text-white tracking-wide">
                {levelTitle}
              </span>
              <span className="font-inter text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                Tier {levelNumber}
              </span>
            </div>
            <span className="font-inter text-[11px] text-zinc-400 block">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
        </div>

        {/* Center: Authoritative 35s Countdown Timer */}
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-1.5 rounded-2xl bg-black/60 border-2 font-mono font-black text-lg transition-all flex items-center gap-2 ${timerBorderColor}`}
          >
            <Clock className={`w-4 h-4 ${isCritical ? "animate-spin" : ""}`} />
            <span>{String(secondsRemaining).padStart(2, "0")}s</span>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute Sounds" : "Mute Sounds"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-emerald-400 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card Bento */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#090e26]/90 border border-violet-500/30 backdrop-blur-2xl shadow-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-inter font-medium text-zinc-300">
              {currentQuestion.topic || "Core Concept"}
            </span>
            {currentQuestion.subtopic && (
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-inter text-zinc-400">
                {currentQuestion.subtopic}
              </span>
            )}
          </div>

          <span className="font-mono text-xs text-amber-300 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            +{currentQuestion.xp_reward || 50} XP
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-4">
          <h2 className="font-sans text-lg sm:text-xl font-semibold text-white leading-relaxed tracking-tight">
            {currentQuestion.question_text}
          </h2>

          {/* Optional Code Snippet */}
          {currentQuestion.code_snippet && (
            <pre className="p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
              <code>{currentQuestion.code_snippet}</code>
            </pre>
          )}
        </div>

        {/* Timed Hint Drawer Button */}
        {!isAnswered && (
          <div className="pt-2">
            {!allowHints ? (
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-inter text-zinc-500 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-500/60" />
                <span>The Crown Trial prohibits timed hint assistance.</span>
              </div>
            ) : secondsRemaining > 15 ? (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-inter text-zinc-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Timed Hint Lock:</span>
                </span>
                <span className="font-mono text-amber-400 font-semibold">
                  Unlocks in {secondsRemaining - 15}s
                </span>
              </div>
            ) : !hintText ? (
              <button
                onClick={handleRequestHint}
                disabled={hintLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-inter font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>{hintLoading ? "Deciphering Codex..." : "Request Timed Hint Assistance"}</span>
              </button>
            ) : null}

            {hintText && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 font-inter text-xs space-y-1 animate-in fade-in duration-300">
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block">
                  Codex Clue:
                </span>
                <p className="leading-relaxed">{hintText}</p>
              </div>
            )}
          </div>
        )}

        {/* 4 Options Grid */}
        <div className="space-y-3 pt-2">
          {currentQuestion.options?.map((opt: QuizOption) => {
            const isSelected = selectedOption === opt.id;
            const isEvaluated = Boolean(evalResult);
            const isCorrectAnswer = evalResult?.correctOptionId === opt.id;
            const isWrongSelection = isEvaluated && isSelected && !evalResult?.isCorrect;

            let cardStyle = "bg-[#060919]/80 border-white/10 hover:border-cyan-400/50 hover:bg-[#080d26]";

            if (isEvaluated) {
              if (isCorrectAnswer) {
                cardStyle = "bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400";
              } else if (isWrongSelection) {
                cardStyle = "bg-rose-950/70 border-rose-500 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500";
              } else {
                cardStyle = "bg-black/30 border-white/5 text-zinc-500 opacity-50";
              }
            } else if (isSelected) {
              cardStyle = "bg-[#0a1438] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-2 ring-cyan-400/40";
            }

            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (isAnswered || submitting) return;
                  retroSound.playClick();
                  setSelectedOption(opt.id);
                }}
                className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer select-none ${cardStyle}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl font-mono font-black text-sm flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        : "bg-white/5 border border-white/10 text-white"
                    }`}
                  >
                    {opt.id}
                  </div>
                  <span className="font-inter text-sm font-medium text-zinc-100">
                    {opt.text}
                  </span>
                </div>

                <div className="shrink-0">
                  {isEvaluated && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  {isEvaluated && isWrongSelection && (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Action Button (Pre-Answer) */}
        {!isAnswered && (
          <div className="pt-4 flex items-center justify-between gap-4">
            <span className="text-[11px] font-inter text-zinc-500 hidden sm:inline">
              Press 1-4 or A-D, Enter to submit
            </span>
            <button
              onClick={() => handleSubmitAnswer()}
              disabled={!selectedOption || submitting}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-inter font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                selectedOption && !submitting
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
                  : "bg-white/5 text-zinc-500 border border-white/5 cursor-not-allowed"
              }`}
            >
              <span>{submitting ? "Evaluating..." : "Submit Answer"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCREEN D: Immediate Post-Answer Academic Feedback */}
        {isAnswered && evalResult && (
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 space-y-5 animate-in fade-in duration-300">
            {/* Feedback Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {evalResult.isCorrect ? (
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-condensed font-black text-lg uppercase">
                      Exact Reasoning! (+{currentQuestion.xp_reward || 50} XP)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-condensed font-black text-lg uppercase">
                      {evalResult.isExpired ? "Time Expired" : "Incorrect Answer"}
                    </span>
                  </div>
                )}
              </div>

              <div className="font-mono text-xs text-zinc-400">
                Score: <span className="font-bold text-white">{evalResult.score}</span> / {totalQuestions}
              </div>
            </div>

            {/* Academic Explanation */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs font-inter text-zinc-300">
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-400 block">
                Concept Synthesis
              </span>
              <p className="leading-relaxed">{evalResult.explanation}</p>
            </div>

            {/* Common Misconception Callout */}
            {evalResult.misconceptionExplanation && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-1.5 text-xs font-inter text-amber-200">
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Common Misconception
                </span>
                <p className="leading-relaxed text-zinc-300">
                  {evalResult.misconceptionExplanation}
                </p>
              </div>
            )}

            {evalResult.referenceSource && (
              <span className="text-[10px] font-mono text-zinc-500 block">
                Canonical Reference: {evalResult.referenceSource}
              </span>
            )}

            {/* Advance Button */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <Link
                href={`/socrates?subject=${encodeURIComponent(realmName)}&question=${encodeURIComponent(currentQuestion.question_text)}`}
                className="px-4 py-2.5 rounded-xl bg-violet-950/50 hover:bg-violet-900/50 border border-violet-500/30 text-violet-300 font-inter text-xs flex items-center gap-2 transition-colors"
              >
                <Bot className="w-3.5 h-3.5 text-violet-400" />
                <span>Ask Socrates About This</span>
              </Link>

              <button
                onClick={handleAdvance}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-inter font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>
                  {evalResult.levelComplete ? "View Sovereign Results" : "Continue"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}