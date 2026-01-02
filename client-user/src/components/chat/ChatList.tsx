'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { MessageCircle, Loader2, Bell } from 'lucide-react';
import Image from 'next/image';
import { Chat } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';
interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  isRefreshing?: boolean;
  pendingRequestsCount?: number;
}
export default function ChatList({ onChatSelect, isRefreshing = false, pendingRequestsCount = 0 }: ChatListProps) {
  const router = useRouter();
  const { chats, unreadCounts, currentChat, typingUsers } = useChat();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  if (!chats) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C1014]">
        <Loader2 className="animate-spin text-[#8860D9]" size={32} />
      </div>
    );
  }
  const handleImageError = (chatId: string) => {
    setImageErrors(prev => new Set(prev).add(chatId));
  };
  const formatLastSeenTime = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';
    
    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return 'Offline';
    } catch {
      return 'Offline';
    }
  };
  // Filter chats to only show those with messages
  const chatsWithMessages = chats.filter(chat => chat.lastMessage !== null);

  if (isRefreshing && chatsWithMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C1014]">
        <Loader2 className="animate-spin text-[#8860D9]" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0C1014] flex flex-col">
      {/* Message Requests Button */}
      {pendingRequestsCount > 0 && (
        <div className="p-4 border-b border-[#2D2F39]">
          <button
            onClick={() => router.push('/message/requests')}
            className="w-full flex items-center justify-between p-3 bg-[#1a1a1a] hover:bg-[#2D2F39] rounded-lg transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] rounded-full flex items-center justify-center">
                <Bell size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Message Requests</p>
                <p className="text-sm text-gray-400">{pendingRequestsCount} pending request{pendingRequestsCount > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white text-xs rounded-full px-2 py-1">
              {pendingRequestsCount}
            </div>
          </button>
        </div>
      )}

      {/* Chat List */}
      <div className="divide-y divide-[#2D2F39] overflow-y-auto flex-1">
        {chatsWithMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
            <MessageCircle size={48} className="mb-4 text-[#8860D9]" />
            <p className="text-center text-white">No messages yet</p>
            <p className="text-sm text-center mt-2 text-gray-400">Start a conversation with your followers</p>
          </div>
        ) : (
          chatsWithMessages.map((chat) => {
            const unreadCount = unreadCounts[chat._id] || chat.unreadCount || 0;
            const isActive = currentChat?._id === chat._id;
            const hasProfilePicture = chat.participant?.profile_picture && 
                                    !imageErrors.has(chat._id) && 
                                    typeof chat.participant.profile_picture === 'string';
            const isOnline = chat.participant?.isOnline ?? false;
            const lastSeen = chat.participant?.lastSeen || chat.participant?.last_seen_at;

            return (
              <button
                key={chat._id}
                onClick={() => onChatSelect(chat)}
                className={`w-full p-4 hover:bg-[#2D2F39] transition flex items-start gap-3 ${
                  isActive ? 'bg-[#2D2F39]' : ''
                }`}
              >
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#2D2F39] flex-shrink-0">
                {hasProfilePicture && chat.participant ? (
                  <>
                    <Image
                      src={chat.participant.profile_picture!}
                      alt={chat.participant.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                      priority={false}
                      onError={() => handleImageError(chat._id)}
                    />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0C1014] z-10" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                      {chat.participant?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0C1014] z-10" />
                    )}
                  </>
                )}
              </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate text-white">
                        {chat.participant?.name || 'Unknown'}
                      </p>
                      {chat.participant?.is_verified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {chat.lastMessage?.timestamp
                        ? formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true })
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'font-semibold text-white' : 'text-gray-400'
                      }`}>
                        {chat.lastMessage?.content || ''}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}