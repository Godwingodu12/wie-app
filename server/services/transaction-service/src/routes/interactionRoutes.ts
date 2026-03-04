// ✅ FIXED — adds DELETE routes for unlike and unsave
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

// Toggle routes (POST handles both like→unlike and save→unsave)
router.post('/:ticketId/like', authenticate, toggleLike);
router.post('/:ticketId/share', authenticate, shareEvent);
router.post('/:ticketId/view', authenticate, recordView);
router.post('/:ticketId/save', authenticate, toggleSave);

// Explicit DELETE aliases (same controller — frontend can use either)
router.delete('/:ticketId/like', authenticate, toggleLike); 
router.delete('/:ticketId/save', authenticate, toggleSave); 

router.get('/:ticketId/stats', optionalAuth, getEventStats);
router.post('/:ticketId/feedback', authenticate, submitFeedback);

// User's interactions
router.get('/liked-events', authenticate, getUserLikedEvents);
router.get('/saved-events', authenticate, getUserSavedEvents);

export default router;
