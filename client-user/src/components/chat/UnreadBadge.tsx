'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/context/ChatContext';

export default function UnreadBadge() {
  const { unreadCounts } = useChat();
  const [totalUnread, setTotalUnread] = useState(0);

  // Calculate total when unreadCounts changes
  useEffect(() => {
    const total = (Object.values(unreadCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
    setTotalUnread(total);
  }, [unreadCounts]);

  // Listen for custom events
  useEffect(() => {
    const handleUnreadChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.totalUnread !== undefined) {
        setTotalUnread(customEvent.detail.totalUnread);
      }
    };

    window.addEventListener('unread-count-changed', handleUnreadChange);
    return () => window.removeEventListener('unread-count-changed', handleUnreadChange);
  }, []);

  if (totalUnread === 0) return null;

  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 z-10">
      {totalUnread > 99 ? '99+' : totalUnread}
    </div>
  );
}