import express from 'express';
import * as wieChatController from '../controllers/wiechat.controller.js';
import * as wieMediaController from '../controllers/chatmedia.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { mediaUpload, documentUpload } from '../middleware/upload.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/suggestions', wieChatController.getWieChatSuggestions);
router.get('/search', wieChatController.searchWieUsersForChat);
router.post('/create', wieChatController.createOrGetWieChat);
router.get('/list', wieChatController.getWieUserChats);
router.get('/requests', wieChatController.getMessageRequests);
router.get('/unread-count', wieChatController.getUnreadMessageCount);
router.get('/unread-users-count', wieChatController.getUnreadUsersCount);
router.post('/send', wieChatController.sendWieMessage);
router.get('/user/:userId/status', wieChatController.getUserOnlineStatus);
router.get('/:chatId/get-chat-details', wieChatController.getChatDetails);
router.post('/:chatId/mark-read', wieChatController.markWieMessagesAsRead);
router.post('/:chatId/mark-unread', wieChatController.markWieMessagesAsUnread);
router.get('/:chatId/messages', wieChatController.getWieChatMessages);

router.post('/:chatId/accept', wieChatController.acceptMessageRequest);
router.post('/:chatId/decline', wieChatController.declineMessageRequest);
router.delete('/:chatId/clear', wieChatController.clearWieChatMessages);
router.delete('/:chatId/messages/:messageId', wieChatController.deleteWieMessage);
router.post('/:chatId/messages/delete-for-me', wieChatController.deleteMessagesForMe);
router.post('/:chatId/messages/delete-for-everyone', wieChatController.deleteMessagesForEveryone);
router.post('/:chatId/report-screenshot', wieChatController.reportChatScreenshot);
router.delete('/:chatId', wieChatController.deleteWieChat);
router.get('/:chatId/messages/selection', wieChatController.getMessagesForSelection);
router.delete('/:chatId/delete-for-me', wieChatController.deleteChatForMe);
// Media / Rich message routes 
router.post(
  '/:chatId/send-image',
  mediaUpload.array('images', 10),
  wieMediaController.sendImageMessage
);
router.post(
  '/:chatId/send-video',
  mediaUpload.single('video'),
  wieMediaController.sendVideoMessage
);
router.post(
  '/:chatId/send-audio',
  documentUpload.single('audio'),
  wieMediaController.sendAudioMessage
);
router.post(
  '/:chatId/send-document',
  documentUpload.single('document'),
  wieMediaController.sendDocumentMessage
);
router.post('/:chatId/send-sticker', wieMediaController.sendStickerMessage);
router.post('/:chatId/send-location', wieMediaController.sendLocationMessage);
router.patch('/:chatId/live-location/:messageId', wieMediaController.updateLiveLocation);
router.post('/:chatId/send-contact', wieMediaController.sendContactMessage);
router.post('/:chatId/send-profile', wieMediaController.sendProfileMessage);
router.post('/:chatId/send-event', wieMediaController.sendEventMessage);
router.post('/:chatId/messages/:messageId/viewed', wieMediaController.markMediaViewed);
router.get('/:chatId/media', wieMediaController.getChatMedia);

export default router;
