import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth";
import FluxModel from "../models/flux.model";
import CloseFriendModel from "../models/close-friend.model";
import FluxSettingsModel from "../models/flux-settings.model";
import FluxScreenshotEventModel from "../models/flux-screenshot-event.model";
import * as fluxService from "../services/flux.service";
import {
  isFollowing,
  getFollowerIds,
  getFollowingIds,
} from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import redisClient from "../config/redis";
import type { FluxVisibility } from "../models/flux.model";
import {
  createNotification,
  emitMentionEvent,
} from "../utils/notificationHelper";
import * as chatClient from "../grpc/clients/chatClient";
const FEED_CACHE_KEY = (viewerId: string) => `flux:feed:${viewerId}`;
const USER_FLUXES_KEY = (userId: string) => `flux:user:${userId}`;
const SCREENSHOT_THRESHOLDS = [1, 3, 5, 10, 20, 50, 100];

export const createFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();

    const flux = await fluxService.createFlux(
      callerId,
      req.file ?? null,
      req.body,
    );

    const createdAt = new Date(flux.createdAt);
    const expiresAt = new Date(flux.expiresAt);
    const diffHours =
      (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (diffHours < 23.9) {
      console.warn(
        `[createFlux] ⚠️  expiresAt is less than 24h from createdAt! ` +
          `diffHours=${diffHours}. Check server clock and schema defaults.`,
      );
    }
    await fluxService.invalidateFollowerFeedCaches(callerId).catch(() => {});
    let mentionedUserIds: string[] = [];
    try {
      const raw = req.body.mentions;
      if (raw) {
        mentionedUserIds = typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch {}
    if (mentionedUserIds.length > 0) {
      processMentionsAfterCreate(
        flux._id.toString(),
        callerId,
        mentionedUserIds,
      ).catch((err) =>
        console.error("❌ processMentionsAfterCreate failed:", err),
      );
    }
    res.status(201).json({ success: true, data: flux });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Internal helper: process mentions right after flux creation
async function processMentionsAfterCreate(
  fluxId: string,
  callerId: string,
  mentionedUserIds: string[],
): Promise<void> {
  const flux = await FluxModel.findById(fluxId);
  if (!flux) return;

  // Fetch caller info once
  const callerResp = await wieUserClient
    .getUsersByIds([callerId])
    .catch(() => ({ users: [] }));
  const callerInfo = (callerResp.users ?? [])[0];
  const callerName = callerInfo?.name ?? callerInfo?.username ?? "Someone";
  const callerAvatar =
    callerInfo?.profile_picture ?? callerInfo?.profilePicture ?? "";

  const allowed: string[] = [];

  for (const targetId of mentionedUserIds) {
    if (targetId === callerId) continue;

    // Follow check
    const followResp = await isFollowing(callerId, targetId).catch(() => ({
      isFollowing: false,
    }));
    if (!followResp.isFollowing) continue;

    // Block check
    const blockResp = await wieUserClient
      .checkIfBlocked(callerId, targetId)
      .catch(() => ({ blocked: false }));
    if (blockResp.blocked) continue;

    // Privacy check
    const targetPrivacy = await wieUserClient
      .getAccountPrivacy(targetId)
      .catch(() => null);
    if (targetPrivacy?.accountPrivacy === "private") {
      const mutualResp = await isFollowing(targetId, callerId).catch(() => ({
        isFollowing: false,
      }));
      if (!mutualResp.isFollowing) continue;
    }

    allowed.push(targetId);
  }

  if (allowed.length === 0) return;

  // Save mentions to the flux document
  const now = new Date();
  const newMentions = allowed.map((userId) => ({ userId, createdAt: now }));
  flux.mentions = [...(flux.mentions ?? []), ...newMentions] as any;
  await flux.save();

  // Fetch mentioned users' details
  const usersResp = await wieUserClient
    .getUsersByIds(allowed)
    .catch(() => ({ users: [] }));

  for (const u of usersResp.users ?? []) {
    const mentionedUserId = (u._id ?? u.id).toString();
    const mentionedName = u.name ?? u.username ?? "Someone";
    const receiverFluxUrl = `/post/flux-view?fluxId=${fluxId}&userId=${callerId}`;
    const senderFluxUrl = `/post/flux-view?fluxId=${fluxId}`;

    // ── Notification to mentioned user ──
    try {
      await createNotification({
        userId: mentionedUserId,
        type: "flux_mention",
        title: "You were mentioned in a story",
        message: `${callerName} mentioned you in their story`,
        fromUserId: callerId,
        metadata: {
          fluxId,
          fluxMediaUrl: flux.mediaUrl,
          fluxMediaType: flux.mediaType,
          mentionerName: callerName,
          mentionerAvatar: callerAvatar,
          fluxOwnerId: callerId,
          targetUrl: receiverFluxUrl,
        },
        link: receiverFluxUrl,
      });
      console.log(`✅ Mention notification sent to ${mentionedUserId}`);
    } catch (err) {
      console.error("❌ receiver notification failed:", err);
    }

    // ── Notification to caller (sender) ──
    try {
      await createNotification({
        userId: callerId,
        type: "flux_mention_sent",
        title: `You mentioned ${mentionedName} in your story`,
        message: `You mentioned ${mentionedName} in your story`,
        fromUserId: mentionedUserId,
        metadata: {
          fluxId,
          fluxMediaUrl: flux.mediaUrl,
          fluxMediaType: flux.mediaType,
          mentionedName,
          fluxOwnerId: callerId,
          targetUrl: senderFluxUrl,
        },
        link: senderFluxUrl,
      });
    } catch (err) {
      console.error("❌ sender notification failed:", err);
    }

    // ── Chat message: caller → mentioned user ──
    const chatContent = JSON.stringify({
      text: `${callerName} mentioned a Flux`,
      senderLabel: "You mentioned a Flux",
      fluxId,
      fluxMediaUrl: flux.mediaUrl,
      fluxMediaType: flux.mediaType,
      fluxOwnerId: callerId,
      mentionerName: callerName,
      fluxUrl: receiverFluxUrl,
      type: "flux_mention",
    });

    try {
      const chatResult = await chatClient.sendSystemMessage({
        sender_id: callerId,
        receiver_id: mentionedUserId,
        message_type: "flux_mention",
        content: chatContent,
        metadata_json: JSON.stringify({
          fluxId,
          fluxMediaUrl: flux.mediaUrl,
          fluxMediaType: flux.mediaType,
          mentionerName: callerName,
          mentionerAvatar: callerAvatar,
          fluxOwnerId: callerId,
          type: "flux_mention",
        }),
      });
      console.log(
        `✅ Mention chat sent: chatId=${chatResult.chat_id}, msgId=${chatResult.message_id}`,
      );
    } catch (err) {
      console.error("❌ chat system message failed:", err);
    }

    // ── Emit mention event ──
    emitMentionEvent({
      mentionedUserId,
      mentionerUserId: callerId,
      fluxId,
      fluxMediaUrl: flux.mediaUrl,
    }).catch((err) => console.error("mention event emit failed:", err));
  }
}
export const getFluxFeed = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const feed = await fluxService.getFluxFeed(viewerId); // ← service version (has Redis cache)
    res.json({ success: true, data: feed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const invalidateFollowFeedCache = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const { ownerId } = req.body;

    if (!ownerId) {
      res.status(400).json({ success: false, message: "ownerId is required" });
      return;
    }

    await fluxService.invalidateViewerFeedCache(viewerId, ownerId);
    res.json({ success: true, message: "Feed cache invalidated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// GET /flux/:fluxId
export const getFluxById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const viewerId = req.userId!;

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux || (flux as any).isDeleted) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const ownerId = String((flux as any).userId);

    // Enforce close_friends visibility
    if ((flux as any).visibility === "close_friends" && ownerId !== viewerId) {
      const isCF = await CloseFriendModel.exists({
        userId: ownerId, // owner's list
        closeFriendId: viewerId, // viewer must be in it
      });
      if (!isCF) {
        res.status(403).json({
          success: false,
          message: "This flux is for close friends only",
        });
        return;
      }
    }

    // Enforce only_me
    if ((flux as any).visibility === "only_me" && ownerId !== viewerId) {
      res.status(403).json({ success: false, message: "This flux is private" });
      return;
    }

    res.json({ success: true, flux });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserFluxes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const fluxes = await fluxService.getUserFluxes(req.userId!, userId);
    res.json({
      success: true,
      data: fluxes,
      count: fluxes.length,
      message:
        fluxes.length === 0 ? "No active fluxes for this user" : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const viewFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    await fluxService.viewFlux(fluxId, req.userId!);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reactToFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const { emoji } = req.body;
    const callerId = req.userId!.toString();
    const flux = await FluxModel.findOne({
      _id: fluxId,
      isDeleted: false,
    }).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const ownerId = (flux as any).userId.toString();
    if (ownerId === callerId) {
      res
        .status(403)
        .json({ success: false, message: "Cannot react to your own flux" });
      return;
    }
    const ownerSettings = await FluxSettingsModel.findOne({
      userId: ownerId,
    }).lean();
    const allowReactions =
      (ownerSettings as any)?.interactions?.reactions ?? true;
    if (!allowReactions) {
      res.status(403).json({
        success: false,
        message: "Reactions are disabled for this flux",
      });
      return;
    }
    await fluxService.reactToFlux(fluxId, callerId, emoji);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFluxViewers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const callerId = req.userId!.toString();

    const flux = await FluxModel.findById(fluxId)
      .select("viewers reactions userId")
      .lean();

    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const ownerId = (flux as any).userId?.toString();
    const isOwner = ownerId === callerId;

    // ✅ FIX: Exclude the owner from the viewers list and count
    const allViewerIds: string[] = (flux as any).viewers ?? [];
    const viewerIds = allViewerIds.filter((id) => id.toString() !== ownerId);
    const total = viewerIds.length;
    if (!isOwner) {
      const previewIds = [
        ...new Set([callerId, ...viewerIds]), // caller first, then others
      ].slice(0, 3);

      let previewUsers: any[] = [];
      if (previewIds.length > 0) {
        const resp = await wieUserClient
          .getUsersByIds(previewIds)
          .catch(() => ({ users: [] }));
        previewUsers = (resp.users ?? []).map((u: any) => ({
          id: (u._id ?? u.id).toString(),
          username: u.username ?? "",
          name: u.name ?? u.username ?? "",
          profile_picture: u.profile_picture ?? u.profilePicture ?? null,
          is_verified: u.is_verified ?? false,
        }));
      }

      res.status(200).json({
        success: true,
        total,
        viewers: previewUsers,
        reactions: [],
        viewCount: total,
      });
      return;
    }

    // Owner: return full enriched viewer list
    let enrichedViewers: any[] = [];
    if (viewerIds.length > 0) {
      const resp = await wieUserClient
        .getUsersByIds(viewerIds)
        .catch(() => ({ users: [] }));
      enrichedViewers = (resp.users ?? []).map((u: any) => ({
        id: (u._id ?? u.id).toString(),
        username: u.username ?? "",
        name: u.name ?? u.username ?? "",
        profile_picture: u.profile_picture ?? u.profilePicture ?? null,
        is_verified: u.is_verified ?? false,
      }));
    }

    res.status(200).json({
      success: true,
      total,
      viewers: enrichedViewers,
      reactions: (flux as any).reactions ?? [],
      viewCount: total,
      data: {
        viewers: enrichedViewers,
        reactions: (flux as any).reactions ?? [],
        total,
        viewCount: total,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    await fluxService.deleteFlux(fluxId, req.userId!);
    res.json({ success: true, message: "Flux deleted" });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
  }
};

export const getAllMyFluxes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const fluxes = await fluxService.getAllMyFluxes(req.userId!);
    res.json({
      success: true,
      data: fluxes,
      count: fluxes.length,
      message: fluxes.length === 0 ? "No fluxes found" : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getArchivedFluxes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const [expired, active] = await Promise.all([
      // Expired: normally archived (24h stories that have passed)
      FluxModel.find({
        userId: req.userId,
        isArchived: true,
        isPersistent: { $ne: true },
        isDeleted: false,
      })
        .sort({ createdAt: -1 })
        .exec(),

      // Active: persistent no-expiry stories still live
      FluxModel.find({
        userId: req.userId,
        isPersistent: true,
        isDeleted: false,
        isArchived: false,
      })
        .sort({ createdAt: -1 })
        .exec(),
    ]);
    res.status(200).json({ success: true, data: { expired, active } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/flux/:fluxId/archive
// REPLACE archiveFlux entirely:
export const archiveFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: req.userId,
      isDeleted: false,
    });
    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    // Persistent (no-expiry) fluxes cannot be auto-archived — user must delete them
    if ((flux as any).isPersistent && !flux.isArchived) {
      res.status(400).json({
        success: false,
        message:
          "Persistent stories cannot be archived — delete or remove persistence first",
      });
      return;
    }

    flux.isArchived = !flux.isArchived;
    flux.status = flux.isArchived ? "archived" : "active";

    // If unarchiving a persistent flux, restore it as active with no expiry
    if (!flux.isArchived && (flux as any).isPersistent) {
      flux.expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // 100 years
    }

    await flux.save();
    await redisClient.del(`flux:user:${req.userId}`).catch(() => {});
    await redisClient.del(`flux:feed:${req.userId}`).catch(() => {});

    res.json({
      success: true,
      isArchived: flux.isArchived,
      message: flux.isArchived ? "Flux archived" : "Flux unarchived",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/flux/:fluxId/persistent — toggle no-expiry (pinned story)
export const toggleFluxPersistent = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: req.userId,
      isDeleted: false,
    });
    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    // Count existing persistent fluxes (soft limit: 5)
    if (!(flux as any).isPersistent) {
      const persistentCount = await FluxModel.countDocuments({
        userId: req.userId,
        isPersistent: true,
        isDeleted: false,
      });
      if (persistentCount >= 5) {
        res.status(400).json({
          success: false,
          message:
            "You can have at most 5 persistent stories. Remove persistence from another first.",
        });
        return;
      }
    }

    (flux as any).isPersistent = !(flux as any).isPersistent;

    if ((flux as any).isPersistent) {
      // Set expiry far in the future so feed query ($gt: new Date()) still works
      flux.expiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
      flux.isArchived = false;
      flux.status = "active";
    } else {
      // Restore normal 24h expiry from original createdAt
      flux.expiresAt = new Date(flux.createdAt.getTime() + 24 * 60 * 60 * 1000);
      // If that's already past, archive it now
      if (flux.expiresAt < new Date()) {
        flux.isArchived = true;
        flux.status = "archived";
      }
    }

    await flux.save();
    await redisClient.del(`flux:user:${req.userId}`).catch(() => {});
    await redisClient.del(`flux:feed:${req.userId}`).catch(() => {});

    res.json({
      success: true,
      isPersistent: (flux as any).isPersistent,
      expiresAt: flux.expiresAt,
      message: (flux as any).isPersistent
        ? "Story is now persistent (no expiry)"
        : "Story reverted to normal 24h expiry",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/flux/:fluxId/comments/toggle
export const toggleFluxComments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: req.userId,
      isDeleted: false,
    });
    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }
    // Toggle commentsDisabled flag — add to model if missing (handled via any cast)
    const current = (flux as any).commentsDisabled ?? false;
    (flux as any).commentsDisabled = !current;
    await flux.save();
    await redisClient.del(`flux:user:${req.userId}`).catch(() => {});
    res.json({
      success: true,
      commentsDisabled: (flux as any).commentsDisabled,
      message: (flux as any).commentsDisabled
        ? "Comments turned off"
        : "Comments turned on",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/**
 * GET /api/flux/mine
 * Returns all non-deleted fluxes for the authenticated user, newest first.
 */
export const getMyFluxes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();

    // Mark newly-expired fluxes before fetching
    const expiredResult = await FluxModel.updateMany(
      {
        userId,
        expiresAt: { $lt: new Date() },
        isDeleted: false,
        status: "active",
      },
      { $set: { status: "expired", isArchived: true } },
    ).catch(() => ({ modifiedCount: 0 }));

    // ── FIX: if any fluxes just expired, bust the owner's own feed cache ──
    if (expiredResult.modifiedCount > 0) {
      await redisClient.del(FEED_CACHE_KEY(userId)).catch(() => {});
      await redisClient.del(USER_FLUXES_KEY(userId)).catch(() => {});
    }

    const fluxes = await FluxModel.find({
      userId,
      expiresAt: { $gt: new Date() },
      isDeleted: false,
      status: "active",
    })
      .sort({ createdAt: 1 })
      .exec();

    res.json({
      success: true,
      data: fluxes,
      count: fluxes.length,
      message: fluxes.length === 0 ? "No active fluxes" : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/flux/:fluxId/view
 * Adds the viewer to the `viewers` array (deduped via $addToSet).
 * Returns the updated unique-viewer count.
 */
export const recordView = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const viewerId = req.userId!;

    await FluxModel.updateOne(
      { _id: fluxId, isDeleted: false },
      { $addToSet: { viewers: viewerId } },
    );

    // viewCount is a virtual = viewers.length, so re-fetch just that field
    const updated = await FluxModel.findById(fluxId).select("viewers").lean();
    const viewCount = (updated?.viewers ?? []).length;

    res.json({ success: true, viewCount });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message ?? "Failed to record view",
    });
  }
};

/**
 * GET /api/flux/:fluxId/viewers
 * Returns the full viewer list + total count.
 * Only the story owner can call this.
 */
export const getViewers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const ownerId = req.userId!;

    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: ownerId,
      isDeleted: false,
    })
      .select("viewers")
      .lean();

    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    const viewers = flux.viewers ?? [];
    res.json({ success: true, total: viewers.length, viewers });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message ?? "Failed to fetch viewers",
    });
  }
};

/**
 * PATCH /api/flux/:fluxId/visibility
 * Update the visibility of a single flux.
 * Body: { visibility: 'public' | 'followers' | 'close_friends' | 'only_me' }
 */
export const updateFluxVisibility = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const visibility: FluxVisibility = req.body.visibility;
    const allowed: FluxVisibility[] = [
      "public",
      "followers",
      "close_friends",
      "only_me",
    ];
    if (!visibility || !allowed.includes(visibility)) {
      res.status(400).json({
        success: false,
        message: `visibility must be one of: ${allowed.join(", ")}`,
      });
      return;
    }

    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: req.userId,
      isDeleted: false,
    });

    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    flux.visibility = visibility;
    await flux.save();
    // Bust caches
    await redisClient.del(`flux:user:${req.userId}`).catch(() => {});
    await redisClient.del(`flux:feed:${req.userId}`).catch(() => {});

    res.json({
      success: true,
      data: { _id: flux._id, visibility: flux.visibility },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/flux/:fluxId/visibility
export const getFluxVisibility = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: req.userId,
      isDeleted: false,
    })
      .select("visibility")
      .lean();

    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    res.json({
      success: true,
      data: { _id: flux._id, visibility: flux.visibility },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/flux/settings/screenshot-block
// Returns whether the owner has screenshot blocking enabled (for flux-view page)
export const getScreenshotBlockSetting = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const settings = await FluxSettingsModel.findOne({ userId }).lean();
    const screenshotAlert =
      (settings as any)?.advanced?.screenshotAlert ?? false;
    res.json({ success: true, data: { screenshotAlert } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/flux/:fluxId/owner-settings
// Called by viewers to know which interactions are allowed on a flux
export const getFluxOwnerSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;

    const flux = await FluxModel.findOne({ _id: fluxId, isDeleted: false })
      .select("userId visibility")
      .lean();

    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const ownerId = (flux as any).userId.toString();
    const settings = await FluxSettingsModel.findOne({
      userId: ownerId,
    }).lean();
    const s = settings as any;

    res.status(200).json({
      success: true,
      data: {
        visibility: (flux as any).visibility ?? "public",
        allowReplies: s?.interactions?.replies ?? "everyone",
        allowReactions: s?.interactions?.reactions ?? true,
        allowMessageReplies: s?.interactions?.messageReplies ?? true,
        allowShareToStory: s?.sharing?.reshare ?? true,
        allowShareAsMessage: s?.sharing?.shareToMessage ?? true,
        allowExternalShare: s?.sharing?.externalShare ?? false,
        saveToDevice: s?.save?.saveToDevice ?? false,
        screenshotAlert: s?.advanced?.screenshotAlert ?? false,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/**
 * PATCH /api/flux/:fluxId/hide-from
 * Add a userId to the hidden-viewers list for a flux.
 * Body: { hideUserId: string }
 */
export const hideFluxFromUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const { hideUserId } = req.body;

    if (!hideUserId) {
      res
        .status(400)
        .json({ success: false, message: "hideUserId is required" });
      return;
    }

    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: req.userId,
      isDeleted: false,
    });

    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    // Add hiddenFrom field — push if not already present
    await FluxModel.updateOne(
      { _id: fluxId },
      { $addToSet: { hiddenFrom: hideUserId } },
    );

    res.json({ success: true, message: "User hidden from this flux" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/flux/:fluxId/unhide-from
 * Remove a userId from the hidden-viewers list.
 * Body: { unhideUserId: string }
 */
export const unhideFluxFromUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const { unhideUserId } = req.body;

    if (!unhideUserId) {
      res
        .status(400)
        .json({ success: false, message: "unhideUserId is required" });
      return;
    }

    await FluxModel.updateOne(
      { _id: fluxId, userId: req.userId },
      { $pull: { hiddenFrom: unhideUserId } },
    );

    res.json({ success: true, message: "User unhidden from this flux" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const mentionFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId: string | undefined = req.userId?.toString();
    const { fluxId } = req.params;

    const mentionedUserIds: string[] | undefined = Array.isArray(
      (req as any).body?.mentionedUserIds,
    )
      ? (req as any).body.mentionedUserIds
      : undefined;

    if (!callerId) {
      console.error(
        "[mentionFlux] No callerId found. req.userId =",
        req.userId,
      );
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!mentionedUserIds || mentionedUserIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "mentionedUserIds must be a non-empty array",
      });
      return;
    }

    const flux = await FluxModel.findById(fluxId);
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }
    if (flux.userId.toString() !== callerId) {
      res.status(403).json({
        success: false,
        message: "You can only add mentions to your own flux",
      });
      return;
    }
    // Build set of already-mentioned userIds to prevent duplicate mentions per flux
    const alreadyMentionedIds = new Set(
      (flux.mentions ?? []).map((m: any) => m.userId?.toString()),
    );

    const allowed: string[] = [];
    const rejected: string[] = [];
    const duplicates: string[] = [];

    for (const targetId of mentionedUserIds) {
      // Skip self
      if (targetId.toString() === callerId) {
        rejected.push(targetId);
        continue;
      }

      // Skip already mentioned (same flux, same user — one mention per user per flux)
      if (alreadyMentionedIds.has(targetId.toString())) {
        duplicates.push(targetId);
        continue;
      }

      // Must be following the target
      const followResp = await isFollowing(callerId, targetId).catch(() => ({
        isFollowing: false,
      }));
      if (!followResp.isFollowing) {
        rejected.push(targetId);
        continue;
      }

      // Block check
      const blockResp = await wieUserClient
        .checkIfBlocked(callerId, targetId)
        .catch(() => ({ blocked: false }));
      if (blockResp.blocked) {
        rejected.push(targetId);
        continue;
      }

      // Privacy check — if target has a private account, skip unless they follow back
      const targetPrivacy = await wieUserClient
        .getAccountPrivacy(targetId)
        .catch(() => null);
      if (targetPrivacy?.accountPrivacy === "private") {
        // Target is private — only allow mention if target follows the caller back (mutual)
        const mutualResp = await isFollowing(targetId, callerId).catch(() => ({
          isFollowing: false,
        }));
        if (!mutualResp.isFollowing) {
          rejected.push(targetId);
          continue;
        }
      }
      allowed.push(targetId);
    }

    if (allowed.length === 0) {
      res.status(403).json({
        success: false,
        message:
          duplicates.length > 0
            ? "All selected users have already been mentioned in this flux"
            : "You can only mention users you follow (non-blocked)",
        rejected,
        duplicates,
      });
      return;
    }

    // Fetch user details
    const usersResp = await wieUserClient
      .getUsersByIds(allowed)
      .catch(() => ({ users: [] }));
    const callerResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const callerInfo = (callerResp.users ?? [])[0];

    const now = new Date();

    const newMentions = (usersResp.users ?? [])
      .filter((u: any) => {
        const uid = (u._id ?? u.id ?? "").toString();
        return uid && !alreadyMentionedIds.has(uid);
      })
      .map((u: any) => ({
        userId: (u._id ?? u.id).toString(),
        createdAt: now,
      }));

    flux.mentions = [...(flux.mentions ?? []), ...newMentions] as any;
    await flux.save();

    // Send notification + chat message to each newly mentioned user
    const fluxUrl = `/post/flux-view?fluxId=${fluxId}&userId=${callerId}`;
    const callerName = callerInfo?.name ?? callerInfo?.username ?? "Someone";
    const callerAvatar =
      callerInfo?.profile_picture ?? callerInfo?.profilePicture ?? "";

    for (const u of usersResp.users ?? []) {
      const mentionedUserId = (u._id ?? u.id).toString();
      const receiverFluxUrl = `/post/flux-view?fluxId=${fluxId}&userId=${callerId}`;
      const senderFluxUrl = `/post/flux-view?fluxId=${fluxId}`;
      const mentionedName = u.name ?? u.username ?? "Someone";

      // ── Notification to MENTIONED USER (receiver/user B) ──
      try {
        await createNotification({
          userId: mentionedUserId,
          type: "flux_mention",
          title: "You were mentioned in a story",
          message: `${callerName} mentioned you in their story`,
          fromUserId: callerId,
          metadata: {
            fluxId,
            fluxMediaUrl: flux.mediaUrl,
            fluxMediaType: flux.mediaType,
            mentionerName: callerName,
            mentionerAvatar: callerAvatar,
            fluxOwnerId: callerId,
            targetUrl: receiverFluxUrl,
          },
          link: receiverFluxUrl,
        });
        console.log(`✅ Mention notification sent to ${mentionedUserId}`);
      } catch (err) {
        console.error("❌ receiver notification failed:", err);
      }

      // ── Notification to CALLER (sender/user A) ──
      try {
        await createNotification({
          userId: callerId,
          type: "flux_mention_sent",
          title: `You mentioned ${mentionedName} in your story`,
          message: `You mentioned ${mentionedName} in your story`,
          fromUserId: mentionedUserId,
          metadata: {
            fluxId,
            fluxMediaUrl: flux.mediaUrl,
            fluxMediaType: flux.mediaType,
            mentionedName,
            fluxOwnerId: callerId,
            targetUrl: senderFluxUrl,
          },
          link: senderFluxUrl,
        });
        console.log(`✅ Mention sent notification sent to caller ${callerId}`);
      } catch (err) {
        console.error("❌ sender notification failed:", err);
      }

      // ── Chat message: sender (user A) → receiver (user B) ──
      const chatContent = JSON.stringify({
        text: `${callerName} mentioned a Flux`,
        senderLabel: "You mentioned a Flux",
        fluxId,
        fluxMediaUrl: flux.mediaUrl,
        fluxMediaType: flux.mediaType,
        fluxOwnerId: callerId,
        mentionerName: callerName,
        fluxUrl: receiverFluxUrl,
        type: "flux_mention",
      });

      try {
        const chatResult = await chatClient.sendSystemMessage({
          sender_id: callerId,
          receiver_id: mentionedUserId,
          message_type: "flux_mention",
          content: chatContent,
          metadata_json: JSON.stringify({
            fluxId,
            fluxMediaUrl: flux.mediaUrl,
            fluxMediaType: flux.mediaType,
            mentionerName: callerName,
            mentionerAvatar: callerAvatar,
            fluxOwnerId: callerId,
            type: "flux_mention",
          }),
        });
        console.log(
          `✅ Chat message sent: chatId=${chatResult.chat_id}, msgId=${chatResult.message_id}`,
        );
      } catch (err) {
        console.error("❌ chat system message failed:", err);
      }

      // ── Emit mention event ──
      emitMentionEvent({
        mentionedUserId,
        mentionerUserId: callerId,
        fluxId,
        fluxMediaUrl: flux.mediaUrl,
      }).catch((err) => console.error("mention event emit failed:", err));
    }

    res.status(200).json({
      success: true,
      message: "Mentions saved",
      mentions: flux.mentions,
      ...(rejected.length > 0 && {
        rejected,
        warning: "Some users skipped (not following or blocked)",
      }),
      ...(duplicates.length > 0 && {
        duplicates,
        info: "Some users were already mentioned",
      }),
    });
  } catch (err) {
    console.error("mentionFlux error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// POST /flux/:fluxId/remention
export const reMentionFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;
    const body: { comment?: string } = (req as any).body ?? {};

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    // Cannot remention your own flux
    if (flux.userId.toString() === callerId) {
      res
        .status(400)
        .json({ success: false, message: "Cannot remention your own flux" });
      return;
    }

    // Check caller is mentioned in this flux
    const isMentioned = (flux.mentions ?? []).some(
      (m: any) => m.userId?.toString() === callerId,
    );
    if (!isMentioned) {
      res.status(403).json({
        success: false,
        message: "You are not mentioned in this flux",
      });
      return;
    }

    // Block check
    const blockResp = await wieUserClient
      .checkIfBlocked(callerId, flux.userId.toString())
      .catch(() => ({ blocked: false }));
    if (blockResp.blocked) {
      res.status(403).json({ success: false, message: "Blocked user" });
      return;
    }
    // Enforce allowShareToStory (resharing) setting
    const ownerSettings = await FluxSettingsModel.findOne({
      userId: flux.userId.toString(),
    }).lean();
    const allowReshare = (ownerSettings as any)?.sharing?.reshare ?? true;
    if (!allowReshare) {
      res.status(403).json({
        success: false,
        message: "Resharing is disabled for this flux",
      });
      return;
    }
    // Prevent duplicate remention from same user
    const existingReMentions: any[] = (flux as any).reMentions ?? [];
    const alreadyReMentioned = existingReMentions.some(
      (r: any) => r.userId?.toString() === callerId,
    );
    if (alreadyReMentioned) {
      res.status(409).json({
        success: false,
        message: "You have already re-mentioned this flux",
      });
      return;
    }

    // Save remention
    await FluxModel.findByIdAndUpdate(fluxId, {
      $push: {
        reMentions: {
          userId: callerId,
          comment: body.comment?.trim() ?? "",
          createdAt: new Date(),
        },
      },
    });
    // Fetch caller info
    const callerResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const callerInfo = (callerResp.users ?? [])[0];
    const callerName = callerInfo?.name ?? callerInfo?.username ?? "Someone";
    const callerAvatar =
      callerInfo?.profile_picture ?? callerInfo?.profilePicture ?? "";

    const ownerFluxUrl = `/post/flux-view?fluxId=${fluxId}`;
    const callerViewUrl = `/post/flux-view?fluxId=${fluxId}&userId=${flux.userId.toString()}`;

    // ── Notification to original flux owner (user A) ──
    try {
      await createNotification({
        userId: flux.userId.toString(),
        type: "flux_remention",
        title: `${callerName} reshared your story`,
        message: `${callerName} reshared your story`,
        fromUserId: callerId,
        metadata: {
          fluxId,
          fluxMediaUrl: flux.mediaUrl,
          fluxMediaType: flux.mediaType,
          reMentionerName: callerName,
          reMentionerAvatar: callerAvatar,
          fluxOwnerId: flux.userId.toString(),
          targetUrl: ownerFluxUrl,
        },
        link: ownerFluxUrl,
      });
      console.log(
        `✅ Remention notification sent to flux owner ${flux.userId}`,
      );
    } catch (err) {
      console.error("❌ remention notification to owner failed:", err);
    }

    // ── Confirmation notification to re-mentioner (user B) ──
    try {
      await createNotification({
        userId: callerId,
        type: "flux_remention_sent",
        title: "You reshared a story",
        message: "You reshared a story to your flux",
        fromUserId: flux.userId.toString(),
        metadata: {
          fluxId,
          fluxMediaUrl: flux.mediaUrl,
          fluxMediaType: flux.mediaType,
          fluxOwnerId: flux.userId.toString(),
          targetUrl: callerViewUrl,
        },
        link: callerViewUrl,
      });
      console.log(`✅ Remention confirmation sent to caller ${callerId}`);
    } catch (err) {
      console.error("❌ remention confirmation notification failed:", err);
    }

    // ── Chat message from re-mentioner (user B) → original owner (user A) ──
    const reMentionChatContent = JSON.stringify({
      text: `${callerName} reshared your Flux`,
      senderLabel: "You added a mentioned Flux",
      fluxId,
      fluxMediaUrl: flux.mediaUrl,
      fluxMediaType: flux.mediaType,
      fluxOwnerId: flux.userId.toString(),
      reMentionerName: callerName,
      fluxUrl: callerViewUrl,
      type: "flux_remention",
    });

    try {
      const chatResult = await chatClient.sendSystemMessage({
        sender_id: callerId,
        receiver_id: flux.userId.toString(),
        message_type: "flux_remention",
        content: reMentionChatContent,
        metadata_json: JSON.stringify({
          fluxId,
          fluxMediaUrl: flux.mediaUrl,
          fluxMediaType: flux.mediaType,
          reMentionerName: callerName,
          reMentionerAvatar: callerAvatar,
          fluxOwnerId: flux.userId.toString(),
          type: "flux_remention",
        }),
      });
      console.log(
        `✅ Remention chat message sent: chatId=${chatResult.chat_id}, msgId=${chatResult.message_id}`,
      );
    } catch (err) {
      console.error("❌ remention chat message failed:", err);
    }

    res.status(200).json({ success: true, message: "Re-mention recorded" });
  } catch (err) {
    console.error("reMentionFlux error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// GET /flux/:fluxId/mentions
export const getFluxMentions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const mentionUserIds = (flux.mentions ?? [])
      .map((m: any) => m.userId?.toString())
      .filter(Boolean);

    const usersResp =
      mentionUserIds.length > 0
        ? await wieUserClient
            .getUsersByIds(mentionUserIds)
            .catch(() => ({ users: [] }))
        : { users: [] };

    const enriched = (flux.mentions ?? []).map((m: any) => {
      const uid = m.userId?.toString();
      const user = (usersResp.users ?? []).find(
        (u: any) => (u._id ?? u.id)?.toString() === uid,
      );
      return {
        userId: uid,
        createdAt: m.createdAt,
        name: user?.name ?? user?.username ?? null,
        username: user?.username ?? null,
        avatar: user?.profile_picture ?? user?.profilePicture ?? null,
      };
    });

    res
      .status(200)
      .json({ success: true, mentions: enriched, total: enriched.length });
  } catch (err) {
    console.error("getFluxMentions error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// GET /flux/:fluxId/permissions — returns isOwner + isMentioned for current user
export const getFluxPermissions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const isOwner = flux.userId.toString() === callerId;

    const mention = (flux.mentions ?? []).find(
      (m: any) => m.userId?.toString() === callerId,
    );
    // isMentioned = mentioned AND has not soft-removed themselves
    const isMentioned = !!mention && mention.hasRemoved !== true;
    res.status(200).json({
      success: true,
      isOwner,
      isMentioned,
      ownerId: flux.userId.toString(),
    });
  } catch (err) {
    console.error("getFluxPermissions error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /flux/:fluxId/mention/remove — soft-remove mention for current user only
export const removeMentionSelf = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId);
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    // Owner cannot remove their own flux this way
    if (flux.userId.toString() === callerId) {
      res.status(403).json({
        success: false,
        message: "Use delete flux to remove your own story",
      });
      return;
    }

    const mention = (flux.mentions ?? []).find(
      (m: any) => m.userId?.toString() === callerId,
    );

    if (!mention) {
      res.status(403).json({
        success: false,
        message: "You are not mentioned in this flux",
      });
      return;
    }

    // Soft-remove: only marks hasRemoved for THIS user — flux stays for everyone else
    await FluxModel.findByIdAndUpdate(
      fluxId,
      {
        $set: { "mentions.$[elem].hasRemoved": true },
      },
      {
        arrayFilters: [{ "elem.userId": callerId }],
      },
    );

    // Also remove their re-mention entry if they had one
    await FluxModel.findByIdAndUpdate(fluxId, {
      $pull: { reMentions: { userId: callerId } },
    });

    res.status(200).json({
      success: true,
      message: "Removed from your stories",
    });
  } catch (err) {
    console.error("removeMentionSelf error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// GET /flux/:fluxId/rementions
export const getReMentions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const reMentions: any[] = (flux as any).reMentions ?? [];
    const userIds = reMentions
      .map((r: any) => r.userId?.toString())
      .filter(Boolean);

    const usersResp =
      userIds.length > 0
        ? await wieUserClient
            .getUsersByIds(userIds)
            .catch(() => ({ users: [] }))
        : { users: [] };

    const enriched = reMentions.map((r: any) => {
      const uid = r.userId?.toString();
      const user = (usersResp.users ?? []).find(
        (u: any) => (u._id ?? u.id)?.toString() === uid,
      );
      return {
        userId: uid,
        comment: r.comment ?? "",
        createdAt: r.createdAt,
        name: user?.name ?? user?.username ?? null,
        username: user?.username ?? null,
        avatar: user?.profile_picture ?? user?.profilePicture ?? null,
      };
    });

    // Check if caller has already re-mentioned
    const hasReMentioned = reMentions.some(
      (r: any) => r.userId?.toString() === callerId,
    );

    res.status(200).json({
      success: true,
      reMentions: enriched,
      total: enriched.length,
      hasReMentioned,
    });
  } catch (err) {
    console.error("getReMentions error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── GET /api/flux/stickers/trending
export const getTrendingStickers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const apiKey = process.env.STICKER_API_KEY;
    const limit = Number(req.query.limit ?? 20);
    const r = await fetch(
      `https://api.giphy.com/v1/stickers/trending?api_key=${apiKey}&limit=${limit}&rating=g`,
    );
    const data = (await r.json()) as any;
    const stickers = (data.data ?? []).map((s: any) => ({
      id: s.id,
      type: "gif",
      url: s.images?.fixed_height?.url ?? s.images?.original?.url,
      width: Number(s.images?.fixed_height?.width ?? 200),
      height: Number(s.images?.fixed_height?.height ?? 200),
      title: s.title,
    }));
    res.json({ success: true, stickers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/flux/stickers/search?q=
export const searchStickers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const apiKey = process.env.STICKER_API_KEY;
    const q = String(req.query.q ?? "");
    const limit = Number(req.query.limit ?? 20);
    if (!q) {
      res.json({ success: true, stickers: [] });
      return;
    }
    const r = await fetch(
      `https://api.giphy.com/v1/stickers/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=${limit}&rating=g`,
    );
    const data = (await r.json()) as any;
    const stickers = (data.data ?? []).map((s: any) => ({
      id: s.id,
      type: "gif",
      url: s.images?.fixed_height?.url ?? s.images?.original?.url,
      width: Number(s.images?.fixed_height?.width ?? 200),
      height: Number(s.images?.fixed_height?.height ?? 200),
      title: s.title,
    }));
    res.json({ success: true, stickers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ── GET /api/flux/close-friends
export const getCloseFriends = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const docs = await CloseFriendModel.find({ userId: req.userId }).lean();
    const ids = docs.map((d: any) => d.closeFriendId);

    if (ids.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const result = await wieUserClient
      .getUsersByIds(ids)
      .catch(() => ({ users: [] }));
    const users: any[] = result?.users ?? [];

    const mapped = users.map((u: any) => ({
      id: u.id ?? u.userId ?? u._id,
      username: u.username,
      name: u.name ?? u.fullName ?? u.displayName ?? u.username,
      profile_picture:
        u.profilePicture ?? u.profile_picture ?? u.avatar ?? null,
    }));

    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/flux/close-friends/add
export const addCloseFriend = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      res.status(400).json({ success: false, message: "friendId is required" });
      return;
    }

    const followCheck = await isFollowing(req.userId!, friendId).catch(() => ({
      isFollowing: false,
    }));
    if (!followCheck.isFollowing) {
      res
        .status(403)
        .json({ success: false, message: "You must follow this user first" });
      return;
    }

    await CloseFriendModel.updateOne(
      { userId: req.userId, closeFriendId: friendId },
      { $setOnInsert: { userId: req.userId, closeFriendId: friendId } },
      { upsert: true },
    );

    // Bust feed cache so this owner's future close_friends fluxes update immediately
    await redisClient.del(FEED_CACHE_KEY(req.userId!)).catch(() => {});

    res.json({ success: true, message: "Added to close friends" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/flux/close-friends/remove
export const removeCloseFriend = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { friendId } = req.body;
    if (!friendId) {
      res.status(400).json({ success: false, message: "friendId is required" });
      return;
    }
    await CloseFriendModel.deleteOne({
      userId: req.userId,
      closeFriendId: friendId,
    });

    // Bust feed cache
    await redisClient.del(FEED_CACHE_KEY(req.userId!)).catch(() => {});

    res.json({ success: true, message: "Removed from close friends" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/flux/close-friends/save  ← NEW: bulk replace the entire list
export const saveCloseFriends = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { friendIds } = req.body;

    if (!Array.isArray(friendIds)) {
      res
        .status(400)
        .json({ success: false, message: "friendIds must be an array" });
      return;
    }

    // Wipe the current list and re-insert atomically
    await CloseFriendModel.deleteMany({ userId: req.userId });

    const docs = (friendIds as string[])
      .filter((id) => id && id !== req.userId) // never add self
      .map((id) => ({ userId: req.userId, closeFriendId: id }));

    if (docs.length > 0) {
      await CloseFriendModel.insertMany(docs, { ordered: false }).catch(
        () => {},
      );
    }

    // Bust the feed cache so the next load reflects the new list
    await redisClient.del(FEED_CACHE_KEY(req.userId!)).catch(() => {});

    res.json({
      success: true,
      message: "Close friends saved",
      count: docs.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/flux/close-friends/suggestions
export const getCloseFriendSuggestions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // getFollowerIds: people who follow the current user (viewer)
    // These are good suggestions because they already follow you
    const { followerIds } = await getFollowerIds(req.userId!).catch(() => ({
      followerIds: [] as string[],
    }));

    const existing = await CloseFriendModel.find({ userId: req.userId }).lean();
    const existingIds = new Set(existing.map((e: any) => e.closeFriendId));

    const suggestions = followerIds
      .filter((id: string) => !existingIds.has(id))
      .slice(0, 20);

    if (suggestions.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const result = await wieUserClient
      .getUsersByIds(suggestions)
      .catch(() => ({ users: [] }));
    const users: any[] = result?.users ?? [];

    const mapped = users.map((u: any) => ({
      id: u.id ?? u.userId ?? u._id,
      username: u.username,
      name: u.name ?? u.fullName ?? u.displayName ?? u.username,
      profile_picture:
        u.profilePicture ?? u.profile_picture ?? u.avatar ?? null,
    }));

    res.json({ success: true, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Helper used by the feed filter
export const isCloseFriend = async (
  ownerId: string,
  viewerId: string,
): Promise<boolean> => {
  const doc = await CloseFriendModel.findOne({
    userId: ownerId,
    closeFriendId: viewerId,
  }).lean();
  return !!doc;
};
//  SHARE FLUX (send as chat message)
export const shareFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;
    const { receiverIds }: { receiverIds: string[] } = (req as any).body ?? {};

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "receiverIds must be a non-empty array",
      });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }
    // Enforce allowShareAsMessage setting
    const fluxOwnerId = (flux as any).userId.toString();
    if (fluxOwnerId !== callerId) {
      const ownerSettings = await FluxSettingsModel.findOne({
        userId: fluxOwnerId,
      }).lean();
      const allowShareAsMessage =
        (ownerSettings as any)?.sharing?.shareToMessage ?? true;
      if (!allowShareAsMessage) {
        res.status(403).json({
          success: false,
          message: "Sharing as message is disabled for this flux",
        });
        return;
      }
    }

    const callerResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const callerInfo = (callerResp.users ?? [])[0];
    const callerName = callerInfo?.name ?? callerInfo?.username ?? "Someone";
    const callerAvatar =
      callerInfo?.profile_picture ?? callerInfo?.profilePicture ?? "";
    const fluxUrl = `/post/flux-view?fluxId=${fluxId}&userId=${callerId}`;

    const results: {
      receiverId: string;
      chatId?: string;
      messageId?: string;
      error?: string;
    }[] = [];

    for (const receiverId of receiverIds) {
      const chatContent = JSON.stringify({
        text: `${callerName} shared a Flux`,
        senderLabel: "You shared a Flux",
        fluxId,
        fluxMediaUrl: (flux as any).mediaUrl,
        fluxMediaType: (flux as any).mediaType,
        fluxOwnerId: callerId,
        sharerName: callerName,
        fluxUrl,
        type: "flux_share",
      });

      try {
        const chatResult = await chatClient.sendSystemMessage({
          sender_id: callerId,
          receiver_id: receiverId,
          message_type: "flux_share",
          content: chatContent,
          metadata_json: JSON.stringify({
            fluxId,
            fluxMediaUrl: (flux as any).mediaUrl,
            fluxMediaType: (flux as any).mediaType,
            sharerName: callerName,
            sharerAvatar: callerAvatar,
            fluxOwnerId: callerId,
            type: "flux_share",
          }),
        });
        results.push({
          receiverId,
          chatId: chatResult.chat_id,
          messageId: chatResult.message_id,
        });
      } catch (err) {
        console.error(`❌ shareFlux chat failed for ${receiverId}:`, err);
        results.push({ receiverId, error: "Failed to send" });
      }
    }

    res.status(200).json({ success: true, message: "Flux shared", results });
  } catch (err) {
    console.error("shareFlux error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const likeFluxComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId, commentId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId);
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const comment = (flux.comments as any[]).find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const alreadyLiked = (comment.likes ?? []).includes(callerId);
    if (alreadyLiked) {
      await FluxModel.findByIdAndUpdate(
        fluxId,
        { $pull: { "comments.$[c].likes": callerId } },
        { arrayFilters: [{ "c._id": comment._id }] },
      );
    } else {
      await FluxModel.findByIdAndUpdate(
        fluxId,
        { $addToSet: { "comments.$[c].likes": callerId } },
        { arrayFilters: [{ "c._id": comment._id }] },
      );
    }

    res.status(200).json({ success: true, liked: !alreadyLiked });
  } catch (err) {
    console.error("likeFluxComment error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
//  COMMENTS
export const addFluxComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;
    const { text }: { text: string } = (req as any).body ?? {};

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!text?.trim()) {
      res.status(400).json({ success: false, message: "text is required" });
      return;
    }

    const flux = await FluxModel.findById(fluxId);
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }
    if ((flux as any).commentsDisabled) {
      res.status(403).json({
        success: false,
        message: "Comments are disabled for this flux",
      });
      return;
    }
    // Enforce allowReplies for non-owners
    const fluxOwnerId2 = flux.userId.toString();
    if (fluxOwnerId2 !== callerId) {
      const ownerSettings2 = await FluxSettingsModel.findOne({
        userId: fluxOwnerId2,
      }).lean();
      const s2 = ownerSettings2 as any;
      const replyMode: string =
        s2?.interactions?.replies ?? s2?.allowReplies ?? "everyone";

      if (replyMode === "off") {
        res.status(403).json({
          success: false,
          message: "Replies are disabled for this flux",
        });
        return;
      }

      if (replyMode === "mutual") {
        const [vfo, ofv] = await Promise.all([
          isFollowing(callerId, fluxOwnerId2).catch(() => ({
            isFollowing: false,
          })),
          isFollowing(fluxOwnerId2, callerId).catch(() => ({
            isFollowing: false,
          })),
        ]);
        if (!vfo.isFollowing || !ofv.isFollowing) {
          res.status(403).json({
            success: false,
            message: "Only mutual followers can comment on this flux",
          });
          return;
        }
      }
    }
    const comment = {
      userId: callerId,
      text: text.trim(),
      likes: [],
      createdAt: new Date(),
    };
    await FluxModel.findByIdAndUpdate(fluxId, { $push: { comments: comment } });

    const fluxOwnerId = flux.userId.toString();
    if (fluxOwnerId !== callerId) {
      const callerInfo2 = (
        await wieUserClient
          .getUsersByIds([callerId])
          .catch(() => ({ users: [] }))
      ).users?.[0];
      const commenterName =
        callerInfo2?.username ?? callerInfo2?.name ?? "Someone";

      await createNotification({
        userId: fluxOwnerId,
        type: "flux_comment",
        title: "New comment on your Flux",
        message: `${commenterName} commented: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? "…" : ""}"`,
        fromUserId: callerId,
        metadata: {
          fluxId,
          commentText: text.trim(),
          commenterName,
          commenterAvatar: callerInfo2?.profile_picture ?? null,
        },
      }).catch(() => {});
      emitMentionEvent({
        mentionedUserId: fluxOwnerId,
        mentionerUserId: callerId,
        fluxId,
        fluxMediaUrl: (flux as any).mediaUrl ?? null,
      }).catch((err) => console.error("flux comment emit failed:", err));
    }
    // Fetch caller info for response
    const callerResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const callerInfo = (callerResp.users ?? [])[0];

    res.status(201).json({
      success: true,
      comment: {
        ...comment,
        name: callerInfo?.name ?? callerInfo?.username ?? "Someone",
        avatar:
          callerInfo?.profile_picture ?? callerInfo?.profilePicture ?? null,
      },
    });
  } catch (err) {
    console.error("addFluxComment error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getFluxComments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const comments: any[] = (flux as any).comments ?? [];
    const userIds = [
      ...new Set(
        comments.map((c: any) => c.userId?.toString()).filter(Boolean),
      ),
    ];

    const usersResp =
      userIds.length > 0
        ? await wieUserClient
            .getUsersByIds(userIds)
            .catch(() => ({ users: [] }))
        : { users: [] };

    const userMap = new Map(
      (usersResp.users ?? []).map((u: any) => [
        (u._id ?? u.id).toString(),
        {
          name: u.name ?? u.username,
          avatar: u.profile_picture ?? u.profilePicture ?? null,
          username: u.username,
        },
      ]),
    );

    const enriched = comments.map((c: any) => ({
      _id: c._id?.toString(),
      userId: c.userId?.toString(),
      text: c.text,
      likes: c.likes ?? [],
      createdAt: c.createdAt,
      ...(userMap.get(c.userId?.toString()) ?? {}),
    }));

    res
      .status(200)
      .json({ success: true, comments: enriched, total: enriched.length });
  } catch (err) {
    console.error("getFluxComments error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /flux/:fluxId/reply — send flux reply as a chat message
export const replyFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;
    const { text }: { text: string } = (req as any).body ?? {};

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!text?.trim()) {
      res.status(400).json({ success: false, message: "text is required" });
      return;
    }

    const flux = await FluxModel.findOne({
      _id: fluxId,
      isDeleted: { $ne: true },
    }).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const fluxOwnerId = flux.userId.toString();
    if (fluxOwnerId === callerId) {
      res
        .status(400)
        .json({ success: false, message: "Cannot reply to your own flux" });
      return;
    }
    // Enforce allowReplies setting
    const ownerSettings = await FluxSettingsModel.findOne({
      userId: fluxOwnerId,
    }).lean();
    const s = ownerSettings as any;
    const allowReplies: string =
      s?.interactions?.replies ?? s?.allowReplies ?? "everyone";
    if (allowReplies === "off") {
      res.status(403).json({
        success: false,
        message: "Replies are disabled for this flux",
      });
      return;
    }
    if (allowReplies === "mutual") {
      const [viewerFollowsOwner, ownerFollowsViewer] = await Promise.all([
        isFollowing(callerId, fluxOwnerId).catch(() => ({
          isFollowing: false,
        })),
        isFollowing(fluxOwnerId, callerId).catch(() => ({
          isFollowing: false,
        })),
      ]);
      if (!viewerFollowsOwner.isFollowing || !ownerFollowsViewer.isFollowing) {
        res.status(403).json({
          success: false,
          message: "Only mutual followers can reply to this flux",
        });
        return;
      }
    }
    // Enforce allowMessageReplies setting
    const allowMessageReplies: boolean =
      s?.interactions?.messageReplies ?? true;
    if (!allowMessageReplies) {
      res.status(403).json({
        success: false,
        message: "Message replies are disabled for this flux",
      });
      return;
    }
    // Build flux reply message payload for chat service
    const messageContent = JSON.stringify({
      type: "flux_reply",
      text: text.trim(),
      fluxId: flux._id.toString(),
      fluxOwnerId,
      fluxMediaUrl: (flux as any).mediaUrl ?? null,
      fluxMediaType: (flux as any).mediaType ?? "image",
      fluxTextBg: (flux as any).textBg ?? null,
    });
    // Send via chat gRPC client
    const chatRes = await chatClient.sendSystemMessage({
      sender_id: callerId,
      receiver_id: fluxOwnerId,
      content: messageContent,
      message_type: "flux_reply",
      metadata_json: JSON.stringify({
        fluxId: flux._id.toString(),
        fluxMediaUrl: (flux as any).mediaUrl ?? null,
        fluxMediaType: (flux as any).mediaType ?? "image",
        fluxOwnerId,
        replyText: text.trim(),
        type: "flux_reply",
      }),
    });
    res.status(200).json({ success: true, message: chatRes });
  } catch (error: any) {
    console.error("replyFlux error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  FLUX LIKES (react to the flux itself)
export const toggleFluxLike = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;
    const { emoji = "❤️" }: { emoji?: string } = (req as any).body ?? {};

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId);
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    // Flux owner cannot like their own flux
    if (flux.userId.toString() === callerId) {
      res
        .status(403)
        .json({ success: false, message: "Cannot like your own flux" });
      return;
    }
    // Enforce allowReactions setting
    const ownerSettings = await FluxSettingsModel.findOne({
      userId: flux.userId.toString(),
    }).lean();
    const allowReactions =
      (ownerSettings as any)?.interactions?.reactions ?? true;
    if (!allowReactions) {
      res.status(403).json({
        success: false,
        message: "Reactions are disabled for this flux",
      });
      return;
    }
    const existingLike = (flux.likes as any[]).find(
      (l: any) => l.userId?.toString() === callerId,
    );
    if (existingLike) {
      // Unlike
      await FluxModel.findByIdAndUpdate(fluxId, {
        $pull: { likes: { userId: callerId } },
      });
      res.status(200).json({
        success: true,
        liked: false,
        likeCount: (flux.likes?.length ?? 1) - 1,
      });
    } else {
      // Like
      await FluxModel.findByIdAndUpdate(fluxId, {
        $push: { likes: { userId: callerId, emoji, createdAt: new Date() } },
      });
      const likerInfoRes = await wieUserClient
        .getUsersByIds([callerId])
        .catch(() => ({ users: [] }));
      const likerInfo = (likerInfoRes.users ?? [])[0];
      const likerName = likerInfo?.username ?? likerInfo?.name ?? "Someone";
      await createNotification({
        userId: flux.userId.toString(),
        type: "flux_like", // add to enum — see step 5
        title: `${likerName} liked your Flux`,
        message: `${likerName} liked your Flux ❤️`,
        fromUserId: callerId,
        metadata: {
          fluxId,
          likerName,
          likerAvatar: likerInfo?.profile_picture ?? null,
        },
      }).catch(() => {});
      emitMentionEvent({
        mentionedUserId: flux.userId.toString(),
        mentionerUserId: callerId,
        fluxId,
        fluxMediaUrl: (flux as any).mediaUrl ?? null,
      }).catch((err) => console.error("flux like emit failed:", err));
      res.status(200).json({
        success: true,
        liked: true,
        likeCount: (flux.likes?.length ?? 0) + 1,
      });
    }
  } catch (err) {
    console.error("toggleFluxLike error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getFluxLikes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId?.toString();
    const { fluxId } = req.params;

    if (!callerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const flux = await FluxModel.findById(fluxId).lean();
    if (!flux) {
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    const likes: any[] = (flux as any).likes ?? [];
    const isOwner = (flux as any).userId?.toString() === callerId;

    if (!isOwner) {
      // Non-owners only get the count + whether they liked it
      const hasLiked = likes.some(
        (l: any) => l.userId?.toString() === callerId,
      );
      res.status(200).json({ success: true, total: likes.length, hasLiked });
      return;
    }

    // Owner gets full list enriched with user info
    const userIds = likes.map((l: any) => l.userId?.toString()).filter(Boolean);
    const usersResp =
      userIds.length > 0
        ? await wieUserClient
            .getUsersByIds(userIds)
            .catch(() => ({ users: [] }))
        : { users: [] };

    const userMap = new Map(
      (usersResp.users ?? []).map((u: any) => [
        (u._id ?? u.id).toString(),
        {
          name: u.name ?? u.username,
          avatar: u.profile_picture ?? u.profilePicture ?? null,
          username: u.username,
        },
      ]),
    );

    const enriched = likes.map((l: any) => ({
      userId: l.userId?.toString(),
      emoji: l.emoji ?? "❤️",
      createdAt: l.createdAt,
      ...(userMap.get(l.userId?.toString()) ?? {}),
    }));

    res
      .status(200)
      .json({ success: true, likes: enriched, total: enriched.length });
  } catch (err) {
    console.error("getFluxLikes error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ── GET /api/flux/settings
export const getFluxSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const existingSettings = await FluxSettingsModel.findOne({ userId }).lean();
    const s: any =
      existingSettings ??
      (await FluxSettingsModel.create({ userId })).toObject();
    res.json({
      success: true,
      data: {
        // Visibility
        visibility: s.visibility ?? "followers",
        hideFrom: s.hideFrom ?? [],
        // Interactions
        allowReplies: s.interactions?.replies ?? s.allowReplies ?? "everyone",
        allowReactions: s.interactions?.reactions ?? s.allowReactions ?? true,
        allowMessageReplies:
          s.interactions?.messageReplies ?? s.allowMessageReplies ?? true,
        // Sharing
        allowShareToStory: s.sharing?.reshare ?? s.allowShareToStory ?? true,
        allowShareAsMessage:
          s.sharing?.shareToMessage ?? s.allowShareAsMessage ?? true,
        allowExternalShare:
          s.sharing?.externalShare ?? s.allowExternalShare ?? false,
        // Save
        saveToDevice: s.save?.saveToDevice ?? s.saveToDevice ?? false,
        saveToArchive: s.save?.archive ?? s.saveToArchive ?? true,
        autosaveDrafts: s.save?.drafts ?? s.autosaveDrafts ?? true,
        // Advanced
        duration: s.advanced?.duration ?? s.duration ?? 24,
        showAnalytics: s.advanced?.analytics ?? s.showAnalytics ?? true,
        restrictScreenshots:
          s.restrictScreenshots ?? s.advanced?.screenshotAlert ?? false,
        // legacy audience field kept for compatibility
        audience: s.visibility ?? s.audience ?? "followers",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/flux/settings
export const updateFluxSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const b = req.body;
    const update: Record<string, any> = {};
    const vis = b.visibility ?? b.audience;
    if (vis !== undefined) {
      update.visibility = vis;
    }
    // Accept both flat keys (allowReplies) and nested (interactions.replies)
    const replies =
      b.allowReplies ?? b["interactions.replies"] ?? b.interactions?.replies;
    const reactions =
      b.allowReactions ??
      b["interactions.reactions"] ??
      b.interactions?.reactions;
    const messageReplies =
      b.allowMessageReplies ??
      b["interactions.messageReplies"] ??
      b.interactions?.messageReplies;
    if (replies !== undefined) {
      // Write to both the nested path AND the top-level field so both stay in sync
      update["interactions.replies"] = replies;
      update["allowReplies"] = replies;
    }
    if (reactions !== undefined) update["interactions.reactions"] = reactions;
    if (messageReplies !== undefined)
      update["interactions.messageReplies"] = messageReplies;
    const reshare =
      b.allowShareToStory ?? b["sharing.reshare"] ?? b.sharing?.reshare;
    const shareToMsg =
      b.allowShareAsMessage ??
      b["sharing.shareToMessage"] ??
      b.sharing?.shareToMessage;
    const externalShare =
      b.allowExternalShare ??
      b["sharing.externalShare"] ??
      b.sharing?.externalShare;
    if (reshare !== undefined) update["sharing.reshare"] = reshare;
    if (shareToMsg !== undefined) update["sharing.shareToMessage"] = shareToMsg;
    if (externalShare !== undefined)
      update["sharing.externalShare"] = externalShare;
    const saveToDevice =
      b.saveToDevice ?? b["save.saveToDevice"] ?? b.save?.saveToDevice;
    const archive = b.saveToArchive ?? b["save.archive"] ?? b.save?.archive;
    const drafts = b.autosaveDrafts ?? b["save.drafts"] ?? b.save?.drafts;

    if (saveToDevice !== undefined) update["save.saveToDevice"] = saveToDevice;
    if (archive !== undefined) update["save.archive"] = archive;
    if (drafts !== undefined) update["save.drafts"] = drafts;
    const duration =
      b.duration ?? b["advanced.duration"] ?? b.advanced?.duration;
    const analytics =
      b.showAnalytics ?? b["advanced.analytics"] ?? b.advanced?.analytics;
    const screenshotAlert =
      b.restrictScreenshots ??
      b["advanced.screenshotAlert"] ??
      b.advanced?.screenshotAlert;

    if (duration !== undefined) update["advanced.duration"] = duration;
    if (analytics !== undefined) update["advanced.analytics"] = analytics;
    if (screenshotAlert !== undefined) {
      const boolVal = screenshotAlert === true || screenshotAlert === "true";
      update["advanced.screenshotAlert"] = boolVal;
      update["restrictScreenshots"] = boolVal;
    }
    if (Object.keys(update).length === 0) {
      res
        .status(400)
        .json({ success: false, message: "No valid fields to update" });
      return;
    }

    const settings = await FluxSettingsModel.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true, upsert: true },
    ).lean();

    const s = settings as any;
    res.status(200).json({
      success: true,
      data: {
        visibility: s.visibility ?? "public",
        hideFrom: s.hideFrom ?? [],
        allowReplies: s.interactions?.replies ?? s.allowReplies ?? "everyone",
        allowReactions: s.interactions?.reactions ?? true,
        allowMessageReplies: s.interactions?.messageReplies ?? true,
        allowShareToStory: s.sharing?.reshare ?? true,
        allowShareAsMessage: s.sharing?.shareToMessage ?? true,
        allowExternalShare: s.sharing?.externalShare ?? false,
        saveToDevice: s.save?.saveToDevice ?? false,
        saveToArchive: s.save?.archive ?? true,
        autosaveDrafts: s.save?.drafts ?? true,
        duration: s.advanced?.duration ?? 24,
        showAnalytics: s.advanced?.analytics ?? true,
        restrictScreenshots:
          s.restrictScreenshots ?? s.advanced?.screenshotAlert ?? false,
        audience: s.visibility ?? "public",
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/flux/settings/hide-from
export const getGlobalHideFromList = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const settings = await FluxSettingsModel.findOne({ userId }).lean();
    const hideFrom: string[] = (settings as any)?.hideFrom ?? [];

    if (hideFrom.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const resp = await wieUserClient
      .getUsersByIds(hideFrom)
      .catch(() => ({ users: [] }));
    const users = (resp.users ?? []).map((u: any) => ({
      id: (u._id ?? u.id).toString(),
      username: u.username ?? "",
      name: u.name ?? u.username ?? "",
      profile_picture: u.profile_picture ?? u.profilePicture ?? null,
      is_verified: u.is_verified ?? false,
    }));

    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/flux/settings/hide-from — bulk replace
export const updateGlobalHideFrom = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const { userIds } = req.body;
    if (!Array.isArray(userIds)) {
      res
        .status(400)
        .json({ success: false, message: "userIds must be an array" });
      return;
    }
    await FluxSettingsModel.findOneAndUpdate(
      { userId },
      { $set: { hideFrom: userIds } },
      { upsert: true },
    );
    res.json({ success: true, message: "Hide list updated" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/flux/settings/hide-from/add
export const addToGlobalHideFrom = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const { hideUserId } = req.body;
    if (!hideUserId) {
      res
        .status(400)
        .json({ success: false, message: "hideUserId is required" });
      return;
    }
    // No follow check — any user can be hidden
    await FluxSettingsModel.findOneAndUpdate(
      { userId },
      { $addToSet: { hideFrom: hideUserId } },
      { upsert: true },
    );
    res.json({ success: true, message: "User hidden from your flux" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/flux/settings/hide-from/remove
export const removeFromGlobalHideFrom = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.userId!.toString();
    const { unhideUserId } = req.body;
    if (!unhideUserId) {
      res
        .status(400)
        .json({ success: false, message: "unhideUserId is required" });
      return;
    }
    await FluxSettingsModel.findOneAndUpdate(
      { userId },
      { $pull: { hideFrom: unhideUserId } },
      { upsert: true },
    );
    res.json({ success: true, message: "User unhidden from your flux" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const reportScreenshot = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { fluxId } = req.params;
  const viewerId   = req.userId?.toString() ?? "";
  const platform   = (req.body?.platform as string) ?? "web";
  const imageBase64 = req.body?.imageBase64 as string | undefined;

  process.stdout.write(
    `\n>>> [reportScreenshot] HIT fluxId=${fluxId} viewerId=${viewerId} platform=${platform}\n`,
  );

  try {
    // ── 1. Auth guard ─────────────────────────────────────────────────────
    if (!viewerId) {
      process.stdout.write(`>>> [reportScreenshot] REJECTED — no viewerId\n`);
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // ── 2. Fetch flux ─────────────────────────────────────────────────────
    const flux = await FluxModel.findOne({ _id: fluxId, isDeleted: false })
      .select("userId mediaUrl mediaType")
      .lean();

    if (!flux) {
      process.stdout.write(`>>> [reportScreenshot] REJECTED — flux not found\n`);
      res.status(404).json({ success: false, message: "Flux not found" });
      return;
    }

    // ── 3. Resolve ownerId safely (handles ObjectId or populated ref) ──────
    const rawOwner = (flux as any).userId;
    const ownerId  =
      rawOwner?._id?.toString() ??
      rawOwner?.toString()       ??
      "";

    process.stdout.write(
      `>>> [reportScreenshot] ownerId=${ownerId} viewerId=${viewerId} same=${ownerId === viewerId}\n`,
    );

    // ── 4. Owner self-screenshot — skip ───────────────────────────────────
    if (!ownerId || ownerId === viewerId) {
      process.stdout.write(`>>> [reportScreenshot] OWNER SELF — skipping\n`);
      res.json({ success: true, alerted: false, reason: "owner_self" });
      return;
    }

    // ── 5. Optional ML classification ─────────────────────────────────────
    let confidence = 1.0;
    if (imageBase64) {
      try {
        const { classifyImage } = await import("../utils/screenshotServiceClient");
        const result = await classifyImage(Buffer.from(imageBase64, "base64"));
        confidence = result.confidence;
        process.stdout.write(
          `>>> [reportScreenshot] ML label=${result.label} confidence=${confidence} is_screenshot=${result.is_screenshot}\n`,
        );
        if (!result.is_screenshot) {
          res.json({ success: true, alerted: false, reason: "ml_rejected" });
          return;
        }
      } catch (mlErr) {
        // ML down — trust client event, continue
        process.stdout.write(
          `>>> [reportScreenshot] ML unavailable — continuing: ${mlErr}\n`,
        );
      }
    }

    // ── 6. Atomic Redis gate (SET NX EX) ──────────────────────────────────
    // This is the SINGLE source of truth for deduplication.
    // SET NX = only set if key does not exist → returns "OK" on first call,
    // null on every subsequent call. This eliminates the race condition entirely.
    const dedupeKey  = `flux:${fluxId}:ss:user:${viewerId}`;
    const TTL_SECONDS = 48 * 60 * 60; // 48 hours

    let redisGateOpened = false;
    try {
      // Try node-redis v4 style first: set(key, value, { NX, EX })
      const setResult = await (redisClient as any).set(
        dedupeKey,
        "1",
        { NX: true, EX: TTL_SECONDS },
      );
      // node-redis v4 returns "OK" on success, null if key existed
      redisGateOpened = setResult === "OK";
      process.stdout.write(
        `>>> [reportScreenshot] Redis SET NX (v4 style) result="${setResult}" gateOpened=${redisGateOpened}\n`,
      );
    } catch {
      // Fallback: ioredis style — set(key, value, "EX", seconds, "NX")
      try {
        const setResult = await (redisClient as any).set(
          dedupeKey,
          "1",
          "EX",
          TTL_SECONDS,
          "NX",
        );
        // ioredis returns "OK" on success, null if key existed
        redisGateOpened = setResult === "OK";
        process.stdout.write(
          `>>> [reportScreenshot] Redis SET NX (ioredis style) result="${setResult}" gateOpened=${redisGateOpened}\n`,
        );
      } catch (redisErr) {
        // Redis is completely unavailable — fall back to DB-only deduplication
        process.stdout.write(
          `>>> [reportScreenshot] Redis fully unavailable: ${redisErr} — using DB dedupe only\n`,
        );
        redisGateOpened = true; // Let DB unique index handle it
      }
    }

    // If Redis gate was not opened, this viewer already screenshotted this flux
    if (!redisGateOpened) {
      process.stdout.write(
        `>>> [reportScreenshot] DEDUPE HIT — viewer already counted, skipping\n`,
      );
      const existingCount = await FluxScreenshotEventModel.countDocuments({ fluxId }).catch(() => 0);
      res.json({ success: true, alerted: false, reason: "already_counted", count: existingCount });
      return;
    }

    // ── 7. Persist to DB (unique index is a safety net, not the gate) ──────
    const dbResult = await FluxScreenshotEventModel.updateOne(
      { fluxId, userId: viewerId },
      { $setOnInsert: { fluxId, userId: viewerId, timestamp: new Date() } },
      { upsert: true },
    ).catch((e: any) => {
      process.stdout.write(`>>> [reportScreenshot] DB upsert error: ${e}\n`);
      // If DB write fails due to duplicate key (race on Redis fallback path),
      // it means another request already inserted — treat as already counted
      return null;
    });

    const isNewRecord = dbResult ? (dbResult as any).upsertedCount > 0 : false;
    process.stdout.write(
      `>>> [reportScreenshot] DB upsertedCount=${(dbResult as any)?.upsertedCount ?? "n/a"} isNewRecord=${isNewRecord}\n`,
    );

    // If DB says record already existed (race condition on Redis fallback),
    // do not send a duplicate notification
    if (!isNewRecord && dbResult !== null) {
      process.stdout.write(
        `>>> [reportScreenshot] DB says record pre-existed (Redis fallback race) — skipping notification\n`,
      );
      const existingCount = await FluxScreenshotEventModel.countDocuments({ fluxId }).catch(() => 0);
      res.json({ success: true, alerted: false, reason: "already_counted", count: existingCount });
      return;
    }

    // ── 8. Count total unique screenshotters ──────────────────────────────
    const totalCount = await FluxScreenshotEventModel.countDocuments({ fluxId }).catch(() => 1);
    process.stdout.write(
      `>>> [reportScreenshot] totalCount=${totalCount}\n`,
    );

    // ── 9. Fire-and-forget ML report ──────────────────────────────────────
    import("../utils/screenshotServiceClient")
      .then(({ reportScreenshotEvent }) =>
        reportScreenshotEvent({ fluxId, viewerId, ownerId, platform, confidence }),
      )
      .catch((e: any) =>
        process.stdout.write(`>>> [reportScreenshot] ML report-event failed: ${e}\n`),
      );

    // ── 10. Build and send notification ───────────────────────────────────
    // At this point: Redis gate opened + DB record is new → exactly one
    // notification per unique viewer per flux per 48 h, guaranteed.
    const viewerResp = await wieUserClient
      .getUsersByIds([viewerId])
      .catch(() => ({ users: [] as any[] }));
    const viewerInfo   = (viewerResp.users ?? [])[0];
    const viewerName   = viewerInfo?.username ?? viewerInfo?.name ?? "Someone";
    const viewerAvatar = viewerInfo?.profile_picture ?? viewerInfo?.profilePicture ?? null;

    process.stdout.write(
      `>>> [reportScreenshot] viewerName="${viewerName}"\n`,
    );

    // Build preview names from the 3 most recent unique screenshotters
    const recentEvents = await FluxScreenshotEventModel.find({ fluxId })
      .sort({ timestamp: -1 })
      .limit(3)
      .lean()
      .catch(() => [] as any[]);

    const previewIds = recentEvents.map((e: any) => e.userId?.toString()).filter(Boolean);

    let previewNames = viewerName;
    if (previewIds.length > 1) {
      const resp = await wieUserClient
        .getUsersByIds(previewIds)
        .catch(() => ({ users: [] as any[] }));
      previewNames = (resp.users ?? [])
        .map((u: any) => u.username ?? u.name ?? "someone")
        .join(", ");
    }

    const priority = totalCount >= 100 ? "🚨" : totalCount >= 20 ? "🔔" : "📸";

    const title =
      totalCount === 1
        ? `📸 ${viewerName} captured your flux`
        : `${priority} ${totalCount} people captured your flux`;

    const message =
      totalCount === 1
        ? `${viewerName} took a screenshot of your flux`
        : `Including ${previewNames}`;

    process.stdout.write(
      `>>> [reportScreenshot] SENDING notification → owner=${ownerId} title="${title}"\n`,
    );

    const notifResult = await createNotification({
      userId:     ownerId,
      type:       "flux_screenshot",
      title,
      message,
      fromUserId: viewerId,
      metadata: {
        fluxId,
        fluxMediaUrl:    (flux as any).mediaUrl  ?? null,
        fluxMediaType:   (flux as any).mediaType ?? null,
        screenshotCount: totalCount,
        previewUserIds:  previewIds,
        viewerName,
        viewerAvatar,
        platform,
        confidence,
      },
    }).catch((err: any) => {
      process.stdout.write(
        `>>> [reportScreenshot] createNotification ERROR: ${err}\n`,
      );
      return { success: false, error: String(err) };
    });

    process.stdout.write(
      `>>> [reportScreenshot] createNotification result: ${JSON.stringify(notifResult)}\n`,
    );

    // Real-time socket push
    emitMentionEvent({
      mentionedUserId: ownerId,
      mentionerUserId: viewerId,
      fluxId,
      fluxMediaUrl: (flux as any).mediaUrl ?? undefined,
    }).catch((e: any) =>
      process.stdout.write(`>>> [reportScreenshot] emitMentionEvent failed: ${e}\n`),
    );

    process.stdout.write(
      `>>> [reportScreenshot] ✅ DONE — owner=${ownerId} notified totalCount=${totalCount}\n`,
    );

    res.status(200).json({
      success:   true,
      alerted:   true,
      count:     totalCount,
      confidence,
    });
  } catch (err: any) {
    process.stdout.write(
      `>>> [reportScreenshot] ❌ UNHANDLED ERROR: ${err?.stack ?? err}\n`,
    );
    res.status(500).json({ success: false, message: err?.message ?? "Internal error" });
  }
};
// ── GET /api/flux/:fluxId/analytics
export const getFluxAnalytics = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId } = req.params;
    const callerId = req.userId!.toString();

    const flux = await FluxModel.findOne({
      _id: fluxId,
      userId: callerId,
      isDeleted: false,
    }).lean();

    if (!flux) {
      res
        .status(404)
        .json({ success: false, message: "Flux not found or not yours" });
      return;
    }

    const settings = await FluxSettingsModel.findOne({
      userId: callerId,
    }).lean();
    const analyticsEnabled = (settings as any)?.advanced?.analytics ?? true;

    if (!analyticsEnabled) {
      res.json({ success: true, analyticsEnabled: false });
      return;
    }

    const allViewers: string[] = (flux as any).viewers ?? [];
    const viewCount = allViewers.filter(
      (id) => id.toString() !== callerId,
    ).length;

    const reactions: any[] = (flux as any).reactions ?? [];
    const reactionMap: Record<string, number> = {};
    for (const r of reactions) {
      const emoji = r.emoji ?? "❤️";
      reactionMap[emoji] = (reactionMap[emoji] ?? 0) + 1;
    }

    const likes: any[] = (flux as any).likes ?? [];
    const comments: any[] = (flux as any).comments ?? [];
    const mentions: any[] = (flux as any).mentions ?? [];

    // Screenshot stats from DB only (no Redis sets)
    const screenshotCount = await FluxScreenshotEventModel.countDocuments({
      fluxId,
    });
    const recentEvents = await FluxScreenshotEventModel.find({ fluxId })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    const screenshotUserIds = recentEvents.map((e: any) => e.userId.toString());

    let recentScreenshotters: any[] = [];
    if (screenshotUserIds.length > 0) {
      const resp = await wieUserClient
        .getUsersByIds(screenshotUserIds)
        .catch(() => ({ users: [] }));
      recentScreenshotters = (resp.users ?? []).map((u: any) => ({
        id: (u._id ?? u.id).toString(),
        username: u.username ?? "",
        name: u.name ?? u.username ?? "",
        profile_picture: u.profile_picture ?? u.profilePicture ?? null,
      }));
    }

    res.json({
      success: true,
      analyticsEnabled: true,
      viewCount,
      likeCount: likes.length,
      reactionBreakdown: reactionMap,
      commentCount: comments.length,
      mentionCount: mentions.length,
      screenshots: {
        count: screenshotCount,
        uniqueUsers: screenshotUserIds.length,
        recentUsers: recentScreenshotters,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
