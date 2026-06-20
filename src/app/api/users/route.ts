import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { displayName } = body;

  if (!displayName?.trim()) {
    return NextResponse.json({ error: "表示名は必須です" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: { displayName: displayName.trim() },
    select: { id: true, displayName: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
