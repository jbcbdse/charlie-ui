import { ChatMessage } from "@jbcbdse/charlie-core";

export async function sendMessage(body: {
  user: { id: string },
  agent: string,
  message: { content: string}
}): Promise<ChatMessage[]> {
  const response = await fetch(`/api/message/${body.user.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
    .then((response) => response.json())
  return response;
}

export async function getMessages(userId: string): Promise<ChatMessage[]> {
  console.log('getting messages for user id', userId);
  const response = await fetch(`/api/message/${userId}`);
  return response.json();
}

export async function clearMessages(userId: string): Promise<void> {
  await fetch(`/api/message/${userId}`, {
    method: 'DELETE'
  });
}
