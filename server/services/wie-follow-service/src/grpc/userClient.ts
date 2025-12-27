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
  oneofs: true
});

const wieUserProto = grpc.loadPackageDefinition(packageDefinition).wieuser as any;

const USER_SERVICE_URL = process.env.USER_GRPC_URL || 'localhost:50053';

let client: any = null;

const getClient = () => {
  if (!client) {
    client = new wieUserProto.WieUserService(
      USER_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export const incrementFollowing = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.IncrementFollowing({ userId }, (error: any, response: any) => {
      if (error) {
        console.error('❌ Failed to increment following:', error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const decrementFollowing = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.DecrementFollowing({ userId }, (error: any, response: any) => {
      if (error) {
        console.error('❌ Failed to decrement following:', error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const incrementFollowers = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.IncrementFollowers({ userId }, (error: any, response: any) => {
      if (error) {
        console.error('❌ Failed to increment followers:', error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

export const decrementFollowers = async (userId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.DecrementFollowers({ userId }, (error: any, response: any) => {
      if (error) {
        console.error('❌ Failed to decrement followers:', error.message);
        reject(error);
      } else {
        resolve();
      }
    });
  });
};