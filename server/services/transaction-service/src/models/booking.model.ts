import { prisma } from "../config/db";
import { Booking, BookingStatus, PaymentStatus } from "../generated/prisma";
import { Decimal } from "../generated/prisma/runtime/library";
export interface CreateBookingData {
  bookingId: string;
  userId: string;
  ticketId: string;
  groupId: string;
  ticketType: string;
  quantity: number;
  pricePerTicket: number;
  subtotal: number;
  tax: number;
  platformFee: number;
  totalAmount: number;
  currency?: string;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
  eventDetails: {
    eventName: string;
    eventDate: string;
    eventTime?: string;
    venue?: string;
    location?: string;
    event_portrait?: string;
    settlementBankDetails?: {
      bank_acc_holder: string;
      bank_acc_no: string;
      bank_ifsc: string;
      bank_acc_type: string;
    };
    groupName?: string;
  };
  convenienceFee?: number; // ← was incorrectly string, fixed to number
  organizerGst?: number;
  platformGst?: number;
  settlementMode?: string; // 'INSTANT' | 'DELAYED' | 'HIGH_RISK_ESCROW'
  refundPolicyId?: string; // 'DEFAULT' | 'STRICT' | 'FLEXIBLE' | 'NO_REFUND'
  financialState?: string; // 'CREATED' | 'PAID' | 'HELD' | 'SETTLED' | 'REFUNDED'
  paymentStatus?: PaymentStatus;
  bookingStatus?: BookingStatus;
  seatDetails?: {
    selectedSeats: string[];
    seats: Array<{
      seatId: string;
      row: string;
      column: number;
      ticketType: string;
      ticketTypeId: string;
      price: number;
      color: string;
    }>;
  };
  selectedSeats?: string[];
}

export interface UpdateBookingData {
  paymentStatus?: PaymentStatus;
  bookingStatus?: BookingStatus;
  paymentMethod?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  qrCode?: string;
  isVerified?: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  cancellationCount?: number;
  cancellationReason?: string;
  cancelledAt?: Date;
  refundAmount?: number | Decimal;
  refundStatus?: string;
  refundProcessedAt?: Date;
  refundId?: string;
  refundInitiatedAt?: Date;
  refundReason?: string;
  settlementMode?: string;
  financialState?: string;
  refundPolicyId?: string;
}
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
};
export class BookingModel {
  static async create(data: CreateBookingData): Promise<Booking> {
    return await prisma.booking.create({
      data: {
        bookingId: data.bookingId,
        userId: data.userId,
        ticketId: data.ticketId,
        groupId: data.groupId,
        ticketType: data.ticketType,
        quantity: data.quantity,
        pricePerTicket: data.pricePerTicket,
        subtotal: data.subtotal,
        tax: data.tax,
        platformFee: data.platformFee,
        totalAmount: data.totalAmount,
        currency: data.currency || "INR",
        userDetails: data.userDetails as any,
        eventDetails: data.eventDetails as any,
        seatDetails: data.seatDetails as any,
        paymentStatus: data.paymentStatus || "PENDING",
        bookingStatus: data.bookingStatus || "PENDING",
        ...(data.convenienceFee !== undefined && {
          convenienceFee: data.convenienceFee,
        }),
        ...(data.organizerGst !== undefined && {
          organizerGst: data.organizerGst,
        }),
        ...(data.platformGst !== undefined && {
          platformGst: data.platformGst,
        }),
        ...(data.settlementMode !== undefined && {
          settlementMode: data.settlementMode,
        }),
        ...(data.refundPolicyId !== undefined && {
          refundPolicyId: data.refundPolicyId,
        }),
        ...(data.financialState !== undefined && {
          financialState: data.financialState,
        }),
      },
    });
  }

