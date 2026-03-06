import { Request, Response } from "express";
import WIEUSER, { WieUser } from "../models/wieuser.model";
import COUNTRY from "../models/country.model";
import OTP from "../models/otp.model";
import { hashPassword, comparePassword } from "../utils/hash";
import * as followClient from "../grpc/followClient";
import { generateToken } from "../utils/jwt";
import otpService from "../reposetory/otp";
import { generateOtp } from "../utils/otp";
import { sendEmail } from "../utils/sendMail";
import { sendSMSOTP } from "../utils/sendSMS";
import { isLocalAuthUser } from "../utils/password";
import UserMuteModel, { MuteOptions } from "../models/userMute.model";
import { getGoogleAuthUrl, getGoogleUserInfo } from "../utils/google-oauth";
import {
  uploadProfileImage,
  replaceProfileImage,
} from "../utils/cloudinaryHelper";
import {
  validateEmail,
  validateContactNo,
  validatePassword,
  validateName,
} from "../utils/validation.js";
import { createClient } from "redis";
const redis = createClient();
// Store temporary signup data in memory (in production, use Redis)
const tempUserStore = new Map<string, any>();
// Auto-delete unverified users after 15 minutes
const UNVERIFIED_USER_EXPIRY_MINUTES = 15;
// Start periodic cleanup of unverified users
setInterval(
  async () => {
    try {
      const deletedCount = await WIEUSER.deleteUnverifiedUsers(
        UNVERIFIED_USER_EXPIRY_MINUTES,
      );
      if (deletedCount > 0) {
        console.log(
          `🧹 Auto-cleanup: Deleted ${deletedCount} unverified user(s)`,
        );
      }
    } catch (error) {
      console.error("❌ Error in unverified users cleanup:", error);
    }
  },
  5 * 60 * 1000,
); // Run every 5 minutes
export const index = (req: Request, res: Response): void => {
  res.json({ message: "Welcome to the WIE User Service" });
};
export const getCountries = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const countries = await COUNTRY.findAll();
    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error: any) {
    console.error("Get countries error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch countries", error: error.message });
  }
};
const validateCountryCode = async (countryCode: string): Promise<boolean> => {
  const country = await COUNTRY.findByCode(countryCode);
  return !!country;
};
export const signupSendOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, contact_no, password, country_code } = req.body;

    // Validation
    if (!password || !validatePassword(password)) {
      res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
      return;
    }

    if (!country_code) {
      res.status(400).json({ message: "Country is required" });
      return;
    }

    if (!email && !contact_no) {
      res.status(400).json({ message: "Email or contact number is required" });
      return;
    }

    if (email && !validateEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (contact_no && !validateContactNo(contact_no)) {
      res.status(400).json({ message: "Invalid contact number format" });
      return;
    }

    // Validate country exists
    const isValidCountry = await validateCountryCode(country_code);
    if (!isValidCountry) {
      res.status(400).json({ message: "Invalid country selected" });
      return;
    }

    // Get country details (you'll need this for country_id)
    const country = await COUNTRY.findByCode(country_code);
    if (!country) {
      res.status(400).json({ message: "Country not found" });
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
        message: "User already exists with this email or contact number",
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate temporary user ID
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store user data temporarily (expires in 2 minutes)
    tempUserStore.set(tempUserId, {
      email: email || null,
      contact_no: contact_no || null,
      hashedPassword,
      country_id: country.id, // FIXED: Use country.id instead of country_code
      createdAt: Date.now(),
    });
    // Clean up after 2 minutes
    setTimeout(
      () => {
        tempUserStore.delete(tempUserId);
      },
      2 * 60 * 1000,
    );
    // Generate and send OTP
    const otp = generateOtp();
    await otpService.insertOTP(tempUserId, otp, 2, "signup"); // 2 minutes expiration
    if (email) {
      await sendEmail(email, otp);
    }
    if (contact_no) {
      await sendSMSOTP(contact_no, otp);
    }
    res.status(200).json({
      message: "OTP sent successfully",
      tempUserId,
      expiresIn: "2 minutes",
    });
  } catch (error: any) {
    console.error("Signup OTP error:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};
export const signupVerifyOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { tempUserId, otp, name } = req.body;

    if (!tempUserId || !otp) {
      res
        .status(400)
        .json({ message: "Temporary user ID and OTP are required" });
      return;
    }

    // Validate name only if provided
    if (name && !validateName(name)) {
      res.status(400).json({ message: "Name must be at least 2 characters" });
      return;
    }

    // Get stored user data
    const userData = tempUserStore.get(tempUserId);

    if (!userData) {
      res.status(400).json({
        message: "Registration session expired. Please start signup again.",
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
      name: name || undefined, // Optional now
      password: userData.hashedPassword,
      country_id: userData.country_id,
    });

    // Mark as verified and set status to active
    await WIEUSER.updateVerificationStatus(newUser.id, true);

    // Clean up temporary data
    tempUserStore.delete(tempUserId);
    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
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
    console.error("Signup verify error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
};
export const googleAuth = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authUrl = getGoogleAuthUrl();
    res.status(200).json({
      success: true,
      message: "Google OAuth URL generated",
      data: { authUrl },
    });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Google OAuth URL",
      error: error.message,
    });
  }
};
export const googleCallback = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== "string") {
      res.redirect(
        `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("Authorization code is required")}`,
      );
      return;
    }
    const googleUser = await getGoogleUserInfo(code);
    if (!googleUser.verified_email) {
      res.redirect(
        `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("Google email is not verified")}`,
      );
      return;
    }
    let user = await WIEUSER.findByGoogleId(googleUser.id);
    if (!user) {
      const existingUser = await WIEUSER.findByEmail(googleUser.email);
      if (existingUser) {
        if (
          existingUser.auth_provider === "local" ||
          !existingUser.auth_provider
        ) {
          user = await WIEUSER.linkGoogleAccount(existingUser.id, {
            google_id: googleUser.id,
            profile_picture:
              googleUser.picture || existingUser.profile_picture || undefined,
            auth_provider: "hybrid",
          });
        } else if (existingUser.auth_provider === "google") {
          user = existingUser;
        } else if (existingUser.auth_provider === "hybrid") {
          user = existingUser;
          if (
            googleUser.picture &&
            user.profile_picture !== googleUser.picture
          ) {
            user = await WIEUSER.updateProfile(user.id, {
              profile_picture: googleUser.picture,
            });
          }
        } else {
          res.redirect(
            `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("An account with this email already exists with a different login method.")}`,
          );
          return;
        }
      } else {
        user = await WIEUSER.create({
          email: googleUser.email,
          name: googleUser.name,
          profile_picture: googleUser.picture,
          google_id: googleUser.id,
          auth_provider: "google",
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
      res.redirect(
        `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("Your account has been blocked. Please contact support.")}`,
      );
      return;
    }
    await WIEUSER.updateOnlineStatus(user.id, true);
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
    res.redirect(
      `${process.env.CORS_ORIGIN}/auth/google/callback?token=${token}&user=${encodedUser}`,
    );
  } catch (error: any) {
    console.error("Google Callback Error:", error);
    res.redirect(
      `${process.env.CORS_ORIGIN}/login?error=${encodeURIComponent("Google authentication failed")}`,
    );
  }
};
export const getMicrosoftAuthUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
    const scope = encodeURIComponent("User.Read");
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri || "")}&response_mode=query&scope=${scope}&state=12345`;
    res.status(200).json({
      success: true,
      message: "Microsoft OAuth URL generated",
      data: { authUrl },
    });
  } catch (error: any) {
    console.error("Microsoft Auth URL Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Microsoft OAuth URL",
      error: error.message,
    });
  }
};
export const getAppleAuthUrl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const clientId = process.env.APPLE_CLIENT_ID;
    const redirectUri = process.env.APPLE_REDIRECT_URI;
    const scope = encodeURIComponent("name email");
    const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri || "")}&response_mode=form_post&scope=${scope}&state=12345`;
    res.status(200).json({
      success: true,
      message: "Apple OAuth URL generated",
      data: { authUrl },
    });
  } catch (error: any) {
    console.error("Apple Auth URL Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate Apple OAuth URL",
      error: error.message,
    });
  }
};
export const checkCanSetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user is Google user without password
    const canSetPassword = user.auth_provider === "google" && !user.password;

    res.status(200).json({
      success: true,
      canSetPassword,
      authProvider: user.auth_provider,
      hasPassword: !!user.password,
    });
  } catch (error: any) {
    console.error("Check Can Set Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check password status",
      error: error.message,
    });
  }
};
export const setPasswordForGoogleUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id; // From JWT middleware
    const { password, confirmPassword } = req.body;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // Validate password
    if (!password || !validatePassword(password)) {
      res.status(400).json({
        message: "Password must be at least 6 characters",
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      res.status(400).json({
        message: "Passwords do not match",
      });
      return;
    }

    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check if user is eligible to set password
    if (user.auth_provider !== "google" || user.password) {
      res.status(400).json({
        message: user.password
          ? "Password already set. Use change password instead."
          : "Only Google users can set a password this way.",
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Update user with password and change auth_provider to hybrid
    const updatedUser = await WIEUSER.setPasswordForOAuthUser(
      userId,
      hashedPassword,
    );

    res.status(200).json({
      success: true,
      message:
        "Password set successfully. You can now login with email and password.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        auth_provider: updatedUser.auth_provider,
      },
    });
  } catch (error: any) {
    console.error("Set Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set password",
      error: error.message,
    });
  }
};
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res
        .status(400)
        .json({ message: "Email/Contact number and password are required" });
      return;
    }

    const user = await WIEUSER.findByEmailOrContactNo(identifier);
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Check if user has local authentication (password-based)
    if (!user.password || !isLocalAuthUser(user.password)) {
      // Pure Google user (no password set)
      if (user.auth_provider === "google") {
        res.status(400).json({
          message:
            "This account uses Google Sign-In. Please login with Google.",
          auth_provider: user.auth_provider,
        });
        return;
      }
    }

    // Validate password (for local or hybrid users)
    if (user.password) {
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
    } else {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (user.is_blocked) {
      res.status(403).json({ message: "Your account has been blocked" });
      return;
    }

    if (!user.is_verified) {
      res.status(403).json({
        message: "Please verify your account first",
        userId: user.id,
      });
      return;
    }
    await WIEUSER.updateOnlineStatus(user.id, true);
    const token = generateToken(user);
    res.status(200).json({
      message: "Login successful",
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
        isOnline: true,
        last_seen_at: null,
        is_blocked: user.is_blocked,
        is_verified: user.is_verified,
        auth_provider: user.auth_provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const userId = req.user.id;

    // Check user exists before updating
    const user = await WIEUSER.findById(userId);
    if (!user) {
      // User not found — still return success to clear client session
      res.status(200).json({
        message: "Logged out successfully",
        isOnline: false,
      });
      return;
    }

    await WIEUSER.updateOnlineStatus(userId, false);

    try {
      await WIEUSER.incrementTokenVersion(userId);
    } catch (tokenErr) {
      // Non-fatal — still log out even if token version fails
      console.warn('incrementTokenVersion failed during logout:', tokenErr);
    }

    res.status(200).json({
      message: "Logged out successfully from all devices",
      isOnline: false,
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};
export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check OTP limit first
    const limitCheck = await otpService.checkOtpLimit(userId);
    if (!limitCheck.allowed) {
      res.status(429).json({
        message: limitCheck.message,
        remainingAttempts: 0,
      });
      return;
    }

    let email = null;
    let contact_no = null;
    let isTemp = false;

    if (userId.startsWith("temp_")) {
      isTemp = true;
      const userData = tempUserStore.get(userId);

      if (!userData) {
        res.status(400).json({
          message: "Registration session expired. Please start signup again.",
        });
        return;
      }
      email = userData.email;
      contact_no = userData.contact_no;
    } else {
      const user = await WIEUSER.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      email = user.email;
      contact_no = user.contact_no;
    }
    // Generate and send new OTP
    const otp = generateOtp();
    await otpService.insertOTP(userId, otp, 5, isTemp ? "signup" : "login");
    if (email) {
      await sendEmail(email, otp);
    }
    if (contact_no) {
      await sendSMSOTP(contact_no, otp);
    }
    res.status(200).json({
      message: "OTP resent successfully",
      expiresIn: "5 minutes",
      remainingAttempts: limitCheck.remainingAttempts - 1,
    });
  } catch (error: any) {
    console.error("Resend OTP error:", error);

    // Handle rate limit errors
    if (error.message?.includes("Too many OTP requests")) {
      res.status(429).json({
        message: error.message,
        remainingAttempts: 0,
      });
      return;
    }

    res
      .status(500)
      .json({ message: "Failed to resend OTP", error: error.message });
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: User not authenticated" });
      return;
    }
    const userId = req.user.id;
    const { name, username, country_id, bio, website, gender } = req.body;

    // Get current user data to check for existing profile picture
    const currentUser = await WIEUSER.findById(userId);
    if (!currentUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    let profilePictureUrl = currentUser.profile_picture;

    // Handle profile picture upload
    if (req.file) {
      try {
        if (currentUser.profile_picture) {
          // Replace existing image
          profilePictureUrl = await replaceProfileImage(
            req.file.buffer,
            currentUser.profile_picture,
          );
        } else {
          // Upload new image
          profilePictureUrl = await uploadProfileImage(req.file.buffer);
        }
      } catch (uploadError: any) {
        console.error("Profile picture upload error:", uploadError);
        res.status(500).json({
          message: "Failed to upload profile picture",
          error: uploadError.message,
        });
        return;
      }
    }

    let countryName = null;
    let countryCode = null;
    if (country_id) {
      const country = await COUNTRY.findById(country_id);
      if (!country) {
        res.status(400).json({ message: "Invalid country selected" });
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
      website,
      gender,
      profile_picture: profilePictureUrl || undefined,
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
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        contact_no: updatedUser.contact_no,
        name: updatedUser.name,
        username: updatedUser.username,
        profile_picture: updatedUser.profile_picture,
        country_id: updatedUser.country_id,
        country_name: countryName,
        bio: updatedUser.bio,
        website: updatedUser.website,
        gender: updatedUser.gender,
        location: updatedUser.location,
        latitude: updatedUser.latitude,
        longitude: updatedUser.longitude,
        role: updatedUser.role,
        accountPrivacy: updatedUser.accountPrivacy,
        status: updatedUser.status,
        is_blocked: updatedUser.is_blocked,
        is_verified: updatedUser.is_verified,
        auth_provider: updatedUser.auth_provider,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

export const updatePersonalDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: User not authenticated" });
      return;
    }
    const userId = req.user.id;
    const { email, contact_no, dob } = req.body;

    // Validation
    if (email && !validateEmail(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }
    if (contact_no && !validateContactNo(contact_no)) {
      res.status(400).json({ message: "Invalid contact number format" });
      return;
    }

    // Check if email or contact_no already taken by someone else
    if (email) {
      const existingUserEmail = await WIEUSER.findByEmail(email);
      if (existingUserEmail && existingUserEmail.id !== userId) {
        res.status(400).json({ message: "Email is already in use by another user" });
        return;
      }
    }
    if (contact_no) {
      const existingUserPhone = await WIEUSER.findByContactNo(contact_no);
      if (existingUserPhone && existingUserPhone.id !== userId) {
        res.status(400).json({ message: "Contact number is already in use by another user" });
        return;
      }
    }

    let parsedDob: Date | undefined;
    if (dob) {
      parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime())) {
        res.status(400).json({ message: "Invalid date format for dob" });
        return;
      }
    }

    const updatedUser = await WIEUSER.updateProfile(userId, {
      email,
      contact_no,
      dob: parsedDob,
    } as any);

    res.status(200).json({
      message: "Personal details updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        contact_no: updatedUser.contact_no,
        name: updatedUser.name,
        username: updatedUser.username,
        profile_picture: updatedUser.profile_picture,
        country_id: updatedUser.country_id,
        dob: updatedUser.dob,
        bio: updatedUser.bio,
        accountPrivacy: updatedUser.accountPrivacy,
      },
    });
  } catch (error: any) {
    console.error("Update personal details error:", error);
    res
      .status(500)
      .json({ message: "Failed to update personal details", error: error.message });
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized: User not authenticated" });
      return;
    }
    const userId = req.user.id;
    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(400).json({ message: "User not found" });
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
        website: user.website,
        gender: user.gender,
        dob: user.dob,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        role: user.role,
        accountPrivacy: user.accountPrivacy,
        status: user.status,
        isOnline: user.isOnline,
        last_seen_at: user.lastSeenAt,
        is_blocked: user.is_blocked,
        is_verified: user.is_verified,
        auth_provider: user.auth_provider,
        showBadge: user.showBadge,
        showSuggestion: user.showSuggestion,
        created_at: user.created_at,
        updated_at: user.updated_at,

      },
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res
      .status(400)
      .json({ message: "Failed to get profile", error: error.message });
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
        console.warn("Failed to fetch country details:", err);
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
      website: user.website,
      gender: user.gender,
      dob: user.dob,
      latitude: user.latitude,
      longitude: user.longitude,
      location: user.location,
      isOnline: user.isOnline,
      role: user.role,
      accountPrivacy: user.accountPrivacy,
      status: user.status,
      is_blocked: user.is_blocked,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};
