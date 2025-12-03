import { prisma } from '../config/db';
export class PaymentTransactionModel {
    /**
     * Create payment transaction
     */
    static async create(data) {
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
    static async findById(id) {
        return await prisma.paymentTransaction.findUnique({
            where: { id },
            include: { booking: true },
        });
    }
    /**
     * Find by Razorpay order ID
     */
    static async findByRazorpayOrderId(razorpayOrderId) {
        return await prisma.paymentTransaction.findFirst({
            where: { razorpayOrderId },
            include: { booking: true },
        });
    }
    /**
     * Find by Razorpay payment ID
     */
    static async findByRazorpayPaymentId(razorpayPaymentId) {
        return await prisma.paymentTransaction.findFirst({
            where: { razorpayPaymentId },
            include: { booking: true },
        });
    }
    /**
     * Find by booking ID
     */
    static async findByBookingId(bookingId) {
        return await prisma.paymentTransaction.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Update transaction
     */
    static async update(id, data) {
        return await prisma.paymentTransaction.update({
            where: { id },
            data: data,
        });
    }
    /**
     * Update by Razorpay order ID
     */
    static async updateByRazorpayOrderId(razorpayOrderId, data) {
        const result = await prisma.paymentTransaction.updateMany({
            where: { razorpayOrderId },
            data: data,
        });
        return result.count;
    }
    /**
     * Get payment statistics
     */
    static async getStatistics(options) {
        const where = {};
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
    static async getPaymentMethodsBreakdown(options) {
        const where = { status: 'COMPLETED' };
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
//# sourceMappingURL=paymentTransaction.model.js.map