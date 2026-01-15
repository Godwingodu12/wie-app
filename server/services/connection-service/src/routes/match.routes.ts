import express from 'express';
import * as matchingService from '../services/matching.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router: express.Router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get match suggestions
router.get('/get-suggestions/:purposeCode', matchingService.getMatchSuggestions);

// Calculate match score
router.post('/calculate-score', matchingService.calculateMatchScore);

// Track interactions
router.post('/track-view/:suggestedUserId', matchingService.trackView);
router.post('/track-skip/:suggestedUserId', matchingService.trackSkip);

// Get established connections
router.get('/get-connections', matchingService.getEstablishedConnections);
router.get('/get-connection/:connectionId', matchingService.getConnectionById);

// Provide feedback
router.post('/provide-feedback/:connectionId', matchingService.provideFeedback);

export default router;