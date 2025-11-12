import { Request, Response } from 'express';
import WIEUSER from '../models/wieuser.model';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import otpService from '../reposetory/otp';
import { generateOtp } from '../utils/otp';
import { sendEmail } from '../utils/sendMail';
import { sendSMSOTP } from '../utils/sendSMS';
import {
  validateEmail,
  validateContactNo,
  validatePassword,
  validateName,
} from '../utils/validation.js';
// Store temporary signup data in memory (in production, use Redis)
const tempUserStore = new Map<string, any>();
export const index = (req: Request, res: Response): void => {
  res.json({ message: 'Welcome to the WIE User Service' });
};
export const signupSendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, contact_no, name, password } = req.body;

    // Validation
    if (!name || !validateName(name)) {
      res.status(400).json({ message: 'Name must be at least 2 characters' });
      return;
    }

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
      name,
      hashedPassword,
      createdAt: Date.now(),
    });

    // Clean up after 15 minutes
    setTimeout(() => {
      tempUserStore.delete(tempUserId);
    }, 15 * 60 * 1000);

    // Generate and send OTP
    const otp = generateOtp();
    await otpService.insertOTP(tempUserId, otp, 5); // 5 minutes expiration

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
      // Don't send userData back for security
    });
  } catch (error: any) {
    console.error('Signup OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};
export const signupVerifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempUserId, otp } = req.body;

    if (!tempUserId || !otp) {
      res.status(400).json({ message: 'Temporary user ID and OTP are required' });
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

    // Create user
    const newUser = await WIEUSER.create({
      email: userData.email || undefined,
      contact_no: userData.contact_no || undefined,
      name: userData.name,
      password: userData.hashedPassword,
    });

    // Mark as verified
    await WIEUSER.updateVerificationStatus(newUser.id, true);

    // Clean up temporary data
    tempUserStore.delete(tempUserId);

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
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Signup verify error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body; // identifier can be email or contact_no

    if (!identifier || !password) {
      res.status(400).json({ message: 'Email/Contact number and password are required' });
      return;
    }

    // Find user by email or contact number
    const user = await WIEUSER.findByEmailOrContactNo(identifier);

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is blocked
    if (user.is_blocked) {
      res.status(403).json({ message: 'Your account has been blocked' });
      return;
    }

    // Check if user is verified
    if (!user.is_verified) {
      res.status(403).json({ 
        message: 'Please verify your account first',
        userId: user.id 
      });
      return;
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        contact_no: user.contact_no,
        name: user.name,
        role: user.role,
        profile_picture: user.profile_picture,
        is_verified: user.is_verified,
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

    // Check if it's a temporary user ID (for signup)
    if (userId.startsWith('temp_')) {
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
      // Real user (for login)
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
    await otpService.insertOTP(userId, otp, 5);

    if (email) {
      await sendEmail(email, otp);
      console.log(`✅ OTP resent to email: ${email}`);
    }

    if (contact_no) {
      await sendSMSOTP(contact_no, otp);
      console.log(`✅ OTP resent to contact: ${contact_no}`);
    }

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
};