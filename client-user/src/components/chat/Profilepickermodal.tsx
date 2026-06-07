'use client';

import React, { useState, useCallback } from 'react';
import { X, Search, Loader2, UserCheck } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/home/ThemeContext';
import { searchUsers } from '@/services/wieUserService';

interface ProfilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (profile: {
    profileUserId: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    is_verified: boolean;
  }) => void;
}

export default function ProfilePickerModal({ isOpen, onClose, onSend }: ProfilePickerModalProps) {
  const { themeStyles, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setIsSearching(true);
    try {
      const data = await searchUsers(q.trim());
      setResults(data?.users || data?.data || []);
    } catch { setResults([]); }
    finally { setIsSearching(false); }
  }, []);

  const handleSelect = (user: any) => {
    onSend({
      profileUserId: user._id || user.id,
      name:          user.name || '',
      username:      user.username || '',
      avatar:        user.profile_picture || null,
      bio:           user.bio || '',
      is_verified:   user.is_verified || false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4 pb-6">
      <div
        className="w-full max-w-md rounded-[20px] overflow-hidden shadow-2xl"
        style={{
          backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
          border: `0.5px solid ${themeStyles.border}`,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: themeStyles.border }}>
          <h3 className="text-[17px] font-semibold" style={{ color: themeStyles.text }}>Share Profile</h3>
          <button onClick={onClose} style={{ color: themeStyles.textSecondary }}><X size={20} /></button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 flex-shrink-0">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 pointer-events-none" style={{ color: themeStyles.textSecondary }} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search people…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5494FF]"
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : themeStyles.hoverBg,
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.text,
              }}
            />
            {isSearching && <Loader2 size={14} className="absolute right-3 animate-spin" style={{ color: themeStyles.textSecondary }} />}
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-3 pb-4">
          {results.length === 0 && query.length >= 2 && !isSearching && (
            <p className="text-center text-sm py-8" style={{ color: themeStyles.textSecondary }}>No users found</p>
          )}
          {results.length === 0 && query.length < 2 && (
            <p className="text-center text-sm py-8" style={{ color: themeStyles.textSecondary }}>Type to search users</p>
          )}
          {results.map((user: any) => (
            <button
              key={user._id || user.id}
              onClick={() => handleSelect(user)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
              style={{ ':hover': { backgroundColor: themeStyles.hoverBg } } as any}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = themeStyles.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                style={{ backgroundColor: themeStyles.hoverBg }}>
                {user.profile_picture ? (
                  <Image src={user.profile_picture} alt={user.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[14px] font-medium truncate" style={{ color: themeStyles.text }}>{user.name}</span>
                  {user.is_verified && (
                    <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                    </svg>
                  )}
                </div>
                <p className="text-[12px] truncate" style={{ color: themeStyles.textSecondary }}>@{user.username}</p>
              </div>
              <UserCheck size={16} className="text-[#5494FF] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}