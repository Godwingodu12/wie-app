'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { useChat } from '@/context/ChatContext';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import NewChatModal from '@/components/chat/NewChatModal';
import { MessageSquarePlus } from 'lucide-react';
import { Chat } from '@/types/chat';
import { getWieUserChats, getMessageRequests } from '@/services/chatService';

export default function MessagesPage() {
  const { setCurrentChat, currentChat, chats, setChats, updateChatList } = useChat();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const hasFetchedRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadChats = async () => {
      if (hasFetchedRef.current) return;
      
      hasFetchedRef.current = true;
      setIsRefreshing(true);

      try {
        const response = await getWieUserChats();
        
        if (response.success && response.chats && Array.isArray(response.chats)) {
          // Map chats to ensure lastSeen field is properly set
          const mappedChats = response.chats.map((chat: any) => ({
            ...chat,
            participant: chat.participant ? {
              ...chat.participant,
              lastSeen: chat.participant.last_seen_at || chat.participant.lastSeen,
              isOnline: chat.participant.isOnline ?? false
            } : null
          }));
          
          if (mappedChats.length > 0) {
            setChats(mappedChats);
          } else if (chats.length === 0) {
            setChats([]);
          }
        }
      } catch (error) {
        // On error, keep existing chats from localStorage
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

  const handleChatSelect = (chat: Chat) => {
    setCurrentChat(chat);
    setShowMobileChat(true);
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
      // Silent fail
    }
  };
  const handleBack = () => {
    setShowMobileChat(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0C1014]">
      <div className="bg-[#1a1a1a] border-b border-[#2D2F39] p-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/message/requests')}
            className="relative flex items-center gap-2 bg-[#2D2F39] text-white px-4 py-2 rounded-lg hover:bg-[#3D3F49] transition"
          >
            <span className="hidden sm:inline">Requests</span>
            <span className="sm:hidden">Req</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            <MessageSquarePlus size={20} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
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
                <p className="text-sm">Choose from your existing conversations or start a new one</p>
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