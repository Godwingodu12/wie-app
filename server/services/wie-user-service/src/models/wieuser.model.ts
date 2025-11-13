import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export interface WieUser {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  password: string;
  name?: string | null;  // Made nullable
  username?: string | null;
  profile_picture?: string | null;
  country_id?: string | null;
  role: string;
  status: string;
  bio?: string | null;
  is_blocked: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email?: string;
  contact_no?: string;
  password: string;
  name?: string;  // Made optional
  username?: string;
  profile_picture?: string;
  country_id?: string;
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
        password: userData.password,
        name: userData.name || null,  // Can be null
        username: userData.username || null,
        profilePicture: userData.profile_picture || null,
        countryId: userData.country_id || null,
        status: 'pending',
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
