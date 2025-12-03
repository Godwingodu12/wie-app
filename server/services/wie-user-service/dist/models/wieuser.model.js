import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
// Helper function to convert Prisma camelCase to snake_case
const toDatabaseFormat = (user) => {
    return {
        id: user.id,
        email: user.email,
        contact_no: user.contactNo,
        password: user.password,
        name: user.name,
        username: user.username,
        profile_picture: user.profilePicture,
        country_id: user.countryId,
        role: user.role,
        status: user.status,
        bio: user.bio,
        location: user.location,
        latitude: user.latitude,
        longitude: user.longitude,
        isOnline: user.isOnline,
        is_blocked: user.isBlocked,
        is_verified: user.isVerified,
        google_id: user.googleId, // NEW
        auth_provider: user.authProvider, // NEW
        created_at: user.createdAt,
        updated_at: user.updatedAt,
    };
};
class WieUserModel {
    async create(userData) {
        const user = await prisma.wieUser.create({
            data: {
                email: userData.email || null,
                contactNo: userData.contact_no || null,
                password: userData.password || null,
                name: userData.name || null,
                username: userData.username || null,
                profilePicture: userData.profile_picture || null,
                countryId: userData.country_id || null,
                googleId: userData.google_id || null, // NEW
                authProvider: userData.auth_provider || 'local', // NEW
                status: userData.auth_provider === 'google' ? 'active' : 'pending', // Auto-activate Google users
                isVerified: userData.auth_provider === 'google' ? true : false, // Auto-verify Google users
            },
        });
        return toDatabaseFormat(user);
    }
    async findByEmail(email) {
        const user = await prisma.wieUser.findUnique({
            where: { email },
        });
        return user ? toDatabaseFormat(user) : null;
    }
    async findByContactNo(contact_no) {
        const user = await prisma.wieUser.findUnique({
            where: { contactNo: contact_no },
        });
        return user ? toDatabaseFormat(user) : null;
    }
    async findByUsername(username) {
        const user = await prisma.wieUser.findUnique({
            where: { username },
        });
        return user ? toDatabaseFormat(user) : null;
    }
    async findById(id) {
        const user = await prisma.wieUser.findUnique({
            where: { id },
        });
        return user ? toDatabaseFormat(user) : null;
    }
    async findByGoogleId(google_id) {
        const user = await prisma.wieUser.findUnique({
            where: { googleId: google_id },
        });
        return user ? toDatabaseFormat(user) : null;
    }
    async findByEmailOrContactNo(identifier) {
        const user = await prisma.wieUser.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { contactNo: identifier },
                ],
            },
        });
        return user ? toDatabaseFormat(user) : null;
    }
    async updateVerificationStatus(id, is_verified) {
        const user = await prisma.wieUser.update({
            where: { id },
            data: {
                isVerified: is_verified,
                status: is_verified ? 'active' : 'pending',
            },
        });
        return toDatabaseFormat(user);
    }
    async updateProfile(id, updates) {
        const user = await prisma.wieUser.update({
            where: { id },
            data: {
                name: updates.name,
                profilePicture: updates.profile_picture,
                email: updates.email,
                contactNo: updates.contact_no,
                username: updates.username,
                countryId: updates.country_id,
                bio: updates.bio,
            },
        });
        return toDatabaseFormat(user);
    }
    async linkGoogleAccount(id, googleData) {
        const updateData = {
            googleId: googleData.google_id,
            authProvider: googleData.auth_provider,
            isVerified: true, // Auto-verify when linking Google
            status: 'active', // Auto-activate when linking Google
            updatedAt: new Date(),
        };
        // Only update profile picture if it's defined
        if (googleData.profile_picture) {
            updateData.profilePicture = googleData.profile_picture;
        }
        const user = await prisma.wieUser.update({
            where: { id },
            data: updateData,
        });
        return toDatabaseFormat(user);
    }
    async getLocation(id) {
        const user = await prisma.wieUser.findUnique({
            where: { id },
            select: {
                location: true,
                latitude: true,
                longitude: true,
            },
        });
        if (!user)
            return null;
        return {
            location: user.location,
            latitude: user.latitude ?? null,
            longitude: user.longitude ?? null,
        };
    }
    async updateLocation(id, updates) {
        const user = await prisma.wieUser.update({
            where: { id },
            data: {
                location: updates.location ?? undefined,
                latitude: updates.latitude ?? undefined,
                longitude: updates.longitude ?? undefined,
            },
            select: {
                location: true,
                latitude: true,
                longitude: true,
            },
        });
        return {
            location: user.location,
            latitude: user.latitude ?? null,
            longitude: user.longitude ?? null,
        };
    }
    async deleteUser(id) {
        await prisma.wieUser.delete({
            where: { id },
        });
    }
    async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const user = await prisma.wieUser.update({
            where: { id },
            data: {
                password: hashedPassword,
                updatedAt: new Date(), // Explicitly update the timestamp
            },
        });
        if (!user) {
            throw new Error('Failed to update password');
        }
        return toDatabaseFormat(user);
    }
    async setPasswordForOAuthUser(id, hashedPassword) {
        const user = await prisma.wieUser.update({
            where: { id },
            data: {
                password: hashedPassword,
                authProvider: 'hybrid', // Now supports both OAuth and password login
                updatedAt: new Date(),
            },
        });
        return toDatabaseFormat(user);
    }
    // Delete unverified users older than specified minutes
    async deleteUnverifiedUsers(olderThanMinutes) {
        const cutoffDate = new Date(Date.now() - olderThanMinutes * 60000);
        const result = await prisma.wieUser.deleteMany({
            where: {
                isVerified: false,
                status: 'pending',
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        return result.count;
    }
    async disconnect() {
        await prisma.$disconnect();
    }
}
export default new WieUserModel();
//# sourceMappingURL=wieuser.model.js.map