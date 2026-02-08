'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMessageRequests } from '@/services/chatService';
import { MessageRequest, Chat } from '@/types/chat';
import { ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from "@/components/home/ThemeContext";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useChat } from '@/context/ChatContext';

export default function MessageRequestsPage() {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const { isMobile, isCollapsed } = useSidebar();
  const { setCurrentChat } = useChat();
  const marginLeft = isMobile ? "0" : isCollapsed ? "92px" : "281px";
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await getMessageRequests();
      if (response.success) {
        setRequests(response.requests || []);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (request: MessageRequest) => {
    // Map MessageRequest to Chat object structure expected by ChatContext
    const chatData: Chat = {
      _id: request._id,
      participant: request.participant,
      lastMessage: request.lastMessage,
      unreadCount: 0, // Requests usually treated as read once opened or have special handling
      type: 'request',
      status: 'pending',
      updatedAt: request.lastMessage?.timestamp || new Date().toISOString()
    };

    setCurrentChat(chatData);
    router.push('/message');
  };

  if (loading) {
    return (
      <div className="h-screen flex" style={{ backgroundColor: themeStyles.sidebarBg }}>
        {!isMobile && <SideBar />}
        <div
          className="flex-1 flex items-center justify-center transition-all duration-300"
          style={{ marginLeft }}
        >
          <Loader2 className="animate-spin text-[#8860D9]" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: themeStyles.background }}>
      {!isMobile && <SideBar />}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft }}
      >
        {/* Header */}
        <div
          className="p-4 flex items-center gap-4 flex-shrink-0"
          style={{
            background: themeStyles.sidebarBg,
            borderBottom: `1px solid ${themeStyles.border}`
          }}
        >
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full transition hover:opacity-80"
            style={{ color: themeStyles.text }}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: themeStyles.text }}>Message requests</h1>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-4">
            <p className="text-sm leading-relaxed" style={{ color: themeStyles.textSecondary }}>
                Open a chat to get more info on who they are. They won't know you've seen the message until you accept.
            </p>
        </div>

        {/* Requests List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2D2F39] scrollbar-track-transparent">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-20 px-4">
              <div className="w-20 h-20 rounded-full border-2 border-[#2D2F39] flex items-center justify-center mb-4">
                 <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                 </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: themeStyles.text }}>No pending requests</h3>
              <p className="text-sm text-center" style={{ color: themeStyles.textSecondary }}>
                  You don't have any message requests.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {requests.map((request) => (
                <div
                  key={request._id}
                  onClick={() => handleRequestClick(request)}
                  className="w-full px-5 py-3 flex items-center gap-3 cursor-pointer transition-colors active:bg-white/5"
                  style={{
                      // Hover effect can be added via CSS class or inline style if needed
                  }}
                >
                  {/* Avatar */}
                  <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: themeStyles.hoverBg }}>
                    {request.participant?.profile_picture ? (
                      <Image
                        src={request.participant.profile_picture}
                        alt={request.participant.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white">
                        {request.participant?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-[15px] truncate" style={{ color: themeStyles.text }}>
                            {request.participant?.name || 'Instagram User'}
                        </span>
                        <span className="text-[12px]" style={{ color: themeStyles.textSecondary }}>
                             {request.lastMessage?.timestamp
                                ? formatDistanceToNow(new Date(request.lastMessage.timestamp), { addSuffix: false })
                                    .replace('about ', '')
                                    .replace(' hours', 'h')
                                    .replace(' hour', 'h')
                                    .replace(' minutes', 'm')
                                    .replace(' minute', 'm')
                                    .replace(' days', 'd')
                                    .replace(' day', 'd')
                                : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <p className="text-[14px] truncate leading-tight" style={{ color: themeStyles.textSecondary }}>
                            {request.lastMessage?.content || 'Sent you a message'}
                        </p>
                    </div>
                     <p className="text-[12px] mt-1 opacity-70 truncate" style={{ color: themeStyles.textSecondary }}>
                        {request.participant?.username ? `@${request.participant.username}` : ''} • Instagram
                    </p>
                  </div>

                   {/* Optional: Right chevron or new indicator */}
                   {/* <ChevronRight size={18} style={{ color: themeStyles.textSecondary }} className="opacity-50" /> */}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
