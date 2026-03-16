import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import FluxModel from '../models/flux.model';
import DiaryModel from '../models/diary.model';
import * as fluxService from '../services/flux.service';
import * as diaryService from '../services/diary.service';

const MEDIA_PROTO_PATH = path.join(__dirname, '../../../../protos/media.proto');

const packageDefinition = protoLoader.loadSync(MEDIA_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const mediaProto = (grpc.loadPackageDefinition(packageDefinition) as any).media;

const getActiveFluxesByUser = async (call: any, callback: any) => {
  try {
    const { userId, viewerId } = call.request;

    if (!userId || !viewerId) {
      return callback(null, { fluxes: [], error: 'userId and viewerId are required' });
    }

    const fluxes = await fluxService.getUserFluxes(viewerId, userId);

    const formatted = fluxes.map((f) => ({
      id: f._id.toString(),
      user_id: f.userId,
      media_url: f.mediaUrl,
      media_type: f.mediaType,
      caption: f.caption || '',
      visibility: f.visibility,
      view_count: f.views.length,
      reaction_count: f.reactions.length,
      expires_at: f.expiresAt.toISOString(),
      created_at: (f.createdAt as Date).toISOString(),
      music_title: f.musicTitle || '',
      music_artist: f.musicArtist || '',
      duration: f.duration || 0,
    }));

    callback(null, { fluxes: formatted, error: '' });
  } catch (error: any) {
    console.error('❌ getActiveFluxesByUser error:', error);
    callback(null, { fluxes: [], error: error.message });
  }
};

/**
 * Check if a specific user has active (non-expired) fluxes
 * Request: { userId }
 * Response: { hasFlux, fluxCount, error }
 */
const checkUserHasFlux = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;

    if (!userId) {
      return callback(null, { hasFlux: false, fluxCount: 0, error: 'userId is required' });
    }

    const count = await FluxModel.countDocuments({
      userId,
      expiresAt: { $gt: new Date() },
      isDeleted: false,
    });

    callback(null, {
      hasFlux: count > 0,
      fluxCount: count,
      error: '',
    });
  } catch (error: any) {
    console.error('❌ checkUserHasFlux error:', error);
    callback(null, { hasFlux: false, fluxCount: 0, error: error.message });
  }
};

/**
 * Check unseen/seen ring status for a viewer on a user's fluxes
 * Used by profile-service or feed-service to render story ring colours
 * Request: { viewerId, ownerId }
 * Response: { status: 'unseen' | 'seen' | 'none', error }
 */
const getFluxRingStatus = async (call: any, callback: any) => {
  try {
    const { viewerId, ownerId } = call.request;

    if (!viewerId || !ownerId) {
      return callback(null, { status: 'none', error: 'viewerId and ownerId are required' });
    }

    const activeFluxes = await FluxModel.find({
      userId: ownerId,
      expiresAt: { $gt: new Date() },
      isDeleted: false,
    }).select('views');

    if (activeFluxes.length === 0) {
      return callback(null, { status: 'none', error: '' });
    }

    // If any flux has NOT been viewed by this viewer → unseen
    const hasUnseen = activeFluxes.some(
      (flux) => !flux.views.some((v) => v.viewerId === viewerId)
    );

    callback(null, {
      status: hasUnseen ? 'unseen' : 'seen',
      error: '',
    });
  } catch (error: any) {
    console.error('❌ getFluxRingStatus error:', error);
    callback(null, { status: 'none', error: error.message });
  }
};

/**
 * Get flux ring statuses for multiple users at once
 * Used by feed-service to render rings for all users in a single call
 * Request: { viewerId, ownerIds: string[] }
 * Response: { statuses: RingStatus[], error }
 */
const getBatchFluxRingStatus = async (call: any, callback: any) => {
  try {
    const { viewerId, ownerIds } = call.request;

    if (!viewerId || !ownerIds || ownerIds.length === 0) {
      return callback(null, { statuses: [], error: 'viewerId and ownerIds are required' });
    }

    // Aggregate all active fluxes for these owners in one query
    const activeFluxes = await FluxModel.find({
      userId: { $in: ownerIds },
      expiresAt: { $gt: new Date() },
      isDeleted: false,
    }).select('userId views');

    // Build a map: ownerId → flux[]
    const ownerFluxMap: Record<string, typeof activeFluxes> = {};
    for (const flux of activeFluxes) {
      if (!ownerFluxMap[flux.userId]) ownerFluxMap[flux.userId] = [];
      ownerFluxMap[flux.userId].push(flux);
    }

    const statuses = ownerIds.map((ownerId: string) => {
      const fluxes = ownerFluxMap[ownerId] || [];
      if (fluxes.length === 0) return { owner_id: ownerId, status: 'none' };

      const hasUnseen = fluxes.some(
        (f) => !f.views.some((v) => v.viewerId === viewerId)
      );

      return {
        owner_id: ownerId,
        status: hasUnseen ? 'unseen' : 'seen',
      };
    });

    callback(null, { statuses, error: '' });
  } catch (error: any) {
    console.error('❌ getBatchFluxRingStatus error:', error);
    callback(null, { statuses: [], error: error.message });
  }
};

/**
 * Get a single flux by ID (called by notification-service when flux is reacted to)
 * Request: { fluxId }
 * Response: { flux, error }
 */
