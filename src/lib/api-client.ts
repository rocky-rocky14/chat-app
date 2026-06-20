"use client";

import { getUserId } from "@/lib/user";

export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const userId = getUserId();
  const headers = new Headers(options.headers);

  if (userId) {
    headers.set("X-User-Id", userId);
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers });
}
