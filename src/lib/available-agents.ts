export const MODEL_GROUPS = [
  {
    provider: "Amazon Bedrock",
    models: [
      { id: "claude", label: "Claude Sonnet 4.6" },
      { id: "mistral", label: "Mistral Large 3" },
      { id: "llama3", label: "Llama 3.3 70B" },
      { id: "nova", label: "Nova 2 Lite" },
      { id: "titan", label: "Nova Micro" },
    ],
  },
  {
    provider: "OpenAI",
    models: [
      { id: "gpt4o", label: "GPT-4o" },
      { id: "o4mini", label: "o4-mini" },
    ],
  },
  {
    provider: "xAI",
    models: [{ id: "grok", label: "Grok 4.3" }],
  },
  {
    provider: "Google",
    models: [
      { id: "geminiFlash", label: "Gemini 2.5 Flash" },
      { id: "geminiPro", label: "Gemini 2.5 Pro" },
    ],
  },
  {
    provider: "Ollama",
    models: [
      { id: "ollama", label: "Qwen 3.5 9B" },
      { id: "ollama35b", label: "Qwen 3.6 35B" },
    ],
  },
] as const;

export type AvailableAgent =
  (typeof MODEL_GROUPS)[number]["models"][number]["id"];

export const AvailableAgent = {
  claude: "claude",
  mistral: "mistral",
  llama3: "llama3",
  nova: "nova",
  titan: "titan",
  gpt4o: "gpt4o",
  o4mini: "o4mini",
  grok: "grok",
  geminiFlash: "geminiFlash",
  geminiPro: "geminiPro",
  ollama: "ollama",
  ollama35b: "ollama35b",
} as const satisfies Record<AvailableAgent, AvailableAgent>;

export const DEFAULT_AGENT: AvailableAgent = AvailableAgent.gpt4o;

export function allAgentIds(): AvailableAgent[] {
  return MODEL_GROUPS.flatMap((group) => group.models.map((m) => m.id));
}
