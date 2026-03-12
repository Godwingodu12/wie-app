export interface ChatUser {
  _id: string;
  name: string;
  username: string;
  contact_no: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  is_verified?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  last_seen_at?: string;
}

// ── View-once mode shared by image and video items ─────────────────────────
export type MediaViewMode = 'view_once' | 'allow_replay' | 'keep';

export interface ChatImageItem {
  url: string;
  viewMode?: MediaViewMode;
  viewedBy?: string[];
}

export interface ChatVideoItem {
  url: string;
  originalName?: string;
  size?: number;
  duration?: number;
  mimeType?: string;
  thumbnail?: string;
  viewMode?: MediaViewMode;
  viewedBy?: string[];
}

export interface ChatAudioItem {
  url: string;
  originalName?: string;
  size?: number;
  duration?: number;
  mimeType?: string;
}

export interface ChatFileItem {
  url: string;
  name?: string;
  size?: number;
  extension?: string;
}

export interface ChatMessage {
  _id: string;
  sender: string;
  content: string;
  timestamp: string;
  createdAt?: string;
  readBy?: string[];
  deliveredTo?: string[];
  isRead?: boolean;
  isSender?: boolean;
  deletedForEveryone?: boolean;
  deletedFor?: string[];

  // Message type
  messageType?: 'text' | 'voice' | 'image' | 'video' | 'file' | 'audio'
               | 'location' | 'profile' | 'event' | 'sticker' | 'contact';

  // View-once mode at message level (mirrors the item-level value for convenience)
  viewMode?: MediaViewMode;
  replyTo?: {
      messageId: string;
      sender: string;
      content: string;
      messageType: string;
  };
  // Rich media fields
  voiceData?: VoiceData;
  chat_images?: ChatImageItem[];   // ← was string[], now ChatImageItem[]
  chat_videos?: ChatVideoItem[];
  chat_audio?: ChatAudioItem[];
  chat_files?: ChatFileItem[];
  stickerData?: Record<string, any>;
  locationData?: Record<string, any>;
  contactData?: Record<string, any>;
  profileData?: Record<string, any>;
  eventData?: Record<string, any>;

  // Optimistic-UI helpers (client-only, never persisted)
  _localPreviews?: string[];
  _isOptimistic?: boolean;
}

export interface VoiceData {
  audioBase64: string;
  duration: number;
  mimeType: string;
}

export interface VoiceMessageData {
  type: 'voice';
  audio: string;
  duration: number;
  mimeType: string;
}

export interface Chat {
  _id: string;
  participant: ChatUser | null;
  lastMessage: {
    content: string;
    sender: string;
    timestamp: string;
    deliveredTo: string[];
    readBy?: string[];
    isRead?: boolean;
    // view-once preview support
    viewMode?: MediaViewMode;
    messageType?: string;
    chat_images?: ChatImageItem[];
    chat_videos?: ChatVideoItem[];
  } | null;
  unreadCount: number;
  type?: 'direct' | 'request' | 'group';
  status?: 'pending' | 'accepted' | 'declined';
  updatedAt: string;
  isBlocked?: boolean;
  isBlockedBy?: 'you' | 'them';
  blockerId?: string;
  blockedId?: string;
}

export interface MessageRequest {
  _id: string;
  participant: ChatUser | null;
  lastMessage: {
    content: string;
    sender: string;
    timestamp: string;
    deliveredTo: string[];
  } | null;
  type: 'request';
  status: 'pending';
  updatedAt: string;
  messageCount: number;
  unreadCount: number;
}

export interface UnreadCounts {
  [chatId: string]: number;
}

export interface MessageSelection {
  _id: string;
  sender: string;
  content: string;
  timestamp: string;
  isSender: boolean;
}
