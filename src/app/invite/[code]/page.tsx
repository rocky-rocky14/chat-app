"use client";

import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/api-client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { userId, isReady } = useUser();

  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/invite/${code}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setWorkspaceName(data.name);
      })
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!userId) return;

    setJoining(true);
    setError("");

    try {
      const res = await apiFetch(`/api/invite/${code}`, { method: "POST" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "参加に失敗しました");
      }

      const data = await res.json();
      if (data.defaultChannelId) {
        router.push(`/w/${data.workspaceId}/c/${data.defaultChannelId}`);
      } else {
        router.push(`/w/${data.workspaceId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加に失敗しました");
    } finally {
      setJoining(false);
    }
  };

  if (loading || !isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500">招待リンクが無効です</p>
        <Link href="/" className="mt-4 text-sm text-indigo-600 hover:text-indigo-700">
          ← ホームに戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
            <svg className="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800">ワークスペースに参加</h1>
          <p className="mt-2 text-sm text-slate-500">
            <span className="font-medium text-indigo-600">{workspaceName}</span> に招待されました
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}

        {!userId ? (
          <p className="text-center text-sm text-slate-500">
            参加するには、まずホーム画面で表示名を設定してください。
          </p>
        ) : (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {joining ? "参加中..." : "ワークスペースに参加"}
          </button>
        )}

        <Link
          href="/"
          className="mt-4 block text-center text-sm text-slate-500 hover:text-slate-700"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
