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

// gRPC method implementations
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
    const result = await followService.getFollowers(userId, page || 1, limit || 20);
    callback(null, result);
  } catch (error: any) {
    callback(null, { followers: [], total: 0, error: error.message });
  }
};

const getFollowing = async (call: any, callback: any) => {
  try {
    const { userId, page, limit } = call.request;
    const result = await followService.getFollowing(userId, page || 1, limit || 20);
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

export const startGrpcServer = (port: number = 50058) => {
  const server = new grpc.Server();

  server.addService(followProto.FollowService.service, {
    FollowUser: followUser,
    UnfollowUser: unfollowUser,
    GetFollowers: getFollowers,
    GetFollowing: getFollowing,
    IsFollowing: isFollowing,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('❌ Failed to bind gRPC server:', error);
        return;
      }
      console.log(`✅ gRPC Follow Service running on port ${boundPort}`);
    }
  );

  return server;
};