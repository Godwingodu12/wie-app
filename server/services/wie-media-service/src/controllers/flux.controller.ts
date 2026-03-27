import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth";
import FluxModel from "../models/flux.model";
import * as fluxService from "../services/flux.service";
import { isFollowing } from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import redisClient from "../config/redis";
import type { FluxVisibility } from "../models/flux.model";
import {
  createNotification,
  emitMentionEvent,
} from "../utils/notificationHelper";
import * as chatClient from "../grpc/clients/chatClient";

export const createFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();

    // Create the flux first (existing service call)
    const flux = await fluxService.createFlux(
      callerId,
      req.file ?? null,
      req.body,
    );

    // ── Process pre-creation mentions (if any were sent with the flux) ──
    let mentionedUserIds: string[] = [];
    try {
      const raw = req.body.mentions;
      if (raw) {
        mentionedUserIds = typeof raw === "string" ? JSON.parse(raw) : raw;
      }
    } catch {}

    if (mentionedUserIds.length > 0) {
      // Run mention processing async — don't block the response
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
    const feed = await fluxService.getFluxFeed(req.userId!);
    res.json({ success: true, data: feed });
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

    res.status(200).json({ success: true, flux });
  } catch (err) {
    console.error("getFluxById error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
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
    await fluxService.reactToFlux(fluxId, req.userId!, emoji);
    res.json({ success: true });
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
    const fluxes = await fluxService.getArchivedFluxes(req.userId!);
    res.json({ success: true, data: fluxes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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
    // Mark any newly-expired fluxes before fetching
    await FluxModel.updateMany(
      {
        userId: req.userId,
        expiresAt: { $lt: new Date() },
        isDeleted: false,
        status: "active",
      },
      { $set: { status: "expired", isArchived: true } },
    ).catch(() => {});

    const fluxes = await FluxModel.find({
      userId: req.userId,
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

const CloseFriendSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    closeFriendId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
CloseFriendSchema.index({ userId: 1, closeFriendId: 1 }, { unique: true });

const CloseFriendModel =
  mongoose.models.CloseFriend ??
  mongoose.model("CloseFriend", CloseFriendSchema);

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

    // Batch fetch all users in one call
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
    // Must be following the person
    const follows = await isFollowing(req.userId!, friendId).catch(() => false);
    if (!follows) {
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
    await CloseFriendModel.deleteOne({
      userId: req.userId,
      closeFriendId: friendId,
    });
    res.json({ success: true, message: "Removed from close friends" });
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
    const { getFollowerIds } = await import("../grpc/clients/followClient");

    // getFollowerIds actually returns the IDs of people THIS user follows
    const { followerIds: followingIds } = await getFollowerIds(
      req.userId!,
    ).catch(() => ({ followerIds: [] as string[] }));

    // Exclude already-close-friends
    const existing = await CloseFriendModel.find({ userId: req.userId }).lean();
    const existingIds = new Set(existing.map((e: any) => e.closeFriendId));

    const suggestions = followingIds
      .filter((id: string) => !existingIds.has(id))
      .slice(0, 20);

    if (suggestions.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    // Batch fetch all in one call
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

// Helper used in feed — check if viewer is a close friend of owner
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

    const comment = {
      userId: callerId,
      text: text.trim(),
      likes: [],
      createdAt: new Date(),
    };
    await FluxModel.findByIdAndUpdate(fluxId, { $push: { comments: comment } });

    const fluxOwnerId = flux.userId.toString();
    if (fluxOwnerId !== callerId) {
      const callerInfo2 = (await wieUserClient.getUsersByIds([callerId]).catch(() => ({ users: [] }))).users?.[0];
      const commenterName = callerInfo2?.username ?? callerInfo2?.name ?? "Someone";

      await createNotification({
        userId:     fluxOwnerId,
        type:       "flux_comment",
        title:      "New comment on your Flux",
        message:    `${commenterName} commented: "${text.trim().slice(0, 60)}${text.trim().length > 60 ? "…" : ""}"`,
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
        fluxMediaUrl:    (flux as any).mediaUrl ?? null,
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
      res.status(400).json({ success: false, message: "Cannot reply to your own flux" });
      return;
    }

    // Build flux reply message payload for chat service
    const messageContent = JSON.stringify({
      type:          "flux_reply",
      text:          text.trim(),
      fluxId:        flux._id.toString(),
      fluxOwnerId,
      fluxMediaUrl:  (flux as any).mediaUrl  ?? null,
      fluxMediaType: (flux as any).mediaType ?? "image",
      fluxTextBg:    (flux as any).textBg    ?? null,
    });

    // Send via chat gRPC client
    const chatRes = await chatClient.sendSystemMessage({
      sender_id:     callerId,
      receiver_id:   fluxOwnerId,
      content:       messageContent,
      message_type:  "flux_reply",
      metadata_json: JSON.stringify({
        fluxId:        flux._id.toString(),
        fluxMediaUrl:  (flux as any).mediaUrl  ?? null,
        fluxMediaType: (flux as any).mediaType ?? "image",
        fluxOwnerId,
        replyText:     text.trim(),
        type:          "flux_reply",
      }),
    });

    res.json({ success: true, message: chatRes });
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
      const likerInfoRes = await wieUserClient.getUsersByIds([callerId]).catch(() => ({ users: [] }));
      const likerInfo = (likerInfoRes.users ?? [])[0];
      const likerName = likerInfo?.username ?? likerInfo?.name ?? "Someone";
      await createNotification({
        userId:     flux.userId.toString(),
        type:       "flux_like",             // add to enum — see step 5
        title:      `${likerName} liked your Flux`,
        message:    `${likerName} liked your Flux ❤️`,
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
        fluxMediaUrl:    (flux as any).mediaUrl ?? null,
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
