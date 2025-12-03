interface TicketData {
    _id: string;
    event_name: string;
    event_category: string;
    event_dates: Array<{
        start_date: string;
        end_date?: string;
        start_time?: string;
        end_time?: string;
    }>;
    location?: string;
    venue?: string;
    ticket_types: Array<{
        _id: string;
        ticket_type: string;
        ticket_price: number;
        max_capacity: number;
    }>;
    banking_details: Array<{
        bank_acc_holder: string;
        bank_acc_no: string;
        bank_ifsc: string;
        bank_acc_type: string;
    }>;
    groupId: string;
    payment_type: 'free' | 'paid';
    razorpayEnabled?: boolean;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
}
interface GroupData {
    _id: string;
    name: string;
    email: string;
    contact_no: string;
    razorpayAccountId?: string;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    razorpayEnabled?: boolean;
    primary_bank_acc_holder?: string;
    primary_bank_acc_no?: string;
    primary_bank_ifsc?: string;
    primary_bank_acc_type?: string;
}
export declare const getTicketById: (ticketId: string) => Promise<TicketData>;
export declare const getGroupById: (groupId: string) => Promise<GroupData>;
export declare const updateTicketStats: (ticketId: string, statType: "like" | "share" | "totalBookings" | "totalTicketsSold" | "revenue", increment: number) => Promise<void>;
export declare const getTicketStats: (ticketId: string) => Promise<any>;
export {};
//# sourceMappingURL=ticketServiceClient.d.ts.map