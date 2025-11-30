import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
import { getChatMessages, sendMessage, clearChatMessages, deleteMessage,deleteChat,clearAndDeleteChat  } from '../../services/chatService';
import ScrollBarStyle from '../ScrollBarStyle';
import { useSocket } from '../../context/SocketContext';
const ChatWindow = ({ chat, onBack, isDark }) => {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const [messages, setMessages] = useState([]);
  const { socket, isConnected, markChatAsRead, onlineUsers, getDraft, saveDraft, clearDraft } = useSocket();
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isUserTypingRef = useRef(false);
  const lastScrollPositionRef = useRef(0);
  const fetchAttemptRef = useRef(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const optionsMenuRef = useRef(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
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

  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 50;
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      lastScrollPositionRef.current = messagesContainerRef.current.scrollTop;
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (chat?._id) {
      const draft = getDraft(chat._id);
      setNewMessage(draft);
      
      // Reset error and fetch messages
      setFetchError(null);
      fetchAttemptRef.current = 0;
      fetchMessages();
      
      if (socket && isConnected) {
        socket.emit('join-chat', chat._id);
        socket.once('joined-chat', (data) => {
        });
      }
    }

    return () => {
      if (socket && chat?._id) {
        socket.emit('leave-chat', chat._id);
      }
    };
  }, [chat?._id, socket, isConnected, getDraft]);

  useEffect(() => {
    if (!socket || !isConnected || !chat?._id) {
      return;
    }
    const handleNewMessage = (data) => {
      if (data.chatId === chat._id) {
        const transformedMessage = {
          ...data.message,
          _id: data.message._id.toString(), // ENSURE STRING ID
          isSender: data.sender === currentUserId || data.message.sender === currentUserId,
          pending: false
        };
        
        const wasAtBottom = checkIfAtBottom();
        
        setMessages(prev => {
          // IMPROVED: Check by string ID
          const messageId = transformedMessage._id.toString();
          
          // Check if real message already exists
          const existsById = prev.some(msg => {
            const existingId = msg._id.toString();
            return existingId === messageId && !existingId.startsWith('temp-');
          });
          
          if (existsById) {
            return prev;
          }
          
          // Remove optimistic message if this is sender's message
          if (transformedMessage.isSender) {
            // Remove any temp message with same content from last 5 seconds
            const filtered = prev.filter(msg => {
              if (!msg._id.toString().startsWith('temp-')) return true;
              if (msg.content !== transformedMessage.content) return true;
              if (msg.sender !== currentUserId) return true;
              
              const msgTime = new Date(msg.timestamp).getTime();
              const now = new Date().getTime();
              return (now - msgTime) > 5000; // Keep if older than 5 seconds
            });
            
            return [...filtered, transformedMessage];
          }
          
          // For receiver's message, just add
          return [...prev, transformedMessage];
        });

        if (transformedMessage.isSender || wasAtBottom) {
          setTimeout(() => scrollToBottom(), 100);
        }
        
        if (markChatAsRead && !transformedMessage.isSender) {
          const atBottom = checkIfAtBottom();
          
          if (atBottom && document.hasFocus()) {
            markChatAsRead(chat._id);
            
            if (socket && isConnected) {
              setTimeout(() => {
                socket.emit('mark-read', {
                  chatId: data.chatId,
                  messageIds: [transformedMessage._id]
                });
              }, 300);
            }
          }
        }
      }
    };
    const handleUserTyping = (data) => {
      if (data.chatId === chat._id && data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    const handleMessagesRead = (data) => {
      if (data.chatId === chat._id) {
        setMessages(prev => 
          prev.map(msg => {
            if (data.messageIds.includes(msg._id)) {
              return { 
                ...msg, 
                isRead: true, 
                readBy: [...new Set([...(msg.readBy || []), data.readBy])]
              };
            }
            return msg;
          })
        );
      }
    };
    const handleChatCleared = (data) => {
      if (data.chatId === chat._id) {
        setMessages([]);
      }
    };
    const handleMessageDeleted = (data) => {
      if (data.chatId === chat._id) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
      }
    };
    const handleChatDeleted = (data) => {
      if (data.chatId === chat._id) {
        // Chat was deleted, go back to list
        window.dispatchEvent(new CustomEvent('chat-deleted-by-user', {
          detail: { chatId: data.chatId }
        }));
        
        if (onBack) {
          onBack();
        }
      }
    };
    const handleMessageSentConfirmation = (data) => {
      if (data.chatId === chat._id && data.message) {
        setMessages(prev => {
          // Remove optimistic message and add confirmed one
          const withoutOptimistic = prev.filter(msg => !msg.pending);
          
          // Check if already exists
          const exists = withoutOptimistic.some(msg => msg._id === data.message._id);
          
          if (!exists) {
            return [...withoutOptimistic, {
              ...data.message,
              isSender: true,
              pending: false
            }];
          }
          
          return withoutOptimistic;
        });
      }
    };
    socket.on('chat-deleted', handleChatDeleted);
    socket.on('chat-cleared', handleChatCleared);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('messages-read', handleMessagesRead);
    socket.on('message-sent-confirmation', handleMessageSentConfirmation);
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('messages-read', handleMessagesRead);
      socket.off('message-sent-confirmation', handleMessageSentConfirmation);
      socket.off('chat-cleared', handleChatCleared);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('chat-deleted', handleChatDeleted);
    };
  }, [socket, isConnected, chat?._id, currentUserId, markChatAsRead]);

  useEffect(() => {
    if (!chat?._id || !markChatAsRead) return;

    sessionStorage.setItem('currentChatId', chat._id);

    const clearUnread = () => markChatAsRead(chat._id);
    clearUnread();
    setTimeout(clearUnread, 0);
    setTimeout(clearUnread, 100);
    setTimeout(clearUnread, 200);
    setTimeout(clearUnread, 500);

    window.dispatchEvent(new CustomEvent('chat-opened', {
      detail: { chatId: chat._id }
    }));

    return () => {
      sessionStorage.removeItem('currentChatId');
    };
  }, [chat?._id, markChatAsRead]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsMenu]);
  const fetchMessages = async () => {
    if (!chat?._id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const response = await getChatMessages(chat._id);    
      const fetchedMessages = response.messages || [];      
      const transformedMessages = fetchedMessages.map(msg => ({
        ...msg,
        isSender: msg.sender?.toString() === currentUserId || msg.sender === currentUserId
      }));
      
      setMessages(transformedMessages);
      fetchAttemptRef.current = 0; // Reset on success
      
      if (markChatAsRead) {
        markChatAsRead(chat._id);
      }

      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      
      // Don't clear existing messages on error
      setFetchError(error.response?.data?.message || 'Failed to load messages');
      
      // Retry logic
      fetchAttemptRef.current++;
      if (fetchAttemptRef.current < 3) {
        setTimeout(() => {
          fetchMessages();
        }, fetchAttemptRef.current * 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing', { chatId: chat._id, isTyping: true });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { chatId: chat._id, isTyping: false });
      }, 2000);
    }
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    const messageContent = newMessage.trim();
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setNewMessage('');
    clearDraft(chat._id);
    setSending(true);
    isUserTypingRef.current = false;
    
    if (socket && isConnected) {
      socket.emit('typing', { chatId: chat._id, isTyping: false });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    const optimisticMessage = {
      _id: tempId,
      content: messageContent,
      sender: currentUserId,
      isSender: true,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isRead: false,
      pending: true,
      deliveredTo: []
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom(), 50);

    try {
      const response = await sendMessage(chat._id, messageContent);
      const realMessageId = response.message._id.toString();
      
      // CHANGED: Use ref to track if socket message arrived
      const socketMessageArrived = messagesRef.current?.some(msg => 
        msg._id.toString() === realMessageId && !msg.pending
      );
      
      if (socketMessageArrived) {
        // Socket message already arrived, just remove optimistic
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
      } else {
        // Socket message not arrived yet, replace optimistic with API response
        setMessages(prev => prev.map(msg => 
          msg._id === tempId 
            ? { ...response.message, _id: realMessageId, isSender: true, pending: false }
            : msg
        ));
      }
      
      setTimeout(() => scrollToBottom(), 50);
      
      window.dispatchEvent(new CustomEvent('chat-list-update', {
        detail: {
          chatId: chat._id,
          lastMessage: {
            content: messageContent,
            sender: currentUserId,
            timestamp: new Date()
          },
          unreadCount: 0,
          participant: chat.participant,
          updatedAt: new Date(),
          isFirstMessage: false
        }
      }));
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      setNewMessage(messageContent);
      saveDraft(chat._id, messageContent);
      alert('Failed to send message. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };
  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages? This will only clear the chat for you.')) {
      return;
    }
    
    try {
      await clearChatMessages(chat._id);
      setMessages([]);
      setShowOptionsMenu(false);
      
      // Update chat list to remove last message
      window.dispatchEvent(new CustomEvent('chat-list-update', {
        detail: {
          chatId: chat._id,
          lastMessage: null,
          unreadCount: 0,
          participant: chat.participant,
          updatedAt: new Date()
        }
      }));
      
      alert('Chat cleared successfully (only for you)');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      alert('Failed to clear chat. Please try again.');
    }
  };
  const handleDeleteChat = async () => {
    try {
      await deleteChat(chat._id);
      setShowOptionsMenu(false);
      
      // Notify parent to remove from list and go back
      window.dispatchEvent(new CustomEvent('chat-deleted-by-user', {
        detail: { chatId: chat._id }
      }));
      
      // Go back to chat list
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };
  const handleClearAndDeleteChat = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this chat? All messages will be deleted from the database for both participants. This action cannot be undone.')) {
      return;
    }
    try {
      await clearAndDeleteChat(chat._id);
      setShowOptionsMenu(false);
      window.dispatchEvent(new CustomEvent('chat-deleted-by-user', {
        detail: { chatId: chat._id }
      }));
      // Go back to chat list
      if (onBack) {
        onBack();
      }
    } catch (error) {
      alert('Failed to delete chat. Please try again.');
    }
  };
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) {
      return;
    }
    
    try {
      await deleteMessage(chat._id, messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setMessageToDelete(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };
  const handleMessageChange = (e) => {
    const value = e.target.value;
    isUserTypingRef.current = true;
    setNewMessage(value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      saveDraft(chat._id, value);
    }, 300);
    
    handleTyping();
  };
  const getMessageStatus = (message) => {
    if (message.pending) return '⏳';
    if (!isConnected) return '✓';
    
    const receiverId = chat.participant?._id || chat.participant?.id;
    const isDelivered = message.deliveredTo?.includes(receiverId);
    const isRead = message.isRead || message.readBy?.some(id => id.toString() === receiverId);
    if (isRead) {
      return <span style={{ color: '#d4d1e7ff', fontSize: '11px' }}>Seen</span>;
    }
    if (isDelivered || isConnected) return '✓✓';
    return '✓';
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
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ScrollBarStyle
        isDark={darkTheme.isDark}
        key={darkTheme.isDark ? "dark" : "light"}
      />
      
      <div 
        className="flex items-center gap-3 p-4 border-b flex-shrink-0"
        style={{ borderColor: theme.border }}
      >
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
        
        <button
          onClick={() => {
            const participantId = chat.participant?._id || chat.participant?.id;
            if (participantId) {
              navigate(`/profile/${participantId}`);
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold relative hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
          style={{ backgroundColor: '#7263F3' }}
          title={`View ${chat.participant?.name}'s profile`}
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
          {isConnected && onlineUsers?.has(chat.participant?._id || chat.participant?.id) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => {
              const participantId = chat.participant?._id || chat.participant?.id;
              if (participantId) {
                navigate(`/profile/${participantId}`);
              }
            }}
            className="font-medium hover:underline cursor-pointer text-left truncate w-full"
            style={{ color: theme.text }}
            title={`View ${chat.participant?.name}'s profile`}
          >
            {chat.participant?.name}
          </button>
          <div className="text-xs flex items-center gap-2 truncate" style={{ color: theme.subText }}>
            {isTyping ? (
              <div className="flex items-center gap-1">
                <span>typing</span>
                <span className="flex gap-0.5">
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </span>
              </div>
            ) : (
              <span className="truncate">{chat.participant?.email}</span>
            )}
          </div>
        </div>

        {!isConnected && (
          <div className="text-xs text-orange-500 flex-shrink-0">
            Reconnecting...
          </div>
        )}

        <div className="relative" ref={optionsMenuRef}>
          <button 
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <MoreVertical size={20} style={{ color: theme.text }} />
          </button>

          {showOptionsMenu && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 border"
              style={{
                backgroundColor: theme.bg,
                borderColor: theme.border
              }}
            >
              <button
                onClick={handleClearChat}
                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 rounded-t-lg"
                style={{ color: '#ef4444' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Chat
              </button>
              <button
                onClick={handleDeleteChat}
                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 rounded-lg"
                style={{ color: '#ef4444' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Chat
              </button>
              <button
                onClick={handleClearAndDeleteChat}
                className="w-full px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 rounded-lg"
                style={{ color: '#ef4444' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <div>
                  <div className="font-medium">Clear & Delete</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowOptionsMenu(false);
                  // Add more options here if needed
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-b-lg"
                style={{ color: theme.text }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ backgroundColor: theme.cardBg }}
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div 
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#7263F3', borderTopColor: 'transparent' }}
            />
          </div>
        ) : fetchError && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p style={{ color: theme.subText }}>
              {fetchError}
            </p>
            <button
              onClick={() => fetchMessages()}
              className="px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: '#7263F3' }}
            >
              Retry
            </button>
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
                  
                  <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} group`}>
                    <div className="flex items-end gap-2">
                      {/* ADDED: Delete button for sender's messages */}
                      {isSender && (
                        <button
                          onClick={() => handleDeleteMessage(message._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 mb-2"
                          title="Delete message"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      
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
                          {isSender && (
                            <span className="ml-1">{getMessageStatus(message)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {isTyping && (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex gap-1">
              <span 
                className="w-2 h-2 rounded-full animate-bounce" 
                style={{ 
                  backgroundColor: theme.subText,
                  animationDelay: '0ms',
                  animationDuration: '1.4s'
                }}
              />
              <span 
                className="w-2 h-2 rounded-full animate-bounce" 
                style={{ 
                  backgroundColor: theme.subText,
                  animationDelay: '200ms',
                  animationDuration: '1.4s'
                }}
              />
              <span 
                className="w-2 h-2 rounded-full animate-bounce" 
                style={{ 
                  backgroundColor: theme.subText,
                  animationDelay: '400ms',
                  animationDuration: '1.4s'
                }}
              />
            </div>
            <span style={{ color: theme.subText, fontSize: '12px' }}>
              {chat.participant?.name?.split(' ')[0]} is typing...
            </span>
          </div>
        )}
      </div>

      <form 
        onSubmit={handleSendMessage}
        className="p-4 border-t flex-shrink-0"
        style={{ borderColor: theme.border }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleMessageChange}
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
            className="p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
