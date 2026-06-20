"use client";

import { MessageInput } from "@/components/MessageInput";
import { MessageItem } from "@/components/MessageItem";
import { useUser } from "@/components/UserProvider";
import { apiFetch } from "@/lib/api-client";
import type { Message } from "@/lib/types";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  channelId: string;
  channelName: string;
  isDm?: boolean;
  onRead?: () => void;
}

const POLL_INTERVAL = 3000;

export function ChatView({ channelId, channelName, isDm, onRead }: Props) {
  const { userId } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async () => {
    const res = await apiFetch(`/api/channels/${channelId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
      setNextCursor(data.nextCursor);
      if (data.messages.length > 0) {
        lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    }
    setLoading(false);
  }, [channelId]);

  const markAsRead = useCallback(async () => {
    await apiFetch(`/api/channels/${channelId}/read`, { method: "POST" });
    onRead?.();
  }, [channelId, onRead]);

  const pollNewMessages = useCallback(async () => {
    if (!lastMessageTimeRef.current) return;

    const res = await apiFetch(
      `/api/channels/${channelId}/messages?since=${encodeURIComponent(lastMessageTimeRef.current)}`
    );

    if (res.ok) {
      const data = await res.json();
      if (data.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m: Message) => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs];
        });
        lastMessageTimeRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    }
  }, [channelId]);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      setMessages([]);
      lastMessageTimeRef.current = null;
      fetchMessages().then(() => {
        markAsRead();
        setTimeout(scrollToBottom, 100);
      });
    });
  }, [channelId, fetchMessages, markAsRead, scrollToBottom]);

  useEffect(() => {
    const interval = setInterval(pollNewMessages, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollNewMessages]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    const res = await apiFetch(
      `/api/channels/${channelId}/messages?cursor=${nextCursor}`
    );

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => [...data.messages, ...prev]);
      setNextCursor(data.nextCursor);
    }
    setLoadingMore(false);
  };

  const handleSend = async (content: string) => {
    const res = await apiFetch(`/api/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const message = await res.json();
      setMessages((prev) => [...prev, message]);
      lastMessageTimeRef.current = message.createdAt;
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleEdit = async (id: string, content: string) => {
    const res = await apiFetch(`/api/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const updated = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/messages/${id}`, { method: "DELETE" });

    if (res.ok) {
      const deleted = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === id ? deleted : m)));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2">
          {!isDm && <span className="text-slate-400">#</span>}
          <h2 className="font-semibold text-slate-800">{channelName}</h2>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <>
            {nextCursor && (
              <div className="mb-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {loadingMore ? "読み込み中..." : "過去のメッセージを表示"}
                </button>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="py-20 text-center text-sm text-slate-400">
                {isDm ? "DM を始めましょう" : `これが #${channelName} のはじまりです`}
              </div>
            ) : (
              messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.userId === userId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageInput
        onSend={handleSend}
        placeholder={isDm ? `${channelName} へのメッセージ` : `#${channelName} へのメッセージ`}
      />
    </div>
  );
}
