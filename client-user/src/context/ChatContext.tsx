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
  requestCounts: { [chatId: string]: number };
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (message: ChatMessage) => void;
  replaceMessage: (tempId: string, msg: any) => void;
  removeMessage:  (tempId: string) => void;
  updateChatList: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  setMessages: (messagesOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setChats: (chats: Chat[] | ((prev: Chat[]) => Chat[])) => void;
  updateUnreadCount: (chatId: string, count: number) => void;
  updateRequestCount: (chatId: string, count: number) => void; 
  clearRequestCount: (chatId: string) => void; 
  getTotalRequestCount: () => number; 
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
  const [requestCounts, setRequestCounts] = useState<{ [chatId: string]: number }>({});
  const [requestChats, setRequestChats] = useState<Chat[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: boolean }>({}); 
  const updateUnreadCount = useCallback((chatId: string, count: number) => {        
    setUnreadCounts((prev) => {
      const updated = {
        ...prev,
        [chatId]: count,
      };
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

  const updateRequestCount = useCallback((chatId: string, count: number) => {
    setRequestCounts(prev => {
      if (count > 0) {
        return { ...prev, [chatId]: count };
      } else {
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      }
    });
  }, []);

  const clearRequestCount = useCallback((chatId: string) => {
    setRequestCounts(prev => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
    
    // ✅ Dispatch ONCE with a flag to prevent re-dispatch
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('request-count-changed', {
        detail: { chatId, count: 0, source: 'clearRequestCount' }
      });
      window.dispatchEvent(event);
    }
  }, []);

  const getTotalRequestCount = useCallback(() => {
    return Object.keys(requestCounts).length;
  }, [requestCounts]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const totalUnread = (Object.values(unreadCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
      
      window.dispatchEvent(new CustomEvent('unread-count-changed', { 
        detail: { 
          totalUnread 
        } 
      }));
    }
  }, [unreadCounts]);

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
      return null;
    } catch (error) {
      return null;
    }
  }, [internalCurrentChat, internalChats, updateUnreadCount]);

  const setChats = useCallback((chatsOrUpdater: Chat[] | ((prev: Chat[]) => Chat[])) => {
    if (typeof chatsOrUpdater === 'function') {
      setInternalChats((prev) => {
        const updated = chatsOrUpdater(prev);
        saveToStorage(STORAGE_KEYS.CHATS, updated);
        return updated;
      });
    } else {
      setInternalChats(chatsOrUpdater);
      saveToStorage(STORAGE_KEYS.CHATS, chatsOrUpdater);
    }
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
    const parsedMessage = parseVoiceMessage(message);
    
    setInternalMessages((prev) => {
      const exists = prev.some((m) => m._id === parsedMessage._id);
      if (exists) return prev;
      return [...prev, parsedMessage];
    });
  }, []);
  const replaceMessage = (tempId: string, realMsg: any) => {
    setMessages(prev =>
      prev.map(m => (m._id === tempId || m._id?.toString() === tempId)
        ? { ...realMsg }           
        : m
      )
    );
  };

  const removeMessage = (tempId: string) => {
    setMessages(prev => prev.filter(m => m._id !== tempId && m._id?.toString() !== tempId));
  };
  
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
          newChats = prev.map((c) => {
            if (c._id === updatedChat._id) {
              return {
                ...c,
                ...updatedChat,
                type: updatedChat.type || c.type || 'direct',
                status: updatedChat.status || c.status || 'accepted'
              };
            }
            return c;
          }).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        } else {
          const newChat: Chat = {
            _id: updatedChat._id,
            participant: updatedChat.participant,
            lastMessage: updatedChat.lastMessage,
            unreadCount: 0,
            type: updatedChat.type || 'direct',
            status: updatedChat.status || 'accepted',
            updatedAt: updatedChat.updatedAt || new Date().toISOString(),
            isBlocked: updatedChat.isBlocked,
            isBlockedBy: updatedChat.isBlockedBy
          };
                    
          newChats = [newChat, ...prev].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('new-chat-added', {
                detail: { chatId: newChat._id, chat: newChat }
              }));
            }, 50);
          }
        }
      }
      
      saveToStorage(STORAGE_KEYS.CHATS, newChats);
      return newChats;
    });
    
    setInternalCurrentChat((prev) => {
      if (prev && prev._id === updatedChat._id) {
        const updated = { 
          ...prev, 
          ...updatedChat,
          type: updatedChat.type || prev.type || 'direct',
          status: updatedChat.status || prev.status || 'accepted'
        };
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
      // ✅ CRITICAL: Immediately clear request count
      clearRequestCount(chatId);
      
      // Dispatch event immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('request-count-changed', {
          detail: { chatId, count: 0 }
        }));
      }

      setInternalChats((prev) => {
        const updated = prev.map((c) =>
          c._id === chatId
            ? { 
                ...c, 
                status: 'accepted' as const, 
                type: 'direct' as const,
                unreadCount: 0
              }
            : c
        );
        saveToStorage(STORAGE_KEYS.CHATS, updated);
        return updated;
      });
      
      setInternalCurrentChat((prev) => {
        if (prev && prev._id === chatId) {
          const updated: Chat = { 
            ...prev, 
            status: 'accepted' as const, 
            type: 'direct' as const,
            unreadCount: 0
          };
          saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
          
          // ✅ Dispatch event to notify UI
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('request-accepted', { 
                detail: { chatId } 
              }));
            }, 100);
          }
          
          return updated;
        }
        return prev;
      });

      // ✅ Clear unread count
      updateUnreadCount(chatId, 0);

    } catch (error) {
      console.error('Failed to update chat after accept:', error);
    }
  }, [clearRequestCount, updateUnreadCount]);

  const declineRequest = useCallback(async (chatId: string) => {
    setInternalChats((prev) => {
      const newChats = prev.filter(c => c._id !== chatId);
      saveToStorage(STORAGE_KEYS.CHATS, newChats);
      return newChats;
    });
    setInternalCurrentChat((prev) => {
      if (prev?._id === chatId) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
        }
        return null;
      }
      return prev;
    });
    // ✅ Clear unread count
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
    // ✅ Dispatch event to update request count
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('request-declined', {
          detail: { chatId }
        }));
      }, 100);
    }
  }, []);

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

        // ✅ Check if this update is for the sender (comes from backend with isSender flag)
        const isSenderUpdate = data.isSender === true;
        const chatType = (data.type === 'direct' || data.type === 'request') 
          ? data.type 
          : 'direct' as const;

        const chatStatus = (data.status === 'pending' || data.status === 'accepted' || data.status === 'declined')
          ? data.status
          : 'accepted' as const;

        const isCurrentChatOpen = internalCurrentChat?._id === data.chatId;
        const messageSender = data.message?.sender || data.lastMessage?.sender;
        const isOwnMessage = messageSender === user?.id;

        // ✅ Handle message in current chat window
        if (isCurrentChatOpen && !isOwnMessage && data.message) {
          const rawNotif = data.message;
          let newMessage: ChatMessage = {
            _id: rawNotif._id,
            sender: rawNotif.sender,
            content: rawNotif.content || data.lastMessage?.content,
            messageType: rawNotif.messageType || 'text',
            voiceData: rawNotif.voiceData ?? undefined,
            chat_images:  rawNotif.chat_images  ?? undefined,
            chat_videos:  rawNotif.chat_videos  ?? undefined,
            chat_audio:   rawNotif.chat_audio   ?? undefined,
            chat_files:   rawNotif.chat_files   ?? undefined,
            stickerData:  rawNotif.stickerData  ?? undefined,
            locationData: rawNotif.locationData ?? undefined,
            contactData:  rawNotif.contactData  ?? undefined,
            profileData:  rawNotif.profileData  ?? undefined,
            eventData:    rawNotif.eventData    ?? undefined,
            timestamp: rawNotif.timestamp || new Date().toISOString(),
            createdAt: rawNotif.timestamp || new Date().toISOString(),
            readBy: rawNotif.readBy || [],
            deliveredTo: rawNotif.deliveredTo || [],
            isRead: rawNotif.isRead || false,
            isSender: false
          };
          newMessage = parseVoiceMessage(newMessage);
          addMessage(newMessage);
        }
        // ✅ Update chats list
        setInternalChats((prev) => {
          const existingChat = prev.find(c => c._id === data.chatId);
          const newUnreadCount = data.unreadCount ?? 0;
          const existingParticipant = existingChat?.participant;

          // ✅ CRITICAL: Use backend's type/status directly
          // Backend already sends correct values based on sender/receiver
          const finalType = chatType;
          const finalStatus = chatStatus;

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
            type: finalType, // ✅ Use backend value (different for sender vs receiver)
            status: finalStatus, // ✅ Use backend value (different for sender vs receiver)
            updatedAt: data.timestamp || new Date().toISOString(),
            isBlocked: existingChat?.isBlocked,
            isBlockedBy: existingChat?.isBlockedBy
          };

          if (!updatedChat.participant) {
            return prev;
          }

          let newChats: Chat[];

          if (existingChat) {
            // Update existing chat
            newChats = prev.map((c) =>
              c._id === updatedChat._id ? updatedChat : c
            ).sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          } else {
            // ✅ Add new chat
            newChats = [updatedChat, ...prev].sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            // ✅ Dispatch appropriate event based on type
            if (finalType === 'request' && finalStatus === 'pending' && typeof window !== 'undefined') {
              // Receiver gets a new request
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('new-message-request', {
                  detail: { chatId: data.chatId, chat: updatedChat }
                }));
              }, 100);
            } else if (isSenderUpdate && typeof window !== 'undefined') {
              // Sender gets their chat added to All/Personal
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('new-chat-added', {
                  detail: { chatId: data.chatId, chat: updatedChat }
                }));
              }, 100);
            }
          }
          
          saveToStorage(STORAGE_KEYS.CHATS, newChats);
          return newChats;
        });
        // ... rest of the function stays the same
        setUnreadCounts((prev) => {
          const newCount = data.unreadCount ?? 0;
          const updated = {
            ...prev,
            [data.chatId]: newCount
          };
          return updated;
        });
        // ✅ Handle request count updates
        if (data.type === 'request' && data.status === 'pending') {
          if (data.unreadCount > 0) {
            updateRequestCount(data.chatId, data.unreadCount);
          } else {
            clearRequestCount(data.chatId);
          }
          
          // Always dispatch event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('request-count-changed', {
              detail: {
                chatId: data.chatId,
                count: data.unreadCount
              }
            }));
          }
        }
        // ✅ Handle request count updates
        if (data.type === 'request' && data.status === 'pending') {
          if (data.unreadCount > 0) {
            updateRequestCount(data.chatId, data.unreadCount);
          } else {
            clearRequestCount(data.chatId);
          }
          
          // Always dispatch event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('request-count-changed', {
              detail: {
                chatId: data.chatId,
                count: data.unreadCount
              }
            }));
          }
          
          // ✅ NEW CODE: Also dispatch chat-list-update for RequestsTab to update last message
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chat-list-update', {
              detail: {
                chatId: data.chatId,
                type: data.type,
                status: data.status,
                participant: data.participant,
                lastMessage: data.lastMessage,
                unreadCount: data.unreadCount,
                timestamp: data.timestamp
              }
            }));
          }
        }
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
              unreadCount: 0,
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
        
        // ✅ Dispatch window event for RequestsTab to listen
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chat-list-update', {
            detail: data
          }));
        }
        
        // ✅ If this is a request chat with 0 unread count, also clear request count
        if (data.type === 'request' && data.status === 'pending' && data.unreadCount === 0) {
          clearRequestCount(data.chatId);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('request-count-changed', {
              detail: {
                chatId: data.chatId,
                count: 0
              }
            }));
          }
        }
        
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
        const { chatId, messageIds, lastMessage, totalMessages } = data;
        
        console.log('🗑️ Message deleted:', { chatId, messageIds, lastMessage, totalMessages });
        
        // Update messages state
        if (internalCurrentChat && chatId === internalCurrentChat._id) {
          setInternalMessages((prev) => {
            if (messageIds && Array.isArray(messageIds)) {
              return prev.filter((msg) => !messageIds.includes(msg._id));
            }
            return prev;
          });
        }
        
        // ✅ Update chat list
        setInternalChats((prev) => {
          const updated = prev.map((chat) => {
            if (chat._id === chatId) {
              if (totalMessages === 0) {
                return { ...chat, lastMessage: null };
              } else if (lastMessage) {
                return {
                  ...chat,
                  lastMessage: {
                    content: lastMessage.content,
                    sender: lastMessage.sender,
                    timestamp: lastMessage.timestamp,
                    deliveredTo: lastMessage.deliveredTo || [],
                    readBy: lastMessage.readBy,
                    isRead: lastMessage.isRead
                  },
                  updatedAt: lastMessage.timestamp
                };
              }
            }
            return chat;
          })
          .filter(chat => chat.lastMessage !== null)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // ✅ Sort by updatedAt
          
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        // ✅ Dispatch window event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('message-deleted', {
            detail: {
              chatId,
              messageIds,
              lastMessage,
              totalMessages
            }
          }));
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
      const handleMessagesDeletedForEveryone = (data: any) => {
        const { chatId, messageIds, lastMessage, totalMessages } = data;
        
        console.log('🗑️ Messages deleted for everyone:', { chatId, messageIds, lastMessage, totalMessages });
        
        // Update messages state - mark as deleted
        if (internalCurrentChat && chatId === internalCurrentChat._id) {
          setInternalMessages((prev) => 
            prev.map((msg) => 
              messageIds.includes(msg._id)
                ? { ...msg, content: 'This message was deleted', deletedForEveryone: true }
                : msg
            )
          );
        }
        
        // ✅ Update chat list with new last message
        setInternalChats((prev) => {
          const updated = prev.map((chat) => {
            if (chat._id === chatId) {
              if (totalMessages === 0) {
                // No messages left - will be filtered out
                return { ...chat, lastMessage: null };
              } else if (lastMessage) {
                // Update with new last message
                return {
                  ...chat,
                  lastMessage: {
                    content: lastMessage.content,
                    sender: lastMessage.sender,
                    timestamp: lastMessage.timestamp,
                    deliveredTo: lastMessage.deliveredTo || [],
                    readBy: lastMessage.readBy,
                    isRead: lastMessage.isRead
                  },
                  updatedAt: lastMessage.timestamp
                };
              }
            }
            return chat;
          })
          .filter(chat => chat.lastMessage !== null) // Remove chats with no messages
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // ✅ Sort by updatedAt
          
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        // ✅ Dispatch window event for components to update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('message-deleted', {
            detail: {
              chatId,
              messageIds,
              lastMessage,
              totalMessages
            }
          }));
        }
        
        // ✅ If current chat has no messages, clear it
        if (internalCurrentChat && chatId === internalCurrentChat._id && totalMessages === 0) {
          setInternalCurrentChat(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_CHAT);
          }
        }
      };
      const handleMessagesDeletedForMe = (data: any) => {
        const { chatId, messageIds, lastMessage, totalMessages } = data;
                
        // Update messages state - remove deleted messages
        if (internalCurrentChat && chatId === internalCurrentChat._id) {
          setInternalMessages((prev) => 
            prev.filter((msg) => !messageIds.includes(msg._id))
          );
        }
        
        setInternalChats((prev) => {
          const updated = prev.map((chat) => {
            if (chat._id === chatId) {
              if (totalMessages === 0) {
                // No visible messages left for this user
                return { ...chat, lastMessage: null };
              } else if (lastMessage) {
                // Update with new last visible message for this user
                return {
                  ...chat,
                  lastMessage: {
                    content: lastMessage.content,
                    sender: lastMessage.sender,
                    timestamp: lastMessage.timestamp,
                    deliveredTo: lastMessage.deliveredTo || [],
                    readBy: lastMessage.readBy,
                    isRead: lastMessage.isRead
                  },
                  updatedAt: lastMessage.timestamp
                };
              }
            }
            return chat;
          })
          .filter(chat => chat.lastMessage !== null) // Remove chats with no visible messages
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // ✅ Sort by updatedAt
          
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        // ✅ If current chat has no visible messages, clear it
        if (internalCurrentChat && chatId === internalCurrentChat._id && totalMessages === 0) {
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

      const handleNewMessage = (data: any) => {
        if (internalCurrentChat && data.chatId === internalCurrentChat._id) {
          const rawMsg = data.message || data;

          const newMessage: ChatMessage = {
            _id:         rawMsg._id,
            sender:      rawMsg.sender,
            content:     rawMsg.content,
            messageType: rawMsg.messageType || 'text',
            timestamp:   rawMsg.timestamp   || rawMsg.createdAt || new Date().toISOString(),
            createdAt:   rawMsg.createdAt   || rawMsg.timestamp || new Date().toISOString(),
            readBy:      rawMsg.readBy      || [],
            deliveredTo: rawMsg.deliveredTo || [],
            isRead:      rawMsg.isRead      || false,
            isSender:    rawMsg.sender === user?.id,

            voiceData:    rawMsg.voiceData    ?? undefined,
            chat_images:  rawMsg.chat_images  ?? undefined,
            chat_videos:  rawMsg.chat_videos  ?? undefined,
            chat_audio:   rawMsg.chat_audio   ?? undefined,
            chat_files:   rawMsg.chat_files   ?? undefined,
            stickerData:  rawMsg.stickerData  ?? undefined,
            locationData: rawMsg.locationData ?? undefined,
            contactData:  rawMsg.contactData  ?? undefined,
            profileData:  rawMsg.profileData  ?? undefined,
            eventData:    rawMsg.eventData    ?? undefined,
          };

          const finalMessage = (
            newMessage.messageType !== 'voice' &&
            newMessage.content?.startsWith('{') &&
            newMessage.content.includes('"type":"voice"')
          ) ? parseVoiceMessage(newMessage) : newMessage;

          setInternalMessages((prev) => {
            if (prev.some(m => m._id === finalMessage._id)) return prev;
            const optimisticIdx = prev.findIndex(
              m =>
                m._isOptimistic === true &&
                m.sender        === finalMessage.sender &&
                m.messageType   === finalMessage.messageType &&
                m.content       === finalMessage.content
            );
            if (optimisticIdx !== -1) {
              const updated = [...prev];
              updated[optimisticIdx] = { ...finalMessage, _isOptimistic: false };
              return updated;
            }
            return [...prev, finalMessage];
          });
        }
      };

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
        // ✅ Update unreadCounts state
        setUnreadCounts((prev) => {
          const updated = {
            ...prev,
            [data.chatId]: data.unreadCount
          };
          
          if (typeof window !== 'undefined') {
            const totalUnread = (Object.values(updated) as number[]).reduce((sum: number, count: number) => sum + count, 0);
            
            window.dispatchEvent(new CustomEvent('unread-count-changed', { 
              detail: { 
                chatId: data.chatId, 
                unreadCount: data.unreadCount,
                totalUnread 
              } 
            }));
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
        
        // ✅ CRITICAL: If count is 0 and this is a request, also clear request count
        const chat = internalChats.find(c => c._id === data.chatId);
        if (data.unreadCount === 0 && chat?.type === 'request' && chat?.status === 'pending') {
          clearRequestCount(data.chatId);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('request-count-changed', {
              detail: {
                chatId: data.chatId,
                count: 0
              }
            }));
          }
        }
      };
      const handleRequestCountUpdate = (data: { chatId: string; unreadCount: number }) => {
        updateRequestCount(data.chatId, data.unreadCount);
        // Also dispatch window event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('request-count-changed', {
            detail: {
              chatId: data.chatId,
              count: data.unreadCount
            }
          }));
        }
      };
      const handleRequestMessagesRead = (data: { chatId: string }) => {        
        // Clear request count
        clearRequestCount(data.chatId);
        
        // Update unread counts
        setUnreadCounts((prev) => {
          const updated = { ...prev };
          delete updated[data.chatId];
          return updated;
        });
        
        // Update chats list
        setInternalChats((prev) => {
          const updated = prev.map((chat) =>
            chat._id === data.chatId ? { ...chat, unreadCount: 0 } : chat
          );
          saveToStorage(STORAGE_KEYS.CHATS, updated);
          return updated;
        });
        
        // Update current chat
        setInternalCurrentChat((prev) => {
          if (prev && prev._id === data.chatId) {
            const updated = { ...prev, unreadCount: 0 };
            saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updated);
            return updated;
          }
          return prev;
        });
      };
      const handleNewMessageRequest = (data: any) => {        
        if (data.type === 'request' && data.status === 'pending') {
          const chatId = data.chatId;
          const currentCount = requestCounts[chatId] || 0;
          const newCount = currentCount + 1;
          
          // Update request count
          updateRequestCount(chatId, newCount);
          
          // Dispatch event immediately
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('request-count-changed', {
              detail: {
                chatId: chatId,
                count: newCount
              }
            }));
            
            window.dispatchEvent(new CustomEvent('new-message-request', {
              detail: { chatId, chat: data }
            }));
          }
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
      socket.on('request-count-update', handleRequestCountUpdate);
      socket.on('request-messages-read', handleRequestMessagesRead);
      socket.on('new-message-request', handleNewMessageRequest);
      socket.on('messages-deleted-for-everyone', handleMessagesDeletedForEveryone);
      socket.on('messages-deleted-for-me', handleMessagesDeletedForMe);
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
        socket.off('request-count-update', handleRequestCountUpdate);
        socket.off('request-messages-read', handleRequestMessagesRead);
        socket.off('new-message-request', handleNewMessageRequest);
        socket.off('messages-deleted-for-everyone', handleMessagesDeletedForEveryone);
        socket.off('messages-deleted-for-me', handleMessagesDeletedForMe);
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
        requestCounts,
        setCurrentChat,
        addMessage,
        removeMessage,
        replaceMessage,
        updateChatList,
        removeChat,
        setMessages,
        setChats,
        updateUnreadCount,
        updateRequestCount,
        clearRequestCount,
        getTotalRequestCount, 
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
      requestCounts: {},
      setCurrentChat: () => {},
      addMessage: () => {},
      replaceMessage: () => {},
      removeMessage: () => {},
      updateChatList: () => {},
      removeChat: () => {},
      setMessages: () => {},
      setChats: () => {},
      updateUnreadCount: () => {},
      updateRequestCount: () => {},
      clearRequestCount: () => {}, 
      getTotalRequestCount: () => 0,
      acceptRequest: async () => {},
      declineRequest: async () => {},
      getTotalUnreadCount: () => 0,
      loadChatById: async () => null,
    };
  }
  return context;
};
