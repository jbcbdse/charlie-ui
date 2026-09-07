import { ChatMessage } from "@jbcbdse/charlie-core";

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

export async function sendMessage(body: {
  user: { id: string };
  agent: string;
  message: { content: string };
}): Promise<ChatMessage[]> {
  const response = await fetch(`/api/message/${body.user.id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await parseJson(response);
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from message API");
  }
  return data as ChatMessage[];
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
