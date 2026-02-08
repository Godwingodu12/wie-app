'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { Search, PenSquare, MessageCircle, Loader2, Check, CheckCheck, Camera } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import Image from 'next/image';
import { Chat, MessageRequest } from '@/types/chat';
import { format, isYesterday } from 'date-fns';
import NewChatModal from './NewChatModal';
import { checkBlockStatus, getMessageRequests, getWieUserChats } from '@/services/chatService';

import messageIcon from '@/assets/chat/messageIcon.png';
import { useTheme } from '@/components/home/ThemeContext';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  isRefreshing?: boolean;
  pendingRequestsCount?: number;
}

export default function ChatList({ onChatSelect }: ChatListProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { themeStyles, isDark } = useTheme();

    const {
    setCurrentChat,
    currentChat,
    chats,
    setChats,
    updateChatList,
    updateUnreadCount,
    unreadCounts,
    typingUsers,
    getTotalUnreadCount
  } = useChat();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState('All');
  const [renderKey, setRenderKey] = useState(0);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
    const hasFetchedRef = useRef(false);
      const [searchQuery, setSearchQuery] = useState('');
    const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
    const [requests, setRequests] = useState<Chat[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const TABS = ["All", "Personal", "Groups", "Requests"];

  useEffect(() => {
    const refreshCurrentChatDetails = async () => {
      if (currentChat?._id && currentChat?.participant?._id) {
        try {
          const status = await checkBlockStatus(currentChat.participant._id);
          let isBlockedBy: 'you' | 'them' | undefined = undefined;
          if (status.iBlockedThem) {
            isBlockedBy = 'you';
          } else if (status.theyBlockedMe) {
            isBlockedBy = 'them';
          }
          const updatedChat = {
            ...currentChat,
            isBlocked: status.iBlockedThem || status.theyBlockedMe,
            isBlockedBy: isBlockedBy
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
  }, [currentChat?._id]);
  useEffect(() => {
    const loadChats = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      setIsRefreshing(true);
      try {
        const response = await getWieUserChats();
        if (response.success && response.chats && Array.isArray(response.chats)) {
          const mappedChats = response.chats.map((chat: any) => {
            const mappedChat = {
              ...chat,
              participant: chat.participant ? {
                ...chat.participant,
                isOnline: chat.participant.isOnline ?? false,
                lastSeen: chat.participant.last_seen_at || chat.participant.lastSeen,
                last_seen_at: chat.participant.last_seen_at
              } : null,
              isBlocked: chat.isBlocked || false,
              isBlockedBy: chat.isBlockedBy,
              unreadCount: chat.unreadCount || 0
            };

            return mappedChat;
          });

          // ✅ Always update chats to keep in sync with backend, even if empty
          setChats(mappedChats);

          if (mappedChats.length > 0) {
            // ✅ Initialize unread counts
            setTimeout(() => {
              mappedChats.forEach((chat: Chat) => {
                if (chat.unreadCount > 0) {
                  updateUnreadCount(chat._id, chat.unreadCount);
                }
              });
            }, 0);

            // Update current chat if exists
            if (currentChat?._id) {
              const updatedCurrentChat = mappedChats.find((c: Chat) => c._id === currentChat._id);
              if (updatedCurrentChat) {
                setCurrentChat(updatedCurrentChat);
              } else {
                 // ✅ CRITICAL: If current chat is not in the new list, clear it!
                 // BUT: If the current chat is a "request", don't clear it just because it's not in "chats" list
                 if (currentChat.type !== 'request') {
                    setCurrentChat(null);
                 }
              }
            }
          } else {
             // ✅ CRITICAL: If no chats, clear current chat!
             // BUT: If the current chat is a "request", don't clear it just because it's not in "chats" list
              if (currentChat?.type !== 'request') {
                  setCurrentChat(null);
              }
          }
        }
      } catch (error) {
        console.error('❌ Failed to load chats:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const loadRequestsCount = async () => {
      try {
        const response = await getMessageRequests();
        if (response.success) {
          setPendingRequestsCount(response.requests?.length || 0);
        }
      } catch (error) {
        console.error('Failed to load requests count:', error);
      }
    };
    const timer = setTimeout(() => {
      loadChats();
      loadRequestsCount();
    }, 150);

    return () => clearTimeout(timer);
  }, [setChats]);

  // Fetch Requests when tab is selected
  useEffect(() => {
      if (activeFilter === 'Requests') {
          const fetchRequests = async () => {
              setIsLoadingRequests(true);
              try {
                  const response = await getMessageRequests();
                  if (response.success && response.requests) {
                      setPendingRequestsCount(response.requests.length);
                      // Map requests to Chat objects
                      const mappedRequests: Chat[] = response.requests.map((req: MessageRequest) => ({
                          _id: req._id,
                          participant: req.participant,
                          lastMessage: req.lastMessage,
                          unreadCount: 0,
                          type: 'request',
                          status: 'pending',
                          updatedAt: req.lastMessage?.timestamp || new Date().toISOString()
                      }));
                      setRequests(mappedRequests);
                  }
              } catch (error) {
                  console.error('Failed to fetch requests', error);
              } finally {
                  setIsLoadingRequests(false);
              }
          };
          fetchRequests();
      }
  }, [activeFilter]);

  useEffect(() => {
    if (currentChat && window.innerWidth < 1024) {
      setShowMobileChat(true);
    }
  }, [currentChat]);

  // ✅ FIXED: handleChatSelect with proper unreadCounts access
  const handleChatSelect = async (chat: Chat) => {
    // Set current chat first
    setCurrentChat(chat);
    setShowMobileChat(true);

    // Requests are implicitly read/don't have unread count logic usually, but handled safely
    const currentUnreadCount = unreadCounts[chat._id] || chat.unreadCount || 0;

    if (currentUnreadCount > 0) {
      updateUnreadCount(chat._id, 0);
      // ✅ Dispatch event immediately for UI update
      if (typeof window !== 'undefined') {
        const newTotal = getTotalUnreadCount() - currentUnreadCount;
        window.dispatchEvent(new CustomEvent('unread-count-changed', {
          detail: {
            chatId: chat._id,
            unreadCount: 0,
            totalUnread: newTotal >= 0 ? newTotal : 0
          }
        }));
      }
    }

    onChatSelect(chat);
  };

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
        lastSeen: undefined
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
          lastSeen: participantData.lastSeen
        },
        lastMessage: chat.lastMessage || null,
        unreadCount: 0,
        type: chat.type || 'direct',
        status: chat.status || 'accepted',
        updatedAt: chat.updatedAt || new Date().toISOString(),
      };

      setCurrentChat(chatObject);
      setShowMobileChat(true);
      updateChatList(chatObject);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleBack = () => {
    setShowMobileChat(false);
  };

  // ✅ Keep your unreadCount listeners for real-time updates
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [unreadCounts]);

  useEffect(() => {
    const handleUnreadChange = () => setRenderKey(prev => prev + 1);
    window.addEventListener('unread-count-changed' as any, handleUnreadChange);
    return () => window.removeEventListener('unread-count-changed' as any, handleUnreadChange);
  }, []);

  // ✅ RESTORED: Compute chats with unread counts AND blocking logic
  const chatsWithMessages = useMemo(() => {
    return chats
      .filter(chat => chat.lastMessage !== null)
      .map(chat => ({
        ...chat,
        currentUnreadCount: unreadCounts[chat._id] ?? chat.unreadCount ?? 0
      }));
  }, [chats, unreadCounts, renderKey]);

// Combined Filter and Search Logic
const filteredChats = useMemo(() => {
  if (activeFilter === 'Requests') {
      return requests.filter(chat => {
          const searchLower = searchQuery.toLowerCase().trim();
          return searchLower === '' ||
              chat.participant?.name?.toLowerCase().includes(searchLower) ||
              chat.participant?.username?.toLowerCase().includes(searchLower);
      });
  }

  return chatsWithMessages.filter(chat => {
    // 1. Category Filtering
    let matchesCategory = true;

    // ✅ Exclude pending requests from other tabs
    if (chat.status === 'pending') return false;

    if (activeFilter === 'Groups') matchesCategory = chat.type === 'group';
    else if (activeFilter === 'Personal') matchesCategory = chat.type === 'direct';

    // 2. Search Query Filtering (by name or username)
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === '' ||
      chat.participant?.name?.toLowerCase().includes(searchLower) ||
      chat.participant?.username?.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });
}, [chatsWithMessages, requests, activeFilter, searchQuery]);


  // Time formatter like existing one
  const formatChatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} sec ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;

    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  const renderLoader = () => (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: themeStyles.sidebarBg }}>
        <Loader2 className="animate-spin text-[#5494FF]" size={32} />
      </div>
  );

  const isListLoading = (activeFilter === 'Requests' && isLoadingRequests) ||
                        (activeFilter !== 'Requests' && isRefreshing && chatsWithMessages.length === 0);

  if (!chats && !requests && isListLoading) {
      return renderLoader();
  }

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: themeStyles.sidebarBg, color: themeStyles.text }}>
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
             color: themeStyles.textSecondary
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
          onChange={(e) => setSearchQuery(e.target.value)}
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
            background: isDark ? 'rgba(34, 40, 49, 0.6)' : themeStyles.pillBg
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 h-full rounded-full text-[14px] font-medium transition-all whitespace-nowrap flex items-center justify-center ${
                activeFilter === tab
                ? "shadow-md scale-[1.02]"
                : "hover:opacity-80"
              }`}
              style={{
                background: activeFilter === tab
                  ? 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)'
                  : 'transparent',
                color: activeFilter === tab ? '#fff' : themeStyles.text
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
              ? 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.3) 32.69%, rgba(255, 255, 255, 0.3) 61.06%, rgba(153, 153, 153, 0) 100%)'
              : 'linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.15) 32.69%, rgba(0, 0, 0, 0.15) 61.06%, rgba(0, 0, 0, 0) 100%)',
          }}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 relative min-h-0 scrollbar-thin scrollbar-thumb-[#2D2F39] scrollbar-track-transparent">
        {isListLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="animate-spin text-[#5494FF]" size={32} />
            </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: themeStyles.textSecondary }}>
             <Image
                src={messageIcon}
                alt="No messages"
                width={48}
                height={48}
                className="mb-4 opacity-50"
             />
             <p className="text-sm">
                 {activeFilter === 'Requests' ? 'No pending requests' : 'No messages found'}
             </p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isActive = currentChat?._id === chat._id;
            const unreadCount = chat.unreadCount || 0;
            const isTyping = typingUsers[chat._id] || false;
            const hasProfilePicture = chat.participant?.profile_picture && !imageErrors.has(chat._id);
            const isBlockedByThem = chat.isBlockedBy === 'them';

            // Differentiate logic slightly if needed for requests (e.g. no typing indicator usually)
            const isRequest = chat.type === 'request' || chat.status === 'pending';

            return (
              <div
                key={chat._id}
                onClick={() => handleChatSelect(chat)}
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
                    {hasProfilePicture && !isBlockedByThem ? (
                      <Image
                        src={chat.participant!.profile_picture!}
                        alt={chat.participant!.name}
                        fill
                        className="object-cover rounded-full"
                        onError={() => setImageErrors(prev => new Set(prev).add(chat._id))}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-lg font-bold uppercase"
                        style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                      >
                        {isBlockedByThem ? '?' : chat.participant?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  {/* Status Indicator */}
                 {/* Only show green dot if NOT blocked and explicitly online */}
                  {!isBlockedByThem && chat.participant?.isOnline && !isRequest && (
                     <div
                       className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2"
                       style={{ borderColor: isDark ? '#0a0a0a' : themeStyles.background }}
                     ></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 mr-2">
                  <div className="flex justify-between items-start mb-1">
                    <h3
                      className="font-medium text-[16px] truncate"
                      style={{ color: unreadCount > 0 ? themeStyles.text : themeStyles.textSecondary }}
                    >
                       {isBlockedByThem ? 'User' : (chat.participant?.name || 'Unknown')}
                    </h3>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 truncate">
                      {/* Message Status Ticks (Only for own messages) */}
                       {!isRequest && (chat.lastMessage?.sender === user?.id || chat.lastMessage?.sender === (user as any)?._id) && (
                           <div className="mr-1 flex-shrink-0">
                             {/* Logic synced with ChatWindow + isRead fallback */}
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

                       {/* Message Content */}
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

                       {/* Time beside message */}
                       <span className={`text-[11px] whitespace-nowrap ml-2 ${unreadCount > 0 ? "text-blue-400 font-medium" : "text-[#606060]"}`}>
                            {chat.lastMessage?.timestamp ? format(new Date(chat.lastMessage.timestamp), 'h:mm a') : ''}
                       </span>
                  </div>
                </div>

                {/* Right Side: Count and Camera */}
                <div className="flex items-center gap-3 flex-shrink-0">
                     {/* Unread Count */}
                     {unreadCount > 0 && (
                        <span className="min-w-[20px] h-[20px] px-1.5 bg-[#BDD5FF] text-black text-[11px] font-bold rounded-full flex items-center justify-center">
                            {unreadCount}
                        </span>
                     )}


                </div>
              </div>
            );
          })
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
