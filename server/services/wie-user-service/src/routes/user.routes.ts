import express from 'express';
import {
  index,
  signupSendOtp,
  signupVerifyOtp,
  login,
  resendOtp,
} from '../services/wie-user.service';
const router: express.Router = express.Router();
router.get('/', index);
router.post('/signup/send-otp', signupSendOtp);
router.post('/signup/verify-otp', signupVerifyOtp);
router.post('/login', login);
router.post('/resend-otp', resendOtp);
export default router;