"use client";

import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/api-client";
import { useState } from "react";

export function UserNamePrompt() {
  const { userId, setUser, isReady } = useUser();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isReady || userId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        body: JSON.stringify({ displayName: input.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ユーザー作成に失敗しました");
      }

      const user = await res.json();
      setUser(user.id, user.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
            <svg className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">ChatSpace へようこそ</h2>
          <p className="mt-2 text-sm text-slate-500">
            表示名を入力してチャットを始めましょう
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="あなたの名前"
            className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "作成中..." : "始める"}
          </button>
        </form>
      </div>
    </div>
  );
}
