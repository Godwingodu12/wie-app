interface VerifyOtpResult {
    isValid: boolean;
    message: string;
}
declare class OtpService {
    private cleanupTimers;
    private cleanupIntervalId?;
    private isInitialized;
    constructor();
    initialize(): Promise<void>;
    insertOTP(identifier: string, otp: string, expirationMinutes: number, otpType?: 'signup' | 'login' | 'reset'): Promise<string>;
    /**
     * Start periodic cleanup of expired OTPs (every 1 minute)
     */
    private startPeriodicCleanup;
    /**
     * Verify OTP for a user or temp ID
     */
    verifyOtp(identifier: string, otpValue: string): Promise<VerifyOtpResult>;
    /**
     * Delete all OTPs for a specific identifier
     */
    deleteAllOtps(identifier: string): Promise<number>;
    /**
     * Cleanup all expired OTPs from database
     */
    cleanupAllExpiredOtps(): Promise<number>;
    /**
     * Cleanup service on shutdown
     */
    cleanup(): void;
}
declare const _default: OtpService;
export default _default;
//# sourceMappingURL=otp.d.ts.map