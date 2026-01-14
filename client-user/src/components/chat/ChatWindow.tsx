  'use client';
import { useEffect, useState, useRef, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import { useChat } from '@/context/ChatContext';
import { 
  getWieChatMessages, 
  sendWieMessage, 
  deleteMessagesForMe, 
  deleteMessagesForEveryone,
  deleteChatForMe,
  acceptMessageRequest,
  declineMessageRequest,
  markMessagesAsRead,
  blockUser,
  unblockUser, 
  reportUser,
  checkBlockStatus
} from '@/services/chatService';
import socketService from '@/services/socketService';
import EmojiPicker from '@/components/chat/EmojiPicker';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import VoiceMessageDisplay from '@/components/chat/VoiceMessageDisplay';
import { MessageCircle, Send, Loader2, ArrowLeft, MoreVertical, X, Check, CheckCheck, Mic, Smile, Paperclip, Camera } from 'lucide-react';
import Image from 'next/image';
import { ChatMessage } from '@/types/chat';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatWindowProps {
  onBack?: () => void;
}

export default function ChatWindow({ onBack }: ChatWindowProps) {
  const authState = useSelector((state: RootState) => state?.auth);
  const user = authState?.user;
  const { currentChat, messages, setMessages, addMessage, removeChat, setCurrentChat, acceptRequest, declineRequest, typingUsers, updateUnreadCount, loadChatById } = useChat();
  
  // ✅ ALL useState and useRef hooks MUST be declared at the TOP, before ANY conditional returns
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [imageError, setImageError] = useState(false);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const hasMarkedAsRead = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'harassment' | 'spam' | 'inappropriate' | 'threat' | 'other'>('harassment');
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
  } | null>(null);

  const isOtherUserTyping = currentChat ? typingUsers[currentChat._id] || false : false;

  const STORAGE_KEYS = {
    CHATS: 'wie_chats',
    CURRENT_CHAT: 'wie_current_chat'
  };

  const saveToStorage = (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silent fail
    }
  };

