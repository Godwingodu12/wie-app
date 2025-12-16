'use client';

import { useEffect } from 'react';
import realtimeNotificationService from '@/services/realtimeNotificationService';

interface NotificationInitializerProps {
  children: React.ReactNode;
}

export default function NotificationInitializer({ children }: NotificationInitializerProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('token');

    if (token) {
      realtimeNotificationService.connect(token);
    } else {
      // eslint-disable-next-line no-console
      console.log('⚠️ No token found, skipping notification service connection');
    }

    return () => {
      realtimeNotificationService.disconnect();
    };
  }, []);

  return <>{children}</>;
}


