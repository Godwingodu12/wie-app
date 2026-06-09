import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMusicLike extends Document {
  musicId: string;
  userId: string;
  title: string;
  artist: string;
  previewUrl: string;
  albumArt: string;
  createdAt: Date;
}

const MusicLikeSchema = new Schema<IMusicLike>(
  {
    musicId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String },
    artist: { type: String },
    previewUrl: { type: String },
    albumArt: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MusicLikeSchema.index({ musicId: 1, userId: 1 }, { unique: true });

const MusicLikeModel: Model<IMusicLike> = mongoose.model<IMusicLike>("MusicLike", MusicLikeSchema);
export default MusicLikeModel;
