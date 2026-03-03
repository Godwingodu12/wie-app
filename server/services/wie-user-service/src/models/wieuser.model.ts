import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';
export interface WieUser {
  id: string;
  email?: string | null;
  contact_no?: string | null;
  password?: string | null;  
  name?: string | null;
  username?: string | null;
  profile_picture?: string | null;
  gender?: string | null;
  dob?: Date | null;
  country_id?: string | null;
  location_source?: string | null;
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
  lastSeenAt: Date | null;
  is_blocked: boolean;
  is_verified: boolean;
  google_id?: string | null;  
  token_version: number;
  auth_provider: string;  
  allowMessagesFrom?: string | null;
  allowMessageRequests?: boolean | null;
  accountPrivacy?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email?: string;
  contact_no?: string;
  password?: string;  
  name?: string;
  username?: string;
  profile_picture?: string;
  gender?: string;
  dob?: Date;
  country_id?: string;
  role?: string;
  status?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isOnline?: boolean;
  lastSeenAt?: Date | null;
  accountPrivacy?: string;
  is_blocked?: boolean;
  is_verified?: boolean;
  token_version?: number;
  google_id?: string;  
  auth_provider?: string;  
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
    gender: user.gender,
    dob: user.dob,
    country_id: user.countryId,
    role: user.role,
    status: user.status,
    bio: user.bio,
    location: user.location,    
    following_count: user.followingCount,
    followers_count: user.followersCount,
    location_source: user.locationSource ?? null,
    posts_count: user.postsCount,      
    latitude: user.latitude,          
    longitude: user.longitude, 
    isOnline: user.isOnline, 
    lastSeenAt: user.lastSeenAt,
    is_blocked: user.isBlocked,
    is_verified: user.isVerified,
    google_id: user.googleId,  
    token_version: user.tokenVersion,
    auth_provider: user.authProvider, 
    allowMessagesFrom: user.allowMessagesFrom,  
    allowMessageRequests: user.allowMessageRequests,  
    accountPrivacy: user.accountPrivacy,
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
        gender: userData.gender || null,
        dob: userData.dob || null,
        countryId: userData.country_id || null,
        googleId: userData.google_id || null,  
        lastSeenAt: userData.lastSeenAt || null,
        accountPrivacy: userData.accountPrivacy || 'public',
        authProvider: userData.auth_provider || 'local',  
        status: userData.auth_provider === 'google' ? 'active' : 'pending', 
        isVerified: userData.auth_provider === 'google' ? true : false,  
      },
    });
    return toDatabaseFormat(user);
  }

  async findByIds(userIds: string[]): Promise<any[]> {
    try {
      const users = await prisma.wieUser.findMany({
        where: {
          id: {
            in: userIds
          },
          status: 'active'
        },
        select: {
          id: true,
          email: true,
          contactNo: true,
          name: true,
          username: true,
          profilePicture: true,
          gender: true,
          dob: true,
          countryId: true,
          role: true,
          status: true,
          bio: true,
          location: true,
          latitude: true,
          longitude: true,
          isOnline: true,
          lastSeenAt: true,
          isBlocked: true,
          isVerified: true,
          googleId: true,
          authProvider: true,
          createdAt: true,
          updatedAt: true,
          allowMessagesFrom: true,
          allowMessageRequests: true,
          accountPrivacy: true
        }
      });
      return users.map(toDatabaseFormat);
    } catch (error) {
      console.error('Error in findByIds:', error);
      return [];
    }
  }

  async search(filter: any, limit: number): Promise<any[]> {
    try {
      const whereClause: any = {
        status: 'active'
      };

      if (filter.$or && Array.isArray(filter.$or)) {
        whereClause.OR = filter.$or.map((condition: any) => {
          const key = Object.keys(condition)[0];
          const value = condition[key];
          
          let searchTerm = '';
          if (value && typeof value === 'object' && value.$regex) {
            searchTerm = value.$regex;
          } else if (typeof value === 'string') {
            searchTerm = value;
          }

          return {
            [key]: {
              contains: searchTerm,
              mode: 'insensitive' as const
            }
          };
        });
      }

      if (filter.id && filter.id.$ne) {
        whereClause.id = {
          not: filter.id.$ne
        };
      }

      const users = await prisma.wieUser.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          contactNo: true,
          name: true,
          username: true,
          profilePicture: true,
          gender: true,
          dob: true,
          countryId: true,
          role: true,
          status: true,
          bio: true,
          location: true,
          latitude: true,
          longitude: true,
          isOnline: true,
          lastSeenAt: true,
          accountPrivacy: true,
          isBlocked: true,
          isVerified: true,
          googleId: true,
          authProvider: true,
          createdAt: true,
          updatedAt: true
        },
        take: limit,
        orderBy: [
          { followersCount: 'desc' },
          { name: 'asc' }
        ]
      });

      return users.map(toDatabaseFormat);
    } catch (error) {
      return [];
    }
  }

  async findByEmail(email: string): Promise<WieUser | null> {
    const user = await prisma.wieUser.findUnique({
      where: { email },
    });
    return user ? toDatabaseFormat(user) : null;
  }

  async incrementTokenVersion(id: string): Promise<WieUser | null> {
    try {
      const exists = await prisma.wieUser.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) {
        console.warn(`incrementTokenVersion: user ${id} not found, skipping`);
        return null;
      }
      const user = await prisma.wieUser.update({
        where: { id },
        data: {
          tokenVersion: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      return toDatabaseFormat(user);
    } catch (error: any) {
      console.warn(`incrementTokenVersion failed for ${id}:`, error.message);
      return null;
    }
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
    if (user) {
      const formatted = toDatabaseFormat(user);
      return formatted;
    }
    return null;
  }

  async findByGoogleId(google_id: string): Promise<WieUser | null> {
    try {
      const user = await prisma.wieUser.findUnique({
        where: { googleId: google_id },
      });
      if (!user) return null;
      // Sanitize locationSource in case old array value still in DB
      if (Array.isArray((user as any).locationSource)) {
        (user as any).locationSource = null;
      }
      return toDatabaseFormat(user);
    } catch (error: any) {
      // If field conversion fails (old array data), fetch with raw query
      console.warn('findByGoogleId Prisma error, trying raw fallback:', error.message);
      try {
        const results = await prisma.$queryRaw<any[]>`
          SELECT * FROM wie_users WHERE google_id = ${google_id} LIMIT 1
        `;
        if (!results.length) return null;
        const raw = results[0];
        // Fix the bad field
        raw.locationSource = null;
        raw.location_source = null;
        return toDatabaseFormat({
          ...raw,
          locationSource: null,
          contactNo: raw.contact_no,
          profilePicture: raw.profile_picture,
          countryId: raw.country_id,
          isBlocked: raw.is_blocked,
          isVerified: raw.is_verified,
          googleId: raw.google_id,
          authProvider: raw.auth_provider,
          isOnline: raw.is_online,
          followersCount: raw.followers_count,
          followingCount: raw.following_count,
          postsCount: raw.posts_count,
          tokenVersion: raw.token_version,
          allowMessageRequests: raw.allow_message_requests,
          allowMessagesFrom: raw.allow_messages_from,
          lastSeenAt: raw.last_seen_at,
          accountPrivacy: raw.account_privacy,
          createdAt: raw.created_at,
          updatedAt: raw.updated_at,
        });
      } catch (rawErr) {
        console.error('findByGoogleId raw fallback failed:', rawErr);
        return null;
      }
    }
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
    accountPrivacy?: string;
    gender?: string;
    dob?: Date;
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
        accountPrivacy: updates.accountPrivacy,
        gender: updates.gender,
        dob: updates.dob,
      },
    });
    return toDatabaseFormat(user);
  }
  async updateAccountPrivacy(id: string, accountPrivacy: string): Promise<WieUser> {
      const user = await prisma.wieUser.update({
        where: { id },
        data: {
          accountPrivacy: accountPrivacy,
          updatedAt: new Date(),
        },
      });
      return toDatabaseFormat(user);
  }
  async getAccountPrivacy(id: string): Promise<string> {
    const user = await prisma.wieUser.findUnique({
      where: { id },
      select: {
        accountPrivacy: true,
      },
    });
    const privacy = user?.accountPrivacy;
    return privacy === 'private' ? 'private' : 'public';
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
      isVerified: true,
      status: 'active',
      updatedAt: new Date(),
    };

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
        updatedAt: new Date(),
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
        authProvider: 'hybrid',
        updatedAt: new Date(),
      },
    });
    return toDatabaseFormat(user);
  }

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

  async updateOnlineStatus(id: string, isOnline: boolean): Promise<WieUser | null> {
    try {
      const exists = await prisma.wieUser.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!exists) {
        return null;
      }
      const updateData: any = {
        isOnline,
        updatedAt: new Date(),
      };
      if (!isOnline) {
        updateData.lastSeenAt = new Date();
      }
      const user = await prisma.wieUser.update({
        where: { id },
        data: updateData,
      });
      return toDatabaseFormat(user);
    } catch (error: any) {
      console.warn(`updateOnlineStatus failed for ${id}:`, error.message);
      return null;
    }
  }
  async getOnlineStatus(id: string): Promise<{ isOnline: boolean; lastSeenAt: Date | null } | null> {
    const user = await prisma.wieUser.findUnique({
      where: { id },
      select: {
        isOnline: true,
        lastSeenAt: true,
      },
    });
    if (!user) return null;
    return {
      isOnline: user.isOnline,
      lastSeenAt: user.lastSeenAt,
    };
  }
  async findStaleOnlineUsers(lastUpdateThreshold: Date): Promise<WieUser[]> {
    try {
      const users = await prisma.wieUser.findMany({
        where: {
          isOnline: true,
          updatedAt: {
            lt: lastUpdateThreshold
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          isOnline: true,
          lastSeenAt: true,
          updatedAt: true,
          contactNo: true,
          profilePicture: true,
          gender: true,
          dob: true,
          countryId: true,
          role: true,
          status: true,
          bio: true,
          location: true,
          latitude: true,
          longitude: true,
          isBlocked: true,
          isVerified: true,
          googleId: true,
          authProvider: true,
          createdAt: true,
          followingCount: true,
          followersCount: true,
          postsCount: true,
          tokenVersion: true,
          allowMessagesFrom: true,
          allowMessageRequests: true
        }
      });
      
      return users.map(toDatabaseFormat);
    } catch (error) {
      console.error('Error finding stale online users:', error);
      return [];
    }
  }
// FIND saveUserLocation method and REPLACE WITH:
async saveUserLocation(
  userId: string,
  displayName: string,
  latitude: number | null,
  longitude: number | null,
  source: 'gps' | 'manual'
): Promise<void> {
  try {
    // Check user exists first
    const exists = await prisma.wieUser.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) {
      return;
    }
    await prisma.wieUser.update({
      where: { id: userId },
      data: {
        location: displayName || null,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        locationSource: source,
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    // Don't throw — location save failure should never crash the app
    console.warn(`saveUserLocation failed for ${userId}:`, error.message);
  }
}
async getSavedUserLocation(userId: string): Promise<{
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSource: string | null;
} | null> {
   const user = await prisma.wieUser.findUnique({
    where: { id: userId },
    select: {
      location: true,
      latitude: true,
      longitude: true,
      locationSource: true,    
    },
  });
  if (!user) return null;
  return {
    location: user.location ?? null,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    locationSource: user.locationSource ?? null,  
  };
}
}

export default new WieUserModel();
