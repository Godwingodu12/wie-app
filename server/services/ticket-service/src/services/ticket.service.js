import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
import upload from "../middlewares/upload.js";
import TicketAudit from '../models/ticketAudit.model.js';
import Attendance from '../models/attendance.model.js';
import { verifyBookingQR } from '../grpc/bookingClient.js';
import fs from "fs";
import cron from "node-cron";
import { uploadTicketMedia, uploadFields } from "../middlewares/upload.js";
import { validateIFSCCode, validateAadhaarDocument } from "../utils/datavalidationHelper.js";
import {
  generateSeatingLayoutFromFile,
  normalizeSeatData,
  generateFallbackLayout
} from '../utils/seatingLayoutGenerator.js';
import {
  processFileUploads,
  deleteFromCloudinary,
  processGroupFileUploads,
  cleanupTempFile,
  uploadGeneratedLayoutToCloudinary,
  downloadFileFromCloudinary,
  extractPublicId
} from "../utils/cloudinaryHelper.js";
import { createNotification } from '../utils/notificationHelper.js';
import multer from "multer";
import { getUserFromAuthService } from "../grpc/authClient.js";
const _processingRequests = new Set();
// GST Configuration
const GST_PERCENTAGE = parseFloat(process.env.TAX_PERCENTAGE || '18');

/**
 * Decide GST applicability.
 * Rule: If group has a GSTIN → GST is MANDATORY regardless of frontend input.
 *       If group has no GSTIN → GST is OPTIONAL; honour the organiser's choice.
 */
export const resolveGSTApplicability = (group, paymentType, frontendChoice) => {
  if (paymentType !== 'paid') return { applicable: false, mandatory: false };

  const hasGSTIN = !!(group?.gst_no && String(group.gst_no).trim() !== '');
  if (hasGSTIN) return { applicable: true, mandatory: true };

  // No GSTIN — use organiser's explicit choice from the form
  const chosen = frontendChoice === true || frontendChoice === 'true';
  return { applicable: chosen, mandatory: false };
};

// The organiser enters BASE price. GST is added ON TOP.
// e.g. base=100, GST=18% → inclusive=118, gstAmount=18
export const extractGSTFromInclusive = (basePrice, gstPct) => {
  const base = Math.round(basePrice * 100) / 100;
  const gstAmount = Math.round(base * (gstPct / 100) * 100) / 100;
  const inclusivePrice = Math.round((base + gstAmount) * 100) / 100;
  return { basePrice: base, gstAmount, inclusivePrice };
};

