"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Conversation } from "@/types/ai-tutor";

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

/**
 * One chat in the sidebar: click to open, "⋯" for Rename / Delete.
 * All state (menu open, renaming, confirm, busy) is local to THIS chat, so acting on one
 * conversation can never affect another.
 */
export default function ConversationItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const cancelledRef = useRef(false); // Escape pressed → the blur that follows must not save
  const rootRef = useRef<HTMLLIElement>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Close the menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        dotsRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (confirmingDelete) cancelRef.current?.focus();
  }, [confirmingDelete]);

  async function commitRename() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    const next = draft.trim();
    if (!next || next === conversation.title) {
      setRenaming(false);
      setDraft(conversation.title);
      return;
    }
    setBusy(true);
    const ok = await onRename(next);
    setBusy(false);
    if (ok) setRenaming(false);
    else setDraft(conversation.title);
  }

  async function confirmDelete() {
    setBusy(true);
    const ok = await onDelete();
    setBusy(false);
    if (!ok) setConfirmingDelete(false); // on success this item unmounts
  }

  return (
    <li ref={rootRef} className="relative group">
      {renaming ? (
        <form
          className="px-1.5 py-1"
          onSubmit={(e) => {
            e.preventDefault();
            void commitRename();
          }}>
          <label className="sr-only" htmlFor={`${menuId}-rename`}>
            Conversation title
          </label>
          <input
            id={`${menuId}-rename`}
            ref={inputRef}
            value={draft}
            maxLength={100}
            disabled={busy}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                cancelledRef.current = true;
                setRenaming(false);
                setDraft(conversation.title);
              }
            }}
            onBlur={() => void commitRename()}
            className="w-full rounded-lg border border-green-600 bg-white px-2 py-1.5 text-[12px] font-semibold text-text-main outline-none focus:ring-2 focus:ring-green-500"
          />
          <p className="mt-1 px-0.5 text-[10px] text-text-light">Enter to save · Esc to cancel</p>
        </form>
      ) : (
        <div
          className={`flex items-center rounded-lg transition-colors ${
            active ? "bg-green-800/[0.08]" : "hover:bg-green-800/[0.04]"
          }`}>
          <button
            type="button"
            onClick={onSelect}
            aria-current={active ? "true" : undefined}
            aria-label={`Open conversation: ${conversation.title}`}
            className="min-w-0 flex-1 cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-1.5 text-left focus-visible:outline-2 focus-visible:outline-green-500">
            <div
              className={`truncate text-[12px] text-text-main ${active ? "font-bold" : "font-semibold"}`}>
              {conversation.title}
            </div>
            {conversation.lastMessage && (
              <div className="truncate text-[11px] text-text-light">{conversation.lastMessage}</div>
            )}
          </button>
          <button
            ref={dotsRef}
            type="button"
            onClick={() => {
              // Open upward when there isn't room below inside the scrolling chat list.
              const item = rootRef.current?.getBoundingClientRect();
              const box = rootRef.current?.closest("section")?.getBoundingClientRect();
              setOpenUp(
                !!item && !!box && item.bottom + 96 > box.bottom && item.top - 96 > box.top,
              );
              setMenuOpen((o) => !o);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            aria-label={`Actions for ${conversation.title}`}
            className={`mr-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-green-800/15 text-green-900 hover:bg-green-800/15 focus-visible:outline-2 focus-visible:outline-green-500 ${
              menuOpen ? "bg-green-800/15" : "bg-white"
            }`}>
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {menuOpen && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${conversation.title}`}
          className={`absolute right-1 z-30 w-40 overflow-hidden rounded-xl border border-green-500/15 bg-white py-1 shadow-lg ${openUp ? "bottom-full mb-1" : "top-full mt-1"}`}>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setDraft(conversation.title);
              setRenaming(true);
            }}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-2 text-left text-[12px] font-semibold text-text-main hover:bg-green-800/[0.06] focus-visible:bg-green-800/[0.06] focus-visible:outline-none">
            <Pencil size={13} aria-hidden="true" /> Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setConfirmingDelete(true);
            }}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-3 py-2 text-left text-[12px] font-semibold text-red-700 hover:bg-red-50 focus-visible:bg-red-50 focus-visible:outline-none">
            <Trash2 size={13} aria-hidden="true" /> Delete
          </button>
        </div>
      )}

      {confirmingDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`${menuId}-t`}
          aria-describedby={`${menuId}-d`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onKeyDown={(e) => e.key === "Escape" && !busy && setConfirmingDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 id={`${menuId}-t`} className="mb-1 text-[15px] font-bold text-text-main">
              Delete this conversation?
            </h3>
            <p id={`${menuId}-d`} className="mb-4 text-[13px] text-text-muted">
              “{conversation.title}” and all its messages will be permanently deleted. This
              can&apos;t be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                disabled={busy}
                onClick={() => setConfirmingDelete(false)}
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-semibold text-text-main hover:bg-gray-50 disabled:opacity-60">
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void confirmDelete()}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-red-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
