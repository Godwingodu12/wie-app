import express from 'express';
import {index, login, adminSignup,organisationSignup,getUserById,verifyOTP,logout,forgotPassword,resendOtp,verifyUser,resetPassword,findAllActiveUsers } from '../services/auth.service.js';
import upload from '../middlewares/upload.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

router.post('/adminsignup', upload.single('image'), adminSignup);
router.post('/organisationsignup', upload.single('image'), organisationSignup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/users/:id', getUserById);
router.get('/index', index);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/resend-otp', resendOtp);
router.post('/verify-user', verifyUser);
router.post('/reset-password', resetPassword);
router.get('/active-users', findAllActiveUsers);
export default router;
