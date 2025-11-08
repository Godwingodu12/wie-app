import React from 'react';

const ChatList = ({ chats, onSelectChat, isDark, selectedChatId }) => {
  const theme = {
    text: isDark ? '#ffffff' : '#111827',
    subText: isDark ? '#c9c9cf' : '#6b7280',
    hover: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    selected: isDark ? 'rgba(114, 99, 243, 0.1)' : 'rgba(114, 99, 243, 0.1)'
  };

  const formatTime = (timestamp) => {
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

  if (chats.length === 0) {
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
      {chats.map((chat) => {
        const isSelected = chat._id === selectedChatId;
        
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
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
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
              
              {/* Unread badge */}
              {chat.unreadCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: '#7263F3' }}
                >
                  {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                </div>
              )}
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <span
                  className="font-medium truncate"
                  style={{ color: theme.text }}
                >
                  {chat.participant?.name}
                </span>
                {chat.lastMessage && (
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
                  {chat.lastMessage.isSender && (
                    <span style={{ color: theme.subText }}>You: </span>
                  )}
                  <span
                    className="text-sm truncate"
                    style={{
                      color: chat.unreadCount > 0 ? theme.text : theme.subText,
                      fontWeight: chat.unreadCount > 0 ? '500' : 'normal'
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