import { ChatMessage, StreamChunk } from "@jbcbdse/charlie-core";
import { readMessageStream } from "./message-stream";
import { ChatSummary, ChatWithMessages } from "./chat-types";
import { SettingsPayload } from "./system-prompts";

const EMAIL_HEADER = "x-user-email";

async function parseJson(response: Response): Promise<unknown> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error =
      typeof data === "object" &&
      data &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${response.status})`;
    throw new Error(error);
  }
  return data;
}

function jsonHeaders(email: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    [EMAIL_HEADER]: email,
  };
}

export async function listChats(email: string): Promise<ChatSummary[]> {
  const response = await fetch("/api/chats", {
    headers: { [EMAIL_HEADER]: email },
  });
  const data = await parseJson(response);
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from chats API");
  }
  return data as ChatSummary[];
}

export async function createChat(
  email: string,
  title?: string,
): Promise<ChatSummary> {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: jsonHeaders(email),
    body: JSON.stringify(title ? { title } : {}),
  });
  return (await parseJson(response)) as ChatSummary;
}

export async function getChat(
  email: string,
  chatId: string,
): Promise<ChatWithMessages> {
  const response = await fetch(`/api/chats/${chatId}`, {
    headers: { [EMAIL_HEADER]: email },
  });
  return (await parseJson(response)) as ChatWithMessages;
}

export async function deleteChat(
  email: string,
  chatId: string,
): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: "DELETE",
    headers: { [EMAIL_HEADER]: email },
  });
  await parseJson(response);
}

export async function sendMessage(
  body: {
    email: string;
    chatId: string;
    agent: string;
    message: { content: string };
  },
  options?: {
    onChunk?: (chunk: StreamChunk) => void;
    signal?: AbortSignal;
  },
): Promise<ChatMessage[]> {
  const response = await fetch(`/api/chats/${body.chatId}/messages`, {
    method: "POST",
    headers: jsonHeaders(body.email),
    body: JSON.stringify({
      agent: body.agent,
      message: body.message,
    }),
    signal: options?.signal,
  });
  if (!response.ok) {
    await parseJson(response);
    throw new Error(`Request failed (${response.status})`);
  }
  if (!response.body) {
    throw new Error("Unexpected response from message API");
  }

  let doneMessages: ChatMessage[] | undefined;
  let streamError: string | undefined;
  await readMessageStream(response.body, (event) => {
    if (event.type === "chunk") {
      options?.onChunk?.(event.chunk);
      return;
    }
    if (event.type === "done") {
      doneMessages = event.messages;
      return;
    }
    streamError = event.error;
  });
  if (streamError) {
    throw new Error(streamError);
  }
  if (!doneMessages) {
    throw new Error("Unexpected response from message API");
  }
  return doneMessages;
}

export async function getMessages(
  email: string,
  chatId: string,
): Promise<ChatMessage[]> {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    headers: { [EMAIL_HEADER]: email },
  });
  const data = await parseJson(response);
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from message API");
  }
  return data as ChatMessage[];
}

export async function clearMessages(
  email: string,
  chatId: string,
): Promise<void> {
  const response = await fetch(`/api/chats/${chatId}/messages`, {
    method: "DELETE",
    headers: { [EMAIL_HEADER]: email },
  });
  await parseJson(response);
}

export async function getSettings(email: string): Promise<SettingsPayload> {
  const response = await fetch("/api/settings", {
    headers: { [EMAIL_HEADER]: email },
  });
  return (await parseJson(response)) as SettingsPayload;
}

export async function saveSettings(
  email: string,
  body: { systemPromptId: string; customSystemPrompt: string },
): Promise<SettingsPayload> {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: jsonHeaders(email),
    body: JSON.stringify(body),
  });
  return (await parseJson(response)) as SettingsPayload;
}
