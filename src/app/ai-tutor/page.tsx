"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PixelBadge } from "@/components/retro/PixelBadge";
import { RetroButton } from "@/components/retro/RetroButton";
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
  CornerDownLeft,
  Settings,
} from "lucide-react";
import { retroSound } from "@/lib/sound";

interface Message {
  id: string;
  sender: "user" | "tutor";
  text: string;
  timestamp: string;
  mode?: "mentor" | "quiz" | "code";
}

const QUICK_PROMPTS = [
  { label: "Binary Search", prompt: "Explain Binary Search and its time complexity", icon: Swords },
  { label: "Next.js App Router", prompt: "How do Server vs Client Components work?", icon: Code2 },
  { label: "Dynamic Programming", prompt: "Give me the 3 core rules of Dynamic Programming", icon: Zap },
  { label: "Big-O Notation", prompt: "Rank common algorithm complexities from fastest to slowest", icon: BookOpen },
];

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "tutor",
      text: `🧙‍♂️ **PIXEL SAGE ONLINE [V1.0.4]**
Greetings, Knowledge Knight! I am your 8-bit AI Sage.
Ask me algorithm concepts, debug code, or prepare for Boss Quiz Battles.

Select a quick topic below or type your inquiry.`,
      timestamp: "00:00:01",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"mentor" | "quiz" | "code">("mentor");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputPrompt).trim();
    if (!textToSend || loading) return;

    retroSound.playClick();

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
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
          mode: activeMode,
        }),
      });

      const data = await res.json();
      retroSound.playCoin();

      const tutorMsg: Message = {
        id: `t-${Date.now()}`,
        sender: "tutor",
        text: data.reply || "PixelSage encountered a transmission glitch. Try again!",
        timestamp: new Date().toLocaleTimeString(),
        mode: activeMode,
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err) {
      retroSound.playWrong();
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "tutor",
          text: "⚠️ Connection to the knowledge matrix dropped. Please retry.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    retroSound.playClick();
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: "tutor",
        text: "🧙‍♂️ Matrix memory cleared. Ready for your next quest query.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-4 border-[#3b1c5a]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#1b072c] border-2 border-[#f755bc] flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_#000000]">
            🧙‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-pixel text-lg sm:text-2xl text-white uppercase tracking-tight">
                PIXEL SAGE <span className="text-[#f755bc]">AI TUTOR</span>
              </h1>
              <PixelBadge variant="pink">AI MENTOR</PixelBadge>
            </div>
            <p className="font-retro text-base text-[#a79bb7]">
              Minimal, punchy 8-bit AI guidance for algorithms, code debugs & quiz battles.
            </p>
          </div>
        </div>

        {/* Mode Selector & Clear */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              retroSound.playClick();
              setActiveMode("mentor");
            }}
            className={`px-3 py-1.5 font-pixel text-[10px] border-2 transition-colors ${
              activeMode === "mentor"
                ? "bg-[#1f0b35] text-[#f755bc] border-[#f755bc]"
                : "bg-[#0c0316] text-[#a79bb7] border-[#3b1c5a]"
            }`}
          >
            SOCRATIC
          </button>
          <button
            onClick={() => {
              retroSound.playClick();
              setActiveMode("code");
            }}
            className={`px-3 py-1.5 font-pixel text-[10px] border-2 transition-colors ${
              activeMode === "code"
                ? "bg-[#1f0b35] text-[#38bdf8] border-[#38bdf8]"
                : "bg-[#0c0316] text-[#a79bb7] border-[#3b1c5a]"
            }`}
          >
            CODE LAB
          </button>
          <button
            onClick={() => {
              retroSound.playClick();
              setActiveMode("quiz");
            }}
            className={`px-3 py-1.5 font-pixel text-[10px] border-2 transition-colors ${
              activeMode === "quiz"
                ? "bg-[#1f0b35] text-[#facc15] border-[#facc15]"
                : "bg-[#0c0316] text-[#a79bb7] border-[#3b1c5a]"
            }`}
          >
            ARENA COACH
          </button>
          <button
            onClick={handleClearHistory}
            title="Clear Chat Log"
            className="p-1.5 bg-[#0c0316] border-2 border-[#3b1c5a] hover:border-red-500 text-[#a79bb7] hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Terminal Window */}
      <div className="pixel-box-pink bg-[#090312] border-[#3b1c5a] p-4 sm:p-6 flex flex-col h-[65vh] shadow-[0_0_30px_rgba(247,85,188,0.1)]">
        {/* Terminal Status Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-[#3b1c5a] text-[10px] font-pixel text-[#a79bb7]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400">STATUS: READY</span>
            <span className="text-[#3b1c5a]">|</span>
            <span>CHANNEL: 8-BIT NEURAL LINK</span>
          </div>
          <div className="text-[#f755bc]">
            MODE: {activeMode.toUpperCase()}
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-sm">
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-none bg-[#1d062e] border border-[#f755bc] flex items-center justify-center text-base flex-shrink-0">
                    🧙‍♂️
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 border-2 ${
                    isUser
                      ? "bg-[#1f052b] border-[#f755bc] text-white self-end shadow-[2px_2px_0px_0px_#8b185b]"
                      : "bg-[#0e0419] border-[#3b1c5a] text-[#d4cae3] shadow-[2px_2px_0px_0px_#000000]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-white/10 text-[10px] font-pixel text-[#a79bb7]">
                    <span>{isUser ? "KNIGHT (YOU)" : "PIXEL SAGE"}</span>
                    <span>{m.timestamp}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-sans text-sm text-[#e2d9f3]">
                    {m.text}
                  </div>
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-none bg-[#2e091b] border border-[#de1659] flex items-center justify-center text-base flex-shrink-0">
                    ⚔️
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-[#f755bc] font-pixel text-xs animate-pulse">
              <div className="w-8 h-8 bg-[#1d062e] border border-[#f755bc] flex items-center justify-center text-sm">
                🧙‍♂️
              </div>
              <div className="p-3 bg-[#0e0419] border border-[#f755bc]">
                PIXEL SAGE IS CONSULTING ANCIENT SCROLLS...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Shelf */}
        <div className="pt-3 border-t-2 border-[#3b1c5a] flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((qp) => {
            const Icon = qp.icon;
            return (
              <button
                key={qp.label}
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={loading}
                className="px-2.5 py-1 bg-[#120320] border border-[#3b1c5a] hover:border-[#f755bc] font-pixel text-[9px] text-[#a79bb7] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Icon className="w-3 h-3 text-[#f755bc]" />
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
          className="pt-3 flex gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Type algorithm question or debug query..."
            className="flex-1 bg-[#120320] border-2 border-[#3b1c5a] focus:border-[#f755bc] px-4 py-2 font-retro text-lg text-white placeholder:text-[#5d4f71] outline-none"
          />
          <RetroButton
            type="submit"
            variant="pink"
            size="sm"
            disabled={loading || !inputPrompt.trim()}
          >
            <Send className="w-4 h-4 mr-1" />
            ASK
          </RetroButton>
        </form>
      </div>

      {/* Model Integration Plug Callout */}
      <div className="p-4 bg-[#0a0314] border-2 border-[#3b1c5a] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-pixel text-[#a79bb7]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-300" />
          <span>PLUG-AND-PLAY ARCHITECTURE READY FOR EXTERNAL LLMs (GEMINI / OPENAI / OLLAMA)</span>
        </div>
        <span className="text-[10px] text-[#f755bc]">ENV: AI_TUTOR_API_ENDPOINT</span>
      </div>
    </div>
  );
}