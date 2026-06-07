import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.join(
  __dirname,
  '../../../../protos/follow.proto'
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const followProto = grpc.loadPackageDefinition(packageDefinition).follow as any;

const FOLLOW_SERVICE_URL = process.env.FOLLOW_GRPC_URL || 'localhost:50058';

let client: any = null;

const getClient = () => {
  if (!client) {
    client = new followProto.FollowService(
      FOLLOW_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export interface AutoAcceptPendingRequestsResponse {
  success: boolean;
  message: string;
  acceptedCount: number;
  error?: string;
}

/**
 * Auto-accept all pending follow requests for a user
 * Called when user switches from private to public account
 */
export const autoAcceptPendingRequests = async (
  userId: string
): Promise<AutoAcceptPendingRequestsResponse> => {
  return new Promise((resolve, reject) => {
    const grpcClient = getClient();
    
    grpcClient.AutoAcceptPendingRequests(
      { userId },
      (error: any, response: AutoAcceptPendingRequestsResponse) => {
        if (error) {
          console.error('❌ gRPC AutoAcceptPendingRequests error:', error);
          reject(new Error(error.message || 'Failed to auto-accept pending requests'));
          return;
        }
        
        if (!response.success && response.error) {
          reject(new Error(response.error));
          return;
        }
        
        resolve(response);
      }
    );
  });
};

/**
 * Get follow status between two users
 */
export const getFollowStatus = async (
  followerId: string,
  followingId: string
): Promise<{ isFollowing: boolean; isPending: boolean; status: string }> => {
  return new Promise((resolve, reject) => {
    const grpcClient = getClient();
    
    grpcClient.GetFollowStatus(
      { followerId, followingId },
      (error: any, response: any) => {
        if (error) {
          console.error('❌ gRPC GetFollowStatus error:', error);
          resolve({ isFollowing: false, isPending: false, status: 'none' });
          return;
        }
        resolve(response);
      }
    );
  });
};

/**
 * Check if user is following another user
 */
export const isFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const grpcClient = getClient();
    
    grpcClient.IsFollowing(
      { followerId, followingId },
      (error: any, response: any) => {
        if (error) {
          console.error('❌ gRPC IsFollowing error:', error);
          resolve(false);
          return;
        }
        resolve(response.isFollowing || false);
      }
    );
  });
};

/**
 * Get all user IDs that a user is following
 */
export const getFollowingIds = async (
  userId: string
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const grpcClient = getClient();
    
    grpcClient.GetFollowingIds(
      { userId },
      (error: any, response: any) => {
        if (error) {
          console.error('❌ gRPC GetFollowingIds error:', error);
          resolve([]);
          return;
        }
        resolve(response.followingIds || []);
      }
    );
  });
};

/**
 * Get detailed following IDs (active and pending separately)
 */
export const getFollowingIdsDetailed = async (
  userId: string
): Promise<{ followingIds: string[]; requestedIds: string[] }> => {
  return new Promise((resolve, reject) => {
    const grpcClient = getClient();
    
    grpcClient.GetFollowingIdsDetailed(
      { userId },
      (error: any, response: any) => {
        if (error) {
          console.error('❌ gRPC GetFollowingIdsDetailed error:', error);
          resolve({ followingIds: [], requestedIds: [] });
          return;
        }
        resolve({
          followingIds: response.followingIds || [],
          requestedIds: response.requestedIds || []
        });
      }
    );
  });
};

export default {
  autoAcceptPendingRequests,
  getFollowStatus,
  isFollowing,
  getFollowingIds,
  getFollowingIdsDetailed
};