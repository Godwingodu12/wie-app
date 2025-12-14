import { connectRabbitMQ, isChannelAvailable } from './connection.js';
import { listenQueue } from './consumer.js';
import Ticket from '../models/ticket.model.js';
import Group from '../models/group.model.js';
export const startConsumers = async () => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }
  // Handler for get-all-live-events
  await listenQueue('get-all-live-events', async (data) => {
    try {
      console.log('📥 Processing get-all-live-events request');
      const tickets = await Ticket.find({ event_status: 'live' }).sort({
        createdAt: -1,
      });
      return {
        count: tickets.length,
        tickets,
      };
    } catch (error) {
      console.error('❌ Error in get-all-live-events handler:', error);
      return {
        error: error.message,
        count: 0,
        tickets: [],
      };
    }
  });
  // Handler for get-all-groups
  await listenQueue('get-all-groups', async (data) => {
    try {
      console.log('📥 Processing get-all-groups request');
      
      const groups = await Group.find({ status: 'active' }).sort({
        createdAt: -1,
      });
      return {
        count: groups.length,
        groups,
      };
    } catch (error) {
      console.error('❌ Error in get-all-groups handler:', error);
      return {
        error: error.message,
        count: 0,
        groups: [],
      };
    }
  });
  await listenQueue('get-ticket-by-id', async (data) => {
    try {      
      const { ticketId } = data;
      if (!ticketId) {
        return { error: 'Ticket ID is required' };
      }
      // ✅ First try to find as main event
      let ticket = await Ticket.findById(ticketId);
      // ✅ If not found, search in sub_events
      if (!ticket) {
        ticket = await Ticket.findOne({
          'sub_events._id': ticketId
        });

        if (ticket) {
          // Extract the specific sub-event
          const subEvent = ticket.sub_events.find(se => se._id.toString() === ticketId);
          if (subEvent) {
            // Return sub-event with necessary fields from parent
            return {
              ...subEvent.toObject(),
              groupId: ticket.groupId, // Inherit from parent
              payment_type: ticket.payment_type, // Inherit from parent
              _id: subEvent._id,
            };
          }
        }
      }
      if (!ticket) {
        return { error: 'Ticket not found' };
      }
      return ticket;
    } catch (error) {
      console.error('❌ Error in get-ticket-by-id handler:', error);
      return { error: error.message };
    }
  });
  // Handler for get-group-by-id
  await listenQueue('get-group-by-id', async (data) => {
    try {      
      if (!data.groupId) {
        return { error: 'Group ID is required' };
      }
      const group = await Group.findById(data.groupId);
      if (!group) {
        return { error: 'Group not found' };
      }
      return group;
    } catch (error) {
      console.error('❌ Error in get-group-by-id handler:', error);
      return { error: error.message };
    }
  });
  // Handler for update-ticket-stats (likes, shares, bookings, revenue)
  await listenQueue('update-ticket-stats', async (data) => {
    try {      
      if (!data.ticketId || !data.statType || data.increment === undefined) {
        return { error: 'ticketId, statType, and increment are required' };
      }
      // ✅ First try to find as main event
      let ticket = await Ticket.findById(data.ticketId);
      let isSubEvent = false;
      let subEventIndex = -1;
      // ✅ If not found, search in sub_events
      if (!ticket) {
        ticket = await Ticket.findOne({
          'sub_events._id': data.ticketId
        });
        if (ticket) {
          isSubEvent = true;
          subEventIndex = ticket.sub_events.findIndex(
            se => se._id.toString() === data.ticketId
          );
        }
      }
      if (!ticket) {
        console.error(`❌ Ticket not found: ${data.ticketId}`);
        return { error: 'Ticket not found' };
      }
      // ✅ Update the appropriate field
      if (isSubEvent && subEventIndex !== -1) {
        // Update sub-event stats
        const subEvent = ticket.sub_events[subEventIndex];
        
        switch (data.statType) {
          case 'like':
            subEvent.like = (subEvent.like || 0) + data.increment;
            break;
          case 'share':
            subEvent.share = (subEvent.share || 0) + data.increment;
            break;
          case 'totalBookings':
            subEvent.totalBookings = (subEvent.totalBookings || 0) + data.increment;
            break;
          case 'totalTicketsSold':
            subEvent.totalTicketsSold = (subEvent.totalTicketsSold || 0) + data.increment;
            break;
          case 'revenue':
            subEvent.revenue = (subEvent.revenue || 0) + data.increment;
            break;
          default:
            return { error: `Unknown statType: ${data.statType}` };
        }

        // Mark the sub_events array as modified
        ticket.markModified('sub_events');
        await ticket.save();

        console.log(`✅ Updated ${data.statType} for sub-event ${data.ticketId} in parent ticket ${ticket._id}`);
        
        return {
          success: true,
          ticketId: data.ticketId,
          parentTicketId: ticket._id,
          isSubEvent: true,
          statType: data.statType,
          newValue: subEvent[data.statType],
        };
      } else {
        // Update main ticket stats
        switch (data.statType) {
          case 'like':
            ticket.like = (ticket.like || 0) + data.increment;
            break;
          case 'share':
            ticket.share = (ticket.share || 0) + data.increment;
            break;
          case 'totalBookings':
            ticket.totalBookings = (ticket.totalBookings || 0) + data.increment;
            break;
          case 'totalTicketsSold':
            ticket.totalTicketsSold = (ticket.totalTicketsSold || 0) + data.increment;
            break;
          case 'revenue':
            ticket.revenue = (ticket.revenue || 0) + data.increment;
            break;
          default:
            return { error: `Unknown statType: ${data.statType}` };
        }

        await ticket.save();

        console.log(`✅ Updated ${data.statType} for main ticket ${data.ticketId}`);
        
        return {
          success: true,
          ticketId: ticket._id,
          isSubEvent: false,
          statType: data.statType,
          newValue: ticket[data.statType],
        };
      }
    } catch (error) {
      console.error('❌ Error in update-ticket-stats handler:', error);
      return { error: error.message };
    }
  });
  // Handler for get-tickets-by-ids (bulk fetch for user's liked/saved events)
  await listenQueue('get-tickets-by-ids', async (data) => {
    try {
      console.log('📥 Processing get-tickets-by-ids');
      
      if (!data.ticketIds || !Array.isArray(data.ticketIds)) {
        return { error: 'ticketIds array is required' };
      }

      const tickets = await Ticket.find({
        _id: { $in: data.ticketIds },
      }).sort({ createdAt: -1 });

      return {
        success: true,
        tickets,
        count: tickets.length,
      };
    } catch (error) {
      console.error('❌ Error in get-tickets-by-ids handler:', error);
      return { error: error.message };
    }
  });
  console.log('✅ All RabbitMQ consumers started successfully (Ticket Service)');
};
export { connectRabbitMQ };
