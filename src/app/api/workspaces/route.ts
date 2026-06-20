import { NextResponse } from "next/server";
import { getUserId, requireUser, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, channels: true } },
    },
  });

  return NextResponse.json(workspaces);
}

export async function POST(request: Request) {
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const body = await request.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "ワークスペース名は必須です" }, { status: 400 });
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: name.trim(),
        members: {
          create: { userId: user.id, role: "admin" },
        },
      },
    });

    const general = await tx.channel.create({
      data: {
        workspaceId: ws.id,
        name: "general",
        type: "public",
        members: {
          create: { userId: user.id },
        },
      },
    });

    return { ...ws, defaultChannelId: general.id };
  });

  return NextResponse.json(workspace, { status: 201 });
}
