import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import ConnectionProfile from '../models/ConnectionProfile';
import { EstablishedConnection } from '../models/EstablishedConnection';
import matchingAlgorithm from '../utils/matching-algorithm';
import mongoose from 'mongoose';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to proto file
const PROTO_PATH = path.join(
  __dirname,
  '../../../../protos/connection.proto'
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const connectionProto = grpc.loadPackageDefinition(packageDefinition).connection as any;

// gRPC Service Implementations
const getConnectionProfile = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;

    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });

    if (!profile) {
      callback(null, {
        error: true,
        errorMessage: 'Connection profile not found',
      });
      return;
    }

    const primaryPhoto = profile.photos.find((p) => p.isPrimary);
    
    callback(null, {
      profileId: profile._id.toString(),
      displayName: profile.displayName,
      age: profile.age,
      gender: profile.gender,
      location: {
        city: profile.location.city,
        state: profile.location.state,
        country: profile.location.country,
        latitude: profile.location.coordinates.coordinates[1],
        longitude: profile.location.coordinates.coordinates[0],
      },
      photos: profile.photos.map((p) => p.url),
      primaryPhotoUrl: primaryPhoto?.url || '', // ADD THIS LINE - Use the primaryPhoto
      status: profile.status,
      profileCompleteness: profile.profileCompleteness,
      error: false,
      errorMessage: '',
    });
  } catch (error: any) {
    callback(null, {
      error: true,
      errorMessage: error.message,
    });
  }
};

const getMatchSuggestions = async (call: any, callback: any) => {
  try {
    const { userId, purposeCode, limit } = call.request;

    const matches = await matchingAlgorithm.findMatches(userId, purposeCode, {}, limit || 50);

    const suggestions = matches.map((match: any) => ({
      userId: match.userId.toString(),
      profileId: match._id.toString(),
      displayName: match.displayName,
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
      distance: 0, // Calculate if needed
    }));

    callback(null, { suggestions });
  } catch (error: any) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const checkConnectionStatus = async (call: any, callback: any) => {
  try {
    const { userId1, userId2 } = call.request;

    const connection = await EstablishedConnection.findOne({
      $or: [
        { user1Id: userId1, user2Id: userId2 },
        { user1Id: userId2, user2Id: userId1 },
      ],
    });

    if (!connection) {
      callback(null, {
        isConnected: false,
        connectionId: '',
        status: 'none',
      });
      return;
    }

    callback(null, {
      isConnected: true,
      connectionId: connection._id.toString(),
      status: connection.status,
    });
  } catch (error: any) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getUserConnections = async (call: any, callback: any) => {
  try {
    const { userId, status, page = 1, limit = 20 } = call.request;

    const query: any = {
      userIds: new mongoose.Types.ObjectId(userId),
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const connections = await EstablishedConnection.find(query)
      .sort({ lastInteractionAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('connectionProfileIds');

    const total = await EstablishedConnection.countDocuments(query);

    const formattedConnections = connections.map((conn: any) => {
      const otherUserId = conn.user1Id.toString() === userId ? conn.user2Id : conn.user1Id;
      const otherProfile = conn.connectionProfileIds.find(
        (p: any) => p.userId.toString() === otherUserId.toString()
      );

      return {
        connectionId: conn._id.toString(),
        userId: otherUserId.toString(),
        displayName: otherProfile?.displayName || 'Unknown',
        status: conn.status,
        establishedAt: conn.establishedAt.toISOString(),
        messageCount: conn.messageCount,
      };
    });

    callback(null, {
      connections: formattedConnections,
      total,
    });
  } catch (error: any) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const updateConnectionStatus = async (call: any, callback: any) => {
  try {
    const { connectionId, status } = call.request;

    await EstablishedConnection.updateOne({ _id: connectionId }, { $set: { status } });

    callback(null, { success: true });
  } catch (error: any) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

// Start gRPC server
export const startGRPCServer = (port: number): void => {
  const server = new grpc.Server();

  server.addService(connectionProto.ConnectionService.service, {
    GetConnectionProfile: getConnectionProfile,
    GetMatchSuggestions: getMatchSuggestions,
    CheckConnectionStatus: checkConnectionStatus,
    GetUserConnections: getUserConnections,
    UpdateConnectionStatus: updateConnectionStatus,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('Failed to bind gRPC server:', error);
        return;
      }
      console.log(`🚀 Connection Service gRPC running on port ${boundPort}`);
    }
  );
};