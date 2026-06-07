import FluxModel, { IFlux, FluxVisibility } from "../models/flux.model";
import * as followClient from "../grpc/clients/followClient";
import CloseFriendModel from "../models/close-friend.model";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import redisClient from "../config/redis";
import { uploadFluxMedia, deleteFluxMedia } from "../utils/cloudinaryHelper";

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
  if (visibility === "followers") {
    const follow = await followClient
      .isFollowing(viewerId, ownerId)
      .catch(() => ({ isFollowing: false }));
    return follow.isFollowing;
  }
  if (visibility === "close_friends") {
    const isCF = await CloseFriendModel.findOne({
      userId: String(ownerId),
      closeFriendId: String(viewerId),
    })
      .select("_id")
      .lean()
      .catch(() => null);
    return !!isCF;
  }
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
  // ── Determine media source
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
  const expiresAt = new Date(now.getTime() + DURATION_MS);
  const flux = await FluxModel.create({
    userId,
    mediaUrl,
    mediaType,
    cloudinaryPublicId,
    cloudinaryResourceType,
    caption: body.caption,
    visibility: body.visibility || "public",
    status: "active",
    isDeleted: false,
    isArchived: false,
    createdAt: now,
    expiresAt,
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

    duration,
    width,
    height,
    format,
    bytes,
  });

  // ── Invalidate caches ──
  // Owner's own caches
  await redisClient.del(USER_FLUXES_KEY(userId)).catch(() => {});
  await redisClient.del(FEED_CACHE_KEY(userId)).catch(() => {});
  // All followers' feed caches — so they see the new flux immediately
  await invalidateFollowerFeedCaches(userId).catch(() => {});

  return flux;
};
//  Get Active Fluxes for a User
export const getUserFluxes = async (
  viewerId: string,
  ownerId: string,
): Promise<IFlux[]> => {
  // Mark expired fluxes
  await FluxModel.updateMany(
    {
      userId: ownerId,
      expiresAt: { $lt: new Date() },
      isDeleted: false,
      status: "active",
    },
    { $set: { status: "expired", isArchived: true } },
  ).catch(() => {});

  // Always fetch fresh — never cache raw list (CF fluxes would leak across viewers)
  const allFluxes = await FluxModel.find({
    userId: ownerId,
    isDeleted: false,
    status: "active",
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: 1 })
    .exec();

  const visible: IFlux[] = [];
  for (const f of allFluxes) {
    const hiddenFrom: string[] = (f as any).hiddenFrom ?? [];
    if (hiddenFrom.map(String).includes(String(viewerId))) continue;
    const canView = await canViewFlux(viewerId, ownerId, f.visibility);
    if (canView) visible.push(f);
  }
  return visible;
};

// Feed — Following users with active fluxes
export const getFluxFeed = async (viewerId: string): Promise<any[]> => {
  const cacheKey = FEED_CACHE_KEY(viewerId);

  const cached = await redisClient.get(cacheKey).catch(() => null);
  if (cached) return JSON.parse(cached);

  //Get the list of users the viewer is FOLLOWING (not followers)
  // We call GetFollowing to get who viewerId follows.
  const { followingIds } = await followClient
    .getFollowingIds(viewerId)
    .catch(() => ({ followingIds: [] as string[] }));

  // Always include the viewer's own fluxes
  const targetUserIds = [...new Set([...followingIds, viewerId])];

  if (targetUserIds.length === 0) return [];
  // Show ALL non-expired fluxes regardless of when follow relationship started
  const allFluxes = await FluxModel.aggregate([
    {
      $match: {
        $or: [
          { userId: { $in: targetUserIds } },
          { userId: { $in: targetUserIds.map((id: string) => {
            try {
              const { Types } = require("mongoose");
              return new Types.ObjectId(id);
            } catch { return id; }
          }) } },
        ],
        expiresAt: { $gt: new Date() },
        isDeleted: false,
        isArchived: false,
        status: "active",
        visibility: { $ne: "only_me" },
        $expr: {
          $not: { $in: [String(viewerId), { $ifNull: ["$hiddenFrom", []] }] },
        },
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
      },
    },
    { $sort: { latestAt: -1 } },
  ]);

  if (allFluxes.length === 0) return [];
  // ── Step A: Collect owners who have at least one close_friends flux ──
  const ownersWithCFFlux: string[] = allFluxes
    .filter((g: any) =>
      g.fluxes.some((f: any) => f.visibility === "close_friends"),
    )
    .map((g: any) => String(g._id));

  // ── Step B: Build cfAllowed — owners whose CF fluxes THIS viewer may see ──
  const cfAllowed = new Set<string>([viewerId]); // viewer always sees their own

  if (ownersWithCFFlux.length > 0) {
    const cfDocs = await CloseFriendModel.find({
      userId: { $in: ownersWithCFFlux },
      closeFriendId: String(viewerId),
    })
      .select("userId")
      .lean();
    cfDocs.forEach((doc: any) => cfAllowed.add(String(doc.userId)));
  }

  // ── Step C: Strip close_friends fluxes the viewer is NOT allowed to see ──
  const filteredGroups = allFluxes
    .map((group: any) => {
      const ownerId = String(group._id);
      const isViewerSelf = ownerId === viewerId;
      const canSeeCF = isViewerSelf || cfAllowed.has(ownerId);

      const visibleFluxes = group.fluxes.filter((f: any) => {
        if (f.visibility === "close_friends") {
          // STRICT: viewer must be in THIS owner's CF list, or viewer IS the owner
          return isViewerSelf || cfAllowed.has(ownerId);
        }
        return true;
      });
      return { ...group, fluxes: visibleFluxes };
    })
    .filter((group: any) => group.fluxes.length > 0);
  if (filteredGroups.length === 0) return [];
  // Get user details for all owners in one batch call
  const ownerIds = filteredGroups.map((f: any) => f._id);
  const usersResp = await wieUserClient
    .getUsersByIds(ownerIds)
    .catch(() => ({ users: [] }));

  const userMap: Record<string, any> = {};
  (usersResp.users || []).forEach((u: any) => {
    userMap[u.id] = u;
  });
  const feed = filteredGroups.map((group: any) => ({
    ...group,
    user: userMap[group._id] || null,
    isSelf: group._id === viewerId,
  }));
  await redisClient
    .set(cacheKey, JSON.stringify(feed), FEED_CACHE_TTL)
    .catch(() => {});

  return feed;
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
    const allowed = await CloseFriendModel.exists({
      userId: flux.userId,
      closeFriendId: viewerId,
    })
      .then((r) => !!r)
      .catch(() => false);
    if (!allowed) return;
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
