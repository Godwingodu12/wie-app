import mongoose, { Schema, Document } from 'mongoose';

export interface IMatchSuggestionCache extends Document {
  userId: String;
  connectionProfileId: mongoose.Types.ObjectId;
  purposeCode: string;
  suggestions: Array<{
    suggestedUserId: String;
    suggestedProfileId: String;
    matchScore: number;
    matchBreakdown: {
      mutuals: number;
      location: number;
      interests: number;
      personality: number;
    };
    matchReasons: string[];
    distance: number;
    mutualConnectionsCount: number;
    mutualConnections: mongoose.Types.ObjectId[];
  }>;
  generatedAt: Date;
  expiresAt: Date;
  viewedSuggestions: mongoose.Types.ObjectId[];
  skippedSuggestions: mongoose.Types.ObjectId[];
  requestedSuggestions: mongoose.Types.ObjectId[];
}

const MatchSuggestionCacheSchema = new Schema<IMatchSuggestionCache>(
  {
    userId: {
      type: String,
      required: true,
      // REMOVED: index: true
    },
    connectionProfileId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    purposeCode: {
      type: String,
      required: true,
      // REMOVED: index: true
    },
    suggestions: [
      {
        suggestedUserId: Schema.Types.ObjectId,
        suggestedProfileId: Schema.Types.ObjectId,
        matchScore: Number,
        matchBreakdown: {
          mutuals: Number,
          location: Number,
          interests: Number,
          personality: Number,
        },
        matchReasons: [String],
        distance: Number,
        mutualConnectionsCount: Number,
        mutualConnections: [Schema.Types.ObjectId],
      },
    ],
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      // REMOVED: index: true
    },
    viewedSuggestions: [Schema.Types.ObjectId],
    skippedSuggestions: [Schema.Types.ObjectId],
    requestedSuggestions: [Schema.Types.ObjectId],
  },
  {
    timestamps: true,
  }
);

// Define all indexes here (compound and TTL)
MatchSuggestionCacheSchema.index({ userId: 1, purposeCode: 1 });
MatchSuggestionCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MatchSuggestionCache = mongoose.model<IMatchSuggestionCache>(
  'MatchSuggestionCache',
  MatchSuggestionCacheSchema
);