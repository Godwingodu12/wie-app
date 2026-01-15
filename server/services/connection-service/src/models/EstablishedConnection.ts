import mongoose, { Schema, Document } from 'mongoose';

export interface IEstablishedConnection extends Document {
  userIds: string[]; // FIXED: lowercase string[]
  user1Id: string; // FIXED: lowercase string
  user2Id: string; // FIXED: lowercase string
  connectionProfileIds: mongoose.Types.ObjectId[]; // FIXED: ObjectId array
  originalRequestId: mongoose.Types.ObjectId; // FIXED: ObjectId
  purposeCode: string;
  establishedAt: Date;
  lastInteractionAt?: Date;
  messageCount: number;
  meetupCount: number;
  status: 'active' | 'inactive' | 'blocked-by-user1' | 'blocked-by-user2' | 'mutually-blocked';
  conversationId: mongoose.Types.ObjectId;
  sharedActivities: Array<{
    activityType: string;
    activityDate: Date;
    notes?: string;
  }>;
  user1Feedback?: {
    rating: number;
    review?: string;
    wouldRecommend: boolean;
  };
  user2Feedback?: {
    rating: number;
    review?: string;
    wouldRecommend: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const EstablishedConnectionSchema = new Schema<IEstablishedConnection>(
  {
    userIds: [
      {
        type: String, // FIXED: String for userId array
        required: true,
      },
    ],
    user1Id: {
      type: String, // FIXED: String (not ObjectId)
      required: true,
    },
    user2Id: {
      type: String, // FIXED: String (not ObjectId)
      required: true,
    },
    connectionProfileIds: [
      {
        type: Schema.Types.ObjectId, // FIXED: ObjectId for MongoDB references
        ref: 'ConnectionProfile',
      },
    ],
    originalRequestId: {
      type: Schema.Types.ObjectId, // FIXED: ObjectId for MongoDB reference
      ref: 'ConnectionRequest',
      required: true,
    },
    purposeCode: {
      type: String,
      required: true,
    },
    establishedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastInteractionAt: Date,
    messageCount: {
      type: Number,
      default: 0,
    },
    meetupCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked-by-user1', 'blocked-by-user2', 'mutually-blocked'],
      default: 'active',
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    sharedActivities: [
      {
        activityType: String,
        activityDate: Date,
        notes: String,
      },
    ],
    user1Feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      wouldRecommend: Boolean,
    },
    user2Feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: String,
      wouldRecommend: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

// Define all indexes here
EstablishedConnectionSchema.index({ userIds: 1, status: 1 });
EstablishedConnectionSchema.index({ user1Id: 1, status: 1 });
EstablishedConnectionSchema.index({ user2Id: 1, status: 1 });
EstablishedConnectionSchema.index({ purposeCode: 1 });
EstablishedConnectionSchema.index({ lastInteractionAt: -1 });
EstablishedConnectionSchema.index({ establishedAt: -1 });

// Prevent duplicate connections
EstablishedConnectionSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

export const EstablishedConnection = mongoose.model<IEstablishedConnection>(
  'EstablishedConnection',
  EstablishedConnectionSchema
);