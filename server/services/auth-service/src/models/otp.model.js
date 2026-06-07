// models/otp.model.js
import mongoose from 'mongoose';
const otpSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for faster queries
  },
  otp_value: {
    type: String,
    required: true
  },
  expires_at: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});
// expireAfterSeconds: 0 means delete immediately when expires_at passes
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
// Additional compound index for efficient OTP lookup
otpSchema.index({ user_id: 1, otp_value: 1 });
// Compound index for better query performance
otpSchema.index({ user_id: 1, created_at: -1 });
// Log when OTP is created
otpSchema.post('save', function(doc) {
  console.log(`📝 OTP saved - User: ${doc.user_id}, Expires: ${doc.expires_at}`);
});
// Log when OTP is deleted
otpSchema.post('deleteMany', function(result) {
  if (result.deletedCount > 0) {
    console.log(`🗑️  Deleted ${result.deletedCount} OTP document(s)`);
  }
});
export const OTP = mongoose.model('OTP', otpSchema);
