import React from "react"
import Markdown from "react-markdown"
import { ChatMessage } from "@jbcbdse/charlie-core";
import Thoughts from "./Thoughts";

type Props = {
  message: ChatMessage;
  streaming?: boolean;
}
export default function Message({message, streaming}: Props) {
  if (message.role === "reasoning") {
    return <Thoughts content={message.content ?? ""} />;
  }
  const direction = message.role === "user" ? "outgoing" : "incoming";
  const speaker = message.role === "user" ? message.name || "User" :
    message.role === "assistant" ? message.name || "Assistant" :
    message.role === "system" ? "System" :
    message.role === "tool" ? message.name : 
    message.role === "tool_call" ? "Tool Call" : "Unknown";
  const content = message.role === "user" ? message.content : 
    message.role === "assistant" ? message.content : 
    message.role === "tool" ? message.content :
    message.role === "tool_call" ? JSON.stringify(message.toolCalls, null, 2) :
    message.role === "system" ? message.content : "Unknown";
  const messageStyles =
    message.role === "user"
      ? "bg-blue-500 text-white"
      : message.role === "assistant"
      ? "bg-gray-300 text-black"
      : message.role === "tool" || message.role === "tool_call"
      ? "bg-green-500 text-white"
      : "bg-gray-200 text-black"; // fallback for unknown roles
  
  return (
    <div
      className={`flex items-start space-x-4 my-2 ${
        direction === "outgoing" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-3xl p-3 rounded-lg ${messageStyles}`}
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
