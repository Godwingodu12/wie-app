import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
const ChatList = ({ chats, onSelectChat, isDark, selectedChatId }) => {
  const { unreadChats } = useSocket();
  const [localChats, setLocalChats] = useState(chats);
  useEffect(() => {
    setLocalChats(chats);
  }, [chats]);
  const theme = {
    text: isDark ? '#ffffff' : '#111827',
    subText: isDark ? '#c9c9cf' : '#6b7280',
    hover: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    selected: isDark ? 'rgba(114, 99, 243, 0.1)' : 'rgba(114, 99, 243, 0.1)'
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateMessage = (text, maxLength = 40) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (localChats.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p style={{ color: theme.subText }} className="text-center">
          No conversations yet.<br />Start a new chat to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      {localChats.map((chat) => {
        const isSelected = chat._id === selectedChatId;
        const contextUnreadCount = unreadChats.get(chat._id);
        const unreadCount = isSelected 
          ? 0 
          : (contextUnreadCount !== undefined ? contextUnreadCount : 0);
        const hasUnread = unreadCount > 0;
        
        return (
          <button
            key={chat._id}
            onClick={() => onSelectChat(chat)}
            className="w-full flex items-center gap-3 p-3 transition-colors cursor-pointer border-b"
            style={{
              backgroundColor: isSelected ? theme.selected : 'transparent',
              borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = theme.hover;
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                style={{ backgroundColor: '#7263F3' }}
              >
                {chat.participant?.image ? (
                  <img
                    src={chat.participant.image}
                    alt={chat.participant?.name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  (chat.participant?.name?.charAt(0) || '?').toUpperCase()
                )}
              </div>
              
              {hasUnread && (
                <div
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1 shadow-lg"
                  style={{ backgroundColor: '#7263F3' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-medium truncate"
                  style={{ color: theme.text }}
                >
                  {chat.participant?.name || 'Unknown User'}
                </span>
                {chat.lastMessage?.timestamp && (
                  <span
                    className="text-xs flex-shrink-0 ml-2"
                    style={{ color: theme.subText }}
                  >
                    {formatTime(chat.lastMessage.timestamp)}
                  </span>
                )}
              </div>
              {chat.lastMessage ? (
                <div className="flex items-center gap-1">
                  {chat.lastMessage.sender === chat.participant?._id ? null : (
                    <span style={{ color: theme.subText }}>You: </span>
                  )}
                  <span
                    className="text-sm truncate"
                    style={{
                      color: hasUnread ? theme.text : theme.subText,
                      fontWeight: hasUnread ? '500' : 'normal'
                    }}
                  >
                    {truncateMessage(chat.lastMessage.content)}
                  </span>
                </div>
              ) : (
                <span className="text-sm" style={{ color: theme.subText }}>
                  No messages yet
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
export default ChatList;
