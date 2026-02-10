import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
export interface MuteOptions {
  mutePosts?: boolean;
  muteStories?: boolean;
  muteReels?: boolean;
  muteNotes?: boolean;
}

export interface MuteStatus {
  isMuted: boolean;
  mutePosts: boolean;
  muteStories: boolean;
  muteReels: boolean;
  muteNotes: boolean;
}

class UserMuteModel {
  async muteUser(
    muterId: string,
    mutedId: string,
    options: MuteOptions = {}
  ): Promise<any> {
    try {
      // Validate that user is not muting themselves
      if (muterId === mutedId) {
        throw new Error('Cannot mute yourself');
      }

      // Check if both users exist
      const [muter, muted] = await Promise.all([
        prisma.wieUser.findUnique({ where: { id: muterId } }),
        prisma.wieUser.findUnique({ where: { id: mutedId } })
      ]);

      if (!muter) {
        throw new Error('Muter user not found');
      }

      if (!muted) {
        throw new Error('User to mute not found');
      }

      // Create or update mute record
      const muteRecord = await prisma.userMute.upsert({
        where: {
          unique_mute: {
            muterId,
            mutedId
          }
        },
        update: {
          mutePosts: options.mutePosts ?? true,
          muteStories: options.muteStories ?? true,
          muteReels: options.muteReels ?? false,
          muteNotes: options.muteNotes ?? false
        },
        create: {
          muterId,
          mutedId,
          mutePosts: options.mutePosts ?? true,
          muteStories: options.muteStories ?? true,
          muteReels: options.muteReels ?? false,
          muteNotes: options.muteNotes ?? false
        }
      });

      return muteRecord;
    } catch (error) {
      console.error('Error in muteUser:', error);
      throw error;
    }
  }

  /**
   * Unmute a user completely
   */
  async unmuteUser(muterId: string, mutedId: string): Promise<boolean> {
    try {
      const result = await prisma.userMute.deleteMany({
        where: {
          muterId,
          mutedId
        }
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error in unmuteUser:', error);
      throw error;
    }
  }

  /**
   * Update mute options for a specific user
   */
  async updateMuteOptions(
    muterId: string,
    mutedId: string,
    options: MuteOptions
  ): Promise<any> {
    try {
      const muteRecord = await prisma.userMute.findUnique({
        where: {
          unique_mute: {
            muterId,
            mutedId
          }
        }
      });

      if (!muteRecord) {
        throw new Error('Mute record not found');
      }

      const updated = await prisma.userMute.update({
        where: {
          unique_mute: {
            muterId,
            mutedId
          }
        },
        data: {
          mutePosts: options.mutePosts ?? muteRecord.mutePosts,
          muteStories: options.muteStories ?? muteRecord.muteStories,
          muteReels: options.muteReels ?? muteRecord.muteReels,
          muteNotes: options.muteNotes ?? muteRecord.muteNotes
        }
      });

      return updated;
    } catch (error) {
      console.error('Error in updateMuteOptions:', error);
      throw error;
    }
  }

  /**
   * Check if a user is muted
   */
  async checkMuteStatus(
    muterId: string,
    mutedId: string
  ): Promise<MuteStatus> {
    try {
      const muteRecord = await prisma.userMute.findUnique({
        where: {
          unique_mute: {
            muterId,
            mutedId
          }
        }
      });

      if (!muteRecord) {
        return {
          isMuted: false,
          mutePosts: false,
          muteStories: false,
          muteReels: false,
          muteNotes: false
        };
      }

      return {
        isMuted: true,
        mutePosts: muteRecord.mutePosts,
        muteStories: muteRecord.muteStories,
        muteReels: muteRecord.muteReels,
        muteNotes: muteRecord.muteNotes
      };
    } catch (error) {
      console.error('Error in checkMuteStatus:', error);
      throw error;
    }
  }

  /**
   * Get all users muted by a specific user
   */
  async getMutedUsers(muterId: string): Promise<any[]> {
    try {
      const mutedUsers = await prisma.userMute.findMany({
        where: { muterId },
        include: {
          muted: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePicture: true,
              isVerified: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return mutedUsers.map(mute => ({
        id: mute.id,
        userId: mute.muted.id,
        username: mute.muted.username,
        name: mute.muted.name,
        profilePicture: mute.muted.profilePicture,
        isVerified: mute.muted.isVerified,
        mutePosts: mute.mutePosts,
        muteStories: mute.muteStories,
        muteReels: mute.muteReels,
        muteNotes: mute.muteNotes,
        mutedAt: mute.createdAt
      }));
    } catch (error) {
      console.error('Error in getMutedUsers:', error);
      throw error;
    }
  }

  /**
   * Check multiple users' mute status at once (for feed filtering)
   */
  async checkMultipleMuteStatus(
    muterId: string,
    userIds: string[]
  ): Promise<Map<string, MuteStatus>> {
    try {
      const muteRecords = await prisma.userMute.findMany({
        where: {
          muterId,
          mutedId: { in: userIds }
        }
      });

      const statusMap = new Map<string, MuteStatus>();

      // Initialize all users as not muted
      userIds.forEach(userId => {
        statusMap.set(userId, {
          isMuted: false,
          mutePosts: false,
          muteStories: false,
          muteReels: false,
          muteNotes: false
        });
      });

      // Update with actual mute records
      muteRecords.forEach(record => {
        statusMap.set(record.mutedId, {
          isMuted: true,
          mutePosts: record.mutePosts,
          muteStories: record.muteStories,
          muteReels: record.muteReels,
          muteNotes: record.muteNotes
        });
      });

      return statusMap;
    } catch (error) {
      console.error('Error in checkMultipleMuteStatus:', error);
      throw error;
    }
  }

  /**
   * Get count of muted users
   */
  async getMutedCount(muterId: string): Promise<number> {
    try {
      return await prisma.userMute.count({
        where: { muterId }
      });
    } catch (error) {
      console.error('Error in getMutedCount:', error);
      throw error;
    }
  }
}

export default new UserMuteModel();
