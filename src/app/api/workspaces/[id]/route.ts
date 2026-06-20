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
  const { id } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const membership = await requireWorkspaceMember(id, user.id);
  if (!membership) {
    return NextResponse.json({ error: "ワークスペースにアクセスできません" }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true, channels: true } },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: "ワークスペースが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const membership = await requireWorkspaceMember(id, user.id);
  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "削除権限がありません" }, { status: 403 });
  }

  await prisma.workspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
