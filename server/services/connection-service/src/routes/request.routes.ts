import express from 'express';
import * as requestService from '../services/request.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Send connection request
router.post('/send-request', requestService.sendConnectionRequest);

// Get requests
router.get('/get-sent-requests', requestService.getSentRequests);
router.get('/get-received-requests', requestService.getReceivedRequests);
router.get('/get-request/:requestId', requestService.getRequestById);

// Respond to request
router.post('/accept-request/:requestId', requestService.acceptRequest);
router.post('/reject-request/:requestId', requestService.rejectRequest);
router.post('/cancel-request/:requestId', requestService.cancelRequest);

// Mark as viewed
router.patch('/mark-viewed/:requestId', requestService.markAsViewed);

export default router;