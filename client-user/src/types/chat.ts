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
  isRead: boolean;
  isSender?: boolean;
  deletedForEveryone?: boolean;
  deletedFor?: string[];
}

export interface Chat {
  _id: string;
  participant: ChatUser | null;
  lastMessage: {
    content: string;
    sender: string;
    timestamp: string;
    readBy?: string[];
    isRead?: boolean;
  } | null;
  unreadCount: number;
  type?: 'direct' | 'request';
  status?: 'pending' | 'accepted' | 'declined';
  updatedAt: string;
}

export interface MessageRequest {
  _id: string;
  participant: ChatUser | null;
  lastMessage: {
    content: string;
    sender: string;
    timestamp: string;
  } | null;
  type: 'request';
  status: 'pending';
  updatedAt: string;
  messageCount: number;
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