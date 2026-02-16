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
export interface ChatMessage {
  _id: string;
  sender: string;
  content: string;
  timestamp: string;
  createdAt: string;
  readBy: string[];
  deliveredTo: string[];
  voiceData?: VoiceData;
  isRead: boolean;
  isSender?: boolean;
  deletedForEveryone?: boolean;
  deletedFor?: string[];
  messageType?: 'text' | 'voice' | 'image' | 'video' | 'file';
}
export interface VoiceData {
  audioBase64: string;
  duration: number;
  mimeType: string;
}
export interface VoiceMessageData {
  type: 'voice';
  audio: string; // base64 encoded audio
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
