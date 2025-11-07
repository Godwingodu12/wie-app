import { OTP } from '../models/otp.model.js';
class OtpService {
  constructor() {
    this.cleanupTimers = new Map(); // Store cleanup timers for each user
    this.startPeriodicCleanup();
  }
  async insertOTP(userId, otp, expirationMinutes) {
    try {
      // Delete all existing OTPs for this user before creating a new one
      await this.deleteAllOtps(userId);
      // Clear any existing cleanup timer for this user
      if (this.cleanupTimers.has(userId.toString())) {
        clearTimeout(this.cleanupTimers.get(userId.toString()));
        this.cleanupTimers.delete(userId.toString());
      }
      const expiresAt = new Date(Date.now() + expirationMinutes * 60000);
      const otpDocument = new OTP({
        user_id: userId,
        otp_value: otp,
        expires_at: expiresAt,
      });
      
      await otpDocument.save();
      console.log(`OTP created for user ${userId}, expires at: ${expiresAt}`);
      
      // Schedule cleanup immediately after expiration (1 minute + 5 seconds buffer)
      const cleanupDelay = (expirationMinutes * 60000) + 5000;
      const timerId = setTimeout(async () => {
        try {
          const deletedCount = await this.deleteAllOtps(userId);
          if (deletedCount > 0) {
            console.log(`⏰ Auto-cleanup: Deleted ${deletedCount} expired OTP(s) for user: ${userId}`);
          }
          this.cleanupTimers.delete(userId.toString());
        } catch (error) {
          console.error('Error in scheduled cleanup:', error);
        }
      }, cleanupDelay);
      
      // Store the timer reference
      this.cleanupTimers.set(userId.toString(), timerId);
      console.log(`⏲️  Scheduled auto-cleanup for user ${userId} in ${expirationMinutes} minute(s)`);
      
      return otp;
    } catch (error) {
      console.error('Error inserting OTP:', error);
      throw error;
    }
  }
  // Start periodic cleanup every 15 seconds (more frequent than before)
  startPeriodicCleanup() {
    const cleanupInterval = setInterval(async () => {
      try {
        const deletedCount = await this.cleanupAllExpiredOtps();
        if (deletedCount > 0) {
          console.log(`🧹 Periodic cleanup: Deleted ${deletedCount} expired OTP(s) at ${new Date().toISOString()}`);
        }
      } catch (error) {
        console.error('Periodic cleanup error:', error);
      }
    }, 15000); // Run every 15 seconds

    // Ensure cleanup doesn't prevent process from exiting
    if (cleanupInterval.unref) {
      cleanupInterval.unref();
    }
    
    // Run initial cleanup immediately
    this.cleanupAllExpiredOtps().then(count => {
      if (count > 0) {
        console.log(`🧹 Initial cleanup: Deleted ${count} expired OTP(s)`);
      }
    });
  }

