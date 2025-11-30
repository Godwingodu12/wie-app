import express from 'express';
import {
  toggleLike,
  shareEvent,
  recordView,
  toggleSave,
  getEventStats,
  getUserLikedEvents,
  getUserSavedEvents,
  submitFeedback,
} from '../controllers/interactionController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router: express.Router = express.Router();

// Interaction routes
router.post('/:ticketId/like', authenticate, toggleLike);
router.post('/:ticketId/share', authenticate, shareEvent);
router.post('/:ticketId/view', authenticate, recordView);
router.post('/:ticketId/save', authenticate, toggleSave);
router.get('/:ticketId/stats', optionalAuth, getEventStats);
router.post('/:ticketId/feedback', authenticate, submitFeedback);

// User's interactions
router.get('/liked-events', authenticate, getUserLikedEvents);
router.get('/saved-events', authenticate, getUserSavedEvents);

export default router;