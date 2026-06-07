export declare enum SettlementStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
interface CreateSettlementData {
    bookingId: string;
    organizationAmount: number;
    platformFee: number;
    status?: SettlementStatus;
    bankDetails: {
        bank_acc_holder: string;
        bank_acc_no: string;
        bank_ifsc: string;
        bank_acc_type: string;
    };
}
interface UpdateSettlementData {
    organizationAmount?: number;
    platformFee?: number;
    status?: SettlementStatus;
    razorpayPayoutId?: string;
    processedAt?: Date;
}
interface SettlementWhereInput {
    id?: string;
    bookingId?: string;
    status?: SettlementStatus | {
        in: SettlementStatus[];
    };
    createdAt?: {
        gte?: Date;
        lte?: Date;
    };
}
interface SettlementOrderByInput {
    createdAt?: 'asc' | 'desc';
    updatedAt?: 'asc' | 'desc';
    organizationAmount?: 'asc' | 'desc';
    platformFee?: 'asc' | 'desc';
}
export declare class SettlementModel {
    /**
     * Create a new settlement record
     */
    static create(data: CreateSettlementData): Promise<{
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
     * Find settlement by ID
     */
    static findById(id: string): Promise<{
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
     * Find settlement by booking ID
     * Using findFirst instead of findUnique since bookingId might not be unique in Prisma's eyes
     */
    static findByBookingId(bookingId: string): Promise<{
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
     * Update settlement
     */
    static update(id: string, data: UpdateSettlementData): Promise<{
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
     * Get all settlements with filters
     */
    static findMany(where?: SettlementWhereInput, orderBy?: SettlementOrderByInput): Promise<{
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
     * Get settlements by status
     */
    static findByStatus(status: SettlementStatus): Promise<{
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
     * Get settlements for date range
     */
    static findByDateRange(startDate: Date, endDate: Date): Promise<{
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
     * Aggregate settlements
     */
    static aggregate(where?: SettlementWhereInput): Promise<import("../generated/prisma").Prisma.GetSettlementAggregateType<{
        where: any;
        _sum: {
            organizationAmount: true;
            platformFee: true;
        };
        _count: true;
    }>>;
    /**
     * Delete settlement (rarely used)
     */
    static delete(id: string): Promise<{
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
     * Get pending settlements count
     */
    static getPendingCount(): Promise<number>;
    /**
     * Get total platform earnings
     */
    static getTotalPlatformFee(status?: SettlementStatus[]): Promise<0 | import("../generated/prisma/runtime/library").Decimal>;
    /**
     * Get total organization amount
     */
    static getTotalOrganizationAmount(status?: SettlementStatus[]): Promise<0 | import("../generated/prisma/runtime/library").Decimal>;
    /**
     * Check if settlement exists for booking
     */
    static existsForBooking(bookingId: string): Promise<boolean>;
    /**
     * Get settlements by multiple booking IDs
     */
    static findByBookingIds(bookingIds: string[]): Promise<{
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
     * Get settlement statistics by status
     */
    static getStatsByStatus(): Promise<(import("../generated/prisma").Prisma.PickEnumerable<import("../generated/prisma").Prisma.SettlementGroupByOutputType, "status"[]> & {
        _count: number;
        _sum: {
            organizationAmount: import("../generated/prisma/runtime/library").Decimal | null;
            platformFee: import("../generated/prisma/runtime/library").Decimal | null;
        };
    })[]>;
}
export default SettlementModel;
//# sourceMappingURL=settlement.model.d.ts.map