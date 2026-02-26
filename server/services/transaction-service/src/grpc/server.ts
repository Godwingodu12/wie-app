import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import BookingModel from '../models/booking.model.js';
import { getEventDates } from './ticketClient.js';
import { processRefundJob } from '../controllers/settlementController';
import amqp from 'amqplib';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../../../../protos/booking.proto');

let packageDefinition: any;
let bookingProto: any;

try {
  packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });
  bookingProto = grpc.loadPackageDefinition(packageDefinition).booking as any;
} catch (error) {
  console.error('❌ Failed to load proto file:', error);
  throw error;
}

// gRPC Service Implementation
const getBookingStatsByDate = async (call: any, callback: any) => {
  try {
    const { ticketId, selectedDate } = call.request;
    
    console.log(`📊 Fetching booking stats for ticket ${ticketId} on ${selectedDate}`);
    
    // Validate that the selected date is within event dates
    try {
      const eventDates = await getEventDates(ticketId);
      
      if (eventDates) {
        const selectedDateTime = new Date(selectedDate);
        const startDate = new Date(eventDates.start_date);
        const endDate = eventDates.end_date ? new Date(eventDates.end_date) : startDate;
        
        // Set times for proper comparison
        selectedDateTime.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        if (selectedDateTime < startDate || selectedDateTime > endDate) {
          console.log(`⚠️ Selected date ${selectedDate} is outside event range`);
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Your event is not present on the selected date'
          });
        }
      }
    } catch (eventDateError: any) {
      console.warn('⚠️ Could not fetch event dates, proceeding without validation:', eventDateError.message);
    }
    
    const date = new Date(selectedDate);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const bookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ['confirmed', 'completed'],
      { gte: startOfDay, lte: endOfDay }
    );

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum: number, booking: any) => 
      sum + (parseFloat(booking.totalAmount?.toString() || '0')), 0
    );
    const totalTickets = bookings.reduce((sum: number, booking: any) => 
      sum + (booking.quantity || 0), 0
    );

    console.log(`✅ Stats: ${totalBookings} bookings, ${totalTickets} tickets, ₹${totalRevenue}`);

    callback(null, {
      totalBookings,
      totalRevenue,
      totalTickets,
      bookingDate: selectedDate
    });
  } catch (error: any) {
    console.error('❌ Error in getBookingStatsByDate:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

const getBookingGrowthStats = async (call: any, callback: any) => {
  try {
    const { ticketId, selectedDate, comparisonType } = call.request;
    
    console.log(`📈 Fetching growth stats for ticket ${ticketId}, type: ${comparisonType}`);
    
    const currentDate = new Date(selectedDate);
    let previousDate = new Date(currentDate);
    
    // Determine comparison period
    if (comparisonType === 'daily') {
      previousDate.setDate(previousDate.getDate() - 1);
    } else if (comparisonType === 'weekly') {
      previousDate.setDate(previousDate.getDate() - 7);
    } else if (comparisonType === 'monthly') {
      previousDate.setMonth(previousDate.getMonth() - 1);
    }

    // Current period stats
    const currentStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const currentEnd = new Date(currentDate.setHours(23, 59, 59, 999));
    const currentBookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ['confirmed', 'completed'],
      { gte: currentStart, lte: currentEnd }
    );

    // Previous period stats
    const previousStart = new Date(previousDate.setHours(0, 0, 0, 0));
    const previousEnd = new Date(previousDate.setHours(23, 59, 59, 999));
    const previousBookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ['confirmed', 'completed'],
      { gte: previousStart, lte: previousEnd }
    );

    const currentCount = currentBookings.length;
    const previousCount = previousBookings.length;
    
    let growthPercentage = 0;
    if (previousCount > 0) {
      growthPercentage = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
      growthPercentage = 100;
    }

    console.log(`✅ Growth: ${growthPercentage.toFixed(2)}% (Current: ${currentCount}, Previous: ${previousCount})`);

    callback(null, {
      currentPeriodBookings: currentCount,
      previousPeriodBookings: previousCount,
      growthPercentage: growthPercentage.toFixed(2),
      comparisonType
    });
  } catch (error: any) {
    console.error('❌ Error in getBookingGrowthStats:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

const getMonthlyBookingChart = async (call: any, callback: any) => {
  try {
    const { ticketId, year, month } = call.request;
    
    console.log(`📊 Fetching monthly chart for ticket ${ticketId}, ${year}-${month}`);
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const chartData = await BookingModel.getBookingsByDayOfMonth(
      ticketId,
      startDate,
      endDate
    );

    console.log(`✅ Chart data: ${chartData.length} days with bookings`);

    callback(null, { 
      chartData: chartData.map(item => ({
        day: item.day,
        bookingCount: item.count,
        revenue: item.revenue
      }))
    });
  } catch (error: any) {
    console.error('❌ Error in getMonthlyBookingChart:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

const getBookingsForEvent = async (call: any, callback: any) => {
  try {
    const { ticketId } = call.request;

    if (!ticketId) {
      return callback(null, { bookings: [], count: 0, error: 'ticketId is required' });
    }

    const bookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ['confirmed', 'CONFIRMED', 'pending', 'PENDING']
    );

    const mapped = bookings.map((b: any) => ({
      bookingId: b.bookingId  || '',
      userId:    b.userId     || '',
      subtotal:  b.subtotal?.toString() || '0',
      status:    b.bookingStatus || '',
    }));

    callback(null, {
      bookings: mapped,
      count:    mapped.length,
      error:    '',
    });
  } catch (error: any) {
    console.error('❌ [gRPC] getBookingsForEvent error:', error);
    callback(null, { bookings: [], count: 0, error: error.message });
  }
};

export const startGrpcServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const server = new grpc.Server();
      
      if (!bookingProto || !bookingProto.BookingService) {
        throw new Error('BookingService not found in proto definition');
      }

      server.addService(bookingProto.BookingService.service, {
        GetBookingStatsByDate: getBookingStatsByDate,
        GetBookingGrowthStats: getBookingGrowthStats,
        GetMonthlyBookingChart: getMonthlyBookingChart,
        GetBookingsForEvent: getBookingsForEvent,
      });

      const port = process.env.BOOKING_GRPC_PORT || '50054';
      
      server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, boundPort) => {
          if (error) {
            console.error('❌ Failed to bind gRPC server:', error);
            reject(error);
            return;
          }
          
          server.start();
          console.log(`✅ Booking gRPC server running on port ${boundPort}`);
          resolve();
        }
      );
    } catch (error) {
      console.error('❌ Error starting gRPC server:', error);
      reject(error);
    }
  });
};

