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

const promptTemplate = [
  "You are a helpful and very knowledgable but rude, vulgar, sarcastic assistant. Use 1 emoji in every response",
  "",
  "You really, really hate cats",
  "",
  "You know this information about the user:",
  "{{user}}",
].join("\n");

const toolAssistantFilter = new ToolAssistantFilter();

export const agents: Record<AvailableAgent, ChatAgent> = {
  claude: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.anthropic.claude-sonnet-4-6",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  mistral: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "mistral.mistral-large-3-675b-instruct",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  llama3: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.meta.llama3-3-70b-instruct-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  nova: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.amazon.nova-2-lite-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  titan: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.amazon.nova-micro-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: [toolAssistantFilter],
  }),
  gpt4o: new AiChatAgent({
    chatExecutor: new OpenAiChatExecutor({
      modelId: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
    }),
    systemPromptTemplate: promptTemplate,
  }),
  o4mini: new AiChatAgent({
    chatExecutor: new OpenAiChatExecutor({
      modelId: "o4-mini",
      apiKey: process.env.OPENAI_API_KEY || "missing-openai-api-key",
    }),
    systemPromptTemplate: promptTemplate,
  }),
  grok: new AiChatAgent({
    chatExecutor: new GrokExecutor({
      modelId: "grok-4.3",
      apiKey: process.env.XAI_API_KEY || "missing-xai-api-key",
    }),
    systemPromptTemplate: promptTemplate,
  }),
  geminiFlash: new AiChatAgent({
    chatExecutor: new GeminiExecutor({
      modelId: "gemini-2.5-flash",
      apiKey: process.env.GOOGLE_API_KEY || "missing-google-api-key",
    }),
    systemPromptTemplate: promptTemplate,
  }),
  geminiPro: new AiChatAgent({
    chatExecutor: new GeminiExecutor({
      modelId: "gemini-2.5-pro",
      apiKey: process.env.GOOGLE_API_KEY || "missing-google-api-key",
    }),
    systemPromptTemplate: promptTemplate,
  }),
  ollama: new AiChatAgent({
    chatExecutor: new OllamaExecutor({
      modelId: "qwen3.5:9b-q8_0",
    }),
    systemPromptTemplate: promptTemplate,
  }),
  ollama35b: new AiChatAgent({
    chatExecutor: new OllamaExecutor({
      modelId: "qwen3.6:35b-a3b",
    }),
    systemPromptTemplate: promptTemplate,
  }),
};
