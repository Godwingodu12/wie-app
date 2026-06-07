import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/booking.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

const TRANSACTION_GRPC_URL =
  process.env.TRANSACTION_GRPC_URL || 'localhost:50054';

let client = null;

const getClient = () => {
  if (!client) {
    client = new bookingProto.BookingService(
      TRANSACTION_GRPC_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export const getRefundStatus = (bookingId) => {
  return new Promise((resolve, reject) => {
    getClient().GetRefundStatus({ bookingId }, (err, response) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
};
