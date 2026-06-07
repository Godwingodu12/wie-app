import { listenQueue, publishToQueue } from './consumer.js';
import { isChannelAvailable } from './connection.js';
import { 
  getUserFromAuthServiceGrpc, 
  getFollowersFromAuthServiceGrpc 
} from '../grpc/authClient.js';

const userCache = new Map();
const CACHE_TTL = 60000;

export const getUserFromAuthService = async (payload, retries = 2) => {
  // Try gRPC first, fallback to RabbitMQ
  try {
    return await getUserFromAuthServiceGrpc(payload, retries);
  } catch (grpcError) {
    // Fallback to RabbitMQ
    if (!isChannelAvailable()) {
      throw new Error('Both gRPC and RabbitMQ are unavailable');
    }

    if (payload.userId && !payload.action) {
      const cacheKey = `user:${payload.userId}`;
      const cached = userCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const user = await publishToQueue('auth-get-user', payload, 5000);
        
        if (user && user.error) {
          throw new Error(user.error);
        }
        
        if (user) {
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
        
        if (attempt < retries) {
          const delay = 500 * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
};

const searchCache = new Map();

export const searchUsersFromAuthService = async (query, excludeUserId, retries = 2) => {
  if (!isChannelAvailable()) {
    throw new Error('RabbitMQ connection not available');
  }

  const cacheKey = `search:${query}:${excludeUserId}`;
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const results = await publishToQueue('auth-search-users', {
        query: query.trim(),
        excludeUserId
      }, 5000);
      
      if (results && results.error) {
        throw new Error(results.error);
      }
      
      if (results) {
        searchCache.set(cacheKey, {
          data: results,
          timestamp: Date.now()
        });
        
        return results;
      }
      
      throw new Error('No search results received');
      
    } catch (error) {
      lastError = error;
      
      if (attempt < retries) {
        const delay = 500 * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

const followersCache = new Map();

export const getFollowersFromAuthService = async (userId, retries = 2) => {
  // Try gRPC first, fallback to RabbitMQ
  try {
    return await getFollowersFromAuthServiceGrpc(userId, retries);
  } catch (grpcError) {
    // Fallback to RabbitMQ
    if (!isChannelAvailable()) {
      throw new Error('Both gRPC and RabbitMQ are unavailable');
    }

    const cacheKey = `followers:${userId}`;
    const cached = followersCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const followers = await publishToQueue('auth-get-followers', { userId }, 5000);
        
        if (followers && followers.error) {
          throw new Error(followers.error);
        }
        
        if (followers) {
          followersCache.set(cacheKey, {
            data: followers,
            timestamp: Date.now()
          });
          
          return followers;
        }
        
        throw new Error('No followers data received');
        
      } catch (error) {
        lastError = error;
        
        if (attempt < retries) {
          const delay = 500 * attempt;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
};

setInterval(() => {
  userCache.clear();
  followersCache.clear();
  searchCache.clear();
}, CACHE_TTL * 2);
export const listenForChatRequests = async () => {
  await listenQueue('chat-get-messages', async (payload) => {
    try {
      return { success: true, message: 'Chat service is running' };
    } catch (error) {
      return { error: error.message };
    }
  });
};
