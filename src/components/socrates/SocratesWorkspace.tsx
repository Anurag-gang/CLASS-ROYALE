/**
 * Socrates AI Dialectic Workspace
 * File: src/components/socrates/SocratesWorkspace.tsx
 *
 * Implements minimalist ChatGPT-inspired layout matching user reference image:
 * - Left conversation history sidebar with "+ New chat", "Recents", and Student Profile
 * - Center empty state: "Hey, {name}. Ready to dive in?"
 * - Centered floating pill composer with model name displayed strictly and ONLY inside
 * - 4 clean quick suggestions stacked below composer
 * - Clean message stream: zero noisy metadata, zero small tags (no "YOU", no timestamps, no model badge in turns)
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  RotateCcw,
  Code2,
  Zap,
  BookOpen,
} from "lucide-react";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    name?: string;
    username?: string;
    role?: string;
  } | null>(null);

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

  // Fetch current user info for personalized greeting
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({
            username: data.user.username,
            role: data.user.role,
            name: data.user.profile?.name || data.user.username,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Responsive sidebar default
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

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

  // Probe health on mount
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
      // handled by checkColibriHealth
    } finally {
      setRetryingHealth(false);
    }
  }, [checkColibriHealth]);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Handle inbound query parameters
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

  // Clean suggestion prompts matching reference image
  const suggestionItems = [
    {
      icon: Code2,
      label: "Write or debug code",
      prompt: "Analyze this code for bugs, edge cases, and memory invariants:\n\n",
    },
    {
      icon: Sparkles,
      label: "Explain a complex concept",
      prompt: "Explain the fundamental intuition and mathematical invariants of ",
    },
    {
      icon: Zap,
      label: "Algorithm complexity & Big-O",
      prompt: "Analyze the time and space complexity of this algorithm with big-O notation:\n\n",
    },
    {
      icon: BookOpen,
      label: "Search academic curriculum",
      prompt: "What are the core syllabus topics and proofs required for ",
    },
  ];

  // Format model name: strictly displayed only in the composer pill
  const modelDisplayName = modelInfo.model.toLowerCase().includes("30b")
    ? "Qwen 30B"
    : modelInfo.model.split("/").pop()?.replace(/-colibri$/, "") || "Qwen 30B";

  const studentName = currentUser?.name || currentUser?.username || "Anurag";

  return (
    <div className={`fixed inset-0 z-50 h-screen w-full flex flex-col overflow-hidden ${socratesTheme.canvas}`}>
      {/* Workspace Header */}
      <SocratesHeader
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
          currentUser={currentUser}
        />

        {/* Central Chat Stream & Canvas */}
        <main className="relative flex flex-1 flex-col overflow-hidden bg-[#0d0f12]">
          {messages.length === 0 ? (
            /* Empty State Layout (Matching Reference Image) */
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-8 select-none">
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-7">
                {/* Greeting: "Hey, {name}. Ready to dive in?" */}
                <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight text-center font-sans">
                  Hey, {studentName}. Ready to dive in?
                </h1>

                {/* Floating Centered Pill Composer */}
                <div className="w-full">
                  <SocratesComposer
                    value={input}
                    onChange={setInput}
                    onSubmit={(text) => sendMessage(text)}
                    onStop={stopGeneration}
                    isStreaming={isStreaming}
                    isLoading={isLoading}
                    disabled={isOffline}
                    placeholder="Ask Socrates..."
                    modelDisplayName={modelDisplayName}
                  />
                </div>

                {/* Suggestions List (Clean stacked items with subtle icons) */}
                <div className="w-full max-w-xl space-y-2 pt-1">
                  {suggestionItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setInput(item.prompt);
                        }}
                        disabled={isOffline || isLoading}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                                   text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]
                                   transition-colors text-left text-sm cursor-pointer disabled:opacity-50"
                      >
                        <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="font-sans">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Active Conversation Message Stream */
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((m) => {
                  const isUser = m.role === "user";

                  if (isUser) {
                    return (
                      <div key={m.id} className="flex justify-end">
                        {/* Clean User Bubble — No "YOU", no timestamps */}
                        <div className={`max-w-[85%] sm:max-w-[75%] ${socratesTheme.userBubble}`}>
                          <div className="text-sm text-zinc-100 whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Assistant Turn — Clean Markdown, zero noisy headers/badges
                  return (
                    <div key={m.id} className="flex justify-start w-full py-1">
                      <div className="w-full text-zinc-100 text-sm leading-relaxed font-sans">
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
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Display Error Message with Retry */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs flex items-center justify-between gap-3">
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
            </div>
          )}

          {/* Sticky Floating Glass Composer (Active Chat State) */}
          {messages.length > 0 && (
            <div className="shrink-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/95 to-transparent pt-3 pb-2">
              <SocratesComposer
                value={input}
                onChange={setInput}
                onSubmit={(text) => sendMessage(text)}
                onStop={stopGeneration}
                isStreaming={isStreaming}
                isLoading={isLoading}
                disabled={isOffline}
                placeholder="Ask Socrates..."
                modelDisplayName={modelDisplayName}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SocratesWorkspace;
