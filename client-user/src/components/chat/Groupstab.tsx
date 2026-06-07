'use client';

import { useMemo } from 'react';
import { Chat } from '@/types/chat';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import Image from 'next/image';
import { format } from 'date-fns';
import { Check, CheckCheck, Users } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';

interface GroupsTabProps {
  chats: Chat[];
  searchQuery: string;
  onChatSelect: (chat: Chat) => void;
  currentChatId?: string;
  imageErrors: Set<string>;
  onImageError: (chatId: string) => void;
}

export default function GroupsTab({
  chats,
  searchQuery,
  onChatSelect,
  currentChatId,
  imageErrors,
  onImageError
}: GroupsTabProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCounts, typingUsers } = useChat();
  const { themeStyles, isDark } = useTheme();

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      // Only group chats
      if (chat.type !== 'group') return false;

      // Search filter
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        chat.participant?.name?.toLowerCase().includes(searchLower) ||
        chat.participant?.username?.toLowerCase().includes(searchLower);

      return matchesSearch;
    });
  }, [chats, searchQuery]);

  if (filteredChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: themeStyles.textSecondary }}>
        <Users size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No group chats found</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {filteredChats.map((chat) => {
        const isActive = currentChatId === chat._id;
        const unreadCount = unreadCounts[chat._id] || chat.unreadCount || 0;
        const isTyping = typingUsers[chat._id] || false;
        const hasProfilePicture = chat.participant?.profile_picture && !imageErrors.has(chat._id);

        return (
          <div
            key={chat._id}
            onClick={() => onChatSelect(chat)}
            className="w-full p-3 flex items-center gap-3 transition-all cursor-pointer"
            style={{
              borderBottom: `1px solid ${themeStyles.border}`,
              backgroundColor: isActive
                ? (isDark ? 'rgba(56, 56, 56, 0.4)' : themeStyles.hoverBg)
                : 'transparent'
            }}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full overflow-hidden"
                style={{ backgroundColor: isDark ? '#374151' : '#D1D5DB' }}
              >
                {hasProfilePicture ? (
                  <Image
                    src={chat.participant!.profile_picture!}
                    alt={chat.participant!.name}
                    fill
                    className="object-cover rounded-full"
                    onError={() => onImageError(chat._id)}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-lg font-bold uppercase"
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  >
                    <Users size={24} />
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex justify-between items-start mb-1">
                <h3
                  className="font-medium text-[16px] truncate"
                  style={{ color: unreadCount > 0 ? themeStyles.text : themeStyles.textSecondary }}
                >
                  {chat.participant?.name || 'Group Chat'}
                </h3>
              </div>

              <div className="flex items-center text-sm text-gray-500 truncate">
                {(chat.lastMessage?.sender === user?.id || chat.lastMessage?.sender === (user as any)?._id) && (
                  <div className="mr-1 flex-shrink-0">
                    {(chat.lastMessage?.isRead || (chat.lastMessage?.readBy && chat.lastMessage.readBy.length > 1 && chat.lastMessage.readBy.some(id => id !== user?.id))) ? (
                      <CheckCheck size={16} style={{ color: '#8860D9' }} />
                    ) :
                    (chat.lastMessage?.deliveredTo && chat.lastMessage.deliveredTo.length > 0) ? (
                      <CheckCheck size={16} style={{ color: themeStyles.text }} />
                    ) :
                    (
                      <Check size={16} style={{ color: themeStyles.text }} />
                    )}
                  </div>
                )}

                <p
                  className="truncate max-w-[180px]"
                  style={{ color: unreadCount > 0 ? themeStyles.text : themeStyles.textSecondary, fontWeight: unreadCount > 0 ? 500 : 400 }}
                >
                  {isTyping ? (
                    <span className="text-blue-400 italic">typing...</span>
                  ) : (
                    chat.lastMessage?.content || ''
                  )}
                </p>

                <span className={`text-[11px] whitespace-nowrap ml-2 ${unreadCount > 0 ? "text-blue-400 font-medium" : "text-[#606060]"}`}>
                  {chat.lastMessage?.timestamp ? format(new Date(chat.lastMessage.timestamp), 'h:mm a') : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {unreadCount > 0 && (
                <span className="min-w-[20px] h-[20px] px-1.5 bg-[#BDD5FF] text-black text-[11px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}