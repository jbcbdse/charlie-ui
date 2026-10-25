import { describe, expect, it } from "vitest";
import { ChatAgentContext, ChatMessage } from "@jbcbdse/charlie-core";
import {
  DEFAULT_SYSTEM_PROMPT,
  MARKDOWN_INSTRUCTION,
  MetaSystemPromptTransformer,
  resolveSystemPrompt,
  withMarkdownInstruction,
} from "./system-prompts";

describe("resolveSystemPrompt", () => {
  it("returns the rude default for unknown ids", () => {
    expect(resolveSystemPrompt("nope", "")).toBe(DEFAULT_SYSTEM_PROMPT);
  });

  it("returns a custom prompt when selected", () => {
    expect(resolveSystemPrompt("custom", " Be a pirate. ")).toBe("Be a pirate.");
  });
});

describe("withMarkdownInstruction", () => {
  it("appends the markdown instruction after the user prompt", () => {
    expect(withMarkdownInstruction("Be a pirate.")).toBe(
      `Be a pirate.\n\n${MARKDOWN_INSTRUCTION}`,
    );
  });
});

describe("MetaSystemPromptTransformer", () => {
  it("overrides the template from meta and appends the markdown instruction", () => {
    const transformer = new MetaSystemPromptTransformer();
    const messages: ChatMessage[] = [
      { role: "user", name: "User", content: "hi" },
    ];
    const context = {
      meta: { systemPromptTemplate: "Be concise. {{user}}" },
      systemPromptTemplate: DEFAULT_SYSTEM_PROMPT,
    } as ChatAgentContext;
    expect(transformer.transform(messages, context)).toBe(messages);
    expect(context.systemPromptTemplate).toBe(
      `Be concise. {{user}}\n\n${MARKDOWN_INSTRUCTION}`,
    );
  });

  it("appends the markdown instruction to the default template", () => {
    const transformer = new MetaSystemPromptTransformer();
    const context = {
      meta: {},
      systemPromptTemplate: DEFAULT_SYSTEM_PROMPT,
    } as ChatAgentContext;
    transformer.transform([], context);
    expect(context.systemPromptTemplate).toBe(
      `${DEFAULT_SYSTEM_PROMPT}\n\n${MARKDOWN_INSTRUCTION}`,
    );
  });
});