export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, contact_no } = req.body;

    // Validate input
    if (!email && !contact_no) {
      res.status(400).json({
        success: false,
        message: "Please provide either email or contact number",
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
        message: "User not found",
      });
      return;
    }

    // Check if user is blocked
    if (user.is_blocked) {
      res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
      return;
    }

    // Check OTP limit BEFORE attempting to send
    const limitCheck = await otpService.checkOtpLimit(user.id);
    if (!limitCheck.allowed) {
      res.status(429).json({
        success: false,
        message: limitCheck.message,
        remainingAttempts: 0,
      });
      return;
    }

    // Generate OTP
    const otp = generateOtp();

    // Save OTP to database with 10 minute expiry
    try {
      await otpService.insertOTP(user.id, otp, 10, "reset");
    } catch (otpError: any) {
      // Handle rate limit errors from insertOTP
      if (otpError.message?.includes("Too many OTP requests")) {
        res.status(429).json({
          success: false,
          message: otpError.message,
          remainingAttempts: 0,
        });
        return;
      }
      throw otpError; // Re-throw other errors
    }

    // Send OTP via email or SMS
    if (email) {
      await sendEmail(email, otp);
    } else if (contact_no) {
      await sendSMSOTP(contact_no, otp);
    }
    res.status(200).json({
      success: true,
      message: "OTP sent successfully for password reset",
      data: {
        userId: user.id,
      },
      remainingAttempts: limitCheck.remainingAttempts - 1, // Include remaining attempts
      expiresIn: "10 minutes",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);

    // Handle specific error types
    if (error.message?.includes("Too many OTP requests")) {
      res.status(429).json({
        success: false,
        message: error.message,
        remainingAttempts: 0,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to process forgot password request",
      error: error.message,
    });
  }
};
export const verifyResetOTP = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      res.status(400).json({
        success: false,
        message: "User ID and OTP are required",
      });
      return;
    }
    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    // Verify OTP (Strict Latest Check)
    const latestOtp = await OTP.findLatestByUser(userId);
    if (!latestOtp) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
      return;
    }
    // Check if the latest OTP matches the provided value
    if (latestOtp.otp_value !== otp) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
      return;
    }

    // Check for expiration
    if (new Date() > new Date(latestOtp.expires_at)) {
      await otpService.deleteAllOtps(userId);
      res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
      return;
    }

    // OTP is valid
    await otpService.deleteAllOtps(userId);
    // Generate temporary token for password reset using the actual user data
    const resetToken = generateToken(user);
    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        resetToken,
        userId,
      },
    });
  } catch (error: any) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error.message,
    });
  }
};
// Reset Password
export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      res.status(400).json({
        success: false,
        message: "User ID and new password are required",
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    // Find user
    const user = await WIEUSER.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
    // Update password
    const updatedUser = await WIEUSER.updatePassword(userId, newPassword);
    // Generate new token
    const token = generateToken(updatedUser);
    res.status(200).json({
      success: true,
      message: "Password reset successfully",
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
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};
export const changePassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!newPassword || !validatePassword(newPassword)) {
      res.status(400).json({
        message: "New password must be at least 6 characters",
      });
      return;
    }
    const user = await WIEUSER.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (!user.password) {
      res.status(400).json({
        message: "No password set. Please use set password instead.",
      });
      return;
    }
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }
    await WIEUSER.updatePassword(userId, newPassword);
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};
export const getUserLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const location = await WIEUSER.getLocation(req.user.id);
    if (!location) {
      res.status(404).json({ message: "User location not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    console.error("Get location error:", error);
    res
      .status(500)
      .json({ message: "Failed to get location", error: error.message });
  }
};
export const updateUserLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
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
        res.status(400).json({ message: "Invalid latitude" });
        return;
      }
      updateData.latitude = lat;
    } else if (latitude === null) {
      updateData.latitude = null;
    }

    if (longitude !== undefined && longitude !== null) {
      const lng = parseFloat(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        res.status(400).json({ message: "Invalid longitude" });
        return;
      }
      updateData.longitude = lng;
    } else if (longitude === null) {
      updateData.longitude = null;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No location data provided" });
      return;
    }

    const updatedLocation = await WIEUSER.updateLocation(
      req.user.id,
      updateData,
    );

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: updatedLocation,
    });
  } catch (error: any) {
    console.error("Update location error:", error);
    res
      .status(500)
      .json({ message: "Failed to update location", error: error.message });
  }
};
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
export const searchUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { query, page = "1", limit = "20" } = req.query;
    const userId = req.user?.id;
    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    // Validate current user ID
    if (userId && !isValidUUID(userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
      return;
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);

    const users = await WIEUSER.findMany(pageNum, limitNum, query);
    const total: number = await WIEUSER.count(query);

    // Filter out current user and blocked users
    const filteredUsers = users.filter(
      (u: WieUser) => u.id !== userId && !u.is_blocked && u.status === "active",
    );

    res.status(200).json({
      success: true,
      users: filteredUsers.map((u: WieUser) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        profile_picture: u.profile_picture,
        bio: u.bio,
        is_verified: u.is_verified,
        followers_count: u.followers_count,
        following_count: u.following_count,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users",
      error: error.message,
    });
  }
};
export const getSuggestedUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit = "10" } = req.query;
    const limitNum = Number(limit);

    // Validate current user ID
    if (userId && !isValidUUID(userId)) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication",
      });
      return;
    }

    // Get more users than needed so we can filter
    const users = await WIEUSER.findMany(1, limitNum * 2);

    // Filter out current user and blocked users, then limit results
    const filteredUsers = users
      .filter(
        (u: WieUser) =>
          u.id !== userId && !u.is_blocked && u.status === "active",
      )
      .slice(0, limitNum);

    res.status(200).json({
      success: true,
      users: filteredUsers.map((u: WieUser) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        profile_picture: u.profile_picture,
        bio: u.bio,
        is_verified: u.is_verified,
        followers_count: u.followers_count,
      })),
    });
  } catch (error: any) {
    console.error("Get suggested users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get suggested users",
      error: error.message,
    });
  }
};
export const updateHeartbeat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    await WIEUSER.updateOnlineStatus(userId, true);

    res.status(200).json({
      success: true,
      message: "Heartbeat updated",
    });
  } catch (error: any) {
    // P1001 = DB unreachable — don't log full stack, just warn
    if (error?.code === 'P1001') {
      console.warn("⚠️ Heartbeat skipped — DB temporarily unreachable");
      res.status(200).json({ success: true, message: "Heartbeat skipped (DB unavailable)" });
      return;
    }
    console.error("Heartbeat error:", error.message);
    res.status(500).json({
      message: "Failed to update heartbeat",
      error: error.message,
    });
  }
};
export const cleanupStaleOnlineUsers = async (): Promise<void> => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const staleUsers = await WIEUSER.findStaleOnlineUsers(twoMinutesAgo);

    for (const user of staleUsers) {
      await WIEUSER.updateOnlineStatus(user.id, false);
    }
  } catch (error: any) {
    // P1001 = DB unreachable — suppress full stack trace, just warn
    if (error?.code === 'P1001') {
      console.warn("⚠️ Stale user cleanup skipped — DB temporarily unreachable");
      return;
    }
    console.error("❌ Error cleaning up stale users:", error.message);
  }
};

