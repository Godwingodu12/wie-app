import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
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
const ticketProto = grpc.loadPackageDefinition(packageDefinition).ticket as any;
const TICKET_SERVICE_URL = process.env.TICKET_GRPC_URL || 'localhost:50052';
let client: any = null;
const getClient = () => {
  if (!client) {
    client = new ticketProto.TicketService(
      TICKET_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export interface Ticket {
  id: string;
  _id?: string;
  event_name: string;
  event_category: string;
  event_subcategory?: string;
  event_type?: string;
  event_status: string;
  event_description: string;
  event_banner: string;
  event_logo?: string;
  location: string;
  venue: string;
  location_type?: string;
  payment_type: string;
  groupId: string;
  userId: string;
  ticket_types?: any[];
  event_dates?: any[];
  banking_details?: any[];
  seating_layout?: any;
  sub_events?: any[];
  guests?: any[];
  POCS?: any[];
  hashtag?: string[];
  event_images?: any[];
  like?: number;
  share?: number;
  totalBookings?: number;
  totalTicketsSold?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface Group {
  id: string;
  _id?: string;
  name: string;
  grp_type: string;
  email: string;
  contact_no: string;
  status: string;
  primary_bank_acc_holder?: string;
  primary_bank_acc_no?: string;
  primary_bank_ifsc?: string;
  primary_bank_acc_type?: string;
  razorpayEnabled?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  razorpayAccountId?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface GetAllLiveEventsResponse {
  count: number;
  tickets: Ticket[];
  error?: string;
}

export interface GetAllGroupsResponse {
  count: number;
  groups: Group[];
  error?: string;
}
export const getAllLiveEvents = async (): Promise<GetAllLiveEventsResponse> => {
  return new Promise((resolve, reject) => {
    const client = getClient();    
    client.GetAllLiveEvents({}, (error: any, response: any) => {
      if (error) {
        console.error('❌ [User Service gRPC] Failed to fetch live events:', error.message);
        reject(new Error(`Failed to fetch live events: ${error.message}`));
      } else if (response.error) {
        console.error('❌ [User Service gRPC] Live events error:', response.error);
        reject(new Error(response.error));
      } else {        
        // Normalize all tickets - PRESERVE sub-event fields
        const normalizedTickets = (response.tickets || []).map((ticket: any) => ({
          id: ticket.id || ticket._id,
          _id: ticket._id || ticket.id,
          event_name: ticket.event_name || '',
          event_category: ticket.event_category || '',
          event_subcategory: ticket.event_subcategory || '',
          event_type: ticket.event_type || '',
          event_status: ticket.event_status || '',
          event_description: ticket.event_description || '',
          event_banner: ticket.event_banner || '',
          event_logo: ticket.event_logo || '',
          location: ticket.location || '',
          venue: ticket.venue || '',
          location_type: ticket.location_type || '',
          payment_type: ticket.payment_type || 'paid',
          groupId: ticket.groupId || '',
          userId: ticket.userId || '',
          ticket_types: ticket.ticket_types || [],
          event_dates: ticket.event_dates || [],
          banking_details: ticket.banking_details || [],
          seating_layout: ticket.seating_layout,
          sub_events: ticket.sub_events || [],
          guests: ticket.guests || [],
          POCS: ticket.POCS || [],
          hashtag: ticket.hashtag || [],
          event_images: ticket.event_images || [],
          like: ticket.like || 0,
          share: ticket.share || 0,
          totalBookings: ticket.totalBookings || 0,
          totalTicketsSold: ticket.totalTicketsSold || 0,
          revenue: ticket.revenue || 0,
          createdAt: ticket.createdAt || '',
          updatedAt: ticket.updatedAt || '',
          // CRITICAL: Preserve sub-event identification fields
          isSubEvent: ticket.isSubEvent || false,
          parentEventId: ticket.parentEventId || null,
          parentEventName: ticket.parentEventName || null,
          ...ticket
        }));        
        resolve({
          count: response.count,
          tickets: normalizedTickets,
          error: response.error
        });
      }
    });
  });
};
export const getAllGroups = async (): Promise<GetAllGroupsResponse> => {
  return new Promise((resolve, reject) => {
    const client = getClient();    
    client.GetAllGroups({}, (error: any, response: any) => {
      if (error) {
        console.error('❌ [User Service gRPC] Failed to fetch groups:', error.message);
        reject(new Error(`Failed to fetch groups: ${error.message}`));
      } else if (response.error) {
        console.error('❌ [User Service gRPC] Groups error:', response.error);
        reject(new Error(response.error));
      } else {        
        // Normalize all groups
        const normalizedGroups = (response.groups || []).map((group: any) => ({
          id: group.id || group._id,
          _id: group._id || group.id,
          name: group.name || '',
          grp_type: group.grp_type || '',
          email: group.email || '',
          contact_no: group.contact_no || '',
          status: group.status || '',
          primary_bank_acc_holder: group.primary_bank_acc_holder,
          primary_bank_acc_no: group.primary_bank_acc_no,
          primary_bank_ifsc: group.primary_bank_ifsc,
          primary_bank_acc_type: group.primary_bank_acc_type,
          razorpayEnabled: group.razorpayEnabled,
          razorpayKeyId: group.razorpayKeyId,
          razorpayKeySecret: group.razorpayKeySecret,
          razorpayAccountId: group.razorpayAccountId,
          createdAt: group.createdAt || '',
          updatedAt: group.updatedAt || '',
          ...group
        }));
        
        resolve({
          count: response.count,
          groups: normalizedGroups,
          error: response.error
        });
      }
    });
  });
};

export const getTicketById = async (ticketId: string): Promise<Ticket> => {
  return new Promise((resolve, reject) => {
    if (!ticketId || ticketId === 'undefined' || ticketId === 'null') {
      console.error('❌ [User Service gRPC] Invalid ticketId provided:', ticketId);
      reject(new Error('Invalid ticket ID'));
      return;
    }

    const client = getClient();    
    client.GetTicketById({ ticketId }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ [User Service gRPC] Failed to fetch ticket: ${error.message}`);
        reject(new Error(`Failed to fetch ticket: ${error.message}`));
      } else if (response.error) {
        console.error(`❌ [User Service gRPC] Ticket error: ${response.error}`);
        reject(new Error(response.error));
      } else if (!response.ticket) {
        console.error(`❌ [User Service gRPC] No ticket data received for: ${ticketId}`);
        reject(new Error('Ticket not found'));
      } else {        
        const ticket = response.ticket;
        const normalizedTicket: Ticket = {
          id: ticket.id || ticket._id,
          _id: ticket._id || ticket.id,
          event_name: ticket.event_name || '',
          event_category: ticket.event_category || '',
          event_subcategory: ticket.event_subcategory || '',
          event_type: ticket.event_type || '',
          event_status: ticket.event_status || '',
          event_description: ticket.event_description || '',
          event_banner: ticket.event_banner || '',
          event_logo: ticket.event_logo || '',
          location: ticket.location || '',
          venue: ticket.venue || '',
          location_type: ticket.location_type || '',
          payment_type: ticket.payment_type || 'paid',
          groupId: ticket.groupId || '',
          userId: ticket.userId || '',
          ticket_types: ticket.ticket_types || [],
          event_dates: ticket.event_dates || [],
          banking_details: ticket.banking_details || [],
          seating_layout: ticket.seating_layout,
          sub_events: ticket.sub_events || [],
          guests: ticket.guests || [],
          POCS: ticket.POCS || [],
          hashtag: ticket.hashtag || [],
          event_images: ticket.event_images || [],
          like: ticket.like || 0,
          share: ticket.share || 0,
          totalBookings: ticket.totalBookings || 0,
          totalTicketsSold: ticket.totalTicketsSold || 0,
          revenue: ticket.revenue || 0,
          createdAt: ticket.createdAt || '',
          updatedAt: ticket.updatedAt || '',
          ...ticket
        };
        
        resolve(normalizedTicket);
      }
    });
  });
};

export const getGroupById = async (groupId: string): Promise<Group> => {
  return new Promise((resolve, reject) => {
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      console.error('❌ [User Service gRPC] Invalid groupId provided:', groupId);
      reject(new Error('Invalid group ID'));
      return;
    }
    const client = getClient();    
    client.GetGroupById({ groupId }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ [User Service gRPC] Failed to fetch group: ${error.message}`);
        reject(new Error(`Failed to fetch group: ${error.message}`));
      } else if (response.error) {
        console.error(`❌ [User Service gRPC] Group error: ${response.error}`);
        reject(new Error(response.error));
      } else if (!response.group) {
        console.error(`❌ [User Service gRPC] No group data received for: ${groupId}`);
        reject(new Error('Group not found'));
      } else {        
        const group = response.group;
        const normalizedGroup: Group = {
          id: group.id || group._id,
          _id: group._id || group.id,
          name: group.name || '',
          grp_type: group.grp_type || '',
          email: group.email || '',
          contact_no: group.contact_no || '',
          status: group.status || '',
          primary_bank_acc_holder: group.primary_bank_acc_holder,
          primary_bank_acc_no: group.primary_bank_acc_no,
          primary_bank_ifsc: group.primary_bank_ifsc,
          primary_bank_acc_type: group.primary_bank_acc_type,
          razorpayEnabled: group.razorpayEnabled,
          razorpayKeyId: group.razorpayKeyId,
          razorpayKeySecret: group.razorpayKeySecret,
          razorpayAccountId: group.razorpayAccountId,
          createdAt: group.createdAt || '',
          updatedAt: group.updatedAt || '',
          ...group
        };
        
        resolve(normalizedGroup);
      }
    });
  });
};

export const updateTicketStats = async (
  ticketId: string,
  statType: string,
  increment: number
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = getClient();    
    client.UpdateTicketStats({ ticketId, statType, increment }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ [User Service gRPC] Failed to update ticket stats: ${error.message}`);
        console.warn('⚠️ [User Service gRPC] Continuing despite stats update failure');
        resolve({ success: false, error: error.message });
      } else if (response.error) {
        console.error(`❌ [User Service gRPC] Stats update error: ${response.error}`);
        console.warn('⚠️ [User Service gRPC] Continuing despite stats update failure');
        resolve({ success: false, error: response.error });
      } else {
        resolve(response);
      }
    });
  });
};

export const getTicketsByIds = async (ticketIds: string[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    const validTicketIds = ticketIds.filter(id => id && id !== 'undefined' && id !== 'null');
    if (validTicketIds.length === 0) {
      reject(new Error('No valid ticket IDs provided'));
      return;
    }
    const client = getClient();    
    client.GetTicketsByIds({ ticketIds: validTicketIds }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ [User Service gRPC] Failed to fetch tickets: ${error.message}`);
        reject(new Error(`Failed to fetch tickets: ${error.message}`));
      } else if (response.error) {
        console.error(`❌ [User Service gRPC] Tickets error: ${response.error}`);
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
};
