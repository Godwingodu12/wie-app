import { sendRPC } from './producer';
export interface Booking {
  id: string;
  bookingId: string;
  userId: string;
  ticketId: string;
  groupId: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  bookingStatus: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Interaction {
  id: string;
  userId: string;
  ticketId: string;
  interactionType: 'LIKE' | 'SHARE' | 'VIEW' | 'SAVE';
  createdAt: Date;
}

export interface EventStats {
  likes: number;
  shares: number;
  views: number;
  saves: number;
}

/**
 * Get user's bookings
 */
export const getUserBookings = async (
  userId: string,
  limit: number = 50
): Promise<{ bookings: Booking[]; count: number }> => {
  try {
    const response = await sendRPC<any>(
      'get-user-bookings',
      { userId, limit },
      10000
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch bookings');
    }
    
    return {
      bookings: response.bookings,
      count: response.count,
    };
  } catch (error: any) {
    console.error('❌ Error fetching user bookings:', error.message);
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
};

/**
 * Get user's interactions (likes, shares, saves)
 */
export const getUserInteractions = async (
  userId: string,
  type?: 'LIKE' | 'SHARE' | 'VIEW' | 'SAVE',
  limit: number = 50
): Promise<{ interactions: Interaction[]; count: number }> => {
  try {
    const response = await sendRPC<any>(
      'get-user-interactions',
      { userId, type, limit },
      10000
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch interactions');
    }
    
    return {
      interactions: response.interactions,
      count: response.count,
    };
  } catch (error: any) {
    console.error('❌ Error fetching user interactions:', error.message);
    throw new Error(`Failed to fetch interactions: ${error.message}`);
  }
};

/**
 * Get event statistics (likes, shares, views, saves)
 */
export const getEventStatistics = async (
  ticketId: string
): Promise<EventStats> => {
  try {
    const response = await sendRPC<any>(
      'get-event-statistics',
      { ticketId },
      10000
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch event stats');
    }
    
    return response.stats;
  } catch (error: any) {
    console.error('❌ Error fetching event statistics:', error.message);
    throw new Error(`Failed to fetch event statistics: ${error.message}`);
  }
};

/**
 * Get ticket booking statistics
 */
export const getTicketBookingStats = async (ticketId: string): Promise<{
  totalBookings: number;
  totalRevenue: number;
  totalTicketsSold: number;
}> => {
  try {
    const response = await sendRPC<any>(
      'get-ticket-booking-stats',
      { ticketId },
      10000
    );
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch booking stats');
    }
    
    return {
      totalBookings: response.totalBookings,
      totalRevenue: response.totalRevenue,
      totalTicketsSold: response.totalTicketsSold,
    };
  } catch (error: any) {
    console.error('❌ Error fetching ticket booking stats:', error.message);
    throw new Error(`Failed to fetch booking stats: ${error.message}`);
  }
};

/**
 * Check if user liked an event
 */
export const checkUserLikedEvent = async (
  userId: string,
  ticketId: string
): Promise<boolean> => {
  try {
    const response = await sendRPC<any>(
      'check-user-liked-event',
      { userId, ticketId },
      5000
    );
    
    if (!response.success) {
      return false;
    }
    
    return response.isLiked;
  } catch (error: any) {
    console.error('❌ Error checking if user liked event:', error.message);
    return false;
  }
};

/**
 * Check if user saved an event
 */
export const checkUserSavedEvent = async (
  userId: string,
  ticketId: string
): Promise<boolean> => {
  try {
    const response = await sendRPC<any>(
      'check-user-saved-event',
      { userId, ticketId },
      5000
    );
    if (!response.success) {
      return false;
    }
    return response.isSaved;
  } catch (error: any) {
    console.error('❌ Error checking if user saved event:', error.message);
    return false;
  }
};