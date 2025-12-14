import { sendRPC } from './producer';

// Type definitions for ticket service responses
export interface Ticket {
  _id: string;
  title: string;
  description: string;
  event_status: string;
  price: number;
  total_seats: number;
  available_seats: number;
  event_date: Date;
  event_time: string;
  venue: string;
  category: string;
  groupId?: string;
  organizerId: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  _id: string;
  name: string;
  description: string;
  status: string;
  category: string;
  members?: string[];
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAllLiveEventsResponse {
  count: number;
  tickets: Ticket[];
}

export interface GetAllGroupsResponse {
  count: number;
  groups: Group[];
}
export const getAllLiveEvents = async (): Promise<GetAllLiveEventsResponse> => {
  try {
    const response = await sendRPC<GetAllLiveEventsResponse>(
      'get-all-live-events',
      {},
      15000 // 15 second timeout
    );
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching live events:', error.message);
    throw new Error(`Failed to fetch live events: ${error.message}`);
  }
};

/**
 * Fetch all active groups from ticket-service
 */
export const getAllGroups = async (): Promise<GetAllGroupsResponse> => {
  try {
    const response = await sendRPC<GetAllGroupsResponse>(
      'get-all-groups',
      {},
      15000 // 15 second timeout
    );
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching groups:', error.message);
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }
};

/**
 * Fetch a specific ticket by ID
 */
export const getTicketById = async (ticketId: string): Promise<Ticket> => {
  try {
    const response = await sendRPC<Ticket>(
      'get-ticket-by-id',
      { ticketId },
      10000
    );
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching ticket:', error.message);
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }
};

/**
 * Fetch a specific group by ID
 */
export const getGroupById = async (groupId: string): Promise<Group> => {
  try {
    const response = await sendRPC<Group>(
      'get-group-by-id',
      { groupId },
      10000
    );
    return response;
  } catch (error: any) {
    console.error('❌ Error fetching group:', error.message);
    throw new Error(`Failed to fetch group: ${error.message}`);
  }
};
