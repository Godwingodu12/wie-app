'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import { MessageCircle, Loader2, Camera, CheckCheck, MessageSquarePlus, X, Check } from 'lucide-react';
import Image from 'next/image';
import { Chat } from '@/types/chat';
import { format, isYesterday } from 'date-fns';
import NewChatModal from './NewChatModal';
import { checkBlockStatus, getMessageRequests, getWieUserChats } from '@/services/chatService';
import New_Chat from '@/assets/message/new_chat.jpg';
interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  isRefreshing?: boolean;
  pendingRequestsCount?: number;
}

export default function ChatList({ onChatSelect }: ChatListProps) {
  const router = useRouter();
 
    const { 
    setCurrentChat, 
    currentChat, 
    chats, 
    setChats, 
    updateChatList, 
    updateUnreadCount,
    unreadCounts,  // ✅ Added this
    typingUsers,
    getTotalUnreadCount  // ✅ Added this
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
          
          if (mappedChats.length > 0) {
            setChats(mappedChats);
            
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
              }
            }
          } else if (chats.length === 0) {
            setChats([]);
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
    
    // ✅ Reset unread count immediately in local state
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

  
  const filters = ['All', 'Personal', 'Groups', 'Requests'];

  // ✅ Keep your unreadCount listeners for real-time updates
  useEffect(() => {
    setRenderKey(prev => prev + 1);
  }, [unreadCounts]);

  useEffect(() => {
    const handleUnreadChange = () => setRenderKey(prev => prev + 1);
    window.addEventListener('unread-count-changed' as any, handleUnreadChange);
    return () => window.removeEventListener('unread-count-changed' as any, handleUnreadChange);
  }, []);
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
  return chatsWithMessages.filter(chat => {
    // 1. Category Filtering
    let matchesCategory = true;
    if (activeFilter === 'Requests') matchesCategory = chat.status === 'pending';
    else if (activeFilter === 'Groups') matchesCategory = chat.type === 'group';
    else if (activeFilter === 'Personal') matchesCategory = chat.type === 'direct';

    // 2. Search Query Filtering (by name or username)
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === '' || 
      chat.participant?.name?.toLowerCase().includes(searchLower) ||
      chat.participant?.username?.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });
}, [chatsWithMessages, activeFilter, searchQuery]);

  if (!chats || (isRefreshing && chatsWithMessages.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C1014]">
        <Loader2 className="animate-spin text-[#5494FF]" size={32} />
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0C1014] flex flex-col">
      {/* 1. Header Section: Messages + New Chat Button */}
  <div className="p-4 pt-6 flex items-center justify-between flex-shrink-0">
    <h1 className="text-2xl font-bold text-white tracking-tight">Messages</h1>
    <button
      onClick={() => setShowNewChatModal(true)}
      style={{ 
      background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.6) -8.43%, rgba(96, 96, 96, 0.6) 100%)',
      backdropFilter: 'blur(10px)' 
    }}
      className="flex items-center gap-2  backdrop-blur-md text-white px-5 py-2 rounded-full hover:bg-[#3D3F49] transition-all  shadow-lg"
    >
      <Image 
              src={New_Chat} 
              alt="New Chat" 
              className=" "
            />
      <span className="text-sm font-medium">New chat</span>
    </button>
  </div>

  {/* 2. Search Bar Section */}<div className="px-4 mb-2">
  <div className="relative group">
    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <input 
      type="text" 
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)} // Update state on typing
      placeholder="Search peoples here.." 
      className="w-full bg-[#1A1A1A] border-none rounded-xl py-3 pl-12 pr-10 text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-white/10 transition-all shadow-inner"
    />
    {searchQuery && (
      <button 
        onClick={() => setSearchQuery('')}
        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white"
      >
        <X size={16} />
      </button>
    )}
  </div>
</div>
{/* 1. Category Filter Capsule */}
<div className="px-4 py-3 sticky top-0 z-20 bg-[#0C1014]">
  <div className="flex bg-[#1A1A1A] p-1.5 rounded-full gap-1 border border-white/5">
    {filters.map((filter) => (
      <button
        key={filter}
        onClick={() => {
          if (filter === 'Requests') {
            router.push('/message/requests');
          } else {
            setActiveFilter(filter);
          }
        }}
        className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 ${
          activeFilter === filter 
          ? 'bg-[#5494FF] text-white shadow-lg' 
          : 'text-gray-400 hover:text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-1">
          {filter}
          {/* Optional: Show request count badge on the filter button */}
          {filter === 'Requests' && pendingRequestsCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] rounded-full px-1 min-w-[14px]">
              {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
            </span>
          )}
        </div>
      </button>
    ))}
  </div>
</div>

      {/* 2. Chat List Container */}
