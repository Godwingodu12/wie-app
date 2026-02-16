'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Chat, MessageRequest } from '@/types/chat';
import { getMessageRequests } from '@/services/chatService';
import Image from 'next/image';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';
import messageIcon from '@/assets/chat/messageIcon.png';
import { useChat } from '@/context/ChatContext';

interface RequestsTabProps {
  searchQuery: string;
  onChatSelect: (chat: Chat) => void;
  currentChatId?: string;
  imageErrors: Set<string>;
  onImageError: (chatId: string) => void;
}

export default function RequestsTab({
  searchQuery,
  onChatSelect,
  currentChatId,
  imageErrors,
  onImageError,
}: RequestsTabProps) {
  const { themeStyles, isDark } = useTheme();
  const { requestCounts, updateRequestCount, clearRequestCount } = useChat();
  const [requests, setRequests] = useState<Chat[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const response = await getMessageRequests();
      if (response.success && response.requests) {
        const mappedRequests: Chat[] = response.requests.map((req: MessageRequest) => {
          const apiUnreadCount = req.unreadCount || 0;
          
          return {
            _id: req._id,
            participant: req.participant,
            lastMessage: req.lastMessage,
            unreadCount: apiUnreadCount,
            type: 'request',
            status: 'pending',
            updatedAt: req.lastMessage?.timestamp || new Date().toISOString()
          };
        });
        
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Failed to fetch requests', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ Sync with context
  const requestCountsRef = useRef<{ [key: string]: number }>({});
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      const hasChanges = Object.keys(requestCounts).some(
        chatId => requestCounts[chatId] !== requestCountsRef.current[chatId]
      ) || Object.keys(requestCountsRef.current).some(
        chatId => requestCounts[chatId] !== requestCountsRef.current[chatId]
      );
      
      if (!hasChanges) return;
      
      requestCountsRef.current = { ...requestCounts };
      
      setRequests(prev => {
        const updated = prev.map(r => {
          if (r._id in requestCounts) {
            const newCount = requestCounts[r._id];
            return { ...r, unreadCount: newCount };
          }
          return r;
        });
        
        return updated;
      });
    }, 100);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [requestCounts]);

  // ✅ Handle window events
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleRequestCountChanged = (event: CustomEvent) => {
      const { chatId, count } = event.detail;
      
      if (count === 0) {
        setRequests(prev => {
          const updated = prev.map(r => {
            if (r._id === chatId) {
              return { ...r, unreadCount: 0 };
            }
            return r;
          });
          
          return [...updated];
        });
        return;
      }
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        setRequests(prev => {
          const updated = prev.map(r => {
            if (r._id === chatId) {
              return { ...r, unreadCount: count };
            }
            return r;
          });
          
          return [...updated];
        });
      }, 50);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('request-count-changed' as any, handleRequestCountChanged as any);
    }

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('request-count-changed' as any, handleRequestCountChanged as any);
      }
    };
  }, []);

  // ✅ Handle new requests
  useEffect(() => {
    const handleNewRequest = (event: CustomEvent) => {
      const { chat } = event.detail;
      
      if (chat && chat.status === 'pending') {
        setRequests(prev => {
          const exists = prev.find(r => r._id === chat._id);
          let updated;
          
          if (exists) {
            // ✅ Update existing request - including last message
            updated = prev.map(r => {
              if (r._id === chat._id) {
                return {
                  ...r,
                  lastMessage: chat.lastMessage || r.lastMessage, // ✅ Update last message
                  unreadCount: (r.unreadCount || 0) + 1,
                  updatedAt: chat.lastMessage?.timestamp || new Date().toISOString()
                };
              }
              return r;
            });
            
            updateRequestCount(chat._id, (exists.unreadCount || 0) + 1);
          } else {
            // Add new request
            updated = [{ ...chat, unreadCount: 1 }, ...prev];
            updateRequestCount(chat._id, 1);
          }
          
          // ✅ Sort by updatedAt to show latest on top
          return updated.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
      }
    };

    const handleRequestAccepted = () => {
      fetchRequests();
    };

    const handleRequestDeclined = (event: CustomEvent) => {
      const { chatId } = event.detail;
      setRequests(prev => {
        const updated = prev.filter(r => r._id !== chatId);
        clearRequestCount(chatId);
        return updated;
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('new-message-request' as any, handleNewRequest as any);
      window.addEventListener('request-accepted' as any, handleRequestAccepted);
      window.addEventListener('request-declined' as any, handleRequestDeclined as any);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('new-message-request' as any, handleNewRequest as any);
        window.removeEventListener('request-accepted' as any, handleRequestAccepted);
        window.removeEventListener('request-declined' as any, handleRequestDeclined as any);
      }
    };
  }, [requestCounts, updateRequestCount, clearRequestCount]);
  // ✅ Listen for chat list updates to update last message
  useEffect(() => {
    const handleChatListUpdate = (event: CustomEvent) => {
      const data = event.detail;
      
      // Only handle if this is a request chat
      if (data.type === 'request' && data.status === 'pending') {
        setRequests(prev => {
          const exists = prev.find(r => r._id === data.chatId);
          
          if (exists) {
            // Update existing request with new last message
            const updated = prev.map(r => {
              if (r._id === data.chatId) {
                return {
                  ...r,
                  lastMessage: data.lastMessage,
                  unreadCount: data.unreadCount !== undefined ? data.unreadCount : r.unreadCount,
                  updatedAt: data.timestamp || data.lastMessage?.timestamp || new Date().toISOString()
                };
              }
              return r;
            });
            
            // Sort by updatedAt to show latest on top
            return updated.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          }
          
          return prev;
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('chat-list-update' as any, handleChatListUpdate as any);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('chat-list-update' as any, handleChatListUpdate as any);
      }
    };
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(chat => {
      const searchLower = searchQuery.toLowerCase().trim();
      return searchLower === '' ||
        chat.participant?.name?.toLowerCase().includes(searchLower) ||
        chat.participant?.username?.toLowerCase().includes(searchLower);
    });
  }, [requests, searchQuery]);

  if (isLoadingRequests) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#5494FF]" size={32} />
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full" style={{ color: themeStyles.textSecondary }}>
        <Image
          src={messageIcon}
          alt="No requests"
          width={48}
          height={48}
          className="mb-4 opacity-50"
        />
        <p className="text-sm">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {filteredRequests.map((chat) => {
        const isActive = currentChatId === chat._id;
        const requestKey = `${chat._id}-${chat.unreadCount}`;
        const hasProfilePicture = chat.participant?.profile_picture && !imageErrors.has(chat._id);
        const unreadCount = chat.unreadCount || 0;
        const hasUnread = unreadCount > 0;

        return (
          <div
            key={requestKey} 
            onClick={() => onChatSelect(chat)}
            className="w-full p-3 flex items-center gap-3 transition-all cursor-pointer"
            style={{
              borderBottom: `1px solid ${themeStyles.border}`,
              backgroundColor: isActive
                ? (isDark ? 'rgba(56, 56, 56, 0.4)' : themeStyles.hoverBg)
                : 'transparent'
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full overflow-hidden"
                style={{ backgroundColor: isDark ? '#374151' : '#D1D5DB' }}
              >
                {hasProfilePicture ? (
                  <Image
                    src={chat.participant!.profile_picture!}
                    alt={chat.participant!.name}
                    fill
                    className="object-cover rounded-full"
                    onError={() => onImageError(chat._id)}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-lg font-bold uppercase"
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  >
                    {chat.participant?.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 mr-2">
              <div className="flex justify-between items-start mb-1">
                <h3
                  className="font-medium text-[16px] truncate"
                  style={{ 
                    color: hasUnread ? themeStyles.text : themeStyles.textSecondary,
                    fontWeight: hasUnread ? 600 : 400
                  }}
                >
                  {chat.participant?.name || 'Unknown'}
                </h3>
              </div>

              <div className="flex items-center text-sm text-gray-500 truncate">
                <p
                  className="truncate max-w-[180px]"
                  style={{ 
                    color: hasUnread ? themeStyles.text : themeStyles.textSecondary, 
                    fontWeight: hasUnread ? 500 : 400 
                  }}
                >
                  {chat.lastMessage?.content || 'Sent you a message'}
                </p>

                <span className={`text-[11px] whitespace-nowrap ml-2 font-medium ${hasUnread ? 'text-blue-400' : 'text-gray-400'}`}>
                  {chat.lastMessage?.timestamp ? format(new Date(chat.lastMessage.timestamp), 'h:mm a') : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {hasUnread && (
                <span className="min-w-[20px] h-[20px] px-1.5 bg-[#BDD5FF] text-black text-[11px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}