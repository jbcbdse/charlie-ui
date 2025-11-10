import { ChatMessage } from "@jbcbdse/charlie-core";
import Message from "./Message";
import { IMessage } from "./types";

interface Props {
  messages: ChatMessage[];
}
export default function MessageList({messages}: Props) {
  return (
    <div>
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
    </div>
  )
}
