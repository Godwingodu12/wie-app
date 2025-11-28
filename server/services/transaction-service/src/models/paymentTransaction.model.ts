import { prisma } from '../config/db';
import { PaymentTransaction, PaymentStatus } from '../generated/prisma';

export interface CreatePaymentTransactionData {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  method?: string;
  bank?: string;
  wallet?: string;
  webhookData?: any;
  errorCode?: string;
  errorDescription?: string;
}

export interface UpdatePaymentTransactionData {
  razorpayPaymentId?: string;
  status?: PaymentStatus;
  method?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  webhookData?: any;
  errorCode?: string;
  errorDescription?: string;
}

export class PaymentTransactionModel {
  /**
   * Create payment transaction
   */
  static async create(data: CreatePaymentTransactionData): Promise<PaymentTransaction> {
    return await prisma.paymentTransaction.create({
      data: {
        bookingId: data.bookingId,
        razorpayOrderId: data.razorpayOrderId,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: data.status || 'PENDING',
      },
    });
  }

  /**
   * Find by ID
   */
  static async findById(id: string): Promise<PaymentTransaction | null> {
    return await prisma.paymentTransaction.findUnique({
      where: { id },
      include: { booking: true },
    });
  }

  /**
   * Find by Razorpay order ID
   */
  static async findByRazorpayOrderId(
    razorpayOrderId: string
  ): Promise<PaymentTransaction | null> {
    return await prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId },
      include: { booking: true },
    });
  }

  /**
   * Find by Razorpay payment ID
   */
  static async findByRazorpayPaymentId(
    razorpayPaymentId: string
  ): Promise<PaymentTransaction | null> {
    return await prisma.paymentTransaction.findFirst({
      where: { razorpayPaymentId },
      include: { booking: true },
    });
  }

  /**
   * Find by booking ID
   */
  static async findByBookingId(bookingId: string): Promise<PaymentTransaction[]> {
    return await prisma.paymentTransaction.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update transaction
   */
  static async update(
    id: string,
    data: UpdatePaymentTransactionData
  ): Promise<PaymentTransaction> {
    return await prisma.paymentTransaction.update({
      where: { id },
      data: data as any,
    });
  }

  /**
   * Update by Razorpay order ID
   */
  static async updateByRazorpayOrderId(
    razorpayOrderId: string,
    data: UpdatePaymentTransactionData
  ): Promise<number> {
    const result = await prisma.paymentTransaction.updateMany({
      where: { razorpayOrderId },
      data: data as any,
    });

    return result.count;
  }

  /**
   * Get payment statistics
   */
  static async getStatistics(options?: {
    bookingId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};

    if (options?.bookingId) {
      where.bookingId = options.bookingId;
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

    const stats = await prisma.paymentTransaction.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: { amount: true },
    });

    return stats;
  }

  /**
   * Get payment methods breakdown
   */
  static async getPaymentMethodsBreakdown(options?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { status: 'COMPLETED' };

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    return await prisma.paymentTransaction.groupBy({
      by: ['method'],
      where,
      _count: true,
      _sum: { amount: true },
    });
  }
}
export default PaymentTransactionModel;