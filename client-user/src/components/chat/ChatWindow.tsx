  'use client';
import { useEffect, useState, useRef, Fragment } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import { useRouter } from 'next/navigation'; 
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
import { MessageCircle, Send, Loader2, ArrowLeft, MoreVertical, X, Check, CheckCheck, Mic, Smile, Ban } from 'lucide-react';
import Image from 'next/image';
import { format, isToday, isYesterday } from 'date-fns';
import { useTheme } from "@/components/home/ThemeContext";
import TopAlert from "@/components/ui/TopAlert";
import { ChatMessage, Chat } from '@/types/chat';
interface ChatWindowProps {
  onBack?: () => void;
}

export default function ChatWindow({ onBack }: ChatWindowProps) {
  const authState = useSelector((state: RootState) => state?.auth);
  const user = authState?.user;
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const { currentChat, messages, setMessages, addMessage, removeChat, setCurrentChat, acceptRequest, declineRequest, typingUsers, updateUnreadCount, loadChatById, updateChatList,clearRequestCount } = useChat();
  // ✅ Immediate fallback if no chat selected, before any other logic runs
  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4" style={{ backgroundColor: themeStyles.background, color: themeStyles.textSecondary }}>
        <MessageCircle size={64} className="mb-4 text-[#8860D9]" />
        <p className="text-xl mb-2" style={{ color: themeStyles.text }}>No chat selected</p>
        <p className="text-sm text-center">Select a conversation to start messaging</p>
      </div>
    );
  }
  const handleProfileClick = () => {
    if (!currentChat?.participant?._id) return;
    // ✅ Don't allow navigation if blocked by them
    if (blockStatus?.theyBlockedMe === true) {
      return;
    }
    
    // Navigate to user profile
    router.push(`/profile/${currentChat.participant._id}`);
  };
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

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleReportUser = async () => {
    if (!currentChat?.participant?._id || !reportReason.trim()) {
      setToast({ message: 'Please provide a reason for reporting', type: 'error' });
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
      setReportFeedback({
        type: 'success',
        title: 'Report received',
        message: 'Thanks for reporting. We\'ll review your report and take appropriate action.'
      });
    } catch (error: any) {
      setShowReportModal(false);
      setReportFeedback({
        type: 'info',
        title: 'Report status',
        message: error.response?.data?.message || 'Failed to submit report'
      });
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

        // ✅ Update participant info if available
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
  const isFirstMessage = messages.length === 0;
  
  setMessageInput('');
  setSending(true);

  try {
    const response = await sendWieMessage(currentChat._id, content);
    if (response.success) {
      addMessage(response.message);
      const chatToUpdate: Chat = {
        _id: response.chat?._id || currentChat._id,
        participant: response.chat?.participant || currentChat.participant!,
        lastMessage: {
          content: response.message.content,
          sender: response.message.sender,
          timestamp: response.message.timestamp,
          deliveredTo: response.message.deliveredTo || [],
          readBy: response.message.readBy || [],
          isRead: false
        },
        unreadCount: 0,
        type: response.chat?.type || currentChat.type || 'direct', // ✅ Use response type
        status: response.chat?.status || currentChat.status || 'accepted', // ✅ Use response status
        updatedAt: response.message.timestamp || new Date().toISOString()
      };
      // Update chat list
      updateChatList(chatToUpdate);

      // If first message, also update current chat state
      if (isFirstMessage) {
        setCurrentChat(chatToUpdate);
        
        // Dispatch events
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('force-reload-chats'));
            window.dispatchEvent(new CustomEvent('new-chat-added', {
              detail: { chatId: chatToUpdate._id, chat: chatToUpdate }
            }));
          }, 100);
        }
      }
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

  // State for Delete Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const confirmDeleteChat = async () => {
    if (!currentChat) return;

    try {
        await deleteChatForMe(currentChat._id);
        removeChat(currentChat._id);
        setCurrentChat(null);
        if (onBack) onBack();

        setShowDeleteModal(false);
    } catch (error) {
        console.error('Failed to delete chat', error);
        alert('Failed to delete chat');
    }
  };

  const handleDeleteEntireChat = async () => {
    if (!currentChat) return;
    setShowDeleteMenu(false);
    setShowDeleteModal(true);
  };


  const handleMessageLongPress = (messageId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedMessages(new Set<string>([messageId]));
    }
  };
  useEffect(() => {
    const handleRequestAccepted = (event: CustomEvent) => {
      const { chatId } = event.detail;
      if (currentChat?._id === chatId) {
        // Request was accepted, navigate back to trigger tab switch
        if (onBack) {
          onBack();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('request-accepted' as any, handleRequestAccepted as any);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('request-accepted' as any, handleRequestAccepted as any);
      }
    };
  }, [currentChat?._id, onBack]);

  const handleAcceptRequest = async () => {
    if (!currentChat) return;

    setIsAccepting(true);
    try {
      // ✅ Clear request count BEFORE accepting
      clearRequestCount(currentChat._id);
      updateUnreadCount(currentChat._id, 0);

      // Dispatch events immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('request-count-changed', {
          detail: { chatId: currentChat._id, count: 0 }
        }));
      }

      const response = await acceptMessageRequest(currentChat._id);
      if (response.success) {
        await acceptRequest(currentChat._id);
        
        // Update local chat state
        const updatedChat = {
          ...currentChat,
          type: 'direct' as const,
          status: 'accepted' as const,
          unreadCount: 0
        };
        setCurrentChat(updatedChat);
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('force-reload-chats'));
        }
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
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
        // ✅ Clear local messages
        setMessages([]);
        // ✅ Clear current chat
        setCurrentChat(null);
        // ✅ Navigate back
        if (onBack) {
          onBack();
        }
      }
    } catch (error) {
      console.error('Failed to decline request:', error);
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


  // State for Block/Unblock Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [blockAndReport, setBlockAndReport] = useState(true);

  const confirmBlockUser = async () => {
    if (!currentChat?._id || !user?.id) return;

    setIsBlocking(true);
    try {
      // 1. Report if checked (Fire and forget or await, safe to await)
      if (blockAndReport) {
         try {
           await axios.post(`${process.env.NEXT_PUBLIC_USER_SERVICE_URL}/block-report/report`, {
              reporterId: user.id,
              reportedId: currentChat.participant?._id,
              reason: 'Blocked and Reported via Checkbox',
              type: 'other'
           });
         } catch (e) {
           console.error('Auto-report failed:', e);
         }
      }

      // 2. Block Logic
      await blockUser(currentChat.participant?._id || '');

      setBlockStatus({ iBlockedThem: true, theyBlockedMe: false });
      const updatedChat = {
          ...currentChat,
          isBlocked: true,
          isBlockedBy: 'you' as const
      };
      setCurrentChat(updatedChat);
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updatedChat);

      setShowBlockModal(false);
      setBlockAndReport(false);

      // Removed alert per request
    } catch (error: any) {
      console.error('Block error:', error);
      alert(error.response?.data?.message || 'Failed to block user');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleBlockUser = async () => {
    if (!currentChat?.participant?._id) return;

    const iBlockedThem = blockStatus?.iBlockedThem === true;

    if (iBlockedThem) {
      setShowDeleteMenu(false);
      setShowUnblockModal(true);
    } else {
      // Show Custom Block Modal
      setShowDeleteMenu(false);
      setShowBlockModal(true);
    }
  };

  const confirmUnblockUser = async () => {
    if (!currentChat?.participant?._id) return;

    setIsBlocking(true);
    try {
      await unblockUser(currentChat.participant._id);
      setBlockStatus({ iBlockedThem: false, theyBlockedMe: false });
      const updatedChat = { ...currentChat, isBlocked: false, isBlockedBy: undefined };
      setCurrentChat(updatedChat);
      saveToStorage(STORAGE_KEYS.CURRENT_CHAT, updatedChat);
      setShowUnblockModal(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to unblock');
    } finally {
      setIsBlocking(false);
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

  useEffect(() => {
    if (currentChat) {
      setIsTransitioning(true);
      hasMarkedAsRead.current = false;
      markedAsReadRef.current.clear();

      socketService.joinChat(currentChat._id);

      // ✅ Load messages immediately, no delay
      loadMessages();
      
      // ✅ Set transition state after load starts
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);

      return () => {
        clearTimeout(timer);
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

  // ✅ CRITICAL: Clear counts immediately in UI
  updateUnreadCount(currentChat._id, 0);
  
  // ✅ If this is a request chat, also clear request count
  if (currentChat.type === 'request' && currentChat.status === 'pending') {
    clearRequestCount(currentChat._id);
    
    // Dispatch event immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('request-count-changed', {
        detail: { chatId: currentChat._id, count: 0 }
      }));
    }
  }

  // ✅ Call mark as read API (backend will emit socket events)
  markMessagesAsRead(currentChat._id)
    .then(() => {
    })
    .catch((error) => {
      console.error('❌ Failed to mark as read:', error);
      hasMarkedAsRead.current = false;
    });
}, [currentChat?._id, user?.id, loading, messages.length, updateUnreadCount, clearRequestCount]);
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
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: themeStyles.sidebarBg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860D9]"></div>
      </div>
    );
  }

  if (isTransitioning) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: themeStyles.sidebarBg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860D9]"></div>
      </div>
    );
  }

  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4" style={{ backgroundColor: themeStyles.background, color: themeStyles.textSecondary }}>
        <MessageCircle size={64} className="mb-4 text-[#8860D9]" />
        <p className="text-xl mb-2" style={{ color: themeStyles.text }}>No chat selected</p>
        <p className="text-sm text-center">Select a conversation to start messaging</p>
      </div>
    );
  }

  const profilePictureUrl = currentChat.participant?.profile_picture;
  const isOnline = currentChat.participant?.isOnline ?? false;
  const lastSeenTime = currentChat.participant?.lastSeen || currentChat.participant?.last_seen_at;

  const isRequestRecipient = currentChat?.type === 'request' &&
                            currentChat?.status === 'pending' &&
                            messages &&
                            messages.length > 0 &&
                            messages[0]?.sender !== user?.id;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ backgroundColor: themeStyles.sidebarBg }}>
      <div
        className="p-4 flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: themeStyles.sidebarBg,
          borderBottomWidth: '1px',
          borderBottomStyle: 'solid',
          borderImageSource: isDark
            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.2), transparent)',
          borderImageSlice: 1
        }}
      >
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={handleBackClick}
            className="p-2 rounded-full transition-colors hover:opacity-80"
            style={{
              color: themeStyles.text,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {blockStatus?.theyBlockedMe === true ? (
          <div
            className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
            style={{ backgroundColor: themeStyles.hoverBg }}
          >
            <svg className="w-6 h-6" style={{ color: themeStyles.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        ) : (
          // ✅ Add onClick to profile picture
          <div
            onClick={handleProfileClick}
            className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: themeStyles.hoverBg }}
          >
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
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2"
                    style={{ borderColor: themeStyles.sidebarBg }}
                  />
                )}
              </>
            ) : (
              <>
                <div className="w-full h-full flex items-center justify-center text-white font-semibold bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                  {currentChat.participant?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                {isOnline && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2"
                    style={{ borderColor: themeStyles.sidebarBg }}
                  />
                )}
              </>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* ✅ Add onClick to name */}
            <p 
              onClick={handleProfileClick}
              className="font-semibold truncate cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ color: themeStyles.text }}
            >
              {blockStatus?.theyBlockedMe === true ? 'Wie User' : currentChat.participant?.name}
            </p>
            {blockStatus?.theyBlockedMe !== true && currentChat.participant?.is_verified && (
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            )}
          </div>
          {blockStatus?.theyBlockedMe !== true && (
            <p className="text-xs" style={{ color: themeStyles.textSecondary }}>
              {formatLastSeenTime(lastSeenTime, isOnline)}
            </p>
          )}
        </div>
      </div>
          <div className="flex items-center gap-1" style={{ color: themeStyles.textSecondary }}>
            {/* Call/Video buttons removed as requested */}

            <div className="relative">
              <button
                onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                className="p-2 rounded-full transition-colors"
                style={{ color: themeStyles.text }}
              >
                <MoreVertical size={20} />
              </button>
          {showDeleteMenu && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20 overflow-hidden"
              style={{
                border: `0.5px solid ${themeStyles.border}`,
                background: isDark
                  ? 'linear-gradient(rgba(26, 26, 26, 0.95), rgba(26, 26, 26, 0.95)) padding-box'
                  : themeStyles.cardBg,
                backdropFilter: 'blur(200px)',
              }}
            >
              <button
                onClick={() => {
                  setShowDeleteMenu(false);
                  setShowReportModal(true);
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-sm font-medium"
                style={{ color: themeStyles.text }}
              >
                <svg className="w-4 h-4" style={{ color: themeStyles.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report User
              </button>
              <button
                onClick={handleBlockUser}
                disabled={isBlocking}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-colors text-sm font-medium"
                style={{ color: themeStyles.text }}
              >
                {isBlocking ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: themeStyles.text }} />
                ) : (
                  <svg className="w-4 h-4" style={{ color: themeStyles.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth={2} />
                    <path strokeLinecap="round" strokeWidth={2} d="M5.5 5.5l13 13" />
                  </svg>
                )}
                {blockStatus?.iBlockedThem === true ? 'Unblock User' : 'Block User'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteMenu(false);
                  handleDeleteEntireChat();
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 rounded-b-lg transition-colors text-sm font-medium"
                style={{ color: themeStyles.text }}
              >
                 <svg className="w-4 h-4" style={{ color: themeStyles.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                 </svg>
                Delete Chat
              </button>
            </div>
          )}
      </div>
    </div>
  </div>
      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="shadow-2xl font-sans relative flex flex-col justify-between w-full max-w-[409px]"
            style={{
              minHeight: '256px',
              borderRadius: '16px',
              border: `0.4px solid ${themeStyles.border}`,
              padding: '24px',
              backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
              color: themeStyles.text
            }}
          >
            <div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: themeStyles.text }}>
                Block {currentChat.participant?.name}?
              </h3>
              <p className="text-[14px] leading-relaxed mb-4" style={{ color: themeStyles.textSecondary }}>
                This person won't be able to message or call you. They won't know you blocked them.
              </p>

              <div className="flex items-center gap-3 mb-1">
                <div className="w-5 h-5 rounded-full bg-[#8860D9] border border-[#8860D9] flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
                <span className="text-[14px]" style={{ color: themeStyles.text }}>Report {currentChat.participant?.name}?</span>
              </div>
              <p className="text-[12px] ml-8" style={{ color: themeStyles.textSecondary }}>
                The last 5 messages will be forwarded to check the behavior
              </p>
            </div>

            <div className="flex justify-end gap-[10px] mt-auto">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockAndReport(false);
                }}
                className="text-[14px] font-medium transition px-6 py-2"
                style={{ color: themeStyles.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBlockUser}
                disabled={isBlocking}
                style={{
                  width: '95px',
                  height: '40px',
                  borderRadius: '20px',
                  padding: '10px 24px',
                  background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                  color: 'white',
                }}
                className="text-[14px] font-medium flex items-center justify-center hover:opacity-90 transition"
              >
                {isBlocking ? <Loader2 className="animate-spin" size={16} /> : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock User Modal */}
      {showUnblockModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="shadow-2xl font-sans relative flex flex-col justify-between w-full max-w-[409px]"
            style={{
              minHeight: '180px',
              borderRadius: '16px',
              border: `0.4px solid ${themeStyles.border}`,
              padding: '24px',
              backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
              color: themeStyles.text
            }}
          >
            <div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: themeStyles.text }}>
                Unblock {currentChat.participant?.name}?
              </h3>
              <p className="text-[14px] leading-relaxed mb-4" style={{ color: themeStyles.textSecondary }}>
                {currentChat.participant?.name} will now be able to message you. They won't be notified that you unblocked them.
              </p>
            </div>

            <div className="flex justify-end gap-[10px] mt-auto">
              <button
                onClick={() => setShowUnblockModal(false)}
                className="text-[14px] font-medium transition px-6 py-2"
                style={{ color: themeStyles.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={confirmUnblockUser}
                disabled={isBlocking}
                style={{
                  width: '105px',
                  height: '40px',
                  borderRadius: '20px',
                  padding: '10px 24px',
                  background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                  color: 'white',
                }}
                className="text-[14px] font-medium flex items-center justify-center hover:opacity-90 transition"
              >
                {isBlocking ? <Loader2 className="animate-spin" size={16} /> : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Report Feedback Modal */}
      {reportFeedback && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="shadow-2xl font-sans relative flex flex-col justify-between w-full max-w-[409px]"
            style={{
              minHeight: '220px',
              borderRadius: '16px',
              border: `0.4px solid ${themeStyles.border}`,
              padding: '24px',
              backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
              color: themeStyles.text
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full border-2 border-[#8860D9] flex items-center justify-center mb-4">
                 <Check size={24} className="text-[#8860D9]" />
              </div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: themeStyles.text }}>
                {reportFeedback.title}
              </h3>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: themeStyles.textSecondary }}>
                {reportFeedback.message}
              </p>
            </div>

            <div className="flex justify-end gap-[10px] mt-auto">
              <button
                onClick={() => {
                  setReportFeedback(null);
                  setShowBlockModal(true);
                }}
                className="text-[14px] font-medium px-6 py-2 rounded-full transition hover:bg-red-500/10 text-red-500"
              >
                Block {currentChat.participant?.name?.split(' ')[0]}
              </button>
              <button
                onClick={() => setReportFeedback(null)}
                style={{
                  minWidth: '95px',
                  height: '40px',
                  borderRadius: '20px',
                  padding: '10px 24px',
                  background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                  color: 'white',
                }}
                className="text-[14px] font-medium flex items-center justify-center hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div
            className="rounded-[20px] p-6 max-w-md w-full mx-4 shadow-2xl relative overflow-hidden"
            style={{
              backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
              border: `1px solid ${themeStyles.border}`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold" style={{ color: themeStyles.text }}>
                Report {currentChat.participant?.name}?
              </h3>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                }}
                className="p-2 rounded-full transition-colors"
                style={{ color: themeStyles.textSecondary }}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm mb-6" style={{ color: themeStyles.textSecondary }}>
              The last 10 messages in this chat will be sent to check the behavior of this person.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.textSecondary }}>
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8860D9]"
                  style={{
                    backgroundColor: isDark ? '#0C1014' : themeStyles.hoverBg,
                    border: `1px solid ${themeStyles.border}`,
                    color: themeStyles.text
                  }}
                >
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="threat">Threat or Violence</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: themeStyles.textSecondary }}>
                  Reason (required)
                </label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please describe why you're reporting this user..."
                  className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8860D9] resize-none"
                  style={{
                    backgroundColor: isDark ? '#0C1014' : themeStyles.hoverBg,
                    border: `1px solid ${themeStyles.border}`,
                    color: themeStyles.text
                  }}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>
                  {reportReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-[10px] justify-end mt-6">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="text-[14px] font-medium transition px-6 py-2"
                  style={{ color: themeStyles.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportUser}
                  disabled={!reportReason.trim() || isReporting}
                  style={{
                    width: '95px',
                    height: '40px',
                    borderRadius: '20px',
                    padding: '10px 24px',
                    background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                    color: 'white',
                  }}
                  className="text-[14px] font-medium flex items-center justify-center hover:opacity-90 transition"
                >
                  {isReporting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Chat Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            className="shadow-2xl font-sans relative flex flex-col justify-between w-full max-w-[409px]"
            style={{
              minHeight: '180px',
              borderRadius: '16px',
              border: `0.4px solid ${themeStyles.border}`,
              padding: '24px',
              backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
              color: themeStyles.text
            }}
          >
            <div>
              <h3 className="text-[18px] font-semibold mb-2" style={{ color: themeStyles.text }}>
                Delete chat
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: themeStyles.textSecondary }}>
                Delete this chat? This will only delete it for you.
              </p>
            </div>

            <div className="flex justify-end gap-[10px] mt-auto">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[14px] font-medium transition px-6 py-2"
                style={{ color: themeStyles.textSecondary }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteChat}
                style={{
                  width: '95px',
                  height: '40px',
                  borderRadius: '20px',
                  padding: '10px 24px',
                  background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                  color: 'white',
                }}
                className="text-[14px] font-medium flex items-center justify-center hover:opacity-90 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}


      {isRequestRecipient && (
        <div
          className="p-4 border-b"
          style={{
            backgroundColor: isDark ? 'rgba(45, 47, 57, 0.4)' : themeStyles.hoverBg,
            borderColor: themeStyles.border
          }}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-center" style={{ color: themeStyles.textSecondary }}>
              {currentChat.participant?.name} wants to send you a message
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptRequest}
                disabled={isAccepting || isDeclining}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white font-bold rounded-full hover:opacity-90 disabled:opacity-50 transition shadow-sm"
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 font-bold rounded-full disabled:opacity-50 transition"
                style={{
                    backgroundColor: isDark ? '#262626' : '#EFEFEF',
                    color: isDark ? '#FFFFFF' : '#000000'
                }}
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
    className=" p-4 flex flex-wrap items-center justify-between gap-y-2 backdrop-blur-md transition-all duration-300"
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
      <div
        className="flex-1 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col"
        style={{ backgroundColor: themeStyles.sidebarBg }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#8860D9]" size={32} />
          </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4" style={{ color: themeStyles.textSecondary }}>
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
              <p className="font-semibold mb-2" style={{ color: themeStyles.text }}>
                {currentChat.isBlockedBy === 'them' ? 'Wie User' : currentChat.participant?.name}
              </p>
              <p className="text-sm text-center" style={{ color: themeStyles.textSecondary }}>No messages yet. Start the conversation!</p>
            </div>
          ) : (
          <div className="mt-auto space-y-4">
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
            <span
              className="text-[9px] px-3 py-1.5 rounded-lg backdrop-blur-md border uppercase tracking-widest shadow-2xl"
              style={{
                backgroundColor: isDark ? '#1A1A1A' : themeStyles.cardBg,
                color: isDark ? '#E5E7EB' : themeStyles.text,
                borderColor: themeStyles.border
              }}
            >
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
                <div
                  className="w-full h-full flex items-center justify-center text-[10px] text-white"
                  style={{ backgroundColor: isDark ? '#4B5563' : '#9CA3AF' }}
                >
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
                  background: isDark
                    ? 'linear-gradient(270deg, rgba(32, 32, 32, 0.6) -8.43%, rgba(96, 96, 96, 0.6) 100%)'
                    : themeStyles.cardBg
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
                <div
                  className="break-words text-[15px] leading-relaxed"
                  style={{ color: isSender ? '#fff' : themeStyles.text }}
                >
                  {message.content}
                </div>
              )}

              {/* Status area for both Voice and Text */}
              <div className="flex justify-end mt-1 items-center gap-1.5 opacity-80">
                <span
                  className="text-[10px]"
                  style={{ color: isSender ? 'rgba(255,255,255,0.8)' : themeStyles.textSecondary }}
                >
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
          </div>
        )}
      </div>
      {(currentChat.status === 'accepted' || currentChat.type === 'direct' || currentChat.type === 'request') ? (
        <>
          {currentChat.isBlocked || blockStatus?.iBlockedThem || blockStatus?.theyBlockedMe ? (
            <div
              className="p-4 border-t"
              style={{
                backgroundColor: themeStyles.sidebarBg,
                borderColor: themeStyles.border
              }}
            >
              <div
                className="flex items-center justify-center gap-2"
                style={{ color: themeStyles.textSecondary }}
              >
                <Ban size={20} />
                <span className="text-sm">
                  {currentChat.isBlockedBy === 'you' || blockStatus?.iBlockedThem
                    ? `You blocked ${currentChat.participant?.name}. They cannot send you messages.`
                    : 'You cannot message this user.'
                  }
                </span>
              </div>
            </div>
          ) : (

          <form onSubmit={handleSendMessage} className="p-4 flex items-center gap-2 relative flex-shrink-0"
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
    style={{ background: themeStyles.cardBg }}
  >
    {/* Emoji Picker Button */}
    <button
      type="button"
      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      className="transition"
      style={{ color: themeStyles.textSecondary }}
    >
      <Smile size={22} />
    </button>

    <input
      ref={inputRef}
      type="text"
      value={messageInput}
      onChange={(e) => handleTyping(e.target.value)}
      placeholder="Message"
      className="flex-1 bg-transparent border-none outline-none text-[16px] py-1.5"
      style={{
        color: themeStyles.text,
        // Use inline style for placeholder color by setting CSS custom property
      }}
      disabled={sending || sendingVoice || showVoiceRecorder}
    />


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
        <div
          className="p-4 border-t"
          style={{
            backgroundColor: themeStyles.sidebarBg,
            borderColor: themeStyles.border
          }}
        >
           <p className="text-center text-sm" style={{ color: themeStyles.textSecondary }}>You must accept the request to reply.</p>
        </div>
      )}
      <TopAlert
        message={toast?.message || ''}
        type={toast?.type}
        visible={!!toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
