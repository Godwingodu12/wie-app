import otpModel from '../models/otp.model';
import { v4 as uuidv4 } from 'uuid';

interface VerifyOtpResult {
  isValid: boolean;
  message: string;
}

class OtpService {
  private cleanupTimers: Map<string, NodeJS.Timeout>;
  private cleanupIntervalId?: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor() {
    this.cleanupTimers = new Map();
  }

  /**
   * Initialize the OTP service after database connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  OTP Service already initialized');
      return;
    }

    try {
      // Run initial cleanup
      const initialCleanup = await this.cleanupAllExpiredOtps();
      if (initialCleanup > 0) {
        console.log(`🧹 Initial cleanup: Deleted ${initialCleanup} expired OTP(s)`);
      }

      // Start periodic cleanup
      this.startPeriodicCleanup();
      
      this.isInitialized = true;
      console.log('✅ OTP Service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing OTP service:', error);
      throw error;
    }
  }

  /**
   * Insert a new OTP for a user
   */
  async insertOTP(userId: string, otp: string, expirationMinutes: number): Promise<string> {
    try {
      // Delete all existing OTPs for this user
      await this.deleteAllOtps(userId);

      // Clear any existing cleanup timer
      if (this.cleanupTimers.has(userId)) {
        clearTimeout(this.cleanupTimers.get(userId)!);
        this.cleanupTimers.delete(userId);
      }

      const expiresAt = new Date(Date.now() + expirationMinutes * 60000);

      // Create OTP using model
      await otpModel.create({
        user_id: userId,
        otp_value: otp,
        expires_at: expiresAt,
      });

      console.log(`✅ OTP created for user ${userId}, expires at: ${expiresAt.toISOString()}`);

      // Schedule cleanup after expiration (with 5-second buffer)
      const cleanupDelay = expirationMinutes * 60000 + 5000;
      const timerId = setTimeout(async () => {
        try {
          const deletedCount = await this.deleteAllOtps(userId);
          if (deletedCount > 0) {
            console.log(`⏰ Auto-cleanup: Deleted ${deletedCount} expired OTP(s) for user: ${userId}`);
          }
          this.cleanupTimers.delete(userId);
        } catch (error) {
          console.error('Error in scheduled cleanup:', error);
        }
      }, cleanupDelay);

      this.cleanupTimers.set(userId, timerId);
      console.log(`⏲️  Scheduled auto-cleanup for user ${userId} in ${expirationMinutes} minute(s)`);

      return otp;
    } catch (error) {
      console.error('❌ Error inserting OTP:', error);
      throw error;
    }
  }

  /**
   * Start periodic cleanup of expired OTPs
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every 2 minutes
    this.cleanupIntervalId = setInterval(async () => {
      try {
        const deletedCount = await this.cleanupAllExpiredOtps();
        if (deletedCount > 0) {
          console.log(`🧹 Periodic cleanup: Deleted ${deletedCount} expired OTP(s) at ${new Date().toISOString()}`);
        }
      } catch (error) {
        console.error('❌ Periodic cleanup error:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    // Ensure cleanup doesn't prevent process from exiting
    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref();
    }
  }

  /**
   * Delete expired OTPs for a specific user
   */
  async deleteExpiredOtps(userId: string): Promise<number> {
    try {
      const deletedCount = await otpModel.deleteExpiredByUserId(userId);

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} expired OTP(s) for user: ${userId}`);
        
        // Clear cleanup timer if exists
        if (this.cleanupTimers.has(userId)) {
          clearTimeout(this.cleanupTimers.get(userId)!);
          this.cleanupTimers.delete(userId);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Error deleting expired OTPs for user:', error);
      return 0;
    }
  }

  /**
   * Cleanup all expired OTPs from database
   */
  async cleanupAllExpiredOtps(): Promise<number> {
    try {
      const deletedCount = await otpModel.deleteAllExpired();

      if (deletedCount > 0) {
        // Clear timers for users who no longer have OTPs
        const activeUserIds = await otpModel.getActiveUserIds();
        const activeUserSet = new Set(activeUserIds);

        for (const [userId, timer] of this.cleanupTimers.entries()) {
          if (!activeUserSet.has(userId)) {
            clearTimeout(timer);
            this.cleanupTimers.delete(userId);
          }
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Error in cleanupAllExpiredOtps:', error);
      return 0;
    }
  }

  /**
   * Delete all OTPs for a specific user
   */
  async deleteAllOtps(userId: string): Promise<number> {
    try {
      const deletedCount = await otpModel.deleteByUserId(userId);

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} OTP(s) for user: ${userId}`);
        
