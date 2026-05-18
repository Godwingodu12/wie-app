import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISave extends Document {
  postId: string;
  userId: string;
  savedCollection?: string;
  createdAt: Date;
}

const SaveSchema = new Schema<ISave>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    savedCollection: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SaveSchema.index({ postId: 1, userId: 1 }, { unique: true });
SaveSchema.index({ userId: 1, createdAt: -1 });

const SaveModel: Model<ISave> = mongoose.model<ISave>("Save", SaveSchema);

export default SaveModel;
