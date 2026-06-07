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
// retries on Mongoose version conflict (VersionError)
const VERSION_CONFLICT_PATTERN = /No matching document found for id.*modifiedPaths/i;
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 80; // slight backoff to let the other write settle

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
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
export interface CancelledEventInfo {
  eventId:             string;
  parentEventId:       string;
  isSubEvent:          boolean;
  event_name:          string;
  event_status:        string;
  event_banner:        string;
  event_category:      string;
  cancelled_at:        string;
  cancellation_reason: string;
  event_dates:         any[];
  location:            string;
  venue:               string;
}

export interface RehostedEventInfo {
  eventId:       string;
  parentEventId: string;
  isSubEvent:    boolean;
  event_name:    string;
  event_status:  string;
  event_banner:  string;
  event_category: string;
  rehosted_at:   string;
  event_dates:   any[];
  location:      string;
  venue:         string;
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
  increment: number,
  _attempt = 0
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();

    client.UpdateTicketStats(
      { ticketId, statType, increment },
      async (error: any, response: any) => {
        const errMsg: string = error?.message || response?.error || '';

        // Mongoose VersionError — retry with exponential backoff
        if (errMsg && VERSION_CONFLICT_PATTERN.test(errMsg)) {
          if (_attempt < MAX_RETRIES) {
            const delay = RETRY_DELAY_MS * Math.pow(2, _attempt); // 80, 160, 320, 640 ms
            console.warn(
              `⚠️ [gRPC] Version conflict on UpdateTicketStats (${statType}), ` +
              `retry ${_attempt + 1}/${MAX_RETRIES} in ${delay}ms…`
            );
            await sleep(delay);
            try {
              await updateTicketStats(ticketId, statType, increment, _attempt + 1);
              resolve();
            } catch (retryErr) {
              reject(retryErr);
            }
            return;
          }
          // Exhausted retries — reject so safeUpdateTicketStats can swallow it
          reject(
            new Error(
              `UpdateTicketStats (${statType}) failed after ${MAX_RETRIES} retries ` +
              `due to version conflict: ${errMsg}`
            )
          );
          return;
        }

        if (error) {
          reject(new Error(`Failed to update ticket stats: ${errMsg}`));
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
  return new Promise((resolve) => {
    if (
      !ticketId ||
      ticketId === 'undefined' ||
      ticketId === 'null' ||
      !/^[a-f\d]{24}$/i.test(ticketId)
    ) {
      return resolve({ totalBookings: 0, totalRevenue: 0, totalTicketsSold: 0 });
    }

    const client = getClient();

    client.GetTicketBookingStats({ ticketId }, (error: any, response: any) => {
      if (error) {
        console.error(`❌ [gRPC] GetTicketBookingStats transport error: ${error.message}`);
        return resolve({ totalBookings: 0, totalRevenue: 0, totalTicketsSold: 0 });
      }

      if (response?.error && response.error.trim() !== '') {
        console.error(`❌ [gRPC] Booking stats error: ${response.error}`);
        return resolve({ totalBookings: 0, totalRevenue: 0, totalTicketsSold: 0 });
      }

      resolve({
        totalBookings:    response?.totalBookings    || 0,
        totalRevenue:     response?.totalRevenue     || 0,
        totalTicketsSold: response?.totalTicketsSold || 0,
      });
    });
  });
};

export const updateTicketCancellation = async (
  ticketId: string,
  increment: number
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.UpdateTicketCancellation(
      { ticketId, increment },
      (error: any, response: any) => {
        if (error) {
          reject(new Error(`Failed to update cancellation: ${error.message}`));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      }
    );
  });
};
export const getPreviousEventStats = async (ticketId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.GetPreviousEventStats({ ticketId }, (error: any, response: any) => {
      if (error) {
        reject(new Error(`Failed to fetch event stats: ${error.message}`));
      } else if (response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response);
      }
    });
  });
};

export const cancelEventViaGrpc = async (
  ticketId: string,
  subEventId: string = "",
  hostId: string,
  cancellation_reason: string = ""
): Promise<{ success: boolean; cancelledAt: string }> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    client.CancelEvent(
      { ticketId, subEventId, hostId, cancellation_reason },
      (error: any, response: any) => {
        if (error) return reject(new Error(`CancelEvent gRPC failed: ${error.message}`));
        if (!response.success) return reject(new Error(response.error));
        resolve({ success: true, cancelledAt: response.cancelledAt });
      }
    );
  });
};

export const getEventCancellationInfo = async (
  ticketId: string,
  subEventId: string = ""
): Promise<{ eventId: string; paymentType: string; groupId: string; eventName: string }> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    client.GetEventCancellationInfo(
      { ticketId, subEventId },
      (error: any, response: any) => {
        if (error) return reject(new Error(`GetEventCancellationInfo failed: ${error.message}`));
        if (response.error) return reject(new Error(response.error));
        resolve({
          eventId: response.eventId,
          paymentType: response.paymentType,
          groupId: response.groupId,
          eventName: response.eventName,
        });
      }
    );
  });
};
export const getEventDates = async (ticketId: string): Promise<{
  start_date: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
} | null> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.GetTicketById({ ticketId }, (error: any, response: any) => {
      if (error) {
        reject(new Error(`Failed to fetch event dates: ${error.message}`));
      } else if (response.error) {
        reject(new Error(response.error));
      } else if (!response.ticket) {
        reject(new Error('Ticket not found'));
      } else {
        // Extract first event date
        const eventDates = response.ticket.event_dates?.[0];
        if (eventDates) {
          resolve({
            start_date: eventDates.start_date,
            start_time: eventDates.start_time,
            end_date: eventDates.end_date,
            end_time: eventDates.end_time
          });
        } else {
          resolve(null);
        }
      }
    });
  });
};

export const getCancelledEvents = async (userId?: string): Promise<CancelledEventInfo[]> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    client.GetCancelledEvents({ userId: userId || '' }, (error: any, response: any) => {
      if (error) {
        console.error('❌ [gRPC] getCancelledEvents error:', error.message);
        reject(new Error(error.message));
        return;
      }
      if (response.error) {
        console.error('❌ [gRPC] getCancelledEvents response error:', response.error);
        reject(new Error(response.error));
        return;
      }
      resolve(response.events || []);
    });
  });
};

export const getRehostedEvents = async (userId?: string): Promise<RehostedEventInfo[]> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    client.GetRehostedEvents({ userId: userId || '' }, (error: any, response: any) => {
      if (error) {
        console.error('❌ [gRPC] getRehostedEvents error:', error.message);
        reject(new Error(error.message));
        return;
      }
      if (response.error) {
        console.error('❌ [gRPC] getRehostedEvents response error:', response.error);
        reject(new Error(response.error));
        return;
      }
      resolve(response.events || []);
    });
  });
};