        // Clear cleanup timer
        if (this.cleanupTimers.has(userId)) {
          clearTimeout(this.cleanupTimers.get(userId)!);
          this.cleanupTimers.delete(userId);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Error deleting all OTPs for user:', error);
      return 0;
    }
  }

  /**
   * Verify OTP for a user
   */
  async verifyOtp(userId: string, otpValue: string): Promise<VerifyOtpResult> {
    try {
      // Clean up expired OTPs first
      const expiredDeleted = await this.deleteExpiredOtps(userId);
      if (expiredDeleted > 0) {
        console.log(`🧹 Cleaned up ${expiredDeleted} expired OTP(s) before verification`);
      }

      // Find valid OTP
      const otpRecord = await otpModel.findByUserAndValue(userId, otpValue);

      if (!otpRecord) {
        // Check if any OTP exists for this user (might be expired)
        const latestOtp = await otpModel.findLatestByUser(userId);

        if (latestOtp && new Date() > new Date(latestOtp.expires_at)) {
          console.log(`⚠️  OTP expired for user: ${userId}`);
          await this.deleteAllOtps(userId);
          return {
            isValid: false,
            message: 'OTP has expired. Please request a new one.',
          };
        }

        return {
          isValid: false,
          message: 'Invalid OTP',
        };
      }

      // Double-check expiration
      if (new Date() > new Date(otpRecord.expires_at)) {
        console.log(`⚠️  OTP expired (double-check) for user: ${userId}`);
        await this.deleteAllOtps(userId);
        return {
          isValid: false,
          message: 'OTP has expired. Please request a new one.',
        };
      }

      // Verify this is the latest OTP
      const latestOtp = await otpModel.findLatestByUser(userId);

      if (latestOtp && latestOtp.id !== otpRecord.id) {
        return {
          isValid: false,
          message: 'This OTP is no longer valid. Please use the latest OTP sent to you.',
        };
      }

      // OTP is valid - delete all OTPs for this user
      await this.deleteAllOtps(userId);

      console.log(`✅ OTP verified successfully for user: ${userId}`);
      return {
        isValid: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      return {
        isValid: false,
        message: 'Error verifying OTP. Please try again.',
      };
    }
  }

  /**
   * Manual cleanup trigger
   */
  async manualCleanup(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const deletedCount = await this.cleanupAllExpiredOtps();
      console.log(`🧹 Manual cleanup completed. Deleted ${deletedCount} expired OTP(s)`);
      return { success: true, deletedCount };
    } catch (error: any) {
      console.error('❌ Manual cleanup error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all OTPs (for debugging/admin purposes)
   */
  async getAllOtps(): Promise<any[]> {
    try {
      const otps = await otpModel.findAll();
      const now = new Date();

      return otps.map((otp) => ({
        ...otp,
        isExpired: now > new Date(otp.expires_at),
        timeUntilExpiry:
          new Date(otp.expires_at) > now
            ? Math.round((new Date(otp.expires_at).getTime() - now.getTime()) / 1000) + ' seconds'
            : 'expired',
      }));
    } catch (error) {
      console.error('❌ Error getting all OTPs:', error);
      return [];
    }
  }

  /**
   * Get cleanup status
   */
  getCleanupStatus(): { activeTimers: number; userIds: string[] } {
    return {
      activeTimers: this.cleanupTimers.size,
      userIds: Array.from(this.cleanupTimers.keys()),
    };
  }

  /**
   * Cleanup service on shutdown
   */
  cleanup(): void {
    console.log('🧹 Cleaning up OTP service...');
    
    // Clear all timers
    for (const [userId, timer] of this.cleanupTimers.entries()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();

    // Clear periodic cleanup interval
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }

    this.isInitialized = false;
    console.log('✅ OTP service cleanup completed');
  }
}

export default new OtpService();