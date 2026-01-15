import { Request, Response } from 'express';
import matchingAlgorithm from '../utils/matching-algorithm';
import { MatchSuggestionCache } from '../models/MatchSuggestionCache';
import { EstablishedConnection } from '../models/EstablishedConnection';
import mongoose from 'mongoose';
import { cache } from '../utils/cache';

// Get match suggestions
export const getMatchSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { purposeCode } = req.params;
    const { limit = 50, filters } = req.query;

    // Check cache first
    const cacheKey = `matches:${userId}:${purposeCode}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      res.status(200).json({
        success: true,
        data: cached,
      });
      return;
    }

    // Find matches
    const matches = await matchingAlgorithm.findMatches(
      userId,
      purposeCode,
      filters ? JSON.parse(filters as string) : {},
      Number(limit)
    );

    // Cache for 1 hour
    cache.set(cacheKey, matches, 3600);

    // Save to database cache
    await saveSuggestionsCache(userId, purposeCode, matches);

    res.status(200).json({
      success: true,
      data: matches,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Calculate match score
export const calculateMatchScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { targetUserId, purposeCode } = req.body;

    const score = await matchingAlgorithm.calculateMatchScore(userId, targetUserId, purposeCode);

    res.status(200).json({
      success: true,
      data: score,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Track view
export const trackView = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { suggestedUserId } = req.params;
    const { purposeCode } = req.body;

    await trackInteraction(userId, suggestedUserId, purposeCode, 'view');

    res.status(200).json({
      success: true,
      message: 'View tracked successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Track skip
export const trackSkip = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { suggestedUserId } = req.params;
    const { purposeCode } = req.body;

    await trackInteraction(userId, suggestedUserId, purposeCode, 'skip');

    res.status(200).json({
      success: true,
      message: 'Skip tracked successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get established connections
export const getEstablishedConnections = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query: any = {
      userIds: new mongoose.Types.ObjectId(userId),
    };

    if (status) query.status = status;

    const connections = await EstablishedConnection.find(query)
      .sort({ lastInteractionAt: -1, establishedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('connectionProfileIds');

    const total = await EstablishedConnection.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        connections,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get connection by ID
export const getConnectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionId } = req.params;
    
    const connection = await EstablishedConnection.findById(connectionId).populate(
      'connectionProfileIds'
    );

    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: connection,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Provide feedback
export const provideFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { connectionId } = req.params;
    const { rating, review, wouldRecommend } = req.body;

    const connection = await EstablishedConnection.findById(connectionId);
    
    if (!connection) {
      res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
      return;
    }

    // Determine which user is providing feedback
    const isUser1 = connection.user1Id.toString() === userId;
    const feedbackField = isUser1 ? 'user1Feedback' : 'user2Feedback';

    await EstablishedConnection.updateOne(
      { _id: connectionId },
      {
        $set: {
          [feedbackField]: {
            rating,
            review,
            wouldRecommend,
          },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function: Track interaction (internal use)
const trackInteraction = async (
  userId: string,
  suggestedUserId: string,
  purposeCode: string,
  type: 'view' | 'skip'
): Promise<void> => {
  const field = type === 'view' ? 'viewedSuggestions' : 'skippedSuggestions';

  await MatchSuggestionCache.updateOne(
    {
      userId: new mongoose.Types.ObjectId(userId),
      purposeCode,
    },
    {
      $addToSet: {
        [field]: new mongoose.Types.ObjectId(suggestedUserId),
      },
    }
  );
};

// Helper function: Save suggestions to cache (internal use)
const saveSuggestionsCache = async (
  userId: string,
  purposeCode: string,
  suggestions: any[]
): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await MatchSuggestionCache.findOneAndUpdate(
    {
      userId: new mongoose.Types.ObjectId(userId),
      purposeCode,
    },
    {
      suggestions: suggestions.map((s) => ({
        suggestedUserId: s.userId,
        suggestedProfileId: s._id,
        matchScore: s.matchScore,
        matchBreakdown: s.matchBreakdown,
        matchReasons: s.matchReasons,
        distance: 0, // Calculate if needed
        mutualConnectionsCount: 0,
        mutualConnections: [],
      })),
      generatedAt: new Date(),
      expiresAt,
    },
    { upsert: true }
  );
};