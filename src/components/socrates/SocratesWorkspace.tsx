"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Cpu, RotateCcw, Sparkles } from "lucide-react";
import { socratesTheme } from "./socratesTheme";
import { SocratesHeader } from "./SocratesHeader";
import { SocratesOfflineBanner } from "./SocratesOfflineBanner";
import { SocratesSidebar } from "./SocratesSidebar";
import { SocratesComposer } from "./SocratesComposer";
import { SocratesMarkdown } from "./SocratesMarkdown";
import { SocratesActivityIndicator } from "./SocratesActivityIndicator";
import { useSocratesChat } from "./useSocratesChat";

export const SocratesWorkspace: React.FC = () => {
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modelInfo, setModelInfo] = useState<{
    model: string;
    endpoint: string;
    latencyMs?: number;
  }>({
    model: "qwen3-coder-30b-a3b-colibri",
    endpoint: "http://127.0.0.1:8080/v1",
  });
  const [retryingHealth, setRetryingHealth] = useState(false);

  const {
    messages,
    input,
    setInput,
    isLoading,
    isStreaming,
    activeStage,
    error,
    isOffline,
    activeConversationId,
    conversations,
    isLoadingHistory,
    sendMessage,
    stopGeneration,
    selectConversation,
    newConversation,
    renameConversation,
    togglePinConversation,
    deleteConversation,
    clearAllConversations,
    retryLastMessage,
    checkColibriHealth,
  } = useSocratesChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialParamsHandledRef = useRef(false);

  // Scroll to bottom when messages or active stage change
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, activeStage, scrollToBottom]);

  // Probe health on mount to detect model name & latency
  const refreshHealth = useCallback(async () => {
    setRetryingHealth(true);
    try {
      const res = await fetch("/api/socrates/health");
      if (res.ok) {
        const data = await res.json();
        setModelInfo({
          model: data.model || "qwen3-coder-30b-a3b-colibri",
          endpoint: data.endpoint || "http://127.0.0.1:8080/v1",
          latencyMs: data.latencyMs,
        });
      }
      await checkColibriHealth();
    } catch {
      // offline handled by checkColibriHealth
    } finally {
      setRetryingHealth(false);
    }
  }, [checkColibriHealth]);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Handle inbound query parameters (from Quiz Engine or external links)
  useEffect(() => {
    if (initialParamsHandledRef.current) return;

    const questionParam = searchParams.get("question");
    const subjectParam = searchParams.get("subject");
    const questionIdParam = searchParams.get("questionId");

    if (questionParam && messages.length === 0 && !isStreaming) {
      initialParamsHandledRef.current = true;
      const initialPrompt = subjectParam
        ? `In ${subjectParam}: ${questionParam}`
        : questionParam;
      sendMessage(initialPrompt, questionIdParam || undefined);
    }
  }, [searchParams, messages.length, isStreaming, sendMessage]);

  // Curated starter dialectics for empty state
  const starterQuestions = [
    {
      title: "Complexity & Asymptotics",
      prompt: "Analyze the time and space complexity of QuickSelect versus Median-of-Medians with mathematical proof.",
    },
    {
      title: "Data Structure Invariants",
      prompt: "Explain how Red-Black Tree rotation invariants guarantee O(log n) maximum search depth.",
    },
    {
      title: "System Architecture",
      prompt: "Contrast the architectural tradeoffs between LSM-Trees and B-Trees in write-heavy storage engines.",
    },
    {
      title: "Code Debugging & Verification",
      prompt: "What memory invariants must be preserved when implementing a lock-free queue with atomic compare-and-swap?",
    },
  ];

  return (
    <div className={`fixed inset-0 z-50 h-screen w-full flex flex-col overflow-hidden ${socratesTheme.canvas}`}>
      {/* Ambient Lighting & Technical Grid Overlay */}
      <div className={socratesTheme.ambientGlowTop} />
      <div className={socratesTheme.ambientGlowBottom} />
      <div className={socratesTheme.techGrid} />

      {/* Workspace Header */}
      <SocratesHeader
        modelName={modelInfo.model}
        isOnline={!isOffline}
        latencyMs={modelInfo.latencyMs}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onNewChat={newConversation}
      />

      {/* Offline Alert Banner */}
      {isOffline && (
        <SocratesOfflineBanner
          endpoint={modelInfo.endpoint}
          onRetry={refreshHealth}
          retrying={retryingHealth}
        />
      )}

      {/* Main Dialectic Workspace Shell */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Session Drawer Sidebar */}
        <SocratesSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={newConversation}
          onRenameConversation={renameConversation}
          onTogglePinConversation={togglePinConversation}
          onDeleteConversation={deleteConversation}
          onClearAllConversations={clearAllConversations}
          isLoading={isLoadingHistory}
        />

        {/* Central Chat Stream & Scroll Area */}
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {/* Scrollable Message History Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
            {messages.length === 0 ? (
              /* Empty State Hero Dialectic Launcher */
              <div className="min-h-[70vh] flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12 px-4 select-none">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                    <span className="font-condensed font-black text-3xl text-cyan-300">Σ</span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                </div>

                <h1 className="font-condensed font-black tracking-widest text-white text-2xl sm:text-3xl uppercase mb-2">
                  SOCRATES DIALECTIC ENGINE
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm max-w-lg mb-8 leading-relaxed font-sans">
                  Inquiry-guided computer science mastery powered by local Qwen 30B inference.
                  Explore proofs, algorithm invariants, systems architecture, and code verification.
                </p>

                {/* Quick starter cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                  {starterQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendMessage(q.prompt)}
                      disabled={isOffline || isLoading}
                      className="p-3.5 rounded-xl bg-[#080d1a]/60 hover:bg-[#0c1428]/80 border border-white/[0.06] hover:border-cyan-500/30 transition-all text-left group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 mb-1">
                        <Sparkles className="w-3 h-3 text-cyan-400 group-hover:animate-spin" />
                        <span>{q.title}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {q.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message Stream Turns */
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((m) => {
                  const isUser = m.role === "user";

                  if (isUser) {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div className={`max-w-[85%] sm:max-w-[75%] ${socratesTheme.userBubble}`}>
                          <div className="text-xs font-mono text-cyan-300 mb-1 flex items-center justify-between gap-4">
                            <span>YOU</span>
                            {m.createdAt && (
                              <span className="text-[10px] text-cyan-400/60">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Assistant Turn
                  return (
                    <div key={m.id} className="flex justify-start w-full">
                      <div className={`w-full ${socratesTheme.assistantTurn}`}>
                        {/* Turn Header */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                            <span className="font-semibold text-white tracking-wider">
                              SOCRATES
                            </span>
                            <span className="text-[10px] text-zinc-500 hidden sm:inline">
                              // {m.model || modelInfo.model}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
                            {m.tokens !== undefined && m.tokens > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/5 font-mono">
                                {m.tokens} tokens
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Turn Content via Markdown AST Engine */}
                        {m.content ? (
                          <SocratesMarkdown content={m.content} isStreaming={m.isStreaming} />
                        ) : m.isStreaming ? (
                          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span>Formulating dialectic response...</span>
                          </div>
                        ) : null}

                        {/* Active SSE Stage Indicator while streaming */}
                        {m.isStreaming && activeStage && (
                          <SocratesActivityIndicator
                            stage={activeStage.stage}
                            stageText={activeStage.text}
                            modelName={modelInfo.model}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Display Error Message with Retry */}
                {error && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs flex items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold">Dialectic Error: </span>
                      <span>{error.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={retryLastMessage}
                      className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Sticky Floating Glass Composer */}
          <div className="shrink-0 bg-gradient-to-t from-[#02040a] via-[#02040a]/90 to-transparent pt-3">
            <SocratesComposer
              value={input}
              onChange={setInput}
              onSubmit={(text) => sendMessage(text)}
              onStop={stopGeneration}
              isStreaming={isStreaming}
              isLoading={isLoading}
              disabled={isOffline}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SocratesWorkspace;
