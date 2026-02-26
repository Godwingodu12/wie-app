import { prisma } from '../config/db';

export class LedgerModel {
  //  Record a payment received
  static async recordPayment(data: {
    bookingId:   string;
    ticketId:    string;
    groupId:     string;
    totalAmount: number;
    platformFee: number;
    hostAmount:  number;
    referenceId: string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id:   data.bookingId,    
        ticket_id:    data.ticketId,     
        group_id:     data.groupId,     
        type:         'PAYMENT',
        credit:       data.totalAmount,
        debit:        null,
        balance:      data.totalAmount,
        reference_id: data.referenceId,  
        description:  `Payment received: platform ₹${data.platformFee} + host ₹${data.hostAmount}`,
        status:       'completed',
      },
    });
  }

  // Record a refund
  static async recordRefund(data: {
    bookingId:   string;
    ticketId:    string;
    groupId:     string;
    amount:      number;
    referenceId: string;
    reason:      string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id:   data.bookingId,
        ticket_id:    data.ticketId,
        group_id:     data.groupId,
        type:         'REFUND',
        debit:        data.amount,
        credit:       null,
        balance:      -data.amount,
        reference_id: data.referenceId,
        description:  `Refund: ${data.reason}`,
        status:       'completed',
      },
    });
  }

  // Record settlement to host
  static async recordSettlement(data: {
    bookingId:  string;
    ticketId:   string;
    groupId:    string;
    hostAmount: number;
    transferId: string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id:   data.bookingId,
        ticket_id:    data.ticketId,
        group_id:     data.groupId,
        type:         'SETTLEMENT',
        debit:        data.hostAmount,
        credit:       null,
        balance:      -data.hostAmount,
        reference_id: data.transferId,
        description:  `Settlement to host: ₹${data.hostAmount}`,
        status:       'completed',
      },
    });
  }

  // Record host adjustment (post-settlement refund)
  static async recordAdjustment(data: {
    bookingId: string;
    ticketId:  string;
    groupId:   string;
    amount:    number;
    reason:    string;
  }) {
    return prisma.ledger.create({
      data: {
        booking_id:  data.bookingId,
        ticket_id:   data.ticketId,
        group_id:    data.groupId,
        type:        'ADJUSTMENT',
        debit:       data.amount,
        credit:      null,
        balance:     -data.amount,
        description: `Host adjustment: ${data.reason}`,
        status:      'pending',
      },
    });
  }
}