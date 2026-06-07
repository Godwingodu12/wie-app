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
export declare class SettlementService {
    static calculateSettlement(totalAmount: number, platformFeePerTicket: number, quantity: number): {
        totalAmount: number;
        platformFee: number;
        organizationAmount: number;
    };
    static createSettlement(data: SettlementData): Promise<{
        id: string;
        bookingId: string;
        platformFee: import("../generated/prisma/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        organizationAmount: import("../generated/prisma/runtime/library").Decimal;
        status: import("../generated/prisma").$Enums.SettlementStatus;
        bankDetails: import("../generated/prisma/runtime/library").JsonValue;
        razorpayPayoutId: string | null;
        processedAt: Date | null;
    }>;
    static processSettlement(settlementId: string): Promise<{
        id: string;
        bookingId: string;
        platformFee: import("../generated/prisma/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        organizationAmount: import("../generated/prisma/runtime/library").Decimal;
        status: import("../generated/prisma").$Enums.SettlementStatus;
        bankDetails: import("../generated/prisma/runtime/library").JsonValue;
        razorpayPayoutId: string | null;
        processedAt: Date | null;
    }>;
    /**
     * Get platform earnings (total platform fees collected)
     */
    static getPlatformEarnings(startDate?: Date, endDate?: Date): Promise<{
        totalPlatformFee: number | import("../generated/prisma/runtime/library").Decimal;
        totalOrganizationAmount: number | import("../generated/prisma/runtime/library").Decimal;
        totalSettlements: number;
    }>;
    /**
     * Get settlements for a specific organization (by groupId or bookings)
     * Organizations should NOT see platform fee details
     */
    static getOrganizationSettlements(groupId: string, startDate?: Date, endDate?: Date): Promise<{
        settlements: {
            id: string;
            bookingId: string;
            organizationAmount: import("../generated/prisma/runtime/library").Decimal;
            status: import("../generated/prisma").$Enums.SettlementStatus;
            bankDetails: import("../generated/prisma/runtime/library").JsonValue;
            processedAt: Date | null;
            createdAt: Date;
            eventDetails: import("../generated/prisma/runtime/library").JsonValue | undefined;
            bookingDetails: {
                bookingId: string | undefined;
                quantity: number | undefined;
            };
        }[];
        totalAmount: number;
        count: number;
    }>;
    /**
     * Get pending settlements (for admin dashboard)
     */
    static getPendingSettlements(): Promise<{
        booking: {
            bookingId: string;
            eventDetails: import("../generated/prisma/runtime/library").JsonValue;
            userDetails: import("../generated/prisma/runtime/library").JsonValue;
            groupId: string;
            quantity: number;
        } | null;
        id: string;
        bookingId: string;
        platformFee: import("../generated/prisma/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        organizationAmount: import("../generated/prisma/runtime/library").Decimal;
        status: import("../generated/prisma").$Enums.SettlementStatus;
        bankDetails: import("../generated/prisma/runtime/library").JsonValue;
        razorpayPayoutId: string | null;
        processedAt: Date | null;
    }[]>;
    /**
     * Get settlement by booking ID
     */
    static getSettlementByBookingId(bookingId: string): Promise<{
        id: string;
        bookingId: string;
        platformFee: import("../generated/prisma/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        organizationAmount: import("../generated/prisma/runtime/library").Decimal;
        status: import("../generated/prisma").$Enums.SettlementStatus;
        bankDetails: import("../generated/prisma/runtime/library").JsonValue;
        razorpayPayoutId: string | null;
        processedAt: Date | null;
    } | null>;
    /**
     * Get settlement statistics
     */
    static getSettlementStats(): Promise<{
        counts: {
            pending: number;
            processing: number;
            completed: number;
            failed: number;
            total: number;
        };
        amounts: {
            totalPlatformFee: number | import("../generated/prisma/runtime/library").Decimal;
            totalOrganizationAmount: number | import("../generated/prisma/runtime/library").Decimal;
            grandTotal: number;
        };
    }>;
}
export default SettlementService;
//# sourceMappingURL=settlementService.d.ts.map