export const getAccountPrivacy = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      console.error("❌ No req.user found in getAccountPrivacy");
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
      return;
    }

    const userId = req.user.id;

    const accountPrivacy = await WIEUSER.getAccountPrivacy(userId);

    res.status(200).json({
      success: true,
      accountPrivacy: accountPrivacy || "public",
    });
  } catch (error: any) {
    console.error("❌ Get account privacy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get account privacy",
      error: error.message,
    });
  }
};

export const updateAccountPrivacy = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      console.error("❌ No req.user found in updateAccountPrivacy");
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please login first",
      });
      return;
    }

    const userId = req.user.id;
    const { accountPrivacy } = req.body;

    if (!accountPrivacy || !["public", "private"].includes(accountPrivacy)) {
      console.error("❌ Invalid account privacy value:", accountPrivacy);
      res.status(400).json({
        success: false,
        message: 'Invalid account privacy value. Must be "public" or "private"',
      });
      return;
    }

    const currentPrivacy = await WIEUSER.getAccountPrivacy(userId);
    const updatedUser = await WIEUSER.updateAccountPrivacy(
      userId,
      accountPrivacy,
    );

    if (currentPrivacy === "private" && accountPrivacy === "public") {
      try {
        const result = await followClient.autoAcceptPendingRequests(userId);
      } catch (error: any) {
        console.error(
          "❌ Failed to auto-accept pending requests:",
          error.message,
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `Account privacy updated to ${accountPrivacy}`,
      accountPrivacy: updatedUser.accountPrivacy,
    });
  } catch (error: any) {
    console.error("❌ Update account privacy error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account privacy",
      error: error.message,
    });
  }
};
export const muteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const muterId = req.user.id;
    const { muted_user_id, mute_posts, mute_stories, mute_reels, mute_notes } =
      req.body;

    if (!muted_user_id) {
      res.status(400).json({ message: "Muted user ID is required" });
      return;
    }

    const options: MuteOptions = {
      mutePosts: mute_posts ?? true,
      muteStories: mute_stories ?? true,
      muteReels: mute_reels ?? false,
      muteNotes: mute_notes ?? false,
    };

    const muteRecord = await UserMuteModel.muteUser(
      muterId,
      muted_user_id,
      options,
    );

    res.status(200).json({
      success: true,
      message: "User muted successfully",
      data: muteRecord,
    });
  } catch (error: any) {
    console.error("Mute user error:", error);

    if (error.message === "Cannot mute yourself") {
      res.status(400).json({ message: error.message });
      return;
    }

    if (error.message === "User to mute not found") {
      res.status(404).json({ message: error.message });
      return;
    }

    res.status(500).json({
      message: "Failed to mute user",
      error: error.message,
    });
  }
};
export const getUserById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    // Validate UUID format
    if (!userId) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
      return;
    }

    const user = await WIEUSER.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Don't show blocked or inactive users
    if (user.is_blocked || user.status !== "active") {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        contact_no: user.contact_no,
        profile_picture: user.profile_picture,
        bio: user.bio,
        website: user.website,
        gender: user.gender,
        dob: user.dob,
        location: user.location,
        is_verified: user.is_verified,
        is_blocked: user.is_blocked,
        status: user.status,
        latitude: user.latitude,
        longitude: user.longitude,
        role: user.role,
        accountPrivacy: user.accountPrivacy,
        isOnline: user.isOnline,
        last_seen_at: user.lastSeenAt,
        followers_count: user.followers_count,
        following_count: user.following_count,
        posts_count: user.posts_count,
        created_at: user.created_at,
        auth_provider: user.auth_provider,
      },
    });
  } catch (error: any) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message,
    });
  }
};
export const unmuteUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const muterId = req.user.id;
    const { muted_user_id } = req.body;

    if (!muted_user_id) {
      res.status(400).json({ message: "Muted user ID is required" });
      return;
    }

    const success = await UserMuteModel.unmuteUser(muterId, muted_user_id);

    if (!success) {
      res.status(404).json({ message: "Mute record not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User unmuted successfully",
    });
  } catch (error: any) {
    console.error("Unmute user error:", error);
    res.status(500).json({
      message: "Failed to unmute user",
      error: error.message,
    });
  }
};

