import express from 'express';
import {
  getChatSuggestions,
  searchUsersForChat,
  createOrGetChat,
  getUserChats,
  sendMessage,
  getChatMessages,
  deleteChat,clearChatMessages,deleteMessage,clearAndDeleteChat 
} from '../services/chat.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = express.Router();
// All routes require authentication
router.use(authenticateToken);
router.get('/suggestions', getChatSuggestions);
router.get('/search', searchUsersForChat);
router.post('/create', createOrGetChat);
router.get('/get-chats', getUserChats);
router.post('/message', sendMessage);
router.get('/:chatId/messages', getChatMessages);
router.delete('/delete-chat/:chatId', deleteChat);
router.delete('/clear-chat/:chatId', clearChatMessages);
router.delete('/delete-message/:chatId/:messageId', deleteMessage);
router.delete('/clear-delete/:chatId', clearAndDeleteChat);
export default router;