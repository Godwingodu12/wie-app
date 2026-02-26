import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/wieuser.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs:    String,
  enums:    String,
  defaults: true,
  oneofs:   true,
});

const wieUserProto   = grpc.loadPackageDefinition(packageDefinition).wieuser;
const WIE_USER_GRPC_URL = process.env.WIE_USER_GRPC_URL || 'localhost:50053';

let client = null;

const getClient = () => {
  if (!client) {
    client = new wieUserProto.WieUserService(
      WIE_USER_GRPC_URL,
      grpc.credentials.createInsecure(),
      {
        'grpc.keepalive_time_ms':              10000,
        'grpc.keepalive_timeout_ms':           5000,
        'grpc.keepalive_permit_without_calls': 1,
      }
    );
  }
  return client;
};

// ─── Fetch single user by ID 
export const getWieUserById = (userId) => {
  return new Promise((resolve) => {
    if (!userId) return resolve(null);

    getClient().GetWieUser({ userId }, (error, response) => {
      if (error) {
        console.warn(`⚠️ [gRPC:WieUser] GetWieUser failed for ${userId}:`, error.message);
        resolve(null);
        return;
      }
      if (!response?.user || response.error) {
        console.warn(`⚠️ [gRPC:WieUser] User not found: ${userId}`, response?.error);
        resolve(null);
        return;
      }
      resolve(response.user);
    });
  });
};

//  Batch fetch users by IDs (single gRPC call — most efficient)
export const getWieUsersByIds = (userIds) => {
  return new Promise((resolve) => {
    if (!userIds || userIds.length === 0) return resolve([]);

    // Deduplicate IDs
    const uniqueIds = [...new Set(userIds.filter(Boolean))];

    getClient().GetUsersByIds({ userIds: uniqueIds }, (error, response) => {
      if (error) {
        console.warn('⚠️ [gRPC:WieUser] GetUsersByIds failed:', error.message);
        resolve([]);
        return;
      }
      resolve(response?.users || []);
    });
  });
};

// ─── Search users by query ────────────────────────────────────────────────────
export const searchWieUsers = (query, excludeUserId = '', limit = 20) => {
  return new Promise((resolve) => {
    if (!query) return resolve([]);

    getClient().SearchUsers(
      { query, excludeUserId, limit },
      (error, response) => {
        if (error) {
          console.warn('⚠️ [gRPC:WieUser] SearchUsers failed:', error.message);
          resolve([]);
          return;
        }
        resolve(response?.users || []);
      }
    );
  });
};

// ─── Get user privacy settings ────────────────────────────────────────────────
export const getUserPrivacySettings = (userId) => {
  return new Promise((resolve) => {
    if (!userId) return resolve(null);

    getClient().GetUserPrivacySettings({ userId }, (error, response) => {
      if (error) {
        console.warn('⚠️ [gRPC:WieUser] GetUserPrivacySettings failed:', error.message);
        resolve(null);
        return;
      }
      resolve(response || null);
    });
  });
};

// ─── Check if two users have blocked each other ───────────────────────────────
export const checkIfBlocked = (userId1, userId2) => {
  return new Promise((resolve) => {
    if (!userId1 || !userId2) return resolve({ isBlocked: false, blockedBy: '' });

    getClient().CheckIfBlocked({ userId1, userId2 }, (error, response) => {
      if (error) {
        console.warn('⚠️ [gRPC:WieUser] CheckIfBlocked failed:', error.message);
        resolve({ isBlocked: false, blockedBy: '' });
        return;
      }
      resolve(response || { isBlocked: false, blockedBy: '' });
    });
  });
};

// ─── Get account privacy setting ─────────────────────────────────────────────
export const getAccountPrivacy = (userId) => {
  return new Promise((resolve) => {
    if (!userId) return resolve({ accountPrivacy: 'public' });

    getClient().GetAccountPrivacy({ userId }, (error, response) => {
      if (error) {
        console.warn('⚠️ [gRPC:WieUser] GetAccountPrivacy failed:', error.message);
        resolve({ accountPrivacy: 'public' });
        return;
      }
      resolve(response || { accountPrivacy: 'public' });
    });
  });
};

// ─── Reset client (useful for reconnection on failure) ────────────────────────
export const resetWieUserClient = () => {
  if (client) {
    client.close();
    client = null;
    console.log('🔄 [gRPC:WieUser] Client reset — will reconnect on next call');
  }
};