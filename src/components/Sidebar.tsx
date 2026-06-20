"use client";

import type { Channel, Workspace, WorkspaceMember } from "@/lib/types";
import { getInitials } from "@/lib/user";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CreateChannelModal } from "./CreateChannelModal";

interface Props {
  workspace: Workspace;
  channels: Channel[];
  dms: Channel[];
  members: WorkspaceMember[];
  onRefresh: () => void;
  onStartDm: (targetUserId: string) => void;
}

export function Sidebar({
  workspace,
  channels,
  dms,
  members,
  onRefresh,
  onStartDm,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${workspace.inviteCode}`
      : `/invite/${workspace.inviteCode}`;

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white">
        <div className="border-b border-slate-700 px-4 py-3">
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-300">
            ← ワークスペース一覧
          </Link>
          <h1 className="mt-1 truncate font-bold">{workspace.name}</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              チャンネル
            </span>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
              title="チャンネルを作成"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {channels.map((channel) => {
            const href = `/w/${workspace.id}/c/${channel.id}`;
            return (
              <Link
                key={channel.id}
                href={href}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                  isActive(href)
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="truncate">
                  <span className="text-slate-400"># </span>
                  {channel.name}
                </span>
                {(channel.unreadCount ?? 0) > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {channel.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="mb-1 mt-4 flex items-center justify-between px-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              ダイレクトメッセージ
            </span>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="rounded p-0.5 text-slate-400 hover:bg-slate-700 hover:text-white"
              title="メンバー一覧"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
          </div>

          {dms.map((dm) => {
            const href = `/w/${workspace.id}/dm/${dm.id}`;
            const name = dm.otherUser?.displayName ?? "DM";
            return (
              <Link
                key={dm.id}
                href={href}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                  isActive(href)
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="truncate">{name}</span>
                {(dm.unreadCount ?? 0) > 0 && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {dm.unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {showMembers && (
            <div className="mt-2 rounded-lg bg-slate-800 p-2">
              <p className="mb-2 px-1 text-xs font-semibold text-slate-400">メンバー</p>
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onStartDm(member.userId);
                    setShowMembers(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-900 text-xs font-semibold text-indigo-300">
                    {getInitials(member.user.displayName)}
                  </span>
                  <span className="truncate">{member.user.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 p-3">
          <button
            onClick={copyInvite}
            className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700"
          >
            {copied ? "コピーしました！" : "招待リンクをコピー"}
          </button>
        </div>
      </aside>

      {showCreateChannel && (
        <CreateChannelModal
          workspaceId={workspace.id}
          onClose={() => setShowCreateChannel(false)}
          onCreated={(channelId) => {
            onRefresh();
            router.push(`/w/${workspace.id}/c/${channelId}`);
          }}
        />
      )}
    </>
  );
}
