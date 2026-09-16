import { NextRequest, NextResponse } from "next/server";
import { chatMemory, jsonError, userEmailFrom } from "@/lib/chat-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await params;
    const email = userEmailFrom(req);
    const memory = await chatMemory();
    const chat = await memory.getChat(email, chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    const messages = await memory.getMessages(email, chatId);
    return NextResponse.json({ ...chat, messages });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await params;
    const memory = await chatMemory();
    const deleted = await memory.deleteChat(userEmailFrom(req), chatId);
    if (!deleted) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    return NextResponse.json({});
  } catch (error) {
    return jsonError(error);
  }
}
