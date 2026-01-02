'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import { updateHeartbeat } from '@/services/wieUserService';

const HeartbeatManager: React.FC = () => {
  const authState = useSelector((state: RootState) => state?.auth);
  const token = authState?.token;
  const isAuthenticated = authState?.isAuthenticated;
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Clear interval if user logs out
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat immediately on mount
    updateHeartbeat().catch(console.error);

    // Clear any existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Send heartbeat every 30 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        await updateHeartbeat();
        console.log('💓 Heartbeat sent');
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    }, 30000); // 30 seconds

    // Send heartbeat when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // User came back to tab, send immediate heartbeat
        updateHeartbeat().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, token]);

  return null;
};

export default HeartbeatManager;