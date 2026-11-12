/**
 * Socrates Floating Glass Composer
 * File: src/components/socrates/SocratesComposer.tsx
 *
 * Core Features:
 * 1. Auto-Resizing Multiline Textarea:
 *    - Grows dynamically with multiline input up to maxHeight (200px).
 *    - Automatically resets height upon message submission.
 * 2. Keyboard Ergonomics:
 *    - Enter sends message; Shift+Enter inserts newline.
 *    - Global Escape key cancels active generation mid-stream.
 * 3. Quick Contextual Prompt Chips:
 *    - Interactive pills for algorithmic complexity, code debugging, analogies, and step traces.
 * 4. Morphing Action Button:
 *    - Send icon (electric blue glow) when idle.
 *    - Morphs into pulsing red/amber Stop square when streaming.
 * 5. Refined Blue-Black Glassmorphism Aesthetic:
 *    - Translucent midnight canvas (#090d16/85), subtle cyan border glow, backdrop blur.
 */

"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Send, Square, Sparkles, Code2, Zap, Layers } from "lucide-react";

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
  className?: string;
}

// Default contextual chips matching Socratic dialectic curriculum
export const DEFAULT_PROMPT_CHIPS: PromptChip[] = [
  {
    id: "complexity",
    label: "Explain complexity",
    prompt: "Analyze the time and space complexity of this algorithm with big-O notation: ",
    icon: Zap,
  },
  {
    id: "debug",
    label: "Debug my code",
    prompt: "Analyze this code snippet for bugs, edge cases, and memory invariants: ",
    icon: Code2,
  },
  {
    id: "analogy",
    label: "Intuitive analogy",
    prompt: "Explain this concept using an intuitive real-world analogy: ",
    icon: Sparkles,
  },
  {
    id: "trace",
    label: "Step-by-step trace",
    prompt: "Trace this algorithm step-by-step with state transitions: ",
    icon: Layers,
  },
];

// =============================================================================
// Pure Logic Helpers (Exported for Unit Testing & Reusability)
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
  placeholder = "Ask Socrates about algorithms, systems, debugging, or concepts...",
  maxHeight = 200,
  chips = DEFAULT_PROMPT_CHIPS,
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

  const handleChipClick = (chipPrompt: string) => {
    if (isStreaming || disabled) return;
    onChange(chipPrompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;

  return (
    <div className={`w-full max-w-4xl mx-auto px-4 pb-4 pt-1 ${className}`}>
      {/* Quick Prompt Chips */}
      {chips.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip.prompt)}
                disabled={disabled || isStreaming}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono rounded-full
                           bg-slate-900/60 hover:bg-cyan-950/50 text-slate-300 hover:text-cyan-300
                           border border-slate-800/80 hover:border-cyan-500/40
                           backdrop-blur-md transition-all duration-200 cursor-pointer
                           active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {Icon && <Icon className="w-3.5 h-3.5 text-cyan-400" />}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Glassmorphism Floating Composer Box */}
      <div
        className="relative rounded-2xl bg-[#090d16]/85 backdrop-blur-xl border border-white/10
                   hover:border-blue-500/30 focus-within:border-cyan-500/50
                   focus-within:ring-2 focus-within:ring-cyan-500/20
                   shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-200"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          aria-label="Socrates message composer"
          className="w-full bg-transparent text-slate-100 placeholder-slate-400/70 text-sm md:text-base
                     resize-none focus:outline-none py-3.5 pl-4 pr-14 leading-relaxed
                     disabled:opacity-50 disabled:cursor-not-allowed overflow-y-auto"
          style={{ minHeight: "44px", maxHeight: `${maxHeight}px` }}
        />

        {/* Morphing Action Button (Send / Stop) */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop generation (Esc)"
              aria-label="Stop generation"
              className="p-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white
                         shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all duration-200
                         animate-pulse cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              title="Send message (Enter)"
              aria-label="Send message"
              className={`p-2 rounded-xl text-white transition-all duration-200 flex items-center justify-center ${
                canSubmit
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95"
                  : "bg-slate-800/60 text-slate-500 cursor-not-allowed opacity-50"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Hint Subtext */}
      <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] font-mono text-slate-500 select-none">
        <span>Enter to send · Shift+Enter for newline</span>
        {isStreaming && <span className="text-rose-400 animate-pulse">Esc to stop generation</span>}
      </div>
    </div>
  );
}

export default SocratesComposer;
