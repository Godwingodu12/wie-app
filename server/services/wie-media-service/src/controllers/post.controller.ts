import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import PostModel, { PostVisibility } from "../models/post.model";
import {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  detectMediaType,
} from "../middlewares/upload";
import { getFollowingIds, isFollowing } from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import * as chatClient from "../grpc/clients/chatClient";
import {
  createNotification,
  emitMentionEvent,
} from "../utils/notificationHelper";
import { shouldSendLikeNotif, onUnlike } from '../utils/likeNotifCooldown';

// ── Helpers

/** Extract unique @mentioned userIds from a caption string */
const parseMentions = (caption: string): string[] => {
  // Expects userIds embedded as @<userId> — adjust if your app uses @username lookup
  const matches = caption.match(/@([a-f0-9]{24})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1)))];
};

/** Compute aspect ratio label from width × height */
const computeAspectRatio = (w?: number, h?: number): string => {
  if (!w || !h) return "1:1";
  const ratio = w / h;
  if (ratio > 1.7) return "16:9";
  if (ratio > 1.2) return "1.91:1";
  if (ratio > 0.9) return "1:1";
  return "4:5";
};

/** Check whether the viewer can see the owner's posts (privacy gate) */
const canViewPosts = async (
  ownerId: string,
  viewerId: string,
): Promise<boolean> => {
  if (ownerId === viewerId) return true;
  const privacy = await wieUserClient
    .getAccountPrivacy(ownerId)
    .catch(() => ({ accountPrivacy: "public" }));
  if (privacy.accountPrivacy !== "private") return true;
  const follow = await isFollowing(viewerId, ownerId).catch(() => ({
    isFollowing: false,
  }));
  return follow.isFollowing;
};

/** Enrich a post or array of posts with owner user info */
const enrichPostWithUser = async (post: any, userMap: Map<string, any>) => {
  const uid = post.userId?.toString();
  const user = userMap.get(uid);
  return {
    ...post,
    owner: user
      ? {
          id: uid,
          username: user.username ?? "",
          name: user.name ?? user.username ?? "",
          profile_picture: user.profile_picture ?? user.profilePicture ?? null,
          is_verified: user.is_verified ?? false,
        }
      : null,
  };
};

//  POST CRUD
/**
 * POST /api/post/create
 * Body (multipart/form-data):
 *   media[]       — up to 10 files (images or videos)
 *   caption       — string (optional)
 *   visibility    — "public" | "followers" | "only_me" (default: "public")
 *   taggedUsers   — JSON string: [{ userId, x, y, mediaIndex }]
 *   locationLabel — string
 *   locationPlaceId, locationLat, locationLng
 */
