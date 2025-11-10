import { agents,  } from '@/lib/agents';
import {NextRequest, NextResponse} from 'next/server';
import {getTools} from '@/lib/tools';
import { clearMessages, getMessages, saveMesssages } from '@/lib/file-memory';
import { AvailableAgent } from '@/lib/available-agents';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = body.user;
  const agentId = body.agent as AvailableAgent;
  const message = body.message;
  const agent = agents[agentId];
  const response = await agent.getResponse({
    tools: getTools(),
    meta: {
      user,
    },
    messages: [
      ...(await getMessages(user.id)), 
      message,
    ]
  });
  const responseMessages = response.responseMessages;
  responseMessages
    .filter((m) => m.role === "assistant")
    .forEach((m) => { m.name ??= agentId });
  await saveMesssages(user.id, [
    message, 
    ...responseMessages,
  ]);
  return NextResponse.json(responseMessages);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = params.id;
  const messages = await getMessages(user);
  return NextResponse.json(messages);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = params.id;
  await clearMessages(user);
  return NextResponse.json({});
}

