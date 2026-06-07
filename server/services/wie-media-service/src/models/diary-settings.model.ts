import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDiarySettings extends Document {
  userId: string;
  defaultVisibility: "public" | "followers" | "close_friends" | "only_me";
  allowComments: boolean;
  allowReactions: boolean;
  allowSharing: boolean;
  showFluxCount: boolean;
  autoArchive: boolean;
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
    allowComments: { type: Boolean, default: true },
    allowReactions: { type: Boolean, default: true },
    allowSharing: { type: Boolean, default: true },
    showFluxCount: { type: Boolean, default: true },
    autoArchive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const DiarySettingsModel: Model<IDiarySettings> =
  mongoose.models.DiarySettings ||
  mongoose.model<IDiarySettings>("DiarySettings", DiarySettingsSchema);

export default DiarySettingsModel;
