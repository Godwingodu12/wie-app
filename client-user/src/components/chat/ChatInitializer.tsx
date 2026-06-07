'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import socketService from '@/services/socketService';
import { ChatProvider } from '@/context/ChatContext';

interface ChatInitializerProps {
  children: React.ReactNode;
}

export default function ChatInitializer({ children }: ChatInitializerProps) {
  const [mounted, setMounted] = useState(false);
  
  const authState = useSelector((state: RootState) => state?.auth);
  const token = authState?.token;
  const isAuthenticated = authState?.isAuthenticated;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && token) {
      // Small delay to ensure auth is fully settled
      const timer = setTimeout(() => {
        socketService.connect(token);
      }, 100);

      return () => {
        clearTimeout(timer);
        socketService.disconnect();
      };
    } else if (mounted && !isAuthenticated) {
      // Disconnect if user logs out
      socketService.disconnect();
    }
  }, [mounted, isAuthenticated, token]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ChatProvider>
      {children}
    </ChatProvider>
  );
}