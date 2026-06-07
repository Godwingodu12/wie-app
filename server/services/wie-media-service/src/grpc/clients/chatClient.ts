import * as grpc       from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path             from 'path';
import dotenv           from 'dotenv';

dotenv.config();

const PROTO_PATH = path.join(__dirname, '../../../../../protos/chat.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs:    String,
  enums:    String,
  defaults: true,
  oneofs:   true,
});

const chatProto = (grpc.loadPackageDefinition(packageDefinition) as any).chat;

const CHAT_GRPC_URL = process.env.CHAT_GRPC_URL || 'localhost:50056';

const client = new chatProto.ChatService(
  CHAT_GRPC_URL,
  grpc.credentials.createInsecure()
);

const promisify = <T>(fn: Function, request: object): Promise<T> =>
  new Promise((resolve, reject) => {
    fn.call(client, request, (error: grpc.ServiceError | null, response: T) => {
      if (error) return reject(error);
      resolve(response);
    });
  });

export const sendSystemMessage = (payload: {
  sender_id:     string;
  receiver_id:   string;
  message_type:  string;
  content:       string;
  metadata_json: string;
}): Promise<{
  success:    boolean;
  message_id: string;
  chat_id:    string;
  error:      string;
}> => promisify(client.SendSystemMessage, payload);

export const getChatByParticipants = (
  userIdOne: string,
  userIdTwo: string
): Promise<{ success: boolean; chat_id: string; error: string }> =>
  promisify(client.GetChatByParticipants, {
    user_id_one: userIdOne,
    user_id_two: userIdTwo,
  });