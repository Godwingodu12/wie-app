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

// Chat Suggestions (Followers)
export const getWieChatSuggestions = async (): Promise<any> => {
  const res = await chatApi.get('/suggestions');
  return res.data;
};

// Search Users
export const searchWieUsersForChat = async (query: string): Promise<any> => {
  const res = await chatApi.get('/search', {
    params: { query },
  });
  return res.data;
};

// Create or Get Chat
export const createOrGetWieChat = async (participantId: string): Promise<any> => {
  const res = await chatApi.post('/create', { participantId });
  return res.data;
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
// Get Chat Messages
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
// Send Message
export const sendWieMessage = async (chatId: string, content: string): Promise<any> => {
  const res = await chatApi.post('/send', { chatId, content });
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

export const checkBlockStatus = async (targetUserId: string) => {
  const response = await blockApi.get(`/status/${targetUserId}`);
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
export default chatApi;