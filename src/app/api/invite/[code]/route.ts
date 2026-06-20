import { NextResponse } from "next/server";
import {
  addUserToPublicChannels,
  getUserId,
  requireUser,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { code } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode: code },
    select: { id: true, name: true, inviteCode: true },
  });

  if (!workspace) {
    return NextResponse.json({ error: "招待リンクが無効です" }, { status: 404 });
  }

  return NextResponse.json(workspace);
}

export async function POST(request: Request, { params }: Params) {
  const { code } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode: code },
  });

  if (!workspace) {
    return NextResponse.json({ error: "招待リンクが無効です" }, { status: 404 });
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
  });

  if (existing) {
    const general = await prisma.channel.findFirst({
      where: { workspaceId: workspace.id, name: "general" },
      select: { id: true },
    });

    return NextResponse.json({
      workspaceId: workspace.id,
      defaultChannelId: general?.id,
      alreadyMember: true,
    });
  }

  await prisma.workspaceMember.create({
    data: { workspaceId: workspace.id, userId: user.id, role: "member" },
  });

  await addUserToPublicChannels(workspace.id, user.id);

  const general = await prisma.channel.findFirst({
    where: { workspaceId: workspace.id, name: "general" },
    select: { id: true },
  });

  return NextResponse.json(
    {
      workspaceId: workspace.id,
      defaultChannelId: general?.id,
      alreadyMember: false,
    },
    { status: 201 }
  );
}
