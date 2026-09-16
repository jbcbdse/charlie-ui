'use client';

import ChatShell from '@/app/components/ChatShell';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatShell>{children}</ChatShell>;
}