const getFluxById = async (call: any, callback: any) => {
  try {
    const { fluxId } = call.request;

    if (!fluxId) {
      return callback(null, { flux: null, error: 'fluxId is required' });
    }

    const flux = await FluxModel.findById(fluxId);

    if (!flux || flux.isDeleted) {
      return callback(null, { flux: null, error: 'Flux not found' });
    }

    callback(null, {
      flux: {
        id: flux._id.toString(),
        user_id: flux.userId,
        media_url: flux.mediaUrl,
        media_type: flux.mediaType,
        caption: flux.caption || '',
        visibility: flux.visibility,
        view_count: flux.views.length,
        reaction_count: flux.reactions.length,
        expires_at: flux.expiresAt.toISOString(),
        created_at: (flux.createdAt as Date).toISOString(),
        music_title: flux.musicTitle || '',
        music_artist: flux.musicArtist || '',
        duration: flux.duration || 0,
        is_archived: flux.isArchived,
      },
      error: '',
    });
  } catch (error: any) {
    console.error('❌ getFluxById error:', error);
    callback(null, { flux: null, error: error.message });
  }
};

/**
 * Delete all fluxes for a user — called when account is deleted
 * Request: { userId }
 * Response: { success, deletedCount, error }
 */
const deleteAllUserFluxes = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;

    if (!userId) {
      return callback(null, { success: false, deletedCount: 0, error: 'userId is required' });
    }

    // Fetch all fluxes to get Cloudinary URLs for cleanup
    const fluxes = await FluxModel.find({ userId, isDeleted: false });

    // Soft-delete all
    const result = await FluxModel.updateMany(
      { userId, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    // Fire-and-forget Cloudinary cleanup
    Promise.allSettled(
      fluxes.map((f) =>
        import('../utils/cloudinaryHelper').then(({ deleteFluxMedia }) =>
          deleteFluxMedia(f.mediaUrl, f.cloudinaryResourceType)
        )
      )
    ).catch(() => {});

    callback(null, {
      success: true,
      deletedCount: result.modifiedCount,
      error: '',
    });
  } catch (error: any) {
    console.error('❌ deleteAllUserFluxes error:', error);
    callback(null, { success: false, deletedCount: 0, error: error.message });
  }
};

// ── Diary Handlers ─────────────────────────────────────────────────────────────

/**
 * Get all diaries (highlights) for a user
 * Request: { userId, viewerId }
 * Response: { diaries: DiaryItem[], error }
 */
const getUserDiaries = async (call: any, callback: any) => {
  try {
    const { userId, viewerId } = call.request;

    if (!userId || !viewerId) {
      return callback(null, { diaries: [], error: 'userId and viewerId are required' });
    }

    const diaries = await diaryService.getUserDiaries(viewerId, userId);

    const formatted = diaries.map((d) => ({
      id: d._id.toString(),
      user_id: d.userId,
      title: d.title,
      cover_image: d.coverImage || '',
      flux_count: d.fluxes.length,
      visibility: d.visibility,
      created_at: (d.createdAt as Date).toISOString(),
      updated_at: (d.updatedAt as Date).toISOString(),
    }));

    callback(null, { diaries: formatted, error: '' });
  } catch (error: any) {
    console.error('❌ getUserDiaries error:', error);
    callback(null, { diaries: [], error: error.message });
  }
};

/**
 * Delete all diaries for a user — called when account is deleted
 * Request: { userId }
 * Response: { success, deletedCount, error }
 */
const deleteAllUserDiaries = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;

    if (!userId) {
      return callback(null, { success: false, deletedCount: 0, error: 'userId is required' });
    }

    const result = await DiaryModel.updateMany(
      { userId, isDeleted: false },
      { $set: { isDeleted: true } }
    );

    callback(null, {
      success: true,
      deletedCount: result.modifiedCount,
      error: '',
    });
  } catch (error: any) {
    console.error('❌ deleteAllUserDiaries error:', error);
    callback(null, { success: false, deletedCount: 0, error: error.message });
  }
};

/**
 * Get media stats for a user — used by profile-service to show counts
 * Request: { userId }
 * Response: { fluxCount, diaryCount, archivedFluxCount, error }
 */
const getUserMediaStats = async (call: any, callback: any) => {
  try {
    const { userId } = call.request;

    if (!userId) {
      return callback(null, {
        fluxCount: 0,
        diaryCount: 0,
        archivedFluxCount: 0,
        error: 'userId is required',
      });
    }

    const [fluxCount, diaryCount, archivedFluxCount] = await Promise.all([
      FluxModel.countDocuments({
        userId,
        expiresAt: { $gt: new Date() },
        isDeleted: false,
      }),
      DiaryModel.countDocuments({ userId, isDeleted: false }),
      FluxModel.countDocuments({ userId, isArchived: true, isDeleted: false }),
    ]);

    callback(null, {
      fluxCount,
      diaryCount,
      archivedFluxCount,
      error: '',
    });
  } catch (error: any) {
    console.error('❌ getUserMediaStats error:', error);
    callback(null, {
      fluxCount: 0,
      diaryCount: 0,
      archivedFluxCount: 0,
      error: error.message,
    });
  }
};

// ── Server Bootstrap ───────────────────────────────────────────────────────────

export const startGrpcServer = (port: number = 50055) => {
  const server = new grpc.Server();

  server.addService(mediaProto.MediaService.service, {
    // Flux
    GetActiveFluxesByUser: getActiveFluxesByUser,
    CheckUserHasFlux: checkUserHasFlux,
    GetFluxRingStatus: getFluxRingStatus,
    GetBatchFluxRingStatus: getBatchFluxRingStatus,
    GetFluxById: getFluxById,
    DeleteAllUserFluxes: deleteAllUserFluxes,

    // Diary
    GetUserDiaries: getUserDiaries,
    DeleteAllUserDiaries: deleteAllUserDiaries,

    // Stats
    GetUserMediaStats: getUserMediaStats,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        console.error('❌ Failed to bind media gRPC server:', error);
        return;
      }
      console.log(`✅ wie-media-service gRPC running on port ${boundPort}`);
    }
  );

  return server;
};