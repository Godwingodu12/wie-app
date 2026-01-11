'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import socketService from '@/services/socketService';
import { Chat, ChatMessage, UnreadCounts } from '@/types/chat';
import { getWieChatMessages } from '@/services/chatService';
interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  unreadCounts: UnreadCounts;
  isSocketConnected: boolean;
  typingUsers: { [chatId: string]: boolean }; 
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateChatList: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  setMessages: (messagesOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setChats: (chats: Chat[]) => void;
  updateUnreadCount: (chatId: string, count: number) => void;
  acceptRequest: (chatId: string) => Promise<void>;
  declineRequest: (chatId: string) => Promise<void>;
  getTotalUnreadCount: () => number; 
  loadChatById: (chatId: string) => Promise<Chat | null>;

}
const ChatContext = createContext<ChatContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CHATS: 'wie_chats',
  CURRENT_CHAT: 'wie_current_chat'
};

const loadFromStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const saveToStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silent fail
  }
};
const parseVoiceMessage = (message: any): ChatMessage => {
  // ✅ If already has voiceData and messageType is voice, return as is
  if (message.messageType === 'voice' && message.voiceData) {
    return message;
  }
  
  // ✅ If content is a JSON string with voice data
  if (message.content?.startsWith('{') && message.content.includes('"type":"voice"')) {
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.type === 'voice' && parsed.audio && parsed.duration) {
        return {
          ...message,
          messageType: 'voice',
          voiceData: {
            audioBase64: parsed.audio,
            duration: parsed.duration,
            mimeType: parsed.mimeType || 'audio/webm;codecs=opus'
          },
          content: '🎤 Voice message'
        };
      }
    } catch (e) {
      console.error('Failed to parse voice message:', e);
    }
  }
  
  return message;
};
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const authState = useSelector((state: RootState) => state?.auth) || { token: null, user: null };
  const token = authState.token;
  const user = authState.user;
  
  const [internalChats, setInternalChats] = useState<Chat[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.CHATS);
    return (stored && Array.isArray(stored)) ? stored : [];
  });
  
  const [internalCurrentChat, setInternalCurrentChat] = useState<Chat | null>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.CURRENT_CHAT);
    return (stored && stored._id) ? stored : null;
  });
  
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: boolean }>({}); 
  const updateUnreadCount = useCallback((chatId: string, count: number) => {        
        setUnreadCounts((prev) => {
          const updated = {
            ...prev,
            [chatId]: count,
          };
          
          if (typeof window !== 'undefined') {
            const totalUnread = (Object.values(updated) as number[]).reduce((sum: number, count: number) => sum + count, 0);
            
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('unread-count-changed', { 
                detail: { 
                  chatId, 
                  unreadCount: count,
                  totalUnread 
                } 
              }));
            }, 0);
          }
          return updated;
        });
        
        // Update chat list
        setInternalChats((prev) => {
          const updated = prev.map((chat) =>
            chat._id === chatId
              ? { ...chat, unreadCount: count }
              : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
      }, []);
const loadChatById = useCallback(async (chatId: string) => {
  // ✅ Check if already current chat
  if (internalCurrentChat?._id === chatId) {
    return internalCurrentChat;
  }

  try {
    // ✅ First check in existing chats
    const existingChat = internalChats.find(c => c._id === chatId);
    
    if (existingChat) {
      setInternalCurrentChat(existingChat);
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, existingChat);
      
      // ✅ Reset unread count for this chat
      if (existingChat.unreadCount > 0) {
        updateUnreadCount(chatId, 0);
      }
      
      return existingChat;
    }
    const response = await getWieChatMessages(chatId);
    if (response.success && response.chat) {
      const chat: Chat = {
        _id: response.chat._id,
        participant: response.chat.participant,
        type: response.chat.type || 'direct',
        status: response.chat.status || 'accepted',
        lastMessage: response.chat.lastMessage,
        unreadCount: 0,
        updatedAt: response.chat.updatedAt || new Date().toISOString(),
        isBlocked: response.chat.isBlocked,
        isBlockedBy: response.chat.isBlockedBy
      };
      
      setInternalCurrentChat(chat);
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, chat);
      
      // ✅ Add to chats list if not already there
      setInternalChats((prev) => {
        const exists = prev.find(c => c._id === chatId);
        if (!exists) {
          const newChats = [chat, ...prev];
          saveToStorage(STORAGE_KEYS.CHATS, newChats);
          return newChats;
        }
        return prev;
      });
      
      return chat;
    }
    
    console.warn('⚠️ No chat data returned from server');
    return null;
  } catch (error) {
    console.error('❌ Failed to load chat by ID:', error);
    return null;
  }
}, [internalCurrentChat, internalChats, updateUnreadCount]);
  const setChats = useCallback((chats: Chat[]) => {
    setInternalChats(chats);
    saveToStorage(STORAGE_KEYS.CHATS, chats);
  }, []);

  const setCurrentChat = useCallback((chat: Chat | null) => {
    setInternalCurrentChat(chat);
    if (chat) {
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, chat);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
      }
    }
  }, []);
  const addMessage = useCallback((message: ChatMessage) => {
    // ✅ Parse voice message if needed
    const parsedMessage = parseVoiceMessage(message);
    
    setInternalMessages((prev) => {
      const exists = prev.some((m) => m._id === parsedMessage._id);
      if (exists) return prev;
      return [...prev, parsedMessage];
    });
  }, []);
  const setMessages = useCallback((messagesOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    setInternalMessages(messagesOrUpdater);
  }, []);

  const updateChatList = useCallback((updatedChat: Chat) => {    
    setInternalChats((prev) => {
      const exists = prev.find((c) => c._id === updatedChat._id);
      let newChats: Chat[];
      
      if (!updatedChat.lastMessage) {
        if (exists) {
          newChats = prev.filter((c) => c._id !== updatedChat._id);
        } else {
          return prev;
        }
      } else {
        if (exists) {
          newChats = prev.map((c) =>
            c._id === updatedChat._id
              ? { ...c, ...updatedChat }
              : c
          ).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        } else {
          newChats = [updatedChat, ...prev].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
      }
      
      saveToStorage(STORAGE_KEYS.CHATS, newChats);
      return newChats;
    });
    
    setInternalCurrentChat((prev) => {
      if (prev && prev._id === updatedChat._id) {
        const updated = { ...prev, ...updatedChat };
        saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
        return updated;
      }
      return prev;
    });
  }, []);

  const removeChat = useCallback((chatId: string) => {
    setInternalChats((prev) => {
      const newChats = prev.filter((c) => c._id !== chatId);
      saveToStorage(STORAGE_KEYS.CHATS, newChats);
      return newChats;
    });
  }, []);

      const acceptRequest = useCallback(async (chatId: string) => {
        try {
          setInternalChats((prev) =>
            prev.map((c) =>
              c._id === chatId
                ? { ...c, status: 'accepted' as const, type: 'direct' as const }
                : c
            )
          );
          setInternalCurrentChat((prev) => {
            if (prev && prev._id === chatId) {
              const updated: Chat = { 
                ...prev, 
                status: 'accepted' as const, 
                type: 'direct' as const 
              };
              saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
              return updated;
            }
            return prev;
          });
        } catch (error) {
          console.error('Failed to update chat after accept:', error);
        }
      }, []);
      const declineRequest = useCallback(async (chatId: string) => {
        removeChat(chatId);
        if (internalCurrentChat?._id === chatId) {
          setCurrentChat(null);
        }
      }, [internalCurrentChat, removeChat, setCurrentChat]);
      const getTotalUnreadCount = () => {
        let uniqueUsersWithUnread = 0;
        for (const chatId in unreadCounts) {
          if (unreadCounts[chatId] > 0) {
            uniqueUsersWithUnread++;
          }
        }  
        return uniqueUsersWithUnread;
      };
      const getTotalUnreadMessages = () => {
        return (Object.values(unreadCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
      };
    useEffect(() => {
      if (!token || !user) return;
      const socket = socketService.connect(token);
      const handleConnect = () => {
        setIsSocketConnected(true);        
        // Request fresh unread counts from server
        if (socket.connected) {
          socket.emit('get-unread-counts');
        }
        
        // Test event listener
        socket.emit('test-event');
      };
      const handleDisconnect = () => setIsSocketConnected(false);
      const handleUnreadCounts = (counts: UnreadCounts) => setUnreadCounts(counts);
      const handleNewMessageNotification = (data: any) => {
          if (!data.participant?._id || !data.lastMessage?.content) return;
        
        const chatType = (data.type === 'direct' || data.type === 'request') 
          ? data.type 
          : 'direct' as const;
        
        const chatStatus = (data.status === 'pending' || data.status === 'accepted' || data.status === 'declined')
          ? data.status
          : 'accepted' as const;
        const isCurrentChatOpen = internalCurrentChat?._id === data.chatId;
        const messageSender = data.message?.sender || data.lastMessage?.sender;
        const isOwnMessage = messageSender === user?.id;
        if (isCurrentChatOpen && !isOwnMessage && data.message) {
          let newMessage: ChatMessage = {  // ✅ Changed from const to let
            _id: data.message._id,
            sender: data.message.sender,
            content: data.message.content || data.lastMessage?.content,
            messageType: data.message.messageType || 'text',
            voiceData: data.message.voiceData || null,
            timestamp: data.message.timestamp || new Date().toISOString(),
            createdAt: data.message.timestamp || new Date().toISOString(),
            readBy: data.message.readBy || [],
            deliveredTo: data.message.deliveredTo || [],
            isRead: data.message.isRead || false,
            isSender: false
          };
          // ✅ Parse voice message if needed
          newMessage = parseVoiceMessage(newMessage);
          addMessage(newMessage);
        }
        setInternalChats((prev) => {
          const existingChat = prev.find(c => c._id === data.chatId);
          // ✅ Use unread count from backend (it already calculated correctly)
          const newUnreadCount = data.unreadCount ?? 0;
          const existingParticipant = existingChat?.participant;
          const updatedChat: Chat = {
            _id: data.chatId,
            participant: {
              _id: data.participant._id,
              name: data.participant.name || existingParticipant?.name || 'Unknown',
              username: data.participant.username || existingParticipant?.username || '',
              contact_no: data.participant.contact_no || existingParticipant?.contact_no || '',
              email: data.participant.email || existingParticipant?.email || '',
              profile_picture: data.participant.profile_picture ?? existingParticipant?.profile_picture ?? null,
              bio: data.participant.bio || existingParticipant?.bio || '',
              is_verified: data.participant.is_verified ?? existingParticipant?.is_verified ?? false,
              isOnline: data.participant.isOnline ?? false,
              lastSeen: data.participant.last_seen_at || data.participant.lastSeen,
              last_seen_at: data.participant.last_seen_at
            },
            lastMessage: data.lastMessage,
            unreadCount: newUnreadCount,
            type: chatType,
            status: chatStatus,
            updatedAt: data.timestamp || new Date().toISOString(),
            isBlocked: existingChat?.isBlocked,
            isBlockedBy: existingChat?.isBlockedBy
          };
          
          let newChats: Chat[];

          if (!updatedChat.participant) {
            console.warn('⚠️ No participant data, skipping chat update');
            return prev;
          }

          if (existingChat) {
            newChats = prev.map((c) =>
              c._id === updatedChat._id ? updatedChat : c
            ).sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          } else {
            newChats = [updatedChat, ...prev].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          }
          
          saveToStorage(STORAGE_KEYS.CHATS, newChats);
          return newChats;
        });
        
        // ✅ Update unreadCounts state with backend's calculated count
        setUnreadCounts((prev) => {
          const newCount = data.unreadCount ?? 0;
          const updated = {
            ...prev,
            [data.chatId]: newCount
          };
          
          if (typeof window !== 'undefined') {
            const totalUnread = (Object.values(updated) as number[]).reduce((sum: number, c: number) => sum + c, 0);
            // Dispatch event
            window.dispatchEvent(new CustomEvent('unread-count-changed', { 
              detail: { 
                chatId: data.chatId, 
                unreadCount: newCount,
                totalUnread 
              } 
            }));
          }
          
          return updated;
        });
        
        // ✅ Update current chat if open
        setInternalCurrentChat((prev) => {
          if (prev && prev._id === data.chatId && prev.participant) {
            const updated: Chat = { 
              _id: prev._id,
              lastMessage: data.lastMessage,
              participant: {
                _id: prev.participant._id,
                name: prev.participant.name,
                username: prev.participant.username,
                contact_no: prev.participant.contact_no,
                email: prev.participant.email,
                profile_picture: prev.participant.profile_picture,
                bio: prev.participant.bio,
                is_verified: prev.participant.is_verified,
                isOnline: data.participant.isOnline ?? false,
                lastSeen: data.participant.last_seen_at || data.participant.lastSeen || prev.participant.lastSeen,
                last_seen_at: data.participant.last_seen_at
              },
              unreadCount: 0, // Current chat always 0
              type: prev.type,
              status: prev.status,
              updatedAt: data.timestamp || new Date().toISOString(),
              isBlocked: prev.isBlocked,
              isBlockedBy: prev.isBlockedBy
            };
            
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleChatListUpdate = (data: any) => {
        if (!data.participant?._id || !data.lastMessage?.content) return;
        handleNewMessageNotification(data);
      };
      const handleMessagesRead = (data: any) => {
        setUnreadCounts((prev) => {
          const updated = {
            ...prev,
            [data.chatId]: 0
          };          
          if (typeof window !== 'undefined') {
            const totalUnread = (Object.values(updated) as number[]).reduce((sum: number, count: number) => sum + count, 0);
            
            // Dispatch immediately
            window.dispatchEvent(new CustomEvent('unread-count-changed', { 
              detail: { 
                chatId: data.chatId, 
                unreadCount: 0,
                totalUnread 
              } 
            }));
            
            // Dispatch again after delay
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('unread-count-changed', { 
                detail: { 
                  chatId: data.chatId, 
                  unreadCount: 0,
                  totalUnread 
                } 
              }));
            }, 100);
          }
          
          return updated;
        });
        
        // Update chat list
        setInternalChats((prev) => {
          const updated = prev.map((c) =>
            c._id === data.chatId
              ? { ...c, unreadCount: 0 }
              : c
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        // Update messages if viewing this chat
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          setInternalMessages((prev) =>
            prev.map((msg) => {
              if (data.messageIds.includes(msg._id)) {
                const currentReadBy = msg.readBy || [];
                const combinedReadBy = [...currentReadBy, data.readBy];
                const uniqueReadBy = Array.from(new Set(combinedReadBy));
                
                return { 
                  ...msg, 
                  readBy: uniqueReadBy, 
                  isRead: true 
                };
              }
              return msg;
            })
          );
        }
      };
      const handleMessageDeleted = (data: any) => {
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          setInternalMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
        }
      };
      const handleChatDeleted = (data: any) => {
        setInternalChats((prev) => {
          const newChats = prev.filter((c) => c._id !== data.chatId);
          saveToStorage(STORAGE_KEYS.CHATS, newChats);
          return newChats;
        });
        
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          setInternalCurrentChat(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
          }
        }
      };
      const handleChatCleared = (data: any) => {
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          setInternalMessages([]);
        }
      };
      const handleUserStatusChange = (data: { userId: string; isOnline: boolean; lastSeen?: string; last_seen_at?: string }) => {
        // ✅ Update chats list
        setInternalChats((prev) => {
          const chatToUpdate = prev.find(chat => chat.participant?._id === data.userId);
          const updated = prev.map((chat) => {
            if (chat.participant && chat.participant._id === data.userId) {
              return {
                ...chat,
                participant: {
                  ...chat.participant,
                  isOnline: data.isOnline,
                  lastSeen: data.last_seen_at || data.lastSeen || chat.participant.lastSeen,
                  last_seen_at: data.last_seen_at,
                },
              };
            }
            return chat;
          });
          
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        setInternalCurrentChat((prev) => {
          if (prev && prev.participant && prev.participant._id === data.userId) {
            const updated = {
              ...prev,
              participant: {
                ...prev.participant,
                isOnline: data.isOnline,
                lastSeen: data.last_seen_at || data.lastSeen || prev.participant.lastSeen,
                last_seen_at: data.last_seen_at,
              },
            };
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleUserTyping = (data: { userId: string; chatId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [data.chatId]: data.isTyping
        }));

        // Auto-clear typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers((prev) => ({
              ...prev,
              [data.chatId]: false
            }));
          }, 3000);
        }
      };
      const handleMarkReadConfirmation = (data: { chatId: string; messageIds: string[] }) => {      
        // Update local messages
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          setInternalMessages((prev) =>
            prev.map((msg) =>
              data.messageIds.includes(msg._id)
                ? { ...msg, readBy: [...(msg.readBy || []), user?.id || user?.id].filter((v, i, a) => a.indexOf(v) === i), isRead: true }
                : msg
            )
          );
        }
      };
      const handleLocalChatRead = (event: CustomEvent) => {
        const { chatId } = event.detail;
        if (chatId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: 0
          }));
        }
      };
      const handleNewMessage = (data: any) => {
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          let newMessage: ChatMessage = {
            _id: data.message._id,
            sender: data.message.sender,
            content: data.message.content,
            messageType: data.message.messageType || 'text',
            voiceData: data.message.voiceData || null,
            timestamp: data.message.timestamp || data.message.createdAt,
            createdAt: data.message.createdAt || data.message.timestamp,
            readBy: data.message.readBy || [],
            deliveredTo: data.message.deliveredTo || [],
            isRead: data.message.isRead || false,
            isSender: data.message.sender === user?.id
          };
          // ✅ Parse voice message if needed
          newMessage = parseVoiceMessage(newMessage);

          setInternalMessages((prev) => {
            const exists = prev.some((m) => m._id === newMessage._id);
            if (exists) {
              return prev;
            }
            return [...prev, newMessage];
          });
        } else {
          console.log('ℹ️ Message not for current chat, skipping add to messages');
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener('chat-read' as any, handleLocalChatRead as any);
      }
      const handleUserBlockedYou = (data: { blockerId: string; blockerName?: string; chatIds: string[]; timestamp: string }) => {  
        // Update chats to mark them as blocked
        setInternalChats((prev) => {
          const updated = prev.map((chat) => 
            data.chatIds.includes(chat._id)
              ? { 
                  ...chat, 
                  isBlocked: true,
                  isBlockedBy: 'them' as const,
                  blockerId: data.blockerId // ✅ Store who blocked
                }
              : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });

        // Update current chat if it's one of the blocked chats
        setInternalCurrentChat((prev) => {
          if (prev && data.chatIds.includes(prev._id)) {
            const updated = { 
              ...prev, 
              isBlocked: true,
              isBlockedBy: 'them' as const,
              blockerId: data.blockerId // ✅ Store who blocked
            };
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleYouBlockedUser = (data: { blockedId: string; chatIds: string[]; timestamp: string }) => {  
        // Mark chats as blocked by you
        setInternalChats((prev) => {
          const updated = prev.map((chat) => 
            data.chatIds.includes(chat._id)
              ? { 
                  ...chat, 
                  isBlocked: true,
                  isBlockedBy: 'you' as const,
                  blockedId: data.blockedId // ✅ Store who you blocked
                }
              : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });

        setInternalCurrentChat((prev) => {
          if (prev && data.chatIds.includes(prev._id)) {
            const updated = { 
              ...prev, 
              isBlocked: true,
              isBlockedBy: 'you' as const,
              blockedId: data.blockedId // ✅ Store who you blocked
            };
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleUserUnblockedYou = (data: { unblockerId: string; chatIds: string[]; timestamp: string }) => {
        // When unblocked, restore chat to normal state
        setInternalChats((prev) => {
          const updated = prev.map((chat) => 
            data.chatIds.includes(chat._id)
              ? { ...chat, isBlocked: false, isBlockedBy: undefined }
              : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        setInternalCurrentChat((prev) => {
          if (prev && data.chatIds.includes(prev._id)) {
            const updated = { ...prev, isBlocked: false, isBlockedBy: undefined };
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleYouUnblockedUser = (data: { unblockedId: string; chatIds: string[]; timestamp: string }) => {
        setInternalChats((prev) => {
          const updated = prev.map((chat) => 
            data.chatIds.includes(chat._id)
              ? { ...chat, isBlocked: false, isBlockedBy: undefined } // ✅ Clear isBlockedBy
              : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        setInternalCurrentChat((prev) => {
          if (prev && data.chatIds.includes(prev._id)) {
            const updated = { ...prev, isBlocked: false, isBlockedBy: undefined }; // ✅ Clear isBlockedBy
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleChatUnreadUpdate = (data: { chatId: string; unreadCount: number }) => {        
        // ✅ CRITICAL: Update unreadCounts state first
        setUnreadCounts((prev) => {
          const updated = {
            ...prev,
            [data.chatId]: data.unreadCount
          };
          
          if (typeof window !== 'undefined') {
            const totalUnread = (Object.values(updated) as number[]).reduce((sum: number, count: number) => sum + count, 0);            
            // Dispatch multiple times to ensure UI catches it
            const dispatchEvent = () => {
              window.dispatchEvent(new CustomEvent('unread-count-changed', { 
                detail: { 
                  chatId: data.chatId, 
                  unreadCount: data.unreadCount,
                  totalUnread 
                } 
              }));
            };
            
            // Dispatch immediately
            dispatchEvent();
            
            // Dispatch again after small delays
            setTimeout(dispatchEvent, 50);
            setTimeout(dispatchEvent, 150);
          }
          
          return updated;
        });
        
        // ✅ Update chat list
        setInternalChats((prev) => {
          const updated = prev.map((chat) =>
            chat._id === data.chatId
              ? { ...chat, unreadCount: data.unreadCount }
              : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        // ✅ Force re-render of ChatList by updating render key
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-chatlist-rerender'));
        }
      };
      socket.on('user-status-change', handleUserStatusChange);
      socket.on('user-typing', handleUserTyping); 
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('unread-counts', handleUnreadCounts);
      socket.on('new-message', handleNewMessage);
      socket.on('new-message-notification', handleNewMessageNotification);
      socket.on('chat-list-update', handleChatListUpdate);
      socket.on('messages-read', handleMessagesRead);
      socket.on('message-deleted', handleMessageDeleted);
      socket.on('chat-deleted', handleChatDeleted);
      socket.on('chat-cleared', handleChatCleared);
      socket.on('user-blocked-you', handleUserBlockedYou);
      socket.on('you-blocked-user', handleYouBlockedUser);
      socket.on('user-unblocked-you', handleUserUnblockedYou);
      socket.on('you-unblocked-user', handleYouUnblockedUser);
      socket.on('chat-unread-update', handleChatUnreadUpdate);
      socket.on('mark-read-confirmation', handleMarkReadConfirmation);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('unread-counts', handleUnreadCounts);
        socket.off('new-message', handleNewMessage);
        socket.off('new-message-notification', handleNewMessageNotification);
        socket.off('chat-list-update', handleChatListUpdate);
        socket.off('messages-read', handleMessagesRead);
        socket.off('message-deleted', handleMessageDeleted);
        socket.off('chat-deleted', handleChatDeleted);
        socket.off('chat-cleared', handleChatCleared);
        socket.off('user-status-change', handleUserStatusChange);
        socket.off('user-typing', handleUserTyping);
        socket.off('user-blocked-you', handleUserBlockedYou);
        socket.off('you-blocked-user', handleYouBlockedUser);
        socket.off('user-unblocked-you', handleUserUnblockedYou);
        socket.off('you-unblocked-user', handleYouUnblockedUser);
        socket.off('chat-unread-update', handleChatUnreadUpdate);
        socket.off('mark-read-confirmation', handleMarkReadConfirmation);
        if (typeof window !== 'undefined') {
          window.removeEventListener('chat-read' as any, handleLocalChatRead as any);
        }
      };
    }, [token, user, internalCurrentChat?._id]); 
  return (
    <ChatContext.Provider
      value={{
        chats: internalChats,
        currentChat: internalCurrentChat,
        messages: internalMessages,
        unreadCounts,
        isSocketConnected,
        typingUsers, 
        setCurrentChat,
        addMessage,
        updateChatList,
        removeChat,
        setMessages,
        setChats,
        updateUnreadCount,
        acceptRequest,
        declineRequest,
        getTotalUnreadCount,
        loadChatById
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    return {
      chats: [],
      currentChat: null,
      messages: [],
      unreadCounts: {},
      isSocketConnected: false,
      typingUsers: {}, 
      setCurrentChat: () => {},
      addMessage: () => {},
      updateChatList: () => {},
      removeChat: () => {},
      setMessages: () => {},
      setChats: () => {},
      updateUnreadCount: () => {},
      acceptRequest: async () => {},
      declineRequest: async () => {},
      getTotalUnreadCount: () => 0,
      loadChatById: async () => null,
    };
  }
  return context;
};
