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
export declare const getAllLiveEvents: () => Promise<GetAllLiveEventsResponse>;
/**
 * Fetch all active groups from ticket-service
 */
export declare const getAllGroups: () => Promise<GetAllGroupsResponse>;
/**
 * Fetch a specific ticket by ID
 */
export declare const getTicketById: (ticketId: string) => Promise<Ticket>;
/**
 * Fetch a specific group by ID
 */
export declare const getGroupById: (groupId: string) => Promise<Group>;
//# sourceMappingURL=ticketServiceClient.d.ts.map