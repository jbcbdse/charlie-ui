import { describe, expect, it } from "vitest";
import {
  AvailableAgent,
  MODEL_GROUPS,
  allAgentIds,
  DEFAULT_AGENT,
} from "@/lib/available-agents";
import { agents } from "@/lib/agents";

describe("model catalog", () => {
  it("groups models by provider", () => {
    expect(MODEL_GROUPS.map((g) => g.provider)).toEqual([
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
    expect(DEFAULT_AGENT).toBe(AvailableAgent.gpt4o);
  });
});
