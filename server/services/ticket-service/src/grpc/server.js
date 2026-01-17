import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import Ticket from '../models/ticket.model.js';
import Group from '../models/group.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../../../../protos/ticket.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const ticketProto = grpc.loadPackageDefinition(packageDefinition).ticket;

const mapSeatingLayout = (layout) => {
  if (!layout) return null;
  return {
    rows: layout.rows || [],
    columns: layout.columns || 0,
    seats: (layout.seats || []).map(seat => ({
      seatId: seat.seatId || '',
      row: seat.row || '',
      column: seat.column || 0,
      isAvailable: seat.isAvailable || false,
      isSelected: seat.isSelected || false,
      ticketTypeId: seat.ticketTypeId || '',
      ticketTypeName: seat.ticketTypeName || '',
      ticketTypeColor: seat.ticketTypeColor || '',
      price: seat.price || 0
    })),
    ticketTypeAssignments: (layout.ticketTypeAssignments || []).map(assignment => ({
      ticketTypeId: assignment.ticketTypeId || '',
      ticketTypeName: assignment.ticketTypeName || '',
      color: assignment.color || '',
      assignedSeats: assignment.assignedSeats || [],
      capacity: assignment.capacity || 0,
      price: assignment.price || 0
    }))
  };
};

const mapSubEvents = (subEvents) => {
  if (!subEvents || subEvents.length === 0) return [];
  return subEvents.map(sub => ({
    id: sub._id?.toString() || '',
    _id: sub._id?.toString() || '',
    event_name: sub.event_name || '',
    event_category: sub.event_category || '',
    event_subcategory: sub.event_subcategory || '',
    event_type: sub.event_type || '',
    subevent: sub.subevent || '',
    event_language: sub.event_language || [],
    location_type: sub.location_type || '',
    location: sub.location || '',
    venue: sub.venue || '',
    seating_arrangement: sub.seating_arrangement || 'none',
    min_age_allowed: sub.min_age_allowed || 0,
    max_age_allowed: sub.max_age_allowed || 0,
    kids_friendly: sub.kids_friendly || false,
    pet_friendly: sub.pet_friendly || false,
    exact_map_location: sub.exact_map_location ? {
      latitude: sub.exact_map_location.latitude || 0,
      longitude: sub.exact_map_location.longitude || 0,
      address: sub.exact_map_location.address || ''
    } : null,
    event_date_type: sub.event_date_type || '',
    event_dates: (sub.event_dates || []).map(date => ({
      start_date: date.start_date || '',
      end_date: date.end_date || '',
      start_time: date.start_time || '',
      end_time: date.end_time || '',
      event_link: date.event_link || '',
      video_name: date.video_name || '',
      verification_event_code: date.verification_event_code || '',
      video_file_path: date.video_file_path || '',
      preview_image_path: date.preview_image_path || ''
    })),
    gate_open_time: sub.gate_open_time || '',
    event_instagram_link: sub.event_instagram_link || '',
    event_youtube_link: sub.event_youtube_link || '',
    verification_event_code: sub.verification_event_code || '',
    event_rules: sub.event_rules ? {
      type: sub.event_rules.type || '',
      path: sub.event_rules.path || '',
      originalName: sub.event_rules.originalName || '',
      mimeType: sub.event_rules.mimeType || '',
      size: sub.event_rules.size || 0,
      content: sub.event_rules.content || '',
      uploadedAt: sub.event_rules.uploadedAt?.toISOString() || ''
    } : null,
    POCS: (sub.POCS || []).map(poc => ({
      POC_name: poc.POC_name || '',
      POC_email: poc.POC_email || '',
      POC_contact: poc.POC_contact || ''
    })),
    prohibited_items: sub.prohibited_items || [],
    event_description: sub.event_description || '',
    event_logo: sub.event_logo || '',
    event_banner: sub.event_banner || '',
    event_images: (sub.event_images || []).map(img => ({
      path: img.path || '',
      originalName: img.originalName || '',
      mimeType: img.mimeType || '',
      size: img.size || 0,
      uploadedAt: img.uploadedAt?.toISOString() || ''
    })),
    hashtag: sub.hashtag || [],
    payment_type: sub.payment_type || '',
    main_ticket_id: sub.main_ticket_id?.toString() || '',
    banking_details: (sub.banking_details || []).map(bank => ({
      bank_acc_type: bank.bank_acc_type || '',
      bank_acc_no: bank.bank_acc_no || '',
      bank_ifsc: bank.bank_ifsc || '',
      bank_acc_holder: bank.bank_acc_holder || ''
    })),
    guests: (sub.guests || []).map(guest => ({
      guest_name: guest.guest_name || '',
      guest_profile: guest.guest_profile || '',
      guest_link: guest.guest_link || ''
    })),
    ticket_types: (sub.ticket_types || []).map(type => ({
      _id: type._id?.toString() || '',
      ticket_type: type.ticket_type || '',
      ticket_price: type.ticket_price || 0,
      ticket_photo: type.ticket_photo || '',
      ticket_photo_public_id: type.ticket_photo_public_id || '',
      max_capacity: type.max_capacity || 0
    })),
    ticket_layout: sub.ticket_layout || '',
    ticket_layout_public_id: sub.ticket_layout_public_id || '',
    seating_layout: mapSeatingLayout(sub.seating_layout),
    total_capacity: sub.total_capacity || '',
    booking_start_date: sub.booking_start_date || '',
    booking_end_date: sub.booking_end_date || '',
    like: sub.like || 0,
    event_status: sub.event_status || 'pending',
    share: sub.share || 0,
    totalBookings: sub.totalBookings || 0,
    totalTicketsSold: sub.totalTicketsSold || 0,
    revenue: sub.revenue || 0,
    createdAt: sub.createdAt?.toISOString() || '',
    updatedAt: sub.updatedAt?.toISOString() || ''
  }));
};

