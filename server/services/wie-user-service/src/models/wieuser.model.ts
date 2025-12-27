import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

export interface WieUser {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  password?: string | null;  // Made nullable for OAuth
  name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
  country_id?: string | null;
  role: string;
  status: string;
  bio?: string | null;
  location: string;
  following_count: number;
  followers_count: number;
  posts_count: number;
  latitude?: number | null;     
  longitude?: number | null;
  isOnline: boolean; 
  is_blocked: boolean;
  is_verified: boolean;
  google_id?: string | null;  
  auth_provider: string;  
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email?: string;
  contact_no?: string;
  password?: string;  // Made optional for OAuth
  name?: string;
  username?: string;
  profile_picture?: string;
  country_id?: string;
  google_id?: string;  // NEW
  auth_provider?: string;  // NEW
}

// Helper function to convert Prisma camelCase to snake_case
const toDatabaseFormat = (user: any): WieUser => {
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
    following_count: user.followingCount,
    followers_count: user.followersCount,
    posts_count: user.postsCount,      
    latitude: user.latitude,          
    longitude: user.longitude, 
    isOnline: user.isOnline, 
    is_blocked: user.isBlocked,
    is_verified: user.isVerified,
    google_id: user.googleId,  // NEW
    auth_provider: user.authProvider,  // NEW
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
};

class WieUserModel {
  async create(userData: CreateUserInput): Promise<WieUser> {
    const user = await prisma.wieUser.create({
      data: {
        email: userData.email || null,
        contactNo: userData.contact_no || null,
        password: userData.password || null,
        name: userData.name || null,
        username: userData.username || null,
        profilePicture: userData.profile_picture || null,
        countryId: userData.country_id || null,
        googleId: userData.google_id || null,  // NEW
        authProvider: userData.auth_provider || 'local',  // NEW
        status: userData.auth_provider === 'google' ? 'active' : 'pending',  // Auto-activate Google users
        isVerified: userData.auth_provider === 'google' ? true : false,  // Auto-verify Google users
      },
    });
    return toDatabaseFormat(user);
  }

  async findByEmail(email: string): Promise<WieUser | null> {
    const user = await prisma.wieUser.findUnique({
      where: { email },
    });
    return user ? toDatabaseFormat(user) : null;
  }

  async findByContactNo(contact_no: string): Promise<WieUser | null> {
    const user = await prisma.wieUser.findUnique({
      where: { contactNo: contact_no },
    });
    return user ? toDatabaseFormat(user) : null;
  }
  async count(search?: string): Promise<number> {
    return prisma.wieUser.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { contactNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
    });
  }
  async findByUsername(username: string): Promise<WieUser | null> {
    const user = await prisma.wieUser.findUnique({
      where: { username },
    });
    return user ? toDatabaseFormat(user) : null;
  }
  async findById(id: string): Promise<WieUser | null> {
    const user = await prisma.wieUser.findUnique({
      where: { id },
    });
    return user ? toDatabaseFormat(user) : null;
  }
  async findByGoogleId(google_id: string): Promise<WieUser | null> {  // NEW
    const user = await prisma.wieUser.findUnique({
      where: { googleId: google_id },
    });
    return user ? toDatabaseFormat(user) : null;
  }
async findMany(
  page: number,
  limit: number,
  search?: string
): Promise<WieUser[]> {
  const skip = (page - 1) * limit;

  const users = await prisma.wieUser.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { contactNo: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
    skip,
    take: limit,
    orderBy: {
      followersCount: 'desc',
    },
  });

  return users.map(toDatabaseFormat);
}

  async findByEmailOrContactNo(identifier: string): Promise<WieUser | null> {
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

  async updateVerificationStatus(id: string, is_verified: boolean): Promise<WieUser> {
    const user = await prisma.wieUser.update({
      where: { id },
      data: { 
        isVerified: is_verified,
        status: is_verified ? 'active' : 'pending',
      },
    });
    return toDatabaseFormat(user);
  }

  async updateProfile(id: string, updates: {
    name?: string;
    profile_picture?: string;
    email?: string;
    contact_no?: string;
    username?: string;
    country_id?: string;
    bio?: string;
  }): Promise<WieUser> {
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
  async linkGoogleAccount(
    id: string,
    googleData: {
      google_id: string;
      profile_picture?: string;
      auth_provider: string;
    }
  ): Promise<WieUser> {
    const updateData: any = {
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
  async getLocation(id: string): Promise<{ location?: string | null; latitude?: number | null; longitude?: number | null } | null> {
    const user = await prisma.wieUser.findUnique({
      where: { id },
      select: {
        location: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!user) return null;
    return {
      location: user.location,
      latitude: user.latitude ?? null,
      longitude: user.longitude ?? null,
    };
  }
  async updateLocation(id: string, updates: {
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  }): Promise<{ location?: string | null; latitude?: number | null; longitude?: number | null }> {
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
  async deleteUser(id: string): Promise<void> {
    await prisma.wieUser.delete({
      where: { id },
    });
  }
  async updatePassword(id: string, newPassword: string): Promise<WieUser> {
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
  async setPasswordForOAuthUser(id: string, hashedPassword: string): Promise<WieUser> {
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
  async deleteUnverifiedUsers(olderThanMinutes: number): Promise<number> {
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
  async incrementFollowers(userId: string) {
    await prisma.wieUser.update({
      where: { id: userId },
      data: {
        followersCount: { increment: 1 },
      },
    });
  }
  async incrementFollowing(userId: string) {
  await prisma.wieUser.update({
    where: { id: userId },
    data: {
      followingCount: { increment: 1 },
    },
  });
}
  async decrementFollowing(userId: string) {
    await prisma.wieUser.update({
      where: { id: userId },  
      data: {
        followingCount: { decrement: 1 },
      },
    });
  }
  async decrementFollowers(userId: string) {
    await prisma.wieUser.update({
      where: { id: userId },
      data: {
        followersCount: { decrement: 1 },
      },
    });
  }
  async incrementPosts(userId: string) {
    await prisma.wieUser.update({
      where: { id: userId },
      data: {
        postsCount: { increment: 1 },
      },
    });
  }
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}
export default new WieUserModel();
