import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
import upload from "../middlewares/upload.js";
import { uploadTicketMedia, uploadFields } from "../middlewares/upload.js";
import {
  processFileUploads,
  deleteFromCloudinary,
  processGroupFileUploads,
} from "../utils/cloudinaryHelper.js";
import { createNotification } from '../utils/notificationHelper.js';
import multer from "multer";
import { sendRPC } from "../rabbit/producer.js";
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
    const userData = await sendRPC("get-user", { userId });
    if (userData?.error) {
      return res.status(500).json({ 
        message: "Error fetching user data", 
        error: userData.error 
      });
    }
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User retrieved successfully",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    const userData = await sendRPC("get-user", userId);
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
      if (organisation_type.toLowerCase() !== "educational") {
        if (!gst_no) {
          return res.status(400).json({
            message: "GST number is required for non-educational organisations",
          });
        }
        if (!filePaths.bank_check) {
          return res.status(400).json({
            message:
              "Bank check document is required for non-educational organisations",
          });
        }
        if (!filePaths.company_logo) {
          return res.status(400).json({
            message:
              "Company logo is required for non-educational organisations",
          });
        }
      }
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

    // Process new file uploads to Cloudinary
    let uploadedFiles = {};
    const filesToDelete = []; // Track old files to delete from Cloudinary

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
        if (
          uploadedFiles.company_certificate &&
          existingGroup.company_certificate
        ) {
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
        if (
          email &&
          duplicateGroup.email.toLowerCase() === email.toLowerCase()
        ) {
          duplicateFields.push("email");
        }
        if (contact_no && duplicateGroup.contact_no === contact_no) {
          duplicateFields.push("contact number");
        }
        if (gst_no && duplicateGroup.gst_no === gst_no) {
          duplicateFields.push("GST number");
        }

        return res.status(409).json({
          message: `Another group with the same ${duplicateFields.join(
            ", "
          )} already exists`,
          duplicateFields: duplicateFields,
          existingGroupId: duplicateGroup._id,
        });
      }
    }

    // Build update data object
    const updateData = {};

    // Update basic fields if provided
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (contact_no) updateData.contact_no = contact_no;
    if (pan_no) updateData.pan_no = pan_no;

    // Organisation-specific fields
    if (existingGroup.grp_type === "organisation") {
      if (address) updateData.address = address;
      if (organisation_type) updateData.organisation_type = organisation_type;
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
        updateData.bank_check_type = getFileType(
          req.files.bank_check[0].mimetype
        );
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
      const finalOrgType = organisation_type || existingGroup.organisation_type;

      if (finalOrgType && finalOrgType.toLowerCase() !== "educational") {
        // Check if required fields are present (either in update or existing data)
        const finalGst = gst_no !== undefined ? gst_no : existingGroup.gst_no;
        const finalBankCheck = uploadedFiles.bank_check || existingGroup.bank_check;
        const finalLogo = uploadedFiles.company_logo || existingGroup.company_logo;

        const missingFields = [];
        
        // Only validate if the fields are truly missing (empty string or null/undefined)
        if (!finalGst || (typeof finalGst === 'string' && finalGst.trim() === '')) {
          missingFields.push("gst_no");
        }
        if (!finalBankCheck || (typeof finalBankCheck === 'string' && finalBankCheck.trim() === '')) {
          missingFields.push("bank_check file");
        }
        if (!finalLogo || (typeof finalLogo === 'string' && finalLogo.trim() === '')) {
          missingFields.push("company_logo file");
        }

        if (missingFields.length > 0) {
          return res.status(400).json({
            message: `Non-educational organisations require: ${missingFields.join(
              ", "
            )}`,
            missingFields: missingFields,
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
export const createTicketBasicInfo = async (req, res) => {
  try {
    const guestProfileFiles = {};
    const eventRulesFiles = [];
    const videoFiles = {};
    const previewImageFiles = {};
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
      guests, // This will contain guest data as JSON string
      POCS,
      event_description,
      groupId: bodyGroupId,
    } = req.body;
    // Get uploaded file
    const uploadedFiles = await processFileUploads(req.files || {});
    // Handle multiple guest profile uploads and event rules
    Object.keys(uploadedFiles).forEach((fieldName) => {
      if (fieldName.startsWith("guest_profile_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const fileData = uploadedFiles[fieldName];
          console.log(
            `Processing guest_profile_${index}:`,
            typeof fileData,
            Array.isArray(fileData)
          );
          if (typeof fileData === "string") {
            guestProfileFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            guestProfileFiles[parseInt(index)] = fileData[0];
          } else if (
            fileData &&
            typeof fileData === "object" &&
            fileData.path
          ) {
            guestProfileFiles[parseInt(index)] = fileData;
          }

          console.log(
            `✅ Guest profile ${index} stored:`,
            guestProfileFiles[parseInt(index)]?.path
          );
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

      // Handle preview images
      if (fieldName.startsWith("preview_image_")) {
        const parts = fieldName.split("_");
        const index = parts[2]; // Get index from preview_image_X
        if (!isNaN(index)) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            previewImageFiles[index] = fileData[0];
          }
        }
      }
    });
    // Get IDs
    const groupId = req.params.groupId || bodyGroupId;
    const ticketId = req.params.ticketId;
    const userId = req.user?._id || req.user?.id;
    if (!groupId || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message:
          "Invalid group ID format. Please provide a valid MongoDB ObjectId.",
        groupId: groupId,
      });
    }
    // Helper function to validate date format and check if it's not in the past
    const validateDate = (dateString, fieldName) => {
      if (!dateString) return false;

      // Check if date is in YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
      }

      const date = new Date(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      // Check if date is valid
      if (isNaN(date.getTime())) {
        throw new Error(`${fieldName} is not a valid date`);
      }

      // Check if date is not in the past
      if (date < today) {
        throw new Error(`${fieldName} cannot be a past date`);
      }

      return true;
    };

    // Helper function to validate time format
    const validateTime = (timeString, fieldName) => {
      if (!timeString) return true; // Time is optional

      // Check if time is in HH:MM format (24-hour)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(timeString)) {
        throw new Error(`${fieldName} must be in HH:MM format (24-hour)`);
      }

      return true;
    };

    // Process event dates with validation - FIXED for multipart/form-data
    let totalEventDates = [];
    if (event_dates) {
      let eventDatesArray;

      // In multipart/form-data, everything comes as string, so we need to parse it
      if (typeof event_dates === "string") {
        try {
          // Clean the string first (remove any extra whitespace, newlines)
          const cleanedEventDates = event_dates.trim();
          eventDatesArray = JSON.parse(cleanedEventDates);

          // Ensure it's an array after parsing
          if (!Array.isArray(eventDatesArray)) {
            return res.status(400).json({
              message: "event_dates must be an array of date objects",
            });
          }
        } catch (error) {
          return res.status(400).json({
            message:
              "Invalid event_dates format. Must be valid JSON array string in multipart form.",
            error: error.message,
            received: typeof event_dates,
            sample_format:
              '[{"start_date":"2025-07-15","end_date":"2025-07-17","start_time":"18:00","end_time":"23:00"}]',
          });
        }
      } else if (Array.isArray(event_dates)) {
        eventDatesArray = event_dates;
      } else {
        return res.status(400).json({
          message:
            "event_dates must be a JSON array string (for multipart form) or array",
          received: typeof event_dates,
        });
      }

      // Validate array is not empty
      if (!eventDatesArray || eventDatesArray.length === 0) {
        return res.status(400).json({
          message: "event_dates array cannot be empty",
        });
      }

      // Validate based on event_date_type
      if (event_date_type === "one-day" && eventDatesArray.length > 1) {
        return res.status(400).json({
          message: "One-day events can only have one date entry",
        });
      }

      try {
        totalEventDates = eventDatesArray.map((eventDate, index) => {
          // Ensure eventDate is an object
          if (typeof eventDate !== "object" || eventDate === null) {
            throw new Error(`Event date entry ${index + 1} must be an object`);
          }

          const {
            start_date,
            end_date,
            start_time,
            end_time,
            eventLink, // From OnlineDatePickerModal
            event_link, // Alternative field name
            videoLink, // From RecordedDatePickerModal (legacy)
            video_name, // From RecordedDatePickerModal
            videoName, // Alternative field name
            verificationCode, // From both modals
            verification_event_code, // Alternative field name
          } = eventDate;

          // Determine the actual event link from various possible field names
          const actualEventLink = event_link || eventLink || videoLink || "";
          const actualVideoName = video_name || videoName || "";
          const actualVerificationCode =
            verification_event_code || verificationCode || "";

          // Validate event_link for online/recorded events
          if (
            (location_type === "online" || location_type === "recorded") &&
            !actualEventLink
          ) {
            throw new Error(
              `Event date entry ${
                index + 1
              }: event_link is required for online/recorded events`
            );
          }

          // Validate required start_date
          if (!start_date) {
            throw new Error(
              `Event date entry ${index + 1}: start_date is required`
            );
          }

          // Validate start_date
          validateDate(start_date, `Event date entry ${index + 1}: start_date`);

          // Validate end_date if provided, otherwise set to start_date
          let validatedEndDate = start_date;
          if (end_date) {
            validateDate(end_date, `Event date entry ${index + 1}: end_date`);

            if (new Date(end_date) < new Date(start_date)) {
              throw new Error(
                `Event date entry ${
                  index + 1
                }: end_date cannot be before start_date`
              );
            }
            validatedEndDate = end_date;
          }

          // Validate times if provided
          if (start_time) {
            validateTime(
              start_time,
              `Event date entry ${index + 1}: start_time`
            );
          }
          if (end_time) {
            validateTime(end_time, `Event date entry ${index + 1}: end_time`);
          }

          // Validate time logic
          if (start_time && end_time) {
            const startTimeMinutes = start_time
              .split(":")
              .reduce((acc, time) => 60 * acc + +time, 0);
            const endTimeMinutes = end_time
              .split(":")
              .reduce((acc, time) => 60 * acc + +time, 0);

            if (
              start_date === validatedEndDate &&
              endTimeMinutes <= startTimeMinutes
            ) {
              throw new Error(
                `Event date entry ${
                  index + 1
                }: end_time must be after start_time for same-day events`
              );
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
          // Only add time fields if they have values
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
    const normalizeString = (str) => {
      if (!str) return "";
      return str.toLowerCase().trim().replace(/\s+/g, " ");
    };

    // Helper function to create date ranges for comparison
    const createDateRanges = (dates) => {
      return dates.map((date) => ({
        start: new Date(`${date.start_date}T${date.start_time || "00:00"}:00`),
        end: new Date(`${date.end_date}T${date.end_time || "23:59"}:00`),
        date_string: `${date.start_date}_${date.end_date}_${date.start_time}_${date.end_time}`,
      }));
    };

    // Helper function to check if date ranges overlap
    const doDateRangesOverlap = (range1, range2) => {
      return range1.start <= range2.end && range2.start <= range1.end;
    };
    const normalizedEventName = normalizeString(event_name);
    const normalizedLocation = normalizeString(location);
    const normalizedVenue = normalizeString(venue);
    const currentEventDateRanges = createDateRanges(totalEventDates);
    let duplicateCheckQuery = {
      userId: userId,
      event_status: { $ne: "cancelled" },
      event_name: {
        $regex: new RegExp(
          `^${normalizedEventName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
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
                $regex: new RegExp(
                  `^${normalizedLocation.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  )}$`,
                  "i"
                ),
              },
            },
            {
              venue: {
                $regex: new RegExp(
                  `^${normalizedVenue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                  "i"
                ),
              },
            },
          ],
        },
        {
          venue: {
            $regex: new RegExp(
              `^${normalizedVenue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
              "i"
            ),
          },
        },
      ];
    } else if (location_type === "online" || location_type === "recorded") {
      // For online/recorded events: check event links within event_dates
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
    const existingEvents = await Ticket.find(duplicateCheckQuery).lean();
    const conflictingEvents = [];
    for (const existingEvent of existingEvents) {
      if (!existingEvent.event_dates || existingEvent.event_dates.length === 0)
        continue;
      const existingEventDateRanges = createDateRanges(
        existingEvent.event_dates
      );
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
              : existingEvent.event_dates
                  ?.map((date) => date.event_link)
                  .filter((link) => link)
                  .join(", ") || "No link provided",
          dates: existingEvent.event_dates,
          createdAt: existingEvent.created_at,
        });
      }
    }
    if (conflictingEvents.length > 0) {
      return res.status(409).json({
        message: "Duplicate event detected",
        error:
          "An event with the same name, location, and overlapping date/time already exists",
        conflictDetails: {
          attempted: {
            eventName: event_name,
            location:
              location_type === "offline"
                ? `${location} - ${venue}`
                : totalEventDates
                    .map((date) => date.event_link)
                    .filter((link) => link)
                    .join(", ") || "No link provided",
            dates: totalEventDates,
            locationType: location_type,
          },
          existing: conflictingEvents,
          suggestion:
            "Please check your existing events or modify the event name, location, or schedule to avoid conflicts.",
        },
      });
    }
    // Check for internal date conflicts within the current request
    const internalConflicts = [];
    for (let i = 0; i < currentEventDateRanges.length; i++) {
      for (let j = i + 1; j < currentEventDateRanges.length; j++) {
        if (
          doDateRangesOverlap(
            currentEventDateRanges[i],
            currentEventDateRanges[j]
          )
        ) {
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
    const baseRequiredFields = [
      { key: "event_name", value: event_name },
      { key: "event_category", value: event_category },
      { key: "event_subcategory", value: event_subcategory },
      { key: "event_type", value: event_type },
      { key: "event_language", value: event_language },
      { key: "location_type", value: location_type },
      { key: "event_date_type", value: event_date_type },
      { key: "event_dates", value: event_dates },
      { key: "event_description", value: event_description },
      { key: "groupId", value: groupId },
      { key: "min_age_allowed", value: min_age_allowed },
      { key: "userId", value: userId },
    ];

    // Location-type specific required fields
    let locationSpecificRequiredFields = [];

    if (location_type === "offline") {
      locationSpecificRequiredFields = [
        { key: "seating_arrangement", value: seating_arrangement },
        { key: "location", value: location },
        { key: "venue", value: venue },
        { key: "exact_map_location", value: exact_map_location },
      ];
    }
    // Validate that the group exists and user has permission
    const group = await Group.findOne({ _id: groupId, userId: userId });
    if (!group) {
      return res.status(404).json({
        message:
          "Group not found or you don't have permission to create events for this group",
      });
    }
    // Check all required fields for ticket creation
    const allRequiredFields = [
      ...baseRequiredFields,
      ...locationSpecificRequiredFields,
    ];
    const missingTicketFields = allRequiredFields
      .filter(
        (field) =>
          !field.value ||
          (typeof field.value === "string" && field.value.trim() === "")
      )
      .map((field) => field.key);

    if (missingTicketFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingTicketFields.join(", ")}`,
        missingFields: missingTicketFields,
      });
    }
    // Validation: Enum fields
    const validEventTypes = ["private", "public"];
    if (event_type && !validEventTypes.includes(event_type)) {
      return res.status(400).json({
        message: "Invalid event_type",
        provided: event_type,
        validOptions: validEventTypes,
      });
    }

    const validLanguages = [
      "English",
      "Hindi",
      "Malayalam",
      "Tamil",
      "Kannada",
      "Telugu",
      "Marathi",
      "Gujarati",
      "Punjabi",
      "Urdu",
      "Bengali",
      "Spanish",
      "French",
      "German",
      "Chinese",
      "Japanese",
      "Russian",
      "Turkish",
      "Korean",
      "Portuguese",
      "Arabic",
      "Indonesian",
      "Vietnamese",
      "Other",
    ];
    let languageArray = [];
    if (Array.isArray(event_language)) {
      languageArray = event_language;
    } else if (typeof event_language === "string") {
      try {
        const parsed = JSON.parse(event_language);
        languageArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        languageArray = event_language
          .split(",")
          .map((lang) => lang.trim())
          .filter(Boolean);
      }
    }
    if (languageArray.length > 0) {
      const invalidLanguages = languageArray.filter(
        (lang) => !validLanguages.includes(lang)
      );
      if (invalidLanguages.length > 0) {
        return res.status(400).json({
          message: "Invalid event_language(s)",
          provided: invalidLanguages,
          validOptions: validLanguages,
        });
      }
    }
    const validLocationTypes = ["offline", "online", "recorded"];
    if (!validLocationTypes.includes(location_type)) {
      return res.status(400).json({
        message: "Invalid location_type",
        provided: location_type,
        validOptions: validLocationTypes,
      });
    }

    // Validate seating_arrangement only for offline events
    if (location_type === "offline") {
      const validSeatingArrangements = [
        "seated",
        "standing",
        "seated and standing",
        "other",
      ];
      if (
        seating_arrangement &&
        !validSeatingArrangements.includes(seating_arrangement)
      ) {
        return res.status(400).json({
          message: "Invalid seating_arrangement",
          provided: seating_arrangement,
          validOptions: validSeatingArrangements,
        });
      }
    }

    const validDateTypes = ["one-day", "multi-day", "weekly"];
    if (!validDateTypes.includes(event_date_type)) {
      return res.status(400).json({
        message: "Invalid event_date_type",
        provided: event_date_type,
        validOptions: validDateTypes,
      });
    }

    const ageNum = Number(min_age_allowed);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 100) {
      return res.status(400).json({
        message: "Minimum age allowed must be between 0 and 100",
      });
    }
    let ageMax;
    if (max_age_allowed && String(max_age_allowed).trim() !== "") {
      const parsedAgeMax = Number(max_age_allowed);
      if (isNaN(parsedAgeMax) || parsedAgeMax < 0 || parsedAgeMax > 100) {
        return res.status(400).json({
          message: "Maximum age allowed must be between 0 and 100 if provided",
        });
      }
      if (parsedAgeMax < ageNum) {
        return res.status(400).json({
          message:
            "Maximum age allowed cannot be less than minimum age allowed",
        });
      }
      ageMax = parsedAgeMax;
    }
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    for (const [index, file] of Object.entries(guestProfileFiles)) {
      if (!file.path || !file.originalName) {
        return res.status(400).json({
          message: `Guest profile ${index} upload failed or is invalid`,
        });
      }
    }
    if (eventRulesFiles.length > 0) {
      const rulesFile = eventRulesFiles[0];
      if (!rulesFile.path || !rulesFile.originalName) {
        return res.status(400).json({
          message: "Event rules file upload failed or is invalid",
        });
      }
    }
    // Process exact_map_location only for offline events
    let mapLocation = {};
    if (location_type === "offline" && exact_map_location) {
      try {
        mapLocation =
          typeof exact_map_location === "string"
            ? JSON.parse(exact_map_location)
            : exact_map_location;
      } catch {
        mapLocation = {};
      }
    }
    let processedGuests = [];
    if (guests) {
      const guestsArray = parseJSONSafely(guests, []);
      if (guestsArray.length > 10) {
        return res.status(400).json({
          message: "Maximum 10 guests allowed",
        });
      }
      console.log(
        `Processing ${guestsArray.length} guests with profile files:`,
        Object.keys(guestProfileFiles)
      );
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

        // Add uploaded profile image Cloudinary URL if available
        if (guestProfileFiles[index] && guestProfileFiles[index].path) {
          guestData.guest_profile = guestProfileFiles[index].path; // Cloudinary URL
          console.log(
            `✅ Guest ${index} profile set:`,
            guestData.guest_profile
          );
        } else {
          console.log(`⚠️ No profile file for guest ${index}`);
        }

        return guestData;
      });
      console.log(
        `Processed ${processedGuests.length} guests:`,
        processedGuests.map((g) => ({
          name: g.guest_name,
          has_profile: !!g.guest_profile,
        }))
      );
    }

    // Create ticket data object with location-type specific fields
    let ticket;
    const ticketData = {
      event_name: event_name.trim(),
      event_category: event_category.trim(),
      event_subcategory: event_subcategory?.trim() || "",
      event_type: event_type || "public",
      event_language: languageArray,
      min_age_allowed: ageNum,
      max_age_allowed: ageMax,
      kids_friendly: Boolean(
        kids_friendly === "true" || kids_friendly === true
      ),
      pet_friendly: Boolean(pet_friendly === "true" || pet_friendly === true),

      // Location
      location_type: location_type,

      // Date and Time - FIXED: Properly assign the processed dates
      event_date_type,
      event_dates: totalEventDates, // This now contains properly validated dates

      // Social Media and Rules
      event_instagram_link: event_instagram_link?.trim() || "",
      event_youtube_link: event_youtube_link?.trim() || "",
      hashtag: parseJSONSafely(hashtag, []),
      event_description: event_description.trim(),

      // Guests and Contacts with profile images
      guests: processedGuests,
      POCS: parseJSONSafely(POCS, []),

      // System fields
      groupId,
      userId,
      event_status: "pending",
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),

      // Form progress
      form_progress: {
        basic_info: true,
        media: false,
        pricing: false,
        additional_info: false,
      },
    };
    const processedProhibitedItems = (() => {
      const rawItems = prohibited_items;

      if (!rawItems) return [];

      if (Array.isArray(rawItems)) {
        return rawItems
          .map((item) => String(item).trim())
          .filter((item) => item !== "");
      }

      if (typeof rawItems === "string") {
        const trimmed = rawItems.trim();

        if (trimmed === "" || trimmed === "[]" || trimmed === "{}") {
          return [];
        }

        try {
          const parsed = JSON.parse(trimmed);

          if (Array.isArray(parsed)) {
            return parsed
              .map((item) => String(item).trim())
              .filter((item) => item !== "");
          } else if (typeof parsed === "object" && parsed !== null) {
            return Object.values(parsed)
              .map((item) => String(item).trim())
              .filter((item) => item !== "");
          } else {
            return [String(parsed).trim()].filter((item) => item !== "");
          }
        } catch (e) {
          console.log("Failed to parse prohibited_items:", e.message);
          if (trimmed.includes(",")) {
            return trimmed
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item !== "");
          }
          return [];
        }
      }

      if (typeof rawItems === "object" && rawItems !== null) {
        return Object.values(rawItems)
          .map((item) => String(item).trim())
          .filter((item) => item !== "");
      }
      return [];
    })();
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
    // Handle event rules (text or file)
    if (eventRulesFiles.length > 0) {
      const rulesFile = eventRulesFiles[0];
      ticketData.event_rules = {
        type: "file",
        path: rulesFile.path, // Cloudinary URL
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
        content: event_rules_text.trim(),
        uploadedAt: new Date(),
      };
    }
    // Create and save ticket
    if (ticketId) {
      ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }
      // Verify ownership
      if (ticket.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          message: "You don't have permission to update this ticket",
        });
      }
      // Update ticket fields
      Object.assign(ticket, ticketData);
      ticket.updated_by = userId;
      ticket.updated_at = new Date();
      await ticket.save();
      const responseMessage = "Event updated successfully";
    } else {
      // CREATE new ticket
      ticket = new Ticket(ticketData);
      await ticket.save();
      var responseMessage = "Event created successfully";
    }

    // Success response with location-type specific information
    const responseData = {
      message: "Event created successfully",
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
      eventDates: totalEventDates, // Include the processed dates in response
      duplicationCheck: "Passed - No conflicts found",
    };

    // Add location-specific response information
    if (location_type === "offline") {
      responseData.offline_fields = {
        seating_arrangement: ticket.seating_arrangement,
        location: ticket.location,
        venue: ticket.venue,
        has_map_location:
          Object.keys(ticket.exact_map_location || {}).length > 0,
      };
    } else if (location_type === "online" || location_type === "recorded") {
      responseData.online_fields = {
        event_links: totalEventDates
          .map((date) => date.event_link)
          .filter((link) => !!link), // array of links
        verification_codes: totalEventDates
          .map((date) => date.verification_event_code)
          .filter((code) => !!code),
      };
    }
    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error creating event:", error);
    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum 10MB allowed per file.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message:
          "Too many files uploaded. Maximum limits: 10 guest profiles, 1 event rules file.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message:
          "Unexpected file field. Only 'guest_profile_0' to 'guest_profile_9' and 'event_rules' are allowed.",
      });
    }
    // Handle file type errors
    if (
      error.message &&
      (error.message.includes("Guest profile") ||
        error.message.includes("Event rules file must be a document") ||
        error.message.includes(
          "Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed"
        ))
    ) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message,
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
    // Handle duplicate key errors from MongoDB level
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Event with similar details already exists at database level",
      });
    }
    // Cleanup: Delete uploaded Cloudinary files if database operation fails
    try {
      const filesToDelete = [];
      // Collect all uploaded file public_ids
      Object.values(guestProfileFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });
      eventRulesFiles.forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });
      Object.values(videoFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });
      Object.values(previewImageFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });
      // Delete files from Cloudinary
      for (const publicId of filesToDelete) {
        await deleteFromCloudinary(publicId);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up Cloudinary files:", cleanupError);
    }
    // Cleanup: Delete uploaded Cloudinary files if database operation fails
    try {
      const filesToDelete = [];

      // Collect all uploaded file public_ids
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

      // Delete files from Cloudinary
      if (filesToDelete.length > 0) {
        console.log(
          `Cleaning up ${filesToDelete.length} uploaded files due to error...`
        );
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
    // Generic error response
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const updateTicketMedia = async (req, res) => {
  try {
    // Enhanced logging for debugging
    console.log("🚀 Starting ticket media update process...");
    console.log("📋 Request params:", req.params);
    console.log("👤 User info:", {
      role: req.user?.role,
      organisation_type: req.user?.organisation_type,
      id: req.user?._id || req.user?.id,
    });

    // Handle file upload with multer
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
    console.log("☁️ Uploading files to Cloudinary...");
    const uploadedFiles = await processFileUploads(req.files || {});
    console.log("✅ Cloudinary upload completed:", {
      files: Object.keys(uploadedFiles),
      event_logo: uploadedFiles.event_logo,
      event_banner: uploadedFiles.event_banner,
      college_authorisation: uploadedFiles.college_authorisation,
    });
    // Extract URLs directly - these are already complete Cloudinary URLs
    const eventLogoUrl = uploadedFiles.event_logo || null;
    const eventBannerUrl = uploadedFiles.event_banner || null;
    const collegeAuthorisationUrl = uploadedFiles.college_authorisation || null;
    const event_images = uploadedFiles.event_images || [];
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
    } else {
      console.log("👤 User role is not organization:", userRole);
    }

    // Check if any new media files were uploaded
    const hasNewMediaFiles =
      !!eventLogoUrl || !!eventBannerUrl || event_images.length > 0;
    const hasNewCollegeAuth = !!collegeAuthorisationUrl;

    if (!hasNewMediaFiles && !hasNewCollegeAuth) {
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
    const updateData = {
      "form_progress.media": true,
      updated_by: userId,
      updated_at: new Date(),
    };

    // Process uploaded files - Use the URLs directly
    if (eventLogoUrl) {
      updateData.event_logo = eventLogoUrl;
      console.log("✅ Event logo will be updated to:", eventLogoUrl);
    }

    if (eventBannerUrl) {
      updateData.event_banner = eventBannerUrl;
      console.log("✅ Event banner will be updated to:", eventBannerUrl);
    }

    // Process event_images with append logic
    if (event_images.length > 0) {
      // Fetch existing ticket to get current event_images
      const existingTicket = await Ticket.findById(ticketId);
      const existingImages = existingTicket?.event_images || [];

      // Check total count (existing + new)
      const totalImageCount = existingImages.length + event_images.length;
      if (totalImageCount > 10) {
        // Cleanup uploaded files before returning error
        const filesToDelete = [];
        if (eventLogoUrl) filesToDelete.push(eventLogoUrl);
        if (eventBannerUrl) filesToDelete.push(eventBannerUrl);
        if (collegeAuthorisationUrl)
          filesToDelete.push(collegeAuthorisationUrl);
        event_images.forEach((img) => filesToDelete.push(img.path));

        await Promise.all(
          filesToDelete.map((url) =>
            deleteFromCloudinary(url).catch((err) =>
              console.error("Cleanup error:", err.message)
            )
          )
        );

        return res.status(400).json({
          message: `Cannot add ${event_images.length} new files. Maximum 10 files allowed (currently have ${existingImages.length})`,
          uploaded_count: event_images.length,
          existing_count: existingImages.length,
          max_allowed: 10,
        });
      }

      // Validate video count
      const videoExtensions = [
        ".mp4",
        ".avi",
        ".mov",
        ".wmv",
        ".flv",
        ".webm",
        ".mkv",
      ];
      const existingVideoCount = existingImages.filter((img) => {
        if (!img.mimeType && !img.originalName) return false;
        if (img.mimeType && img.mimeType.startsWith("video/")) return true;
        const ext =
          "." + (img.originalName || "").toLowerCase().split(".").pop();
        return videoExtensions.includes(ext);
      }).length;

      const newVideoCount = event_images.filter((file) => {
        if (!file.mimeType) return false;
        return file.mimeType.startsWith("video/");
      }).length;

      const totalVideoCount = existingVideoCount + newVideoCount;

      if (totalVideoCount > 1) {
        // Cleanup uploaded files before returning error
        const filesToDelete = [];
        if (eventLogoUrl) filesToDelete.push(eventLogoUrl);
        if (eventBannerUrl) filesToDelete.push(eventBannerUrl);
        if (collegeAuthorisationUrl)
          filesToDelete.push(collegeAuthorisationUrl);
        event_images.forEach((img) => filesToDelete.push(img.path));

        await Promise.all(
          filesToDelete.map((url) =>
            deleteFromCloudinary(url).catch((err) =>
              console.error("Cleanup error:", err.message)
            )
          )
        );

        return res.status(400).json({
          message: `Maximum 1 video allowed. You already have ${existingVideoCount} video(s)`,
          existing_videos: existingVideoCount,
          new_videos: newVideoCount,
          max_videos_allowed: 1,
        });
      }

      // Append new images to existing ones
      const newImages = event_images.map((file) => ({
        path: file.path,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        public_id: file.public_id,
        resource_type: file.resource_type,
        uploadedAt: new Date(),
      }));

      updateData.event_images = [...existingImages, ...newImages];
      console.log(
        "✅ Event images will be updated:",
        existingImages.length,
        "existing +",
        event_images.length,
        "new =",
        updateData.event_images.length,
        "total"
      );
    }
    // Add college authorization file if uploaded
    if (collegeAuthorisationUrl) {
      updateData.college_authorisation = collegeAuthorisationUrl;
    }
    console.log("📝 Final update data:", {
      has_event_logo: !!updateData.event_logo,
      has_event_banner: !!updateData.event_banner,
      has_college_auth: !!updateData.college_authorisation,
      event_images_count: updateData.event_images?.length,
      event_logo_url: updateData.event_logo,
      event_banner_url: updateData.event_banner,
    });
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
    console.log("✅ Ticket Media updated successfully");
    res.status(200).json({
      message: "Ticket media updated successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      uploadedFiles: {
        event_logo: !!eventLogoUrl,
        event_banner: !!eventBannerUrl,
        event_images: event_images.length,
        college_authorisation: !!collegeAuthorisationUrl,
      },
      uploadedUrls: {
        event_logo: eventLogoUrl,
        event_banner: eventBannerUrl,
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
      if (filesToDelete.length > 0) {
        console.log("🧹 Cleaning up uploaded files due to error...");
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
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      message:
        "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      ticketId: ticketId,
    });
  }
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
    const userId = req.user._id || req.user.id;
    const existingTicket = await Ticket.findById(ticketId);
    if (!existingTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    let subEventData;
    let editingSubEventId = null;
    let isEditingSubEvent = false;
    try {
      if (req.body.sub_event) {
        subEventData =
          typeof req.body.sub_event === "string"
            ? JSON.parse(req.body.sub_event)
            : req.body.sub_event;
        if (req.body.editing_sub_event_id) {
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
      return res.status(400).json({
        message: "Invalid sub_event data format",
        error: parseError.message,
        hint: "Make sure your data is properly formatted JSON",
        receivedFields: Object.keys(req.body),
      });
    }
    if (!subEventData) {
      return res.status(400).json({
        message: "sub_event data is required",
        receivedFields: Object.keys(req.body),
        expectedFormat:
          "Send data in 'sub_event' field or include event fields directly in request body",
        hint: "Required fields include: event_name, event_category, location_type, etc.",
      });
    }

    if (typeof subEventData !== "object" || Array.isArray(subEventData)) {
      return res.status(400).json({
        message: "sub_event data must be an object",
        receivedType: Array.isArray(subEventData)
          ? "array"
          : typeof subEventData,
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
        { key: "location", value: subEventData.location },
        { key: "venue", value: subEventData.venue },
        { key: "seating_arrangement", value: subEventData.seating_arrangement },
      ];
    } else if (
      subEventData.location_type === "online" ||
      subEventData.location_type === "recorded"
    ) {
      locationSpecificRequiredFields = [];
    }

    const allRequiredFields = [
      ...baseRequiredFields,
      ...locationSpecificRequiredFields,
    ];

    const missingFields = allRequiredFields
      .filter(({ value }) => !value)
      .map(({ key }) => key);

    if (missingFields.length > 0) {
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

    // ===== PARSE ALL COMMON DATA FIRST (BEFORE EDIT CHECK) =====

    const parseNestedData = (data, fieldName) => {
      if (!data) return [];

      try {
        if (typeof data === "string") {
          const trimmed = data.trim();
          if (trimmed === "" || trimmed === "[]" || trimmed === "{}") {
            return [];
          }
          try {
            const parsed = JSON.parse(trimmed);
            if (parsed === null || parsed === undefined) {
              return [];
            }
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            return [];
          }
        }
        if (Array.isArray(data)) {
          return data;
        }
        if (typeof data === "object" && data !== null) {
          return [data];
        }
        return [];
      } catch (error) {
        return [];
      }
    };

    let eventDates = parseNestedData(
      subEventData.event_dates || req.body.event_dates,
      "event_dates"
    );

    // Validate event_link for online/recorded events
    if (
      subEventData.location_type === "online" ||
      subEventData.location_type === "recorded"
    ) {
      for (const date of eventDates) {
        if (!date.event_link || String(date.event_link).trim() === "") {
          return res.status(400).json({
            message:
              "Event link is required for all dates in online/recorded events",
            missingFor: `Date: ${date.start_date}`,
            hint: "Please provide event_link for each date in event_dates array",
          });
        }
      }
    }

    // Validate enum fields
    const validEventTypes = ["private", "public"];
    if (!validEventTypes.includes(subEventData.event_type)) {
      return res.status(400).json({
        message: "Invalid event_type",
        provided: subEventData.event_type,
        validOptions: validEventTypes,
      });
    }

    const validLanguages = [
      "English",
      "Hindi",
      "Malayalam",
      "Tamil",
      "Kannada",
      "Telugu",
      "Marathi",
      "Gujarati",
      "Punjabi",
      "Urdu",
      "Bengali",
      "Spanish",
      "French",
      "German",
      "Chinese",
      "Japanese",
      "Russian",
      "Turkish",
      "Korean",
      "Portuguese",
      "Arabic",
      "Indonesian",
      "Vietnamese",
      "Other",
    ];

    const languageArray = parseJSONSafely(subEventData.event_language, []);
    if (languageArray.length > 0) {
      const invalidLanguages = languageArray.filter(
        (lang) => !validLanguages.includes(lang)
      );
      if (invalidLanguages.length > 0) {
        return res.status(400).json({
          message: "Invalid event_language(s)",
          provided: invalidLanguages,
          validOptions: validLanguages,
        });
      }
    }

    const validLocationTypes = ["offline", "online", "recorded"];
    if (!validLocationTypes.includes(subEventData.location_type)) {
      return res.status(400).json({
        message: "Invalid location_type",
        provided: subEventData.location_type,
        validOptions: validLocationTypes,
      });
    }

    if (
      subEventData.location_type === "offline" &&
      subEventData.seating_arrangement
    ) {
      const validSeatingArrangements = [
        "seated",
        "standing",
        "seated and standing",
        "other",
      ];
      if (
        !validSeatingArrangements.includes(subEventData.seating_arrangement)
      ) {
        return res.status(400).json({
          message: "Invalid seating_arrangement",
          provided: subEventData.seating_arrangement,
          validOptions: validSeatingArrangements,
        });
      }
    }

    const validPaymentTypes = ["free", "paid"];
    if (!validPaymentTypes.includes(subEventData.payment_type)) {
      return res.status(400).json({
        message: "Invalid payment_type",
        provided: subEventData.payment_type,
        validOptions: validPaymentTypes,
      });
    }

    const ageNum = Number(subEventData.min_age_allowed);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 100) {
      return res.status(400).json({
        message: "Minimum age allowed must be between 0 and 100",
      });
    }
    let ageMax = 100;
    if (
      subEventData.max_age_allowed &&
      String(subEventData.max_age_allowed).trim() !== ""
    ) {
      const parsedAgeMax = Number(subEventData.max_age_allowed);

      if (isNaN(parsedAgeMax) || parsedAgeMax < 0 || parsedAgeMax > 100) {
        return res.status(400).json({
          message: "Maximum age allowed must be between 0 and 100 if provided",
        });
      }
      // Check max > min
      if (parsedAgeMax < ageNum) {
        return res.status(400).json({
          message:
            "Maximum age allowed cannot be less than minimum age allowed",
        });
      }
      ageMax = parsedAgeMax;
    }

    // Process files
    const processedFiles = {};
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const docExtensions = [".pdf", ".doc", ".docx"];
    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
    const uploadedFiles = await processFileUploads(req.files || {});
    const guestProfileFiles = {};
    const ticketPhotoFiles = {};
    const videoFiles = {};
    const previewImageFiles = {};
    Object.keys(uploadedFiles).forEach((fieldName) => {
      if (fieldName.startsWith("guest_profile_")) {
        const index = fieldName.split("_")[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const fileData = uploadedFiles[fieldName];

          console.log(
            `Processing guest_profile_${index} in addons:`,
            typeof fileData,
            Array.isArray(fileData)
          );

          // Handle different return formats from processFileUploads
          if (typeof fileData === "string") {
            // Direct Cloudinary URL
            guestProfileFiles[parseInt(index)] = { path: fileData };
          } else if (Array.isArray(fileData) && fileData.length > 0) {
            // Array of file objects
            guestProfileFiles[parseInt(index)] = fileData[0];
          } else if (
            fileData &&
            typeof fileData === "object" &&
            fileData.path
          ) {
            // Single file object
            guestProfileFiles[parseInt(index)] = fileData;
          }

          console.log(
            `✅ Guest profile ${index} stored in addons:`,
            guestProfileFiles[parseInt(index)]?.path
          );
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
      // Handle event banner (single file, NOT array in schema)
      if (uploadedFiles.event_banner) {
        let bannerFile = uploadedFiles.event_banner;
        let bannerUrl = null;
        let bannerPublicId = null;

        console.log("🔍 event_banner type:", typeof bannerFile);
        console.log("🔍 event_banner is array?", Array.isArray(bannerFile));

        // Case 1: It's already a string URL (Cloudinary direct return)
        if (typeof bannerFile === "string") {
          bannerUrl = bannerFile;
          console.log("✓ Event banner is direct URL string:", bannerUrl);
        }
        // Case 2: It's an array with object
        else if (Array.isArray(bannerFile) && bannerFile.length > 0) {
          const firstFile = bannerFile[0];
          if (typeof firstFile === "string") {
            bannerUrl = firstFile;
          } else if (firstFile.path) {
            bannerUrl = firstFile.path;
            bannerPublicId = firstFile.public_id;
          }
          console.log("✓ Event banner from array:", bannerUrl);
        }
        // Case 3: It's an object with path property
        else if (
          typeof bannerFile === "object" &&
          bannerFile !== null &&
          bannerFile.path
        ) {
          bannerUrl = bannerFile.path;
          bannerPublicId = bannerFile.public_id;
          console.log("✓ Event banner from object:", bannerUrl);
        }

        if (bannerUrl) {
          processedFiles.event_banner = bannerUrl; // Cloudinary URL (String)
          processedFiles.event_banner_public_id = bannerPublicId || "";
          console.log("✅ Event banner processed successfully:", bannerUrl);
        } else {
          console.error("❌ Event banner upload failed:", {
            type: typeof bannerFile,
            isArray: Array.isArray(bannerFile),
            hasPath: bannerFile && bannerFile.path ? "yes" : "no",
            firstChars:
              typeof bannerFile === "string"
                ? bannerFile.substring(0, 50)
                : "not a string",
          });
          return res.status(400).json({
            message: "Event banner upload failed or is invalid",
            debug: {
              uploadedFilesKeys: Object.keys(uploadedFiles),
              bannerFileType: typeof bannerFile,
              isArray: Array.isArray(bannerFile),
              isString: typeof bannerFile === "string",
              hasPathProperty:
                bannerFile && typeof bannerFile === "object"
                  ? "path" in bannerFile
                  : false,
            },
          });
        }
      }

      // Handle event logo (single file, NOT array in schema)
      if (uploadedFiles.event_logo) {
        let logoFile = uploadedFiles.event_logo;
        let logoUrl = null;
        let logoPublicId = null;

        if (typeof logoFile === "string") {
          logoUrl = logoFile;
        } else if (Array.isArray(logoFile) && logoFile.length > 0) {
          const firstFile = logoFile[0];
          logoUrl = typeof firstFile === "string" ? firstFile : firstFile.path;
          logoPublicId =
            typeof firstFile === "object" ? firstFile.public_id : null;
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
          console.log("✅ Event logo processed:", logoUrl);
        }
      }

      // Handle event images (array in schema)
      if (uploadedFiles.event_images && uploadedFiles.event_images.length > 0) {
        if (uploadedFiles.event_images.length > 10) {
          return res.status(400).json({
            message: "Maximum 10 event images allowed",
          });
        }

        processedFiles.event_images = uploadedFiles.event_images.map((file) => {
          // Handle both string URLs and objects
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
          } else {
            return {
              path: file.path || file,
              originalName:
                file.originalName || file.originalname || "uploaded_image",
              mimeType: file.mimeType || file.mimetype || "image/jpeg",
              size: file.size || 0,
              public_id: file.public_id || "",
              resource_type: file.resource_type || "image",
              uploadedAt: new Date(),
            };
          }
        });
        console.log(
          `✅ ${processedFiles.event_images.length} event images processed`
        );
      }

      // Handle event rules
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
            rulesOriginalName =
              firstFile.originalName || firstFile.originalname || "event_rules";
            rulesMimeType =
              firstFile.mimeType || firstFile.mimetype || "application/pdf";
            rulesSize = firstFile.size || 0;
          }
        } else if (typeof rulesFile === "object" && rulesFile !== null) {
          rulesUrl = rulesFile.path;
          rulesPublicId = rulesFile.public_id;
          rulesOriginalName =
            rulesFile.originalName || rulesFile.originalname || "event_rules";
          rulesMimeType =
            rulesFile.mimeType || rulesFile.mimetype || "application/pdf";
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
          console.log("✅ Event rules processed:", rulesUrl);
        }
      }

      // Handle ticket layout (single file, only for offline)
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
          layoutUrl =
            typeof firstFile === "string" ? firstFile : firstFile.path;
          layoutPublicId =
            typeof firstFile === "object" ? firstFile.public_id : null;
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
          console.log("✅ Ticket layout processed:", layoutUrl);
        }
      }

      processedFiles.guestProfileFiles = guestProfileFiles;
      processedFiles.ticketPhotoFiles = ticketPhotoFiles;
      processedFiles.videoFiles = videoFiles;
      processedFiles.previewImageFiles = previewImageFiles;
    }
    // Parse guests, banking details, POCS
    const guests = parseNestedData(
      subEventData.guests || req.body.guests,
      "guests"
    );
    const bankingDetails = parseNestedData(
      subEventData.banking_details || req.body.banking_details,
      "banking_details"
    );
    const POCS = parseNestedData(subEventData.POCS || req.body.POCS, "POCS");

    // Parse ticket types
    const ticketTypes = (() => {
      const rawTickets = subEventData.ticket_types || req.body.ticket_types;
      if (!rawTickets) {
        console.log("No ticket_types found");
        return [];
      }
      if (Array.isArray(rawTickets)) {
        console.log("ticket_types is already an array");
        return rawTickets;
      }
      if (typeof rawTickets === "string") {
        try {
          const parsed = JSON.parse(rawTickets);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.log("Failed to parse ticket_types string:", e);
          return [];
        }
      }
      console.log("ticket_types is an unknown type");
      return [];
    })();

    // Parse prohibited items
    const prohibitedItems = (() => {
      const rawItems =
        subEventData.prohibited_items ||
        req.body.prohibited_items ||
        subEventData.prohibitedItems ||
        req.body.prohibitedItems;

      if (!rawItems) {
        console.log("❌ No prohibited_items found");
        return [];
      }

      if (Array.isArray(rawItems)) {
        console.log("✓ prohibited_items is already an array");
        return rawItems;
      }

      if (typeof rawItems === "string") {
        const trimmed = rawItems.trim();

        if (trimmed === "" || trimmed === "[]" || trimmed === "{}") {
          console.log("Empty string or empty array/object");
          return [];
        }

        try {
          const parsed = JSON.parse(trimmed);

          if (Array.isArray(parsed)) {
            return parsed;
          } else if (typeof parsed === "object" && parsed !== null) {
            return Object.values(parsed);
          } else {
            return [parsed];
          }
        } catch (e) {
          console.log("❌ Failed to parse:", e.message);
          if (trimmed.includes(",")) {
            const split = trimmed
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item !== "");
            console.log("Comma split result:", split);
            return split;
          }
          return [];
        }
      }

      if (typeof rawItems === "object" && rawItems !== null) {
        console.log("prohibited_items is object, extracting values");
        return Object.values(rawItems);
      }

      console.log("❌ Unknown type");
      return [];
    })();
    let processedGuests = [];
    if (guests && guests.length > 0) {
      if (guests.length > 10) {
        return res.status(400).json({
          message: "Maximum 10 guests allowed",
        });
      }
      console.log(
        `Processing ${guests.length} guests in addons with profile files:`,
        Object.keys(guestProfileFiles)
      );
      processedGuests = guests.map((guest, index) => {
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
          console.log(
            `✅ Guest ${index} profile set in addons:`,
            guestData.guest_profile
          );
        } else {
          console.log(`⚠️ No profile file for guest ${index} in addons`);
        }
        return guestData;
      });
      console.log(
        `Processed ${processedGuests.length} guests in addons:`,
        processedGuests.map((g) => ({
          name: g.guest_name,
          has_profile: !!g.guest_profile,
        }))
      );
    }
    let processedTicketTypes = [];
    if (ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
        const ticketType = ticket.ticket_type || ticket.name;
        const ticketPrice =
          ticket.ticket_price !== undefined
            ? ticket.ticket_price
            : ticket.price;
        const maxCapacity =
          ticket.max_capacity !== undefined
            ? ticket.max_capacity
            : ticket.capacity;
        const existingPhoto =
          ticket.ticket_photo || ticket.existingPhotoPath || "";
        if (!ticketType || ticketType.toString().trim() === "") {
          throw new Error(`Missing ticket_type for ticket ${index + 1}`);
        }
        if (ticketPrice === undefined || ticketPrice === null) {
          throw new Error(`Missing ticket_price for ticket ${index + 1}`);
        }
        if (!maxCapacity) {
          throw new Error(`Missing max_capacity for ticket ${index + 1}`);
        }
        const parsedPrice = Number(ticketPrice);
        const parsedCapacity = Number(maxCapacity);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
          throw new Error(`Invalid ticket price for ticket ${index + 1}`);
        }
        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
          throw new Error(`Invalid max capacity for ticket ${index + 1}`);
        }
        const ticketData = {
          ticket_type: String(ticketType).trim(),
          ticket_price: parsedPrice,
          max_capacity: parsedCapacity,
          ticket_photo: "",
          ticket_photo_public_id: "", // Add for Cloudinary deletion
        };
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path; // Cloudinary URL
          ticketData.ticket_photo_public_id = ticketPhotoFiles[index].public_id;
        } else if (existingPhoto) {
          ticketData.ticket_photo = existingPhoto;
        } else {
          console.log(`⚠ No photo for ticket ${index}`);
        }
        console.log("Final:", ticketData);
        return ticketData;
      });
    }
    if (subEventData.location_type === "recorded") {
      eventDates = eventDates.map((date, index) => {
        const videoFile = videoFiles[index];
        const previewImage = previewImageFiles[index];
        return {
          ...date,
          video_file_path: videoFile
            ? videoFile.path
            : date.video_file_path || "", // Cloudinary URL
          video_file_public_id: videoFile
            ? videoFile.public_id
            : date.video_file_public_id || "",
          preview_image_path: previewImage
            ? previewImage.path
            : date.preview_image_path || "", // Cloudinary URL
          preview_image_public_id: previewImage
            ? previewImage.public_id
            : date.preview_image_public_id || "",
        };
      });
    }
    let exactMapLocation = {};
    if (
      subEventData.location_type === "offline" &&
      subEventData.exact_map_location
    ) {
      try {
        exactMapLocation =
          typeof subEventData.exact_map_location === "string"
            ? JSON.parse(subEventData.exact_map_location)
            : subEventData.exact_map_location;
      } catch (error) {
        console.warn("Error parsing exact_map_location:", error);
      }
    }

    // Process and clean prohibited items
    const finalProhibitedItems = (() => {
      if (!Array.isArray(prohibitedItems)) {
        if (prohibitedItems && typeof prohibitedItems === "object") {
          const values = Object.values(prohibitedItems)
            .map((item) => String(item).trim())
            .filter((item) => item !== "");
          return values;
        }
        return [];
      }
      const processed = prohibitedItems
        .map((item) => {
          if (typeof item === "string") {
            return item.trim();
          } else if (typeof item === "object" && item !== null) {
            return item.name || item.item || item.value || JSON.stringify(item);
          } else {
            return String(item).trim();
          }
        })
        .filter(
          (item) => item !== "" && item !== "undefined" && item !== "null"
        );
      return processed;
    })();
    const finalTicketTypes =
      processedTicketTypes && processedTicketTypes.length > 0
        ? processedTicketTypes.map((ticket) => ({
            ticket_type: String(ticket.ticket_type),
            ticket_price: Number(ticket.ticket_price),
            max_capacity: Number(ticket.max_capacity),
            ticket_photo: String(ticket.ticket_photo || ""),
            ticket_photo_public_id: String(ticket.ticket_photo_public_id || ""),
          }))
        : [];
    if (isEditingSubEvent && editingSubEventId) {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      const subEventIndex = ticket.sub_events.findIndex(
        (se) => se._id.toString() === editingSubEventId
      );
      if (subEventIndex === -1) {
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
        event_description: String(subEventData.event_description).trim(),
        payment_type: String(subEventData.payment_type),
        kids_friendly: Boolean(
          subEventData.kids_friendly === "true" ||
            subEventData.kids_friendly === true
        ),
        pet_friendly: Boolean(
          subEventData.pet_friendly === "true" ||
            subEventData.pet_friendly === true
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
        ticket_types:
          finalTicketTypes.length > 0
            ? finalTicketTypes
            : existingSubEvent.ticket_types || [],
        guests: processedGuests.map((guest) => ({
          guest_name: String(guest.guest_name || ""),
          guest_profile: String(guest.guest_profile || ""),
          guest_link: String(guest.guest_link || ""),
        })),
        banking_details: bankingDetails.map((banking) => ({
          bank_acc_type: String(banking.bank_acc_type || ""),
          bank_acc_no: String(banking.bank_acc_no || ""),
          bank_ifsc: String(banking.bank_ifsc || ""),
          bank_acc_holder: String(banking.bank_acc_holder || ""),
        })),
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
  
  // Only add time fields if they have values
  if (date.start_time && String(date.start_time).trim() !== "") {
    dateEntry.start_time = String(date.start_time);
  }
  if (date.end_time && String(date.end_time).trim() !== "") {
    dateEntry.end_time = String(date.end_time);
  }
  
  return dateEntry;
}),
        event_banner: String(
          processedFiles.event_banner || existingSubEvent.event_banner || ""
        ),
        event_logo: String(
          processedFiles.event_logo || existingSubEvent.event_logo || ""
        ),
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
          address: exactMapLocation.address
            ? String(exactMapLocation.address)
            : "",
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
        updatedSubEvent.event_link = String(
          subEventData.event_link || ""
        ).trim();
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
          path: String(processedFiles.event_rules.path), // Cloudinary URL
          originalName: String(processedFiles.event_rules.originalName),
          mimeType: String(processedFiles.event_rules.mimeType),
          size: Number(processedFiles.event_rules.size),
          public_id: String(processedFiles.event_rules.public_id), // Store for deletion
          resource_type: String(processedFiles.event_rules.resource_type),
          uploadedAt: new Date(processedFiles.event_rules.uploadedAt),
        };
      } else if (
        subEventData.event_rules_text &&
        String(subEventData.event_rules_text).trim()
      ) {
        updatedSubEvent.event_rules = {
          type: "text",
          content: String(subEventData.event_rules_text).trim(),
          uploadedAt: new Date(),
        };
      } else {
        updatedSubEvent.event_rules = existingSubEvent.event_rules || {
          type: "text",
          content: "",
          uploadedAt: new Date(),
        };
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
        {
          _id: ticketId,
          "sub_events._id": editingSubEventId,
        },
        updatePayload,
        {
          new: true,
          runValidators: true,
        }
      );
      if (!updatedTicket) {
        return res.status(404).json({
          message: "Failed to update sub-event",
        });
      }
      const updatedSubEventData = updatedTicket.sub_events.find(
        (se) => se._id.toString() === editingSubEventId
      );
      return res.status(200).json({
        message: "Sub-event updated successfully",
        ticket: updatedTicket,
        updatedSubEvent: updatedSubEventData,
        operation: "update",
        debug: {
          prohibited_items_count:
            updatedSubEventData.prohibited_items?.length || 0,
          ticket_types_count: updatedSubEventData.ticket_types?.length || 0,
          location_type: updatedSubEventData.location_type,
        },
      });
    }
    if (!processedFiles.event_banner) {
      return res.status(400).json({
        message: "Event banner is required for sub-events",
      });
    }
    if (existingTicket.sub_events && existingTicket.sub_events.length > 0) {
      const newEventName = String(subEventData.event_name).trim().toLowerCase();
      let newLocationIdentifier = "";
      if (subEventData.location_type === "offline") {
        const location = String(subEventData.location || "")
          .trim()
          .toLowerCase();
        const venue = String(subEventData.venue || "")
          .trim()
          .toLowerCase();
        newLocationIdentifier = `${location}|${venue}`;
      } else if (subEventData.location_type === "online") {
        if (eventDates && eventDates.length > 0 && eventDates[0].event_link) {
          newLocationIdentifier = String(eventDates[0].event_link)
            .trim()
            .toLowerCase();
        } else {
          newLocationIdentifier = String(subEventData.event_link || "")
            .trim()
            .toLowerCase();
        }
      } else if (subEventData.location_type === "recorded") {
        if (eventDates && eventDates.length > 0) {
          const videoName = String(eventDates[0].video_name || "")
            .trim()
            .toLowerCase();
          const eventLink = String(eventDates[0].event_link || "")
            .trim()
            .toLowerCase();
          newLocationIdentifier = videoName || eventLink || "recorded";
        } else {
          newLocationIdentifier = "recorded";
        }
      }
      for (const newEventDate of eventDates) {
        const newStartDate = newEventDate.start_date;
        const newStartTime = newEventDate.start_time;
        const newEndTime = newEventDate.end_time;
        const newVideoName = String(newEventDate.video_name || "")
          .trim()
          .toLowerCase();
        const duplicateSubEvent = existingTicket.sub_events.find(
          (existingSubEvent) => {
            const existingEventName = String(existingSubEvent.event_name || "")
              .trim()
              .toLowerCase();
            if (existingEventName !== newEventName) {
              return false;
            }
            if (existingSubEvent.location_type !== subEventData.location_type) {
              return false;
            }
            let locationMatches = false;
            if (subEventData.location_type === "offline") {
              const existingLocation = String(existingSubEvent.location || "")
                .trim()
                .toLowerCase();
              const existingVenue = String(existingSubEvent.venue || "")
                .trim()
                .toLowerCase();
              const existingIdentifier = `${existingLocation}|${existingVenue}`;
              locationMatches = existingIdentifier === newLocationIdentifier;
            } else if (subEventData.location_type === "online") {
              if (
                existingSubEvent.event_dates &&
                existingSubEvent.event_dates.length > 0
              ) {
                const existingEventLink = String(
                  existingSubEvent.event_dates[0].event_link || ""
                )
                  .trim()
                  .toLowerCase();
                locationMatches = existingEventLink === newLocationIdentifier;
              } else {
                const existingEventLink = String(
                  existingSubEvent.event_link || ""
                )
                  .trim()
                  .toLowerCase();
                locationMatches = existingEventLink === newLocationIdentifier;
              }
            } else if (subEventData.location_type === "recorded") {
              if (
                existingSubEvent.event_dates &&
                existingSubEvent.event_dates.length > 0
              ) {
                const existingVideoName = String(
                  existingSubEvent.event_dates[0].video_name || ""
                )
                  .trim()
                  .toLowerCase();
                const existingEventLink = String(
                  existingSubEvent.event_dates[0].event_link || ""
                )
                  .trim()
                  .toLowerCase();
                const existingIdentifier =
                  existingVideoName || existingEventLink || "recorded";
                locationMatches = existingIdentifier === newLocationIdentifier;
              }
            }
            if (!locationMatches) {
              return false;
            }
            if (
              existingSubEvent.event_dates &&
              existingSubEvent.event_dates.length > 0
            ) {
              const dateMatch = existingSubEvent.event_dates.some(
                (existingDate) => {
                  const dateMatches = existingDate.start_date === newStartDate;
                  const timeMatches =
                    existingDate.start_time === newStartTime &&
                    existingDate.end_time === newEndTime;
                  if (subEventData.location_type === "recorded") {
                    const existingVideoName = String(
                      existingDate.video_name || ""
                    )
                      .trim()
                      .toLowerCase();
                    const videoMatches = existingVideoName === newVideoName;
                    return dateMatches && timeMatches && videoMatches;
                  }
                  return dateMatches && timeMatches;
                }
              );
              return dateMatch;
            }
            return false;
          }
        );
        if (duplicateSubEvent) {
          const conflictDetails = {
            event_name: subEventData.event_name,
            location_type: subEventData.location_type,
            conflicting_date: {
              start_date: newStartDate,
              start_time: newStartTime,
              end_time: newEndTime,
            },
          };
          if (subEventData.location_type === "offline") {
            conflictDetails.location = subEventData.location;
            conflictDetails.venue = subEventData.venue;
          } else if (subEventData.location_type === "online") {
            conflictDetails.event_link =
              newEventDate.event_link || subEventData.event_link;
          } else if (subEventData.location_type === "recorded") {
            conflictDetails.video_name = newEventDate.video_name;
            conflictDetails.event_link = newEventDate.event_link;
          }
          return res.status(409).json({
            message: "Duplicate sub-event detected",
            error:
              "A sub-event with the same event name, location/video, date, and time already exists",
            conflictDetails: conflictDetails,
            hint: "Please modify the event name, location/video name, or schedule to avoid conflicts",
          });
        }
      }
    }
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
      event_description: String(subEventData.event_description).trim(),
      payment_type: String(subEventData.payment_type),
      kids_friendly: Boolean(
        subEventData.kids_friendly === "true" ||
          subEventData.kids_friendly === true
      ),
      pet_friendly: Boolean(
        subEventData.pet_friendly === "true" ||
          subEventData.pet_friendly === true
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
      banking_details: bankingDetails.map((banking) => ({
        bank_acc_type: String(banking.bank_acc_type || ""),
        bank_acc_no: String(banking.bank_acc_no || ""),
        bank_ifsc: String(banking.bank_ifsc || ""),
        bank_acc_holder: String(banking.bank_acc_holder || ""),
      })),
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
        // Only add time fields if they have values
        if (date.start_time && String(date.start_time).trim() !== "") {
          dateEntry.start_time = String(date.start_time);
        }
        if (date.end_time && String(date.end_time).trim() !== "") {
          dateEntry.end_time = String(date.end_time);
        }
        return dateEntry;
      }),
      event_banner: String(processedFiles.event_banner || ""),
      event_logo: String(processedFiles.event_logo || ""),
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
        address: exactMapLocation.address
          ? String(exactMapLocation.address)
          : "",
      };
      newSubEvent.gate_open_time = String(
        subEventData.gate_open_time || ""
      ).trim();
      newSubEvent.ticket_layout = String(processedFiles.ticket_layout || "");
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
        path: String(processedFiles.event_rules.path), // Cloudinary URL
        originalName: String(processedFiles.event_rules.originalName),
        mimeType: String(processedFiles.event_rules.mimeType),
        size: Number(processedFiles.event_rules.size),
        public_id: String(processedFiles.event_rules.public_id), // Store for deletion
        resource_type: String(processedFiles.event_rules.resource_type),
        uploadedAt: new Date(processedFiles.event_rules.uploadedAt),
      };
    } else if (
      subEventData.event_rules_text &&
      String(subEventData.event_rules_text).trim()
    ) {
      newSubEvent.event_rules = {
        type: "text",
        content: String(subEventData.event_rules_text).trim(),
        uploadedAt: new Date(),
      };
    } else {
      newSubEvent.event_rules = {
        type: "text",
        content: "",
        uploadedAt: new Date(),
      };
    }
    if (
      !Array.isArray(newSubEvent.event_dates) ||
      newSubEvent.event_dates.length === 0
    ) {
      return res.status(400).json({
        message: "At least one event date is required",
        hint: "Provide event_dates as an array with start_date, end_date, start_time, end_time",
      });
    }

    if (!Array.isArray(newSubEvent.POCS) || newSubEvent.POCS.length === 0) {
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
      {
        new: true,
        runValidators: true,
        upsert: false,
      }
    );

    if (!updatedTicket) {
      return res.status(404).json({
        message: "Failed to update ticket with sub-event",
        hint: "Ticket not found or update failed",
      });
    }
    const savedSubEvent =
      updatedTicket.sub_events[updatedTicket.sub_events.length - 1];
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
      };
    } else if (
      subEventData.location_type === "online" ||
      subEventData.location_type === "recorded"
    ) {
      responseData.online_fields = {
        event_link: newSubEvent.event_link || "Not provided",
        verification_code:
          newSubEvent.verification_event_code || "Not provided",
      };

      if (subEventData.location_type === "recorded") {
        responseData.recorded_fields = {
          video_files_uploaded: Object.keys(videoFiles).length,
          preview_images_uploaded: Object.keys(previewImageFiles).length,
          dates_with_videos: eventDates.filter((d) => d.video_file_path).length,
        };
      }
    }
    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error updating ticket add-ons:", error);
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
        "event_banner",
        "event_logo",
        "event_images",
        ...Array.from({ length: 10 }, (_, i) => `guest_profile_${i}`),
        ...Array.from({ length: 20 }, (_, i) => `ticket_photo_${i}`),
        ...Array.from({ length: 30 }, (_, i) => `video_file_${i}`),
        ...Array.from({ length: 30 }, (_, i) => `preview_image_${i}`),
        "ticket_layout",
        "event_rules",
      ];
      return res.status(400).json({
        message: "Unexpected file field detected",
        error: error.message,
        field: error.field || "Unknown field",
        allowedFields: allowedFields,
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
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
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
    // Cleanup: Delete uploaded Cloudinary files if database operation fails
    try {
      const filesToDelete = [];

      // Collect all uploaded file public_ids
      if (processedFiles.event_banner_public_id) {
        filesToDelete.push(processedFiles.event_banner_public_id);
      }
      if (processedFiles.event_logo_public_id) {
        filesToDelete.push(processedFiles.event_logo_public_id);
      }
      if (processedFiles.ticket_layout_public_id) {
        filesToDelete.push(processedFiles.ticket_layout_public_id);
      }

      if (
        processedFiles.event_images &&
        Array.isArray(processedFiles.event_images)
      ) {
        processedFiles.event_images.forEach((img) => {
          if (img.public_id) filesToDelete.push(img.public_id);
        });
      }

      if (processedFiles.event_rules && processedFiles.event_rules.public_id) {
        filesToDelete.push(processedFiles.event_rules.public_id);
      }

      Object.values(guestProfileFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });

      Object.values(ticketPhotoFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });

      Object.values(videoFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });

      Object.values(previewImageFiles).forEach((file) => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });

      // Delete files from Cloudinary
      for (const publicId of filesToDelete) {
        await deleteFromCloudinary(publicId);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up Cloudinary files:", cleanupError);
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
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      message:
        "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      ticketId: ticketId,
    });
  }

  // Add the missing parseJSONSafely utility function
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

    // Extract form data
    const {
      payment_type,
      ticket_layout,
      total_capacity,
      booking_start_date,
      booking_end_date,
      use_group_bank_account = "true", // Default to true for group bank account
    } = req.body;

    const parseNestedData = (data, fieldName) => {
      if (!data) return [];
      try {
        if (typeof data === "string") {
          const parsed = JSON.parse(data);
          console.log(`Successfully parsed ${fieldName}:`, parsed);
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
    const bankingDetails = parseNestedData(
      req.body.banking_details,
      "banking_details"
    );
    const ticketTypes = parseNestedData(req.body.ticket_types, "ticket_types");
    // Process uploaded files - Handle ticket photo uploads
    // Get uploaded files
    const uploadedFiles = await processFileUploads(req.files || {});
    Object.keys(uploadedFiles).forEach((fieldName) => {
      // Handle ticket photo files
      if (fieldName.startsWith("ticket_photo_")) {
        const index = fieldName.split("_")[2]; // Extract index from ticket_photo_X
        if (!isNaN(index) && parseInt(index) >= 0) {
          const fileData = uploadedFiles[fieldName];
          // processFileUploads returns array of objects for multiple files
          if (Array.isArray(fileData) && fileData.length > 0) {
            const ticketPhotoFile = fileData[0]; // Take first file

            // Validate it's an image (Cloudinary already validates, but double-check)
            if (!ticketPhotoFile.path || !ticketPhotoFile.originalName) {
              throw new Error(
                `Ticket photo ${index} upload failed or is invalid`
              );
            }

            ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
          }
        }
      }
    });
    if (
      uploadedFiles.ticket_layout &&
      Array.isArray(uploadedFiles.ticket_layout) &&
      uploadedFiles.ticket_layout.length > 0
    ) {
      const layoutFile = uploadedFiles.ticket_layout[0];

      // Validate upload success
      if (!layoutFile.path || !layoutFile.originalName) {
        return res.status(400).json({
          message: "Ticket layout upload failed or is invalid",
        });
      }

      processedFiles.ticket_layout = layoutFile.path; // Cloudinary URL
      processedFiles.ticket_layout_public_id = layoutFile.public_id; // Store for deletion
    }
    // Store the processed file objects
    processedFiles.ticketPhotoFiles = ticketPhotoFiles;
    // Validate required fields
    if (!payment_type) {
      return res.status(400).json({
        message: "Payment type is required",
      });
    }

    // Validate payment type
    const validPaymentTypes = ["free", "paid"];
    if (!validPaymentTypes.includes(payment_type)) {
      return res.status(400).json({
        message: "Invalid payment_type",
        provided: payment_type,
        validOptions: validPaymentTypes,
      });
    }

    // Process ticket types with photos
    let processedTicketTypes = [];
    if (ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
        // Validate required fields for each ticket type
        const requiredTicketFields = [
          "ticket_type",
          "ticket_price",
          "max_capacity",
        ];
        const missingTicketFields = requiredTicketFields.filter(
          (field) => !ticket[field] && ticket[field] !== 0
        );

        if (missingTicketFields.length > 0) {
          throw new Error(
            `Missing required fields for ticket type ${
              index + 1
            }: ${missingTicketFields.join(", ")}`
          );
        }

        // Validate ticket price and capacity
        const ticketPrice = Number(ticket.ticket_price);
        const maxCapacity = Number(ticket.max_capacity);

        if (isNaN(ticketPrice) || ticketPrice < 0) {
          throw new Error(
            `Invalid ticket price for ticket type ${
              index + 1
            }. Must be a non-negative number.`
          );
        }

        if (isNaN(maxCapacity) || maxCapacity <= 0) {
          throw new Error(
            `Invalid max capacity for ticket type ${
              index + 1
            }. Must be a positive number.`
          );
        }
        const ticketData = {
          ticket_type: String(ticket.ticket_type).trim(),
          ticket_price: ticketPrice,
          max_capacity: maxCapacity,
          ticket_photo: ticket.ticket_photo || "", // existing photo URL if any
          ticket_photo_public_id: ticket.ticket_photo_public_id || "", // existing public_id if any
        };
        // Add uploaded ticket photo if available
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path; // Cloudinary URL
          ticketData.ticket_photo_public_id = ticketPhotoFiles[index].public_id; // Store for deletion
        }
        return ticketData;
      });
    }
    let finalBankingDetails = [];
    if (payment_type === "paid") {
      if (use_group_bank_account === "true" || use_group_bank_account === true) {
        // Use group bank account
        if (
          !GroupBank.primary_bank_acc_no ||
          !GroupBank.primary_bank_ifsc ||
          !GroupBank.primary_bank_acc_holder ||
          !GroupBank.primary_bank_acc_type
        ) {
          return res.status(400).json({
            message:
              "Group banking details are incomplete. Please update your group banking details before proceeding",
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
        // Use custom banking details
        console.log(
          "Using custom banking details. Received data:",
          req.body.banking_details
        );

        const customBankingDetails = parseNestedData(
          req.body.banking_details,
          "banking_details"
        );

        if (!customBankingDetails || customBankingDetails.length === 0) {
          return res.status(400).json({
            message:
              "Custom banking details are required when not using group bank account",
            receivedData: req.body.banking_details,
            hint: "Ensure banking_details is sent as a JSON stringified array",
          });
        }

        // Validate custom banking details
        finalBankingDetails = customBankingDetails.map((banking, index) => {
          const requiredBankFields = [
            "bank_acc_type",
            "bank_acc_no",
            "bank_ifsc",
            "bank_acc_holder",
          ];
          const missingBankFields = requiredBankFields.filter(
            (field) => !banking[field]
          );

          if (missingBankFields.length > 0) {
            throw new Error(
              `Missing required banking fields for account ${
                index + 1
              }: ${missingBankFields.join(", ")}`
            );
          }

          return {
            bank_acc_type: String(banking.bank_acc_type).trim().toLowerCase(),
            bank_acc_no: String(banking.bank_acc_no).trim(),
            bank_ifsc: String(banking.bank_ifsc).trim().toUpperCase(),
            bank_acc_holder: String(banking.bank_acc_holder).trim(),
            is_group_account: false,
          };
        });
      }
    } else {
      // For free events, banking details are empty
      finalBankingDetails = [];
      console.log("Payment type is 'free'. Skipping banking details validation.");
    }
    // Validate dates if provided
    if (booking_start_date && booking_end_date) {
      const startDate = new Date(booking_start_date);
      const endDate = new Date(booking_end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format for booking dates",
        });
      }

      if (startDate >= endDate) {
        return res.status(400).json({
          message: "Booking start date must be before booking end date",
        });
      }
    }

    // Validate total capacity if provided
    if (total_capacity !== undefined) {
      const totalCap = Number(total_capacity);
      if (isNaN(totalCap) || totalCap <= 0) {
        return res.status(400).json({
          message: "Total capacity must be a positive number",
        });
      }
    }

    // Prepare update data
    const updateData = {
      payment_type: String(payment_type),
      banking_details: finalBankingDetails,
      "form_progress.banking_tickets": true,
      updated_by: userId,
      updated_at: new Date(),
    };

    // Add optional fields if provided
    if (processedTicketTypes.length > 0) {
      updateData.ticket_types = processedTicketTypes;
    }

    if (processedFiles.ticket_layout) {
      updateData.ticket_layout = String(processedFiles.ticket_layout);
      updateData.ticket_layout_public_id = String(
        processedFiles.ticket_layout_public_id || ""
      );
    }

    if (total_capacity !== undefined) {
      updateData.total_capacity = Number(total_capacity);
    }

    if (booking_start_date) {
      updateData.booking_start_date = new Date(booking_start_date);
    }

    if (booking_end_date) {
      updateData.booking_end_date = new Date(booking_end_date);
    }
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

    // Prepare response data
    const responseData = {
      message: "Ticket details updated successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
      payment_type: payment_type,
      banking_method:
        use_group_bank_account === "true" ? "group_account" : "custom_account",
      banking_details_count: finalBankingDetails.length,
      ticket_types_count: processedTicketTypes.length,
      uploadedFiles: {
        ticket_layout: processedFiles.ticket_layout ? 1 : 0,
        ticket_photos: Object.keys(ticketPhotoFiles).length,
      },
      form_progress: {
        banking_tickets: true,
      },
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
      (error.message.includes("Missing required fields for ticket type") ||
        error.message.includes("Invalid ticket price") ||
        error.message.includes("Invalid max capacity"))
    ) {
      return res.status(400).json({
        message: "Ticket type validation error",
        error: error.message,
      });
    }

    // Handle banking validation errors
    if (
      error.message &&
      error.message.includes("Missing required banking fields")
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
        error.message.includes("Invalid file type"))
    ) {
      return res.status(400).json({
        message: "Invalid file type",
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
      error.name !== "LIMIT_FILE_SIZE" &&
      error.name !== "LIMIT_FILE_COUNT" &&
      error.name !== "LIMIT_UNEXPECTED_FILE"
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
            if (
              layoutFile.public_id &&
              !filesToDelete.includes(layoutFile.public_id)
            ) {
              filesToDelete.push(layoutFile.public_id);
            }
          }

          // Check for ticket photos in uploadedFiles
          Object.keys(uploadedFiles).forEach((fieldName) => {
            if (fieldName.startsWith("ticket_photo_")) {
              const fileData = uploadedFiles[fieldName];
              if (Array.isArray(fileData) && fileData.length > 0) {
                const photoFile = fileData[0];
                if (
                  photoFile.public_id &&
                  !filesToDelete.includes(photoFile.public_id)
                ) {
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
              console.log(`Successfully deleted file: ${publicId}`);
            } catch (deleteError) {
              console.error(
                `Failed to delete file ${publicId}:`,
                deleteError.message
              );
            }
          }

          console.log(
            `Cleaned up ${filesToDelete.length} file(s) from Cloudinary due to error`
          );
        } else {
          console.log("No Cloudinary files to clean up");
        }
      } catch (cleanupError) {
        console.error("Error during Cloudinary cleanup:", cleanupError.message);
        // Don't throw - we're already handling an error
      }
    }

    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
// Step 5: Update Ticket - Terms & Conditions (Company Provided)
export const updateTicketTerms = async (req, res) => {
  try {
    const ticketId = req.params.ticketId || req.body.ticketId;
    const { terms_accepted, company_terms_version } = req.body;

    console.log("updateTicketTerms called with:", {
      ticketId,
      terms_accepted,
      company_terms_version,
    });

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

    console.log("Updating ticket with ID:", ticketId);

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
      console.log("Ticket not found for ID:", ticketId);
      return res
        .status(404)
        .json({ message: "Ticket not found or unauthorized" });
    }

    console.log("Ticket updated successfully:", updatedTicket._id);

    // Populate groupId to get group details
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
    const ticketId = req.params.ticketId;
    const subEventId = req.params.subEventId;

    const userId = req.user._id || req.user.id;
    if (!ticketId || !subEventId || !userId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["ticketId", "subEventId", "userId"],
      });
    }

    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      { $pull: { sub_events: { _id: subEventId } } },
      { new: true }
    );

    if (!updatedTicket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or unauthorized" });
    }

    // Update fields directly without triggering validation
    updatedTicket.event_status = "cancelled";
    updatedTicket.main_ticket_id = ticketId;
    await updatedTicket.save({ validateBeforeSave: false });

    res.status(200).json({
      message: "Sub-event deleted successfully",
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
      subEventId: subEventId,
    });
  } catch (error) {
    console.error("Error deleting sub-event:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
export const getAllDeletedEvents = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(400).json({
        message: "Missing required parameter: userId",
      });
    }
    const deletedEvents = await Ticket.find({
      event_status: "cancelled",
      userId: userId,
    }).sort({ createdAt: -1 });
    if (!deletedEvents || deletedEvents.length === 0) {
      return res.status(404).json({ message: "No deleted events found" });
    }
    res.status(200).json({
      message: "Deleted events fetched successfully",
      deletedEvents: deletedEvents,
      count: deletedEvents.length,
    });
  } catch (error) {
    console.error("Error fetching deleted events:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
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
    const ticketId = req.params.ticketId;
    const userId = req.user._id || req.user.id;
    if (!ticketId || !userId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["ticketId", "subEventId", "userId"],
      });
    }
    const deletedEvent = await Ticket.findOneAndDelete({
      _id: ticketId,
      userId: userId,
      event_status: "cancelled",
    });
    if (!deletedEvent) {
      return res
        .status(404)
        .json({ message: "Ticket not found or unauthorized" });
    }
    res.status(200).json({
      message: "Event permanently deleted successfully",
      ticket: deletedEvent,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error permanent ticket:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
export const getDeletedEventById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.eventId; // Changed from ticketId to eventId to match route
    if (!ticketId) {
      return res.status(400).json({
        message: "Missing required parameter: eventId in URL",
      });
    }
    if(!userId){
      return res.status(400).json({
        message: "Missing required parameter: userId",
      });
    }
    const deletedEvent = await Ticket.findOne({
      _id: ticketId,
      userId: userId,
      event_status: "cancelled",
    });

    if (!deletedEvent) {
      return res.status(404).json({
        message: "Ticket not found or you don't have access to this ticket",
      });
    }
    res.status(200).json({
      message: "Deleted Ticket retrieved successfully",
      ticket: deletedEvent, // Fixed: was just "ticket" without value
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error fetching deleted event:", error);
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
      { _id: ticketId, userId: userId, event_status: "cancelled" },
      { event_status: "confirmed" },
      { new: true }
    );
    if (!recoveredTicket) {
      return res.status(404).json({
        message: "Ticket not found or you don't have access to this ticket",
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
      console.log('✅ Notification sent via RabbitMQ');
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
export const getAllGroups = async (req, res)=>{
  try{
    const groups = await Group.find({status:"active"}).sort({
                  createdAt: -1});
    res.status(200).json({
      count: groups.length,
      groups,
    });
  }catch(error){
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllLiveEvents =  async (req, res)=>{
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
