import { ChatMessage, StreamChunk } from "@jbcbdse/charlie-core";
import { readMessageStream } from "./message-stream";

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

export async function sendMessage(
  body: {
    user: { id: string };
    agent: string;
    message: { content: string };
  },
  options?: { onChunk?: (chunk: StreamChunk) => void },
): Promise<ChatMessage[]> {
  const response = await fetch(`/api/message/${body.user.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

export async function getMessages(userId: string): Promise<ChatMessage[]> {
  const response = await fetch(`/api/message/${userId}`);
  const data = await parseJson(response);
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from message API");
  }
  return data as ChatMessage[];
}

export async function clearMessages(userId: string): Promise<void> {
  const response = await fetch(`/api/message/${userId}`, {
    method: "DELETE",
  });
  await parseJson(response);
}
