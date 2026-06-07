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
  vpa?: string; 
  webhookData?: any;
  errorCode?: string;
  errorDescription?: string;
  refundId?: string;
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
  refundId?: string; 
}

export class PaymentTransactionModel {
  static async create(data: CreatePaymentTransactionData): Promise<PaymentTransaction> {
    return await prisma.paymentTransaction.create({
      data: {
        bookingId: data.bookingId,
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: data.status || 'PENDING',
        method: data.method,
        vpa: data.vpa,
        webhookData: data.webhookData,
        errorCode: data.errorCode,
        errorDescription: data.errorDescription,
      },
    });
  }
  static async findById(id: string): Promise<PaymentTransaction | null> {
    return await prisma.paymentTransaction.findUnique({
      where: { id },
      include: { booking: true },
    });
  }
  static async findByRazorpayOrderId(
    razorpayOrderId: string
  ): Promise<PaymentTransaction | null> {
    return await prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId },
      include: { booking: true },
    });
  }
  static async findByRazorpayPaymentId(
    razorpayPaymentId: string
  ): Promise<PaymentTransaction | null> {
    return await prisma.paymentTransaction.findFirst({
      where: { razorpayPaymentId },
      include: { booking: true },
    });
  }
  static async findByBookingId(bookingId: string): Promise<PaymentTransaction[]> {
    return await prisma.paymentTransaction.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }
  static async update(
    id: string,
    data: UpdatePaymentTransactionData
  ): Promise<PaymentTransaction> {
    return await prisma.paymentTransaction.update({
      where: { id },
      data: data as any,
    });
  }
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
  static async findRefundsByBookingId(bookingId: string): Promise<PaymentTransaction[]> {
    return await prisma.paymentTransaction.findMany({
      where: { 
        bookingId,
        method: 'refund'
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
export default PaymentTransactionModel;