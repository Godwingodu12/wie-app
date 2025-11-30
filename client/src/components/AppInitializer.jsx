import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { getUserChats } from '../services/chatService';

const AppInitializer = () => {
  const { user, token } = useSelector((state) => state.auth);
  const { initializeUnreadCounts, isInitialized, socket, isConnected } = useSocket();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initializeApp = async () => {
      if (!user || !token) {
        hasInitialized.current = false;
        return;
      }

      // Wait for socket connection
      if (!socket || !isConnected) {
        return;
      }

      // Don't re-initialize if already done
      if (hasInitialized.current) {
        return;
      }
      
      hasInitialized.current = true;

      try {
        // Fetch chats from API
        const response = await getUserChats();
        const fetchedChats = response.chats || [];
        
        // Initialize unread counts
        if (initializeUnreadCounts && !isInitialized) {
          initializeUnreadCounts(fetchedChats);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        hasInitialized.current = false;
      }
    };

    initializeApp();
  }, [user, token, socket, isConnected, initializeUnreadCounts, isInitialized]);
  // Reset on logout
  useEffect(() => {
    if (!user || !token) {
      hasInitialized.current = false;
    }
  }, [user, token]);

  return null;
};
export default AppInitializer;