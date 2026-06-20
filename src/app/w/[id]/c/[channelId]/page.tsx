"use client";

import { ChatView } from "@/components/ChatView";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { apiFetch } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChannelPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const channelId = params.channelId as string;
  const [channelName, setChannelName] = useState("");

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/channels`);
      if (res.ok) {
        const data = await res.json();
        const channel = data.channels.find((c: { id: string }) => c.id === channelId);
        if (channel) setChannelName(channel.name);
      }
    }
    load();
  }, [workspaceId, channelId]);

  return (
    <WorkspaceLayout workspaceId={workspaceId}>
      <ChatView channelId={channelId} channelName={channelName || "..."} />
    </WorkspaceLayout>
  );
}
