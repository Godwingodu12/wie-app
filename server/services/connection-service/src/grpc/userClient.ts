import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(
  __dirname,
  '../../../../protos/wieuser.proto'
);
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const wieUserProto = grpc.loadPackageDefinition(packageDefinition).wieuser as any;

const WIE_USER_SERVICE_URL = process.env.WIE_USER_GRPC_URL || 'localhost:50053';

let client: any = null;

const getClient = () => {
  if (!client) {
    client = new wieUserProto.WieUserService(
      WIE_USER_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export interface User {
  id: string;
  name: string;
  email: string;
  contactNo?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}
export const getUserById = async (userId: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.GetWieUser({ userId }, (error: any, response: any) => {
      if (error) {
        reject(new Error(`Failed to fetch user: ${error.message}`));
      } else if (response.error) {
        reject(new Error(response.error));
      } else if (!response.user) {
        reject(new Error('User not found'));
      } else {
        resolve(response.user);
      }
    });
  });
};