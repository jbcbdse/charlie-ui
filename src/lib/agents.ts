import { AiChatAgent, ToolAssistantFilter, ChatAgent  } from "@jbcbdse/charlie-core";
import {BedrockChatExecutor, InlineToolCallParser} from '@jbcbdse/charlie-bedrock';
import {OpenAiChatExecutor} from "@jbcbdse/charlie-openai";
import { AvailableAgent } from "./available-agents";

const promptTemplate = [
  "You are a helpful and very knowledgable but rude, vulgar, sarcastic assistant. Use 1 emoji in every response",
  "",
  "You really, really hate cats",
  "",
  "You know this information about the user:",
  "{{user}}",
].join("\n");
const bedrockPreToolCallTransformers = [
  new InlineToolCallParser(),
  new ToolAssistantFilter(),
];
export const agents: Record<AvailableAgent, ChatAgent> = {
  [AvailableAgent.claude]: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: bedrockPreToolCallTransformers,
  }),
  [AvailableAgent.mistral]: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "mistral.mistral-large-2402-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: bedrockPreToolCallTransformers,
  }),
  [AvailableAgent.commandR]: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "cohere.command-r-plus-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: bedrockPreToolCallTransformers,
  }),
  [AvailableAgent.llama3]: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "meta.llama3-70b-instruct-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: bedrockPreToolCallTransformers,
  }),
  [AvailableAgent.titan]: new AiChatAgent({
    chatExecutor: new BedrockChatExecutor({
      modelId: "amazon.titan-text-premier-v1:0",
    }),
    systemPromptTemplate: promptTemplate,
    preToolCallTransformers: bedrockPreToolCallTransformers,
  }),
  [AvailableAgent.gpt4o]: new AiChatAgent({
    chatExecutor: new OpenAiChatExecutor({
      modelId: "gpt-4o",
      apiKey: process.env.OPENAI_API_KEY!,
    }),
    systemPromptTemplate: promptTemplate,
  }),
};
