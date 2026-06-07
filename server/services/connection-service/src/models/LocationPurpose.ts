import mongoose, { Schema, Document } from 'mongoose';

export interface ILocationPurpose extends Document {
  connectionProfileId: String;
  userId: String;
  genderPreference: string;
  reason: string;
  proximityRequirement: string;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  searchRadius: number;
  hasSpecificActivity: boolean;
  activity?: string;
  activityDescription?: string;
  meetingUrgency: string;
  meetingTime?: Date;
  isActiveNow: boolean;
  lastSeenAt?: Date;
  status: string;
  expiresAt?: Date;
}

const LocationPurposeSchema = new Schema<ILocationPurpose>(
  {
    connectionProfileId: {
      type: String,
      ref: 'ConnectionProfile',
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'transgender', 'any'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 300,
    },
    proximityRequirement: {
      type: String,
      enum: ['within-1-5km', 'city-wide', 'flexible'],
      required: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        // REMOVED: index: '2dsphere'
      },
    },
    searchRadius: Number,
    hasSpecificActivity: Boolean,
    activity: String,
    activityDescription: String,
    meetingUrgency: {
      type: String,
      enum: ['right-now', '1-2-hours', 'today', 'tomorrow', 'this-weekend', 'flexible'],
      required: true,
    },
    meetingTime: Date,
    isActiveNow: {
      type: Boolean,
      default: false,
      // REMOVED: index: true
    },
    lastSeenAt: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'completed'],
      default: 'active',
      // REMOVED: index: true
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

// Define indexes here
LocationPurposeSchema.index({ connectionProfileId: 1 });
LocationPurposeSchema.index({ userId: 1 });
LocationPurposeSchema.index({ 'currentLocation.coordinates': '2dsphere' });
LocationPurposeSchema.index({ isActiveNow: 1, status: 1 });
LocationPurposeSchema.index({ expiresAt: 1 });

export const LocationPurpose = mongoose.model<ILocationPurpose>(
  'LocationPurpose',
  LocationPurposeSchema
);