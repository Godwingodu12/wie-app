import User from '../models/user.model.js';
import { listenQueue } from './consumer.js';

export const listenForUserRequests = async () => {
  await listenQueue('get-user', async (payload) => {
    try {
      console.log('📦 Raw payload received:', JSON.stringify(payload));
      let userId;
      if (typeof payload === 'string') {
        userId = payload;
      } else if (typeof payload === 'object' && payload !== null) {
        userId = payload.userId || payload.id || payload._id;
      }
      console.log(`🔍 Extracted userId: ${userId}`);
      if (!userId || typeof userId !== 'string') {
        console.error('❌ Invalid userId:', userId, 'from payload:', payload);
        return { error: 'Invalid userId format', payload };
      }
      const user = await User.findById(userId).select('-password').lean();
      if (!user) {
        console.warn(`⚠️ User not found with ID: ${userId}`);
        return { error: 'User not found', userId };
      }
      console.log(`✅ User found: ${user.email || user.username || user._id}`);
      return user;
    } catch (err) {
      console.error('❌ Error fetching user:', err.message);
      return { error: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined };
    }
  });
};
