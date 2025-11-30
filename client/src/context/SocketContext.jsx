import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import chatNotifications from '../utils/chatNotifications';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadChats, setUnreadChats] = useState(new Map());
  const [messageDrafts, setMessageDrafts] = useState(new Map());
  const socketRef = useRef(null);
  const [isRehydrated, setIsRehydrated] = useState(false);
  const eventListenersAttached = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const unreadCountsReceivedRef = useRef(false);
  const { token, user } = useSelector((state) => state.auth);
  const isAuthenticated = !!(token && user);

  useEffect(() => {
    const checkRehydration = () => {
      const persistRoot = localStorage.getItem('persist:root');
      if (persistRoot) {
        setIsRehydrated(true);
      }
    };
    
    checkRehydration();
    const timer = setTimeout(checkRehydration, 100);
    return () => clearTimeout(timer);
  }, []);

  const incrementUnreadCount = useCallback((chatId) => {
    setUnreadChats(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(chatId) || 0;
      const newCount = currentCount + 1;
      newMap.set(chatId, newCount);
      return newMap;
    });
  }, []);

  const setUnreadCount = useCallback((chatId, count) => {
    setUnreadChats(prev => {
      const newMap = new Map(prev);
      if (count > 0) {
        newMap.set(chatId, count);
      } else {
        newMap.delete(chatId);
      }
      return newMap;
    });
  }, []);

  const initializeUnreadCounts = useCallback((chatsData) => {  
    const currentChatId = sessionStorage.getItem('currentChatId');
    const newMap = new Map();
    
    chatsData.forEach(chat => {
      const isCurrentlyViewing = chat._id === currentChatId;
      
      if (!isCurrentlyViewing && chat.unreadCount > 0) {
        newMap.set(chat._id, chat.unreadCount);
      }
    });
    
    setUnreadChats(newMap);
    setIsInitialized(true);
  }, []);

  const markChatAsRead = useCallback((chatId) => {
    setUnreadChats(prev => {
      const newMap = new Map(prev);
      newMap.delete(chatId);
      return newMap;
    });
  }, []);

  const saveDraft = useCallback((chatId, content) => {
    setMessageDrafts(prev => {
      const newMap = new Map(prev);
      if (content.trim()) {
        newMap.set(chatId, content);
      } else {
        newMap.delete(chatId);
      }
      return newMap;
    });
  }, []);

  const getDraft = useCallback((chatId) => {
    return messageDrafts.get(chatId) || '';
  }, [messageDrafts]);

  const clearDraft = useCallback((chatId) => {
    setMessageDrafts(prev => {
      const newMap = new Map(prev);
      newMap.delete(chatId);
      return newMap;
    });
  }, []);

  useEffect(() => {
    if (!isRehydrated) {
      return;
    }

    if (!token || !isAuthenticated) {
      console.log('❌ No token or not authenticated');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        eventListenersAttached.current = false;
        unreadCountsReceivedRef.current = false;
      }
      return;
    }

    if (socketRef.current) {
      return;
    }
    const socketInstance = io(import.meta.env.VITE_CHAT_API_BASE_URL || 'http://localhost:5004', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (!unreadCountsReceivedRef.current) {
        socketInstance.emit('request-unread-counts');
      }
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
      // Request updated counts after reconnection
      socketInstance.emit('request-unread-counts');
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      setIsConnected(false);
    });

    socketInstance.on('user-online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketInstance.on('user-offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    socketInstance.on('unread-counts', (data) => {      
      const newMap = new Map();
      const currentChatId = sessionStorage.getItem('currentChatId');
      
      Object.entries(data).forEach(([chatId, count]) => {
        // Don't add unread count for currently viewing chat
        if (chatId !== currentChatId && count > 0) {
          newMap.set(chatId, count);
        }
      });
      
      // CHANGED: Always update the map, don't merge with old data
      setUnreadChats(newMap);
      
      if (!isInitialized) {
        setIsInitialized(true);
      }
      
      unreadCountsReceivedRef.current = true;
      
      // IMPORTANT: Dispatch event so sidebar can update immediately
      window.dispatchEvent(new CustomEvent('unread-counts-updated', {
        detail: { counts: Object.fromEntries(newMap) }
      }));
    });
    if (!eventListenersAttached.current) {
      socketInstance.on('new-message-notification', (data) => {                
        const currentChatId = sessionStorage.getItem('currentChatId');
        const currentUserId = user?._id || user?.id;
        const isViewingThisSendersChat = currentChatId === data.chatId;
        
        setTimeout(() => {
          if (!isViewingThisSendersChat && !data.autoRead && isInitialized) {
            incrementUnreadCount(data.chatId);
            chatNotifications.show(data);
          } else if (isViewingThisSendersChat || data.autoRead) {
            setUnreadCount(data.chatId, 0);
          }
        }, 0);
        
        // IMPORTANT: Always dispatch event to update/add chat in list
        window.dispatchEvent(new CustomEvent('chat-message-received', {
          detail: {
            chatId: data.chatId,
            message: data.message,
            lastMessage: data.lastMessage,
            participant: data.participant,
            unreadCount: (isViewingThisSendersChat || data.autoRead) ? 0 : (data.unreadCount || 1),
            timestamp: data.timestamp || new Date(),
            isFirstMessage: data.isFirstMessage || false,
            autoRead: data.autoRead || false
          }
        }));
      });
      // FIXED: Add handler for chat-specific unread count updates
      socketInstance.on('chat-unread-update', (data) => {
        if (data.chatId && typeof data.unreadCount === 'number') {
          setTimeout(() => {
            setUnreadCount(data.chatId, data.unreadCount);
          }, 0);
          
          // Update the UI immediately
          window.dispatchEvent(new CustomEvent('chat-unread-update', {
            detail: { chatId: data.chatId, unreadCount: data.unreadCount }
          }));
        }
      });

      socketInstance.on('chat-list-update', (data) => {        
        window.dispatchEvent(new CustomEvent('chat-list-update', {
          detail: data
        }));
      });
      socketInstance.on('chat-deleted', (data) => {
        if (data.chatId) {
          // Remove from unread chats
          setTimeout(() => {
            setUnreadChats(prev => {
              const newMap = new Map(prev);
              newMap.delete(data.chatId);
              return newMap;
            });
          }, 0);
          
          // Notify UI
          window.dispatchEvent(new CustomEvent('chat-deleted-by-user', {
            detail: { chatId: data.chatId }
          }));
        }
      });
      eventListenersAttached.current = true;
    }
    setSocket(socketInstance);
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-message-notification');
        socketRef.current.off('chat-list-update');
        socketRef.current.off('user-online');
        socketRef.current.off('user-offline');
        socketRef.current.off('unread-counts');
        socketRef.current.off('messages-read');
        socketRef.current.off('chat-unread-update');
        socketRef.current.off('chat-deleted');
        socketRef.current.disconnect();
        socketRef.current = null;
        eventListenersAttached.current = false;
        unreadCountsReceivedRef.current = false;
      }
    };
  }, [token, isAuthenticated, isRehydrated, user, incrementUnreadCount, isInitialized]);
  // FIXED: Calculate total unread count
  const totalUnreadCount = Array.from(unreadChats.values()).reduce((sum, count) => sum + count, 0);
  const value = {
    socket,
    isConnected,
    onlineUsers,
    unreadChats,
    totalUnreadCount, // ADDED: Total unread count for sidebar
    markChatAsRead,
    incrementUnreadCount,
    setUnreadCount,
    initializeUnreadCounts,
    isInitialized,
    saveDraft,
    getDraft,
    clearDraft
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
