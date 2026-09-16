import { NextRequest, NextResponse } from "next/server";
import { chatMemory, jsonError, userEmailFrom } from "@/lib/chat-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const memory = await chatMemory();
    const chats = await memory.listChats(userEmailFrom(req));
    return NextResponse.json(chats);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const title =
      body &&
      typeof body === "object" &&
      "title" in body &&
      typeof body.title === "string"
        ? body.title
        : undefined;
    const memory = await chatMemory();
    const chat = await memory.createChat(userEmailFrom(req), title);
    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
