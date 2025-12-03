import { PrismaClient } from '../generated/prisma';
const prisma = new PrismaClient();
// Helper function to convert Prisma format to snake_case
const toDatabaseFormat = (otp) => {
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
    /**
     * Create a new OTP record
     */
    async create(otpData) {
        const otp = await prisma.otp.create({
            data: {
                userId: otpData.user_id || null,
                tempId: otpData.temp_id || null,
                otpValue: otpData.otp_value,
                otpType: otpData.otp_type || 'signup',
                expiresAt: otpData.expires_at,
            },
        });
        return toDatabaseFormat(otp);
    }
    /**
     * Find OTP by user_id and otp_value
     */
    async findByUserAndValue(userId, otpValue) {
        const otp = await prisma.otp.findFirst({
            where: {
                userId,
                otpValue,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        return otp ? toDatabaseFormat(otp) : null;
    }
    /**
     * Find OTP by temp_id and otp_value
     */
    async findByTempIdAndValue(tempId, otpValue) {
        const otp = await prisma.otp.findFirst({
            where: {
                tempId,
                otpValue,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        return otp ? toDatabaseFormat(otp) : null;
    }
    /**
     * Find latest OTP for a user
     */
    async findLatestByUser(userId) {
        const otp = await prisma.otp.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return otp ? toDatabaseFormat(otp) : null;
    }
    /**
     * Find latest OTP for a temp ID
     */
    async findLatestByTempId(tempId) {
        const otp = await prisma.otp.findFirst({
            where: { tempId },
            orderBy: { createdAt: 'desc' },
        });
        return otp ? toDatabaseFormat(otp) : null;
    }
    /**
     * Find all valid (non-expired) OTPs for a user
     */
    async findValidByUser(userId) {
        const otps = await prisma.otp.findMany({
            where: {
                userId,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        return otps.map(toDatabaseFormat);
    }
    /**
     * Delete all OTPs by user ID
     */
    async deleteByUserId(userId) {
        const result = await prisma.otp.deleteMany({
            where: { userId },
        });
        return result.count;
    }
    /**
     * Delete all OTPs by temp ID
     */
    async deleteByTempId(tempId) {
        const result = await prisma.otp.deleteMany({
            where: { tempId },
        });
        return result.count;
    }
    /**
     * Delete expired OTPs for a specific user
     */
    async deleteExpiredByUserId(userId) {
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
    async deleteExpiredByTempId(tempId) {
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
    async deleteAllExpired() {
        const result = await prisma.otp.deleteMany({
            where: {
                expiresAt: { lte: new Date() },
            },
        });
        return result.count;
    }
    /**
     * Get all OTPs (for debugging/admin purposes)
     */
    async findAll() {
        const otps = await prisma.otp.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return otps.map(toDatabaseFormat);
    }
    /**
     * Get distinct user IDs that have active OTPs
     */
    async getActiveUserIds() {
        const otps = await prisma.otp.findMany({
            select: {
                userId: true,
                tempId: true,
            },
            distinct: ['userId', 'tempId'],
        });
        const ids = [];
        otps.forEach((otp) => {
            if (otp.userId)
                ids.push(otp.userId);
            if (otp.tempId)
                ids.push(otp.tempId);
        });
        return [...new Set(ids)];
    }
    /**
     * Check if OTP exists and is valid
     */
    async isValid(identifier, otpValue) {
        const isTemp = identifier.startsWith('temp_');
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
    async countByIdentifier(identifier) {
        const isTemp = identifier.startsWith('temp_');
        const count = await prisma.otp.count({
            where: isTemp ? { tempId: identifier } : { userId: identifier },
        });
        return count;
    }
    async disconnect() {
        await prisma.$disconnect();
    }
}
export default new OtpModel();
//# sourceMappingURL=otp.model.js.map