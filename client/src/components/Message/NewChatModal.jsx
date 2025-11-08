import React, { useState, useEffect } from 'react';
import { X, Search, Users } from 'lucide-react';
import {getChatSuggestions, searchUsersForChat} from '../../services/chatService';
const NewChatModal = ({ isOpen, onClose, isDark, onSelectUser }) => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'suggestions') {
      fetchSuggestions();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Import your auth service
      const response = await getChatSuggestions();
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearchLoading(true);
    try {
      const response = await searchUsersForChat(searchQuery);
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    onSelectUser(user);
    onClose();
  };

  if (!isOpen) return null;

  const theme = {
    bg: isDark ? '#212426' : '#ffffff',
    cardBg: isDark ? '#232426' : '#f9fafb',
    text: isDark ? '#ffffff' : '#111827',
    subText: isDark ? '#c9c9cf' : '#6b7280',
    border: isDark ? '#23233a' : '#e5e7eb',
    inputBg: isDark ? '#2a2b2d' : '#f3f4f6'
  };

  const users = activeTab === 'suggestions' ? suggestions : searchResults;
  const isLoading = activeTab === 'suggestions' ? loading : searchLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl"
        style={{ backgroundColor: theme.bg }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.border }}>
          <h2 className="text-xl font-bold" style={{ color: theme.text }}>
            New Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} style={{ color: theme.text }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setActiveTab('suggestions')}
            className="flex-1 px-4 py-3 font-medium transition-colors relative"
            style={{ 
              color: activeTab === 'suggestions' ? '#7263F3' : theme.subText 
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={18} />
              Followers
            </div>
            {activeTab === 'suggestions' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: '#7263F3' }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className="flex-1 px-4 py-3 font-medium transition-colors relative"
            style={{ 
              color: activeTab === 'search' ? '#7263F3' : theme.subText 
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Search size={18} />
              Search
            </div>
            {activeTab === 'search' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: '#7263F3' }}
              />
            )}
          </button>
        </div>

        {/* Search Input (only in search tab) */}
        {activeTab === 'search' && (
          <div className="p-4">
            <div className="relative">
              <Search 
                size={18} 
                className="absolute left-3 top-1/2 -translate-y-1/2" 
                style={{ color: theme.subText }}
              />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-colors"
                style={{
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`
                }}
              />
            </div>
          </div>
        )}

        {/* User List */}
        <div className="max-h-96 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div 
                className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: '#7263F3', borderTopColor: 'transparent' }}
              />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: theme.subText }}>
                {activeTab === 'suggestions' 
                  ? 'No followers found' 
                  : searchQuery 
                    ? 'No users found' 
                    : 'Start typing to search users'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: '#7263F3' }}
                  >
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium" style={{ color: theme.text }}>
                      {user.name}
                    </div>
                    <div className="text-sm" style={{ color: theme.subText }}>
                      {user.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default NewChatModal;