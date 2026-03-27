'use client';
import { useEffect, useState, useRef, Fragment } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
import { useRouter } from 'next/navigation'; 
import { useChat } from '@/context/ChatContext';
import {
  getWieChatMessages,sendWieMessage,deleteMessagesForMe,deleteMessagesForEveryone,
  deleteChatForMe,acceptMessageRequest,declineMessageRequest,markMessagesAsRead,blockUser,unblockUser,reportUser,
  checkBlockStatus,sendImageMessage,sendVideoMessage,sendAudioMessage,sendDocumentMessage,sendLocationMessage,
  sendProfileMessage,sendEventMessage,markMediaViewed,
} from '@/services/chatService';
import socketService from '@/services/socketService';
import EmojiPicker from '@/components/chat/EmojiPicker';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import VoiceMessageDisplay from '@/components/chat/VoiceMessageDisplay';
import MediaPickerModal from '@/components/chat/Mediapickermodal';           
import LocationPickerModal from '@/components/chat/Locationpickermodal';    
import ProfilePickerModal from '@/components/chat/Profilepickermodal';       
import EventPickerModal from '@/components/chat/Eventpickermodal';              
import {
  isMediaMessage,
  renderMediaMessage,
  ViewModeSelectorSheet,
  CaptionSheet,
  type MediaViewMode
} from '@/components/chat/Mediamessagerenderer';
import { MessageCircle, Send, Loader2, ArrowLeft, MoreVertical, X, Check, CheckCheck, Mic, Smile, Ban, Paperclip } from 'lucide-react';
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
  const { currentChat, messages, setMessages, addMessage,replaceMessage, removeMessage, removeChat, setCurrentChat, acceptRequest, declineRequest, typingUsers, updateUnreadCount, loadChatById, updateChatList,clearRequestCount } = useChat();
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
  const isInitialLoad = useRef(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const hasMarkedAsRead = useRef(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [showMediaPicker, setShowMediaPicker]= useState(false);    
  const [showLocationModal, setShowLocationModal]= useState(false);    
  const [showProfileModal, setShowProfileModal]= useState(false);      
  const [showEventModal, setShowEventModal]= useState(false);    
  const [isSendingMedia, setIsSendingMedia]= useState(false); 
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[] | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [pendingDocFile, setPendingDocFile] = useState<File | null>(null);
  const [pendingAudioFile, setPendingAudioFile] = useState<File | null>(null);
  const [mediaViewMode, setMediaViewMode] = useState<'view_once' | 'allow_replay' | 'keep'>('keep');
  const [replayedMessages, setReplayedMessages] = useState<Set<string>>(new Set());
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'harassment' | 'spam' | 'inappropriate' | 'threat' | 'other'>('harassment');
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isUploading,     setIsUploading]     = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState<Record<string, number>>({});
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFetchingMore = useRef(false);
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

  const handleGalleryFiles = (files: File[]) => {
    if (!currentChat || isSendingMedia) return;
    setPendingGalleryFiles(files);
    setMediaViewMode('keep');
  };

  const confirmGalleryWithMode = async (viewMode: MediaViewMode, caption?: string) => {
    if (!pendingGalleryFiles || !currentChat || isSendingMedia) return;
    const files = pendingGalleryFiles;
    setPendingGalleryFiles(null);
    setPendingCaption('');
    setIsSendingMedia(true);

    const images = files.filter(f => f.type.startsWith('image/'));
    const videos = files.filter(f => f.type.startsWith('video/'));

    const tempImageId = images.length > 0 ? `temp_img_${Date.now()}` : null;
    const tempVideoIds: string[] = videos.map((_, i) => `temp_vid_${Date.now()}_${i}`);

    if (images.length > 0 && tempImageId) {
      const localPreviews = images.map(f => URL.createObjectURL(f));
      addMessage({
        _id: tempImageId,
        sender: user?.id || '',
        messageType: 'image',
        content: caption?.trim() ? caption.trim() : (viewMode !== 'keep' ? '📷 Photo' : '📷 Image'),
        chat_images: localPreviews.map(url => ({ url, viewMode, viewedBy: [] as string[] })),
        _localPreviews: localPreviews,
        _isOptimistic: true,
        viewMode,
        timestamp: new Date().toISOString(),
      });
    }

    videos.forEach((f, i) => {
      addMessage({
        _id: tempVideoIds[i],
        sender: user?.id || '',
        messageType: 'video',
        content: caption?.trim() ? caption.trim() : '🎥 Video',
        chat_videos: [{ url: URL.createObjectURL(f), viewMode, viewedBy: [] as string[] }],
        _isOptimistic: true,
        viewMode,
        timestamp: new Date().toISOString(),
      });
    });

    try {
      if (images.length > 0 && tempImageId) {
        const imageFormData = new FormData();
        images.forEach(f => imageFormData.append('images', f));
        if (caption?.trim()) imageFormData.append('caption', caption.trim());
        const response = await sendImageMessage(
          currentChat._id, imageFormData,
          (percent) => setUploadProgress(prev => ({ ...prev, [tempImageId]: percent })),
          viewMode
        );
        setUploadProgress(prev => { const n = { ...prev }; delete n[tempImageId]; return n; });
        if (response.success && response.message) {
          replaceOrAddMessage(tempImageId, { ...response.message, _isOptimistic: false });
        }
      }

      for (let i = 0; i < videos.length; i++) {
        const videoFormData = new FormData();
        videoFormData.append('video', videos[i]);
        if (caption?.trim()) videoFormData.append('caption', caption.trim());
        const res = await sendVideoMessage(
          currentChat._id, videoFormData,
          (percent) => setUploadProgress(prev => ({ ...prev, [tempVideoIds[i]]: percent })),
          viewMode
        );
        setUploadProgress(prev => { const n = { ...prev }; delete n[tempVideoIds[i]]; return n; });
        if (res.success && res.message) {
          replaceOrAddMessage(tempVideoIds[i], { ...res.message, _isOptimistic: false });
        }
      }
    } catch (err: any) {
      if (tempImageId) removeOptimisticMessage(tempImageId);
      tempVideoIds.forEach(id => removeOptimisticMessage(id));
      setToast({ message: err?.response?.data?.message || 'Failed to send media', type: 'error' });
    } finally {
      setIsSendingMedia(false);
    }
  };   

  const handleMarkMediaViewed = async (messageId: string, finalView: boolean = true) => {
    if (!currentChat) return;
    try {
      await markMediaViewed(currentChat._id, messageId, finalView);
      // Update local message so viewedBy reflects immediately
      setMessages(prev =>
        prev.map(m => {
          if (m._id !== messageId) return m;
          const addViewer = (items: any[]) =>
            (items || []).map(item => ({
              ...item,
              viewedBy: (item.viewedBy || []).includes(user?.id || '')
                ? item.viewedBy || []
                : (item.viewedBy || []).concat(user?.id || ''),
            }));
          return {
            ...m,
            chat_images: m.chat_images ? addViewer(m.chat_images) : m.chat_images,
            chat_videos: m.chat_videos ? addViewer(m.chat_videos) : m.chat_videos,
          };
        })
      );
    } catch (e) {
      console.error('markMediaViewed failed:', e);
    }
  };

  const replaceOrAddMessage = (tempId: string | null, realMessage: any) => {   
    if (tempId && typeof replaceMessage === 'function') {                       
      replaceMessage(tempId, realMessage);                                      
    } else {                                                                    
      addMessage(realMessage);                                                  
    }                                                                          
  };                                                                            
  const removeOptimisticMessage = (tempId: string) => {                        
    if (typeof removeMessage === 'function') {                                  
      removeMessage(tempId);                                                    
    }                                                                           
  }; 

  const handleDocumentFile = async (file: File, caption?: string) => {                           
    if (!currentChat || isSendingMedia) return;                                 
    setIsSendingMedia(true);
    const tempId = `temp_doc_${Date.now()}`;
    const ext    = file.name.split('.').pop()?.toLowerCase() || 'file';

    addMessage({
      _id:         tempId,
      sender:      user?.id || '',
      messageType: 'file',
      content:     caption?.trim() ? caption.trim() : `📎 ${file.name}`,
      chat_files:  [{ url: URL.createObjectURL(file), name: file.name, size: file.size, extension: ext }],
      _isOptimistic: true,
      timestamp:   new Date().toISOString(),
    });

    try {
          const docFormData = new FormData();
          docFormData.append('document', file);

          if (caption?.trim()) docFormData.append('caption', caption.trim());
          const res = await sendDocumentMessage(
            currentChat._id,
            docFormData,
            (percent) => setUploadProgress(prev => ({ ...prev, [tempId]: percent }))
          );
          setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      if (res.success && res.message) {
        replaceOrAddMessage(tempId, {
          ...res.message,
          chat_files:  res.message.chat_files || [],
          _isOptimistic: false,
        });
      }
    } catch (err: any) {
      removeOptimisticMessage(tempId);
      setToast({ message: err?.response?.data?.message || 'Failed to send document', type: 'error' });
    } finally {
      setIsSendingMedia(false);
    }
  };                                                                            

  const handleAudioFile = async (file: File, caption?: string) => {                                
    if (!currentChat || isSendingMedia) return;                                 
    setIsSendingMedia(true);                                                   
    const tempId = `temp_audio_${Date.now()}`;

    addMessage({
      _id:         tempId,
      sender:      user?.id || '',
      messageType: 'audio',
      content:     '🎵 Audio',
      chat_audio:  [{ url: URL.createObjectURL(file), originalName: file.name, size: file.size }],
      _isOptimistic: true,
      timestamp:   new Date().toISOString(),
    });

    try {
          const audioFormData = new FormData();
          audioFormData.append('audio', file);

          if (caption?.trim()) audioFormData.append('caption', caption.trim());
          const res = await sendAudioMessage(
            currentChat._id,
            audioFormData,
            (percent) => setUploadProgress(prev => ({ ...prev, [tempId]: percent }))
          );
          setUploadProgress(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      if (res.success && res.message) {
        replaceOrAddMessage(tempId, {
          ...res.message,
          chat_audio: res.message.chat_audio || [],
          _isOptimistic: false,
        });
      }
    } catch (err: any) {
      removeOptimisticMessage(tempId);
      setToast({ message: err?.response?.data?.message || 'Failed to send audio', type: 'error' });
    } finally {
      setIsSendingMedia(false);
    }
  };                                                                          

  const handleLocationSend = async (data: {                                  
    latitude: number; longitude: number;                                      
    address?: string; name?: string;                                          
    isLive: boolean; liveExpiry?: string;                                     
  }) => {                                                                     
    if (!currentChat || isSendingMedia) return;                               
    setIsSendingMedia(true);                                                  
    try {                                                                     
      const res = await sendLocationMessage(                                  
        currentChat._id,                                                      
        data.latitude,                                                        
        data.longitude,                                                       
        data.address                                                          
      );                                                                      
      if (res.success) addMessage(res.message);                               
    } catch (err: any) {                                                      
      setToast({ message: 'Failed to send location', type: 'error' });        
    } finally {                                                               
      setIsSendingMedia(false);                                               
    }                                                                        
  };                                                                          

  const handleProfileSend = async (profile: {                                
    profileUserId: string; name: string; username: string;                    
    avatar?: string; bio?: string; is_verified: boolean;                      
  }) => {                                                                     
    if (!currentChat || isSendingMedia) return;                               
    setIsSendingMedia(true);                                                  
    try {            
      const res = await sendProfileMessage(currentChat._id, profile.profileUserId, {
                        name:        profile.name,
                        username:    profile.username,
                        avatar:      profile.avatar,
                        bio:         profile.bio,
                        is_verified: profile.is_verified,
                      });                                                         
      if (res.success) addMessage(res.message);                               
    } catch (err: any) {                                                     
      setToast({ message: 'Failed to send profile', type: 'error' });         
    } finally {                                                               
      setIsSendingMedia(false);                                               
    }                                                                         
  };                                                                          

  const handleEventSend = async (event: {
      eventId: string; title: string; description?: string;
      startDate?: string; endDate?: string; venue?: string;
      image?: string; ticketUrl?: string;
    }) => {
      if (!currentChat || isSendingMedia) return;
      setIsSendingMedia(true);
      try {
        const res = await sendEventMessage(currentChat._id, event.eventId, {
          title:       event.title,
          description: event.description,
          startDate:   event.startDate,
          endDate:     event.endDate,
          venue:       event.venue,
          image:       event.image,
          ticketUrl:   event.ticketUrl,
        });
        if (res.success) addMessage(res.message);                               
    } catch (err: any) {                                                      
      setToast({ message: 'Failed to send event', type: 'error' });           
    } finally {                                                               
      setIsSendingMedia(false);                                               
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
  const getReplyPreviewText = (msg: ChatMessage): string => {
    if (!msg) return '';
    if (msg.deletedForEveryone) return 'Deleted message';
    switch (msg.messageType) {
      case 'voice': return '🎤 Voice message';
      case 'image': return '📷 Photo';
      case 'video': return '🎥 Video';
      case 'audio': return '🎵 Audio';
      case 'file':  return `📎 ${(msg as any).chat_files?.[0]?.name || 'File'}`;
      case 'location': return '📍 Location';
      case 'profile':  return '👤 Profile';
      case 'event':    return '🎟️ Event';
      default: return msg.content || '';
    }
  };

  const loadMessages = async (pageNum = 1, prepend = false) => {
    if (!currentChat) return;

    if (pageNum === 1) {
      setLoading(true);
      hasMarkedAsRead.current = false;
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getWieChatMessages(currentChat._id, pageNum, 50);
      if (response.success) {
        const parsedMessages = (response.messages || []).map((msg: any): ChatMessage => {
          const base = { ...msg };

          // Voice message parsing
          if (base.messageType === 'voice' && base.voiceData) return base;
          if (base.content?.startsWith('{') && base.content.includes('"type":"voice"')) {
            try {
              const parsed = JSON.parse(base.content);
              if (parsed.type === 'voice' && parsed.audio && parsed.duration) {
                return {
                  ...base,
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

          // ── Flux / system message type normalization ──
          // messageType may already be correct (stored correctly in DB after the model fix)
          if (['flux_share', 'flux_mention', 'flux_remention'].includes(base.messageType)) {
            return base;
          }
          // Fallback: detect from JSON content for legacy messages
          if (base.content?.startsWith('{')) {
            try {
              const parsed = JSON.parse(base.content);
              if (parsed?.type === 'flux_share')     return { ...base, messageType: 'flux_share'     };
              if (parsed?.type === 'flux_mention')   return { ...base, messageType: 'flux_mention'   };
              if (parsed?.type === 'flux_remention') return { ...base, messageType: 'flux_remention' };
              if (parsed?.type === 'flux_reply')     return { ...base, messageType: 'flux_reply'     };
            } catch {}
          }

          return base;
        });

        setHasMore(response.hasMore ?? false);

        if (prepend) {
          // Preserve scroll position when prepending older messages
          const container = messagesContainerRef.current;
          const prevScrollHeight = container?.scrollHeight ?? 0;

          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m._id));
            const newOnes = parsedMessages.filter((m: ChatMessage) => !existingIds.has(m._id));
            return [...newOnes, ...prev];
          });

          // Restore scroll so user stays at same position
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        } else {
          setMessages(parsedMessages);
        }

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
      setLoadingMore(false);
      isFetchingMore.current = false;
    }
  };
  
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChat || sending) return;
    const content = messageInput.trim();
    const isFirstMessage = messages.length === 0;
    const replyData = replyingTo ? {
      messageId: replyingTo._id,
      sender: replyingTo.sender,
      content: getReplyPreviewText(replyingTo),
      messageType: replyingTo.messageType || 'text',
    } : undefined;

    setMessageInput('');
    setReplyingTo(null);
    setSending(true);

    try {
      const response = await sendWieMessage(currentChat._id, content, replyData);
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
  const handleReplyToMessage = (message: ChatMessage) => {
    if (message.deletedForEveryone) return;
    setReplyingTo(message);
    setSelectionMode(false);
    setSelectedMessages(new Set());
    // Focus input
    setTimeout(() => inputRef.current?.focus(), 100);
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
    if ((message as any)._isOptimistic) {
      return (
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    }

    const isRead = message.readBy && message.readBy.length > 1 &&
                  message.readBy.some(id => id !== user?.id);
    const isDelivered = message.deliveredTo && message.deliveredTo.length > 0;

    if (isRead) {
      return (
        <div className="flex items-center gap-1">
          <CheckCheck size={15} style={{ color: '#8860D9' }} />
          <span className="text-[10px] font-medium" style={{ color: '#8860D9' }}>Seen</span>
        </div>
      );
    } else if (isDelivered) {
      return <CheckCheck size={15} className="text-white" />;
    } else {
      return <Check size={15} className="text-white" />;
    }
  };

  useEffect(() => {
    if (currentChat) {
      setIsTransitioning(true);
      hasMarkedAsRead.current = false;
      markedAsReadRef.current.clear();
      isInitialLoad.current = true;
      setPage(1);
      setHasMore(false);

      socketService.joinChat(currentChat._id);
      loadMessages(1, false);
      
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
    if (messages.length === 0) return;

    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom('instant');
        });
      });
    } else {
      scrollToBottom('smooth');
    }
  }, [messages.length]);


  useEffect(() => {
  if (!currentChat?._id || !user?.id || loading || hasMarkedAsRead.current) return;
  if (messages.length === 0) return;

  const unreadMessages = messages.filter(
    (msg) => msg.sender !== user.id && !msg.readBy?.includes(user.id)
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
        onClick={() => {
          if (selectedMessages.size === 1) {
            const msgId = Array.from(selectedMessages)[0];
            const msg = messages.find(m => m._id === msgId);
            if (msg) handleReplyToMessage(msg);
          }
        }}
        disabled={selectedMessages.size !== 1}
        className="px-4 py-1.5 text-xs font-medium bg-white/5 text-white rounded-full hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
      >
        Reply
      </button>
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
        ref={messagesContainerRef}
        onScroll={() => {
          const el = messagesContainerRef.current;
          if (!el) return;
          const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
          setShowScrollBtn(distFromBottom > 120);

          if (el.scrollTop < 80 && hasMore && !isFetchingMore.current && !loadingMore) {
            isFetchingMore.current = true;
            const nextPage = page + 1;
            setPage(nextPage);
            loadMessages(nextPage, true);
          }
        }}
        className="flex-1 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col relative"
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
            {loadingMore && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="animate-spin text-[#8860D9]" size={22} />
                <span className="ml-2 text-xs" style={{ color: themeStyles.textSecondary }}>
                  Loading...
                </span>
              </div>
            )}
            {messages.map((message, index) => {
              const isSender = message.sender === user?.id;
              const isSelected = selectedMessages.has(message._id);
              const isDeleted = message.deletedForEveryone;
              const isVoice = message.messageType === 'voice' && message.voiceData?.audioBase64;

              const messageDate = new Date(message.timestamp);
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevMessageDate = prevMessage ? new Date(prevMessage.timestamp) : null;

              const showDateSeparator = !prevMessageDate ||
                messageDate.toDateString() !== prevMessageDate.toDateString();

              const getDateLabel = (date: Date) => {
                if (isToday(date)) return 'Today';
                if (isYesterday(date)) return 'Yesterday';
                return format(date, 'MMMM d, yyyy');
              };

              const isLastInGroup = index === messages.length - 1 ||
                messages[index + 1].sender !== message.sender;

              return (
                <Fragment key={message._id}>
                  {showDateSeparator && (
                    <div className="relative w-full flex justify-center h-10 my-4 pointer-events-none z-20">
                      <div className="sticky top-2 transition-opacity duration-500 ease-in-out">
                        <span
                          className="text-[9px] px-3 py-1.5 rounded-lg backdrop-blur-md border uppercase tracking-widest shadow-2xl"
                          style={{
                            backgroundColor: isDark ? '#1A1A1A' : themeStyles.cardBg,
                            color:           isDark ? '#E5E7EB' : themeStyles.text,
                            borderColor:     themeStyles.border,
                          }}
                        >
                          {getDateLabel(messageDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message Row */}
                  <div
                    id={`msg-${message._id}`}
                    onClick={() => !isDeleted && selectionMode && toggleMessageSelection(message._id)}
                    onContextMenu={(e) => {
                      if (isDeleted) return;
                      e.preventDefault();
                      handleMessageLongPress(message._id);
                    }}
                    onDoubleClick={() => {
                      if (!isDeleted) handleReplyToMessage(message);
                    }}
                    className={`flex items-end gap-2 mb-2 px-2 rounded-lg transition-colors duration-150 ${
                      isSender ? 'justify-end' : 'justify-start'
                    } ${selectionMode && !isDeleted ? 'cursor-pointer' : ''}`}
                    style={{
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(136, 96, 217, 0.18)'
                          : 'rgba(84, 148, 255, 0.12)'
                        : 'transparent',
                      marginLeft:  '-8px',
                      marginRight: '-8px',
                      paddingLeft:  '8px',
                      paddingRight: '8px',
                    }}
                  >
                    {/* Received Message Avatar */}
                    {!isSender && (
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mb-1">
                        {isLastInGroup ? (
                          profilePictureUrl && !imageError ? (
                            <Image
                              src={profilePictureUrl}
                              alt="Avatar"
                              width={32}
                              height={32}
                              className="object-cover"
                            />
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
                        isVoice && !isDeleted ? 'px-3 py-3' : 'px-4 py-2'
                      }`}
                      style={
                        isSender
                          ? { background: isDeleted ? 'rgba(50, 50, 50, 0.4)' : 'rgb(84, 148, 255)' }
                          : {
                              background: isDark
                                ? 'linear-gradient(270deg, rgba(32, 32, 32, 0.6) -8.43%, rgba(96, 96, 96, 0.6) 100%)'
                                : themeStyles.cardBg,
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

                          {/* ── Quoted reply ── */}
                          {(message as any).replyTo && (
                            <div
                              className="flex gap-2 mb-2 rounded-xl px-3 py-2 cursor-pointer"
                              style={{
                                backgroundColor: isSender
                                  ? 'rgba(0,0,0,0.18)'
                                  : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                borderLeft: '3px solid #8860D9',
                              }}
                              onClick={() => {
                                const el = document.getElementById(
                                  `msg-${(message as any).replyTo.messageId}`
                                );
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  el.style.transition = 'background 0.3s';
                                  el.style.background = isDark
                                    ? 'rgba(136,96,217,0.25)'
                                    : 'rgba(136,96,217,0.15)';
                                  setTimeout(() => { el.style.background = 'transparent'; }, 1200);
                                }
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-[11px] font-semibold mb-0.5"
                                  style={{ color: '#8860D9' }}
                                >
                                  {(message as any).replyTo.sender === user?.id
                                    ? 'You'
                                    : currentChat.participant?.name}
                                </p>
                                <p
                                  className="text-[12px] truncate"
                                  style={{
                                    color: isSender
                                      ? 'rgba(255,255,255,0.7)'
                                      : themeStyles.textSecondary,
                                  }}
                                >
                                  {(message as any).replyTo.content}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* ── Message content switch ── */}

                          {/* Voice */}
                          {isVoice ? (
                            <VoiceMessageDisplay
                              audioURL={message.voiceData!.audioBase64}
                              duration={message.voiceData!.duration}
                              isSender={isSender}
                              timestamp={message.timestamp}
                            />

                          /* Media (image / video / file / audio / location / profile / event) */
                          ) : isMediaMessage(message) ? (
                            renderMediaMessage(message, isSender, themeStyles, isDark, {
                              uploadProgress: message._isOptimistic
                                ? uploadProgress[message._id as string]
                                : undefined,
                              currentUserId: user?.id,
                              chatId:        currentChat._id,
                              onMarkViewed:  handleMarkMediaViewed,
                              replayedSet:   replayedMessages,
                              addToReplayed: (id: string) =>
                                setReplayedMessages(prev => {
                                  const next = new Set<string>();
                                  prev.forEach(v => next.add(v));
                                  next.add(id);
                                  return next;
                                }),
                            })
                            ) : (message.messageType as string) === 'flux_share' ? (
                            (() => {
                              // Parse meta — content may be JSON string or already an object
                              let meta: any = {};
                              try {
                                meta = typeof message.content === 'string' && message.content.startsWith('{')
                                  ? JSON.parse(message.content)
                                  : {};
                              } catch { meta = {}; }

                              // Fallback to metadata_json if available
                              if (!meta.fluxId && (message as any).metadata) {
                                try {
                                  const md = typeof (message as any).metadata === 'string'
                                    ? JSON.parse((message as any).metadata)
                                    : (message as any).metadata;
                                  meta = { ...md, ...meta };
                                } catch {}
                              }

                              const fluxId       = meta.fluxId;
                              const fluxOwnerId  = meta.fluxOwnerId;
                              const thumbUrl     = meta.fluxMediaUrl;
                              const isVideo      = meta.fluxMediaType === 'video';
                              const isSenderView = message.sender === user?.id;
                              const sharerName   = meta.sharerName ?? currentChat.participant?.name ?? 'Someone';
                              const label        = isSenderView
                                ? (meta.senderLabel ?? 'You shared a Flux')
                                : `${sharerName} shared a Flux`;

                              const handleViewFlux = () => {
                                if (!fluxId) return;
                                const url = fluxOwnerId
                                  ? `/post/flux-view?fluxId=${fluxId}&userId=${fluxOwnerId}`
                                  : `/post/flux-view?fluxId=${fluxId}`;
                                router.push(url);
                              };

                              return (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    onDoubleClick={(e) => e.stopPropagation()}
                                    onContextMenu={(e) => e.stopPropagation()}
                                    style={{
                                      borderRadius: 12,
                                      overflow:     'hidden',
                                      border:       '1px solid rgba(136,96,217,0.35)',
                                      maxWidth:     220,
                                      background:   isSenderView
                                        ? 'rgba(0,0,0,0.25)'
                                        : isDark
                                          ? 'rgba(255,255,255,0.06)'
                                          : 'rgba(0,0,0,0.04)',
                                    }}
                                  >
                                  {/* Thumbnail */}
                                  {thumbUrl ? (
                                    <div style={{ position: 'relative', width: '100%', height: 120, overflow: 'hidden' }}>
                                      {isVideo ? (
                                        <video src={thumbUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                                      ) : (
                                        <img src={thumbUrl} alt="flux preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      )}
                                      <div style={{
                                        position: 'absolute', top: 6, left: 6,
                                        background: 'rgba(136,96,217,0.85)', borderRadius: 8,
                                        padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 600,
                                      }}>
                                        ↗ Shared Flux
                                      </div>
                                    </div>
                                  ) : (
                                    /* No thumbnail fallback */
                                    <div style={{
                                      width: '100%', height: 80,
                                      background: 'linear-gradient(135deg,#2a1a4e,#4a2080)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <span style={{ fontSize: 28 }}>📖</span>
                                    </div>
                                  )}

                                  {/* Label + View button */}
                                  <div style={{ padding: '8px 10px 10px' }}>
                                    <p style={{
                                      color: isSenderView ? '#fff' : themeStyles.text,
                                      fontSize: 12, fontWeight: 500, marginBottom: 8, lineHeight: 1.4,
                                    }}>
                                      {label}
                                    </p>
                                    <button
                                      onClick={handleViewFlux}
                                      disabled={!fluxId}
                                      style={{
                                        width: '100%', padding: '6px 0', borderRadius: 20,
                                        border: isSenderView
                                          ? '1px solid rgba(255,255,255,0.35)'
                                          : isDark
                                            ? '1px solid rgba(255,255,255,0.2)'
                                            : '1px solid rgba(0,0,0,0.15)',
                                        background: isSenderView
                                          ? 'rgba(255,255,255,0.18)'
                                          : isDark
                                            ? 'rgba(255,255,255,0.1)'
                                            : 'rgba(0,0,0,0.06)',
                                        color: isSenderView
                                          ? '#fff'
                                          : isDark ? '#fff' : '#111',
                                        fontSize: 12, fontWeight: 600,
                                        cursor: fluxId ? 'pointer' : 'default',
                                        opacity: fluxId ? 1 : 0.45,
                                      }}
                                    >
                                      {fluxId ? 'View Flux' : 'Flux expired'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })()
                            ) : (message.messageType as string) === 'flux_reply' ? (
                            (() => {
                              let meta: any = {};
                              try {
                                meta = typeof message.content === 'string' && message.content.startsWith('{')
                                  ? JSON.parse(message.content)
                                  : {};
                              } catch {}

                              const fluxId      = meta.fluxId;
                              const fluxOwnerId = meta.fluxOwnerId;
                              const thumbUrl    = meta.fluxMediaUrl;
                              const isVideo     = meta.fluxMediaType === 'video';
                              const textBg      = meta.fluxTextBg ?? "linear-gradient(135deg,#1a1a2e,#2d1b4e)";
                              const replyText   = meta.text ?? "";

                              const handleViewFlux = () => {
                                if (!fluxId) return;
                                const url = fluxOwnerId
                                  ? `/post/flux-view?fluxId=${fluxId}&userId=${fluxOwnerId}`
                                  : `/post/flux-view?fluxId=${fluxId}`;
                                router.push(url);
                              };

                              return (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  onDoubleClick={(e) => e.stopPropagation()}
                                  onContextMenu={(e) => e.stopPropagation()}
                                  style={{
                                    borderRadius: 12,
                                    overflow:     "hidden",
                                    border:       "1px solid rgba(136,96,217,0.35)",
                                    maxWidth:     240,
                                    background:   isSender
                                      ? "rgba(0,0,0,0.25)"
                                      : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                  }}
                                >
                                  {/* Flux preview */}
                                  <div
                                    onClick={handleViewFlux}
                                    style={{
                                      position: "relative",
                                      width:    "100%",
                                      height:   130,
                                      overflow: "hidden",
                                      cursor:   fluxId ? "pointer" : "default",
                                    }}
                                  >
                                    {thumbUrl ? (
                                      isVideo ? (
                                        <video src={thumbUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
                                      ) : (
                                        <img src={thumbUrl} alt="flux" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      )
                                    ) : (
                                      <div style={{ width: "100%", height: "100%", background: textBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ fontSize: 24 }}>📖</span>
                                      </div>
                                    )}
                                    {/* Badge */}
                                    <div style={{
                                      position:     "absolute",
                                      top:           6, left: 6,
                                      background:   "rgba(136,96,217,0.85)",
                                      borderRadius:  8,
                                      padding:      "2px 8px",
                                      fontSize:      10,
                                      color:         "#fff",
                                      fontWeight:    600,
                                    }}>
                                      ↩ Flux Reply
                                    </div>
                                  </div>

                                  {/* Reply text */}
                                  <div style={{ padding: "8px 10px 10px" }}>
                                    <p style={{
                                      color:      isSender ? "#fff" : themeStyles.text,
                                      fontSize:   13,
                                      lineHeight: 1.4,
                                      wordBreak:  "break-word",
                                    }}>
                                      {replyText}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()
                            /*  Flux Mention / Re-mention  */
                            ) : (message.messageType as string) === 'flux_mention' ||
                                (message.messageType as string) === 'flux_remention' ? (
                              (() => {
                                let meta: any = {};
                                try { meta = JSON.parse(message.content); } catch {}

                                const isRemention  = message.messageType === 'flux_remention';
                                const isSenderView = message.sender === user?.id;
                                const label        = isSenderView
                                  ? (meta.senderLabel ?? (isRemention
                                      ? 'You added a mentioned Flux'
                                      : 'You mentioned a Flux'))
                                  : (meta.text ?? (isRemention
                                      ? `${meta.reMentionerName ?? 'Someone'} reshared your Flux`
                                      : `${meta.mentionerName  ?? 'Someone'} mentioned a Flux`));

                                const fluxId      = meta.fluxId;
                                const fluxOwnerId = meta.fluxOwnerId;
                                const thumbUrl    = meta.fluxMediaUrl;
                                const isVideo     = meta.fluxMediaType === 'video';

                                const handleViewFlux = () => {
                                  if (!fluxId) return;
                                  const url = fluxOwnerId
                                    ? `/post/flux-view?fluxId=${fluxId}&userId=${fluxOwnerId}`
                                    : `/post/flux-view?fluxId=${fluxId}`;
                                  router.push(url);
                                };

                                return (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      onDoubleClick={(e) => e.stopPropagation()}
                                      onContextMenu={(e) => e.stopPropagation()}
                                      style={{
                                        borderRadius: 12,
                                        overflow:     'hidden',
                                        border:       '1px solid rgba(136,96,217,0.35)',
                                        maxWidth:     220,
                                        background:   isSender
                                          ? 'rgba(0,0,0,0.25)'
                                          : isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(0,0,0,0.04)',
                                      }}
                                    >
                                    {/* Thumbnail */}
                                    {thumbUrl && (
                                      <div style={{
                                        position: 'relative',
                                        width:    '100%',
                                        height:   120,
                                        overflow: 'hidden',
                                      }}>
                                        {isVideo ? (
                                          <video
                                            src={thumbUrl}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            muted
                                            playsInline
                                          />
                                        ) : (
                                          <img
                                            src={thumbUrl}
                                            alt="flux"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          />
                                        )}
                                        {/* Badge */}
                                        <div style={{
                                          position:     'absolute',
                                          top:           6,
                                          left:          6,
                                          background:   'rgba(136,96,217,0.85)',
                                          borderRadius:  8,
                                          padding:      '2px 7px',
                                          fontSize:      10,
                                          color:         '#fff',
                                          fontWeight:    600,
                                        }}>
                                          {isRemention ? '↩ Reshared Flux' : '📖 Flux Mention'}
                                        </div>
                                      </div>
                                    )}

                                    {/* Label + View button */}
                                    <div style={{ padding: '8px 10px 10px' }}>
                                      <p style={{
                                        color:        isSender ? '#fff' : themeStyles.text,
                                        fontSize:     12,
                                        fontWeight:   500,
                                        marginBottom: 8,
                                        lineHeight:   1.4,
                                      }}>
                                        {label}
                                      </p>
                                        <button
                                          onClick={handleViewFlux}
                                          style={{
                                            width: '100%', padding: '6px 0', borderRadius: 20,
                                            border: isSenderView
                                              ? '1px solid rgba(255,255,255,0.35)'
                                              : isDark
                                                ? '1px solid rgba(255,255,255,0.2)'
                                                : '1px solid rgba(0,0,0,0.15)',
                                            background: isSenderView
                                              ? 'rgba(255,255,255,0.18)'
                                              : isDark
                                                ? 'rgba(255,255,255,0.1)'
                                                : 'rgba(0,0,0,0.06)',
                                            color: isSenderView
                                              ? '#fff'
                                              : isDark ? '#fff' : '#111',
                                            fontSize: 12, fontWeight: 600,
                                            cursor: 'pointer',
                                          }}
                                        >
                                          View Flux
                                        </button>
                                    </div>
                                  </div>
                                );
                              })()

                            /* ── Plain text ── */
                            ) : (
                              <div
                                className="break-words text-[15px] leading-relaxed"
                                style={{ color: isSender ? '#fff' : themeStyles.text }}
                              >
                                {/* ✅ Never render raw JSON — show fallback if content looks like a flux JSON object */}
                                {message.content?.startsWith('{') && (
                                    message.content.includes('"flux') ||
                                    message.content.includes('"type":"flux_reply')
                                  )
                                  ? null
                                  : message.content}
                              </div>
                            )}
                          {/* ── Timestamp + read status ── */}
                          <div className="flex justify-end mt-1 items-center gap-1.5 opacity-80">
                            <span
                              className="text-[10px]"
                              style={{
                                color: isSender
                                  ? 'rgba(255,255,255,0.8)'
                                  : themeStyles.textSecondary,
                              }}
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
        {/* ── Scroll to bottom button ── */}
        {showScrollBtn && (
          <button
            type="button"
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="sticky bottom-4 left-full -translate-x-full w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 z-30"
            style={{
              background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)',
              color: '#fff',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </button>
        )}
      </div>
      {(currentChat.status === 'accepted' || currentChat.type === 'direct' || currentChat.type === 'request') ? (
        <>
          {/* Reply Preview Bar */}
          {replyingTo && !currentChat.isBlocked && !blockStatus?.iBlockedThem && !blockStatus?.theyBlockedMe && (
            <div
              className="flex items-center gap-3 px-4 py-2 border-t"
              style={{
                backgroundColor: isDark ? 'rgba(136,96,217,0.12)' : 'rgba(136,96,217,0.07)',
                borderColor: themeStyles.border,
              }}
            >
              {/* Purple left bar */}
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: '#8860D9' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#8860D9' }}>
                  {replyingTo.sender === user?.id ? 'You' : currentChat.participant?.name}
                </p>
                <p className="text-[12px] truncate" style={{ color: themeStyles.textSecondary }}>
                  {getReplyPreviewText(replyingTo)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="flex-shrink-0 p-1 rounded-full hover:opacity-70 transition-opacity"
                style={{ color: themeStyles.textSecondary }}
              >
                <X size={16} />
              </button>
            </div>
          )}
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
          <form
            onSubmit={handleSendMessage}
            className="p-4 flex items-center gap-2 relative flex-shrink-0"
          >
            {/*  Voice Recorder overlay */}
            {showVoiceRecorder && (
              <div className="absolute inset-x-0 bottom-full mb-2 px-4">
                <VoiceRecorder
                  onSendVoice={handleSendVoice}
                  onCancel={() => setShowVoiceRecorder(false)}
                  disabled={sendingVoice}
                />
              </div>
            )}

            {/*  Media Picker Modal  */}
            {/* Positioned relative to the form so it floats above it  */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMediaPicker(!showMediaPicker)}
                className="p-2 rounded-full transition-colors flex-shrink-0"
                style={{ color: showMediaPicker ? '#5494FF' : themeStyles.textSecondary }}
                disabled={isSendingMedia}
              >
                <Paperclip size={22} />
              </button>

              <MediaPickerModal
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelectGallery={(files) => { setShowMediaPicker(false); handleGalleryFiles(files); }}
                onSelectCamera={() => { setShowMediaPicker(false); }}
                onSelectLocation={() => { setShowMediaPicker(false); setShowLocationModal(true); }}
                onSelectProfile={() => { setShowMediaPicker(false); setShowProfileModal(true); }}
                onSelectDocument={(file) => { setShowMediaPicker(false); setPendingDocFile(file); }}
                onSelectAudio={(file) => { setShowMediaPicker(false); setPendingAudioFile(file); }}
                onSelectPoll={() => setShowMediaPicker(false)}
                onSelectEvents={() => { setShowMediaPicker(false); setShowEventModal(true); }}
              />
            </div>

            {/* ── Main Input Capsule */}
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
                style={{ color: themeStyles.text }}
                disabled={sending || sendingVoice || showVoiceRecorder || isSendingMedia}
              />
            </div>

            {/* ── Send / Mic / Loading button  */}
            <button
              type={messageInput.trim() ? 'submit' : 'button'}
              onClick={!messageInput.trim() && !isSendingMedia ? () => setShowVoiceRecorder(true) : undefined}
              disabled={sending || sendingVoice || isSendingMedia}
              style={{ background: 'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)' }}
              className="p-3 rounded-full text-white shadow-lg hover:opacity-90 transition-all active:scale-95 flex-shrink-0"
            >
              {sending || sendingVoice || isSendingMedia ? (
                <Loader2 className="animate-spin" size={20} />
              ) : messageInput.trim() ? (
                <Send size={20} />
              ) : (
                <Mic size={20} />
              )}
            </button>

            {/* ── Emoji Picker  */}
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
      {pendingGalleryFiles && pendingGalleryFiles.length > 0 && (
        <ViewModeSelectorSheet
          files={pendingGalleryFiles}
          isDark={isDark}
          caption={pendingCaption}
          onCaptionChange={setPendingCaption}
          onClose={() => { setPendingGalleryFiles(null); setPendingCaption(''); }}
          onConfirm={(viewMode, caption) => {
            setPendingGalleryFiles(null);
            confirmGalleryWithMode(viewMode, caption);
          }}
        />
      )}
      {/* Caption Sheet for Document */}
      {pendingDocFile && (
        <CaptionSheet
          file={pendingDocFile}
          isDark={isDark}
          themeStyles={themeStyles}
          onClose={() => setPendingDocFile(null)}
          onSend={(caption) => {
            const f = pendingDocFile;
            setPendingDocFile(null);
            handleDocumentFile(f, caption);
          }}
        />
      )}
      {/* Caption Sheet for Audio */}
      {pendingAudioFile && (
        <CaptionSheet
          file={pendingAudioFile}
          isDark={isDark}
          themeStyles={themeStyles}
          onClose={() => setPendingAudioFile(null)}
          onSend={(caption) => {
            const f = pendingAudioFile;
            setPendingAudioFile(null);
            handleAudioFile(f, caption);
          }}
        />
      )}
      {/* Location Modal */}
      <LocationPickerModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSend={handleLocationSend}
      />

      {/* Profile Picker Modal */}
      <ProfilePickerModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSend={handleProfileSend}
      />

      {/* Event Picker Modal */}
      <EventPickerModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSend={handleEventSend}
      />
    </div>
  );
}
