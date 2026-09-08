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
  consumeChatRun,
  encodeStreamEvent,
  MessageStreamEvent,
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
    const run = agent.getResponse({
      tools: getTools(),
      meta: {
        user: { id: userId, ...(body.user ?? {}) },
      },
      messages: [...(await getMessages(userId)), message],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const write = (event: MessageStreamEvent) => {
          controller.enqueue(encoder.encode(encodeStreamEvent(event)));
        };
        try {
          const responseMessages = await consumeChatRun(run, (chunk) => {
            write({ type: "chunk", chunk });
          });
          tagAssistant(responseMessages, agentId);
          await saveMesssages(userId, [message, ...responseMessages]);
          write({ type: "done", messages: responseMessages });
          controller.close();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Request failed";
          write({ type: "error", error: errorMessage });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": STREAM_CONTENT_TYPE,
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
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
