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
    webhookData?: any;
    errorCode?: string;
    errorDescription?: string;
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
}
export declare class PaymentTransactionModel {
    /**
     * Create payment transaction
     */
    static create(data: CreatePaymentTransactionData): Promise<PaymentTransaction>;
    /**
     * Find by ID
     */
    static findById(id: string): Promise<PaymentTransaction | null>;
    /**
     * Find by Razorpay order ID
     */
    static findByRazorpayOrderId(razorpayOrderId: string): Promise<PaymentTransaction | null>;
    /**
     * Find by Razorpay payment ID
     */
    static findByRazorpayPaymentId(razorpayPaymentId: string): Promise<PaymentTransaction | null>;
    /**
     * Find by booking ID
     */
    static findByBookingId(bookingId: string): Promise<PaymentTransaction[]>;
    /**
     * Update transaction
     */
    static update(id: string, data: UpdatePaymentTransactionData): Promise<PaymentTransaction>;
    /**
     * Update by Razorpay order ID
     */
    static updateByRazorpayOrderId(razorpayOrderId: string, data: UpdatePaymentTransactionData): Promise<number>;
    /**
     * Get payment statistics
     */
    static getStatistics(options?: {
        bookingId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<(import("../generated/prisma").Prisma.PickEnumerable<import("../generated/prisma").Prisma.PaymentTransactionGroupByOutputType, "status"[]> & {
        _count: number;
        _sum: {
            amount: import("../generated/prisma/runtime/library").Decimal | null;
        };
    })[]>;
    /**
     * Get payment methods breakdown
     */
    static getPaymentMethodsBreakdown(options?: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<(import("../generated/prisma").Prisma.PickEnumerable<import("../generated/prisma").Prisma.PaymentTransactionGroupByOutputType, "method"[]> & {
        _count: number;
        _sum: {
            amount: import("../generated/prisma/runtime/library").Decimal | null;
        };
    })[]>;
}
export default PaymentTransactionModel;
//# sourceMappingURL=paymentTransaction.model.d.ts.map