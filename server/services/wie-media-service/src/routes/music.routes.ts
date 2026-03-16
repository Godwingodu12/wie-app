import express from 'express';
import { authenticate } from '../middlewares/auth';
import * as musicController from '../controllers/music.controller';

const router: express.Router = express.Router();
router.use(authenticate);

// GET /api/music/search?q=shape+of+you
router.get('/search', musicController.searchMusic);

// GET /api/music/track/:trackId — get single track details
router.get('/track/:trackId', musicController.getTrack);

// GET /api/music/trending — curated trending tracks
router.get('/trending', musicController.getTrending);

export default router;