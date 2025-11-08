import express from 'express';
import {
  getChatSuggestions,
  searchUsersForChat,
  createOrGetChat,
  getUserChats,
  sendMessage,
  getChatMessages,
  deleteChat
} from '../services/chat.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = express.Router();
// All routes require authentication
router.use(authenticateToken);
// Get chat suggestions (followers)
router.get('/suggestions', getChatSuggestions);
// Search users for chat
router.get('/search', searchUsersForChat);
// Create or get existing chat
router.post('/create', createOrGetChat);
// Get all user's chats
router.get('/get-chats', getUserChats);
// Send message
router.post('/message', sendMessage);
// Get chat messages
router.get('/:chatId/messages', getChatMessages);
// Delete chat
router.delete('/delete-chat/:chatId', deleteChat);
export default router;