import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { getChatMessages, sendMessage } from '../../services/chatService';
import ScrollBarStyle from '../ScrollBarStyle';
import { useSocket } from '../../context/SocketContext';
const ChatWindow = ({ chat, onBack, isDark }) => {
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [chatMessages, setChatMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { socket, isConnected } = useSocket();
  const darkTheme = {
  isDark: true,
  text: "text-white",
  mainBg: "#212426",
  cardBg: "rgba(33, 36, 38, 0.9)",
  insetBg: "rgba(30, 33, 35, 0.9)",
  shadowOutset: "7px 7px 14px #151515, -7px -7px 14px #2b2b2b",
  shadowInset: "inset 7px 7px 14px #151515, inset -7px -7px 14px #2b2b2b",
  textColor: "text-gray-300",
  arrowBgClass: "bg-gray-700",
  arrowColorClass: "text-white",
};
const lightTheme = {
  isDark: false,
  text: "text-gray-900",
  mainBg: "#e0e0e0",
  cardBg: "rgba(255, 255, 255, 0.9)",
  insetBg: "rgba(230, 230, 230, 0.9)",
  shadowOutset: "5px 5px 10px #c5c5c5, -5px -5px 10px #fbfbfb",
  shadowInset: "inset 5px 5px 10px #c5c5c5, inset -5px -5px 10px #fbfbfb",
  textColor: "text-gray-700",
  arrowBgClass: "bg-gray-800",
  arrowColorClass: "text-gray-200",
};
// Add this to the useEffect that handles socket connection
useEffect(() => {
  if (chat?._id) {
    fetchMessages();
    
    // Join chat room via socket - only if socket is available and connected
    if (socket && isConnected) {
      socket.emit('join-chat', chat._id);
      console.log('📥 Joined chat room:', chat._id);
      
      // Listen for join confirmation
      socket.once('joined-chat', (data) => {
        console.log('✅ Successfully joined chat:', data.chatId);
      });
    } else {
      console.warn('⚠️ Socket not available, cannot join chat room');
    }
  }

  // Cleanup: leave chat room on unmount
  return () => {
    if (socket && chat?._id) {
      socket.emit('leave-chat', chat._id);
      console.log('📤 Left chat room:', chat._id);
    }
  };
}, [chat?._id, socket, isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    const handleNewMessage = (data) => {
      console.log('📨 New message received:', data);
      
      if (data.chatId === chat?._id) {
        const transformedMessage = {
          ...data.message,
          isSender: data.sender === currentUserId
        };
        
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(msg => msg._id === transformedMessage._id);
          if (exists) return prev;
          return [...prev, transformedMessage];
        });
      }
    };

    // Listen for typing indicator
    const handleUserTyping = (data) => {
      if (data.chatId === chat?._id && data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
        
        // Auto-hide typing after 3 seconds
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    // Listen for read receipts
    const handleMessagesRead = (data) => {
      if (data.chatId === chat?._id && data.userId !== currentUserId) {
        setMessages(prev => 
          prev.map(msg => 
            data.messageIds.includes(msg._id) 
              ? { ...msg, isRead: true }
              : msg
          )
        );
      }
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('messages-read', handleMessagesRead);

    // Cleanup
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, isConnected, chat?._id, currentUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await getChatMessages(chat._id);
      console.log('📥 Fetched messages:', response);
      
      const fetchedMessages = response.messages || [];
      
      const transformedMessages = fetchedMessages.map(msg => ({
        ...msg,
        isSender: msg.sender?.toString() === currentUserId || msg.sender === currentUserId
      }));
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing', { chatId: chat._id, isTyping: true });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { chatId: chat._id, isTyping: false });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Stop typing indicator
    if (socket && isConnected) {
      socket.emit('typing', { chatId: chat._id, isTyping: false });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Optimistic update
    const optimisticMessage = {
      _id: Date.now().toString(),
      content: messageContent,
      sender: currentUserId,
      isSender: true,
      createdAt: new Date().toISOString(),
      isRead: false,
      pending: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await sendMessage(chat._id, messageContent);
      
      // Remove optimistic message and let socket event add the real one
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      
      // Restore message in input
      setNewMessage(messageContent);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const theme = {
    bg: isDark ? '#212426' : '#ffffff',
    cardBg: isDark ? '#232426' : '#f9fafb',
    text: isDark ? '#ffffff' : '#111827',
    subText: isDark ? '#c9c9cf' : '#6b7280',
    border: isDark ? '#23233a' : '#e5e7eb',
    inputBg: isDark ? '#2a2b2d' : '#f3f4f6',
    senderBubble: '#7263F3',
    receiverBubble: isDark ? '#2a2b2d' : '#e5e7eb'
  };

  if (!chat) return null;

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto">
      <ScrollBarStyle
        isDark={darkTheme.isDark}
        key={darkTheme.isDark ? "dark" : "light"}
      />
      {/* Header */}
      <div 
        className="flex items-center gap-3 p-4 border-b"
        style={{ borderColor: theme.border }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative"
          style={{ backgroundColor: '#7263F3' }}
        >
          {chat.participant?.image ? (
            <img 
              src={chat.participant.image} 
              alt={chat.participant.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            chat.participant?.name?.charAt(0).toUpperCase()
          )}
          
          {/* Online indicator (you can integrate with socket later) */}
          {isConnected && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div className="flex-1">
          <div className="font-medium" style={{ color: theme.text }}>
            {chat.participant?.name}
          </div>
          <div className="text-xs" style={{ color: theme.subText }}>
            {isTyping ? 'typing...' : chat.participant?.email}
          </div>
        </div>

        {/* Connection status indicator */}
        {!isConnected && (
          <div className="text-xs text-orange-500">
            Reconnecting...
          </div>
        )}

        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <MoreVertical size={20} style={{ color: theme.text }} />
        </button>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: theme.cardBg }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div 
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#7263F3', borderTopColor: 'transparent' }}
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p style={{ color: theme.subText }}>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isSender = message.isSender;
              const showTimestamp = index === 0 || 
                new Date(messages[index - 1].createdAt || messages[index - 1].timestamp).toDateString() !== 
                new Date(message.createdAt || message.timestamp).toDateString();

              return (
                <div key={message._id || index}>
                  {showTimestamp && (
                    <div className="flex justify-center my-4">
                      <span 
                        className="text-xs px-3 py-1 rounded-full"
                        style={{ 
                          backgroundColor: theme.inputBg,
                          color: theme.subText 
                        }}
                      >
                        {new Date(message.createdAt || message.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.pending ? 'opacity-60' : ''}`}
                      style={{
                        backgroundColor: isSender ? theme.senderBubble : theme.receiverBubble,
                        color: isSender ? '#ffffff' : theme.text
                      }}
                    >
                      <p className="break-words">{message.content}</p>
                      <div 
                        className="text-xs mt-1 flex items-center gap-1 justify-end"
                        style={{ 
                          color: isSender ? 'rgba(255,255,255,0.7)' : theme.subText 
                        }}
                      >
                        {new Date(message.createdAt || message.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {isSender && !message.pending && (
                          <span className="ml-1">{message.isRead ? '✓✓' : '✓'}</span>
                        )}
                        {message.pending && (
                          <span className="ml-1">⏳</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 border-t"
        style={{ borderColor: theme.border }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={
              !isConnected 
                ? "Reconnecting..." 
                : "Type a message..."
            }
            disabled={sending || !isConnected}
            className="flex-1 px-4 py-3 rounded-full outline-none transition-colors"
            style={{
              backgroundColor: theme.inputBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              opacity: !isConnected ? 0.6 : 1
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !isConnected}
            className="p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#7263F3' }}
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} color="white" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ChatWindow;
