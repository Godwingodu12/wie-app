import { listenQueue, publishToQueue } from './consumer.js';
import { isChannelAvailable } from './connection.js';

// Helper to get user from auth-service with caching
const userCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

export const getUserFromAuthService = async (payload, retries = 2) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available, cannot fetch user');
    throw new Error('RabbitMQ connection not available');
  }

  // Check cache first for single user requests
  if (payload.userId && !payload.action) {
    const cacheKey = `user:${payload.userId}`;
    const cached = userCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached user data');
      return cached.data;
    }
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Fetching user (attempt ${attempt}/${retries})`);
      const startTime = Date.now();
      
      const user = await publishToQueue('auth-get-user', payload, 5000);
      
      const elapsedTime = Date.now() - startTime;
      console.log(`⚡ User fetch completed in ${elapsedTime}ms`);
      
      if (user && user.error) {
        throw new Error(user.error);
      }
      
      if (user) {
        // Cache the result for single user requests
        if (payload.userId && !payload.action) {
          userCache.set(`user:${payload.userId}`, {
            data: user,
            timestamp: Date.now()
          });
        }
        
        return user;
      }
      
      throw new Error('No user data received');
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = 500 * attempt; // Shorter delay
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ All retry attempts failed for user fetch');
  throw lastError;
};

// Helper to get followers from auth-service with caching
const followersCache = new Map();

export const getFollowersFromAuthService = async (userId, retries = 2) => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not available, cannot fetch followers');
    throw new Error('RabbitMQ connection not available');
  }

  // Check cache first
  const cacheKey = `followers:${userId}`;
  const cached = followersCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Returning cached followers data');
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Fetching followers (attempt ${attempt}/${retries})`);
      const startTime = Date.now();
      
      const followers = await publishToQueue('auth-get-followers', { userId }, 5000);
      
      const elapsedTime = Date.now() - startTime;
      console.log(`⚡ Followers fetch completed in ${elapsedTime}ms`);
      
      if (followers && followers.error) {
        throw new Error(followers.error);
      }
      
      if (followers) {
        // Cache the result
        followersCache.set(cacheKey, {
          data: followers,
          timestamp: Date.now()
        });
        
        return followers;
      }
      
      throw new Error('No followers data received');
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const delay = 500 * attempt;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('❌ All retry attempts failed for followers fetch');
  throw lastError;
};

// Clear cache periodically
setInterval(() => {
  userCache.clear();
  followersCache.clear();
  console.log('🧹 Cleared user and followers cache');
}, CACHE_TTL * 2);
export const listenForChatRequests = async () => {
  await listenQueue('chat-get-messages', async (payload) => {
    try {
      return { success: true, message: 'Chat service is running' };
    } catch (error) {
      console.error('❌ Error in chat-get-messages handler:', error.message);
      return { error: error.message };
    }
  });
};