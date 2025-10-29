import { listenQueue, publishToQueue } from './consumer.js';
import { isChannelAvailable } from './connection.js';

export const listenForUserRequests = async () => {
  await listenQueue('get-user', async (payload) => {
    try {
      console.log('📦 Received get-user request:', payload);
      
      // Forward request to auth-service
      const response = await publishToQueue('auth-get-user', payload, 10000);
      return response;
    } catch (error) {
      console.error('❌ Error in get-user handler:', error.message);
      return { error: error.message };
    }
  });
};

// Helper function with better error handling and retry logic
export const getUserFromAuthService = async (userId, retries = 2) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available, cannot fetch user');
    throw new Error('RabbitMQ connection not available');
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempting to fetch user (attempt ${attempt}/${retries}):`, userId);
      
      const user = await publishToQueue('auth-get-user', { userId }, 10000);
      
      if (user && user.error) {
        throw new Error(user.error);
      }
      
      if (user) {
        console.log(`✅ Successfully fetched user:`, user._id);
        return user;
      }
      
      throw new Error('No user data received');
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        const delay = 1000 * attempt;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ All retry attempts failed for user fetch');
  throw lastError;
};
