import { NextRequest, NextResponse } from "next/server";
import { agents } from "@/lib/agents";
import { getTools } from "@/lib/tools";
import {
  assertSafeUserId,
  clearMessages,
  getMessages,
  saveMesssages,
} from "@/lib/file-memory";
import { isAvailableAgent } from "@/lib/available-agents";
import {
  STREAM_CONTENT_TYPE,
  createNdjsonStream,
  listenChatRun,
} from "@/lib/message-stream";
import { ChatMessage } from "@jbcbdse/charlie-core";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: routeUserId } = await params;
    const userId = assertSafeUserId(routeUserId);
    const body = await req.json();
    const agentId = body.agent as string;
    if (!isAvailableAgent(agentId)) {
      return NextResponse.json(
        { error: `Unknown agent: ${agentId}` },
        { status: 400 },
      );
    }
    const message = body.message;
    if (!message || typeof message.content !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const agent = agents[agentId];
    const history = await getMessages(userId);
    const run = agent.getResponse({
      tools: getTools(),
      meta: {
        user: { ...(body.user ?? {}), id: userId },
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
          await saveMesssages(userId, [message, ...responseMessages]);
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
    const message = error instanceof Error ? error.message : "Request failed";
    const status = message === "Invalid user id" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const messages = await getMessages(id);
    return NextResponse.json(messages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status = message === "Invalid user id" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await clearMessages(id);
    return NextResponse.json({});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    const status = message === "Invalid user id" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function tagAssistant(messages: ChatMessage[], agentId: string): void {
  messages
    .filter((m) => m.role === "assistant")
    .forEach((m) => {
      m.name ??= agentId;
    });
}
