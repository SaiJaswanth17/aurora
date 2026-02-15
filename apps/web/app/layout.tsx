import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth/auth-context';
import { WebSocketProvider } from '@/lib/websocket/websocket-context';
import { ChatEventsProvider } from '@/components/providers/chat-events-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Aurora - Real-time Chat',
  description: 'A modern Discord-like chat application built with Next.js and WebSockets',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <WebSocketProvider>
            <ChatEventsProvider>
              {children}
            </ChatEventsProvider>
          </WebSocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
