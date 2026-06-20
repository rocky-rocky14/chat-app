import { NextResponse } from "next/server";
import {
  getUserId,
  requireChannelAccess,
  requireUser,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id: channelId } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const channel = await requireChannelAccess(channelId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "このチャンネルにアクセスする権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const since = searchParams.get("since");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);

  if (since) {
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        createdAt: { gt: new Date(since) },
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, displayName: true, createdAt: true } },
      },
    });

    return NextResponse.json({ messages, nextCursor: null });
  }

  const messages = await prisma.message.findMany({
    where: { channelId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    include: {
      user: { select: { id: true, displayName: true, createdAt: true } },
    },
  });

  const hasMore = messages.length > limit;
  const items = hasMore ? messages.slice(0, limit) : messages;

  return NextResponse.json({
    messages: items.reverse(),
    nextCursor: hasMore ? messages[limit]?.id ?? null : null,
  });
}

export async function POST(request: Request, { params }: Params) {
  const { id: channelId } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const channel = await requireChannelAccess(channelId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "このチャンネルにアクセスする権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "メッセージ内容は必須です" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      userId: user.id,
      content: content.trim(),
    },
    include: {
      user: { select: { id: true, displayName: true, createdAt: true } },
    },
  });

  await prisma.channelMember.updateMany({
    where: { channelId, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(message, { status: 201 });
}
