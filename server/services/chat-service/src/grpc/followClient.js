import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../../../../protos/follow.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const followProto = grpc.loadPackageDefinition(packageDefinition).follow;
const FOLLOW_SERVICE_URL = process.env.FOLLOW_GRPC_URL || 'localhost:50058';
let client = null;

const getClient = () => {
  if (!client) {
    client = new followProto.FollowService(
      FOLLOW_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

const cache = new Map();
const CACHE_TTL = 60000;

export const getFollowerIds = async (userId, retries = 2) => {
  const cacheKey = `followerIds:${userId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.GetFollowerIds({ userId }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.followerIds || []);
          }
        });
      });

      cache.set(cacheKey, {
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

export const getRelationship = async (userId, targetUserId, retries = 2) => {
  const cacheKey = `relationship:${userId}:${targetUserId}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.GetRelationship({ userId, targetUserId }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      cache.set(cacheKey, {
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

export const checkMutualFollow = async (userId, targetUserId, retries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const response = await new Promise((resolve, reject) => {
        client.CheckMutualFollow({ userId, targetUserId }, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response.isMutual || false);
          }
        });
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
export const unfollowUserViaGrpc = async (followerId, followingId, retries = 2) => {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      
      const metadata = new grpc.Metadata();
      metadata.add('user-id', followerId);
      
      const response = await new Promise((resolve, reject) => {
        client.UnfollowUser(
          { targetUserId: followingId },
          metadata,
          (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
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
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);