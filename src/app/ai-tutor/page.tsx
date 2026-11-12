"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Zap,
  Code2,
  Swords,
  BookOpen,
  Settings,
  HelpCircle,
  Brain,
} from "lucide-react";
import { retroSound } from "@/lib/sound";
import { SocratesAvatar, SocratesAnimation } from "@/components/avatar/SocratesAvatar";

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
  mode?: "mentor" | "quiz" | "code";
}

const QUICK_PROMPTS = [
  { label: "Binary Search", prompt: "Explain Binary Search and its logarithmic bisection principle", icon: Swords },
  { label: "Next.js App Router", prompt: "How do Server vs Client Components work in Next.js?", icon: Code2 },
  { label: "Dynamic Programming", prompt: "What are the core invariants of Dynamic Programming?", icon: Zap },
  { label: "Big-O Notation", prompt: "Rank algorithmic time complexities from fastest to slowest", icon: BookOpen },
];

function AITutorContent() {
  const searchParams = useSearchParams();
  const initialQueryHandled = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "tutor",
      text: `🏛️ **SOCRATES ONLINE [DIALECTIC V2]**

Greetings, Scholar. I am Socrates, your AI Tutor.
We seek true understanding not through passive answers, but through inquiry, dialectic deconstruction, and first principles.

Select a topic below or present your premise to begin our inquiry.`,
      timestamp: "00:00:01",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeMode, setActiveMode] = useState<"mentor" | "quiz" | "code">("mentor");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string, explicitQid?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || loading) return;

    retroSound.playClick();

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          questionId: explicitQid,
          mode: activeMode,
        }),
      });

      const data = await res.json();
      retroSound.playCoin();

      const tutorMsg: Message = {
        id: `t-${Date.now()}`,
        sender: "tutor",
        text: data.reply || "Socrates encountered a transmission glitch. Propose your inquiry again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: activeMode,
      };

      setMessages((prev) => [...prev, tutorMsg]);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 3500);
    } catch (err) {
      retroSound.playWrong();
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "tutor",
          text: "⚠️ Connection to the knowledge matrix dropped. Please retry.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle URL inquiry query on mount
  useEffect(() => {
    if (initialQueryHandled.current) return;
    const q = searchParams.get("question");
    const s = searchParams.get("subject");
    const qid = searchParams.get("questionId");

    if (q || qid) {
      initialQueryHandled.current = true;
      const inquiry = q
        ? `Can you explain this challenge from ${s || "the realm"}: "${q}"?`
        : `Can you deconstruct question ID ${qid}?`;
      handleSendMessage(inquiry, qid || undefined);
    }
  }, [searchParams]);

  const handleClearHistory = () => {
    retroSound.playClick();
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "tutor",
        text: "🏛️ Memory dialectic cleared. Ready for your next philosophical inquiry.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const avatarStatus = loading ? "thinking" : speaking ? "speaking" : "idle";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
      {/* 1. Header Bar: Unified Dark Luxury Glass Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-[#080d24] border border-cyan-400/40 p-1 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.25)] shrink-0 overflow-hidden">
            <SocratesAvatar size={56} status={avatarStatus} />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#080d24]" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-condensed font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                SOCRATES <span className="text-cyan-400">AI TUTOR</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-[10px] font-mono font-semibold text-cyan-300 uppercase tracking-wider">
                DIALECTIC ENGINE
              </span>
            </div>
            <p className="font-inter text-xs text-zinc-400">
              Classical Socratic inquiry, algorithms &amp; code analysis from first principles.
            </p>
          </div>
        </div>

        {/* Mode Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-1">
            <button
              onClick={() => {
                retroSound.playClick();
                setActiveMode("mentor");
              }}
              className={`px-3 py-1.5 rounded-lg font-inter text-xs font-semibold transition-all ${
                activeMode === "mentor"
                  ? "bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              SOCRATIC
            </button>
            <button
              onClick={() => {
                retroSound.playClick();
                setActiveMode("code");
              }}
              className={`px-3 py-1.5 rounded-lg font-inter text-xs font-semibold transition-all ${
                activeMode === "code"
                  ? "bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              CODE LAB
            </button>
            <button
              onClick={() => {
                retroSound.playClick();
                setActiveMode("quiz");
              }}
              className={`px-3 py-1.5 rounded-lg font-inter text-xs font-semibold transition-all ${
                activeMode === "quiz"
                  ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              ARENA COACH
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            title="Clear Chat Log"
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-red-950/40 border border-white/[0.08] hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Dialectic Terminal Container */}
      <div className="rounded-2xl p-6 bg-[#070c20]/80 border border-violet-500/20 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col h-[65vh]">
        {/* Terminal Status Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08] text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-semibold">STATUS: SOCRATES ACTIVE</span>
            <span className="text-zinc-600">|</span>
            <span>PROCEDURAL AVATAR: ONLINE</span>
          </div>
          <div className="text-cyan-400 uppercase tracking-wider font-semibold">
            MODE: {activeMode.toUpperCase()}
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-inter text-sm">
          {messages.map((m, idx) => {
            const isUser = m.sender === "user";
            const isLatestTutor = !isUser && idx === messages.length - 1;
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-xl bg-[#080d24] border border-cyan-500/30 p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <SocratesAvatar
                      size={32}
                      status={isLatestTutor && speaking ? "speaking" : "idle"}
                    />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl ${
                    isUser
                      ? "bg-violet-600/20 border border-violet-500/30 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(139,92,246,0.15)]"
                      : "bg-[#061226]/80 border border-cyan-500/30 text-zinc-200 rounded-tl-sm shadow-[0_4px_20px_rgba(6,182,212,0.1)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/10 text-[10px] font-mono text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-cyan-300">
                      {isUser ? "SCHOLAR (YOU)" : "SOCRATES"}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-inter text-sm text-zinc-200">
                    {m.text}
                  </div>
                </div>
                {isUser && (
                  <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center text-sm flex-shrink-0">
                    ⚔️
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-cyan-400 font-inter text-xs animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-[#080d24] border border-cyan-400/40 p-0.5 flex items-center justify-center overflow-hidden">
                <SocratesAvatar size={32} status="thinking" />
              </div>
              <div className="p-3 rounded-xl bg-[#061226]/80 border border-cyan-500/30">
                Socrates is contemplating first principles...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Inquiry Chips Shelf */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp) => {
            const Icon = qp.icon;
            return (
              <button
                key={qp.label}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 font-inter text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{qp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-3 flex gap-2.5"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Inquire about an algorithm or submit a code premise..."
            className="flex-1 bg-black/40 border border-white/10 focus:border-cyan-400/50 rounded-xl px-4 py-3 font-inter text-sm text-white placeholder-zinc-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-inter font-semibold text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>INQUIRE</span>
          </button>
        </form>
      </div>

      {/* Model Integration Plug Callout */}
      <div className="p-4 rounded-xl bg-[#061024]/60 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-inter text-zinc-400">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Socrates procedural neural avatar powered by @bible-strong/avatar-react &amp; ML Engine</span>
        </div>
        <span className="text-[11px] font-mono text-cyan-400">ENV: AI_TUTOR_API_ENDPOINT</span>
      </div>
    </div>
  );
}

export default function AITutorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030612] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="font-inter text-xs text-cyan-400 font-medium">
            Summoning Socrates AI Dialectic...
          </span>
        </div>
      }
    >
      <AITutorContent />
    </Suspense>
  );
}
