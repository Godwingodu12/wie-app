import mongoose, { Schema, Document } from 'mongoose';

export interface IProfessionalPurpose extends Document {
  connectionProfileId: mongoose.Types.ObjectId;
  userId: string; // FIXED: lowercase string
  businessConnectionType: string;
  field: string;
  niche?: string;
  subCategory?: string;
  businessStage: string;
  meetingMode: string;
  offering?: string;
  lookingFor?: string;
  availability: {
    weeklyFrequency: string;
    timeSlots: string[];
  };
  status: string;
}

const ProfessionalPurposeSchema = new Schema<IProfessionalPurpose>(
  {
    connectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
    },
    userId: {
      type: String, // FIXED: String (not Schema.Types.ObjectId)
      required: true,
    },
    businessConnectionType: {
      type: String,
      enum: ['startup-collaboration', 'client-customer', 'investor', 'mentor', 'hr-ceo-connect'],
      required: true,
    },
    field: {
      type: String,
      required: true,
    },
    niche: String,
    subCategory: String,
    businessStage: {
      type: String,
      enum: ['idea-stage', 'early-stage', 'growth-stage', 'established', 'career-professional'],
      required: true,
    },
    meetingMode: {
      type: String,
      enum: ['online', 'offline', 'both'],
      required: true,
    },
    offering: {
      type: String,
      maxlength: 200,
    },
    lookingFor: {
      type: String,
      maxlength: 200,
    },
    availability: {
      weeklyFrequency: String,
      timeSlots: [String],
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'deleted'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Define indexes here
ProfessionalPurposeSchema.index({ connectionProfileId: 1 });
ProfessionalPurposeSchema.index({ userId: 1 });
ProfessionalPurposeSchema.index({ businessConnectionType: 1 });
ProfessionalPurposeSchema.index({ field: 1, niche: 1 });
ProfessionalPurposeSchema.index({ status: 1 });

export const ProfessionalPurpose = mongoose.model<IProfessionalPurpose>(
  'ProfessionalPurpose',
  ProfessionalPurposeSchema
);