const mapTicketToProto = (ticket) => {
  if (!ticket) return null;

  return {
    id: ticket._id?.toString() || '',
    _id: ticket._id?.toString() || '',
    event_name: ticket.event_name || '',
    event_category: ticket.event_category || '',
    event_subcategory: ticket.event_subcategory || '',
    event_type: ticket.event_type || '',
    event_language: ticket.event_language || [],
    min_age_allowed: ticket.min_age_allowed || 0,
    max_age_allowed: ticket.max_age_allowed || 0,
    seating_arrangement: ticket.seating_arrangement || 'none',
    kids_friendly: ticket.kids_friendly || false,
    pet_friendly: ticket.pet_friendly || false,
    location_type: ticket.location_type || '',
    location: ticket.location || '',
    venue: ticket.venue || '',
    exact_map_location: ticket.exact_map_location ? {
      latitude: ticket.exact_map_location.latitude || 0,
      longitude: ticket.exact_map_location.longitude || 0,
      address: ticket.exact_map_location.address || ''
    } : null,
    event_date_type: ticket.event_date_type || '',
    event_dates: (ticket.event_dates || []).map(date => ({
      start_date: date.start_date || '',
      end_date: date.end_date || '',
      start_time: date.start_time || '',
      end_time: date.end_time || '',
      event_link: date.event_link || '',
      video_name: date.video_name || '',
      verification_event_code: date.verification_event_code || '',
      video_file_path: date.video_file_path || '',
      preview_image_path: date.preview_image_path || ''
    })),
    event_instagram_link: ticket.event_instagram_link || '',
    gate_open_time: ticket.gate_open_time || '',
    event_youtube_link: ticket.event_youtube_link || '',
    verification_event_code: ticket.verification_event_code || '',
    event_rules: ticket.event_rules ? {
      type: ticket.event_rules.type || '',
      path: ticket.event_rules.path || '',
      originalName: ticket.event_rules.originalName || '',
      mimeType: ticket.event_rules.mimeType || '',
      size: ticket.event_rules.size || 0,
      content: ticket.event_rules.content || '',
      uploadedAt: ticket.event_rules.uploadedAt?.toISOString() || ''
    } : null,
    prohibited_items: ticket.prohibited_items || [],
    college_authorisation: ticket.college_authorisation || '',
    event_description: ticket.event_description || '',
    event_logo: ticket.event_logo || '',
    event_banner: ticket.event_banner || '',
    event_images: (ticket.event_images || []).map(img => ({
      path: img.path || '',
      originalName: img.originalName || '',
      mimeType: img.mimeType || '',
      size: img.size || 0,
      uploadedAt: img.uploadedAt?.toISOString() || ''
    })),
    hashtag: ticket.hashtag || [],
    payment_type: ticket.payment_type || '',
    banking_details: (ticket.banking_details || []).map(bank => ({
      bank_acc_type: bank.bank_acc_type || '',
      bank_acc_no: bank.bank_acc_no || '',
      bank_ifsc: bank.bank_ifsc || '',
      bank_acc_holder: bank.bank_acc_holder || ''
    })),
    guests: (ticket.guests || []).map(guest => ({
      guest_name: guest.guest_name || '',
      guest_profile: guest.guest_profile || '',
      guest_link: guest.guest_link || ''
    })),
    POCS: (ticket.POCS || []).map(poc => ({
      POC_name: poc.POC_name || '',
      POC_email: poc.POC_email || '',
      POC_contact: poc.POC_contact || ''
    })),
    total_capacity: ticket.total_capacity || '',
    booking_start_date: ticket.booking_start_date || '',
    booking_end_date: ticket.booking_end_date || '',
    ticket_layout: ticket.ticket_layout || '',
    ticket_layout_public_id: ticket.ticket_layout_public_id || '',
    seating_layout: mapSeatingLayout(ticket.seating_layout),
    ticket_types: (ticket.ticket_types || []).map(type => ({
      _id: type._id?.toString() || '',
      ticket_type: type.ticket_type || '',
      ticket_price: type.ticket_price || 0,
      ticket_photo: type.ticket_photo || '',
      ticket_photo_public_id: type.ticket_photo_public_id || '',
      max_capacity: type.max_capacity || 0
    })),
    created_by: ticket.created_by || '',
    like: ticket.like || 0,
    share: ticket.share || 0,
    totalBookings: ticket.totalBookings || 0,
    totalTicketsSold: ticket.totalTicketsSold || 0,
    revenue: ticket.revenue || 0,
    event_ticket_offer: ticket.event_ticket_offer || false,
    offerTickets: (ticket.offerTickets || []).map(offer => ({
      offer_ticket_type: offer.offer_ticket_type || '',
      offer_ticket_price: offer.offer_ticket_price || '',
      set_limit_for_user: offer.set_limit_for_user || '',
      offer_ticket_pic: offer.offer_ticket_pic || ''
    })),
    sub_events: mapSubEvents(ticket.sub_events),
    groupId: ticket.groupId?.toString() || '',
    userId: ticket.userId?.toString() || '',
    event_status: ticket.event_status || 'pending',
    updated_by: ticket.updated_by?.toString() || '',
    updated_at: ticket.updated_at?.toISOString() || '',
    form_progress: ticket.form_progress ? {
      basic_info: ticket.form_progress.basic_info || false,
      media: ticket.form_progress.media || false,
      add_on_events: ticket.form_progress.add_on_events || false,
      banking_tickets: ticket.form_progress.banking_tickets || false,
      terms_conditions: ticket.form_progress.terms_conditions || false
    } : null,
    terms_accepted: ticket.terms_accepted || false,
    terms_accepted_at: ticket.terms_accepted_at?.toISOString() || '',
    company_terms_version: ticket.company_terms_version || '',
    createdAt: ticket.createdAt?.toISOString() || '',
    updatedAt: ticket.updatedAt?.toISOString() || '',
    razorpayEnabled: false,
    razorpayKeyId: '',
    razorpayKeySecret: ''
  };
};

