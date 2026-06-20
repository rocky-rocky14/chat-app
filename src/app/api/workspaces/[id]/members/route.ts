import { NextResponse } from "next/server";
import {
  getUserId,
  requireUser,
  requireWorkspaceMember,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id: workspaceId } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const membership = await requireWorkspaceMember(workspaceId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "ワークスペースにアクセスできません" }, { status: 403 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, displayName: true, createdAt: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
}
