/**
 * Socrates Conversation History Drawer & Session Sidebar
 * File: src/components/socrates/SocratesSidebar.tsx
 *
 * Core Features:
 * 1. Date Grouping:
 *    - Categorizes sessions into "Pinned", "Today", "Yesterday", "Previous 7 Days", "Older".
 * 2. Real-Time Search Filter:
 *    - Substring search filtering sessions dynamically with clear button.
 * 3. Session Actions & In-Place Workflows:
 *    - Switch active session on click (active styling with electric cyan glow).
 *    - Inline rename with Enter to save and Escape to cancel.
 *    - Pin / unpin toggle with gold highlight.
 *    - Delete with inline two-step confirmation (prevents accidental data loss).
 *    - Bulk clear all dialectics with explicit confirmation modal.
 * 4. Responsive Drawer:
 *    - Desktop collapsible sidebar and mobile slide-over overlay with backdrop blur.
 * 5. Strict CR Intelligence Isolation: Zero CR dependencies.
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  X,
  MessageSquare,
  Pin,
  Pencil,
  Trash2,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  ConversationSummary,
  DateBucket,
  groupConversationsByDate,
  filterConversations,
} from "./useSocratesChat";

// =============================================================================
// Interface Definitions
// =============================================================================

export interface SocratesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => Promise<void> | void;
  onTogglePinConversation: (id: string, pinned: boolean) => Promise<void> | void;
  onDeleteConversation: (id: string) => Promise<void> | void;
  onClearAllConversations: () => Promise<void> | void;
  isLoading?: boolean;
  className?: string;
}

// =============================================================================
// Pure Logic Helpers (Exported for Unit Testing & Reusability)
// =============================================================================

/**
 * Validates and sanitizes a conversation title.
 * Enforces non-empty after trimming, caps title at 150 characters.
 */
export function validateConversationTitle(raw: string): { valid: boolean; title: string } {
  const trimmed = (raw || "").trim();
  if (!trimmed || trimmed.length === 0) {
    return { valid: false, title: "" };
  }
  const title = trimmed.length > 150 ? trimmed.slice(0, 150) : trimmed;
  return { valid: true, title };
}

/**
 * Computes the inverted pin state for conversation pin/unpin toggles.
 */
export function togglePinState(currentPinned: boolean): boolean {
  return !currentPinned;
}

