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

export type ChatRunListener = {
  subscribe(listener: (chunk: StreamChunk) => void): () => void;
  messages(): Promise<ChatMessage[]>;
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
  if (chunk.type === "tool_call") {
    return { ...preview, text: "" };
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
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Unexpected response from message API");
  }
  if (!isMessageStreamEvent(parsed)) {
    return null;
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
  try {
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
  } catch (error) {
    try {
      await reader.cancel();
    } catch {
      /* already cancelled */
    }
    if (error instanceof SyntaxError) {
      throw new Error("Connection lost");
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}

export function listenChatRun(run: ChatRun): ChatRunListener {
  const chunks: StreamChunk[] = [];
  const listeners = new Set<(chunk: StreamChunk) => void>();
  run.on(EventName.ChatStreamChunk, ({ chunk }) => {
    chunks.push(chunk);
    for (const listener of listeners) {
      listener(chunk);
    }
  });
  return {
    subscribe(listener) {
      const start = chunks.length;
      listeners.add(listener);
      for (let i = 0; i < start; i++) {
        listener(chunks[i]);
      }
      return () => {
        listeners.delete(listener);
      };
    },
    async messages() {
      const result = await run;
      return result.responseMessages;
    },
  };
}

export async function consumeChatRun(
  run: ChatRun,
  onChunk: (chunk: StreamChunk) => void,
): Promise<ChatMessage[]> {
  const listening = listenChatRun(run);
  listening.subscribe(onChunk);
  return listening.messages();
}

export function createNdjsonStream(args: {
  listening: ChatRunListener;
  complete: () => Promise<ChatMessage[]>;
}): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let closed = false;
  return new ReadableStream({
    async start(controller) {
      const write = (event: MessageStreamEvent) => {
        if (closed) {
          return;
        }
        try {
          controller.enqueue(encoder.encode(encodeStreamEvent(event)));
        } catch {
          closed = true;
        }
      };
      const unsubscribe = args.listening.subscribe((chunk) => {
        write({ type: "chunk", chunk });
      });
      try {
        const messages = await args.complete();
        write({ type: "done", messages });
        if (!closed) {
          closed = true;
          controller.close();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Request failed";
        write({ type: "error", error: errorMessage });
        if (!closed) {
          try {
            controller.close();
          } catch {
            /* already cancelled */
          }
          closed = true;
        }
      } finally {
        unsubscribe();
      }
    },
    cancel() {
      closed = true;
    },
  });
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

function isMessageStreamEvent(value: object): value is MessageStreamEvent {
  if (!("type" in value)) {
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
