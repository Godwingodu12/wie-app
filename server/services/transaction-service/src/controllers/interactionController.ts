import { Request, Response } from 'express';
import { updateTicketStats, getTicketStats } from '../clients/ticketServiceClient';
import { InteractionModel, BookingModel } from '../models';
import { getTicketBookingStats } from '../clients/ticketServiceClient';
import { prisma } from '../config/db';
// Like/Unlike Event
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already liked
    const existing = await InteractionModel.findUnique(userId, ticketId, 'LIKE');

    if (existing) {
      // Unlike
      await InteractionModel.delete(existing.id);

      // Update ticket stats
      await updateTicketStats(ticketId, 'like', -1);

      return res.json({
        success: true,
        liked: false,
        message: 'Event unliked',
      });
    }

    // Like
    await InteractionModel.create({
      userId,
      ticketId,
      interactionType: 'LIKE',
    });

    // Update ticket stats
    await updateTicketStats(ticketId, 'like', 1);

    res.json({
      success: true,
      liked: true,
      message: 'Event liked',
    });
  } catch (error: any) {
    console.error('❌ Error toggling like:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Share Event
export const shareEvent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;
    const { shareMethod, platform } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Record share
    await InteractionModel.create({
      userId,
      ticketId,
      interactionType: 'SHARE',
      metadata: {
        shareMethod,
        platform,
        timestamp: new Date().toISOString(),
      },
    });

    // Update ticket stats
    await updateTicketStats(ticketId, 'share', 1);
    const shareCount = await InteractionModel.countByType(ticketId, 'SHARE');

    res.json({
      success: true,
      message: 'Event shared successfully',
      data: {
        shareCount,
      },
    });
  } catch (error: any) {
    console.error('❌ Error sharing event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Record View
export const recordView = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already viewed in last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const interactions = await InteractionModel.findByUserId(userId, {
      type: 'VIEW',
      limit: 100,
    });

    const recentView = interactions.interactions.find(
      (i) =>
        i.ticketId === ticketId &&
        new Date(i.createdAt) >= yesterday
    );

    if (!recentView) {
      // Record new view
      await InteractionModel.create({
        userId,
        ticketId,
        interactionType: 'VIEW',
      });
      // Update ticket stats
    }
    res.json({
      success: true,
      message: 'View recorded',
    });
  } catch (error: any) {
    console.error('❌ Error recording view:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Save/Unsave Event
export const toggleSave = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if already saved
    const existing = await InteractionModel.findUnique(userId, ticketId, 'SAVE');

    if (existing) {
      // Unsave
      await InteractionModel.delete(existing.id);

      return res.json({
        success: true,
        saved: false,
        message: 'Event removed from saved',
      });
    }

    // Save
    await InteractionModel.create({
      userId,
      ticketId,
      interactionType: 'SAVE',
    });

    res.json({
      success: true,
      saved: true,
      message: 'Event saved',
    });
  } catch (error: any) {
    console.error('❌ Error toggling save:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getEventStats = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user?.id;

    console.log(`🔵 [Transaction] Fetching event stats for ticket: ${ticketId}`);

    const interactionStats = await InteractionModel.getTicketStatistics(ticketId);

    // ✅ Get booking stats via gRPC instead of RabbitMQ
    let bookingStats = {
      totalBookings: 0,
      totalRevenue: 0,
      totalTicketsSold: 0,
    };

    try {
      console.log(`🔵 [Transaction] Fetching booking stats via gRPC...`);
      bookingStats = await getTicketBookingStats(ticketId);
      console.log(`✅ [Transaction] Booking stats fetched:`, bookingStats);
    } catch (error: any) {
      console.warn('⚠️ [Transaction] Could not fetch booking stats:', error.message);
      // Continue with zero stats
    }

    res.json({
      success: true,
      data: {
        stats: {
          like: interactionStats.LIKE || 0,
          likes: interactionStats.LIKE || 0,
          share: interactionStats.SHARE || 0,
          shares: interactionStats.SHARE || 0,
          views: interactionStats.VIEW || 0,
          view: interactionStats.VIEW || 0,
          saves: interactionStats.SAVE || 0,
          save: interactionStats.SAVE || 0,
          feedback: interactionStats.FEEDBACK || 0,
          ...bookingStats,
        },
        userInteractions: {
          liked: userId
            ? await InteractionModel.hasUserInteracted(userId, ticketId, 'LIKE')
            : false,
          saved: userId
            ? await InteractionModel.hasUserInteracted(userId, ticketId, 'SAVE')
            : false,
          shared: userId
            ? await InteractionModel.hasUserInteracted(userId, ticketId, 'SHARE')
            : false,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ [Transaction] Error fetching event stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get User's Liked Events
export const getUserLikedEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 50, skip = 0 } = req.query;

    const ticketIds = await InteractionModel.getUserLikedTickets(userId, {
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
    });

    res.json({
      success: true,
      data: {
        ticketIds,
        total: ticketIds.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching liked events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User's Saved Events
export const getUserSavedEvents = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { limit = 50, skip = 0 } = req.query;

    const ticketIds = await InteractionModel.getUserSavedTickets(userId, {
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
    });

    res.json({
      success: true,
      data: {
        ticketIds,
        total: ticketIds.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching saved events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit Feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { ticketId } = req.params;
    const { rating, comment } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if user has booking for this event
    const bookings = await BookingModel.findByUserId(userId);
    const hasBooking = bookings.bookings.some(
      (b) => b.ticketId === ticketId && b.bookingStatus === 'CONFIRMED'
    );

    if (!hasBooking) {
      return res.status(403).json({
        success: false,
        message: 'You must have a confirmed booking to submit feedback',
      });
    }

    // Check if feedback already submitted
    const existingFeedback = await InteractionModel.findUnique(
      userId,
      ticketId,
      'FEEDBACK'
    );

    if (existingFeedback) {
      // Update existing feedback
      await InteractionModel.updateMetadata(existingFeedback.id, {
        rating,
        comment,
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: 'Feedback updated successfully',
      });
    }

    // Create new feedback
    await InteractionModel.create({
      userId,
      ticketId,
      interactionType: 'FEEDBACK',
      metadata: {
        rating,
        comment,
      },
    });

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
