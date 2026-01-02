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

const formatUser = (user: any) => {
  // Handle last_seen_at conversion - check both camelCase and snake_case
  let lastSeenAt = '';
  if (user.lastSeenAt) {
    lastSeenAt = user.lastSeenAt instanceof Date ? user.lastSeenAt.toISOString() : user.lastSeenAt;
  } else if (user.last_seen_at) {
    lastSeenAt = user.last_seen_at instanceof Date ? user.last_seen_at.toISOString() : user.last_seen_at;
  }

  // Handle created_at conversion
  let createdAt = '';
  if (user.createdAt) {
    createdAt = user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt;
  } else if (user.created_at) {
    createdAt = user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at;
  }

  // Handle updated_at conversion
  let updatedAt = '';
  if (user.updatedAt) {
    updatedAt = user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt;
  } else if (user.updated_at) {
    updatedAt = user.updated_at instanceof Date ? user.updated_at.toISOString() : user.updated_at;
  }

  return {
    id: user.id,
    email: user.email || '',
    contact_no: user.contactNo || user.contact_no || '',
    name: user.name || '',
    username: user.username || '',
    profile_picture: user.profilePicture || user.profile_picture || '',
    country_id: user.countryId || user.country_id || '',
    role: user.role || 'user',
    status: user.status || 'pending',
    bio: user.bio || '',
    location: user.location || '',
    latitude: user.latitude || 0,
    longitude: user.longitude || 0,
    isOnline: user.isOnline ?? false,
    is_blocked: user.isBlocked ?? user.is_blocked ?? false,
    is_verified: user.isVerified ?? user.is_verified ?? false,
    google_id: user.googleId || user.google_id || '',
    auth_provider: user.authProvider || user.auth_provider || 'local',
    created_at: createdAt,
    updated_at: updatedAt,
    last_seen_at: lastSeenAt,
  };
};

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
    const formattedUser = formatUser(user);
    callback(null, {
      user: formattedUser,
      error: '',
    });
  } catch (error: any) {
    console.error('❌ Error in getWieUser:', error);
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
    callback(null, { success: false });
  }
};

const getUsersByIds = async (call: any, callback: any) => {
  try {
    const { userIds } = call.request;
    
    if (!userIds || userIds.length === 0) {
      return callback(null, { users: [] });
    }
    const users = await WieUserModel.findByIds(userIds);
    const formattedUsers = users.map(formatUser);

    callback(null, { users: formattedUsers });
  } catch (error: any) {
    callback(null, { users: [] });
  }
};

const getUserPrivacySettings = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    
    if (!userId) {
      return callback(null, { 
        allow_messages_from: 'followers', 
        allow_message_requests: true 
      });
    }

    const user = await WieUserModel.findById(userId);
    
    if (!user) {
      return callback(null, { 
        allow_messages_from: 'followers', 
        allow_message_requests: true 
      });
    }

    callback(null, {
      allow_messages_from: user.allowMessagesFrom || 'followers',
      allow_message_requests: user.allowMessageRequests !== false
    });
  } catch (error: any) {
    callback(null, { 
      allow_messages_from: 'followers', 
      allow_message_requests: true 
    });
  }
};

const searchUsers = async (call: any, callback: any) => {
  try {
    const { query, excludeUserId, limit } = call.request;
    
    if (!query || query.trim().length === 0) {
      return callback(null, { users: [] });
    }

    const searchTerm = query.trim();
    const searchLimit = limit || 50;

    const filter: any = {
      status: 'active',
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (excludeUserId) {
      filter.id = { $ne: excludeUserId };
    }

    const users = await WieUserModel.search(filter, searchLimit);
    const formattedUsers = users.map(formatUser);
    
    callback(null, { users: formattedUsers });
  } catch (error: any) {
    callback(null, { users: [] });
  }
};

const updateOnlineStatus = async (call: any, callback: any) => {
  try {
    const { userId, isOnline } = call.request;
    if (!userId) {
      return callback(null, { success: false });
    }
    await WieUserModel.updateOnlineStatus(userId, isOnline);
    callback(null, { success: true });
  } catch (error: any) {
    console.error('❌ Error updating online status:', error);
    callback(null, { success: false });
  }
};

const getOnlineStatus = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;
    if (!userId) {
      return callback(null, { isOnline: false, lastSeenAt: '' });
    }
    const status = await WieUserModel.getOnlineStatus(userId);
    if (!status) {
      return callback(null, { isOnline: false, lastSeenAt: '' });
    }
    const lastSeenAt = status.lastSeenAt ? status.lastSeenAt.toISOString() : '';
    callback(null, {
      isOnline: status.isOnline,
      lastSeenAt: lastSeenAt,
    });
  } catch (error: any) {
    console.error('❌ Error getting online status:', error);
    callback(null, { isOnline: false, lastSeenAt: '' });
  }
};
export const startGrpcServer = (port: number = 50053) => {
  const server = new grpc.Server();

  server.addService(wieUserProto.WieUserService.service, {
    GetWieUser: getWieUser,
    IncrementFollowing: incrementFollowing,
    DecrementFollowing: decrementFollowing,
    IncrementFollowers: incrementFollowers,
    DecrementFollowers: decrementFollowers,
    GetUsersByIds: getUsersByIds,
    GetUserPrivacySettings: getUserPrivacySettings,
    SearchUsers: searchUsers,
    UpdateOnlineStatus: updateOnlineStatus,
    GetOnlineStatus: getOnlineStatus,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('❌ Failed to bind gRPC server:', error);
        return;
      }
    }
  );
  return server;
};
