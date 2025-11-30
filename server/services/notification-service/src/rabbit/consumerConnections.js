import { listenQueue } from './consumer.js';
import { 
  createNotificationHandler, 
  markAsReadHandler,
  markAllAsReadHandler,
  deleteNotificationHandler,
  getNotificationsHandler
} from '../services/notification.service.js';
export const listenForNotificationRequests = async () => {
  await listenQueue('notification-create', async (payload) => {
    try {
      console.log('📦 Received notification-create request:', payload);
      const notification = await createNotificationHandler(payload);
      console.log('✅ Notification created successfully');
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Error in notification-create handler:', error);
      return { success: false, error: error.message };
    }
  });
  await listenQueue('notification-get', async (payload) => {
    try {
      console.log('📦 Received notification-get request:', payload);
      const result = await getNotificationsHandler(payload);
      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Error in notification-get handler:', error);
      return { success: false, error: error.message };
    }
  });
  // MARK AS READ
  await listenQueue('notification-mark-read', async (payload) => {
    try {
      console.log('📦 Received notification-mark-read request:', payload);
      const notification = await markAsReadHandler(payload);
      return { success: true, notification };
    } catch (error) {
      console.error('❌ Error in notification-mark-read handler:', error);
      return { success: false, error: error.message };
    }
  });
  // MARK ALL AS READ
  await listenQueue('notification-mark-all-read', async (payload) => {
    try {
      console.log('📦 Received notification-mark-all-read request:', payload);
      await markAllAsReadHandler(payload);
      return { success: true, message: 'All notifications marked as read' };
    } catch (error) {
      console.error('❌ Error in notification-mark-all-read handler:', error);
      return { success: false, error: error.message };
    }
  });
  // DELETE NOTIFICATION
  await listenQueue('notification-delete', async (payload) => {
    try {
      console.log('📦 Received notification-delete request:', payload);
      await deleteNotificationHandler(payload);
      return { success: true, message: 'Notification deleted successfully' };
    } catch (error) {
      console.error('❌ Error in notification-delete handler:', error);
      return { success: false, error: error.message };
    }
  });
};