function parseJSONSafely(value, defaultValue = []) {
  if (!value) return defaultValue;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("JSON parse error for value:", value);
      return defaultValue;
    }
  }

  if (Array.isArray(value)) {
    return value;
  }
  return defaultValue;
}
export const getUserData = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const userData = await getUserFromAuthService(userId, 3, true);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User retrieved successfully",
      user: userData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const CreateGroup = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    let usertype;
    if (userRole === "organisation") {
      usertype = req.user.organisation_type;
    }
    if (!["admin", "organisation"].includes(userRole)) {
      return res.status(400).json({ message: "Invalid user role" });
    }
    const userData = await getUserFromAuthService(userId);
    if (!userData) {
      return res
        .status(404)
        .json({ message: "User not found in auth service" });
    }
    const {
      name,
      email,
      contact_no,
      address,
      gst_no,
      pan_no,
      organisation_type,
      grp_type,
      primary_bank_acc_type,
      primary_bank_acc_no,
      primary_bank_ifsc,
      primary_bank_acc_holder,
    } = req.body;

    // VALIDATE IFSC CODE IF PROVIDED (before file upload)
    if (primary_bank_ifsc) {
      const ifscValidation = await validateIFSCCode(primary_bank_ifsc);

      if (!ifscValidation.isValid) {
        return res.status(400).json({
          message: "Invalid bank IFSC code",
          error: ifscValidation.error,
        });
      }
    }

    // VALIDATE AADHAAR CARD IF UPLOADED (BEFORE CLOUDINARY UPLOAD)
    if (req.files?.id_proof?.[0]) {
      const aadhaarValidation = await validateAadhaarDocument(req.files.id_proof[0]);
      if (!aadhaarValidation.isValid) {
        return res.status(400).json({
          message: "Aadhaar card validation failed",
          error: aadhaarValidation.error,
        });
      }
    }

    // NOW PROCESS FILE UPLOADS TO CLOUDINARY (after validation passes)
    let uploadedFiles = {};
    if (req.files) {
      try {
        uploadedFiles = await processGroupFileUploads(req.files);
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({
          message: "File upload failed",
          error: uploadError.message,
        });
      }
    }

    const filePaths = {
      id_proof: uploadedFiles.id_proof || null,
      bank_check: uploadedFiles.bank_check || null,
      company_certificate: uploadedFiles.company_certificate || null,
      company_logo: uploadedFiles.company_logo || null,
    };

    // Determine actual group type
    let actualGroupType;
    if (userRole === "admin") {
      if (!grp_type || !["admin", "organisation"].includes(grp_type)) {
        return res.status(400).json({
          message: "Admin must specify group type (admin or organisation)",
        });
      }
      actualGroupType = grp_type;
    } else {
      actualGroupType = "organisation";
    }

    // Check group creation limits
    const existingGroups = await Group.find({ userId: userId });
    if (userRole === "admin") {
      // Admin user limits: 1 admin group + 1 organisation group = max 2 groups
      const adminGroups = existingGroups.filter((g) => g.grp_type === "admin");
      const orgGroups = existingGroups.filter(
        (g) => g.grp_type === "organisation"
      );
      if (actualGroupType === "admin" && adminGroups.length >= 1) {
        return res.status(400).json({
          message: "Admin users can only create one admin group",
        });
      }
      if (actualGroupType === "organisation" && orgGroups.length >= 1) {
        return res.status(400).json({
          message: "Admin users can only create one organisation group",
        });
      }
    } else {
      // Organisation user limit: max 4 organisation groups
      if (existingGroups.length >= 4) {
        return res.status(400).json({
          message: "Organisation users can create maximum 4 groups",
        });
      }
    }

    // Prepare data for duplication checking
    let checkName, checkEmail, checkContact, checkPan, checkGst;
    if (actualGroupType === "admin") {
      // For admin groups, use user data from auth service
      checkName = userData.name;
      checkEmail = userData.email;
      checkContact = userData.contact_no;
      checkPan = pan_no;
      checkGst = gst_no || null;
    } else {
      // For organisation groups, use form data
      checkName = name;
      checkEmail = email;
      checkContact = contact_no;
      checkPan = pan_no;
      checkGst = gst_no || null;
    }

    // COMPREHENSIVE DUPLICATION CHECK
    const duplicateQuery = {
      $or: [
        // Check for duplicate PAN number (most unique identifier)
        { pan_no: checkPan },
        // Check for duplicate combination of name + email
        {
          $and: [
            { name: { $regex: new RegExp(`^${checkName.trim()}$`, "i") } },
            { email: { $regex: new RegExp(`^${checkEmail.trim()}$`, "i") } },
          ],
        },
        // Check for duplicate combination of name + contact
        {
          $and: [
            { name: { $regex: new RegExp(`^${checkName.trim()}$`, "i") } },
            { contact_no: checkContact.trim() },
          ],
        },

        // Check for duplicate combination of email + contact
        {
          $and: [
            { email: { $regex: new RegExp(`^${checkEmail.trim()}$`, "i") } },
            { contact_no: checkContact.trim() },
          ],
        },
      ],
    };

    // Add GST number to duplication check if provided
    if (checkGst && checkGst.trim()) {
      duplicateQuery.$or.push({ gst_no: checkGst.trim() });
    }

    const existingGroup = await Group.findOne(duplicateQuery);
    if (existingGroup) {
      // Delete uploaded files if duplicate found
      if (Object.keys(uploadedFiles).length > 0) {
        for (const fileUrl of Object.values(uploadedFiles)) {
          if (fileUrl) {
            try {
              const publicId = extractPublicId(fileUrl);
              if (publicId) {
                await deleteFromCloudinary(publicId, "image");
              }
            } catch (deleteError) {
              console.error('Error deleting uploaded file:', deleteError);
            }
          }
        }
      }

      // Determine which field(s) caused the duplication
      let duplicateFields = [];

      if (existingGroup.pan_no === checkPan) {
        duplicateFields.push("PAN number");
      }
      if (existingGroup.name.toLowerCase() === checkName.toLowerCase()) {
        duplicateFields.push("name");
      }
      if (existingGroup.email.toLowerCase() === checkEmail.toLowerCase()) {
        duplicateFields.push("email");
      }
      if (existingGroup.contact_no === checkContact) {
        duplicateFields.push("contact number");
      }
      if (checkGst && existingGroup.gst_no === checkGst) {
        duplicateFields.push("GST number");
      }

      return res.status(409).json({
        message: `Group with the same ${duplicateFields.join(
          ", "
        )} already exists`,
        duplicateFields: duplicateFields,
        existingGroupId: existingGroup._id,
      });
    }

    // Validation based on group type
    if (actualGroupType === "admin") {
      // For admin groups, use user data from auth service
      if (!userData.name || !userData.email || !userData.contact_no) {
        return res.status(400).json({
          message: "Admin user data incomplete. Please update your profile.",
        });
      }
      // Basic validation for admin group
      if (!pan_no || !filePaths.id_proof) {
        return res.status(400).json({
          message: "Missing required fields: pan_no, id_proof file",
        });
      }
    } else {
      // Organisation group validations
      if (!name || !email || !contact_no || !pan_no || !filePaths.id_proof) {
        return res.status(400).json({
          message:
            "Missing required fields: name, email, contact_no, pan_no, id_proof file",
        });
      }
      if (!organisation_type) {
        return res
          .status(400)
          .json({ message: "Organisation type is required" });
      }
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }
      // Sectors where GST registration is mandatory under Indian law
      // (profit-oriented commercial entities)
      const GST_MANDATORY_SECTORS = [
        "Private Limited", "Public Limited", "Partnership",
        "Proprietorship", "LLP",
      ];
      // Sectors where GST is conditional (commercial activity dependent)
      const GST_CONDITIONAL_SECTORS = [
        "NGO", "Non-profit", "Trust", "Society",
      ];
      // Sectors that are generally GST-exempt for core activities
      // (educational, healthcare) — GST still optional if they choose to register
      const GST_EXEMPT_SECTORS = [
        "Educational", "Healthcare", "Institute",
      ];
      const orgTypeLower = (organisation_type || "").toLowerCase().trim();
      const isGSTMandatory = GST_MANDATORY_SECTORS.includes(orgTypeLower);
      const isGSTConditional = GST_CONDITIONAL_SECTORS.includes(orgTypeLower);
      const isGSTExempt = GST_EXEMPT_SECTORS.includes(orgTypeLower);
      // Enforce GST only for mandatory sectors
      if (isGSTMandatory && !gst_no) {
        return res.status(400).json({
          message: `GST number is required for ${organisation_type} organisations`,
          hint: "Profit-oriented business entities must have GST registration",
          sector: organisation_type,
        });
      }

      // For conditional sectors: warn but don't block (they may or may not be registered)
      // For exempt sectors: completely optional

      // Bank check and company logo required for all non-exempt sectors
      if (!isGSTExempt) {
        if (!filePaths.bank_check) {
          return res.status(400).json({
            message: "Bank check document is required",
          });
        }
        if (!filePaths.company_logo) {
          return res.status(400).json({
            message: "Company logo is required",
          });
        }
      }

    }

    // Additional validation: If bank account details are provided, IFSC is required
    if ((primary_bank_acc_no || primary_bank_acc_type || primary_bank_acc_holder) && !primary_bank_ifsc) {
      return res.status(400).json({
        message: "Bank IFSC code is required when providing bank account details",
      });
    }

    // Build group data
    const groupData = {
      pan_no: checkPan,
      userId: userId,
      grp_type: actualGroupType,
      status: "active",
    };

    if (primary_bank_acc_type)
      groupData.primary_bank_acc_type = primary_bank_acc_type;
    if (primary_bank_acc_no)
      groupData.primary_bank_acc_no = primary_bank_acc_no;
    if (primary_bank_ifsc) groupData.primary_bank_ifsc = primary_bank_ifsc;
    if (primary_bank_acc_holder)
      groupData.primary_bank_acc_holder = primary_bank_acc_holder;

    if (actualGroupType === "admin") {
      // Use admin user data from auth service
      groupData.name = userData.name;
      groupData.email = userData.email;
      groupData.contact_no = userData.contact_no;
      groupData.id_proof = filePaths.id_proof;

      // Add optional fields for admin
      if (filePaths.bank_check) groupData.bank_check = filePaths.bank_check;
      if (filePaths.company_certificate)
        groupData.company_certificate = filePaths.company_certificate;
      if (filePaths.company_logo)
        groupData.company_logo = filePaths.company_logo;
      if (gst_no) groupData.gst_no = gst_no;
    } else {
      // Use form data for organisation
      groupData.name = name;
      groupData.email = email;
      groupData.contact_no = contact_no;
      groupData.address = address;
      groupData.organisation_type = organisation_type;
      groupData.id_proof = filePaths.id_proof;
      // Add optional/conditional fields
      if (gst_no) groupData.gst_no = gst_no;
      if (filePaths.bank_check) groupData.bank_check = filePaths.bank_check;
      if (filePaths.company_certificate)
        groupData.company_certificate = filePaths.company_certificate;
      if (filePaths.company_logo)
        groupData.company_logo = filePaths.company_logo;
    }

    // Helper function to determine file type from mimetype
    const getFileType = (mimetype) => {
      if (mimetype?.startsWith("image/")) return "image";
      if (mimetype?.includes("pdf")) return "pdf";
      if (mimetype?.includes("document") || mimetype?.includes("msword"))
        return "doc";
      return "unknown";
    };

    // Add file types to groupData
    if (filePaths.id_proof && req.files?.id_proof?.[0]) {
      groupData.id_proof_type = getFileType(req.files.id_proof[0].mimetype);
    }
    if (filePaths.bank_check && req.files?.bank_check?.[0]) {
      groupData.bank_check_type = getFileType(req.files.bank_check[0].mimetype);
    }
    if (filePaths.company_certificate && req.files?.company_certificate?.[0]) {
      groupData.company_certificate_type = getFileType(
        req.files.company_certificate[0].mimetype
      );
    }

    const newGroup = new Group(groupData);
    await newGroup.save();

    res.status(201).json({
      message: "Group created successfully",
      group: newGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Max 10MB." });
      }
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ message: "Validation error", errors: messages });
    }
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        message: `Group with this ${field} already exists`,
        field: field,
      });
    }
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const UpdateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    // Validate groupId
    if (!groupId) {
      return res.status(400).json({ message: "Group ID is required" });
    }

    // Find the existing group
    const existingGroup = await Group.findById(groupId);
    if (!existingGroup) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Authorization check - ensure user owns this group
    if (existingGroup.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this group",
      });
    }

    // Extract update data from request body
    const {
      name,
      email,
      contact_no,
      address,
      gst_no,
      pan_no,
      organisation_type,
      primary_bank_acc_type,
      primary_bank_acc_no,
      primary_bank_ifsc,
      primary_bank_acc_holder,
      status,
    } = req.body;
    // VALIDATE IFSC CODE IF PROVIDED AND CHANGED
    if (primary_bank_ifsc !== undefined && primary_bank_ifsc && primary_bank_ifsc !== existingGroup.primary_bank_ifsc) {
      const ifscValidation = await validateIFSCCode(primary_bank_ifsc);
      if (!ifscValidation.isValid) {
        return res.status(400).json({
          message: "Invalid bank IFSC code",
          error: ifscValidation.error,
        });
      }
    }

    // VALIDATE AADHAAR CARD IF NEW FILE IS UPLOADED (BEFORE CLOUDINARY UPLOAD)
    if (req.files?.id_proof?.[0]) {
      const aadhaarValidation = await validateAadhaarDocument(req.files.id_proof[0]);

      if (!aadhaarValidation.isValid) {
        return res.status(400).json({
          message: "Aadhaar card validation failed",
          error: aadhaarValidation.error,
        });
      }
    }

    // NOW PROCESS FILE UPLOADS TO CLOUDINARY (after validation passes)
    let uploadedFiles = {};
    const filesToDelete = [];

    if (req.files && Object.keys(req.files).length > 0) {
      try {
        uploadedFiles = await processGroupFileUploads(req.files);

        // Track old files for deletion
        if (uploadedFiles.id_proof && existingGroup.id_proof) {
          filesToDelete.push(existingGroup.id_proof);
        }
        if (uploadedFiles.bank_check && existingGroup.bank_check) {
          filesToDelete.push(existingGroup.bank_check);
        }
        if (uploadedFiles.company_certificate && existingGroup.company_certificate) {
          filesToDelete.push(existingGroup.company_certificate);
        }
        if (uploadedFiles.company_logo && existingGroup.company_logo) {
          filesToDelete.push(existingGroup.company_logo);
        }
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({
          message: "File upload failed",
          error: uploadError.message,
        });
      }
    }
    // Prepare data for duplication checking (only if unique fields are being updated)
    const duplicateQuery = {
      _id: { $ne: groupId }, // Exclude current group from check
    };
    let needsDuplicateCheck = false;
    const orConditions = [];

    // Build duplicate check query only for fields being updated
    if (pan_no && pan_no !== existingGroup.pan_no) {
      orConditions.push({ pan_no: pan_no });
      needsDuplicateCheck = true;
    }

    if (name && email) {
      const checkName = name || existingGroup.name;
      const checkEmail = email || existingGroup.email;

      if (
        checkName.toLowerCase() !== existingGroup.name.toLowerCase() ||
        checkEmail.toLowerCase() !== existingGroup.email.toLowerCase()
      ) {
        orConditions.push({
          $and: [
            { name: { $regex: new RegExp(`^${checkName.trim()}$`, "i") } },
            { email: { $regex: new RegExp(`^${checkEmail.trim()}$`, "i") } },
          ],
        });
        needsDuplicateCheck = true;
      }
    }

    if (contact_no && name) {
      const checkName = name || existingGroup.name;
      const checkContact = contact_no || existingGroup.contact_no;

      if (
        checkName.toLowerCase() !== existingGroup.name.toLowerCase() ||
        checkContact !== existingGroup.contact_no
      ) {
        orConditions.push({
          $and: [
            { name: { $regex: new RegExp(`^${checkName.trim()}$`, "i") } },
            { contact_no: checkContact.trim() },
          ],
        });
        needsDuplicateCheck = true;
      }
    }

    if (email && contact_no) {
      const checkEmail = email || existingGroup.email;
      const checkContact = contact_no || existingGroup.contact_no;

      if (
        checkEmail.toLowerCase() !== existingGroup.email.toLowerCase() ||
        checkContact !== existingGroup.contact_no
      ) {
        orConditions.push({
          $and: [
            { email: { $regex: new RegExp(`^${checkEmail.trim()}$`, "i") } },
            { contact_no: checkContact.trim() },
          ],
        });
        needsDuplicateCheck = true;
      }
    }

    if (gst_no && gst_no !== existingGroup.gst_no && gst_no.trim()) {
      orConditions.push({ gst_no: gst_no.trim() });
      needsDuplicateCheck = true;
    }

    // Perform duplicate check if needed
    if (needsDuplicateCheck && orConditions.length > 0) {
      duplicateQuery.$or = orConditions;
      const duplicateGroup = await Group.findOne(duplicateQuery);

      if (duplicateGroup) {
        let duplicateFields = [];

        if (pan_no && duplicateGroup.pan_no === pan_no) {
          duplicateFields.push("PAN number");
        }
        if (name && duplicateGroup.name.toLowerCase() === name.toLowerCase()) {
          duplicateFields.push("name");
        }
        if (email && duplicateGroup.email.toLowerCase() === email.toLowerCase()) {
          duplicateFields.push("email");
        }
        if (contact_no && duplicateGroup.contact_no === contact_no) {
          duplicateFields.push("contact number");
        }
        if (gst_no && duplicateGroup.gst_no === gst_no) {
          duplicateFields.push("GST number");
        }

        // Delete newly uploaded files if duplicate found
        if (Object.keys(uploadedFiles).length > 0) {
          for (const fileUrl of Object.values(uploadedFiles)) {
            if (fileUrl) {
              try {
                const publicId = extractPublicId(fileUrl);
                if (publicId) {
                  await deleteFromCloudinary(publicId, "image");
                }
              } catch (deleteError) {
                console.error('Error deleting uploaded file:', deleteError);
              }
            }
          }
        }

        return res.status(409).json({
          message: `Another group with the same ${duplicateFields.join(", ")} already exists`,
          duplicateFields: duplicateFields,
          existingGroupId: duplicateGroup._id,
        });
      }
    }

    // Build update data object
    const updateData = {};

    // Update basic fields if provided (not undefined)
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (contact_no !== undefined) updateData.contact_no = contact_no;
    if (pan_no !== undefined) updateData.pan_no = pan_no;

    // Organisation-specific fields
    if (existingGroup.grp_type === "organisation") {
      if (address !== undefined) updateData.address = address;
      if (organisation_type !== undefined) updateData.organisation_type = organisation_type;
    }

    if (gst_no !== undefined) updateData.gst_no = gst_no; // Allow empty string to clear

    // Bank account details
    if (primary_bank_acc_type !== undefined)
      updateData.primary_bank_acc_type = primary_bank_acc_type;
    if (primary_bank_acc_no !== undefined)
      updateData.primary_bank_acc_no = primary_bank_acc_no;
    if (primary_bank_ifsc !== undefined)
      updateData.primary_bank_ifsc = primary_bank_ifsc;
    if (primary_bank_acc_holder !== undefined)
      updateData.primary_bank_acc_holder = primary_bank_acc_holder;

    // Only admin can update status
    if (userRole === "admin" && status) {
      if (["unverified", "active", "blocked"].includes(status)) {
        updateData.status = status;
      }
    }

    // Helper function to determine file type from mimetype
    const getFileType = (mimetype) => {
      if (mimetype?.startsWith("image/")) return "image";
      if (mimetype?.includes("pdf")) return "pdf";
      if (mimetype?.includes("document") || mimetype?.includes("msword"))
        return "doc";
      return "unknown";
    };

    // Update file fields if new files were uploaded
    if (uploadedFiles.id_proof) {
      updateData.id_proof = uploadedFiles.id_proof;
      if (req.files?.id_proof?.[0]) {
        updateData.id_proof_type = getFileType(req.files.id_proof[0].mimetype);
      }
    }

    if (uploadedFiles.bank_check) {
      updateData.bank_check = uploadedFiles.bank_check;
      if (req.files?.bank_check?.[0]) {
        updateData.bank_check_type = getFileType(req.files.bank_check[0].mimetype);
      }
    }

    if (uploadedFiles.company_certificate) {
      updateData.company_certificate = uploadedFiles.company_certificate;
      if (req.files?.company_certificate?.[0]) {
        updateData.company_certificate_type = getFileType(
          req.files.company_certificate[0].mimetype
        );
      }
    }

    if (uploadedFiles.company_logo) {
      updateData.company_logo = uploadedFiles.company_logo;
    }

    // Validation for organisation groups
    if (existingGroup.grp_type === "organisation") {
      const finalOrgType = organisation_type !== undefined ? organisation_type : existingGroup.organisation_type;
      if (finalOrgType) {
        const GST_MANDATORY_SECTORS = [
          "Private Limited", "Public Limited", "Partnership",
          "Proprietorship", "LLP",
        ];
        // Sectors where GST is conditional (commercial activity dependent)
        const GST_CONDITIONAL_SECTORS = [
          "NGO", "Non-profit", "Trust", "Society",
        ];
        const GST_EXEMPT_SECTORS = [
          "Educational", "Healthcare", "Institute",
        ];
        const orgTypeLower = finalOrgType.toLowerCase().trim();
        const isGSTMandatory = GST_MANDATORY_SECTORS.includes(orgTypeLower);
        const isGSTConditional = GST_CONDITIONAL_SECTORS.includes(orgTypeLower);
        const isGSTExempt = GST_EXEMPT_SECTORS.includes(orgTypeLower);
        const finalGst = gst_no !== undefined ? gst_no : existingGroup.gst_no;
        const finalBankCheck = uploadedFiles.bank_check || existingGroup.bank_check;
        const finalLogo = uploadedFiles.company_logo || existingGroup.company_logo;
        const missingFields = [];
        if (isGSTMandatory && (!finalGst || finalGst.trim() === "")) {
          missingFields.push("gst_no (mandatory for this sector)");
        }
        if (!isGSTExempt) {
          if (!finalBankCheck || (typeof finalBankCheck === "string" && finalBankCheck.trim() === "")) {
            missingFields.push("bank_check file");
          }
          if (!finalLogo || (typeof finalLogo === "string" && finalLogo.trim() === "")) {
            missingFields.push("company_logo file");
          }
        }
        if (missingFields.length > 0) {
          return res.status(400).json({
            message: `Missing required fields for ${finalOrgType}: ${missingFields.join(", ")}`,
            missingFields,
          });
        }
      }
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        message: "No fields to update",
      });
    }

    // Update the group
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ message: "Failed to update group" });
    }

    // Delete old files from Cloudinary after successful update
    if (filesToDelete.length > 0) {
      try {
        for (const fileUrl of filesToDelete) {
          const publicId = extractPublicId(fileUrl);
          if (publicId) {
            // Try deleting as different resource types since we don't know which type it is
            try {
              await deleteFromCloudinary(publicId, "image");
            } catch {
              try {
                await deleteFromCloudinary(publicId, "raw");
              } catch (err) {
                console.error(`Failed to delete old file: ${publicId}`, err);
              }
            }
          }
        }
      } catch (deleteError) {
        console.error("Error deleting old files:", deleteError);
        // Don't fail the update if file deletion fails
      }
    }

    // Create notification for group update
    try {
      await createNotification({
        userId: userId,
        type: "group_updated",
        title: "Group Updated",
        message: `Group "${updatedGroup.name}" has been updated successfully`,
        metadata: {
          groupId: updatedGroup._id,
          groupName: updatedGroup.name,
        },
      });
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Don't fail the update if notification fails
    }

    res.status(200).json({
      message: "Group updated successfully",
      group: updatedGroup,
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("Error updating group:", error);

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File too large. Max 10MB." });
      }
      return res.status(400).json({ message: error.message });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: "Validation error",
        errors: messages,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid group ID format" });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        message: `Group with this ${field} already exists`,
        field: field,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const getUserGroupCapabilities = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id || req.user.id;

    // 1. Find all groups that belong to the current user from the database.
    const userGroups = await Group.find({ userId: userId });

    let canCreateAdmin = false;
    let canCreateOrg = false;

    // 2. Calculate the correct capabilities based on the user's role and existing groups.
    if (userRole === "admin") {
      // An admin can create an admin group only if they don't already have one.
      canCreateAdmin =
        userGroups.filter((g) => g.grp_type === "admin").length === 0;
      // An admin can create an organisation group only if they don't already have one.
      canCreateOrg =
        userGroups.filter((g) => g.grp_type === "organisation").length === 0;
    } else if (userRole === "organisation") {
      // An organisation user can create up to 4 groups.
      canCreateOrg = userGroups.length < 4;
    }

    // 3. Build the final response object, now including the userGroups array.
    const capabilities = {
      userGroups: userGroups, // This is the missing piece!
      canCreateAdminGroup: canCreateAdmin,
      canCreateOrgGroup: canCreateOrg,
      userId: userId,
      userRole: userRole,
      showGroupTypeRadio: userRole === "admin",
    };

    res.status(200).json(capabilities);
  } catch (error) {
    console.error("Error getting user capabilities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getGroups = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groups = await Group.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const sanitizeDescriptionHtml = (html) => {
  if (!html || typeof html !== "string") return "";

  return html
    .replace(/<!--StartFragment-->/gi, "")
    .replace(/<!--EndFragment-->/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/&nbsp;/gi, " ")

    // 3. Strip data-* paste-marker attributes (ProseMirror, TipTap, Slate)
    .replace(/\s+data-[a-z][a-z0-9-]*="[^"]*"/gi, "")
    .replace(/\s+data-[a-z][a-z0-9-]*='[^']*'/gi, "")

    // 4. Strip inline style and class attributes (keep structure, not styling)
    .replace(/\s+style="[^"]*"/gi, "")
    .replace(/\s+style='[^']*'/gi, "")
    .replace(/\s+class="[^"]*"/gi, "")
    .replace(/\s+class='[^']*'/gi, "")

    // 5. Strip zero-width spaces and other invisible Unicode chars
    .replace(/\u200B/g, "")
    .replace(/\u200C/g, "")
    .replace(/\u200D/g, "")
    .replace(/\uFEFF/g, "")
    .replace(/&#8203;/g, "")
    .replace(/&#x200[BbCcDd];/gi, "")

    //    Allowed: p, br, ul, ol, li, b, strong, i, em, u, span
    .replace(
      /<(?!\/?(?:p|br|ul|ol|li|b|strong|i|em|u|span)\b)[^>]+>/gi,
      ""
    )
    // 7. Remove empty <p> and <li> tags left after stripping
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<li>\s*<\/li>/gi, "")

    // 8. Collapse multiple consecutive <br> into one
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")

    // 9. Collapse multiple consecutive blank lines / whitespace runs
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")

    .trim();
};

export const stripHtmlForValidation = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\u200B/g, "")
    .trim();
};
export const createTicketBasicInfo = async (req, res) => {
  try {
    const guestProfileFiles = {};
    const eventRulesFiles = [];
    const videoFiles = {};
    const previewImageFiles = {};
    const foodPictureFiles = {};
    const accommodationPictureFiles = {};

    // Handle file upload first using Promise wrapper
    await new Promise((resolve, reject) => {
      uploadFields(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(err);
        }
        resolve();
      });
    });

    const {
      // Basic Information
      event_name,
      event_category,
      event_subcategory,
      event_type,
      event_language,
      min_age_allowed,
      max_age_allowed,
      seating_arrangement,
      kids_friendly,
      pet_friendly,
      // Location
      location_type,
      location,
      venue,
      exact_map_location,

      // Date and Time
      event_date_type,
      event_dates,
      gate_open_time,
      prohibited_items,

      // Online/Recorded specific fields
      verification_event_code,

      // Social Media and Rules
      event_instagram_link,
      event_youtube_link,
      event_rules_text,
      hashtag,

      // Guests or Guides
      guests,
      POCS,
      event_description,
      groupId: bodyGroupId,

      // Attendance Marketing details
      food_accoum,
      food_accoum_type,
      food_details,
      accommodation_details,
      question_data,
      question_details,
    } = req.body;
    // Get uploaded files
    const uploadedFiles = await processFileUploads(req.files || {});
    Object.keys(uploadedFiles).forEach((fieldName) => {
      if (fieldName === "ticket_layout") {
        return;
      }
      if (fieldName.startsWith("guest_profile_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            guestProfileFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            guestProfileFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            guestProfileFiles[parseInt(index)] = fileData;
          }
        }
      }
      if (fieldName.startsWith("food_picture_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            foodPictureFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            foodPictureFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            foodPictureFiles[parseInt(index)] = fileData;
          }
        }
      }
      if (fieldName.startsWith("accommodation_picture_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            accommodationPictureFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            accommodationPictureFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            accommodationPictureFiles[parseInt(index)] = fileData;
          }
        }
      }
      if (fieldName === "event_rules") {
        const fileData = uploadedFiles[fieldName];
        if (Array.isArray(fileData) && fileData.length > 0) {
          eventRulesFiles.push(fileData[0]);
        }
      }
      if (fieldName.startsWith("video_file_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            videoFiles[index] = fileData[0];
          }
        }
      }

      if (fieldName.startsWith("preview_image_")) {
        const parts = fieldName.split("_");
        const index = parts[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            previewImageFiles[index] = fileData[0];
          }
        }
      }
    });

    // ==================== CONSOLIDATED FIELD VALIDATION ====================

    // 1. Basic Required Fields Validation
    const requiredBasicFields = {
      event_name: event_name,
      event_category: event_category,
      event_type: event_type,
      event_language: event_language,
      location_type: location_type,
      event_date_type: event_date_type,
      event_dates: event_dates,
      event_description: event_description,
      min_age_allowed: min_age_allowed,
    };

    const missingBasicFields = Object.entries(requiredBasicFields)
      .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
      .map(([key]) => key);

    if (missingBasicFields.length > 0) {
      return res.status(400).json({
        message: `Missing required basic fields: ${missingBasicFields.join(', ')}`,
        missingFields: missingBasicFields,
      });
    }
    // 2. Enum Validations (do this early to validate type before other checks)
    const validEventTypes = ['private', 'public'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({
        message: 'Invalid event_type',
        provided: event_type,
        validOptions: validEventTypes,
      });
    }

    const validLocationTypes = ['offline', 'online', 'recorded'];
    if (!validLocationTypes.includes(location_type)) {
      return res.status(400).json({
        message: 'Invalid location_type',
        provided: location_type,
        validOptions: validLocationTypes,
      });
    }

    const validDateTypes = ['one-day', 'multi-day', 'weekly'];
    if (!validDateTypes.includes(event_date_type)) {
      return res.status(400).json({
        message: 'Invalid event_date_type',
        provided: event_date_type,
        validOptions: validDateTypes,
      });
    }

    // 3. Location Type Specific Required Fields
    if (location_type === 'offline') {
      const offlineRequiredFields = {
        location: location,
        venue: venue,
        seating_arrangement: seating_arrangement,
        exact_map_location: exact_map_location,
      };

      const missingOfflineFields = Object.entries(offlineRequiredFields)
        .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
        .map(([key]) => key);

      if (missingOfflineFields.length > 0) {
        return res.status(400).json({
          message: `Missing required fields for offline event: ${missingOfflineFields.join(', ')}`,
          missingFields: missingOfflineFields,
        });
      }

      // Validate seating_arrangement for offline events
      const validSeatingArrangements = ['seated', 'standing', 'seated and standing', 'other'];
      if (!validSeatingArrangements.includes(seating_arrangement)) {
        return res.status(400).json({
          message: 'Invalid seating_arrangement',
          provided: seating_arrangement,
          validOptions: validSeatingArrangements,
        });
      }

      // Validate location and venue length
      if (location.trim().length < 2 || location.trim().length > 200) {
        return res.status(400).json({
          message: 'Location must be between 2 and 200 characters',
        });
      }

      if (venue.trim().length < 2 || venue.trim().length > 200) {
        return res.status(400).json({
          message: 'Venue must be between 2 and 200 characters',
        });
      }
    }

    // 4. Event Language Validation
    const validLanguages = [
      "English", "Hindi", "Malayalam", "Tamil", "Kannada", "Telugu", "Marathi", "Gujarati", "Punjabi", "Urdu", "Bengali",
      "Odia", "Assamese", "Sanskrit", "Konkani", "Maithili", "Manipuri", "Nepali", "Sinhala",
      "Spanish", "French", "German", "Italian", "Dutch", "Greek", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
      "Portuguese", "Romanian", "Hungarian", "Czech", "Slovak", "Ukrainian", "Bulgarian", "Serbian", "Croatian",
      "Russian", "Turkish", "Chinese (Mandarin)", "Chinese (Cantonese)", "Japanese", "Korean", "Thai", "Vietnamese", "Indonesian", "Malay", "Filipino",
      "Arabic", "Persian (Farsi)", "Hebrew", "Swahili", "Zulu", "Afrikaans", "Other"
    ];

    let languageArray = [];
    if (Array.isArray(event_language)) {
      languageArray = event_language;
    } else if (typeof event_language === 'string') {
      try {
        const parsed = JSON.parse(event_language);
        languageArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        languageArray = event_language.split(',').map(lang => lang.trim()).filter(Boolean);
      }
    }

    if (languageArray.length === 0) {
      return res.status(400).json({
        message: 'At least one event language is required',
      });
    }

    const invalidLanguages = languageArray.filter(lang => !validLanguages.includes(lang));
    if (invalidLanguages.length > 0) {
      return res.status(400).json({
        message: 'Invalid event_language(s)',
        provided: invalidLanguages,
        validOptions: validLanguages,
      });
    }

    // 5. Age Validation
    const ageNum = Number(min_age_allowed);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return res.status(400).json({
        message: 'Minimum age allowed must be between 1 and 150',
      });
    }

    let ageMax;
    if (max_age_allowed && String(max_age_allowed).trim() !== '') {
      const parsedAgeMax = Number(max_age_allowed);
      if (isNaN(parsedAgeMax) || parsedAgeMax < 1 || parsedAgeMax > 150) {
        return res.status(400).json({
          message: 'Maximum age allowed must be between 1 and 150 if provided',
        });
      }
      if (parsedAgeMax < ageNum) {
        return res.status(400).json({
          message: 'Maximum age allowed cannot be less than minimum age allowed',
        });
      }
      ageMax = parsedAgeMax;
    }

    // 6. String Length Validations
    if (event_name.trim().length < 3 || event_name.trim().length > 200) {
      return res.status(400).json({
        message: 'Event name must be between 3 and 200 characters',
      });
    }

    const cleanedDescription = sanitizeDescriptionHtml(event_description);
    const descriptionPlainText = stripHtmlForValidation(cleanedDescription);
    if (descriptionPlainText.length < 10 || descriptionPlainText.length > 5000) {
      return res.status(400).json({
        message: "Event description must be between 10 and 5000 characters",
      });
    }

    // Validate event_category length
    if (event_category && (event_category.trim().length < 2 || event_category.trim().length > 100)) {
      return res.status(400).json({
        message: 'Event category must be between 2 and 100 characters',
      });
    }

    // Validate event_subcategory length (optional field)
    if (event_subcategory && event_subcategory.trim() &&
      (event_subcategory.trim().length < 2 || event_subcategory.trim().length > 100)) {
      return res.status(400).json({
        message: 'Event subcategory must be between 2 and 100 characters if provided',
      });
    }

    // 7. Optional Field Validations
    if (event_instagram_link && event_instagram_link.trim()) {
      const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/.+/i;
      if (!instagramRegex.test(event_instagram_link.trim())) {
        return res.status(400).json({
          message: 'Invalid Instagram link format. Must be a valid Instagram URL.',
        });
      }
    }

    if (event_youtube_link && event_youtube_link.trim()) {
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i;
      if (!youtubeRegex.test(event_youtube_link.trim())) {
        return res.status(400).json({
          message: 'Invalid YouTube link format. Must be a valid YouTube URL.',
        });
      }
    }

    // 8. Guest Validation
    if (guests) {
      const guestsArray = parseJSONSafely(guests, []);
      if (guestsArray.length > 10) {
        return res.status(400).json({
          message: 'Maximum 10 guests allowed',
        });
      }

      // Validate each guest if it's an object
      for (let i = 0; i < guestsArray.length; i++) {
        const guest = guestsArray[i];
        if (typeof guest === 'object' && guest !== null) {
          if (guest.guest_name && guest.guest_name.length > 100) {
            return res.status(400).json({
              message: `Guest ${i + 1} name must not exceed 100 characters`,
            });
          }
          if (guest.guest_link && guest.guest_link.trim()) {
            const urlRegex = /^https?:\/\/.+/i;
            if (!urlRegex.test(guest.guest_link.trim())) {
              return res.status(400).json({
                message: `Guest ${i + 1} link must be a valid URL`,
              });
            }
          }
        }
      }
    }
    // 9. POCs Validation
    if (POCS) {
      const pocsArray = parseJSONSafely(POCS, []);
      if (pocsArray.length === 0) {
        return res.status(400).json({
          message: "At least one Point of contact is required",
        });
      }
      // Existing rule: Max 10 POCs allowed
      if (pocsArray.length > 10) {
        return res.status(400).json({
          message: "Maximum 10 POCs allowed",
        });
      }
      // Validate each POC
      for (let i = 0; i < pocsArray.length; i++) {
        const poc = pocsArray[i];

        if (typeof poc === "object" && poc !== null) {

          // Name length
          if (poc.POC_name && poc.POC_name.length > 100) {
            return res.status(400).json({
              message: `POC ${i + 1} name must not exceed 100 characters`,
            });
          }

          // Email validation
          if (poc.POC_email && poc.POC_email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(poc.POC_email.trim())) {
              return res.status(400).json({
                message: `POC ${i + 1} email is invalid`,
              });
            }
          }

          // Contact number validation
          if (poc.POC_contact && poc.POC_contact.trim()) {
            const phoneRegex = /^\+?[\d\s\-()]{10,15}$/;
            if (!phoneRegex.test(poc.POC_contact.trim())) {
              return res.status(400).json({
                message: `POC ${i + 1} contact number is invalid`,
              });
            }
          }
        } else {
          return res.status(400).json({
            message: `Invalid POC data at index ${i + 1}`,
          });
        }
      }
    } else {
      return res.status(400).json({
        message: "Point of contact field is required and must contain at least 1 POC",
      });
    }
    // 10. Hashtag Validation
    if (hashtag) {
      const hashtagArray = parseJSONSafely(hashtag, []);
      if (hashtagArray.length > 50) {
        return res.status(400).json({
          message: 'Maximum 50 hashtags allowed',
        });
      }

      const invalidHashtags = hashtagArray.filter(tag =>
        typeof tag !== 'string' || tag.length > 50 || tag.length < 1
      );

      if (invalidHashtags.length > 0) {
        return res.status(400).json({
          message: 'Each hashtag must be a string between 1 and 50 characters',
        });
      }
    }

    // 11. Time Format Validation
    if (gate_open_time && gate_open_time.trim()) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(gate_open_time.trim())) {
        return res.status(400).json({
          message: 'gate_open_time must be in HH:MM format (24-hour)',
        });
      }
    }

    // 12. File Upload Validation
    for (const [index, file] of Object.entries(guestProfileFiles)) {
      if (!file.path) {
        return res.status(400).json({
          message: `Guest profile ${index} upload failed or is invalid`,
        });
      }
    }

    if (eventRulesFiles.length > 0) {
      const rulesFile = eventRulesFiles[0];
      if (!rulesFile.path) {
        return res.status(400).json({
          message: "Event rules file upload failed or is invalid",
        });
      }
    }

    // ==================== END OF VALIDATION ====================

    // Get IDs
    const groupId = req.params.groupId || bodyGroupId;
    const ticketId = req.params.ticketId;
    const userId = req.user?._id || req.user?.id;

    if (!groupId || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid group ID format. Please provide a valid MongoDB ObjectId.",
        groupId: groupId,
      });
    }

    // Validate that the group exists and user has permission
    const group = await Group.findOne({ _id: groupId, userId: userId });
    if (!group) {
      return res.status(404).json({
        message: "Group not found or you don't have permission to create events for this group",
      });
    }

    // Helper function to validate date format and check if it's not in the past
    const validateDate = (dateString, fieldName) => {
      if (!dateString) return false;

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
      }

      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(date.getTime())) {
        throw new Error(`${fieldName} is not a valid date`);
      }

      if (date < today) {
        throw new Error(`${fieldName} cannot be a past date`);
      }

      return true;
    };

    // Helper function to validate time format
    const validateTime = (timeString, fieldName) => {
      if (!timeString) return true;

      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(timeString)) {
        throw new Error(`${fieldName} must be in HH:MM format (24-hour)`);
      }

      return true;
    };

    // Process event dates with validation
    let totalEventDates = [];
    if (event_dates) {
      let eventDatesArray;

      if (typeof event_dates === "string") {
        try {
          const cleanedEventDates = event_dates.trim();
          eventDatesArray = JSON.parse(cleanedEventDates);

          if (!Array.isArray(eventDatesArray)) {
            return res.status(400).json({
              message: "event_dates must be an array of date objects",
            });
          }
        } catch (error) {
          return res.status(400).json({
            message: "Invalid event_dates format. Must be valid JSON array string in multipart form.",
            error: error.message,
            received: typeof event_dates,
            sample_format: '[{"start_date":"2025-07-15","end_date":"2025-07-17","start_time":"18:00","end_time":"23:00"}]',
          });
        }
      } else if (Array.isArray(event_dates)) {
        eventDatesArray = event_dates;
      } else {
        return res.status(400).json({
          message: "event_dates must be a JSON array string (for multipart form) or array",
          received: typeof event_dates,
        });
      }

      if (!eventDatesArray || eventDatesArray.length === 0) {
        return res.status(400).json({
          message: "event_dates array cannot be empty",
        });
      }

      if (event_date_type === "one-day" && eventDatesArray.length > 1) {
        return res.status(400).json({
          message: "One-day events can only have one date entry",
        });
      }

      try {
        totalEventDates = eventDatesArray.map((eventDate, index) => {
          if (typeof eventDate !== "object" || eventDate === null) {
            throw new Error(`Event date entry ${index + 1} must be an object`);
          }

          const {
            start_date,
            end_date,
            start_time,
            end_time,
            eventLink,
            event_link,
            videoLink,
            video_name,
            videoName,
            verificationCode,
            verification_event_code,
          } = eventDate;

          const actualEventLink = event_link || eventLink || videoLink || "";
          const actualVideoName = video_name || videoName || "";
          const actualVerificationCode = verification_event_code || verificationCode || "";

          if ((location_type === "online" || location_type === "recorded") && !actualEventLink) {
            throw new Error(`Event date entry ${index + 1}: event_link is required for online/recorded events`);
          }

          if (!start_date) {
            throw new Error(`Event date entry ${index + 1}: start_date is required`);
          }

          validateDate(start_date, `Event date entry ${index + 1}: start_date`);

          let validatedEndDate = start_date;
          if (end_date) {
            validateDate(end_date, `Event date entry ${index + 1}: end_date`);

            if (new Date(end_date) < new Date(start_date)) {
              throw new Error(`Event date entry ${index + 1}: end_date cannot be before start_date`);
            }
            validatedEndDate = end_date;
          }

          if (start_time) {
            validateTime(start_time, `Event date entry ${index + 1}: start_time`);
          }
          if (end_time) {
            validateTime(end_time, `Event date entry ${index + 1}: end_time`);
          }

          if (start_time && end_time) {
            const startTimeMinutes = start_time.split(":").reduce((acc, time) => 60 * acc + +time, 0);
            const endTimeMinutes = end_time.split(":").reduce((acc, time) => 60 * acc + +time, 0);

            if (start_date === validatedEndDate && endTimeMinutes <= startTimeMinutes) {
              throw new Error(`Event date entry ${index + 1}: end_time must be after start_time for same-day events`);
            }
          }

          const correspondingVideoFile = videoFiles[index];
          const correspondingPreviewImage = previewImageFiles[index];

          const dateEntry = {
            start_date: start_date.trim(),
            end_date: validatedEndDate.trim(),
            event_link: actualEventLink ? actualEventLink.trim() : "",
            video_name: actualVideoName ? actualVideoName.trim() : "",
            verification_event_code: actualVerificationCode ? actualVerificationCode.trim() : "",
            video_file_path: correspondingVideoFile ? correspondingVideoFile.path : "",
            preview_image_path: correspondingPreviewImage ? correspondingPreviewImage.path : "",
          };

          if (start_time && start_time.trim() !== "") {
            dateEntry.start_time = start_time.trim();
          }
          if (end_time && end_time.trim() !== "") {
            dateEntry.end_time = end_time.trim();
          }

          return dateEntry;
        });
      } catch (validationError) {
        return res.status(400).json({
          message: "Date validation error",
          error: validationError.message,
        });
      }
    } else {
      return res.status(400).json({
        message: "event_dates is required",
      });
    }

    // Normalize string helper
    const normalizeString = (str) => {
      if (!str) return "";
      return str.toLowerCase().trim().replace(/\s+/g, " ");
    };

    // Create date ranges helper
    const createDateRanges = (dates) => {
      return dates.map((date) => ({
        start: new Date(`${date.start_date}T${date.start_time || "00:00"}:00`),
        end: new Date(`${date.end_date}T${date.end_time || "23:59"}:00`),
        date_string: `${date.start_date}_${date.end_date}_${date.start_time}_${date.end_time}`,
      }));
    };

    // Check if date ranges overlap helper
    const doDateRangesOverlap = (range1, range2) => {
      return range1.start <= range2.end && range2.start <= range1.end;
    };

    const normalizedEventName = normalizeString(event_name);
    const normalizedLocation = normalizeString(location);
    const normalizedVenue = normalizeString(venue);
    const currentEventDateRanges = createDateRanges(totalEventDates);

    // Build duplicate check query
    let duplicateCheckQuery = {
      userId: userId,
      event_status: { $ne: "cancelled" },
      event_name: {
        $regex: new RegExp(`^${normalizedEventName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      },
    };

    if (ticketId) {
      duplicateCheckQuery._id = { $ne: ticketId };
    }

    if (location_type === "offline") {
      duplicateCheckQuery.location_type = "offline";
      duplicateCheckQuery.$or = [
        {
          $and: [
            {
              location: {
                $regex: new RegExp(`^${normalizedLocation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
              },
            },
            {
              venue: {
                $regex: new RegExp(`^${normalizedVenue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
              },
            },
          ],
        },
        {
          venue: {
            $regex: new RegExp(`^${normalizedVenue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
          },
        },
      ];
    } else if (location_type === "online" || location_type === "recorded") {
      const eventLinksFromDates = totalEventDates
        .map((date) => (date.event_link || "").toLowerCase().trim())
        .filter((link) => link.length > 0);

      if (eventLinksFromDates.length > 0) {
        duplicateCheckQuery.location_type = { $in: ["online", "recorded"] };
        duplicateCheckQuery["event_dates.event_link"] = {
          $in: eventLinksFromDates,
        };
      }
    }

    // Check for existing events
    const existingEvents = await Ticket.find(duplicateCheckQuery).lean();
    const conflictingEvents = [];

    for (const existingEvent of existingEvents) {
      if (!existingEvent.event_dates || existingEvent.event_dates.length === 0) continue;

      const existingEventDateRanges = createDateRanges(existingEvent.event_dates);
      let hasOverlap = false;

      for (const currentRange of currentEventDateRanges) {
        for (const existingRange of existingEventDateRanges) {
          if (doDateRangesOverlap(currentRange, existingRange)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      if (hasOverlap) {
        conflictingEvents.push({
          eventId: existingEvent._id,
          eventName: existingEvent.event_name,
          location:
            location_type === "offline"
              ? `${existingEvent.location} - ${existingEvent.venue}`
              : existingEvent.event_dates?.map((date) => date.event_link).filter((link) => link).join(", ") || "No link provided",
          dates: existingEvent.event_dates,
          createdAt: existingEvent.created_at,
        });
      }
    }

    if (conflictingEvents.length > 0) {
      return res.status(409).json({
        message: "Duplicate event detected",
        error: "An event with the same name, location, and overlapping date/time already exists",
        conflictDetails: {
          attempted: {
            eventName: event_name,
            location:
              location_type === "offline"
                ? `${location} - ${venue}`
                : totalEventDates.map((date) => date.event_link).filter((link) => link).join(", ") || "No link provided",
            dates: totalEventDates,
            locationType: location_type,
          },
          existing: conflictingEvents,
          suggestion: "Please check your existing events or modify the event name, location, or schedule to avoid conflicts.",
        },
      });
    }

    // Check for internal date conflicts
    const internalConflicts = [];
    for (let i = 0; i < currentEventDateRanges.length; i++) {
      for (let j = i + 1; j < currentEventDateRanges.length; j++) {
        if (doDateRangesOverlap(currentEventDateRanges[i], currentEventDateRanges[j])) {
          internalConflicts.push({
            conflict1: totalEventDates[i],
            conflict2: totalEventDates[j],
          });
        }
      }
    }

    if (internalConflicts.length > 0) {
      return res.status(400).json({
        message: "Date conflicts within the event",
        error: "Multiple date entries have overlapping times",
        conflicts: internalConflicts,
      });
    }

    // Process exact_map_location for offline events
    let mapLocation = {};
    if (location_type === "offline" && exact_map_location) {
      try {
        mapLocation = typeof exact_map_location === "string" ? JSON.parse(exact_map_location) : exact_map_location;
      } catch {
        mapLocation = {};
      }
    }

    // Process guests
    let processedGuests = [];
    if (guests) {
      const guestsArray = parseJSONSafely(guests, []);

      processedGuests = guestsArray.map((guest, index) => {
        let guestData = {
          guest_name: "",
          guest_profile: "",
          guest_link: "",
        };

        if (typeof guest === "string") {
          guestData.guest_name = guest;
        } else if (typeof guest === "object" && guest !== null) {
          guestData = {
            guest_name: guest.guest_name || "",
            guest_profile: guest.guest_profile || "",
            guest_link: guest.guest_link || "",
          };
        }

        if (guestProfileFiles[index] && guestProfileFiles[index].path) {
          guestData.guest_profile = guestProfileFiles[index].path;
        }

        return guestData;
      });
    }
    // Parse and map food and accommodation details
    const parsedFoodAccoum = Boolean(food_accoum === "true" || food_accoum === true);
    const parsedFoodAccoumType = food_accoum_type || "none";
    const parsedQuestionData = Boolean(question_data === "true" || question_data === true);

    const parsedQuestionDetails = typeof question_details === "string"
      ? parseJSONSafely(question_details, { name: false, email: false, phone_number: false, position: false })
      : question_details || { name: false, email: false, phone_number: false, position: false };

    let parsedFoodDetails = parseJSONSafely(food_details, []);
    let parsedAccommodationDetails = parseJSONSafely(accommodation_details, []);

    parsedFoodDetails = parsedFoodDetails.map((item, index) => {
      const foodItem = {
        food_quantity: Number(item.food_quantity) || 0,
        food_menu: Array.isArray(item.food_menu) ? item.food_menu : (typeof item.food_menu === 'string' ? item.food_menu.split(',').map(s => s.trim()).filter(Boolean) : []),
        food_catering_name: item.food_catering_name || "",
        food_price: Number(item.food_price) || 0,
        food_picture: item.food_picture || ""
      };
      if (foodPictureFiles[index] && foodPictureFiles[index].path) {
        foodItem.food_picture = foodPictureFiles[index].path;
      }
      return foodItem;
    });

    parsedAccommodationDetails = parsedAccommodationDetails.map((item, index) => {
      const accItem = {
        accommodation_quantity: Number(item.accommodation_quantity) || 0,
        accommodation_type: Array.isArray(item.accommodation_type) ? item.accommodation_type : (typeof item.accommodation_type === 'string' ? item.accommodation_type.split(',').map(s => s.trim()).filter(Boolean) : []),
        accommodation_catering_name: item.accommodation_catering_name || "",
        accommodation_price: Number(item.accommodation_price) || 0,
        accommodation_picture: item.accommodation_picture || ""
      };
      if (accommodationPictureFiles[index] && accommodationPictureFiles[index].path) {
        accItem.accommodation_picture = accommodationPictureFiles[index].path;
      }
      return accItem;
    });

    // Create ticket data object
    const ticketData = {
      event_name: event_name.trim(),
      event_category: event_category.trim(),
      event_subcategory: event_subcategory?.trim() || "",
      event_type: event_type || "public",
      event_language: languageArray,
      min_age_allowed: ageNum,
      max_age_allowed: ageMax,
      kids_friendly: Boolean(kids_friendly === "true" || kids_friendly === true),
      pet_friendly: Boolean(pet_friendly === "true" || pet_friendly === true),
      location_type: location_type,
      event_date_type,
      event_dates: totalEventDates,
      event_instagram_link: event_instagram_link?.trim() || "",
      event_youtube_link: event_youtube_link?.trim() || "",
      hashtag: parseJSONSafely(hashtag, []),
      event_description: cleanedDescription, // Save cleaned html description instead of raw trimmed string
      guests: processedGuests,
      POCS: parseJSONSafely(POCS, []),
      groupId,
      userId,
      food_accoum: parsedFoodAccoum,
      food_accoum_type: parsedFoodAccoumType,
      food_details: parsedFoodDetails,
      accommodation_details: parsedAccommodationDetails,
      question_data: parsedQuestionData,
      question_details: parsedQuestionDetails,
      // event_status is now only set for new tickets, not updates
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
      form_progress: {
        basic_info: true,
        media: false,
        pricing: false,
        additional_info: false,
      },
    };
    // Process prohibited items
    const processedProhibitedItems = (() => {
      const rawItems = prohibited_items;

      if (!rawItems) return [];

      if (Array.isArray(rawItems)) {
        return rawItems.map((item) => String(item).trim()).filter((item) => item !== "");
      }

      if (typeof rawItems === "string") {
        const trimmed = rawItems.trim();

        if (trimmed === "" || trimmed === "[]" || trimmed === "{}") {
          return [];
        }

        try {
          const parsed = JSON.parse(trimmed);

          if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter((item) => item !== "");
          } else if (typeof parsed === "object" && parsed !== null) {
            return Object.values(parsed).map((item) => String(item).trim()).filter((item) => item !== "");
          } else {
            return [String(parsed).trim()].filter((item) => item !== "");
          }
        } catch (e) {
          if (trimmed.includes(",")) {
            return trimmed.split(",").map((item) => item.trim()).filter((item) => item !== "");
          }
          return [];
        }
      }

      if (typeof rawItems === "object" && rawItems !== null) {
        return Object.values(rawItems).map((item) => String(item).trim()).filter((item) => item !== "");
      }

      return [];
    })();

    // Add location-specific fields
    if (location_type === "offline") {
      ticketData.seating_arrangement = seating_arrangement || "other";
      ticketData.location = location.trim();
      ticketData.venue = venue.trim();
      ticketData.exact_map_location = mapLocation;
      ticketData.gate_open_time = gate_open_time?.trim() || "";
      ticketData.prohibited_items = processedProhibitedItems;
    } else if (location_type === "online" || location_type === "recorded") {
      ticketData.seating_arrangement = null;
      ticketData.location = "";
      ticketData.venue = "";
      ticketData.exact_map_location = {};
      ticketData.gate_open_time = "";
      ticketData.prohibited_items = processedProhibitedItems;
    }

    // Handle event rules
    if (eventRulesFiles.length > 0) {
      const rulesFile = eventRulesFiles[0];
      ticketData.event_rules = {
        type: "file",
        path: rulesFile.path,
        originalName: rulesFile.originalName || rulesFile.originalname || "event_rules",
        mimeType: rulesFile.mimeType || rulesFile.mimetype || "application/pdf",
        size: rulesFile.size || 0,
        public_id: rulesFile.public_id || "",
        resource_type: rulesFile.resource_type || "raw",
        uploadedAt: new Date(),
      };
    } else if (event_rules_text && event_rules_text.trim()) {
      ticketData.event_rules = {
        type: "text",
        content: sanitizeDescriptionHtml(event_rules_text),
        uploadedAt: new Date(),
      };
    }

    // Create or update ticket
    let ticket;
    let responseMessage;
    if (ticketId) {
      ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }
      if (ticket.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          message: "You don't have permission to update this ticket",
        });
      }

      // Preserve the current event_status when updating
      const currentEventStatus = ticket.event_status;

      Object.assign(ticket, ticketData);

      // Restore the original event_status to prevent it from being reset to 'pending'
      ticket.event_status = currentEventStatus;

      ticket.updated_by = userId;
      ticket.updated_at = new Date();
      await ticket.save();
      responseMessage = "Event updated successfully";
    } else {
      ticketData.event_status = "pending";
      ticket = new Ticket(ticketData);
      await ticket.save();
      responseMessage = "Event created successfully";
    }
    // Build response
    const responseData = {
      message: responseMessage,
      ticket: ticket,
      ticketId: ticket._id,
      userId,
      groupId,
      location_type: location_type,
      formProgress: ticket.form_progress,
      uploadedFiles: {
        guest_profiles: Object.keys(guestProfileFiles).length,
        event_rules: eventRulesFiles.length,
      },
      processedGuests: processedGuests.length,
      eventDatesCount: totalEventDates.length,
      eventDates: totalEventDates,
      duplicationCheck: "Passed - No conflicts found",
    };

    if (location_type === "offline") {
      responseData.offline_fields = {
        seating_arrangement: ticket.seating_arrangement,
        location: ticket.location,
        venue: ticket.venue,
        has_map_location: Object.keys(ticket.exact_map_location || {}).length > 0,
      };
    } else if (location_type === "online" || location_type === "recorded") {
      responseData.online_fields = {
        event_links: totalEventDates.map((date) => date.event_link).filter((link) => !!link),
        verification_codes: totalEventDates.map((date) => date.verification_event_code).filter((code) => !!code),
      };
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error creating event:", error);
    // Cleanup uploaded files on error
    try {
      const allUploadedUrls = [
        ...Object.values(guestProfileFiles).map(f => f.path),
        ...Object.values(foodPictureFiles).map(f => f.path),
        ...Object.values(accommodationPictureFiles).map(f => f.path),
        ...eventRulesFiles.map(f => f.path),
        ...Object.values(videoFiles).map(f => f.path),
        ...Object.values(previewImageFiles).map(f => f.path)
      ].filter(Boolean);

      for (const url of allUploadedUrls) {
        const publicId = extractPublicId(url);
        if (publicId) {
          const isVideo = url.includes('/video/');
          const isRaw = url.includes('/raw/');
          const resourceType = isVideo ? 'video' : (isRaw ? 'raw' : 'image');
          await deleteFromCloudinary(publicId, resourceType);
        }
      }
    } catch (cleanupError) {
      console.error("Error cleaning up Cloudinary files on basic info error:", cleanupError);
    }
    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum 10MB allowed per file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files uploaded. Maximum limits: 10 guest profiles, 1 event rules file.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field. Only 'guest_profile_0' to 'guest_profile_9' and 'event_rules' are allowed.",
      });
    }

    // Handle file type errors
    if (
      error.message &&
      (error.message.includes("Guest profile") ||
        error.message.includes("Event rules file must be a document") ||
        error.message.includes("Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed"))
    ) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message,
      });
    }

    // Handle MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Data type casting error. Check your data format.",
        error: error.message,
        field: error.path,
      });
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Event with similar details already exists at database level",
      });
    }
    // Cleanup: Delete uploaded Cloudinary files if database operation fails
    try {
      const filesToDelete = [];
      if (guestProfileFiles && typeof guestProfileFiles === "object") {
        Object.values(guestProfileFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (eventRulesFiles && Array.isArray(eventRulesFiles)) {
        eventRulesFiles.forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }

      if (videoFiles && typeof videoFiles === "object") {
        Object.values(videoFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }

      if (previewImageFiles && typeof previewImageFiles === "object") {
        Object.values(previewImageFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }

      if (filesToDelete.length > 0) {
        for (const publicId of filesToDelete) {
          try {
            await deleteFromCloudinary(publicId, "auto");
          } catch (deleteErr) {
            console.error(`Failed to delete file ${publicId}:`, deleteErr);
          }
        }
      }
    } catch (cleanupError) {
      console.error("Error cleaning up Cloudinary files:", cleanupError);
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const updateTicketMedia = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      uploadTicketMedia(req, res, (err) => {
        if (err) {
          console.error("❌ Multer error details:", {
            message: err.message,
            code: err.code,
            field: err.field,
            stack: err.stack,
          });
          return reject(err);
        }
        resolve();
      });
    });

    // Validate ticket ID
    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message:
          "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
        ticketId: ticketId,
      });
    }
    // Upload files to Cloudinary
    const uploadedFiles = await processFileUploads(req.files || {});

    let updateData = {
      "form_progress.media": true,
      updated_by: req.user._id || req.user.id,
      updated_at: new Date(),
    };
    // Extract URLs directly - these are already complete Cloudinary URLs
    const eventLogoUrl = uploadedFiles.event_logo || null;
    const eventBannerUrl = uploadedFiles.event_banner || null;
    const collegeAuthorisationUrl = uploadedFiles.college_authorisation || null;
    const eventPortraitUrl = uploadedFiles.event_portrait || null;
    const event_images = uploadedFiles.event_images || [];
    const event_videos = uploadedFiles.event_videos || [];
    const userRole = req.user?.role;
    let organisation_type = null;
    if (userRole === "organisation") {
      organisation_type = req.user?.organisation_type;
      // College authorization validation for educational organizations
      if (
        organisation_type &&
        organisation_type.toLowerCase() === "educational"
      ) {
        if (!collegeAuthorisationUrl) {
          // Check if existing ticket has college authorization
          const existingTicket = await Ticket.findById(ticketId);
          if (!existingTicket?.college_authorisation) {
            console.error(
              "❌ Missing college authorization for educational organization"
            );
            return res.status(400).json({
              message:
                "College authorization file is required for educational organizations",
              required_field: "college_authorisation",
              organization_type: organisation_type,
            });
          }
        }
      }
    }
    // Check if any new media files were uploaded
    const hasNewMediaFiles =
      !!eventLogoUrl || !!eventBannerUrl || !!eventPortraitUrl || event_images.length > 0 || event_videos.length > 0;
    const hasNewCollegeAuth = !!collegeAuthorisationUrl;

    const isSyncingGallery = !!(
      req.body.existing_event_images ||
      req.body.image_order ||
      req.body.existing_event_videos ||
      req.body.video_order ||
      req.body.delete_event_portrait || // Add these flags
      req.body.delete_event_logo
    );

    if (!hasNewMediaFiles && !hasNewCollegeAuth && !isSyncingGallery) {
      const existingTicket = await Ticket.findById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({
          message: "Ticket not found",
          ticketId: ticketId,
        });
      }

      // Check if event banner exists (required)
      if (!existingTicket.event_banner) {
        return res.status(400).json({
          message: "Event banner is required to proceed",
          current_status: {
            has_event_logo: !!existingTicket.event_logo,
            has_event_banner: !!existingTicket.event_banner,
            event_images_count: existingTicket.event_images?.length || 0,
          },
        });
      }

      // Check college authorization for educational organizations
      if (
        organisation_type &&
        organisation_type.toLowerCase() === "educational" &&
        !existingTicket.college_authorisation
      ) {
        console.error(
          "❌ College authorization is required for educational organizations but not found"
        );
        return res.status(400).json({
          message:
            "College authorization file is required for educational organizations",
          required_field: "college_authorisation",
          organization_type: organisation_type,
        });
      }
      const userId = req.user._id || req.user.id;

      const updatedTicket = await Ticket.findOneAndUpdate(
        { _id: ticketId },
        {
          "form_progress.media": true,
          updated_by: userId,
          updated_at: new Date(),
        },
        { new: true, runValidators: true }
      );
      return res.status(200).json({
        message: "Media step completed (no new files uploaded)",
        ticket: updatedTicket,
        ticketId: ticketId,
        note: "Existing media retained",
      });
    }
    const userId = req.user._id || req.user.id;
    updateData = {
      "form_progress.media": true,
      updated_by: userId,
      updated_at: new Date(),
    };
    // Process uploaded files - Use the URLs directly
    if (eventLogoUrl) {
      updateData.event_logo = eventLogoUrl;
    }
    if (eventBannerUrl) {
      updateData.event_banner = eventBannerUrl;
    }
    if (eventPortraitUrl) updateData.event_portrait = eventPortraitUrl; // NEW DATA
    if (req.body.existing_event_images || event_images.length > 0) {
      const existingTicket = await Ticket.findById(ticketId);
      const keepPaths = JSON.parse(req.body.existing_event_images || "[]");
      const finalOrder = JSON.parse(req.body.image_order || "[]");
      // 1️⃣ Keep only images user retained
      const keptImages = (existingTicket?.event_images || []).filter(img =>
        keepPaths.includes(img.path)
      );
      // 2️⃣ Map newly uploaded images (IMPORTANT: include size)
      const newUploadedImages = (event_images || []).map(file => ({
        path: file.path,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size, // ✅ REQUIRED BY SCHEMA
        uploadedAt: new Date()
      }));

      // 3️⃣ Merge
      let combinedImages = [...keptImages, ...newUploadedImages];

      // 4️⃣ Apply frontend order
      if (finalOrder.length > 0) {
        combinedImages.sort((a, b) => {
          const aKey = a.path || a.originalName;
          const bKey = b.path || b.originalName;
          return finalOrder.indexOf(aKey) - finalOrder.indexOf(bKey);
        });
      }
      updateData.event_images = combinedImages.slice(0, 10);
    }
    if (event_videos.length > 0 || req.body.existing_event_videos || req.body.video_order) {
      const existingTicket = await Ticket.findById(ticketId);
      const keepVideoPaths = JSON.parse(req.body.existing_event_videos || "[]");
      const videoOrder = JSON.parse(req.body.video_order || "[]");

      const keptVideos = (existingTicket?.event_videos || []).filter(v =>
        keepVideoPaths.includes(v.path)
      );

      const newVideos = event_videos.map(file => ({
        path: file.path,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size, // ✅ REQUIRED
        uploadedAt: new Date()
      }));

      let combinedVideos = [...keptVideos, ...newVideos];

      if (videoOrder.length > 0) {
        combinedVideos.sort(
          (a, b) => videoOrder.indexOf(a.path) - videoOrder.indexOf(b.path)
        );
      }

      updateData.event_videos = combinedVideos.slice(0, 5);
    }
    // Add college authorization file if uploaded
    if (collegeAuthorisationUrl) {
      updateData.college_authorisation = collegeAuthorisationUrl;
    }
    // Find and update the ticket
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedTicket) {
      console.error("❌ Ticket not found:", ticketId);
      // Cleanup uploaded files
      const filesToDelete = [];
      if (eventLogoUrl) filesToDelete.push(eventLogoUrl);
      if (eventBannerUrl) filesToDelete.push(eventBannerUrl);
      if (collegeAuthorisationUrl) filesToDelete.push(collegeAuthorisationUrl);
      if (event_images && event_images.length > 0) {
        event_images.forEach((img) => filesToDelete.push(img.path));
      }
      if (filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map((url) =>
            deleteFromCloudinary(url).catch((err) =>
              console.error("Cleanup error:", err.message)
            )
          )
        );
      }
      return res.status(404).json({
        message: "Ticket not found or unauthorized",
        ticketId: ticketId,
      });
    }
    res.status(200).json({
      message: "Ticket media updated successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      uploadedFiles: {
        event_logo: !!eventLogoUrl,
        event_banner: !!eventBannerUrl,
        event_portrait: !!eventPortraitUrl,
        event_images: event_images.length,
        event_videos: event_videos.length,
        college_authorisation: !!collegeAuthorisationUrl,
      },
      uploadedUrls: {
        event_logo: eventLogoUrl,
        event_banner: eventBannerUrl,
        event_portrait: eventPortraitUrl,
        college_authorisation: collegeAuthorisationUrl,
      },
      organisationType: organisation_type || "Not specified",
      totalEventImages: updatedTicket.event_images?.length || 0,
    });
  } catch (error) {
    console.error("❌ Error updating ticket media:", error);

    // Cleanup: Delete uploaded files from Cloudinary if update fails
    try {
      const filesToDelete = [];

      // Check if variables are defined in this scope
      if (typeof eventLogoUrl !== "undefined" && eventLogoUrl)
        filesToDelete.push(eventLogoUrl);
      if (typeof eventBannerUrl !== "undefined" && eventBannerUrl)
        filesToDelete.push(eventBannerUrl);
      if (typeof eventPortraitUrl !== "undefined" && eventPortraitUrl) filesToDelete.push(eventPortraitUrl);
      if (
        typeof collegeAuthorisationUrl !== "undefined" &&
        collegeAuthorisationUrl
      )
        filesToDelete.push(collegeAuthorisationUrl);
      if (
        typeof event_images !== "undefined" &&
        event_images &&
        event_images.length > 0
      ) {
        event_images.forEach((img) => filesToDelete.push(img.path));
      }
      if (
        typeof event_videos !== "undefined" &&
        event_videos &&
        event_videos.length > 0
      ) {
        event_videos.forEach((vid) => filesToDelete.push(vid.path));
      }
      if (filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map((url) =>
            deleteFromCloudinary(url).catch((err) =>
              console.error("Cleanup error:", err.message)
            )
          )
        );
      }
    } catch (cleanupError) {
      console.error("❌ Error during cleanup:", cleanupError);
    }

    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum 50MB allowed per file.",
        error_code: "FILE_TOO_LARGE",
        max_size: "50MB",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message:
          "Too many files uploaded. Maximum limits: 1 logo, 1 banner, 10 event images, 1 college authorization.",
        error_code: "TOO_MANY_FILES",
      });
    }

    // Handle file type validation errors from multer
    if (
      error.message &&
      (error.message.includes("Only images") ||
        error.message.includes("must be a document") ||
        error.message.includes("must be an image file"))
    ) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message,
        error_code: "INVALID_FILE_TYPE",
      });
    }

    // Handle multer field errors
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field",
        error: `Unexpected field: ${error.field}`,
        error_code: "UNEXPECTED_FIELD",
      });
    }

    // Handle specific validation errors
    if (
      error.message &&
      error.message.includes("College authorization file must be a document")
    ) {
      return res.status(400).json({
        message: "Invalid college authorization file type",
        error: error.message,
        error_code: "INVALID_COLLEGE_AUTH_TYPE",
      });
    }

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        message:
          "Data type casting error. Check your schema definition for event_images field.",
        error: error.message,
        field: error.path,
        error_code: "CAST_ERROR",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        error: error.message,
        error_code: "VALIDATION_ERROR",
      });
    }

    // Handle database connection errors
    if (error.name === "MongoError" || error.name === "MongooseError") {
      return res.status(500).json({
        message: "Database error occurred",
        error_code: "DATABASE_ERROR",
      });
    }

    // Generic server error
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      error_code: "INTERNAL_ERROR",
      // Only include stack trace in development
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

