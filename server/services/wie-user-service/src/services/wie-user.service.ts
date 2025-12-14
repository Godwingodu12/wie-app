import { Request, Response } from 'express';
import WIEUSER from '../models/wieuser.model';
import COUNTRY from '../models/country.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import otpService from '../reposetory/otp';
import { generateOtp } from '../utils/otp';
import { sendEmail } from '../utils/sendMail';
import { sendSMSOTP } from '../utils/sendSMS';
import { isLocalAuthUser } from '../utils/password';
import { getGoogleAuthUrl, getGoogleUserInfo } from '../utils/google-oauth';
import {
  validateEmail,
  validateContactNo,
  validatePassword,
  validateName,
} from '../utils/validation.js';
// Store temporary signup data in memory (in production, use Redis)
const tempUserStore = new Map<string, any>();
// Auto-delete unverified users after 15 minutes
const UNVERIFIED_USER_EXPIRY_MINUTES = 15;
// Start periodic cleanup of unverified users
setInterval(async () => {
  try {
    const deletedCount = await WIEUSER.deleteUnverifiedUsers(UNVERIFIED_USER_EXPIRY_MINUTES);
    if (deletedCount > 0) {
      console.log(`🧹 Auto-cleanup: Deleted ${deletedCount} unverified user(s)`);
    }
  } catch (error) {
    console.error('❌ Error in unverified users cleanup:', error);
  }
}, 5 * 60 * 1000); // Run every 5 minutes
export const index = (req: Request, res: Response): void => {
  res.json({ message: 'Welcome to the WIE User Service' });
};
export const getCountries = async (req: Request, res: Response): Promise<void> => {
  try {
    const countries = await COUNTRY.findAll();
    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error: any) {
    console.error('Get countries error:', error);
    res.status(500).json({ message: 'Failed to fetch countries', error: error.message });
  }
};
export const signupSendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, contact_no, password, country_id } = req.body;

    // Validation
    if (!password || !validatePassword(password)) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    if (!email && !contact_no) {
      res.status(400).json({ message: 'Email or contact number is required' });
      return;
    }

    if (email && !validateEmail(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    if (contact_no && !validateContactNo(contact_no)) {
      res.status(400).json({ message: 'Invalid contact number format' });
      return;
    }

    // Validate country (required)
    if (!country_id) {
      res.status(400).json({ message: 'Country is required' });
      return;
    }

    const country = await COUNTRY.findById(country_id);
    if (!country) {
      res.status(400).json({ message: 'Invalid country selected' });
      return;
    }

    // Check if user already exists
    let existingUser = null;
    if (email) {
      existingUser = await WIEUSER.findByEmail(email);
    }
    if (!existingUser && contact_no) {
      existingUser = await WIEUSER.findByContactNo(contact_no);
    }

    if (existingUser) {
      res.status(400).json({ 
        message: 'User already exists with this email or contact number' 
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate temporary user ID
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store user data temporarily (expires in 15 minutes)
    tempUserStore.set(tempUserId, {
      email: email || null,
      contact_no: contact_no || null,
      hashedPassword,
      country_id: country_id,
      createdAt: Date.now(),
    });

    // Clean up after 15 minutes
    setTimeout(() => {
      tempUserStore.delete(tempUserId);
      console.log(`⏰ Temp user data expired: ${tempUserId}`);
    }, 15 * 60 * 1000);

    // Generate and send OTP
    const otp = generateOtp();
    await otpService.insertOTP(tempUserId, otp, 5, 'signup'); // 5 minutes expiration

    if (email) {
      await sendEmail(email, otp);
      console.log(`✅ OTP sent to email: ${email}`);
    }

    if (contact_no) {
      await sendSMSOTP(contact_no, otp);
      console.log(`✅ OTP sent to contact: ${contact_no}`);
    }
    res.status(200).json({
      message: 'OTP sent successfully',
      tempUserId,
      expiresIn: '5 minutes',
    });
  } catch (error: any) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};
export const signupVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempUserId, otp, name } = req.body;

    if (!tempUserId || !otp) {
      res.status(400).json({ message: 'Temporary user ID and OTP are required' });
      return;
    }

    // Validate name only if provided
    if (name && !validateName(name)) {
      res.status(400).json({ message: 'Name must be at least 2 characters' });
      return;
    }

    // Get stored user data
    const userData = tempUserStore.get(tempUserId);

    if (!userData) {
      res.status(400).json({ 
        message: 'Registration session expired. Please start signup again.' 
      });
      return;
    }

    // Verify OTP
    const verificationResult = await otpService.verifyOtp(tempUserId, otp);

    if (!verificationResult.isValid) {
      res.status(400).json({ message: verificationResult.message });
      return;
    }

    // Create user (name is optional)
    const newUser = await WIEUSER.create({
      email: userData.email || undefined,
      contact_no: userData.contact_no || undefined,
      name: name || undefined,  // Optional now
      password: userData.hashedPassword,
      country_id: userData.country_id,
    });

    // Mark as verified and set status to active
    await WIEUSER.updateVerificationStatus(newUser.id, true);

    // Clean up temporary data
    tempUserStore.delete(tempUserId);
    console.log(`✅ User registered and temp data cleaned: ${tempUserId}`);

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        contact_no: newUser.contact_no,
        name: newUser.name,
        username: newUser.username,
        profile_picture: newUser.profile_picture,
        country_id: newUser.country_id,
        role: newUser.role,
        status: newUser.status,
        is_blocked: newUser.is_blocked,
        is_verified: newUser.is_verified,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Signup verify error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.status(200).json({
      success: true,
      message: 'Google OAuth URL generated',
      data: { authUrl },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Google OAuth URL',
      error: error.message,
    });
  }
};
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('Authorization code is required')}`);
      return;
    }
    const googleUser = await getGoogleUserInfo(code);
    if (!googleUser.verified_email) {
      res.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('Google email is not verified')}`);
      return;
    }
    let user = await WIEUSER.findByGoogleId(googleUser.id);
    if (!user) {
      const existingUser = await WIEUSER.findByEmail(googleUser.email);
      if (existingUser) {
        if (existingUser.auth_provider === 'local' || !existingUser.auth_provider) {
          user = await WIEUSER.linkGoogleAccount(existingUser.id, {
            google_id: googleUser.id,
            profile_picture: googleUser.picture || existingUser.profile_picture || undefined,
            auth_provider: 'hybrid', 
          });
        } else if (existingUser.auth_provider === 'google') {
          user = existingUser;
        } else if (existingUser.auth_provider === 'hybrid') {
          user = existingUser;
          if (googleUser.picture && user.profile_picture !== googleUser.picture) {
            user = await WIEUSER.updateProfile(user.id, {
              profile_picture: googleUser.picture,
            });
          }
        } else {
          res.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('An account with this email already exists with a different login method.')}`);
          return;
        }
      } else {
        user = await WIEUSER.create({
          email: googleUser.email,
          name: googleUser.name,
          profile_picture: googleUser.picture,
          google_id: googleUser.id,
          auth_provider: 'google',
          password: undefined,
        });
      }
    } else {
      // Update existing Google user's profile picture if changed
      if (googleUser.picture && user.profile_picture !== googleUser.picture) {
        user = await WIEUSER.updateProfile(user.id, {
          profile_picture: googleUser.picture,
        });
      }
    }
    if (user.is_blocked) {
      res.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('Your account has been blocked. Please contact support.')}`);
      return;
    }
    const token = generateToken(user);
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      profile_picture: user.profile_picture,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      auth_provider: user.auth_provider,
    };
    const encodedUser = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`${process.env.CORS_ORIGIN}/auth/google/callback?token=${token}&user=${encodedUser}`);
  } catch (error: any) {
    console.error('Google Callback Error:', error);
    res.redirect(`${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent('Google authentication failed')}`);
  }
};
export const checkCanSetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; 

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is Google user without password
    const canSetPassword = user.auth_provider === 'google' && !user.password;

    res.status(200).json({
      success: true,
      canSetPassword,
      authProvider: user.auth_provider,
      hasPassword: !!user.password,
    });
  } catch (error: any) {
    console.error('Check Can Set Password Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check password status', 
      error: error.message 
    });
  }
};
export const setPasswordForGoogleUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // From JWT middleware
    const { password, confirmPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Validate password
    if (!password || !validatePassword(password)) {
      res.status(400).json({ 
        message: 'Password must be at least 6 characters' 
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      res.status(400).json({ 
        message: 'Passwords do not match' 
      });
      return;
    }

    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is eligible to set password
    if (user.auth_provider !== 'google' || user.password) {
      res.status(400).json({ 
        message: user.password 
          ? 'Password already set. Use change password instead.'
          : 'Only Google users can set a password this way.'
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user with password and change auth_provider to hybrid
    const updatedUser = await WIEUSER.setPasswordForOAuthUser(userId, hashedPassword);

    res.status(200).json({
      success: true,
      message: 'Password set successfully. You can now login with email and password.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        auth_provider: updatedUser.auth_provider,
      },
    });
  } catch (error: any) {
    console.error('Set Password Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to set password', 
      error: error.message 
    });
  }
};
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ message: 'Email/Contact number and password are required' });
      return;
    }

    const user = await WIEUSER.findByEmailOrContactNo(identifier);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user has local authentication (password-based)
    if (!user.password || !isLocalAuthUser(user.password)) {
      // Pure Google user (no password set)
      if (user.auth_provider === 'google') {
        res.status(400).json({ 
          message: 'This account uses Google Sign-In. Please login with Google.',
          auth_provider: user.auth_provider
        });
        return;
      }
    }

    // Validate password (for local or hybrid users)
    if (user.password) {
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.is_blocked) {
      res.status(403).json({ message: 'Your account has been blocked' });
      return;
    }

    if (!user.is_verified) {
      res.status(403).json({ 
        message: 'Please verify your account first',
        userId: user.id 
      });
      return;
    }

    const token = generateToken(user);
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        contact_no: user.contact_no,
        name: user.name,
        username: user.username,
        profile_picture: user.profile_picture,
        country_id: user.country_id,
        role: user.role,
        status: user.status,
        is_blocked: user.is_blocked,
        is_verified: user.is_verified,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body; // Can be tempUserId or real userId

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    let email = null;
    let contact_no = null;
    let isTemp = false;

    // Check if it's a temporary user ID (for signup)
    if (userId.startsWith('temp_')) {
      isTemp = true;
      const userData = tempUserStore.get(userId);
      
      if (!userData) {
        res.status(400).json({ 
          message: 'Registration session expired. Please start signup again.' 
        });
        return;
      }

      email = userData.email;
      contact_no = userData.contact_no;
    } else {
      // Real user (for login or re-verification)
      const user = await WIEUSER.findById(userId);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      email = user.email;
      contact_no = user.contact_no;
    }

    // Generate and send new OTP
    const otp = generateOtp();
    await otpService.insertOTP(userId, otp, 5, isTemp ? 'signup' : 'login');

    if (email) {
      await sendEmail(email, otp);
      console.log(`✅ OTP resent to email: ${email}`);
    }

    if (contact_no) {
      await sendSMSOTP(contact_no, otp);
      console.log(`✅ OTP resent to contact: ${contact_no}`);
    }

    res.status(200).json({ 
      message: 'OTP resent successfully',
      expiresIn: '5 minutes'
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }
    const userId = req.user.id;
    const { name, username, country_id, bio, profile_picture } = req.body;
    let countryName = null;
    let countryCode = null;
    if (country_id) {
      const country = await COUNTRY.findById(country_id);
      if (!country) {
        res.status(400).json({ message: 'Invalid country selected' });
        return;
      }
      countryName = country.country_name;
      countryCode = country.country_code;
    }
    const updatedUser = await WIEUSER.updateProfile(userId, {
      name,
      username,
      country_id,
      bio,
      profile_picture,
    });

    // If country_id exists but we didn't fetch it above, get it now
    if (updatedUser.country_id && !countryName) {
      const country = await COUNTRY.findById(updatedUser.country_id);
      if (country) {
        countryName = country.country_name;
        countryCode = country.country_code;
      }
    }
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        contact_no: updatedUser.contact_no,
        name: updatedUser.name,
        username: updatedUser.username,
        profile_picture: updatedUser.profile_picture,
        country_id: updatedUser.country_id,
        country_name: countryName,
        country_code: countryCode,
        bio: updatedUser.bio,
        location: updatedUser.location,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        role: updatedUser.role,
        status: updatedUser.status,
        is_blocked: updatedUser.is_blocked,
        is_verified: updatedUser.is_verified,
        auth_provider: updatedUser.auth_provider,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }
    const userId = req.user.id;
    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    let countryName = null;
    let countryCode = null;
    if (user.country_id) {
      const country = await COUNTRY.findById(user.country_id);
      if (country) {
        countryName = country.country_name;
        countryCode = country.country_code;
      }
    }
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        contact_no: user.contact_no,
        name: user.name,
        username: user.username,
        profile_picture: user.profile_picture,
        country_id: user.country_id,
        country_name: countryName,
        country_code: countryCode,
        bio: user.bio,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        role: user.role,
        status: user.status,
        is_blocked: user.is_blocked,
        is_verified: user.is_verified,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};
