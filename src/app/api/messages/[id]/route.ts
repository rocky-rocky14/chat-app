import { NextResponse } from "next/server";
import { getUserId, requireUser, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    return NextResponse.json({ error: "メッセージが見つかりません" }, { status: 404 });
  }

  if (message.userId !== user.id) {
    return NextResponse.json({ error: "自分のメッセージのみ編集できます" }, { status: 403 });
  }

  if (message.deletedAt) {
    return NextResponse.json({ error: "削除済みのメッセージは編集できません" }, { status: 400 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "メッセージ内容は必須です" }, { status: 400 });
  }

  const updated = await prisma.message.update({
    where: { id },
    data: { content: content.trim() },
    include: {
      user: { select: { id: true, displayName: true, createdAt: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) {
    return NextResponse.json({ error: "メッセージが見つかりません" }, { status: 404 });
  }

  if (message.userId !== user.id) {
    return NextResponse.json({ error: "自分のメッセージのみ削除できます" }, { status: 403 });
  }

  const deleted = await prisma.message.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: {
      user: { select: { id: true, displayName: true, createdAt: true } },
    },
  });

  return NextResponse.json(deleted);
}
