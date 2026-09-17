import {
  ChatAgentContext,
  ChatMessage,
  ChatMessageTransformer,
} from "@jbcbdse/charlie-core";

export const CUSTOM_PROMPT_ID = "custom";
export const DEFAULT_PROMPT_ID = "rude";
export const MAX_PROMPT_LENGTH = 8000;

export type SystemPromptPreset = {
  id: string;
  label: string;
  template: string;
};

export const SYSTEM_PROMPT_PRESETS: SystemPromptPreset[] = [
  {
    id: DEFAULT_PROMPT_ID,
    label: "Rude Charlie",
    template: [
      "You are a helpful and very knowledgable but rude, vulgar, sarcastic assistant. Use 1 emoji in every response",
      "",
      "You really, really hate cats",
      "",
      "You know this information about the user:",
      "{{user}}",
    ].join("\n"),
  },
  {
    id: "helpful",
    label: "Helpful",
    template: [
      "You are a helpful, concise assistant.",
      "",
      "You know this information about the user:",
      "{{user}}",
    ].join("\n"),
  },
];

export const DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPT_PRESETS[0].template;

export type UserSettings = {
  systemPromptId: string;
  customSystemPrompt: string;
  systemPromptTemplate: string;
  mcpConfigJson: string;
};

export type SettingsPayload = UserSettings & {
  presets: SystemPromptPreset[];
};

export function defaultUserSettings(): UserSettings {
  return {
    systemPromptId: DEFAULT_PROMPT_ID,
    customSystemPrompt: "",
    systemPromptTemplate: DEFAULT_SYSTEM_PROMPT,
    mcpConfigJson: "",
  };
}

export function resolveSystemPrompt(
  systemPromptId: string,
  customSystemPrompt: string,
): string {
  if (systemPromptId === CUSTOM_PROMPT_ID) {
    const custom = customSystemPrompt.trim();
    return custom || DEFAULT_SYSTEM_PROMPT;
  }
  const preset = SYSTEM_PROMPT_PRESETS.find(
    (item) => item.id === systemPromptId,
  );
  return preset?.template ?? DEFAULT_SYSTEM_PROMPT;
}

export function isPromptId(value: string): boolean {
  return (
    value === CUSTOM_PROMPT_ID ||
    SYSTEM_PROMPT_PRESETS.some((preset) => preset.id === value)
  );
}

export class MetaSystemPromptTransformer implements ChatMessageTransformer {
  transform(
    messages: ChatMessage[],
    context: ChatAgentContext,
  ): ChatMessage[] {
    const override = context.meta.systemPromptTemplate;
    if (typeof override === "string" && override.trim()) {
      context.systemPromptTemplate = override;
    }
    return messages;
  }
}
