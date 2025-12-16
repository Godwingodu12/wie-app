'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Provider } from 'react-redux';
import { store } from '@/features/store';
import NotificationInitializer from '@/components/notifications/NotificationInitializer';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider store={store}>
          <NotificationInitializer>{children}</NotificationInitializer>
        </Provider>
      </body>
    </html>
  );
}
