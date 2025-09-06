import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
import upload from '../middlewares/upload.js';
import { uploadTicketMedia, uploadFields } from '../middlewares/upload.js';
import multer from 'multer';
import  { sendRPC } from '../rabbit/producer.js';
function parseJSONSafely(value, defaultValue = []) {
  if (!value) return defaultValue;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('JSON parse error for value:', value);
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
    const userData = await sendRPC('get-user', userId);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      message: "User retrieved successfully",
      user: userData
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const CreateGroup = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload.fields([
        { name: 'id_proof', maxCount: 1 },
        { name: 'bank_check', maxCount: 1 },
        { name: 'company_certificate', maxCount: 1 },
        { name: 'company_logo', maxCount: 1 },
      ])(req, res, (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;
    let usertype;
    if (userRole === 'organisation') {
      usertype = req.user.organisation_type;
    }
    if (!['admin', 'organisation'].includes(userRole)) {
      return res.status(400).json({ message: "Invalid user role" });
    }
    const userData = await sendRPC('get-user', userId);
    if (!userData) {
      return res.status(404).json({ message: "User not found in auth service" });
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
      primary_bank_acc_holder
    } = req.body;
    const filePaths = {
      id_proof: req.files?.id_proof?.[0]?.path || null,
      bank_check: req.files?.bank_check?.[0]?.path || null,
      company_certificate: req.files?.company_certificate?.[0]?.path || null,
      company_logo: req.files?.company_logo?.[0]?.path || null,
    };
    // Determine actual group type
    let actualGroupType;
    if (userRole === 'admin') {
      if (!grp_type || !['admin', 'organisation'].includes(grp_type)) {
        return res.status(400).json({
          message: "Admin must specify group type (admin or organisation)"
        });
      }
      actualGroupType = grp_type;
    } else {
      actualGroupType = 'organisation';
    }
    // Check group creation limits
    const existingGroups = await Group.find({ userId: userId });
    if (userRole === 'admin') {
      // Admin user limits: 1 admin group + 1 organisation group = max 2 groups
      const adminGroups = existingGroups.filter(g => g.grp_type === 'admin');
      const orgGroups = existingGroups.filter(g => g.grp_type === 'organisation');
      if (actualGroupType === 'admin' && adminGroups.length >= 1) {
        return res.status(400).json({
          message: "Admin users can only create one admin group"
        });
      }
      if (actualGroupType === 'organisation' && orgGroups.length >= 1) {
        return res.status(400).json({
          message: "Admin users can only create one organisation group"
        });
      }
    } else {
      // Organisation user limit: max 4 organisation groups
      if (existingGroups.length >= 4) {
        return res.status(400).json({
          message: "Organisation users can create maximum 4 groups"
        });
      }
    }
    // Prepare data for duplication checking
    let checkName, checkEmail, checkContact, checkPan, checkGst;
    if (actualGroupType === 'admin') {
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
            { name: { $regex: new RegExp(`^${checkName.trim()}$`, 'i') } },
            { email: { $regex: new RegExp(`^${checkEmail.trim()}$`, 'i') } }
          ]
        },
        // Check for duplicate combination of name + contact
        {
          $and: [
            { name: { $regex: new RegExp(`^${checkName.trim()}$`, 'i') } },
            { contact_no: checkContact.trim() }
          ]
        },
        
        // Check for duplicate combination of email + contact
        {
          $and: [
            { email: { $regex: new RegExp(`^${checkEmail.trim()}$`, 'i') } },
            { contact_no: checkContact.trim() }
          ]
        }
      ]
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
        duplicateFields.push('PAN number');
      }
      if (existingGroup.name.toLowerCase() === checkName.toLowerCase()) {
        duplicateFields.push('name');
      }
      if (existingGroup.email.toLowerCase() === checkEmail.toLowerCase()) {
        duplicateFields.push('email');
      }
      if (existingGroup.contact_no === checkContact) {
        duplicateFields.push('contact number');
      }
      if (checkGst && existingGroup.gst_no === checkGst) {
        duplicateFields.push('GST number');
      }
      return res.status(409).json({
        message: `Group with the same ${duplicateFields.join(', ')} already exists`,
        duplicateFields: duplicateFields,
        existingGroupId: existingGroup._id
      });
    }
    // Validation based on group type
    if (actualGroupType === 'admin') {
      // For admin groups, use user data from auth service
      if (!userData.name || !userData.email || !userData.contact_no) {
        return res.status(400).json({
          message: "Admin user data incomplete. Please update your profile."
        });
      }
      // Basic validation for admin group
      if (!pan_no || !filePaths.id_proof) {
        return res.status(400).json({
          message: "Missing required fields: pan_no, id_proof file"
        });
      }
    } else {
      // Organisation group validations
      if (!name || !email || !contact_no || !pan_no || !filePaths.id_proof) {
        return res.status(400).json({
          message: "Missing required fields: name, email, contact_no, pan_no, id_proof file",
        });
      }
      if (!organisation_type) {
        return res.status(400).json({ message: "Organisation type is required" });
      }
      if (!address) {
        return res.status(400).json({ message: "Address is required" });
      }
      // Additional validation for non-Educational organisations
      // Use organisation_type (from req.body.organisation_type) to check if Educational
      // Make case-insensitive comparison
      if (organisation_type.toLowerCase() !== 'educational') {
        if (!gst_no) {
          return res.status(400).json({ 
            message: "GST number is required for non-educational organisations" 
          });
        }
        if (!filePaths.bank_check) {
          return res.status(400).json({ 
            message: "Bank check document is required for non-educational organisations" 
          });
        }
        if (!filePaths.company_logo) {
          return res.status(400).json({ 
            message: "Company logo is required for non-educational organisations" 
          });
        }
      }
    }
    // Build group data
    const groupData = {
      pan_no: checkPan,
      id_proof: filePaths.id_proof,
      userId: userId,
      grp_type: actualGroupType,
      status: 'active',
      primary_bank_acc_type,
      primary_bank_acc_no,
      primary_bank_ifsc,
      primary_bank_acc_holder
    };
    if (actualGroupType === 'admin') {
      // Use admin user data from auth service
      groupData.name = userData.name;
      groupData.email = userData.email;
      groupData.contact_no = userData.contact_no;
      // Add optional fields for admin
      if (filePaths.bank_check) groupData.bank_check = filePaths.bank_check;
      if (gst_no) groupData.gst_no = gst_no;
    } else {
      // Use form data for organisation
      groupData.name = name;
      groupData.email = email;
      groupData.contact_no = contact_no;
      groupData.address = address;
      groupData.organisation_type = organisation_type;
      // For Educational organisations, gst_no and bank_check are optional
      // For other organisations, they are required (validated above)
      // Use usertype to determine if Educational
      if (gst_no) {
        groupData.gst_no = gst_no;
      }
      if (filePaths.bank_check) {
        groupData.bank_check = filePaths.bank_check;
      }
      // Optional files for all organisations
      if (filePaths.company_certificate) groupData.company_certificate = filePaths.company_certificate;
      if (filePaths.company_logo) groupData.company_logo = filePaths.company_logo;
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
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File too large. Max 10MB." });
      }
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation error", errors: messages });
    }
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        message: `Group with this ${field} already exists`,
        field: field
      });
    }
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      seating_arrangement,
      kids_friendly,
      pet_friendly,
      
      // Location
      location, 
      venue,
      exact_map_location,
      
      // Date and Time
      event_date_type,
      start_date,
      end_date,
      start_time,
      end_time,
      gate_open_time,
      prohibited_items,
      
      // Social Media and Rules
      event_instagram_link,
      event_youtube_link,
      event_rules_text,
      hashtag,      
      
      // Guests or Guides
      guests, // This will contain guest data as JSON string
      POCS,
      event_description,
      groupId: bodyGroupId
    } = req.body;

    // Get uploaded files
    const uploadedFiles = req.files || {};
    
    // Handle multiple guest profile uploads and event rules
    // Expected file fields: guest_profile_0, guest_profile_1, ..., guest_profile_9, event_rules
    const guestProfileFiles = {};
    const eventRulesFiles = uploadedFiles.event_rules || [];

    // Extract guest profile files (guest_profile_0, guest_profile_1, etc.)
    Object.keys(uploadedFiles).forEach(fieldName => {
      if (fieldName.startsWith('guest_profile_')) {
        const index = fieldName.split('_')[2]; // Extract index from guest_profile_X
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          guestProfileFiles[parseInt(index)] = uploadedFiles[fieldName][0]; // Take first file
        }
      }
    });

    // Get IDs
    const groupId = req.params.groupId || bodyGroupId;
    const userId = req.user?._id || req.user?.id;

    // Validate groupId format
    if (!groupId || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid group ID format. Please provide a valid MongoDB ObjectId.",
        groupId: groupId
      });
    }

    // Validation: Required fields
    const requiredFields = [
      { key: 'event_name', value: event_name },
      { key: 'event_category', value: event_category },
      { key: 'event_subcategory', value: event_subcategory },
      { key: 'event_type', value: event_type },
      { key: 'event_language', value: event_language },
      { key: 'seating_arrangement', value: seating_arrangement },
      { key: 'location', value: location },
      { key: 'venue', value: venue },
      { key: 'start_date', value: start_date },
      { key: 'start_time', value: start_time },
      { key: 'event_description', value: event_description },
      { key: 'groupId', value: groupId },
      { key: 'min_age_allowed', value: min_age_allowed },
      { key: 'event_date_type', value: event_date_type },
      { key: 'userId', value: userId }
    ];

    const missingFields = requiredFields
      .filter(({ value }) => !value)
      .map(({ key }) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: "Missing required fields",
        missingFields,
        requiredFields: requiredFields.map(({ key }) => key)
      });
    }

    // Verify group ownership
    const group = await Group.findOne({ _id: groupId, userId: userId });
    if (!group) {
      return res.status(404).json({ 
        message: "Group not found or you don't have permission to create events for this group" 
      });
    }

    // Validation: Enum fields
    const validEventTypes = ['private', 'public'];
    if (event_type && !validEventTypes.includes(event_type)) {
      return res.status(400).json({
        message: "Invalid event_type",
        provided: event_type,
        validOptions: validEventTypes
      });
    }

    const validLanguages = [
      'English', 'Hindi', 'Malayalam', 'Tamil', 'Kannada', 'Telugu', 
      'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Bengali', 'Spanish', 
      'French', 'German', 'Chinese', 'Japanese', 'Russian', 'Turkish', 
      'Korean', 'Portuguese', 'Arabic', 'Indonesian', 'Vietnamese', 'Other'
    ];

    // Validate event_language as array
    const languageArray = parseJSONSafely(event_language, []);
    if (languageArray.length > 0) {
      const invalidLanguages = languageArray.filter(lang => !validLanguages.includes(lang));
      if (invalidLanguages.length > 0) {
        return res.status(400).json({
          message: "Invalid event_language(s)",
          provided: invalidLanguages,
          validOptions: validLanguages
        });
      }
    }

    const validSeatingArrangements = ['seated', 'standing', 'seated and standing', 'other'];
    if (seating_arrangement && !validSeatingArrangements.includes(seating_arrangement)) {
      return res.status(400).json({
        message: "Invalid seating_arrangement",
        provided: seating_arrangement,
        validOptions: validSeatingArrangements
      });
    }

    const validDateTypes = ['one-day', 'multi-day', 'weekly'];
    if (!validDateTypes.includes(event_date_type)) {
      return res.status(400).json({
        message: "Invalid event_date_type",
        provided: event_date_type,
        validOptions: validDateTypes
      });
    }

    // Age validation
    const ageNum = Number(min_age_allowed);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 100) {
      return res.status(400).json({
        message: "Minimum age allowed must be between 0 and 100"
      });
    }

    // File validation - guest profile files must be images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const [index, file] of Object.entries(guestProfileFiles)) {
      const ext = '.' + file.originalname.toLowerCase().split('.').pop();
      if (!imageExtensions.includes(ext)) {
        return res.status(400).json({
          message: `Guest profile ${index} must be an image file (JPG, JPEG, PNG, GIF, WEBP)`
        });
      }
    }

    // File validation - event_rules must be document if uploaded
    if (eventRulesFiles.length > 0) {
      const docExtensions = ['.pdf', '.doc', '.docx'];
      const rulesFile = eventRulesFiles[0];
      const ext = '.' + rulesFile.originalname.toLowerCase().split('.').pop();
      if (!docExtensions.includes(ext)) {
        return res.status(400).json({
          message: "Event rules file must be a document (PDF, DOC, DOCX)"
        });
      }
    }

    // Process exact_map_location
    let mapLocation = {};
    if (exact_map_location) {
      try {
        mapLocation = typeof exact_map_location === 'string' 
          ? JSON.parse(exact_map_location) 
          : exact_map_location;
      } catch {
        mapLocation = {};
      }
    }

    // Process guests data with their profile images
    let processedGuests = [];
    if (guests) {
      const guestsArray = parseJSONSafely(guests, []);
      
      // Limit to maximum 10 guests
      if (guestsArray.length > 10) {
        return res.status(400).json({
          message: "Maximum 10 guests allowed"
        });
      }

      // Process each guest with their corresponding profile image
      processedGuests = guestsArray.map((guest, index) => {
        let guestData = {
          guest_name: '',
          guest_profile: '',
          guest_link: ''
        };

        if (typeof guest === 'string') {
          guestData.guest_name = guest;
        } else if (typeof guest === 'object' && guest !== null) {
          guestData = {
            guest_name: guest.guest_name || '',
            guest_profile: guest.guest_profile || '',
            guest_link: guest.guest_link || ''
          };
        }

        // Add uploaded profile image path if available
        if (guestProfileFiles[index]) {
          guestData.guest_profile = guestProfileFiles[index].path;
        }

        return guestData;
      });
    }

    // Create ticket data object
    const ticketData = {
      // Basic Information
      event_name: event_name.trim(),
      event_category: event_category.trim(),
      event_subcategory: event_subcategory?.trim() || '',
      event_type: event_type || 'public',
      event_language: languageArray,
      min_age_allowed: ageNum,
      seating_arrangement: seating_arrangement || 'other',
      kids_friendly: Boolean(kids_friendly === 'true' || kids_friendly === true),
      pet_friendly: Boolean(pet_friendly === 'true' || pet_friendly === true),
      
      // Location
      location: location.trim(),
      venue: venue.trim(),
      exact_map_location: mapLocation,
      
      // Date and Time
      event_date_type,
      start_date: start_date.trim(),
      end_date: end_date?.trim() || '',
      start_time: start_time.trim(),
      end_time: end_time?.trim() || '',
      gate_open_time: gate_open_time?.trim() || '',
      
      // Social Media and Rules
      event_instagram_link: event_instagram_link?.trim() || '',
      event_youtube_link: event_youtube_link?.trim() || '',
      hashtag: parseJSONSafely(hashtag, []),
      event_description: event_description.trim(),
      prohibited_items: parseJSONSafely(prohibited_items, []),
      
      // Guests and Contacts with profile images
      guests: processedGuests,
      POCS: parseJSONSafely(POCS, []),
      
      // System fields
      groupId,
      userId,
      event_status: 'pending',
      created_by: userId,
      updated_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
      
      // Form progress
      form_progress: {
        basic_info: true,
        media: false,
        pricing: false,
        additional_info: false
      }
    };

    // Handle event rules (text or file)
    if (eventRulesFiles.length > 0) {
      ticketData.event_rules = {
        type: 'file',
        path: eventRulesFiles[0].path,
        originalName: eventRulesFiles[0].originalname,
        mimeType: eventRulesFiles[0].mimetype,
        size: eventRulesFiles[0].size,
        uploadedAt: new Date()
      };
    } else if (event_rules_text && event_rules_text.trim()) {
      ticketData.event_rules = {
        type: 'text',
        content: event_rules_text.trim()
      };
    }

    // Create and save ticket
    const newTicket = new Ticket(ticketData);
    await newTicket.save();

    // Success response
    res.status(201).json({ 
      message: "Event created successfully", 
      ticket: newTicket,
      ticketId: newTicket._id,
      userId,
      groupId,
      formProgress: newTicket.form_progress,
      uploadedFiles: {
        guest_profiles: Object.keys(guestProfileFiles).length,
        event_rules: eventRulesFiles.length
      },
      processedGuests: processedGuests.length
    });

  } catch (error) {
    console.error("Error creating event:", error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "File size too large. Maximum 10MB allowed per file." 
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: "Too many files uploaded. Maximum limits: 10 guest profiles, 1 event rules file." 
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: "Unexpected file field. Only 'guest_profile_0' to 'guest_profile_9' and 'event_rules' are allowed." 
      });
    }

    // Handle file type errors
    if (error.message && (
      error.message.includes('Guest profile') ||
      error.message.includes('Event rules file must be a document') ||
      error.message.includes('Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed')
    )) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message
      });
    }

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Data type casting error. Check your data format.",
        error: error.message,
        field: error.path
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Event with similar details already exists"
      });
    }

    // Generic error response
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message
    });
  }
};
export const updateTicketMedia = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      uploadTicketMedia(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(err);
        }
        resolve();
      });
    });
    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
        ticketId: ticketId
      });
    }
    const uploadedFiles = req.files || {};
    const { event_logo = [], event_banner = [], event_images = [] } = uploadedFiles;
    // Check if at least one file is uploaded
    if (event_logo.length === 0 && event_banner.length === 0 && event_images.length === 0) {
      return res.status(400).json({ 
        message: "At least one file must be uploaded" 
      });
    }
    if (event_images.length > 10) {
      return res.status(400).json({ 
        message: "Maximum 10 files allowed for event images" 
      });
    }
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const videoCount = event_images.filter(file => {
      const ext = file.originalname.toLowerCase().split('.').pop();
      return videoExtensions.includes('.' + ext);
    }).length;

    if (videoCount > 1) {
      return res.status(400).json({ 
        message: "Maximum 1 video allowed in event images" 
      });
    }
    const userId = req.user._id || req.user.id;
    const updateData = {
      'form_progress.media': true,
      updated_by: userId,
      updated_at: new Date()
    };
    if (event_logo.length > 0) {
      updateData.event_logo = event_logo[0].path;
    }
    if (event_banner.length > 0) {
      updateData.event_banner = event_banner[0].path;
    }
    if (event_images.length > 0) {
      updateData.event_images = event_images.map(file => ({
        path: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));
    }
    // Find and update the ticket
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedTicket) {
      return res.status(404).json({ 
        message: "Ticket not found or unauthorized",
        ticketId: ticketId
      });
    }
    res.status(200).json({ 
      message: "Ticket media updated successfully", 
      ticket: updatedTicket,
      ticketId: ticketId,
      uploadedFiles: {
        event_logo: event_logo.length,
        event_banner: event_banner.length,
        event_images: event_images.length
      }
    });
  } catch (error) {
    console.error("Error updating ticket media:", error);
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "File size too large. Maximum 50MB allowed per file." 
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: "Too many files uploaded. Maximum limits: 1 logo, 1 banner, 10 event images." 
      });
    }

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Data type casting error. Check your schema definition for event_images field.",
        error: error.message,
        field: error.path
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error",
        error: error.message
      });
    }
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message
    });
  }
};
export const updateTicketAddOns = async (req, res) => {
  try {
    const { 
      ticketId,
      sub_events, 
      banking_details, 
      payment_type,
      hashtag 
    } = req.body;
    // Validate required parameters
    if (!ticketId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        required: ["ticketId"]
      });
    }
    const userId = req.user._id || req.user.id;
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        sub_events: sub_events || [],
        banking_details: banking_details || [],
        payment_type: payment_type || 'free',
        hashtag: hashtag || [],
        'form_progress.add_on_events': true,
        'form_progress.banking_tickets': true,
        updated_by: userId,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }

    res.status(200).json({ 
      message: "Ticket add-on events and banking details updated successfully", 
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error updating ticket add-ons:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const updateTicketDetails = async (req, res) => {
  try {
    const { 
      ticketId,
      ticket_types, 
      guests,
    } = req.body;

    // Validate required parameters
    if (!ticketId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        required: ["ticketId"]
      });
    }
    const userId = req.user._id || req.user.id;
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId},
      {
        ticket_types: ticket_types || [],
        guides: guides || [],
        'form_progress.banking_tickets': true,
        updated_by: userId,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }

    res.status(200).json({ 
      message: "Ticket details updated successfully", 
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error updating ticket details:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// Step 5: Update Ticket - Terms & Conditions (Company Provided)
export const updateTicketTerms = async (req, res) => {
  try {
    const { ticketId, terms_accepted, company_terms_version } = req.body;
    // Validate required parameters
    if (!ticketId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        required: ["ticketId"]
      });
    }
    if (!terms_accepted) {
      return res.status(400).json({ message: "Company terms and conditions must be accepted" });
    }
    const userId = req.user._id || req.user.id;
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId},
      {
        terms_accepted: true,
        terms_accepted_at: new Date(),
        company_terms_version: company_terms_version || '1.0',
        'form_progress.terms_conditions': true,
        updated_by: userId,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }

    res.status(200).json({ 
      message: "Company terms and conditions accepted successfully", 
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
    });
  } catch (error) {
    console.error("Error updating ticket terms:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// Step 6: Final Preview and Submit Ticket
export const submitTicket = async (req, res) => {
  try {
    const { ticketId } = req.body;
    // Validate required parameters
    if (!ticketId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        required: ["ticketId"]
      });
    }
    // Find ticket without populate since User model is in another service
    const ticket = await Ticket.findOne({ _id: ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }
    // Check if all form steps are completed
    const { form_progress } = ticket;
    const allStepsCompleted = Object.values(form_progress).every(step => step === true);
    if (!allStepsCompleted) {
      return res.status(400).json({ 
        message: "Please complete all form steps before submitting",
        form_progress 
      });
    }
    if (!ticket.terms_accepted) {
      return res.status(400).json({ message: "Company terms and conditions must be accepted" });
    }
    const userId = req.user._id || req.user.id;
    // Update ticket to confirmed status
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        event_status: 'confirmed',
        updated_by: userId,
        updated_at: new Date()
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
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId." 
      });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
export const viewTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    // Validate required parameters
    if (!userId || !groupId) {
      return res.status(400).json({
        message: "Missing required parameters",
        required: ["userId"]
      });
    }
    const tickets = await Ticket.find({ userId: userId }).sort({ createdAt: -1 });
    res.status(200).json({
      tickets,
      count: tickets.length,
      userId: userId,
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
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
        required: ["userId", "groupId"]
      });
    }
    const tickets = await Ticket.find({ userId: userId, groupId: groupId }).sort({ createdAt: -1 });
    res.status(200).json({
      tickets,
      count: tickets.length,
      userId: userId,
      groupId: groupId
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
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
        message: "Missing required parameter: ticketId in URL"
      });
    }
    const ticket = await Ticket.findOne({ 
      _id: ticketId,
      userId: userId 
    });
    if (!ticket || !userId) {
      return res.status(404).json({ 
        message: "Ticket not found or you don't have access to this ticket" 
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
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId." 
      });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
// Delete Ticket
export const deleteTicket = async (req, res) => {
  try {
    const { ticketId, groupId } = req.body;
    // Validate required parameters
    userId = req.user._id || req.user.id;
    if (!ticketId || !groupId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        required: ["ticketId", "groupId"]
      });
    }
    const deletedTicket = await Ticket.findOneAndDelete({ 
      _id: ticketId, 
      groupId: groupId,
      userId: userId
    });
    if (!deletedTicket) {
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }
    res.status(200).json({ 
      message: "Ticket deleted successfully",
      ticketId: ticketId,
      groupId: groupId
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

