import User from "../models/user.model.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken, verifyResetToken } from "../utils/jwt.js";
import otpService from "../reposetory/otp.js";
import upload from "../middlewares/upload.js";
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

    res.status(200).json({ 
      message: "OTP verified successfully"
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
    const user = await User.findById(userId);
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
        // If empty string provided, keep original value
        user.name = originalValues.name;
      }
    }
    if (req.body.contact_no !== undefined) {
      if (req.body.contact_no.trim() && validateContactNo(req.body.contact_no)) {
        user.contact_no = req.body.contact_no.trim();
      } else if (req.body.contact_no.trim() === '') {
        // If empty string provided, keep original value
        user.contact_no = originalValues.contact_no;
      }
    }
    // Role-based field updates
    if (user.role === 'admin') {
      // Admin-specific fields (website, bio, gender are optional for admin)
      // Update website if provided
      if (req.body.website !== undefined) {
        user.website = req.body.website.trim() || originalValues.website;
      }
      // Update bio if provided
      if (req.body.bio !== undefined) {
        user.bio = req.body.bio.trim() || originalValues.bio;
      }
      // Update gender if provided and valid
      if (req.body.gender !== undefined) {
        const validGenders = ['male', 'female', 'other'];
        if (validGenders.includes(req.body.gender)) {
          user.gender = req.body.gender;
        } else {
          user.gender = originalValues.gender;
        }
      }

      // Ignore organisation-specific fields for admin
      // (address and organisation_type are not updated for admin)
      
    } else if (user.role === 'organisation') {
      // Organisation-specific fields
      
      // Update address if provided and valid (required for organisation)
      if (req.body.address !== undefined) {
        if (req.body.address.trim() && req.body.address.trim().length >= 5) {
          user.address = req.body.address.trim();
        } else if (req.body.address.trim() === '') {
          // If empty string provided, keep original value
          user.address = originalValues.address;
        }
      }

      // Update organisation_type if provided and valid (required for organisation)
      if (req.body.organisation_type !== undefined) {
        const validTypes = ['Private', 'Government', 'NGO', 'Educational', 'Healthcare', 'Non-profit', 'Other'];
        if (validTypes.includes(req.body.organisation_type)) {
          user.organisation_type = req.body.organisation_type;
        } else {
          user.organisation_type = originalValues.organisation_type;
        }
      }
      // Update website if provided
      if (req.body.website !== undefined) {
        user.website = req.body.website.trim() || originalValues.website;
      }

      // Update bio if provided
      if (req.body.bio !== undefined) {
        user.bio = req.body.bio.trim() || originalValues.bio;
      }

      // Update gender if provided and valid
      if (req.body.gender !== undefined) {
        const validGenders = ['male', 'female', 'other'];
        if (validGenders.includes(req.body.gender)) {
          user.gender = req.body.gender;
        } else {
          user.gender = originalValues.gender;
        }
      }
    }
    // Handle image upload
    if (req.files && req.files.image && req.files.image[0]) {
      user.image = req.files.image[0].filename;
    }
    // If no new image is uploaded, keep the existing image (originalValues.image is already preserved)

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
export const getOtherProfile = async(req,res)=>{
  try{
    const other = req.params.otherId;
    const user = await User.find({_id: other,status: 'active',});
    res.status(200).json({
            message: "Other User Profile fetched successfully",
            user: user
    });
  }catch(error){
    console.error("Error fetching Other User Profile:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
  }
};
