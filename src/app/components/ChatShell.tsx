'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChatSummary } from '@/lib/chat-types';
import { createChat, deleteChat, listChats } from '@/lib/send-message';

const EMAIL_KEY = 'userEmail';

type ChatSession = {
  email: string;
  chats: ChatSummary[];
  refreshChats(): Promise<void>;
};

const ChatSessionContext = createContext<ChatSession | null>(null);

export function useChatSession(): ChatSession {
  const session = useContext(ChatSessionContext);
  if (!session) {
    throw new Error('useChatSession must be used within ChatShell');
  }
  return session;
}

export default function ChatShell({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setEmail(localStorage.getItem(EMAIL_KEY));
    setReady(true);
  }, []);

  const refreshChats = useCallback(async () => {
    if (!email) {
      return;
    }
    const next = await listChats(email);
    setChats(next);
  }, [email]);

  useEffect(() => {
    if (!email) {
      return;
    }
    refreshChats().catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    });
  }, [email, refreshChats]);

  const handleEmail = (value: string) => {
    const next = value.trim().toLowerCase();
    localStorage.setItem(EMAIL_KEY, next);
    setEmail(next);
    setError(null);
  };

  const handleChangeUser = () => {
    localStorage.removeItem(EMAIL_KEY);
    setEmail(null);
    setChats([]);
    router.push('/chat');
  };

  const handleNewChat = async () => {
    if (!email) {
      return;
    }
    try {
      const chat = await createChat(email);
      await refreshChats();
      router.push(`/chat/${chat.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
    }
  };

  const handleDelete = async (chatId: string) => {
    if (!email) {
      return;
    }
    try {
      await deleteChat(email, chatId);
      await refreshChats();
      if (pathname === `/chat/${chatId}`) {
        router.push('/chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat');
    }
  };

  if (!ready) {
    return null;
  }

  if (!email) {
    return (
      <main className="flex justify-center items-center h-[calc(100vh-4rem)] bg-gray-100">
        <form
          className="w-full max-w-md bg-white shadow-md rounded-lg p-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const value = String(data.get('email') ?? '');
            if (value.trim()) {
              handleEmail(value);
            }
          }}
        >
          <h1 className="text-xl font-semibold text-gray-800">Who are you?</h1>
          <p className="text-sm text-gray-600">
            Enter an email to use as your username. No password for now.
          </p>
          <label className="block text-sm text-gray-600" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full border border-gray-300 rounded p-2 text-black"
            placeholder="you@example.com"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white rounded p-2"
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  return (
    <ChatSessionContext.Provider value={{ email, chats, refreshChats }}>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-100">
        <aside className="w-64 bg-white border-r flex flex-col">
          <div className="p-3 border-b">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full bg-blue-500 text-white rounded p-2"
            >
              New chat
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2 space-y-1">
            {chats.map((chat) => {
              const href = `/chat/${chat.id}`;
              const active = pathname === href;
              return (
                <div
                  key={chat.id}
                  className={`flex items-center rounded ${
                    active ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
                >
                  <Link
                    href={href}
                    className="flex-1 truncate px-2 py-2 text-sm text-gray-800"
                  >
                    {chat.title}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete ${chat.title}`}
                    onClick={() => handleDelete(chat.id)}
                    className="px-2 py-2 text-xs text-gray-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </nav>
          <div className="p-3 border-t text-sm text-gray-600">
            <div className="truncate" title={email}>
              {email}
            </div>
            <button
              type="button"
              onClick={handleChangeUser}
              className="text-blue-600 hover:underline"
            >
              Change
            </button>
          </div>
        </aside>
        <main className="flex-1 p-4 overflow-hidden">
          {error ? (
            <div className="mb-2 text-red-600 text-sm text-center">{error}</div>
          ) : null}
          <div className="h-full bg-white shadow-md rounded-lg p-4 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </ChatSessionContext.Provider>
  );
}
