import FluxModel, { IFlux, FluxVisibility } from "../models/flux.model";
import * as followClient from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import redisClient from "../config/redis";
import { uploadFluxMedia, deleteFluxMedia } from "../utils/cloudinaryHelper";

// Categorization logic constants
const STORY_FILTER = {
  isPersistent: false,
  expiresAt: { $gt: new Date() },
  status: "active"
};

const POST_FILTER = {
  $or: [
    { isPersistent: true },
    { 
      isPersistent: { $ne: false }, 
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } } // far future
      ]
    }
  ]
};

const IS_STORY = (f: any) => {
  if (f.isPersistent === true) return false;
  if (f.isPersistent === false) return true;
  
  // Legacy logic: if it has no flag, it's a story ONLY if it has a near expiry date.
  // Otherwise it's a Post.
  const createdAt = new Date(f.createdAt).getTime();
  const expiresAt = f.expiresAt ? new Date(f.expiresAt).getTime() : 0;
  if (expiresAt === 0) return false; 

  const duration = expiresAt - createdAt;
  return duration < (30 * 24 * 60 * 60 * 1000); // Less than 30 days = Story
};

export const formatPostResponse = (f: any, viewerId: string, user: any = null, followingSet?: Set<string>) => {
  const cloudName = process.env.CLOUDINARY_NAME || "";
  const isSelf = String(f.userId) === String(viewerId);
  const isFollowing = followingSet ? followingSet.has(String(f.userId)) : isSelf;

  const hasLiked = (f.likes || []).some((l: any) => String(l.userId) === String(viewerId));
  const hasSaved = (f.savedBy || []).some((id: string) => String(id) === String(viewerId));

  const isStory = IS_STORY(f);
  const isPersistent = !isStory;
  const isExpired = f.expiresAt ? Date.now() > new Date(f.expiresAt).getTime() : false;

  const thumbnailUrl = f.mediaType === "video" && f.cloudinaryPublicId 
    ? `https://res.cloudinary.com/${cloudName}/video/upload/so_0/${f.cloudinaryPublicId}.jpg`
    : f.mediaUrl;

  return {
    _id: f._id,
    userId: f.userId,
    owner: user ? {
      id: user.id || user._id,
      username: user.username,
      name: user.name || user.displayName || user.username,
      profile_picture: user.profile_picture || user.profilePicture || null,
      is_verified: user.is_verified || false
    } : null,
    mediaItems: f.mediaItems && f.mediaItems.length > 0 ? f.mediaItems : [{
      url: f.mediaUrl,
      type: f.mediaType || "image",
      thumbnailUrl
    }],
    caption: f.caption || null,
    visibility: f.visibility || "public",
    locationLabel: f.locationLabel || null,
    locationPlaceId: f.locationPlaceId || null,
    locationLat: f.locationLat || null,
    locationLng: f.locationLng || null,
    taggedUsers: f.taggedUsers || [],
    mentions: f.mentions || [],
    likeCount: (f.likes || []).length,
    commentCount: (f.comments || []).length,
    shareCount: f.shareCount || 0,
    saveCount: f.saveCount || 0,
    hasLiked,
    hasSaved,
    commentsDisabled: f.commentsDisabled || false,
    likesHidden: f.likesHidden || false,
    isPinned: f.isPinned || false,
    isDeleted: f.isDeleted || false,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    // Extra fields for backwards compatibility/internal logic
    isSelf,
    isFollowing,
    isPersistent,
    isStory,
    viewCount: (f.viewers || []).length,
  };
};

const FEED_CACHE_TTL = 60;// 1 min
const FEED_CACHE_KEY = (userId: string) => `flux:feed:${userId}`;
const USER_FLUXES_KEY = (userId: string) => `flux:user:${userId}`;

