import prisma from "../lib/prisma";
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

// Helper function to convert Prisma format to snake_case
const toDatabaseFormat = (otp: any): OTP => {
  return {
    id: otp.id,
    user_id: otp.userId,
    temp_id: otp.tempId,
    otp_value: otp.otpValue,
    otp_type: otp.otpType,
    expires_at: otp.expiresAt,
    created_at: otp.createdAt,
  };
};

class OtpModel {
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries = 2,
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isConnectionError =
          error?.code === "P1001" ||
          error?.code === "P1002" ||
          error?.code === "P1008";
        if (isConnectionError && attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Max retries exceeded");
  }
  /**
   * Create a new OTP record
   */
  async create(otpData: CreateOtpInput): Promise<OTP> {
    const otp = await prisma.otp.create({
      data: {
        userId: otpData.user_id || null,
        tempId: otpData.temp_id || null,
        otpValue: otpData.otp_value,
        otpType: otpData.otp_type || "signup",
        expiresAt: otpData.expires_at,
      },
    });
    return toDatabaseFormat(otp);
  }

  /**
   * Find OTP by user_id and otp_value
   */
  async findByUserAndValue(
    userId: string,
    otpValue: string,
  ): Promise<OTP | null> {
    const otp = await this.withRetry(() =>
      prisma.otp.findFirst({
        where: { userId, otpValue, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    );
    return otp ? toDatabaseFormat(otp) : null;
  }

  /**
   * Find OTP by temp_id and otp_value
   */
  async findByTempIdAndValue(
    tempId: string,
    otpValue: string,
  ): Promise<OTP | null> {
    const otp = await this.withRetry(() =>
      prisma.otp.findFirst({
        where: { tempId, otpValue, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    );
    return otp ? toDatabaseFormat(otp) : null;
  }
  async findLatestByUser(userId: string): Promise<OTP | null> {
    const otp = await prisma.otp.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return otp ? toDatabaseFormat(otp) : null;
  }
  async findLatestByTempId(tempId: string): Promise<OTP | null> {
    const otp = await prisma.otp.findFirst({
      where: { tempId },
      orderBy: { createdAt: "desc" },
    });
    return otp ? toDatabaseFormat(otp) : null;
  }

  /**
   * Find all valid (non-expired) OTPs for a user
   */
  async findValidByUser(userId: string): Promise<OTP[]> {
    const otps = await prisma.otp.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return otps.map(toDatabaseFormat);
  }

  /**
   * Delete all OTPs by user ID
   */
  async deleteByUserId(userId: string): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * Delete all OTPs by temp ID
   */
  async deleteByTempId(tempId: string): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: { tempId },
    });
    return result.count;
  }

  /**
   * Delete expired OTPs for a specific user
   */
  async deleteExpiredByUserId(userId: string): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: {
        userId,
        expiresAt: { lte: new Date() },
      },
    });
    return result.count;
  }

  /**
   * Delete expired OTPs for a specific temp ID
   */
  async deleteExpiredByTempId(tempId: string): Promise<number> {
    const result = await prisma.otp.deleteMany({
      where: {
        tempId,
        expiresAt: { lte: new Date() },
      },
    });
    return result.count;
  }

  /**
   * Delete all expired OTPs (cleanup)
   */
  async deleteAllExpired(): Promise<number> {
    try {
      const result = await prisma.otp.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
      return result.count;
    } catch {
      return 0;
    }
  }

  /**
   * Get all OTPs (for debugging/admin purposes)
   */
  async findAll(): Promise<OTP[]> {
    const otps = await prisma.otp.findMany({
      orderBy: { createdAt: "desc" },
    });
    return otps.map(toDatabaseFormat);
  }

  /**
   * Get distinct user IDs that have active OTPs
   */
  async getActiveUserIds(): Promise<string[]> {
    const otps = await prisma.otp.findMany({
      select: {
        userId: true,
        tempId: true,
      },
      distinct: ["userId", "tempId"],
    });

    const ids: string[] = [];
    otps.forEach((otp) => {
      if (otp.userId) ids.push(otp.userId);
      if (otp.tempId) ids.push(otp.tempId);
    });

    return [...new Set(ids)];
  }

  /**
   * Check if OTP exists and is valid
   */
  async isValid(identifier: string, otpValue: string): Promise<boolean> {
    const isTemp = identifier.startsWith("temp_");
    const otp = await prisma.otp.findFirst({
      where: {
        ...(isTemp ? { tempId: identifier } : { userId: identifier }),
        otpValue,
        expiresAt: { gt: new Date() },
      },
    });
    return !!otp;
  }

  /**
   * Count OTPs for a user or temp ID
   */
  async countByIdentifier(identifier: string): Promise<number> {
    const isTemp = identifier.startsWith("temp_");
    const count = await prisma.otp.count({
      where: isTemp ? { tempId: identifier } : { userId: identifier },
    });
    return count;
  }
  async countAttemptsByIdentifier(
    identifier: string,
    minutes: number = 15,
  ): Promise<number> {
    const cutoffTime = new Date(Date.now() - minutes * 60000);

    const isTemporary = identifier.startsWith("temp_");

    const count = await prisma.otp.count({
      where: {
        ...(isTemporary ? { tempId: identifier } : { userId: identifier }),
        createdAt: {
          gte: cutoffTime,
        },
      },
    });

    return count;
  }
}

export default new OtpModel();
