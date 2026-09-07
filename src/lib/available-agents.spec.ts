import { describe, expect, it } from "vitest";
import {
  PROVIDERS,
  allAgentIds,
  DEFAULT_AGENT,
  modelGroups,
} from "@/lib/available-agents";
import { agents } from "@/lib/agents";

describe("model catalog", () => {
  it("groups models by provider", () => {
    expect(Object.values(PROVIDERS).map((g) => g.label)).toEqual([
      "Amazon Bedrock",
      "OpenAI",
      "xAI",
      "Google",
      "Ollama",
    ]);
    expect(modelGroups().map((g) => g.provider)).toEqual([
      "Amazon Bedrock",
      "OpenAI",
      "xAI",
      "Google",
      "Ollama",
    ]);
  });

  it("has unique model ids across groups", () => {
    const ids = allAgentIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registers an agent for every catalog id", () => {
    for (const id of allAgentIds()) {
      expect(agents[id]).toBeDefined();
    }
  });

  it("defaults to gpt4o", () => {
    expect(DEFAULT_AGENT).toBe("gpt4o");
    expect(PROVIDERS.openai.models.gpt4o).toBeDefined();
  });
});
