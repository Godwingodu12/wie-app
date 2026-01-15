import mongoose, { Schema, Document } from 'mongoose';

export interface ISkillPurpose extends Document {
  connectionProfileId: mongoose.Types.ObjectId;
  userId: String;
  skillCategory: string;
  skillSubCategory: string;
  customSkill?: string;
  currentLevel: 'complete-beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';
  seekingRole: 'mentor-teacher' | 'learning-partner' | 'want-to-teach';
  style: (
    | 'structured-lessons'
    | 'casual-guidance'
    | 'project-based'
    | 'qa-as-needed'
    | 'accountability-buddy'
    | 'study-together'
    | 'share-resources'
    | 'joint-projects'
  )[];
  learningMode: 'online' | 'offline' | 'hybrid';
  timeCommitment: {
    level: 'intensive' | 'regular' | 'casual' | 'very-casual';
    hoursPerWeek?: number;
    preferredSlots: string[];
  };
  learningGoals?: string;
  specificRequirements: {
    languages?: string[];
    ageRange?: {
      min: number;
      max: number;
    };
    sameCity?: boolean;
    tools?: string[];
  };
  genderPreference: 'male' | 'female' | 'any';
  status: 'active' | 'goal-achieved' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

const SkillPurposeSchema = new Schema<ISkillPurpose>(
  {
    connectionProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionProfile',
      required: true,
      // REMOVED: index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      // REMOVED: index: true
    },
    skillCategory: {
      type: String,
      required: true,
      // REMOVED: index: true
    },
    skillSubCategory: {
      type: String,
      required: true,
      // REMOVED: index: true
    },
    customSkill: {
      type: String,
      maxlength: 100,
    },
    currentLevel: {
      type: String,
      enum: ['complete-beginner', 'novice', 'intermediate', 'advanced', 'expert'],
      required: true,
      // REMOVED: index: true
    },
    seekingRole: {
      type: String,
      enum: ['mentor-teacher', 'learning-partner', 'want-to-teach'],
      required: true,
      // REMOVED: index: true
    },
    style: {
      type: [String],
      enum: [
        'structured-lessons',
        'casual-guidance',
        'project-based',
        'qa-as-needed',
        'accountability-buddy',
        'study-together',
        'share-resources',
        'joint-projects',
      ],
      default: [],
    },
    learningMode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: true,
    },
    timeCommitment: {
      type: {
        level: {
          type: String,
          enum: ['intensive', 'regular', 'casual', 'very-casual'],
          required: true,
        },
        hoursPerWeek: { type: Number },
        preferredSlots: { type: [String], default: [] },
      },
      required: true,
    },
    learningGoals: {
      type: String,
      maxlength: 300,
    },
    specificRequirements: {
      type: {
        languages: { type: [String], default: [] },
        ageRange: {
          type: {
            min: { type: Number },
            max: { type: Number },
          },
          required: false,
        },
        sameCity: { type: Boolean, default: false },
        tools: { type: [String], default: [] },
      },
      default: {},
    },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'any'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'goal-achieved', 'paused'],
      default: 'active',
      // REMOVED: index: true
    },
  },
  { timestamps: true }
);

// Define all indexes here
SkillPurposeSchema.index({ connectionProfileId: 1 });
SkillPurposeSchema.index({ userId: 1 });
SkillPurposeSchema.index({ skillCategory: 1, skillSubCategory: 1 });
SkillPurposeSchema.index({ seekingRole: 1, currentLevel: 1 });
SkillPurposeSchema.index({ status: 1 });

export default mongoose.model<ISkillPurpose>('SkillPurpose', SkillPurposeSchema);