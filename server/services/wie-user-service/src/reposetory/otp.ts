import otpModel from '../models/otp.model';

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
      // Start periodic cleanup every 1 minute
      this.startPeriodicCleanup();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing OTP service:', error);
      throw error;
    }
  }
  async insertOTP(
    identifier: string, 
    otp: string, 
    expirationMinutes: number,
    otpType: 'signup' | 'login' | 'reset' = 'signup'
  ): Promise<string> {
    try {
      const isTemporary = identifier.startsWith('temp_');
      
      // Delete all existing OTPs for this identifier
      const deletedCount = isTemporary 
        ? await otpModel.deleteByTempId(identifier)
        : await otpModel.deleteByUserId(identifier);

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} existing OTP(s) for ${identifier}`);
      }

      // Clear any existing cleanup timer
      if (this.cleanupTimers.has(identifier)) {
        clearTimeout(this.cleanupTimers.get(identifier)!);
        this.cleanupTimers.delete(identifier);
      }

      const expiresAt = new Date(Date.now() + expirationMinutes * 60000);

      // Create OTP using model
      await otpModel.create({
        user_id: isTemporary ? null : identifier,
        temp_id: isTemporary ? identifier : null,
        otp_value: otp,
        otp_type: otpType,
        expires_at: expiresAt,
      });

      console.log(`✅ OTP created for ${isTemporary ? 'temp' : 'user'} ${identifier}, expires at: ${expiresAt.toISOString()}`);

      // Schedule auto-cleanup after 1 minute of expiration
      const cleanupDelay = (expirationMinutes + 1) * 60000;
      const timerId = setTimeout(async () => {
        try {
          const deletedCount = isTemporary 
            ? await otpModel.deleteByTempId(identifier)
            : await otpModel.deleteByUserId(identifier);
          
          if (deletedCount > 0) {
            console.log(`⏰ Auto-cleanup: Deleted ${deletedCount} expired OTP(s) for ${identifier}`);
          }
          this.cleanupTimers.delete(identifier);
        } catch (error) {
          console.error('Error in scheduled cleanup:', error);
        }
      }, cleanupDelay);

      this.cleanupTimers.set(identifier, timerId);

      return otp;
    } catch (error) {
      console.error('❌ Error inserting OTP:', error);
      throw error;
    }
  }

  /**
   * Start periodic cleanup of expired OTPs (every 1 minute)
   */
  private startPeriodicCleanup(): void {
    this.cleanupIntervalId = setInterval(async () => {
      try {
        const deletedCount = await this.cleanupAllExpiredOtps();
        if (deletedCount > 0) {
          console.log(`🧹 Periodic cleanup: Deleted ${deletedCount} expired OTP(s)`);
        }
      } catch (error) {
        console.error('❌ Periodic cleanup error:', error);
      }
    }, 60 * 1000); // 1 minute

    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref();
    }
  }

  /**
   * Verify OTP for a user or temp ID
   */
  async verifyOtp(identifier: string, otpValue: string): Promise<VerifyOtpResult> {
    try {
      const isTemporary = identifier.startsWith('temp_');
      
      // Find valid OTP
      const otpRecord = isTemporary
        ? await otpModel.findByTempIdAndValue(identifier, otpValue)
        : await otpModel.findByUserAndValue(identifier, otpValue);

      if (!otpRecord) {
        // Check if any OTP exists (might be expired)
        const latestOtp = isTemporary
          ? await otpModel.findLatestByTempId(identifier)
          : await otpModel.findLatestByUser(identifier);

        if (latestOtp && new Date() > new Date(latestOtp.expires_at)) {
          await this.deleteAllOtps(identifier);
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

      // OTP is valid - delete all OTPs for this identifier
      await this.deleteAllOtps(identifier);

      console.log(`✅ OTP verified successfully for: ${identifier}`);
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
   * Delete all OTPs for a specific identifier
   */
  async deleteAllOtps(identifier: string): Promise<number> {
    try {
      const isTemporary = identifier.startsWith('temp_');
      const deletedCount = isTemporary
        ? await otpModel.deleteByTempId(identifier)
        : await otpModel.deleteByUserId(identifier);

      if (deletedCount > 0) {
        console.log(`🗑️  Deleted ${deletedCount} OTP(s) for: ${identifier}`);
        
        if (this.cleanupTimers.has(identifier)) {
          clearTimeout(this.cleanupTimers.get(identifier)!);
          this.cleanupTimers.delete(identifier);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ Error deleting all OTPs:', error);
      return 0;
    }
  }

  /**
   * Cleanup all expired OTPs from database
   */
  async cleanupAllExpiredOtps(): Promise<number> {
    try {
      const deletedCount = await otpModel.deleteAllExpired();
      return deletedCount;
    } catch (error) {
      console.error('❌ Error in cleanupAllExpiredOtps:', error);
      return 0;
    }
  }

  /**
   * Cleanup service on shutdown
   */
  cleanup(): void {
    console.log('🧹 Cleaning up OTP service...');
    
    for (const [identifier, timer] of this.cleanupTimers.entries()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }

    this.isInitialized = false;
    console.log('✅ OTP service cleanup completed');
  }
}
export default new OtpService();
