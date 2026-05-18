import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShare extends Document {
  postId: string;
  userId: string;
  receiverId: string;
  createdAt: Date;
}

const ShareSchema = new Schema<IShare>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    receiverId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ShareSchema.index({ postId: 1, createdAt: -1 });
ShareSchema.index({ userId: 1, createdAt: -1 });

const ShareModel: Model<IShare> = mongoose.model<IShare>("Share", ShareSchema);
export default ShareModel;
