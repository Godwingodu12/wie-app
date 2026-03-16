import DiaryModel, { IDiary } from '../models/diary.model';
import FluxModel from '../models/flux.model';
import * as followClient from '../grpc/clients/followClient';
import * as wieUserClient from '../grpc/clients/wieUserClient';
import redisClient from '../config/redis';
import { uploadDiaryCover, deleteFluxMedia } from '../utils/cloudinaryHelper';

const DIARY_CACHE_KEY = (userId: string) => `diary:user:${userId}`;
const DIARY_CACHE_TTL = 600; // 10 min

// Access Check 
const canViewDiary = async (
  viewerId: string,
  ownerId: string,
  visibility: string
): Promise<boolean> => {
  if (viewerId === ownerId) return true;
  if (visibility === 'only_me') return false;

  const blockCheck = await wieUserClient.checkIfBlocked(viewerId, ownerId).catch(() => null);
  if (blockCheck?.isBlocked) return false;

  // Get account privacy
  const privacy = await wieUserClient
    .getAccountPrivacy(ownerId)
    .catch(() => ({ accountPrivacy: 'public' }));

  const isPrivateAccount = privacy.accountPrivacy === 'private';

  // Private account: must follow
  if (isPrivateAccount) {
    const follow = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));
    return follow.isFollowing;
  }

  // Public account:
  if (visibility === 'followers') {
    const follow = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));
    return follow.isFollowing;
  }

  return true;
};

export const createDiary = async (
  userId:     string,
  title:      string,
  visibility: string = 'followers',
  coverFile?: Express.Multer.File,
  fluxIds?:   string[]              // ← NEW: initial flux IDs to add
): Promise<IDiary> => {
  let coverImage:   string | undefined;
  let coverPublicId: string | undefined;

  if (coverFile) {
    const uploaded = await uploadDiaryCover(coverFile.buffer, coverFile.mimetype);
    coverImage    = uploaded.url;
    coverPublicId = uploaded.publicId;
  }

  // Build initial fluxes array if fluxIds provided
  let initialFluxes: any[] = [];
  if (fluxIds && fluxIds.length > 0) {
    const FluxModel = (await import('../models/flux.model')).default;
    const fluxDocs  = await FluxModel.find({
      _id:       { $in: fluxIds },
      userId,
      isDeleted: false,
    });

    // Preserve the order the user selected
    const fluxMap = new Map(fluxDocs.map((f) => [f._id.toString(), f]))
    initialFluxes = fluxIds
      .map((id) => fluxMap.get(id))
      .filter(Boolean)
      .map((f) => ({
        fluxId:    f!._id.toString(),
        mediaUrl:  f!.mediaUrl,
        mediaType: f!.mediaType,
        caption:   f!.caption,
        addedAt:   new Date(),
        // Music — copy all music metadata from the flux
        musicTitle:      f!.musicTitle,
        musicArtist:     f!.musicArtist,
        musicPreviewUrl: f!.musicPreviewUrl,
        musicAlbumArt:   f!.musicAlbumArt,
        musicStartAt:    f!.musicStartAt,
        // Location sticker position
        locationLabel:        f!.locationLabel,
        locationStickerX:     f!.locationStickerX,
        locationStickerY:     f!.locationStickerY,
        locationStickerTheme: f!.locationStickerTheme,
      }));

    // Use first flux media as cover if no cover file provided
    if (!coverImage && initialFluxes.length > 0) {
      const firstFlux = fluxDocs.find(
        (f) => f._id.toString() === initialFluxes[0].fluxId
      );
      if (firstFlux?.mediaType === 'image') {
        coverImage = firstFlux.mediaUrl;
      }
    }
  }

  const diary = await DiaryModel.create({
    userId,
    title,
    visibility,
    coverImage,
    coverCloudinaryPublicId: coverPublicId,
    fluxes: initialFluxes,
  });

  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// Get User Diaries 
export const getUserDiaries = async (
  viewerId: string,
  ownerId: string
): Promise<IDiary[]> => {
  const cacheKey = DIARY_CACHE_KEY(ownerId);
  const cached = await redisClient.get(cacheKey).catch(() => null);

  let diaries: IDiary[];
  if (cached) {
    diaries = JSON.parse(cached);
  } else {
    diaries = await DiaryModel.find({ userId: ownerId, isDeleted: false }).sort({
      updatedAt: -1,
    });
    await redisClient
      .set(cacheKey, JSON.stringify(diaries), DIARY_CACHE_TTL)
      .catch(() => {});
  }

  if (viewerId === ownerId) return diaries;

  const visible: IDiary[] = [];
  for (const d of diaries) {
    if (await canViewDiary(viewerId, ownerId, d.visibility)) {
      visible.push(d);
    }
  }
  return visible;
};

//  Add Flux to Diary 

export const addFluxToDiary = async (
  diaryId: string,
  fluxId: string,
  userId: string
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error('Diary not found');
  if (diary.userId !== userId) throw new Error('Unauthorized');

  const flux = await FluxModel.findById(fluxId);
  if (!flux) throw new Error('Flux not found');
  if (flux.userId !== userId) throw new Error('Flux does not belong to you');

  const alreadyAdded = diary.fluxes.some((f) => f.fluxId === fluxId);
  if (alreadyAdded) throw new Error('Flux already in diary');

  diary.fluxes.push({
    fluxId,
    mediaUrl: flux.mediaUrl,
    mediaType: flux.mediaType,
    caption: flux.caption,
    addedAt: new Date(),
  });

  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// Remove Flux from Diary 

export const removeFluxFromDiary = async (
  diaryId: string,
  fluxId: string,
  userId: string
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error('Diary not found');
  if (diary.userId !== userId) throw new Error('Unauthorized');

  diary.fluxes = diary.fluxes.filter((f) => f.fluxId !== fluxId);
  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// Edit Diary 
export const editDiary = async (
  diaryId: string,
  userId: string,
  updates: { title?: string; visibility?: string },
  coverFile?: Express.Multer.File
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error('Diary not found');
  if (diary.userId !== userId) throw new Error('Unauthorized');

  if (updates.title) diary.title = updates.title;
  if (updates.visibility) diary.visibility = updates.visibility as any;

  if (coverFile) {
    if (diary.coverCloudinaryPublicId) {
      await deleteFluxMedia(diary.coverImage!, 'image').catch(() => {});
    }
    const uploaded = await uploadDiaryCover(coverFile.buffer, coverFile.mimetype);
    diary.coverImage = uploaded.url;
    diary.coverCloudinaryPublicId = uploaded.publicId;
  }

  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

//  Get Single Diary 

export const getDiaryById = async (
  diaryId: string,
  viewerId: string
): Promise<IDiary | null> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary || diary.isDeleted) return null;

  if (!(await canViewDiary(viewerId, diary.userId, diary.visibility))) return null;

  return diary;
};

//  Delete Diary

export const deleteDiary = async (
  diaryId: string,
  userId: string
): Promise<void> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error('Diary not found');
  if (diary.userId !== userId) throw new Error('Unauthorized');

  if (diary.coverCloudinaryPublicId) {
    await deleteFluxMedia(diary.coverImage!, 'image').catch(() => {});
  }

  diary.isDeleted = true;
  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
};