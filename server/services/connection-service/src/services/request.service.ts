import { Request, Response } from 'express';
import ConnectionRequest from '../models/ConnectionRequest';
import { EstablishedConnection } from '../models/EstablishedConnection';
import ConnectionProfile from '../models/ConnectionProfile';
import matchingAlgorithm from '../utils/matching-algorithm';
import mongoose from 'mongoose';

// Send connection request
export const sendConnectionRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const fromUserId = (req as any).user.id;
    
    const fromProfile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(fromUserId) });
    const toProfile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(req.body.toUserId) });

    if (!fromProfile) {
      res.status(404).json({
        success: false,
        message: 'Your connection profile not found',
      });
      return;
    }

    if (!toProfile) {
      res.status(404).json({
        success: false,
        message: 'Target user connection profile not found',
      });
      return;
    }

    if (toProfile.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'Target user profile is not active',
      });
      return;
    }

    // Check for existing pending request
    const existingRequest = await ConnectionRequest.findOne({
      fromUserId: new mongoose.Types.ObjectId(fromUserId),
      toUserId: new mongoose.Types.ObjectId(req.body.toUserId),
      status: 'pending',
    });

    if (existingRequest) {
      res.status(400).json({
        success: false,
        message: 'Connection request already sent',
      });
      return;
    }

    // Calculate match score
    const matchScore = await matchingAlgorithm.calculateMatchScore(
      fromUserId,
      req.body.toUserId,
      req.body.purposeCode
    );

    // Create request
    const request = new ConnectionRequest({
      fromUserId: new mongoose.Types.ObjectId(fromUserId),
      fromConnectionProfileId: fromProfile._id,
      toUserId: new mongoose.Types.ObjectId(req.body.toUserId),
      toConnectionProfileId: toProfile._id,
      purposeCode: req.body.purposeCode,
      purposeDataId: new mongoose.Types.ObjectId(req.body.purposeDataId),
      purposeDataCollection: getPurposeCollection(req.body.purposeCode),
      message: req.body.message,
      matchScore: matchScore.totalScore,
      matchBreakdown: matchScore.breakdown,
      matchReasons: matchScore.reasons,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await request.save();

    // Update analytics
    await ConnectionProfile.updateOne(
      { _id: fromProfile._id },
      { $inc: { 'analytics.connectionsSent': 1 } }
    );

    await ConnectionProfile.updateOne(
      { _id: toProfile._id },
      { $inc: { 'analytics.connectionsReceived': 1 } }
    );

    res.status(201).json({
      success: true,
      data: request,
      message: 'Connection request sent successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sent requests
export const getSentRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query: any = { fromUserId: new mongoose.Types.ObjectId(userId) };
    if (status) query.status = status;

    const requests = await ConnectionRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('toConnectionProfileId');

    const total = await ConnectionRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
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

// Get received requests
export const getReceivedRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query: any = { toUserId: new mongoose.Types.ObjectId(userId) };
    if (status) query.status = status;

    const requests = await ConnectionRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('fromConnectionProfileId');

    const total = await ConnectionRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
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

// Get request by ID
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    
    const request = await ConnectionRequest.findById(requestId)
      .populate('fromConnectionProfileId')
      .populate('toConnectionProfileId');

    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Request not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Accept request
export const acceptRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;

    const request = await ConnectionRequest.findById(requestId);
    
    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Request not found',
      });
      return;
    }

    if (request.toUserId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Request already processed',
      });
      return;
    }

    request.status = 'accepted';
    request.respondedAt = new Date();
    request.connectionEstablishedAt = new Date();
    await request.save();

    // Create established connection
    const connection = new EstablishedConnection({
      userIds: [request.fromUserId, request.toUserId],
      user1Id: request.fromUserId,
      user2Id: request.toUserId,
      connectionProfileIds: [request.fromConnectionProfileId, request.toConnectionProfileId],
      originalRequestId: request._id,
      purposeCode: request.purposeCode,
      establishedAt: new Date(),
      status: 'active',
      conversationId: new mongoose.Types.ObjectId(), // Will be created by chat service
      messageCount: 0,
      meetupCount: 0,
    });

    await connection.save();

    // Update analytics
    await ConnectionProfile.updateOne(
      { _id: request.fromConnectionProfileId },
      { $inc: { 'analytics.connectionsAccepted': 1 } }
    );

    await ConnectionProfile.updateOne(
      { _id: request.toConnectionProfileId },
      { $inc: { 'analytics.connectionsAccepted': 1 } }
    );

    res.status(200).json({
      success: true,
      data: { request, connection },
      message: 'Connection request accepted',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Reject request
export const rejectRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await ConnectionRequest.findById(requestId);
    
    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Request not found',
      });
      return;
    }

    if (request.toUserId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Request already processed',
      });
      return;
    }

    request.status = 'rejected';
    request.respondedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Connection request rejected',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel request
export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { requestId } = req.params;

    const request = await ConnectionRequest.findById(requestId);
    
    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Request not found',
      });
      return;
    }

    if (request.fromUserId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Request already processed',
      });
      return;
    }

    request.status = 'cancelled';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Connection request cancelled',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Mark as viewed
export const markAsViewed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;

    await ConnectionRequest.updateOne(
      { _id: requestId },
      { $set: { viewedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: 'Request marked as viewed',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper: Get purpose collection name
const getPurposeCollection = (purposeCode: string): string => {
  const collections: Record<string, string> = {
    TRAVEL: 'travelpurposes',
    RELATIONSHIP: 'relationshippurposes',
    LOCATION: 'locationpurposes',
    PROFESSIONAL: 'professionalpurposes',
    CONCERT: 'concertpurposes',
    SKILL: 'skillpurposes',
    DAY_OUTING: 'dayoutingpurposes',
  };

  return collections[purposeCode] || 'custompurposes';
};