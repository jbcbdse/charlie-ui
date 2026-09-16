import { NextRequest, NextResponse } from "next/server";
import { agents } from "@/lib/agents";
import { getTools } from "@/lib/tools";
import { isAvailableAgent } from "@/lib/available-agents";
import {
  STREAM_CONTENT_TYPE,
  createNdjsonStream,
  listenChatRun,
} from "@/lib/message-stream";
import { ChatMessage, MessageUser } from "@jbcbdse/charlie-core";
import { chatMemory, jsonError, userEmailFrom } from "@/lib/chat-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await params;
    const memory = await chatMemory();
    const messages = await memory.getMessages(userEmailFrom(req), chatId);
    return NextResponse.json(messages);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await params;
    const email = userEmailFrom(req);
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const request = body as {
      agent?: unknown;
      message?: { content?: unknown };
    };
    const agentId = request.agent;
    if (typeof agentId !== "string") {
      return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
    }
    if (!isAvailableAgent(agentId)) {
      return NextResponse.json(
        { error: `Unknown agent: ${agentId}` },
        { status: 400 },
      );
    }
    const content = request.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }
    const message: MessageUser = { role: "user", name: "User", content };

    const memory = await chatMemory();
    const history = await memory.getMessages(email, chatId);
    await memory.appendMessages(email, chatId, [message]);
    const agent = agents[agentId];
    const run = agent.getResponse({
      tools: getTools(),
      meta: {
        user: { id: email, email },
      },
      messages: [...history, message],
    });
    const listening = listenChatRun(run);

    return new Response(
      createNdjsonStream({
        listening,
        complete: async () => {
          const responseMessages = await listening.messages();
          tagAssistant(responseMessages, agentId);
          await memory.appendMessages(email, chatId, responseMessages);
          return responseMessages;
        },
      }),
      {
        headers: {
          "Content-Type": STREAM_CONTENT_TYPE,
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      },
    );
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
    await memory.clearMessages(userEmailFrom(req), chatId);
    return NextResponse.json({});
  } catch (error) {
    return jsonError(error);
  }
}

function tagAssistant(messages: ChatMessage[], agentId: string): void {
  messages
    .filter((m) => m.role === "assistant")
    .forEach((m) => {
      m.name ??= agentId;
    });
}
