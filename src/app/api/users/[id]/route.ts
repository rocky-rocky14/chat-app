import { NextResponse } from "next/server";
import { getUserId, notFound, requireUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const requestUserId = getUserId(_request);

  if (!requestUserId || requestUserId !== id) {
    return notFound();
  }

  const user = await requireUser(id);
  if (!user) return notFound("ユーザーが見つかりません");

  return NextResponse.json(user);
}
