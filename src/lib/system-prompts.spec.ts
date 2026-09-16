import { describe, expect, it } from "vitest";
import { ChatAgentContext, ChatMessage } from "@jbcbdse/charlie-core";
import {
  DEFAULT_SYSTEM_PROMPT,
  MetaSystemPromptTransformer,
  resolveSystemPrompt,
} from "./system-prompts";

describe("resolveSystemPrompt", () => {
  it("returns the rude default for unknown ids", () => {
    expect(resolveSystemPrompt("nope", "")).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("returns a custom prompt when selected", () => {
    expect(resolveSystemPrompt("custom", " Be a pirate. ")).toBe("Be a pirate.");
  });
});

describe("MetaSystemPromptTransformer", () => {
  it("overrides the template from meta", () => {
    const transformer = new MetaSystemPromptTransformer();
    const messages: ChatMessage[] = [
      { role: "user", name: "User", content: "hi" },
    ];
    const context = {
      meta: { systemPromptTemplate: "Be concise. {{user}}" },
      systemPromptTemplate: DEFAULT_SYSTEM_PROMPT,
    } as ChatAgentContext;
    expect(transformer.transform(messages, context)).toBe(messages);
    expect(context.systemPromptTemplate).toBe("Be concise. {{user}}");
  });
});
