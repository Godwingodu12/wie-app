// models/otp.model.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  otp_value: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expires: 0 } 
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
// Additional compound index for better query performance
otpSchema.index({ user_id: 1, created_at: -1 });
export const OTP = mongoose.model('OTP', otpSchema);