<div className="flex-1 overflow-y-auto scrollbar-hide">
  {filteredChats.length === 0 ? (
<div className="flex flex-col items-center justify-center h-full text-gray-500 px-4">
      <MessageCircle size={48} className="mb-4 text-[#5494FF] opacity-20" />
      <p className="text-white font-medium">
        {searchQuery ? `No results for "${searchQuery}"` : 'No messages yet'}
      </p>
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery('')}
          className="text-[#5494FF] text-sm mt-2 hover:underline"
        >
          Clear search
        </button>
      )}
    </div>
  ) : (
    filteredChats.map((chat) => {
      // 1. Core Logic & Variables
      const unreadCount = chat.currentUnreadCount;
      const isActive = currentChat?._id === chat._id;
      const isOnline = chat.participant?.isOnline ?? false;
      const isTyping = typingUsers[chat._id] || false;
      const lastMsg = chat.lastMessage;
      
      const isBlockedByThem = chat.isBlockedBy === 'them';
      const isBlockedByYou = chat.isBlockedBy === 'you';
      const hasProfilePicture = chat.participant?.profile_picture && !imageErrors.has(chat._id);

      // 2. Custom Time Ago Logic (1 sec ago, 29 min ago, etc.)
      const formatChatTime = (timestamp: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSecs < 1) return 'Just now';
        if (diffInSecs < 60) return `${diffInSecs} sec ago`;
        
        const diffInMins = Math.floor(diffInSecs / 60);
        if (diffInMins < 60) return `${diffInMins} min ago`;
        
        const diffInHrs = Math.floor(diffInMins / 60);
        if (diffInHrs < 24) return `${diffInHrs} hr ago`;
        
        return isYesterday(date) ? 'Yesterday' : format(date, 'dd/MM/yy');
      };

      // 3. Status Ticket Logic (Blue/Purple when read)
      const isLastMsgFromMe = lastMsg && lastMsg.sender !== chat.participant?._id;
      const isLastMsgRead = isLastMsgFromMe && lastMsg?.readBy && lastMsg.readBy.length > 1;
      const isLastMsgDelivered = isLastMsgFromMe && lastMsg?.deliveredTo && lastMsg.deliveredTo.length > 0;

      // 4. Return JSX (Ensures ReactNode compatibility)
      return (
        <button
          key={`${chat._id}-${renderKey}`}
          onClick={() => onChatSelect(chat)}
          className={`w-full px-4 py-4 flex items-center gap-4 transition-all hover:bg-white/[0.03] relative border-b border-white/[0.03] ${
            isActive ? 'bg-white/[0.05]' : ''
          }`}
        >
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            <div className={`w-14 h-14 rounded-full p-[2px] ${
              isOnline && !isBlockedByThem ? 'bg-gradient-to-tr from-green-500 to-emerald-400' : 'bg-gray-700'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden bg-[#0C1014] relative border-[2px] border-[#0C1014] flex items-center justify-center">
                {isBlockedByThem ? (
                  <div className="text-gray-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                ) : hasProfilePicture ? (
                  <Image
                    src={chat.participant!.profile_picture!}
                    alt={chat.participant!.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                    onError={() => setImageErrors(prev => new Set(prev).add(chat._id))}
                  />
                ) : (
                  <span className="text-white font-bold text-lg uppercase">
                    {chat.participant?.name?.charAt(0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="font-bold text-white text-[15px] truncate">
                  {isBlockedByThem ? 'User' : (chat.participant?.name || 'Unknown')}
                </p>
                {!isBlockedByThem && chat.participant?.is_verified && (
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                )}
                {isBlockedByYou && (
                  <span className="text-[10px] text-red-500 font-bold border border-red-500/30 px-1 rounded">BLOCKED</span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap uppercase">
                {lastMsg ? formatChatTime(lastMsg.timestamp) : ''}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {isTyping ? (
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      <span className="w-1 h-1 bg-[#5494FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-[#5494FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-[#5494FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-[#5494FF] italic">typing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                   {isLastMsgFromMe && (
                  <div className="flex items-center">
                    {isLastMsgRead ? (
                      <CheckCheck size={14} className="text-[#5494FF]" /> // Blue/Purple for Seen
                    ) : isLastMsgDelivered ? (
                      <CheckCheck size={14} className="text-gray-600" /> // Gray Double for Delivered
                    ) : (
                      <Check size={14} className="text-gray-600" /> // Gray Single for Sent
                    )}
                  </div>
                )}
                    <p className={`text-[13px] truncate ${unreadCount > 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                      {lastMsg?.content || 'No messages yet'}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-3 ml-2">
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/10 text-white text-[10px] font-black border border-white/5">
                    {unreadCount}
                  </span>
                )}
                <Camera size={18} className="text-gray-600 hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </button>
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
