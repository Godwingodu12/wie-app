import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PROTO_PATH = path.join(__dirname, "../../../../../protos/wieuser.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const wieUserProto = (grpc.loadPackageDefinition(packageDefinition) as any)
  .wieuser;

const WIE_USER_GRPC_URL = process.env.WIE_USER_GRPC_URL || "localhost:50053";

const client = new wieUserProto.WieUserService(
  WIE_USER_GRPC_URL,
  grpc.credentials.createInsecure(),
);

//  Helpers

const promisify = <T>(fn: Function, request: object): Promise<T> =>
  new Promise((resolve, reject) => {
    fn.call(client, request, (error: grpc.ServiceError | null, response: T) => {
      if (error) return reject(error);
      resolve(response);
    });
  });

// Exported Methods

export const getWieUser = (userId: string): Promise<any> =>
  promisify(client.GetWieUser, { userId });

export const getUsersByIds = (userIds: string[]): Promise<any> =>
  promisify(client.GetUsersByIds, { userIds });

export const getAccountPrivacy = async (
  userId: string,
): Promise<{ accountPrivacy: string }> => {
  const raw: any = await promisify(client.GetAccountPrivacy, { userId });
  const value = raw?.accountPrivacy ?? raw?.account_privacy ?? "public";
  return { accountPrivacy: value };
};

export const getUserPrivacySettings = (userId: string): Promise<any> =>
  promisify(client.GetUserPrivacySettings, { userId });

export const checkIfBlocked = (
  userId1: string,
  userId2: string,
): Promise<any> => promisify(client.CheckIfBlocked, { userId1, userId2 });

export const searchUsers = (
  query: string,
  excludeUserId?: string,
  limit?: number,
): Promise<any> =>
  promisify(client.SearchUsers, {
    query,
    excludeUserId: excludeUserId ?? "",
    limit: limit ?? 50,
  });

export const getBlockedUserIds = (userId: string): Promise<any> =>
  promisify(client.GetBlockedUserIds, { userId });