  /**
   * Find booking by ID
   */
  static async findById(id: string): Promise<Booking | null> {
    // Guard: Prisma UUID column rejects non-UUID strings with a hard crash
    // If the caller passed a bookingId string (e.g. "WIE-...") instead of the UUID id,
    // fall back to findByBookingId automatically
    if (!isValidUUID(id)) {
      return BookingModel.findByBookingId(id);
    }
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        paymentTransactions: true,
      },
    });
  }

  /**
   * Find booking by booking ID
   */
  static async findByBookingId(bookingId: string): Promise<Booking | null> {
    return await prisma.booking.findUnique({
      where: { bookingId },
      include: {
        paymentTransactions: true,
      },
    });
  }

  /**
   * Find booking by Razorpay order ID
   */
  static async findByRazorpayOrderId(
    razorpayOrderId: string,
  ): Promise<Booking | null> {
    return await prisma.booking.findUnique({
      where: { razorpayOrderId },
    });
  }

  /**
   * Find bookings by user ID
   */
  static async findByUserId(
    userId: string,
    options?: {
      status?: BookingStatus;
      limit?: number;
      skip?: number;
    },
  ): Promise<{ bookings: Booking[]; total: number }> {
    const where: any = { userId };

    if (options?.status) {
      where.bookingStatus = options.status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.skip || 0,
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total };
  }

  /**
   * Find bookings by ticket ID
   */
  static async findByTicketId(ticketId: string): Promise<Booking[]> {
    return await prisma.booking.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find bookings by group ID
   */
  static async findByGroupId(
    groupId: string,
    options?: {
      ticketId?: string;
      status?: BookingStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    },
  ): Promise<{ bookings: Booking[]; total: number }> {
    const where: any = { groupId };

    if (options?.ticketId) {
      where.ticketId = options.ticketId;
    }

    if (options?.status) {
      where.bookingStatus = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 100,
        skip: options?.skip || 0,
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings, total };
  }

  static async update(id: string, data: UpdateBookingData): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: data as any,
    });
  }

  /**
   * Update booking by Razorpay order ID
   */
  static async updateByRazorpayOrderId(
    razorpayOrderId: string,
    data: UpdateBookingData,
  ): Promise<Booking> {
    return await prisma.booking.update({
      where: { razorpayOrderId },
      data: data as any,
    });
  }
  static async cancel(
    id: string,
    cancellationReason: string,
  ): Promise<Booking> {
    // Get current booking to increment cancellation count
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { cancellationCount: true },
    });

    const currentCount = booking?.cancellationCount || 0;

    return await prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: "CANCELLED",
        cancellationReason,
        cancelledAt: new Date(),
        cancellationCount: currentCount + 1, // ✅ Increment count
      },
    });
  }
  /**
   * Get user's total cancellation count
   */
  static async getUserCancellationStats(userId: string): Promise<{
    totalCancellations: number;
    totalCancelledTickets: number;
  }> {
    const stats = await prisma.booking.aggregate({
      where: {
        userId,
        bookingStatus: "CANCELLED",
      },
      _sum: {
        quantity: true,
        cancellationCount: true,
      },
      _count: true,
    });

    return {
      totalCancellations: stats._count,
      totalCancelledTickets: stats._sum.quantity || 0,
    };
  }
  static async getGroupStatistics(groupId: string) {
    return await prisma.booking.aggregate({
      where: {
        groupId,
        bookingStatus: "CONFIRMED",
      },
      _sum: {
        totalAmount: true,
        quantity: true,
      },
      _count: true,
    });
  }
  static async getTicketStatistics(ticketId: string) {
    const stats = await prisma.booking.groupBy({
      by: ["bookingStatus"],
      where: { ticketId },
      _count: true,
      _sum: {
        totalAmount: true,
        quantity: true,
      },
    });

    return stats;
  }
  static async countBookedTickets(
    ticketId: string,
    ticketType: string,
  ): Promise<number> {
    const result = await prisma.booking.aggregate({
      where: {
        ticketId,
        ticketType,
        bookingStatus: { in: ["PENDING", "CONFIRMED"] },
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }
  static async findOne(filter: any): Promise<any> {
    const where = { ...filter };
    if (where.bookingStatus?.$in) {
      where.bookingStatus = { in: where.bookingStatus.$in };
    }
    return await prisma.booking.findFirst({ where });
  }
  static async verify(id: string, verifiedBy: string): Promise<Booking> {
    return await prisma.booking.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy,
      },
    });
  }
  static async getRefundDetails(id: string): Promise<{
    booking: Booking | null;
    refundTransactions: any[];
  }> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        paymentTransactions: {
          where: {
            method: "refund",
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });
    return {
      booking,
      refundTransactions: booking?.paymentTransactions || [],
    };
  }
  static async getDailyBookingStats(ticketId: string): Promise<any[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        ticketId,
        bookingStatus: "CONFIRMED",
        paymentStatus: "COMPLETED",
      },
      select: {
        createdAt: true,
        quantity: true,
        subtotal: true,
      },
    });

    // Group by date
    const dailyStats = bookings.reduce((acc: any, booking) => {
      const date = new Date(booking.createdAt).toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = {
          date,
          bookings: 0,
          ticketsSold: 0,
          revenue: 0,
        };
      }

      acc[date].bookings += 1;
      acc[date].ticketsSold += booking.quantity;
      acc[date].revenue += parseFloat(booking.subtotal.toString());

      return acc;
    }, {});

    return Object.values(dailyStats).sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }
  static async getMonthlyBookingStats(
    ticketId: string,
    startDate: string,
    endDate: string,
  ): Promise<any[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        ticketId,
        bookingStatus: "CONFIRMED",
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        createdAt: true,
        quantity: true,
        subtotal: true,
      },
    });

    // Group by month
    const monthlyStats = bookings.reduce((acc: any, booking) => {
      const date = new Date(booking.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date
        .toLocaleString("en-US", { month: "short" })
        .toUpperCase();

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          year: date.getFullYear(),
          bookings: 0,
          ticketsSold: 0,
          revenue: 0,
        };
      }

      acc[monthKey].bookings += 1;
      acc[monthKey].ticketsSold += booking.quantity;
      acc[monthKey].revenue += parseFloat(booking.subtotal.toString());

      return acc;
    }, {});

    return Object.values(monthlyStats);
  }
  static async getTicketTypeStats(ticketId: string): Promise<any[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        ticketId,
        bookingStatus: "CONFIRMED",
        paymentStatus: "COMPLETED",
      },
      select: {
        ticketType: true,
        quantity: true,
        subtotal: true,
      },
    });

    // Group by ticket type
    const typeStats = bookings.reduce((acc: any, booking) => {
      const type = booking.ticketType;

      if (!acc[type]) {
        acc[type] = {
          ticketType: type,
          soldCount: 0,
          revenue: 0,
        };
      }

      acc[type].soldCount += booking.quantity;
      acc[type].revenue += parseFloat(booking.subtotal.toString());

      return acc;
    }, {});

    return Object.values(typeStats);
  }
  static async findByTicketIdWithStatus(
    ticketId: string,
    statuses: string[],
    dateRange?: { gte: Date; lte: Date },
  ): Promise<Booking[]> {
    // Map status strings to valid BookingStatus enum values
    const validStatuses = statuses
      .map((s) => {
        const upper = s.toUpperCase();
        // Map 'COMPLETED' to 'CONFIRMED' since COMPLETED doesn't exist in enum
        if (upper === "COMPLETED") return "CONFIRMED";
        return upper as BookingStatus;
      })
      .filter((s) => ["PENDING", "CONFIRMED", "CANCELLED"].includes(s));

    const where: any = {
      ticketId,
      bookingStatus: { in: validStatuses },
    };

    if (dateRange) {
      where.createdAt = dateRange;
    }

    return await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }
  static async getBookingsByDayOfMonth(
    ticketId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ day: number; count: number; revenue: number }>> {
    const bookings = await prisma.booking.findMany({
      where: {
        ticketId,
        createdAt: { gte: startDate, lte: endDate },
        bookingStatus: "CONFIRMED",
        paymentStatus: "COMPLETED",
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Group by day
    const dailyStats = bookings.reduce((acc: any, booking) => {
      const day = new Date(booking.createdAt).getDate();

      if (!acc[day]) {
        acc[day] = { day, count: 0, revenue: 0 };
      }

      acc[day].count += 1;
      acc[day].revenue += parseFloat(booking.totalAmount?.toString() || "0");

      return acc;
    }, {});

    return Object.values(dailyStats);
  }
  // Find booking with its settlement (for race condition checks)
  static async findWithSettlement(id: string): Promise<{
    booking: Booking | null;
    settlement: any | null;
  }> {
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return { booking: null, settlement: null };

    const settlement = await prisma.settlement.findFirst({
      where: { bookingId: id },
      orderBy: { createdAt: "desc" },
    });

    return { booking, settlement };
  }
  // Bulk cancel bookings for event (used in cancellation flow)
  static async bulkCancelByTicketId(
    ticketId: string,
    reason: string,
    refundPercentage: number,
  ): Promise<{ count: number; bookings: Booking[] }> {
    const bookings = await prisma.booking.findMany({
      where: {
        ticketId,
        bookingStatus: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    await Promise.all(
      bookings.map((b) =>
        prisma.booking.update({
          where: { id: b.id },
          data: {
            bookingStatus: "CANCELLED",
            cancellationReason: reason,
            cancelledAt: new Date(),
            refundStatus: "PENDING",
            refundAmount: parseFloat(
              (
                (parseFloat(b.subtotal.toString()) * refundPercentage) /
                100
              ).toFixed(2),
            ),
          },
        }),
      ),
    );

    return { count: bookings.length, bookings };
  }
}
export default BookingModel;
