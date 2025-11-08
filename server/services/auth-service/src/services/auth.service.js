import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";
import mongoose from 'mongoose';
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken, verifyResetToken } from "../utils/jwt.js";
import otpService from "../reposetory/otp.js";
import upload, { uploadToCloudinary, deleteFromCloudinary } from "../middlewares/upload.js";
import { generateOtp } from "../utils/otp.js";
import { sendEmail } from "../utils/sendMail.js";
import { sendSMSOTP } from "../utils/sendSMS.js";

export const index = (req, res) => {
  res.json({ message: "Welcome to the authentication service" });
};
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateContactNo = (contact_no) => {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(contact_no);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateName = (name) => {
  return name && name.trim().length >= 2;
};
export const adminSignup = async (req, res) => {
  try {
    const { name, email, contact_no, password } = req.body;
    if (!name || !validateName(name)) {
      return res.status(400).json({
        message: "Name is required and must be at least 2 characters",
      });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!contact_no || !validateContactNo(contact_no)) {
      return res.status(400).json({ 
        message: "Valid contact number is required (10-15 digits)" 
      });
    }
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        message: "Password is required and must be at least 6 characters",
      });
    }
    const exist = await User.findOne({ email: email, status: "active" });
    if (exist) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const contactExist = await User.findOne({
      contact_no: contact_no,
      status: "active",
    });
    if (contactExist) {
      return res.status(400).json({ message: "Contact number already in use" });
    }
    const existingEmailUser = await User.findOne({
      email: email,
      status: "unverified",
    });
    const existingContactUser = await User.findOne({
      contact_no: contact_no,
      status: "unverified",
    });
    let userToUpdate = null;
    const hashed = await hashPassword(password);
    const image = req.file ? req.file.filename : "";
    if (existingEmailUser && existingContactUser && 
        existingEmailUser._id.toString() === existingContactUser._id.toString()) {
      userToUpdate = existingEmailUser;
      userToUpdate.name = name;
      userToUpdate.password = hashed;
      if (image) userToUpdate.image = image;
      await userToUpdate.save();
      console.log("Found matching unverified user for both email and contact");
    } 
    else if (existingEmailUser && existingContactUser && 
             existingEmailUser._id.toString() !== existingContactUser._id.toString()) {
      await User.deleteOne({ _id: existingEmailUser._id });
      await User.deleteOne({ _id: existingContactUser._id });
      await otpService.deleteAllOtps(existingEmailUser._id);
      await otpService.deleteAllOtps(existingContactUser._id);
      console.log("Deleted conflicting unverified users, creating fresh user");
      userToUpdate = await User.create({
        name,
        email,
        contact_no,
        password: hashed,
        image,
        status: "unverified",
        role: "admin",
      });
    }
    else if (existingEmailUser) {
      userToUpdate = existingEmailUser;
      userToUpdate.name = name;
      userToUpdate.contact_no = contact_no; 
      userToUpdate.password = hashed;
      if (image) userToUpdate.image = image;
      await userToUpdate.save();
      console.log("Updated existing unverified user with new contact number");
    }
    else if (existingContactUser) {
      userToUpdate = existingContactUser;
      userToUpdate.name = name;
      userToUpdate.email = email; 
      userToUpdate.password = hashed;
      if (image) userToUpdate.image = image;
      await userToUpdate.save();
      console.log("Updated existing unverified user with new email");
    }
    else {
      userToUpdate = await User.create({
        name,
        email,
        contact_no,
        password: hashed,
        image,
        status: "unverified",
        role: "admin",
      });
      console.log("Created new unverified user");
    }
    const otp = generateOtp();
    await otpService.insertOTP(userToUpdate._id, otp, 1);
    let emailSent = false;
    let smsSent = false;
    try {
      await sendEmail(userToUpdate.email, otp);
      emailSent = true;
      console.log(`OTP email sent to: ${userToUpdate.email}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }
    try {
      await sendSMSOTP(userToUpdate.contact_no, otp);
      smsSent = true;
      console.log(`OTP SMS sent to: ${userToUpdate.contact_no}`);
    } catch (smsError) {
      console.error("SMS sending failed (Twilio might be expired):", smsError);
    }
    let message = "Signup successful.";
    if (emailSent && smsSent) {
      message += " OTP sent to email and contact number.";
    } else if (emailSent) {
      message += " OTP sent to email only. SMS service temporarily unavailable.";
    } else if (smsSent) {
      message += " OTP sent to contact number only. Email service temporarily unavailable.";
    } else {
      message += " OTP generation successful, but delivery services are temporarily unavailable. Please try again.";
    }
    return res.status(201).json({ 
      message,
      debug: {
        userId: userToUpdate._id,
        email: userToUpdate.email,
        contact: userToUpdate.contact_no
      }
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    return res.status(500).json({ message: "Admin signup failed" });
  }
};
export const organisationSignup = async (req, res) => {
  try {
    const { name, email, contact_no, organisation_type, address, password } = req.body;
    
    // Validation checks
    if (!name || !validateName(name)) {
      return res.status(400).json({
        message: "Name is required and must be at least 2 characters",
      });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!contact_no || !validateContactNo(contact_no)) {
      return res.status(400).json({ 
        message: "Valid contact number is required (10-15 digits)" 
      });
    }
    const validOrgTypes = [
      "Private Limited","Public Limited","Partnership","Proprietorship","LLP", "Government", "NGO", 
      "Educational", "Trust","Society","Healthcare", "Non-profit", "Other"
    ];
    if (!validOrgTypes.includes(organisation_type)) {
      return res.status(400).json({ message: "Invalid organisation type" });
    }
    if (!address || address.trim().length < 5) {
      return res.status(400).json({
        message: "Address is required and must be at least 5 characters",
      });
    }
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        message: "Password is required and must be at least 6 characters",
      });
    }
    const exist = await User.findOne({ email: email, status: "active" });
    if (exist) {
      return res.status(400).json({ message: "Email already in use" });
    }
    const contactExist = await User.findOne({
      contact_no: contact_no,
      status: "active",
    });
    if (contactExist) {
      return res.status(400).json({ message: "Contact number already in use" });
    }
    const existingEmailUser = await User.findOne({
      email: email,
      status: "unverified",
    });
    const existingContactUser = await User.findOne({
      contact_no: contact_no,
      status: "unverified",
    });
    let userToUpdate = null;
    const hashed = await hashPassword(password);
    const image = req.file ? req.file.filename : "";
    if (existingEmailUser && existingContactUser && 
        existingEmailUser._id.toString() === existingContactUser._id.toString()) {
      userToUpdate = existingEmailUser;
      userToUpdate.name = name;
      userToUpdate.organisation_type = organisation_type;
      userToUpdate.address = address;
      userToUpdate.password = hashed;
      if (image) userToUpdate.image = image;
      await userToUpdate.save();
      console.log("Found matching unverified organisation user for both email and contact");
    } 
    else if (existingEmailUser && existingContactUser && 
             existingEmailUser._id.toString() !== existingContactUser._id.toString()) {
      await User.deleteOne({ _id: existingEmailUser._id });
      await User.deleteOne({ _id: existingContactUser._id });
      await otpService.deleteAllOtps(existingEmailUser._id);
      await otpService.deleteAllOtps(existingContactUser._id);
      console.log("Deleted conflicting unverified organisation users, creating fresh user");
      userToUpdate = await User.create({
        name,
        email,
        contact_no,
        organisation_type,
        address,
        password: hashed,
        image,
        status: "unverified",
        role: "organisation",
      });
    }
    else if (existingEmailUser) {
      userToUpdate = existingEmailUser;
      userToUpdate.name = name;
      userToUpdate.contact_no = contact_no; // Update contact
      userToUpdate.organisation_type = organisation_type;
      userToUpdate.address = address;
      userToUpdate.password = hashed;
      if (image) userToUpdate.image = image;
      await userToUpdate.save();
      console.log("Updated existing unverified organisation user with new contact number");
    }
    else if (existingContactUser) {
      userToUpdate = existingContactUser;
      userToUpdate.name = name;
      userToUpdate.email = email; // Update email
      userToUpdate.organisation_type = organisation_type;
      userToUpdate.address = address;
      userToUpdate.password = hashed;
      if (image) userToUpdate.image = image;
      await userToUpdate.save();
      console.log("Updated existing unverified organisation user with new email");
    }
    else {
      userToUpdate = await User.create({
        name,
        email,
        contact_no,
        organisation_type,
        address,
        password: hashed,
        image,
        status: "unverified",
        role: "organisation",
      });
      console.log("Created new unverified organisation user");
    }
    const otp = generateOtp();
    await otpService.insertOTP(userToUpdate._id, otp, 10);
    let emailSent = false;
    let smsSent = false;
    try {
      await sendEmail(userToUpdate.email, otp);
      emailSent = true;
      console.log(`OTP email sent to: ${userToUpdate.email}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }
    try {
      await sendSMSOTP(userToUpdate.contact_no, otp);
      smsSent = true;
      console.log(`OTP SMS sent to: ${userToUpdate.contact_no}`);
    } catch (smsError) {
      console.error("SMS sending failed (Twilio might be expired):", smsError);
    }
    let message = "Signup successful.";
    if (emailSent && smsSent) {
      message += " OTP sent to email and SMS.";
    } else if (emailSent) {
      message += " OTP sent to email only. SMS service temporarily unavailable.";
    } else if (smsSent) {
      message += " OTP sent to SMS only. Email service temporarily unavailable.";
    } else {
      message += " OTP generation successful, but delivery services are temporarily unavailable. Please try again.";
    }
    return res.status(201).json({ 
      message,
      debug: {
        userId: userToUpdate._id,
        email: userToUpdate.email,
        contact: userToUpdate.contact_no
      }
    });
  } catch (err) {
    console.error("Organisation signup error:", err);
    return res.status(500).json({ message: "Organisation signup failed" });
  }
};
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { name: identifier },
        { contact_no: identifier },
      ],
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: "User is blocked" });
    }
    if (user.status === "unverified") {
      return res
        .status(400)
        .json({ message: "Please verify your account first" });
    }
    const token = generateToken(user);
    const { password: _, ...userData } = user.toObject();
    res.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    // Validate ID format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select("-password"); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error in getUserById:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const verifyOTP = async (req, res) => {
  const { email, contact_no, otp } = req.body;
  try {
    console.log("Verify OTP request:", { email, contact_no, otp });

    let user = null;
    let searchField;
    let searchValue;

    if (email && validateEmail(email)) {
      console.log("Searching for user by email:", email);
      user = await User.findOne({ email: email });
      searchField = "email";
      searchValue = email;
    } else if (contact_no) {
      console.log("Searching for user by contact_no:", contact_no);
      user = await User.findOne({ contact_no: contact_no });
      searchField = "contact_no";
      searchValue = contact_no;
    }

    console.log(`User search result for ${searchField} "${searchValue}":`, user ? "Found" : "Not found");
    
    if (user) {
      console.log("Found user for verification:", {
        id: user._id,
        email: user.email,
        contact_no: user.contact_no,
        status: user.status
      });
    }

    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        searchedBy: searchField,
        searchValue: searchValue
      });
    }

    // Verify OTP using user._id
    console.log("Verifying OTP for user ID:", user._id);
    const otpResult = await otpService.verifyOtp(user._id, otp);
    console.log("OTP verification result:", otpResult);
    
    if (!otpResult.isValid) {
      console.log("OTP verification failed:", otpResult.message);
      return res.status(400).json({ message: otpResult.message });
    }

    // Update user status to active
    user.status = "active";
    await user.save();
    console.log("User status updated to active for:", user._id);
    const token = generateToken(user);
    res.status(200).json({ 
      message: "OTP verified successfully",
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        contact_no: user.contact_no,
        isBlocked: user.isBlocked
      }
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({ message: "User ID is required" });
    }
    if (user) {
      user.lastLogout = new Date();
      await user.save();
      console.log("User logout time updated");
    }
    res.json({
      message: "Logout successful",
      success: true,
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    const input = req.body;
    // Add debug log to check if body is being parsed
    console.log("Request body:", input);
    // Validate input
    if (!input || (!input.email && !input.contact_no)) {
      return res.status(400).json({
        message: "Please provide either email or contact number",
      });
    }
    // Find user by either email or contact_no (single query)
    let user;
    if (input.email) {
      user = await User.findOne({ email: input.email });
    } else if (input.contact_no) {
      user = await User.findOne({ contact_no: input.contact_no });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP (e.g., 6 digit)
    const otp = generateOtp(); // e.g., '123456'

    // Save OTP to DB with expiry
    await otpService.insertOTP(user.id, otp, 1); // 1 minute expiry

    // Send OTP only to the provided input (email or contact_no)
    if (input.email) {
      await sendEmail(input.email, otp);
    } else if (input.contact_no) {
      await sendSMSOTP(input.contact_no, otp);
    }

    res.status(200).json({ message: "OTP sent for password reset" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error during forgot password" });
  }
};
export const resendOtp = async (req, res) => {
  try {
    const input = req.body;
    console.log("Resend OTP request body:", input);
    // Validate input
    if (!input || (!input.email && !input.contact_no)) {
      return res.status(400).json({
        message: "Please provide either email or contact number",
      });
    }
    // Find user by either email or contact_no
    let user;
    let searchField;
    let searchValue;

    if (input.email) {
      console.log("Searching for user by email:", input.email);
      user = await User.findOne({ email: input.email });
      searchField = "email";
      searchValue = input.email;
    } else if (input.contact_no) {
      console.log("Searching for user by contact_no:", input.contact_no);
      user = await User.findOne({ contact_no: input.contact_no });
      searchField = "contact_no";
      searchValue = input.contact_no;
    }

    console.log(`User search result for ${searchField} "${searchValue}":`, user ? "Found" : "Not found");
    
    if (user) {
      console.log("Found user details:", {
        id: user._id,
        email: user.email,
        contact_no: user.contact_no,
        userType: user.user_type || user.role || "unknown"
      });
    } else {
      // Let's debug by finding all users with similar email/contact
      if (input.email) {
        const allUsersWithEmail = await User.find({
          email: { $regex: input.email, $options: 'i' }
        }).select('email contact_no user_type role');
        console.log("Similar email users found:", allUsersWithEmail);
      }
      
      if (input.contact_no) {
        const allUsersWithContact = await User.find({
          contact_no: { $regex: input.contact_no, $options: 'i' }
        }).select('email contact_no user_type role');
        console.log("Similar contact users found:", allUsersWithContact);
      }
    }

    if (!user) {
      return res.status(404).json({ 
        message: "User not found",
        searchedBy: searchField,
        searchValue: searchValue
      });
    }

    // Generate new OTP
    const otp = generateOtp();
    console.log("Generated OTP:", otp, "for user:", user._id);

    // Save new OTP to DB with expiry - use user._id not user.id
    await otpService.insertOTP(user._id, otp, 1); // 1 minute expiry
    console.log("OTP saved to database for user:", user._id);

    // Send OTP - prioritize email
    let otpSent = false;
    let sendMethod = '';
    let otpDestination = '';

    // Try email first
    const emailToUse = input.email || user.email;
    if (emailToUse) {
      try {
        console.log("Attempting to send email to:", emailToUse);
        await sendEmail(emailToUse, otp);
        otpSent = true;
        sendMethod = 'email';
        otpDestination = emailToUse;
        console.log("Email sent successfully to:", emailToUse);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    // Try SMS if email failed
    if (!otpSent) {
      const contactToUse = input.contact_no || user.contact_no;
      if (contactToUse) {
        try {
          console.log("Attempting to send SMS to:", contactToUse);
          await sendSMSOTP(contactToUse, otp);
          otpSent = true;
          sendMethod = 'sms';
          otpDestination = contactToUse;
          console.log("SMS sent successfully to:", contactToUse);
        } catch (smsError) {
          console.error("SMS sending failed:", smsError);
        }
      }
    }

    if (!otpSent) {
      console.error("Failed to send OTP via both email and SMS");
      return res.status(500).json({
        message: "Failed to send OTP via email or SMS. Please try again later.",
        success: false,
      });
    }

    res.status(200).json({
      message: `New OTP sent successfully to your ${sendMethod === 'email' ? 'email' : 'phone'}. Previous OTP has been invalidated.`,
      success: true,
      sentTo: otpDestination,
      method: sendMethod
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({
      message: "Server error during OTP resend",
      success: false,
    });
  }
};
export const verifyUser = async (req, res) => {
  try {
    const { input, otp } = req.body;

    if (!input || (!input.email && !input.contact_no)) {
      return res.status(400).json({
        message: "Please provide either email or contact number",
      });
    }
    if (!otp) {
      return res.status(400).json({
        message: "Please provide OTP",
      });
    }
    // Find user by either email or contact_no
    let user;
    if (input.email) {
      user = await User.findOne({ email: input.email });
    } else if (input.contact_no) {
      user = await User.findOne({ contact_no: input.contact_no });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP with enhanced validation
    const verificationResult = await otpService.verifyOtp(user.id, otp);

    if (!verificationResult.isValid) {
      return res.status(400).json({ message: verificationResult.message });
    }
    const token = generateToken(user.id);
    res.status(200).json({
      message: "User verified successfully",
      token: token,
      userId: user._id.toString(),
    });
  } catch (err) {
    console.error("Verify user error:", err);
    res.status(500).json({
      message: "Server error during user verification",
    });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res
        .status(400)
        .json({ message: "User ID and new password are required" });
    }
    if (!userId) {
      return res
        .status(400)
        .json({ message: "Invalid userId: user ID not found" });
    }
    const user = await User.findById(userId);
    console.log("User found:", user ? "Yes" : "No");
    console.log("User ID type:", typeof userId);
    if (!user) {
      // Try to find user with different ID formats
      const userByString = await User.findById(userId.toString());
      console.log("User found by string ID:", userByString ? "Yes" : "No");

      if (!userByString) {
        return res.status(404).json({ message: "User not found" });
      }
      user = userByString;
    }
    user.status = "active";
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();
    const token = generateToken(userId);
    console.log("Password updated successfully for user:", user._id);
    res.status(200).json({
      message: "Password reset successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error during password reset" });
  }
};
export const findAllActiveUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. User authentication required."
      });
    }
    const userId = req.user._id || req.user.id;
    const users = await User.find({ 
      status: 'active',
      _id: { $ne: userId } // Exclude current user
    })
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .lean();
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      contact_no: user.contact_no,
      organisation_type: user.organisation_type,
      followers: user.followers,
      following: user.following,
      website: user.website,
      bio: user.bio,
      gender: user.gender,
      status: user.status,
      address: user.address,
      image: user.image,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    res.status(200).json({
      message: "Active users retrieved successfully",
      users: formattedUsers,
      count: formattedUsers.length
    });
  } catch (err) {
    console.error("Find all users error:", err);
    res.status(500).json({
      message: "Server error during user retrieval",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
export const editProfile = async (req, res) => {
  try {
    // Handle file upload with multer
    await new Promise((resolve, reject) => {
      upload.fields([
        { name: 'image', maxCount: 1 },
      ])(req, res, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
    let userId;
    if (req.user) {
      userId = req.user._id || req.user.id || req.user.userId;
    } else if (req.params.userId) {
      userId = req.params.userId;
    } else {
      throw new Error("Authentication required - No user information found");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    // Find the user
    const user = await User.findOne({ _id: userId,status: 'active'}).select('-password');
    if (!user) {
      throw new Error("User not found");
    }
    // Store original values for fallback
    const originalValues = {
      name: user.name,
      contact_no: user.contact_no,
      address: user.address,
      image: user.image,
      website: user.website,
      bio: user.bio,
      gender: user.gender,
      organisation_type: user.organisation_type
    };
    // Common fields for both admin and organisation
    // Update name if provided and valid
    if (req.body.name !== undefined) {
      if (req.body.name.trim() && validateName(req.body.name)) {
        user.name = req.body.name.trim();
      } else if (req.body.name.trim() === '') {
        user.name = originalValues.name;
      }
    }
    if (req.body.contact_no !== undefined) {
      if (req.body.contact_no.trim() && validateContactNo(req.body.contact_no)) {
        user.contact_no = req.body.contact_no.trim();
      } else if (req.body.contact_no.trim() === '') {
        user.contact_no = originalValues.contact_no;
      }
    }

    // Role-based field updates
    if (user.role === 'admin') {
      // Admin-specific fields
      if (req.body.website !== undefined) {
        user.website = req.body.website.trim() || originalValues.website;
      }

      if (req.body.bio !== undefined) {
        user.bio = req.body.bio.trim() || originalValues.bio;
      }
      if (req.body.gender !== undefined) {
        const validGenders = ['male', 'female', 'other'];
        if (validGenders.includes(req.body.gender)) {
          user.gender = req.body.gender;
        } else {
          user.gender = originalValues.gender;
        }
      }
      
    } else if (user.role === 'organisation') {
      // Organisation-specific fields
      if (req.body.address !== undefined) {
        if (req.body.address.trim() && req.body.address.trim().length >= 5) {
          user.address = req.body.address.trim();
        } else if (req.body.address.trim() === '') {
          user.address = originalValues.address;
        }
      }

      if (req.body.organisation_type !== undefined) {
        const validTypes = ['Private Limited', 'Public Limited', 'Partnership', 'Proprietorship', 'LLP', 
          'NGO', 'Educational', 'Healthcare', 'Non-profit', 'Trust', 'Society','Government', 'Other'];
        if (validTypes.includes(req.body.organisation_type)) {
          user.organisation_type = req.body.organisation_type;
        } else {
          user.organisation_type = originalValues.organisation_type;
        }
      }
      if (req.body.website !== undefined) {
        user.website = req.body.website.trim() || originalValues.website;
      }
      if (req.body.bio !== undefined) {
        user.bio = req.body.bio.trim() || originalValues.bio;
      }
    }
    // Handle image upload to Cloudinary
    if (req.files && req.files.image && req.files.image[0]) {
      try {
        const imageFile = req.files.image[0];
        console.log('Uploading profile image to Cloudinary...');
        // Upload new image to Cloudinary
        const uploadResult = await uploadToCloudinary(imageFile.buffer, {
          folder: 'WIE_AUTH/profile_images',
          transformation: [
            { width: 500, height: 500, crop: 'limit' }, // Limit max dimensions
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });

        console.log('✅ Profile image uploaded:', uploadResult.url);

        // Delete old image from Cloudinary if it exists and is a Cloudinary URL
        if (originalValues.image && originalValues.image.includes('cloudinary.com')) {
          try {
            await deleteFromCloudinary(originalValues.image);
            console.log('✅ Old profile image deleted from Cloudinary');
          } catch (deleteError) {
            console.warn('⚠️ Failed to delete old image:', deleteError.message);
            // Continue anyway - new image is uploaded successfully
          }
        }

        // Update user with new Cloudinary URL
        user.image = uploadResult.url;

      } catch (uploadError) {
        console.error('❌ Error uploading image to Cloudinary:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }
    // If no new image is uploaded, keep the existing image

    // Save the updated user
    await user.save();

    // Return user without password and only with role-appropriate fields
    const userResponse = user.toObject();
    delete userResponse.password;
    
    // Filter response based on role
    if (user.role === 'admin') {
      // Remove organisation-specific fields from admin response
      delete userResponse.address;
      delete userResponse.organisation_type;
    }
    
    // Send success response
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse
    });

  } catch (err) {
    console.error("Edit profile error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
export const viewAllUsers = async (req, res) => { 
  try {
    const { page = 1, limit = 15, sortBy = 'createdAt', order = 'desc', search = '' } = req.query;
    // Build the query object
    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact_no: { $regex: search, $options: 'i' } }
      ]
    };
    // Fetch users from the database
    const users = await User.find({
      ...query,        // existing filters
      status: "active" // only active users
    })
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total user count
    const totalUsers = await User.countDocuments({
      ...query,
      status: "active" // only active users
    });

    // Send response
    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        total: totalUsers,
        page,
        limit
      }
    });
  } catch (err) {
    console.error("View all users error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
export const getOtherProfile = async (req, res) => {
  try {
    const otherId = req.params.otherId;
    const currentUserId = req.user._id || req.user.id;
    const user = await User.findOne({ _id: otherId, status: 'active' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const followRecord = await Follow.findOne({
      follower: currentUserId,
      following: otherId,
      status: 'active'
    }).lean();

    const isFollowing = !!followRecord;

    // Get actual follower and following counts from Follow collection
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: otherId, status: 'active' }),
      Follow.countDocuments({ follower: otherId, status: 'active' })
    ]);

    // Build response object
    const userObject = user.toObject();
    userObject.isFollowing = isFollowing;
    userObject.followersCount = followersCount;
    userObject.followingCount = followingCount;

    // Remove old array fields if they exist
    delete userObject.followersList;
    delete userObject.followingList;

    res.status(200).json({
      message: "Other User Profile fetched successfully",
      user: userObject
    });
  } catch (error) {
    console.error("Error fetching Other User Profile:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getUserData = async (payload) => {
  try {
    console.log('🔍 getUserData called with payload:', payload);
    
    const { userId, action, query, excludeUserId } = payload;

    // Get single user by ID - RETURN ALL FIELDS
    if (userId && !action) {
      const user = await User.findOne({
        _id: userId,
        status: 'active'
      })
        .select('-password -__v') // Exclude only password and version
        .lean();

      if (!user) {
        console.warn(`⚠️ User not found: ${userId}`);
        return { error: 'User not found or inactive' };
      }

      // Get followers and following counts
      const followersCount = await Follow.countDocuments({
        following: userId,
        status: 'active'
      });

      const followingCount = await Follow.countDocuments({
        follower: userId,
        status: 'active'
      });

      // Add counts to user object
      const userWithCounts = {
        ...user,
        followers: followersCount,
        following: followingCount
      };

      console.log(`✅ User found with full data: ${user._id}`);
      return userWithCounts;
    }

    // Search users
    if (action === 'search') {
      if (!query || query.trim().length === 0) {
        return { error: 'Search query is required' };
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      let filter = {
        status: 'active',
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      };

      if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
        filter._id = { $ne: excludeUserId };
      }

      const users = await User.find(filter)
        .select('name email image status contact_no bio')
        .limit(50)
        .lean();

      console.log(`✅ Found ${users.length} users`);
      return users;
    }

    return { error: 'Invalid request' };
  } catch (error) {
    console.error('❌ Error in getUserData:', error);
    return { error: error.message };
  }
};
export const getUser = async (payload) => {
  try {
    console.log('🔍 getUser called with payload:', JSON.stringify(payload));
    const { userId, action, query, excludeUserId } = payload;
    // Get single user by ID - RETURN ALL FIELDS
    if (userId && !action) {
      const user = await User.findOne({
        _id: userId,
        status: 'active'
      })
        .select('-password -__v') // Exclude only password and version
        .lean();

      if (!user) {
        console.warn(`⚠️ User not found: ${userId}`);
        return { error: 'User not found or inactive' };
      }

      // Get followers and following counts
      const followersCount = await Follow.countDocuments({
        following: userId,
        status: 'active'
      });

      const followingCount = await Follow.countDocuments({
        follower: userId,
        status: 'active'
      });

      // Add counts to user object
      const userWithCounts = {
        ...user,
        followers: followersCount,
        following: followingCount
      };

      console.log(`✅ User found with full data: ${user._id}`);
      return userWithCounts;
    }

    // Search users
    if (action === 'search') {
      if (!query || query.trim().length === 0) {
        return { error: 'Search query is required' };
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      let filter = {
        status: 'active',
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      };

      if (excludeUserId && mongoose.Types.ObjectId.isValid(excludeUserId)) {
        filter._id = { $ne: excludeUserId };
      }

      const users = await User.find(filter)
        .select('name email image status contact_no bio organisation_type role')
        .limit(50)
        .lean();

      console.log(`✅ Found ${users.length} users for search`);
      return { users }; // Return as object with users array
    }

    return { error: 'Invalid request' };
  } catch (error) {
    console.error('❌ Error in getUser:', error);
    return { error: error.message };
  }
};
export const getFollowersData = async (payload) => {
  try {    
    const { userId } = payload;

    if (!userId) {
      console.error('❌ userId is missing in payload');
      return { error: 'User ID is required' };
    }

    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('❌ Invalid userId format:', userId);
      return { error: 'Invalid user ID format' };
    }
    const followRelationships = await Follow.find({
      following: userId,
      status: 'active'
    })
      .populate({
        path: 'follower',
        select: '_id name email image status contact_no bio organisation_type role',
        match: { status: 'active' }
      })
      .lean();
    // Filter out null followers (users that might be inactive/deleted)
    const activeFollowers = followRelationships
      .filter(f => f.follower !== null)
      .map(f => ({
        _id: f.follower._id,
        name: f.follower.name,
        email: f.follower.email,
        image: f.follower.image,
        status: f.follower.status,
        contact_no: f.follower.contact_no,
        bio: f.follower.bio,
        organisation_type: f.follower.organisation_type,
        role: f.follower.role
      }));
    return {
      followers: activeFollowers,
      count: activeFollowers.length
    };
  } catch (error) {
    console.error('❌ Error in getFollowersData:', error);
    return { error: error.message };
  }
};
export const findAllActiveUsersService = async (userId, searchQuery = null) => {
  try {
    let filter = { 
      status: 'active',
      _id: { $ne: userId } // Exclude current user
    };

    // Add search if provided
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    const users = await User.find(filter)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .lean();

    return users;
  } catch (error) {
    console.error('❌ Error in findAllActiveUsersService:', error);
    throw error;
  }
};
export const getFollowersService = async (userId) => {
  try {
    const followers = await Follow.find({
      following: userId,
      status: 'active'
    })
      .populate({
        path: 'follower',
        select: '_id name image email status contact_no bio organisation_type role',
        match: { status: 'active' }
      })
      .lean();

    const activeFollowers = followers
      .filter(f => f.follower !== null)
      .map(f => ({
        _id: f.follower._id,
        name: f.follower.name,
        image: f.follower.image,
        email: f.follower.email,
        contact_no: f.follower.contact_no,
        bio: f.follower.bio,
        organisation_type: f.follower.organisation_type,
        role: f.follower.role
      }));
    return activeFollowers;
  } catch (error) {
    console.error('❌ Error in getFollowersService:', error);
    throw error;
  }
};
