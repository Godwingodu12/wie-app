import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../context/SocketContext';
import { getUserChats } from '../../services/chatService';

const ChatInitializer = () => {
  const { user, token } = useSelector((state) => state.auth);
  const isAuthenticated = !!(token && user);
  const { initializeUnreadCounts, isInitialized } = useSocket();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initializeChats = async () => {
      if (hasInitialized.current || !user || !isAuthenticated || !initializeUnreadCounts || isInitialized) {
        return;
      }

      hasInitialized.current = true;

      try {
        const response = await getUserChats();
        const fetchedChats = response.chats || [];

        initializeUnreadCounts(fetchedChats);
      } catch (error) {
        hasInitialized.current = false;
      }
    };

    if (user && isAuthenticated && token) {
      const timer = setTimeout(() => {
        initializeChats();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, token, isInitialized, initializeUnreadCounts]);

  useEffect(() => {
    if (!user || !isAuthenticated || !token) {
      hasInitialized.current = false;
    }
  }, [user, isAuthenticated, token]);

  return null;
};
export default ChatInitializer;