export const createPost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one media file is required",
      });
      return;
    }

    // Upload all files to Cloudinary in parallel
    const uploadResults = await Promise.all(
      files.map((file, idx) =>
        uploadToCloudinary(file.buffer, {
          folder: "WIE_MEDIA/posts",
          resourceType: detectMediaType(file.mimetype),
        }).then((result) => ({
          url: result.url,
          type: detectMediaType(file.mimetype) as "image" | "video",
          publicId: result.public_id,
          cloudinaryResourceType: result.resource_type,
          width: result.width,
          height: result.height,
          duration: result.duration,
          format: result.format,
          aspectRatio: computeAspectRatio(result.width, result.height),
          order: idx,
        })),
      ),
    );

    // Parse body fields
    const caption: string = (req.body.caption ?? "").trim();
    const visibility = (req.body.visibility ?? "public") as PostVisibility;
    const locationLabel = req.body.locationLabel ?? undefined;
    const locationPlaceId = req.body.locationPlaceId ?? undefined;
    const locationLat = req.body.locationLat
      ? Number(req.body.locationLat)
      : undefined;
    const locationLng = req.body.locationLng
      ? Number(req.body.locationLng)
      : undefined;

    let taggedUsers: {
      userId: string;
      x?: number;
      y?: number;
      mediaIndex?: number;
    }[] = [];
    try {
      const raw = req.body.taggedUsers;
      if (raw) taggedUsers = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {}

    // Extract @mentions from caption
    const mentionedUserIds = parseMentions(caption);

    const post = await PostModel.create({
      userId: callerId,
      mediaItems: uploadResults,
      caption: caption || undefined,
      visibility,
      locationLabel,
      locationPlaceId,
      locationLat,
      locationLng,
      taggedUsers,
      mentions: mentionedUserIds,
    });

    // Fire-and-forget: notify tagged + mentioned users
    if (taggedUsers.length > 0 || mentionedUserIds.length > 0) {
      processPostNotifications(
        post._id.toString(),
        callerId,
        taggedUsers.map((t) => t.userId),
        mentionedUserIds,
      ).catch((err) =>
        console.error("❌ processPostNotifications failed:", err),
      );
    }

    res.status(201).json({ success: true, data: post });
  } catch (err: any) {
    console.error("createPost error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/** Send tag + mention notifications after post creation */
async function processPostNotifications(
  postId: string,
  callerId: string,
  taggedUserIds: string[],
  mentionedUserIds: string[],
): Promise<void> {
  const callerResp = await wieUserClient
    .getUsersByIds([callerId])
    .catch(() => ({ users: [] }));
  const caller = (callerResp.users ?? [])[0];
  const callerName = caller?.name ?? caller?.username ?? "Someone";

  const allTargets = [
    ...new Set([...taggedUserIds, ...mentionedUserIds]),
  ].filter((id) => id !== callerId);

  for (const targetId of allTargets) {
    const isTag = taggedUserIds.includes(targetId);
    const isMention = mentionedUserIds.includes(targetId);

    await createNotification({
      userId: targetId,
      type: isTag ? "mention" : "mention",
      title: isTag
        ? `${callerName} tagged you in a post`
        : `${callerName} mentioned you in a post`,
      message: isTag
        ? `${callerName} tagged you in a post`
        : `${callerName} mentioned you in a post`,
      fromUserId: callerId,
      metadata: { postId, callerName, isTag, isMention },
      link: `/post/${postId}`,
    }).catch(() => {});
  }
}

/**
 * GET /api/post/feed?page=1&limit=20
 * Returns posts from followed users + self
 */
export const getPostFeed = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    // Get following IDs
    const { followingIds } = await getFollowingIds(viewerId).catch(() => ({
      followingIds: [] as string[],
    }));
    const authorIds = [...new Set([viewerId, ...followingIds])];

    const posts = await PostModel.find({
      userId: { $in: authorIds },
      isDeleted: false,
      $or: [
        { userId: viewerId },
        { visibility: { $in: ["public", "followers"] } },
      ],
    })
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PostModel.countDocuments({
      userId: { $in: authorIds },
      isDeleted: false,
      $or: [
        { userId: viewerId },
        { visibility: { $in: ["public", "followers"] } },
      ],
    });

    // Enrich with user info
    const uniqueUserIds: string[] = [
      ...new Set(posts.map((p) => p.userId.toString())),
    ];
    const usersResp = uniqueUserIds.length
      ? await wieUserClient
          .getUsersByIds(uniqueUserIds)
          .catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = posts.map((p: any) => {
      const user = userMap.get(p.userId.toString());
      return {
        ...p,
        likeCount:    (p.likes    ?? []).length,
        commentCount: (p.comments ?? []).length,
        shareCount:   p.shareCount ?? 0,
        hasLiked: (p.likes ?? []).some(
          (l: any) => l.userId?.toString() === viewerId,   // ← was callerId
        ),
        hasSaved: (p.saves ?? []).some(
          (s: any) => s.userId?.toString() === viewerId,   // ← was callerId
        ),
        owner: user
          ? {
              id:              (user._id ?? user.id).toString(),
              username:        user.username  ?? "",
              name:            user.name      ?? "",
              profile_picture: user.profile_picture ?? null,
              is_verified:     user.is_verified     ?? false,
            }
          : undefined,
      };
    });

    res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, hasMore: skip + posts.length < total },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
/**
 * GET /api/post/explore?page=1&limit=20
 * Returns all public posts (from public accounts)
 */
export const getExplorePosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const posts = await PostModel.find({
      isDeleted: false,
      visibility: "public",
      userId: { $ne: viewerId }, // exclude own posts (already in feed)
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PostModel.countDocuments({
      isDeleted: false,
      visibility: "public",
      userId: { $ne: viewerId },
    });

    // Filter out posts from private accounts
    const uniqueUserIds: string[] = [
      ...new Set(posts.map((p) => p.userId.toString())),
    ];
    const usersResp = uniqueUserIds.length
      ? await wieUserClient
          .getUsersByIds(uniqueUserIds)
          .catch(() => ({ users: [] }))
      : { users: [] };

    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    // Only include posts from public accounts
    const filtered = posts.filter((p) => {
      const user = userMap.get(p.userId.toString());
      return !user?.isPrivate && user?.accountPrivacy !== "private";
    });

    const enriched = await Promise.all(
      filtered.map((p) => enrichPostWithUser(p, userMap)),
    );

    res.json({
      success: true,
      data: enriched,
      pagination: { page, limit, total, hasMore: skip + posts.length < total },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/post/user/:userId?page=1&limit=12
 * Returns a user's posts (respects privacy)
 */
export const getUserPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const ownerId  = req.params.userId;

    const canView = await canViewPosts(ownerId, viewerId);
    if (!canView) {
      res.status(403).json({ success: false, message: "This account is private" });
      return;
    }

    const page  = Math.max(1, Number(req.query.page  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 12)));
    const skip  = (page - 1) * limit;

    const visibilityFilter =
      viewerId === ownerId
        ? {}
        : { visibility: { $in: ["public", "followers"] } };

    const [posts, total] = await Promise.all([
      PostModel.find({ userId: ownerId, isDeleted: false, ...visibilityFilter })
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments({ userId: ownerId, isDeleted: false, ...visibilityFilter }),
    ]);

    // ── Enrich with owner info ─────────────────────────────
    const uniqueUserIds = [...new Set(posts.map((p) => p.userId.toString()))];
    const usersResp = uniqueUserIds.length
      ? await wieUserClient.getUsersByIds(uniqueUserIds).catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = posts.map((p: any) => {
      const user = userMap.get(p.userId.toString());
      return {
        ...p,
        // ── Computed counts ──────────────────────────────
        likeCount:    (p.likes    ?? []).length,
        commentCount: (p.comments ?? []).length,
        shareCount:   p.shareCount ?? 0,
        saveCount:    (p.saves    ?? []).length,
        // ── Per-viewer state ─────────────────────────────
        hasLiked: (p.likes ?? []).some(
          (l: any) => l.userId?.toString() === viewerId,
        ),
        hasSaved: (p.saves ?? []).some(
          (s: any) => s.userId?.toString() === viewerId,
        ),
        // ── Owner info ───────────────────────────────────
        owner: user
          ? {
              id:              (user._id ?? user.id).toString(),
              username:        user.username        ?? "",
              name:            user.name            ?? "",
              profile_picture: user.profile_picture ?? null,
              is_verified:     user.is_verified     ?? false,
            }
          : undefined,
      };
    });

    res.status(200).json({
      success: true,
      data:    enriched,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/post/saved
 * Returns the authenticated user's saved posts
 */
export const getSavedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 12)));
    const skip = (page - 1) * limit;

    const posts = await PostModel.find({
      isDeleted: false,
      "saves.userId": viewerId,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await PostModel.countDocuments({
      isDeleted: false,
      "saves.userId": viewerId,
    });

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, hasMore: skip + posts.length < total },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/post/:postId
 */
export const getPostById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const { postId } = req.params;

    const post = await PostModel.findOne({
      _id: postId,
      isDeleted: false,
    }).lean();
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const ownerId = post.userId.toString();

    if (post.visibility === "only_me" && ownerId !== viewerId) {
      res.status(403).json({ success: false, message: "This post is private" });
      return;
    }

    if (post.visibility === "followers" && ownerId !== viewerId) {
      const follow = await isFollowing(viewerId, ownerId).catch(() => ({
        isFollowing: false,
      }));
      if (!follow.isFollowing) {
        res.status(403).json({
          success: false,
          message: "Follow this user to see their posts",
        });
        return;
      }
    }

    // Enrich with owner info
    const usersResp = await wieUserClient
      .getUsersByIds([ownerId])
      .catch(() => ({ users: [] }));
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );
    const enriched = await enrichPostWithUser(post, userMap);

    // Viewer-specific flags
    const hasLiked = (post.likes ?? []).some(
      (l: any) => l.userId?.toString() === viewerId,
    );
    const hasSaved = (post.saves ?? []).some(
      (s: any) => s.userId?.toString() === viewerId,
    );

    res.json({ success: true, data: { ...enriched, hasLiked, hasSaved } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/post/:postId
 * Body: { caption?, visibility?, locationLabel?, locationLat?, locationLng?, locationPlaceId? }
 */
export const updatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;

    const post = await PostModel.findOne({
      _id: postId,
      userId: callerId,
      isDeleted: false,
    });
    if (!post) {
      res
        .status(404)
        .json({ success: false, message: "Post not found or not yours" });
      return;
    }

    const allowed = [
      "caption",
      "visibility",
      "locationLabel",
      "locationPlaceId",
      "locationLat",
      "locationLng",
    ];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.caption) {
      updates.mentions = parseMentions(updates.caption);
    }

    Object.assign(post, updates);
    await post.save();

    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/post/:postId
 */
export const deletePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;

    const post = await PostModel.findOne({
      _id: postId,
      userId: callerId,
      isDeleted: false,
    });
    if (!post) {
      res
        .status(404)
        .json({ success: false, message: "Post not found or not yours" });
      return;
    }

    post.isDeleted = true;
    await post.save();

    // Fire-and-forget: delete media from Cloudinary
    Promise.allSettled(
      post.mediaItems.map((item) =>
        deleteFromCloudinary(item.url, item.cloudinaryResourceType).catch(
          () => {},
        ),
      ),
    );

    res.json({ success: true, message: "Post deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  LIKES & REACTIONS
/**
 * POST /api/post/:postId/like
 * Body: { emoji?: string }  — defaults to "❤️"
 * Toggles like. Sends notification on new like.
 */
export const toggleLike = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const emoji = (req.body.emoji as string) ?? "❤️";

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const ownerId = post.userId.toString();

    // Privacy gate
    if (post.visibility === "only_me" && ownerId !== callerId) {
      res.status(403).json({ success: false, message: "Post is private" });
      return;
    }
    if (post.visibility === "followers" && ownerId !== callerId) {
      const follow = await isFollowing(callerId, ownerId).catch(() => ({
        isFollowing: false,
      }));
      if (!follow.isFollowing) {
        res.status(403).json({ success: false, message: "Follow this user to interact" });
        return;
      }
    }

    const existingIdx = (post.likes as any[]).findIndex(
      (l: any) => l.userId?.toString() === callerId,
    );

    if (existingIdx !== -1) {
      // ── Unlike ──────────────────────────────────────────
      (post.likes as any[]).splice(existingIdx, 1);
      await post.save();

      onUnlike(callerId, postId); // no-op but keeps intent explicit

      res.json({
        success:   true,
        liked:     false,
        likeCount: post.likes.length,
      });
      return;
    }

    // ── Like ─────────────────────────────────────────────
    (post.likes as any[]).push({
      userId:    callerId,
      emoji,
      createdAt: new Date(),
    });
    await post.save();
    const likeCount = post.likes.length;

    // Notify owner — skip self-likes and respect cooldown
    if (ownerId !== callerId && shouldSendLikeNotif(callerId, postId)) {
      const likerResp = await wieUserClient
        .getUsersByIds([callerId])
        .catch(() => ({ users: [] }));
      const liker     = (likerResp.users ?? [])[0];
      const likerName = liker?.username ?? liker?.name ?? "Someone";
      const isReaction = emoji !== "❤️";

      await createNotification({
        userId:      ownerId,
        type:        isReaction ? "post_reacted" : "post_liked",
        title:       isReaction
          ? `${likerName} reacted ${emoji} to your post`
          : `${likerName} liked your post`,
        message:     isReaction
          ? `${likerName} reacted ${emoji} to your post`
          : `${likerName} liked your post ❤️`,
        fromUserId:  callerId,
        metadata: {
          postId,
          likerName,
          emoji,
          likerAvatar: liker?.profile_picture ?? null,
        },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    res.json({ success: true, liked: true, likeCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/post/:postId/likes
 */
export const getPostLikes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;

    const post = await PostModel.findOne({ _id: postId, isDeleted: false })
      .select("likes userId likesHidden")
      .lean();
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const ownerId = (post as any).userId?.toString();
    const isOwner = ownerId === callerId;
    const likes: any[] = (post as any).likes ?? [];

    if ((post as any).likesHidden && !isOwner) {
      res.json({ success: true, total: null, hidden: true });
      return;
    }

    const hasLiked = likes.some((l: any) => l.userId?.toString() === callerId);

    if (!isOwner) {
      res.json({ success: true, total: likes.length, hasLiked });
      return;
    }

    // Owner: full enriched list
    const userIds = likes.map((l: any) => l.userId?.toString()).filter(Boolean);
    const usersResp = userIds.length
      ? await wieUserClient.getUsersByIds(userIds).catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = likes.map((l: any) => ({
      userId: l.userId?.toString(),
      emoji: l.emoji ?? "❤️",
      createdAt: l.createdAt,
      ...(userMap.get(l.userId?.toString())
        ? {
            name: (userMap.get(l.userId!.toString()) as any).name,
            username: (userMap.get(l.userId!.toString()) as any).username,
            profile_picture:
              (userMap.get(l.userId!.toString()) as any).profile_picture ??
              null,
          }
        : {}),
    }));

    res.json({
      success: true,
      likes: enriched,
      total: enriched.length,
      hasLiked,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  COMMENTS
/**
 * POST /api/post/:postId/comments
 * Body: { text: string }
 */
export const addComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const text: string = (req.body.text ?? "").trim();

    if (!text) {
      res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
      return;
    }

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    if (post.commentsDisabled && post.userId.toString() !== callerId) {
      res.status(403).json({
        success: false,
        message: "Comments are disabled for this post",
      });
      return;
    }

    const comment = {
      userId: callerId,
      text,
      likes: [],
      replies: [],
      createdAt: new Date(),
    };
    await PostModel.findByIdAndUpdate(postId, { $push: { comments: comment } });

    const ownerId = post.userId.toString();
    if (ownerId !== callerId) {
      const callerResp = await wieUserClient
        .getUsersByIds([callerId])
        .catch(() => ({ users: [] }));
      const caller = (callerResp.users ?? [])[0];
      const callerName = caller?.username ?? caller?.name ?? "Someone";

      await createNotification({
        userId: ownerId,
        type: "post_commented",
        title: "New comment on your post",
        message: `${callerName} commented: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
        fromUserId: callerId,
        metadata: {
          postId,
          commentText: text,
          callerName,
          callerAvatar: caller?.profile_picture ?? null,
        },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    // Fetch caller info for response
    const callerInfoResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const callerInfo = (callerInfoResp.users ?? [])[0];

    res.status(201).json({
      success: true,
      comment: {
        ...comment,
        name: callerInfo?.name ?? callerInfo?.username ?? "Someone",
        profile_picture: callerInfo?.profile_picture ?? null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/post/:postId/comments?page=1&limit=20
 */
export const getPostComments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 20));

    const post = await PostModel.findOne({ _id: postId, isDeleted: false })
      .select("comments")
      .lean();
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const allComments: any[] = (post as any).comments ?? [];
    const total = allComments.length;
    const sliced = allComments.slice((page - 1) * limit, page * limit);

    const userIds = [
      ...new Set(sliced.map((c: any) => c.userId?.toString()).filter(Boolean)),
    ];
    const usersResp = userIds.length
      ? await wieUserClient.getUsersByIds(userIds).catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = sliced.map((c: any) => {
      const user = userMap.get(c.userId?.toString());
      return {
        _id: c._id?.toString() ?? `comment-${Math.random()}`,        
        userId: c.userId?.toString(),
        text: c.text,
        likes: c.likes ?? [],
        likeCount: (c.likes ?? []).length,
        replies: (c.replies ?? []).map((r: any) => {
          const ru = userMap.get(r.userId?.toString());
          return {
            _id:             r._id?.toString() ?? `reply-${Math.random()}`,
            userId:          r.userId?.toString(),
            text:            r.text,
            likes:           r.likes ?? [],
            likeCount:       (r.likes ?? []).length,
            createdAt:       r.createdAt,
            name:            ru?.name ?? ru?.username ?? "Someone",
            username:        ru?.username ?? "",
            profile_picture: ru?.profile_picture ?? null,
          };
        }),
        createdAt: c.createdAt,
        name: user?.name ?? user?.username ?? "Someone",
        username: user?.username ?? "",
        profile_picture: user?.profile_picture ?? null,
      };
    });

    res.json({
      success: true,
      comments: enriched,
      total,
      pagination: { page, limit, hasMore: page * limit < total },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/post/:postId/comments/:commentId/reply
 * Body: { text: string }
 */
export const replyToComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId } = req.params;
    const text: string = (req.body.text ?? "").trim();

    if (!text) {
      res
        .status(400)
        .json({ success: false, message: "Reply text is required" });
      return;
    }

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    if (post.commentsDisabled && post.userId.toString() !== callerId) {
      res
        .status(403)
        .json({ success: false, message: "Comments are disabled" });
      return;
    }

    const comment = (post.comments as any[]).find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const reply = { userId: callerId, text, likes: [], createdAt: new Date() };
    await PostModel.findByIdAndUpdate(
      postId,
      { $push: { "comments.$[c].replies": reply } },
      { arrayFilters: [{ "c._id": comment._id }] },
    );

    // Notify comment author
    const commentAuthorId = comment.userId?.toString();
    if (commentAuthorId && commentAuthorId !== callerId) {
      const callerResp = await wieUserClient
        .getUsersByIds([callerId])
        .catch(() => ({ users: [] }));
      const caller = (callerResp.users ?? [])[0];
      const callerName = caller?.username ?? caller?.name ?? "Someone";

      await createNotification({
        userId: commentAuthorId,
        type: "post_replied",
        title: `${callerName} replied to your comment`,
        message: `${callerName}: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`,
        fromUserId: callerId,
        metadata: { postId, commentId, callerName },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    res.status(201).json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/post/:postId/comments/:commentId/like
 * Toggles like on a comment
 */
export const likeComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId } = req.params;

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const comment = (post.comments as any[]).find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const alreadyLiked = (comment.likes ?? []).includes(callerId);

    if (alreadyLiked) {
      await PostModel.findByIdAndUpdate(
        postId,
        { $pull: { "comments.$[c].likes": callerId } },
        { arrayFilters: [{ "c._id": comment._id }] },
      );
    } else {
      await PostModel.findByIdAndUpdate(
        postId,
        { $addToSet: { "comments.$[c].likes": callerId } },
        { arrayFilters: [{ "c._id": comment._id }] },
      );

      // Notify comment author (not for self-likes)
      const commentAuthorId = comment.userId?.toString();
      if (commentAuthorId && commentAuthorId !== callerId) {
        const likerResp = await wieUserClient
          .getUsersByIds([callerId])
          .catch(() => ({ users: [] }));
        const liker     = (likerResp.users ?? [])[0];
        const likerName = liker?.username ?? liker?.name ?? "Someone";

        await createNotification({
          userId:     commentAuthorId,
          type:       "comment_liked",
          title:      `${likerName} liked your comment`,
          message:    `${likerName} liked your comment: "${(comment.text ?? "").slice(0, 60)}${comment.text?.length > 60 ? "…" : ""}"`,
          fromUserId: callerId,
          metadata: {
            postId,
            commentId,
            likerName,
            likerAvatar:  liker?.profile_picture ?? null,
            commentText:  comment.text,
          },
          link: `/post/${postId}`,
        }).catch(() => {});
      }
    }

    res.json({ success: true, liked: !alreadyLiked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/post/:postId/comments/:commentId/replies/:replyId/like
 * Toggles like on a comment reply
 */
export const likeCommentReply = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId, replyId } = req.params;

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const comment = (post.comments as any[]).find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const reply = (comment.replies ?? []).find(
      (r: any) => r._id?.toString() === replyId,
    );
    if (!reply) {
      res.status(404).json({ success: false, message: "Reply not found" });
      return;
    }

    const alreadyLiked = (reply.likes ?? []).includes(callerId);
    const op = alreadyLiked ? "$pull" : "$addToSet";

    await PostModel.findByIdAndUpdate(
      postId,
      { [op]: { "comments.$[c].replies.$[r].likes": callerId } },
      { arrayFilters: [{ "c._id": comment._id }, { "r._id": reply._id }] },
    );

    res.json({ success: true, liked: !alreadyLiked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/post/:postId/comments/:commentId
 * Post owner OR comment author can delete
 */
export const deleteComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId } = req.params;

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const comment = (post.comments as any[]).find(
      (c: any) => c._id?.toString() === commentId,
    );
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const isPostOwner = post.userId.toString() === callerId;
    const isCommentOwner = comment.userId?.toString() === callerId;

    if (!isPostOwner && !isCommentOwner) {
      res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
      return;
    }

    await PostModel.findByIdAndUpdate(postId, {
      $pull: { comments: { _id: comment._id } },
    });
    res.json({ success: true, message: "Comment deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  SHARE
/**
 * POST /api/post/:postId/share
 * Body: { receiverIds: string[] }
 * Sends post as a chat message to specified users
 */
export const sharePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const { receiverIds }: { receiverIds: string[] } = req.body ?? {};

    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "receiverIds must be a non-empty array",
      });
      return;
    }

    const post = await PostModel.findOne({
      _id: postId,
      isDeleted: false,
    }).lean();
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const callerResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const caller = (callerResp.users ?? [])[0];
    const callerName = caller?.name ?? caller?.username ?? "Someone";
    const callerAvatar = caller?.profile_picture ?? null;

    const postUrl = `/post/${postId}`;
    const firstMedia = (post as any).mediaItems?.[0] ?? {};

    const results: {
      receiverId: string;
      chatId?: string;
      messageId?: string;
      error?: string;
    }[] = [];

    for (const receiverId of receiverIds) {
      const content = JSON.stringify({
        type: "post_share",
        text: `${callerName} shared a post`,
        senderLabel: "You shared a post",
        postId,
        postOwnerId: (post as any).userId?.toString(),
        mediaUrl: firstMedia.url ?? null,
        mediaType: firstMedia.type ?? "image",
        caption: (post as any).caption ?? "",
        sharerName: callerName,
        postUrl,
      });

      try {
        const chatRes = await chatClient.sendSystemMessage({
          sender_id: callerId,
          receiver_id: receiverId,
          message_type: "post_share",
          content,
          metadata_json: JSON.stringify({
            postId,
            mediaUrl: firstMedia.url ?? null,
            mediaType: firstMedia.type ?? "image",
            sharerName: callerName,
            sharerAvatar: callerAvatar,
            postOwnerId: (post as any).userId?.toString(),
            type: "post_share",
          }),
        });
        results.push({
          receiverId,
          chatId: chatRes.chat_id,
          messageId: chatRes.message_id,
        });
      } catch (chatErr) {
        console.error(`❌ sharePost chat failed for ${receiverId}:`, chatErr);
        results.push({ receiverId, error: "Failed to send" });
      }
    }

    // Increment share count + record sharer
    await PostModel.findByIdAndUpdate(postId, {
      $inc: { shareCount: receiverIds.length },
      $push: { shares: { userId: callerId, createdAt: new Date() } },
    });

    // Notify post owner
    const ownerId = (post as any).userId?.toString();
    if (ownerId && ownerId !== callerId) {
      await createNotification({
        userId: ownerId,
        type: "post_shared",
        title: `${callerName} shared your post`,
        message: `${callerName} shared your post`,
        fromUserId: callerId,
        metadata: { postId, callerName, callerAvatar },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    res.json({ success: true, message: "Post shared", results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  SAVE / BOOKMARK
/**
 * POST /api/post/:postId/save
 * Body: { collection?: string }
 * Toggle save (bookmark) for authenticated user
 */
export const toggleSave = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const collection: string | undefined = req.body.collection;

    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const already = (post.saves as any[]).findIndex(
      (s: any) => s.userId?.toString() === callerId,
    );

    if (already !== -1) {
      (post.saves as any[]).splice(already, 1);
      await post.save();
      res.json({ success: true, saved: false, saveCount: post.saves.length });
      return;
    }

    (post.saves as any[]).push({
      userId: callerId,
      collection,
      createdAt: new Date(),
    });
    await post.save();

    res.json({ success: true, saved: true, saveCount: post.saves.length });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  TAG PEOPLE
/**
 * POST /api/post/:postId/tags
 * Body: { taggedUsers: [{ userId, x?, y?, mediaIndex? }] }
 * Post owner can add/update tags
 */
export const tagUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const {
      taggedUsers,
    }: {
      taggedUsers: {
        userId: string;
        x?: number;
        y?: number;
        mediaIndex?: number;
      }[];
    } = req.body ?? {};

    if (!Array.isArray(taggedUsers)) {
      res
        .status(400)
        .json({ success: false, message: "taggedUsers must be an array" });
      return;
    }

    const post = await PostModel.findOne({
      _id: postId,
      userId: callerId,
      isDeleted: false,
    });
    if (!post) {
      res
        .status(404)
        .json({ success: false, message: "Post not found or not yours" });
      return;
    }

    // Validate each tagged user (block check)
    const validated: typeof taggedUsers = [];
    for (const tag of taggedUsers) {
      if (!tag.userId || tag.userId === callerId) continue;
      const blockResp = await wieUserClient
        .checkIfBlocked(callerId, tag.userId)
        .catch(() => ({ blocked: false }));
      if (!blockResp.blocked) validated.push(tag);
    }

    post.taggedUsers = validated as any;
    await post.save();

    // Notify newly tagged users
    const callerResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const caller = (callerResp.users ?? [])[0];
    const callerName = caller?.name ?? caller?.username ?? "Someone";

    for (const tag of validated) {
      await createNotification({
        userId: tag.userId,
        type: "mention",
        title: `${callerName} tagged you in a post`,
        message: `${callerName} tagged you in a post`,
        fromUserId: callerId,
        metadata: { postId, callerName },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    res.json({ success: true, taggedUsers: post.taggedUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/post/:postId/tags
 */
export const getPostTags = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await PostModel.findOne({ _id: postId, isDeleted: false })
      .select("taggedUsers")
      .lean();
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const taggedUsers: any[] = (post as any).taggedUsers ?? [];
    const userIds = taggedUsers.map((t: any) => t.userId).filter(Boolean);
    const usersResp = userIds.length
      ? await wieUserClient.getUsersByIds(userIds).catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = taggedUsers.map((t: any) => {
      const user = userMap.get(t.userId?.toString());
      return {
        userId: t.userId,
        x: t.x,
        y: t.y,
        mediaIndex: t.mediaIndex ?? 0,
        name: user?.name ?? user?.username ?? "Someone",
        username: user?.username ?? "",
        profile_picture: user?.profile_picture ?? null,
      };
    });

    res.json({ success: true, taggedUsers: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

//  POST SETTINGS
/**
 * PATCH /api/post/:postId/settings
 * Body: { commentsDisabled?, likesHidden?, visibility?, isPinned? }
 */
export const updatePostSettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;

    const post = await PostModel.findOne({
      _id: postId,
      userId: callerId,
      isDeleted: false,
    });
    if (!post) {
      res
        .status(404)
        .json({ success: false, message: "Post not found or not yours" });
      return;
    }

    const allowed = [
      "commentsDisabled",
      "likesHidden",
      "visibility",
      "isPinned",
    ];
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    Object.assign(post, updates);
    await post.save();

    res.json({
      success: true,
      data: {
        commentsDisabled: post.commentsDisabled,
        likesHidden: post.likesHidden,
        visibility: post.visibility,
        isPinned: post.isPinned,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
