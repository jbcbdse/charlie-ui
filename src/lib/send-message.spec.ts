import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "./send-message";

describe("sendMessage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("invokes onChunk and returns done messages", async () => {
    const body = [
      JSON.stringify({
        type: "chunk",
        chunk: { type: "thinking", text: "hmm" },
      }),
      JSON.stringify({
        type: "chunk",
        chunk: { type: "text", text: "partial" },
      }),
      JSON.stringify({
        type: "done",
        messages: [{ role: "assistant", content: "final" }],
      }),
      "",
    ].join("\n");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/x-ndjson" },
      })),
    );
    const chunks: unknown[] = [];
    const messages = await sendMessage(
      {
        user: { id: "u1" },
        agent: "gpt4o",
        message: { content: "hi" },
      },
      { onChunk: (chunk) => chunks.push(chunk) },
    );
    expect(chunks).toEqual([
      { type: "thinking", text: "hmm" },
      { type: "text", text: "partial" },
    ]);
    expect(messages).toEqual([{ role: "assistant", content: "final" }]);
  });

  it("throws JSON API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Unknown agent: nope" }, { status: 400 }),
      ),
    );
    await expect(
      sendMessage({
        user: { id: "u1" },
        agent: "nope",
        message: { content: "hi" },
      }),
    ).rejects.toThrow("Unknown agent: nope");
  });

  it("throws streamed errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ type: "error", error: "boom" }) + "\n", {
          status: 200,
          headers: { "Content-Type": "application/x-ndjson" },
        }),
      ),
    );
    await expect(
      sendMessage({
        user: { id: "u1" },
        agent: "gpt4o",
        message: { content: "hi" },
      }),
    ).rejects.toThrow("boom");
  });
});
