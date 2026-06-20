"use client";

import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/api-client";
import type { Workspace } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface WorkspaceWithCounts extends Workspace {
  _count: { members: number; channels: number };
}

export default function HomePage() {
  const { userId, userName } = useUser();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/api/workspaces");
      if (res.ok) {
        setWorkspaces(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchWorkspaces();
    });
  }, [fetchWorkspaces]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    const res = await apiFetch(`/api/workspaces/${id}`, { method: "DELETE" });
    if (res.ok) fetchWorkspaces();
  };

  const handleCreated = async () => {
    await fetchWorkspaces();
    const res = await apiFetch("/api/workspaces");
    if (res.ok) {
      const data: (Workspace & { defaultChannelId?: string })[] = await res.json();
      const latest = data[0];
      if (latest) {
        const chRes = await apiFetch(`/api/workspaces/${latest.id}/channels`);
        if (chRes.ok) {
          const chData = await chRes.json();
          const general = chData.channels.find((c: { name: string }) => c.name === "general");
          if (general) {
            router.push(`/w/${latest.id}/c/${general.id}`);
          } else {
            router.push(`/w/${latest.id}`);
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800">ChatSpace</h1>
          </div>
          {userName && (
            <span className="text-sm text-slate-500">{userName} として使用中</span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">ワークスペース</h2>
            <p className="mt-1 text-sm text-slate-500">
              チームのチャットスペースを選択または作成しましょう
            </p>
          </div>
          {userId && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規ワークスペース
            </button>
          )}
        </div>

        {!userId ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16 text-center">
            <p className="text-slate-500">表示名を設定して始めましょう</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-slate-500">ワークスペースがありません</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              最初のワークスペースを作成 →
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
              >
                <Link href={`/w/${workspace.id}`} className="block">
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600">
                    {workspace.name}
                  </h3>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <span>{workspace._count.members} メンバー</span>
                    <span>{workspace._count.channels} チャンネル</span>
                  </div>
                </Link>
                <button
                  onClick={() => handleDelete(workspace.id, workspace.name)}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="削除"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
