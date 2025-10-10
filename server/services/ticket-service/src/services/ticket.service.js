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
      groupId: bodyGroupId
    } = req.body;
   

    // Get uploaded file
    const uploadedFiles = req.files || {};
    
    // Handle multiple guest profile uploads and event rules
    const guestProfileFiles = {};
    const eventRulesFiles = uploadedFiles.event_rules || [];

    const videoFiles = uploadedFiles.video_file || [];
    const previewImageFiles = uploadedFiles.preview_image || [];

    // Extract guest profile files (guest_profile_0, guest_profile_1, etc.)
    Object.keys(uploadedFiles).forEach(fieldName => {
      if (fieldName.startsWith('guest_profile_')) {
        const index = fieldName.split('_')[2]; // Extract index from guest_profile_X
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          guestProfileFiles[parseInt(index)] = uploadedFiles[fieldName][0]; // Take first file
        }
      }
      if (fieldName.startsWith('video_file_')) {
            const index = fieldName.split('_')[2];
            videoFiles[index] = uploadedFiles[fieldName][0];
        }
        if (fieldName.startsWith('preview_image_')) {
            const index = fieldName.split('_')[2];
            previewImageFiles[index] = uploadedFiles[fieldName][0];
        }
    });

    // Get IDs
    const groupId = req.params.groupId || bodyGroupId;
    const ticketId = req.params.ticketId;
    const userId = req.user?._id || req.user?.id;
    if (!groupId || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid group ID format. Please provide a valid MongoDB ObjectId.",
        groupId: groupId
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
      if (typeof event_dates === 'string') {
        try {
          // Clean the string first (remove any extra whitespace, newlines)
          const cleanedEventDates = event_dates.trim();
          eventDatesArray = JSON.parse(cleanedEventDates);
          
          // Ensure it's an array after parsing
          if (!Array.isArray(eventDatesArray)) {
            return res.status(400).json({
              message: "event_dates must be an array of date objects"
            });
          }
        } catch (error) {
          return res.status(400).json({
            message: "Invalid event_dates format. Must be valid JSON array string in multipart form.",
            error: error.message,
            received: typeof event_dates,
            sample_format: '[{"start_date":"2025-07-15","end_date":"2025-07-17","start_time":"18:00","end_time":"23:00"}]'
          });
        }
      } else if (Array.isArray(event_dates)) {
        eventDatesArray = event_dates;
      } else {
        return res.status(400).json({
          message: "event_dates must be a JSON array string (for multipart form) or array",
          received: typeof event_dates
        });
      }

      // Validate array is not empty
      if (!eventDatesArray || eventDatesArray.length === 0) {
        return res.status(400).json({
          message: "event_dates array cannot be empty"
        });
      }

      // Validate based on event_date_type
      if (event_date_type === 'one-day' && eventDatesArray.length > 1) {
        return res.status(400).json({
          message: "One-day events can only have one date entry"
        });
      }

      // Process and validate each date entry
      try {
        totalEventDates = eventDatesArray.map((eventDate, index) => {
          // Ensure eventDate is an object
          if (typeof eventDate !== 'object' || eventDate === null) {
            throw new Error(`Event date entry ${index + 1} must be an object`);
          }

          const { 
        start_date, 
        end_date, 
        start_time, 
        end_time,
        eventLink, // From OnlineDatePickerModal
        videoLink, // From RecoredDatePickerModal
        videoName, // From RecoredDatePickerModal
        verificationCode // From both Online and Recored Modals
    } = eventDate;

    if ((location_type === 'online' || location_type === 'recorded') && !eventLink && !videoLink) {
    throw new Error(`Event date entry ${index + 1}: event_link is required for online/recorded events`);
  }

          // Validate required start_date
          if (!start_date) {
            throw new Error(`Event date entry ${index + 1}: start_date is required`);
          }

          // Validate start_date
          validateDate(start_date, `Event date entry ${index + 1}: start_date`);

          // Validate end_date if provided, otherwise set to start_date
          let validatedEndDate = start_date; // Default to start_date
          if (end_date) {
            validateDate(end_date, `Event date entry ${index + 1}: end_date`);
            
            // Ensure end_date is not before start_date
            if (new Date(end_date) < new Date(start_date)) {
              throw new Error(`Event date entry ${index + 1}: end_date cannot be before start_date`);
            }
            validatedEndDate = end_date;
          }

          // Validate times if provided
          if (start_time) {
            validateTime(start_time, `Event date entry ${index + 1}: start_time`);
          }
          if (end_time) {
            validateTime(end_time, `Event date entry ${index + 1}: end_time`);
          }

          // Validate time logic
          if (start_time && end_time) {
            const startTimeMinutes = start_time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const endTimeMinutes = end_time.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            
            // If it's the same day, end_time should be after start_time
            if (start_date === validatedEndDate && endTimeMinutes <= startTimeMinutes) {
              throw new Error(`Event date entry ${index + 1}: end_time must be after start_time for same-day events`);
            }
          }
          const correspondingVideoFile = videoFiles[index];
          const correspondingPreviewImage = previewImageFiles[index];

          return {
            start_date: start_date.trim(),
            end_date: validatedEndDate.trim(),
            start_time: start_time ? start_time.trim() : '',
            end_time: end_time ? end_time.trim() : '',
            event_link: eventLink || videoLink || '', // Use eventLink for online, videoLink for recorded
        video_name: videoName || '',
        verification_event_code: verificationCode || '',
        video_file_path: correspondingVideoFile ? correspondingVideoFile.path : '',
        preview_image_path: correspondingPreviewImage ? correspondingPreviewImage.path : ''

          };
        });
      } catch (validationError) {
        return res.status(400).json({
          message: "Date validation error",
          error: validationError.message
        });
      }
    } else {
      return res.status(400).json({
        message: "event_dates is required"
      });
    }
    const normalizeString = (str) => {
      if (!str) return '';
      return str.toLowerCase().trim().replace(/\s+/g, ' ');
    };

    // Helper function to create date ranges for comparison
    const createDateRanges = (dates) => {
      return dates.map(date => ({
        start: new Date(`${date.start_date}T${date.start_time || '00:00'}:00`),
        end: new Date(`${date.end_date}T${date.end_time || '23:59'}:00`),
        date_string: `${date.start_date}_${date.end_date}_${date.start_time}_${date.end_time}`
      }));
    };

    // Helper function to check if date ranges overlap
    const doDateRangesOverlap = (range1, range2) => {
      return range1.start <= range2.end && range2.start <= range1.end;
    };

    // Create normalized event data for comparison
    const normalizedEventName = normalizeString(event_name);
    const normalizedLocation = normalizeString(location);
    const normalizedVenue = normalizeString(venue);
    // Already present - this is correct:


    const currentEventDateRanges = createDateRanges(totalEventDates);

    // Build duplicate check query based on location type
    let duplicateCheckQuery = {
      userId: userId,
      event_status: { $ne: 'cancelled' },
      $and: [
        {
          event_name: { 
            $regex: new RegExp(`^${normalizedEventName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') 
          }
        }
      ]
    };
    const eventLinksFromDates = totalEventDates.map(date => 
  (date.event_link || date.videoLink || '').toLowerCase().trim()
).filter(link => !!link);

if (eventLinksFromDates.length > 0) {
  duplicateCheckQuery.$and.push({
    location_type: { $in: ['online', 'recorded'] },
  event_link: { $in: eventLinksFromDates }
  });
}
    if (ticketId) {
      duplicateCheckQuery._id = { $ne: ticketId };
    }
    // Location-specific duplicate checks
    if (location_type === 'offline') {
      // For offline events: check location + venue combination
      duplicateCheckQuery.$and.push({
        location_type: 'offline',
        $or: [
          {
            // Exact location and venue match (case-insensitive)
            $and: [
              { location: { $regex: new RegExp(`^${normalizedLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
              { venue: { $regex: new RegExp(`^${normalizedVenue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
          },
          {
            // Same venue but different location description (still same physical location)
            venue: { $regex: new RegExp(`^${normalizedVenue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          }
        ]
      });
    } else if (location_type === 'online' || location_type === 'recorded') {
    // Safely parse the incoming event_link JSON string into an array
    const eventLinksFromDates = totalEventDates.map(date => 
    (date.event_link || date.videoLink || '').toLowerCase().trim()
  ).filter(link => !!link);

  if (eventLinksFromDates.length > 0) {
    duplicateCheckQuery.$and.push({
      location_type: { $in: ['online', 'recorded'] },
      event_link: { $in: eventLinksFromDates }
    });
  }
}

    // Find potentially duplicate events
    const existingEvents = await Ticket.find(duplicateCheckQuery).lean();

    // Check for date/time conflicts with existing events
    const conflictingEvents = [];
    
    for (const existingEvent of existingEvents) {
      if (!existingEvent.event_dates || existingEvent.event_dates.length === 0) continue;
      
      const existingEventDateRanges = createDateRanges(existingEvent.event_dates);
      
      // Check if any date ranges overlap
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
          location: location_type === 'offline' 
            ? `${existingEvent.location} - ${existingEvent.venue}`
  : existingEvent.event_dates?.map(date => date.event_link).filter(link => !!link).join(', ') || '',
          dates: existingEvent.event_dates,
          createdAt: existingEvent.created_at
        });
      }
    }

    // If conflicts found, return detailed error
    if (conflictingEvents.length > 0) {
      return res.status(409).json({
        message: "Duplicate event detected",
        error: "An event with the same name, location, and overlapping date/time already exists",
        conflictDetails: {
          attempted: {
            eventName: event_name,
            location: location_type === 'offline' 
              ? `${location} - ${venue}`
              : event_link,
            dates: totalEventDates,
            locationType: location_type
          },
          existing: conflictingEvents
        },
        suggestion: "Please check your existing events or modify the event name, location, or schedule to avoid conflicts."
      });
    }

    // Check for internal date conflicts within the current request
    const internalConflicts = [];
    for (let i = 0; i < currentEventDateRanges.length; i++) {
      for (let j = i + 1; j < currentEventDateRanges.length; j++) {
        if (doDateRangesOverlap(currentEventDateRanges[i], currentEventDateRanges[j])) {
          internalConflicts.push({
            conflict1: totalEventDates[i],
            conflict2: totalEventDates[j]
          });
        }
      }
    }

    if (internalConflicts.length > 0) {
      return res.status(400).json({
        message: "Date conflicts within the event",
        error: "Multiple date entries have overlapping times",
        conflicts: internalConflicts
      });
    }
    const baseRequiredFields = [
      { key: 'event_name', value: event_name },
      { key: 'event_category', value: event_category },
      { key: 'event_subcategory', value: event_subcategory },
      { key: 'event_type', value: event_type },
      { key: 'event_language', value: event_language },
      { key: 'location_type', value: location_type },
      { key: 'event_date_type', value: event_date_type },
      { key: 'event_dates', value: event_dates },
      { key: 'event_description', value: event_description },
      { key: 'groupId', value: groupId },
      { key: 'min_age_allowed', value: min_age_allowed },
      { key: 'userId', value: userId },
    ];

    // Location-type specific required fields
    let locationSpecificRequiredFields = [];
    
    if (location_type === 'offline') {
      locationSpecificRequiredFields = [
        { key: 'seating_arrangement', value: seating_arrangement },
        { key: 'location', value: location },
        { key: 'venue', value: venue },
        { key: 'exact_map_location', value: exact_map_location }
      ];
    } 

    // Combine all required fields
    const allRequiredFields = [...baseRequiredFields, ...locationSpecificRequiredFields];

    const missingFields = allRequiredFields
    .filter(({ value }) => !value || (Array.isArray(value) && value.length === 0))
    .map(({ key }) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: "Missing required fields",
        missingFields,
        requiredFields: allRequiredFields.map(({ key }) => key),
        note: location_type === 'offline' 
          ? "For offline events: seating_arrangement, location, venue, and exact_map_location are required"
          : location_type === 'online' || location_type === 'recorded'
          ? "For online/recorded events: event_link is required"
          : ""
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

    // Validate location_type
    const validLocationTypes = ['offline', 'online', 'recorded'];
    if (!validLocationTypes.includes(location_type)) {
      return res.status(400).json({
        message: "Invalid location_type",
        provided: location_type,
        validOptions: validLocationTypes
      });
    }

    // Validate seating_arrangement only for offline events
    if (location_type === 'offline') {
      const validSeatingArrangements = ['seated', 'standing', 'seated and standing', 'other'];
      if (seating_arrangement && !validSeatingArrangements.includes(seating_arrangement)) {
        return res.status(400).json({
          message: "Invalid seating_arrangement",
          provided: seating_arrangement,
          validOptions: validSeatingArrangements
        });
      }
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

    // Process exact_map_location only for offline events
    let mapLocation = {};
    if (location_type === 'offline' && exact_map_location) {
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
      if(guestsArray.length > 10) {
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

    // Create ticket data object with location-type specific fields
    let ticket;
    const ticketData = {
      event_name: event_name.trim(),
      event_category: event_category.trim(),
      event_subcategory: event_subcategory?.trim() || '',
      event_type: event_type || 'public',
      event_language: languageArray,
      min_age_allowed: ageNum,
      kids_friendly: Boolean(kids_friendly === 'true' || kids_friendly === true),
      pet_friendly: Boolean(pet_friendly === 'true' || pet_friendly === true),
      
      // Location
      location_type: location_type,
      
      // Date and Time - FIXED: Properly assign the processed dates
      event_date_type,
      event_dates: totalEventDates, // This now contains properly validated dates
      
      // Social Media and Rules
      event_instagram_link: event_instagram_link?.trim() || '',
      event_youtube_link: event_youtube_link?.trim() || '',
      hashtag: parseJSONSafely(hashtag, []),
      event_description: event_description.trim(),
      
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
    
    // Add location-type specific fields
    if (location_type === 'offline') {
      ticketData.seating_arrangement = seating_arrangement || 'other';
      ticketData.location = location.trim();
      ticketData.venue = venue.trim();
      ticketData.exact_map_location = mapLocation;
      ticketData.gate_open_time = gate_open_time?.trim() || '';
      ticketData.prohibited_items = parseJSONSafely(prohibited_items, []);
    } else if (location_type === 'online' || location_type === 'recorded') {
    // Parse the JSON string into an array of trimmed, valid links
    
    

    // For online/recorded events, these fields should not be set or should be null/empty
      ticketData.seating_arrangement = null;
      ticketData.location = '';
      ticketData.venue = '';
      ticketData.exact_map_location = {};
      ticketData.gate_open_time = '';
      ticketData.prohibited_items = [];
    }

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
      if (ticketId) {
        ticket = await Ticket.findById(ticketId);
        if (!ticket) {
          return res.status(404).json({ 
            message: "Ticket not found" 
          });
      }
      // Verify ownership
      if (ticket.userId.toString() !== userId.toString()) {
        return res.status(403).json({ 
          message: "You don't have permission to update this ticket" 
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
        event_rules: eventRulesFiles.length
      },
      processedGuests: processedGuests.length,
      eventDatesCount: totalEventDates.length,
      eventDates: totalEventDates, // Include the processed dates in response
      duplicationCheck: "Passed - No conflicts found"
    };

    // Add location-specific response information
    if (location_type === 'offline') {
      responseData.offline_fields = {
        seating_arrangement: ticket.seating_arrangement,
        location: ticket.location,
        venue: ticket.venue,
        has_map_location: Object.keys(ticket.exact_map_location || {}).length > 0
      };
    } else if (location_type === 'online' || location_type === 'recorded') {
      responseData.online_fields = {
  event_links: totalEventDates.map(date => date.event_link).filter(link => !!link), // array of links
  verification_codes: totalEventDates.map(date => date.verification_event_code).filter(code => !!code)
};

    }
    res.status(201).json(responseData);
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
    // Handle duplicate key errors from MongoDB level
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Event with similar details already exists at database level"
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
    // Enhanced logging for debugging
    console.log('Starting ticket media update process...');
    console.log('Request params:', req.params);
    console.log('User info:', { 
      role: req.user?.role, 
      organisation_type: req.user?.organisation_type,
      id: req.user?._id || req.user?.id 
    });

    await new Promise((resolve, reject) => {
      uploadTicketMedia(req, res, (err) => {
        if (err) {
          console.error("Multer error details:", {
            message: err.message,
            code: err.code,
            field: err.field,
            stack: err.stack
          });
          return reject(err);
        }
        resolve();
      });
    });

    console.log('Multer processing completed successfully');
    console.log('Uploaded files:', Object.keys(req.files || {}));

    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
        ticketId: ticketId
      });
    }

    const uploadedFiles = req.files || {};
    console.log('Processing uploaded files:', Object.keys(uploadedFiles));
    
    const { 
      event_logo = [], 
      event_banner = [], 
      event_images = [],
      college_authorisation = [] 
    } = uploadedFiles;

    // Log file counts for debugging
    console.log('File counts:', {
      event_logo: event_logo.length,
      event_banner: event_banner.length,
      event_images: event_images.length,
      college_authorisation: college_authorisation.length
    });

    // Get organization_type - Enhanced validation
    const userRole = req.user?.role;
    let organisation_type = null;
    
    if (userRole === 'organisation') {
      organisation_type = req.user?.organisation_type;
      console.log('Organization type detected:', organisation_type);
      
      // College authorization validation for educational organizations
      if (organisation_type && organisation_type.toLowerCase() === 'educational') {
        console.log('Educational organization detected, checking college authorization...');
        
        if (college_authorisation.length === 0) {
          console.error('Missing college authorization for educational organization');
          return res.status(400).json({
            message: "College authorization file is required for educational organizations",
            required_field: "college_authorisation",
            organization_type: organisation_type
          });
        }
        
        // Validate college authorization file type (should be document)
        const docExtensions = ['.pdf', '.doc', '.docx'];
        const authFile = college_authorisation[0];
        
        if (!authFile || !authFile.originalname) {
          return res.status(400).json({
            message: "Invalid college authorization file",
            error: "File missing or corrupted"
          });
        }
        
        const ext = '.' + authFile.originalname.toLowerCase().split('.').pop();
        console.log('College authorization file extension:', ext);
        
        if (!docExtensions.includes(ext)) {
          return res.status(400).json({
            message: "College authorization file must be a document (PDF, DOC, DOCX)",
            received_extension: ext,
            allowed_extensions: docExtensions
          });
        }
        
        console.log('College authorization validation passed');
      }
    } else {
      console.log('User role is not organization:', userRole);
    }
    const hasNewMediaFiles = event_logo.length > 0 || event_banner.length > 0 || event_images.length > 0;
    const hasNewCollegeAuth = college_authorisation.length > 0;
    if (!hasNewMediaFiles && !hasNewCollegeAuth) {
      const existingTicket = await Ticket.findById(ticketId);
      if (!existingTicket) {
        return res.status(404).json({ 
          message: "Ticket not found",
          ticketId: ticketId
        });
      }
      if (!existingTicket.event_banner) {
        return res.status(400).json({ 
          message: "Event banner is required to proceed",
          uploaded_files: {
            event_logo: event_logo.length,
            event_banner: event_banner.length,
            event_images: event_images.length
          }
        });
      }
      if (organisation_type && organisation_type.toLowerCase() === 'educational' && 
          !existingTicket.college_authorisation) {
        console.error('College authorization is required for educational organizations but not found');
        return res.status(400).json({ 
          message: "College authorization file is required for educational organizations",
          required_field: "college_authorisation",
          organization_type: organisation_type
        });
      }
      
      console.log('Existing media found and validated, updating progress only');
      const updateData = {
        'form_progress.media': true,
        updated_by: userId,
        updated_at: new Date()
      };
      
      // If only college auth is being added to existing media
      if (hasNewCollegeAuth) {
        updateData.college_authorisation = college_authorisation[0].path;
        console.log('Adding college authorization to existing media:', college_authorisation[0].path);
      }
      
      const updatedTicket = await Ticket.findOneAndUpdate(
        { _id: ticketId },
        updateData,
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({ 
        message: hasNewCollegeAuth ? "College authorization added successfully" : "Media step completed (no new files uploaded)", 
        ticket: updatedTicket,
        ticketId: ticketId,
        note: "Existing media retained"
      });
    }    
    if (event_images.length > 10) {
      return res.status(400).json({ 
        message: "Maximum 10 files allowed for event images",
        uploaded_count: event_images.length,
        max_allowed: 10
      });
    }

    // Validate video count in event images
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const videoCount = event_images.filter(file => {
      if (!file.originalname) return false;
      const ext = '.' + file.originalname.toLowerCase().split('.').pop();
      return videoExtensions.includes(ext);
    }).length;

    if (videoCount > 1) {
      return res.status(400).json({ 
        message: "Maximum 1 video allowed in event images",
        video_count: videoCount,
        max_videos_allowed: 1
      });
    }

    console.log('All validations passed, preparing update data...');

    const userId = req.user._id || req.user.id;
    const updateData = {
      'form_progress.media': true,
      updated_by: userId,
      updated_at: new Date()
    };

    // Process uploaded files
    if (event_logo.length > 0) {
      updateData.event_logo = event_logo[0].path;
      console.log('Event logo updated:', event_logo[0].path);
    }

    if (event_banner.length > 0) {
      updateData.event_banner = event_banner[0].path;
      console.log('Event banner updated:', event_banner[0].path);
    }

    if (event_images.length > 0) {
      updateData.event_images = event_images.map(file => ({
        path: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));
      console.log('Event images updated:', event_images.length, 'files');
    }

    // Add college authorization file if uploaded
    if (college_authorisation.length > 0) {
      updateData.college_authorisation = college_authorisation[0].path;
      console.log('College authorization updated:', college_authorisation[0].path);
    }

    console.log('Updating ticket in database...');

    // Find and update the ticket
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTicket) {
      console.error('Ticket not found:', ticketId);
      return res.status(404).json({ 
        message: "Ticket not found or unauthorized",
        ticketId: ticketId
      });
    }

    console.log('Ticket updated successfully');

    res.status(200).json({ 
      message: "Ticket media updated successfully", 
      ticket: updatedTicket,
      ticketId: ticketId,
      uploadedFiles: {
        event_logo: event_logo.length,
        event_banner: event_banner.length,
        event_images: event_images.length,
        college_authorisation: college_authorisation.length > 0 ? college_authorisation.length : 'Not applicable'
      },
      organisationType: organisation_type || 'Not specified',
      videoCount: videoCount
    });

  } catch (error) {
    console.error("Error updating ticket media:", error);
    
    // Enhanced error handling with more specific responses
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "File size too large. Maximum 50MB allowed per file.",
        error_code: 'FILE_TOO_LARGE',
        max_size: '50MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: "Too many files uploaded. Maximum limits: 1 logo, 1 banner, 10 event images, 1 college authorization.",
        error_code: 'TOO_MANY_FILES'
      });
    }

    // Handle file type validation errors from multer
    if (error.message && (
      error.message.includes('Only images') || 
      error.message.includes('must be a document') ||
      error.message.includes('must be an image file')
    )) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message,
        error_code: 'INVALID_FILE_TYPE'
      });
    }

    // Handle multer field errors
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: "Unexpected file field",
        error: `Unexpected field: ${error.field}`,
        error_code: 'UNEXPECTED_FIELD'
      });
    }

    // Handle specific validation errors
    if (error.message && error.message.includes('College authorization file must be a document')) {
      return res.status(400).json({
        message: "Invalid college authorization file type",
        error: error.message,
        error_code: 'INVALID_COLLEGE_AUTH_TYPE'
      });
    }

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Data type casting error. Check your schema definition for event_images field.",
        error: error.message,
        field: error.path,
        error_code: 'CAST_ERROR'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error",
        error: error.message,
        error_code: 'VALIDATION_ERROR'
      });
    }

    // Handle database connection errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        message: "Database error occurred",
        error_code: 'DATABASE_ERROR'
      });
    }

    // Generic server error
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      error_code: 'INTERNAL_ERROR',
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
export const updateTicketAddOns = async (req, res) => {
  const ticketId = req.params.ticketId;
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      ticketId: ticketId
    });
  }
  // Add the missing parseJSONSafely utility function
  const parseJSONSafely = (str, defaultValue = []) => {
    try {
      if (typeof str === 'string') {
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
    // Enhanced sub_event data parsing with fallback logic
    let subEventData;

    try {
      // First, try to parse from req.body.sub_event (expected format)
      if (req.body.sub_event) {
        subEventData = typeof req.body.sub_event === 'string' 
          ? JSON.parse(req.body.sub_event) 
          : req.body.sub_event;
      } 
      // Fallback: If sub_event is not provided, try to use the entire req.body
      else if (req.body.event_name || req.body.event_category || req.body.location_type) {
        // Data is sent directly in req.body (not wrapped in sub_event)
        subEventData = req.body;
      }
      // Another fallback: Check for common variations
      else if (req.body.subevent || req.body.subEvent) {
        const subEventField = req.body.subevent || req.body.subEvent;
        subEventData = typeof subEventField === 'string' 
          ? JSON.parse(subEventField) 
          : subEventField;
      }
      // Last fallback: Check if data is stringified in the entire body
      else if (typeof req.body === 'string') {
        const parsedBody = JSON.parse(req.body);
        subEventData = parsedBody.sub_event || parsedBody;
      }

    } catch (parseError) {
      console.error("Error parsing sub_event data:", parseError);
      return res.status(400).json({ 
        message: "Invalid sub_event data format",
        error: parseError.message,
        hint: "Make sure your data is properly formatted JSON",
        receivedFields: Object.keys(req.body)
      });
    }

    // Enhanced validation with better error messages
    if (!subEventData) {
      return res.status(400).json({ 
        message: "sub_event data is required",
        receivedFields: Object.keys(req.body),
        expectedFormat: "Send data in 'sub_event' field or include event fields directly in request body",
        hint: "Required fields include: event_name, event_category, location_type, etc."
      });
    }

    // Additional validation to ensure it's an object
    if (typeof subEventData !== 'object' || Array.isArray(subEventData)) {
      return res.status(400).json({
        message: "sub_event data must be an object",
        receivedType: Array.isArray(subEventData) ? 'array' : typeof subEventData,
        hint: "Send data as a JSON object with event fields"
      });
    }
    const baseRequiredFields = [
      { key: 'event_name', value: subEventData.event_name },
      { key: 'event_category', value: subEventData.event_category },
      { key: 'event_subcategory', value: subEventData.event_subcategory },
      { key: 'event_type', value: subEventData.event_type },
      { key: 'event_language', value: subEventData.event_language },
      { key: 'location_type', value: subEventData.location_type },
      { key: 'event_dates', value: subEventData.event_dates },
      { key: 'min_age_allowed', value: subEventData.min_age_allowed },
      { key: 'event_description', value: subEventData.event_description },
      { key: 'payment_type', value: subEventData.payment_type },
      { key: 'POCS', value: subEventData.POCS },
      { key: 'hashtag', value: subEventData.hashtag },
      { key: 'total_capacity', value: subEventData.total_capacity },
      { key: 'booking_start_date', value: subEventData.booking_start_date },
    ];
    let locationSpecificRequiredFields = [];
    if (subEventData.location_type === 'offline') {
      locationSpecificRequiredFields = [
        { key: 'location', value: subEventData.location },
        { key: 'venue', value: subEventData.venue },
        { key: 'seating_arrangement', value: subEventData.seating_arrangement }
      ];
    } else if (subEventData.location_type === 'online' || subEventData.location_type === 'recorded') {
      locationSpecificRequiredFields = [
        { key: 'event_link', value: subEventData.event_link }
      ];
    }

    // Combine all required fields
    const allRequiredFields = [...baseRequiredFields, ...locationSpecificRequiredFields];

    const missingFields = allRequiredFields
      .filter(({ value }) => !value)
      .map(({ key }) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        missingFields: missingFields,
        note: subEventData.location_type === 'offline' 
          ? "For offline events: location, venue, and seating_arrangement are required"
          : subEventData.location_type === 'online' || subEventData.location_type === 'recorded'
          ? "For online/recorded events: event_link is required"
          : ""
      });
    }
    // Parse nested arrays from request body early for duplication check
    const parseNestedData = (data, fieldName) => {
      if (!data) return [];
      try {
        if (typeof data === 'string') {
          return JSON.parse(data);
        }
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        console.warn(`Error parsing ${fieldName}:`, error);
        return [];
      }
    };

    const eventDates = parseNestedData(subEventData.event_dates || req.body.event_dates, 'event_dates');

    // DUPLICATION CHECK - Check for existing sub-events with same details
    if (existingTicket.sub_events && existingTicket.sub_events.length > 0) {
      const newEventName = String(subEventData.event_name).trim().toLowerCase();
      const newLocation = subEventData.location_type === 'offline' 
        ? String(subEventData.location || '').trim().toLowerCase() 
        : String(subEventData.event_link || '').trim().toLowerCase();
      const newVenue = subEventData.location_type === 'offline' 
        ? String(subEventData.venue || '').trim().toLowerCase() 
        : '';

      // Check each new event date against existing sub-events
      for (const newEventDate of eventDates) {
        const newStartDate = newEventDate.start_date;
        const newStartTime = newEventDate.start_time;
        const newEndTime = newEventDate.end_time;
        // Find duplicate sub-events
        const duplicateSubEvent = existingTicket.sub_events.find(existingSubEvent => {
          // Check if event names match (case-insensitive)
          const existingEventName = String(existingSubEvent.event_name || '').trim().toLowerCase();
          if (existingEventName !== newEventName) {
            return false;
          }

          // Check location based on location_type
          let locationMatches = false;
          if (subEventData.location_type === 'offline') {
            const existingLocation = String(existingSubEvent.location || '').trim().toLowerCase();
            const existingVenue = String(existingSubEvent.venue || '').trim().toLowerCase();
            locationMatches = (existingLocation === newLocation && existingVenue === newVenue);
          } else if (subEventData.location_type === 'online' || subEventData.location_type === 'recorded') {
            const existingEventLink = String(existingSubEvent.event_link || '').trim().toLowerCase();
            locationMatches = (existingEventLink === newLocation);
          }

          if (!locationMatches) {
            return false;
          }

          // Check if any event date matches
          if (existingSubEvent.event_dates && existingSubEvent.event_dates.length > 0) {
            return existingSubEvent.event_dates.some(existingDate => {
              return (
                existingDate.start_date === newStartDate &&
                existingDate.start_time === newStartTime &&
                existingDate.end_time === newEndTime
              );
            });
          }

          return false;
        });

        if (duplicateSubEvent) {
          return res.status(409).json({
            message: "Duplicate sub-event detected",
            error: "A sub-event with the same event name, location, date, and time already exists",
            conflictDetails: {
              event_name: subEventData.event_name,
              location_type: subEventData.location_type,
              location: subEventData.location_type === 'offline' ? subEventData.location : subEventData.event_link,
              venue: subEventData.location_type === 'offline' ? subEventData.venue : null,
              conflicting_date: {
                start_date: newStartDate,
                start_time: newStartTime,
                end_time: newEndTime
              }
            },
            hint: "Please modify the event name, location, or schedule to avoid conflicts"
          });
        }
      }
    }

    // Validate enum fields
    const validEventTypes = ['private', 'public'];
    if (!validEventTypes.includes(subEventData.event_type)) {
      return res.status(400).json({
        message: "Invalid event_type",
        provided: subEventData.event_type,
        validOptions: validEventTypes
      });
    }

    const validLanguages = [
      'English', 'Hindi', 'Malayalam', 'Tamil', 'Kannada', 'Telugu', 
      'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Bengali', 'Spanish', 
      'French', 'German', 'Chinese', 'Japanese', 'Russian', 'Turkish', 
      'Korean', 'Portuguese', 'Arabic', 'Indonesian', 'Vietnamese', 'Other'
    ];

    // Parse and validate event_language as array
    const languageArray = parseJSONSafely(subEventData.event_language, []);
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

    const validLocationTypes = ['offline', 'online', 'recorded'];
    if (!validLocationTypes.includes(subEventData.location_type)) {
      return res.status(400).json({
        message: "Invalid location_type",
        provided: subEventData.location_type,
        validOptions: validLocationTypes
      });
    }

    // Validate seating_arrangement only for offline events
    if (subEventData.location_type === 'offline' && subEventData.seating_arrangement) {
      const validSeatingArrangements = ['seated', 'standing', 'seated and standing', 'other'];
      if (!validSeatingArrangements.includes(subEventData.seating_arrangement)) {
        return res.status(400).json({
          message: "Invalid seating_arrangement",
          provided: subEventData.seating_arrangement,
          validOptions: validSeatingArrangements
        });
      }
    }

    const validPaymentTypes = ['free', 'paid'];
    if (!validPaymentTypes.includes(subEventData.payment_type)) {
      return res.status(400).json({
        message: "Invalid payment_type",
        provided: subEventData.payment_type,
        validOptions: validPaymentTypes
      });
    }

    // Age validation
    const ageNum = Number(subEventData.min_age_allowed);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 100) {
      return res.status(400).json({
        message: "Minimum age allowed must be between 0 and 100"
      });
    }

    // Process uploaded files - Fixed file handling logic
    const processedFiles = {};
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const docExtensions = ['.pdf', '.doc', '.docx'];
    
    // Get uploaded files - Fix the file processing logic
    const uploadedFiles = req.files || {};
    
    // Handle guest profile uploads (guest_profile_0, guest_profile_1, etc.)
    const guestProfileFiles = {};
    
    // Handle ticket photo uploads (ticket_photo_0, ticket_photo_1, etc.) for offline events
    const ticketPhotoFiles = {};
    
    // Extract guest profile files and ticket photo files from uploaded files
    Object.keys(uploadedFiles).forEach(fieldName => {
      // Handle guest profile files
      if (fieldName.startsWith('guest_profile_')) {
        const index = fieldName.split('_')[2]; // Extract index from guest_profile_X
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const profileFile = uploadedFiles[fieldName][0]; // Take first file
          const ext = '.' + profileFile.originalname.toLowerCase().split('.').pop();
          if (!imageExtensions.includes(ext)) {
            throw new Error(`Guest profile ${index} must be an image file (JPG, JPEG, PNG, GIF, WEBP)`);
          }
          guestProfileFiles[parseInt(index)] = profileFile;
        }
      }
      
      // Handle ticket photo files (only for offline events)
      if (fieldName.startsWith('ticket_photo_')) {
        const index = fieldName.split('_')[2]; // Extract index from ticket_photo_X
        if (!isNaN(index) && parseInt(index) >= 0) {
          const ticketPhotoFile = uploadedFiles[fieldName][0]; // Take first file
          const ext = '.' + ticketPhotoFile.originalname.toLowerCase().split('.').pop();
          if (!imageExtensions.includes(ext)) {
            throw new Error(`Ticket photo ${index} must be an image file (JPG, JPEG, PNG, GIF, WEBP)`);
          }
          ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
        }
      }
    });
    
    if (uploadedFiles) {
      // Handle event banner (required)
      if (uploadedFiles.event_banner && uploadedFiles.event_banner[0]) {
        const bannerFile = uploadedFiles.event_banner[0];
        const ext = '.' + bannerFile.originalname.toLowerCase().split('.').pop();
        if (!imageExtensions.includes(ext)) {
          return res.status(400).json({
            message: "Event banner must be an image file (JPG, JPEG, PNG, GIF, WEBP)"
          });
        }
        processedFiles.event_banner = bannerFile.path;
      }
      
      // Handle event images (max 10)
      if (uploadedFiles.event_images && uploadedFiles.event_images.length > 0) {
        if (uploadedFiles.event_images.length > 10) {
          return res.status(400).json({
            message: "Maximum 10 event images allowed"
          });
        }
        
        // Validate each image file
        for (const imageFile of uploadedFiles.event_images) {
          const ext = '.' + imageFile.originalname.toLowerCase().split('.').pop();
          if (!imageExtensions.includes(ext)) {
            return res.status(400).json({
              message: `Event image '${imageFile.originalname}' must be an image file (JPG, JPEG, PNG, GIF, WEBP)`
            });
          }
        }
        
        processedFiles.event_images = uploadedFiles.event_images.map(file => ({
          path: file.path,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        }));
      }
      
      // Handle event rules file
      if (uploadedFiles.event_rules && uploadedFiles.event_rules[0]) {
        const rulesFile = uploadedFiles.event_rules[0];
        const ext = '.' + rulesFile.originalname.toLowerCase().split('.').pop();
        if (!docExtensions.includes(ext)) {
          return res.status(400).json({
            message: "Event rules file must be a document (PDF, DOC, DOCX)"
          });
        }
        
        processedFiles.event_rules = {
          type: 'file',
          path: rulesFile.path,
          originalName: rulesFile.originalname,
          mimeType: rulesFile.mimetype,
          size: rulesFile.size,
          uploadedAt: new Date()
        };
      }

      // Handle ticket layout (only for offline events)
      if (uploadedFiles.ticket_layout && uploadedFiles.ticket_layout[0] && subEventData.location_type === 'offline') {
        const layoutFile = uploadedFiles.ticket_layout[0];
        const ext = '.' + layoutFile.originalname.toLowerCase().split('.').pop();
        if (!imageExtensions.includes(ext)) {
          return res.status(400).json({
            message: "Ticket layout must be an image file (JPG, JPEG, PNG, GIF, WEBP)"
          });
        }
        processedFiles.ticket_layout = layoutFile.path;
      }

      // Handle event logo (if provided)
      if (uploadedFiles.event_logo && uploadedFiles.event_logo[0]) {
        const logoFile = uploadedFiles.event_logo[0];
        const ext = '.' + logoFile.originalname.toLowerCase().split('.').pop();
        if (!imageExtensions.includes(ext)) {
          return res.status(400).json({
            message: "Event logo must be an image file (JPG, JPEG, PNG, GIF, WEBP)"
          });
        }
        processedFiles.event_logo = logoFile.path;
      }
      
      // Store the processed file objects
      processedFiles.guestProfileFiles = guestProfileFiles;
      processedFiles.ticketPhotoFiles = ticketPhotoFiles;
    }

    // Validate required event banner
    if (!processedFiles.event_banner) {
      return res.status(400).json({
        message: "Event banner is required for sub-events"
      });
    }

    // Parse complex nested data structures
    const guests = parseNestedData(subEventData.guests || req.body.guests, 'guests');
    const bankingDetails = parseNestedData(subEventData.banking_details || req.body.banking_details, 'banking_details');
    const POCS = parseNestedData(subEventData.POCS || req.body.POCS, 'POCS');
    const ticketTypes = parseNestedData(subEventData.ticket_types || req.body.ticket_types, 'ticket_types');

    // Process guests with profile images
    let processedGuests = [];
    if (guests && guests.length > 0) {
      // Limit to maximum 10 guests
      if (guests.length > 10) {
        return res.status(400).json({
          message: "Maximum 10 guests allowed"
        });
      }

      processedGuests = guests.map((guest, index) => {
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

    // Process ticket types with photos (only for offline events)
    let processedTicketTypes = [];
    if (subEventData.location_type === 'offline' && ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
        // Validate required fields for each ticket type
        const requiredTicketFields = ['ticket_type', 'ticket_price', 'max_capacity'];
        const missingTicketFields = requiredTicketFields.filter(field => !ticket[field] && ticket[field] !== 0);
        
        if (missingTicketFields.length > 0) {
          throw new Error(`Missing required fields for ticket type ${index + 1}: ${missingTicketFields.join(', ')}`);
        }

        // Validate ticket price and capacity
        const ticketPrice = Number(ticket.ticket_price);
        const maxCapacity = Number(ticket.max_capacity);

        if (isNaN(ticketPrice) || ticketPrice < 0) {
          throw new Error(`Invalid ticket price for ticket type ${index + 1}. Must be a non-negative number.`);
        }

        if (isNaN(maxCapacity) || maxCapacity <= 0) {
          throw new Error(`Invalid max capacity for ticket type ${index + 1}. Must be a positive number.`);
        }

        const ticketData = {
          ticket_type: ticket.ticket_type.trim(),
          ticket_price: ticketPrice,
          max_capacity: maxCapacity,
          ticket_photo: ticket.ticket_photo || '' // existing photo URL if any
        };
        
        // Add uploaded ticket photo if available
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path;
        }
        
        return ticketData;
      });
    }

    // Parse exact map location (only for offline events)
    let exactMapLocation = {};
    if (subEventData.location_type === 'offline' && subEventData.exact_map_location) {
      try {
        exactMapLocation = typeof subEventData.exact_map_location === 'string' 
          ? JSON.parse(subEventData.exact_map_location)
          : subEventData.exact_map_location;
      } catch (error) {
        console.warn('Error parsing exact_map_location:', error);
      }
    }

    // Create new sub-event object with proper field validation and types
    const newSubEvent = {
      // Basic required fields - ensure proper types
      event_name: String(subEventData.event_name).trim(),
      event_category: String(subEventData.event_category).trim(),
      event_subcategory: subEventData.event_subcategory ? String(subEventData.event_subcategory).trim() : '',
      event_type: String(subEventData.event_type),
      location_type: String(subEventData.location_type),
      min_age_allowed: Number(ageNum),
      event_description: String(subEventData.event_description).trim(),
      payment_type: String(subEventData.payment_type),

      // Boolean fields - ensure proper boolean conversion
      kids_friendly: Boolean(subEventData.kids_friendly === 'true' || subEventData.kids_friendly === true),
      pet_friendly: Boolean(subEventData.pet_friendly === 'true' || subEventData.pet_friendly === true),
      
      // Optional string fields
      event_date_type: subEventData.event_date_type ? String(subEventData.event_date_type) : '',
      event_instagram_link: subEventData.event_instagram_link ? String(subEventData.event_instagram_link).trim() : '',
      event_youtube_link: subEventData.event_youtube_link ? String(subEventData.event_youtube_link).trim() : '',
      event_status: 'pending',
      subevent: '5',
      // Arrays - ensure they are proper arrays
      event_language: Array.isArray(languageArray) ? languageArray.map(lang => String(lang)) : [],
      hashtag: Array.isArray(parseJSONSafely(subEventData.hashtag, [])) ? 
        parseJSONSafely(subEventData.hashtag, []).map(tag => String(tag)) : [],
      total_capacity: Number(subEventData.total_capacity) ?  String(subEventData.total_capacity) : '',
      booking_start_date: String(subEventData.booking_start_date) ? String(subEventData.booking_start_date).trim() : '',
      booking_end_date: String(subEventData.booking_end_date) ? String(subEventData.booking_end_date).trim() : '',
      // Complex nested objects - validate structure
      guests: processedGuests.map(guest => ({
        guest_name: String(guest.guest_name || ''),
        guest_profile: String(guest.guest_profile || ''),
        guest_link: String(guest.guest_link || '')
      })),

      banking_details: bankingDetails.map(banking => ({
        bank_acc_type: String(banking.bank_acc_type || ''),
        bank_acc_no: String(banking.bank_acc_no || ''),
        bank_ifsc: String(banking.bank_ifsc || ''),
        bank_acc_holder: String(banking.bank_acc_holder || '')
      })),

      POCS: POCS.map(poc => ({
        POC_name: String(poc.POC_name || ''),
        POC_email: String(poc.POC_email || ''),
        POC_contact: String(poc.POC_contact || '')
      })),

      event_dates: eventDates.map(date => ({
        start_date: String(date.start_date || ''),
        end_date: String(date.end_date || ''),
        start_time: String(date.start_time || ''),
        end_time: String(date.end_time || '')
      })),

      // File uploads - ensure proper string paths
      event_banner: String(processedFiles.event_banner || ''),
      event_logo: String(processedFiles.event_logo || ''),
      
      // Array of image objects
      event_images: (processedFiles.event_images || []).map(img => ({
        path: String(img.path),
        originalName: String(img.originalName),
        mimeType: String(img.mimeType),
        size: Number(img.size),
        uploadedAt: new Date(img.uploadedAt)
      }))
    };

    // Add location-type specific fields with proper validation
    if (subEventData.location_type === 'offline') {
      // Offline-specific fields
      newSubEvent.seating_arrangement = String(subEventData.seating_arrangement || 'none');
      newSubEvent.location = String(subEventData.location || '').trim();
      newSubEvent.venue = String(subEventData.venue || '').trim();
      
      // Ensure exact_map_location is a proper object
      newSubEvent.exact_map_location = {
        latitude: exactMapLocation.latitude ? Number(exactMapLocation.latitude) : undefined,
        longitude: exactMapLocation.longitude ? Number(exactMapLocation.longitude) : undefined,
        address: exactMapLocation.address ? String(exactMapLocation.address) : ''
      };
      newSubEvent.gate_open_time = String(subEventData.gate_open_time || '').trim();
      // Ensure prohibited_items is an array of strings
      newSubEvent.prohibited_items = Array.isArray(parseJSONSafely(subEventData.prohibited_items, [])) ?
        parseJSONSafely(subEventData.prohibited_items, []).map(item => String(item)) : [];
      
      // Process ticket types with proper validation
      newSubEvent.ticket_types = processedTicketTypes.map(ticket => ({
        ticket_type: String(ticket.ticket_type),
        ticket_price: Number(ticket.ticket_price),
        max_capacity: Number(ticket.max_capacity),
        ticket_photo: String(ticket.ticket_photo || '')
      }));
      newSubEvent.ticket_layout = String(processedFiles.ticket_layout || '');
    } else if (subEventData.location_type === 'online' || subEventData.location_type === 'recorded') {
      // Online/recorded-specific fields
      newSubEvent.event_link = String(subEventData.event_link || '').trim();
      newSubEvent.verification_event_code = String(subEventData.verification_event_code || '').trim();
      // Explicitly set offline fields to appropriate values
      newSubEvent.seating_arrangement = undefined;
      newSubEvent.location = undefined;
      newSubEvent.venue = undefined;
      newSubEvent.exact_map_location = {
        latitude: undefined,
        longitude: undefined,
        address: undefined
      };
      newSubEvent.gate_open_time = undefined;
      newSubEvent.prohibited_items = [];
      newSubEvent.ticket_types = [];
      newSubEvent.ticket_layout = undefined;
    }

    // Handle event_rules with proper structure
    if (processedFiles.event_rules) {
      newSubEvent.event_rules = {
        type: 'file',
        path: String(processedFiles.event_rules.path),
        originalName: String(processedFiles.event_rules.originalName),
        mimeType: String(processedFiles.event_rules.mimeType),
        size: Number(processedFiles.event_rules.size),
        uploadedAt: new Date(processedFiles.event_rules.uploadedAt)
      };
    } else if (subEventData.event_rules_text && String(subEventData.event_rules_text).trim()) {
      newSubEvent.event_rules = {
        type: 'text',
        content: String(subEventData.event_rules_text).trim(),
        uploadedAt: new Date()
      };
    } else {
      // Set default event_rules structure
      newSubEvent.event_rules = {
        type: 'text',
        content: '',
        uploadedAt: new Date()
      };
    }

    // Additional validation - check for required nested arrays
    if (!Array.isArray(newSubEvent.event_dates) || newSubEvent.event_dates.length === 0) {
      return res.status(400).json({
        message: "At least one event date is required",
        hint: "Provide event_dates as an array with start_date, end_date, start_time, end_time"
      });
    }

    if (!Array.isArray(newSubEvent.POCS) || newSubEvent.POCS.length === 0) {
      return res.status(400).json({
        message: "At least one Point of Contact (POC) is required",
        hint: "Provide POCS as an array with POC_name, POC_email, POC_contact"
      });
    }

    console.log('=== SUB-EVENT VALIDATION ===');
    console.log('Event name:', newSubEvent.event_name);
    console.log('Location type:', newSubEvent.location_type);
    console.log('Event dates count:', newSubEvent.event_dates.length);
    console.log('Guests count:', newSubEvent.guests.length);
    console.log('POCS count:', newSubEvent.POCS.length);
    console.log('=== DUPLICATION CHECK PASSED ===');

    // Now safely update the ticket
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        $push: { sub_events: newSubEvent },
        'form_progress.add_on_events': true,
        updated_by: userId,
        updated_at: new Date()
      },
      { 
        new: true,
        runValidators: true,
        upsert: false
      }
    );

    if (!updatedTicket) {
      return res.status(404).json({ 
        message: "Failed to update ticket with sub-event",
        hint: "Ticket not found or update failed"
      });
    }

    // Prepare response data with location-type specific information
    const responseData = {
      message: "Sub-event added successfully to ticket", 
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
      addedSubEvent: newSubEvent,
      totalSubEvents: updatedTicket.sub_events.length,
      location_type: subEventData.location_type,
      duplicationCheck: {
        performed: true,
        status: "passed",
        message: "No duplicate sub-events found"
      },
      uploadedFiles: {
        event_banner: processedFiles.event_banner ? 1 : 0,
        event_logo: processedFiles.event_logo ? 1 : 0,
        event_images: processedFiles.event_images ? processedFiles.event_images.length : 0,
        guest_profiles: Object.keys(guestProfileFiles).length,
        ticket_photos: Object.keys(ticketPhotoFiles).length,
        event_rules: processedFiles.event_rules ? 1 : 0,
        ticket_layout: processedFiles.ticket_layout ? 1 : 0
      },
      processedGuests: processedGuests.length,
      eventDatesCount: eventDates.length
    };

    // Add location-specific response information
    if (subEventData.location_type === 'offline') {
      responseData.offline_fields = {
        seating_arrangement: newSubEvent.seating_arrangement,
        location: newSubEvent.location,
        venue: newSubEvent.venue,
        has_map_location: Object.keys(newSubEvent.exact_map_location || {}).length > 0,
        ticket_types: processedTicketTypes.length,
        ticket_layout: newSubEvent.ticket_layout ? 1 : 0
      };
    } else if (subEventData.location_type === 'online' || subEventData.location_type === 'recorded') {
      responseData.online_fields = {
        event_link: newSubEvent.event_link,
        verification_code: newSubEvent.verification_event_code || 'Not provided'
      };
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error updating ticket add-ons:", error);
    
    // Enhanced multer error handling with dynamic field information
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "File size too large. Maximum 50MB allowed per file." 
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: "Too many files uploaded. Maximum limits exceeded." 
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      // Get the actual allowed fields from your middleware configuration
      const allowedFields = [
        'event_banner', 'event_logo', 'event_images',
        ...Array.from({ length: 10 }, (_, i) => `guest_profile_${i}`),
        ...Array.from({ length: 20 }, (_, i) => `ticket_photo_${i}`),
        'ticket_layout', 'event_rules'
      ];

      return res.status(400).json({ 
        message: "Unexpected file field detected",
        error: error.message,
        field: error.field || 'Unknown field',
        allowedFields: allowedFields,
        hint: "Check your form field names against the allowed fields list"
      });
    }

    // Handle ticket type validation errors
    if (error.message && (
      error.message.includes('Missing required fields for ticket type') ||
      error.message.includes('Invalid ticket price') ||
      error.message.includes('Invalid max capacity')
    )) {
      return res.status(400).json({
        message: "Ticket type validation error",
        error: error.message
      });
    }

    // Handle file type errors
    if (error.message && (
      error.message.includes('must be an image file') ||
      error.message.includes('must be a document') ||
      error.message.includes('Invalid file type')
    )) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message
      });
    }

    // Handle mongoose validation errors
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

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Data type casting error. Check your data format.",
        error: error.message,
        field: error.path
      });
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Sub-event with similar details already exists"
      });
    }
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
export const updateTicketDetails = async (req, res) => {
  const ticketId = req.params.ticketId;
  
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format. Please provide a valid MongoDB ObjectId.",
      ticketId: ticketId
    });
  }

  // Add the missing parseJSONSafely utility function
  const parseJSONSafely = (str, defaultValue = []) => {
    try {
      if (typeof str === 'string') {
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
      use_group_bank_account = 'true' // Default to true for group bank account
    } = req.body;

    // Parse complex nested data structures
    const parseNestedData = (data, fieldName) => {
      if (!data) return [];
      try {
        if (typeof data === 'string') {
          return JSON.parse(data);
        }
        return Array.isArray(data) ? data : [data];
      } catch (error) {
        console.warn(`Error parsing ${fieldName}:`, error);
        return [];
      }
    };

    // Parse nested arrays from request body
    const bankingDetails = parseNestedData(req.body.banking_details, 'banking_details');
    const ticketTypes = parseNestedData(req.body.ticket_types, 'ticket_types');

    // Process uploaded files - Handle ticket photo uploads
    const processedFiles = {};
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Get uploaded files
    const uploadedFiles = req.files || {};
    
    // Handle ticket photo uploads (ticket_photo_0, ticket_photo_1, etc.)
    const ticketPhotoFiles = {};
    
    // Extract ticket photo files from uploaded files
    Object.keys(uploadedFiles).forEach(fieldName => {
      // Handle ticket photo files
      if (fieldName.startsWith('ticket_photo_')) {
        const index = fieldName.split('_')[2]; // Extract index from ticket_photo_X
        if (!isNaN(index) && parseInt(index) >= 0) {
          const ticketPhotoFile = uploadedFiles[fieldName][0]; // Take first file
          const ext = '.' + ticketPhotoFile.originalname.toLowerCase().split('.').pop();
          if (!imageExtensions.includes(ext)) {
            throw new Error(`Ticket photo ${index} must be an image file (JPG, JPEG, PNG, GIF, WEBP)`);
          }
          ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
        }
      }
    });

    // Handle ticket layout upload
    if (uploadedFiles.ticket_layout && uploadedFiles.ticket_layout[0]) {
      const layoutFile = uploadedFiles.ticket_layout[0];
      const ext = '.' + layoutFile.originalname.toLowerCase().split('.').pop();
      if (!imageExtensions.includes(ext)) {
        return res.status(400).json({
          message: "Ticket layout must be an image file (JPG, JPEG, PNG, GIF, WEBP)"
        });
      }
      processedFiles.ticket_layout = layoutFile.path;
    }

    // Store the processed file objects
    processedFiles.ticketPhotoFiles = ticketPhotoFiles;

    // Validate required fields
    if (!payment_type) {
      return res.status(400).json({
        message: "Payment type is required"
      });
    }

    // Validate payment type
    const validPaymentTypes = ['free', 'paid'];
    if (!validPaymentTypes.includes(payment_type)) {
      return res.status(400).json({
        message: "Invalid payment_type",
        provided: payment_type,
        validOptions: validPaymentTypes
      });
    }

    // Process ticket types with photos
    let processedTicketTypes = [];
    if (ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
        // Validate required fields for each ticket type
        const requiredTicketFields = ['ticket_type', 'ticket_price', 'max_capacity'];
        const missingTicketFields = requiredTicketFields.filter(field => !ticket[field] && ticket[field] !== 0);
        
        if (missingTicketFields.length > 0) {
          throw new Error(`Missing required fields for ticket type ${index + 1}: ${missingTicketFields.join(', ')}`);
        }

        // Validate ticket price and capacity
        const ticketPrice = Number(ticket.ticket_price);
        const maxCapacity = Number(ticket.max_capacity);

        if (isNaN(ticketPrice) || ticketPrice < 0) {
          throw new Error(`Invalid ticket price for ticket type ${index + 1}. Must be a non-negative number.`);
        }

        if (isNaN(maxCapacity) || maxCapacity <= 0) {
          throw new Error(`Invalid max capacity for ticket type ${index + 1}. Must be a positive number.`);
        }

        const ticketData = {
          ticket_type: String(ticket.ticket_type).trim(),
          ticket_price: ticketPrice,
          max_capacity: maxCapacity,
          ticket_photo: ticket.ticket_photo || '' // existing photo URL if any
        };
        
        // Add uploaded ticket photo if available
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path;
        }
        
        return ticketData;
      });
    }

    // Handle banking details logic
    let finalBankingDetails = [];

    if (use_group_bank_account === 'true') {
      // Use group bank account - CHECK FOR primary_ PREFIXED FIELDS
      if (!GroupBank.primary_bank_acc_no || !GroupBank.primary_bank_ifsc || 
          !GroupBank.primary_bank_acc_holder || !GroupBank.primary_bank_acc_type) {
        return res.status(400).json({ 
          message: "Group banking details are incomplete. Please update your group banking details before proceeding",
          missingFields: {
            bank_acc_no: !GroupBank.primary_bank_acc_no,
            bank_ifsc: !GroupBank.primary_bank_ifsc,
            bank_acc_holder: !GroupBank.primary_bank_acc_holder,
            bank_acc_type: !GroupBank.primary_bank_acc_type
          }
        });
      }

      finalBankingDetails = [{
        bank_acc_type: String(GroupBank.primary_bank_acc_type),
        bank_acc_no: String(GroupBank.primary_bank_acc_no),
        bank_ifsc: String(GroupBank.primary_bank_ifsc),
        bank_acc_holder: String(GroupBank.primary_bank_acc_holder),
        is_group_account: true
      }];
    } else {
      // Use custom banking details
      if (!bankingDetails || bankingDetails.length === 0) {
        return res.status(400).json({
          message: "Custom banking details are required when not using group bank account"
        });
      }

      // Validate custom banking details
      finalBankingDetails = bankingDetails.map((banking, index) => {
        const requiredBankFields = ['bank_acc_type', 'bank_acc_no', 'bank_ifsc', 'bank_acc_holder'];
        const missingBankFields = requiredBankFields.filter(field => !banking[field]);
        
        if (missingBankFields.length > 0) {
          throw new Error(`Missing required banking fields for account ${index + 1}: ${missingBankFields.join(', ')}`);
        }

        return {
          bank_acc_type: String(banking.bank_acc_type).trim(),
          bank_acc_no: String(banking.bank_acc_no).trim(),
          bank_ifsc: String(banking.bank_ifsc).trim(),
          bank_acc_holder: String(banking.bank_acc_holder).trim(),
          is_group_account: false
        };
      });
    }

    // Validate dates if provided
    if (booking_start_date && booking_end_date) {
      const startDate = new Date(booking_start_date);
      const endDate = new Date(booking_end_date);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          message: "Invalid date format for booking dates"
        });
      }

      if (startDate >= endDate) {
        return res.status(400).json({
          message: "Booking start date must be before booking end date"
        });
      }
    }

    // Validate total capacity if provided
    if (total_capacity !== undefined) {
      const totalCap = Number(total_capacity);
      if (isNaN(totalCap) || totalCap <= 0) {
        return res.status(400).json({
          message: "Total capacity must be a positive number"
        });
      }
    }

    // Prepare update data
    const updateData = {
      payment_type: String(payment_type),
      banking_details: finalBankingDetails,
      'form_progress.banking_tickets': true,
      updated_by: userId,
      updated_at: new Date()
    };

    // Add optional fields if provided
    if (processedTicketTypes.length > 0) {
      updateData.ticket_types = processedTicketTypes;
    }

    if (processedFiles.ticket_layout) {
      updateData.ticket_layout = String(processedFiles.ticket_layout);
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
        upsert: false
      }
    );
    if (!updatedTicket) {
      return res.status(404).json({ 
        message: "Failed to update ticket details",
        hint: "Ticket not found or update failed"
      });
    }

    // Prepare response data
    const responseData = {
      message: "Ticket details updated successfully", 
      ticket: updatedTicket,
      ticketId: ticketId,
      userId: userId,
      payment_type: payment_type,
      banking_method: use_group_bank_account === 'true' ? 'group_account' : 'custom_account',
      banking_details_count: finalBankingDetails.length,
      ticket_types_count: processedTicketTypes.length,
      uploadedFiles: {
        ticket_layout: processedFiles.ticket_layout ? 1 : 0,
        ticket_photos: Object.keys(ticketPhotoFiles).length
      },
      form_progress: {
        banking_tickets: true
      }
    };

    // Add banking details info to response (without sensitive data)
    if (use_group_bank_account === 'true') {
      responseData.group_bank_info = {
        account_holder: GroupBank.primary_bank_acc_holder,
        account_type: GroupBank.primary_bank_acc_type,
        bank_name: GroupBank.bank_name || 'Not specified',
        bank_ifsc: GroupBank.primary_bank_ifsc
      };
    } else {
      responseData.custom_bank_accounts = finalBankingDetails.map(bank => ({
        account_holder: bank.bank_acc_holder,
        account_type: bank.bank_acc_type,
        last_four_digits: bank.bank_acc_no.slice(-4)
      }));
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error updating ticket details:", error);
    
    // Enhanced multer error handling
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: "File size too large. Maximum 50MB allowed per file." 
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        message: "Too many files uploaded. Maximum limits exceeded." 
      });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      const allowedFields = [
        'ticket_layout',
        ...Array.from({ length: 20 }, (_, i) => `ticket_photo_${i}`)
      ];

      return res.status(400).json({ 
        message: "Unexpected file field detected",
        error: error.message,
        field: error.field || 'Unknown field',
        allowedFields: allowedFields,
        hint: "Check your form field names against the allowed fields list"
      });
    }

    // Handle ticket type validation errors
    if (error.message && (
      error.message.includes('Missing required fields for ticket type') ||
      error.message.includes('Invalid ticket price') ||
      error.message.includes('Invalid max capacity')
    )) {
      return res.status(400).json({
        message: "Ticket type validation error",
        error: error.message
      });
    }

    // Handle banking validation errors
    if (error.message && error.message.includes('Missing required banking fields')) {
      return res.status(400).json({
        message: "Banking details validation error",
        error: error.message
      });
    }

    // Handle file type errors
    if (error.message && (
      error.message.includes('must be an image file') ||
      error.message.includes('Invalid file type')
    )) {
      return res.status(400).json({
        message: "Invalid file type",
        error: error.message
      });
    }

    // Handle mongoose validation errors
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

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Data type casting error. Check your data format.",
        error: error.message,
        field: error.path
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry found",
        error: "Ticket details with similar data already exists"
      });
    }
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Step 5: Update Ticket - Terms & Conditions (Company Provided)
export const updateTicketTerms = async (req, res) => {
  try {
    // Get ticketId from params first, fallback to body
    const ticketId = req.params.ticketId || req.body.ticketId;
    const { terms_accepted, company_terms_version } = req.body;
    console.log('updateTicketTerms called with:', { ticketId, terms_accepted, company_terms_version });
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
    
    console.log('Updating ticket with ID:', ticketId); // Debug log
    
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
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
      console.log('Ticket not found for ID:', ticketId); // Debug log
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }
    console.log('Ticket updated successfully:', updatedTicket._id); // Debug log
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
    const ticketId = req.params.ticketId;
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
    const ticketId = req.params.ticketId;
    // Validate required parameters
    const userId = req.user._id || req.user.id;
    if (!ticketId || !userId) {
      return res.status(400).json({ 
        message: "Missing required parameters",
        required: ["ticketId", "userId"]
      });
    }
    const deletedTicket = await Ticket.findOneAndDelete({ 
      _id: ticketId, 
      userId: userId
    });
    if (!deletedTicket) {
      return res.status(404).json({ message: "Ticket not found or unauthorized" });
    }
    res.status(200).json({ 
      message: "Ticket deleted successfully",
      ticketId: ticketId,
      userId: userId
    });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
