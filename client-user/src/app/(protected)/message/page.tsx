'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { useChat } from '@/context/ChatContext';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import NewChatModal from '@/components/chat/NewChatModal';
import { MessageSquarePlus, MessageCircle } from 'lucide-react';
import { Chat } from '@/types/chat';
import { getWieUserChats, getMessageRequests, checkBlockStatus,getWieChatMessages} from '@/services/chatService';
import UnreadBadge from '@/components/chat/UnreadBadge';
export default function MessagesPage() {
  const { 
    setCurrentChat, 
    currentChat, 
    chats, 
    setChats, 
    updateChatList, 
    updateUnreadCount,
    unreadCounts,  // ✅ Added this
    getTotalUnreadCount  // ✅ Added this
  } = useChat();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const hasFetchedRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
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

  return (
    <div className="h-screen flex flex-col bg-[#0C1014]">

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`w-full lg:w-96 border-r border-[#2D2F39] bg-[#0C1014] ${
            showMobileChat ? 'hidden lg:block' : 'block'
          }`}
        >
          <ChatList 
            onChatSelect={handleChatSelect} 
            isRefreshing={isRefreshing}
            pendingRequestsCount={pendingRequestsCount}
          />
        </div>

        <div
          className={`flex-1 bg-[#0C1014] ${
            currentChat ? 'block' : 'hidden lg:flex'
          }`}
        >
          {currentChat ? (
            <ChatWindow onBack={handleBack} />
          ) : (
            <div className="hidden lg:flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageSquarePlus size={64} className="mx-auto mb-4 text-[#8860D9]" />
                <p className="text-xl text-white mb-2">Select a conversation</p>
                <p className="text-sm text-center mt-2">Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}

