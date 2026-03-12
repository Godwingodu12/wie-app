import axios from 'axios';

const CHAT_API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || 'http://localhost:5004/api/wie-chat';
const BLOCK_API_URL = process.env.NEXT_PUBLIC_BLOCK_API_URL || 'http://localhost:5004/api/chat-block';
const REPORT_API_URL = process.env.NEXT_PUBLIC_REPORT_API_URL || 'http://localhost:5004/api/chat-report';
const chatApi = axios.create({
  baseURL: CHAT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
const blockApi = axios.create({
  baseURL: BLOCK_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
const reportApi = axios.create({
  baseURL: REPORT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
chatApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
chatApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
blockApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
blockApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
reportApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
reportApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
export const getWieChatSuggestions = async (): Promise<any> => {
  const res = await chatApi.get('/suggestions');
  return res.data;
};
export const searchWieUsersForChat = async (query: string): Promise<any> => {
  const res = await chatApi.get('/search', {
    params: { query },
  });
  return res.data;
};
// Create or Get Chat
export const createOrGetWieChat = async (participantId: string): Promise<{
  success: boolean;
  chat: any;
  isNew: boolean;
  isEmpty: boolean;
}> => {
  try {
    const res = await chatApi.post('/create', { participantId });
    return {
      success: res.data.success,
      chat: {
        _id: res.data.chat._id,
        participants: res.data.chat.participants,
        participant: res.data.chat.participant,
        type: res.data.chat.type, 
        status: res.data.chat.status, 
        lastMessage: res.data.chat.lastMessage,
        unreadCount: res.data.chat.unreadCount || 0,
        updatedAt: res.data.chat.updatedAt,
        isActive: res.data.chat.isActive,
        isEmpty: res.data.chat.isEmpty
      },
      isNew: res.data.isNew,
      isEmpty: res.data.isEmpty
    };
  } catch (error: any) {
    console.error('Create/Get chat error:', error);
    throw error;
  }
};
// Get User Chats List
export const getWieUserChats = async (page: number = 1, limit: number = 40): Promise<any> => {
  const res = await chatApi.get('/list', {
    params: { page, limit },
  });
  return res.data;
};
// Get Unread Message Count
export const getUnreadMessageCount = async (): Promise<any> => {
  const res = await chatApi.get('/unread-count');
  return res.data;
};
export const getChatDetails = async (chatId: string): Promise<any> => {
  const res = await chatApi.get(`/${chatId}/get-chat-details`);
  return res.data;
}
// Get Chat Messages
export const getWieChatMessages = async (
  chatId: string,
  page: number = 1,
  limit: number = 50
): Promise<any> => {
  const res = await chatApi.get(`/${chatId}/messages`, {
    params: { page, limit },
  });
  return res.data;
};

export const sendWieMessage = async (chatId: string, content: string, replyTo?: {
  messageId: string; sender: string; content: string; messageType: string;
}) => {
  const res = await chatApi.post(`/send/`, {chatId, content, replyTo });
  return res.data;
};
export const markMessagesAsRead = async (chatId: string) => {
  const response = await chatApi.post(`/${chatId}/mark-read`);
  return response.data;
};
export const markMessagesAsUnread = async (chatId: string) => {
  const response = await chatApi.post(`/${chatId}/mark-unread`);
  return response.data;
};
// Accept Message Request
export const acceptMessageRequest = async (chatId: string): Promise<any> => {
  const res = await chatApi.post(`/${chatId}/accept`);
  return res.data;
};

// Decline Message Request
export const declineMessageRequest = async (chatId: string): Promise<any> => {
  const res = await chatApi.post(`/${chatId}/decline`);
  return res.data;
};

// Clear Chat Messages
export const clearWieChatMessages = async (chatId: string): Promise<any> => {
  const res = await chatApi.delete(`/${chatId}/clear`);
  return res.data;
};

// Delete Single Message
export const deleteWieMessage = async (chatId: string, messageId: string): Promise<any> => {
  const res = await chatApi.delete(`/${chatId}/messages/${messageId}`);
  return res.data;
};

// Delete Chat
export const deleteWieChat = async (chatId: string): Promise<any> => {
  const res = await chatApi.delete(`/${chatId}`);
  return res.data;
};
// Get Message Requests
export const getMessageRequests = async (): Promise<any> => {
  const res = await chatApi.get('/requests');
  return res.data;
};
export const deleteMessagesForMe = async (chatId: string, messageIds: string[]): Promise<any> => {
  const res = await chatApi.post(`/${chatId}/messages/delete-for-me`, { messageIds });
  return res.data;
};

export const deleteMessagesForEveryone = async (chatId: string, messageIds: string[]): Promise<any> => {
  const res = await chatApi.post(`/${chatId}/messages/delete-for-everyone`, { messageIds });
  return res.data;
};

export const getUserOnlineStatus = async (userId: string): Promise<any> => {
  const res = await chatApi.get(`/user/${userId}/status`);
  return res.data;
};
// Get messages for selection mode
export const getMessagesForSelection = async (chatId: string): Promise<any> => {
  const res = await chatApi.get(`/${chatId}/messages/selection`);
  return res.data;
};
// Delete chat for me only (temporary deletion)
export const deleteChatForMe = async (chatId: string): Promise<any> => {
  const res = await chatApi.delete(`/${chatId}/delete-for-me`);
  return res.data;
};
export const getUnreadUsersCount = async (): Promise<any> => {
  const res = await chatApi.get('/unread-users-count');
  return res.data;
};
export const blockUser = async (userId: string) => {
  const response = await blockApi.post('/block', { userId });
  return response.data;
};

export const unblockUser = async (userId: string) => {
  const response = await blockApi.delete(`/unblock/${userId}`);
  return response.data;
};

export const getBlockedUsers = async (page = 1, limit = 50) => {
  const response = await blockApi.get('/blocked', {
    params: { page, limit }
  });
  return response.data;
};
export const checkBlockStatus = async (otherUserId: string) => {
  const response = await blockApi.get(`/check-block-status/${otherUserId}`);
  return response.data;
};
export const reportUser = async (data: {
  userId: string;
  reportType: 'harassment' | 'spam' | 'inappropriate' | 'threat' | 'other';
  reason: string;
  chatId?: string;
  messageIds?: string[];
}) => {
  const response = await reportApi.post('/report', data);
  return response.data;
};
export const getMyReports = async (page = 1, limit = 20) => {
  const response = await reportApi.get('/my-reports', {
    params: { page, limit }
  });
  return response.data;
};

export const sendImageMessage = async (
  chatId: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  viewMode?: 'view_once' | 'allow_replay' | 'keep'
) => {
  if (viewMode && viewMode !== 'keep') formData.append('viewMode', viewMode);
  const response = await chatApi.post(`/${chatId}/send-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return response.data;
};

export const sendVideoMessage = async (
  chatId: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
  viewMode?: 'view_once' | 'allow_replay' | 'keep'
) => {
  if (viewMode && viewMode !== 'keep') formData.append('viewMode', viewMode);
  const response = await chatApi.post(`/${chatId}/send-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return response.data;
};

export const markMediaViewed = async (
  chatId: string,
  messageId: string,
  finalView: boolean = true
) => {
  const response = await chatApi.post(`/${chatId}/messages/${messageId}/viewed`, { finalView });
  return response.data;
};

export const sendAudioMessage = async (
  chatId: string,
  formData: FormData,
  onProgress?: (percent: number) => void
) => {
  const response = await chatApi.post(`/${chatId}/send-audio`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return response.data;
};

export const sendDocumentMessage = async (
  chatId: string,
  formData: FormData,
  onProgress?: (percent: number) => void
) => {
  const response = await chatApi.post(`/${chatId}/send-document`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return response.data;
};

export const sendStickerMessage = async (
  chatId: string,
  url: string,
  stickerId?: string,
  pack?: string
) => {
  const response = await chatApi.post(`/${chatId}/send-sticker`, { url, stickerId, pack });
  return response.data;
};

export const sendLocationMessage = async (
  chatId: string,
  latitude: number,
  longitude: number,
  address?: string,
  name?: string,
  isLive = false,
  liveExpiry?: string
) => {
  const response = await chatApi.post(`/${chatId}/send-location`, {
    latitude,
    longitude,
    address,
    name,
    isLive,
    liveExpiry,
  });
  return response.data;
};

export const updateLiveLocation = async (
  chatId: string,
  messageId: string,
  latitude: number,
  longitude: number
) => {
  const response = await chatApi.patch(`/${chatId}/live-location/${messageId}`, {
    latitude,
    longitude,
  });
  return response.data;
};

export const sendContactMessage = async (
  chatId: string,
  name: string,
  phone: string | string[],
  email?: string | string[],
  avatar?: string,
  vCard?: string
) => {
  const response = await chatApi.post(`/${chatId}/send-contact`, {
    name,
    phone,
    email,
    avatar,
    vCard,
  });
  return response.data;
};

export const sendProfileMessage = async (
  chatId: string,
  profileUserId: string,
  extras?: {
    name?: string;
    username?: string;
    avatar?: string;
    bio?: string;
    is_verified?: boolean;
  }
) => {
  const response = await chatApi.post(`/${chatId}/send-profile`, {
    profileUserId,
    ...extras,
  });
  return response.data;
};

export const sendEventMessage = async (
  chatId: string,
  eventId: string,
  extras?: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    venue?: string;
    image?: string;
    ticketUrl?: string;
  }
) => {
  const title = extras?.title || 'Event';   

  const response = await chatApi.post(`/${chatId}/send-event`, {
    eventId,
    title,
    description: extras?.description || null,
    startDate:   extras?.startDate   || null,
    endDate:     extras?.endDate     || null,
    venue:       extras?.venue       || null,
    image:       extras?.image       || null,
    ticketUrl:   extras?.ticketUrl   || null,
  });
  return response.data;
};

export const getChatMedia = async (
  chatId: string,
  type?: 'image' | 'video' | 'audio' | 'file' | 'sticker',
  page = 1,
  limit = 20
) => {
  const response = await chatApi.get(`/${chatId}/media`, {
    params: { type, page, limit },
  });
  return response.data;
};
export default chatApi;
