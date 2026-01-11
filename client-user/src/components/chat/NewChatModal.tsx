'use client';

import { useState, useEffect } from 'react';
import { X, Search, Loader2, MessageCircle, Users, Globe } from 'lucide-react';
import { searchUsers } from '@/services/wieUserService';
import { getWieChatSuggestions, createOrGetWieChat } from '@/services/chatService';
import { ChatUser } from '@/types/chat';
import Image from 'next/image';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string, chat: any) => void;
}

type TabType = 'followers' | 'all';

export default function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('followers');
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<ChatUser[]>([]);
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadFollowers();
      setError(null);
      setSearchQuery('');
      setSearchResults([]);
      setImageErrors(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'all' && searchQuery.trim().length > 0) {
      const timer = setTimeout(() => {
        searchAllUsers(searchQuery);
      }, 500);
      return () => clearTimeout(timer);
    } else if (activeTab === 'all') {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const filteredFollowers = searchQuery.trim().length > 0
    ? followers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : followers;

  const loadFollowers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWieChatSuggestions();
      if (response.success) {
        setFollowers(response.suggestions || []);
      } else {
        setError('Failed to load followers');
      }
    } catch (error) {
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  const searchAllUsers = async (query: string) => {
    setSearching(true);
    setError(null);
    try {
      const response = await searchUsers(query, 1, 50);
      
      if (response.success && response.users) {
        // Transform users to ChatUser format
        const transformedUsers: ChatUser[] = response.users.map((user: any) => ({
          _id: user.id,
          name: user.name || 'Unknown',
          username: user.username || '',
          email: user.email || '',
          contact_no: user.contact_no || '',
          profile_picture: user.profile_picture || undefined,
          bio: user.bio || undefined,
          is_verified: user.is_verified || false
        }));
        
        setSearchResults(transformedUsers);
      } else {
        setError('Search failed');
      }
    } catch (error) {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };
  const handleCreateChat = async (userId: string) => {
    setCreating(userId);
    setError(null);
    try {
      const response = await createOrGetWieChat(userId);
      
      if (response.success && response.chat) {
        onClose();
        setSearchQuery('');
        setCreating(null);
        
        // Pass the chat object to parent
        onChatCreated(response.chat._id, response.chat);
      } else {
        // This shouldn't happen, but handle it gracefully
        setError('Failed to create chat');
        setCreating(null);
      }
    } catch (error: any) {
      console.error('❌ Failed to create chat:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to create chat';
      
      if (error.response?.status === 403) {
        errorMessage = error.response?.data?.message || 'Cannot create chat with this user';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setCreating(null);
    }
  };
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleImageError = (userId: string) => {
    setImageErrors(prev => new Set(prev).add(userId));
  };

  const displayUsers = activeTab === 'followers' ? filteredFollowers : searchResults;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-[#2D2F39]">
        <div className="flex items-center justify-between p-5 border-b border-[#2D2F39]">
          <h2 className="text-xl font-semibold text-white">New Message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2D2F39] rounded-full transition text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-[#2D2F39] bg-[#0C1014]">
          <button
            onClick={() => handleTabChange('followers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'followers'
                ? 'text-white border-b-2 border-[#8860D9]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users size={18} />
            Followers
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'text-white border-b-2 border-[#8860D9]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe size={18} />
            All Users
          </button>
        </div>

        <div className="p-4 border-b border-[#2D2F39]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder={activeTab === 'followers' ? 'Search followers...' : 'Search all users...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0C1014] border border-[#2D2F39] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8860D9] text-white placeholder-gray-500"
            />
            {(searching && activeTab === 'all') && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin text-[#8860D9]" size={20} />
            )}
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-[#8860D9]" size={32} />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <MessageCircle size={48} className="mb-3 text-[#8860D9]" />
              {activeTab === 'followers' ? (
                <>
                  <p className="text-white">
                    {searchQuery ? 'No followers found' : 'No followers yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? 'Try a different search' : 'Follow users to start chatting'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white">
                    {searchQuery ? 'No users found' : 'Search for users'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? 'Try a different search term' : 'Type a name or email to search'}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#2D2F39]">
              {displayUsers.map((user) => {
                const hasProfilePicture = user.profile_picture && 
                                         !imageErrors.has(user._id) && 
                                         typeof user.profile_picture === 'string';
                
                return (
                  <div
                    key={user._id}
                    className="p-4 hover:bg-[#2D2F39] transition flex items-center gap-3"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#2D2F39] flex-shrink-0">
                      {hasProfilePicture ? (
                        <Image
                          src={user.profile_picture!}
                          alt={user.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                          priority={false}
                          onError={() => handleImageError(user._id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{user.name}</p>
                        {user.is_verified && (
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                          </svg>
                        )}
                      </div>
                      {user.username && (
                        <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleCreateChat(user._id)}
                      disabled={creating === user._id}
                      className="px-4 py-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 flex-shrink-0"
                    >
                      {creating === user._id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <MessageCircle size={16} />
                      )}
                      <span className="text-sm font-medium">
                        {creating === user._id ? 'Opening...' : 'Message'}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
