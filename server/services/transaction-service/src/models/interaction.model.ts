import { prisma } from '../config/db';
import { Interaction, InteractionType } from '../generated/prisma';

export interface CreateInteractionData {
  userId: string;
  ticketId: string;
  interactionType: InteractionType;
  metadata?: any;
}

export class InteractionModel {
  /**
   * Create interaction
   */
  static async create(data: CreateInteractionData): Promise<Interaction> {
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
  static async findUnique(
    userId: string,
    ticketId: string,
    interactionType: InteractionType
  ): Promise<Interaction | null> {
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
  static async delete(id: string): Promise<Interaction> {
    return await prisma.interaction.delete({
      where: { id },
    });
  }

  /**
   * Find interactions by user
   */
  static async findByUserId(
    userId: string,
    options?: {
      type?: InteractionType;
      limit?: number;
      skip?: number;
    }
  ): Promise<{ interactions: Interaction[]; total: number }> {
    const where: any = { userId };

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
  static async findByTicketId(
    ticketId: string,
    interactionType?: InteractionType
  ): Promise<Interaction[]> {
    const where: any = { ticketId };

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
  static async countByType(ticketId: string, interactionType: InteractionType): Promise<number> {
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
  static async getTicketStatistics(ticketId: string) {
    const stats = await prisma.interaction.groupBy({
      by: ['interactionType'],
      where: { ticketId },
      _count: true,
    });

    const result: any = {
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
  static async hasUserInteracted(
    userId: string,
    ticketId: string,
    interactionType: InteractionType
  ): Promise<boolean> {
    const interaction = await this.findUnique(userId, ticketId, interactionType);
    return interaction !== null;
  }

  /**
   * Get user's liked tickets
   */
  static async getUserLikedTickets(
    userId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<string[]> {
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
  static async getUserSavedTickets(
    userId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<string[]> {
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
  static async getFeedback(
    ticketId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<{ feedback: Interaction[]; total: number; averageRating: number }> {
    const where = {
      ticketId,
      interactionType: 'FEEDBACK' as InteractionType,
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
      .map((f) => (f.metadata as any)?.rating)
      .filter((r) => r !== undefined && r !== null);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
        : 0;

    return {
      feedback,
      total,
      averageRating: parseFloat(averageRating.toFixed(2)),
    };
  }
  static async updateMetadata(id: string, metadata: any): Promise<Interaction> {
    return await prisma.interaction.update({
      where: { id },
      data: { metadata },
    });
  }
  static async upsert(data: CreateInteractionData): Promise<Interaction> {
    return await prisma.interaction.upsert({
      where: {
        userId_ticketId_interactionType: {
          userId: data.userId,
          ticketId: data.ticketId,
          interactionType: data.interactionType,
        },
      },
      update: {
        metadata: data.metadata || null,
        createdAt: new Date(), // Update timestamp on each view
      },
      create: {
        userId: data.userId,
        ticketId: data.ticketId,
        interactionType: data.interactionType,
        metadata: data.metadata || null,
      },
    });
  }
}
export default InteractionModel;