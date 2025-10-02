import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
import { uploadTicketMedia, uploadFields } from '../middlewares/upload.js';
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

    // Validate IDs
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
    // Handle file uploads first
    await new Promise((resolve, reject) => {
      uploadTicketMedia(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(err);
        }
        resolve();
      });
    });

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

    // Process file uploads
    const processedFiles = {};
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const docExtensions = ['.pdf', '.doc', '.docx'];
    const uploadedFiles = req.files || {};

    // Extract guest profile files and ticket photo files
    const guestProfileFiles = {};
    const ticketPhotoFiles = {};
    
    Object.keys(uploadedFiles).forEach(fieldName => {
      if (fieldName.startsWith('guest_profile_')) {
        const index = fieldName.split('_')[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const profileFile = uploadedFiles[fieldName][0];
          const ext = '.' + profileFile.originalname.toLowerCase().split('.').pop();
          if (imageExtensions.includes(ext)) {
            guestProfileFiles[parseInt(index)] = profileFile;
          }
        }
      }
      
      if (fieldName.startsWith('ticket_photo_')) {
        const index = fieldName.split('_')[2];
        if (!isNaN(index) && parseInt(index) >= 0) {
          const ticketPhotoFile = uploadedFiles[fieldName][0];
          const ext = '.' + ticketPhotoFile.originalname.toLowerCase().split('.').pop();
          if (imageExtensions.includes(ext)) {
            ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
          }
        }
      }
    });

    // Handle event banner
    if (uploadedFiles.event_banner && uploadedFiles.event_banner[0]) {
      const bannerFile = uploadedFiles.event_banner[0];
      const ext = '.' + bannerFile.originalname.toLowerCase().split('.').pop();
      if (imageExtensions.includes(ext)) {
        processedFiles.event_banner = bannerFile.path;
      }
    }

    // Handle event logo
    if (uploadedFiles.event_logo && uploadedFiles.event_logo[0]) {
      const logoFile = uploadedFiles.event_logo[0];
      const ext = '.' + logoFile.originalname.toLowerCase().split('.').pop();
      if (imageExtensions.includes(ext)) {
        processedFiles.event_logo = logoFile.path;
      }
    }

    // Handle event images
    if (uploadedFiles.event_images && uploadedFiles.event_images.length > 0) {
      if (uploadedFiles.event_images.length <= 10) {
        const validImages = uploadedFiles.event_images.filter(file => {
          const ext = '.' + file.originalname.toLowerCase().split('.').pop();
          return imageExtensions.includes(ext);
        });
        
        processedFiles.event_images = validImages.map(file => ({
          path: file.path,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        }));
      }
    }

    // Handle event rules file
    if (uploadedFiles.event_rules && uploadedFiles.event_rules[0]) {
      const rulesFile = uploadedFiles.event_rules[0];
      const ext = '.' + rulesFile.originalname.toLowerCase().split('.').pop();
      if (docExtensions.includes(ext)) {
        processedFiles.event_rules = {
          type: 'file',
          path: rulesFile.path,
          originalName: rulesFile.originalname,
          mimeType: rulesFile.mimetype,
          size: rulesFile.size,
          uploadedAt: new Date()
        };
      }
    }

    // Handle ticket layout (offline only)
    if (uploadedFiles.ticket_layout && uploadedFiles.ticket_layout[0]) {
      const layoutFile = uploadedFiles.ticket_layout[0];
      const ext = '.' + layoutFile.originalname.toLowerCase().split('.').pop();
      if (imageExtensions.includes(ext)) {
        processedFiles.ticket_layout = layoutFile.path;
      }
    }

    // Parse nested data
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
        
        // Add uploaded profile image if available
        if (guestProfileFiles[index]) {
          guestData.guest_profile = guestProfileFiles[index].path;
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
          ticket_photo: ticket.ticket_photo || existingSubEvent.ticket_types?.[index]?.ticket_photo || ''
        };
        
        // Add uploaded ticket photo if available
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path;
        }
        
        return ticketData;
      });
    } else if (existingSubEvent.ticket_types) {
      processedTicketTypes = existingSubEvent.ticket_types;
    }

    // Build updated sub-event object
    const updatedSubEvent = {
      ...existingSubEvent.toObject(),
      _id: existingSubEvent._id, // Preserve ID
      
      // Basic fields
      event_name: updateData.event_name || existingSubEvent.event_name,
      event_category: updateData.event_category || existingSubEvent.event_category,
      event_subcategory: updateData.event_subcategory || existingSubEvent.event_subcategory,
      event_type: updateData.event_type || existingSubEvent.event_type,
      location_type: updateData.location_type || existingSubEvent.location_type,
      min_age_allowed: updateData.min_age_allowed !== undefined ? Number(updateData.min_age_allowed) : existingSubEvent.min_age_allowed,
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
      event_dates: updateData.event_dates ? parseNestedData(updateData.event_dates, 'event_dates') : existingSubEvent.event_dates,
      
      // File uploads with fallback to existing
      event_banner: processedFiles.event_banner || existingSubEvent.event_banner,
      event_logo: processedFiles.event_logo || existingSubEvent.event_logo,
      event_images: processedFiles.event_images || existingSubEvent.event_images || [],
    };

    // Handle event_rules (file or text)
    if (processedFiles.event_rules) {
      updatedSubEvent.event_rules = processedFiles.event_rules;
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
      
      // Parse exact_map_location
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
      updatedSubEvent.ticket_types = processedTicketTypes;
      updatedSubEvent.ticket_layout = processedFiles.ticket_layout || existingSubEvent.ticket_layout;
      
      // Clear online fields
      updatedSubEvent.event_link = undefined;
      updatedSubEvent.verification_event_code = undefined;
      
    } else if (locationType === 'online' || locationType === 'recorded') {
      updatedSubEvent.event_link = updateData.event_link || existingSubEvent.event_link;
      updatedSubEvent.verification_event_code = updateData.verification_event_code || existingSubEvent.verification_event_code;
      
      // Clear offline fields
      updatedSubEvent.seating_arrangement = undefined;
      updatedSubEvent.location = undefined;
      updatedSubEvent.venue = undefined;
      updatedSubEvent.exact_map_location = {
        latitude: undefined,
        longitude: undefined,
        address: undefined
      };
      updatedSubEvent.gate_open_time = undefined;
      updatedSubEvent.prohibited_items = [];
      updatedSubEvent.ticket_types = [];
      updatedSubEvent.ticket_layout = undefined;
    }

    // Update the sub-event in the array
    ticket.sub_events[subEventIndex] = updatedSubEvent;

    // Save the ticket
    await ticket.save();

    res.status(200).json({
      message: 'Sub-event updated successfully',
      sub_event: ticket.sub_events[subEventIndex],
      updatedFields: {
        location_type: updatedSubEvent.location_type,
        event_banner: processedFiles.event_banner ? 'updated' : 'unchanged',
        event_rules: processedFiles.event_rules ? 'updated' : (updateData.event_rules_text ? 'updated (text)' : 'unchanged'),
        guests: processedGuests.length,
        ticket_types: processedTicketTypes.length
      }
    });

  } catch (error) {
    console.error('Error updating sub-event:', error);
    
    // Handle specific errors
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
export const getMyEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const tickets = await Ticket.find({ userId: userId })
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
            status: 'live',
            event_start_date: { $lte: currentDate },
            event_end_date: { $gte: currentDate }
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
        const currentDate = new Date();
        const ticket = await Ticket.findOne({ 
            _id: ticketId,
            userId: userId,
            status: 'live',
            event_start_date: { $lte: currentDate },
            event_end_date: { $gte: currentDate }
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
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: userId,
            status: 'completed',
            event_end_date: { $lt: currentDate }
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
export const getMyUpcomingEvents = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const currentDate = new Date();
        const tickets = await Ticket.find({ 
            userId: userId,
            status: 'pending',
            event_start_date: { $gt: currentDate }
        });
        res.status(200).json({
            message: "My Upcoming Tickets retrieved successfully",
            tickets: tickets
        });
    } catch (error) {
        console.error("Error fetching upcoming tickets:", error);
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
                event_status: ['completed','live','pending']
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
export const getOtherLiveEvents = async(req, res)=>{
  try {
      const other = req.params.otherId;
      const currentDate = new Date();
      const tickets = await Ticket.find({ 
                userId: other,
                status: 'live',
                event_start_date: { $lte: currentDate },
                event_end_date: { $gte: currentDate }
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
            status: 'completed',
            event_end_date: { $lt: currentDate }
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
import mongoose from 'mongoose';

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
    
    console.log("Total tickets found:", totalTicketsCheck);
    
    // Single aggregation query to get ticket counts per group
    const ticketStats = await Ticket.aggregate([
      {
        $match: {
          groupId: { $in: groupIds },
          status: { $in: ['live', 'completed', 'pending'] }
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
export const confirmEvent = async(req, res) => {
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
    ticket.event_status = 'confirmed';
    await ticket.save();
    res.status(200).json({
      message: "Event confirmed successfully",
      ticket: ticket
    });
  }
  catch (error) {
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
    const ticket = await Ticket.findOne({ _id: ticketId, userId: userId });
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found"
      });
    }
    ticket.event_status = 'live';
    await ticket.save();
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
