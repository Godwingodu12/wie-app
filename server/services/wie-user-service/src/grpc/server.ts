import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import WieUserModel from '../models/wieuser.model.js';
const PROTO_PATH = path.join(
  __dirname,
  '../../../../protos/wieuser.proto'
);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const wieUserProto = grpc.loadPackageDefinition(packageDefinition)
  .wieuser as any;
const getWieUser = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback(null, { user: null, error: 'User ID is required' });
    }
    const user = await WieUserModel.findById(userId);
    if (!user) {
      return callback(null, { user: null, error: 'User not found' });
    }
    callback(null, {
      user: {
        id: user.id,
        email: user.email || '',
        contact_no: user.contact_no || '',
        name: user.name || '',
        username: user.username || '',
        profile_picture: user.profile_picture || '',
        country_id: user.country_id || '',
        role: user.role || 'user',
        status: user.status || 'pending',
        bio: user.bio || '',
        location: user.location || '',
        latitude: user.latitude || 0,
        longitude: user.longitude || 0,
        isOnline: user.isOnline || false,
        is_blocked: user.is_blocked || false,
        is_verified: user.is_verified || false,
        google_id: user.google_id || '',
        auth_provider: user.auth_provider || 'local',
        created_at: user.created_at?.toISOString() || '',
        updated_at: user.updated_at?.toISOString() || '',
      },
      error: '',
    });
  } catch (error: any) {
    callback(null, { user: null, error: error.message });
  }
};
const incrementFollowing = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback(null, { success: false });
    }
    await WieUserModel.incrementFollowing(userId);
    callback(null, { success: true });
  } catch (error: any) {
    console.error('Increment following error:', error);
    callback(null, { success: false });
  }
};

const decrementFollowing = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback(null, { success: false });
    }
    await WieUserModel.decrementFollowing(userId);
    callback(null, { success: true });
  } catch (error: any) {
    console.error('Decrement following error:', error);
    callback(null, { success: false });
  }
};

const incrementFollowers = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback(null, { success: false });
    }
    await WieUserModel.incrementFollowers(userId);
    callback(null, { success: true });
  } catch (error: any) {
    console.error('Increment followers error:', error);
    callback(null, { success: false });
  }
};

const decrementFollowers = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback(null, { success: false });
    }
    await WieUserModel.decrementFollowers(userId);
    callback(null, { success: true });
  } catch (error: any) {
    console.error('Decrement followers error:', error);
    callback(null, { success: false });
  }
};

// Update the server.addService call
export const startGrpcServer = (port: number = 50053) => {
  const server = new grpc.Server();

  server.addService(wieUserProto.WieUserService.service, {
    GetWieUser: getWieUser,
    IncrementFollowing: incrementFollowing,
    DecrementFollowing: decrementFollowing,
    IncrementFollowers: incrementFollowers,
    DecrementFollowers: decrementFollowers,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('Failed to bind gRPC server:', error);
        return;
      }
      console.log(`✅ gRPC User Service running on port ${boundPort}`);
    }
  );
  return server;
};
