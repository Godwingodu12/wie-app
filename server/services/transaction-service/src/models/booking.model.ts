import { prisma } from '../config/db';
import { Booking, BookingStatus, PaymentStatus } from '../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

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
    settlementBankDetails?: {
      bank_acc_holder: string;
      bank_acc_no: string;
      bank_ifsc: string;
      bank_acc_type: string;
    };
    groupName?: string;
  };
  // These are now optional since they have defaults
  paymentStatus?: PaymentStatus;
  bookingStatus?: BookingStatus;
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
  refundAmount?: number | Decimal; // Accept both number and Decimal
  refundStatus?: string;
  refundProcessedAt?: Date;
}
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
        currency: data.currency || 'INR',
        userDetails: data.userDetails as any,
        eventDetails: data.eventDetails as any,
        paymentStatus: data.paymentStatus || 'PENDING',
        bookingStatus: data.bookingStatus || 'PENDING',
      },
    });
  }

  /**
   * Find booking by ID
   */
  static async findById(id: string): Promise<Booking | null> {
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
  static async findByRazorpayOrderId(razorpayOrderId: string): Promise<Booking | null> {
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
    }
  ): Promise<{ bookings: Booking[]; total: number }> {
    const where: any = { userId };

    if (options?.status) {
      where.bookingStatus = options.status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
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
    }
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
        orderBy: { createdAt: 'desc' },
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
    data: UpdateBookingData
  ): Promise<Booking> {
    return await prisma.booking.update({
      where: { razorpayOrderId },
      data: data as any,
    });
  }
  static async cancel(
    id: string,
    cancellationReason: string
  ): Promise<Booking> {
    // Get current booking to increment cancellation count
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { cancellationCount: true }
    });

    const currentCount = booking?.cancellationCount || 0;

    return await prisma.booking.update({
      where: { id },
      data: {
        bookingStatus: 'CANCELLED',
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
        bookingStatus: 'CANCELLED',
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
  /**
   * Get booking statistics for a group
   */
  static async getGroupStatistics(groupId: string) {
    return await prisma.booking.aggregate({
      where: {
        groupId,
        bookingStatus: 'CONFIRMED',
      },
      _sum: {
        totalAmount: true,
        quantity: true,
      },
      _count: true,
    });
  }

  /**
   * Get booking statistics for a ticket
   */
  static async getTicketStatistics(ticketId: string) {
    const stats = await prisma.booking.groupBy({
      by: ['bookingStatus'],
      where: { ticketId },
      _count: true,
      _sum: {
        totalAmount: true,
        quantity: true,
      },
    });

    return stats;
  }

  /**
   * Count booked tickets for a specific ticket type
   */
  static async countBookedTickets(
    ticketId: string,
    ticketType: string
  ): Promise<number> {
    const result = await prisma.booking.aggregate({
      where: {
        ticketId,
        ticketType,
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
      },
      _sum: { quantity: true },
    });

    return result._sum.quantity || 0;
  }
  static async findOne(filter: any): Promise<any> {
  if (filter.bookingStatus?.$in) {
    filter.bookingStatus = {
      in: filter.bookingStatus.$in
    };
  }
  
  return await prisma.booking.findFirst({
    where: filter,
  });
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
}

export default BookingModel;