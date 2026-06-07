import WieUserModel from '../models/wieuser.model';
import { connectRabbitMQ, isChannelAvailable } from './connection';
import { listenQueue } from './consumer';
export const startConsumers = async (): Promise<void> => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }
  await listenQueue('get-wie-user', async (data) => {
    try {
      console.log('📥 Processing get-wie-user request:', data.userId);
      
      if (!data.userId) {
        return { error: 'User ID is required' };
      }

      const user = await WieUserModel.findById(data.userId);
      
      if (!user) {
        return { error: 'User not found' };
      }

      // Map to expected format
      return {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        contactNo: user.contact_no || '',
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error: any) {
      console.error('❌ Error in get-wie-user handler:', error);
      return { error: error.message };
    }
  });

  console.log('✅ All RabbitMQ consumers started successfully (WIE User Service)');
};
export { connectRabbitMQ };