"use client";

import { ChatView } from "@/components/ChatView";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { apiFetch } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DmPage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const channelId = params.channelId as string;
  const [dmName, setDmName] = useState("");

  useEffect(() => {
    async function load() {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/channels`);
      if (res.ok) {
        const data = await res.json();
        const dm = data.dms.find((d: { id: string }) => d.id === channelId);
        if (dm?.otherUser) setDmName(dm.otherUser.displayName);
      }
    }
    load();
  }, [workspaceId, channelId]);

  return (
    <WorkspaceLayout workspaceId={workspaceId}>
      <ChatView channelId={channelId} channelName={dmName || "..."} isDm />
    </WorkspaceLayout>
  );
}
