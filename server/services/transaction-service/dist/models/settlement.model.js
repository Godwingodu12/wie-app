import { prisma } from '../config/db';
export var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "PENDING";
    SettlementStatus["PROCESSING"] = "PROCESSING";
    SettlementStatus["COMPLETED"] = "COMPLETED";
    SettlementStatus["FAILED"] = "FAILED";
})(SettlementStatus || (SettlementStatus = {}));
export class SettlementModel {
    /**
     * Create a new settlement record
     */
    static async create(data) {
        return await prisma.settlement.create({
            data: {
                bookingId: data.bookingId,
                organizationAmount: data.organizationAmount,
                platformFee: data.platformFee,
                status: data.status || 'PENDING',
                bankDetails: data.bankDetails,
            },
        });
    }
    /**
     * Find settlement by ID
     */
    static async findById(id) {
        return await prisma.settlement.findUnique({
            where: { id },
        });
    }
    /**
     * Find settlement by booking ID
     * Using findFirst instead of findUnique since bookingId might not be unique in Prisma's eyes
     */
    static async findByBookingId(bookingId) {
        return await prisma.settlement.findFirst({
            where: { bookingId },
        });
    }
    /**
     * Update settlement
     */
    static async update(id, data) {
        return await prisma.settlement.update({
            where: { id },
            data,
        });
    }
    /**
     * Get all settlements with filters
     */
    static async findMany(where, orderBy) {
        return await prisma.settlement.findMany({
            where: where,
            orderBy: orderBy,
        });
    }
    /**
     * Get settlements by status
     */
    static async findByStatus(status) {
        return await prisma.settlement.findMany({
            where: { status },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Get settlements for date range
     */
    static async findByDateRange(startDate, endDate) {
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
    static async aggregate(where) {
        return await prisma.settlement.aggregate({
            where: where,
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
    static async delete(id) {
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
    static async getTotalPlatformFee(status) {
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
    static async getTotalOrganizationAmount(status) {
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
    static async existsForBooking(bookingId) {
        const count = await prisma.settlement.count({
            where: { bookingId },
        });
        return count > 0;
    }
    /**
     * Get settlements by multiple booking IDs
     */
    static async findByBookingIds(bookingIds) {
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
//# sourceMappingURL=settlement.model.js.map