import { APIRequestContext, expect, test } from "@playwright/test";
import { randomUUID } from "crypto";
import { parseStreamLine } from "../src/lib/message-stream";

const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

async function ollamaIsUp(request: APIRequestContext): Promise<boolean> {
  try {
    const version = await request.get("http://127.0.0.1:11434/api/version");
    return version.ok();
  } catch {
    return false;
  }
}

function readDoneMessages(text: string): unknown {
  let messages: unknown;
  for (const line of text.split("\n")) {
    const event = parseStreamLine(line);
    if (!event) continue;
    if (event.type === "error") {
      throw new Error(event.error);
    }
    if (event.type === "done") {
      messages = event.messages;
    }
  }
  return messages;
}

test.describe("live provider smoke", () => {
  test("ollama agent responds via message API", async ({ request }) => {
    test.skip(!(await ollamaIsUp(request)), "Ollama is not running on :11434");

    const userId = `smoke-ollama-${randomUUID()}`;
    const response = await request.post(`/api/message/${userId}`, {
      data: {
        user: { id: userId },
        agent: "ollama",
        message: {
          role: "user",
          name: "User",
          content: "Reply with exactly the word PONG and nothing else.",
        },
      },
      timeout: 180_000,
    });

    const body = await response.text();
    expect(response.ok(), body).toBeTruthy();
    const messages = readDoneMessages(body);
    expect(Array.isArray(messages)).toBe(true);
    const assistant = (messages as { role: string; content?: string }[]).find(
      (m) => m.role === "assistant",
    );
    expect(assistant?.content).toBeTruthy();
  });

  test("openai gpt4o agent responds via message API", async ({ request }) => {
    test.skip(!hasOpenAI, "OPENAI_API_KEY not set");

    const userId = `smoke-openai-${randomUUID()}`;
    const response = await request.post(`/api/message/${userId}`, {
      data: {
        user: { id: userId },
        agent: "gpt4o",
        message: {
          role: "user",
          name: "User",
          content: "Reply with exactly the word PONG and nothing else.",
        },
      },
      timeout: 60_000,
    });

    const body = await response.text();
    expect(response.ok(), body).toBeTruthy();
    const messages = readDoneMessages(body);
    const assistant = (messages as { role: string; content?: string }[]).find(
      (m) => m.role === "assistant",
    );
    expect(assistant?.content).toBeTruthy();
  });
});

test("ollama openai-compatible endpoint is reachable", async ({ request }) => {
  test.skip(!(await ollamaIsUp(request)), "Ollama is not running on :11434");
  const version = await request.get("http://127.0.0.1:11434/api/version");
  expect(await version.json()).toHaveProperty("version");
  expect(ollamaUrl).toContain("11434");
});
