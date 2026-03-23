import FluxModel, { IFlux, FluxVisibility } from "../models/flux.model";
import * as followClient from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import redisClient from "../config/redis";
import { uploadFluxMedia, deleteFluxMedia } from "../utils/cloudinaryHelper";

const FEED_CACHE_TTL = 300; // 5 min
const FEED_CACHE_KEY = (userId: string) => `flux:feed:${userId}`;
const USER_FLUXES_KEY = (userId: string) => `flux:user:${userId}`;

export const canViewFlux = async (
  viewerId: string,
  ownerId: string,
  visibility: FluxVisibility,
): Promise<boolean> => {
  if (viewerId === ownerId) return true;
  // Explicitly hidden
  if (visibility === "only_me") return false;
  const blockCheck = await wieUserClient
    .checkIfBlocked(viewerId, ownerId)
    .catch(() => ({ isBlocked: false }));
  if (blockCheck?.isBlocked) return false;
  // Account privacy — if gRPC fails, DEFAULT to public (don't block)
  let accountPrivacy = "public";
  try {
    const privacyResp = await wieUserClient.getAccountPrivacy(ownerId);
    accountPrivacy = privacyResp?.accountPrivacy ?? "public";
  } catch {
    accountPrivacy = "public";
  }
  // Private account → must follow
  if (accountPrivacy === "private") {
    const follow = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));
    return follow.isFollowing;
  }
  // Public account:
  // - flux visibility 'public'    → anyone can view
  // - flux visibility 'followers' → only followers
  // - flux visibility 'close_friends' → only close friends (treat as followers for now)
  if (visibility === "followers" || visibility === "close_friends") {
    const follow = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));
    return follow.isFollowing;
  }
  // visibility === 'public' on a public account → allow everyone
  return true;
};