const mapGroupToProto = (group) => {
  if (!group) return null;
  return {
    id: group._id?.toString() || '',
    _id: group._id?.toString() || '',
    name: group.name || '',
    grp_type: group.grp_type || '',
    organisation_type: group.organisation_type || '',
    email: group.email || '',
    contact_no: group.contact_no || '',
    address: group.address || '',
    status: group.status || 'unverified',
    gst_no: group.gst_no || '',
    pan_no: group.pan_no || '',
    primary_bank_acc_type: group.primary_bank_acc_type || '',
    primary_bank_acc_no: group.primary_bank_acc_no || '',
    primary_bank_ifsc: group.primary_bank_ifsc || '',
    primary_bank_acc_holder: group.primary_bank_acc_holder || '',
    userId: group.userId?.toString() || '',
    id_proof: group.id_proof || '',
    bank_check: group.bank_check || '',
    company_certificate: group.company_certificate || '',
    company_logo: group.company_logo || '',
    createdAt: group.createdAt?.toISOString() || '',
    updatedAt: group.updatedAt?.toISOString() || '',
    razorpayEnabled: group.razorpayEnabled || false,
    razorpayKeyId: group.razorpayKeyId || '',
    razorpayKeySecret: group.razorpayKeySecret || '',
    razorpayAccountId: group.razorpayAccountId || ''
  };
};
const flattenEventsWithSubEvents = (tickets) => {
  const flattenedEvents = [];
  
  tickets.forEach(ticket => {
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
    
    // Add main event
    flattenedEvents.push({
      ...ticketObj,
      isSubEvent: false,
      parentEventId: null,
      parentEventName: null
    });
    
    // Add all sub-events if they exist
    if (ticketObj.sub_events && Array.isArray(ticketObj.sub_events) && ticketObj.sub_events.length > 0) {
      ticketObj.sub_events.forEach(subEvent => {
        const subEventObj = subEvent.toObject ? subEvent.toObject() : subEvent;
        
        flattenedEvents.push({
          ...subEventObj,
          groupId: ticketObj.groupId,
          userId: ticketObj.userId,
          payment_type: subEventObj.payment_type || ticketObj.payment_type,
          isSubEvent: true,
          parentEventId: ticketObj._id.toString(),
          parentEventName: ticketObj.event_name,
          parentEventCategory: ticketObj.event_category,
          parentEventBanner: ticketObj.event_banner,
          parentEventLogo: ticketObj.event_logo,
          _id: subEventObj._id,
          id: subEventObj._id.toString()
        });
      });
    }
  });
  return flattenedEvents;
};
const getAllLiveEvents = async (call, callback) => {
  try {
    const tickets = await Ticket.find({ event_status: 'live' }).sort({ createdAt: -1 });
    const flattenedEvents = flattenEventsWithSubEvents(tickets);
    
    callback(null, {
      count: flattenedEvents.length,
      tickets: flattenedEvents.map(mapTicketToProto),
      error: ''
    });
  } catch (error) {
    console.error('❌ [gRPC Server] Error fetching live events:', error);
    callback(null, { count: 0, tickets: [], error: error.message });
  }
};
const getAllGroups = async (call, callback) => {
  try {
    const groups = await Group.find({ status: 'active' }).sort({ createdAt: -1 });
    callback(null, {
      count: groups.length,
      groups: groups.map(mapGroupToProto),
      error: ''
    });
  } catch (error) {
    callback(null, { count: 0, groups: [], error: error.message });
  }
};
const getTicketById = async (call, callback) => {
  try {
    const { ticketId } = call.request;
    
    if (!ticketId || ticketId === 'undefined' || ticketId === 'null') {
      return callback(null, { ticket: null, error: 'Ticket ID is required' });
    }

    const objectIdRegex = /^[a-f\d]{24}$/i;
    if (!objectIdRegex.test(ticketId)) {
      return callback(null, { ticket: null, error: 'Invalid ticket ID format' });
    }

    // Try to find as main ticket
    let ticket = await Ticket.findById(ticketId);
    
    if (ticket) {
      return callback(null, { ticket: mapTicketToProto(ticket), error: '' });
    }

    // Try to find as sub-event (silently, no logs)
    const parentTicket = await Ticket.findOne({ 'sub_events._id': ticketId });
    
    if (parentTicket) {
      const subEvent = parentTicket.sub_events.find(
        se => se._id.toString() === ticketId
      );
      
      if (subEvent) {
        const subEventData = {
          ...subEvent.toObject(),
          groupId: parentTicket.groupId,
          userId: parentTicket.userId,
          payment_type: subEvent.payment_type || parentTicket.payment_type,
          _id: subEvent._id,
          isSubEvent: true,
          parentEventId: parentTicket._id.toString(),
          parentEventName: parentTicket.event_name,
          parentEventCategory: parentTicket.event_category,
          parentEventBanner: parentTicket.event_banner,
          parentEventLogo: parentTicket.event_logo
        };
        return callback(null, { ticket: mapTicketToProto(subEventData), error: '' });
      }
    }
    // Not found - return silently without warning
    return callback(null, { ticket: null, error: 'Ticket not found' });
    
  } catch (error) {
    console.error('❌ [gRPC Server] Error in getTicketById:', error);
    return callback(null, { ticket: null, error: error.message });
  }
};

