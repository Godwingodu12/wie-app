import Group from "../models/group.model.js";
import Ticket from "../models/ticket.model.js";
import axios from 'axios';
import TicketLike from '../models/ticketLike.model.js';
import { createNotification } from '../utils/notificationHelper.js';
import { logger } from '../utils/logger.js';
import { uploadTicketMedia, uploadFields } from '../middlewares/upload.js';
import { validateIFSCCode,validateAadhaarDocument } from "../utils/datavalidationHelper.js";
import { getBookingStatsByDate, getBookingGrowthStats, getMonthlyBookingChart } from '../grpc/bookingClient.js';
import { 
  generateSeatingLayoutFromFile, 
  validateSeatingLayout,
  generateFallbackLayout  
} from '../utils/seatingLayoutGenerator.js';
import {
  processFileUploads,
  deleteFromCloudinary,
  processGroupFileUploads,
  cleanupTempFile,
  uploadGeneratedLayoutToCloudinary,
  downloadFileFromCloudinary
} from "../utils/cloudinaryHelper.js";
import mongoose from 'mongoose';
export const getGroupsTypes = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const userRole = req.user.role;
        const groups = await Group.find({ userId: userId });
        const adminGroups = groups.filter(group => group.grp_type === 'admin');
        const orgGroups = groups.filter(group => group.grp_type === 'organisation');
        
        logger.info('Groups retrieved successfully', {
            userId,
            userRole,
            adminCount: adminGroups.length,
            organisationCount: orgGroups.length
        });
        
        res.status(200).json({
            message: "Groups retrieved successfully",
            adminCount: adminGroups.length,
            userRole: userRole,
            organisationCount: orgGroups.length,
            adminGroups: adminGroups,
            organisationGroups: orgGroups
        });
    } catch (error) {
        logger.error('Error fetching groups', {
            error: error.message,
            stack: error.stack,
            userId: req.user?._id || req.user?.id
        });
        
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};

