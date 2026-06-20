"use client";

import type { Message } from "@/lib/types";
import { formatAbsoluteTime, formatRelativeTime, getInitials } from "@/lib/user";
import { useState } from "react";

interface Props {
  message: Message;
  isOwn: boolean;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MessageItem({ message, isOwn, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isDeleted = !!message.deletedAt;
  const isEdited =
    !isDeleted &&
    new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime() + 1000;

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await onEdit(message.id, editContent.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("このメッセージを削除しますか？")) return;
    await onDelete(message.id);
    setShowMenu(false);
  };

  return (
    <div
      className="group flex gap-3 px-4 py-1.5 hover:bg-slate-50"
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-semibold text-indigo-700">
        {getInitials(message.user.displayName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-slate-800">{message.user.displayName}</span>
          <span
            className="text-xs text-slate-400"
            title={formatAbsoluteTime(message.createdAt)}
          >
            {formatRelativeTime(message.createdAt)}
          </span>
          {isEdited && <span className="text-xs text-slate-400">(edited)</span>}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editContent.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditContent(message.content);
                }}
                className="rounded-lg px-3 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <p className={`mt-0.5 whitespace-pre-wrap break-words text-sm ${isDeleted ? "italic text-slate-400" : "text-slate-700"}`}>
            {isDeleted ? "このメッセージは削除されました" : message.content}
          </p>
        )}
      </div>

      {isOwn && !isDeleted && !editing && (
        <div className="relative shrink-0 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-10 w-28 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                onClick={() => {
                  setEditing(true);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                編集
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
