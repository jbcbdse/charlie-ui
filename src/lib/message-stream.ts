import {
  ChatMessage,
  ChatRun,
  EventName,
  StreamChunk,
} from "@jbcbdse/charlie-core";

export type MessageStreamEvent =
  | { type: "chunk"; chunk: StreamChunk }
  | { type: "done"; messages: ChatMessage[] }
  | { type: "error"; error: string };

export type StreamPreview = {
  thinking: string;
  text: string;
};

export const STREAM_CONTENT_TYPE = "application/x-ndjson; charset=utf-8";

export function emptyStreamPreview(): StreamPreview {
  return { thinking: "", text: "" };
}

export function applyStreamChunk(
  preview: StreamPreview,
  chunk: StreamChunk,
): StreamPreview {
  if (chunk.type === "thinking") {
    return { ...preview, thinking: preview.thinking + chunk.text };
  }
  if (chunk.type === "text") {
    return { ...preview, text: preview.text + chunk.text };
  }
  return preview;
}

export function mergeStreamedThoughts(
  messages: ChatMessage[],
  thinking: string,
): ChatMessage[] {
  if (!thinking.trim()) {
    return messages;
  }
  if (messages.some((m) => m.role === "reasoning" && m.content?.trim())) {
    return messages;
  }
  return [{ role: "reasoning", content: thinking }, ...messages];
}

export function encodeStreamEvent(event: MessageStreamEvent): string {
  return JSON.stringify(event) + "\n";
}

export function parseStreamLine(line: string): MessageStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  const parsed: unknown = JSON.parse(trimmed);
  if (!isMessageStreamEvent(parsed)) {
    throw new Error("Unexpected response from message API");
  }
  return parsed;
}

export async function readMessageStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: MessageStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    buffer = flushLines(buffer, onEvent);
  }
  buffer += decoder.decode();
  const last = parseStreamLine(buffer);
  if (last) {
    onEvent(last);
  }
}

export async function consumeChatRun(
  run: ChatRun,
  onChunk: (chunk: StreamChunk) => void,
): Promise<ChatMessage[]> {
  run.on(EventName.ChatStreamChunk, ({ chunk }) => {
    onChunk(chunk);
  });
  const result = await run;
  return result.responseMessages;
}

function flushLines(
  buffer: string,
  onEvent: (event: MessageStreamEvent) => void,
): string {
  let newline = buffer.indexOf("\n");
  while (newline !== -1) {
    const event = parseStreamLine(buffer.slice(0, newline));
    if (event) {
      onEvent(event);
    }
    buffer = buffer.slice(newline + 1);
    newline = buffer.indexOf("\n");
  }
  return buffer;
}

function isMessageStreamEvent(value: unknown): value is MessageStreamEvent {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return false;
  }
  if (value.type === "chunk") {
    return "chunk" in value && !!value.chunk && typeof value.chunk === "object";
  }
  if (value.type === "done") {
    return "messages" in value && Array.isArray(value.messages);
  }
  if (value.type === "error") {
    return "error" in value && typeof value.error === "string";
  }
  return false;
}
