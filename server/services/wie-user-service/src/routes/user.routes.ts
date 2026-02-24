import express from 'express';
import { 
  index, getCountries, signupSendOtp, signupVerifyOtp, login, logout, resendOtp,
  getProfile, updateProfile, googleAuth, googleCallback, getMicrosoftAuthUrl,
  getAppleAuthUrl, forgotPassword, verifyResetOTP, resetPassword, getUserLocation,
  updateUserLocation, checkCanSetPassword, setPasswordForGoogleUser, changePassword,
  searchUsers, getUserById, getSuggestedUsers, updateHeartbeat,
  getAccountPrivacy, updateAccountPrivacy, muteUser, unmuteUser, getMutedUsers,
  getMutedCount, checkMuteStatus, updatePersonalDetails
} from '../services/wie-user.service';
import { authenticateToken } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload';

const router: express.Router = express.Router();

// ✅ Public routes first
router.get('/', index);
router.get('/countries', getCountries);
router.post('/signup/send-otp', signupSendOtp);
router.post('/signup/verify-otp', signupVerifyOtp);
router.post('/login', login);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// ✅ OAuth routes
router.get('/google/auth', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/microsoft-auth', getMicrosoftAuthUrl);
router.get('/apple-auth', getAppleAuthUrl);

// ✅ SPECIFIC routes BEFORE dynamic :userId route
router.get('/check-can-set-password', authenticateToken, checkCanSetPassword);
router.get('/get-profile', authenticateToken, getProfile);
router.get('/get-location', authenticateToken, getUserLocation);
router.get('/search', authenticateToken, searchUsers);
router.get('/suggested', authenticateToken, getSuggestedUsers);
router.get('/mutes', authenticateToken, getMutedUsers);
router.get('/muted-count', authenticateToken, getMutedCount);

// ✅ CRITICAL: Account privacy routes BEFORE :userId
router.get('/account-privacy', authenticateToken, getAccountPrivacy);
router.put('/account-privacy', authenticateToken, updateAccountPrivacy);

// ✅ POST routes (order doesn't matter as much)
router.post('/logout', authenticateToken, logout);
router.post('/set-password-for-google-user', authenticateToken, setPasswordForGoogleUser);
router.post('/change-password', authenticateToken, changePassword);
router.post('/heartbeat', authenticateToken, updateHeartbeat);
router.post('/mute', authenticateToken, muteUser);
router.post('/unmute', authenticateToken, unmuteUser);

// ✅ PUT routes
router.put('/update-profile', authenticateToken, upload.single('profile_picture'), updateProfile);
router.put('/update-personal-details', authenticateToken, updatePersonalDetails);
router.put('/update-location', authenticateToken, updateUserLocation);

// ✅ DYNAMIC route LAST (catches everything else)
router.get('/:userId', authenticateToken, getUserById);
router.get('/mute-status/:user_id', authenticateToken, checkMuteStatus);

export default router;
