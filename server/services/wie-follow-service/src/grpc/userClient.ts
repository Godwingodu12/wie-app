import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
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
  oneofs: true,
});

const wieUserProto = grpc.loadPackageDefinition(packageDefinition) as any;

// ✅ Initialize client with error handling
let client: any = null;

try {
  // FIX: Use correct package name 'wieuser.WieUserService'
  client = new wieUserProto.wieuser.WieUserService(
    process.env.USER_GRPC_URL || 'localhost:50053',
    grpc.credentials.createInsecure()
  );
} catch (error) {
  console.error('❌ Failed to initialize gRPC User Client:', error);
}

// Helper function to check if client is available
const ensureClient = () => {
  if (!client) {
    throw new Error('gRPC client is not initialized. Check USER_GRPC_URL configuration.');
  }
  return client;
};

export const incrementFollowing = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const grpcClient = ensureClient();
      grpcClient.IncrementFollowing({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC IncrementFollowing error:', error);
          reject(error);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error('gRPC client error:', error);
      reject(error);
    }
  });
};

export const incrementFollowers = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const grpcClient = ensureClient();
      grpcClient.IncrementFollowers({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC IncrementFollowers error:', error);
          reject(error);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error('gRPC client error:', error);
      reject(error);
    }
  });
};

export const decrementFollowing = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const grpcClient = ensureClient();
      grpcClient.DecrementFollowing({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC DecrementFollowing error:', error);
          reject(error);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error('gRPC client error:', error);
      reject(error);
    }
  });
};

export const decrementFollowers = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const grpcClient = ensureClient();
      grpcClient.DecrementFollowers({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC DecrementFollowers error:', error);
          reject(error);
          return;
        }
        resolve(response);
      });
    } catch (error) {
      console.error('gRPC client error:', error);
      reject(error);
    }
  });
};
export const getUserById = async (userId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      resolve(null);
      return;
    }

    try {
      const grpcClient = ensureClient();
      grpcClient.GetWieUser({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC GetWieUser error:', error);
          resolve(null);
          return;
        }
        if (response?.user) {
          resolve(response.user);
        } else {
          resolve(null);
        }
      });
    } catch (error) {
      console.error('gRPC client initialization error:', error);
      resolve(null);
    }
  });
};
export const getUsersByIds = async (userIds: string[]): Promise<any[]> => {
  if (!userIds || userIds.length === 0) {
    return [];
  }

  try {
    const userPromises = userIds.map(id => getUserById(id));
    const users = await Promise.all(userPromises);
    const validUsers = users.filter(user => user !== null);    
    return validUsers;
  } catch (error) {
    console.error('Error fetching multiple users:', error);
    return [];
  }
};
export const getFollowerCount = async (userId: string): Promise<{ followers: number; following: number } | null> => {
  try {
    // Import Follow model to get counts
    const Follow = (await import('../models/follow.model')).default;
    
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId, status: 'active' }),
      Follow.countDocuments({ followerId: userId, status: 'active' })
    ]);

    return {
      followers: followersCount,
      following: followingCount
    };
  } catch (error) {
    console.error('Failed to get follower count:', error);
    return null;
  }
};
export const getAccountPrivacy = async (userId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      resolve('public');
      return;
    }

    try {
      const grpcClient = ensureClient();
      grpcClient.GetAccountPrivacy({ userId }, (error: any, response: any) => {
        if (error) {
          console.error('gRPC GetAccountPrivacy error:', error);
          resolve('public'); // Default to public on error
          return;
        }
        resolve(response?.accountPrivacy || 'public');
      });
    } catch (error) {
      console.error('gRPC client error:', error);
      resolve('public');
    }
  });
};
export default client;