const getGroupById = async (call, callback) => {
  try {
    const { groupId } = call.request;
    if (!groupId) {
      return callback(null, { group: null, error: 'Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return callback(null, { group: null, error: 'Group not found' });
    }

    callback(null, { group: mapGroupToProto(group), error: '' });
  } catch (error) {
    callback(null, { group: null, error: error.message });
  }
};

const updateTicketStats = async (call, callback) => {
  try {
    const { ticketId, statType, increment } = call.request;
    if (!ticketId || !statType || increment === undefined) {
      return callback(null, {
        success: false,
        error: 'ticketId, statType, and increment are required'
      });
    }

    let ticket = await Ticket.findById(ticketId);
    let isSubEvent = false;
    let subEventIndex = -1;

    if (!ticket) {
      ticket = await Ticket.findOne({ 'sub_events._id': ticketId });
      if (ticket) {
        isSubEvent = true;
        subEventIndex = ticket.sub_events.findIndex(se => se._id.toString() === ticketId);
      }
    }

    if (!ticket) {
      return callback(null, { success: false, error: 'Ticket not found' });
    }

    if (isSubEvent && subEventIndex !== -1) {
      const subEvent = ticket.sub_events[subEventIndex];
      
      switch (statType) {
        case 'like':
          subEvent.like = (subEvent.like || 0) + increment;
          break;
        case 'share':
          subEvent.share = (subEvent.share || 0) + increment;
          break;
        case 'totalBookings':
          subEvent.totalBookings = (subEvent.totalBookings || 0) + increment;
          break;
        case 'totalTicketsSold':
          subEvent.totalTicketsSold = (subEvent.totalTicketsSold || 0) + increment;
          break;
        case 'revenue':
          subEvent.revenue = (subEvent.revenue || 0) + increment;
          break;
        default:
          return callback(null, { success: false, error: `Unknown statType: ${statType}` });
      }

      ticket.markModified('sub_events');
      await ticket.save();

      callback(null, {
        success: true,
        ticketId: ticketId,
        parentTicketId: ticket._id.toString(),
        isSubEvent: true,
        statType: statType,
        newValue: subEvent[statType],
        error: ''
      });
    } else {
      switch (statType) {
        case 'like':
          ticket.like = (ticket.like || 0) + increment;
          break;
        case 'share':
          ticket.share = (ticket.share || 0) + increment;
          break;
        case 'totalBookings':
          ticket.totalBookings = (ticket.totalBookings || 0) + increment;
          break;
        case 'totalTicketsSold':
          ticket.totalTicketsSold = (ticket.totalTicketsSold || 0) + increment;
          break;
        case 'revenue':
          ticket.revenue = (ticket.revenue || 0) + increment;
          break;
        default:
          return callback(null, { success: false, error: `Unknown statType: ${statType}` });
      }

      await ticket.save();

      callback(null, {
        success: true,
        ticketId: ticket._id.toString(),
        parentTicketId: '',
        isSubEvent: false,
        statType: statType,
        newValue: ticket[statType],
        error: ''
      });
    }
  } catch (error) {
    callback(null, { success: false, error: error.message });
  }
};

const getTicketsByIds = async (call, callback) => {
  try {
    const { ticketIds } = call.request;
    if (!ticketIds || !Array.isArray(ticketIds)) {
      return callback(null, { success: false, tickets: [], count: 0, error: 'ticketIds array is required' });
    }

    const tickets = await Ticket.find({ _id: { $in: ticketIds } }).sort({ createdAt: -1 });

    callback(null, {
      success: true,
      tickets: tickets.map(mapTicketToProto),
      count: tickets.length,
      error: ''
    });
  } catch (error) {
    callback(null, { success: false, tickets: [], count: 0, error: error.message });
  }
};

const getTicketBookingStats = async (call, callback) => {
  try {
    const { ticketId } = call.request;    
    // Get stats from the ticket document itself
    let ticket = await Ticket.findById(ticketId);
    let isSubEvent = false;
    
    if (!ticket) {
      ticket = await Ticket.findOne({ 'sub_events._id': ticketId });
      if (ticket) {
        isSubEvent = true;
        const subEvent = ticket.sub_events.find(se => se._id.toString() === ticketId);
        if (subEvent) {
          return callback(null, {
            totalBookings: subEvent.totalBookings || 0,
            totalRevenue: subEvent.revenue || 0,
            totalTicketsSold: subEvent.totalTicketsSold || 0,
            error: ''
          });
        }
      }
    }

    if (!ticket) {
      console.log(`❌ [gRPC Server] Ticket not found: ${ticketId}`);
      return callback(null, {
        totalBookings: 0,
        totalRevenue: 0,
        totalTicketsSold: 0,
        error: 'Ticket not found'
      });
    }
    callback(null, {
      totalBookings: ticket.totalBookings || 0,
      totalRevenue: ticket.revenue || 0,
      totalTicketsSold: ticket.totalTicketsSold || 0,
      error: ''
    });
  } catch (error) {
    console.error(`❌ [gRPC Server] Error in GetTicketBookingStats:`, error);
    callback(null, {
      totalBookings: 0,
      totalRevenue: 0,
      totalTicketsSold: 0,
      error: error.message
    });
  }
};
const updateTicketCancellation = async (call, callback) => {
  try {
    const { ticketId, increment } = call.request;

    console.log(`📥 [gRPC] UpdateTicketCancellation called for ticket: ${ticketId}, increment: ${increment}`);

    if (!ticketId) {
      return callback(null, {
        success: false,
        ticketId: '',
        newValue: 0,
        error: 'ticketId is required'
      });
    }

    // Try to find main ticket first
    let ticket = await Ticket.findById(ticketId);
    let isSubEvent = false;
    let subEventIndex = -1;

    // If not found, check if it's a sub-event
    if (!ticket) {
      ticket = await Ticket.findOne({ 'sub_events._id': ticketId });
      if (ticket) {
        isSubEvent = true;
        subEventIndex = ticket.sub_events.findIndex(se => se._id.toString() === ticketId);
      }
    }

    if (!ticket) {
      return callback(null, {
        success: false,
        ticketId: ticketId,
        newValue: 0,
        error: 'Ticket not found'
      });
    }

    // Update cancellation count
    if (isSubEvent && subEventIndex !== -1) {
      const subEvent = ticket.sub_events[subEventIndex];
      const currentCancellations = subEvent.total_cancellation || 0;
      const newCancellations = currentCancellations + increment;
      
      subEvent.total_cancellation = newCancellations;
      ticket.markModified('sub_events');
      await ticket.save();

      console.log(`✅ [gRPC] Updated cancellations for sub-event ${ticketId}: ${currentCancellations} -> ${newCancellations}`);

      callback(null, {
        success: true,
        ticketId: ticketId,
        newValue: newCancellations,
        error: ''
      });
    } else {
      const currentCancellations = ticket.total_cancellation || 0;
      const newCancellations = currentCancellations + increment;

      ticket.total_cancellation = newCancellations;
      await ticket.save();

      console.log(`✅ [gRPC] Updated cancellations for ticket ${ticketId}: ${currentCancellations} -> ${newCancellations}`);

      callback(null, {
        success: true,
        ticketId: ticketId,
        newValue: newCancellations,
        error: ''
      });
    }

  } catch (error) {
    console.error('❌ [gRPC] UpdateTicketCancellation error:', error);
    callback(null, {
      success: false,
      ticketId: call.request.ticketId || '',
      newValue: 0,
      error: error.message
    });
  }
};
const getPreviousEventStats = async (call, callback) => {
  try {
    const { ticketId } = call.request;

    console.log(`📥 [gRPC] GetPreviousEventStats called for ticket: ${ticketId}`);

    if (!ticketId) {
      return callback(null, {
        totalLikes: 0,
        totalShares: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalCancellations: 0,
        tagCount: 0,
        bankDetails: [],
        subEvents: [],
        monthlyStats: [],
        quarterStats: [],
        ticketTypeStats: [],
        totalCapacityPercentage: 0,
        error: 'ticketId is required'
      });
    }

    let ticket = await Ticket.findById(ticketId)
      .select('like share totalBookings revenue total_cancellation hashtag banking_details sub_events total_capacity ticket_types')
      .lean();

    let isSubEvent = false;

    if (!ticket) {
      const parentTicket = await Ticket.findOne({ 'sub_events._id': ticketId });
      if (parentTicket) {
        const subEvent = parentTicket.sub_events.find(se => se._id.toString() === ticketId);
        if (subEvent) {
          isSubEvent = true;
          ticket = {
            like: subEvent.like || 0,
            share: subEvent.share || 0,
            totalBookings: subEvent.totalBookings || 0,
            revenue: subEvent.revenue || 0,
            total_cancellation: subEvent.total_cancellation || 0,
            hashtag: subEvent.hashtag || [],
            banking_details: subEvent.banking_details || [],
            sub_events: [],
            total_capacity: subEvent.total_capacity || '',
            ticket_types: subEvent.ticket_types || []
          };
        }
      }
    }

    if (!ticket) {
      return callback(null, {
        totalLikes: 0,
        totalShares: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalCancellations: 0,
        tagCount: 0,
        bankDetails: [],
        subEvents: [],
        monthlyStats: [],
        quarterStats: [],
        ticketTypeStats: [],
        totalCapacityPercentage: 0,
        error: 'Ticket not found'
      });
    }

    const response = {
      totalLikes: ticket.like || 0,
      totalShares: ticket.share || 0,
      totalBookings: ticket.totalBookings || 0,
      totalRevenue: ticket.revenue || 0,
      totalCancellations: ticket.total_cancellation || 0,
      tagCount: ticket.hashtag?.length || 0,
      bankDetails: (ticket.banking_details || []).map(bank => ({
        bank_acc_type: bank.bank_acc_type || '',
        bank_acc_no: bank.bank_acc_no || '',
        bank_ifsc: bank.bank_ifsc || '',
        bank_acc_holder: bank.bank_acc_holder || ''
      })),
      subEvents: mapSubEvents(ticket.sub_events || []),
      monthlyStats: [],
      quarterStats: [],
      ticketTypeStats: [],
      totalCapacityPercentage: 0,
      error: ''
    };

    console.log(`✅ [gRPC] GetPreviousEventStats completed for ticket ${ticketId}`);

    callback(null, response);

  } catch (error) {
    console.error('❌ [gRPC] GetPreviousEventStats error:', error);
    callback(null, {
      totalLikes: 0,
      totalShares: 0,
      totalBookings: 0,
      totalRevenue: 0,
      totalCancellations: 0,
      tagCount: 0,
      bankDetails: [],
      subEvents: [],
      monthlyStats: [],
      quarterStats: [],
      ticketTypeStats: [],
      totalCapacityPercentage: 0,
      error: error.message
    });
  }
};
export const startGrpcServer = (port = 50052) => {
  const server = new grpc.Server();
  server.addService(ticketProto.TicketService.service, {
    GetAllLiveEvents: getAllLiveEvents,
    GetAllGroups: getAllGroups,
    GetTicketById: getTicketById,
    GetGroupById: getGroupById,
    UpdateTicketStats: updateTicketStats,
    GetTicketsByIds: getTicketsByIds,
    GetTicketBookingStats: getTicketBookingStats,
    UpdateTicketCancellation: updateTicketCancellation,
    GetPreviousEventStats: getPreviousEventStats,
  });
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error("gRPC server failed to bind:", error);
        return;
      }
      console.log(`gRPC server running on port ${boundPort}`);
    }
  );
  return server;
};
