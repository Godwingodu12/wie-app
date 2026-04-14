import { prisma } from "../config/db";

export class LedgerModel {
  static async recordPayment(data: {
    bookingId: string;
    ticketId: string;
    groupId: string;
    totalAmount: number;
    platformFee: number;
    hostAmount: number;
    referenceId: string;
    convenienceFee?: number;
    platformGst?: number;
    organizerGst?: number;
  }) {
    // Double-entry: 3 atomic ledger rows per payment
    return prisma.$transaction([
      // Entry 1: Total received (credit)
      prisma.ledger.create({
        data: {
          booking_id: data.bookingId,
          ticket_id: data.ticketId,
          group_id: data.groupId,
          type: "PAYMENT",
          credit: data.totalAmount,
          debit: null,
          balance: data.totalAmount,
          reference_id: data.referenceId,
          description: `Payment received — total ₹${data.totalAmount}`,
          status: "completed",
        },
      }),
      // Entry 2: Platform fee allocation (debit from pool → WIE)
      prisma.ledger.create({
        data: {
          booking_id: data.bookingId,
          ticket_id: data.ticketId,
          group_id: data.groupId,
          type: "PLATFORM_FEE",
          credit: null,
          debit: data.platformFee,
          balance: -data.platformFee,
          reference_id: data.referenceId,
          description: `Platform fee ₹${data.platformFee} (WIE revenue)`,
          status: "completed",
        },
      }),
      // Entry 3: Host allocation (debit from pool → escrow for host)
      prisma.ledger.create({
        data: {
          booking_id: data.bookingId,
          ticket_id: data.ticketId,
          group_id: data.groupId,
          type: "HOST_HOLD",
          credit: null,
          debit: data.hostAmount,
          balance: -data.hostAmount,
          reference_id: data.referenceId,
          description: `Host share ₹${data.hostAmount} held in escrow`,
          status: "completed",
        },
      }),
    ]);
  }

  // Record a refund
  static async recordRefund(data: {
    bookingId: string;
    ticketId: string;
    groupId: string;
    amount: number;
    referenceId: string;
    reason: string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id: data.bookingId,
        ticket_id: data.ticketId,
        group_id: data.groupId,
        type: "REFUND",
        debit: data.amount,
        credit: null,
        balance: -data.amount,
        reference_id: data.referenceId,
        description: `Refund: ${data.reason}`,
        status: "completed",
      },
    });
  }

  // Record settlement to host
  static async recordSettlement(data: {
    bookingId: string;
    ticketId: string;
    groupId: string;
    hostAmount: number;
    transferId: string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id: data.bookingId,
        ticket_id: data.ticketId,
        group_id: data.groupId,
        type: "SETTLEMENT",
        debit: data.hostAmount,
        credit: null,
        balance: -data.hostAmount,
        reference_id: data.transferId,
        description: `Settlement to host: ₹${data.hostAmount}`,
        status: "completed",
      },
    });
  }

  // Record host adjustment (post-settlement refund)
  static async recordAdjustment(data: {
    bookingId: string;
    ticketId: string;
    groupId: string;
    amount: number;
    reason: string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id: data.bookingId,
        ticket_id: data.ticketId,
        group_id: data.groupId,
        type: "ADJUSTMENT",
        debit: data.amount,
        credit: null,
        balance: -data.amount,
        description: `Host adjustment: ${data.reason}`,
        status: "pending",
      },
    });
  }
  /**
   * Revenue recognition: only platform fee counts as WIE revenue,
   * and only AFTER event completes or refund window expires.
   */
  static async recordRevenueRecognition(data: {
    bookingId: string;
    ticketId: string;
    groupId: string;
    platformFee: number;
    referenceId: string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id: data.bookingId,
        ticket_id: data.ticketId,
        group_id: data.groupId,
        type: "REVENUE_RECOGNIZED",
        credit: data.platformFee,
        debit: null,
        balance: data.platformFee,
        reference_id: data.referenceId,
        description: `Revenue recognized: platform fee ₹${data.platformFee}`,
        status: "completed",
      },
    });
  }
}
