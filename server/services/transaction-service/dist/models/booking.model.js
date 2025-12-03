import { prisma } from '../config/db';
export class BookingModel {
    static async create(data) {
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
                userDetails: data.userDetails,
                eventDetails: data.eventDetails,
                paymentStatus: data.paymentStatus || 'PENDING',
                bookingStatus: data.bookingStatus || 'PENDING',
            },
        });
    }
    /**
     * Find booking by ID
     */
    static async findById(id) {
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
    static async findByBookingId(bookingId) {
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
    static async findByRazorpayOrderId(razorpayOrderId) {
        return await prisma.booking.findUnique({
            where: { razorpayOrderId },
        });
    }
    /**
     * Find bookings by user ID
     */
    static async findByUserId(userId, options) {
        const where = { userId };
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
    static async findByTicketId(ticketId) {
        return await prisma.booking.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Find bookings by group ID
     */
    static async findByGroupId(groupId, options) {
        const where = { groupId };
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
    static async update(id, data) {
        return await prisma.booking.update({
            where: { id },
            data: data,
        });
    }
    /**
     * Update booking by Razorpay order ID
     */
    static async updateByRazorpayOrderId(razorpayOrderId, data) {
        return await prisma.booking.update({
            where: { razorpayOrderId },
            data: data,
        });
    }
    static async cancel(id, cancellationReason) {
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
    static async getUserCancellationStats(userId) {
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
    static async getGroupStatistics(groupId) {
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
    static async getTicketStatistics(ticketId) {
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
    static async countBookedTickets(ticketId, ticketType) {
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
    static async findOne(filter) {
        if (filter.bookingStatus?.$in) {
            filter.bookingStatus = {
                in: filter.bookingStatus.$in
            };
        }
        return await prisma.booking.findFirst({
            where: filter,
        });
    }
    static async verify(id, verifiedBy) {
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
//# sourceMappingURL=booking.model.js.map