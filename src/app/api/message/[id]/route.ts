import { NextRequest, NextResponse } from "next/server";
import { agents } from "@/lib/agents";
import { getTools } from "@/lib/tools";
import { clearMessages, getMessages, saveMesssages } from "@/lib/file-memory";
import { AvailableAgent } from "@/lib/available-agents";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = body.user;
  const agentId = body.agent as AvailableAgent;
  const message = body.message;
  const agent = agents[agentId];
  if (!agent) {
    return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 });
  }
  const response = await agent.getResponse({
    tools: getTools(),
    meta: {
      user,
    },
    messages: [...(await getMessages(user.id)), message],
  });
  const responseMessages = response.responseMessages;
  responseMessages
    .filter((m) => m.role === "assistant")
    .forEach((m) => {
      m.name ??= agentId;
    });
  await saveMesssages(user.id, [message, ...responseMessages]);
  return NextResponse.json(responseMessages);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: user } = await params;
  const messages = await getMessages(user);
  return NextResponse.json(messages);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: user } = await params;
  await clearMessages(user);
  return NextResponse.json({});
}
