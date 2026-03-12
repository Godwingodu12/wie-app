'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { Search, PenSquare, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import { Chat } from '@/types/chat';
import NewChatModal from './NewChatModal';
import { checkBlockStatus, getWieUserChats } from '@/services/chatService';
import { useTheme } from '@/components/home/ThemeContext';

// Import tab components
import AllChatsTab from '@/components/chat/Allchatstab';
import PersonalChatsTab from '@/components/chat/Personalchatstab';
import GroupsTab from '@/components/chat/Groupstab';
import RequestsTab from '@/components/chat/Requeststab';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
}

export function getLastMessagePreview(chat: any): React.ReactNode {
  const lm = chat.lastMessage;
  if (!lm) return null;

  const isViewOnce =
    lm.viewMode === 'view_once' ||
    lm.viewMode === 'allow_replay' ||
    lm.chat_images?.[0]?.viewMode === 'view_once' ||
    lm.chat_images?.[0]?.viewMode === 'allow_replay' ||
    lm.chat_videos?.[0]?.viewMode === 'view_once' ||
    lm.chat_videos?.[0]?.viewMode === 'allow_replay';

  if (isViewOnce) {
    const isPhoto = lm.messageType === 'image';
    return (
      <span className="flex items-center gap-1">
        {/* ① circle — signals view-once */}
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full border font-bold text-[10px] flex-shrink-0"
          style={{ borderColor: 'currentColor' }}
        >
          1
        </span>
        {isPhoto ? 'Photo' : 'Video'}
      </span>
    );
  }

  // Default: plain text content
  return <>{lm.content}</>;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatList({ onChatSelect }: ChatListProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const { themeStyles, isDark } = useTheme();

  const {
    setCurrentChat,
    currentChat,
    chats,
    setChats,
    updateChatList,
    updateUnreadCount,
    getTotalUnreadCount,
    clearRequestCount,
  } = useChat();

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState('All');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasFetchedRef = useRef(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { requestCounts } = useChat();
  const pendingRequestsCount = Object.keys(requestCounts).length;
  const TABS = ['All', 'Personal', 'Groups', 'Requests'];

  // ── Refresh block status for current chat ──────────────────────────────────
  useEffect(() => {
    const refreshCurrentChatDetails = async () => {
      if (currentChat?._id && currentChat?.participant?._id) {
        try {
          const status = await checkBlockStatus(currentChat.participant._id);
          let isBlockedBy: 'you' | 'them' | undefined = undefined;
          if (status.iBlockedThem) isBlockedBy = 'you';
          else if (status.theyBlockedMe) isBlockedBy = 'them';

          const updatedChat = {
            ...currentChat,
            isBlocked: status.iBlockedThem || status.theyBlockedMe,
            isBlockedBy,
          };
          setCurrentChat(updatedChat);
          if (typeof window !== 'undefined') {
            localStorage.setItem('wie_current_chat', JSON.stringify(updatedChat));
          }
        } catch (error) {
          console.error('Failed to refresh chat details:', error);
        }
      }
    };
    refreshCurrentChatDetails();
  }, [currentChat?._id, currentChat?.participant?._id, setCurrentChat]);

  // ── Initial chat load ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadChats = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      setIsRefreshing(true);
      try {
        const response = await getWieUserChats();
        if (response.success && response.chats && Array.isArray(response.chats)) {
          const mappedChats = response.chats.map((chat: any) => ({
            ...chat,
            participant: chat.participant
              ? {
                  ...chat.participant,
                  isOnline: chat.participant.isOnline ?? false,
                  lastSeen: chat.participant.last_seen_at || chat.participant.lastSeen,
                  last_seen_at: chat.participant.last_seen_at,
                }
              : null,
            isBlocked: chat.isBlocked || false,
            isBlockedBy: chat.isBlockedBy,
            unreadCount: chat.unreadCount || 0,
          }));

          setChats(mappedChats);

          if (mappedChats.length > 0) {
            setTimeout(() => {
              mappedChats.forEach((chat: Chat) => {
                if (chat.unreadCount > 0) updateUnreadCount(chat._id, chat.unreadCount);
              });
            }, 0);

            if (currentChat?._id) {
              const updatedCurrentChat = mappedChats.find((c: Chat) => c._id === currentChat._id);
              if (updatedCurrentChat) {
                setCurrentChat(updatedCurrentChat);
              } else if (currentChat.type !== 'request') {
                setCurrentChat(null);
              }
            }
          } else if (currentChat?.type !== 'request') {
            setCurrentChat(null);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load chats:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const timer = setTimeout(loadChats, 150);
    return () => clearTimeout(timer);
  }, [setChats]);

  // ── Chat select ────────────────────────────────────────────────────────────
  const handleChatSelect = async (chat: Chat) => {
    setCurrentChat(chat);
    updateUnreadCount(chat._id, 0);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('unread-count-changed', {
          detail: { chatId: chat._id, unreadCount: 0, totalUnread: 0 },
        })
      );
    }
    onChatSelect(chat);
  };

  // ── Message deleted event ──────────────────────────────────────────────────
  useEffect(() => {
    const handleMessageDeleted = async (event: CustomEvent) => {
      const { chatId, lastMessage, totalMessages } = event.detail;

      if (totalMessages === 0) {
        setChats((prev: Chat[]) => prev.filter((c: Chat) => c._id !== chatId));
        if (currentChat?._id === chatId) setCurrentChat(null);
      } else if (lastMessage) {
        setChats((prev: Chat[]) =>
          prev.map((chat: Chat) => {
            if (chat._id !== chatId) return chat;
            return {
              ...chat,
              lastMessage: {
                content: lastMessage.content,
                sender: lastMessage.sender,
                timestamp: lastMessage.timestamp,
                deliveredTo: lastMessage.deliveredTo || [],
                readBy: lastMessage.readBy,
                isRead: lastMessage.isRead,
              },
              updatedAt: lastMessage.timestamp,
            };
          })
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message-deleted' as any, handleMessageDeleted as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message-deleted' as any, handleMessageDeleted as any);
      }
    };
  }, [currentChat, setChats, setCurrentChat]);

  // ── Force reload / request accepted / new chat added ──────────────────────
  useEffect(() => {
    const handleForceReload = async () => {
      try {
        const response = await getWieUserChats();
        if (response.success && response.chats && Array.isArray(response.chats)) {
          const mappedChats = response.chats.map((chat: any) => ({
            ...chat,
            participant: chat.participant
              ? {
                  ...chat.participant,
                  isOnline: chat.participant.isOnline ?? false,
                  lastSeen: chat.participant.last_seen_at || chat.participant.lastSeen,
                  last_seen_at: chat.participant.last_seen_at,
                }
              : null,
            isBlocked: chat.isBlocked || false,
            isBlockedBy: chat.isBlockedBy,
            unreadCount: chat.unreadCount || 0,
          }));
          setChats(mappedChats);
        }
      } catch (error) {
        console.error('Failed to reload chats:', error);
      }
    };

    const handleRequestAccepted = () => {
      setActiveFilter('All');
      handleForceReload();
    };

    const handleNewChatAdded = (event: CustomEvent) => {
      const { chat } = event.detail;
      if (chat && (chat.type === 'direct' || !chat.type)) {
        setActiveFilter('Personal');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('force-reload-chats' as any, handleForceReload);
      window.addEventListener('request-accepted' as any, handleRequestAccepted);
      window.addEventListener('new-chat-added' as any, handleNewChatAdded);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('force-reload-chats' as any, handleForceReload);
        window.removeEventListener('request-accepted' as any, handleRequestAccepted);
        window.removeEventListener('new-chat-added' as any, handleNewChatAdded);
      }
    };
  }, [setChats]);

  // ── New chat created ───────────────────────────────────────────────────────
  const handleChatCreated = (chatId: string, chat: any) => {
    try {
      const participantData = chat.participant || {
        _id: chat.participants?.find((id: string) => id !== chat.participants[0]),
        name: 'Unknown User',
        username: '',
        email: '',
        contact_no: '',
        profile_picture: null,
        bio: '',
        is_verified: false,
        isOnline: false,
        lastSeen: undefined,
      };

      const chatObject: Chat = {
        _id: chat._id || chatId,
        participant: {
          _id: participantData._id,
          name: participantData.name || 'Unknown User',
          username: participantData.username || '',
          email: participantData.email || '',
          contact_no: participantData.contact_no || '',
          profile_picture: participantData.profile_picture || null,
          bio: participantData.bio || '',
          is_verified: participantData.is_verified || false,
          isOnline: participantData.isOnline ?? false,
          lastSeen: participantData.lastSeen,
        },
        lastMessage: chat.lastMessage || null,
        unreadCount: 0,
        type: chat.type || 'direct',
        status: chat.status || 'accepted',
        updatedAt: chat.updatedAt || new Date().toISOString(),
      };

      setCurrentChat(chatObject);
      updateChatList(chatObject);
      setActiveFilter(chatObject.type === 'group' ? 'Groups' : 'Personal');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleImageError = (chatId: string) => {
    setImageErrors(prev => new Set(prev).add(chatId));
  };

  const renderLoader = () => (
    <div
      className="flex items-center justify-center h-full"
      style={{ backgroundColor: themeStyles.sidebarBg }}
    >
      <Loader2 className="animate-spin text-[#5494FF]" size={32} />
    </div>
  );

  if (isRefreshing && chats.length === 0) return renderLoader();

  return (
    <div
      className="flex flex-col h-full w-full"
      style={{ backgroundColor: themeStyles.sidebarBg, color: themeStyles.text }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 flex-shrink-0">
        <h1 className="text-[22px] font-bold">Messages</h1>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-colors ml-auto"
          style={{
            background: isDark
              ? 'linear-gradient(270deg, rgba(32, 32, 32, 0.6) -8.43%, rgba(96, 96, 96, 0.6) 100%)'
              : themeStyles.hoverBg,
            color: themeStyles.textSecondary,
          }}
        >
          <PenSquare size={14} />
          <span className="text-sm">New chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative px-4 mb-4 flex-shrink-0">
        <Search
          className="absolute left-7 top-1/2 -translate-y-1/2"
          style={{ color: themeStyles.textSecondary }}
          size={18}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search peoples here.."
          className="w-full pl-10 pr-4 py-3 rounded-xl border-none outline-none focus:ring-1 text-[16px]"
          style={{
            background: isDark ? '#38383866' : themeStyles.hoverBg,
            color: themeStyles.text,
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-col items-center mb-4 flex-shrink-0">
        <div
          className="flex items-center justify-center rounded-full p-[3px] overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '369px',
            height: '36px',
            background: isDark ? 'rgba(34, 40, 49, 0.6)' : themeStyles.pillBg,
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 h-full rounded-full text-[14px] font-medium transition-all whitespace-nowrap flex items-center justify-center ${
                activeFilter === tab ? 'shadow-md scale-[1.02]' : 'hover:opacity-80'
              }`}
              style={{
                background:
                  activeFilter === tab
                    ? 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)'
                    : 'transparent',
                color: activeFilter === tab ? '#fff' : themeStyles.text,
              }}
            >
              {tab}
              {tab === 'Requests' && pendingRequestsCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Gradient Divider */}
        <div
          className="mt-4 w-full max-w-[378px]"
          style={{
            height: '1px',
            background: isDark
              ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 32.69%, rgba(255,255,255,0.3) 61.06%, rgba(153,153,153,0) 100%)'
              : 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 32.69%, rgba(0,0,0,0.15) 61.06%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 relative min-h-0 scrollbar-thin scrollbar-thumb-[#2D2F39] scrollbar-track-transparent">
        {activeFilter === 'All' && (
          <AllChatsTab
            chats={chats}
            searchQuery={searchQuery}
            onChatSelect={handleChatSelect}
            currentChatId={currentChat?._id}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        )}
        {activeFilter === 'Personal' && (
          <PersonalChatsTab
            chats={chats}
            searchQuery={searchQuery}
            onChatSelect={handleChatSelect}
            currentChatId={currentChat?._id}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        )}
        {activeFilter === 'Groups' && (
          <GroupsTab
            chats={chats}
            searchQuery={searchQuery}
            onChatSelect={handleChatSelect}
            currentChatId={currentChat?._id}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        )}
        {activeFilter === 'Requests' && (
          <RequestsTab
            searchQuery={searchQuery}
            onChatSelect={handleChatSelect}
            currentChatId={currentChat?._id}
            imageErrors={imageErrors}
            onImageError={handleImageError}
          />
        )}
      </div>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}
