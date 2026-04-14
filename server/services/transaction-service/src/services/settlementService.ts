import { prisma } from "../config/db";
import RazorpayService from "../config/razorpay";
import { SettlementModel } from "../models/settlement.model";
import { BookingModel } from "../models/booking.model";
import { SettlementStatus } from "../models/settlement.model";
import { publishSettlementJobs } from "../utils/settlementPublisher";
import { LedgerModel } from "../models/ledger.model";

interface SettlementData {
  bookingId: string;
  organizationAmount: number;
  platformFee: number;
  bankDetails: {
    bank_acc_holder: string;
    bank_acc_no: string;
    bank_ifsc: string;
    bank_acc_type: string;
  };
}
export class SettlementService {
  static calculateSettlement(
    totalAmount: number,
    platformFeePerTicket: number, // ₹1 flat per ticket
    quantity: number,
  ) {
    const platformFee = platformFeePerTicket * quantity;
    const organizationAmount = totalAmount - platformFee;

    return {
      totalAmount, // ₹201 (user paid)
      platformFee, // ₹1   (wie keeps)
      organizationAmount, // ₹200 (host gets)
    };
  }
  static async createSettlement(data: SettlementData) {
    return await SettlementModel.create({
      bookingId: data.bookingId,
      organizationAmount: data.organizationAmount,
      platformFee: data.platformFee,
      status: SettlementStatus.PENDING,
      bankDetails: data.bankDetails,
    });
  }
  static async processSettlement(settlementId: string) {
    const settlement = await SettlementModel.findById(settlementId);

    if (!settlement) {
      throw new Error("Settlement not found");
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
  static async getPlatformEarnings(startDate?: Date, endDate?: Date) {
    const where: any = {
      status: { in: [SettlementStatus.COMPLETED, SettlementStatus.PROCESSING] },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
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
  static async getOrganizationSettlements(
    groupId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Fetch all settlements for the date range
    const settlements = await SettlementModel.findMany(where);

    // Fetch booking details separately to avoid TypeScript issues
    const settlementWithBookings = await Promise.all(
      settlements.map(async (settlement) => {
        const booking = await BookingModel.findById(settlement.bookingId);
        return {
          settlement,
          booking,
        };
      }),
    );
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

    const totalAmount = orgSettlements.reduce(
      (sum, s) => sum + parseFloat(s.organizationAmount.toString()),
      0,
    );

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
    const settlements = await SettlementModel.findByStatus(
      SettlementStatus.PENDING,
    );
    // Fetch booking details separately
    const settlementsWithBookings = await Promise.all(
      settlements.map(async (settlement) => {
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
      }),
    );
    return settlementsWithBookings;
  }
  /**
   * Get settlement by booking ID
   */
  static async getSettlementByBookingId(bookingId: string) {
    return await SettlementModel.findByBookingId(bookingId);
  }
  /**
   * Get settlement statistics
   */
  static async getSettlementStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      SettlementModel.getPendingCount(),
      prisma.settlement.count({
        where: { status: SettlementStatus.PROCESSING },
      }),
      prisma.settlement.count({
        where: { status: SettlementStatus.COMPLETED },
      }),
      prisma.settlement.count({ where: { status: SettlementStatus.FAILED } }),
    ]);
    const totalPlatformFee = await SettlementModel.getTotalPlatformFee([
      SettlementStatus.COMPLETED,
    ]);
    const totalOrganizationAmount =
      await SettlementModel.getTotalOrganizationAmount([
        SettlementStatus.COMPLETED,
      ]);

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
  /**
   * Create HELD escrow entry (no payout until event completes)
   */
  static async createEscrowEntry(data: {
    bookingId: string; // ✅ string, not number
    ticketId: string;
    groupId: string;
    totalAmount: number;
    organizationAmount: number;
    platformFee: number;
    bankDetails: any;
    status: "HELD";
    host_razorpay_account_id?: string;
  }) {
    return SettlementModel.create({
      bookingId: data.bookingId, // goes through SettlementModel.create (string ✅)
      organizationAmount: data.organizationAmount,
      platformFee: data.platformFee,
      status: SettlementStatus.HELD, // ✅ uses enum, not raw string
      bankDetails: data.bankDetails,
      ticketId: data.ticketId,
      groupId: data.groupId,
      totalAmount: data.totalAmount,
      settlementType: "ESCROW",
      scheduledAt: null,
    });
  }
  // Mark all HELD escrow entries for an event as REFUND_INITIATED
  // This prevents accidental host payout after cancellation
  static async markEscrowAsRefunding(ticketId: string) {
    return prisma.settlement.updateMany({
      where: {
        ticketId,
        status: SettlementStatus.HELD,
      },
      data: {
        status: SettlementStatus.REFUND_INITIATED,
      } as any,
    });
  }

  static async releaseEscrowToHost(ticketId: string) {
    const settlements = await prisma.settlement.findMany({
      where: {
        ticketId,
        status: SettlementStatus.HELD, // ✅ enum value
      },
    });

    for (const settlement of settlements) {
      // TODO: initiate Razorpay payout to host bank account
      // await RazorpayService.createPayout(settlement.bankDetails, settlement.organizationAmount)
      await prisma.settlement.update({
        where: { id: settlement.id },
        data: {
          status: SettlementStatus.COMPLETED,
          processedAt: new Date(),
        },
      });
      // Revenue recognition: platform fee is now WIE's confirmed revenue
      await LedgerModel.recordRevenueRecognition({
        bookingId: settlement.bookingId,
        ticketId: settlement.ticketId!,
        groupId: settlement.groupId!,
        platformFee: parseFloat(settlement.platformFee.toString()),
        referenceId: settlement.id,
      });
    }
  }
  // ─── Phase 5: Process single settlement (called by worker) ───────────────────
  // Uses SELECT FOR UPDATE pattern via Prisma transaction to prevent race conditions
  static async processSettlementJob(settlementId: string): Promise<{
    success: boolean;
    reason?: string;
  }> {
    return await prisma.$transaction(async (tx) => {
      // Step A — Fetch and lock the settlement row
      const settlement = await tx.settlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        return { success: false, reason: "Settlement not found" };
      }

      // Step B — Revalidate: only process PENDING settlements
      if (settlement.status !== "PENDING") {
        return {
          success: false,
          reason: `Settlement is ${settlement.status} — skipping`,
        };
      }

      // Fetch booking to confirm it's still valid
      const booking = await tx.booking.findUnique({
        where: { id: settlement.bookingId },
      });

      if (!booking) {
        return { success: false, reason: "Booking not found" };
      }

      // Guard conditions — all must be true to allow payout
      const isValid =
        booking.bookingStatus === "CONFIRMED" &&
        booking.paymentStatus === "COMPLETED" &&
        booking.refundStatus === null;

      if (!isValid) {
        // Move to HELD — will be re-evaluated
        await tx.settlement.update({
          where: { id: settlementId },
          data: { status: "HELD" as any },
        });
        return {
          success: false,
          reason: `Booking not eligible: status=${booking.bookingStatus} refund=${booking.refundStatus}`,
        };
      }

      // Step C — Mark as PROCESSING atomically
      const updated = await tx.settlement.updateMany({
        where: { id: settlementId, status: "PENDING" },
        data: { status: "PROCESSING" as any },
      });

      if (updated.count === 0) {
        return {
          success: false,
          reason: "Race condition — already being processed",
        };
      }

      return { success: true };
    });
  }

  // ─── Execute Razorpay transfer after validation passes ───────────────────────
  static async executeHostTransfer(settlementId: string): Promise<void> {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });

