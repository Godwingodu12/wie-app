import { updateTicketStats } from '../clients/ticketServiceClient';
import { InteractionModel, BookingModel } from '../models';
import { sendRPC } from '../rabbit/producer';
import { prisma } from '../config/db';
// Like/Unlike Event
export const toggleLike = async (req, res) => {
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
    }
    catch (error) {
        console.error('❌ Error toggling like:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Share Event
export const shareEvent = async (req, res) => {
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
        res.json({
            success: true,
            message: 'Event shared successfully',
        });
    }
    catch (error) {
        console.error('❌ Error sharing event:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Record View
export const recordView = async (req, res) => {
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
        const recentView = interactions.interactions.find((i) => i.ticketId === ticketId &&
            new Date(i.createdAt) >= yesterday);
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
    }
    catch (error) {
        console.error('❌ Error recording view:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Save/Unsave Event
export const toggleSave = async (req, res) => {
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
    }
    catch (error) {
        console.error('❌ Error toggling save:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get Event Stats
export const getEventStats = async (req, res) => {
    try {
        const { ticketId } = req.params;
        // Get interaction stats from database directly (no RabbitMQ needed)
        const stats = await prisma.interaction.groupBy({
            by: ['interactionType'],
            where: { ticketId },
            _count: true,
        });
        const statsMap = stats.reduce((acc, stat) => {
            acc[stat.interactionType] = stat._count;
            return acc;
        }, {});
        // Get booking stats via RabbitMQ
        let bookingStats = {
            totalBookings: 0,
            totalRevenue: 0,
            totalTicketsSold: 0,
        };
        try {
            const bookingResponse = await sendRPC('get-ticket-booking-stats', { ticketId }, 5000);
            if (bookingResponse.success) {
                bookingStats = {
                    totalBookings: bookingResponse.totalBookings,
                    totalRevenue: bookingResponse.totalRevenue,
                    totalTicketsSold: bookingResponse.totalTicketsSold,
                };
            }
        }
        catch (error) {
            console.warn('⚠️ Could not fetch booking stats:', error.message);
        }
        res.json({
            success: true,
            data: {
                stats: {
                    likes: statsMap.LIKE || 0,
                    shares: statsMap.SHARE || 0,
                    views: statsMap.VIEW || 0,
                    saves: statsMap.SAVE || 0,
                    ...bookingStats,
                },
            },
        });
    }
    catch (error) {
        console.error('❌ Error fetching event stats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get User's Liked Events
export const getUserLikedEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { limit = 50, skip = 0 } = req.query;
        const ticketIds = await InteractionModel.getUserLikedTickets(userId, {
            limit: parseInt(limit),
            skip: parseInt(skip),
        });
        res.json({
            success: true,
            data: {
                ticketIds,
                total: ticketIds.length,
            },
        });
    }
    catch (error) {
        console.error('❌ Error fetching liked events:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get User's Saved Events
export const getUserSavedEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { limit = 50, skip = 0 } = req.query;
        const ticketIds = await InteractionModel.getUserSavedTickets(userId, {
            limit: parseInt(limit),
            skip: parseInt(skip),
        });
        res.json({
            success: true,
            data: {
                ticketIds,
                total: ticketIds.length,
            },
        });
    }
    catch (error) {
        console.error('❌ Error fetching saved events:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Submit Feedback
export const submitFeedback = async (req, res) => {
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
        const hasBooking = bookings.bookings.some((b) => b.ticketId === ticketId && b.bookingStatus === 'CONFIRMED');
        if (!hasBooking) {
            return res.status(403).json({
                success: false,
                message: 'You must have a confirmed booking to submit feedback',
            });
        }
        // Check if feedback already submitted
        const existingFeedback = await InteractionModel.findUnique(userId, ticketId, 'FEEDBACK');
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
    }
    catch (error) {
        console.error('❌ Error submitting feedback:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=interactionController.js.map