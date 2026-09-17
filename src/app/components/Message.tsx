import React from "react"
import Markdown from "react-markdown"
import { ChatMessage, MessageToolCall } from "@jbcbdse/charlie-core";
import Thoughts from "./Thoughts";
import DetailsBlock from "./DetailsBlock";

type Props = {
  message: ChatMessage;
  streaming?: boolean;
}
function Message({message, streaming}: Props) {
  if (message.role === "reasoning") {
    return <Thoughts content={message.content ?? ""} />;
  }
  if (message.role === "tool_call") {
    return (
      <DetailsBlock
        title={toolCallTitle(message)}
        content={JSON.stringify(message.toolCalls, null, 2)}
      />
    );
  }
  if (message.role === "tool") {
    return (
      <DetailsBlock
        title={message.name ? `Tool result: ${message.name}` : "Tool result"}
        content={message.content}
      />
    );
  }
  const direction = message.role === "user" ? "outgoing" : "incoming";
  const speaker = message.role === "user" ? message.name || "User" :
    message.role === "assistant" ? message.name || "Assistant" :
    message.role === "system" ? "System" : "Unknown";
  const content = message.content;
  const messageStyles =
    message.role === "user"
      ? "bg-blue-500 text-white"
      : message.role === "assistant"
      ? "bg-gray-300 text-black"
      : "bg-gray-200 text-black";
  
  return (
    <div
      className={`flex items-start space-x-4 my-2 ${
        direction === "outgoing" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-3xl min-w-0 p-3 rounded-lg break-words ${messageStyles}`}
      >
        <div className="text-xs font-semibold mb-1">{speaker}</div>
        <Markdown className="message-content">{content}</Markdown>
        {streaming ? (
          <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-gray-700 animate-pulse" />
        ) : null}
      </div>
    </div>
  )
}

export default React.memo(Message);

function toolCallTitle(message: MessageToolCall): string {
  const names = message.toolCalls.map((call) => call.function.name);
  if (names.length === 0) {
    return "Tool call";
  }
  return `Tool call: ${names.join(", ")}`;
}
