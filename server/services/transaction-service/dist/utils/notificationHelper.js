import { sendRPC, publishToQueue } from '../rabbit/producer';
import { isChannelAvailable } from '../rabbit/connection';
export const createNotification = async (payload) => {
    try {
        console.log('📤 Sending notification to notification-service:', payload);
        // ✅ Ensure all IDs are strings
        const sanitizedPayload = {
            ...payload,
            userId: String(payload.userId),
            bookingId: payload.bookingId ? String(payload.bookingId) : undefined,
            ticketId: payload.ticketId ? String(payload.ticketId) : undefined,
        };
        await sendRPC('notification-create', sanitizedPayload, 5000);
        console.log('✅ Notification sent successfully');
    }
    catch (error) {
        console.error('❌ Error sending notification:', error.message);
        // Don't throw - notification failure shouldn't break the main flow
    }
};
export const getNotifications = async (params) => {
    if (!isChannelAvailable()) {
        throw new Error('RabbitMQ not available');
    }
    try {
        const response = await publishToQueue('notification-get', params, 5000);
        return response;
    }
    catch (error) {
        console.error('❌ Error fetching notifications:', error.message);
        throw error;
    }
};
export const markNotificationAsRead = async (params) => {
    if (!isChannelAvailable()) {
        throw new Error('RabbitMQ not available');
    }
    try {
        const response = await publishToQueue('notification-mark-read', params, 5000);
        return response;
    }
    catch (error) {
        console.error('❌ Error marking notification as read:', error.message);
        throw error;
    }
};
export const markAllNotificationsAsRead = async (params) => {
    if (!isChannelAvailable()) {
        throw new Error('RabbitMQ not available');
    }
    try {
        const response = await publishToQueue('notification-mark-all-read', params, 5000);
        return response;
    }
    catch (error) {
        console.error('❌ Error marking all notifications as read:', error.message);
        throw error;
    }
};
export const deleteNotification = async (params) => {
    if (!isChannelAvailable()) {
        throw new Error('RabbitMQ not available');
    }
    try {
        const response = await publishToQueue('notification-delete', params, 5000);
        return response;
    }
    catch (error) {
        console.error('❌ Error deleting notification:', error.message);
        throw error;
    }
};
//# sourceMappingURL=notificationHelper.js.map