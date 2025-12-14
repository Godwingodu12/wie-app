import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(
  __dirname,
  '../../../../protos/ticket.proto'
);
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

interface TicketData {
  id: string;
  event_name: string;
  event_category: string;
  event_dates: Array<{
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
  }>;
  location?: string;
  venue?: string;
  ticket_types: Array<{
    _id: string;
    ticket_type: string;
    ticket_price: number;
    max_capacity: number;
  }>;
  banking_details: Array<{
    bank_acc_holder: string;
    bank_acc_no: string;
    bank_ifsc: string;
    bank_acc_type: string;
  }>;
  groupId: string;
  payment_type: 'free' | 'paid';
  seating_layout?: any;
  [key: string]: any;
}
interface GroupData {
  id: string;
  name: string;
  email: string;
  contact_no: string;
  primary_bank_acc_holder?: string;
  primary_bank_acc_no?: string;
  primary_bank_ifsc?: string;
  primary_bank_acc_type?: string;
  [key: string]: any;
}
interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  totalTicketsSold: number;
}
export const getTicketById = async (ticketId: string): Promise<TicketData> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    client.GetTicketById({ ticketId }, (error: any, response: any) => {
      if (error) {
        reject(new Error(`Failed to fetch ticket: ${error.message}`));
      } else if (response.error) {
        reject(new Error(response.error));
      } else if (!response.ticket) {
        reject(new Error('Ticket not found'));
      } else {
        resolve(response.ticket);
      }
    });
  });
};
export const getGroupById = async (groupId: string): Promise<GroupData> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    client.GetGroupById({ groupId }, (error: any, response: any) => {
      if (error) {
        reject(new Error(`Failed to fetch group: ${error.message}`));
      } else if (response.error) {
        reject(new Error(response.error));
      } else if (!response.group) {
        reject(new Error('Group not found'));
      } else {
        resolve(response.group);
      }
    });
  });
};
export const updateTicketStats = async (
  ticketId: string,
  statType: 'like' | 'share' | 'totalBookings' | 'totalTicketsSold' | 'revenue',
  increment: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.UpdateTicketStats(
      { ticketId, statType, increment },
      (error: any, response: any) => {
        if (error) {
          reject(new Error(`Failed to update ticket stats: ${error.message}`));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      }
    );
  });
};
export const getTicketBookingStats = async (ticketId: string): Promise<BookingStats> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    console.log(`🔵 [gRPC] Fetching booking stats for ticket: ${ticketId}`);
    
    client.GetTicketBookingStats({ ticketId }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ [gRPC] Failed to fetch booking stats: ${error.message}`);
        // Don't reject - return zeros instead
        console.warn('⚠️ [gRPC] Returning zero stats due to error');
        resolve({
          totalBookings: 0,
          totalRevenue: 0,
          totalTicketsSold: 0,
        });
      } else if (response.error) {
        console.error(`❌ [gRPC] Booking stats error: ${response.error}`);
        // Don't reject - return zeros instead
        console.warn('⚠️ [gRPC] Returning zero stats due to error');
        resolve({
          totalBookings: 0,
          totalRevenue: 0,
          totalTicketsSold: 0,
        });
      } else {
        console.log(`✅ [gRPC] Successfully fetched booking stats`);
        resolve({
          totalBookings: response.totalBookings || 0,
          totalRevenue: response.totalRevenue || 0,
          totalTicketsSold: response.totalTicketsSold || 0,
        });
      }
    });
  });
};