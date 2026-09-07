export const PROVIDERS = {
  bedrock: {
    label: "Amazon Bedrock",
    models: {
      claude: { label: "Claude Sonnet 4.6" },
      mistral: { label: "Mistral Large 3" },
      llama3: { label: "Llama 3.3 70B" },
      nova: { label: "Nova 2 Lite" },
      titan: { label: "Nova Micro" },
    },
  },
  openai: {
    label: "OpenAI",
    models: {
      gpt4o: { label: "GPT-4o" },
      o4mini: { label: "o4-mini" },
    },
  },
  xai: {
    label: "xAI",
    models: {
      grok: { label: "Grok 4.3" },
    },
  },
  google: {
    label: "Google",
    models: {
      geminiFlash: { label: "Gemini 2.5 Flash" },
      geminiPro: { label: "Gemini 2.5 Pro" },
    },
  },
  ollama: {
    label: "Ollama",
    models: {
      ollama: { label: "Qwen 3.5 9B" },
      ollama35b: { label: "Qwen 3.6 35B" },
    },
  },
} as const;

export type ProviderId = keyof typeof PROVIDERS;

export type AvailableAgent = {
  [P in ProviderId]: keyof (typeof PROVIDERS)[P]["models"];
}[ProviderId];

export const DEFAULT_AGENT: AvailableAgent = "gpt4o";

export function allAgentIds(): AvailableAgent[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).flatMap(
    (provider) =>
      Object.keys(PROVIDERS[provider].models) as AvailableAgent[],
  );
}

export function isAvailableAgent(value: string): value is AvailableAgent {
  return (allAgentIds() as string[]).includes(value);
}

/** Flat optgroup list for the model `<select>`. */
export function modelGroups(): {
  provider: string;
  models: { id: AvailableAgent; label: string }[];
}[] {
  return (Object.keys(PROVIDERS) as ProviderId[]).map((providerId) => {
    const group = PROVIDERS[providerId];
    return {
      provider: group.label,
      models: (
        Object.entries(group.models) as [AvailableAgent, { label: string }][]
      ).map(([id, model]) => ({ id, label: model.label })),
    };
  });
}
