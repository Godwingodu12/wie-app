import express from 'express';
import {
  index,
  getCountries,
  signupSendOtp,
  signupVerifyOtp,
  login,
  resendOtp,
  updateProfile,
} from '../services/wie-user.service';
import { authenticateToken } from '../middlewares/auth.middleware';
const router: express.Router = express.Router();
// Public routes
router.get('/', index);
router.get('/countries', getCountries);
router.post('/signup/send-otp', signupSendOtp);
router.post('/signup/verify-otp', signupVerifyOtp);
router.post('/login', login);
router.post('/resend-otp', resendOtp);

// Protected routes
router.put('/profile/:userId', authenticateToken, updateProfile);

export default router;
