// services/otpService.js
import { OTP } from '../models/otp.model.js';

class OtpService {
  constructor() {
    // Start the cleanup job when service is initialized
    this.startPeriodicCleanup();
  }

  async insertOTP(userId, otp, expirationMinutes) {
    try {
      // Delete all existing OTPs for this user before creating a new one
      await this.deleteAllOtps(userId);
      
      const expiresAt = new Date(Date.now() + expirationMinutes * 60000);
      const otpDocument = new OTP({
        user_id: userId,
        otp_value: otp,
        expires_at: expiresAt,
      });
      
      await otpDocument.save();
      console.log(`OTP created for user ${userId}, expires at: ${expiresAt}`);
      
      // Schedule immediate cleanup after expiration (as backup to MongoDB TTL)
      setTimeout(async () => {
        try {
          const deletedCount = await this.deleteExpiredOtps(userId);
          if (deletedCount > 0) {
            console.log(`Timeout cleanup: Deleted ${deletedCount} expired OTPs for user: ${userId}`);
          }
        } catch (error) {
          console.error('Error in timeout cleanup:', error);
        }
      }, expirationMinutes * 60000 + 2000); // Add 2 second buffer
      
      return otp;
    } catch (error) {
      console.error('Error inserting OTP:', error);
      throw error;
    }
  }

  // Start periodic cleanup every 15 seconds (more aggressive)
  startPeriodicCleanup() {
    const cleanupInterval = setInterval(async () => {
      try {
        const deletedCount = await this.cleanupAllExpiredOtps();
        if (deletedCount > 0) {
          console.log(`Periodic cleanup: Deleted ${deletedCount} expired OTPs`);
        }
      } catch (error) {
        console.error('Periodic cleanup error:', error);
      }
    }, 15000); // Run every 15 seconds

    // Ensure cleanup doesn't prevent process from exiting
    cleanupInterval.unref();
  }

  // Delete expired OTPs for a specific user
  async deleteExpiredOtps(userId) {
    try {
      const now = new Date();
      const result = await OTP.deleteMany({ 
        user_id: userId,
        expires_at: { $lt: now }
      });
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting expired OTPs for user:', error);
      return 0;
    }
  }

  // Clean up all expired OTPs
  async cleanupAllExpiredOtps() {
    try {
      const now = new Date();
      const result = await OTP.deleteMany({ expires_at: { $lt: now } });
      return result.deletedCount;
    } catch (error) {
      console.error('Error in cleanupAllExpiredOtps:', error);
      return 0;
    }
  }

  async deleteAllOtps(userId) {
    try {
      const result = await OTP.deleteMany({ user_id: userId });
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting all OTPs for user:', error);
      return 0;
    }
  }

  async verifyOtp(userId, otpValue) {
    try {
      // First clean up any expired OTPs
      await this.deleteExpiredOtps(userId);
      
      // Find the OTP for this user
      const otpDocument = await OTP.findOne({ 
        user_id: userId, 
        otp_value: otpValue 
      }).sort({ created_at: -1 });

      if (!otpDocument) {
        return { isValid: false, message: 'Invalid OTP' };
      }

      const now = new Date();
      if (now > otpDocument.expires_at) {
        // Clean up expired OTPs
        await this.deleteAllOtps(userId);
        return { isValid: false, message: 'OTP has expired. Please request a new one.' };
      }

      // Verify this is the latest OTP
      const latestOtp = await OTP.findOne({ user_id: userId })
        .sort({ created_at: -1 });
      
      if (latestOtp && latestOtp._id.toString() !== otpDocument._id.toString()) {
        return { isValid: false, message: 'This OTP is no longer valid. Please use the latest OTP sent to you.' };
      }

      // OTP is valid, delete all OTPs for this user
      await this.deleteAllOtps(userId);
      console.log(`OTP verified and deleted for user: ${userId}`);
      return { isValid: true, message: 'OTP verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { isValid: false, message: 'Error verifying OTP. Please try again.' };
    }
  }

  // Manual cleanup method (can be called from API endpoint for testing)
  async manualCleanup() {
    try {
      const deletedCount = await this.cleanupAllExpiredOtps();
      console.log(`Manual cleanup completed. Deleted ${deletedCount} expired OTPs`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Manual cleanup error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OtpService();
