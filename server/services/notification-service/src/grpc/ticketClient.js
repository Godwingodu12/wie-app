import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/ticket.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const ticketProto = grpc.loadPackageDefinition(packageDefinition).ticket;
const TICKET_GRPC_URL = process.env.TICKET_GRPC_URL || 'localhost:50052';

let client = null;

const getClient = () => {
  if (!client) {
    client = new ticketProto.TicketService(
      TICKET_GRPC_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export const getCancelledEventInfo = (ticketId, subEventId = '') => {
  return new Promise((resolve) => {
    getClient().GetEventCancellationInfo(
      { ticketId, subEventId },
      (error, response) => {
        if (error) {
          console.warn(`⚠️ [gRPC:Ticket] GetEventCancellationInfo failed:`, error.message);
          resolve(null);
          return;
        }
        if (response.error) {
          console.warn(`⚠️ [gRPC:Ticket] GetEventCancellationInfo error:`, response.error);
          resolve(null);
          return;
        }
        resolve({
          eventId:     response.eventId,
          paymentType: response.paymentType,
          groupId:     response.groupId,
          eventName:   response.eventName,
        });
      }
    );
  });
};

export const getTicketDetails = (ticketId) => {
  return new Promise((resolve) => {
    getClient().GetTicketById(
      { ticketId },
      (error, response) => {
        if (error) {
          console.warn(`⚠️ [gRPC:Ticket] GetTicketById failed:`, error.message);
          resolve(null);
          return;
        }
        if (!response?.ticket) {
          console.warn(`⚠️ [gRPC:Ticket] Ticket not found: ${ticketId}`);
          resolve(null);
          return;
        }
        resolve(response.ticket);
      }
    );
  });
};
