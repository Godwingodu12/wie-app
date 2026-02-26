import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
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
  oneofs: true
});

const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

const BOOKING_SERVICE_URL = process.env.BOOKING_GRPC_URL || 'localhost:50054';

let client = null;

const getClient = () => {
  if (!client) {
    client = new bookingProto.BookingService(
      BOOKING_SERVICE_URL,
      grpc.credentials.createInsecure()
    );
  }
  return client;
};

export const getBookingStatsByDate = async (ticketId, selectedDate) => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.GetBookingStatsByDate(
      { ticketId, selectedDate },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] Error:', error.message);
          resolve({ totalBookings: 0, totalRevenue: 0, totalTickets: 0 });
        } else {
          resolve(response);
        }
      }
    );
  });
};

export const getBookingGrowthStats = async (ticketId, selectedDate, comparisonType) => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.GetBookingGrowthStats(
      { ticketId, selectedDate, comparisonType },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] Error:', error.message);
          resolve({ growthPercentage: '0', currentPeriodBookings: 0, previousPeriodBookings: 0 });
        } else {
          resolve(response);
        }
      }
    );
  });
};

export const getMonthlyBookingChart = async (ticketId, year, month) => {
  return new Promise((resolve, reject) => {
    const client = getClient();
    
    client.GetMonthlyBookingChart(
      { ticketId, year, month },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] Error:', error.message);
          resolve({ chartData: [] });
        } else {
          resolve(response);
        }
      }
    );
  });
};
export const getBookingsForEvent = async (ticketId) => {
  return new Promise((resolve) => {
    const grpcClient = getClient();

    grpcClient.GetBookingsForEvent(
      { ticketId },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] getBookingsForEvent error:', error.message);
          resolve([]); // Graceful fallback
          return;
        }
        if (response.error) {
          console.error('❌ [Booking gRPC] getBookingsForEvent response error:', response.error);
          resolve([]);
          return;
        }
        resolve(response.bookings || []);
      }
    );
  });
};
