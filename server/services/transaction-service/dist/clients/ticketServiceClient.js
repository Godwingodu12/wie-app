import { sendRPC } from '../rabbit/producer';
export const getTicketById = async (ticketId) => {
    try {
        console.log(`📤 Fetching ticket from ticket-service: ${ticketId}`);
        const response = await sendRPC('get-ticket-by-id', { ticketId }, 10000);
        if (!response || response.error) {
            throw new Error(response.error || 'Ticket not found');
        }
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching ticket:', error.message);
        throw error;
    }
};
export const getGroupById = async (groupId) => {
    try {
        console.log(`📤 Fetching group from ticket-service: ${groupId}`);
        const response = await sendRPC('get-group-by-id', { groupId }, 10000);
        if (!response || response.error) {
            throw new Error(response.error || 'Group not found');
        }
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching group:', error.message);
        throw error;
    }
};
export const updateTicketStats = async (ticketId, statType, increment) => {
    try {
        console.log(`📤 Updating ticket stats: ${statType} by ${increment}`);
        await sendRPC('update-ticket-stats', // ✅ Correct queue name
        { ticketId, statType, increment }, // ✅ Correct parameter names
        5000);
    }
    catch (error) {
        console.error('❌ Error updating ticket stats:', error.message);
        // Don't throw - stats update is not critical
    }
};
export const getTicketStats = async (ticketId) => {
    try {
        console.log(`📤 Fetching ticket stats: ${ticketId}`);
        const response = await sendRPC('get-ticket-stats', { ticketId }, 5000);
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching ticket stats:', error.message);
        throw error;
    }
};
//# sourceMappingURL=ticketServiceClient.js.map