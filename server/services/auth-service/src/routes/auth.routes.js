import express from 'express';
import {index, login, adminSignup,organisationSignup,getUserById,verifyOTP,logout,forgotPassword,resendOtp,verifyUser,resetPassword,findAllActiveUsers,editProfile,viewAllUsers,getOtherProfile } from '../services/auth.service.js';
import { followUser, unfollowUser,googleAuth,googleCallback,facebookAuth,facebookCallback,
    twitterAuth,twitterCallback,instagramAuth,instagramCallback,linkedinAuth,linkedinCallback,disconnectSocial,getSocialAccounts } from '../controllers/auth.controller.js';
import passport from '../config/passport.config.js';
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
router.get('/active-users', protect, findAllActiveUsers);
router.post('/edit-profile', protect, editProfile);
router.get('/view-all-users', protect, viewAllUsers);
router.get('/other-profile/:otherId', protect, getOtherProfile);
router.post('/follow/:otherId', protect, followUser);
router.post('/unfollow/:otherId', protect, unfollowUser);
router.get('/google', googleAuth, passport.authenticate('google-link', {
  scope: ['profile', 'email'],
}));
router.get('/google/callback',
  passport.authenticate('google-link', { 
    failureRedirect: `${process.env.CLIENT_URL}/settings?error=google_auth_failed`,
    session: false 
  }),
  googleCallback
);

// Facebook OAuth Routes
router.get('/facebook',
  facebookAuth,
  passport.authenticate('facebook-link', {
    scope: ['email', 'public_profile']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook-link', { 
    failureRedirect: `${process.env.CLIENT_URL}/settings?error=facebook_auth_failed`,
    session: false 
  }),
  facebookCallback
);

// Twitter/X OAuth Routes
router.get('/twitter',
  twitterAuth,
  passport.authenticate('twitter-link')
);

router.get('/twitter/callback',
  passport.authenticate('twitter-link', { 
    failureRedirect: `${process.env.CLIENT_URL}/settings?error=twitter_auth_failed`,
    session: false 
  }),
  twitterCallback
);

// Instagram OAuth Routes
router.get('/instagram',
  instagramAuth,
  passport.authenticate('instagram-link', {
    scope: ['basic', 'public_profile']
  })
);

router.get('/instagram/callback',
  passport.authenticate('instagram-link', { 
    failureRedirect: `${process.env.CLIENT_URL}/settings?error=instagram_auth_failed`,
    session: false 
  }),
  instagramCallback
);

// LinkedIn OAuth Routes
router.get('/linkedin',
  linkedinAuth,
  passport.authenticate('linkedin-link', {
    scope: ['r_emailaddress', 'r_liteprofile']
  })
);

router.get('/linkedin/callback',
  passport.authenticate('linkedin-link', { 
    failureRedirect: `${process.env.CLIENT_URL}/settings?error=linkedin_auth_failed`,
    session: false 
  }),
  linkedinCallback
);

// Disconnect social account
router.delete('/social/:platform', disconnectSocial);

// Get connected social accounts
router.get('/social/accounts', getSocialAccounts);

export default router;
