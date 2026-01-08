import express from 'express';
import * as blockController from '../controllers/block.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
const router = express.Router();
router.post('/block', authenticateToken, blockController.blockUser);
router.delete('/unblock/:userId', authenticateToken, blockController.unblockUser);
router.get('/blocked', authenticateToken, blockController.getBlockedUsers);
router.get('/check-block-status/:userId', authenticateToken, blockController.checkBlockStatus);
export default router;
