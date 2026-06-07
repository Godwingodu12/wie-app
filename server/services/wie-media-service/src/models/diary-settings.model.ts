import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiarySettings extends Document {
  userId: string;

  // Default visibility for newly created diaries
  defaultVisibility: "public" | "followers" | "close_friends" | "only_me";

  // Default interaction rules
  interactions: {
    allowReplies: boolean;
    allowReactions: boolean;
    allowSharing: boolean;
    allowShareAsMessage: boolean;
  };

  // Auto-highlight / AI curation
  autoHighlight: {
    enabled: boolean;
    basedOnTags: boolean;
    basedOnLocation: boolean;
    aiSuggestions: boolean;
  };

  // Organisation preferences
  organization: {
    displayMode: "grid" | "scroll";
    defaultSortOrder: "newest" | "oldest" | "custom";
    enableGrouping: boolean;
  };

  // Cover style default
  coverStyle: "minimal" | "story_preview" | "custom_theme";

  // Lifecycle
  lifecycle: {
    keepForever: boolean;
    autoExpireAfterDays: number | null; // null = forever; 30 | 90 | custom
    archiveInsteadOfDelete: boolean;
  };

  // Analytics
  analyticsEnabled: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const DiarySettingsSchema = new Schema<IDiarySettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },

    defaultVisibility: {
      type: String,
      enum: ["public", "followers", "close_friends", "only_me"],
      default: "followers",
    },

    interactions: {
      allowReplies: { type: Boolean, default: true },
      allowReactions: { type: Boolean, default: true },
      allowSharing: { type: Boolean, default: true },
      allowShareAsMessage: { type: Boolean, default: true },
    },

    autoHighlight: {
      enabled: { type: Boolean, default: false },
      basedOnTags: { type: Boolean, default: false },
      basedOnLocation: { type: Boolean, default: false },
      aiSuggestions: { type: Boolean, default: false },
    },

    organization: {
      displayMode: { type: String, enum: ["grid", "scroll"], default: "grid" },
      defaultSortOrder: {
        type: String,
        enum: ["newest", "oldest", "custom"],
        default: "newest",
      },
      enableGrouping: { type: Boolean, default: false },
    },

    coverStyle: {
      type: String,
      enum: ["minimal", "story_preview", "custom_theme"],
      default: "story_preview",
    },

    lifecycle: {
      keepForever: { type: Boolean, default: true },
      autoExpireAfterDays: { type: Number, default: null },
      archiveInsteadOfDelete: { type: Boolean, default: true },
    },

    analyticsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const DiarySettingsModel: Model<IDiarySettings> =
  mongoose.models.DiarySettings ||
  mongoose.model<IDiarySettings>("DiarySettings", DiarySettingsSchema);

export default DiarySettingsModel;