export const invalidateFollowerFeedCaches = async (
  ownerId: string,
): Promise<void> => {
  try {
    // Get everyone who follows this owner (their feed must refresh)
    const { followerIds } = await followClient
      .getFollowerIds(ownerId)
      .catch(() => ({ followerIds: [] as string[] }));
    // Also invalidate the owner's own feed cache
    const allAffected = [...new Set([...followerIds, ownerId])];
    await Promise.all(
      allAffected.map((id) =>
        redisClient.del(FEED_CACHE_KEY(id)).catch(() => {}),
      ),
    );
  } catch {
    // Non-fatal — cache will expire on its own after FEED_CACHE_TTL
  }
};

export const invalidateViewerFeedCache = async (
  viewerId: string,
  ownerId: string,
): Promise<void> => {
  try {
    await Promise.all([
      redisClient.del(FEED_CACHE_KEY(viewerId)).catch(() => {}),
      // Also bust ownerId's cache in case they follow back later
      redisClient.del(FEED_CACHE_KEY(ownerId)).catch(() => {}),
    ]);
  } catch {
    // Non-fatal
  }
};
export const canViewFlux = async (
  viewerId: string,
  ownerId: string,
  visibility: FluxVisibility,
): Promise<boolean> => {
  if (String(viewerId) === String(ownerId)) return true;
  // Explicitly hidden
  if (visibility === "only_me") return false;
  
  try {
    const blockCheck = await wieUserClient.checkIfBlocked(viewerId, ownerId);
    if (blockCheck?.isBlocked) {
      console.log(`[canViewFlux] BLOCKED: ${viewerId} is blocked by ${ownerId}`);
      return false;
    }
  } catch (err) {
    console.error(`[canViewFlux] Block check failed for ${viewerId} -> ${ownerId}:`, err);
  }

  // Account privacy — if gRPC fails, DEFAULT to public
  let accountPrivacy = "public";
  try {
    const privacyResp = await wieUserClient.getAccountPrivacy(ownerId);
    accountPrivacy = privacyResp?.accountPrivacy ?? "public";
    console.log(`[canViewFlux] Account Privacy for ${ownerId}: ${accountPrivacy}`);
  } catch (err) {
    console.error(`[canViewFlux] Privacy check failed for ${ownerId}:`, err);
    accountPrivacy = "public";
  }

  // Private account → must follow
  if (accountPrivacy === "private") {
    try {
      const follow = await followClient.isFollowing(viewerId, ownerId);
      console.log(`[canViewFlux] PRIVATE account check: ${viewerId} following ${ownerId}? ${follow.isFollowing}`);
      return follow.isFollowing;
    } catch (err) {
      console.error(`[canViewFlux] Follow check failed for private account ${viewerId} -> ${ownerId}:`, err);
      return false; 
    }
  }

  // Public account:
  if (visibility === "followers") {
    try {
      const follow = await followClient.isFollowing(viewerId, ownerId);
      console.log(`[canViewFlux] PUBLIC account (followers only post) check: ${viewerId} following ${ownerId}? ${follow.isFollowing}`);
      return follow.isFollowing;
    } catch (err) {
      console.error(`[canViewFlux] Follow check failed for followers visibility ${viewerId} -> ${ownerId}:`, err);
      return true; // Fail-safe: show it anyway if it's a public account and gRPC is down
    }
  }
  
  if (visibility === "close_friends") {
    try {
      const cf = await followClient.checkCloseFriend(ownerId, viewerId);
      console.log(`[canViewFlux] CF check: ${viewerId} in ${ownerId}'s CF? ${cf.isCloseFriend}`);
      return cf.isCloseFriend;
    } catch (err) {
      console.error(`[canViewFlux] Close friend check failed for ${ownerId} -> ${viewerId}:`, err);
      return false;
    }
  }

  console.log(`[canViewFlux] ALLOWED: ${visibility} post for public account ${ownerId}`);
  return true;
};

