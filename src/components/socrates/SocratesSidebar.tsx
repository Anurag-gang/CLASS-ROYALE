/**
 * Socrates Conversation History Drawer & Session Sidebar
 * File: src/components/socrates/SocratesSidebar.tsx
 *
 * Implements clean, minimalist layout referencing ChatGPT conversation history:
 * - "+ New chat" prominent action button
 * - "Recents" conversation list with instant load & inline management (rename, pin, delete)
 * - User profile pill at the bottom (Avatar, Name, Role)
 * - Zero ChatGPT plugins/store or marketing bloat
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
  PanelLeftClose,
  Sparkles,
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
  currentUser?: {
    name?: string;
    username?: string;
    role?: string;
  } | null;
  className?: string;
}

// =============================================================================
// Pure Logic Helpers (Preserved for Unit Testing & Contract Adherence)
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
  currentUser = null,
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

  // Commit rename
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

  // Display user information
  const displayName = currentUser?.name || currentUser?.username || "Anurag";
  const userInitials = (displayName[0] || "A").toUpperCase();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-50 md:z-20 w-64 max-w-[85vw]
                   flex flex-col bg-[#0d0f12] text-zinc-300 border-r border-white/[0.08]
                   transition-all duration-300 ease-in-out select-none
                   ${isOpen ? "translate-x-0" : "-translate-x-full md:hidden"} ${className}`}
        aria-label="Socrates Conversation Drawer"
      >
        {/* Header: Brand & Collapse Toggle */}
        <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white tracking-wide text-sm">
              Socrates
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action: + New Chat */}
        <div className="px-3 py-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onNewConversation();
              if (typeof window !== "undefined" && window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl flex items-center justify-between
                       bg-[#181b21] hover:bg-[#20242c] border border-white/10 hover:border-white/20
                       text-zinc-200 hover:text-white text-xs font-medium
                       transition-all duration-150 cursor-pointer active:scale-98 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>New chat</span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full py-1.5 pl-8 pr-7 text-xs rounded-lg bg-[#14171d] border border-white/5
                         text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation History / Recents */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 text-xs font-sans">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-zinc-500 text-xs">
              Loading conversations...
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="py-8 px-3 text-center text-zinc-500 text-xs">
              {searchQuery ? `No chats matching "${searchQuery}"` : "No saved chats yet"}
            </div>
          )}

          {!isLoading &&
            bucketKeys.map((bucket) => {
              const items = grouped[bucket];
              if (!items || items.length === 0) return null;

              return (
                <div key={bucket} className="space-y-0.5">
                  {/* Bucket Header */}
                  <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{bucket === "Pinned" ? "Pinned" : bucket === "Today" ? "Recents" : bucket}</span>
                    <span className="text-zinc-600 text-[10px]">{items.length}</span>
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
                        className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer ${
                          isActive
                            ? "bg-[#1e2229] text-white font-medium shadow-sm"
                            : "hover:bg-[#181b21] text-zinc-300 hover:text-zinc-100"
                        }`}
                      >
                        {/* Title or Inline Rename */}
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
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
                              className="w-full bg-black/60 border border-cyan-500/50 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                            />
                          ) : (
                            <span className="truncate text-xs">{conv.title}</span>
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
                              className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : !isEditing ? (
                          /* Hover Action Buttons */
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {/* Pin / Unpin */}
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(e, conv)}
                              title={conv.pinned ? "Unpin" : "Pin"}
                              className={`p-1 rounded hover:bg-white/10 cursor-pointer ${
                                conv.pinned ? "text-amber-400" : "text-zinc-400"
                              }`}
                            >
                              <Pin className="w-3 h-3" />
                            </button>

                            {/* Rename */}
                            <button
                              type="button"
                              onClick={(e) => handleStartRename(e, conv)}
                              title="Rename"
                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => handleStartDelete(e, conv.id)}
                              title="Delete"
                              className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-white/10 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : null}

                        {/* Always visible pin indicator when not hovered */}
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

        {/* Footer: User Account Profile Pill (Matching reference image bottom) */}
        <div className="p-3 border-t border-white/[0.08] shrink-0 space-y-2">
          {showClearConfirm ? (
            <div className="space-y-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Clear all history?</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllConversations();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 py-1 px-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {displayName}
                  </div>
                  <div className="text-[11px] text-zinc-400 truncate">
                    {currentUser?.role || "Student"}
                  </div>
                </div>
              </div>

              {conversations.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  title="Clear history"
                  className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default SocratesSidebar;
