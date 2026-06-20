import { NextResponse } from "next/server";
import {
  getUserId,
  requireUser,
  requireWorkspaceMember,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: workspaceId } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const membership = await requireWorkspaceMember(workspaceId, user.id);
  if (!membership) {
    return NextResponse.json({ error: "ワークスペースにアクセスできません" }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: "相手のユーザーIDが必要です" }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "自分自身とは DM できません" }, { status: 400 });
  }

  const targetMembership = await requireWorkspaceMember(workspaceId, targetUserId);
  if (!targetMembership) {
    return NextResponse.json({ error: "相手はこのワークスペースのメンバーではありません" }, { status: 400 });
  }

  const existingDms = await prisma.channel.findMany({
    where: {
      workspaceId,
      type: "dm",
      AND: [
        { members: { some: { userId: user.id } } },
        { members: { some: { userId: targetUserId } } },
      ],
    },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, createdAt: true } } },
      },
    },
  });

  const existing = existingDms.find((c) => c.members.length === 2);
  if (existing) {
    const otherUser = existing.members.find((m) => m.userId !== user.id)?.user;
    return NextResponse.json({
      id: existing.id,
      workspaceId: existing.workspaceId,
      name: existing.name,
      type: existing.type,
      createdAt: existing.createdAt,
      otherUser,
    });
  }

  const sortedIds = [user.id, targetUserId].sort();
  const dmName = `dm-${sortedIds[0]}-${sortedIds[1]}`;

  const channel = await prisma.channel.create({
    data: {
      workspaceId,
      name: dmName,
      type: "dm",
      members: {
        create: [{ userId: user.id }, { userId: targetUserId }],
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, createdAt: true } } },
      },
    },
  });

  const otherUser = channel.members.find((m) => m.userId !== user.id)?.user;

  return NextResponse.json(
    {
      id: channel.id,
      workspaceId: channel.workspaceId,
      name: channel.name,
      type: channel.type,
      createdAt: channel.createdAt,
      otherUser,
    },
    { status: 201 }
  );
}