export const updateMuteOptions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const muterId = req.user.id;
    const { muted_user_id, mute_posts, mute_stories, mute_reels, mute_notes } =
      req.body;

    if (!muted_user_id) {
      res.status(400).json({ message: "Muted user ID is required" });
      return;
    }

    const options: MuteOptions = {};
    if (mute_posts !== undefined) options.mutePosts = mute_posts;
    if (mute_stories !== undefined) options.muteStories = mute_stories;
    if (mute_reels !== undefined) options.muteReels = mute_reels;
    if (mute_notes !== undefined) options.muteNotes = mute_notes;

    const updated = await UserMuteModel.updateMuteOptions(
      muterId,
      muted_user_id,
      options,
    );

    res.status(200).json({
      success: true,
      message: "Mute options updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update mute options error:", error);

    if (error.message === "Mute record not found") {
      res.status(404).json({ message: error.message });
      return;
    }

    res.status(500).json({
      message: "Failed to update mute options",
      error: error.message,
    });
  }
};

export const checkMuteStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const muterId = req.user.id;
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const status = await UserMuteModel.checkMuteStatus(muterId, user_id);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error("Check mute status error:", error);
    res.status(500).json({
      message: "Failed to check mute status",
      error: error.message,
    });
  }
};

export const getMutedUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const muterId = req.user.id;
    const mutedUsers = await UserMuteModel.getMutedUsers(muterId);

    res.status(200).json({
      success: true,
      count: mutedUsers.length,
      data: mutedUsers,
    });
  } catch (error: any) {
    console.error("Get muted users error:", error);
    res.status(500).json({
      message: "Failed to get muted users",
      error: error.message,
    });
  }
};

