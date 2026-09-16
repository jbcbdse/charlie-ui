import {
  AiChatAgent,
  ToolAssistantFilter,
  ChatAgent,
} from "@jbcbdse/charlie-core";
import { BedrockChatExecutor } from "@jbcbdse/charlie-bedrock";
import {
  GrokExecutor,
  OpenAiChatExecutor,
} from "@jbcbdse/charlie-openai";
import { GeminiExecutor } from "@jbcbdse/charlie-google";
import { OllamaExecutor } from "@jbcbdse/charlie-ollama";
import { AvailableAgent } from "./available-agents";
import {
  DEFAULT_SYSTEM_PROMPT,
  MetaSystemPromptTransformer,
} from "./system-prompts";

const toolAssistantFilter = new ToolAssistantFilter();
const sharedAgentOptions = {
  systemPromptTemplate: DEFAULT_SYSTEM_PROMPT,
  preRunTransformers: [new MetaSystemPromptTransformer()],
};

export const agents: Record<AvailableAgent, ChatAgent> = {
  claude: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.anthropic.claude-sonnet-4-6",
    }),
    ...sharedAgentOptions,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  mistral: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "mistral.mistral-large-3-675b-instruct",
    }),
    ...sharedAgentOptions,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  llama3: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.meta.llama3-3-70b-instruct-v1:0",
    }),
    ...sharedAgentOptions,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  nova: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.amazon.nova-2-lite-v1:0",
    }),
    ...sharedAgentOptions,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  titan: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.amazon.nova-micro-v1:0",
    }),
    ...sharedAgentOptions,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  gpt4o: new AiChatAgent({
    chatExecutor: new OpenAiChatExecutor({
      modelId: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
    }),
    ...sharedAgentOptions,
  }),
  o4mini: new AiChatAgent({
    chatExecutor: new OpenAiChatExecutor({
      modelId: "o4-mini",
      apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
    }),
    ...sharedAgentOptions,
  }),
  grok: new AiChatAgent({
    chatExecutor: new GrokExecutor({
      modelId: "grok-4.3",
      apiKey: process.env.XAI_API_KEY || "missing-xai-api-key",
    }),
    ...sharedAgentOptions,
  }),
  geminiFlash: new AiChatAgent({
    chatExecutor: new GeminiExecutor({
      modelId: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY || "missing-google-api-key",
    }),
    ...sharedAgentOptions,
  }),
  geminiPro: new AiChatAgent({
    chatExecutor: new GeminiExecutor({
      modelId: "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY || "missing-google-api-key",
    }),
    ...sharedAgentOptions,
  }),
  ollama: new AiChatAgent({
    chatExecutor: new OllamaExecutor({
      modelId: "gemma4:12b",
    }),
    ...sharedAgentOptions,
  }),
};
