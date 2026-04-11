import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFluxSettings extends Document {
  userId: string;

  // Visibility
  visibility: "public" | "followers" | "close_friends" | "only_me";
  hideFrom:   string[];

  // Top-level alias kept in sync with interactions.replies
  allowReplies: "everyone" | "mutual" | "off";

  // Interactions
  interactions: {
    replies:        "everyone" | "mutual" | "off";
    reactions:      boolean;
    messageReplies: boolean;
  };

  // Sharing
  sharing: {
    reshare:        boolean;
    shareToMessage: boolean;
    externalShare:  boolean;
  };

  // ✅ Renamed from `save` → `saveSettings` to avoid conflict with Document.save()
  saveSettings: {
    saveToDevice: boolean;
    archive:      boolean;
    drafts:       boolean;
  };

  // Advanced
  advanced: {
    duration:        24 | 48 | 72;
    analytics:       boolean;
    screenshotAlert: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const FluxSettingsSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },

    visibility: {
      type:    String,
      enum:    ["public", "followers", "close_friends", "only_me"],
      default: "followers",
    },
    hideFrom: { type: [String], default: [] },

    allowReplies: {
      type:    String,
      enum:    ["everyone", "mutual", "off"],
      default: "everyone",
    },

    interactions: {
      replies: {
        type:    String,
        enum:    ["everyone", "mutual", "off"],
        default: "everyone",
      },
      reactions:      { type: Boolean, default: true  },
      messageReplies: { type: Boolean, default: true  },
    },

    sharing: {
      reshare:        { type: Boolean, default: true  },
      shareToMessage: { type: Boolean, default: true  },
      externalShare:  { type: Boolean, default: false },
    },
    // Schema path stays as `save` so existing DB documents are unaffected.
    // The interface uses `saveSettings` to avoid the Document.save() collision.
    save: {
      saveToDevice: { type: Boolean, default: false },
      archive:      { type: Boolean, default: true  },
      drafts:       { type: Boolean, default: true  },
    },

    advanced: {
      duration:        { type: Number, enum: [24, 48, 72], default: 24    },
      analytics:       { type: Boolean,                    default: true  },
      screenshotAlert: { type: Boolean,                    default: false },
    },
  },
  { timestamps: true },
);

const FluxSettingsModel: Model<IFluxSettings> =
  mongoose.models.FluxSettings ||
  mongoose.model<IFluxSettings>("FluxSettings", FluxSettingsSchema);

export default FluxSettingsModel;