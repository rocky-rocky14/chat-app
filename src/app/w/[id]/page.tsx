"use client";

import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { apiFetch } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  useEffect(() => {
    async function redirect() {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/channels`);
      if (res.ok) {
        const data = await res.json();
        const general = data.channels.find((c: { name: string }) => c.name === "general");
        if (general) {
          router.replace(`/w/${workspaceId}/c/${general.id}`);
        }
      }
    }
    redirect();
  }, [workspaceId, router]);

  return (
    <WorkspaceLayout workspaceId={workspaceId}>
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    </WorkspaceLayout>
  );
}
