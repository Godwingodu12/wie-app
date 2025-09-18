import express from 'express';
import { getProfile,updateProfile } from '../services/user.services.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.get('/me', protect, getProfile);
router.post('/update-profile', protect, updateProfile);

export default router;
