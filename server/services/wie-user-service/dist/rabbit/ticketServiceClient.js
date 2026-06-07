import { sendRPC } from './producer';
export const getAllLiveEvents = async () => {
    try {
        const response = await sendRPC('get-all-live-events', {}, 15000 // 15 second timeout
        );
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching live events:', error.message);
        throw new Error(`Failed to fetch live events: ${error.message}`);
    }
};
/**
 * Fetch all active groups from ticket-service
 */
export const getAllGroups = async () => {
    try {
        const response = await sendRPC('get-all-groups', {}, 15000 // 15 second timeout
        );
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching groups:', error.message);
        throw new Error(`Failed to fetch groups: ${error.message}`);
    }
};
/**
 * Fetch a specific ticket by ID
 */
export const getTicketById = async (ticketId) => {
    try {
        const response = await sendRPC('get-ticket-by-id', { ticketId }, 10000);
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching ticket:', error.message);
        throw new Error(`Failed to fetch ticket: ${error.message}`);
    }
};
/**
 * Fetch a specific group by ID
 */
export const getGroupById = async (groupId) => {
    try {
        const response = await sendRPC('get-group-by-id', { groupId }, 10000);
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching group:', error.message);
        throw new Error(`Failed to fetch group: ${error.message}`);
    }
};
//# sourceMappingURL=ticketServiceClient.js.map