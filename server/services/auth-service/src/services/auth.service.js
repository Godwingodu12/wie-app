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
    if (!name || !validateName(name)) {
      return res
        .status(400)
        .json({
          message: "Name is required and must be at least 2 characters",
        });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!contact_no || !validateContactNo(contact_no)) {
      return res
        .status(400)
        .json({ message: "Valid contact number is required (10-15 digits)" });
    }
    if (!password || !validatePassword(password)) {
      return res
        .status(400)
        .json({
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
    const existingEmail = await User.findOne({
      email: email,
      status: "unverified",
    });
    if (existingEmail) {
      const otp = generateOtp(); // Generate new OTP
      await otpService.insertOTP(existingEmail._id, otp, 1); // 1 minute OTP with new expiry
      await sendEmail(existingEmail.email, otp);
      await sendSMSOTP(existingEmail.contact_no, otp);
      res
        .status(201)
        .json({
          message: "Signup successfully. OTP sent to email and Contact number.",
        });
    }
    const existingContact_no = await User.findOne({
      contact_no: contact_no,
      status: "unverified",
    });
    if (existingContact_no) {
      const otp = generateOtp(); // Generate new OTP
      await otpService.insertOTP(existingContact_no._id, otp, 10); // Update OTP with new expiry
      await sendEmail(existingContact_no.email, otp);
      await sendSMSOTP(existingContact_no.contact_no, otp);
      res
        .status(201)
        .json({
          message: "Signup successfully. OTP sent to email and Contact number.",
        });
    }
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
    // Generate OTP (e.g., 6 digit)
    const otp = generateOtp(); // => '123456'
    // Save OTP to DB
    await otpService.insertOTP(user._id, otp, 10); // 10 minutes expiry
    // Send OTP via Email
    await sendEmail(user.email, otp);
    // Send OTP via SMS
    await sendSMSOTP(user.contact_no, otp); // Assuming contact_no is a valid phone number
    res
      .status(201)
      .json({
        message: "Signup successfully. OTP sent to email and Contact number.",
      });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};
export const organisationSignup = async (req, res) => {
  try {
    const { name, email, contact_no, organisation_type, address, password } =
      req.body;
    if (!name || !validateName(name)) {
      return res
        .status(400)
        .json({
          message: "Name is required and must be at least 2 characters",
        });
    }
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!contact_no || !validateContactNo(contact_no)) {
      return res
        .status(400)
        .json({ message: "Valid contact number is required (10-15 digits)" });
    }
    const validOrgTypes = [
      "Private",
      "Government",
      "NGO",
      "Educational",
      "Healthcare",
      "Non-profit",
      "Other",
    ];
    if (!validOrgTypes.includes(organisation_type)) {
      return res.status(400).json({ message: "Invalid organisation type" });
    }
    if (!address || address.trim().length < 5) {
      return res
        .status(400)
        .json({
          message: "Address is required and must be at least 5 characters",
        });
    }
    if (!password || !validatePassword(password)) {
      return res
        .status(400)
        .json({
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
    const existingEmail = await User.findOne({
      email: email,
      status: "unverified",
    });
    if (existingEmail) {
      const otp = generateOtp(); // Generate new OTP
      await otpService.insertOTP(existingEmail._id, otp, 10); // Update OTP with new expiry
      await sendEmail(existingEmail.email, otp);
      await sendSMSOTP(existingEmail.contact_no, otp);
      res
        .status(201)
        .json({
          message: "Signup successfully. OTP sent to email and Contact number.",
        });
    }
    const existingContact_no = await User.findOne({
      contact_no: contact_no,
      status: "unverified",
    });
    if (existingContact_no) {
      const otp = generateOtp(); // Generate new OTP
      await otpService.insertOTP(existingContact_no._id, otp, 10); // Update OTP with new expiry
      await sendEmail(existingContact_no.email, otp);
      await sendSMSOTP(existingContact_no.contact_no, otp);
      res
        .status(201)
        .json({
          message: "Signup successfully. OTP sent to email and Contact number.",
        });
    }
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
      role: "organisation", // Set role to organisation
    });
    // Generate OTP (e.g., 6 digit)
    const otp = generateOtp(); // =>
    // Save OTP to DB
    await otpService.insertOTP(user._id, otp, 10); // 10 minutes
    // Send OTP via Email
    await sendEmail(user.email, otp);
    // Send OTP via SMS
    await sendSMSOTP(user.contact_no, otp); // Assuming contact_no is a valid phone number
    res
      .status(201)
      .json({ message: "Signup successfully. OTP sent to email and SMS." });
  } catch (err) {
    console.error("Organisation signup error:", err);
    res.status(500).json({ message: "Organisation signup failed" });
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
  console.log(email, contact_no, otp);
  try {
    let user = null; // Declare user outside if-else
    // If it's a valid email, search by email
    if (validateEmail(email)) {
      user = await User.findOne({ email: email });
    }
    // Else if contact number is provided, search by contact_no
    else if (contact_no) {
      user = await User.findOne({ contact_no: contact_no });
    }
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isValid = await otpService.verifyOtp(user._id, otp);
    console.log(isValid);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
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
