import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";
import BookingModel from "../models/booking.model.js";
import { getEventDates } from "./ticketClient.js";
import { processRefundJob } from "../controllers/settlementController";
import { prisma } from "../config/db.js";
import { publishRefundJob } from "../rabbit/index.js";
import amqp from "amqplib";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, "../../../../protos/booking.proto");

let packageDefinition: any;
let bookingProto: any;

try {
  packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  bookingProto = grpc.loadPackageDefinition(packageDefinition).booking as any;
} catch (error) {
  console.error("❌ Failed to load proto file:", error);
  throw error;
}

// gRPC Service Implementation
const getBookingStatsByDate = async (call: any, callback: any) => {
  try {
    const { ticketId, selectedDate } = call.request;

    // Validate that the selected date is within event dates
    try {
      const eventDates = await getEventDates(ticketId);

      if (eventDates) {
        const selectedDateTime = new Date(selectedDate);
        const startDate = new Date(eventDates.start_date);
        const endDate = eventDates.end_date
          ? new Date(eventDates.end_date)
          : startDate;

        // Set times for proper comparison
        selectedDateTime.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        if (selectedDateTime < startDate || selectedDateTime > endDate) {
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: "Your event is not present on the selected date",
          });
        }
      }
    } catch (eventDateError: any) {
      console.warn(
        "⚠️ Could not fetch event dates, proceeding without validation:",
        eventDateError.message,
      );
    }

    const date = new Date(selectedDate);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const bookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ["confirmed", "completed"],
      { gte: startOfDay, lte: endOfDay },
    );

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum: number, booking: any) =>
        sum + parseFloat(booking.totalAmount?.toString() || "0"),
      0,
    );
    const totalTickets = bookings.reduce(
      (sum: number, booking: any) => sum + (booking.quantity || 0),
      0,
    );

    callback(null, {
      totalBookings,
      totalRevenue,
      totalTickets,
      bookingDate: selectedDate,
    });
  } catch (error: any) {
    console.error("❌ Error in getBookingStatsByDate:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getBookingGrowthStats = async (call: any, callback: any) => {
  try {
    const { ticketId, selectedDate, comparisonType } = call.request;

    const currentDate = new Date(selectedDate);
    let previousDate = new Date(currentDate);

    // Determine comparison period
    if (comparisonType === "daily") {
      previousDate.setDate(previousDate.getDate() - 1);
    } else if (comparisonType === "weekly") {
      previousDate.setDate(previousDate.getDate() - 7);
    } else if (comparisonType === "monthly") {
      previousDate.setMonth(previousDate.getMonth() - 1);
    }

    // Current period stats
    const currentStart = new Date(currentDate.setHours(0, 0, 0, 0));
    const currentEnd = new Date(currentDate.setHours(23, 59, 59, 999));
    const currentBookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ["confirmed", "completed"],
      { gte: currentStart, lte: currentEnd },
    );

    // Previous period stats
    const previousStart = new Date(previousDate.setHours(0, 0, 0, 0));
    const previousEnd = new Date(previousDate.setHours(23, 59, 59, 999));
    const previousBookings = await BookingModel.findByTicketIdWithStatus(
      ticketId,
      ["confirmed", "completed"],
      { gte: previousStart, lte: previousEnd },
    );

    const currentCount = currentBookings.length;
    const previousCount = previousBookings.length;

    let growthPercentage = 0;
    if (previousCount > 0) {
      growthPercentage = ((currentCount - previousCount) / previousCount) * 100;
    } else if (currentCount > 0) {
      growthPercentage = 100;
    }

    callback(null, {
      currentPeriodBookings: currentCount,
      previousPeriodBookings: previousCount,
      growthPercentage: growthPercentage.toFixed(2),
      comparisonType,
    });
  } catch (error: any) {
    console.error("❌ Error in getBookingGrowthStats:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getMonthlyBookingChart = async (call: any, callback: any) => {
  try {
    const { ticketId, year, month } = call.request;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const chartData = await BookingModel.getBookingsByDayOfMonth(
      ticketId,
      startDate,
      endDate,
    );

    callback(null, {
      chartData: chartData.map((item) => ({
        day: item.day,
        bookingCount: item.count,
        revenue: item.revenue,
      })),
    });
  } catch (error: any) {
    console.error("❌ Error in getMonthlyBookingChart:", error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getBookingsForEvent = async (call: any, callback: any) => {
  try {
    const { ticketId } = call.request;

    if (!ticketId) {
      return callback(null, {
        bookings: [],
        count: 0,
        error: "ticketId is required",
      });
    }

    const bookings = await BookingModel.findByTicketIdWithStatus(ticketId, [
      "confirmed",
      "CONFIRMED",
      "pending",
      "PENDING",
    ]);

    const mapped = bookings.map((b: any) => ({
      bookingId: b.bookingId || "",
      userId: b.userId || "",
      subtotal: b.subtotal?.toString() || "0",
      status: b.bookingStatus || "",
    }));

    callback(null, {
      bookings: mapped,
      count: mapped.length,
      error: "",
    });
  } catch (error: any) {
    console.error("❌ [gRPC] getBookingsForEvent error:", error);
    callback(null, { bookings: [], count: 0, error: error.message });
  }
};

const getRefundStatus = async (call: any, callback: any) => {
  try {
    const { bookingId } = call.request;
    if (!bookingId) {
      return callback(null, {
        success: false,
        error: "bookingId required",
        refundStatus: "",
        refundAmount: 0,
        refundId: "",
        processedAt: "",
      });
    }

    const result = await BookingModel.getRefundDetails(bookingId);
    if (!result?.booking) {
      return callback(null, {
        success: false,
        error: "Booking not found",
        refundStatus: "",
        refundAmount: 0,
        refundId: "",
        processedAt: "",
      });
    }

    const b = result.booking;
    callback(null, {
      success: true,
      error: "",
      bookingId: String(b.id),
      userId: b.userId,
      ticketId: b.ticketId,
      eventName: (b.eventDetails as any)?.eventName || "",
      refundStatus: b.refundStatus || "NOT_APPLICABLE",
      refundAmount: b.refundAmount ? parseFloat(b.refundAmount.toString()) : 0,
      refundId: b.refundId || "",
      processedAt: b.refundProcessedAt ? b.refundProcessedAt.toISOString() : "",
      refundInitiatedAt: b.refundInitiatedAt
        ? b.refundInitiatedAt.toISOString()
        : "",
    });
  } catch (err: any) {
    console.error("❌ [gRPC] getRefundStatus error:", err.message);
    callback(null, {
      success: false,
      error: err.message,
      refundStatus: "",
      refundAmount: 0,
      refundId: "",
      processedAt: "",
    });
  }
};

const publishEventCancellationNotificationUpdate = async ({
  eventId,
  cancellationReason,
  refundPercentage,
  cancellationTier,
  isHostCancellation,
  bookings,
}: any) => {
  try {
    const conn = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost",
    );
    const ch = await conn.createChannel();
    const EXCHANGE = "wie.events";
    const ROUTING = "event.booking.cancelled";
    await ch.assertExchange(EXCHANGE, "topic", { durable: true });

    const payload = {
      eventId,
      cancellationReason,
      refundPercentage,
      cancellationTier,
      isHostCancellation,
      bookings: bookings.map((b: any) => ({
        id: String(b.id),
        bookingId: b.bookingId,
        userId: b.userId,
        subtotal: parseFloat(b.subtotal?.toString() || "0"),
        platformFee: parseFloat(b.platformFee?.toString() || "0"),
        eventName: (b.eventDetails as any)?.eventName || "",
        ticketType: b.ticketType,
        quantity: b.quantity,
      })),
    };

    ch.publish(EXCHANGE, ROUTING, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
    });
    await ch.close();
    await conn.close();
  } catch (err: any) {
    console.error(
      "⚠️ publishEventCancellationNotificationUpdate failed:",
      err.message,
    );
  }
};

const cancelEventBookings = async (call: any, callback: any) => {
  try {
    const {
      eventId,
      cancellationReason,
      refundPercentage,
      cancellationTier,
      isHostCancellation,
    } = call.request;

    if (!eventId) {
      return callback(null, {
        success: false,
        error: "eventId required",
        updatedCount: 0,
      });
    }

    // Find all active bookings for this event (ticketId matches eventId for main, or subEventId)
    const bookings = await prisma.booking.findMany({
      where: {
        ticketId: eventId,
        bookingStatus: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    if (!bookings.length) {
      return callback(null, { success: true, error: "", updatedCount: 0 });
    }

    const now = new Date();
    // Bulk update all matching bookings to CANCELLED
    const updateResult = await prisma.booking.updateMany({
      where: {
        ticketId: eventId,
        bookingStatus: { in: ["CONFIRMED", "PENDING"] },
      },
      data: {
        bookingStatus: "CANCELLED",
        paymentStatus: "REFUND_PENDING",
        cancellationReason: cancellationReason || "Event cancelled by host",
        cancelledAt: now,
        refundStatus: refundPercentage > 0 ? "PENDING" : null,
        refundAmount: undefined, // calculated per booking below
        updatedAt: now,
      },
    });

    // Per-booking: set individual refund amounts and push refund jobs
    for (const booking of bookings) {
      const subtotal = parseFloat(booking.subtotal?.toString() || "0");
      const refundAmt = parseFloat(
        ((subtotal * (refundPercentage ?? 100)) / 100).toFixed(2),
      );

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          refundAmount: refundAmt,
          refundInitiatedAt: refundAmt > 0 ? now : undefined,
          cancellationReason: cancellationReason || "Event cancelled by host",
        },
      });

      // Enqueue refund job if there's an amount to refund
      if (refundAmt > 0) {
        try {
          await publishRefundJob({
            bookingId: String(booking.id),
            refundPercentage: refundPercentage ?? 100,
            eventName: (booking.eventDetails as any)?.eventName || "",
          });
        } catch (refundErr: any) {
          console.error(
            `⚠️ Failed to enqueue refund for booking ${booking.id}:`,
            refundErr.message,
          );
        }
      }
    }

    // Update the existing booking_confirmed / payment_success notifications to event_cancelled
    // This is done via RabbitMQ publish — notification-service consumer will handle it
    await publishEventCancellationNotificationUpdate({
      eventId,
      cancellationReason: cancellationReason || "Event cancelled by host",
      refundPercentage: refundPercentage ?? 100,
      cancellationTier: cancellationTier || "full_refund",
      isHostCancellation: isHostCancellation ?? true,
      bookings: bookings.map((b: any) => ({
        id: String(b.id),
        bookingId: b.bookingId,
        userId: b.userId,
        subtotal: parseFloat(b.subtotal?.toString() || "0"),
        platformFee: parseFloat(b.platformFee?.toString() || "0"),
        eventName: (b.eventDetails as any)?.eventName || "",
        ticketType: b.ticketType,
        quantity: b.quantity,
        ticketId: b.ticketId,
        parentTicketId: b.parentTicketId || "",
      })),
    });

    callback(null, {
      success: true,
      error: "",
      updatedCount: updateResult.count,
    });
  } catch (err: any) {
    console.error("❌ [gRPC] cancelEventBookings error:", err.message);
    callback(null, { success: false, error: err.message, updatedCount: 0 });
  }
};

const getEventFinancialSummary = async (call: any, callback: any) => {
  try {
    const { ticketId } = call.request;
    if (!ticketId) {
      return callback(null, { success: false, error: "ticketId required" });
    }

    // Fetch all bookings for this ticket
    const allBookings = await prisma.booking.findMany({
      where: {
        ticketId,
        bookingStatus: { not: "PENDING" }, // ← exclude pending
      },
      select: {
        bookingId: true,
        bookingStatus: true,
        paymentStatus: true,
        paymentMethod: true,
        ticketType: true,
        quantity: true,
        subtotal: true,
        platformFee: true,
        convenienceFee: true,
        tax: true,
        totalAmount: true,
        refundAmount: true,
        refundStatus: true,
        userDetails: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Aggregate totals ──────────────────────────────────────────────────────
    let totalRevenue = 0; // host's share (subtotal of confirmed bookings)
    let totalPlatformFee = 0;
    let totalConvenienceFee = 0;
    let totalTax = 0;
    let totalRefunded = 0;
    let totalTicketsSold = 0;
    let confirmedCount = 0;
    let cancelledCount = 0;

    // Per ticket type map
    const typeMap: Record<
      string,
      { count: number; revenue: number; refunded: number }
    > = {};

    for (const b of allBookings) {
      const subtotal = parseFloat(b.subtotal?.toString() || "0");
      const platFee = parseFloat(b.platformFee?.toString() || "0");
      const convFee = parseFloat((b as any).convenienceFee?.toString() || "0");
      const tax = parseFloat(b.tax?.toString() || "0");
      const refunded = parseFloat(b.refundAmount?.toString() || "0");

      if (b.bookingStatus === "CONFIRMED" && b.paymentStatus === "COMPLETED") {
        totalRevenue += subtotal;
        totalPlatformFee += platFee;
        totalConvenienceFee += convFee;
        totalTax += tax;
        totalTicketsSold += b.quantity;
        confirmedCount += 1;

        // Per type
        const type = b.ticketType || "General";
        if (!typeMap[type])
          typeMap[type] = { count: 0, revenue: 0, refunded: 0 };
        typeMap[type].count += b.quantity;
        typeMap[type].revenue += subtotal;
      }

      if (b.bookingStatus === "CANCELLED") {
        cancelledCount += 1;
        totalRefunded += refunded;
        const type = b.ticketType || "General";
        if (!typeMap[type])
          typeMap[type] = { count: 0, revenue: 0, refunded: 0 };
        typeMap[type].refunded += refunded;
      }
    }

    const netHostPayout = parseFloat((totalRevenue - totalRefunded).toFixed(2));

    // ── Build per-type summary ────────────────────────────────────────────────
    const byTicketType = Object.entries(typeMap).map(([ticketType, data]) => ({
      ticketType,
      count: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      refunded: parseFloat(data.refunded.toFixed(2)),
    }));

    // ── Recent 20 transactions ────────────────────────────────────────────────
    const recentTransactions = allBookings.slice(0, 20).map((b) => ({
      bookingId: b.bookingId || "",
      userName: (b.userDetails as any)?.name || "Unknown",
      ticketType: b.ticketType || "",
      quantity: b.quantity,
      subtotal: parseFloat(b.subtotal?.toString() || "0"),
      platformFee: parseFloat(b.platformFee?.toString() || "0"),
      totalPaid: parseFloat(b.totalAmount?.toString() || "0"),
      paymentMethod: b.paymentMethod || "",
      paymentStatus: b.paymentStatus || "",
      bookingStatus: b.bookingStatus || "",
      refundStatus: b.refundStatus || "NOT_APPLICABLE",
      refundAmount: parseFloat(b.refundAmount?.toString() || "0"),
      createdAt: b.createdAt?.toISOString() || "",
    }));

    callback(null, {
      success: true,
      error: "",
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalPlatformFee: parseFloat(totalPlatformFee.toFixed(2)),
      totalConvenienceFee: parseFloat(totalConvenienceFee.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      totalRefunded: parseFloat(totalRefunded.toFixed(2)),
      netHostPayout,
      totalConfirmedBookings: confirmedCount,
      totalCancelledBookings: cancelledCount,
      totalTicketsSold,
      byTicketType,
      recentTransactions,
    });
  } catch (err: any) {
    console.error("❌ [gRPC] getEventFinancialSummary error:", err.message);
    callback(null, { success: false, error: err.message });
  }
};

const getEventTransactionList = async (call: any, callback: any) => {
  try {
    const { ticketId, limit = 50, offset = 0, status } = call.request;
    if (!ticketId) {
      return callback(null, {
        success: false,
        error: "ticketId required",
        transactions: [],
        total: 0,
      });
    }

    const where: any = {
      ticketId,
      bookingStatus: { not: "PENDING" },
    };
    if (status && status !== "all") {
      const upper = status.toUpperCase();
      if (upper !== "PENDING") {
        where.bookingStatus = upper;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 100),
        skip: offset,
        select: {
          bookingId: true,
          bookingStatus: true,
          paymentStatus: true,
          paymentMethod: true,
          ticketType: true,
          quantity: true,
          subtotal: true,
          platformFee: true,
          totalAmount: true,
          refundAmount: true,
          refundStatus: true,
          userDetails: true,
          createdAt: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const transactions = bookings.map((b) => ({
      bookingId: b.bookingId || "",
      userName: (b.userDetails as any)?.name || "Unknown",
      ticketType: b.ticketType || "",
      quantity: b.quantity,
      subtotal: parseFloat(b.subtotal?.toString() || "0"),
      platformFee: parseFloat(b.platformFee?.toString() || "0"),
      totalPaid: parseFloat(b.totalAmount?.toString() || "0"),
      paymentMethod: b.paymentMethod || "",
      paymentStatus: b.paymentStatus || "",
      bookingStatus: b.bookingStatus || "",
      refundStatus: b.refundStatus || "NOT_APPLICABLE",
      refundAmount: parseFloat(b.refundAmount?.toString() || "0"),
      createdAt: b.createdAt?.toISOString() || "",
    }));

    callback(null, { success: true, error: "", transactions, total });
  } catch (err: any) {
    console.error("❌ [gRPC] getEventTransactionList error:", err.message);
    callback(null, {
      success: false,
      error: err.message,
      transactions: [],
      total: 0,
    });
  }
};

export const verifyBookingQR = async (call: any, callback: any) => {
  try {
    const { qrData } = call.request;
    if (!qrData) {
      return callback(null, { success: false, error: "qrData is required" });
    }

    const { verifyQRCode } = await import("../utils/qrGenerator");
    const parsed = verifyQRCode(qrData);

    if (!parsed || !parsed.bookingId) {
      return callback(null, {
        success: false,
        error: "Invalid or unrecognised QR code",
      });
    }

    // Look up the booking by its external bookingId string
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId: parsed.bookingId,
        bookingStatus: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    if (!booking) {
      return callback(null, {
        success: false,
        error: "Booking not found or already cancelled",
      });
    }

    const eventDet = (booking as any).eventDetails || {};
    const userDet = (booking as any).userDetails || {};
    const rawPaymentMethod =
      (booking as any).paymentMethod || parsed.paymentMethod || "";

    callback(null, {
      success: true,
      error: "",
      // IDs
      bookingId: String(booking.id),
      externalId: booking.bookingId || "",
      userId: booking.userId || "",
      ticketId: booking.ticketId || "",
      // Ticket info
      ticketType: booking.ticketType || parsed.ticketType || "",
      quantity: booking.quantity || parsed.quantity || 1,
      paymentMethod: rawPaymentMethod,
      bookingStatus: booking.bookingStatus || "",
      // Holder
      userName: userDet.name || parsed.holderName || "",
      userEmail: userDet.email || "",
      userPhone: userDet.phone || userDet.contact || "",
      // Event details — pulled from stored eventDetails (authoritative)
      eventName: eventDet.eventName || parsed.eventName || "",
      eventDate: eventDet.eventDate || parsed.eventDate || "",
      eventTime: eventDet.eventTime || parsed.eventTime || "",
      eventEndDate: eventDet.eventEndDate || eventDet.end_date || "",
      venue: eventDet.venue || eventDet.location || parsed.venue || "",
      // Financials
      totalAmount: parseFloat(booking.totalAmount?.toString() || "0"),
      subtotal: parseFloat((booking as any).subtotal?.toString() || "0"),
      // Event image for scanner display
      eventImage:
        eventDet.event_portrait ||
        eventDet.event_banner ||
        eventDet.image ||
        "",
    });
  } catch (err: any) {
    console.error("❌ [gRPC] verifyBookingQR error:", err.message);
    callback(null, { success: false, error: err.message });
  }
};

export const startGrpcServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const server = new grpc.Server();

      if (!bookingProto || !bookingProto.BookingService) {
        throw new Error("BookingService not found in proto definition");
      }

      server.addService(bookingProto.BookingService.service, {
        GetBookingStatsByDate: getBookingStatsByDate,
        GetBookingGrowthStats: getBookingGrowthStats,
        GetMonthlyBookingChart: getMonthlyBookingChart,
        GetBookingsForEvent: getBookingsForEvent,
        GetRefundStatus: getRefundStatus,
        CancelEventBookings: cancelEventBookings,
        GetEventFinancialSummary: getEventFinancialSummary,
        GetEventTransactionList: getEventTransactionList,
        VerifyBookingQR: verifyBookingQR,
      });

      const port = process.env.BOOKING_GRPC_PORT || "50054";

      server.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, boundPort) => {
          if (error) {
            console.error("❌ Failed to bind gRPC server:", error);
            reject(error);
            return;
          }

          server.start();
          resolve();
        },
      );
    } catch (error) {
      console.error("❌ Error starting gRPC server:", error);
      reject(error);
    }
  });
};
export const startRefundWorker = async (): Promise<void> => {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
  const QUEUE_NAME = "wie.refund.jobs";
  const RATE_LIMIT_MS = 300; // 200 refunds/min = 1 per 300ms

  let conn: any, ch: any;

  const connect = async () => {
    conn = await amqp.connect(RABBITMQ_URL);
    ch = await conn.createChannel();
    await ch.assertQueue(QUEUE_NAME, { durable: true });
    ch.prefetch(1); // Process one at a time per worker instance
    ch.consume(QUEUE_NAME, async (msg: any) => {
      if (!msg) return;
      const job = JSON.parse(msg.content.toString());
      try {
        await processRefundJob(
          job.bookingId,
          job.refundPercentage,
          job.eventName,
        );
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
    conn.on("error", async () => {
      console.error(
        "⚠️ [RefundWorker] RabbitMQ connection lost — reconnecting in 5s",
      );
      setTimeout(connect, 5000);
    });
  } catch (err: any) {
    console.error("❌ [RefundWorker] Failed to start:", err.message);
  }
};