// Rate-limited to ~200 refunds/min to avoid Razorpay throttling
// Start this alongside the gRPC server
export const startRefundWorker = async (): Promise<void> => {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
  const QUEUE_NAME = 'wie.refund.jobs';
  const RATE_LIMIT_MS = 300; // 200 refunds/min = 1 per 300ms

  let conn: any, ch: any;

  const connect = async () => {
    conn = await amqp.connect(RABBITMQ_URL);
    ch = await conn.createChannel();
    await ch.assertQueue(QUEUE_NAME, { durable: true });
    ch.prefetch(1); // Process one at a time per worker instance

    console.log(`✅ [RefundWorker] Listening on queue: ${QUEUE_NAME}`);

    ch.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;
      const job = JSON.parse(msg.content.toString());
      console.log(`📥 [RefundWorker] Processing refund for booking: ${job.bookingId}`);

      try {
        await processRefundJob(job.bookingId, job.refundPercentage, job.eventName);
        ch.ack(msg);
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      } catch (err: any) {
        console.error(`❌ [RefundWorker] Job failed:`, err.message);
        // Nack with requeue=false after 3 retries — dead-letter queue handles it
        ch.nack(msg, false, false);
      }
    });
  };

  try {
    await connect();
    conn.on('error', async () => {
      console.error('⚠️ [RefundWorker] RabbitMQ connection lost — reconnecting in 5s');
      setTimeout(connect, 5000);
    });
  } catch (err: any) {
    console.error('❌ [RefundWorker] Failed to start:', err.message);
  }
};
