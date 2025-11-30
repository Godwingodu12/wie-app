import { Interaction, InteractionType } from '../generated/prisma';
export interface CreateInteractionData {
    userId: string;
    ticketId: string;
    interactionType: InteractionType;
    metadata?: any;
}
export declare class InteractionModel {
    /**
     * Create interaction
     */
    static create(data: CreateInteractionData): Promise<Interaction>;
    /**
     * Find interaction
     */
    static findUnique(userId: string, ticketId: string, interactionType: InteractionType): Promise<Interaction | null>;
    /**
     * Delete interaction
     */
    static delete(id: string): Promise<Interaction>;
    /**
     * Find interactions by user
     */
    static findByUserId(userId: string, options?: {
        type?: InteractionType;
        limit?: number;
        skip?: number;
    }): Promise<{
        interactions: Interaction[];
        total: number;
    }>;
    /**
     * Find interactions by ticket
     */
    static findByTicketId(ticketId: string, interactionType?: InteractionType): Promise<Interaction[]>;
    /**
     * Count interactions by type
     */
    static countByType(ticketId: string, interactionType: InteractionType): Promise<number>;
    /**
     * Get interaction statistics for a ticket
     */
    static getTicketStatistics(ticketId: string): Promise<any>;
    /**
     * Check if user has interacted with ticket
     */
    static hasUserInteracted(userId: string, ticketId: string, interactionType: InteractionType): Promise<boolean>;
    /**
     * Get user's liked tickets
     */
    static getUserLikedTickets(userId: string, options?: {
        limit?: number;
        skip?: number;
    }): Promise<string[]>;
    /**
     * Get user's saved tickets
     */
    static getUserSavedTickets(userId: string, options?: {
        limit?: number;
        skip?: number;
    }): Promise<string[]>;
    /**
     * Get feedback for ticket
     */
    static getFeedback(ticketId: string, options?: {
        limit?: number;
        skip?: number;
    }): Promise<{
        feedback: Interaction[];
        total: number;
        averageRating: number;
    }>;
    /**
     * Update interaction metadata
     */
    static updateMetadata(id: string, metadata: any): Promise<Interaction>;
}
export default InteractionModel;
//# sourceMappingURL=interaction.model.d.ts.map