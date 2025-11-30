export interface OTP {
    id: string;
    user_id?: string | null;
    temp_id?: string | null;
    otp_value: string;
    otp_type: string;
    expires_at: Date;
    created_at: Date;
}
export interface CreateOtpInput {
    user_id?: string | null;
    temp_id?: string | null;
    otp_value: string;
    otp_type?: string;
    expires_at: Date;
}
declare class OtpModel {
    /**
     * Create a new OTP record
     */
    create(otpData: CreateOtpInput): Promise<OTP>;
    /**
     * Find OTP by user_id and otp_value
     */
    findByUserAndValue(userId: string, otpValue: string): Promise<OTP | null>;
    /**
     * Find OTP by temp_id and otp_value
     */
    findByTempIdAndValue(tempId: string, otpValue: string): Promise<OTP | null>;
    /**
     * Find latest OTP for a user
     */
    findLatestByUser(userId: string): Promise<OTP | null>;
    /**
     * Find latest OTP for a temp ID
     */
    findLatestByTempId(tempId: string): Promise<OTP | null>;
    /**
     * Find all valid (non-expired) OTPs for a user
     */
    findValidByUser(userId: string): Promise<OTP[]>;
    /**
     * Delete all OTPs by user ID
     */
    deleteByUserId(userId: string): Promise<number>;
    /**
     * Delete all OTPs by temp ID
     */
    deleteByTempId(tempId: string): Promise<number>;
    /**
     * Delete expired OTPs for a specific user
     */
    deleteExpiredByUserId(userId: string): Promise<number>;
    /**
     * Delete expired OTPs for a specific temp ID
     */
    deleteExpiredByTempId(tempId: string): Promise<number>;
    /**
     * Delete all expired OTPs (cleanup)
     */
    deleteAllExpired(): Promise<number>;
    /**
     * Get all OTPs (for debugging/admin purposes)
     */
    findAll(): Promise<OTP[]>;
    /**
     * Get distinct user IDs that have active OTPs
     */
    getActiveUserIds(): Promise<string[]>;
    /**
     * Check if OTP exists and is valid
     */
    isValid(identifier: string, otpValue: string): Promise<boolean>;
    /**
     * Count OTPs for a user or temp ID
     */
    countByIdentifier(identifier: string): Promise<number>;
    disconnect(): Promise<void>;
}
declare const _default: OtpModel;
export default _default;
//# sourceMappingURL=otp.model.d.ts.map