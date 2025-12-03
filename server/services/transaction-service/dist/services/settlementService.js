import { prisma } from '../config/db';
import { SettlementModel } from '../models/settlement.model';
import { BookingModel } from '../models/booking.model';
import { SettlementStatus } from '../models/settlement.model';
export class SettlementService {
    static calculateSettlement(totalAmount, platformFeePerTicket, quantity) {
        const platformFee = platformFeePerTicket * quantity;
        const organizationAmount = totalAmount - platformFee;
        return {
            totalAmount,
            platformFee,
            organizationAmount,
        };
    }
    static async createSettlement(data) {
        return await SettlementModel.create({
            bookingId: data.bookingId,
            organizationAmount: data.organizationAmount,
            platformFee: data.platformFee,
            status: SettlementStatus.PENDING,
            bankDetails: data.bankDetails,
        });
    }
    static async processSettlement(settlementId) {
        const settlement = await SettlementModel.findById(settlementId);
        if (!settlement) {
            throw new Error('Settlement not found');
        }
        // TODO: Implement Razorpay Payout API
        // const razorpay = RazorpayService.getInstance(
        //   process.env.RAZORPAY_KEY_ID!,
        //   process.env.RAZORPAY_KEY_SECRET!
        // );
        // const payout = await razorpay.payouts.create({
        //   account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        //   fund_account_id: 'fa_...',
        //   amount: settlement.organizationAmount * 100,
        //   currency: 'INR',
        //   mode: 'IMPS',
        //   purpose: 'payout',
        //   queue_if_low_balance: true,
        // });
        return await SettlementModel.update(settlementId, {
            status: SettlementStatus.PROCESSING,
            // razorpayPayoutId: payout.id,
        });
    }
    /**
     * Get platform earnings (total platform fees collected)
     */
    static async getPlatformEarnings(startDate, endDate) {
        const where = {
            status: { in: [SettlementStatus.COMPLETED, SettlementStatus.PROCESSING] },
        };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        const result = await SettlementModel.aggregate(where);
        return {
            totalPlatformFee: result._sum.platformFee || 0,
            totalOrganizationAmount: result._sum.organizationAmount || 0,
            totalSettlements: result._count,
        };
    }
    /**
     * Get settlements for a specific organization (by groupId or bookings)
     * Organizations should NOT see platform fee details
     */
    static async getOrganizationSettlements(groupId, startDate, endDate) {
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
        }
        // Fetch all settlements for the date range
        const settlements = await SettlementModel.findMany(where);
        // Fetch booking details separately to avoid TypeScript issues
        const settlementWithBookings = await Promise.all(settlements.map(async (settlement) => {
            const booking = await BookingModel.findById(settlement.bookingId);
            return {
                settlement,
                booking,
            };
        }));
        // Filter by groupId and exclude platform fee details
        const orgSettlements = settlementWithBookings
            .filter(({ booking }) => booking && booking.groupId === groupId)
            .map(({ settlement, booking }) => ({
            id: settlement.id,
            bookingId: settlement.bookingId,
            organizationAmount: settlement.organizationAmount,
            status: settlement.status,
            bankDetails: settlement.bankDetails,
            processedAt: settlement.processedAt,
            createdAt: settlement.createdAt,
            eventDetails: booking?.eventDetails,
            bookingDetails: {
                bookingId: booking?.bookingId,
                quantity: booking?.quantity,
            },
            // ❌ Do NOT include platformFee for organizations
        }));
        const totalAmount = orgSettlements.reduce((sum, s) => sum + parseFloat(s.organizationAmount.toString()), 0);
        return {
            settlements: orgSettlements,
            totalAmount,
            count: orgSettlements.length,
        };
    }
    /**
     * Get pending settlements (for admin dashboard)
     */
    static async getPendingSettlements() {
        const settlements = await SettlementModel.findByStatus(SettlementStatus.PENDING);
        // Fetch booking details separately
        const settlementsWithBookings = await Promise.all(settlements.map(async (settlement) => {
            const booking = await BookingModel.findById(settlement.bookingId);
            return {
                ...settlement,
                booking: booking
                    ? {
                        bookingId: booking.bookingId,
                        eventDetails: booking.eventDetails,
                        userDetails: booking.userDetails,
                        groupId: booking.groupId,
                        quantity: booking.quantity,
                    }
                    : null,
            };
        }));
        return settlementsWithBookings;
    }
    /**
     * Get settlement by booking ID
     */
    static async getSettlementByBookingId(bookingId) {
        return await SettlementModel.findByBookingId(bookingId);
    }
    /**
     * Get settlement statistics
     */
    static async getSettlementStats() {
        const [pending, processing, completed, failed] = await Promise.all([
            SettlementModel.getPendingCount(),
            prisma.settlement.count({ where: { status: SettlementStatus.PROCESSING } }),
            prisma.settlement.count({ where: { status: SettlementStatus.COMPLETED } }),
            prisma.settlement.count({ where: { status: SettlementStatus.FAILED } }),
        ]);
        const totalPlatformFee = await SettlementModel.getTotalPlatformFee([SettlementStatus.COMPLETED]);
        const totalOrganizationAmount = await SettlementModel.getTotalOrganizationAmount([SettlementStatus.COMPLETED]);
        return {
            counts: {
                pending,
                processing,
                completed,
                failed,
                total: pending + processing + completed + failed,
            },
            amounts: {
                totalPlatformFee,
                totalOrganizationAmount,
                grandTotal: Number(totalPlatformFee) + Number(totalOrganizationAmount),
            },
        };
    }
}
export default SettlementService;
//# sourceMappingURL=settlementService.js.map