import { NextRequest, NextResponse } from "next/server";
import { getChatMemory } from "./mongo";

export function userEmailFrom(req: NextRequest): string {
  return req.headers.get("x-user-email") ?? "";
}

export async function chatMemory() {
  return getChatMemory();
}

export function jsonError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Request failed";
  const status =
    message === "Invalid email" || message === "Invalid chat id"
      ? 400
      : message === "Chat not found"
        ? 404
        : 500;
  return NextResponse.json({ error: message }, { status });
}
