import { ChatMessage } from "@jbcbdse/charlie-core";

export const DEFAULT_CHAT_TITLE = "New chat";

export type ChatSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatWithMessages = ChatSummary & {
  messages: ChatMessage[];
};
