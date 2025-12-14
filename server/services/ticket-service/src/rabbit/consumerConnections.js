// Replace the entire consumerConnections.js file in ticket-service
import { sendRPC } from './producer.js';
import { isChannelAvailable } from './connection.js';
// Cache for user data
const userCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

// ✅ Helper function to get user data from auth-service
export const getUserFromAuthService = async (userId, retries = 3) => {
  if (!userId) {
    console.error('❌ No userId provided');
    throw new Error('User ID is required');
  }
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available, cannot fetch user');
    throw new Error('RabbitMQ connection not available');
  }
  // Check cache first
  const cacheKey = `user:${userId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✅ Returning cached user data for: ${userId}`);
    return cached.data;
  }
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Fetching user from auth-service (attempt ${attempt}/${retries}):`, userId);
      const startTime = Date.now();
      // Use sendRPC instead of publishToQueue
      const user = await sendRPC('get-user', { userId }, 8000);
      const elapsedTime = Date.now() - startTime;
      console.log(`⏱️ Auth-service responded in ${elapsedTime}ms`);
      
      if (user && user.error) {
        throw new Error(user.error);
      }
      
      if (user && user._id) {
        console.log(`✅ Successfully fetched user: ${user._id}`);
        
        // Cache the result
        userCache.set(cacheKey, {
          data: user,
          timestamp: Date.now()
        });
        
        return user;
      }
      
      throw new Error('No user data received or invalid response');
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = 1000 * attempt; // Exponential backoff
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`❌ All ${retries} retry attempts failed for user fetch:`, userId);
  throw lastError || new Error('Failed to fetch user after all retries');
};

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);

// Optional: Function to manually clear cache
export const clearUserCache = () => {
  userCache.clear();
  console.log('🗑️ User cache cleared');
};
