import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export function getUserId(request: Request): string | null {
  return request.headers.get("X-User-Id");
}

export function unauthorized() {
  return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
}

export function forbidden(message = "アクセス権限がありません") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "見つかりません") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export async function requireUser(userId: string | null) {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, displayName: true, createdAt: true },
  });

  return user;
}

export async function requireWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function requireChannelAccess(channelId: string, userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { members: true },
  });

  if (!channel) return null;

  const isMember = channel.members.some((m) => m.userId === userId);
  if (!isMember) return null;

  return channel;
}

export async function addUserToPublicChannels(workspaceId: string, userId: string) {
  const publicChannels = await prisma.channel.findMany({
    where: { workspaceId, type: "public" },
    select: { id: true },
  });

  if (publicChannels.length === 0) return;

  await prisma.channelMember.createMany({
    data: publicChannels.map((c) => ({
      channelId: c.id,
      userId,
    })),
    skipDuplicates: true,
  });
}

export function isValidChannelName(name: string): boolean {
  return /^[a-z0-9-]+$/.test(name);
}
