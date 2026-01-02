'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import socketService from '@/services/socketService';
import { Chat, ChatMessage, UnreadCounts } from '@/types/chat';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  unreadCounts: UnreadCounts;
  isSocketConnected: boolean;
  typingUsers: { [chatId: string]: boolean }; 
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateChatList: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  setMessages: (messagesOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setChats: (chats: Chat[]) => void;
  updateUnreadCount: (chatId: string, count: number) => void;
  acceptRequest: (chatId: string) => Promise<void>;
  declineRequest: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CHATS: 'wie_chats',
  CURRENT_CHAT: 'wie_current_chat'
};

const loadFromStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail
  }
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authState = useSelector((state: RootState) => state?.auth) || { token: null, user: null };
  const token = authState.token;
  const user = authState.user;
  
  const [internalChats, setInternalChats] = useState<Chat[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.CHATS);
    return (stored && Array.isArray(stored)) ? stored : [];
  });
  
  const [internalCurrentChat, setInternalCurrentChat] = useState<Chat | null>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.CURRENT_CHAT);
    return (stored && stored._id) ? stored : null;
  });
  
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: boolean }>({}); 

  const setChats = useCallback((chats: Chat[]) => {
    setInternalChats(chats);
    saveToStorage(STORAGE_KEYS.CHATS, chats);
  }, []);

  const setCurrentChat = useCallback((chat: Chat | null) => {
    setInternalCurrentChat(chat);
    if (chat) {
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, chat);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
      }
    }
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setInternalMessages((prev) => {
      const exists = prev.some((m) => m._id === message._id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  const setMessages = useCallback((messagesOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setInternalMessages(messagesOrUpdater);
  }, []);

  const updateChatList = useCallback((updatedChat: Chat) => {    
    setInternalChats((prev) => {
      const exists = prev.find((c) => c._id === updatedChat._id);
      let newChats: Chat[];
      
      if (!updatedChat.lastMessage) {
        if (exists) {
          newChats = prev.filter((c) => c._id !== updatedChat._id);
        } else {
          return prev;
        }
      } else {
        if (exists) {
          newChats = prev.map((c) =>
            c._id === updatedChat._id
              ? { ...c, ...updatedChat }
              : c
          ).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        } else {
          newChats = [updatedChat, ...prev].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
      }
      
      saveToStorage(STORAGE_KEYS.CHATS, newChats);
      return newChats;
    });
    
    setInternalCurrentChat((prev) => {
      if (prev && prev._id === updatedChat._id) {
        const updated = { ...prev, ...updatedChat };
        saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
        return updated;
      }
      return prev;
    });
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setInternalChats((prev) => {
      const newChats = prev.filter((c) => c._id !== chatId);
      saveToStorage(STORAGE_KEYS.CHATS, newChats);
      return newChats;
    });
  }, []);

  const acceptRequest = useCallback(async (chatId: string) => {
    try {
      setInternalChats((prev) =>
        prev.map((c) =>
          c._id === chatId
            ? { ...c, status: 'accepted' as const, type: 'direct' as const }
            : c
        )
      );
      setInternalCurrentChat((prev) => {
        if (prev && prev._id === chatId) {
          const updated: Chat = { 
            ...prev, 
            status: 'accepted' as const, 
            type: 'direct' as const 
          };
          saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to update chat after accept:', error);
    }
  }, []);

  const declineRequest = useCallback(async (chatId: string) => {
    removeChat(chatId);
    if (internalCurrentChat?._id === chatId) {
      setCurrentChat(null);
    }
  }, [internalCurrentChat, removeChat, setCurrentChat]);

  const updateUnreadCount = useCallback((chatId: string, count: number) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [chatId]: count,
    }));
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    
    const socket = socketService.connect(token);
    
    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);
    const handleUnreadCounts = (counts: UnreadCounts) => setUnreadCounts(counts);
    
    const handleNewMessage = (data: any) => {
      if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
        setInternalMessages((prev) => {
          const exists = prev.some((m) => m._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });
      }
    };
    
    const handleNewMessageNotification = (data: any) => {
      if (!data.participant?._id || !data.lastMessage?.content) return;

      const chatType = (data.type === 'direct' || data.type === 'request') 
        ? data.type 
        : 'direct' as const;
      
      const chatStatus = (data.status === 'pending' || data.status === 'accepted' || data.status === 'declined')
        ? data.status
        : 'accepted' as const;

      const updatedChat: Chat = {
        _id: data.chatId,
        participant: {
          _id: data.participant._id,
          name: data.participant.name || 'Unknown',
          username: data.participant.username || '',
          contact_no: data.participant.contact_no || '',
          email: data.participant.email || '',
          profile_picture: data.participant.profile_picture,
          bio: data.participant.bio,
          is_verified: data.participant.is_verified || false,
          isOnline: data.participant.isOnline ?? false,
          lastSeen: data.participant.lastSeen || data.participant.last_seen_at,
          last_seen_at: data.participant.last_seen_at
        },
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount || 0,
        type: chatType,
        status: chatStatus,
        updatedAt: data.timestamp || new Date().toISOString(),
      };
      
      setInternalChats((prev) => {
        const exists = prev.find((c) => c._id === updatedChat._id);
        let newChats: Chat[];
        
        if (!updatedChat.lastMessage) {
          if (exists) {
            newChats = prev.filter((c) => c._id !== updatedChat._id);
          } else {
            return prev;
          }
        } else {
          if (exists) {
            newChats = prev.map((c) =>
              c._id === updatedChat._id
                ? { ...c, ...updatedChat }
                : c
            ).sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          } else {
            newChats = [updatedChat, ...prev].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          }
        }
        
        saveToStorage(STORAGE_KEYS.CHATS, newChats);
        return newChats;
      });
      
      setInternalCurrentChat((prev) => {
        if (prev && prev._id === updatedChat._id) {
          const updated = { ...prev, ...updatedChat };
          saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
          return updated;
        }
        return prev;
      });
    };
    
    const handleChatListUpdate = (data: any) => {
      if (!data.participant?._id || !data.lastMessage?.content) return;
      handleNewMessageNotification(data);
    };
    
    const handleMessagesRead = (data: any) => {
      if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
        setInternalMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg._id)
              ? { ...msg, readBy: [...msg.readBy, data.readBy], isRead: true }
              : msg
          )
        );
      }
    };

    const handleMessageDeleted = (data: any) => {
      if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
        setInternalMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      }
    };

    const handleChatDeleted = (data: any) => {
      setInternalChats((prev) => {
        const newChats = prev.filter((c) => c._id !== data.chatId);
        saveToStorage(STORAGE_KEYS.CHATS, newChats);
        return newChats;
      });
      
      if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
        setInternalCurrentChat(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
        }
      }
    };

    const handleChatCleared = (data: any) => {
      if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
        setInternalMessages([]);
      }
    };

    const handleUserStatusChange = (data: { userId: string; isOnline: boolean; lastSeen?: string; last_seen_at?: string }) => {
      setInternalChats((prev) => {
        const updated = prev.map((chat) =>
          chat.participant && chat.participant._id === data.userId
            ? {
                ...chat,
                participant: {
                  ...chat.participant,
                  isOnline: data.isOnline,
                  lastSeen: data.last_seen_at || data.lastSeen || chat.participant.lastSeen,
                  last_seen_at: data.last_seen_at,
                },
              }
            : chat
        );
        return updated;
      });
      
      setInternalCurrentChat((prev) => {
        if (prev && prev.participant && prev.participant._id === data.userId) {
          const updated = {
            ...prev,
            participant: {
              ...prev.participant,
              isOnline: data.isOnline,
              lastSeen: data.last_seen_at || data.lastSeen || prev.participant.lastSeen,
              last_seen_at: data.last_seen_at,
            },
          };
          saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
          return updated;
        }
        return prev;
      });
    };

    // ✅ NEW: Handle typing indicator
    const handleUserTyping = (data: { userId: string; chatId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.chatId]: data.isTyping
      }));

      // Auto-clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [data.chatId]: false
          }));
        }, 3000);
      }
    };

    socket.on('user-status-change', handleUserStatusChange);
    socket.on('user-typing', handleUserTyping); 
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('unread-counts', handleUnreadCounts);
    socket.on('new-message', handleNewMessage);
    socket.on('new-message-notification', handleNewMessageNotification);
    socket.on('chat-list-update', handleChatListUpdate);
    socket.on('messages-read', handleMessagesRead);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('chat-deleted', handleChatDeleted);
    socket.on('chat-cleared', handleChatCleared);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('unread-counts', handleUnreadCounts);
      socket.off('new-message', handleNewMessage);
      socket.off('new-message-notification', handleNewMessageNotification);
      socket.off('chat-list-update', handleChatListUpdate);
      socket.off('messages-read', handleMessagesRead);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('chat-deleted', handleChatDeleted);
      socket.off('chat-cleared', handleChatCleared);
      socket.off('user-status-change', handleUserStatusChange);
      socket.off('user-typing', handleUserTyping); // ✅ NEW
    };
  }, [token, user, internalCurrentChat?._id]); 

  return (
    <ChatContext.Provider
      value={{
        chats: internalChats,
        currentChat: internalCurrentChat,
        messages: internalMessages,
        unreadCounts,
        isSocketConnected,
        typingUsers, // ✅ NEW
        setCurrentChat,
        addMessage,
        updateChatList,
        removeChat,
        setMessages,
        setChats,
        updateUnreadCount,
        acceptRequest,
        declineRequest,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    return {
      chats: [],
      currentChat: null,
      messages: [],
      unreadCounts: {},
      isSocketConnected: false,
      typingUsers: {}, 
      setCurrentChat: () => {},
      addMessage: () => {},
      updateChatList: () => {},
      removeChat: () => {},
      setMessages: () => {},
      setChats: () => {},
      updateUnreadCount: () => {},
      acceptRequest: async () => {},
      declineRequest: async () => {},
    };
  }
  return context;
};