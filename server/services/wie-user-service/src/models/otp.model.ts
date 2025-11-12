import db from '../config/db';

export interface OTP {
  id: string;
  user_id: string; // Can be UUID or temporary string ID
  otp_value: string;
  expires_at: Date;
  created_at: Date;
}

export interface CreateOtpInput {
  user_id: string;
  otp_value: string;
  expires_at: Date;
}

class OtpModel {
  /**
   * Create a new OTP record
   */
  async create(otpData: CreateOtpInput): Promise<OTP> {
    const query = `
      INSERT INTO otps (user_id, otp_value, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const values = [
      otpData.user_id,
      otpData.otp_value,
      otpData.expires_at,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find OTP by user_id and otp_value
   */
  async findByUserAndValue(userId: string, otpValue: string): Promise<OTP | null> {
    const query = `
      SELECT * FROM otps 
      WHERE user_id = $1 AND otp_value = $2 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId, otpValue]);
    return result.rows[0] || null;
  }

  /**
   * Find latest OTP for a user
   */
  async findLatestByUser(userId: string): Promise<OTP | null> {
    const query = `
      SELECT * FROM otps 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find all valid (non-expired) OTPs for a user
   */
  async findValidByUser(userId: string): Promise<OTP[]> {
    const query = `
      SELECT * FROM otps 
      WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete all OTPs for a specific user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const query = 'DELETE FROM otps WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rowCount || 0;
  }

  /**
   * Delete expired OTPs for a specific user
   */
  async deleteExpiredByUserId(userId: string): Promise<number> {
    const query = `
      DELETE FROM otps 
      WHERE user_id = $1 AND expires_at <= CURRENT_TIMESTAMP
    `;
    const result = await db.query(query, [userId]);
    return result.rowCount || 0;
  }

  /**
   * Delete all expired OTPs (cleanup)
   */
  async deleteAllExpired(): Promise<number> {
    const query = 'DELETE FROM otps WHERE expires_at <= CURRENT_TIMESTAMP';
    const result = await db.query(query);
    return result.rowCount || 0;
  }

  /**
   * Get all OTPs (for debugging/admin purposes)
   */
  async findAll(): Promise<OTP[]> {
    const query = 'SELECT * FROM otps ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get distinct user IDs that have active OTPs
   */
  async getActiveUserIds(): Promise<string[]> {
    const query = 'SELECT DISTINCT user_id FROM otps';
    const result = await db.query(query);
    return result.rows.map(row => row.user_id);
  }

  /**
   * Check if OTP exists and is valid
   */
  async isValid(userId: string, otpValue: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM otps 
        WHERE user_id = $1 
        AND otp_value = $2 
        AND expires_at > CURRENT_TIMESTAMP
      ) as exists
    `;
    const result = await db.query(query, [userId, otpValue]);
    return result.rows[0].exists;
  }

  /**
   * Count OTPs for a user
   */
  async countByUserId(userId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM otps WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

export default new OtpModel();