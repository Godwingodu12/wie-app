'use client';

import { useEffect, useState, useRef } from 'react';
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
  markMessagesAsRead,blockUser, reportUser
} from '@/services/chatService';
import socketService from '@/services/socketService';
import { MessageCircle, Send, Loader2, ArrowLeft, MoreVertical, X, Check, CheckCheck } from 'lucide-react';
import Image from 'next/image';
import { ChatMessage } from '@/types/chat';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatWindowProps {
  onBack?: () => void;
}

export default function ChatWindow({ onBack }: ChatWindowProps) {
  const authState = useSelector((state: RootState) => state?.auth);
  const user = authState?.user;
  const { currentChat, messages, setMessages, addMessage, removeChat, setCurrentChat, acceptRequest, declineRequest,typingUsers } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [imageError, setImageError] = useState(false);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const hasMarkedAsRead = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const isOtherUserTyping = currentChat ? typingUsers[currentChat._id] || false : false;

  // Selection mode states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  // Accept/Decline states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0C1014]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8860D9]"></div>
      </div>
    );
  }
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'harassment' | 'spam' | 'inappropriate' | 'threat' | 'other'>('harassment');
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
// Add these handlers
const handleBlockUser = async () => {
  if (!currentChat?.participant?._id) return;
  
  if (!confirm(`Block ${currentChat.participant.name}? This will:\n• Remove them from your followers/following\n• Delete all chats\n• Prevent future messages`)) {
    return;
  }

  setIsBlocking(true);
  try {
    await blockUser(currentChat.participant._id);
    
    // Remove chat and go back
    removeChat(currentChat._id);
    setCurrentChat(null);
    if (onBack) onBack();
    
    alert('User blocked successfully');
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to block user');
  } finally {
    setIsBlocking(false);
    setShowDeleteMenu(false);
  }
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
      messageIds: messages.slice(-5).map(m => m._id) // Last 5 messages
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
  useEffect(() => {
    if (currentChat) {
      hasMarkedAsRead.current = false;
      markedAsReadRef.current.clear();
      loadMessages();
      socketService.joinChat(currentChat._id);

      return () => {
        socketService.leaveChat(currentChat._id);
      };
    }
  }, [currentChat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Mark messages as read ONCE when messages are loaded
  useEffect(() => {
    if (!currentChat?._id || !user?.id || loading || hasMarkedAsRead.current) return;
    
    if (messages.length === 0) return;
    
    const unreadMessages = messages.filter(
      (msg) => msg.sender !== user.id && !msg.readBy.includes(user.id)
    );
    
    if (unreadMessages.length === 0) return;
    
    // Mark that we've attempted to mark as read
    hasMarkedAsRead.current = true;
    
    // Call API once
    markMessagesAsRead(currentChat._id).catch(() => {
      hasMarkedAsRead.current = false;
    });
  }, [currentChat?._id, user?.id, loading, messages.length]);

  const loadMessages = async () => {
    if (!currentChat) return;
    setLoading(true);
    hasMarkedAsRead.current = false;
    
    try {
      const response = await getWieChatMessages(currentChat._id);
      if (response.success) {
        setMessages(response.messages || []);
        
        // Update current chat with fresh participant data
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
            }
          };
          setCurrentChat(updatedChat);
        }
      }
    } catch (error) {
      // Silent error
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
    } catch (error) {
      setMessageInput(content);
    } finally {
      setSending(false);
    }
  };
  const handleTyping = (value: string) => {
      setMessageInput(value);

      if (!currentChat) return;

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator
      socketService.sendTyping(currentChat._id, true);

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(currentChat._id, false);
      }, 2000);
  };
  useEffect(() => {
    return () => {
      if (currentChat && typingTimeoutRef.current) {
        socketService.sendTyping(currentChat._id, false);
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentChat?._id]);
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

  const isRequestRecipient = currentChat?.type === 'request' && 
                            currentChat?.status === 'pending' && 
                            messages.length > 0 && 
                            messages[0]?.sender !== user?.id;

  const getMessageStatus = (message: ChatMessage) => {
    if (message.sender !== user?.id) return null;

    const isRead = message.readBy && message.readBy.length > 1;
    const isDelivered = message.deliveredTo && message.deliveredTo.length > 0;

    if (isRead) {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else if (isDelivered) {
      return <CheckCheck size={16} className="text-gray-400" />;
    } else {
      return <Check size={16} className="text-gray-400" />;
    }
  };

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
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#2D2F39] flex items-center justify-between bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={handleBackClick} className="lg:hidden p-2 hover:bg-[#2D2F39] rounded-full text-white">
              <ArrowLeft size={20} />
            </button>
          )}
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate text-white">{currentChat.participant?.name}</p>
              {currentChat.participant?.is_verified && (
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {formatLastSeenTime(lastSeenTime, isOnline)}
            </p>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                Block User
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
        <div className="p-3 bg-[#2D2F39] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={exitSelectionMode} className="text-white">
              <X size={20} />
            </button>
            <span className="text-white font-semibold">{selectedMessages.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteForMe}
              disabled={selectedMessages.size === 0}
              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Delete for Me
            </button>
            <button
              onClick={handleDeleteForEveryone}
              disabled={selectedMessages.size === 0}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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
              {profilePictureUrl && !imageError ? (
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
            <p className="text-white font-semibold mb-2">{currentChat.participant?.name}</p>
            <p className="text-sm text-center">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isSender = message.sender === user?.id;
              const isSelected = selectedMessages.has(message._id);
              
              return (
                <div
                  key={message._id}
                  onClick={() => selectionMode && toggleMessageSelection(message._id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleMessageLongPress(message._id);
                  }}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'} ${
                    selectionMode ? 'cursor-pointer' : ''
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isSelected ? 'ring-2 ring-[#8860D9]' : ''
                    } ${
                      isSender
                        ? 'bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white'
                        : 'bg-[#1a1a1a] text-white border border-[#2D2F39]'
                    }`}
                  >
                    <p className="break-words">
                      {message.deletedForEveryone ? (
                        <span className="italic text-gray-300">This message was deleted</span>
                      ) : (
                        message.content
                      )}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className={`text-xs ${isSender ? 'text-blue-100' : 'text-gray-400'}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                      {isSender && !message.deletedForEveryone && (
                        <span className="ml-1">
                          {getMessageStatus(message)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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

      {/* Input - Show for all accepted chats and for senders of pending requests */}
      {(currentChat.status === 'accepted' || currentChat.type === 'direct' || !isRequestRecipient) ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[#2D2F39] bg-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-[#0C1014] border border-[#2D2F39] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8860D9] text-white placeholder-gray-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sending}
              className="p-3 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {sending ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-[#2D2F39] bg-[#1a1a1a] text-center text-gray-400 text-sm">
          Accept the message request to reply
        </div>
      )}
    </div>
  );
}