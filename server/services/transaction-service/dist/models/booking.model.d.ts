import { Booking, BookingStatus, PaymentStatus } from '../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';
export interface CreateBookingData {
    bookingId: string;
    userId: string;
    ticketId: string;
    groupId: string;
    ticketType: string;
    quantity: number;
    pricePerTicket: number;
    subtotal: number;
    tax: number;
    platformFee: number;
    totalAmount: number;
    currency?: string;
    userDetails: {
        name: string;
        email: string;
        phone: string;
    };
    eventDetails: {
        eventName: string;
        eventDate: string;
        eventTime?: string;
        venue?: string;
        location?: string;
        settlementBankDetails?: {
            bank_acc_holder: string;
            bank_acc_no: string;
            bank_ifsc: string;
            bank_acc_type: string;
        };
        groupName?: string;
    };
    paymentStatus?: PaymentStatus;
    bookingStatus?: BookingStatus;
}
export interface UpdateBookingData {
    paymentStatus?: PaymentStatus;
    bookingStatus?: BookingStatus;
    paymentMethod?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    qrCode?: string;
    isVerified?: boolean;
    verifiedAt?: Date;
    verifiedBy?: string;
    cancellationCount?: number;
    cancellationReason?: string;
    cancelledAt?: Date;
    refundAmount?: number | Decimal;
    refundStatus?: string;
    refundProcessedAt?: Date;
}
export declare class BookingModel {
    static create(data: CreateBookingData): Promise<Booking>;
    /**
     * Find booking by ID
     */
    static findById(id: string): Promise<Booking | null>;
    /**
     * Find booking by booking ID
     */
    static findByBookingId(bookingId: string): Promise<Booking | null>;
    /**
     * Find booking by Razorpay order ID
     */
    static findByRazorpayOrderId(razorpayOrderId: string): Promise<Booking | null>;
    /**
     * Find bookings by user ID
     */
    static findByUserId(userId: string, options?: {
        status?: BookingStatus;
        limit?: number;
        skip?: number;
    }): Promise<{
        bookings: Booking[];
        total: number;
    }>;
    /**
     * Find bookings by ticket ID
     */
    static findByTicketId(ticketId: string): Promise<Booking[]>;
    /**
     * Find bookings by group ID
     */
    static findByGroupId(groupId: string, options?: {
        ticketId?: string;
        status?: BookingStatus;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        skip?: number;
    }): Promise<{
        bookings: Booking[];
        total: number;
    }>;
    static update(id: string, data: UpdateBookingData): Promise<Booking>;
    /**
     * Update booking by Razorpay order ID
     */
    static updateByRazorpayOrderId(razorpayOrderId: string, data: UpdateBookingData): Promise<Booking>;
    static cancel(id: string, cancellationReason: string): Promise<Booking>;
    /**
     * Get user's total cancellation count
     */
    static getUserCancellationStats(userId: string): Promise<{
        totalCancellations: number;
        totalCancelledTickets: number;
    }>;
    /**
     * Get booking statistics for a group
     */
    static getGroupStatistics(groupId: string): Promise<import("../generated/prisma").Prisma.GetBookingAggregateType<{
        where: {
            groupId: string;
            bookingStatus: "CONFIRMED";
        };
        _sum: {
            totalAmount: true;
            quantity: true;
        };
        _count: true;
    }>>;
    /**
     * Get booking statistics for a ticket
     */
    static getTicketStatistics(ticketId: string): Promise<(import("../generated/prisma").Prisma.PickEnumerable<import("../generated/prisma").Prisma.BookingGroupByOutputType, "bookingStatus"[]> & {
        _count: number;
        _sum: {
            totalAmount: import("../generated/prisma/runtime/library").Decimal | null;
            quantity: number | null;
        };
    })[]>;
    /**
     * Count booked tickets for a specific ticket type
     */
    static countBookedTickets(ticketId: string, ticketType: string): Promise<number>;
    static findOne(filter: any): Promise<any>;
    static verify(id: string, verifiedBy: string): Promise<Booking>;
}
export default BookingModel;
//# sourceMappingURL=booking.model.d.ts.map