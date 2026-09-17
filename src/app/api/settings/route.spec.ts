import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYSTEM_PROMPT_PRESETS } from "@/lib/system-prompts";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
}));

vi.mock("@/lib/chat-route", () => ({
  userSettings: async () => ({
    get: mocks.get,
    save: mocks.save,
  }),
  jsonError: (error: unknown) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 },
    ),
  userEmailFrom: (req: NextRequest) =>
    req.headers.get("x-user-email") ?? "",
}));

import { GET, PUT } from "./route";

function request(method: string, body?: string): NextRequest {
  return new NextRequest("http://localhost/api/settings", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-user-email": "user@example.com",
    },
    body,
  });
}

describe("settings API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({
      systemPromptId: "rude",
      customSystemPrompt: "",
      systemPromptTemplate: SYSTEM_PROMPT_PRESETS[0].template,
    });
    mocks.save.mockImplementation(
      async (_email: string, input: { systemPromptId: string }) => ({
        systemPromptId: input.systemPromptId,
        customSystemPrompt: "",
        systemPromptTemplate: "saved",
      }),
    );
  });

  it("returns settings and presets", async () => {
    const response = await GET(request("GET"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.systemPromptId).toBe("rude");
    expect(body.presets).toEqual(SYSTEM_PROMPT_PRESETS);
  });

  it("saves a selected prompt", async () => {
    const response = await PUT(
      request("PUT", JSON.stringify({ systemPromptId: "helpful" })),
    );
    expect(response.status).toBe(200);
    expect(mocks.save).toHaveBeenCalledWith("user@example.com", {
      systemPromptId: "helpful",
      customSystemPrompt: undefined,
      mcpConfigJson: undefined,
    });
  });
});
