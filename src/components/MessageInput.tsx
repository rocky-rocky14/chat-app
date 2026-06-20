"use client";

import { useState } from "react";

interface Props {
  onSend: (content: string) => Promise<void>;
  placeholder?: string;
}

export function MessageInput({ onSend, placeholder = "メッセージを入力..." }: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || sending) return;

    setSending(true);
    try {
      await onSend(content.trim());
      setContent("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none"
          disabled={sending}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || sending}
          className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          送信
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">Enter で送信、Shift+Enter で改行</p>
    </div>
  );
}
