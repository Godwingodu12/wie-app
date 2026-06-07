import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFluxScreenshotEvent extends Document {
  fluxId: string;
  userId: string;
  timestamp: Date;
}

const FluxScreenshotEventSchema = new Schema<IFluxScreenshotEvent>({
  fluxId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

FluxScreenshotEventSchema.index({ fluxId: 1, userId: 1 }, { unique: true });

const FluxScreenshotEventModel: Model<IFluxScreenshotEvent> =
  mongoose.models.FluxScreenshotEvent ||
  mongoose.model<IFluxScreenshotEvent>(
    "FluxScreenshotEvent",
    FluxScreenshotEventSchema,
  );

export default FluxScreenshotEventModel;
