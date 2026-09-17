import { ChatMessage } from "@jbcbdse/charlie-core";
import Message from "./Message";
import Thoughts from "./Thoughts";
import { StreamPreview } from "@/lib/message-stream";

interface Props {
  messages: ChatMessage[];
  stream?: StreamPreview | null;
}
export default function MessageList({messages, stream}: Props) {
  return (
    <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
      {messages.map((message, index) => (
        <Message key={index} message={message} />
      ))}
      {stream ? (
        <>
          <Thoughts content={stream.thinking} open />
          {stream.text || !stream.thinking ? (
            <Message
              streaming
              message={{
                role: "assistant",
                name: "Assistant",
                content: stream.text,
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}
