import { NextRequest, NextResponse } from "next/server";
import { jsonError, userEmailFrom, userSettings } from "@/lib/chat-route";
import { SYSTEM_PROMPT_PRESETS } from "@/lib/system-prompts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const store = await userSettings();
    const settings = await store.get(userEmailFrom(req));
    return NextResponse.json({
      ...settings,
      presets: SYSTEM_PROMPT_PRESETS,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const request = body as {
      systemPromptId?: unknown;
      customSystemPrompt?: unknown;
    };
    if (typeof request.systemPromptId !== "string") {
      return NextResponse.json(
        { error: "Invalid system prompt" },
        { status: 400 },
      );
    }
    if (
      request.customSystemPrompt !== undefined &&
      typeof request.customSystemPrompt !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid system prompt" },
        { status: 400 },
      );
    }
    const store = await userSettings();
    const settings = await store.save(userEmailFrom(req), {
      systemPromptId: request.systemPromptId,
      customSystemPrompt: request.customSystemPrompt,
    });
    return NextResponse.json({
      ...settings,
      presets: SYSTEM_PROMPT_PRESETS,
    });
  } catch (error) {
    return jsonError(error);
  }
}
