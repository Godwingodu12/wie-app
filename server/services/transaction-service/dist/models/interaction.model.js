import { prisma } from '../config/db';
export class InteractionModel {
    /**
     * Create interaction
     */
    static async create(data) {
        return await prisma.interaction.create({
            data: {
                userId: data.userId,
                ticketId: data.ticketId,
                interactionType: data.interactionType,
                metadata: data.metadata || null,
            },
        });
    }
    /**
     * Find interaction
     */
    static async findUnique(userId, ticketId, interactionType) {
        return await prisma.interaction.findUnique({
            where: {
                userId_ticketId_interactionType: {
                    userId,
                    ticketId,
                    interactionType,
                },
            },
        });
    }
    /**
     * Delete interaction
     */
    static async delete(id) {
        return await prisma.interaction.delete({
            where: { id },
        });
    }
    /**
     * Find interactions by user
     */
    static async findByUserId(userId, options) {
        const where = { userId };
        if (options?.type) {
            where.interactionType = options.type;
        }
        const [interactions, total] = await Promise.all([
            prisma.interaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50,
                skip: options?.skip || 0,
            }),
            prisma.interaction.count({ where }),
        ]);
        return { interactions, total };
    }
    /**
     * Find interactions by ticket
     */
    static async findByTicketId(ticketId, interactionType) {
        const where = { ticketId };
        if (interactionType) {
            where.interactionType = interactionType;
        }
        return await prisma.interaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Count interactions by type
     */
    static async countByType(ticketId, interactionType) {
        return await prisma.interaction.count({
            where: {
                ticketId,
                interactionType,
            },
        });
    }
    /**
     * Get interaction statistics for a ticket
     */
    static async getTicketStatistics(ticketId) {
        const stats = await prisma.interaction.groupBy({
            by: ['interactionType'],
            where: { ticketId },
            _count: true,
        });
        const result = {
            LIKE: 0,
            SHARE: 0,
            VIEW: 0,
            SAVE: 0,
            FEEDBACK: 0,
        };
        stats.forEach((stat) => {
            result[stat.interactionType] = stat._count;
        });
        return result;
    }
    /**
     * Check if user has interacted with ticket
     */
    static async hasUserInteracted(userId, ticketId, interactionType) {
        const interaction = await this.findUnique(userId, ticketId, interactionType);
        return interaction !== null;
    }
    /**
     * Get user's liked tickets
     */
    static async getUserLikedTickets(userId, options) {
        const interactions = await prisma.interaction.findMany({
            where: {
                userId,
                interactionType: 'LIKE',
            },
            select: { ticketId: true },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.skip || 0,
        });
        return interactions.map((i) => i.ticketId);
    }
    /**
     * Get user's saved tickets
     */
    static async getUserSavedTickets(userId, options) {
        const interactions = await prisma.interaction.findMany({
            where: {
                userId,
                interactionType: 'SAVE',
            },
            select: { ticketId: true },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 50,
            skip: options?.skip || 0,
        });
        return interactions.map((i) => i.ticketId);
    }
    /**
     * Get feedback for ticket
     */
    static async getFeedback(ticketId, options) {
        const where = {
            ticketId,
            interactionType: 'FEEDBACK',
        };
        const [feedback, total] = await Promise.all([
            prisma.interaction.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: options?.limit || 50,
                skip: options?.skip || 0,
            }),
            prisma.interaction.count({ where }),
        ]);
        // Calculate average rating
        const ratings = feedback
            .map((f) => f.metadata?.rating)
            .filter((r) => r !== undefined && r !== null);
        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;
        return {
            feedback,
            total,
            averageRating: parseFloat(averageRating.toFixed(2)),
        };
    }
    /**
     * Update interaction metadata
     */
    static async updateMetadata(id, metadata) {
        return await prisma.interaction.update({
            where: { id },
            data: { metadata },
        });
    }
}
export default InteractionModel;
//# sourceMappingURL=interaction.model.js.map