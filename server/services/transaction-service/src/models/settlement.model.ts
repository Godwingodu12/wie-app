import { prisma } from '../config/db';
export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
interface CreateSettlementData {
  bookingId: string;
  organizationAmount: number;
  platformFee: number;
  status?: SettlementStatus;
  bankDetails: {
    bank_acc_holder: string;
    bank_acc_no: string;
    bank_ifsc: string;
    bank_acc_type: string;
  };
}

interface UpdateSettlementData {
  organizationAmount?: number;
  platformFee?: number;
  status?: SettlementStatus;
  razorpayPayoutId?: string;
  processedAt?: Date;
}

interface SettlementWhereInput {
  id?: string;
  bookingId?: string;
  status?: SettlementStatus | { in: SettlementStatus[] };
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

interface SettlementOrderByInput {
  createdAt?: 'asc' | 'desc';
  updatedAt?: 'asc' | 'desc';
  organizationAmount?: 'asc' | 'desc';
  platformFee?: 'asc' | 'desc';
}

export class SettlementModel {
  /**
   * Create a new settlement record
   */
  static async create(data: CreateSettlementData) {
    return await prisma.settlement.create({
      data: {
        bookingId: data.bookingId,
        organizationAmount: data.organizationAmount,
        platformFee: data.platformFee,
        status: data.status || 'PENDING',
        bankDetails: data.bankDetails as any,
      },
    });
  }

  /**
   * Find settlement by ID
   */
  static async findById(id: string) {
    return await prisma.settlement.findUnique({
      where: { id },
    });
  }

  /**
   * Find settlement by booking ID
   * Using findFirst instead of findUnique since bookingId might not be unique in Prisma's eyes
   */
  static async findByBookingId(bookingId: string) {
    return await prisma.settlement.findFirst({
      where: { bookingId },
    });
  }

  /**
   * Update settlement
   */
  static async update(id: string, data: UpdateSettlementData) {
    return await prisma.settlement.update({
      where: { id },
      data,
    });
  }

  /**
   * Get all settlements with filters
   */
  static async findMany(where?: SettlementWhereInput, orderBy?: SettlementOrderByInput) {
    return await prisma.settlement.findMany({
      where: where as any,
      orderBy: orderBy as any,
    });
  }

  /**
   * Get settlements by status
   */
  static async findByStatus(status: SettlementStatus) {
    return await prisma.settlement.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get settlements for date range
   */
  static async findByDateRange(startDate: Date, endDate: Date) {
    return await prisma.settlement.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Aggregate settlements
   */
  static async aggregate(where?: SettlementWhereInput) {
    return await prisma.settlement.aggregate({
      where: where as any,
      _sum: {
        organizationAmount: true,
        platformFee: true,
      },
      _count: true,
    });
  }

  /**
   * Delete settlement (rarely used)
   */
  static async delete(id: string) {
    return await prisma.settlement.delete({
      where: { id },
    });
  }

  /**
   * Get pending settlements count
   */
  static async getPendingCount() {
    return await prisma.settlement.count({
      where: { status: 'PENDING' },
    });
  }

  /**
   * Get total platform earnings
   */
  static async getTotalPlatformFee(status?: SettlementStatus[]) {
    const result = await prisma.settlement.aggregate({
      where: status ? { status: { in: status } } : undefined,
      _sum: {
        platformFee: true,
      },
    });

    return result._sum.platformFee || 0;
  }

  /**
   * Get total organization amount
   */
  static async getTotalOrganizationAmount(status?: SettlementStatus[]) {
    const result = await prisma.settlement.aggregate({
      where: status ? { status: { in: status } } : undefined,
      _sum: {
        organizationAmount: true,
      },
    });

    return result._sum.organizationAmount || 0;
  }

  /**
   * Check if settlement exists for booking
   */
  static async existsForBooking(bookingId: string): Promise<boolean> {
    const count = await prisma.settlement.count({
      where: { bookingId },
    });
    return count > 0;
  }

  /**
   * Get settlements by multiple booking IDs
   */
  static async findByBookingIds(bookingIds: string[]) {
    return await prisma.settlement.findMany({
      where: {
        bookingId: {
          in: bookingIds,
        },
      },
    });
  }

  /**
   * Get settlement statistics by status
   */
  static async getStatsByStatus() {
    const results = await prisma.settlement.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        organizationAmount: true,
        platformFee: true,
      },
    });

    return results;
  }
}

export default SettlementModel;