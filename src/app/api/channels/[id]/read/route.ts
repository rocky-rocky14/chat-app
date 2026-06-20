import { NextResponse } from "next/server";
import {
  getUserId,
  requireChannelAccess,
  requireUser,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: channelId } = await params;
  const userId = getUserId(request);
  const user = await requireUser(userId);
  if (!user) return unauthorized();

  const channel = await requireChannelAccess(channelId, user.id);
  if (!channel) {
    return NextResponse.json({ error: "このチャンネルにアクセスする権限がありません" }, { status: 403 });
  }

  await prisma.channelMember.updateMany({
    where: { channelId, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
