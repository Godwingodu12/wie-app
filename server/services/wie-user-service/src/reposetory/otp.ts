import otpModel from '../models/otp.model';
import redisClient from '../config/redis';

interface VerifyOtpResult {
  isValid: boolean;
  message: string;
}

interface OtpLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  message: string;
}

class OtpService {
  private cleanupTimers: Map<string, NodeJS.Timeout>;
  private cleanupIntervalId?: NodeJS.Timeout;
  private isInitialized: boolean = false;
  private readonly OTP_LIMIT: number;
  private readonly OTP_LIMIT_WINDOW_MINUTES: number = 15;
  private useRedis: boolean = false;

  constructor() {
    this.cleanupTimers = new Map();
    this.OTP_LIMIT = parseInt(process.env.OTP_LIMIT || '3', 10);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️  OTP Service already initialized');
      return;
    }

    try {
      // Try to connect to Redis
      try {
        await redisClient.connect();
        this.useRedis = true;
        console.log('✅ OTP Service using Redis for distributed state');
      } catch (error) {
        console.warn('⚠️  Redis not available, using in-memory storage');
        this.useRedis = false;
      }

      // Run initial cleanup
      const initialCleanup = await this.cleanupAllExpiredOtps();
      if (initialCleanup > 0) {
        console.log(`🧹 Initial cleanup: Deleted ${initialCleanup} expired OTP(s)`);
      }

      // Start periodic cleanup
      this.startPeriodicCleanup();
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing OTP service:', error);
      throw error;
    }
  }

  /**
   * Check if user has exceeded OTP request limit (Redis-backed)
   */
  async checkOtpLimit(identifier: string): Promise<OtpLimitResult> {
    try {
      if (this.useRedis) {
        return await this.checkOtpLimitRedis(identifier);
      } else {
        return await this.checkOtpLimitDatabase(identifier);
      }
    } catch (error) {
      console.error('❌ Error checking OTP limit:', error);
      // Allow request on error to avoid blocking legitimate users
      return {
        allowed: true,
        remainingAttempts: this.OTP_LIMIT,
        message: 'Limit check unavailable',
      };
    }
  }

  /**
   * Redis-based rate limiting (for load-balanced environments)
   */
  private async checkOtpLimitRedis(identifier: string): Promise<OtpLimitResult> {
    const redis = redisClient.getClient();
    const key = `otp:limit:${identifier}`;
    const windowSeconds = this.OTP_LIMIT_WINDOW_MINUTES * 60;

    // Get current attempt count
    const attempts = await redis.get(key);
    const attemptCount = attempts ? parseInt(attempts, 10) : 0;

    const remainingAttempts = Math.max(0, this.OTP_LIMIT - attemptCount);
    const allowed = attemptCount < this.OTP_LIMIT;

    if (!allowed) {
      const ttl = await redis.ttl(key);
      const minutesRemaining = Math.ceil(ttl / 60);
      return {
        allowed: false,
        remainingAttempts: 0,
        message: `Too many OTP requests. Please try again after ${minutesRemaining} minute(s).`,
      };
    }

    return {
      allowed: true,
      remainingAttempts,
      message: `${remainingAttempts} attempt(s) remaining`,
    };
  }

  /**
   * Database-based rate limiting (fallback)
   */
  private async checkOtpLimitDatabase(identifier: string): Promise<OtpLimitResult> {
    const attemptCount = await otpModel.countAttemptsByIdentifier(
      identifier,
      this.OTP_LIMIT_WINDOW_MINUTES
    );

    const remainingAttempts = Math.max(0, this.OTP_LIMIT - attemptCount);
    const allowed = attemptCount < this.OTP_LIMIT;

    if (!allowed) {
      return {
        allowed: false,
        remainingAttempts: 0,
        message: `Too many OTP requests. Please try again after ${this.OTP_LIMIT_WINDOW_MINUTES} minutes.`,
      };
    }

    return {
      allowed: true,
      remainingAttempts,
      message: `${remainingAttempts} attempt(s) remaining`,
    };
  }

  /**
   * Increment OTP attempt counter in Redis
   */
  private async incrementOtpAttempt(identifier: string): Promise<void> {
    if (!this.useRedis) return;

    const redis = redisClient.getClient();
    const key = `otp:limit:${identifier}`;
    const windowSeconds = this.OTP_LIMIT_WINDOW_MINUTES * 60;

    const current = await redis.incr(key);
    if (current === 1) {
      // Set expiry on first attempt
      await redis.expire(key, windowSeconds);
    }
  }

  async insertOTP(
    identifier: string,
    otp: string,
    expirationMinutes: number,
    otpType: 'signup' | 'login' | 'reset' = 'signup'
  ): Promise<string> {
    try {
      // Check OTP limit before inserting
      const limitCheck = await this.checkOtpLimit(identifier);

      if (!limitCheck.allowed) {
        throw new Error(limitCheck.message);
      }

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

      // Increment attempt counter in Redis
      await this.incrementOtpAttempt(identifier);

      console.log(`✅ OTP created for ${isTemporary ? 'temp' : 'user'} ${identifier}, expires at: ${expiresAt.toISOString()}`);
      console.log(`🔒 Remaining attempts: ${limitCheck.remainingAttempts - 1}/${this.OTP_LIMIT}`);

      // Schedule auto-cleanup
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
    }, 60 * 1000);

    if (this.cleanupIntervalId.unref) {
      this.cleanupIntervalId.unref();
    }
  }

  async verifyOtp(identifier: string, otpValue: string): Promise<VerifyOtpResult> {
    try {
      const isTemporary = identifier.startsWith('temp_');

      const otpRecord = isTemporary
        ? await otpModel.findByTempIdAndValue(identifier, otpValue)
        : await otpModel.findByUserAndValue(identifier, otpValue);

      if (!otpRecord) {
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

      // OTP is valid - delete all OTPs and clear rate limit
      await this.deleteAllOtps(identifier);
      
      // Clear rate limit on successful verification
      if (this.useRedis) {
        const redis = redisClient.getClient();
        await redis.del(`otp:limit:${identifier}`);
      }

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

  async cleanupAllExpiredOtps(): Promise<number> {
    try {
      const deletedCount = await otpModel.deleteAllExpired();
      return deletedCount;
    } catch (error) {
      console.error('❌ Error in cleanupAllExpiredOtps:', error);
      return 0;
    }
  }

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
