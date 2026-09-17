import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";
import { UserSettingsDocument, UserSettingsStore } from "./user-settings";
import {
  DEFAULT_PROMPT_ID,
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT_PRESETS,
} from "./system-prompts";

class MemoryCollection<T extends { _id: ObjectId }> {
  docs: T[] = [];

  async createIndex(): Promise<void> {}

  async findOne(filter: Record<string, unknown>): Promise<T | null> {
    return this.docs.find((doc) => this.matches(doc, filter)) ?? null;
  }

  async updateOne(
    filter: Record<string, unknown>,
    update: {
      $set: Record<string, unknown>;
      $setOnInsert?: Record<string, unknown>;
    },
  ): Promise<void> {
    const existing = this.docs.find((doc) => this.matches(doc, filter));
    if (existing) {
      Object.assign(existing, update.$set);
      return;
    }
    this.docs.push({
      ...(update.$setOnInsert ?? {}),
      ...update.$set,
    } as T);
  }

  private matches(doc: T, filter: Record<string, unknown>): boolean {
    return Object.entries(filter).every(
      ([key, value]) => (doc as Record<string, unknown>)[key] === value,
    );
  }
}

function store(): UserSettingsStore {
  return new UserSettingsStore(
    new MemoryCollection<UserSettingsDocument>() as never,
  );
}

describe("UserSettingsStore", () => {
  it("returns the rude default when unset", async () => {
    const settings = store();
    expect(await settings.get("user@example.com")).toEqual({
      systemPromptId: DEFAULT_PROMPT_ID,
      customSystemPrompt: "",
      systemPromptTemplate: DEFAULT_SYSTEM_PROMPT,
      mcpConfigJson: "",
    });
  });

  it("saves a preset and isolates by email", async () => {
    const settings = store();
    const helpful = SYSTEM_PROMPT_PRESETS.find((preset) => preset.id === "helpful");
    const saved = await settings.save("Owner@Example.com", {
      systemPromptId: "helpful",
    });
    expect(saved.systemPromptId).toBe("helpful");
    expect(saved.systemPromptTemplate).toBe(helpful?.template);
    expect(await settings.get("other@example.com")).toMatchObject({
      systemPromptId: DEFAULT_PROMPT_ID,
    });
    expect((await settings.get("owner@example.com")).systemPromptId).toBe(
      "helpful",
    );
  });

  it("saves a custom prompt", async () => {
    const settings = store();
    const saved = await settings.save("user@example.com", {
      systemPromptId: "custom",
      customSystemPrompt: "Be a pirate. {{user}}",
    });
    expect(saved.systemPromptTemplate).toBe("Be a pirate. {{user}}");
  });

  it("rejects unknown prompt ids", async () => {
    const settings = store();
    await expect(
      settings.save("user@example.com", { systemPromptId: "nope" }),
    ).rejects.toThrow("Invalid system prompt");
  });

  it("rejects an empty custom prompt", async () => {
    const settings = store();
    await expect(
      settings.save("user@example.com", { systemPromptId: "custom" }),
    ).rejects.toThrow("Invalid system prompt");
  });

  it("saves HTTP MCP config JSON", async () => {
    const settings = store();
    const mcpConfigJson = JSON.stringify({
      mcpServers: { local: { url: "http://127.0.0.1:8787/mcp" } },
    });
    const saved = await settings.save("user@example.com", {
      systemPromptId: DEFAULT_PROMPT_ID,
      mcpConfigJson,
    });
    expect(saved.mcpConfigJson).toBe(mcpConfigJson);
    expect((await settings.get("user@example.com")).mcpConfigJson).toBe(
      mcpConfigJson,
    );
  });

  it("rejects stdio MCP config", async () => {
    const settings = store();
    await expect(
      settings.save("user@example.com", {
        systemPromptId: DEFAULT_PROMPT_ID,
        mcpConfigJson: JSON.stringify({
          mcpServers: { files: { command: "npx" } },
        }),
      }),
    ).rejects.toThrow("Invalid MCP config");
  });
});
