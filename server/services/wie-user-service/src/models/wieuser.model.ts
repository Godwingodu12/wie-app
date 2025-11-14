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
  is_blocked: boolean;
  is_verified: boolean;
  google_id?: string | null;  // NEW
  auth_provider: string;  // NEW
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

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export default new WieUserModel();