    if (!settlement || settlement.status !== ("PROCESSING" as any)) {
      throw new Error(`Settlement ${settlementId} not in PROCESSING state`);
    }

    // Get host linked account
    const hostAccount = await prisma.hostLinkedAccount.findUnique({
      where: { group_id: settlement.groupId! }, // ✅ snake_case
    });

    if (!hostAccount || !hostAccount.razorpay_account_id) {
      // No linked account — mark FAILED for manual processing
      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: "FAILED" as any,
          retryCount: { increment: 1 },
        } as any,
      });
      throw new Error(
        `No Razorpay linked account for group ${settlement.groupId}`,
      );
    }

    try {
      // Step D — Transfer to host via Razorpay Route
      const transfer = await RazorpayService.transferToHost({
        razorpayAccountId: hostAccount.razorpay_account_id,
        amount: parseFloat(settlement.organizationAmount.toString()),
        currency: "INR",
        settlementId: settlementId,
        bookingId: settlement.bookingId,
      });

      // Step E — Mark COMPLETED + record in ledger
      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: "COMPLETED" as any,
          razorpayPayoutId: transfer.id,
          razorpayTransferId: transfer.id,
          processedAt: new Date(),
        } as any,
      });

      await LedgerModel.recordSettlement({
        bookingId: settlement.bookingId,
        ticketId: settlement.ticketId!,
        groupId: settlement.groupId!,
        hostAmount: parseFloat(settlement.organizationAmount.toString()),
        transferId: transfer.id,
      });
    } catch (err: any) {
      // Step F — Retry logic
      const retryCount = (settlement as any).retryCount || 0;
      const newStatus = retryCount >= 2 ? "FAILED" : "PENDING";

      await prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: newStatus as any,
          retryCount: retryCount + 1,
        } as any,
      });

      throw new Error(
        `Transfer failed (attempt ${retryCount + 1}): ${err.message}`,
      );
    }
  }

  //  Handle post-settlement refund (Case 3: refund after payout)
  static async handlePostSettlementRefund(data: {
    bookingId: string;
    ticketId: string;
    groupId: string;
    refundAmount: number;
    settlementId: string;
    transferId: string;
  }): Promise<void> {
    // Try reversal first (only works if host hasn't withdrawn)
    try {
      await RazorpayService.reverseTransfer(data.transferId, data.refundAmount);

      await prisma.settlement.update({
        where: { id: data.settlementId },
        data: { status: "REFUND_INITIATED" as any } as any,
      });
      return;
    } catch {
      // Reversal failed — host likely withdrew. Use adjustment model instead.
      console.warn(
        `⚠️ Reversal failed — creating host adjustment for group ${data.groupId}`,
      );
    }

    await prisma.hostAdjustment.create({
      data: {
        group_id: data.groupId,
        booking_id: data.bookingId,
        settlement_id: data.settlementId,
        adjustment_amount: data.refundAmount,
        reason: `Refund after settlement — booking ${data.bookingId}`,
        status: "PENDING",
      },
    });

    await LedgerModel.recordAdjustment({
      bookingId: data.bookingId,
      ticketId: data.ticketId,
      groupId: data.groupId,
      amount: data.refundAmount,
      reason: `Post-settlement refund adjustment`,
    });
  }

  //  Get pending host adjustments (deducted from next payout)
  static async getPendingAdjustments(groupId: string): Promise<number> {
    const result = await prisma.hostAdjustment.aggregate({
      where: { group_id: groupId, status: "PENDING" },
      _sum: { adjustment_amount: true },
    });
    return parseFloat((result._sum?.adjustment_amount || 0).toString());
  }

  //  Trigger settlements for completed event
  static async triggerEventSettlements(ticketId: string): Promise<{
    queued: number;
    reserved: number;
  }> {
    const settlements = await prisma.settlement.findMany({
      where: { ticketId, status: "PENDING" as any },
    });
    // Refund Reserve: withhold 7.5% of each settlement
    // Settle only 92.5% now; release reserve after refund window closes
    const RESERVE_RATE = 0.075;

    const jobs = settlements.map((s) => {
      const fullAmount = parseFloat(s.organizationAmount.toString());
      const reserveAmount = parseFloat((fullAmount * RESERVE_RATE).toFixed(2));
      const payoutAmount = parseFloat((fullAmount - reserveAmount).toFixed(2));

      return {
        settlementId: s.id,
        bookingId: s.bookingId,
        groupId: s.groupId!,
        hostAmount: payoutAmount, // pay 92.5% now
        reserveAmount, // hold 7.5% for refund safety
      };
    });

    const totalReserved = jobs.reduce((sum, j) => sum + j.reserveAmount, 0);

    await publishSettlementJobs(jobs);

    return { queued: settlements.length, reserved: totalReserved };
  }
}
export default SettlementService;
