'use client';
import MessageList from '@/app/components/MessageList';
import ChatInput from '@/app/components/ChatInput';
import PageCard from '@/app/components/PageCard';
import { useState, useEffect } from 'react';
import { ChatMessage, MessageUser } from '@jbcbdse/charlie-core';
import { generateUniqueString } from '@/lib/generate-unique-string';
import { clearMessages, getMessages, sendMessage } from '@/lib/send-message';

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

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await getMessages(uniqueId);
      console.log(response);
      setMessages(response);
    }
    if (uniqueId) {
      fetchMessages();
    }
  }, [uniqueId]);
  
  const handleClear = async () => {
    await clearMessages(uniqueId);
    setMessages([]);
  }

  const handleSendMessage = async ({ text, agentId }: { text: string, agentId: string }) => {
    if(text === '/clear') {
      return handleClear();
    }
    const newMessage: MessageUser = {
      role: "user",
      name: "User",
      content: text,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    const response = await sendMessage({ 
      user: { id: uniqueId },
      agent: agentId,
      message: newMessage,
    });
    setMessages((prevMessages) => [...prevMessages, ...response]);
  };

  return (
    <PageCard>
      <div className="chat-box flex flex-col space-y-4">
        <MessageList messages={messages} />
        <ChatInput onSubmit={handleSendMessage}/>
      </div>
      <div className="mt-4 text-gray-600 text-center">
        Your unique ID: {uniqueId}
      </div>
    </PageCard>
  );
} 
