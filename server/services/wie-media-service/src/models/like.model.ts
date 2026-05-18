import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILike extends Document {
  postId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    emoji: { type: String, default: "❤️" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound unique — one like per user per post
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const LikeModel: Model<ILike> = mongoose.model<ILike>("Like", LikeSchema);
export default LikeModel;
