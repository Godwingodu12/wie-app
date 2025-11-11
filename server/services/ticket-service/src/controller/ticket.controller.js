import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
import TicketLike from '../models/ticketLike.model.js';
import { createNotification } from '../utils/notificationHelper.js';
import axios from 'axios';
import { uploadTicketMedia, uploadFields } from '../middlewares/upload.js';
import { processFileUploads, deleteFromCloudinary } from '../utils/cloudinaryHelper.js';
import mongoose from 'mongoose';
export const getGroupsTypes = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userRole = req.user.role;
        const groups = await Group.find({ userId: userId });
        const adminGroups = groups.filter(group => group.grp_type === 'admin');
        const orgGroups = groups.filter(group => group.grp_type === 'organisation');
        res.status(200).json({
            message: "Groups retrieved successfully",
            adminCount: adminGroups.length,
            userRole: userRole,
            organisationCount: orgGroups.length,
            adminGroups: adminGroups,
            organisationGroups: orgGroups
        });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
// Helper function to get all sub-events for a ticket
export const getTicketSubEvents = async (req, res) => {
  const ticketId = req.params.ticketId;
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format" 
    });
  }
  try {
    const ticket = await Ticket.findById(ticketId).select('sub_events event_name');
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json({
      message: "Sub-events retrieved successfully",
      eventName: ticket.event_name,
      subEvents: ticket.sub_events || [],
      totalSubEvents: ticket.sub_events ? ticket.sub_events.length : 0
    });

  } catch (error) {
    console.error("Error getting sub-events:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};
export const updateSubEvent = async (req, res) => {
  try {
    const { ticketId, subEventId } = req.params;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid ticket ID format" 
      });
    }
    if (!subEventId || !subEventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: "Invalid sub-event ID format" 
      });
    }

    // Parse JSON utility
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

    // Parse update data
    let updateData;
    try {
      if (req.body.sub_event) {
        updateData = typeof req.body.sub_event === 'string' 
          ? JSON.parse(req.body.sub_event) 
          : req.body.sub_event;
      } else {
        updateData = req.body;
      }
    } catch (parseError) {
      return res.status(400).json({ 
        message: "Invalid sub_event data format",
        error: parseError.message
      });
    }
    // Find the ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    // Find the sub-event index
    const subEventIndex = ticket.sub_events.findIndex(
      (se) => se._id.toString() === subEventId
    );

    if (subEventIndex === -1) {
      return res.status(404).json({ message: 'Sub-event not found' });
    }

    const existingSubEvent = ticket.sub_events[subEventIndex];

    // Process file uploads - only if files exist
    const processedFiles = {};
    const uploadedFiles = await processFileUploads(req.files || {});
    const guestProfileFiles = {};
    const ticketPhotoFiles = {};
    Object.keys(uploadedFiles).forEach(fieldName => {
      if (fieldName.startsWith('guest_profile_')) {
        const index = fieldName.split('_')[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const fileData = uploadedFiles[fieldName];
          // processFileUploads returns array of objects for multiple files
          if (Array.isArray(fileData) && fileData.length > 0) {
            const profileFile = fileData[0];
            
            // Validate upload success
            if (profileFile.path && profileFile.originalName) {
              guestProfileFiles[parseInt(index)] = profileFile;
              console.log(`✓ Guest profile ${index}: ${profileFile.originalName}`);
            }
          }
        }
      }
      if (fieldName.startsWith('ticket_photo_')) {
        const index = fieldName.split('_')[2];
        if (!isNaN(index) && parseInt(index) >= 0) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            const ticketPhotoFile = fileData[0];
            // Validate upload success
            if (ticketPhotoFile.path && ticketPhotoFile.originalName) {
              ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
              console.log(`✓ Ticket photo ${index}: ${ticketPhotoFile.originalName}`);
            }
          }
        }
      }
    });
    // Handle event banner
    if (uploadedFiles.event_banner && uploadedFiles.event_banner.length > 0) {
      const bannerFile = uploadedFiles.event_banner[0];
      if (bannerFile.path && bannerFile.originalName) {
        processedFiles.event_banner = bannerFile.path; // Cloudinary URL
        processedFiles.event_banner_public_id = bannerFile.public_id;
        console.log(`✓ Event banner: ${bannerFile.originalName}`);
      }
    }
    // Handle event logo
    if (uploadedFiles.event_logo && uploadedFiles.event_logo.length > 0) {
      const logoFile = uploadedFiles.event_logo[0];
      if (logoFile.path && logoFile.originalName) {
        processedFiles.event_logo = logoFile.path; // Cloudinary URL
        processedFiles.event_logo_public_id = logoFile.public_id;
        console.log(`✓ Event logo: ${logoFile.originalName}`);
      }
    }
    if (uploadedFiles.event_images && uploadedFiles.event_images.length > 0) {
      if (uploadedFiles.event_images.length <= 10) {
        // Filter valid uploads
        const validImages = uploadedFiles.event_images.filter(file => 
          file.path && file.originalName
        );
        
        if (validImages.length > 0) {
          processedFiles.event_images = validImages.map(file => ({
            path: file.path, // Cloudinary URL
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            public_id: file.public_id, // Store for deletion
            resource_type: file.resource_type,
            uploadedAt: new Date()
          }));
          console.log(`✓ Event images: ${validImages.length} uploaded`);
        }
      } else {
        console.warn('⚠ Too many event images (max 10)');
      }
    }
    // Handle event rules file
    if (uploadedFiles.event_rules && uploadedFiles.event_rules.length > 0) {
      const rulesFile = uploadedFiles.event_rules[0];
      if (rulesFile.path && rulesFile.originalName) {
        processedFiles.event_rules = {
          type: 'file',
          path: rulesFile.path, // Cloudinary URL
          originalName: rulesFile.originalName,
          mimeType: rulesFile.mimeType,
          size: rulesFile.size,
          public_id: rulesFile.public_id, // Store for deletion
          resource_type: rulesFile.resource_type,
          uploadedAt: new Date()
        };
        console.log(`✓ Event rules: ${rulesFile.originalName}`);
      }
    }
    // Handle ticket layout (offline only)
    if (uploadedFiles.ticket_layout && uploadedFiles.ticket_layout.length > 0) {
      const layoutFile = uploadedFiles.ticket_layout[0];
      if (layoutFile.path && layoutFile.originalName) {
        processedFiles.ticket_layout = layoutFile.path; // Cloudinary URL
        processedFiles.ticket_layout_public_id = layoutFile.public_id;
        console.log(`✓ Ticket layout: ${layoutFile.originalName}`);
      }
    }
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
    const guests = parseNestedData(updateData.guests, 'guests');
    const ticketTypes = parseNestedData(updateData.ticket_types, 'ticket_types');
    // Process guests with profile images
    let processedGuests = [];
    if (guests && guests.length > 0) {
      processedGuests = guests.map((guest, index) => {
        let guestData = {
          guest_name: guest.guest_name || '',
          guest_profile: guest.guest_profile || existingSubEvent.guests?.[index]?.guest_profile || '',
          guest_link: guest.guest_link || ''
        };   
        if (guestProfileFiles[index]) {
          guestData.guest_profile = guestProfileFiles[index].path; // Cloudinary URL
          console.log(`✓ Updated guest ${index} profile with Cloudinary URL`);
        }
        return guestData;
      });
    } else if (existingSubEvent.guests) {
      processedGuests = existingSubEvent.guests;
    }
    // Process ticket types with photos
    let processedTicketTypes = [];
    if (ticketTypes && ticketTypes.length > 0) {
      processedTicketTypes = ticketTypes.map((ticket, index) => {
      const ticketData = {
          ticket_type: ticket.ticket_type || '',
          ticket_price: Number(ticket.ticket_price) || 0,
          max_capacity: Number(ticket.max_capacity) || 0,
          ticket_photo: ticket.ticket_photo || existingSubEvent.ticket_types?.[index]?.ticket_photo || '',
          ticket_photo_public_id: ticket.ticket_photo_public_id || existingSubEvent.ticket_types?.[index]?.ticket_photo_public_id || ''
        };
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path; // Cloudinary URL
          ticketData.ticket_photo_public_id = ticketPhotoFiles[index].public_id;
          console.log(`✓ Updated ticket ${index} photo with Cloudinary URL`);
        }
        return ticketData;
      });
    } else if (existingSubEvent.ticket_types) {
      processedTicketTypes = existingSubEvent.ticket_types;
    }

    // Build updated sub-event object
    const updatedSubEvent = {
      ...existingSubEvent.toObject(),
      _id: existingSubEvent._id,
      
      // Basic fields
      event_name: updateData.event_name || existingSubEvent.event_name,
      event_category: updateData.event_category || existingSubEvent.event_category,
      event_subcategory: updateData.event_subcategory || existingSubEvent.event_subcategory,
      event_type: updateData.event_type || existingSubEvent.event_type,
      location_type: updateData.location_type || existingSubEvent.location_type,
      min_age_allowed: updateData.min_age_allowed !== undefined ? Number(updateData.min_age_allowed) : existingSubEvent.min_age_allowed,
      max_age_allowed: updateData.max_age_allowed !== undefined ? Number(updateData.max_age_allowed) : existingSubEvent.max_age_allowed,
      event_description: updateData.event_description || existingSubEvent.event_description,
      payment_type: updateData.payment_type || existingSubEvent.payment_type,
      
      // Boolean fields
      kids_friendly: updateData.kids_friendly !== undefined ? Boolean(updateData.kids_friendly === 'true' || updateData.kids_friendly === true) : existingSubEvent.kids_friendly,
      pet_friendly: updateData.pet_friendly !== undefined ? Boolean(updateData.pet_friendly === 'true' || updateData.pet_friendly === true) : existingSubEvent.pet_friendly,
      
      // Optional fields
      event_date_type: updateData.event_date_type || existingSubEvent.event_date_type,
      event_instagram_link: updateData.event_instagram_link || existingSubEvent.event_instagram_link,
      event_youtube_link: updateData.event_youtube_link || existingSubEvent.event_youtube_link,
      
      // Arrays
      event_language: updateData.event_language ? parseJSONSafely(updateData.event_language, []) : existingSubEvent.event_language,
      hashtag: updateData.hashtag ? parseJSONSafely(updateData.hashtag, []) : existingSubEvent.hashtag,
      
      // Dates and capacity
      total_capacity: updateData.total_capacity || existingSubEvent.total_capacity,
      booking_start_date: updateData.booking_start_date || existingSubEvent.booking_start_date,
      booking_end_date: updateData.booking_end_date || existingSubEvent.booking_end_date,
      
      // Nested objects
      guests: processedGuests,
      banking_details: updateData.banking_details ? parseNestedData(updateData.banking_details, 'banking_details') : existingSubEvent.banking_details,
      POCS: updateData.POCS ? parseNestedData(updateData.POCS, 'POCS') : existingSubEvent.POCS,
      event_dates: updateData.event_dates ? parseNestedData(updateData.event_dates, 'event_dates').map(date => {
        const dateEntry = {
          start_date: date.start_date,
          end_date: date.end_date,
          event_link: date.event_link || "",
          video_name: date.video_name || "",
          verification_event_code: date.verification_event_code || "",
          video_file_path: date.video_file_path || "",
          preview_image_path: date.preview_image_path || "",
        };
        if (date.start_time && String(date.start_time).trim() !== "") {
          dateEntry.start_time = date.start_time;
        }
        if (date.end_time && String(date.end_time).trim() !== "") {
          dateEntry.end_time = date.end_time;
        }
        
        return dateEntry;
      }) : existingSubEvent.event_dates,      
      // File uploads with fallback to existing
      event_banner: processedFiles.event_banner || existingSubEvent.event_banner,
      event_logo: processedFiles.event_logo || existingSubEvent.event_logo,
      event_images: processedFiles.event_images || existingSubEvent.event_images || [],
    };
    // Handle event_rules (file or text)
    if (processedFiles.event_rules) {
      updatedSubEvent.event_rules = {
        type: 'file',
        path: processedFiles.event_rules.path, // Cloudinary URL
        originalName: processedFiles.event_rules.originalName,
        mimeType: processedFiles.event_rules.mimeType,
        size: processedFiles.event_rules.size,
        public_id: processedFiles.event_rules.public_id, // Store for deletion
        resource_type: processedFiles.event_rules.resource_type,
        uploadedAt: new Date(processedFiles.event_rules.uploadedAt)
      };
    } else if (updateData.event_rules_text) {
      updatedSubEvent.event_rules = {
        type: 'text',
        content: String(updateData.event_rules_text).trim(),
        uploadedAt: new Date()
      };
    } else {
      updatedSubEvent.event_rules = existingSubEvent.event_rules || {
        type: 'text',
        content: '',
        uploadedAt: new Date()
      };
    }
    // Handle location-type specific fields
    const locationType = updatedSubEvent.location_type;

    if (locationType === 'offline') {
      updatedSubEvent.seating_arrangement = updateData.seating_arrangement || existingSubEvent.seating_arrangement;
      updatedSubEvent.location = updateData.location || existingSubEvent.location;
      updatedSubEvent.venue = updateData.venue || existingSubEvent.venue;
      
      let exactMapLocation = existingSubEvent.exact_map_location || {};
      if (updateData.exact_map_location) {
        try {
          exactMapLocation = typeof updateData.exact_map_location === 'string' 
            ? JSON.parse(updateData.exact_map_location)
            : updateData.exact_map_location;
        } catch (error) {
          console.warn('Error parsing exact_map_location:', error);
        }
      }
      
      updatedSubEvent.exact_map_location = {
        latitude: exactMapLocation.latitude ? Number(exactMapLocation.latitude) : existingSubEvent.exact_map_location?.latitude,
        longitude: exactMapLocation.longitude ? Number(exactMapLocation.longitude) : existingSubEvent.exact_map_location?.longitude,
        address: exactMapLocation.address || existingSubEvent.exact_map_location?.address || ''
      };
      
      updatedSubEvent.gate_open_time = updateData.gate_open_time || existingSubEvent.gate_open_time;
      updatedSubEvent.prohibited_items = updateData.prohibited_items ? parseJSONSafely(updateData.prohibited_items, []) : existingSubEvent.prohibited_items || [];
      updatedSubEvent.ticket_types = processedTicketTypes && processedTicketTypes.length > 0 ? processedTicketTypes : existingSubEvent.ticket_types || [];
      updatedSubEvent.ticket_layout = processedFiles.ticket_layout || existingSubEvent.ticket_layout;
      
      updatedSubEvent.event_link = undefined;
      updatedSubEvent.verification_event_code = undefined;
      
    } else if (locationType === 'online' || locationType === 'recorded') {
      updatedSubEvent.event_link = updateData.event_link || existingSubEvent.event_link;
      updatedSubEvent.verification_event_code = updateData.verification_event_code || existingSubEvent.verification_event_code;
      
      // CRITICAL: PRESERVE prohibited_items and ticket_types
      updatedSubEvent.prohibited_items = updateData.prohibited_items 
        ? parseJSONSafely(updateData.prohibited_items, []) 
        : (existingSubEvent.prohibited_items || []);
      
      updatedSubEvent.ticket_types = processedTicketTypes && processedTicketTypes.length > 0 
        ? processedTicketTypes 
        : (existingSubEvent.ticket_types || []);
      
      updatedSubEvent.seating_arrangement = undefined;
      updatedSubEvent.location = undefined;
      updatedSubEvent.venue = undefined;
      updatedSubEvent.exact_map_location = {
        latitude: undefined,
        longitude: undefined,
        address: undefined
      };
      updatedSubEvent.gate_open_time = undefined;
      updatedSubEvent.ticket_layout = undefined;
    }
    ticket.sub_events[subEventIndex] = updatedSubEvent;
    await ticket.save();
    res.status(200).json({
      message: 'Sub-event updated successfully',
      sub_event: ticket.sub_events[subEventIndex],
      updatedFields: {
        location_type: updatedSubEvent.location_type,
        event_banner: processedFiles.event_banner ? 'updated (Cloudinary)' : 'unchanged',
        event_logo: processedFiles.event_logo ? 'updated (Cloudinary)' : 'unchanged',
        event_images: processedFiles.event_images ? `${processedFiles.event_images.length} updated (Cloudinary)` : 'unchanged',
        event_rules: processedFiles.event_rules ? 'updated (Cloudinary)' : (updateData.event_rules_text ? 'updated (text)' : 'unchanged'),
        ticket_layout: processedFiles.ticket_layout ? 'updated (Cloudinary)' : 'unchanged',
        guests: processedGuests.length,
        ticket_types: processedTicketTypes.length,
        prohibited_items: (updatedSubEvent.prohibited_items || []).length,
        guest_profiles_uploaded: Object.keys(guestProfileFiles).length,
        ticket_photos_uploaded: Object.keys(ticketPhotoFiles).length
      }
    });
  } catch (error) {
    console.error('Error updating sub-event:', error);
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
      if (processedFiles.event_images && Array.isArray(processedFiles.event_images)) {
        processedFiles.event_images.forEach(img => {
          if (img.public_id) filesToDelete.push(img.public_id);
        });
      }
      if (processedFiles.event_rules && processedFiles.event_rules.public_id) {
        filesToDelete.push(processedFiles.event_rules.public_id);
      }
      Object.values(guestProfileFiles).forEach(file => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });
      Object.values(ticketPhotoFiles).forEach(file => {
        if (file.public_id) filesToDelete.push(file.public_id);
      });
      for (const publicId of filesToDelete) {
        await deleteFromCloudinary(publicId);
      }
      console.log(`Cleaned up ${filesToDelete.length} files from Cloudinary due to error`);
    } catch (cleanupError) {
      console.error("Error cleaning up Cloudinary files:", cleanupError);
    }
    res.status(500).json({
      message: 'Failed to update sub-event',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
export const deleteSubEvent = async (req, res) => {
  const { ticketId, subEventId } = req.params;
  
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ 
      message: "Invalid ticket ID format" 
    });
  }

  try {
    const userId = req.user._id || req.user.id;
    
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId },
      {
        $pull: { sub_events: { _id: subEventId } },
        updated_by: userId,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json({
      message: "Sub-event deleted successfully",
      ticket: updatedTicket,
      remainingSubEvents: updatedTicket.sub_events.length
    });

  } catch (error) {
    console.error("Error deleting sub-event:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};
export const getGroupView = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid ticket ID format"
      });
    }
    const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }
    const groupId = ticket.groupId;
    const group = await Group.findOne({ _id: groupId, userId: userId });
    if (!group) {
      return res.status(404).json({
        message: "Group not found"
      });
    }
    res.status(200).json({
      message: "Groups retrieved successfully",
      group: group
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getGroupById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { groupId } = req.params;

    // Validate groupId format
    if (!groupId || !groupId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid group ID format"
      });
    }

    // Find the group
    const group = await Group.findOne({ _id: groupId, userId: userId });
    if (!group) {
      return res.status(404).json({
        message: "Group not found or you don't have access to this group"
      });
    }
    res.status(200).json({
      message: "Group retrieved successfully",
      group: group
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getOtherGroupView = async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid ticket ID format"
            });
        }
        const ticket = await Ticket.findOne({ _id: ticketId });
        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }
        const groupId = ticket.groupId;
        const group = await Group.findOne({ _id: groupId });
        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }
        res.status(200).json({
            message: "Groups retrieved successfully",
            group: group
        });
    }
    catch (error) {
        console.error("Error fetching group:", error);
        res.status(500).json({  
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const tickets = await Ticket.find({ userId: userId,event_status: { $in: ['pending', 'confirmed', 'live', 'completed'] } })
        .sort({ createdAt: -1 }) // newest first
        .exec();
        res.status(200).json({
            message: "My All Tickets retrieved successfully",
            tickets: tickets
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};  
export const getMyEventById = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const ticketId = req.params.ticketId;
        if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid ticket ID format"
            });
        }
        const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });
        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found"
            });
        }
        res.status(200).json({
            message: "My Ticket retrieved successfully",
            ticket: ticket
        });
    } catch (error) {
        console.error("Error fetching ticket:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyLiveEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: userId, 
            event_status: 'live',
        });
        res.status(200).json({
            message: "My Live Tickets retrieved successfully",
            tickets: tickets
        });
    }
    catch (error) {
        console.error("Error fetching live tickets:", error);
        res.status(500).json({  
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyLiveEventView = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const ticketId = req.params.ticketId;
        if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid ticket ID format"
            });
        }
        const ticket = await Ticket.findOne({ 
            _id: ticketId,
            userId: userId,
            event_status: 'live'
        });
        if (!ticket) {
            return res.status(404).json({
                message: "Live Ticket not found"
            });
        }
        res.status(200).json({
            message: "My Live Ticket View retrieved successfully",
            ticket: ticket
        });
    }
    catch (error) {
        console.error("Error fetching live ticket:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyPastEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const tickets = await Ticket.find({ 
            userId: userId,
            event_status: 'completed',
        });
        res.status(200).json({
            message: "My Past Tickets retrieved successfully",
            tickets: tickets
        });
    }
    catch (error) {
        console.error("Error fetching past tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyPreviousEventView = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const ticketId = req.params.ticketId;
        if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                message: "Invalid ticket ID format"
            });
        }
        const ticket = await Ticket.findOne({ 
            _id: ticketId,
            userId: userId,
            event_status: 'completed',
        });
        if (!ticket) {
            return res.status(404).json({
                message: "Past Ticket not found"
            });
        }
        res.status(200).json({
            message: "My Past Ticket View retrieved successfully",
            ticket: ticket
        });
    }
    catch (error) {
        console.error("Error fetching past ticket:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getMyUpcomingEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        
        // Get current date (start of today)
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        // Get all confirmed tickets for the user
        const tickets = await Ticket.find({ 
            userId: userId,
            event_status: 'confirmed'
        }).lean(); // Use .lean() for better performance
        
        // Filter tickets where the event hasn't ended yet
        const upcomingTickets = tickets.filter(ticket => {
            if (ticket.event_dates && ticket.event_dates.length > 0) {
                // Check the last date in event_dates array (end date of the event)
                const lastEventDate = ticket.event_dates[ticket.event_dates.length - 1];
                
                // Use end_date if available, otherwise use start_date
                const endDateString = lastEventDate.end_date || lastEventDate.start_date;
                
                if (endDateString) {
                    const eventEndDate = new Date(endDateString);
                    eventEndDate.setHours(23, 59, 59, 999); // Set to end of day
                    
                    // Include event if it hasn't ended yet (end date is today or in future)
                    return eventEndDate >= currentDate;
                }
            }
            return false;
        });
        
        res.status(200).json({
            message: "My upcoming events retrieved successfully",
            tickets: upcomingTickets,
            totalCount: upcomingTickets.length,
            currentDate: currentDate.toISOString()
        });
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getOthersEvents = async(req, res)=>{
  try {
      const other = req.params.otherId;
      const tickets = await Ticket.find({ 
                userId: other,
                event_status: ['completed','live']
            });
      res.status(200).json({
            message: "Other User Tickets retrieved successfully",
            tickets: tickets
        });
  } catch (error) {
    console.error("Error fetching Others tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
  }
};
export const getOthersEventsById = async(req, res)=>{
  try{
      const other = req.params.otherId;
      const ticketId = req.params.ticketId;
      if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            message: "Invalid ticket ID format"
        });
      }
      const tickets = await Ticket.findOne({ 
                _id: ticketId,
                userId: other,
            });
      if (!tickets) {
        return res.status(404).json({
            message: "Ticket not found"
        });
      }
      res.status(200).json({
        message: "Other user Ticket is fetched successfully",
        tickets: tickets
      });
  }catch (error) {
    console.error("Error fetching Other user Ticket", error);
    res.status(500).json({
        message: "Internal server error",
        error: error.message
    });
  }
};
export const getOtherLiveEvents = async(req, res)=>{
  try {
      const other = req.params.otherId;
      const currentDate = new Date();
      const tickets = await Ticket.find({ 
                userId: other,
                event_status: 'live',
                start_date: { $lte: currentDate },
                end_date: { $gte: currentDate }
            });
      res.status(200).json({
            message: "Other User Live Tickets retrieved successfully",
            tickets: tickets
        });
  } catch (error) {
    console.error("Error fetching Others Live tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
  }
};
export const getOthersPastEvents = async (req, res) => {
    try {
        const other = req.params.otherId;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: other,
            event_status: 'completed',
            end_date: { $lt: currentDate }
        });
        res.status(200).json({
            message: "other user Past Tickets retrieved successfully",
            tickets: tickets
        });
    }
    catch (error) {
        console.error("Error fetching past tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const getGroupTicketPercentages = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Fetch all groups for the user
    const groups = await Group.find({ userId: userId }).sort({ createdAt: -1 });
    
    if (groups.length === 0) {
      return res.status(200).json({
        message: "No groups found for this user",
        groupPercentages: {}
      });
    }
    
    // Ensure groupIds are ObjectIds
    const groupIds = groups.map(g => new mongoose.Types.ObjectId(g._id));
    
    console.log("Group IDs:", groupIds);
    
    // First, let's check if there are any tickets at all
    const totalTicketsCheck = await Ticket.countDocuments({
      groupId: { $in: groupIds }
    });    
    // Single aggregation query to get ticket counts per group
    const ticketStats = await Ticket.aggregate([
      {
        $match: {
          groupId: { $in: groupIds },
          event_status: { $in: ['live', 'completed', 'pending'] }
        }
      },
      {
        $group: {
          _id: "$groupId",
          ticketCount: { $sum: 1 }
        }
      }
    ]);
    
    console.log("Ticket Stats from aggregation:", ticketStats);
    
    // Calculate total tickets
    const totalTickets = ticketStats.reduce((sum, stat) => sum + stat.ticketCount, 0);
    
    if (totalTickets === 0) {
      return res.status(200).json({
        message: "No tickets found for any group",
        groupPercentages: {},
        debug: {
          totalGroupsFound: groups.length,
          groupIds: groupIds.map(id => id.toString()),
          totalTicketsInDB: totalTicketsCheck
        }
      });
    }
    
    // Create a map for ticket counts
    const ticketCountMap = {};
    ticketStats.forEach(stat => {
      ticketCountMap[stat._id.toString()] = stat.ticketCount;
    });
    
    // Calculate percentages for each group
    const groupPercentages = {};
    
    groups.forEach(group => {
      const groupTicketCount = ticketCountMap[group._id.toString()] || 0;
      const percentage = parseFloat(((groupTicketCount / totalTickets) * 100).toFixed(2));
      groupPercentages[group.name] = `${percentage}%`;
    });
    
    res.status(200).json({
      message: "Group ticket percentages retrieved successfully",
      totalTickets: totalTickets,
      groupPercentages: groupPercentages
    });
    
  } catch (error) {
    console.error("Error fetching group ticket percentages:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getGroupStatistics = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groups = await Group.find({ userId: userId }).sort({ createdAt: -1 });
    const groupCount = groups.length;
    if (groups.length === 0) {
      return res.status(200).json({
        message: "No groups found for this user",
        groupPercentages: {}
      });
    }
    const groupTicketCounts = await Promise.all(
      groups.map(async (group) => {
        const ticketCount = await Ticket.countDocuments({
          groupId: group._id,
          event_status: { $in: ['pending', 'confirmed', 'live', 'completed'] }
        });
        return {
          groupId: group._id,
          groupName: group.name,
          ticketCount: ticketCount
        };
      })
    );
    const totalTickets = groupTicketCounts.reduce((sum, group) => sum + group.ticketCount, 0);
    if (totalTickets === 0) {
      return res.status(200).json({
        message: "No tickets found for any group",
        groupPercentages: {},
        debug: {
          groupTicketCounts: groupTicketCounts
        }
      });
    }
    const groupPercentages = {};
    groupTicketCounts.forEach(group => {
      const percentage = parseFloat(((group.ticketCount / totalTickets) * 100).toFixed(2));
      groupPercentages[group.groupName] = `${percentage}%`;
    });
    res.status(200).json({
      message: "Group ticket percentages retrieved successfully",
      groupCount: groupCount,
      groupTicketCounts: groupTicketCounts,
      totalTickets: totalTickets,
      groupPercentages: groupPercentages
    });
  } catch (error) {
    console.error("Error fetching group ticket percentages:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const confirmEvent = async (req, res) => {
  try {
    const ticketId = req.params.ticketId || req.body.ticketId;
    const userId = req.user._id || req.user.id;
    if (!ticketId) {
      return res.status(400).json({
        message: "Missing required parameter: ticketId"
      });
    }
    // Update ticket to confirmed status
    const updatedTicket = await Ticket.findOneAndUpdate(
      { _id: ticketId, userId: userId },
      { 
        event_status: 'confirmed',
        updated_at: new Date()
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(404).json({ 
        message: "Ticket not found or unauthorized" 
      });
    }
    // Populate groupId
    await updatedTicket.populate('groupId');
    // Create notification
    try {
      const groupName = updatedTicket.groupId?.name || 'Unknown Group';
      await createNotification({
        userId: userId,
        type: 'event_created',
        title: 'Event Created Successfully',
        message: `Your event "${updatedTicket.event_name}" has been created in ${groupName}`,
        ticketId: updatedTicket._id,
        groupId: updatedTicket.groupId?._id,
        groupName: groupName,
        eventName: updatedTicket.event_name
      });
      console.log('Notification created for confirmed event:', updatedTicket.event_name);
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    res.status(200).json({
      message: "Event confirmed successfully",
      ticket: updatedTicket
    });
  } catch (error) {
    console.error("Error confirming event:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
};
export const goLiveEvent = async(req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid ticket ID format"
      });
    }

    // Find ticket without populate first
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      userId: userId 
    });
    
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const expiredDates = [];
    
    // Check event_dates array for start_date and end_date
    if (ticket.event_dates && ticket.event_dates.length > 0) {
      ticket.event_dates.forEach((dateObj, index) => {
        if (dateObj.start_date) {
          const startDate = new Date(dateObj.start_date);
          startDate.setHours(0, 0, 0, 0);
          if (startDate < currentDate) {
            expiredDates.push(`Event start date (${startDate.toLocaleDateString()})`);
          }
        }
        if (dateObj.end_date) {
          const endDate = new Date(dateObj.end_date);
          endDate.setHours(0, 0, 0, 0);
          if (endDate < currentDate) {
            expiredDates.push(`Event end date (${endDate.toLocaleDateString()})`);
          }
        }
      });
    }
    
    // Check booking_start_date
    if (ticket.booking_start_date) {
      const bookingStartDate = new Date(ticket.booking_start_date);
      bookingStartDate.setHours(0, 0, 0, 0);
      if (bookingStartDate < currentDate) {
        expiredDates.push(`Booking start date (${bookingStartDate.toLocaleDateString()})`);
      }
    }
    
    // Check booking_end_date
    if (ticket.booking_end_date) {
      const bookingEndDate = new Date(ticket.booking_end_date);
      bookingEndDate.setHours(0, 0, 0, 0);
      if (bookingEndDate < currentDate) {
        expiredDates.push(`Booking end date (${bookingEndDate.toLocaleDateString()})`);
      }
    }
    
    // Check event start_date (fallback if not in event_dates array)
    if (ticket.start_date) {
      const eventStartDate = new Date(ticket.start_date);
      eventStartDate.setHours(0, 0, 0, 0);
      if (eventStartDate < currentDate) {
        expiredDates.push(`Event start date (${eventStartDate.toLocaleDateString()})`);
      }
    }
    // Check event end_date (fallback if not in event_dates array)
    if (ticket.end_date) {
      const eventEndDate = new Date(ticket.end_date);
      eventEndDate.setHours(0, 0, 0, 0);
      if (eventEndDate < currentDate) {
        expiredDates.push(`Event end date (${eventEndDate.toLocaleDateString()})`);
      }
    }
    
    // If any dates are expired, prevent going live
    if (expiredDates.length > 0) {
      return res.status(400).json({
        message: "Cannot go live with expired dates. Please update the following dates before going live:",
        expiredDates: expiredDates,
        currentDate: currentDate.toLocaleDateString()
      });
    }
    // All dates are valid, proceed to go live
    ticket.event_status = 'live';
    await ticket.save();
    // Now populate groupId after save
    await ticket.populate('groupId');
    // Create notification for hosted event
    try {
      await createNotification({
        userId: userId,
        type: 'event_hosted',
        title: 'Event Hosted Successfully',
        message: `Your event "${ticket.event_name}" is now live!`,
        ticketId: ticket._id,
        groupId: ticket.groupId?._id,
        eventName: ticket.event_name
      });
      console.log('Notification created for live event:', ticket.event_name);
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    res.status(200).json({
      message: "Event went live successfully",
      ticket: ticket
    });
  }
  catch (error) {
    console.error("Error going live event:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};
export const makeEventCompleted = async(req, res) => {
  try {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const liveTickets = await Ticket.find({ event_status: 'live' });
    let completedCount = 0;
    let unchangedCount = 0;
    await Promise.all(
      liveTickets.map(async (ticket) => {
        const endDateStr = ticket.event_dates?.[0]?.end_date || ticket.end_date;
        if (!endDateStr) {
          console.log(`Ticket ${ticket._id} has no end_date, skipping...`);
          unchangedCount++;
          return;
        }
        const eventEndDate = new Date(endDateStr);
        eventEndDate.setHours(23, 59, 59, 999);
        if (currentDate => eventEndDate) {
          ticket.event_status = 'completed';
          await ticket.save();
          completedCount++;
          console.log(`Event ${ticket.event_name} (${ticket._id}) marked as completed`);
        } else {
          unchangedCount++;
          console.log(`Event ${ticket.event_name} (${ticket._id}) is still ongoing`);
        }
      })
    );
    res.status(200).json({
      success: true,
      message: "Event status update completed",
      data: {
        totalLiveEvents: liveTickets.length,
        eventsCompleted: completedCount,
        eventsStillLive: unchangedCount
      }
    });
  } catch (error) {
    console.error("Error making event completed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getPreviousEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const tickets = await Ticket.find({ userId: userId, event_status: 'completed'})
        .sort({ createdAt: -1 })
        .exec();
        res.status(200).json({
            message: "My All Completed Tickets successfully",
            tickets: tickets
        });
    } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
export const showEventBankDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const tickets = await Ticket.find({ 
      userId: userId, 
      event_status: { $in: ['confirmed','live'] }
    })
    .sort({ createdAt: -1 })
    .exec();
    const allBankDetails = [];
    tickets.forEach(ticket => {
      const hasSubEvents = ticket.sub_events && ticket.sub_events.length > 0;
      if (ticket.banking_details && ticket.banking_details.length > 0) {
        ticket.banking_details.forEach(bank => {
          allBankDetails.push({
            event_id: ticket._id,
            event_name: ticket.event_name || "N/A",
            event_type: "Main Event",
            bank_acc_type: bank.bank_acc_type || "N/A",
            bank_acc_no: bank.bank_acc_no || "N/A",
            bank_ifsc: bank.bank_ifsc || "N/A",
            bank_acc_holder: bank.bank_acc_holder || "N/A",
            bank_detail_id: bank._id
          });
        });
      }
      if (hasSubEvents) {
        ticket.sub_events.forEach((subEvent, index) => {
          if (subEvent.banking_details && subEvent.banking_details.length > 0) {
            subEvent.banking_details.forEach(bank => {
              allBankDetails.push({
                event_id: subEvent._id,
                event_name: subEvent.event_name || "N/A",
                event_type: "Sub Event",
                parent_event_name: ticket.event_name || "N/A",
                bank_acc_type: bank.bank_acc_type || "N/A",
                bank_acc_no: bank.bank_acc_no || "N/A",
                bank_ifsc: bank.bank_ifsc || "N/A",
                bank_acc_holder: bank.bank_acc_holder || "N/A",
                bank_detail_id: bank._id
              });
            });
          } else {
            console.log('No banking details found for sub-event:', subEvent.event_name);
          }
        });
      }
    });
    res.status(200).json({
      success: true,
      count: allBankDetails.length,
      bankDetails: allBankDetails
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
export const showAllBankDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Fetch all tickets and groups for the user
    const tickets = await Ticket.find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();
    const groups = await Group.find({ userId: userId })
      .sort({ createdAt: -1 })
      .exec();
    console.log("Total tickets found:", tickets.length);
    console.log("Total groups found:", groups.length);
    const allBankDetails = [];
    // Process Main Events
    tickets.forEach(ticket => {
      const hasSubEvents = ticket.sub_events && ticket.sub_events.length > 0;
      if (ticket.banking_details && ticket.banking_details.length > 0) {
        ticket.banking_details.forEach(bank => {
          allBankDetails.push({
            source_type: "Event",
            source_category: "Main Event",
            source_id: ticket._id,
            source_name: ticket.event_name || "N/A",
            parent_name: null,
            bank_acc_type: bank.bank_acc_type || "N/A",
            bank_acc_no: bank.bank_acc_no || "N/A",
            bank_ifsc: bank.bank_ifsc || "N/A",
            bank_acc_holder: bank.bank_acc_holder || "N/A",
            bank_detail_id: bank._id
          });
        });
      }
      // Process Sub Events
      if (hasSubEvents) {
        ticket.sub_events.forEach((subEvent) => {
          if (subEvent.banking_details && subEvent.banking_details.length > 0) {
            subEvent.banking_details.forEach(bank => {
              allBankDetails.push({
                source_type: "Event",
                source_category: "Sub Event",
                source_id: subEvent._id,
                source_name: subEvent.event_name || "N/A",
                parent_name: ticket.event_name || "N/A",
                bank_acc_type: bank.bank_acc_type || "N/A",
                bank_acc_no: bank.bank_acc_no || "N/A",
                bank_ifsc: bank.bank_ifsc || "N/A",
                bank_acc_holder: bank.bank_acc_holder || "N/A",
                bank_detail_id: bank._id
              });
            });
          }
        });
      }
    });
    // Process Groups - Bank details are stored as individual fields
    groups.forEach(group => {
      console.log("Processing group:", group.name);
      
      // Check if group has primary bank account details
      if (group.primary_bank_acc_no && group.primary_bank_acc_no.trim() !== '') {
        console.log(`Found bank details for group ${group.name}`);
        
        allBankDetails.push({
          source_type: "Group",
          source_category: "Group",
          source_id: group._id,
          source_name: group.name || "N/A",
          parent_name: null,
          bank_acc_type: group.primary_bank_acc_type || "N/A",
          bank_acc_no: group.primary_bank_acc_no || "N/A",
          bank_ifsc: group.primary_bank_ifsc || "N/A",
          bank_acc_holder: group.primary_bank_acc_holder || "N/A",
          bank_detail_id: group._id // Using group _id as there's no separate bank detail id
        });
      } else {
        console.log(`No banking details found for group ${group.name || group._id}`);
      }
    });

    console.log("Total bank details collected:", allBankDetails.length);

    res.status(200).json({
      success: true,
      count: allBankDetails.length,
      bankDetails: allBankDetails,
      summary: {
        total: allBankDetails.length,
        from_main_events: allBankDetails.filter(b => b.source_category === "Main Event").length,
        from_sub_events: allBankDetails.filter(b => b.source_category === "Sub Event").length,
        from_groups: allBankDetails.filter(b => b.source_category === "Group").length
      }
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
export const LiveEventBankDetails = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const tickets = await Ticket.find({ 
      userId: userId, 
      event_status: 'live' }).sort({ createdAt: -1 }).exec();
    const allBankDetails = [];
    tickets.forEach(ticket => {
      const hasSubEvents = ticket.sub_events && ticket.sub_events.length > 0;
      if (ticket.banking_details && ticket.banking_details.length > 0) {
        ticket.banking_details.forEach(bank => {
          allBankDetails.push({
            event_id: ticket._id,
            event_name: ticket.event_name || "N/A",
            event_type: "Main Event",
            bank_acc_type: bank.bank_acc_type || "N/A",
            bank_acc_no: bank.bank_acc_no || "N/A",
            bank_ifsc: bank.bank_ifsc || "N/A",
            bank_acc_holder: bank.bank_acc_holder || "N/A",
            bank_detail_id: bank._id
          });
        });
      }
      if (hasSubEvents) {
        ticket.sub_events.forEach((subEvent, index) => {
          if (subEvent.banking_details && subEvent.banking_details.length > 0) {
            subEvent.banking_details.forEach(bank => {
              allBankDetails.push({
                event_id: subEvent._id,
                event_name: subEvent.event_name || "N/A",
                event_type: "Sub Event",
                parent_event_name: ticket.event_name || "N/A",
                bank_acc_type: bank.bank_acc_type || "N/A",
                bank_acc_no: bank.bank_acc_no || "N/A",
                bank_ifsc: bank.bank_ifsc || "N/A",
                bank_acc_holder: bank.bank_acc_holder || "N/A",
                bank_detail_id: bank._id
              });
            });
          } else {
            console.log('No banking details found for sub-event:', subEvent.event_name);
          }
        });
      }
    });
    res.status(200).json({
      success: true,
      count: allBankDetails.length,
      bankDetails: allBankDetails
    });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
export const likeEvent = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid ticket ID format"
      });
    }
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }
    const existingLike = await TicketLike.findOne({
      ticketId: ticketId,
      userId: userId.toString()
    });
    if (existingLike) {
      return res.status(400).json({
        message: "Event already liked by this user"
      });
    }
    await TicketLike.create({
      ticketId: ticketId,
      userId: userId.toString()
    });
    await Ticket.findByIdAndUpdate(
      ticketId,
      { $inc: { like: 1 } },
      { new: false }
    );
    const updatedTicket = await Ticket.findById(ticketId);
    res.status(200).json({
      message: "Event liked successfully",
      likeCount: updatedTicket.like
    });
  } catch (error) {
    console.error("Error liking event:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Event already liked by this user"
      });
    }
    res.status(500).json({
      message: "An error occurred while liking the event",
      error: error.message
    });
  }
};
export const unlikeEvent = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid ticket ID format"
      });
    }
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }
    const deletedLike = await TicketLike.findOneAndDelete({
      ticketId: ticketId,
      userId: userId.toString()
    });
    if (!deletedLike) {
      return res.status(400).json({
        message: "Event is not liked by this user"
      });
    }
    await Ticket.findByIdAndUpdate(
      ticketId,
      { $inc: { like: -1 } },
      { new: false }
    );
    const updatedTicket = await Ticket.findById(ticketId);
    res.status(200).json({
      message: "Event unliked successfully",
      likeCount: updatedTicket.like
    });
  } catch (error) {
    console.error("Error unliking event:", error);
    res.status(500).json({
      message: "An error occurred while unliking the event",
      error: error.message
    });
  }
};

