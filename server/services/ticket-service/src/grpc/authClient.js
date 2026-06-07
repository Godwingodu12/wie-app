import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../../../../protos/auth.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const authProto = grpc.loadPackageDefinition(packageDefinition).auth;
const AUTH_SERVICE_URL = process.env.AUTH_GRPC_URL || 'localhost:50051';
let client = null;
const getClient = () => {
  if (!client) {
    client = new authProto.AuthService(
      AUTH_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

const userCache = new Map();
const CACHE_TTL = 60000;

export const getUserFromAuthService = async (userId, retries = 3, skipCache = false) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  const cacheKey = `user:${userId}`;
  if (!skipCache) {
    const cached = userCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      const user = await new Promise((resolve, reject) => {
        client.GetUserData({ userId }, (error, response) => {
          if (error) {
            reject(error);
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      if (user && user.id) {
        // ✅ Only cache if skipCache is false
        if (!skipCache) {
          userCache.set(cacheKey, {
            data: user,
            timestamp: Date.now()
          });
        }
        return user;
      }
      throw new Error('No user data received or invalid response');
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = 1000 * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error('Failed to fetch user after all retries');
};
export const clearUserCacheById = (userId) => {
  if (!userId) return;
  
  const cacheKey = `user:${userId}`;
  userCache.delete(cacheKey);
};
export const clearUserCache = () => {
  userCache.clear();
};
export const invalidateUserCache = async (userId) => {
  clearUserCacheById(userId);
  try {
    const client = getClient();
    await new Promise((resolve, reject) => {
      client.ClearUserCache({ userId }, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    });
  } catch (error) {
    // Ignore errors - cache clearing is best-effort
  }
};
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);
