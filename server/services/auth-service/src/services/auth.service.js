import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken, verifyResetToken } from "../utils/jwt.js";
import otpService from "../reposetory/otp.js";
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
    if (!password || !validatePassword(password)) {
      return res.status(400).json({
        message: "Password is required and must be at least 6 characters",
      });
    }
    // Check for existing active users
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
    // Check for existing unverified users by email
    const existingEmail = await User.findOne({
      email: email,
      status: "unverified",
    });
    if (existingEmail) {
      const otp = generateOtp();
      await otpService.insertOTP(existingEmail._id, otp, 1); // 1 minute OTP with new expiry
      let emailSent = false;
      let smsSent = false;
      try {
        await sendEmail(existingEmail.email, otp);
        emailSent = true;
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
      try {
        await sendSMSOTP(existingEmail.contact_no, otp);
        smsSent = true;
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
      return res.status(201).json({ message });
    }
    // Check for existing unverified users by contact number
    const existingContact_no = await User.findOne({
      contact_no: contact_no,
      status: "unverified",
    });
    if (existingContact_no) {
      const otp = generateOtp();
      await otpService.insertOTP(existingContact_no._id, otp, 1); // Update OTP with new expiry
      let emailSent = false;
      let smsSent = false;
      try {
        await sendEmail(existingContact_no.email, otp);
        emailSent = true;
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
      try {
        await sendSMSOTP(existingContact_no.contact_no, otp);
        smsSent = true;
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
      return res.status(201).json({ message });
    }
    // Create new admin user
    const hashed = await hashPassword(password);
    const image = req.file ? req.file.filename : "";
    const user = await User.create({
      name,
      email,
      contact_no,
      password: hashed,
      image,
      status: "unverified",
      role: "admin",
    });
    const otp = generateOtp();
    await otpService.insertOTP(user._id, otp, 1); // 1 minute expiry
    let emailSent = false;
    let smsSent = false;
    try {
      await sendEmail(user.email, otp);
      emailSent = true;
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }
    try {
      await sendSMSOTP(user.contact_no, otp);
      smsSent = true;
    } catch (smsError) {
      console.error("SMS sending failed (Twilio might be expired):", smsError);
    }
    // Provide appropriate response based on what was sent successfully
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
    return res.status(201).json({ message });
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
      "Private", "Government", "NGO", "Educational", 
      "Healthcare", "Non-profit", "Other"
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

    // Check for existing active users
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

    // Check for existing unverified users by email
    const existingEmail = await User.findOne({
      email: email,
      status: "unverified",
    });
    if (existingEmail) {
      const otp = generateOtp();
      await otpService.insertOTP(existingEmail._id, otp, 10);
      
      try {
        await sendEmail(existingEmail.email, otp);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue execution even if email fails
      }
      
      try {
        await sendSMSOTP(existingEmail.contact_no, otp);
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        // Continue execution even if SMS fails (e.g., Twilio expired)
      }
      
      return res.status(201).json({
        message: "Signup successfully. OTP sent to email and contact number.",
      });
    }

    // Check for existing unverified users by contact number
    const existingContact_no = await User.findOne({
      contact_no: contact_no,
      status: "unverified",
    });
    if (existingContact_no) {
      const otp = generateOtp();
      await otpService.insertOTP(existingContact_no._id, otp, 10);
      
      try {
        await sendEmail(existingContact_no.email, otp);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue execution even if email fails
      }
      
      try {
        await sendSMSOTP(existingContact_no.contact_no, otp);
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        // Continue execution even if SMS fails (e.g., Twilio expired)
      }
      return res.status(201).json({
        message: "Signup successfully. OTP sent to email and contact number.",
      });
    }
    // Create new user
    const hashed = await hashPassword(password);
    const image = req.file ? req.file.filename : "";
    const user = await User.create({
      name,
      email,
      contact_no,
      organisation_type,
      address,
      password: hashed,
      image,
      role: "organisation",
    });

    // Generate and save OTP
    const otp = generateOtp();
    await otpService.insertOTP(user._id, otp, 10);

    // Send OTP via email and SMS with error handling
    let emailSent = false;
    let smsSent = false;
    
    try {
      await sendEmail(user.email, otp);
      emailSent = true;
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }
    
    try {
      await sendSMSOTP(user.contact_no, otp);
      smsSent = true;
    } catch (smsError) {
      console.error("SMS sending failed (Twilio might be expired):", smsError);
    }

    // Provide appropriate response based on what was sent successfully
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
    return res.status(201).json({ message });
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
    let user = null; 
    if (validateEmail(email)) {
      user = await User.findOne({ email: email });
    } else if (contact_no) {
      user = await User.findOne({ contact_no: contact_no });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const otpResult = await otpService.verifyOtp(user._id, otp);
    if (!otpResult.isValid) {
      return res.status(400).json({ message: otpResult.message });
    }
    user.status = "active";
    await user.save();
    res.status(200).json({ message: "OTP verified successfully" });
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
    if (input.email) {
      user = await User.findOne({ email: input.email });
    } else if (input.contact_no) {
      user = await User.findOne({ contact_no: input.contact_no });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new OTP
    const otp = generateOtp();

    // Save new OTP to DB with expiry (this will delete existing OTPs automatically)
    await otpService.insertOTP(user.id, otp, 1); // 1 minute expiry

    // Send OTP to the provided input
    if (input.email) {
      await sendEmail(input.email, otp);
    } else if (input.contact_no) {
      await sendSMSOTP(input.contact_no, otp);
    }

    res.status(200).json({
      message: "New OTP sent successfully. Previous OTP has been invalidated.",
      success: true,
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
    // Find user by ID
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
