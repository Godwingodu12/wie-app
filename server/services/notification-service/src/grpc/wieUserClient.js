import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/wieuser.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const wieUserProto = grpc.loadPackageDefinition(packageDefinition).wieuser;
const WIE_USER_SERVICE_URL = process.env.WIE_USER_GRPC_URL || 'localhost:50053';

let client = null;
const getClient = () => {
  if (!client) {
    client = new wieUserProto.WieUserService(
      WIE_USER_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

// Fetch single user by ID
export const getWieUserById = (userId) => {
  return new Promise((resolve) => {
    getClient().GetWieUser({ userId }, (error, response) => {
      if (error || !response?.user) {
        console.warn(`⚠️ [gRPC] Could not fetch user ${userId}:`, error?.message);
        resolve(null); // Graceful — don't block notification flow
      } else {
        resolve(response.user);
      }
    });
  });
};

// Fetch multiple users by IDs in one gRPC call
export const getWieUsersByIds = (userIds) => {
  return new Promise((resolve) => {
    if (!userIds || userIds.length === 0) return resolve([]);

    getClient().GetUsersByIds({ userIds }, (error, response) => {
      if (error || !response?.users) {
        console.warn('⚠️ [gRPC] Could not fetch users by IDs:', error?.message);
        resolve([]);
      } else {
        resolve(response.users);
      }
    });
  });
};