  // Delete expired OTPs for a specific user
  async deleteExpiredOtps(userId) {
    try {
      const now = new Date();
      const result = await OTP.deleteMany({ 
        user_id: userId,
        expires_at: { $lte: now }
      });
      
      if (result.deletedCount > 0) {
        console.log(`🗑️  Deleted ${result.deletedCount} expired OTP(s) for user: ${userId}`);
        // Clear the cleanup timer if OTP was manually deleted
        if (this.cleanupTimers.has(userId.toString())) {
          clearTimeout(this.cleanupTimers.get(userId.toString()));
          this.cleanupTimers.delete(userId.toString());
        }
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting expired OTPs for user:', error);
      return 0;
    }
  }

  // Clean up all expired OTPs across all users
  async cleanupAllExpiredOtps() {
    try {
      const now = new Date();
      const result = await OTP.deleteMany({ expires_at: { $lte: now } });
      
      if (result.deletedCount > 0) {
        // Clear any timers for deleted OTPs
        const remainingOtps = await OTP.find({});
        const remainingUserIds = new Set(remainingOtps.map(otp => otp.user_id.toString()));
        // Clear timers for users whose OTPs were deleted
        for (const [userId, timer] of this.cleanupTimers.entries()) {
          if (!remainingUserIds.has(userId)) {
            clearTimeout(timer);
            this.cleanupTimers.delete(userId);
          }
        }
      }
      return result.deletedCount;
    } catch (error) {
      console.error('Error in cleanupAllExpiredOtps:', error);
      return 0;
    }
  }
  async deleteAllOtps(userId) {
    try {
      const result = await OTP.deleteMany({ user_id: userId });
      
      if (result.deletedCount > 0) {
        console.log(`🗑️  Deleted ${result.deletedCount} OTP(s) for user: ${userId}`);
        // Clear the cleanup timer for this user
        if (this.cleanupTimers.has(userId.toString())) {
          clearTimeout(this.cleanupTimers.get(userId.toString()));
          this.cleanupTimers.delete(userId.toString());
        }
      }
      
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting all OTPs for user:', error);
      return 0;
    }
  }

  async verifyOtp(userId, otpValue) {
    try {
      const now = new Date();      
      // First clean up any expired OTPs for this user
      const expiredDeleted = await this.deleteExpiredOtps(userId);
      if (expiredDeleted > 0) {
        console.log(`🧹 Cleaned up ${expiredDeleted} expired OTP(s) before verification`);
      }
      
      // Find the OTP for this user that hasn't expired
      const otpDocument = await OTP.findOne({ 
        user_id: userId, 
        otp_value: otpValue,
        expires_at: { $gt: now }
      }).sort({ created_at: -1 });

      if (!otpDocument) {
        // Check if there was an OTP with this value (expired or not)
        const anyOtp = await OTP.findOne({ 
          user_id: userId, 
          otp_value: otpValue 
        });
        
        if (anyOtp) {
          // OTP exists but is expired
          console.log(`⚠️  OTP expired for user: ${userId}`);
          await this.deleteAllOtps(userId);
          return { 
            isValid: false, 
            message: 'OTP has expired. Please request a new one.' 
          };
        }
        return { 
          isValid: false, 
          message: 'Invalid OTP' 
        };
      }

      // Additional safety check for expiration
      if (now > otpDocument.expires_at) {
        console.log(`⚠️  OTP expired (double-check) for user: ${userId}`);
        await this.deleteAllOtps(userId);
        return { 
          isValid: false, 
          message: 'OTP has expired. Please request a new one.' 
        };
      }

      // Verify this is the latest OTP
      const latestOtp = await OTP.findOne({ user_id: userId })
        .sort({ created_at: -1 });
      
      if (latestOtp && latestOtp._id.toString() !== otpDocument._id.toString()) {
        return { 
          isValid: false, 
          message: 'This OTP is no longer valid. Please use the latest OTP sent to you.' 
        };
      }
      await this.deleteAllOtps(userId);
      return { 
        isValid: true, 
        message: 'OTP verified successfully' 
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { 
        isValid: false, 
        message: 'Error verifying OTP. Please try again.' 
      };
    }
  }
  // Manual cleanup method for testing/debugging
  async manualCleanup() {
    try {
      const deletedCount = await this.cleanupAllExpiredOtps();
      console.log(`🧹 Manual cleanup completed. Deleted ${deletedCount} expired OTP(s)`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Manual cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all OTPs for debugging (remove in production or protect with auth)
  async getAllOtps() {
    try {
      const otps = await OTP.find({}).sort({ created_at: -1 });
      const now = new Date();
      
      return otps.map(otp => ({
        ...otp.toObject(),
        isExpired: now > otp.expires_at,
        timeUntilExpiry: otp.expires_at > now 
          ? Math.round((otp.expires_at - now) / 1000) + ' seconds'
          : 'expired'
      }));
    } catch (error) {
      console.error('Error getting all OTPs:', error);
      return [];
    }
  }
  // Get status of cleanup timers (for debugging)
  getCleanupStatus() {
    return {
      activeTimers: this.cleanupTimers.size,
      userIds: Array.from(this.cleanupTimers.keys())
    };
  }
  // Cleanup on service shutdown
  cleanup() {
    for (const [userId, timer] of this.cleanupTimers.entries()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
  }
}
// Export singleton instance
export default new OtpService();
