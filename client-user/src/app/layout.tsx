'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/features/Providers';
import NotificationInitializer from '@/components/notifications/NotificationInitializer';
import ChatInitializer from '@/components/chat/ChatInitializer';
import HeartbeatManager from '@/components/auth/HeartbeatManager';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <HeartbeatManager />
          <NotificationInitializer>
            <ChatInitializer>
              {children}
            </ChatInitializer>
          </NotificationInitializer>
        </Providers>
      </body>
    </html>
  );
}