export const getUserProfile = async (userId: string) => {
  try {
    const user = await WIEUSER.findById(userId);
    if (!user) {
      return null;
    }

    // Fetch country details if country_id exists
    let country = null;
    if (user.country_id) {
      try {
        country = await COUNTRY.findById(user.country_id);
      } catch (err) {
        console.warn('Failed to fetch country details:', err);
      }
    }

    return {
      id: user.id,
      email: user.email,
      contact_no: user.contact_no,
      name: user.name,
      username: user.username,
      profile_picture: user.profile_picture,
      country_id: user.country_id,
      country_code: country?.country_code || null,
      country_name: country?.country_name || null,
      bio: user.bio,
      latitude: user.latitude,
      longitude: user.longitude,
      location: user.location,
      isOnline: user.isOnline,
      role: user.role,
      status: user.status,
      is_blocked: user.is_blocked,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, contact_no } = req.body;

    // Validate input
    if (!email && !contact_no) {
      res.status(400).json({
        success: false,
        message: 'Please provide either email or contact number',
      });
      return;
    }

    // Find user by either email or contact_no
    let user;
    if (email) {
      user = await WIEUSER.findByEmail(email);
    } else if (contact_no) {
      user = await WIEUSER.findByContactNo(contact_no);
    }

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is blocked
    if (user.is_blocked) {
      res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support.',
      });
      return;
    }
    // Generate OTP
    const otp = generateOtp();
    // Save OTP to database with 10 minute expiry
    await otpService.insertOTP(user.id, otp, 10);
    // Send OTP via email or SMS
    if (email) {
      await sendEmail(email, otp);
    } else if (contact_no) {
      await sendSMSOTP(contact_no, otp);
    }
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully for password reset',
      data: {
        userId: user.id,
      },
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
      error: error.message,
    });
  }
};
// Verify OTP for Password Reset
export const verifyResetOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      res.status(400).json({
        success: false,
        message: 'User ID and OTP are required',
      });
      return;
    }
    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    const isValid = await otpService.verifyOtp(userId, otp);
    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }
    // Generate temporary token for password reset using the actual user data
    const resetToken = generateToken(user);
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken,
        userId,
      },
    });
  } catch (error: any) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};
