import { describe, expect, it } from "vitest";
import {
  ChatRunGenerator,
  EventChatStreamChunk,
  EventName,
  EventProducer,
  StreamChunk,
} from "@jbcbdse/charlie-core";
import {
  applyStreamChunk,
  consumeChatRun,
  encodeStreamEvent,
  emptyStreamPreview,
  mergeStreamedThoughts,
  parseStreamLine,
  readMessageStream,
} from "./message-stream";

describe("applyStreamChunk", () => {
  it("appends thinking and text independently", () => {
    let preview = emptyStreamPreview();
    preview = applyStreamChunk(preview, { type: "thinking", text: "hmm " });
    preview = applyStreamChunk(preview, { type: "text", text: "Hi" });
    preview = applyStreamChunk(preview, { type: "thinking", text: "yes" });
    preview = applyStreamChunk(preview, { type: "text", text: " there" });
    preview = applyStreamChunk(preview, {
      type: "tool_call",
      index: 0,
      name: "CalculatorTool",
    });
    expect(preview).toEqual({ thinking: "hmm yes", text: "Hi there" });
  });
});

describe("mergeStreamedThoughts", () => {
  it("prepends thinking when history has no reasoning content", () => {
    expect(
      mergeStreamedThoughts(
        [{ role: "assistant", content: "done" }],
        "ponder",
      ),
    ).toEqual([
      { role: "reasoning", content: "ponder" },
      { role: "assistant", content: "done" },
    ]);
  });

  it("skips empty thinking and existing visible reasoning", () => {
    expect(
      mergeStreamedThoughts([{ role: "assistant", content: "done" }], "   "),
    ).toEqual([{ role: "assistant", content: "done" }]);
    expect(
      mergeStreamedThoughts(
        [
          { role: "reasoning", content: "already" },
          { role: "assistant", content: "done" },
        ],
        "ponder",
      ),
    ).toEqual([
      { role: "reasoning", content: "already" },
      { role: "assistant", content: "done" },
    ]);
  });

  it("keeps thinking when reasoning is encrypted-only", () => {
    expect(
      mergeStreamedThoughts(
        [
          { role: "reasoning", encryptedContent: "abc" },
          { role: "assistant", content: "done" },
        ],
        "ponder",
      ),
    ).toEqual([
      { role: "reasoning", content: "ponder" },
      { role: "reasoning", encryptedContent: "abc" },
      { role: "assistant", content: "done" },
    ]);
  });
});

describe("stream codec", () => {
  it("round-trips events and skips blank lines", () => {
    const events = [
      { type: "chunk" as const, chunk: { type: "text" as const, text: "Hi" } },
      {
        type: "done" as const,
        messages: [{ role: "assistant" as const, content: "Hi" }],
      },
    ];
    for (const event of events) {
      expect(parseStreamLine(encodeStreamEvent(event))).toEqual(event);
    }
    expect(parseStreamLine(" \n")).toBeNull();
  });

  it("rejects unknown payloads", () => {
    expect(() => parseStreamLine(JSON.stringify({ type: "nope" }))).toThrow(
      "Unexpected response from message API",
    );
  });
});

describe("readMessageStream", () => {
  it("parses events split across chunks", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"chunk","chun'));
        controller.enqueue(
          encoder.encode(
            'k":{"type":"text","text":"Hi"}}\n{"type":"done","messages":[]}\n',
          ),
        );
        controller.close();
      },
    });
    const received: unknown[] = [];
    await readMessageStream(stream, (event) => received.push(event));
    expect(received).toEqual([
      { type: "chunk", chunk: { type: "text", text: "Hi" } },
      { type: "done", messages: [] },
    ]);
  });
});

describe("consumeChatRun", () => {
  it("forwards chunks then returns completed messages", async () => {
    const producer = new EventProducer();
    const chunks: StreamChunk[] = [];
    const output = {
      responseMessage: { role: "assistant" as const, content: "Hi" },
      responseMessages: [{ role: "assistant" as const, content: "Hi" }],
    };
    const run = new ChatRunGenerator(producer, "run", async () => {
      producer.emit(EventName.ChatStreamChunk, streamEvent(producer, "a"));
      producer.emit(EventName.ChatStreamChunk, streamEvent(producer, "b"));
      return output;
    }).create();
    const messages = await consumeChatRun(run, (chunk) => chunks.push(chunk));
    expect(chunks).toEqual([
      { type: "text", text: "a" },
      { type: "text", text: "b" },
    ]);
    expect(messages).toEqual(output.responseMessages);
  });
});

function streamEvent(
  producer: EventProducer,
  text: string,
): EventChatStreamChunk {
  return {
    context: {
      runId: "run",
      modelId: "m",
      messages: [],
      tools: [],
      meta: {},
      eventProducer: producer,
    },
    modelId: "m",
    modelProvider: "p",
    chunk: { type: "text", text },
  };
}
