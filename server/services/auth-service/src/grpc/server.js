import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserData, getUser, getFollowersData } from '../services/auth.service.js';
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
const mapUserToProto = (user) => {
  if (!user || user.error) {
    return { error: user?.error || 'User not found' };
  }
  return {
    id: user._id?.toString() || user.id?.toString() || '',
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    contact_no: user.contact_no || '',
    country_code: user.country_code || '+91',
    country_iso2: user.country_iso2 || 'in',
    organisation_type: user.organisation_type || '',
    status: user.status || 'unverified',
    address: user.address || '',
    image: user.image || '',
    role: user.role || 'admin',
    followers: user.followers?.toString() || '0',
    following: user.following?.toString() || '0',
    social_links: {
      facebook: user.social_links?.facebook || '',
      x: user.social_links?.x || '',
      linkedin: user.social_links?.linkedin || '',
      instagram: user.social_links?.instagram || '',
      google: user.social_links?.google || '',
      whatsapp: user.social_links?.whatsapp || ''
    },
    social_profiles: {
      google: user.social_profiles?.google ? {
        profileId: user.social_profiles.google.profileId || '',
        displayName: user.social_profiles.google.displayName || '',
        email: user.social_profiles.google.email || '',
        photo: user.social_profiles.google.photo || '',
        username: '',
        linkedAt: user.social_profiles.google.linkedAt?.toISOString() || ''
      } : {},
      facebook: user.social_profiles?.facebook ? {
        profileId: user.social_profiles.facebook.profileId || '',
        displayName: user.social_profiles.facebook.displayName || '',
        email: user.social_profiles.facebook.email || '',
        photo: user.social_profiles.facebook.photo || '',
        username: '',
        linkedAt: user.social_profiles.facebook.linkedAt?.toISOString() || ''
      } : {},
      x: user.social_profiles?.x ? {
        profileId: user.social_profiles.x.profileId || '',
        displayName: user.social_profiles.x.displayName || '',
        email: '',
        photo: user.social_profiles.x.photo || '',
        username: user.social_profiles.x.username || '',
        linkedAt: user.social_profiles.x.linkedAt?.toISOString() || ''
      } : {},
      instagram: user.social_profiles?.instagram ? {
        profileId: user.social_profiles.instagram.profileId || '',
        displayName: user.social_profiles.instagram.displayName || '',
        email: '',
        photo: user.social_profiles.instagram.photo || '',
        username: user.social_profiles.instagram.username || '',
        linkedAt: user.social_profiles.instagram.linkedAt?.toISOString() || ''
      } : {},
      linkedin: user.social_profiles?.linkedin ? {
        profileId: user.social_profiles.linkedin.profileId || '',
        displayName: user.social_profiles.linkedin.displayName || '',
        email: user.social_profiles.linkedin.email || '',
        photo: user.social_profiles.linkedin.photo || '',
        username: '',
        linkedAt: user.social_profiles.linkedin.linkedAt?.toISOString() || ''
      } : {}
    },
    website: user.website || '',
    bio: user.bio || '',
    gender: user.gender || 'other',
    lastLogout: user.lastLogout?.toISOString() || '',
    isBlocked: user.isBlocked || false,
    created_at: user.created_at?.toISOString() || user.createdAt?.toISOString() || '',
    updated_at: user.updated_at?.toISOString() || user.updatedAt?.toISOString() || '',
    error: ''
  };
};

const getUser_handler = async (call, callback) => {
  try {
    const result = await getUser(call.request);
    callback(null, mapUserToProto(result));
  } catch (error) {
    callback(null, { error: error.message });
  }
};

const getUserData_handler = async (call, callback) => {
  try {
    const userData = await getUserData({ userId: call.request.userId });
    callback(null, mapUserToProto(userData));
  } catch (error) {
    callback(null, { error: error.message });
  }
};
const getFollowersData_handler = async (call, callback) => {
  try {
    const followersData = await getFollowersData(call.request);
    callback(null, {
      followerIds: followersData.followerIds || [],
      count: followersData.count || 0,
      error: ''
    });
  } catch (error) {
    callback(null, { followerIds: [], count: 0, error: error.message });
  }
};
const clearUserCache_handler = async (call, callback) => {
  try {
    callback(null, {
      success: true,
      message: 'Cache clear request acknowledged'
    });
  } catch (error) {
    callback(null, { success: false, message: error.message });
  }
};
export const startGrpcServer = (port = 50051) => {
  const server = new grpc.Server();
  
  server.addService(authProto.AuthService.service, {
    GetUser: getUser_handler,
    GetUserData: getUserData_handler,
    GetFollowersData: getFollowersData_handler,
    ClearUserCache: clearUserCache_handler
  });
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        return;
      }
    }
  );
  return server;
};