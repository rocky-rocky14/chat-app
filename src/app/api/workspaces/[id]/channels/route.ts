import { NextResponse } from "next/server";
import {
  getUserId,
  isValidChannelName,
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

  const publicChannels = await prisma.channel.findMany({
    where: { workspaceId, type: "public" },
    orderBy: { name: "asc" },
  });

  const dmChannels = await prisma.channel.findMany({
    where: {
      workspaceId,
      type: "dm",
      members: { some: { userId: user.id } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, displayName: true, createdAt: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const channelMembers = await prisma.channelMember.findMany({
    where: {
      userId: user.id,
      channel: { workspaceId },
    },
    select: { channelId: true, lastReadAt: true },
  });

  const lastReadMap = new Map(channelMembers.map((m) => [m.channelId, m.lastReadAt]));

  const unreadCounts = await Promise.all(
    [...publicChannels, ...dmChannels].map(async (channel) => {
      const lastReadAt = lastReadMap.get(channel.id) ?? new Date(0);
      const count = await prisma.message.count({
        where: {
          channelId: channel.id,
          deletedAt: null,
          createdAt: { gt: lastReadAt },
          userId: { not: user.id },
        },
      });
      return { channelId: channel.id, count };
    })
  );

  const unreadMap = new Map(unreadCounts.map((u) => [u.channelId, u.count]));

  const channels = publicChannels.map((c) => ({
    ...c,
    unreadCount: unreadMap.get(c.id) ?? 0,
  }));

  const dms = dmChannels.map((c) => {
    const otherUser = c.members.find((m) => m.userId !== user.id)?.user;
    return {
      id: c.id,
      workspaceId: c.workspaceId,
      name: c.name,
      type: c.type,
      createdAt: c.createdAt,
      otherUser,
      unreadCount: unreadMap.get(c.id) ?? 0,
    };
  });

  return NextResponse.json({ channels, dms });
}

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
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "チャンネル名は必須です" }, { status: 400 });
  }

  const channelName = name.trim().toLowerCase();
  if (!isValidChannelName(channelName)) {
    return NextResponse.json(
      { error: "チャンネル名は英小文字・数字・ハイフンのみ使用できます" },
      { status: 400 }
    );
  }

  const existing = await prisma.channel.findUnique({
    where: { workspaceId_name: { workspaceId, name: channelName } },
  });

  if (existing) {
    return NextResponse.json({ error: "このチャンネル名は既に使われています" }, { status: 409 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  const channel = await prisma.channel.create({
    data: {
      workspaceId,
      name: channelName,
      type: "public",
      members: {
        create: members.map((m) => ({ userId: m.userId })),
      },
    },
  });

  return NextResponse.json(channel, { status: 201 });
}
