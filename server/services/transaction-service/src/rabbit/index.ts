import { connectRabbitMQ,getChannel, isChannelAvailable } from './connection';
import { listenQueue } from './consumer';
import { prisma } from '../config/db';
export const startConsumers = async (): Promise<void> => {
  if (!isChannelAvailable()) {
    console.warn('⚠️ RabbitMQ not connected, skipping consumer setup');
    return;
  }
  // Get user bookings
  await listenQueue('get-user-bookings', async (data) => {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId: data.userId },
        orderBy: { createdAt: 'desc' },
        take: data.limit || 50,
      });

      return {
        success: true,
        bookings,
        count: bookings.length,
      };
    } catch (error: any) {
      console.error('❌ Error in get-user-bookings handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Get booking by ID
  await listenQueue('get-booking-by-id', async (data) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
      });

      if (!booking) {
        return { error: 'Booking not found', success: false };
      }

      return { success: true, booking };
    } catch (error: any) {
      console.error('❌ Error in get-booking-by-id handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Get user interactions (likes, shares, saves)
  await listenQueue('get-user-interactions', async (data) => {
    try {
      const interactions = await prisma.interaction.findMany({
        where: {
          userId: data.userId,
          interactionType: data.type || undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: data.limit || 50,
      });

      return {
        success: true,
        interactions,
        count: interactions.length,
      };
    } catch (error: any) {
      console.error('❌ Error in get-user-interactions handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Get event statistics (likes, shares, views, saves)
  await listenQueue('get-event-statistics', async (data) => {
    try {
      const stats = await prisma.interaction.groupBy({
        by: ['interactionType'],
        where: { ticketId: data.ticketId },
        _count: true,
      });

      const statsMap = stats.reduce((acc: any, stat) => {
        acc[stat.interactionType] = stat._count;
        return acc;
      }, {});

      return {
        success: true,
        stats: {
          likes: statsMap.LIKE || 0,
          shares: statsMap.SHARE || 0,
          views: statsMap.VIEW || 0,
          saves: statsMap.SAVE || 0,
        },
      };
    } catch (error: any) {
      console.error('❌ Error in get-event-statistics handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Get group statistics (bookings and revenue)
  await listenQueue('get-group-statistics', async (data) => {
    try {
      const stats = await prisma.booking.aggregate({
        where: {
          groupId: data.groupId,
          bookingStatus: 'CONFIRMED',
        },
        _sum: {
          totalAmount: true,
          quantity: true,
        },
        _count: true,
      });

      return {
        success: true,
        stats: {
          totalBookings: stats._count,
          totalRevenue: stats._sum.totalAmount || 0,
          totalTicketsSold: stats._sum.quantity || 0,
        },
      };
    } catch (error: any) {
      console.error('❌ Error in get-group-statistics handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Get ticket booking statistics
  await listenQueue('get-ticket-booking-stats', async (data) => {
    try {
      const stats = await prisma.booking.aggregate({
        where: {
          ticketId: data.ticketId,
          bookingStatus: 'CONFIRMED',
        },
        _sum: {
          totalAmount: true,
          quantity: true,
        },
        _count: true,
      });

      return {
        success: true,
        totalBookings: stats._count,
        totalRevenue: parseFloat((stats._sum.totalAmount || 0).toString()),
        totalTicketsSold: stats._sum.quantity || 0,
      };
    } catch (error: any) {
      console.error('❌ Error in get-ticket-booking-stats handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Check if user liked an event
  await listenQueue('check-user-liked-event', async (data) => {
    try {
      const interaction = await prisma.interaction.findFirst({
        where: {
          userId: data.userId,
          ticketId: data.ticketId,
          interactionType: 'LIKE',
        },
      });

      return {
        success: true,
        isLiked: !!interaction,
      };
    } catch (error: any) {
      console.error('❌ Error in check-user-liked-event handler:', error);
      return { error: error.message, success: false };
    }
  });

  // Check if user saved an event
  await listenQueue('check-user-saved-event', async (data) => {
    try {
      const interaction = await prisma.interaction.findFirst({
        where: {
          userId: data.userId,
          ticketId: data.ticketId,
          interactionType: 'SAVE',
        },
      });

      return {
        success: true,
        isSaved: !!interaction,
      };
    } catch (error: any) {
      console.error('❌ Error in check-user-saved-event handler:', error);
      return { error: error.message, success: false };
    }
  });
};
export const publishRefundJob = async (job: {
  bookingId: string;
  refundPercentage: number;
  eventName: string;
}): Promise<void> => {
  const QUEUE_NAME = 'wie.refund.jobs';

  if (!isChannelAvailable()) {
    console.warn('⚠️ [publishRefundJob] RabbitMQ channel not available, skipping refund job');
    return;
  }

  try {
    const channel = getChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(job)),
      { persistent: true }
    );
    console.log(`✅ [publishRefundJob] Enqueued refund job for booking ${job.bookingId}`);
  } catch (err: any) {
    console.error('❌ [publishRefundJob] Failed to enqueue:', err.message);
    throw err;
  }
};
export { connectRabbitMQ };
