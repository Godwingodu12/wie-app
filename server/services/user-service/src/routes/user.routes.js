import express from 'express';
import { getMe,updateProfile } from '../services/user.services.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.post('/update-profile', protect, updateProfile);

export default router;
