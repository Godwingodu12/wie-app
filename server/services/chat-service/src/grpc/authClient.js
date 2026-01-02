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

export const getUserFromAuthServiceGrpc = async (payload, retries = 2) => {
  const cacheKey = payload.userId ? `user:${payload.userId}` : null;
  
  if (cacheKey) {
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
        client.GetUser(payload, (error, response) => {
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
        if (cacheKey) {
          userCache.set(cacheKey, {
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
};
export const getFollowersFromAuthServiceGrpc = async (userId, retries = 2) => {
  const cacheKey = `followers:${userId}`;
  const cached = userCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getClient();
      const followers = await new Promise((resolve, reject) => {
        client.GetFollowersData({ userId }, (error, response) => {
          if (error) {
            reject(error);
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
      if (followers) {
        userCache.set(cacheKey, {
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
};
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, CACHE_TTL);