export const updateTicketAddOns = async (req, res) => {
  const ticketId = req.params.ticketId;
  const processedFiles = {};
  const guestProfileFiles = {};
  const ticketPhotoFiles = {};
  const videoFiles = {};
  const previewImageFiles = {};
  const foodPictureFiles = {};
  const accommodationPictureFiles = {};
  let processedSeatingLayout = null;

  let _lockKey = null;
  let _lockTimeout = null;

  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      ticketId: ticketId,
    });
  }

  const parseJSONSafely = (str, defaultValue = []) => {
    try {
      if (typeof str === "string") return JSON.parse(str);
      if (Array.isArray(str)) return str;
      return defaultValue;
    } catch {
      return defaultValue;
    }
  };

  try {
    const userId = req.user._id || req.user.id;
    const existingTicket = await Ticket.findById(ticketId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    // ── Detect layout-generation-only requests
    // This flag can arrive either as a top-level body field OR inside sub_event JSON
    let isLayoutGenerationOnly = false;
    if (req.body.generate_layout_only === "true" || req.body.generate_layout_only === true) {
      isLayoutGenerationOnly = true;
    } else if (req.body.sub_event) {
      try {
        const subEventPreview =
          typeof req.body.sub_event === "string"
            ? JSON.parse(req.body.sub_event)
            : req.body.sub_event;
        if (subEventPreview?.generate_layout_only === true || subEventPreview?.generate_layout_only === "true") {
          isLayoutGenerationOnly = true;
        }
      } catch {
        // ignore parse errors here; full parsing happens below
      }
    }
    // ── Layout-only path: exits early, NO lock needed ──
    if (isLayoutGenerationOnly) {
      const uploadedFiles = await processFileUploads(req.files || {});
      if (!uploadedFiles.ticket_layout) {
        return res.status(400).json({
          message: "No seating layout file provided",
          hint: "Please upload a ticket layout file",
        });
      }

      let totalCapacity = 0;
      try {
        const subEventJSON = req.body.sub_event
          ? JSON.parse(req.body.sub_event)
          : req.body;
        totalCapacity = parseInt(subEventJSON.total_capacity, 10) || 0;
      } catch {
        totalCapacity = parseInt(req.body.total_capacity, 10) || 0;
      }

      if (!totalCapacity || totalCapacity <= 0) {
        return res.status(400).json({
          message: "Invalid capacity",
          hint: "Please provide a valid total_capacity value",
        });
      }

      try {
        const layoutFileData = uploadedFiles.ticket_layout;
        let localFilePath;

        if (layoutFileData.localPath && fs.existsSync(layoutFileData.localPath)) {
          localFilePath = layoutFileData.localPath;
        } else if (layoutFileData.cloudinaryUrl) {
          localFilePath = await downloadFileFromCloudinary(
            layoutFileData.cloudinaryUrl,
            `layout_${ticketId}_${Date.now()}.${layoutFileData.mimeType.split("/")[1]}`
          );
        }

        if (localFilePath) {
          const generatedLayout = await generateSeatingLayoutFromFile(
            localFilePath,
            totalCapacity,
            layoutFileData.mimeType
          );

          if (localFilePath !== layoutFileData.localPath) {
            await cleanupTempFile(localFilePath);
          }

          const normalizedSeats = generatedLayout.seats.map((seat) =>
            normalizeSeatData(seat)
          );
          const missingFields = normalizedSeats.filter(
            (seat) =>
              seat.ticketTypeId === undefined ||
              seat.ticketTypeName === undefined ||
              seat.ticketTypeColor === undefined ||
              seat.price === undefined
          );

          if (missingFields.length > 0) {
            throw new Error("Seat normalization failed");
          }

          return res.status(200).json({
            message: "Seating layout generated successfully",
            seating_layout: { ...generatedLayout, seats: normalizedSeats },
            operation: "layout_generation_only",
          });
        }
      } catch {
        try {
          const fallbackLayout = generateFallbackLayout(totalCapacity);
          const normalizedSeats = fallbackLayout.seats.map((seat) =>
            normalizeSeatData(seat)
          );
          return res.status(200).json({
            message: "Seating layout generated using fallback method",
            seating_layout: { ...fallbackLayout, seats: normalizedSeats },
            operation: "layout_generation_fallback",
          });
        } catch (fallbackError) {
          return res.status(500).json({
            message: "Failed to generate seating layout",
            error: fallbackError.message,
          });
        }
      }

      return res.status(400).json({
        message: "Failed to process layout file",
        hint: "Please check your file and try again",
      });
    }

    _lockKey = `${userId}_${ticketId}`;
    if (_processingRequests.has(_lockKey)) {
      return res.status(429).json({
        message: "A save operation is already in progress. Please wait before submitting again.",
      });
    }
    _processingRequests.add(_lockKey);
    _lockTimeout = setTimeout(() => _processingRequests.delete(_lockKey), 8000);


    let subEventData;
    let editingSubEventId = null;
    let isEditingSubEvent = false;

    try {
      if (req.body.sub_event) {
        subEventData =
          typeof req.body.sub_event === "string"
            ? JSON.parse(req.body.sub_event)
            : req.body.sub_event;
        if (req.body.editing_sub_event_id && !subEventData.generate_layout_only) {
          editingSubEventId = req.body.editing_sub_event_id;
          isEditingSubEvent = true;
        }
      } else if (
        req.body.event_name ||
        req.body.event_category ||
        req.body.location_type
      ) {
        subEventData = req.body;
      } else if (req.body.subevent || req.body.subEvent) {
        const subEventField = req.body.subevent || req.body.subEvent;
        subEventData =
          typeof subEventField === "string"
            ? JSON.parse(subEventField)
            : subEventField;
      } else if (typeof req.body === "string") {
        const parsedBody = JSON.parse(req.body);
        subEventData = parsedBody.sub_event || parsedBody;
      }
    } catch (parseError) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Invalid sub_event data format",
        error: parseError.message,
        hint: "Make sure your data is properly formatted JSON",
        receivedFields: Object.keys(req.body),
      });
    }

    if (!subEventData) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "sub_event data is required",
        receivedFields: Object.keys(req.body),
        expectedFormat:
          "Send data in 'sub_event' field or include event fields directly in request body",
        hint: "Required fields include: event_name, event_category, location_type, etc.",
      });
    }

    if (typeof subEventData !== "object" || Array.isArray(subEventData)) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "sub_event data must be an object",
        receivedType: Array.isArray(subEventData) ? "array" : typeof subEventData,
        hint: "Send data as a JSON object with event fields",
      });
    }

    const baseRequiredFields = [
      { key: "event_name", value: subEventData.event_name },
      { key: "event_category", value: subEventData.event_category },
      { key: "event_subcategory", value: subEventData.event_subcategory },
      { key: "event_type", value: subEventData.event_type },
      { key: "event_language", value: subEventData.event_language },
      { key: "location_type", value: subEventData.location_type },
      { key: "event_dates", value: subEventData.event_dates },
      { key: "min_age_allowed", value: subEventData.min_age_allowed },
      { key: "event_description", value: subEventData.event_description },
      { key: "payment_type", value: subEventData.payment_type },
      { key: "POCS", value: subEventData.POCS },
      { key: "hashtag", value: subEventData.hashtag },
      { key: "total_capacity", value: subEventData.total_capacity },
      { key: "booking_start_date", value: subEventData.booking_start_date },
    ];

    let locationSpecificRequiredFields = [];
    if (subEventData.location_type === "offline") {
      locationSpecificRequiredFields = [
        { key: "location", value: subEventData.location, type: "string" },
        { key: "venue", value: subEventData.venue, type: "string" },
        { key: "seating_arrangement", value: subEventData.seating_arrangement, type: "string" },
      ];
    }

    const allRequiredFields = [...baseRequiredFields, ...locationSpecificRequiredFields];
    const missingFields = allRequiredFields
      .filter(({ value }) => !value)
      .map(({ key }) => key);

    if (missingFields.length > 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Missing required fields",
        missingFields: missingFields,
        note:
          subEventData.location_type === "offline"
            ? "For offline events: location, venue, and seating_arrangement are required"
            : subEventData.location_type === "online" ||
              subEventData.location_type === "recorded"
              ? "For online/recorded events: event_link is required in event_dates"
              : "",
      });
    }

    const parseNestedData = (data) => {
      if (!data) return [];
      try {
        if (typeof data === "string") {
          const trimmed = data.trim();
          if (trimmed === "" || trimmed === "[]" || trimmed === "{}") return [];
          const parsed = JSON.parse(trimmed);
          if (parsed === null || parsed === undefined) return [];
          return Array.isArray(parsed) ? parsed : [parsed];
        }
        if (Array.isArray(data)) return data;
        if (typeof data === "object" && data !== null) return [data];
        return [];
      } catch {
        return [];
      }
    };

    let eventDates = parseNestedData(subEventData.event_dates || req.body.event_dates);

    if (!Array.isArray(eventDates) || eventDates.length === 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "event_dates is required and must be a non-empty array",
        provided: subEventData.event_dates,
        hint: "Provide at least one event date with start_date",
      });
    }

    for (let i = 0; i < eventDates.length; i++) {
      const date = eventDates[i];
      if (!date.start_date || String(date.start_date).trim() === "") {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: `event_dates[${i}].start_date is required`,
          dateIndex: i,
          provided: date,
        });
      }
      if (
        subEventData.location_type === "online" ||
        subEventData.location_type === "recorded"
      ) {
        if (!date.event_link || String(date.event_link).trim() === "") {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `event_dates[${i}].event_link is required for online/recorded events`,
            dateIndex: i,
            date: date.start_date,
            hint: "Please provide event_link for each date in event_dates array",
          });
        }
      }
      if (subEventData.location_type === "recorded") {
        if (!date.video_name || String(date.video_name).trim() === "") {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `event_dates[${i}].video_name is required for recorded events`,
            dateIndex: i,
            date: date.start_date,
          });
        }
      }
    }

    const validEventTypes = ["private", "public"];
    if (!validEventTypes.includes(subEventData.event_type)) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Invalid event_type",
        provided: subEventData.event_type,
        validOptions: validEventTypes,
      });
    }

    const validLanguages = [
      "English", "Hindi", "Malayalam", "Tamil", "Kannada", "Telugu", "Marathi", "Gujarati", "Punjabi", "Urdu", "Bengali",
      "Odia", "Assamese", "Sanskrit", "Konkani", "Maithili", "Manipuri", "Nepali", "Sinhala",
      "Spanish", "French", "German", "Italian", "Dutch", "Greek", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
      "Portuguese", "Romanian", "Hungarian", "Czech", "Slovak", "Ukrainian", "Bulgarian", "Serbian", "Croatian",
      "Russian", "Turkish", "Chinese (Mandarin)", "Chinese (Cantonese)", "Japanese", "Korean", "Thai", "Vietnamese", "Indonesian", "Malay", "Filipino",
      "Arabic", "Persian (Farsi)", "Hebrew", "Swahili", "Zulu", "Afrikaans", "Other"
    ];
    const languageArray = parseJSONSafely(subEventData.event_language, []);
    if (!Array.isArray(languageArray) || languageArray.length === 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "event_language is required and must be a non-empty array",
        provided: subEventData.event_language,
        validOptions: validLanguages,
      });
    }

    const invalidLanguages = languageArray.filter(
      (lang) => !validLanguages.includes(lang)
    );
    if (invalidLanguages.length > 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Invalid event_language(s)",
        provided: invalidLanguages,
        validOptions: validLanguages,
      });
    }

    const validLocationTypes = ["offline", "online", "recorded"];
    if (!validLocationTypes.includes(subEventData.location_type)) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Invalid location_type",
        provided: subEventData.location_type,
        validOptions: validLocationTypes,
      });
    }

    if (subEventData.location_type === "offline") {
      const validSeatingArrangements = [
        "seated", "standing", "seated and standing", "other", "none",
      ];
      if (!validSeatingArrangements.includes(subEventData.seating_arrangement)) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "Invalid seating_arrangement for offline events",
          provided: subEventData.seating_arrangement,
          validOptions: validSeatingArrangements,
        });
      }
      if (
        typeof subEventData.location !== "string" ||
        subEventData.location.trim() === ""
      ) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "location is required for offline events and must be a non-empty string",
          provided: subEventData.location,
        });
      }
      if (
        typeof subEventData.venue !== "string" ||
        subEventData.venue.trim() === ""
      ) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "venue is required for offline events and must be a non-empty string",
          provided: subEventData.venue,
        });
      }
    }

    const validPaymentTypes = ["free", "paid"];
    if (!validPaymentTypes.includes(subEventData.payment_type)) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Invalid payment_type",
        provided: subEventData.payment_type,
        validOptions: validPaymentTypes,
      });
    }
    // Resolve GST (now that subEventData.payment_type is validated)
    const GroupForGST = await Group.findById(existingTicket.groupId).lean();
    if (!GroupForGST) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(404).json({ message: "Associated group not found" });
    }
    // groupHasGSTIN: true only when the group has a non-empty GSTIN stored
    const groupHasGSTIN = !!(
      GroupForGST.gst_no &&
      String(GroupForGST.gst_no).trim() !== ""
    );
    const { applicable: gstApplicable } = resolveGSTApplicability(
      GroupForGST,
      subEventData.payment_type,
      // Front-end sends gst_applicable inside the sub_event JSON payload
      subEventData.gst_applicable !== undefined
        ? subEventData.gst_applicable
        : req.body.gst_applicable
    );

    // appliedGSTPct is always read from the env — never from the client
    const appliedGSTPct = gstApplicable ? GST_PERCENTAGE : 0;
    const ageNum = Number(subEventData.min_age_allowed);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "Minimum age allowed must be between 1 and 150",
      });
    }

    let ageMax = 150;
    if (
      subEventData.max_age_allowed &&
      String(subEventData.max_age_allowed).trim() !== ""
    ) {
      const parsedAgeMax = Number(subEventData.max_age_allowed);
      if (isNaN(parsedAgeMax) || parsedAgeMax < 1 || parsedAgeMax > 150) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "Maximum age allowed must be between 1 and 150 if provided",
        });
      }
      if (parsedAgeMax < ageNum) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "Maximum age allowed cannot be less than minimum age allowed",
        });
      }
      ageMax = parsedAgeMax;
    }

    if (
      !subEventData.total_capacity ||
      String(subEventData.total_capacity).trim() === ""
    ) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "total_capacity is required and must be provided",
        provided: subEventData.total_capacity,
      });
    }

    const totalCapacityNum = Number(subEventData.total_capacity);
    if (isNaN(totalCapacityNum) || totalCapacityNum <= 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "total_capacity must be a positive number",
        provided: subEventData.total_capacity,
      });
    }

    if (
      typeof subEventData.booking_start_date !== "string" ||
      subEventData.booking_start_date.trim() === ""
    ) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "booking_start_date is required and must be a non-empty string",
        provided: subEventData.booking_start_date,
      });
    }

    if (subEventData.booking_end_date) {
      if (
        typeof subEventData.booking_end_date !== "string" ||
        subEventData.booking_end_date.trim() === ""
      ) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "booking_end_date must be a non-empty string if provided",
          provided: subEventData.booking_end_date,
        });
      }
    }

    const uploadedFiles = await processFileUploads(req.files || {});

    Object.keys(uploadedFiles).forEach((fieldName) => {
      if (fieldName === "ticket_layout") return;

      if (fieldName.startsWith("guest_profile_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            guestProfileFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            guestProfileFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            guestProfileFiles[parseInt(index)] = fileData;
          }
        }
      }

      if (fieldName.startsWith("food_picture_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            foodPictureFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            foodPictureFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            foodPictureFiles[parseInt(index)] = fileData;
          }
        }
      }

      if (fieldName.startsWith("accommodation_picture_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            accommodationPictureFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            accommodationPictureFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            accommodationPictureFiles[parseInt(index)] = fileData;
          }
        }
      }

      if (fieldName.startsWith("ticket_photo_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            ticketPhotoFiles[parseInt(index)] = fileData[0];
          }
        }
      }

      if (fieldName.startsWith("video_file_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            videoFiles[index] = fileData[0];
          }
        }
      }

      if (fieldName.startsWith("preview_image_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            previewImageFiles[index] = fileData[0];
          }
        }
      }
    });

    if (uploadedFiles) {
      if (uploadedFiles.event_banner) {
        let bannerFile = uploadedFiles.event_banner;
        let bannerUrl = null;
        let bannerPublicId = null;

        if (typeof bannerFile === "string") {
          bannerUrl = bannerFile;
        } else if (Array.isArray(bannerFile) && bannerFile.length > 0) {
          const firstFile = bannerFile[0];
          if (typeof firstFile === "string") {
            bannerUrl = firstFile;
          } else if (firstFile.path) {
            bannerUrl = firstFile.path;
            bannerPublicId = firstFile.public_id;
          }
        } else if (
          typeof bannerFile === "object" &&
          bannerFile !== null &&
          bannerFile.path
        ) {
          bannerUrl = bannerFile.path;
          bannerPublicId = bannerFile.public_id;
        }

        if (bannerUrl) {
          processedFiles.event_banner = bannerUrl;
          processedFiles.event_banner_public_id = bannerPublicId || "";
        } else {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: "Event banner upload failed or is invalid",
          });
        }
      }

      if (uploadedFiles.event_logo) {
        let logoFile = uploadedFiles.event_logo;
        let logoUrl = null;
        let logoPublicId = null;

        if (typeof logoFile === "string") {
          logoUrl = logoFile;
        } else if (Array.isArray(logoFile) && logoFile.length > 0) {
          const firstFile = logoFile[0];
          logoUrl = typeof firstFile === "string" ? firstFile : firstFile.path;
          logoPublicId = typeof firstFile === "object" ? firstFile.public_id : null;
        } else if (
          typeof logoFile === "object" &&
          logoFile !== null &&
          logoFile.path
        ) {
          logoUrl = logoFile.path;
          logoPublicId = logoFile.public_id;
        }

        if (logoUrl) {
          processedFiles.event_logo = logoUrl;
          processedFiles.event_logo_public_id = logoPublicId || "";
        }
      }

      if (uploadedFiles.event_portrait) {
        let portraitFile = uploadedFiles.event_portrait;
        processedFiles.event_portrait =
          typeof portraitFile === "string"
            ? portraitFile
            : Array.isArray(portraitFile)
              ? portraitFile[0].path
              : portraitFile.path;
        processedFiles.event_portrait_public_id =
          typeof portraitFile === "object"
            ? Array.isArray(portraitFile)
              ? portraitFile[0].public_id
              : portraitFile.public_id
            : "";
      }

      if (uploadedFiles.event_images && uploadedFiles.event_images.length > 0) {
        if (uploadedFiles.event_images.length > 10) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({ message: "Maximum 10 event images allowed" });
        }
        processedFiles.event_images = uploadedFiles.event_images.map((file) => {
          if (typeof file === "string") {
            return {
              path: file,
              originalName: "uploaded_image",
              mimeType: "image/jpeg",
              size: 0,
              public_id: "",
              resource_type: "image",
              uploadedAt: new Date(),
            };
          }
          return {
            path: file.path || file,
            originalName: file.originalName || file.originalname || "uploaded_image",
            mimeType: file.mimeType || file.mimetype || "image/jpeg",
            size: file.size || 0,
            public_id: file.public_id || "",
            resource_type: file.resource_type || "image",
            uploadedAt: new Date(),
          };
        });
      }

      if (uploadedFiles.event_videos && uploadedFiles.event_videos.length > 0) {
        processedFiles.event_videos = uploadedFiles.event_videos.map((file) => ({
          path: file.path || file,
          originalName: file.originalName || file.originalname || "uploaded_video",
          mimeType: file.mimeType || file.mimetype || "video/mp4",
          size: file.size || 0,
          public_id: file.public_id || "",
          uploadedAt: new Date(),
        }));
      }

      if (uploadedFiles.event_rules) {
        let rulesFile = uploadedFiles.event_rules;
        let rulesUrl = null;
        let rulesPublicId = null;
        let rulesOriginalName = "event_rules";
        let rulesMimeType = "application/pdf";
        let rulesSize = 0;

        if (typeof rulesFile === "string") {
          rulesUrl = rulesFile;
        } else if (Array.isArray(rulesFile) && rulesFile.length > 0) {
          const firstFile = rulesFile[0];
          if (typeof firstFile === "string") {
            rulesUrl = firstFile;
          } else {
            rulesUrl = firstFile.path;
            rulesPublicId = firstFile.public_id;
            rulesOriginalName = firstFile.originalName || firstFile.originalname || "event_rules";
            rulesMimeType = firstFile.mimeType || firstFile.mimetype || "application/pdf";
            rulesSize = firstFile.size || 0;
          }
        } else if (typeof rulesFile === "object" && rulesFile !== null) {
          rulesUrl = rulesFile.path;
          rulesPublicId = rulesFile.public_id;
          rulesOriginalName = rulesFile.originalName || rulesFile.originalname || "event_rules";
          rulesMimeType = rulesFile.mimeType || rulesFile.mimetype || "application/pdf";
          rulesSize = rulesFile.size || 0;
        }

        if (rulesUrl) {
          processedFiles.event_rules = {
            type: "file",
            path: rulesUrl,
            originalName: rulesOriginalName,
            mimeType: rulesMimeType,
            size: rulesSize,
            public_id: rulesPublicId || "",
            resource_type: "raw",
            uploadedAt: new Date(),
          };
        }
      }

      if (
        uploadedFiles.ticket_layout &&
        subEventData.location_type === "offline"
      ) {
        let layoutFile = uploadedFiles.ticket_layout;
        let layoutUrl = null;
        let layoutPublicId = null;

        if (typeof layoutFile === "string") {
          layoutUrl = layoutFile;
        } else if (Array.isArray(layoutFile) && layoutFile.length > 0) {
          const firstFile = layoutFile[0];
          layoutUrl = typeof firstFile === "string" ? firstFile : firstFile.path;
          layoutPublicId = typeof firstFile === "object" ? firstFile.public_id : null;
        } else if (
          typeof layoutFile === "object" &&
          layoutFile !== null &&
          layoutFile.path
        ) {
          layoutUrl = layoutFile.path;
          layoutPublicId = layoutFile.public_id;
        }

        if (layoutUrl) {
          processedFiles.ticket_layout = layoutUrl;
          processedFiles.ticket_layout_public_id = layoutPublicId || "";
        }
      }

      processedFiles.guestProfileFiles = guestProfileFiles;
      processedFiles.ticketPhotoFiles = ticketPhotoFiles;
      processedFiles.videoFiles = videoFiles;
      processedFiles.previewImageFiles = previewImageFiles;
    }

    const guests = parseNestedData(subEventData.guests || req.body.guests);
    const rawBankingDetails = parseNestedData(
      subEventData.banking_details || req.body.banking_details
    );

    let validatedBankingDetails = [];
    if (rawBankingDetails && rawBankingDetails.length > 0) {
      for (let index = 0; index < rawBankingDetails.length; index++) {
        const banking = rawBankingDetails[index];

        if (!banking.bank_acc_type || String(banking.bank_acc_type).trim() === "") {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `bank_acc_type is required for banking detail ${index + 1}`,
            field: "bank_acc_type",
            bankingDetailIndex: index + 1,
            hint: "Valid options: current, merchant",
          });
        }

        const validAccountTypes = ["current", "merchant"];
        const accType = String(banking.bank_acc_type).trim().toLowerCase();
        if (!validAccountTypes.includes(accType)) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `Invalid bank account type for banking detail ${index + 1}`,
            field: "bank_acc_type",
            bankingDetailIndex: index + 1,
            provided: banking.bank_acc_type,
            validOptions: validAccountTypes,
            hint: "Please select either 'current' or 'merchant'",
          });
        }

        if (!banking.bank_acc_no || String(banking.bank_acc_no).trim() === "") {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `bank_acc_no is required for banking detail ${index + 1}`,
            field: "bank_acc_no",
            bankingDetailIndex: index + 1,
            hint: "Please provide your bank account number",
          });
        }

        if (!/^\d+$/.test(String(banking.bank_acc_no).trim())) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `Invalid bank account number format for banking detail ${index + 1}`,
            field: "bank_acc_no",
            bankingDetailIndex: index + 1,
            error: "Bank account number must contain only digits",
            provided: banking.bank_acc_no,
            hint: "Remove any spaces, hyphens, or special characters",
          });
        }

        const accNoLength = String(banking.bank_acc_no).trim().length;
        if (accNoLength < 9 || accNoLength > 18) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `Invalid bank account number length for banking detail ${index + 1}`,
            field: "bank_acc_no",
            bankingDetailIndex: index + 1,
            error: `Account number must be between 9-18 digits. You entered ${accNoLength} digits`,
            provided: banking.bank_acc_no,
            hint: "Please check your bank account number and enter the correct length",
          });
        }

        if (!banking.bank_ifsc || String(banking.bank_ifsc).trim() === "") {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `bank_ifsc is required for banking detail ${index + 1}`,
            field: "bank_ifsc",
            bankingDetailIndex: index + 1,
            hint: "Please provide your bank's IFSC code",
          });
        }

        const ifscCode = String(banking.bank_ifsc).trim().toUpperCase();
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscCode)) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `Invalid IFSC code format for banking detail ${index + 1}`,
            field: "bank_ifsc",
            bankingDetailIndex: index + 1,
            error: "IFSC code must be 11 characters: 4 bank letters + '0' (zero) + 6 branch characters",
            provided: ifscCode,
            example: "SBIN0001234",
            hint: "Please check your IFSC code. The 5th character must be '0' (zero)",
          });
        }

        let ifscValidation;
        try {
          ifscValidation = await validateIFSCCode(ifscCode);
          if (!ifscValidation.isValid) {
            clearTimeout(_lockTimeout);
            _processingRequests.delete(_lockKey);
            return res.status(400).json({
              message: `IFSC code verification failed for banking detail ${index + 1}`,
              field: "bank_ifsc",
              bankingDetailIndex: index + 1,
              error: ifscValidation.error || "IFSC code not found in bank database",
              provided: ifscCode,
              hint: "Please verify your IFSC code from your bank passbook or check",
            });
          }
        } catch (ifscError) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `IFSC code verification failed for banking detail ${index + 1}`,
            field: "bank_ifsc",
            bankingDetailIndex: index + 1,
            error: ifscError.message || "Unable to verify IFSC code",
            provided: ifscCode,
            hint: "Please check your IFSC code or try again later",
          });
        }

        if (
          !banking.bank_acc_holder ||
          String(banking.bank_acc_holder).trim() === ""
        ) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `bank_acc_holder is required for banking detail ${index + 1}`,
            field: "bank_acc_holder",
            bankingDetailIndex: index + 1,
            hint: "Please provide the account holder's name",
          });
        }

        if (!/^[a-zA-Z\s]+$/.test(String(banking.bank_acc_holder).trim())) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(400).json({
            message: `Invalid account holder name format for banking detail ${index + 1}`,
            field: "bank_acc_holder",
            bankingDetailIndex: index + 1,
            error: "Account holder name must contain only letters and spaces",
            provided: banking.bank_acc_holder,
            hint: "Remove any numbers or special characters from the name",
          });
        }

        validatedBankingDetails.push({
          bank_acc_type: accType,
          bank_acc_no: String(banking.bank_acc_no).trim(),
          bank_ifsc: ifscCode,
          bank_acc_holder: String(banking.bank_acc_holder).trim(),
          is_group_account: false,
          bank_verified_details: ifscValidation.bankDetails || null,
        });
      }
    }

    const POCS = parseNestedData(subEventData.POCS || req.body.POCS);
    if (!Array.isArray(POCS) || POCS.length === 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "At least one Point of Contact (POC) is required",
        provided: subEventData.POCS,
        hint: "Provide POCS as an array with POC_name, POC_email, POC_contact",
      });
    }

    for (let i = 0; i < POCS.length; i++) {
      const poc = POCS[i];
      if (!poc.POC_name || String(poc.POC_name).trim() === "") {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: `POCS[${i}].POC_name is required`,
          pocIndex: i,
        });
      }
      if (!poc.POC_email || String(poc.POC_email).trim() === "") {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: `POCS[${i}].POC_email is required`,
          pocIndex: i,
        });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(poc.POC_email)) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: `POCS[${i}].POC_email has invalid format`,
          pocIndex: i,
          provided: poc.POC_email,
        });
      }
      if (!poc.POC_contact || String(poc.POC_contact).trim() === "") {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: `POCS[${i}].POC_contact is required`,
          pocIndex: i,
        });
      }
      const contactStr = String(poc.POC_contact).trim();
      if (contactStr.length < 10) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: `POCS[${i}].POC_contact must be at least 10 digits`,
          pocIndex: i,
          provided: poc.POC_contact,
        });
      }
    }

    const ticketTypes = (() => {
      const rawTickets = subEventData.ticket_types || req.body.ticket_types;
      if (!rawTickets) return [];
      if (Array.isArray(rawTickets)) return rawTickets;
      if (typeof rawTickets === "string") {
        try {
          const parsed = JSON.parse(rawTickets);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    })();

    const prohibitedItems = (() => {
      const rawItems =
        subEventData.prohibited_items ||
        req.body.prohibited_items ||
        subEventData.prohibitedItems ||
        req.body.prohibitedItems;
      if (!rawItems) return [];
      if (Array.isArray(rawItems)) return rawItems;
      if (typeof rawItems === "string") {
        const trimmed = rawItems.trim();
        if (trimmed === "" || trimmed === "[]" || trimmed === "{}") return [];
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === "object" && parsed !== null) return Object.values(parsed);
          return [parsed];
        } catch {
          if (trimmed.includes(",")) {
            return trimmed.split(",").map((item) => item.trim()).filter((item) => item !== "");
          }
          return [];
        }
      }
      if (typeof rawItems === "object" && rawItems !== null) return Object.values(rawItems);
      return [];
    })();

    let processedGuests = [];
    if (guests && guests.length > 0) {
      if (guests.length > 10) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({ message: "Maximum 10 guests allowed" });
      }
      processedGuests = guests.map((guest, index) => {
        let guestData = { guest_name: "", guest_profile: "", guest_link: "" };
        if (typeof guest === "string") {
          guestData.guest_name = guest;
        } else if (typeof guest === "object" && guest !== null) {
          guestData = {
            guest_name: guest.guest_name || "",
            guest_profile: guest.guest_profile || "",
            guest_link: guest.guest_link || "",
          };
        }
        if (guestProfileFiles[index] && guestProfileFiles[index].path) {
          guestData.guest_profile = guestProfileFiles[index].path;
        }
        return guestData;
      });
    }

    let processedTicketTypes = [];
    if (ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
        const ticketType = ticket.ticket_type || ticket.name;
        const ticketPrice =
          ticket.ticket_price !== undefined ? ticket.ticket_price : ticket.price;
        const maxCapacity =
          ticket.max_capacity !== undefined ? ticket.max_capacity : ticket.capacity;
        const existingPhoto = ticket.ticket_photo || ticket.existingPhotoPath || "";

        if (!ticketType || ticketType.toString().trim() === "")
          throw new Error(`Missing ticket_type for ticket ${index + 1}`);
        if (ticketPrice === undefined || ticketPrice === null)
          throw new Error(`Missing ticket_price for ticket ${index + 1}`);
        if (!maxCapacity)
          throw new Error(`Missing max_capacity for ticket ${index + 1}`);

        const parsedPrice = Number(ticketPrice);
        const parsedCapacity = Number(maxCapacity);
        if (isNaN(parsedPrice) || parsedPrice < 0)
          throw new Error(`Invalid ticket price for ticket ${index + 1}`);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0)
          throw new Error(`Invalid max capacity for ticket ${index + 1}`);
        const { basePrice, gstAmount, inclusivePrice } = extractGSTFromInclusive(parsedPrice, appliedGSTPct);
        const ticketData = {
          ticket_type: String(ticketType).trim(),
          ticket_price: gstApplicable ? inclusivePrice : parsedPrice, // what buyer pays
          ticket_base_price: parsedPrice,// organiser's entered price
          ticket_gst_percentage: appliedGSTPct,
          ticket_gst_amount: gstApplicable ? gstAmount : 0,
          ticket_gst_applicable: gstApplicable,
          max_capacity: parsedCapacity,
          ticket_photo: "",
          ticket_photo_public_id: "",
        };

        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path;
          ticketData.ticket_photo_public_id = ticketPhotoFiles[index].public_id;
        } else if (existingPhoto) {
          ticketData.ticket_photo = existingPhoto;
        }
        return ticketData;
      });
    }

    if (subEventData.location_type === "recorded") {
      eventDates = eventDates.map((date, index) => {
        const videoFile = videoFiles[index];
        const previewImage = previewImageFiles[index];
        return {
          ...date,
          video_file_path: videoFile ? videoFile.path : date.video_file_path || "",
          video_file_public_id: videoFile ? videoFile.public_id : date.video_file_public_id || "",
          preview_image_path: previewImage ? previewImage.path : date.preview_image_path || "",
          preview_image_public_id: previewImage
            ? previewImage.public_id
            : date.preview_image_public_id || "",
        };
      });
    }

    let exactMapLocation = {};
    if (subEventData.location_type === "offline" && subEventData.exact_map_location) {
      try {
        exactMapLocation =
          typeof subEventData.exact_map_location === "string"
            ? JSON.parse(subEventData.exact_map_location)
            : subEventData.exact_map_location;
      } catch {
        exactMapLocation = {};
      }
    }

    const finalProhibitedItems = (() => {
      if (!Array.isArray(prohibitedItems)) {
        if (prohibitedItems && typeof prohibitedItems === "object") {
          return Object.values(prohibitedItems)
            .map((item) => String(item).trim())
            .filter((item) => item !== "");
        }
        return [];
      }
      return prohibitedItems
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (typeof item === "object" && item !== null) {
            const extracted =
              item.label || item.name || item.item || item.value || item.text || item.title;
            if (extracted && String(extracted).trim() !== "")
              return String(extracted).trim();
            const stringValues = Object.values(item).filter(
              (v) => typeof v === "string" && v.trim() !== ""
            );
            return stringValues.length === 1 ? stringValues[0].trim() : "";
          }
          return String(item).trim();
        })
        .filter((item) => item !== "" && item !== "undefined" && item !== "null");
    })();
    const finalTicketTypes =
      processedTicketTypes && processedTicketTypes.length > 0
        ? processedTicketTypes.map((ticket) => ({
          ticket_type: String(ticket.ticket_type),
          ticket_price: Number(ticket.ticket_price),
          ticket_base_price: Number(ticket.ticket_base_price),
          ticket_gst_percentage: Number(ticket.ticket_gst_percentage),
          ticket_gst_amount: Number(ticket.ticket_gst_amount),
          ticket_gst_applicable: Boolean(ticket.ticket_gst_applicable),
          max_capacity: Number(ticket.max_capacity),
          ticket_photo: String(ticket.ticket_photo || ""),
          ticket_photo_public_id: String(ticket.ticket_photo_public_id || ""),
        }))
        : [];

    // Parse food and accommodation details for sub-event
    const parsedFoodAccoum = Boolean(subEventData.food_accoum === "true" || subEventData.food_accoum === true);
    const parsedFoodAccoumType = subEventData.food_accoum_type || "none";
    const parsedQuestionData = Boolean(subEventData.question_data === "true" || subEventData.question_data === true);

    const parsedQuestionDetails = typeof subEventData.question_details === "string"
      ? parseJSONSafely(subEventData.question_details, { name: false, email: false, phone_number: false, position: false })
      : subEventData.question_details || { name: false, email: false, phone_number: false, position: false };

    let parsedFoodDetails = parseJSONSafely(subEventData.food_details, []);
    let parsedAccommodationDetails = parseJSONSafely(subEventData.accommodation_details, []);

    parsedFoodDetails = parsedFoodDetails.map((item, index) => {
      const foodItem = {
        food_quantity: Number(item.food_quantity) || 0,
        food_menu: Array.isArray(item.food_menu) ? item.food_menu : (typeof item.food_menu === 'string' ? item.food_menu.split(',').map(s => s.trim()).filter(Boolean) : []),
        food_catering_name: item.food_catering_name || "",
        food_price: Number(item.food_price) || 0,
        food_picture: item.food_picture || ""
      };
      if (foodPictureFiles[index] && foodPictureFiles[index].path) {
        foodItem.food_picture = foodPictureFiles[index].path;
      }
      return foodItem;
    });

    parsedAccommodationDetails = parsedAccommodationDetails.map((item, index) => {
      const accItem = {
        accommodation_quantity: Number(item.accommodation_quantity) || 0,
        accommodation_type: Array.isArray(item.accommodation_type) ? item.accommodation_type : (typeof item.accommodation_type === 'string' ? item.accommodation_type.split(',').map(s => s.trim()).filter(Boolean) : []),
        accommodation_catering_name: item.accommodation_catering_name || "",
        accommodation_price: Number(item.accommodation_price) || 0,
        accommodation_picture: item.accommodation_picture || ""
      };
      if (accommodationPictureFiles[index] && accommodationPictureFiles[index].path) {
        accItem.accommodation_picture = accommodationPictureFiles[index].path;
      }
      return accItem;
    });

    const cleanedDescription = sanitizeDescriptionHtml(subEventData.event_description);
    const descriptionPlainText = stripHtmlForValidation(cleanedDescription);
    // ── EDIT MODE
    if (isEditingSubEvent && editingSubEventId) {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(404).json({ message: "Ticket not found" });
      }

      const subEventIndex = ticket.sub_events.findIndex(
        (se) => se._id.toString() === editingSubEventId
      );
      if (subEventIndex === -1) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(404).json({
          message: "Sub-event not found",
          subEventId: editingSubEventId,
        });
      }

      const existingSubEvent = ticket.sub_events[subEventIndex];
      const updatedSubEvent = {
        event_name: String(subEventData.event_name).trim(),
        event_category: String(subEventData.event_category).trim(),
        event_subcategory: subEventData.event_subcategory
          ? String(subEventData.event_subcategory).trim()
          : "",
        event_type: String(subEventData.event_type),
        location_type: String(subEventData.location_type),
        min_age_allowed: Number(ageNum),
        max_age_allowed: Number(ageMax),
        event_description: cleanedDescription, // Save sanitized html description
        payment_type: String(subEventData.payment_type),
        gst_applicable: gstApplicable,
        gst_percentage: appliedGSTPct,
        gst_registered_group: groupHasGSTIN,
        kids_friendly: Boolean(
          subEventData.kids_friendly === "true" || subEventData.kids_friendly === true
        ),
        pet_friendly: Boolean(
          subEventData.pet_friendly === "true" || subEventData.pet_friendly === true
        ),
        event_date_type: subEventData.event_date_type
          ? String(subEventData.event_date_type)
          : "",
        event_instagram_link: subEventData.event_instagram_link
          ? String(subEventData.event_instagram_link).trim()
          : "",
        event_youtube_link: subEventData.event_youtube_link
          ? String(subEventData.event_youtube_link).trim()
          : "",
        event_status: existingSubEvent.event_status || "pending",
        subevent: "5",
        event_language: Array.isArray(languageArray)
          ? languageArray.map((lang) => String(lang))
          : [],
        hashtag: Array.isArray(parseJSONSafely(subEventData.hashtag, []))
          ? parseJSONSafely(subEventData.hashtag, []).map((tag) => String(tag))
          : [],
        total_capacity: subEventData.total_capacity
          ? String(subEventData.total_capacity)
          : "",
        attendance_count: Boolean(
          subEventData.attendance_count === "true" || subEventData.attendance_count === true
        ),
        restrict_booking: Boolean(
          subEventData.restrict_booking === "true" || subEventData.restrict_booking === true
        ),
        food_accoum: parsedFoodAccoum,
        food_accoum_type: parsedFoodAccoumType,
        food_details: parsedFoodDetails,
        accommodation_details: parsedAccommodationDetails,
        question_data: parsedQuestionData,
        question_details: parsedQuestionDetails,
        booking_start_date: subEventData.booking_start_date
          ? String(subEventData.booking_start_date).trim()
          : "",
        booking_end_date: subEventData.booking_end_date
          ? String(subEventData.booking_end_date).trim()
          : "",
        prohibited_items:
          finalProhibitedItems.length > 0
            ? finalProhibitedItems
            : existingSubEvent.prohibited_items || [],
        ticket_types: (() => {
          // Priority 1: New tickets submitted with this request
          if (finalTicketTypes.length > 0) return finalTicketTypes;
          // Priority 2: No new tickets — recalculate GST on existing ones
          // (covers the case where only non-ticket fields are being edited)
          const existing = existingSubEvent.ticket_types || [];
          if (existing.length === 0) return [];
          return existing.map((t) => {
            // Use stored base price for recalculation; fall back to ticket_price if base not stored
            const basePrice = Number(t.ticket_base_price || t.ticket_price || 0);
            const { gstAmount, inclusivePrice } = extractGSTFromInclusive(basePrice, appliedGSTPct);
            return {
              ...t.toObject ? t.toObject() : t,
              ticket_price: gstApplicable ? inclusivePrice : basePrice,// what buyer pays
              ticket_base_price: basePrice,// organiser's entered price
              ticket_gst_percentage: appliedGSTPct,
              ticket_gst_amount: gstApplicable ? gstAmount : 0,
              ticket_gst_applicable: gstApplicable,
            };
          });
        })(),
        guests: processedGuests.map((guest) => ({
          guest_name: String(guest.guest_name || ""),
          guest_profile: String(guest.guest_profile || ""),
          guest_link: String(guest.guest_link || ""),
        })),
        banking_details:
          validatedBankingDetails.length > 0
            ? validatedBankingDetails
            : existingSubEvent?.banking_details || [],
        POCS: POCS.map((poc) => ({
          POC_name: String(poc.POC_name || ""),
          POC_email: String(poc.POC_email || ""),
          POC_contact: String(poc.POC_contact || ""),
        })),
        event_dates: eventDates.map((date) => {
          const dateEntry = {
            start_date: String(date.start_date || ""),
            end_date: String(date.end_date || ""),
            event_link: String(date.event_link || ""),
            video_name: String(date.video_name || ""),
            verification_event_code: String(date.verification_event_code || ""),
            video_file_path: String(date.video_file_path || ""),
            preview_image_path: String(date.preview_image_path || ""),
          };
          if (date.start_time && String(date.start_time).trim() !== "")
            dateEntry.start_time = String(date.start_time);
          if (date.end_time && String(date.end_time).trim() !== "")
            dateEntry.end_time = String(date.end_time);
          return dateEntry;
        }),
        event_banner: String(
          processedFiles.event_banner || existingSubEvent.event_banner || ""
        ),
        event_logo: String(
          processedFiles.event_logo || existingSubEvent.event_logo || ""
        ),
        event_portrait:
          processedFiles.event_portrait ||
          subEventData.existing_event_portrait ||
          existingSubEvent.event_portrait,
        event_images:
          processedFiles.event_images && processedFiles.event_images.length > 0
            ? processedFiles.event_images.map((img) => ({
              path: String(img.path),
              originalName: String(img.originalName),
              mimeType: String(img.mimeType),
              size: Number(img.size),
              uploadedAt: new Date(img.uploadedAt),
            }))
            : existingSubEvent.event_images || [],
        event_videos:
          processedFiles.event_videos?.length > 0
            ? processedFiles.event_videos
            : subEventData.existing_event_videos || existingSubEvent.event_videos,
      };

      if (subEventData.location_type === "offline") {
        updatedSubEvent.seating_arrangement = String(
          subEventData.seating_arrangement || "none"
        );
        updatedSubEvent.location = String(subEventData.location || "").trim();
        updatedSubEvent.venue = String(subEventData.venue || "").trim();
        updatedSubEvent.exact_map_location = {
          latitude: exactMapLocation.latitude
            ? Number(exactMapLocation.latitude)
            : undefined,
          longitude: exactMapLocation.longitude
            ? Number(exactMapLocation.longitude)
            : undefined,
          address: exactMapLocation.address ? String(exactMapLocation.address) : "",
        };
        updatedSubEvent.gate_open_time = String(
          subEventData.gate_open_time || ""
        ).trim();
        updatedSubEvent.ticket_layout = String(
          processedFiles.ticket_layout || existingSubEvent.ticket_layout || ""
        );
      } else if (
        subEventData.location_type === "online" ||
        subEventData.location_type === "recorded"
      ) {
        updatedSubEvent.event_link = String(subEventData.event_link || "").trim();
        updatedSubEvent.verification_event_code = String(
          subEventData.verification_event_code || ""
        ).trim();
        updatedSubEvent.seating_arrangement = undefined;
        updatedSubEvent.location = undefined;
        updatedSubEvent.venue = undefined;
        updatedSubEvent.exact_map_location = undefined;
        updatedSubEvent.gate_open_time = undefined;
        updatedSubEvent.ticket_layout = undefined;
      }

      if (processedFiles.event_rules) {
        updatedSubEvent.event_rules = {
          type: "file",
          path: String(processedFiles.event_rules.path),
          originalName: String(processedFiles.event_rules.originalName),
          mimeType: String(processedFiles.event_rules.mimeType),
          size: Number(processedFiles.event_rules.size),
          public_id: String(processedFiles.event_rules.public_id),
          resource_type: String(processedFiles.event_rules.resource_type),
          uploadedAt: new Date(processedFiles.event_rules.uploadedAt),
        };
      } else if (
        subEventData.event_rules_text &&
        String(subEventData.event_rules_text).trim()
      ) {
        updatedSubEvent.event_rules = {
          type: "text",
          content: sanitizeDescriptionHtml(subEventData.event_rules_text),
          uploadedAt: new Date(),
        };
      } else {
        updatedSubEvent.event_rules = existingSubEvent.event_rules || {
          type: "text",
          content: "",
          uploadedAt: new Date(),
        };
      }

      if (subEventData.location_type === "offline") {
        if (processedSeatingLayout?.seats?.length > 0) {
          updatedSubEvent.seating_layout = processedSeatingLayout;
        } else if (existingSubEvent?.seating_layout) {
          updatedSubEvent.seating_layout = existingSubEvent.seating_layout;
        }
        if (processedFiles.ticket_layout) {
          updatedSubEvent.ticket_layout = String(processedFiles.ticket_layout);
          if (processedFiles.ticket_layout_public_id) {
            updatedSubEvent.ticket_layout_public_id = String(
              processedFiles.ticket_layout_public_id
            );
          }
        } else if (existingSubEvent?.ticket_layout) {
          updatedSubEvent.ticket_layout = existingSubEvent.ticket_layout;
          if (existingSubEvent.ticket_layout_public_id) {
            updatedSubEvent.ticket_layout_public_id =
              existingSubEvent.ticket_layout_public_id;
          }
        }
      }

      const updatePayload = {
        $set: {
          [`sub_events.${subEventIndex}`]: updatedSubEvent,
          "form_progress.add_on_events": true,
          updated_by: userId,
          updated_at: new Date(),
        },
      };

      const updatedTicket = await Ticket.findOneAndUpdate(
        { _id: ticketId, "sub_events._id": editingSubEventId },
        updatePayload,
        { new: true, runValidators: true }
      );

      if (!updatedTicket) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(404).json({ message: "Failed to update sub-event" });
      }

      let updatedSubEventData = updatedTicket.sub_events.find(
        (se) => se._id.toString() === editingSubEventId.toString()
      );

      if (!updatedSubEventData) {
        if (updatedTicket.sub_events[subEventIndex]) {
          updatedSubEventData = updatedTicket.sub_events[subEventIndex];
        } else {
          const matchingSubEvent = updatedTicket.sub_events.find(
            (se) => se.event_name === subEventData.event_name
          );
          if (matchingSubEvent) updatedSubEventData = matchingSubEvent;
        }
        if (!updatedSubEventData && updatedTicket.sub_events.length > 0) {
          updatedSubEventData =
            updatedTicket.sub_events[updatedTicket.sub_events.length - 1];
        }
      }

      if (!updatedSubEventData) {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(404).json({
          message: "Updated sub-event not found in ticket after update",
          subEventId: editingSubEventId,
          totalSubEvents: updatedTicket.sub_events.length,
          hint: "The sub-event may have been updated but could not be retrieved. Please refresh and check.",
        });
      }

      // ── Release lock — edit mode success ──
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);

      return res.status(200).json({
        message: "Sub-event updated successfully",
        ticket: updatedTicket,
        updatedSubEvent: updatedSubEventData,
        operation: "update",
        debug: {
          prohibited_items_count: updatedSubEventData.prohibited_items?.length || 0,
          ticket_types_count: updatedSubEventData.ticket_types?.length || 0,
          location_type: updatedSubEventData.location_type,
          has_seating_layout: !!updatedSubEventData.seating_layout,
          seating_layout_seats: updatedSubEventData.seating_layout?.seats?.length || 0,
          ticket_layout: updatedSubEventData.ticket_layout || "none",
        },
      });
    }
    // ── END EDIT MODE ─────────────────────────────────────────────────────────


    // ── Banner validation (create mode only) ─────────────────────────────────
    let existingBanner = null;
    if (isEditingSubEvent && editingSubEventId) {
      const existingSubEvent = existingTicket.sub_events.find(
        (se) => se._id.toString() === editingSubEventId
      );
      existingBanner = existingSubEvent?.event_banner;
    }

    const hasExistingBannerInPayload = !!(subEventData.existing_event_banner);
    const hasNewBannerFile = !!(processedFiles.event_banner);

    if (!hasNewBannerFile) {
      if (hasExistingBannerInPayload) {
        processedFiles.event_banner = subEventData.existing_event_banner;
      } else if (isEditingSubEvent && existingBanner) {
        processedFiles.event_banner = existingBanner;
      } else {
        clearTimeout(_lockTimeout);
        _processingRequests.delete(_lockKey);
        return res.status(400).json({
          message: "Event banner is required for sub-events",
          hint: "Please upload an event banner before proceeding",
        });
      }
    }

    if (req.files && req.files.ticket_layout && req.files.ticket_layout[0]) {
      const file = req.files.ticket_layout[0];
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error("Ticket layout file is empty. Please upload a valid file.");
      }
      if (!uploadedFiles.ticket_layout) {
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const tempFileName = `layout_${Date.now()}_${file.originalname}`;
        const tempFilePath = path.join(tempDir, tempFileName);
        try {
          fs.writeFileSync(tempFilePath, file.buffer);
        } catch (writeError) {
          throw new Error(`Failed to save temporary file: ${writeError.message}`);
        }
        try {
          const folder = getCloudinaryFolder("ticket_layout");
          const resourceType = getResourceType("ticket_layout", file.mimetype);
          const result = await uploadToCloudinary(file.buffer, { folder, resourceType });
          uploadedFiles.ticket_layout = {
            cloudinaryUrl: result.url,
            localPath: tempFilePath,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            public_id: result.public_id,
            resource_type: result.resource_type,
          };
        } catch (uploadError) {
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
          throw new Error(`Failed to upload ticket layout: ${uploadError.message}`);
        }
      }
    }

    if (isEditingSubEvent && editingSubEventId && (!req.files || !req.files.ticket_layout)) {
      const existingSubEvent = existingTicket.sub_events.find(
        (se) => se._id.toString() === editingSubEventId
      );
      if (existingSubEvent && existingSubEvent.ticket_layout) {
        uploadedFiles.ticket_layout = {
          cloudinaryUrl: existingSubEvent.ticket_layout,
          localPath: null,
          isExisting: true,
          public_id: existingSubEvent.ticket_layout_public_id || "",
        };
      }
    }

    if (subEventData.location_type === "offline") {
      if (
        subEventData.seating_layout &&
        subEventData.seating_layout.seats &&
        subEventData.seating_layout.seats.length > 0
      ) {
        const layoutData = subEventData.seating_layout;
        processedSeatingLayout = {
          rows: (layoutData.rows || []).map((r) => String(r)),
          columns: Number(layoutData.columns || 0),
          seats: (layoutData.seats || []).map((seat) => ({
            seatId: String(seat.seatId || ""),
            row: String(seat.row || ""),
            column: Number(seat.column || 0),
            isAvailable: seat.isAvailable !== false,
            isSelected: false,
            ticketTypeId:
              seat.ticketTypeId !== undefined && seat.ticketTypeId !== null
                ? String(seat.ticketTypeId)
                : null,
            ticketTypeName:
              seat.ticketTypeName !== undefined && seat.ticketTypeName !== null
                ? String(seat.ticketTypeName)
                : null,
            ticketTypeColor:
              seat.ticketTypeColor !== undefined && seat.ticketTypeColor !== null
                ? String(seat.ticketTypeColor)
                : null,
            price:
              seat.price !== undefined && seat.price !== null
                ? Number(seat.price)
                : 0,
          })),
          ticketTypeAssignments: (layoutData.ticketTypeAssignments || [])
            .filter(
              (assignment) =>
                assignment.ticketTypeName &&
                String(assignment.ticketTypeName).trim() !== "" &&
                assignment.assignedSeats &&
                Array.isArray(assignment.assignedSeats) &&
                assignment.assignedSeats.length > 0
            )
            .map((assignment) => ({
              ticketTypeId: String(assignment.ticketTypeId || ""),
              ticketTypeName: String(assignment.ticketTypeName || ""),
              color: assignment.color ? String(assignment.color) : "",
              assignedSeats: (assignment.assignedSeats || []).map((s) => String(s)),
              capacity: Number(assignment.capacity || 0),
              price: Number(
                assignment.price !== undefined && assignment.price !== null
                  ? assignment.price
                  : 0
              ),
            })),
        };
        if (uploadedFiles.ticket_layout?.cloudinaryUrl) {
          processedFiles.ticket_layout = uploadedFiles.ticket_layout.cloudinaryUrl;
          processedFiles.ticket_layout_public_id =
            uploadedFiles.ticket_layout.public_id || "";
        }
      } else if (uploadedFiles.ticket_layout && totalCapacityNum > 0) {
        try {
          const layoutFileData = uploadedFiles.ticket_layout;
          let localFilePath;
          if (layoutFileData.localPath && fs.existsSync(layoutFileData.localPath)) {
            localFilePath = layoutFileData.localPath;
          } else if (layoutFileData.cloudinaryUrl) {
            try {
              localFilePath = await downloadFileFromCloudinary(
                layoutFileData.cloudinaryUrl,
                `layout_${ticketId}_${Date.now()}.${layoutFileData.mimeType?.split("/")[1] || "jpg"
                }`
              );
            } catch (downloadError) {
              throw new Error(`Failed to download layout file: ${downloadError.message}`);
            }
          }
          if (localFilePath) {
            try {
              const generatedLayout = await generateSeatingLayoutFromFile(
                localFilePath,
                totalCapacityNum,
                layoutFileData.mimeType || "image/jpeg"
              );
              if (generatedLayout.seats && generatedLayout.seats.length > 0) {
                generatedLayout.seats = generatedLayout.seats.map((seat) => ({
                  ...seat,
                  ticketTypeId: seat.ticketTypeId !== undefined ? seat.ticketTypeId : null,
                  ticketTypeName:
                    seat.ticketTypeName !== undefined ? seat.ticketTypeName : null,
                  ticketTypeColor:
                    seat.ticketTypeColor !== undefined ? seat.ticketTypeColor : null,
                  price: seat.price !== undefined ? seat.price : 0,
                }));
              }
              processedSeatingLayout = {
                rows: (generatedLayout.rows || []).map((r) => String(r)),
                columns: Number(generatedLayout.columns || 0),
                seats: (generatedLayout.seats || []).map((seat) => ({
                  seatId: String(seat.seatId),
                  row: String(seat.row),
                  column: Number(seat.column),
                  isAvailable: seat.isAvailable !== false,
                  isSelected: false,
                  ticketTypeId: seat.ticketTypeId !== undefined ? seat.ticketTypeId : null,
                  ticketTypeName:
                    seat.ticketTypeName !== undefined ? seat.ticketTypeName : null,
                  ticketTypeColor:
                    seat.ticketTypeColor !== undefined ? seat.ticketTypeColor : null,
                  price: Number(seat.price || 0),
                })),
                ticketTypeAssignments: (generatedLayout.ticketTypeAssignments || [])
                  .filter(
                    (a) => a.ticketTypeId && a.ticketTypeName && a.assignedSeats?.length > 0
                  )
                  .map((assignment) => ({
                    ticketTypeId: String(assignment.ticketTypeId || ""),
                    ticketTypeName: String(assignment.ticketTypeName || ""),
                    color: String(assignment.color || ""),
                    assignedSeats: (assignment.assignedSeats || []).map((seat) =>
                      String(seat)
                    ),
                    capacity: Number(assignment.capacity || 0),
                    price: Number(assignment.price || 0),
                  })),
              };
              if (layoutFileData.cloudinaryUrl) {
                processedFiles.ticket_layout = layoutFileData.cloudinaryUrl;
                processedFiles.ticket_layout_public_id = layoutFileData.public_id || "";
              }
              if (
                layoutFileData.cloudinaryUrl &&
                localFilePath !== layoutFileData.localPath
              ) {
                await cleanupTempFile(localFilePath);
              }
            } catch (generationError) {
              if (
                layoutFileData.cloudinaryUrl &&
                localFilePath !== layoutFileData.localPath
              ) {
                try {
                  await cleanupTempFile(localFilePath);
                } catch {
                  // cleanup best-effort
                }
              }
            }
          }
        } catch (outerError) {
          if (uploadedFiles.ticket_layout?.cloudinaryUrl) {
            processedFiles.ticket_layout = uploadedFiles.ticket_layout.cloudinaryUrl;
            processedFiles.ticket_layout_public_id =
              uploadedFiles.ticket_layout.public_id || "";
          }
        }
      } else if (uploadedFiles.ticket_layout) {
        if (uploadedFiles.ticket_layout.cloudinaryUrl) {
          processedFiles.ticket_layout = uploadedFiles.ticket_layout.cloudinaryUrl;
          processedFiles.ticket_layout_public_id =
            uploadedFiles.ticket_layout.public_id || "";
        }
      }

      if (!processedSeatingLayout && isEditingSubEvent && editingSubEventId) {
        const existingSubEvent = existingTicket.sub_events.find(
          (se) => se._id.toString() === editingSubEventId
        );
        if (existingSubEvent?.seating_layout) {
          processedSeatingLayout = existingSubEvent.seating_layout;
        }
      }
    }

    // ── Duplication check (create mode only) ─────────────────────────────────
    if (
      !isEditingSubEvent &&
      existingTicket.sub_events &&
      existingTicket.sub_events.length > 0
    ) {
      const newEventName = String(subEventData.event_name).trim().toLowerCase();
      let newLocationIdentifier = "";

      if (subEventData.location_type === "offline") {
        const location = String(subEventData.location || "").trim().toLowerCase();
        const venue = String(subEventData.venue || "").trim().toLowerCase();
        newLocationIdentifier = `${location}|${venue}`;
      } else if (subEventData.location_type === "online") {
        if (eventDates && eventDates.length > 0 && eventDates[0].event_link) {
          newLocationIdentifier = String(eventDates[0].event_link).trim().toLowerCase();
        }
      } else if (subEventData.location_type === "recorded") {
        if (eventDates && eventDates.length > 0) {
          newLocationIdentifier =
            String(eventDates[0].video_name || "").trim().toLowerCase() || "recorded";
        }
      }

      for (const newEventDate of eventDates) {
        const newStartDate = newEventDate.start_date;
        const newStartTime = newEventDate.start_time || "";

        const duplicateSubEvent = existingTicket.sub_events.find((existingSubEvent) => {
          const existingEventName = String(
            existingSubEvent.event_name || ""
          ).trim().toLowerCase();
          if (existingEventName !== newEventName) return false;
          if (existingSubEvent.location_type !== subEventData.location_type) return false;

          let locationMatches = false;
          if (subEventData.location_type === "offline") {
            const existingLocation = String(
              existingSubEvent.location || ""
            ).trim().toLowerCase();
            const existingVenue = String(
              existingSubEvent.venue || ""
            ).trim().toLowerCase();
            locationMatches =
              `${existingLocation}|${existingVenue}` === newLocationIdentifier;
          } else if (subEventData.location_type === "online") {
            if (existingSubEvent.event_dates && existingSubEvent.event_dates.length > 0) {
              locationMatches =
                String(existingSubEvent.event_dates[0].event_link || "")
                  .trim()
                  .toLowerCase() === newLocationIdentifier;
            }
          } else if (subEventData.location_type === "recorded") {
            if (existingSubEvent.event_dates && existingSubEvent.event_dates.length > 0) {
              locationMatches =
                String(existingSubEvent.event_dates[0].video_name || "")
                  .trim()
                  .toLowerCase() === newLocationIdentifier;
            }
          }

          if (!locationMatches) return false;

          if (existingSubEvent.event_dates && existingSubEvent.event_dates.length > 0) {
            return existingSubEvent.event_dates.some((existingDate) => {
              if (existingDate.start_date !== newStartDate) return false;
              const existingStartTime = existingDate.start_time || "";
              if (existingStartTime && newStartTime)
                return existingStartTime === newStartTime;
              return true;
            });
          }
          return false;
        });

        if (duplicateSubEvent) {
          clearTimeout(_lockTimeout);
          _processingRequests.delete(_lockKey);
          return res.status(409).json({
            message: "Duplicate sub-event detected",
            error: "A sub-event with the same name, location, and date/time already exists",
            duplicateEvent: {
              name: duplicateSubEvent.event_name,
              date: newStartDate,
              location:
                subEventData.location_type === "offline"
                  ? `${duplicateSubEvent.location} - ${duplicateSubEvent.venue}`
                  : duplicateSubEvent.event_link || "Online/Recorded",
            },
            hint: "Please modify the event name, location, date, or time to avoid conflicts",
          });
        }
      }
    }

    // ── Build new sub-event
    const newSubEvent = {
      event_name: String(subEventData.event_name).trim(),
      event_category: String(subEventData.event_category).trim(),
      event_subcategory: subEventData.event_subcategory
        ? String(subEventData.event_subcategory).trim()
        : "",
      event_type: String(subEventData.event_type),
      location_type: String(subEventData.location_type),
      min_age_allowed: Number(ageNum),
      max_age_allowed: Number(ageMax),
      event_description: cleanedDescription, // Save sanitized html description
      payment_type: String(subEventData.payment_type),
      gst_applicable: gstApplicable,
      gst_percentage: appliedGSTPct,
      gst_registered_group: groupHasGSTIN,
      main_ticket_id: ticketId,
      kids_friendly: Boolean(
        subEventData.kids_friendly === "true" || subEventData.kids_friendly === true
      ),
      pet_friendly: Boolean(
        subEventData.pet_friendly === "true" || subEventData.pet_friendly === true
      ),
      attendance_count: Boolean(
        subEventData.attendance_count === "true" || subEventData.attendance_count === true
      ),
      restrict_booking: Boolean(
        subEventData.restrict_booking === "true" || subEventData.restrict_booking === true
      ),
      food_accoum: parsedFoodAccoum,
      food_accoum_type: parsedFoodAccoumType,
      food_details: parsedFoodDetails,
      accommodation_details: parsedAccommodationDetails,
      question_data: parsedQuestionData,
      question_details: parsedQuestionDetails,
      event_date_type: subEventData.event_date_type
        ? String(subEventData.event_date_type)
        : "",
      event_instagram_link: subEventData.event_instagram_link
        ? String(subEventData.event_instagram_link).trim()
        : "",
      event_youtube_link: subEventData.event_youtube_link
        ? String(subEventData.event_youtube_link).trim()
        : "",
      event_status: "pending",
      subevent: "5",
      event_language: Array.isArray(languageArray)
        ? languageArray.map((lang) => String(lang))
        : [],
      hashtag: Array.isArray(parseJSONSafely(subEventData.hashtag, []))
        ? parseJSONSafely(subEventData.hashtag, []).map((tag) => String(tag))
        : [],
      total_capacity: subEventData.total_capacity
        ? String(subEventData.total_capacity)
        : "",
      booking_start_date: subEventData.booking_start_date
        ? String(subEventData.booking_start_date).trim()
        : "",
      booking_end_date: subEventData.booking_end_date
        ? String(subEventData.booking_end_date).trim()
        : "",
      prohibited_items: finalProhibitedItems,
      ticket_types: finalTicketTypes,
      guests: processedGuests.map((guest) => ({
        guest_name: String(guest.guest_name || ""),
        guest_profile: String(guest.guest_profile || ""),
        guest_link: String(guest.guest_link || ""),
      })),
      banking_details: validatedBankingDetails,
      POCS: POCS.map((poc) => ({
        POC_name: String(poc.POC_name || ""),
        POC_email: String(poc.POC_email || ""),
        POC_contact: String(poc.POC_contact || ""),
      })),
      event_dates: eventDates.map((date) => {
        const dateEntry = {
          start_date: String(date.start_date || ""),
          end_date: String(date.end_date || ""),
          event_link: String(date.event_link || ""),
          video_name: String(date.video_name || ""),
          verification_event_code: String(date.verification_event_code || ""),
          video_file_path: String(date.video_file_path || ""),
          preview_image_path: String(date.preview_image_path || ""),
        };
        if (date.start_time && String(date.start_time).trim() !== "")
          dateEntry.start_time = String(date.start_time);
        if (date.end_time && String(date.end_time).trim() !== "")
          dateEntry.end_time = String(date.end_time);
        return dateEntry;
      }),
      event_banner: String(processedFiles.event_banner || ""),
      event_logo: String(processedFiles.event_logo || ""),
      event_portrait:
        processedFiles.event_portrait ||
        subEventData.existing_event_portrait ||
        "",
      event_videos:
        processedFiles.event_videos && processedFiles.event_videos.length > 0
          ? processedFiles.event_videos
          : parseJSONSafely(subEventData.existing_event_videos, []),
      event_images: (processedFiles.event_images || []).map((img) => ({
        path: String(img.path),
        originalName: String(img.originalName),
        mimeType: String(img.mimeType),
        size: Number(img.size),
        uploadedAt: new Date(img.uploadedAt),
      })),
    };

    if (subEventData.location_type === "offline") {
      newSubEvent.seating_arrangement = String(
        subEventData.seating_arrangement || "none"
      );
      newSubEvent.location = String(subEventData.location || "").trim();
      newSubEvent.venue = String(subEventData.venue || "").trim();
      newSubEvent.exact_map_location = {
        latitude: exactMapLocation.latitude
          ? Number(exactMapLocation.latitude)
          : undefined,
        longitude: exactMapLocation.longitude
          ? Number(exactMapLocation.longitude)
          : undefined,
        address: exactMapLocation.address ? String(exactMapLocation.address) : "",
      };
      newSubEvent.gate_open_time = String(subEventData.gate_open_time || "").trim();
      newSubEvent.ticket_layout = String(processedFiles.ticket_layout || "");

      if (processedSeatingLayout?.seats?.length > 0) {
        processedSeatingLayout.seats = processedSeatingLayout.seats.map((seat) => ({
          seatId: String(seat.seatId),
          row: String(seat.row),
          column: Number(seat.column),
          isAvailable: seat.isAvailable !== false,
          isSelected: false,
          ticketTypeId: seat.ticketTypeId !== undefined ? seat.ticketTypeId : null,
          ticketTypeName: seat.ticketTypeName !== undefined ? seat.ticketTypeName : null,
          ticketTypeColor:
            seat.ticketTypeColor !== undefined ? seat.ticketTypeColor : null,
          price: seat.price !== undefined ? Number(seat.price) : 0,
        }));
        newSubEvent.seating_layout = processedSeatingLayout;
      }
    } else if (
      subEventData.location_type === "online" ||
      subEventData.location_type === "recorded"
    ) {
      newSubEvent.event_link = String(subEventData.event_link || "").trim();
      newSubEvent.verification_event_code = String(
        subEventData.verification_event_code || ""
      ).trim();
      newSubEvent.seating_arrangement = undefined;
      newSubEvent.location = undefined;
      newSubEvent.venue = undefined;
      newSubEvent.exact_map_location = {
        latitude: undefined,
        longitude: undefined,
        address: undefined,
      };
      newSubEvent.gate_open_time = undefined;
      newSubEvent.ticket_layout = undefined;
    }

    if (processedFiles.event_rules) {
      newSubEvent.event_rules = {
        type: "file",
        path: String(processedFiles.event_rules.path),
        originalName: String(processedFiles.event_rules.originalName),
        mimeType: String(processedFiles.event_rules.mimeType),
        size: Number(processedFiles.event_rules.size),
        public_id: String(processedFiles.event_rules.public_id),
        resource_type: String(processedFiles.event_rules.resource_type),
        uploadedAt: new Date(processedFiles.event_rules.uploadedAt),
      };
    } else if (
      subEventData.event_rules_text &&
      String(subEventData.event_rules_text).trim()
    ) {
      newSubEvent.event_rules = {
        type: "text",
        content: sanitizeDescriptionHtml(subEventData.event_rules_text),
        uploadedAt: new Date(),
      };
    } else {
      newSubEvent.event_rules = { type: "text", content: "", uploadedAt: new Date() };
    }

    if (!Array.isArray(newSubEvent.event_dates) || newSubEvent.event_dates.length === 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "At least one event date is required",
        hint: "Provide event_dates as an array with start_date, end_date, start_time, end_time",
      });
    }

    if (!Array.isArray(newSubEvent.POCS) || newSubEvent.POCS.length === 0) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(400).json({
        message: "At least one Point of Contact (POC) is required",
        hint: "Provide POCS as an array with POC_name, POC_email, POC_contact",
      });
    }

    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        $push: { sub_events: newSubEvent },
        "form_progress.add_on_events": true,
        updated_by: userId,
        updated_at: new Date(),
      },
      { new: true, runValidators: true, upsert: false }
    );

    if (!updatedTicket) {
      clearTimeout(_lockTimeout);
      _processingRequests.delete(_lockKey);
      return res.status(404).json({
        message: "Failed to update ticket with sub-event",
        hint: "Ticket not found or update failed",
      });
    }

    const savedSubEvent = updatedTicket.sub_events[updatedTicket.sub_events.length - 1];

    const responseData = {
      message: "Sub-event added successfully to ticket",
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
      addedSubEvent: savedSubEvent,
      totalSubEvents: updatedTicket.sub_events.length,
      location_type: subEventData.location_type,
      duplicationCheck: {
        performed: true,
        status: "passed",
        message: "No duplicate sub-events found",
      },
      uploadedFiles: {
        event_banner: processedFiles.event_banner ? 1 : 0,
        event_logo: processedFiles.event_logo ? 1 : 0,
        event_images: processedFiles.event_images
          ? processedFiles.event_images.length
          : 0,
        guest_profiles: Object.keys(guestProfileFiles).length,
        ticket_photos: Object.keys(ticketPhotoFiles).length,
        video_files: Object.keys(videoFiles).length,
        preview_images: Object.keys(previewImageFiles).length,
        event_rules: processedFiles.event_rules ? 1 : 0,
        ticket_layout: processedFiles.ticket_layout ? 1 : 0,
      },
      processedGuests: processedGuests.length,
      eventDatesCount: eventDates.length,
      prohibitedItemsCount: savedSubEvent.prohibited_items
        ? savedSubEvent.prohibited_items.length
        : 0,
      ticketTypesCount: savedSubEvent.ticket_types
        ? savedSubEvent.ticket_types.length
        : 0,
    };

    if (subEventData.location_type === "offline") {
      responseData.offline_fields = {
        seating_arrangement: newSubEvent.seating_arrangement,
        location: newSubEvent.location,
        venue: newSubEvent.venue,
        has_map_location:
          Object.keys(newSubEvent.exact_map_location || {}).length > 0,
        ticket_types: processedTicketTypes.length,
        ticket_layout: newSubEvent.ticket_layout ? 1 : 0,
        has_seating_layout: !!newSubEvent.seating_layout,
        seating_layout_seats: newSubEvent.seating_layout?.seats?.length || 0,
      };
    } else if (
      subEventData.location_type === "online" ||
      subEventData.location_type === "recorded"
    ) {
      responseData.online_fields = {
        event_link: newSubEvent.event_link || "Not provided",
        verification_code: newSubEvent.verification_event_code || "Not provided",
      };
      if (subEventData.location_type === "recorded") {
        responseData.recorded_fields = {
          video_files_uploaded: Object.keys(videoFiles).length,
          preview_images_uploaded: Object.keys(previewImageFiles).length,
          dates_with_videos: eventDates.filter((d) => d.video_file_path).length,
        };
      }
    }

    // ── Release lock — create mode success ──
    clearTimeout(_lockTimeout);
    _processingRequests.delete(_lockKey);
    res.status(200).json(responseData);

  } catch (error) {
    // ── Release lock — error path ──
    if (_lockTimeout) clearTimeout(_lockTimeout);
    if (_lockKey) _processingRequests.delete(_lockKey);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum 50MB allowed per file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files uploaded. Maximum limits exceeded.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected file field detected",
        error: error.message,
        field: error.field || "Unknown field",
        hint: "Check your form field names against the allowed fields list",
      });
    }
    if (
      error.message &&
      (error.message.includes("Missing required fields for ticket type") ||
        error.message.includes("Invalid ticket price") ||
        error.message.includes("Invalid max capacity") ||
        error.message.includes("Missing ticket_type") ||
        error.message.includes("Missing ticket_price") ||
        error.message.includes("Missing max_capacity"))
    ) {
      return res.status(400).json({
        message: "Ticket type validation error",
        error: error.message,
      });
    }
    if (
      error.message &&
      (error.message.includes("must be an image file") ||
        error.message.includes("must be a document") ||
        error.message.includes("Invalid file type"))
    ) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message,
      });
    }
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({ message: "Validation error", errors: validationErrors });
    }
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Data type casting error. Check your data format.",
        error: error.message,
        field: error.path,
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Sub-event with similar details already exists",
      });
    }

    try {
      const filesToDelete = [];
      if (processedFiles && typeof processedFiles === "object") {
        if (processedFiles.event_banner_public_id)
          filesToDelete.push(processedFiles.event_banner_public_id);
        if (processedFiles.event_logo_public_id)
          filesToDelete.push(processedFiles.event_logo_public_id);
        if (processedFiles.event_portrait_public_id)
          filesToDelete.push(processedFiles.event_portrait_public_id);
        if (processedFiles.ticket_layout_public_id)
          filesToDelete.push(processedFiles.ticket_layout_public_id);
        if (processedFiles.event_images && Array.isArray(processedFiles.event_images)) {
          processedFiles.event_images.forEach((img) => {
            if (img.public_id) filesToDelete.push(img.public_id);
          });
        }
        if (processedFiles.event_videos && Array.isArray(processedFiles.event_videos)) {
          processedFiles.event_videos.forEach((vid) => {
            if (vid.public_id) filesToDelete.push(vid.public_id);
          });
        }
        if (processedFiles.event_rules && processedFiles.event_rules.public_id)
          filesToDelete.push(processedFiles.event_rules.public_id);
      }
      if (guestProfileFiles && typeof guestProfileFiles === "object") {
        Object.values(guestProfileFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (foodPictureFiles && typeof foodPictureFiles === "object") {
        Object.values(foodPictureFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (accommodationPictureFiles && typeof accommodationPictureFiles === "object") {
        Object.values(accommodationPictureFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (ticketPhotoFiles && typeof ticketPhotoFiles === "object") {
        Object.values(ticketPhotoFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (videoFiles && typeof videoFiles === "object") {
        Object.values(videoFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (previewImageFiles && typeof previewImageFiles === "object") {
        Object.values(previewImageFiles).forEach((file) => {
          if (file && file.public_id) filesToDelete.push(file.public_id);
        });
      }
      if (filesToDelete.length > 0) {
        for (const publicId of filesToDelete) {
          await deleteFromCloudinary(publicId);
        }
      }
    } catch {
      // cleanup best-effort, do not re-throw
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const updateTicketDetails = async (req, res) => {
  const ticketId = req.params.ticketId;
  // Validate ticket ID format
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      ticketId: ticketId,
    });
  }

  // Utility function to parse JSON safely
  const parseJSONSafely = (str, defaultValue = []) => {
    try {
      if (typeof str === "string") {
        return JSON.parse(str);
      }
      if (Array.isArray(str)) {
        return str;
      }
      return defaultValue;
    } catch {
      return defaultValue;
    }
  };

  try {
    const processedFiles = {};
    const ticketPhotoFiles = {};
    const foodPictureFiles = {};
    const accommodationPictureFiles = {};

    // Handle file uploads first with better error handling
    await new Promise((resolve, reject) => {
      uploadTicketMedia(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          console.error("Error code:", err.code);
          console.error("Error message:", err.message);
          console.error("Error field:", err.field);
          return reject(err);
        }
        resolve();
      });
    });

    const userId = req.user._id || req.user.id;

    // Check if ticket exists
    const existingTicket = await Ticket.findById(ticketId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Get the associated group for default banking details
    const GroupBank = await Group.findById(existingTicket.groupId);
    if (!GroupBank) {
      return res.status(404).json({ message: "Associated group not found" });
    }
    // Extract form data FIRST (must come before GST resolution)
    const {
      payment_type,
      ticket_layout,
      total_capacity,
      attendance_count,
      booking_start_date,
      booking_end_date,
      restrict_booking,
      use_group_bank_account = "true",
      food_accoum,
      food_accoum_type,
      food_details,
      accommodation_details,
      question_data,
      question_details,
    } = req.body;
    // Resolve GST (now payment_type is defined)
    const { applicable: gstApplicable, mandatory: gstMandatory } =
      resolveGSTApplicability(GroupBank, payment_type, req.body.gst_applicable);
    const appliedGSTPct = gstApplicable ? GST_PERCENTAGE : 0;
    //VALIDATION SECTION
    // 1. Validate payment_type (REQUIRED)
    if (!payment_type || String(payment_type).trim() === "") {
      return res.status(400).json({
        message: "payment_type is required",
        hint: "Must be either 'free' or 'paid'",
      });
    }

    const validPaymentTypes = ["free", "paid"];
    if (!validPaymentTypes.includes(payment_type)) {
      return res.status(400).json({
        message: "Invalid payment_type",
        provided: payment_type,
        validOptions: validPaymentTypes,
      });
    }

    // 2. Parse nested data helper function
    const parseNestedData = (data, fieldName) => {
      if (!data) return [];
      try {
        if (typeof data === "string") {
          const trimmed = data.trim();
          if (trimmed === "" || trimmed === "[]" || trimmed === "{}") {
            return [];
          }
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [parsed];
        }
        if (Array.isArray(data)) {
          return data;
        }
        console.warn(
          `${fieldName} is not a string or array, received type:`,
          typeof data
        );
        return [];
      } catch (error) {
        console.error(`Error parsing ${fieldName}:`, error);
        console.error(`Attempted to parse: ${data}`);
        return [];
      }
    };

    // Parse nested arrays from request body
    const bankingDetails = parseNestedData(req.body.banking_details, "banking_details");
    const ticketTypes = parseNestedData(req.body.ticket_types, "ticket_types");

    // 3. Validate ticket_types for paid events
    if (payment_type === "paid") {
      if (!ticketTypes || ticketTypes.length === 0) {
        return res.status(400).json({
          message: "At least one ticket type is required for paid events",
          hint: "Provide ticket_types as an array with ticket_type, ticket_price, and max_capacity",
        });
      }

      if (ticketTypes.length > 20) {
        return res.status(400).json({
          message: "Maximum 20 ticket types allowed",
          provided: ticketTypes.length,
        });
      }
    }

    // 4. Validate total_capacity if provided
    if (total_capacity !== undefined && String(total_capacity).trim() !== "") {
      const totalCap = Number(total_capacity);
      if (isNaN(totalCap) || totalCap <= 0 || !Number.isInteger(totalCap)) {
        return res.status(400).json({
          message: "total_capacity must be a positive integer",
          provided: total_capacity,
        });
      }
    }
    // 5. Validate booking dates
    if (booking_start_date && String(booking_start_date).trim() !== "") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(booking_start_date)) {
        return res.status(400).json({
          message: "Invalid booking_start_date format",
          provided: booking_start_date,
          expectedFormat: "YYYY-MM-DD",
        });
      }
      const startDate = new Date(booking_start_date);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          message: "Invalid booking_start_date value",
          provided: booking_start_date,
        });
      }
    }

    if (booking_end_date && String(booking_end_date).trim() !== "") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(booking_end_date)) {
        return res.status(400).json({
          message: "Invalid booking_end_date format",
          provided: booking_end_date,
          expectedFormat: "YYYY-MM-DD",
        });
      }

      const endDate = new Date(booking_end_date);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid booking_end_date value",
          provided: booking_end_date,
        });
      }

      // Validate end date is after start date
      if (booking_start_date) {
        const startDate = new Date(booking_start_date);
        if (endDate <= startDate) {
          return res.status(400).json({
            message: "booking_end_date must be after booking_start_date",
            booking_start_date: booking_start_date,
            booking_end_date: booking_end_date,
          });
        }
      }
    }
    const uploadedFiles = await processFileUploads(req.files || {});
    Object.keys(uploadedFiles).forEach((fieldName) => {
      // Handle ticket photo files
      if (fieldName.startsWith("ticket_photo_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index) && parseInt(index) >= 0) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            const ticketPhotoFile = fileData[0];

            // Validate it's an image
            if (!ticketPhotoFile.path || !ticketPhotoFile.originalName) {
              throw new Error(`Ticket photo ${index} upload failed or is invalid`);
            }

            ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
          }
        }
      }
      // Handle food pictures
      if (fieldName.startsWith("food_picture_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            foodPictureFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            foodPictureFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            foodPictureFiles[parseInt(index)] = fileData;
          }
        }
      }
      // Handle accommodation pictures
      if (fieldName.startsWith("accommodation_picture_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (typeof fileData === "string") {
            accommodationPictureFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            accommodationPictureFiles[parseInt(index)] = fileData[0];
          } else if (fileData && typeof fileData === "object" && fileData.path) {
            accommodationPictureFiles[parseInt(index)] = fileData;
          }
        }
      }
    });
    if (existingTicket.location_type === "offline") {
      if (uploadedFiles.ticket_layout && uploadedFiles.ticket_layout.cloudinaryUrl) {
        const layoutFile = uploadedFiles.ticket_layout;
        if (!layoutFile.cloudinaryUrl || !layoutFile.originalName) {
          return res.status(400).json({
            message: "Ticket layout upload failed or is invalid",
          });
        }

        processedFiles.ticket_layout = layoutFile.cloudinaryUrl;
        processedFiles.ticket_layout_public_id = layoutFile.public_id;

        // Generate seating layout ONLY from file - no fallback generation
        if (total_capacity && parseInt(total_capacity) > 0) {
          const localFilePath = layoutFile.localPath;
          const fileType = layoutFile.mimeType;

          try {
            if (!localFilePath) {
              throw new Error('Local file path not available for processing');
            }

            const seatingLayout = await generateSeatingLayoutFromFile(
              localFilePath,
              parseInt(total_capacity),
              fileType
            );

            // Upload generated layout visualization
            try {
              const generatedLayoutResult = await uploadGeneratedLayoutToCloudinary(
                seatingLayout,
                ticketId
              );
              processedFiles.seating_layout = seatingLayout;
              processedFiles.seating_layout_url = generatedLayoutResult.url;
              processedFiles.seating_layout_public_id = generatedLayoutResult.public_id;
            } catch (uploadError) {
              processedFiles.seating_layout = seatingLayout;
            }
            await cleanupTempFile(localFilePath);
          } catch (error) {
            // NO FALLBACK - Return error to user
            if (localFilePath) {
              try {
                await cleanupTempFile(localFilePath);
              } catch (cleanupError) {
                // Silent cleanup failure
              }
            }

            // Log the full error for debugging
            console.error('❌ Full error details:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            // Check if it's a timeout error
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
              return res.status(400).json({
                message: 'Seating layout generation timed out',
                error: 'The image processing took too long. This usually happens with very large or complex images.',
                hint: 'Please try one of these solutions:',
                suggestions: [
                  'Use a smaller image (resize to max 2000x2000 pixels)',
                  'Compress the image to reduce file size',
                  'Simplify the layout image (remove unnecessary details)',
                  'Ensure the Python service is running: python seat_detector.py',
                  'Try uploading a different format (PNG works best)'
                ]
              });
            }

            // Check if Python service is not running
            if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED')) {
              return res.status(400).json({
                message: 'Cannot connect to seat detection service',
                error: 'The Python seat detection service is not running',
                hint: 'Please start the Python service',
                suggestions: [
                  'Open a terminal in: server/services/seat-detector/',
                  'Activate virtual environment: venv\\Scripts\\activate',
                  'Run: python seat_detector.py',
                  'Wait for "Uvicorn running on http://0.0.0.0:8001"',
                  'Then try uploading the layout again'
                ]
              });
            }

            // For other errors, show the actual error message
            return res.status(400).json({
              message: 'Failed to generate seating layout',
              error: error.message || 'Unknown error occurred',
              errorType: error.name || 'Error',
              detectedSeats: error.message.includes('Detected') ? parseInt(error.message.match(/\d+/)?.[0]) : 0,
              expectedSeats: total_capacity,
              hint: 'There was an issue processing your layout file',
              suggestions: [
                'Check the Node.js server console for detailed error logs',
                'Check the Python service console for processing logs',
                'Verify the image file is not corrupted',
                'Ensure total_capacity matches the seats in your image',
                'Try a simpler layout image with clear seat markers'
              ],
              debug: {
                errorCode: error.code,
                errorMessage: error.message,
                hasResponse: !!error.response,
                responseData: error.response?.data
              }
            });
          }
        }
      }
    }
    processedFiles.ticketPhotoFiles = ticketPhotoFiles;
    let processedTicketTypes = [];
    if (ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
        // Extract ticket data
        const ticketType = ticket.ticket_type || ticket.name;
        const ticketPrice = ticket.ticket_price !== undefined ? ticket.ticket_price : ticket.price;
        const maxCapacity = ticket.max_capacity !== undefined ? ticket.max_capacity : ticket.capacity;
        const existingPhoto = ticket.ticket_photo || ticket.existingPhotoPath || "";

        // Validate ticket_type
        if (!ticketType || String(ticketType).trim() === "") {
          throw new Error(`ticket_type is required for ticket ${index + 1}`);
        }

        if (String(ticketType).trim().length > 100) {
          throw new Error(`ticket_type for ticket ${index + 1} is too long (max 100 characters)`);
        }

        // Validate ticket_price
        if (ticketPrice === undefined || ticketPrice === null || String(ticketPrice).trim() === "") {
          throw new Error(`ticket_price is required for ticket ${index + 1}`);
        }

        const parsedPrice = Number(ticketPrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          throw new Error(
            `Invalid ticket_price for ticket ${index + 1}. Must be a non-negative number. Provided: ${ticketPrice}`
          );
        }

        // For paid events, ticket price should be greater than 0
        if (payment_type === "paid" && parsedPrice === 0) {
          throw new Error(`ticket_price must be greater than 0 for paid events (ticket ${index + 1})`);
        }

        // For free events, ticket price must be 0
        if (payment_type === "free" && parsedPrice !== 0) {
          throw new Error(`ticket_price must be 0 for free events (ticket ${index + 1})`);
        }

        // Validate max_capacity
        if (!maxCapacity || String(maxCapacity).trim() === "") {
          throw new Error(`max_capacity is required for ticket ${index + 1}`);
        }

        const parsedCapacity = Number(maxCapacity);
        if (isNaN(parsedCapacity) || parsedCapacity <= 0 || !Number.isInteger(parsedCapacity)) {
          throw new Error(
            `Invalid max_capacity for ticket ${index + 1}. Must be a positive integer. Provided: ${maxCapacity}`
          );
        }
        const { basePrice, gstAmount, inclusivePrice } = extractGSTFromInclusive(parsedPrice, appliedGSTPct);
        const ticketData = {
          ticket_type: String(ticketType).trim(),
          ticket_price: gstApplicable ? inclusivePrice : parsedPrice,   // buyer pays this
          ticket_base_price: parsedPrice,                                // organiser entered this
          ticket_gst_percentage: appliedGSTPct,
          ticket_gst_amount: gstApplicable ? gstAmount : 0,
          ticket_gst_applicable: gstApplicable,
          max_capacity: parsedCapacity,
          ticket_photo: existingPhoto,
          ticket_photo_public_id: ticket.ticket_photo_public_id || "",
          assigned_seats: ticket.assigned_seats || [],
          _id: ticket._id || ticket.id,
        };
        // Add uploaded ticket photo if available
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path;
          ticketData.ticket_photo_public_id = ticketPhotoFiles[index].public_id;
        }
        return ticketData;
      });
      // Validate total_capacity against sum of ticket capacities
      if (total_capacity !== undefined && String(total_capacity).trim() !== "") {
        const totalTicketCapacity = processedTicketTypes.reduce(
          (sum, ticket) => sum + ticket.max_capacity,
          0
        );
        const providedTotalCapacity = Number(total_capacity);
        if (totalTicketCapacity > providedTotalCapacity) {
          return res.status(400).json({
            message: "Sum of ticket type capacities exceeds total_capacity",
            totalTicketCapacity: totalTicketCapacity,
            providedTotalCapacity: providedTotalCapacity,
            hint: "Ensure total_capacity is greater than or equal to the sum of all ticket type capacities",
          });
        }
      }

      // Check for duplicate ticket types
      const ticketTypeNames = processedTicketTypes.map((t) => t.ticket_type.toLowerCase());
      const duplicates = ticketTypeNames.filter(
        (name, index) => ticketTypeNames.indexOf(name) !== index
      );
      if (duplicates.length > 0) {
        return res.status(400).json({
          message: "Duplicate ticket types found",
          duplicates: duplicates,
          hint: "Each ticket type must have a unique name",
        });
      }
    }
    let finalBankingDetails = [];
    if (payment_type === "paid") {
      if (use_group_bank_account === "true" || use_group_bank_account === true) {
        if (
          !GroupBank.primary_bank_acc_no ||
          !GroupBank.primary_bank_ifsc ||
          !GroupBank.primary_bank_acc_holder ||
          !GroupBank.primary_bank_acc_type
        ) {
          return res.status(400).json({
            message: "Group banking details are incomplete. Please update your group banking details before proceeding",
            missingFields: {
              bank_acc_no: !GroupBank.primary_bank_acc_no,
              bank_ifsc: !GroupBank.primary_bank_ifsc,
              bank_acc_holder: !GroupBank.primary_bank_acc_holder,
              bank_acc_type: !GroupBank.primary_bank_acc_type,
            },
          });
        }

        finalBankingDetails = [
          {
            bank_acc_type: String(GroupBank.primary_bank_acc_type),
            bank_acc_no: String(GroupBank.primary_bank_acc_no),
            bank_ifsc: String(GroupBank.primary_bank_ifsc),
            bank_acc_holder: String(GroupBank.primary_bank_acc_holder),
            is_group_account: true,
          },
        ];
      } else {
        const customBankingDetails = parseNestedData(req.body.banking_details, "banking_details");

        if (!customBankingDetails || customBankingDetails.length === 0) {
          return res.status(400).json({
            message: "Custom banking details are required when not using group bank account",
            receivedData: req.body.banking_details,
            hint: "Provide banking details with: bank_acc_type, bank_acc_no, bank_ifsc, bank_acc_holder",
          });
        }
        if (customBankingDetails.length > 1) {
          return res.status(400).json({
            message: "Only one banking account is allowed",
            provided: customBankingDetails.length,
            hint: "Please provide only one set of banking details",
          });
        }
        const banking = customBankingDetails[0];
        // Validate bank_acc_type
        if (!banking.bank_acc_type || String(banking.bank_acc_type).trim() === "") {
          return res.status(400).json({
            message: "bank_acc_type is required",
            field: "bank_acc_type",
            hint: "Valid options: current, merchant",
          });
        }
        const validAccountTypes = ["current", "merchant"];
        const accType = String(banking.bank_acc_type).trim().toLowerCase();
        if (!validAccountTypes.includes(accType)) {
          return res.status(400).json({
            message: "Invalid bank account type",
            field: "bank_acc_type",
            provided: banking.bank_acc_type,
            validOptions: validAccountTypes,
            hint: "Please select either 'current' or 'merchant'",
          });
        }

        // Validate bank_acc_no
        if (!banking.bank_acc_no || String(banking.bank_acc_no).trim() === "") {
          return res.status(400).json({
            message: "bank_acc_no is required",
            field: "bank_acc_no",
            hint: "Please provide your bank account number",
          });
        }

        // Validate account number - numeric only
        if (!/^\d+$/.test(String(banking.bank_acc_no).trim())) {
          return res.status(400).json({
            message: "Invalid bank account number format",
            field: "bank_acc_no",
            error: "Bank account number must contain only digits",
            provided: banking.bank_acc_no,
            hint: "Remove any spaces, hyphens, or special characters",
          });
        }

        // Validate account number length (9-18 digits)
        const accNoLength = String(banking.bank_acc_no).trim().length;
        if (accNoLength < 9 || accNoLength > 18) {
          return res.status(400).json({
            message: "Invalid bank account number length",
            field: "bank_acc_no",
            error: `Account number must be between 9-18 digits. You entered ${accNoLength} digits`,
            provided: banking.bank_acc_no,
            hint: "Please check your bank account number and enter the correct length",
          });
        }

        // Validate bank_ifsc
        if (!banking.bank_ifsc || String(banking.bank_ifsc).trim() === "") {
          return res.status(400).json({
            message: "bank_ifsc is required",
            field: "bank_ifsc",
            hint: "Please provide your bank's IFSC code",
          });
        }

        const ifscCode = String(banking.bank_ifsc).trim().toUpperCase();

        // Basic IFSC format validation
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifscCode)) {
          return res.status(400).json({
            message: "Invalid IFSC code format",
            field: "bank_ifsc",
            error: "IFSC code must be 11 characters: 4 bank letters + '0' (zero) + 6 branch characters",
            provided: ifscCode,
            example: "SBIN0001234",
            hint: "Please check your IFSC code. The 5th character must be '0' (zero)",
          });
        }

        // Live IFSC verification
        let ifscValidation;
        try {
          ifscValidation = await validateIFSCCode(ifscCode);
          if (!ifscValidation.isValid) {
            return res.status(400).json({
              message: "IFSC code verification failed",
              field: "bank_ifsc",
              error: ifscValidation.error || "IFSC code not found in bank database",
              provided: ifscCode,
              hint: "Please verify your IFSC code from your bank passbook or check",
            });
          }
        } catch (ifscError) {
          return res.status(400).json({
            message: "IFSC code verification failed",
            field: "bank_ifsc",
            error: ifscError.message || "Unable to verify IFSC code",
            provided: ifscCode,
            hint: "Please check your IFSC code or try again later",
          });
        }
        // Validate bank_acc_holder
        if (!banking.bank_acc_holder || String(banking.bank_acc_holder).trim() === "") {
          return res.status(400).json({
            message: "bank_acc_holder is required",
            field: "bank_acc_holder",
            hint: "Please provide the account holder's name",
          });
        }

        // Validate account holder name - letters and spaces only
        if (!/^[a-zA-Z\s]+$/.test(String(banking.bank_acc_holder).trim())) {
          return res.status(400).json({
            message: "Invalid account holder name format",
            field: "bank_acc_holder",
            error: "Account holder name must contain only letters and spaces",
            provided: banking.bank_acc_holder,
            hint: "Remove any numbers or special characters from the name",
          });
        }
        finalBankingDetails = [
          {
            bank_acc_type: accType,
            bank_acc_no: String(banking.bank_acc_no).trim(),
            bank_ifsc: ifscCode,
            bank_acc_holder: String(banking.bank_acc_holder).trim(),
            is_group_account: false,
            bank_verified_details: ifscValidation.bankDetails || null,
          },
        ];
      }
    } else {
      finalBankingDetails = [];
    }
    // Parse food & accommodation options
    const parsedFoodAccoum = Boolean(food_accoum === "true" || food_accoum === true);
    const parsedFoodAccoumType = food_accoum_type || "none";
    const parsedQuestionData = Boolean(question_data === "true" || question_data === true);

    const parsedQuestionDetails = typeof question_details === "string"
      ? parseJSONSafely(question_details, { name: false, email: false, phone_number: false, position: false })
      : question_details || { name: false, email: false, phone_number: false, position: false };

    let parsedFoodDetails = parseJSONSafely(food_details, []);
    let parsedAccommodationDetails = parseJSONSafely(accommodation_details, []);

    parsedFoodDetails = parsedFoodDetails.map((item, index) => {
      const foodItem = {
        food_quantity: Number(item.food_quantity) || 0,
        food_menu: Array.isArray(item.food_menu) ? item.food_menu : (typeof item.food_menu === 'string' ? item.food_menu.split(',').map(s => s.trim()).filter(Boolean) : []),
        food_catering_name: item.food_catering_name || "",
        food_price: Number(item.food_price) || 0,
        food_picture: item.food_picture || ""
      };
      if (foodPictureFiles[index] && foodPictureFiles[index].path) {
        foodItem.food_picture = foodPictureFiles[index].path;
      }
      return foodItem;
    });

    parsedAccommodationDetails = parsedAccommodationDetails.map((item, index) => {
      const accItem = {
        accommodation_quantity: Number(item.accommodation_quantity) || 0,
        accommodation_type: Array.isArray(item.accommodation_type) ? item.accommodation_type : (typeof item.accommodation_type === 'string' ? item.accommodation_type.split(',').map(s => s.trim()).filter(Boolean) : []),
        accommodation_catering_name: item.accommodation_catering_name || "",
        accommodation_price: Number(item.accommodation_price) || 0,
        accommodation_picture: item.accommodation_picture || ""
      };
      if (accommodationPictureFiles[index] && accommodationPictureFiles[index].path) {
        accItem.accommodation_picture = accommodationPictureFiles[index].path;
      }
      return accItem;
    });

    const updateData = {
      payment_type: String(payment_type),
      banking_details: finalBankingDetails,
      gst_applicable: gstApplicable,
      gst_percentage: appliedGSTPct,
      gst_registered_group: !!(GroupBank?.gst_no),
      food_accoum: parsedFoodAccoum,
      food_accoum_type: parsedFoodAccoumType,
      food_details: parsedFoodDetails,
      accommodation_details: parsedAccommodationDetails,
      question_data: parsedQuestionData,
      question_details: parsedQuestionDetails,
      "form_progress.banking_tickets": true,
      updated_by: userId,
      updated_at: new Date(),
    };
    // Add ticket types if provided
    if (processedTicketTypes.length > 0) {
      updateData.ticket_types = processedTicketTypes;
      if (total_capacity !== undefined && String(total_capacity).trim() !== "") {
        const providedTotalCapacity = Number(total_capacity);
        for (let i = 0; i < processedTicketTypes.length; i++) {
          const ticket = processedTicketTypes[i];
          if (ticket.max_capacity > providedTotalCapacity) {
            return res.status(400).json({
              message: `Ticket type capacity exceeds total event capacity`,
              ticket_type: ticket.ticket_type,
              ticket_capacity: ticket.max_capacity,
              total_capacity: providedTotalCapacity,
              hint: `${ticket.ticket_type} capacity (${ticket.max_capacity}) cannot exceed total event capacity (${providedTotalCapacity})`
            });
          }
        }
        const totalTicketCapacity = processedTicketTypes.reduce(
          (sum, ticket) => sum + ticket.max_capacity,
          0
        );
        if (totalTicketCapacity > providedTotalCapacity) {
          return res.status(400).json({
            message: "Sum of ticket type capacities exceeds total event capacity",
            totalTicketCapacity: totalTicketCapacity,
            providedTotalCapacity: providedTotalCapacity,
            breakdown: processedTicketTypes.map(t => ({
              type: t.ticket_type,
              capacity: t.max_capacity
            })),
            hint: `Total tickets (${totalTicketCapacity}) cannot exceed event capacity (${providedTotalCapacity})`
          });
        }
      }
    }
    if (processedFiles.ticket_layout) {
      updateData.ticket_layout = String(processedFiles.ticket_layout);
      updateData.ticket_layout_public_id = String(processedFiles.ticket_layout_public_id || "");
    }
    // Handle seating layout - PRIORITY 1: Manual assignment from frontend
    if (req.body.seating_layout) {
      try {
        const parsedLayout = typeof req.body.seating_layout === 'string'
          ? JSON.parse(req.body.seating_layout)
          : req.body.seating_layout;
        // Validate structure
        if (!parsedLayout.seats || !Array.isArray(parsedLayout.seats)) {
          console.error('❌ Invalid seating layout structure - missing seats array');
          throw new Error('Seating layout must contain a seats array');
        }

        if (!parsedLayout.rows || !Array.isArray(parsedLayout.rows)) {
          console.error('❌ Invalid seating layout structure - missing rows array');
          throw new Error('Seating layout must contain a rows array');
        }
        const processedSeats = parsedLayout.seats.map(seat => {
          let seatPrice = null;
          if (seat.ticketTypeId && processedTicketTypes.length > 0) {
            const matchingTicket = processedTicketTypes.find(
              tt => String(tt._id) === String(seat.ticketTypeId)
            );
            if (matchingTicket) {
              seatPrice = matchingTicket.ticket_price;
            }
          }
          // If no match found but price was provided in seat data, use it
          if (seatPrice === null && seat.price !== undefined && seat.price !== null) {
            seatPrice = Number(seat.price);
          }
          // Create clean seat object with explicit fields
          const cleanSeat = {
            seatId: seat.seatId,
            row: seat.row,
            column: seat.column,
            isAvailable: seat.isAvailable !== undefined ? seat.isAvailable : true,
            isSelected: seat.isSelected !== undefined ? seat.isSelected : false,
            ticketTypeId: seat.ticketTypeId || null,
            ticketTypeName: seat.ticketTypeName || null,
            ticketTypeColor: seat.ticketTypeColor || null,
            price: seatPrice,
          };
          // If seat has assignment but missing color, try to recover from assignments
          if (cleanSeat.ticketTypeId && !cleanSeat.ticketTypeColor) {
            const assignment = parsedLayout.ticketTypeAssignments?.find(
              a => String(a.ticketTypeId) === String(cleanSeat.ticketTypeId)
            );

            if (assignment && assignment.color) {
              cleanSeat.ticketTypeColor = assignment.color;
              cleanSeat.ticketTypeName = cleanSeat.ticketTypeName || assignment.ticketTypeName;
            } else {
              console.warn(`⚠️ Seat ${cleanSeat.seatId} has ticketTypeId but no color found!`);
            }
          }
          return cleanSeat;
        });
        const processedAssignments = (parsedLayout.ticketTypeAssignments || []).map(assignment => {
          // ✅ Find matching ticket type to get accurate price
          let assignmentPrice = null;
          if (assignment.ticketTypeId && processedTicketTypes.length > 0) {
            const matchingTicket = processedTicketTypes.find(
              tt => String(tt._id) === String(assignment.ticketTypeId)
            );
            if (matchingTicket) {
              assignmentPrice = matchingTicket.ticket_price;
            }
          }
          // Fallback to provided price if no match found
          if (assignmentPrice === null && assignment.price !== undefined && assignment.price !== null) {
            assignmentPrice = Number(assignment.price);
          }
          return {
            ticketTypeId: assignment.ticketTypeId,
            ticketTypeName: assignment.ticketTypeName,
            color: assignment.color,
            assignedSeats: assignment.assignedSeats || [],
            capacity: assignment.capacity || 0,
            price: assignmentPrice, // ✅ Use calculated price from ticket type
          };
        });
        // Build final seating layout object
        const finalLayout = {
          rows: parsedLayout.rows,
          columns: parsedLayout.columns || 0,
          seats: processedSeats,
          ticketTypeAssignments: processedAssignments,
          totalSeats: processedSeats.length,
          layoutStyle: parsedLayout.layoutStyle || 'grid',
          detectionMethod: parsedLayout.detectionMethod || 'manual'
        };
        // Count seats with colors for validation
        const seatsWithColors = processedSeats.filter(s => s.ticketTypeColor);
        const seatsWithAssignments = processedSeats.filter(s => s.ticketTypeId);
        // ✅ VALIDATE PRICES IN SEATING LAYOUT
        if (parsedLayout.seats && parsedLayout.seats.length > 0) {
          const assignedSeats = processedSeats.filter(s => s.ticketTypeId);
          const seatsWithoutPrice = assignedSeats.filter(
            s => (s.price === null || s.price === undefined)
          );
          if (seatsWithoutPrice.length > 0) {
            console.error('❌ Seats missing price:', seatsWithoutPrice.map(s => ({
              seatId: s.seatId,
              ticketTypeId: s.ticketTypeId,
              ticketTypeName: s.ticketTypeName,
              hasPrice: s.price !== undefined
            })));
          }
          if (seatsWithoutPrice.length > 0 && payment_type === 'paid') {
            return res.status(400).json({
              message: 'Some assigned seats are missing price information',
              seatsWithoutPrice: seatsWithoutPrice.map(s => s.seatId),
              hint: 'Ensure all assigned seats have ticket types with valid prices',
              suggestion: 'Check that ticket_types array contains prices for all ticket types'
            });
          }
          // Validate price consistency for assigned seats only
          const assignedAssignments = processedAssignments.filter(a => a.assignedSeats && a.assignedSeats.length > 0);
          const assignmentsWithoutPrice = assignedAssignments.filter(
            a => a.ticketTypeId && (a.price === null || a.price === undefined)
          );
          if (assignmentsWithoutPrice.length > 0 && payment_type === 'paid') {
            return res.status(400).json({
              message: 'Some ticket type assignments are missing price information',
              ticketTypesWithoutPrice: assignmentsWithoutPrice.map(a => a.ticketTypeName),
              hint: 'Ensure all assigned ticket types have valid prices defined'
            });
          }
          // Validate price ranges for paid events (assigned seats only)
          if (payment_type === 'paid' && assignedSeats.length > 0) {
            const pricesInSeats = assignedSeats
              .filter(s => s.price !== null && s.price !== undefined)
              .map(s => s.price);
            const invalidPrices = pricesInSeats.filter(p => p < 0);
            if (invalidPrices.length > 0) {
              return res.status(400).json({
                message: 'Invalid negative prices found in assigned seats',
                invalidPrices: [...new Set(invalidPrices)],
                hint: 'All seat prices must be positive numbers'
              });
            }
            const zeroPrices = pricesInSeats.filter(p => p === 0);
            if (zeroPrices.length > 0 && payment_type === 'paid') {
              return res.status(400).json({
                message: 'Assigned seats in paid events cannot have zero price',
                seatsWithZeroPrice: assignedSeats.filter(s => s.price === 0).map(s => s.seatId),
                hint: 'All assigned seats must have positive prices for paid events'
              });
            }
          }
          // For free events, ensure assigned seats have zero price
          if (payment_type === 'free' && assignedSeats.length > 0) {
            const nonZeroPrices = assignedSeats
              .filter(s => s.price !== null && s.price !== undefined && s.price > 0)
              .map(s => ({ seatId: s.seatId, price: s.price }));

            if (nonZeroPrices.length > 0) {
              return res.status(400).json({
                message: 'Free events cannot have assigned seats with non-zero prices',
                seatsWithPrice: nonZeroPrices,
                hint: 'For free events, all assigned seat prices must be 0'
              });
            }
          }
        }
        // Save to updateData
        updateData.seating_layout = finalLayout;
      } catch (parseError) {
        console.error('❌ Error parsing seating_layout from request:', parseError);
        console.error('Stack:', parseError.stack);
        return res.status(400).json({
          message: 'Failed to process seating layout',
          error: parseError.message,
          hint: 'Seating layout data is corrupted or invalid'
        });
      }
    }
    // PRIORITY 2: Auto-generated layout (only if no manual layout provided)
    else if (processedFiles.seating_layout) {
      updateData.seating_layout = processedFiles.seating_layout;

      if (processedFiles.seating_layout_url) {
        updateData.seating_layout_url = String(processedFiles.seating_layout_url);
        updateData.seating_layout_public_id = String(processedFiles.seating_layout_public_id || "");
      }
    }
    // Add total capacity if provided
    if (total_capacity !== undefined && String(total_capacity).trim() !== "") {
      updateData.total_capacity = String(total_capacity);
    }
    if (attendance_count === "true" || attendance_count === true) {
      updateData.attendance_count = true;
    } else {
      updateData.attendance_count = false;
    }
    // Add booking dates if provided
    if (booking_start_date && String(booking_start_date).trim() !== "") {
      updateData.booking_start_date = String(booking_start_date);
    }
    if (booking_end_date && String(booking_end_date).trim() !== "") {
      updateData.booking_end_date = String(booking_end_date);
    }
    // Booking restriction: true = allow multiple tickets per person, false (default) = 1 ticket only
    updateData.restrict_booking = (restrict_booking === "true" || restrict_booking === true);
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      updateData,
      {
        new: true,
        runValidators: true,
        upsert: false,
      }
    );
    if (!updatedTicket) {
      return res.status(404).json({
        message: "Failed to update ticket details",
        hint: "Ticket not found or update failed",
      });
    }
    const responseData = {
      message: "Ticket details updated successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
      payment_type: payment_type,
      banking_method: use_group_bank_account === "true" ? "group_account" : "custom_account",
      banking_details_count: finalBankingDetails.length,
      attendance_count: attendance_count,
      restrict_booking: updatedTicket.restrict_booking,
      gst_applicable: updatedTicket.gst_applicable,
      gst_percentage: updatedTicket.gst_percentage,
      total_capacity: total_capacity,
      ticket_types_count: processedTicketTypes.length,
      uploadedFiles: {
        ticket_layout: processedFiles.ticket_layout ? 1 : 0,
        ticket_photos: Object.keys(ticketPhotoFiles).length,
        generated_seating_layout: processedFiles.seating_layout ? 1 : 0,
      },
      seating_layout_info: processedFiles.seating_layout ? {
        total_seats: processedFiles.seating_layout.totalSeats,
        rows: processedFiles.seating_layout.rows.length,
        columns: processedFiles.seating_layout.columns,
        layout_style: processedFiles.seating_layout.layoutStyle,
        detection_method: processedFiles.seating_layout.detectionMethod,
        layout_dimensions: processedFiles.seating_layout.layoutWidth ? {
          width: processedFiles.seating_layout.layoutWidth,
          height: processedFiles.seating_layout.layoutHeight
        } : null
      } : null,
    };
    // Add banking details info to response (without sensitive data)
    if (use_group_bank_account === "true") {
      responseData.group_bank_info = {
        account_holder: GroupBank.primary_bank_acc_holder,
        account_type: GroupBank.primary_bank_acc_type,
        bank_name: GroupBank.bank_name || "Not specified",
        bank_ifsc: GroupBank.primary_bank_ifsc,
      };
    } else {
      responseData.custom_bank_accounts = finalBankingDetails.map((bank) => ({
        account_holder: bank.bank_acc_holder,
        account_type: bank.bank_acc_type,
        last_four_digits: bank.bank_acc_no.slice(-4),
        bank_ifsc: bank.bank_ifsc,
      }));
    }
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error updating ticket details:", error);
    // Enhanced multer error handling
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum 50MB allowed per file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files uploaded. Maximum limits exceeded.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      const allowedFields = [
        "ticket_layout",
        ...Array.from({ length: 20 }, (_, i) => `ticket_photo_${i}`),
      ];
      return res.status(400).json({
        message: "Unexpected file field detected",
        error: error.message,
        field: error.field || "Unknown field",
        allowedFields: allowedFields,
        hint: "Check your form field names against the allowed fields list",
      });
    }

    // Handle ticket type validation errors
    if (
      error.message &&
      (error.message.includes("ticket_type is required") ||
        error.message.includes("ticket_price is required") ||
        error.message.includes("max_capacity is required") ||
        error.message.includes("Invalid ticket_price") ||
        error.message.includes("Invalid max_capacity") ||
        error.message.includes("ticket_type for ticket") ||
        error.message.includes("must be greater than 0 for paid events") ||
        error.message.includes("must be 0 for free events"))
    ) {
      return res.status(400).json({
        message: "Ticket type validation error",
        error: error.message,
      });
    }

    // Handle banking validation errors
    if (
      error.message &&
      (error.message.includes("bank_acc_type is required") ||
        error.message.includes("bank_acc_no is required") ||
        error.message.includes("bank_ifsc is required") ||
        error.message.includes("bank_acc_holder is required") ||
        error.message.includes("Invalid bank_acc_no") ||
        error.message.includes("Invalid bank_ifsc") ||
        error.message.includes("Invalid bank_acc_holder") ||
        error.message.includes("Invalid bank_acc_type"))
    ) {
      return res.status(400).json({
        message: "Banking details validation error",
        error: error.message,
      });
    }

    // Handle file type errors
    if (
      error.message &&
      (error.message.includes("must be an image file") ||
        error.message.includes("upload failed or is invalid") ||
        error.message.includes("Invalid file type"))
    ) {
      return res.status(400).json({
        message: "Invalid file type or upload error",
        error: error.message,
      });
    }

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));

      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Data type casting error. Check your data format.",
        error: error.message,
        field: error.path,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Ticket details with similar data already exists",
      });
    }

    // Cleanup: Delete uploaded Cloudinary files if database operation fails
    if (
      error.code !== "LIMIT_FILE_SIZE" &&
      error.code !== "LIMIT_FILE_COUNT" &&
      error.code !== "LIMIT_UNEXPECTED_FILE"
    ) {
      try {
        const filesToDelete = [];

        // Check if processedFiles exists before accessing its properties
        if (typeof processedFiles !== "undefined") {
          // Collect ticket layout file
          if (processedFiles.ticket_layout_public_id) {
            filesToDelete.push(processedFiles.ticket_layout_public_id);
          }

          // Collect ticket photo files
          if (
            processedFiles.ticketPhotoFiles &&
            typeof processedFiles.ticketPhotoFiles === "object"
          ) {
            Object.values(processedFiles.ticketPhotoFiles).forEach((file) => {
              if (file && file.public_id) {
                filesToDelete.push(file.public_id);
              }
            });
          }
        }

        // Also check if uploadedFiles exists (from earlier in the try block)
        if (typeof uploadedFiles !== "undefined" && uploadedFiles) {
          // Check for ticket layout in uploadedFiles
          if (
            uploadedFiles.ticket_layout &&
            Array.isArray(uploadedFiles.ticket_layout) &&
            uploadedFiles.ticket_layout.length > 0
          ) {
            const layoutFile = uploadedFiles.ticket_layout[0];
            if (layoutFile.public_id && !filesToDelete.includes(layoutFile.public_id)) {
              filesToDelete.push(layoutFile.public_id);
            }
          }

          // Check for ticket photos in uploadedFiles
          Object.keys(uploadedFiles).forEach((fieldName) => {
            if (
              fieldName.startsWith("ticket_photo_") ||
              fieldName.startsWith("food_picture_") ||
              fieldName.startsWith("accommodation_picture_")
            ) {
              const fileData = uploadedFiles[fieldName];
              if (Array.isArray(fileData) && fileData.length > 0) {
                const photoFile = fileData[0];
                if (photoFile.public_id && !filesToDelete.includes(photoFile.public_id)) {
                  filesToDelete.push(photoFile.public_id);
                }
              }
            }
          });
        }

        // Delete files from Cloudinary if any were collected
        if (filesToDelete.length > 0) {
          for (const publicId of filesToDelete) {
            try {
              await deleteFromCloudinary(publicId);
            } catch (deleteError) {
              console.error(`Failed to delete file ${publicId}:`, deleteError.message);
            }
          }
        } else {
          console.log("No Cloudinary files to clean up");
        }
      } catch (cleanupError) {
        console.error("Error during Cloudinary cleanup:", cleanupError.message);
      }
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const updateTicketTerms = async (req, res) => {
  try {
    const ticketId = req.params.ticketId || req.body.ticketId;
    const { terms_accepted, company_terms_version } = req.body;
    if (!ticketId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["ticketId"],
      });
    }
    if (!terms_accepted) {
      return res.status(400).json({
        message: "Company terms and conditions must be accepted",
      });
    }
    const userId = req.user._id || req.user.id;
    // First update the ticket
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        terms_accepted: true,
        terms_accepted_at: new Date(),
        company_terms_version: company_terms_version || "1.0",
        "form_progress.terms_conditions": true,
        updated_by: userId,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or unauthorized" });
    }
    await updatedTicket.populate("groupId");
    // Create notification only if event_status is 'confirmed'
    if (updatedTicket.event_status === "confirmed") {
      try {
        const groupName = updatedTicket.groupId?.name || "Unknown Group";
        await createNotification({
          userId: userId,
          type: "event_created",
          title: "Event Created Successfully",
          message: `Your event "${updatedTicket.event_name}" has been created in ${groupName}`,
          ticketId: updatedTicket._id,
          groupId: updatedTicket.groupId?._id,
          groupName: groupName,
          eventName: updatedTicket.event_name,
        });
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    res.status(200).json({
      message: "Company terms and conditions accepted successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error updating ticket terms:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
// Step 6: Final Preview and Submit Ticket
export const submitTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    // Validate required parameters
    if (!ticketId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["ticketId"],
      });
    }
    // Find ticket without populate since User model is in another service
    const ticket = await Ticket.findOne({ _id: ticketId });
    if (!ticket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or unauthorized" });
    }
    // Check if all form steps are completed
    const { form_progress } = ticket;
    const allStepsCompleted = Object.values(form_progress).every(
      (step) => step === true
    );
    if (!allStepsCompleted) {
      return res.status(400).json({
        message: "Please complete all form steps before submitting",
        form_progress,
      });
    }
    if (!ticket.terms_accepted) {
      return res
        .status(400)
        .json({ message: "Company terms and conditions must be accepted" });
    }
    const userId = req.user._id || req.user.id;
    // Update ticket to confirmed status
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        event_status: "confirmed",
        updated_by: userId,
        updated_at: new Date(),
      },
      { new: true }
    );
    res.status(200).json({
      message: "Ticket submitted successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error submitting ticket:", error);
    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        message:
          "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
export const viewTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    // Validate required parameters
    if (!userId || !groupId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["userId"],
      });
    }
    const tickets = await Ticket.find({ userId: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      tickets,
      count: tickets.length,
      userId: userId,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
// Get Ticket by ID (for fetching ticket data in any step)
export const getAllGroupTicketId = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groupId = req.body.groupId;
    // Validate required parameters
    if (!userId || !groupId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["userId", "groupId"],
      });
    }
    const tickets = await Ticket.find({
      userId: userId,
      groupId: groupId,
    }).sort({ createdAt: -1 });
    res.status(200).json({
      tickets,
      count: tickets.length,
      userId: userId,
      groupId: groupId,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
export const getTicketById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    // Get ticketId from URL parameter
    const { ticketId } = req.params;
    // Validate required parameters
    if (!ticketId) {
      return res.status(400).json({
        message: "Missing required parameter: ticketId in URL",
      });
    }
    const ticket = await Ticket.findOne({
      _id: ticketId,
      userId: userId,
    });
    if (!ticket || !userId) {
      return res.status(404).json({
        message: "Ticket not found or you don't have access to this ticket",
      });
    }
    res.status(200).json({
      message: "Ticket retrieved successfully",
      ticket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({
        message:
          "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      });
    }
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Delete Ticket
export const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    // Validate required parameters
    const userId = req.user._id || req.user.id;
    if (!ticketId || !userId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["ticketId", "userId"],
      });
    }

    const deletedTicket = await Ticket.findOne({
      _id: ticketId,
      userId: userId,
    });

    if (!deletedTicket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or unauthorized" });
    }
    deletedTicket.event_status = "cancelled";
    await deletedTicket.save({ validateBeforeSave: false });
    res.status(200).json({
      message: "Ticket deleted successfully",
      ticket: deletedTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const deleteSubEvent = async (req, res) => {
  try {
    const { ticketId, subEventId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!ticketId || !subEventId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Find the parent ticket — do NOT delete it
    const parentTicket = await Ticket.findOne({ _id: ticketId, userId });
    if (!parentTicket) {
      return res.status(404).json({
        success: false,
        message: "Parent ticket not found or unauthorized",
      });
    }

    // Find the sub-event inside the parent
    const subEventIndex = parentTicket.sub_events.findIndex(
      (se) => se._id.toString() === subEventId
    );

    if (subEventIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Sub-event not found",
      });
    }

    // Soft-delete: mark sub-event as "deleted" — do NOT pull/remove it
    parentTicket.sub_events[subEventIndex].event_status = "remove";
    parentTicket.sub_events[subEventIndex].cancelled_at = new Date();
    parentTicket.sub_events[subEventIndex].cancelled_by = userId;
    parentTicket.sub_events[subEventIndex].cancellation_reason = "Deleted by host";

    parentTicket.markModified("sub_events");
    await parentTicket.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Sub-event deleted successfully",
      data: {
        ticketId,
        subEventId,
        event_name: parentTicket.sub_events[subEventIndex].event_name,
        event_status: "deleted",
      },
    });
  } catch (error) {
    console.error("Error deleting sub-event:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllDeletedEvents = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "Missing required parameter: userId" });
    }

    // Root tickets that are deleted/cancelled/remove
    const deletedRootTickets = await Ticket.find({
      event_status: { $in: ["cancelled", "deleted", "remove"] },
      userId,
    }).sort({ createdAt: -1 });

    // All tickets that might have deleted sub-events
    const allTickets = await Ticket.find({ userId }).sort({ createdAt: -1 });

    // Extract deleted sub-events from all tickets
    const deletedSubEvents = [];
    allTickets.forEach((ticket) => {
      (ticket.sub_events || []).forEach((se) => {
        if (["cancelled", "deleted", "remove"].includes(se.event_status)) {
          deletedSubEvents.push({
            // Spread sub-event fields
            _id: se._id,
            event_name: se.event_name,
            event_category: se.event_category,
            event_type: se.event_type,
            event_banner: se.event_banner,
            event_dates: se.event_dates,
            event_status: se.event_status,
            cancellation_reason: se.cancellation_reason,
            cancelled_at: se.cancelled_at,
            cancelled_by: se.cancelled_by,
            createdAt: se.createdAt || ticket.createdAt,
            isSubEvent: true,
            parentEventId: ticket._id,
            parentEventName: ticket.event_name,
          });
        }
      });
    });

    const allDeleted = [
      ...deletedRootTickets.map((t) => ({ ...t.toObject(), isSubEvent: false })),
      ...deletedSubEvents,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({
      message: allDeleted.length === 0
        ? "No deleted events found"
        : "Deleted events fetched successfully",
      deletedEvents: allDeleted,
      count: allDeleted.length,
    });
  } catch (error) {
    console.error("Error fetching deleted events:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const deleteAllEvents = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: "userId",
      });
    }
    const deletedEvents = await Ticket.deleteMany({
      event_status: "cancelled",
      userId: userId,
    });
    const deletedCount = deletedEvents.length;
    if (!deletedEvents || deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "All Tickets not found or empty tickets" });
    }
    res.status(200).json({
      message: "All Tickets deleted successfully",
      deletedEvents: deletedEvents,
      count: deletedEvents.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting tickets:", error);
  }
};

export const deleteEventPermenently = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id || req.user.id;
    const { isSubEvent, parentEventId, subEventId } = req.body;

    if (!ticketId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    if (isSubEvent && parentEventId) {
      const parentTicket = await Ticket.findOne({ _id: parentEventId, userId });
      if (!parentTicket) {
        return res.status(404).json({ success: false, message: "Parent ticket not found" });
      }

      const subIdx = parentTicket.sub_events.findIndex(
        (se) => se._id.toString() === ticketId.toString()
      );
      if (subIdx === -1) {
        return res.status(404).json({ success: false, message: "Sub-event not found" });
      }

      const subEventName = parentTicket.sub_events[subIdx].event_name;
      parentTicket.sub_events.splice(subIdx, 1); // Hard delete from array
      parentTicket.markModified("sub_events");
      await parentTicket.save({ validateBeforeSave: false });

      return res.status(200).json({
        success: true,
        message: `Sub-event "${subEventName}" permanently deleted`,
        ticketId,
      });
    }

    const deletedEvent = await Ticket.findOneAndDelete({
      _id: ticketId,
      userId,
      event_status: { $in: ["cancelled", "deleted", "remove"] },
    });

    if (deletedEvent) {
      return res.status(200).json({
        success: true,
        message: "Event permanently deleted successfully",
        ticketId,
      });
    }
    // (handles cases where isSubEvent flag was not sent correctly)
    const parentWithSubEvent = await Ticket.findOne({
      "sub_events._id": ticketId,
      userId,
    });

    if (parentWithSubEvent) {
      const subIdx = parentWithSubEvent.sub_events.findIndex(
        (se) => se._id.toString() === ticketId.toString()
      );
      if (subIdx !== -1) {
        const subEventName = parentWithSubEvent.sub_events[subIdx].event_name;
        parentWithSubEvent.sub_events.splice(subIdx, 1);
        parentWithSubEvent.markModified("sub_events");
        await parentWithSubEvent.save({ validateBeforeSave: false });
        return res.status(200).json({
          success: true,
          message: `Sub-event "${subEventName}" permanently deleted`,
          ticketId,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "Ticket not found, unauthorized, or not in a deleted state",
    });
  } catch (error) {
    console.error("Error permanent delete:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const getDeletedEventById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.eventId;
    const subEventId = req.query.subEventId || null; // optional query param

    if (!ticketId) {
      return res.status(400).json({ message: "Missing required parameter: eventId in URL" });
    }
    if (!userId) {
      return res.status(400).json({ message: "Missing required parameter: userId" });
    }

    // ── Case 1: Fetching a sub-event — ticketId is the PARENT ticket ID ──
    if (subEventId) {
      // Find the parent ticket (any status — it may be live/confirmed)
      const parentTicket = await Ticket.findOne({ _id: ticketId, userId });
      if (!parentTicket) {
        return res.status(404).json({
          message: "Parent ticket not found or you don't have access",
        });
      }

      const subEvent = parentTicket.sub_events?.find(
        (se) => se._id.toString() === subEventId
      );
      if (!subEvent) {
        return res.status(404).json({ message: "Sub-event not found in parent ticket" });
      }

      return res.status(200).json({
        message: "Deleted sub-event retrieved successfully",
        ticket: parentTicket, // return full parent so frontend can extract sub-event
        subEvent: subEvent,
        ticketId: ticketId,
        subEventId: subEventId,
        userId: userId,
      });
    }

    // ── Case 2: Fetching a root ticket ────────────────────────────────────
    const deletedEvent = await Ticket.findOne({
      _id: ticketId,
      userId: userId,
      event_status: { $in: ["cancelled", "deleted", "remove"] },
    });

    if (!deletedEvent) {
      return res.status(404).json({
        message: "Ticket not found or you don't have access to this ticket",
      });
    }

    return res.status(200).json({
      message: "Deleted ticket retrieved successfully",
      ticket: deletedEvent,
      ticketId: ticketId,
      userId: userId,
    });

  } catch (error) {
    console.error("Error fetching deleted event:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      });
    }
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const recoverDeletedEvent = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    if (!ticketId) {
      return res.status(400).json({
        message: "Missing required parameter: ticketId in URL",
      });
    }
    if (!userId) {
      return res.status(400).json({
        message: "Missing required parameter: userId",
      });
    }
    const recoveredTicket = await Ticket.findOneAndUpdate(
      {
        _id: ticketId,
        userId: userId,
        event_status: { $in: ["cancelled", "deleted", "remove"] },
      },
      { event_status: "pending" },
      { new: true }
    );
    if (!recoveredTicket) {
      return res.status(404).json({
        message: "Ticket not found, unauthorized, or not in a recoverable state",
      });
    }
    recoveredTicket.event_status = "pending";
    await recoveredTicket.save();
    // Send notification via RabbitMQ to notification-service
    try {
      await createNotification({
        userId: userId,
        type: 'event_recovered',
        title: 'Event Recovered Successfully',
        message: `Your event "${recoveredTicket.event_name}" has been Recovered`,
        ticketId: recoveredTicket._id,
        groupId: recoveredTicket.groupId?._id,
        eventName: recoveredTicket.event_name
      });
    } catch (notifError) {
      console.error('❌ Error creating notification:', notifError);
      // Don't fail the request if notification fails
    }
    res.status(200).json({
      message: "Ticket recovered successfully",
      ticket: recoveredTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error recovering deleted event:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      });
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const recoverSubEvent = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { parentTicketId, subEventId } = req.params;

    const parentTicket = await Ticket.findOne({ _id: parentTicketId });
    if (!parentTicket) {
      return res.status(404).json({ success: false, message: "Parent ticket not found" });
    }
    // Verify ownership
    if (parentTicket.userId?.toString() !== userId?.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }
    const subIdx = parentTicket.sub_events.findIndex(
      (se) => se._id.toString() === subEventId
    );
    if (subIdx === -1) {
      return res.status(404).json({ success: false, message: "Sub-event not found" });
    }
    const currentStatus = parentTicket.sub_events[subIdx].event_status;
    const recoverableStatuses = ["cancelled", "deleted", "remove", "removed"];

    if (!recoverableStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Sub-event cannot be recovered. Current status: ${currentStatus}`,
      });
    }

    // Restore to confirmed regardless of which deleted status it had
    parentTicket.sub_events[subIdx].event_status = "confirmed";
    parentTicket.sub_events[subIdx].cancellation_reason = undefined;
    parentTicket.sub_events[subIdx].cancelled_at = undefined;
    parentTicket.sub_events[subIdx].cancelled_by = undefined;
    parentTicket.markModified("sub_events");
    await parentTicket.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Sub-event recovered successfully",
      data: {
        subEventId,
        parentTicketId,
        event_name: parentTicket.sub_events[subIdx].event_name,
        event_status: "confirmed",
      },
    });
  } catch (error) {
    console.error("❌ recoverSubEvent error:", error);
    return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
export const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find({ status: "active" }).sort({
      createdAt: -1
    });
    res.status(200).json({
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllLiveEvents = async (req, res) => {
  try {
    const tickets = await Ticket.find({ event_status: "live" }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      });
    }
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

export const promoteFirstSubEventToMain = async (ticketId, cancelledByUserId, now) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found for promotion");

  // Find first ACTIVE sub-event (oldest _id = first created)
  const activeSubEvents = (ticket.sub_events || [])
    .filter((se) => !["cancelled", "completed", "deleted"].includes(se.event_status))
    .sort((a, b) => a._id.toString().localeCompare(b._id.toString()));

  if (activeSubEvents.length === 0) {
    return { promoted: false, newMain: null };
  }

  const newMainSubEvent = activeSubEvents[0];
  const newMainSubEventId = newMainSubEvent._id.toString();

  const promotedSubEventObj = newMainSubEvent.toObject
    ? newMainSubEvent.toObject()
    : { ...newMainSubEvent };

  // Remaining sub-events: exclude the promoted one
  // Update their main_ticket_id AFTER we know the new main's _id
  const remainingSubEventDocs = ticket.sub_events.filter(
    (se) => se._id.toString() !== newMainSubEventId
  );

  //  Create new main Ticket from promoted sub-event
  const newMainTicket = new Ticket({
    event_name: promotedSubEventObj.event_name,
    event_category: promotedSubEventObj.event_category,
    event_subcategory: promotedSubEventObj.event_subcategory,
    event_type: promotedSubEventObj.event_type,
    event_language: promotedSubEventObj.event_language || [],
    event_description: promotedSubEventObj.event_description,
    event_banner: promotedSubEventObj.event_banner,
    event_logo: promotedSubEventObj.event_logo,
    event_images: promotedSubEventObj.event_images || [],
    event_portrait: promotedSubEventObj.event_portrait,
    event_videos: promotedSubEventObj.event_videos || [],
    event_dates: promotedSubEventObj.event_dates,
    event_date_type: promotedSubEventObj.event_date_type || ticket.event_date_type,
    gate_open_time: promotedSubEventObj.gate_open_time,
    location: promotedSubEventObj.location,
    location_type: promotedSubEventObj.location_type || ticket.location_type,
    venue: promotedSubEventObj.venue,
    exact_map_location: promotedSubEventObj.exact_map_location,
    seating_arrangement: promotedSubEventObj.seating_arrangement || 'none',
    min_age_allowed: promotedSubEventObj.min_age_allowed ?? ticket.min_age_allowed ?? 0,
    max_age_allowed: promotedSubEventObj.max_age_allowed,
    kids_friendly: promotedSubEventObj.kids_friendly ?? false,
    pet_friendly: promotedSubEventObj.pet_friendly ?? false,
    attendance_count: promotedSubEventObj.attendance_count ?? false,
    restrict_booking: promotedSubEventObj.restrict_booking ?? false,
    payment_type: promotedSubEventObj.payment_type || ticket.payment_type,
    ticket_types: promotedSubEventObj.ticket_types || ticket.ticket_types || [],
    seating_layout: promotedSubEventObj.seating_layout || ticket.seating_layout,
    ticket_layout: promotedSubEventObj.ticket_layout || ticket.ticket_layout,
    banking_details: promotedSubEventObj.banking_details || ticket.banking_details || [],
    guests: promotedSubEventObj.guests || [],
    POCS: promotedSubEventObj.POCS || [],
    hashtag: promotedSubEventObj.hashtag || [],
    prohibited_items: promotedSubEventObj.prohibited_items || [],
    total_capacity: promotedSubEventObj.total_capacity,
    booking_start_date: promotedSubEventObj.booking_start_date,
    booking_end_date: promotedSubEventObj.booking_end_date,
    event_rules: promotedSubEventObj.event_rules,
    event_instagram_link: promotedSubEventObj.event_instagram_link,
    event_youtube_link: promotedSubEventObj.event_youtube_link,
    gst_applicable: promotedSubEventObj.gst_applicable,
    gst_registered_group: promotedSubEventObj.gst_registered_group,
    restrict_booking: promotedSubEventObj.restrict_booking,
    groupId: ticket.groupId,
    userId: ticket.userId,
    created_by: ticket.created_by,
    isMain: true,
    parentEventId: null,
    //  Inherit the original main's live/confirmed status
    event_status: ticket.event_status === "live" ? "live" : "confirmed",
    //  Remaining sub-events with updated main_ticket_id
    // We set main_ticket_id AFTER save since we need newMainTicket._id
    sub_events: remainingSubEventDocs.map((se) => ({
      ...(se.toObject ? se.toObject() : { ...se }),
      main_ticket_id: null, // temporary — updated below after save
    })),
    // ── Promotion metadata
    promoted_from_sub_event: true,
    promoted_at: now,
    original_main_event_id: ticket._id,
  });

  await newMainTicket.save();

  //  Now update main_ticket_id on all remaining sub-events
  // The new main's _id is now known after save
  if (newMainTicket.sub_events?.length > 0) {
    newMainTicket.sub_events = newMainTicket.sub_events.map((se) => ({
      ...(se.toObject ? se.toObject() : { ...se }),
      main_ticket_id: newMainTicket._id,
    }));
    newMainTicket.markModified("sub_events");
    await newMainTicket.save();
  }
  ticket.sub_events = [];
  ticket.promoted_to_ticket_id = newMainTicket._id;
  ticket.markModified("sub_events");
  await ticket.save();
  return {
    promoted: true,
    newMain: newMainTicket,
    newMainTicketId: newMainTicket._id.toString(),
    promotedSubEventId: newMainSubEventId,
    remainingSubEventCount: remainingSubEventDocs.length,
  };
};
// Helper: describe cancellation tier
export const getCancellationDescription = (tier) => {
  const descriptions = {
    full_refund: "Full refund — cancelled more than 48 hours before event",
    last_day: "90% refund — cancelled between 24–48 hours before event",
    event_day: "80% refund — cancelled within 24 hours of event",
    no_refund: "No refund — event has already started or passed",
  };
  return descriptions[tier] || "Refund policy applies";
};
// Runs every day at midnight
export const startAutoDeleteCron = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      // 1. Hard-delete root tickets that have been in deleted state > 30 days
      const deletedRootResult = await Ticket.deleteMany({
        event_status: { $in: ["cancelled", "deleted", "remove"] },
        updatedAt: { $lt: thirtyDaysAgo },
      });

      // 2. Pull sub-events from all tickets where sub-event was deleted > 30 days
      const allTickets = await Ticket.find({
        "sub_events.event_status": { $in: ["cancelled", "deleted", "remove"] },
      });

      let subEventsPurged = 0;
      for (const ticket of allTickets) {
        const before = ticket.sub_events.length;
        ticket.sub_events = ticket.sub_events.filter((se) => {
          if (!["cancelled", "deleted", "remove"].includes(se.event_status)) return true;
          const deletedAt = se.cancelled_at || se.updatedAt || ticket.updatedAt;
          return new Date(deletedAt) > thirtyDaysAgo; // keep if < 30 days old
        });
        if (ticket.sub_events.length !== before) {
          subEventsPurged += before - ticket.sub_events.length;
          ticket.markModified("sub_events");
          await ticket.save({ validateBeforeSave: false });
        }
      }
      console.log(
        `✅ Auto-delete complete: ${deletedRootResult.deletedCount} root tickets, ${subEventsPurged} sub-events purged`
      );
    } catch (err) {
      console.error("❌ Auto-delete cron error:", err.message);
    }
  });
};
// Freezes a cancelled ticket's lifecycle metrics into the TicketAudit table.
export const snapshotAndLockTicket = async (ticket, {
  cancelled_by,
  cancellation_reason = '',
  refund_percentage = 100,
  cancellation_tier = 'full_refund',
  total_refund_amount = 0,
} = {}) => {
  try {
    // Determine current lifecycle metrics (prefer new field, fall back to top-level)
    const metrics = ticket.lifecycle_metrics ?? {};
    const snapshot = {
      like: metrics.like ?? ticket.like ?? 0,
      share: metrics.share ?? ticket.share ?? 0,
      totalBookings: metrics.totalBookings ?? ticket.totalBookings ?? 0,
      totalTicketsSold: metrics.totalTicketsSold ?? ticket.totalTicketsSold ?? 0,
      revenue: metrics.revenue ?? ticket.revenue ?? 0,
      total_cancellation: metrics.total_cancellation ?? ticket.total_cancellation ?? 0,
      total_refund_amount,
    };

    const audit = new TicketAudit({
      original_ticket_id: ticket._id,
      userId: ticket.userId,
      groupId: ticket.groupId,
      version: ticket.version ?? 1,
      is_sub_event: false,
      event_structure: {
        event_name: ticket.event_name,
        event_category: ticket.event_category,
        event_subcategory: ticket.event_subcategory,
        event_type: ticket.event_type,
        event_description: ticket.event_description,
        event_banner: ticket.event_banner,
        event_logo: ticket.event_logo,
        location: ticket.location,
        location_type: ticket.location_type,
        venue: ticket.venue,
        payment_type: ticket.payment_type,
        event_dates: ticket.event_dates,
        ticket_types: ticket.ticket_types,
        gst_applicable: ticket.gst_applicable,
        restrict_booking: ticket.restrict_booking,
        sub_events_count: ticket.sub_events?.length ?? 0,
      },
      metrics_snapshot: snapshot,
      cancelled_at: ticket.cancelled_at || new Date(),
      cancelled_by: cancelled_by || ticket.cancelled_by,
      cancellation_reason,
      refund_percentage,
      cancellation_tier,
      is_locked: true,
    });

    await audit.save();

    // Lock the ticket so no metric updates can happen on the cancelled version
    ticket.is_locked = true;
    await ticket.save();

    console.log(`✅ Audit snapshot saved for ticket ${ticket._id} (v${ticket.version ?? 1})`);
    return audit;
  } catch (err) {
    // Non-fatal — audit failure must never block cancellation flow
    console.error(`⚠️ snapshotAndLockTicket failed for ${ticket._id}:`, err.message);
    return null;
  }
};
export const snapshotAndLockSubEvent = async (parentTicket, subEvent, {
  cancelled_by,
  cancellation_reason = '',
  refund_percentage = 100,
  cancellation_tier = 'full_refund',
  total_refund_amount = 0,
} = {}) => {
  try {
    const metrics = subEvent.lifecycle_metrics ?? {};
    const snapshot = {
      like: metrics.like ?? subEvent.like ?? 0,
      share: metrics.share ?? subEvent.share ?? 0,
      totalBookings: metrics.totalBookings ?? subEvent.totalBookings ?? 0,
      totalTicketsSold: metrics.totalTicketsSold ?? subEvent.totalTicketsSold ?? 0,
      revenue: metrics.revenue ?? subEvent.revenue ?? 0,
      total_cancellation: metrics.total_cancellation ?? subEvent.total_cancellation ?? 0,
      total_refund_amount,
    };

    const audit = new TicketAudit({
      original_ticket_id: parentTicket._id,
      parent_ticket_id: parentTicket._id,
      userId: parentTicket.userId ?? null,
      groupId: parentTicket.groupId ?? null,
      version: subEvent.version ?? 1,
      is_sub_event: true,
      sub_event_id: subEvent._id,
      event_structure: {
        event_name: subEvent.event_name || '',
        event_category: subEvent.event_category || parentTicket.event_category || '',
        event_subcategory: subEvent.event_subcategory || parentTicket.event_subcategory || '',
        event_type: subEvent.event_type || parentTicket.event_type || '',
        event_description: subEvent.event_description || parentTicket.event_description || '',
        event_banner: subEvent.event_banner || parentTicket.event_banner || '',
        event_logo: subEvent.event_logo || parentTicket.event_logo || '',
        location: subEvent.location || parentTicket.location || '',
        location_type: subEvent.location_type || parentTicket.location_type || '',
        venue: subEvent.venue || parentTicket.venue || '',
        payment_type: subEvent.payment_type || parentTicket.payment_type || '',
        event_dates: subEvent.event_dates || [],
        gst_applicable: subEvent.gst_applicable || parentTicket.gst_applicable || false,
        gst_percentage: subEvent.gst_percentage || parentTicket.gst_percentage || 0,
        gst_registered_group: subEvent.gst_registered_group || parentTicket.gst_registered_group || false,
        restrict_booking: subEvent.restrict_booking || parentTicket.restrict_booking || false,
        ticket_types: subEvent.ticket_types || parentTicket.ticket_types || [],
        sub_events_count: 0,
      },
      metrics_snapshot: snapshot,
      cancelled_at: subEvent.cancelled_at || new Date(),
      cancelled_by: cancelled_by || subEvent.cancelled_by || null,
      cancellation_reason,
      refund_percentage,
      cancellation_tier,
      is_locked: true,
    });

    await audit.save();
    console.log(`✅ Sub-event audit saved: ${subEvent._id} (parent: ${parentTicket._id})`);
    return audit;
  } catch (err) {
    console.error(`⚠️ snapshotAndLockSubEvent failed for ${subEvent._id}:`, err.message);
    console.error('   Detail:', err);
    return null;
  }
};
// Creates a brand-new V2 ticket from a cancelled V1's structure.
// Resets ALL lifecycle metrics to zero. Links audit trail.
export const rehostMainEventV2 = async (cancelledTicket, userId) => {
  const now = new Date();

  // Determine original_event_id: if cancelled ticket already has one, use it
  const originalEventId = cancelledTicket.original_event_id ?? cancelledTicket._id;

  const newTicket = new Ticket({
    // ── STRUCTURE (copied as-is) ──
    event_name: cancelledTicket.event_name,
    event_category: cancelledTicket.event_category,
    event_subcategory: cancelledTicket.event_subcategory,
    event_type: cancelledTicket.event_type,
    event_language: cancelledTicket.event_language || [],
    event_description: cancelledTicket.event_description,
    event_banner: cancelledTicket.event_banner,
    event_logo: cancelledTicket.event_logo,
    event_images: cancelledTicket.event_images || [],
    event_portrait: cancelledTicket.event_portrait,
    event_videos: cancelledTicket.event_videos || [],
    event_dates: cancelledTicket.event_dates,
    event_date_type: cancelledTicket.event_date_type,
    gate_open_time: cancelledTicket.gate_open_time,
    location: cancelledTicket.location,
    location_type: cancelledTicket.location_type,
    venue: cancelledTicket.venue,
    exact_map_location: cancelledTicket.exact_map_location,
    seating_arrangement: cancelledTicket.seating_arrangement || 'none',
    min_age_allowed: cancelledTicket.min_age_allowed ?? 0,
    max_age_allowed: cancelledTicket.max_age_allowed,
    kids_friendly: cancelledTicket.kids_friendly ?? false,
    pet_friendly: cancelledTicket.pet_friendly ?? false,
    attendance_count: cancelledTicket.attendance_count ?? false,
    restrict_booking: cancelledTicket.restrict_booking ?? false,
    payment_type: cancelledTicket.payment_type,
    ticket_types: cancelledTicket.ticket_types || [],
    seating_layout: cancelledTicket.seating_layout,
    ticket_layout: cancelledTicket.ticket_layout,
    banking_details: cancelledTicket.banking_details || [],
    guests: cancelledTicket.guests || [],
    POCS: cancelledTicket.POCS || [],
    hashtag: cancelledTicket.hashtag || [],
    prohibited_items: cancelledTicket.prohibited_items || [],
    total_capacity: cancelledTicket.total_capacity,
    booking_start_date: cancelledTicket.booking_start_date,
    booking_end_date: cancelledTicket.booking_end_date,
    event_rules: cancelledTicket.event_rules,
    gst_applicable: cancelledTicket.gst_applicable,
    gst_percentage: cancelledTicket.gst_percentage,
    gst_registered_group: cancelledTicket.gst_registered_group,
    restrict_booking: cancelledTicket.restrict_booking,
    event_instagram_link: cancelledTicket.event_instagram_link,
    event_youtube_link: cancelledTicket.event_youtube_link,
    groupId: cancelledTicket.groupId,
    userId: cancelledTicket.userId,
    created_by: cancelledTicket.created_by,

    // ── Copy sub-events structure only, reset their metrics too
    sub_events: (cancelledTicket.sub_events || [])
      .filter(se => !['cancelled', 'deleted', 'remove'].includes(se.event_status))
      .map(se => ({
        ...(se.toObject ? se.toObject() : { ...se }),
        _id: new mongoose.Types.ObjectId(), // fresh _id
        event_status: 'confirmed',
        // Reset sub-event metrics
        like: 0,
        share: 0,
        totalBookings: 0,
        totalTicketsSold: 0,
        revenue: 0,
        total_cancellation: 0,
        lifecycle_metrics: {
          like: 0, share: 0, totalBookings: 0,
          totalTicketsSold: 0, revenue: 0,
          total_cancellation: 0, total_refund_amount: 0,
        },
        audit_history: [], // fresh audit history for V2 sub-events
        version: 1,
        rehosted_from: se._id, // track where it came from
        cancellation_reason: '',
        cancelled_at: undefined,
        cancelled_by: undefined,
        rehosted_at: undefined,
      })),
    version: (cancelledTicket.version ?? 1) + 1,
    parent_event_id: cancelledTicket._id,          // points to cancelled V1
    original_event_id: originalEventId,              // always points to V1

    like: 0,
    share: 0,
    totalBookings: 0,
    totalTicketsSold: 0,
    revenue: 0,
    total_cancellation: 0,
    lifecycle_metrics: {
      like: 0, share: 0, totalBookings: 0,
      totalTicketsSold: 0, revenue: 0,
      total_cancellation: 0, total_refund_amount: 0,
    },

    event_status: 'confirmed',
    is_locked: false,
    isMain: true,
    rehosted_at: now,

    cancellation_reason: '',
    cancelled_at: undefined,
    cancelled_by: undefined,
    promoted_to_ticket_id: undefined,

    form_progress: cancelledTicket.form_progress,
    terms_accepted: cancelledTicket.terms_accepted,
    terms_accepted_at: cancelledTicket.terms_accepted_at,
    company_terms_version: cancelledTicket.company_terms_version,
  });

  await newTicket.save();

  // Update audit record to link new ticket
  await TicketAudit.updateOne(
    { original_ticket_id: cancelledTicket._id, version: cancelledTicket.version ?? 1 },
    { $set: { rehosted_ticket_id: newTicket._id } }
  );
  console.log(`✅ V${newTicket.version} ticket created: ${newTicket._id} (from cancelled ${cancelledTicket._id})`);
  return newTicket;
};

// Scan QR and mark attendance
export const markAttendance = async ({ ticketId, subEventId = null, qrData, scannedBy }) => {
  const qrResult = await verifyBookingQR(qrData);
  if (!qrResult.success) {
    throw new Error(qrResult.error || 'Invalid QR code');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Event not found');

  // Check if already scanned
  const existing = await Attendance.findOne({
    ticketId,
    ...(subEventId ? { subEventId } : {}),
    'attendees.bookingId': qrResult.externalId || qrResult.bookingId,
  });
  if (existing) throw new Error('This ticket has already been scanned');
  // Decode the QR payload to enrich the attendance record with full ticket details
  let decodedPayload = null;
  try {
    const raw = Buffer.from(qrData, 'base64').toString('utf-8');
    if (raw.startsWith('{')) decodedPayload = JSON.parse(raw);
  } catch { /* legacy QR — fall back to gRPC fields */ }

  const attendeeRecord = {
    bookingId: qrResult.externalId || qrResult.bookingId,
    userId: qrResult.userId,
    userName: qrResult.userName || decodedPayload?.holderName || '',
    userEmail: qrResult.userEmail,
    userPhone: qrResult.userPhone,
    ticketType: qrResult.ticketType || decodedPayload?.ticketType || '',
    quantity: qrResult.quantity ?? decodedPayload?.quantity ?? 1,
    paymentMethod: qrResult.paymentMethod || decodedPayload?.paymentMethod || '',
    transactionId: qrResult.externalId || qrResult.bookingId,
    // Full ticket detail fields from QR payload
    eventName: decodedPayload?.eventName || '',
    eventDate: decodedPayload?.eventDate || '',
    eventTime: decodedPayload?.eventTime || '',
    venue: decodedPayload?.venue || '',
    totalAmount: decodedPayload?.totalAmount ?? 0,
    holderName: decodedPayload?.holderName || qrResult.userName || '',
    scannedAt: new Date(),
    scannedBy,
    status: 'present',
    qrData,
    subEventId: subEventId || null,
  };

  const attendance = await Attendance.findOneAndUpdate(
    { ticketId, subEventId: subEventId || null },
    {
      $push: { attendees: attendeeRecord },
      $inc: { totalPresent: 1 },
      $setOnInsert: {
        eventName: subEventId
          ? ticket.sub_events?.find(s => s._id.toString() === subEventId)?.event_name
          : ticket.event_name,
        totalBooked: 0,
        startedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return { attendance, scannedAttendee: attendeeRecord };
};

// Get attendance list
export const getAttendance = async (ticketId, subEventId = null) => {
  const attendance = await Attendance.findOne({
    ticketId,
    subEventId: subEventId || null,
  });
  return attendance;
};

// Initialize attendance session
export const initAttendance = async (ticketId, subEventId = null) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error('Event not found');

  // Count total confirmed bookings (approximated via lifecycle_metrics)
  const totalBooked = subEventId
    ? (ticket.sub_events?.find(s => s._id.toString() === subEventId)?.totalBookings || 0)
    : (ticket.totalBookings || 0);

  const attendance = await Attendance.findOneAndUpdate(
    { ticketId, subEventId: subEventId || null },
    {
      $setOnInsert: {
        eventName: subEventId
          ? ticket.sub_events?.find(s => s._id.toString() === subEventId)?.event_name
          : ticket.event_name,
        totalBooked,
        totalPresent: 0,
        attendees: [],
        startedAt: new Date(),
        isCompleted: false,
      },
    },
    { new: true, upsert: true }
  );
  return attendance;
};
