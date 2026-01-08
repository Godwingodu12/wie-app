import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/wieuser.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const wieUserProto = grpc.loadPackageDefinition(packageDefinition).wieuser;
const USER_SERVICE_URL = process.env.WIE_USER_GRPC_URL || 'localhost:50053';

let client = null;

const getClient = () => {
  if (!client) {
    client = new wieUserProto.WieUserService(
      USER_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

const userCache = new Map();
const CACHE_TTL = 10000;

const sanitizeUser = (user) => {
  return {
    id: user.id,
    email: user.email || null,
    contact_no: user.contact_no || null,
    name: user.name || null,
    username: user.username || null,
    profile_picture: user.profile_picture || null,
    country_id: user.country_id || null,
    role: user.role || 'user',
    status: user.status || 'pending',
    bio: user.bio || null,
    location: user.location || null,
    latitude: user.latitude || null,
    longitude: user.longitude || null,
    isOnline: user.isOnline || false,
    last_seen_at: user.last_seen_at || null,
    is_blocked: user.is_blocked || false,
    is_verified: user.is_verified || false,
    google_id: user.google_id || null,
    auth_provider: user.auth_provider || 'local',
    created_at: user.created_at || null,
    updated_at: user.updated_at || null
  };
};

export const getUserPrivacySettings = async (userId, retries = 2) => {
  const cacheKey = `privacy:${userId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.GetUserPrivacySettings({ userId }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      userCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      return response;
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
export const getOnlineStatus = async (userId, retries = 2) => {
  const cacheKey = `onlinestatus:${userId}`;
  const cached = userCache.get(cacheKey);
  
  // Very short cache for online status (5 seconds)
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.GetOnlineStatus({ userId }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      const statusData = {
        isOnline: response.isOnline || false,
        lastSeenAt: response.lastSeenAt || null
      };

      userCache.set(cacheKey, {
        data: statusData,
        timestamp: Date.now()
      });
      
      return statusData;
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
export const getWieUserById = async (userId, retries = 2) => {
  const cacheKey = `wieuser:${userId}`;
  const cached = userCache.get(cacheKey);
  
  // Use shorter cache for more up-to-date status (10 seconds)
  if (cached && Date.now() - cached.timestamp < 10000) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.GetWieUser({ userId }, (error, response) => {
          if (error) {
            reject(error);
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.user);
          }
        });
      });
      if (response && response.id) {
        const mappedUser = sanitizeUser(response);
        userCache.set(cacheKey, {
          data: mappedUser,
          timestamp: Date.now()
        });
        return mappedUser;
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
};

export const getWieUsersByIds = async (userIds, retries = 2) => {
  if (!userIds || userIds.length === 0) {
    return [];
  }  
  const cacheKey = `wieusers:${userIds.sort().join(',')}`;
  const cached = userCache.get(cacheKey);
  
  // Use shorter cache for more up-to-date status (10 seconds)
  if (cached && Date.now() - cached.timestamp < 10000) {
    return cached.data;
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.GetUsersByIds({ userIds }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.users || []);
          }
        });
      });
      
      const mappedUsers = response.map(user => sanitizeUser(user));

      userCache.set(cacheKey, {
        data: mappedUsers,
        timestamp: Date.now()
      });
      
      return mappedUsers;
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

export const searchWieUsers = async (query, excludeUserId, limit = 50, retries = 2) => {  
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.SearchUsers({ query, excludeUserId, limit }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.users || []);
          }
        });
      });      
      
      const mappedUsers = response.map(user => sanitizeUser(user));
      
      return mappedUsers;
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

export const updateUserOnlineStatus = async (userId, isOnline, retries = 2) => {  
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.UpdateOnlineStatus({ userId, isOnline }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      
      return response.success;
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
export const checkIfUserBlockedViaGrpc = async (userId1, userId2, retries = 2) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        // This would call the block service via gRPC if you move it to user-service
        // For now, keep blocks in chat-service
        resolve({ isBlocked: false, blockedBy: 'none' });
      });
      
      return response;
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

export const getBlockedUserIdsViaGrpc = async (userId, retries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        // This would call the block service
        resolve({ blockedUserIds: [] });
      });
      
      return response.blockedUserIds;
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
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);
