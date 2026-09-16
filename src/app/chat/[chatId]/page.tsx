'use client';

import MessageList from '@/app/components/MessageList';
import ChatInput from '@/app/components/ChatInput';
import { useChatSession } from '@/app/components/ChatShell';
import { useEffect, useRef, useState } from 'react';
import { ChatMessage, MessageUser } from '@jbcbdse/charlie-core';
import { clearMessages, getChat, sendMessage } from '@/lib/send-message';
import {
  applyStreamChunk,
  emptyStreamPreview,
  mergeStreamedThoughts,
  StreamPreview,
} from '@/lib/message-stream';
import { useParams } from 'next/navigation';

export default function ChatConversationPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { email, refreshChats } = useChatSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stream, setStream] = useState<StreamPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        abortRef.current?.abort();
        const chat = await getChat(email, chatId);
        setMessages(chat.messages);
        setStream(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      }
    };
    fetchChat();
  }, [email, chatId]);

  const handleClear = async () => {
    try {
      abortRef.current?.abort();
      await clearMessages(email, chatId);
      setMessages([]);
      setStream(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear messages');
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
    if (text === '/clear') {
      return handleClear();
    }
    const newMessage: MessageUser = {
      role: 'user',
      name: 'User',
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
          email,
          chatId,
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
      await refreshChats();
    } catch (err) {
      setStream(null);
      if (isAbortError(err)) {
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      if (abortRef.current === abort) {
        abortRef.current = null;
      }
    }
  };

  return (
    <div className="chat-box flex flex-col space-y-4 h-full">
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
  );
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}
