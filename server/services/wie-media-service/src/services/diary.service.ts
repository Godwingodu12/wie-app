import DiaryModel, { IDiary } from "../models/diary.model";
import FluxModel from "../models/flux.model";
import CloseFriendModel from "../models/close-friend.model";
import * as followClient from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import redisClient from "../config/redis";
import { uploadDiaryCover, deleteFluxMedia } from "../utils/cloudinaryHelper";

const DIARY_CACHE_KEY = (userId: string) => `diary:user:${userId}`;
const DIARY_CACHE_TTL = 600;

// ── Access check 
const canViewDiary = async (
  viewerId: string,
  ownerId: string,
  diary: IDiary,
): Promise<boolean> => {
  if (viewerId === ownerId) return true;
  if (diary.isDeleted) return false;
  if (diary.visibility === "only_me") return false;

  const blockCheck = await wieUserClient
    .checkIfBlocked(viewerId, ownerId)
    .catch(() => null);
  if (blockCheck?.isBlocked) return false;

  // Close-friends diary: viewer must be in owner's CF list
  if (diary.isCloseFriends || diary.visibility === "close_friends") {
    const isCF = await CloseFriendModel.exists({
      userId:        ownerId,
      closeFriendId: viewerId,
    }).catch(() => false);
    return !!isCF;
  }

  const privacy = await wieUserClient
    .getAccountPrivacy(ownerId)
    .catch(() => ({ accountPrivacy: "public" }));
  const isPrivate = privacy.accountPrivacy === "private";

  if (isPrivate || diary.visibility === "followers") {
    const follow = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));
    return follow.isFollowing;
  }

  return true;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildFluxEntry = (flux: any) => ({
  fluxId:               flux._id.toString(),
  mediaUrl:             flux.mediaUrl   ?? "",
  mediaType:            flux.mediaType  ?? "image",
  caption:              flux.caption,
  addedAt:              new Date(),
  musicTitle:           flux.musicTitle,
  musicArtist:          flux.musicArtist,
  musicPreviewUrl:      flux.musicPreviewUrl,
  musicAlbumArt:        flux.musicAlbumArt,
  musicStartAt:         flux.musicStartAt,
  locationLabel:        flux.locationLabel,
  locationStickerX:     flux.locationStickerX,
  locationStickerY:     flux.locationStickerY,
  locationStickerTheme: flux.locationStickerTheme,
  isCloseFriends:       flux.visibility === "close_friends",
});

// ── Create diary ──────────────────────────────────────────────────────────────
export const createDiary = async (
  userId:     string,
  title:      string,
  visibility: string = "followers",
  coverFile?: Express.Multer.File,
  fluxIds?:   string[],
): Promise<IDiary> => {
  let coverImage:    string | undefined;
  let coverPublicId: string | undefined;

  if (coverFile) {
    const uploaded = await uploadDiaryCover(coverFile.buffer, coverFile.mimetype);
    coverImage    = uploaded.url;
    coverPublicId = uploaded.publicId;
  }

  let initialFluxes: any[]  = [];
  let isCloseFriends         = false;

  if (fluxIds && fluxIds.length > 0) {
    const fluxDocs = await FluxModel.find({
      _id:       { $in: fluxIds },
      userId,
      isDeleted: false,
    });

    const fluxMap = new Map(fluxDocs.map((f) => [f._id.toString(), f]));
    initialFluxes = fluxIds
      .map((id) => fluxMap.get(id))
      .filter(Boolean)
      .map((f) => buildFluxEntry(f!));

    // Diary is CF if any of its stories are CF
    isCloseFriends = initialFluxes.some((f) => f.isCloseFriends);

    if (!coverImage && initialFluxes.length > 0) {
      const firstFlux = fluxDocs.find(
        (f) => f._id.toString() === initialFluxes[0].fluxId,
      );
      if (firstFlux?.mediaType === "image") coverImage = firstFlux.mediaUrl;
    }
  }

  // Inherit close_friends visibility automatically
  const effectiveVisibility = isCloseFriends ? "close_friends" : visibility;

  const diary = await DiaryModel.create({
    userId,
    title,
    visibility:     effectiveVisibility,
    isCloseFriends,
    coverImage,
    coverCloudinaryPublicId: coverPublicId,
    fluxes: initialFluxes,
  });

  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

export const getUserDiaries = async (
  viewerId: string,
  ownerId: string,
): Promise<IDiary[]> => {

  const cacheKey = DIARY_CACHE_KEY(ownerId);
  const cached = await redisClient.get(cacheKey).catch(() => null);

  let diaries: IDiary[];

  if (cached) {
    diaries = JSON.parse(cached);
  } else {
    diaries = await DiaryModel.find({ userId: ownerId, isDeleted: false })
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean<IDiary[]>(); 

    await redisClient
      .set(cacheKey, JSON.stringify(diaries), DIARY_CACHE_TTL)
      .catch(() => {});
  }

  if (viewerId === ownerId) return diaries;

  const visible: IDiary[] = [];

  for (const d of diaries) {
    if (await canViewDiary(viewerId, ownerId, d)) {
      visible.push(d);
    }
  }

  return visible;
};

// ── Get single diary ──────────────────────────────────────────────────────────
export const getDiaryById = async (
  diaryId:  string,
  viewerId: string,
): Promise<IDiary | null> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary || diary.isDeleted) return null;
  if (!(await canViewDiary(viewerId, diary.userId, diary))) return null;
  return diary;
};

