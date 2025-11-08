import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical } from 'lucide-react';
import {getChatMessages, sendMessage} from '../../services/chatService';

const ChatWindow = ({ chat, onBack, isDark, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat?._id) {
      fetchMessages();
    }
  }, [chat?._id]);

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
      
      // Fix: Access messages from the correct path
      const fetchedMessages = response.messages || [];
      
      // Transform messages to include isSender flag
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update - add message immediately
    const optimisticMessage = {
      _id: Date.now().toString(),
      content: messageContent,
      sender: currentUserId,
      isSender: true,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await sendMessage(chat._id, messageContent);
      
      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg._id === optimisticMessage._id 
            ? {
                ...response.message,
                isSender: true
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      
      // Restore message in input
      setNewMessage(messageContent);
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
    <div className="flex flex-col h-full">
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
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
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
        </div>

        <div className="flex-1">
          <div className="font-medium" style={{ color: theme.text }}>
            {chat.participant?.name}
          </div>
          <div className="text-xs" style={{ color: theme.subText }}>
            {chat.participant?.email}
          </div>
        </div>

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
                      className="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl"
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
                        {isSender && message.isRead && (
                          <span className="ml-1">✓✓</span>
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
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-full outline-none transition-colors"
            style={{
              backgroundColor: theme.inputBg,
              color: theme.text,
              border: `1px solid ${theme.border}`
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
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