export const getTicketSubEvents = async (req, res) => {
  const ticketId = req.params.ticketId;
  
  if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
    logger.warn('Invalid ticket ID format provided', { ticketId });
    return res.status(400).json({ 
      message: "Invalid ticket ID format" 
    });
  }
  
  try {
    const ticket = await Ticket.findById(ticketId).select('sub_events event_name');
    
    if (!ticket) {
      logger.warn('Ticket not found', { ticketId });
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.status(200).json({
      message: "Sub-events retrieved successfully",
      eventName: ticket.event_name,
      subEvents: ticket.sub_events || [],
      totalSubEvents: ticket.sub_events ? ticket.sub_events.length : 0
    });
  } catch (error) {
    logger.error('Error getting sub-events', {
      error: error.message,
      stack: error.stack,
      ticketId
    });
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
      
      // ✅ ADD THIS LOGGING
      console.log('📥 Received updateData:', {
        hasSeatingLayout: !!updateData.seating_layout,
        locationType: updateData.location_type,
        totalCapacity: updateData.total_capacity
      });
      
      if (updateData.seating_layout) {
        console.log('📥 Received seating_layout structure:', {
          hasRows: !!updateData.seating_layout.rows,
          hasColumns: !!updateData.seating_layout.columns,
          hasSeats: !!updateData.seating_layout.seats,
          seatCount: updateData.seating_layout.seats?.length || 0,
          hasAssignments: !!updateData.seating_layout.ticketTypeAssignments,
          assignmentCount: updateData.seating_layout.ticketTypeAssignments?.length || 0,
          sampleSeat: updateData.seating_layout.seats?.[0]
        });
        
        // Check for assigned seats with prices
        const assignedSeats = updateData.seating_layout.seats?.filter(s => s.ticketTypeId) || [];
        const seatsWithPrice = assignedSeats.filter(s => s.price && s.price > 0);
        
        console.log('📥 Seating layout seat pricing:', {
          totalSeats: updateData.seating_layout.seats?.length || 0,
          assignedSeats: assignedSeats.length,
          seatsWithPrice: seatsWithPrice.length,
          sampleAssignedSeat: assignedSeats[0]
        });
      }
    } catch (parseError) {
      console.error('❌ Parse error:', parseError);
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
    const uploadedFiles = await processFileUploads(req.files || {});
    const guestProfileFiles = {};
    const ticketPhotoFiles = {};
    
    // Process guest profiles and ticket photos
    Object.keys(uploadedFiles).forEach(fieldName => {
      if (fieldName.startsWith('guest_profile_')) {
        const index = fieldName.split('_')[2];
        if (!isNaN(index) && parseInt(index) >= 0 && parseInt(index) <= 9) {
          const fileData = uploadedFiles[fieldName];
          if (Array.isArray(fileData) && fileData.length > 0) {
            const profileFile = fileData[0];
            if (profileFile.path && profileFile.originalName) {
              guestProfileFiles[parseInt(index)] = profileFile;
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
            if (ticketPhotoFile.path && ticketPhotoFile.originalName) {
              ticketPhotoFiles[parseInt(index)] = ticketPhotoFile;
            }
          }
        }
      }
    });
    
    // Handle event banner
    if (uploadedFiles.event_banner) {
      let bannerFile = uploadedFiles.event_banner;
      if (typeof bannerFile === 'string') {
        processedFiles.event_banner = bannerFile;
      } else if (Array.isArray(bannerFile) && bannerFile.length > 0) {
        processedFiles.event_banner = bannerFile[0].path;
        processedFiles.event_banner_public_id = bannerFile[0].public_id;
      } else if (bannerFile.path) {
        processedFiles.event_banner = bannerFile.path;
        processedFiles.event_banner_public_id = bannerFile.public_id;
      }
    }
    
    // Handle event logo
    if (uploadedFiles.event_logo) {
      let logoFile = uploadedFiles.event_logo;
      if (typeof logoFile === 'string') {
        processedFiles.event_logo = logoFile;
      } else if (Array.isArray(logoFile) && logoFile.length > 0) {
        processedFiles.event_logo = logoFile[0].path;
        processedFiles.event_logo_public_id = logoFile[0].public_id;
      } else if (logoFile.path) {
        processedFiles.event_logo = logoFile.path;
        processedFiles.event_logo_public_id = logoFile.public_id;
      }
    }
    
    // Handle event images
    if (uploadedFiles.event_images && uploadedFiles.event_images.length > 0) {
      if (uploadedFiles.event_images.length <= 10) {
        const validImages = uploadedFiles.event_images.filter(file => 
          file.path && file.originalName
        );
        
        if (validImages.length > 0) {
          processedFiles.event_images = validImages.map(file => ({
            path: file.path,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            public_id: file.public_id,
            resource_type: file.resource_type,
            uploadedAt: new Date()
          }));
        }
      }
    }
    
    // Handle event rules
    if (uploadedFiles.event_rules) {
      let rulesFile = uploadedFiles.event_rules;
      if (Array.isArray(rulesFile) && rulesFile.length > 0) {
        rulesFile = rulesFile[0];
      }
      if (rulesFile && rulesFile.path) {
        processedFiles.event_rules = {
          type: 'file',
          path: rulesFile.path,
          originalName: rulesFile.originalName,
          mimeType: rulesFile.mimeType,
          size: rulesFile.size,
          public_id: rulesFile.public_id,
          resource_type: rulesFile.resource_type,
          uploadedAt: new Date()
        };
      }
    }

    // ✅ Handle ticket layout and seating layout generation
    let processedSeatingLayout = null;
    if (uploadedFiles.ticket_layout) {
      let layoutFile = uploadedFiles.ticket_layout;
      
      // Normalize to object if needed
      if (typeof layoutFile === 'string') {
        processedFiles.ticket_layout = layoutFile;
      } else if (Array.isArray(layoutFile) && layoutFile.length > 0) {
        layoutFile = layoutFile[0];
      }
      
      if (layoutFile && typeof layoutFile === 'object') {
        // Store the uploaded file URL
        if (layoutFile.cloudinaryUrl) {
          processedFiles.ticket_layout = layoutFile.cloudinaryUrl;
          processedFiles.ticket_layout_public_id = layoutFile.public_id || '';
        } else if (layoutFile.path) {
          processedFiles.ticket_layout = layoutFile.path;
          processedFiles.ticket_layout_public_id = layoutFile.public_id || '';
        }

        // Generate seating layout if this is an offline event
        const locationType = updateData.location_type || existingSubEvent.location_type;
        const totalCapacity = updateData.total_capacity || existingSubEvent.total_capacity;
        
        if (locationType === 'offline' && totalCapacity && Number(totalCapacity) > 0) {
          try {
            let localFilePath = layoutFile.localPath;
            
            // Download from Cloudinary if needed
            if (!localFilePath && layoutFile.cloudinaryUrl) {
              localFilePath = await downloadFileFromCloudinary(
                layoutFile.cloudinaryUrl,
                `layout_${ticketId}_${Date.now()}.${layoutFile.mimeType?.split('/')[1] || 'jpg'}`
              );
            }
            
            if (localFilePath) {
              console.log('🔄 Generating seating layout from uploaded file...');
              
              const generatedLayout = await generateSeatingLayoutFromFile(
                localFilePath,
                Number(totalCapacity),
                layoutFile.mimeType || 'image/jpeg'
              );
              
              // Clean up temp file if downloaded
              if (layoutFile.cloudinaryUrl && localFilePath !== layoutFile.localPath) {
                await cleanupTempFile(localFilePath);
              }
              
              if (generatedLayout && generatedLayout.seats && generatedLayout.seats.length > 0) {
                processedSeatingLayout = {
                  rows: generatedLayout.rows || [],
                  columns: generatedLayout.columns || 0,
                  seats: generatedLayout.seats.map(seat => ({
                    seatId: String(seat.seatId),
                    row: String(seat.row),
                    column: Number(seat.column),
                    isAvailable: seat.isAvailable !== false,
                    isSelected: false,
                    ticketTypeId: seat.ticketTypeId ? String(seat.ticketTypeId) : null,
                    ticketTypeName: seat.ticketTypeName ? String(seat.ticketTypeName) : null,
                    ticketTypeColor: seat.ticketTypeColor ? String(seat.ticketTypeColor) : null,
                    price: Number(seat.price !== undefined ? seat.price : 0),
                  })),
                  ticketTypeAssignments: (generatedLayout.ticketTypeAssignments || []).map(assignment => ({
                    ticketTypeId: String(assignment.ticketTypeId),
                    ticketTypeName: String(assignment.ticketTypeName),
                    color: assignment.color ? String(assignment.color) : "",
                    assignedSeats: (assignment.assignedSeats || []).map(seat => String(seat)),
                    capacity: Number(assignment.capacity || 0),
                    price: Number(assignment.price !== undefined ? assignment.price : 0),
                  })),
                };
                
                console.log('✅ Seating layout generated successfully:', {
                  totalSeats: processedSeatingLayout.seats.length,
                  assignments: processedSeatingLayout.ticketTypeAssignments.length,
                });
              }
            }
          } catch (layoutError) {
            console.error('❌ Layout generation failed:', layoutError);
            console.log('⚠️ Continuing without seating layout generation');
          }
        }
      }
    }
    if (updateData.seating_layout) {  
      try {
        const seatingLayoutData = typeof updateData.seating_layout === 'string'
          ? JSON.parse(updateData.seating_layout)
          : updateData.seating_layout;

        if (seatingLayoutData && seatingLayoutData.seats && seatingLayoutData.seats.length > 0) {
          // Map and validate each seat - PRESERVE ALL FIELDS
          const processedSeats = seatingLayoutData.seats.map((seat) => {
            const seatId = String(seat.seatId || '');
            const row = String(seat.row || '');
            const column = Number(seat.column || 0);
            const ticketTypeId = seat.ticketTypeId ? String(seat.ticketTypeId) : null;
            const ticketTypeName = seat.ticketTypeName ? String(seat.ticketTypeName) : null;
            const ticketTypeColor = seat.ticketTypeColor ? String(seat.ticketTypeColor) : null;
            const price = seat.price !== undefined && seat.price !== null ? Number(seat.price) : 0;

            // ✅ ALWAYS return complete object
            return {
              seatId: seatId,
              row: row,
              column: column,
              isAvailable: seat.isAvailable !== false,
              isSelected: false,
              ticketTypeId: ticketTypeId,
              ticketTypeName: ticketTypeName,
              ticketTypeColor: ticketTypeColor,
              price: price
            };
          });

          // Map assignments - PRESERVE ALL FIELDS
          const processedAssignments = (seatingLayoutData.ticketTypeAssignments || [])
            .filter(assignment => 
              assignment.ticketTypeId && 
              assignment.ticketTypeName && 
              String(assignment.ticketTypeName).trim() !== ''
            )
            .map(assignment => ({
              ticketTypeId: String(assignment.ticketTypeId),
              ticketTypeName: String(assignment.ticketTypeName),
              color: assignment.color ? String(assignment.color) : "",
              assignedSeats: (assignment.assignedSeats || []).map(s => String(s)),
              capacity: Number(assignment.capacity || 0),
              price: Number(assignment.price !== undefined ? assignment.price : 0),
            }));

          processedSeatingLayout = {
            rows: (seatingLayoutData.rows || []).map(r => String(r)),
            columns: Number(seatingLayoutData.columns || 0),
            seats: processedSeats,
            ticketTypeAssignments: processedAssignments
          };

          console.log('✅ Processed seating_layout from request:', {
            totalSeats: processedSeats.length,
            assignedSeats: processedSeats.filter(s => s.ticketTypeId).length,
            seatsWithPrice: processedSeats.filter(s => s.price > 0).length,
            seatsWithName: processedSeats.filter(s => s.ticketTypeName).length,
            assignments: processedAssignments.length
          });
        }
      } catch (parseError) {
        console.error('❌ Error parsing seating_layout from request:', parseError);
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

    // Parse nested data
    const guests = parseNestedData(updateData.guests, 'guests');
    const ticketTypes = parseNestedData(updateData.ticket_types, 'ticket_types');
    const rawBankingDetails = parseNestedData(updateData.banking_details, 'banking_details');

    // ✅ Validate banking details with IFSC code verification
    let validatedBankingDetails = [];
    if (rawBankingDetails && rawBankingDetails.length > 0) {
      for (let index = 0; index < rawBankingDetails.length; index++) {
        const banking = rawBankingDetails[index];
        
        // Validate bank_acc_type
        if (!banking.bank_acc_type || String(banking.bank_acc_type).trim() === "") {
          return res.status(400).json({
            message: `bank_acc_type is required for banking detail ${index + 1}`,
            field: "bank_acc_type",
            bankingDetailIndex: index + 1,
          });
        }

        const validAccountTypes = ["current", "merchant"];
        const accType = String(banking.bank_acc_type).trim().toLowerCase();

        if (!validAccountTypes.includes(accType)) {
          return res.status(400).json({
            message: `Invalid bank account type for banking detail ${index + 1}`,
            provided: banking.bank_acc_type,
            validOptions: validAccountTypes,
          });
        }
        // Validate bank_acc_no
        if (!banking.bank_acc_no || String(banking.bank_acc_no).trim() === "") {
          return res.status(400).json({
            message: `bank_acc_no is required for banking detail ${index + 1}`,
          });
        }
        if (!/^\d+$/.test(String(banking.bank_acc_no).trim())) {
          return res.status(400).json({
            message: `Invalid bank account number format for banking detail ${index + 1}`,
            error: "Bank account number must contain only digits",
          });
        }

        const accNoLength = String(banking.bank_acc_no).trim().length;
        if (accNoLength < 9 || accNoLength > 18) {
          return res.status(400).json({
            message: `Invalid bank account number length for banking detail ${index + 1}`,
            error: `Account number must be between 9-18 digits. You entered ${accNoLength} digits`,
          });
        }

        // Validate bank_ifsc
        if (!banking.bank_ifsc || String(banking.bank_ifsc).trim() === "") {
          return res.status(400).json({
            message: `bank_ifsc is required for banking detail ${index + 1}`,
          });
        }

        const ifscCode = String(banking.bank_ifsc).trim().toUpperCase();
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        
        if (!ifscRegex.test(ifscCode)) {
          return res.status(400).json({
            message: `Invalid IFSC code format for banking detail ${index + 1}`,
            provided: ifscCode,
            example: "SBIN0001234",
          });
        }

        // Verify IFSC code
        let ifscValidation;
        try {
          ifscValidation = await validateIFSCCode(ifscCode);
          if (!ifscValidation.isValid) {
            return res.status(400).json({
              message: `IFSC code verification failed for banking detail ${index + 1}`,
              error: ifscValidation.error || "IFSC code not found in bank database",
              provided: ifscCode,
            });
          }
        } catch (ifscError) {
          return res.status(400).json({
            message: `IFSC code verification failed for banking detail ${index + 1}`,
            error: ifscError.message || "Unable to verify IFSC code",
            provided: ifscCode,
          });
        }

        // Validate bank_acc_holder
        if (!banking.bank_acc_holder || String(banking.bank_acc_holder).trim() === "") {
          return res.status(400).json({
            message: `bank_acc_holder is required for banking detail ${index + 1}`,
          });
        }

        if (!/^[a-zA-Z\s]+$/.test(String(banking.bank_acc_holder).trim())) {
          return res.status(400).json({
            message: `Invalid account holder name format for banking detail ${index + 1}`,
            error: "Account holder name must contain only letters and spaces",
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
    } else if (existingSubEvent.banking_details) {
      validatedBankingDetails = existingSubEvent.banking_details;
    }

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
          ticket_photo: ticket.ticket_photo || existingSubEvent.ticket_types?.[index]?.ticket_photo || '',
          ticket_photo_public_id: ticket.ticket_photo_public_id || existingSubEvent.ticket_types?.[index]?.ticket_photo_public_id || ''
        };
        
        if (ticketPhotoFiles[index]) {
          ticketData.ticket_photo = ticketPhotoFiles[index].path;
          ticketData.ticket_photo_public_id = ticketPhotoFiles[index].public_id;
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
      banking_details: validatedBankingDetails,
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

    // Handle event_rules
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

    // ✅ Handle location-type specific fields
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
      
      // ✅ Handle ticket_layout
      updatedSubEvent.ticket_layout = processedFiles.ticket_layout || existingSubEvent.ticket_layout;
      if (processedFiles.ticket_layout_public_id) {
        updatedSubEvent.ticket_layout_public_id = processedFiles.ticket_layout_public_id;
      }
      // ✅ Handle seating_layout - Priority: request body > generated > existing
      if (processedSeatingLayout && processedSeatingLayout.seats && processedSeatingLayout.seats.length > 0) {
        updatedSubEvent.seating_layout = processedSeatingLayout;
        // Detailed logging for verification
        const assignedSeats = processedSeatingLayout.seats.filter(s => s.ticketTypeId);
        const seatsWithPrice = assignedSeats.filter(s => s.price > 0);
        console.log('✅ Seating layout saved to updatedSubEvent:', {
          totalSeats: processedSeatingLayout.seats.length,
          assignedSeats: assignedSeats.length,
          seatsWithPrice: seatsWithPrice.length,
          assignments: processedSeatingLayout.ticketTypeAssignments?.length || 0,
          sampleAssignedSeat: assignedSeats[0],
          sampleAssignment: processedSeatingLayout.ticketTypeAssignments?.[0]
        });
      } else if (existingSubEvent.seating_layout) {
        updatedSubEvent.seating_layout = existingSubEvent.seating_layout;
        console.log('✅ Preserved existing seating layout');
      }
      
      // Clear online/recorded fields
      updatedSubEvent.event_link = undefined;
      updatedSubEvent.verification_event_code = undefined;
      
    } else if (locationType === 'online' || locationType === 'recorded') {
      updatedSubEvent.event_link = updateData.event_link || existingSubEvent.event_link;
      updatedSubEvent.verification_event_code = updateData.verification_event_code || existingSubEvent.verification_event_code;
      
      // Preserve prohibited_items and ticket_types for online/recorded events
      updatedSubEvent.prohibited_items = updateData.prohibited_items 
        ? parseJSONSafely(updateData.prohibited_items, []) 
        : (existingSubEvent.prohibited_items || []);
      
      updatedSubEvent.ticket_types = processedTicketTypes && processedTicketTypes.length > 0 
        ? processedTicketTypes 
        : (existingSubEvent.ticket_types || []);
      
      // Clear offline-specific fields
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
      updatedSubEvent.ticket_layout_public_id = undefined;
      updatedSubEvent.seating_layout = undefined;
    }
    // ✅ CRITICAL: Verify seating_layout structure before saving
    if (updatedSubEvent.seating_layout && updatedSubEvent.seating_layout.seats) {
      console.log('🔍 Final verification before MongoDB save:');
      const assignedSeats = updatedSubEvent.seating_layout.seats.filter(s => s.ticketTypeId);
      const seatsWithTypeName = assignedSeats.filter(s => s.ticketTypeName);
      const seatsWithPrice = assignedSeats.filter(s => s.price > 0);
      
      console.log('📊 Seating layout final stats:', {
        totalSeats: updatedSubEvent.seating_layout.seats.length,
        assignedSeats: assignedSeats.length,
        seatsWithTypeName: seatsWithTypeName.length,
        seatsWithPrice: seatsWithPrice.length
      });

      // ✅ BLOCKING VALIDATION
      const incompleteSeats = assignedSeats.filter(s => 
        !s.ticketTypeName || s.ticketTypeName === '' || s.price === 0
      );
      
      if (incompleteSeats.length > 0) {
        console.error('❌ BLOCKING SAVE: Found seats with incomplete data:', incompleteSeats.length);
        return res.status(400).json({
          message: 'Seating layout data incomplete',
          error: `${incompleteSeats.length} seats are missing ticket type names or prices`,
          hint: 'Please ensure all assigned seats have valid ticket type names and prices',
          samples: incompleteSeats.slice(0, 3).map(s => ({
            seatId: s.seatId,
            ticketTypeId: s.ticketTypeId,
            ticketTypeName: s.ticketTypeName,
            price: s.price
          }))
        });
      }
    }
    if (updatedSubEvent.seating_layout) {
      updatedSubEvent.seating_layout = JSON.parse(JSON.stringify(updatedSubEvent.seating_layout));
    }
    // Save updated sub-event
    ticket.sub_events[subEventIndex] = updatedSubEvent;
    ticket.markModified('sub_events');
    await ticket.save();
    const savedTicket = await Ticket.findById(ticketId);
    const savedSubEvent = savedTicket.sub_events[subEventIndex];
    if (savedSubEvent.seating_layout && savedSubEvent.seating_layout.seats) {
      console.log('🔍 POST-SAVE VERIFICATION:');
      
      const savedAssignedSeats = savedSubEvent.seating_layout.seats.filter(s => s.ticketTypeId);
      const savedSeatsWithTypeName = savedAssignedSeats.filter(s => s.ticketTypeName);
      const savedSeatsWithPrice = savedAssignedSeats.filter(s => s.price > 0);
      
      console.log('📊 Saved seating layout stats:', {
        totalSeats: savedSubEvent.seating_layout.seats.length,
        assignedSeats: savedAssignedSeats.length,
        seatsWithTypeName: savedSeatsWithTypeName.length,
        seatsWithPrice: savedSeatsWithPrice.length
      });

      // Sample verification
      const savedSampleSeat = savedAssignedSeats[0];
      if (savedSampleSeat) {
        console.log('🔍 Sample seat AFTER save:', {
          seatId: savedSampleSeat.seatId,
          ticketTypeId: savedSampleSeat.ticketTypeId,
          ticketTypeName: savedSampleSeat.ticketTypeName,
          ticketTypeColor: savedSampleSeat.ticketTypeColor,
          price: savedSampleSeat.price,
          allKeys: Object.keys(savedSampleSeat)
        });
      }

      // Check what was lost
      if (savedSeatsWithTypeName.length < savedAssignedSeats.length) {
        console.error('❌ CRITICAL: ticketTypeName was lost during save!', {
          expectedCount: savedAssignedSeats.length,
          actualCount: savedSeatsWithTypeName.length,
          lost: savedAssignedSeats.length - savedSeatsWithTypeName.length
        });
      }

      if (savedSeatsWithPrice.length < savedAssignedSeats.length) {
        console.error('❌ CRITICAL: price was lost during save!', {
          expectedCount: savedAssignedSeats.length,
          actualCount: savedSeatsWithPrice.length,
          lost: savedAssignedSeats.length - savedSeatsWithPrice.length
        });
      }
    }
    res.status(200).json({
      message: 'Sub-event updated successfully',
      sub_event: ticket.sub_events[subEventIndex],
      updatedFields: {
        location_type: updatedSubEvent.location_type,
        event_banner: processedFiles.event_banner ? 'updated' : 'unchanged',
        event_logo: processedFiles.event_logo ? 'updated' : 'unchanged',
        event_images: processedFiles.event_images ? `${processedFiles.event_images.length} updated` : 'unchanged',
        event_rules: processedFiles.event_rules ? 'updated (file)' : (updateData.event_rules_text ? 'updated (text)' : 'unchanged'),
        ticket_layout: processedFiles.ticket_layout ? 'updated' : 'unchanged',
        seating_layout: processedSeatingLayout ? 'generated/updated' : (existingSubEvent.seating_layout ? 'preserved' : 'none'),
        guests: processedGuests.length,
        ticket_types: processedTicketTypes.length,
        prohibited_items: (updatedSubEvent.prohibited_items || []).length,
        banking_details: validatedBankingDetails.length,
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
    
    // Cleanup uploaded files on error
    try {
      const filesToDelete = [];
      if (processedFiles.event_banner_public_id) filesToDelete.push(processedFiles.event_banner_public_id);
      if (processedFiles.event_logo_public_id) filesToDelete.push(processedFiles.event_logo_public_id);
      if (processedFiles.ticket_layout_public_id) filesToDelete.push(processedFiles.ticket_layout_public_id);
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
export const getOthersEvents = async (req, res) => {
  try {
    const other = req.params.otherId;

    let tickets = await Ticket.find({
      userId: other,
      event_status: ['completed', 'live']
    });
    tickets = tickets.sort((a, b) => {
      const aDates = a.event_dates || [];
      const bDates = b.event_dates || [];
      const aLastEnd = aDates.length > 0 ? aDates[aDates.length - 1].end_date : null;
      const bLastEnd = bDates.length > 0 ? bDates[bDates.length - 1].end_date : null;
      const aDate = aLastEnd ? new Date(aLastEnd) : new Date(0);
      const bDate = bLastEnd ? new Date(bLastEnd) : new Date(0);
      return bDate - aDate; 
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
    await updatedTicket.populate('groupId');
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
    ticket.sub_events.forEach(subEvent => {
      subEvent.event_status = 'live';
    });
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
          unchangedCount++;
          return;
        }
        const eventEndDate = new Date(endDateStr);
        eventEndDate.setHours(23, 59, 59, 999);
        if (currentDate => eventEndDate) {
          ticket.event_status = 'completed';
          await ticket.save();
          completedCount++;
        } else {
          unchangedCount++;
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
      
      // Check if group has primary bank account details
      if (group.primary_bank_acc_no && group.primary_bank_acc_no.trim() !== '') {        
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
      }
    });
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
export const getAddOnEventLiveView = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const subEventId = req.params.subEventId;
    if (!subEventId || !subEventId.match(/^[0-9a-fA-F]{24}$/)) {
      logger.warn('Invalid sub-event ID format', { subEventId, userId });
      return res.status(400).json({
        success: false,
        message: "Invalid sub-event ID format"
      });
    }
    const ticket = await Ticket.findOne({ 
      'sub_events._id': subEventId, 
      userId: userId, 
    });
    if (!ticket) {
      logger.warn('Ticket with sub-event not found', { subEventId, userId });
      return res.status(404).json({
        success: false,
        message: "Sub-event not found or parent ticket is not live"
      });
    }
    const subEvent = ticket.sub_events.find(
      se => se._id.toString() === subEventId
    );
    if (!subEvent) {
      logger.warn('Sub-event not found in ticket', { subEventId, ticketId: ticket._id, userId });
      return res.status(404).json({
        success: false,
        message: "Sub-event not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Sub-event retrieved successfully",
      data: {
        subEvent: subEvent,
        parentEvent: {
          _id: ticket._id,
          event_name: ticket.event_name,
          event_category: ticket.event_category,
          event_status: ticket.event_status,
          groupId: ticket.groupId,
          userId: ticket.userId
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching sub-event', {
      error: error.message,
      stack: error.stack,
      subEventId: req.params.subEventId,
      userId: req.user?._id || req.user?.id
    });
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
export const getPreviousEventStatistics = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId).lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // This would require aggregating booking data by date
    // For now, returning mock structure - implement with actual booking aggregation
    const monthlyStats = [
      { month: 'JAN', bookings: 0, earnings: 0 },
      { month: 'FEB', bookings: 0, earnings: 0 },
      // ... add more months
    ];

    const quarterStats = [
      { 
        period: 'January - August', 
        bookings: 0, 
        earnings: 0,
        percentage: 0
      },
      // ... add more quarters
    ];

    res.status(200).json({
      success: true,
      data: {
        monthlyStats,
        quarterStats
      }
    });
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || 'http://localhost:5002';
// Helper to fetch booking stats from transaction service
async function fetchBookingStats(ticketId, endpoint) {
  try {
    const response = await axios.get(`${TRANSACTION_SERVICE_URL}/api/bookings/stats/${endpoint}/${ticketId}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint} stats:`, error.message);
    return null;
  }
}
export const getPreviousEventView = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .select('event_name event_banner event_logo event_images like share total_cancellation hashtag banking_details sub_events total_capacity ticket_types totalBookings totalTicketsSold revenue event_dates groupId')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Calculate tag count
    const tagCount = ticket.hashtag ? ticket.hashtag.length : 0;

    // Calculate total capacity percentage
    const totalCapacity = parseInt(ticket.total_capacity) || 0;
    const totalCapacityPercentage = totalCapacity > 0 
      ? Math.round((ticket.totalTicketsSold / totalCapacity) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        eventName: ticket.event_name,
        eventBanner: ticket.event_banner,
        eventLogo: ticket.event_logo,
        eventImages: ticket.event_images,
        totalLikes: ticket.like || 0,
        totalShares: ticket.share || 0,
        totalBookings: ticket.totalBookings || 0,
        totalRevenue: ticket.revenue || 0,
        totalCancellations: ticket.total_cancellation || 0,
        tagCount,
        bankDetails: ticket.banking_details || [],
        subEvents: ticket.sub_events || [],
        totalCapacityPercentage,
        eventDates: ticket.event_dates || [],
        groupId: ticket.groupId
      }
    });
  } catch (error) {
    console.error('Error fetching previous event view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event details',
      error: error.message
    });
  }
};
// Helper function to generate quarterly stats
function generateQuarterlyStats(monthlyStats, startDate, endDate) {
  if (!monthlyStats || monthlyStats.length === 0) {
    return [];
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Group months into quarters based on event duration
  const quarters = [];
  let currentQuarter = {
    period: '',
    months: [],
    bookings: 0,
    earnings: 0
  };

  monthlyStats.forEach((month, index) => {
    currentQuarter.months.push(month.month);
    currentQuarter.bookings += month.bookings;
    currentQuarter.earnings += month.revenue;

    // Create quarter every 3 months or at the end
    if ((index + 1) % 3 === 0 || index === monthlyStats.length - 1) {
      currentQuarter.period = `${currentQuarter.months[0]} - ${currentQuarter.months[currentQuarter.months.length - 1]}`;
      
      // Calculate percentage based on total tickets
      const totalBookings = monthlyStats.reduce((sum, m) => sum + m.bookings, 0);
      currentQuarter.percentage = totalBookings > 0 
        ? Math.round((currentQuarter.bookings / totalBookings) * 100) 
        : 0;

      quarters.push({
        period: currentQuarter.period,
        bookings: currentQuarter.bookings.toString(),
        earnings: currentQuarter.earnings.toFixed(2),
        percentage: currentQuarter.percentage
      });

      // Reset for next quarter
      currentQuarter = {
        period: '',
        months: [],
        bookings: 0,
        earnings: 0
      };
    }
  });
  return quarters;
}
export const getPreviousEventMonthlyStats = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .select('event_dates total_capacity ticket_types')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Get date range from event
    const startDate = ticket.event_dates?.[0]?.start_date;
    const endDate = ticket.event_dates?.[ticket.event_dates.length - 1]?.end_date || startDate;

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Event dates not found'
      });
    }

    // Fetch monthly stats from transaction service
    const monthlyStats = await fetchBookingStats(ticketId, `monthly?startDate=${startDate}&endDate=${endDate}`);

    // Calculate quarterly stats based on event dates
    const quarters = generateQuarterlyStats(monthlyStats || [], startDate, endDate);

    res.status(200).json({
      success: true,
      data: {
        monthlyStats: monthlyStats || [],
        quarterStats: quarters
      }
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};
export const getPreviousEventCapacityStats = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .select('total_capacity ticket_types totalTicketsSold sub_events')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Fetch ticket type stats from transaction service
    const typeStats = await fetchBookingStats(ticketId, 'ticket-types');

    // Calculate ticket type statistics with capacity
    const ticketTypeStats = ticket.ticket_types.map(type => {
      const soldData = typeStats?.find(s => s.ticketType === type.ticket_type) || { soldCount: 0, revenue: 0 };
      const maxCapacity = type.max_capacity || 0;
      const percentage = maxCapacity > 0 ? Math.round((soldData.soldCount / maxCapacity) * 100) : 0;

      return {
        ticketType: type.ticket_type,
        soldCount: soldData.soldCount,
        maxCapacity,
        percentage,
        revenue: soldData.revenue
      };
    });

    // Calculate overall capacity
    const totalCapacity = parseInt(ticket.total_capacity) || 0;
    const totalCapacityPercentage = totalCapacity > 0 
      ? Math.round((ticket.totalTicketsSold / totalCapacity) * 100) 
      : 0;

    // Process sub-events if they exist
    const subEventStats = [];
    if (ticket.sub_events && ticket.sub_events.length > 0) {
      for (const subEvent of ticket.sub_events) {
        const subTypeStats = await fetchBookingStats(subEvent._id, 'ticket-types');
        
        const subTicketTypes = subEvent.ticket_types?.map(type => {
          const soldData = subTypeStats?.find(s => s.ticketType === type.ticket_type) || { soldCount: 0, revenue: 0 };
          const maxCapacity = type.max_capacity || 0;
          const percentage = maxCapacity > 0 ? Math.round((soldData.soldCount / maxCapacity) * 100) : 0;

          return {
            ticketType: type.ticket_type,
            soldCount: soldData.soldCount,
            maxCapacity,
            percentage,
            revenue: soldData.revenue
          };
        }) || [];

        const subTotalCapacity = parseInt(subEvent.total_capacity) || 0;
        const subTotalSold = subEvent.totalTicketsSold || 0;
        const subPercentage = subTotalCapacity > 0 
          ? Math.round((subTotalSold / subTotalCapacity) * 100) 
          : 0;

        subEventStats.push({
          eventId: subEvent._id,
          eventName: subEvent.event_name,
          totalCapacity: subTotalCapacity,
          totalSold: subTotalSold,
          percentage: subPercentage,
          ticketTypes: subTicketTypes
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        mainEvent: {
          totalCapacity,
          totalSold: ticket.totalTicketsSold || 0,
          percentage: totalCapacityPercentage,
          ticketTypes: ticketTypeStats
        },
        subEvents: subEventStats
      }
    });
  } catch (error) {
    console.error('Error fetching capacity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch capacity statistics',
      error: error.message
    });
  }
};
export const getEventMetrics = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id || req.user.id;

    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid ticket ID format"
      });
    }

    let metrics = {};
    let found = false;

    // First, check if it's a main event
    let ticket = await Ticket.findOne({ _id: ticketId, userId: userId });
    
    if (ticket) {
      // It's a main event
      metrics = {
        totalRevenue: ticket.revenue || 0,
        totalBooking: ticket.totalBookings || 0,
        totalLikes: ticket.like || 0,
        totalShare: ticket.share || 0,
        total_cancellation: ticket.total_cancellation || 0,
      };
      found = true;
    } else {
      // Check if it's a sub-event
      ticket = await Ticket.findOne({ 
        'sub_events._id': ticketId, 
        userId: userId 
      });
      
      if (ticket) {
        // Find the specific sub-event
        const subEvent = ticket.sub_events.find(
          sub => sub._id.toString() === ticketId
        );
        
        if (subEvent) {
          metrics = {
            totalRevenue: subEvent.revenue || 0,
            totalBooking: subEvent.totalBookings || 0,
            totalLikes: subEvent.like || 0,
            totalShare: subEvent.share || 0,
            total_cancellation: subEvent.total_cancellation || 0,
          };
          found = true;
        }
      }
    }

    if (!found) {
      return res.status(404).json({ 
        message: "Event not found" 
      });
    }

    res.status(200).json({
      message: "Event metrics retrieved successfully",
      data: metrics
    });

  } catch (error) {
    console.error("Error fetching event metrics:", error);
    res.status(500).json({
      message: "An error occurred while fetching event metrics",
      error: error.message
    });
  }
};
// Get event statistics for a specific date
export const getEventStatsByDate = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { selectedDate } = req.query;
    const userId = req.user._id || req.user.id;

    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ticket ID format" });
    }

    if (!selectedDate) {
      return res.status(400).json({ message: "Selected date is required" });
    }

    // Check if ticket exists and belongs to user
    let ticket = await Ticket.findOne({ _id: ticketId, userId });
    let isSubEvent = false;

    if (!ticket) {
      ticket = await Ticket.findOne({ 'sub_events._id': ticketId, userId });
      isSubEvent = true;
    }

    if (!ticket) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if selected date is within event dates
    const eventDates = isSubEvent 
      ? ticket.sub_events.find(sub => sub._id.toString() === ticketId)?.event_dates
      : ticket.event_dates;

    if (!eventDates || eventDates.length === 0) {
      return res.status(400).json({ message: "Event dates not found" });
    }

    const selectedDateObj = new Date(selectedDate);
    const startDate = new Date(eventDates[0].start_date);
    const endDate = new Date(eventDates[eventDates.length - 1].end_date || eventDates[0].end_date);

    if (selectedDateObj < startDate || selectedDateObj > endDate) {
      return res.status(400).json({ 
        message: "Your event is not present on the selected date",
        eventStartDate: startDate,
        eventEndDate: endDate
      });
    }

    // Fetch booking stats from transaction service via gRPC
    const bookingStats = await getBookingStatsByDate(ticketId, selectedDate);

    res.status(200).json({
      message: "Event statistics retrieved successfully",
      data: {
        selectedDate,
        totalBookings: bookingStats.totalBookings,
        totalRevenue: bookingStats.totalRevenue,
        totalTickets: bookingStats.totalTickets,
        eventDateRange: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error("Error fetching event stats by date:", error);
    res.status(500).json({
      message: "An error occurred while fetching event statistics",
      error: error.message
    });
  }
};

// Get booking growth statistics
export const getEventGrowthStats = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { selectedDate, comparisonType } = req.query;
    const userId = req.user._id || req.user.id;

    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ticket ID format" });
    }

    if (!selectedDate) {
      return res.status(400).json({ message: "Selected date is required" });
    }

    // Verify ticket ownership
    let ticket = await Ticket.findOne({ _id: ticketId, userId });
    if (!ticket) {
      ticket = await Ticket.findOne({ 'sub_events._id': ticketId, userId });
    }

    if (!ticket) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Determine comparison type based on event dates
    let finalComparisonType = comparisonType || 'daily';
    
    const eventDates = ticket.event_dates || [];
    if (eventDates.length > 0) {
      const startDate = new Date(eventDates[0].start_date);
      const endDate = new Date(eventDates[eventDates.length - 1].end_date || eventDates[0].end_date);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      if (ticket.event_date_type === 'weekly' || daysDiff >= 7) {
        finalComparisonType = 'weekly';
      } else if (daysDiff >= 30) {
        finalComparisonType = 'monthly';
      }
    }

    // Fetch growth stats from transaction service
    const growthStats = await getBookingGrowthStats(ticketId, selectedDate, finalComparisonType);

    res.status(200).json({
      message: "Growth statistics retrieved successfully",
      data: {
        selectedDate,
        growthPercentage: growthStats.growthPercentage,
        currentPeriodBookings: growthStats.currentPeriodBookings,
        previousPeriodBookings: growthStats.previousPeriodBookings,
        comparisonType: growthStats.comparisonType
      }
    });

  } catch (error) {
    console.error("Error fetching growth stats:", error);
    res.status(500).json({
      message: "An error occurred while fetching growth statistics",
      error: error.message
    });
  }
};

// Get monthly booking chart data
export const getEventMonthlyChart = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { year, month } = req.query;
    const userId = req.user._id || req.user.id;

    if (!ticketId || !ticketId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid ticket ID format" });
    }

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    // Verify ticket ownership
    let ticket = await Ticket.findOne({ _id: ticketId, userId });
    if (!ticket) {
      ticket = await Ticket.findOne({ 'sub_events._id': ticketId, userId });
    }

    if (!ticket) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Fetch chart data from transaction service
    const chartData = await getMonthlyBookingChart(ticketId, parseInt(year), parseInt(month));

    res.status(200).json({
      message: "Monthly chart data retrieved successfully",
      data: {
        year: parseInt(year),
        month: parseInt(month),
        chartData: chartData.chartData || []
      }
    });

  } catch (error) {
    console.error("Error fetching monthly chart:", error);
    res.status(500).json({
      message: "An error occurred while fetching chart data",
      error: error.message
    });
  }
};