// Create Flux
export const createFlux = async (
  userId: string,
  files: Express.Multer.File[] | null,
  body: {
    caption?: string;
    visibility?: FluxVisibility;
    musicId?: string;
    musicTitle?: string;
    musicArtist?: string;
    musicStartAt?: number;
    musicPreviewUrl?: string;
    musicAlbumArt?: string;
    locationLabel?: string;
    locationPlaceId?: string;
    locationLat?: string;
    locationLng?: string;
    locationCategory?: string;
    locationStickerX?: string;
    locationStickerY?: string;
    locationStickerTheme?: string;
    stickers?: string;
    overlays?: string;
    textLayers?: string;
    textBg?: string;
    filterName?: string;
    filterValue?: string;
    mediaUrl?: string; // pre-existing URL (re-mention flow)
    commentsDisabled?: string | boolean;
    isAiGenerated?: string | boolean;
    isPersistent?: string | boolean;
    taggedUsers?: string | string[];
    mentions?: string | string[];
    type?: string;
  },
): Promise<IFlux> => {
  // ── Determine media sources (Multi-upload support)
  const mediaItems: any[] = [];
  
  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadFluxMedia(file.buffer, file.mimetype);
      mediaItems.push({
        url: uploaded.url,
        mediaType: uploaded.mediaType === "video" ? "video" : "image",
        cloudinaryPublicId: uploaded.publicId,
        cloudinaryResourceType: uploaded.mediaType,
        thumbnailUrl: uploaded.mediaType === "video" 
          ? `https://res.cloudinary.com/${process.env.CLOUDINARY_NAME}/video/upload/so_0/${uploaded.publicId}.jpg`
          : uploaded.url
      });
    }
  } else if (body.mediaUrl) {
    mediaItems.push({
      url: body.mediaUrl,
      mediaType: body.mediaUrl.match(/\.(mp4|mov|webm|avi)(\?|$)/i) ? "video" : "image",
      cloudinaryPublicId: "repost_" + Date.now(),
      cloudinaryResourceType: "image"
    });
  }

  // Fallbacks for backward compatibility (first item)
  const firstItem = mediaItems[0] || {};
  const mediaUrl = firstItem.url || "";
  const mediaType = (firstItem.mediaType as any) || "image";
  const cloudinaryPublicId = firstItem.cloudinaryPublicId || "";
  const cloudinaryResourceType = firstItem.cloudinaryResourceType || "image";

  let textLayers: Record<string, any>[] = [];
  if (body.textLayers) {
    try {
      textLayers = JSON.parse(body.textLayers);
    } catch {
      /* ignore */
    }
  }

  // Respect the owner's duration setting (24 | 48 | 72 hours)
  let durationHours = 24;
  try {
    const userSettings = await (
      await import("../models/flux-settings.model")
    ).default
      .findOne({ userId })
      .lean();
    const settingDuration = (userSettings as any)?.advanced?.duration;
    if ([24, 48, 72].includes(settingDuration)) durationHours = settingDuration;
  } catch {
    /* use default 24h */
  }

  const DURATION_MS = durationHours * 60 * 60 * 1000;
  const now = new Date();
  
  // Robust detection of persistent posts
  const isPersistent = 
    body.isPersistent === "true" || 
    body.isPersistent === true || 
    body.type === "post" || 
    body.type === "reel";

  // If persistent (a post), set expiry to 100 years
  const expiresAt = isPersistent 
    ? new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + DURATION_MS);

  // Parse arrays
  const parseArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return [val]; }
  };

  const flux = await FluxModel.create({
    userId,
    mediaUrl,
    mediaType,
    cloudinaryPublicId,
    cloudinaryResourceType,
    mediaItems,
    caption: body.caption,
    visibility: body.visibility || "public",
    status: "active",
    isDeleted: false,
    isArchived: false,
    isPersistent,
    createdAt: now,
    expiresAt,
    taggedUsers: parseArray(body.taggedUsers),
    mentions: parseArray(body.mentions),
    // AI Label & Comments Toggle
    commentsDisabled:
      body.commentsDisabled === "true" || body.commentsDisabled === true,
    isAiGenerated:
      body.isAiGenerated === "true" || body.isAiGenerated === true,
    // Music
    musicId: body.musicId,
    musicTitle: body.musicTitle,
    musicArtist: body.musicArtist,
    musicStartAt: body.musicStartAt,
    musicPreviewUrl: body.musicPreviewUrl,
    musicAlbumArt: body.musicAlbumArt,
    // Location
    locationLabel: body.locationLabel,
    locationPlaceId: body.locationPlaceId,
    locationLat: body.locationLat ? parseFloat(body.locationLat) : undefined,
    locationLng: body.locationLng ? parseFloat(body.locationLng) : undefined,
    locationCategory: body.locationCategory,
    locationStickerX: body.locationStickerX
      ? parseFloat(body.locationStickerX)
      : 50,
    locationStickerY: body.locationStickerY
      ? parseFloat(body.locationStickerY)
      : 75,
    locationStickerTheme: body.locationStickerTheme
      ? parseInt(body.locationStickerTheme)
      : 0,

    // Overlays
    stickers: body.stickers ? JSON.parse(body.stickers) : [],
    overlays: body.overlays ? JSON.parse(body.overlays) : [],

    // Text story
    textLayers,
    textBg: body.textBg || null,
    filterName: body.filterName || "Normal",
    filterValue: body.filterValue || "none",
  });

  // ── Invalidate caches ──
  await redisClient.del(USER_FLUXES_KEY(userId)).catch(() => {});
  await redisClient.del(FEED_CACHE_KEY(userId)).catch(() => {});
  await invalidateFollowerFeedCaches(userId).catch(() => {});

  return flux;
};
//  Get Active Fluxes for a User
export const getUserFluxes = async (
  viewerId: string,
  ownerId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
  console.log(`[getUserFluxes] Request from viewer ${viewerId} for owner ${ownerId}`);
  const skip = (page - 1) * limit;
  const cloudName = process.env.CLOUDINARY_NAME || "";

  // Mark expired fluxes - BUT NEVER persistent ones
  await FluxModel.updateMany(
    {
      userId: ownerId,
      isPersistent: { $ne: true },
      expiresAt: { $lt: new Date() },
      isDeleted: false,
      status: "active",
    },
    { $set: { status: "expired", isArchived: true } },
  ).catch(() => {});

  const allFluxesQuery = {
    userId: ownerId,
    isDeleted: false
  };

  const total = await FluxModel.countDocuments(allFluxesQuery);
  const allFluxes = await FluxModel.find(allFluxesQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  console.log(`[getUserFluxes] Found ${allFluxes.length} raw fluxes for owner ${ownerId}`);

  // Fetch owner info once
  const usersResp = await wieUserClient
    .getUsersByIds([ownerId])
    .catch(() => ({ users: [] }));
  const ownerUser = (usersResp.users || [])[0] || null;

  const visibilityChecks = allFluxes.map(async (f: any) => {
    try {
      const hiddenFrom: string[] = f.hiddenFrom ?? [];
      if (hiddenFrom.map(String).includes(String(viewerId))) {
        return null;
      }
      
      const canView = await canViewFlux(String(viewerId), String(ownerId), f.visibility);
      if (!canView) return null;

      return formatPostResponse(f, viewerId, ownerUser, new Set());
    } catch (err) {
      console.error(`[getUserFluxes] Error checking visibility for flux ${f._id}:`, err);
      return null;
    }
  });

  const results = await Promise.all(visibilityChecks);
  const final = results.filter(f => f !== null);
  
  // AUTO-SYNC POST COUNT - Only count persistent items for the profile stat
  const persistentCount = final.filter(f => f.isPersistent).length;
  wieUserClient.setPostsCount(ownerId, persistentCount).catch(err => {
    console.error(`[getUserFluxes] Failed to auto-sync post count for ${ownerId}:`, err.message);
  });

  console.log(`[getUserFluxes] Returning ${final.length} visible fluxes (${persistentCount} persistent) for owner ${ownerId}`);
  return {
    data: final,
    total: persistentCount, // Return persistent count as total for pagination logic
    hasMore: skip + allFluxes.length < total
  };
};

//  Get Stories Feed — Active transient fluxes from followed users
export const getStoriesFeed = async (viewerId: string): Promise<{ data: any[] }> => {
  try {
    const { followingIds } = await followClient
      .getFollowingIds(viewerId)
      .catch(() => ({ followingIds: [] as string[] }));

    const targetUserIds = [...new Set([...followingIds, viewerId])];

    const matchQuery = {
      userId: { $in: targetUserIds },
      isDeleted: false,
      isArchived: false,
      ...STORY_FILTER
    };

    const rawStories = await FluxModel.find(matchQuery)
      .sort({ createdAt: -1 })
      .lean();

    if (rawStories.length === 0) return { data: [] };

    const ownerIds = [...new Set(rawStories.map((f: any) => f.userId.toString()))];
    const usersResp = await wieUserClient.getUsersByIds(ownerIds).catch(() => ({ users: [] }));
    const userMap: Record<string, any> = {};
    (usersResp.users || []).forEach((u: any) => {
      const uid = String(u.id || u._id || "");
      if (uid) userMap[uid] = u;
    });

    const data = rawStories.map((f: any) => {
      const user = userMap[f.userId.toString()];
      return formatPostResponse(f, viewerId, user, new Set(followingIds));
    });

    return { data };
  } catch (err) {
    console.error(`[getStoriesFeed] Error:`, err);
    return { data: [] };
  }
};

// Feed — Following users with persistent posts
export const getFluxFeed = async (viewerId: string, page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
  const cacheKey = `${FEED_CACHE_KEY(viewerId)}:posts:p:${page}:l:${limit}`;
  const skip = (page - 1) * limit;

  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  const { followingIds } = await followClient
    .getFollowingIds(viewerId)
    .catch(() => ({ followingIds: [] as string[] }));

  const targetUserIds = [...new Set([...followingIds, viewerId])];

  const matchQuery: any = {
    userId: { $in: targetUserIds },
    isDeleted: false,
    ...POST_FILTER,
    visibility: { $ne: "only_me" },
    $expr: {
      $not: { $in: [String(viewerId), { $ifNull: ["$hiddenFrom", []] }] },
    },
  };

  const total = await FluxModel.countDocuments(matchQuery);
  const rawFluxes = await FluxModel.find(matchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (rawFluxes.length === 0) return { data: [], total, hasMore: false };

  // Filter by visibility (close friends gate)
  const visibilityChecks = rawFluxes.map(async (f: any) => {
    if (f.visibility === "close_friends") {
      if (f.userId.toString() === viewerId) return f;
      const { isCloseFriend } = await followClient.checkCloseFriend(f.userId.toString(), viewerId).catch(() => ({ isCloseFriend: false }));
      return isCloseFriend ? f : null;
    }
    return f;
  });

  const filteredFluxes = (await Promise.all(visibilityChecks)).filter(f => f !== null);
  if (filteredFluxes.length === 0) return { data: [], total, hasMore: false };

  const ownerIds = [...new Set(filteredFluxes.map((f: any) => f.userId.toString()))];
  const [usersResp, followingResp] = await Promise.all([
    wieUserClient.getUsersByIds(ownerIds).catch(() => ({ users: [] })),
    followClient.getFollowingIds(viewerId).catch(() => ({ followingIds: [] }))
  ]);

  const userMap: Record<string, any> = {};
  (usersResp.users || []).forEach((u: any) => {
    const uid = String(u.id || u._id || "");
    if (uid) userMap[uid] = u;
  });

  const followingSet = new Set(followingResp.followingIds || []);

  const data = filteredFluxes.map((f: any) => {
    const user = userMap[f.userId.toString()];
    return formatPostResponse(f, viewerId, user, followingSet);
  });

  const result = {
    data,
    total,
    hasMore: skip + rawFluxes.length < total
  };

  await redisClient
    .set(cacheKey, JSON.stringify(result), FEED_CACHE_TTL)
    .catch(() => {});

  return result;
};

// Explore Feed — Public persistent posts from everyone else
export const getExploreFeed = async (viewerId: string, page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
  const skip = (page - 1) * limit;
  
  const matchQuery = {
    userId: { $ne: viewerId }, // Exclude own posts
    isDeleted: false,
    isArchived: false,
    ...POST_FILTER,
    visibility: "public",
    $expr: {
      $not: { $in: [String(viewerId), { $ifNull: ["$hiddenFrom", []] }] },
    },
  };

  const total = await FluxModel.countDocuments(matchQuery);
  const rawFluxes = await FluxModel.find(matchQuery)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (rawFluxes.length === 0) return { data: [], total, hasMore: false };

  const ownerIds = [...new Set(rawFluxes.map((f: any) => f.userId.toString()))];
  const [usersResp, followingResp] = await Promise.all([
    wieUserClient.getUsersByIds(ownerIds).catch(() => ({ users: [] })),
    followClient.getFollowingIds(viewerId).catch(() => ({ followingIds: [] }))
  ]);

  const userMap: Record<string, any> = {};
  (usersResp.users || []).forEach((u: any) => {
    const uid = String(u.id || u._id || "");
    if (uid) userMap[uid] = u;
  });

  const followingSet = new Set(followingResp.followingIds || []);

  const data = rawFluxes
    .map((f: any) => {
      const user = userMap[f.userId.toString()];
      return formatPostResponse(f, viewerId, user, followingSet);
    });

  return {
    data,
    total,
    hasMore: skip + rawFluxes.length < total
  };
};

// Reels Feed — Global public video persistent fluxes
export const getReelsFeed = async (viewerId: string, page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
  const skip = (page - 1) * limit;
  const cloudName = process.env.CLOUDINARY_NAME || "";
  
  const query = {
    mediaType: "video",
    visibility: "public",
    isDeleted: false,
    ...POST_FILTER
  };

  const total = await FluxModel.countDocuments(query);
  const reels = await FluxModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  if (reels.length === 0) return { data: [], total, hasMore: false };

  const ownerIds = [...new Set(reels.map((r) => r.userId.toString()))];
  const [usersResp, followingResp] = await Promise.all([
    wieUserClient.getUsersByIds(ownerIds).catch(() => ({ users: [] })),
    followClient.getFollowingIds(viewerId).catch(() => ({ followingIds: [] }))
  ]);

  const userMap: Record<string, any> = {};
  (usersResp.users || []).forEach((u: any) => {
    const uid = String(u.id || u._id || "");
    if (uid) userMap[uid] = u;
  });

  const followingSet = new Set(followingResp.followingIds || []);

  const data = reels.map((r: any) => {
    const user = userMap[String(r.userId)];
    return formatPostResponse(r, viewerId, user, followingSet);
  });

  return {
    data,
    total,
    hasMore: skip + reels.length < total
  };
};

export const viewFlux = async (
  fluxId: string,
  viewerId: string,
): Promise<void> => {
  const flux = await FluxModel.findById(fluxId).lean();
  // Guard: flux must exist, be active, not deleted, and not yet expired
  if (!flux) return;
  if (flux.isDeleted || flux.status !== "active") return;
  if (new Date() > new Date(flux.expiresAt)) return; // skip silently if expired
  // ── Close friends gate ──
  if (
    flux.visibility === "close_friends" &&
    flux.userId.toString() !== viewerId
  ) {
    try {
      const { isCloseFriend } = await followClient.checkCloseFriend(String(flux.userId), viewerId);
      if (!isCloseFriend) return;
    } catch {
      return;
    }
  }

  // ── Deduplicate using the flat `viewers` array (fast .includes check) ──
  const alreadyViewed =
    Array.isArray(flux.viewers) &&
    flux.viewers.map(String).includes(String(viewerId));

  if (!alreadyViewed) {
    // ── Atomically update BOTH arrays in one DB round-trip ──
    // `viewers`  = flat string array → used by viewCount virtual & dedup
    // `views`    = detailed subdoc array → used for analytics (who viewed when)
    await FluxModel.findByIdAndUpdate(
      fluxId,
      {
        $addToSet: { viewers: String(viewerId) }, // ← FIX: was missing
        $push: { views: { viewerId: String(viewerId), viewedAt: new Date() } },
      },
      { new: false },
    );
    // Invalidate owner's user-level cache so fresh viewCount appears
    await redisClient.del(USER_FLUXES_KEY(String(flux.userId))).catch(() => {});
  }
};

//  React to Flux
export const reactToFlux = async (
  fluxId: string,
  userId: string,
  emoji: string,
): Promise<void> => {
  const flux = await FluxModel.findById(fluxId);
  if (!flux || flux.isDeleted) throw new Error("Flux not found");

  const existing = flux.reactions.findIndex((r) => r.userId === userId);
  if (existing >= 0) {
    flux.reactions[existing].emoji = emoji;
  } else {
    flux.reactions.push({ userId, emoji, createdAt: new Date() });
  }
  await flux.save();
};

//  Get Viewers

export const getFluxViewers = async (
  fluxId: string,
  requesterId: string,
): Promise<any> => {
  const flux = await FluxModel.findById(fluxId);
  if (!flux) throw new Error("Flux not found");
  if (flux.userId !== requesterId) throw new Error("Unauthorized");

  const viewerIds = flux.views.map((v) => v.viewerId);
  const usersResp = await wieUserClient
    .getUsersByIds(viewerIds)
    .catch(() => ({ users: [] }));

  return {
    viewers: usersResp.users || [],
    reactions: flux.reactions,
    viewCount: flux.views.length,
  };
};

// Delete Flux
export const deleteFlux = async (
  fluxId: string,
  userId: string,
): Promise<void> => {
  const flux = await FluxModel.findById(fluxId);
  if (!flux) throw new Error("Flux not found");
  if (flux.userId !== userId) throw new Error("Unauthorized");

  await deleteFluxMedia(flux.mediaUrl, flux.cloudinaryResourceType);
  flux.isDeleted = true;
  flux.status = "deleted";
  await flux.save();
  await redisClient.del(USER_FLUXES_KEY(userId)).catch(() => {});
  await redisClient.del(FEED_CACHE_KEY(userId)).catch(() => {});
};

export const getAllMyFluxes = async (userId: string): Promise<IFlux[]> => {
  // First, mark any expired fluxes that haven't been updated yet - BUT NEVER persistent ones
  await FluxModel.updateMany(
    {
      userId,
      isPersistent: { $ne: true },
      expiresAt: { $lt: new Date() },
      isDeleted: false,
      status: "active",
    },
    { $set: { status: "expired", isArchived: true } },
  ).catch(() => {});

  const fluxes = await FluxModel.find({
    userId,
    isDeleted: false, // only exclude hard-deleted / soft-deleted
  })
    .sort({ createdAt: -1 })
    .exec();

  console.log(`[getAllMyFluxes] userId=${userId} found=${fluxes.length}`);
  return fluxes;
};

export const archiveExpiredFluxes = async (): Promise<number> => {
  const FluxSettingsModel = (await import("../models/flux-settings.model"))
    .default;

  // Find all newly-expired fluxes
  const expiredFluxes = await FluxModel.find({
    expiresAt: { $lt: new Date() },
    isArchived: false,
    isDeleted: false,
    status: { $nin: ["expired", "deleted"] },
  }).lean();

  if (expiredFluxes.length === 0) return 0;

  // Group by userId so we fetch settings once per user
  const byUser: Record<string, string[]> = {};
  for (const f of expiredFluxes) {
    const uid = (f as any).userId.toString();
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push((f as any)._id.toString());
  }

  let modified = 0;

  for (const [userId, fluxIds] of Object.entries(byUser)) {
    const settings = await FluxSettingsModel.findOne({ userId }).lean();
    const saveToArchive: boolean = (settings as any)?.save?.archive ?? true;

    if (saveToArchive) {
      // Archive: keep document, mark as expired + archived
      await FluxModel.updateMany(
        { _id: { $in: fluxIds } },
        { $set: { isArchived: true, status: "expired" } },
      );
    } else {
      // Delete permanently: owner opted out of archive
      await FluxModel.updateMany(
        { _id: { $in: fluxIds } },
        { $set: { isDeleted: true, status: "deleted", isArchived: false } },
      );
    }
    modified += fluxIds.length;
  }

  return modified;
};