// Reset Password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'User ID and new password are required',
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Find user
    const user = await WIEUSER.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }
    // Update password
    const updatedUser = await WIEUSER.updatePassword(userId, newPassword);
    // Generate new token
    const token = generateToken(updatedUser);
    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        token,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          username: updatedUser.username,
          profile_picture: updatedUser.profile_picture,
          role: updatedUser.role,
          status: updatedUser.status,
          is_verified: updatedUser.is_verified,
          auth_provider: updatedUser.auth_provider,
        },
      },
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
};
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; 
    const { currentPassword, newPassword } = req.body;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!newPassword || !validatePassword(newPassword)) {
      res.status(400).json({ 
        message: 'New password must be at least 6 characters' 
      });
      return;
    }
    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!user.password) {
      res.status(400).json({ 
        message: 'No password set. Please use set password instead.' 
      });
      return;
    }
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Current password is incorrect' });
      return;
    }
    await WIEUSER.updatePassword(userId, newPassword);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    console.error('Change Password Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to change password', 
      error: error.message 
    });
  }
};
export const getUserLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const location = await WIEUSER.getLocation(req.user.id);
    if (!location) {
      res.status(404).json({ message: 'User location not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    console.error('Get location error:', error);
    res.status(500).json({ message: 'Failed to get location', error: error.message });
  }
};
export const updateUserLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { location, latitude, longitude } = req.body;

    // Build update object based on what's provided
    const updateData: {
      location?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    } = {};

    // Handle location field (string)
    if (location !== undefined) {
      updateData.location = location ? location.trim() : null;
    }

    // Handle coordinates - only validate if they are actual numbers
    if (latitude !== undefined && latitude !== null) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        res.status(400).json({ message: 'Invalid latitude' });
        return;
      }
      updateData.latitude = lat;
    } else if (latitude === null) {
      updateData.latitude = null;
    }

    if (longitude !== undefined && longitude !== null) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        res.status(400).json({ message: 'Invalid longitude' });
        return;
      }
      updateData.longitude = lng;
    } else if (longitude === null) {
      updateData.longitude = null;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: 'No location data provided' });
      return;
    }

    const updatedLocation = await WIEUSER.updateLocation(req.user.id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: updatedLocation,
    });
  } catch (error: any) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Failed to update location', error: error.message });
  }
};
