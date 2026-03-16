import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PROTO_PATH = path.join(__dirname, '../../../../../protos/follow.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const followProto = (grpc.loadPackageDefinition(packageDefinition) as any).follow;

const FOLLOW_GRPC_URL = process.env.FOLLOW_GRPC_URL || 'localhost:50058';

const client = new followProto.FollowService(
  FOLLOW_GRPC_URL,
  grpc.credentials.createInsecure()
);

const promisify = <T>(fn: Function, request: object, metadata?: grpc.Metadata): Promise<T> =>
  new Promise((resolve, reject) => {
    const args: any[] = [request];
    if (metadata) args.push(metadata);
    args.push((error: grpc.ServiceError | null, response: T) => {
      if (error) return reject(error);
      resolve(response);
    });
    fn.call(client, ...args);
  });

export const isFollowing = (followerId: string, followingId: string): Promise<{ isFollowing: boolean }> =>
  promisify(client.IsFollowing, { followerId, followingId });

export const getFollowerIds = (userId: string): Promise<{ followerIds: string[] }> =>
  promisify(client.GetFollowerIds, { userId });

export const getFollowStatus = (
  followerId: string,
  followingId: string
): Promise<{ isFollowing: boolean; isPending: boolean; status: string }> =>
  promisify(client.GetFollowStatus, { followerId, followingId });

export const checkIsFollowedBy = (
  userId: string,
  targetUserId: string
): Promise<{ isFollowedBy: boolean }> =>
  promisify(client.CheckIsFollowedBy, { userId, targetUserId });

export const getRelationship = (
  userId: string,
  targetUserId: string
): Promise<{ follows: boolean; followedBy: boolean; isMutual: boolean }> =>
  promisify(client.GetRelationship, { userId, targetUserId });