const handleEmojiSelect = (emoji: string) => {
  // Use functional update to append emoji to existing text
  setMessageInput((prev) => prev + emoji);
  
  // Keep focus on the input so the user can keep typing or adding emojis
  setTimeout(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, 0);
};

  const handleReportUser = async () => {
    if (!currentChat?.participant?._id || !reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    setIsReporting(true);
    try {
      await reportUser({
        userId: currentChat.participant._id,
        reportType,
        reason: reportReason.trim(),
        chatId: currentChat._id,
        messageIds: messages.slice(-5).map(m => m._id)
      });
      
      setShowReportModal(false);
      setReportReason('');
      alert('Report submitted successfully. Our team will review it.');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    if (!currentChat || sendingVoice) return;

    const maxSize = 50 * 1024 * 1024;
    if (audioBlob.size > maxSize) {
      alert('Voice message is too large. Please record a shorter message (max 12 minutes).');
      return;
    }

    if (!duration || duration <= 0 || !isFinite(duration) || isNaN(duration)) {
      console.error('❌ Invalid duration:', duration);
      alert('Invalid voice recording duration. Please try again.');
      return;
    }

    const validDuration = Math.max(1, Math.floor(duration));
    setSendingVoice(true);
    setShowVoiceRecorder(false);

    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        
        reader.onerror = () => {
          console.error('❌ FileReader error:', reader.error);
          reject(reader.error);
        };
        
        reader.readAsDataURL(audioBlob);
      });

      if (!base64Audio.startsWith('data:audio/')) {
        console.error('❌ Invalid audio format:', base64Audio.substring(0, 100));
        throw new Error('Invalid base64 format');
      }

      const testAudio = new Audio(base64Audio);
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio test timeout'));
        }, 5000);

        testAudio.oncanplaythrough = () => {
          clearTimeout(timeout);
          resolve();
        };

        testAudio.onerror = (e) => {
          console.error('❌ Audio test failed:', e);
          clearTimeout(timeout);
          reject(new Error('Audio test failed'));
        };

        testAudio.load();
      });

      const voiceMessage = {
        type: 'voice',
        audio: base64Audio,
        duration: validDuration,
        mimeType: audioBlob.type || 'audio/webm;codecs=opus'
      };

      const content = JSON.stringify(voiceMessage);
      try {
        const response = await sendWieMessage(currentChat._id, content);
        if (response.success) {
          addMessage(response.message);
        }
      } catch (error: any) {
        console.error('❌ Failed to send voice message:', error);
        
        if (error.response?.status === 413) {
          alert('Voice message is too large. Please record a shorter message.');
        } else if (error.response?.status === 403) {
          alert(error.response?.data?.message || 'Cannot send message to this user');
        } else {
          alert('Failed to send voice message. Please try again.');
        }
      } finally {
        setSendingVoice(false);
      }
    } catch (error: any) {
      console.error('❌ Voice message processing error:', error);
      if (error.message === 'Audio test failed') {
        alert('Failed to verify audio recording. Please ensure your microphone is working and try again.');
      } else {
        alert('Failed to process voice message. Please try again.');
      }
      setSendingVoice(false);
    }
  };

  const parseVoiceMessage = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.type === 'voice' && parsed.audio) {
        return {
          ...parsed,
          duration: parsed.duration > 0 ? parsed.duration : 1
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const loadMessages = async () => {
    if (!currentChat) return;
    setLoading(true);
    hasMarkedAsRead.current = false;
    
    try {
      const response = await getWieChatMessages(currentChat._id);
      if (response.success) {
        const parsedMessages = (response.messages || []).map((msg: ChatMessage) => {
          if (msg.messageType === 'voice' && msg.voiceData) {
            return msg;
          }
          
          if (msg.content?.startsWith('{') && msg.content.includes('"type":"voice"')) {
            try {
              const parsed = JSON.parse(msg.content);
              if (parsed.type === 'voice' && parsed.audio && parsed.duration) {
                return {
                  ...msg,
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
          
          return msg;
        });
        
        setMessages(parsedMessages);
        
        if (response.chat?.participant) {
          const updatedChat = {
            ...currentChat,
            participant: {
              ...currentChat.participant,
              _id: response.chat.participant._id,
              name: response.chat.participant.name,
              email: response.chat.participant.email,
              username: currentChat.participant?.username || '',
              contact_no: currentChat.participant?.contact_no || '',
              profile_picture: response.chat.participant.profile_picture,
              bio: response.chat.participant.bio,
              is_verified: response.chat.participant.is_verified,
              isOnline: response.chat.participant.isOnline ?? false,
              lastSeen: response.chat.participant.last_seen_at || response.chat.participant.lastSeen,
            },
            isBlocked: currentChat.isBlocked,
            isBlockedBy: currentChat.isBlockedBy
          };
          setCurrentChat(updatedChat);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || sending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    try {
      const response = await sendWieMessage(currentChat._id, content);
      if (response.success) {
        addMessage(response.message);
      }
    } catch (error: any) {
      setMessageInput(content);
      if (error.response?.status === 403) {
        alert(error.response?.data?.message || 'Cannot send message to this user');
        
        if (error.response?.data?.message?.includes('blocked')) {
          const updatedChat = { ...currentChat, isBlocked: true };
          setCurrentChat(updatedChat);
        }
      } else {
        console.error('Send message error:', error);
      }
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setMessageInput(value);

    if (!currentChat) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socketService.sendTyping(currentChat._id, true);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendTyping(currentChat._id, false);
    }, 2000);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const formatLastSeenTime = (lastSeen?: string, isOnline?: boolean) => {
    if (isOnline) return 'Online';
    if (!lastSeen) return 'Offline';
    
    try {
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffMs = now.getTime() - lastSeenDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        return 'Last seen just now';
      }
      
      if (diffMins < 60) {
        return `Last seen ${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      }
      
      if (isToday(lastSeenDate)) {
        return `Last seen today at ${format(lastSeenDate, 'h:mm a')}`;
      }
      
      if (isYesterday(lastSeenDate)) {
        return `Last seen yesterday at ${format(lastSeenDate, 'h:mm a')}`;
      }
      
      const diffDays = Math.floor(diffMs / 86400000);
      if (diffDays < 7) {
        return `Last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }
      
      return `Last seen on ${format(lastSeenDate, 'MMM d')}`;
    } catch {
      return 'Offline';
    }
  };

const toggleMessageSelection = (messageId: string) => {
  // Find the message to check its status
  const message = messages.find(m => m._id === messageId);
  
  // If the message is deleted, don't allow selection
  if (message?.deletedForEveryone) return;

  setSelectedMessages((prev: Set<string>) => {
    const newSet = new Set<string>(prev);
    if (newSet.has(messageId)) {
      newSet.delete(messageId);
    } else {
      newSet.add(messageId);
    }
    return newSet;
  });
};

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedMessages(new Set<string>());
    setShowDeleteMenu(false);
  };

  const handleDeleteForMe = async () => {
    if (selectedMessages.size === 0 || !currentChat) return;

    try {
      await deleteMessagesForMe(currentChat._id, Array.from(selectedMessages));
      const updatedMessages = messages.filter((msg: ChatMessage) => !selectedMessages.has(msg._id));
      setMessages(updatedMessages);
      
      if (updatedMessages.length === 0) {
        removeChat(currentChat._id);
        setCurrentChat(null);
        if (onBack) onBack();
      }
      
      exitSelectionMode();
    } catch (error) {
      // Silent error
    }
  };

  const handleDeleteForEveryone = async () => {
    if (selectedMessages.size === 0 || !currentChat) return;

    const allMine = Array.from(selectedMessages).every((msgId: string) => {
      const msg = messages.find((m: ChatMessage) => m._id === msgId);
      return msg && msg.sender === user?.id;
    });

    if (!allMine) {
      alert('You can only delete your own messages for everyone');
      return;
    }

    try {
      await deleteMessagesForEveryone(currentChat._id, Array.from(selectedMessages));
      const updatedMessages = messages.map((msg: ChatMessage) => 
        selectedMessages.has(msg._id) 
          ? { ...msg, deletedForEveryone: true, content: 'This message was deleted' }
          : msg
      );
      setMessages(updatedMessages);
      exitSelectionMode();
    } catch (error) {
      // Silent error
    }
  };

  const handleDeleteEntireChat = async () => {
    if (!currentChat) return;
    
    if (confirm('Delete this chat? This will only delete it for you.')) {
      try {
        await deleteChatForMe(currentChat._id);
        removeChat(currentChat._id);
        setCurrentChat(null);
        if (onBack) onBack();
      } catch (error) {
        // Silent error
      }
    }
  };

  const handleMessageLongPress = (messageId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedMessages(new Set<string>([messageId]));
    }
  };

  const handleAcceptRequest = async () => {
    if (!currentChat) return;
    
    setIsAccepting(true);
    try {
      const response = await acceptMessageRequest(currentChat._id);
      if (response.success) {
        await acceptRequest(currentChat._id);
      }
    } catch (error) {
      // Silent error
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!currentChat) return;
    
    if (!confirm('Decline this message request?')) return;
    
    setIsDeclining(true);
    try {
      const response = await declineMessageRequest(currentChat._id);
      if (response.success) {
        await declineRequest(currentChat._id);
        if (onBack) onBack();
      }
    } catch (error) {
      // Silent error
    } finally {
      setIsDeclining(false);
    }
  };

  const handleBackClick = () => {
    if (messages.length === 0 && currentChat) {
      removeChat(currentChat._id);
      setCurrentChat(null);
    }
    if (onBack) onBack();
  };

  const handleBlockUser = async () => {
    if (!currentChat?.participant?._id) return;
    
    const iBlockedThem = blockStatus?.iBlockedThem === true;
    
    if (iBlockedThem) {
      if (!confirm(`Unblock ${currentChat.participant.name}? They will be able to message you again.`)) {
        return;
      }
      
      setIsBlocking(true);
      try {
        await unblockUser(currentChat.participant._id);
        setBlockStatus({ iBlockedThem: false, theyBlockedMe: false });
        
        const updatedChat = {
          ...currentChat,
          isBlocked: false,
          isBlockedBy: undefined
        };
        setCurrentChat(updatedChat);
        saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updatedChat);
        setShowDeleteMenu(false);
        
        alert('User unblocked successfully.');
      } catch (error: any) {
        console.error('Unblock error:', error);
        alert(error.response?.data?.message || 'Failed to unblock user');
      } finally {
        setIsBlocking(false);
      }
    } else {
      if (!confirm(`Block ${currentChat.participant.name}? This will:\n• Remove them from your followers/following\n• Prevent them from messaging you\n• They won't be notified`)) {
        return;
      }

      setIsBlocking(true);
      try {
        await blockUser(currentChat.participant._id);
        setBlockStatus({ iBlockedThem: true, theyBlockedMe: false });
        
        const updatedChat = {
          ...currentChat,
          isBlocked: true,
          isBlockedBy: 'you' as const
        };
        setCurrentChat(updatedChat);
        saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updatedChat);
        setShowDeleteMenu(false);
        
        alert('User blocked successfully. You can still view chat history but they cannot message you.');
      } catch (error: any) {
        console.error('Block error:', error);
        
        setBlockStatus({ iBlockedThem: false, theyBlockedMe: false });
        const revertedChat = {
          ...currentChat,
          isBlocked: false,
          isBlockedBy: undefined
        };
        setCurrentChat(revertedChat);
        saveToStorage(STORAGE_KEYS.CURRENT_CHAT, revertedChat);
        
        alert(error.response?.data?.message || 'Failed to block user');
      } finally {
        setIsBlocking(false);
      }
    }
  };

const getMessageStatus = (message: ChatMessage) => {
  if (message.sender !== user?.id) return null;

  const isRead = message.readBy && message.readBy.length > 1 && 
                 message.readBy.some(id => id !== user?.id);
  const isDelivered = message.deliveredTo && message.deliveredTo.length > 0;

  if (isRead) {
    return (
      <div className="flex items-center gap-1">
        {/* Double check in purple when seen */}
        <CheckCheck size={15} style={{ color: '#8860D9' }} />
        <span className="text-[10px] font-medium" style={{ color: '#8860D9' }}>Seen</span>
      </div>
    );
  } else if (isDelivered) {
    // Double check in white when delivered but not seen
    return <CheckCheck size={15} className="text-white" />;
  } else {
    // Single check in white when sent
    return <Check size={15} className="text-white" />;
  }
};

  // ✅ Effects
  useEffect(() => {
    if (currentChat) {
      setIsTransitioning(true);
      hasMarkedAsRead.current = false;
      markedAsReadRef.current.clear();
      
      socketService.joinChat(currentChat._id);
      
      setTimeout(() => {
        loadMessages();
        setIsTransitioning(false);
      }, 100);

      return () => {
        socketService.leaveChat(currentChat._id);
      };
    }
  }, [currentChat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (!currentChat?._id || !user?.id || loading || hasMarkedAsRead.current) return;
    if (messages.length === 0) return;
    
    const unreadMessages = messages.filter(
      (msg) => msg.sender !== user.id && !msg.readBy.includes(user.id)
    );
    
    if (unreadMessages.length === 0) {
      return;
    }

    hasMarkedAsRead.current = true;
    updateUnreadCount(currentChat._id, 0);
    
    markMessagesAsRead(currentChat._id)
      .catch((error) => {
        hasMarkedAsRead.current = false;
      });
  }, [currentChat?._id, user?.id, loading, messages.length, updateUnreadCount]);

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (!currentChat?._id || !currentChat?.participant?._id || !user?.id) return;
      
      try {
        const status = await checkBlockStatus(currentChat.participant._id);
        
        setBlockStatus({
          iBlockedThem: status.iBlockedThem || false,
          theyBlockedMe: status.theyBlockedMe || false
        });
        
        let isBlockedBy: 'you' | 'them' | undefined = undefined;
        
        if (status.iBlockedThem) {
          isBlockedBy = 'you';
        } else if (status.theyBlockedMe) {
          isBlockedBy = 'them';
        }
        
        const updatedChat = {
          ...currentChat,
          isBlocked: status.iBlockedThem || status.theyBlockedMe,
          isBlockedBy: isBlockedBy
        };
        
        setCurrentChat(updatedChat);
        saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updatedChat);
        
      } catch (error) {
        console.error('Failed to fetch block status:', error);
        setBlockStatus({
          iBlockedThem: false,
          theyBlockedMe: false
        });
      }
    };

    fetchChatDetails();
  }, [currentChat?._id, currentChat?.participant?._id, user?.id]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && currentChat?._id && currentChat?.participant?._id && user?.id) {
        try {
          const status = await checkBlockStatus(currentChat.participant._id);
          setBlockStatus(status);
          
          let isBlockedBy: 'you' | 'them' | undefined = undefined;
          if (status.iBlockedThem) {
            isBlockedBy = 'you';
          } else if (status.theyBlockedMe) {
            isBlockedBy = 'them';
          }
          
          const updatedChat = {
            ...currentChat,
            isBlocked: status.iBlockedThem || status.theyBlockedMe,
            isBlockedBy: isBlockedBy
          };
          setCurrentChat(updatedChat);
          saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updatedChat);
        } catch (error) {
          console.error('Failed to refresh block status:', error);
        }
      }
    };
    
    handleVisibilityChange();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [currentChat?._id, currentChat?.participant?._id, user?.id]);

  useEffect(() => {
    return () => {
      if (currentChat && typingTimeoutRef.current) {
        socketService.sendTyping(currentChat._id, false);
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentChat?._id]);

  // ✅ NOW conditional returns are AFTER all hooks
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C1014]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860D9]"></div>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C1014]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860D9]"></div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#0C1014] px-4">
        <MessageCircle size={64} className="mb-4 text-[#8860D9]" />
        <p className="text-xl text-white mb-2">No chat selected</p>
        <p className="text-sm text-center">Select a conversation to start messaging</p>
      </div>
    );
  }

  const profilePictureUrl = currentChat.participant?.profile_picture;
  const isOnline = currentChat.participant?.isOnline ?? false;
  const lastSeenTime = currentChat.participant?.lastSeen || currentChat.participant?.last_seen_at;
  const isRequestRecipient = currentChat?.type === 'request' && 
                            currentChat?.status === 'pending' && 
                            messages.length > 0 && 
                            messages[0]?.sender !== user?.id;
  return (
    <div className="flex flex-col h-full">
      <div className="p-4  flex items-center justify-between bg-[#0C1014]"
      style={{
    borderBottom: '0.2px solid',
    borderImageSource: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, #444444ff 32.69%, #5d5d5dff 61.06%, rgba(153, 153, 153, 0) 100%)',
    borderImageSlice: 1
  }}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={handleBackClick} className="lg:hidden p-2 hover:bg-[#2D2F39] rounded-full text-white">
              <ArrowLeft size={20} />
            </button>
          )}
          {blockStatus?.theyBlockedMe === true ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#2D2F39] flex-shrink-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          ) : (
            // Normal profile display
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#2D2F39] flex-shrink-0">
              {profilePictureUrl && !imageError ? (
                <>
                  <Image
                    src={profilePictureUrl}
                    alt={currentChat.participant?.name || 'User'}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
                  )}
                </>
              ) : (
                <>
                  <div className="w-full h-full flex items-center justify-center text-white font-semibold bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                    {currentChat.participant?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
                  )}
                </>
              )}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {/* ✅ FIXED: Check blockStatus.theyBlockedMe */}
              <p className="font-semibold truncate text-white">
                {blockStatus?.theyBlockedMe === true ? 'WhatsInEveryone User' : currentChat.participant?.name}
              </p>
              {blockStatus?.theyBlockedMe !== true && currentChat.participant?.is_verified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              )}
            </div>
            {blockStatus?.theyBlockedMe !== true && (
              <p className="text-xs text-gray-400">
                {formatLastSeenTime(lastSeenTime, isOnline)}
              </p>
            )}
          </div>
        </div>
          {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowDeleteMenu(!showDeleteMenu)}
            className="p-2 hover:bg-[#2D2F39] rounded-full text-white"
          >
            <MoreVertical size={20} />
          </button>
          {showDeleteMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#2D2F39] rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  setShowDeleteMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full px-4 py-2 text-left text-yellow-400 hover:bg-[#2D2F39] rounded-t-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report User
              </button>
              <button
                onClick={handleBlockUser}
                disabled={isBlocking}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#2D2F39] flex items-center gap-2"
              >
                {isBlocking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 75.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                {blockStatus?.iBlockedThem === true ? 'Unblock User' : 'Block User'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteMenu(false);
                  handleDeleteEntireChat();
                }}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#2D2F39] rounded-b-lg"
              >
                Delete Chat
              </button>
            </div>
          )}
          
          {/* Report Modal */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-md w-full mx-4 border border-[#2D2F39]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Report User</h3>
                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setReportReason('');
                    }}
                    className="p-2 hover:bg-[#2D2F39] rounded-full"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Report Type
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full px-4 py-2 bg-[#0C1014] border border-[#2D2F39] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8860D9]"
                    >
                      <option value="harassment">Harassment</option>
                      <option value="spam">Spam</option>
                      <option value="inappropriate">Inappropriate Content</option>
                      <option value="threat">Threat or Violence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Reason (required)
                    </label>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Please describe why you're reporting this user..."
                      className="w-full px-4 py-2 bg-[#0C1014] border border-[#2D2F39] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#8860D9] resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {reportReason.length}/500 characters
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowReportModal(false);
                        setReportReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-[#2D2F39] text-white rounded-lg hover:bg-[#3D3F49] transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportUser}
                      disabled={!reportReason.trim() || isReporting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {isReporting ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Reporting...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    Your report is anonymous. Our team will review it shortly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Message Request Actions - Only show if user is recipient */}
      {isRequestRecipient && (
        <div className="p-4 bg-[#2D2F39] border-b border-[#2D2F39]">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-300 text-center">
              {currentChat.participant?.name} wants to send you a message
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptRequest}
                disabled={isAccepting || isDeclining}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
              >
                {isAccepting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Accept'
                )}
              </button>
              <button
                onClick={handleDeclineRequest}
                disabled={isAccepting || isDeclining}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isDeclining ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  'Decline'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Mode Header */}
{selectionMode && (
  <div 
    className=" p-4 flex items-center justify-between backdrop-blur-md transition-all duration-300"
    style={{ 
      background: 'rgba(32, 32, 32, 0.85)',

    }}
  >
    <div className="flex items-center gap-4">
      <button 
        onClick={exitSelectionMode} 
        className="p-1 hover:bg-white/10 rounded-full text-white transition-colors"
      >
        <X size={22} />
      </button>
      <div className="flex flex-col">
        <span className="text-white font-medium">Selection Mode</span>
        <span className="text-[11px] text-[#5494FF] font-semibold">
          {selectedMessages.size} message{selectedMessages.size !== 1 ? 's' : ''} selected
        </span>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={handleDeleteForMe}
        disabled={selectedMessages.size === 0}
        className="px-4 py-1.5 text-xs font-medium bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
      >
        Delete for Me
      </button>
      <button
        onClick={handleDeleteForEveryone}
        disabled={selectedMessages.size === 0}
        className="px-4 py-1.5 text-xs font-medium text-white rounded-full transition-all disabled:opacity-50 shadow-lg"
        style={{ background: 'linear-gradient(147.67deg, #FF4B4B 13.16%, #FF6B6B 100.03%)' }}
      >
        Delete for Everyone
      </button>
    </div>
  </div>
)}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0C1014]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#8860D9]" size={32} />
          </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
              <div className="w-16 h-16 rounded-full bg-[#2D2F39] flex items-center justify-center mb-4 overflow-hidden">
                {currentChat.isBlockedBy === 'them' ? (
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 75.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              ) : profilePictureUrl && !imageError ? (
                  <Image
                    src={profilePictureUrl}
                    alt={currentChat.participant?.name || 'User'}
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {currentChat.participant?.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <p className="text-white font-semibold mb-2">
                {currentChat.isBlockedBy === 'them' ? 'WhatsInEveryone User' : currentChat.participant?.name}
              </p>
              <p className="text-sm text-center">No messages yet. Start the conversation!</p>
            </div>
          ) : (
          <>
{messages.map((message, index) => {
  const isSender = message.sender === user?.id;
  const isSelected = selectedMessages.has(message._id);
  const isDeleted = message.deletedForEveryone;
  const isVoice = message.messageType === 'voice' && message.voiceData?.audioBase64;
  
  // Date logic
  const messageDate = new Date(message.timestamp);
  const prevMessage = index > 0 ? messages[index - 1] : null;
  const prevMessageDate = prevMessage ? new Date(prevMessage.timestamp) : null;
  
  // Only show separator if the date has changed
  const showDateSeparator = !prevMessageDate || 
    messageDate.toDateString() !== prevMessageDate.toDateString();

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender !== message.sender;

  return (
    <Fragment key={message._id}>
      {/* Date Separator: Fixed within a container to prevent overlapping stacking */}
      {showDateSeparator && (
        <div className="relative w-full flex justify-center h-10 my-4 pointer-events-none z-20">
          <div 
            className={`sticky top-2 transition-opacity duration-500 ease-in-out `}
          >
            <span className="text-[9px] px-3 py-1.5 bg-[#1A1A1A] text-gray-200 rounded-lg backdrop-blur-md border border-white/10 uppercase tracking-widest  shadow-2xl">
              {getDateLabel(messageDate)}
            </span>
          </div>
        </div>
      )}

      {/* Message Row */}
      <div
        onClick={() => !isDeleted && selectionMode && toggleMessageSelection(message._id)}
        onContextMenu={(e) => {
          if (isDeleted) return;
          e.preventDefault();
          handleMessageLongPress(message._id);
        }}
        className={`flex items-end gap-2 mb-2 ${isSender ? 'justify-end' : 'justify-start'} ${
          selectionMode && !isDeleted ? 'cursor-pointer' : ''
        }`}
      >
        {/* Received Message Avatar */}
        {!isSender && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
            {isLastInGroup ? (
              profilePictureUrl && !imageError ? (
                <Image src={profilePictureUrl} alt="Avatar" width={32} height={32} className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-white bg-gray-600">
                  {currentChat.participant?.name?.charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <div className="w-8" /> 
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`max-w-[75%] rounded-[18px] transition-all duration-200 ${
            isSelected ? 'ring-2 ring-[#8860D9] scale-[0.98]' : ''
          } ${isSender ? '' : ''} ${
            isVoice && !isDeleted ? 'px-3 py-3' : 'px-4 py-2'
          }`}
          style={
            isSender 
              ? { background: isDeleted ? 'rgba(50, 50, 50, 0.4)' : 'rgb(84, 148, 255)' }
              : { 
                  background: 'linear-gradient(270deg, rgba(32, 32, 32, 0.6) -8.43%, rgba(96, 96, 96, 0.6) 100%)',
           
                }
          }
        >
          {isDeleted ? (
            <div className="flex items-center gap-2 py-1 italic text-gray-400 text-[13px] select-none">
               <X size={14} />
               <span>This message was deleted</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {isVoice ? (
                <VoiceMessageDisplay
                  audioURL={message.voiceData!.audioBase64}
                  duration={message.voiceData!.duration}
                  isSender={isSender}
                  timestamp={message.timestamp}
                />
              ) : (
                <div className="break-words text-[15px] leading-relaxed text-white">
                  {message.content}
                </div>
              )}

              {/* Status area for both Voice and Text */}
              <div className="flex justify-end mt-1 items-center gap-1.5 opacity-80">
                <span className="text-[10px] text-white">
                  {format(messageDate, 'HH:mm')}
                </span>
                {isSender && (
                  <div className="flex items-center">
                    {getMessageStatus(message)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
})}
            {isOtherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] border border-[#2D2F39] rounded-lg px-4 py-3 max-w-[70%]">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-gray-400 ml-2">typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {(currentChat.status === 'accepted' || currentChat.type === 'direct' || !isRequestRecipient) ? (
        <>
          {currentChat.isBlocked || blockStatus?.iBlockedThem || blockStatus?.theyBlockedMe ? (
            <div className="p-4 border-t border-[#2D2F39] bg-[#1a1a1a]">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 75.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="text-sm">
                  {currentChat.isBlockedBy === 'you' || blockStatus?.iBlockedThem
                    ? `You blocked ${currentChat.participant?.name}. They cannot send you messages.`
                    : 'You cannot message this user.'
                  }
                </span>
              </div>
            </div>
          ) : (
 
          <form onSubmit={handleSendMessage} className="p-4 flex items-center gap-2 relative"
          >
  {/* Voice Recorder - Logic preserved, styled to overlay nicely */}
  {showVoiceRecorder && (
    <div className="absolute inset-x-0 bottom-full mb-2 px-4">
      <VoiceRecorder
        onSendVoice={handleSendVoice}
        onCancel={() => setShowVoiceRecorder(false)}
        disabled={sendingVoice}
      />
    </div>
  )}

  {/* Main Input Capsule */}
  <div 
    className="flex-1 flex items-center gap-3 px-4 py-1.5 rounded-full transition-all"
style={{ background: 'linear-gradient(90.06deg, #2979FF -327.97%, #5F5F5F 147.32%)' }}
  >
    {/* Emoji Picker Button */}
    <button
      type="button"
      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      className="text-gray-300 hover:text-white transition"
    >
      <Smile size={22} />
    </button>

    <input
      ref={inputRef}
      type="text"
      value={messageInput}
      onChange={(e) => handleTyping(e.target.value)}
      placeholder="Message"
      className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder-gray-300 py-1.5"
      disabled={sending || sendingVoice || showVoiceRecorder}
    />

    {/* Right-side Action Icons inside Capsule */}
    <div className="flex items-center gap-3 text-gray-300">
      <Paperclip size={20} className="cursor-pointer hover:text-white transition" />
      <Camera size={20} className="cursor-pointer hover:text-white transition" />
    </div>
  </div>

  {/* Circular Action Button (Send or Mic) */}
  <button
    type={messageInput.trim() ? "submit" : "button"}
    onClick={!messageInput.trim() ? () => setShowVoiceRecorder(true) : undefined}
    disabled={sending || sendingVoice}
    style={{ background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)' }}
    className="p-3 rounded-full text-white shadow-lg hover:opacity-90 transition-all active:scale-95 flex-shrink-0"
  >
    {sending || sendingVoice ? (
      <Loader2 className="animate-spin" size={20} />
    ) : messageInput.trim() ? (
      <Send size={20} />
    ) : (
      <Mic size={20} />
    )}
  </button>

  {/* Emoji Picker - Positioned above */}
  <EmojiPicker
    isOpen={showEmojiPicker}
    onClose={() => setShowEmojiPicker(false)}
    onEmojiSelect={handleEmojiSelect}
    position="top"
  />
</form>
          )}
        </>
      ) : (
        <div className="p-4 border-t border-[#2D2F39] bg-[#1a1a1a] text-center text-gray-400 text-sm">
          Accept the message request to reply
        </div>
      )}
    </div>
  );
}