// Check if user liked an event (useful for UI)
export const checkUserLiked = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const ticketId = req.params.ticketId;
    const liked = await TicketLike.exists({
      ticketId: ticketId,
      userId: userId.toString()
    });
    res.status(200).json({
      liked: !!liked
    });
  } catch (error) {
    console.error("Error checking like status:", error);
    res.status(500).json({
      message: "An error occurred",
      error: error.message
    });
  }
};
export const groupEventCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const groups = await Group.find({ userId: userId });
    if (!groups || groups.length === 0) {
      return res.status(200).json({
        message: "No groups found",
        groups: [],
        totalGroups: 0
      });
    }
    const groupsWithEventCount = await Promise.all(
      groups.map(async (group) => {
        const eventCount = await Ticket.countDocuments({ groupId: group._id });
        return {
          _id: group._id,
          name: group.name,
          group_name: group.group_name,
          company_logo: group.company_logo,
          events_count: eventCount,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        };
      })
    );
    
    res.status(200).json({
      message: "Group event count retrieved successfully",
      groups: groupsWithEventCount,
      totalGroups: groups.length
    });
  } catch (error) {
    console.error("Error fetching group event count:", error);
    res.status(500).json({
      message: "An error occurred while fetching group event count",
      error: error.message
    });
  }
};
export const totalEventsCreatedCount = async (req, res) => {
  try {
    // Aggregate to get all users with their ticket counts
    const userEventCounts = await Ticket.aggregate([
      {
        $match: {
          event_status: { $in: ['live', 'completed'] }
        }
      },
      {
        $addFields: {
          userId: {
            $ifNull: ['$userId', { $ifNull: ['$user_id', '$createdBy'] }]
          }
        }
      },
      {
        $match: {
          userId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          eventsCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          eventsCount: 1
        }
      },
      {
        $sort: { eventsCount: -1 }
      }
    ]);

    // Calculate total tickets
    const totalTickets = userEventCounts.reduce((sum, user) => sum + user.eventsCount, 0);

    if (!userEventCounts || userEventCounts.length === 0) {
      return res.status(200).json({
        message: "No tickets found",
        totalTickets: 0,
        userEventCounts: []
      });
    }

    res.status(200).json({
      message: "User total events created count retrieved successfully",
      totalTickets: totalTickets,
      totalUsers: userEventCounts.length,
      userEventCounts: userEventCounts
    });
  } catch (error) {
    console.error("Error fetching users total events created count:", error);
    res.status(500).json({
      message: "An error occurred while fetching user event count",
      error: error.message
    });
  }
};



