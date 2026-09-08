'use client';
import MessageList from '@/app/components/MessageList';
import ChatInput from '@/app/components/ChatInput';
import PageCard from '@/app/components/PageCard';
import { useState, useEffect, useRef } from 'react';
import { ChatMessage, MessageUser } from '@jbcbdse/charlie-core';
import { generateUniqueString } from '@/lib/generate-unique-string';
import { clearMessages, getMessages, sendMessage } from '@/lib/send-message';
import {
  applyStreamChunk,
  emptyStreamPreview,
  mergeStreamedThoughts,
  StreamPreview,
} from '@/lib/message-stream';

export default function ChatPage() {
  
  const [uniqueId, setUniqueId] = useState('');
  useEffect(() => {
    // Check if the unique ID already exists in localStorage
    const storedUniqueId = localStorage.getItem('uniqueId');
    if (storedUniqueId) {
      setUniqueId(storedUniqueId);
    } else {
      const newUniqueId = generateUniqueString();
      localStorage.setItem('uniqueId', newUniqueId);
      setUniqueId(newUniqueId);
    }
  }, []);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stream, setStream] = useState<StreamPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getMessages(uniqueId);
        setMessages(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      }
    };
    if (uniqueId) {
      fetchMessages();
    }
  }, [uniqueId]);

  const handleClear = async () => {
    try {
      abortRef.current?.abort();
      await clearMessages(uniqueId);
      setMessages([]);
      setStream(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear messages");
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSendMessage = async ({
    text,
    agentId,
  }: {
    text: string;
    agentId: string;
  }) => {
    if (text === "/clear") {
      return handleClear();
    }
    const newMessage: MessageUser = {
      role: "user",
      name: "User",
      content: text,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setStream(emptyStreamPreview());
    setError(null);
    let preview = emptyStreamPreview();
    const abort = new AbortController();
    abortRef.current = abort;
    try {
      const response = await sendMessage(
        {
          user: { id: uniqueId },
          agent: agentId,
          message: newMessage,
        },
        {
          signal: abort.signal,
          onChunk: (chunk) => {
            preview = applyStreamChunk(preview, chunk);
            setStream({ ...preview });
          },
        },
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        ...mergeStreamedThoughts(response, preview.thinking),
      ]);
      setStream(null);
    } catch (err) {
      setStream(null);
      if (isAbortError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      if (abortRef.current === abort) {
        abortRef.current = null;
      }
    }
  };

  return (
    <PageCard>
      <div className="chat-box flex flex-col space-y-4">
        <MessageList messages={messages} stream={stream} />
        {error ? (
          <div className="text-red-600 text-center text-sm px-4">{error}</div>
        ) : null}
        <ChatInput
          onSubmit={handleSendMessage}
          onStop={handleStop}
          streaming={!!stream}
        />
      </div>
      <div className="mt-4 text-gray-600 text-center">
        Your unique ID: {uniqueId}
      </div>
    </PageCard>
  );
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}
