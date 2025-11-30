import { connectRabbitMQ, isChannelAvailable } from './connection.js';
import { listenQueue } from './consumer.js';
import Ticket from '../models/ticket.model.js';
import Group from '../models/group.model.js';

export const startConsumers = async () => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }

  console.log('🎧 Starting RabbitMQ consumers for Ticket Service...');

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

  // Handler for get-ticket-by-id
  await listenQueue('get-ticket-by-id', async (data) => {
    try {
      console.log('📥 Processing get-ticket-by-id request:', data.ticketId);
      
      if (!data.ticketId) {
        return { error: 'Ticket ID is required' };
      }

      const ticket = await Ticket.findById(data.ticketId);
      
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
      console.log('📥 Processing get-group-by-id request:', data.groupId);
      
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
  console.log('✅ All RabbitMQ consumers started successfully');
};
export { connectRabbitMQ };
