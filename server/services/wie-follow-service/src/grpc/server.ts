import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import * as followService from '../services/follow.service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/follow.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const followProto = grpc.loadPackageDefinition(packageDefinition).follow as any;

const followUser = async (call: any, callback: any) => {
  try {
    const followerId = call.metadata.get('user-id')[0];
    const { targetUserId } = call.request;

    if (!followerId) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'User not authenticated'
      });
    }

    await followService.followUser(followerId as string, targetUserId);
    callback(null, { success: true, message: 'User followed successfully' });
  } catch (error: any) {
    callback(null, { success: false, error: error.message });
  }
};

const unfollowUser = async (call: any, callback: any) => {
  try {
    const followerId = call.metadata.get('user-id')[0];
    const { targetUserId } = call.request;

    if (!followerId) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'User not authenticated'
      });
    }

    await followService.unfollowUser(followerId as string, targetUserId);
    callback(null, { success: true, message: 'User unfollowed successfully' });
  } catch (error: any) {
    callback(null, { success: false, error: error.message });
  }
};

const getFollowers = async (call: any, callback: any) => {
  try {
    const { userId, page, limit } = call.request;
    const result = await followService.getFollowers(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );
    callback(null, result);
  } catch (error: any) {
    callback(null, { followers: [], total: 0, error: error.message });
  }
};

const getFollowing = async (call: any, callback: any) => {
  try {
    const { userId, page, limit } = call.request;
    const result = await followService.getFollowing(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );
    callback(null, result);
  } catch (error: any) {
    callback(null, { following: [], total: 0, error: error.message });
  }
};

const isFollowing = async (call: any, callback: any) => {
  try {
    const { followerId, followingId } = call.request;
    const result = await followService.isFollowing(followerId, followingId);
    callback(null, { isFollowing: result });
  } catch (error: any) {
    callback(null, { isFollowing: false, error: error.message });
  }
};

const getFollowerIds = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    
    const followers = await followService.getFollowers(userId, 1, 10000);
    const followerIds = followers.followers.map((f: any) => f.id);
    
    callback(null, { followerIds });
  } catch (error: any) {
    callback(null, { followerIds: [] });
  }
};

const getRelationship = async (call: any, callback: any) => {
  try {
    const { userId, targetUserId } = call.request;
    
    const [follows, followedBy] = await Promise.all([
      followService.isFollowing(userId, targetUserId),
      followService.isFollowing(targetUserId, userId)
    ]);
    
    callback(null, {
      follows,
      followedBy,
      isMutual: follows && followedBy
    });
  } catch (error: any) {
    callback(null, { follows: false, followedBy: false, isMutual: false });
  }
};

const checkMutualFollow = async (call: any, callback: any) => {
  try {
    const { userId, targetUserId } = call.request;
    
    const [follows, followedBy] = await Promise.all([
      followService.isFollowing(userId, targetUserId),
      followService.isFollowing(targetUserId, userId)
    ]);
    
    callback(null, { isMutual: follows && followedBy });
  } catch (error: any) {
    callback(null, { isMutual: false });
  }
};

const getFollowStats = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    const result = await followService.getFollowStats(userId);
    callback(null, result);
  } catch (error: any) {
    callback(null, { userId: call.request.userId, followers: 0, following: 0 });
  }
};
const acceptFollowRequest = async (call: any, callback: any) => {
  try {
    const followingId = call.metadata.get('user-id')[0];
    const { followerId } = call.request;

    if (!followingId) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'User not authenticated'
      });
    }

    await followService.acceptFollowRequest(followingId as string, followerId);
    callback(null, { success: true, message: 'Follow request accepted' });
  } catch (error: any) {
    callback(null, { success: false, error: error.message });
  }
};

const rejectFollowRequest = async (call: any, callback: any) => {
  try {
    const followingId = call.metadata.get('user-id')[0];
    const { followerId } = call.request;

    if (!followingId) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'User not authenticated'
      });
    }

    await followService.rejectFollowRequest(followingId as string, followerId);
    callback(null, { success: true, message: 'Follow request rejected' });
  } catch (error: any) {
    callback(null, { success: false, error: error.message });
  }
};

const getFollowRequests = async (call: any, callback: any) => {
  try {
    const userId = call.metadata.get('user-id')[0];
    const { page, limit } = call.request;

    if (!userId) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'User not authenticated'
      });
    }

    const result = await followService.getFollowRequests(
      userId as string,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );
    callback(null, result);
  } catch (error: any) {
    callback(null, { requests: [], total: 0, error: error.message });
  }
};

const cancelFollowRequest = async (call: any, callback: any) => {
  try {
    const followerId = call.metadata.get('user-id')[0];
    const { targetUserId } = call.request;

    if (!followerId) {
      return callback({
        code: grpc.status.UNAUTHENTICATED,
        message: 'User not authenticated'
      });
    }

    await followService.cancelFollowRequest(followerId as string, targetUserId);
    callback(null, { success: true, message: 'Follow request cancelled' });
  } catch (error: any) {
    callback(null, { success: false, error: error.message });
  }
};

const getFollowStatus = async (call: any, callback: any) => {
  try {
    const { followerId, followingId } = call.request;
    const result = await followService.getFollowStatus(followerId, followingId);
    callback(null, result);
  } catch (error: any) {
    callback(null, { isFollowing: false, isPending: false, status: 'none' });
  }
};
export const startGrpcServer = (port: number = 50058) => {
  const server = new grpc.Server();
  
  server.addService(followProto.FollowService.service, {
    FollowUser: followUser,
    UnfollowUser: unfollowUser,
    GetFollowers: getFollowers,
    GetFollowing: getFollowing,
    IsFollowing: isFollowing,
    GetFollowerIds: getFollowerIds,           
    GetRelationship: getRelationship,         
    CheckMutualFollow: checkMutualFollow,
    GetFollowStats: getFollowStats,
    AcceptFollowRequest: acceptFollowRequest,
    RejectFollowRequest: rejectFollowRequest,
    GetFollowRequests: getFollowRequests,
    CancelFollowRequest: cancelFollowRequest,
    GetFollowStatus: getFollowStatus,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('❌ Failed to bind gRPC server:', error);
        return;
      }
      console.log(`✅ Follow gRPC server running on port ${boundPort}`);
    }
  );

  return server;
};
