"use client";

import { Sidebar } from "@/components/Sidebar";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/api-client";
import type { Channel, Workspace, WorkspaceMember } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Props {
  workspaceId: string;
  children: React.ReactNode;
}

export function WorkspaceLayout({ workspaceId, children }: Props) {
  const { userId, isReady } = useUser();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dms, setDms] = useState<Channel[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    const [wsRes, chRes, memRes] = await Promise.all([
      apiFetch(`/api/workspaces/${workspaceId}`),
      apiFetch(`/api/workspaces/${workspaceId}/channels`),
      apiFetch(`/api/workspaces/${workspaceId}/members`),
    ]);

    if (wsRes.ok) setWorkspace(await wsRes.json());
    if (chRes.ok) {
      const data = await chRes.json();
      setChannels(data.channels);
      setDms(data.dms);
    }
    if (memRes.ok) setMembers(await memRes.json());

    setLoading(false);
  }, [workspaceId, userId]);

  useEffect(() => {
    if (isReady && !userId) return;
    queueMicrotask(() => {
      fetchData();
    });
  }, [fetchData, isReady, userId]);

  useEffect(() => {
    if (!userId || !isReady) return;
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, userId, isReady]);

  const handleStartDm = async (targetUserId: string) => {
    const res = await apiFetch(`/api/workspaces/${workspaceId}/dm`, {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });

    if (res.ok) {
      const dm = await res.json();
      await fetchData();
      router.push(`/w/${workspaceId}/dm/${dm.id}`);
      setSidebarOpen(false);
    }
  };

  if (loading || !workspace) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-slate-900 p-2 text-white md:hidden"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-30 transition-transform md:relative md:translate-x-0`}
      >
        <Sidebar
          workspace={workspace}
          channels={channels}
          dms={dms}
          members={members}
          onRefresh={fetchData}
          onStartDm={handleStartDm}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
