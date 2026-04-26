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

export const cancelEventBookings = (eventId, { cancellationReason, refundPercentage, cancellationTier, isHostCancellation }) => {
  return new Promise((resolve, reject) => {
    const grpcClient = getClient(); 
    grpcClient.CancelEventBookings(
      {
        eventId:            String(eventId),
        cancellationReason: cancellationReason || '',
        refundPercentage:   refundPercentage   ?? 100,
        cancellationTier:   cancellationTier   || 'full_refund',
        isHostCancellation: isHostCancellation ?? true,
      },
      (err, response) => {
        if (err) {
          console.error('❌ [Booking gRPC] cancelEventBookings error:', err.message);
          return reject(err);
        }
        if (!response.success) {
          console.error('❌ [Booking gRPC] cancelEventBookings failed:', response.error);
          return reject(new Error(response.error || 'cancelEventBookings failed'));
        }
        resolve(response);
      }
    );
  });
};

export const getEventFinancialSummary = (ticketId) => {
  return new Promise((resolve) => {
    const grpcClient = getClient();
    grpcClient.GetEventFinancialSummary(
      { ticketId: String(ticketId) },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] getEventFinancialSummary error:', error.message);
          resolve(null);
          return;
        }
        if (!response.success) {
          console.error('❌ [Booking gRPC] getEventFinancialSummary failed:', response.error);
          resolve(null);
          return;
        }
        resolve(response);
      }
    );
  });
};

export const getEventTransactionList = (ticketId, { limit = 50, offset = 0, status = 'all' } = {}) => {
  return new Promise((resolve) => {
    const grpcClient = getClient();
    grpcClient.GetEventTransactionList(
      { ticketId: String(ticketId), limit, offset, status },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] getEventTransactionList error:', error.message);
          resolve({ transactions: [], total: 0 });
          return;
        }
        resolve(response);
      }
    );
  });
};

export const verifyBookingQR = (qrData) => {
  return new Promise((resolve) => {
    const grpcClient = getClient();
    grpcClient.VerifyBookingQR(
      { qrData: String(qrData) },
      (error, response) => {
        if (error) {
          console.error('❌ [Booking gRPC] verifyBookingQR error:', error.message);
          resolve({ success: false, error: error.message });
          return;
        }
        resolve(response);
      }
    );
  });
};