const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAP_API || 'AIzaSyB5MQdwuxFIG6Msf_At0bV2vPXuFwEkVkI'; 

export const getPostalDetailsFromCoords = async (req, res) => {
    const { lat, lng } = req.query; 

    if (!lat || !lng) {
        return res.status(400).json({ 
            message: "Missing latitude or longitude parameters" 
        });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ 
            message: "Invalid latitude or longitude format" 
        });
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        // 2. Make external API request
        const response = await axios.get(url);
        const data = response.data;

        // 3. Handle API failure states
        if (data.status !== 'OK' || data.results.length === 0) {
            console.warn(`Geocoding failed for ${lat},${lng}. Status: ${data.status}`);
            return res.status(404).json({ 
                message: "Location details not found for these coordinates",
                status: data.status 
            });
        }

        // 4. Extract required fields (Postal Code, State, Country)
        const addressComponents = data.results[0].address_components;

        let postalCode = null;
        let state = null;
        let country = null;
        let locality = null;

        for (const component of addressComponents) {
            if (component.types.includes('postal_code')) {
                postalCode = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name; // E.g., "Kerala"
            }
            if (component.types.includes('country')) {
                country = component.long_name; // E.g., "India"
            }
            if (component.types.includes('locality') && !locality) {
                locality = component.long_name;
            }
            // Often, the city/town is administrative_area_level_2 if 'locality' is missing
            if (component.types.includes('administrative_area_level_2') && !locality) {
                locality = component.long_name;
            }
        }
        
        // 5. Respond with structured data
        res.status(200).json({
            message: "Location details retrieved successfully",
            data: {
                postalCode: postalCode || 'N/A',
                state: state || 'N/A',
                country: country || 'N/A',
                locality: locality || 'N/A',
                formattedAddress: data.results[0].formatted_address
            }
        });

    } catch (error) {
        console.error("Error performing reverse geocoding:", error.message);
        
        
        res.status(500).json({
            message: "Failed to retrieve postal details from external API",
            error: error.message
        });
    }
};

// ... (Rest of your ticket.controller.js file)