export const getMutedCount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const muterId = req.user.id;
    const count = await UserMuteModel.getMutedCount(muterId);

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error("Get muted count error:", error);
    res.status(500).json({
      message: "Failed to get muted count",
      error: error.message,
    });
  }
};

export const updateShowBadge = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const { show_badge } = req.body;

    if (typeof show_badge !== "boolean") {
      res.status(400).json({ message: "Invalid show_badge value" });
      return;
    }

    const updatedUser = await WIEUSER.updateShowBadge(userId, show_badge);

    res.status(200).json({
      success: true,
      message: "Show badge updated successfully",
      user: {
        id: updatedUser.id,
        showBadge: updatedUser.showBadge,
      },
    });
  } catch (error: any) {
    console.error("Update show badge error:", error);
    res.status(500).json({
      message: "Failed to update show badge",
      error: error.message,
    });
  }
};

export const updateShowSuggestion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const { show_suggestion } = req.body;

    if (typeof show_suggestion !== "boolean") {
      res.status(400).json({ message: "Invalid show_suggestion value" });
      return;
    }

    const updatedUser = await WIEUSER.updateShowSuggestion(userId, show_suggestion);

    res.status(200).json({
      success: true,
      message: "Show suggestion updated successfully",
      user: {
        id: updatedUser.id,
        showSuggestion: updatedUser.showSuggestion,
      },
    });
  } catch (error: any) {
    console.error("Update show suggestion error:", error);
    res.status(500).json({
      message: "Failed to update show suggestion",
      error: error.message,
    });
  }
};
