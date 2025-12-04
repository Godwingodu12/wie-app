import { sendRPC } from '../rabbit/producer';

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

export const getTicketById = async (ticketId: string): Promise<TicketData> => {
  try {
    console.log(`📤 Fetching ticket from ticket-service: ${ticketId}`);
    const response = await sendRPC<TicketData>(
      'get-ticket-by-id',
      { ticketId },
      10000
    );

    if (!response || (response as any).error) {
      throw new Error((response as any).error || 'Ticket not found');
    }

    return response;
  } catch (error: any) {
    console.error('❌ Error fetching ticket:', error.message);
    throw error;
  }
};

export const getGroupById = async (groupId: string): Promise<GroupData> => {
  try {
    console.log(`📤 Fetching group from ticket-service: ${groupId}`);
    const response = await sendRPC<GroupData>(
      'get-group-by-id',
      { groupId },
      10000
    );

    if (!response || (response as any).error) {
      throw new Error((response as any).error || 'Group not found');
    }

    return response;
  } catch (error: any) {
    console.error('❌ Error fetching group:', error.message);
    throw error;
  }
};
export const updateTicketStats = async (
  ticketId: string,
  statType: 'like' | 'share' | 'totalBookings' | 'totalTicketsSold' | 'revenue',
  increment: number
): Promise<void> => {
  try {
    console.log(`📤 Updating ticket stats: ${statType} by ${increment}`);
    await sendRPC(
      'update-ticket-stats',  // ✅ Correct queue name
      { ticketId, statType, increment },  // ✅ Correct parameter names
      5000
    );
  } catch (error: any) {
    console.error('❌ Error updating ticket stats:', error.message);
    // Don't throw - stats update is not critical
  }
};
export const getTicketStats = async (ticketId: string): Promise<any> => {
  try {
    console.log(`📤 Fetching ticket stats: ${ticketId}`);
    const response = await sendRPC(
      'get-ticket-stats',
      { ticketId },
      5000
    );

    return response;
  } catch (error: any) {
    console.error('❌ Error fetching ticket stats:', error.message);
    throw error;
  }
};
