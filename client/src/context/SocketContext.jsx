import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

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
  const socketRef = useRef(null);
  const [isRehydrated, setIsRehydrated] = useState(false);
  
  // Get token and user from Redux store
  const { token, user } = useSelector((state) => state.auth);
  const isAuthenticated = !!(token && user);

  // Wait for Redux persist to rehydrate
  useEffect(() => {
    const checkRehydration = () => {
      const persistRoot = localStorage.getItem('persist:root');
      if (persistRoot) {
        setIsRehydrated(true);
        console.log('✅ Redux store rehydrated');
      }
    };
    
    // Check immediately
    checkRehydration();
    
    // Also check after a short delay
    const timer = setTimeout(checkRehydration, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for rehydration before attempting socket connection
    if (!isRehydrated) {
      console.log('⏳ Waiting for Redux rehydration...');
      return;
    }

    // Only initialize socket if we have a token and user is authenticated
    if (!token || !isAuthenticated) {
      console.warn('⚠️ No token found or user not authenticated, socket connection skipped');
      console.log('Token:', token ? 'exists' : 'missing', '| Authenticated:', isAuthenticated, '| User:', user ? 'exists' : 'missing');
      
      if (socketRef.current) {
        console.log('🔌 Disconnecting existing socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current) {
      console.log('✅ Socket already initialized');
      return;
    }

    console.log('🔌 Initializing socket connection with token...');

    // Initialize socket connection
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

    // Connection events
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after all attempts');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    // User status events
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

    setSocket(socketInstance);

    // Cleanup on unmount or token change
    return () => {
      console.log('🔌 Cleaning up socket connection...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [token, isAuthenticated, isRehydrated, user]);

  const value = {
    socket,
    isConnected,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};