export function SocratesSidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
  onClearAllConversations,
  isLoading = false,
  className = "",
}: SocratesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus rename input on edit start
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Filter and group conversations
  const filtered = useMemo(() => {
    return filterConversations(conversations, searchQuery);
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => {
    return groupConversationsByDate(filtered);
  }, [filtered]);

  // Handle inline rename commit
  const handleSaveRename = (id: string) => {
    const validated = validateConversationTitle(editTitle);
    if (validated.valid) {
      onRenameConversation(id, validated.title);
    }
    setEditingId(null);
    setEditTitle("");
  };

  const handleStartRename = (e: React.MouseEvent, conv: ConversationSummary) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setConfirmDeleteId(null);
  };

  const handleStartDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
    setEditingId(null);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const handleTogglePin = (e: React.MouseEvent, conv: ConversationSummary) => {
    e.stopPropagation();
    onTogglePinConversation(conv.id, togglePinState(!!conv.pinned));
  };

  const bucketKeys: DateBucket[] = ["Pinned", "Today", "Yesterday", "Previous 7 Days", "Older"];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-20 w-80 max-w-[85vw]
                   flex flex-col bg-[#070b14]/95 md:bg-[#070b14]/80 backdrop-blur-2xl
                   border-r border-blue-900/30 text-slate-200 transition-transform duration-300 ease-in-out
                   ${isOpen ? "translate-x-0" : "-translate-x-full md:hidden"} ${className}`}
        aria-label="Socrates Conversation Drawer"
      >
        {/* Header: Title & Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-100 font-sans">
              DIALECTIC HISTORY
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 md:hidden cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Dialectic Button */}
        <div className="p-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNewConversation();
              if (typeof window !== "undefined" && window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2
                       bg-gradient-to-r from-blue-600/30 to-cyan-600/30 hover:from-blue-600/50 hover:to-cyan-600/50
                       border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 font-medium text-xs font-mono
                       transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>NEW DIALECTIC</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dialectics..."
              className="w-full py-1.5 pl-8 pr-7 text-xs rounded-lg bg-slate-900/70 border border-white/5
                         text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List with Date Grouping */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 text-xs font-sans">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-slate-500 font-mono text-[11px]">
              Loading sessions...
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-8 px-4 text-center text-slate-500 font-mono text-[11px]">
              {searchQuery ? `No dialectics matching "${searchQuery}"` : "No dialectic history yet"}
            </div>
          )}

          {!isLoading &&
            bucketKeys.map((bucket) => {
              const items = grouped[bucket];
              if (!items || items.length === 0) return null;

              return (
                <div key={bucket} className="space-y-1">
                  {/* Bucket Header */}
                  <div className="px-2 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>{bucket}</span>
                    <span className="text-slate-600">{items.length}</span>
                  </div>

                  {/* Bucket Session Items */}
                  {items.map((conv) => {
                    const isActive = conv.id === activeConversationId;
                    const isEditing = conv.id === editingId;
                    const isConfirmingDelete = conv.id === confirmDeleteId;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          if (!isEditing && !isConfirmingDelete) {
                            onSelectConversation(conv.id);
                            if (typeof window !== "undefined" && window.innerWidth < 768) onClose();
                          }
                        }}
                        className={`group relative flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-blue-600/20 border border-cyan-500/40 text-cyan-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                            : "hover:bg-slate-900/60 border border-transparent text-slate-300 hover:text-slate-100"
                        }`}
                      >
                        {/* Title or Inline Edit */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                          <MessageSquare
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-400"
                            }`}
                          />

                          {isEditing ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(conv.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              onBlur={() => handleSaveRename(conv.id)}
                              className="w-full bg-slate-950 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span className="truncate text-xs select-none">{conv.title}</span>
                          )}
                        </div>

                        {/* Inline Delete Confirmation */}
                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1 shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleConfirmDelete(e, conv.id)}
                              title="Confirm delete"
                              className="p-1 rounded bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelDelete}
                              title="Cancel"
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : !isEditing ? (
                          /* Hover Actions */
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {/* Pin / Unpin */}
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(e, conv)}
                              title={conv.pinned ? "Unpin dialectic" : "Pin dialectic"}
                              className={`p-1 rounded hover:bg-white/10 cursor-pointer ${
                                conv.pinned ? "text-amber-400" : "text-slate-400"
                              }`}
                            >
                              <Pin className="w-3 h-3" />
                            </button>

                            {/* Rename */}
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(e, conv)}
                              title="Rename dialectic"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => handleStartDelete(e, conv.id)}
                              title="Delete dialectic"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null}

                        {/* Always visible pin badge if pinned and not hovered */}
                        {conv.pinned && !isEditing && !isConfirmingDelete && (
                          <Pin className="w-3 h-3 text-amber-400 group-hover:hidden shrink-0 ml-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {/* Footer: Bulk Clear All Dialectics */}
        <div className="p-3 border-t border-white/5 shrink-0">
          {showClearConfirm ? (
            <div className="space-y-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear all history?</span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-tight">
                This will permanently delete all conversation dialectics.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllConversations();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              disabled={conversations.length === 0}
              className="w-full py-1.5 px-3 rounded-lg flex items-center justify-center gap-2
                         text-[11px] font-mono text-slate-500 hover:text-rose-400 hover:bg-rose-950/20
                         disabled:opacity-40 disabled:hover:text-slate-500 disabled:hover:bg-transparent
                         transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all dialectics</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default SocratesSidebar;
