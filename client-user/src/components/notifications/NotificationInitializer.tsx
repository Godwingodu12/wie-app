'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import realtimeNotificationService from '@/services/realtimeNotificationService';

interface NotificationInitializerProps {
  children: React.ReactNode;
}

export default function NotificationInitializer({ children }: NotificationInitializerProps) {
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
        realtimeNotificationService.connect(token);
      }, 100);

      return () => {
        clearTimeout(timer);
        realtimeNotificationService.disconnect();
      };
    } else if (mounted && !isAuthenticated) {
      // Disconnect if user logs out
      realtimeNotificationService.disconnect();
    }
  }, [mounted, isAuthenticated, token]);

  return <>{children}</>;
}
