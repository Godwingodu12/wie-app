import api from "./chatAxios";
export const getChatSuggestions = async () => {
  try {
    const response = await api.get("/chat/suggestions");
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const searchUsersForChat = async (searchQuery) => {
  try {
    const response = await api.get(`/chat/search?query=${searchQuery}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const createOrGetChat = async (participantId) => {
    try {
    const response = await api.post("/chat/create", { participantId });
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const getUserChats = async () => {
    try {
    const response = await api.get("/chat/get-chats");
    return response.data;
    } catch (error) {
    throw error;
  }
};
export const sendMessage = async (chatId, content) => {
    try {
    const response = await api.post("/chat/message", { chatId, content });
    return response.data;
    } catch (error) {
        throw error;
    }
};
export const getChatMessages = async (chatId) => {
    try {
    const response = await api.get(`/chat/${chatId}/messages`);
    return response.data
    } catch (error) {
        throw error;
    }
};
export const deleteChat = async (chatId) => {
    try {
    const response = await api.delete(`/chat/delete-chat/${chatId}`);
    return response.data;
    } catch (error) {
        throw error;
    }
};