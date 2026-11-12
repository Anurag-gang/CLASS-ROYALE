/**
 * Socrates Minimalist Pill Composer
 * File: src/components/socrates/SocratesComposer.tsx
 *
 * Implements clean, floating pill composer referencing modern ChatGPT UI:
 * - Rounded pill container with auto-growing input
 * - Left "+" attachment/prompt trigger
 * - Center "Ask Socrates..." input
 * - Right: Model Name Pill (replaces "Think", displayed ONLY here)
 * - Circular Send / Stop action button
 * - Zero noisy keyboard helper texts
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import {
  Plus,
  ArrowUp,
  Square,
  Sparkles,
  Code2,
  Zap,
  BookOpen,
  Mic,
} from "lucide-react";

// =============================================================================
// Interface Definitions
// =============================================================================

export interface PromptChip {
  id: string;
  label: string;
  prompt: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface SocratesComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content?: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxHeight?: number;
  chips?: PromptChip[];
  modelDisplayName?: string;
  className?: string;
}

// Curated contextual chips
export const DEFAULT_PROMPT_CHIPS: PromptChip[] = [
  {
    id: "code",
    label: "Write or debug code",
    prompt: "Write or debug a solution for: ",
    icon: Code2,
  },
  {
    id: "concept",
    label: "Explain a complex concept",
    prompt: "Explain this computer science concept from first principles: ",
    icon: Sparkles,
  },
  {
    id: "complexity",
    label: "Algorithm complexity & Big-O",
    prompt: "Analyze the time and space complexity of this algorithm with big-O notation: ",
    icon: Zap,
  },
  {
    id: "curriculum",
    label: "Search academic curriculum",
    prompt: "Review the curriculum syllabus requirements for: ",
    icon: BookOpen,
  },
];

// =============================================================================
// Pure Logic Helpers (Preserved for Unit Testing & Contract Adherence)
// =============================================================================

/**
 * Calculates auto-grow height for composer textarea clamped between minHeight and maxHeight.
 */
export function calculateComposerHeight(
  scrollLength: number,
  minHeight: number = 44,
  maxHeight: number = 200
): number {
  return Math.min(Math.max(scrollLength, minHeight), maxHeight);
}

/**
 * Determines whether keyboard event triggers message submission.
 * Enter without Shift submits; Shift+Enter creates a newline.
 */
export function shouldSubmitOnEnter(key: string, shiftKey: boolean): boolean {
  return key === "Enter" && !shiftKey;
}

export function SocratesComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  isLoading,
  disabled = false,
  placeholder = "Ask Socrates...",
  maxHeight = 200,
  chips = DEFAULT_PROMPT_CHIPS,
  modelDisplayName = "Qwen 30B",
  className = "",
}: SocratesComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content up to maxHeight
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = calculateComposerHeight(textarea.scrollHeight, 44, maxHeight);
    textarea.style.height = `${nextHeight}px`;
  }, [maxHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Handle keyboard submission (Enter to send, Shift+Enter for newline, Esc to stop)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && isStreaming) {
      e.preventDefault();
      onStop();
      return;
    }

    if (shouldSubmitOnEnter(e.key, e.shiftKey)) {
      e.preventDefault();
      if (!isStreaming && !isLoading && !disabled && value.trim()) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || isLoading || disabled) return;
    onSubmit(trimmed);

    // Reset height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  };

  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className={`w-full max-w-3xl mx-auto px-4 pb-4 ${className}`}>
      {/* Floating Pill Composer Box */}
      <div
        className="relative flex items-center rounded-full bg-[#181b21] backdrop-blur-xl border border-white/10
                   focus-within:border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200 px-3 py-1.5"
      >
        {/* Left: Attachment / Action Trigger */}
        <button
          type="button"
          aria-label="Add attachment or action"
          disabled={disabled || isStreaming}
          onClick={() => {
            if (textareaRef.current) textareaRef.current.focus();
          }}
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Center: Autoresizing Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          aria-label="Socrates message composer"
          className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-sm
                     resize-none focus:outline-none px-3 py-2.5 leading-relaxed
                     disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
          style={{ minHeight: "44px", maxHeight: `${maxHeight}px` }}
        />

        {/* Right Controls: Model Name Pill (ONLY HERE) + Action Button */}
        <div className="flex items-center gap-2 shrink-0 pr-1">
          {/* Model Name Pill (Replaces 'Think' from reference image) */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/10
                       border border-white/10 text-xs text-zinc-300 font-sans cursor-default transition-colors select-none"
            title={`Active Model: ${modelDisplayName}`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium tracking-wide">{modelDisplayName}</span>
          </div>

          {/* Action Button: Circular Send / Stop / Mic */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generation (Esc)"
              aria-label="Stop generation"
              className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white
                         transition-all duration-150 cursor-pointer active:scale-95 flex items-center justify-center shrink-0 shadow-md"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              title={canSubmit ? "Send message (Enter)" : "Enter a prompt"}
              aria-label="Send message"
              className={`w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center shrink-0 ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                  : "bg-white/[0.06] text-zinc-500 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocratesComposer;