// Create Flux
export const createFlux = async (
  userId: string,
  file: Express.Multer.File | null,
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
  },
): Promise<IFlux> => {
  // ── Determine media source ─────────────────────────────────────────────
  let mediaUrl: string | undefined;
  let mediaType: "image" | "video" = "image";
  let cloudinaryPublicId = "text_flux";
  let cloudinaryResourceType = "raw";
  let duration: number | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let format: string | undefined;
  let bytes: number | undefined;

  if (file) {
    // Real upload
    const uploaded = await uploadFluxMedia(file.buffer, file.mimetype);
    mediaUrl = uploaded.url;
    mediaType = uploaded.mediaType === "video" ? "video" : "image";
    cloudinaryPublicId = uploaded.publicId;
    cloudinaryResourceType = uploaded.mediaType;
    duration = uploaded.duration;
    width = uploaded.width;
    height = uploaded.height;
    format = uploaded.format;
    bytes = uploaded.bytes;
  } else if (body.mediaUrl) {
    // Re-mention / pre-existing URL passed from frontend
    mediaUrl = body.mediaUrl;
    mediaType = body.mediaUrl.match(/\.(mp4|mov|webm|avi)(\?|$)/i)
      ? "video"
      : "image";
    cloudinaryPublicId = "repost_" + Date.now();
    cloudinaryResourceType = mediaType;
  } else {
    // Text-only flux — no media needed
    // Use a placeholder so mediaUrl is never undefined (schema requires it)
    mediaUrl = "";
    mediaType = "image";
    cloudinaryPublicId = "text_flux_" + Date.now();
    cloudinaryResourceType = "raw";
  }

  // Validate: must have EITHER media OR text layers
  const textLayers = body.textLayers ? JSON.parse(body.textLayers) : [];
  if (!mediaUrl && (!textLayers || textLayers.length === 0) && !body.textBg) {
    throw new Error("Flux must have media or text content");
  }

  const flux = await FluxModel.create({
    userId,
    mediaUrl,
    mediaType,
    cloudinaryPublicId,
    cloudinaryResourceType,
    caption: body.caption,
    visibility: body.visibility || "public",
    status: "active",
    duration,
    width,
    height,
    format,
    bytes,

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

  await redisClient.del(USER_FLUXES_KEY(userId)).catch(() => {});
  return flux;
};

//  Get Active Fluxes for a User
export const getUserFluxes = async (
  viewerId: string,
  ownerId: string,
): Promise<IFlux[]> => {
  const cacheKey = USER_FLUXES_KEY(ownerId);

  let allFluxes: IFlux[] = [];

  // Try cache first
  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) {
    try {
      allFluxes = JSON.parse(cached);
    } catch {
      allFluxes = [];
    }
  } else {
    // Mark any newly-expired active fluxes before querying
    await FluxModel.updateMany(
      {
        userId: ownerId,
        expiresAt: { $lt: new Date() },
        isDeleted: false,
        status: "active",
      },
      { $set: { status: "expired", isArchived: true } },
    ).catch(() => {});

    // Fetch only active (not yet expired) non-deleted fluxes
    allFluxes = await FluxModel.find({
      userId: ownerId,
      isDeleted: false,
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .exec();

    // Cache the raw active list
    await redisClient
      .set(cacheKey, JSON.stringify(allFluxes), FEED_CACHE_TTL)
      .catch(() => {});
  }

  console.log(
    `[getUserFluxes] viewerId=${viewerId} ownerId=${ownerId} total=${allFluxes.length}`,
  );

  // Filter by access rules
  const visible: IFlux[] = [];
  for (const f of allFluxes) {
    // Skip if hidden from this viewer
    const hiddenFrom: string[] = (f as any).hiddenFrom ?? [];
    if (hiddenFrom.includes(viewerId)) {
      console.log(`[getUserFluxes] flux ${f._id} hidden from viewer`);
      continue;
    }

    const canView = await canViewFlux(viewerId, ownerId, f.visibility);
    console.log(
      `[getUserFluxes] flux ${f._id} visibility=${f.visibility} canView=${canView}`,
    );

    if (canView) visible.push(f);
  }

  console.log(`[getUserFluxes] returning ${visible.length} visible fluxes`);
  return visible;
};

// Feed — Following users with active fluxes

export const getFluxFeed = async (viewerId: string): Promise<any[]> => {
  const cacheKey = FEED_CACHE_KEY(viewerId);

  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  // Get who the viewer follows
  const { followerIds } = await followClient
    .getFollowerIds(viewerId)
    .catch(() => ({ followerIds: [] }));

  const following = followerIds; // getFollowerIds returns who follows viewerId; we need following
  // Actually use a different approach: get fluxes from users the viewer follows
  // We'll query fluxes from all users and filter
  const allFluxes = await FluxModel.aggregate([
    {
      $match: {
        expiresAt: { $gt: new Date() },
        isDeleted: false,
        visibility: { $ne: "only_me" },
      },
    },
    {
      $group: {
        _id: "$userId",
        fluxes: {
          $push: {
            _id: "$_id",
            mediaUrl: "$mediaUrl",
            mediaType: "$mediaType",
            caption: "$caption",
            visibility: "$visibility",
            viewCount: { $size: "$views" },
            createdAt: "$createdAt",
            expiresAt: "$expiresAt",
            musicTitle: "$musicTitle",
            musicArtist: "$musicArtist",
          },
        },
        latestAt: { $max: "$createdAt" },
        hasUnseen: { $sum: 1 },
      },
    },
    { $sort: { latestAt: -1 } },
  ]);

  // Get user details
  const ownerIds = allFluxes.map((f: any) => f._id);
  const usersResp = await wieUserClient
    .getUsersByIds(ownerIds)
    .catch(() => ({ users: [] }));

  const userMap: Record<string, any> = {};
  (usersResp.users || []).forEach((u: any) => {
    userMap[u.id] = u;
  });

  // Home feed rule:
  // - Own fluxes: always show (isSelf)
  // - Everyone else: ONLY show if the viewer is following them
  //   (public or private — following is REQUIRED for home feed)
  //   Non-followers can only view via the profile page directly.
  const feed = [];
  for (const group of allFluxes) {
    const ownerId = group._id;

    // Always include own fluxes
    if (ownerId === viewerId) {
      feed.push({ ...group, user: userMap[ownerId] || null, isSelf: true });
      continue;
    }

    const user = userMap[ownerId];
    if (!user) continue;

    // Strict follow check — no exceptions for public accounts on home feed
    const followCheck = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));

    if (!followCheck.isFollowing) continue;

    feed.push({ ...group, user, isSelf: false });
  }

  await redisClient
    .set(cacheKey, JSON.stringify(feed), FEED_CACHE_TTL)
    .catch(() => {});

  return feed;
};

// ── View Flux
export const viewFlux = async (
  fluxId: string,
  viewerId: string,
): Promise<void> => {
  const flux = await FluxModel.findById(fluxId);
  if (!flux || flux.isDeleted) return;

  const alreadyViewed = flux.views.some((v) => v.viewerId === viewerId);
  if (!alreadyViewed) {
    flux.views.push({ viewerId, viewedAt: new Date() });
    await flux.save();
    // Invalidate feed cache
    await redisClient.del(USER_FLUXES_KEY(flux.userId)).catch(() => {});
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
};

export const getAllMyFluxes = async (userId: string): Promise<IFlux[]> => {
  // First, mark any expired fluxes that haven't been updated yet
  await FluxModel.updateMany(
    {
      userId,
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

export const getArchivedFluxes = async (userId: string): Promise<IFlux[]> => {
  return FluxModel.find({
    userId,
    isArchived: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .exec();
};

export const archiveExpiredFluxes = async (): Promise<number> => {
  const result = await FluxModel.updateMany(
    {
      expiresAt: { $lt: new Date() },
      isArchived: false,
      isDeleted: false,
      status: { $ne: "expired" },
    },
    { $set: { isArchived: true, status: "expired" } },
  );
  return result.modifiedCount;
};