// ── Add flux to diary ─────────────────────────────────────────────────────────
export const addFluxToDiary = async (
  diaryId: string,
  fluxId:  string,
  userId:  string,
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error("Diary not found");
  if (diary.userId !== userId) throw new Error("Unauthorized");

  const flux = await FluxModel.findById(fluxId);
  if (!flux) throw new Error("Flux not found");
  if (flux.userId !== userId) throw new Error("Flux does not belong to you");

  if (diary.fluxes.some((f) => f.fluxId === fluxId)) {
    throw new Error("Flux already in diary");
  }

  const entry = buildFluxEntry(flux);
  diary.fluxes.push(entry as any);

  // Update CF flag if adding a CF flux
  if (entry.isCloseFriends && !diary.isCloseFriends) {
    diary.isCloseFriends = true;
    diary.visibility     = "close_friends";
  }

  // Auto-update cover if diary has none
  if (!diary.coverImage && flux.mediaType === "image") {
    diary.coverImage = flux.mediaUrl;
  }

  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// ── Remove flux from diary ────────────────────────────────────────────────────
export const removeFluxFromDiary = async (
  diaryId: string,
  fluxId:  string,
  userId:  string,
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error("Diary not found");
  if (diary.userId !== userId) throw new Error("Unauthorized");

  diary.fluxes = diary.fluxes.filter((f) => f.fluxId !== fluxId);

  // Re-evaluate CF flag after removal
  diary.isCloseFriends = diary.fluxes.some((f) => (f as any).isCloseFriends);
  if (!diary.isCloseFriends && diary.visibility === "close_friends") {
    diary.visibility = "followers";
  }

  // Re-assign cover from first remaining image flux if cover was from removed flux
  if (diary.fluxes.length > 0) {
    const firstImg = diary.fluxes.find((f) => f.mediaType === "image");
    if (firstImg) diary.coverImage = firstImg.mediaUrl;
  } else {
    diary.coverImage = undefined;
  }

  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// ── Reorder fluxes in diary ───────────────────────────────────────────────────
export const reorderDiaryFluxes = async (
  diaryId:       string,
  userId:        string,
  orderedFluxIds: string[],
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error("Diary not found");
  if (diary.userId !== userId) throw new Error("Unauthorized");

  const fluxMap = new Map(diary.fluxes.map((f) => [f.fluxId, f]));
  const reordered = orderedFluxIds
    .map((id) => fluxMap.get(id))
    .filter(Boolean) as typeof diary.fluxes;

  diary.fluxes = reordered;
  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// ── Edit diary ────────────────────────────────────────────────────────────────
export const editDiary = async (
  diaryId:  string,
  userId:   string,
  updates:  { title?: string; visibility?: string; isPinned?: boolean },
  coverFile?: Express.Multer.File,
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error("Diary not found");
  if (diary.userId !== userId) throw new Error("Unauthorized");

  if (updates.title)     diary.title    = updates.title;
  if (updates.isPinned !== undefined) diary.isPinned = updates.isPinned;

  // Don't allow downgrading a CF diary to public without explicit override
  if (updates.visibility && updates.visibility !== "close_friends" && diary.isCloseFriends) {
    // Only allow if explicitly acknowledged (no check here — controller handles it)
  }
  if (updates.visibility) diary.visibility = updates.visibility as any;

  if (coverFile) {
    if (diary.coverCloudinaryPublicId) {
      await deleteFluxMedia(diary.coverCloudinaryPublicId, "image").catch(() => {});
    }
    const uploaded = await uploadDiaryCover(coverFile.buffer, coverFile.mimetype);
    diary.coverImage              = uploaded.url;
    diary.coverCloudinaryPublicId = uploaded.publicId;
  }

  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// ── Delete diary ──────────────────────────────────────────────────────────────
export const deleteDiary = async (
  diaryId: string,
  userId:  string,
): Promise<void> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error("Diary not found");
  if (diary.userId !== userId) throw new Error("Unauthorized");

  if (diary.coverCloudinaryPublicId) {
    await deleteFluxMedia(diary.coverCloudinaryPublicId, "image").catch(() => {});
  }

  diary.isDeleted = true;
  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
};

// ── Pin / Unpin diary ─────────────────────────────────────────────────────────
export const togglePinDiary = async (
  diaryId: string,
  userId:  string,
): Promise<IDiary> => {
  const diary = await DiaryModel.findById(diaryId);
  if (!diary) throw new Error("Diary not found");
  if (diary.userId !== userId) throw new Error("Unauthorized");

  diary.isPinned = !diary.isPinned;
  await diary.save();
  await redisClient.del(DIARY_CACHE_KEY(userId)).catch(() => {});
  return diary;
};

// ── Highlight flux (from flux-view More menu) ─────────────────────────────────
export const highlightFlux = async (
  userId:        string,
  fluxId:        string,
  diaryId?:      string,
  newDiaryTitle?: string,
): Promise<{ action: "added" | "created" | "pick"; diary?: IDiary; diaries?: IDiary[] }> => {
  if (diaryId) {
    const diary = await addFluxToDiary(diaryId, fluxId, userId);
    return { action: "added", diary };
  }

  const existing = await getUserDiaries(userId, userId);
  if (existing.length > 0 && !newDiaryTitle) {
    return { action: "pick", diaries: existing };
  }

  const title = newDiaryTitle?.trim() || "My Diary";
  const diary = await createDiary(userId, title, "followers", undefined, [fluxId]);
  return { action: "created", diary };
};
