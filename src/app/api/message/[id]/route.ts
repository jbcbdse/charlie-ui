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
    const response = await agent.getResponse({
      tools: getTools(),
      meta: {
        user: { id: userId, ...(body.user ?? {}) },
      },
      messages: [...(await getMessages(userId)), message],
    });
    const responseMessages = response.responseMessages;
    responseMessages
      .filter((m) => m.role === "assistant")
      .forEach((m) => {
        m.name ??= agentId;
      });
    await saveMesssages(userId, [message, ...responseMessages]);
    return NextResponse.json(responseMessages);
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
