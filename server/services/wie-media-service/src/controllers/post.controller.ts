import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import PostModel, { PostVisibility } from "../models/post.model";
import LikeModel from "../models/like.model";
import CommentModel from "../models/comment.model";
import SaveModel from "../models/save.model";
import ShareModel from "../models/share.model";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  detectMediaType,
} from "../middlewares/upload";
import { isFollowing } from "../grpc/clients/followClient";
import * as wieUserClient from "../grpc/clients/wieUserClient";
import * as chatClient from "../grpc/clients/chatClient";
import { createNotification } from "../utils/notificationHelper";
import { shouldSendLikeNotif, onUnlike } from "../utils/likeNotifCooldown";

// ── Giphy types
interface GiphyImage {
  url: string;
}
interface GiphyImages {
  fixed_width_small?: GiphyImage;
  preview_gif?: GiphyImage;
  fixed_width?: GiphyImage;
  downsized?: GiphyImage;
  original?: GiphyImage;
}
interface GiphyItem {
  id: string;
  title: string;
  images: GiphyImages;
}
interface GiphyPagination {
  total_count: number;
  count: number;
  offset: number;
}
interface GiphyResponse {
  data: GiphyItem[];
  pagination: GiphyPagination;
}

// ── Helpers ──────────────────────────────────────────────────────────
const parseMentions = (caption: string): string[] => {
  const matches = caption.match(/@([a-f0-9]{24})/g) ?? [];
  return [...new Set(matches.map((m) => m.slice(1)))];
};

const computeAspectRatio = (w?: number, h?: number): string => {
  if (!w || !h) return "1:1";
  const r = w / h;
  if (r > 1.7) return "16:9";
  if (r > 1.2) return "1.91:1";
  if (r > 0.9) return "1:1";
  return "4:5";
};

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
          profile_picture: user.profile_picture ?? null,
          is_verified: user.is_verified ?? false,
        }
      : null,
  };
};

/** Attach hasLiked / hasSaved flags by querying separate tables */
const attachViewerFlags = async (
  posts: any[],
  viewerId: string,
): Promise<any[]> => {
  if (posts.length === 0) return posts;
  const postIds = posts.map((p) => p._id?.toString() ?? p.id?.toString());

  const [likedDocs, savedDocs] = await Promise.all([
    LikeModel.find({ postId: { $in: postIds }, userId: viewerId })
      .select("postId")
      .lean(),
    SaveModel.find({ postId: { $in: postIds }, userId: viewerId })
      .select("postId")
      .lean(),
  ]);

  const likedSet = new Set(likedDocs.map((l) => l.postId.toString()));
  const savedSet = new Set(savedDocs.map((s) => s.postId.toString()));

  return posts.map((p) => {
    const id = p._id?.toString() ?? p.id?.toString();
    return { ...p, hasLiked: likedSet.has(id), hasSaved: savedSet.has(id) };
  });
};

// ── CREATE ───────────────────────────────────────────────────────────
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

    const caption = (req.body.caption ?? "").trim();
    const visibility = (req.body.visibility ?? "public") as PostVisibility;
    const hasVideo = files.some((f) => f.mimetype.startsWith("video/"));
    const bodyType = req.body.contentType as string | undefined;
    const contentType =
      bodyType === "reel" || bodyType === "post"
        ? bodyType
        : hasVideo
          ? "reel"
          : "post";
    const mentionedIds = parseMentions(caption);

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

    const post = await PostModel.create({
      userId: callerId,
      mediaItems: uploadResults,
      caption: caption || undefined,
      visibility,
      contentType,
      locationLabel: req.body.locationLabel,
      locationPlaceId: req.body.locationPlaceId,
      locationLat: req.body.locationLat
        ? Number(req.body.locationLat)
        : undefined,
      locationLng: req.body.locationLng
        ? Number(req.body.locationLng)
        : undefined,
      taggedUsers,
      mentions: mentionedIds,
    });

    if (taggedUsers.length > 0 || mentionedIds.length > 0) {
      processPostNotifications(
        post._id.toString(),
        callerId,
        taggedUsers.map((t) => t.userId),
        mentionedIds,
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

async function processPostNotifications(
  postId: string,
  callerId: string,
  taggedUserIds: string[],
  mentionedUserIds: string[],
) {
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
    await createNotification({
      userId: targetId,
      type: "mention",
      title: isTag
        ? `${callerName} tagged you in a post`
        : `${callerName} mentioned you in a post`,
      message: isTag
        ? `${callerName} tagged you in a post`
        : `${callerName} mentioned you in a post`,
      fromUserId: callerId,
      metadata: { postId, callerName, isTag },
      link: `/post/${postId}`,
    }).catch(() => {});
  }
}

// ── FEED ─────────────────────────────────────────────────────────────
export const getPostFeed = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const [publicPosts, totalPublic] = await Promise.all([
      PostModel.find({
        isDeleted: false,
        visibility: { $in: ["public", "everyone"] },
        userId: { $ne: viewerId },
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit * 4)
        .lean(),
      PostModel.countDocuments({
        isDeleted: false,
        visibility: { $in: ["public", "everyone"] },
        userId: { $ne: viewerId },
      }),
    ]);

    const ownPosts = await PostModel.find({
      userId: viewerId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const allOwnerIds = [
      ...new Set([
        ...publicPosts.map((p: any) => p.userId.toString()),
        viewerId,
      ]),
    ];
    const usersResp = await wieUserClient
      .getUsersByIds(allOwnerIds)
      .catch(() => ({ users: [] }));
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const filteredPublic = publicPosts.filter((p: any) => {
      const owner = userMap.get(p.userId.toString());
      if (!owner) return false;
      const privacy = owner.account_privacy ?? owner.accountPrivacy ?? "public";
      return privacy === "public" || privacy === "everyone";
    });

    const postMap = new Map<string, any>();
    for (const p of [...ownPosts, ...filteredPublic])
      postMap.set(p._id.toString(), p);

    const merged = Array.from(postMap.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    if (merged.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, hasMore: false },
      });
      return;
    }

    const enriched = await Promise.all(
      merged.map((p) => enrichPostWithUser(p, userMap)),
    );
    const withFlags = await attachViewerFlags(enriched, viewerId);

    res.status(200).json({
      success: true,
      data: withFlags,
      pagination: {
        page,
        limit,
        total: totalPublic + ownPosts.length,
        hasMore: skip + merged.length < totalPublic + ownPosts.length,
      },
    });
  } catch (err: any) {
    console.error("getPostFeed error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── EXPLORE ──────────────────────────────────────────────────────────
export const getExplorePosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;
    const contentTypeFilter = req.query.contentType
      ? { contentType: req.query.contentType as string }
      : {};

    const query = {
      isDeleted: false,
      ...contentTypeFilter,
      $or: [{ userId: viewerId }, { visibility: "public" }],
    };
    const [posts, total] = await Promise.all([
      PostModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments(query),
    ]);

    if (posts.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, hasMore: false },
      });
      return;
    }

    const uniqueUserIds = [...new Set(posts.map((p) => p.userId.toString()))];
    const usersResp = await wieUserClient
      .getUsersByIds(uniqueUserIds)
      .catch(() => ({ users: [] }));
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const filtered = posts.filter((p) => {
      if (p.userId.toString() === viewerId) return true;
      const user = userMap.get(p.userId.toString());
      const privacy = user?.account_privacy ?? user?.accountPrivacy ?? "public";
      return privacy !== "private";
    });

    const enriched = await Promise.all(
      filtered.map((p) => enrichPostWithUser(p, userMap)),
    );
    const withFlags = await attachViewerFlags(enriched, viewerId);

    res.status(200).json({
      success: true,
      data: withFlags,
      pagination: { page, limit, total, hasMore: skip + posts.length < total },
    });
  } catch (err: any) {
    console.error("getExplorePosts error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── REELS ────────────────────────────────────────────────────────────
export const getReelsFeed = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const reelQuery = {
      isDeleted: false,
      $and: [
        {
          $or: [
            { contentType: "reel" },
            { contentType: { $exists: false }, "mediaItems.0.type": "video" },
            { contentType: "post", "mediaItems.0.type": "video" },
          ],
        },
        {
          $or: [
            { userId: viewerId },
            { visibility: { $in: ["public", "everyone"] } },
          ],
        },
      ],
    };

    const [reels, total] = await Promise.all([
      PostModel.find(reelQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments(reelQuery),
    ]);

    if (reels.length === 0) {
      res.status(200).json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, hasMore: false },
      });
      return;
    }

    const uniqueUserIds = [...new Set(reels.map((r) => r.userId.toString()))];
    const usersResp = await wieUserClient
      .getUsersByIds(uniqueUserIds)
      .catch(() => ({ users: [] }));
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const filtered = reels.filter((r) => {
      if (r.userId.toString() === viewerId) return true;
      const user = userMap.get(r.userId.toString());
      const privacy = user?.account_privacy ?? user?.accountPrivacy ?? "public";
      return privacy !== "private";
    });

    const enriched = await Promise.all(
      filtered.map((r) => enrichPostWithUser(r, userMap)),
    );
    const withFlags = await attachViewerFlags(enriched, viewerId);

    const result = withFlags.map((r) => ({ ...r, contentType: "reel" }));

    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + filtered.length < total,
      },
    });
  } catch (err: any) {
    console.error("getReelsFeed error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── USER POSTS ───────────────────────────────────────────────────────
export const getUserPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const ownerId = req.params.userId;
    const canView = await canViewPosts(ownerId, viewerId);
    if (!canView) {
      res
        .status(403)
        .json({ success: false, message: "This account is private" });
      return;
    }

    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 12)));
    const skip = (page - 1) * limit;
    const visibilityFilter =
      viewerId === ownerId
        ? {}
        : { visibility: { $in: ["public", "followers"] } };
    const contentTypeFilter = req.query.contentType
      ? { contentType: req.query.contentType as string }
      : {};

    const [posts, total] = await Promise.all([
      PostModel.find({
        userId: ownerId,
        isDeleted: false,
        ...visibilityFilter,
        ...contentTypeFilter,
      })
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PostModel.countDocuments({
        userId: ownerId,
        isDeleted: false,
        ...visibilityFilter,
        ...contentTypeFilter,
      }),
    ]);

    const uniqueUserIds = [...new Set(posts.map((p) => p.userId.toString()))];
    const usersResp = uniqueUserIds.length
      ? await wieUserClient
          .getUsersByIds(uniqueUserIds)
          .catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = await Promise.all(
      posts.map((p) => enrichPostWithUser(p, userMap)),
    );
    const withFlags = await attachViewerFlags(enriched, viewerId);

    res.status(200).json({
      success: true,
      data: withFlags,
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

// ── SAVED POSTS ──────────────────────────────────────────────────────
export const getSavedPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const viewerId = req.userId!.toString();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 12)));
    const skip = (page - 1) * limit;

    const [saveDocs, total] = await Promise.all([
      SaveModel.find({ userId: viewerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SaveModel.countDocuments({ userId: viewerId }),
    ]);

    const postIds = saveDocs.map((s) => s.postId);
    const posts = await PostModel.find({
      _id: { $in: postIds },
      isDeleted: false,
    }).lean();
    const postMap = new Map(posts.map((p) => [p._id.toString(), p]));
    const ordered = postIds
      .map((id) => postMap.get(id))
      .filter(Boolean) as any[];

    const withFlags = await attachViewerFlags(ordered, viewerId);
    res.json({
      success: true,
      data: withFlags,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + saveDocs.length < total,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────
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

    const usersResp = await wieUserClient
      .getUsersByIds([ownerId])
      .catch(() => ({ users: [] }));
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );
    const enriched = await enrichPostWithUser(post, userMap);
    const [withFlags] = await attachViewerFlags([enriched], viewerId);

    res.status(200).json({ success: true, data: withFlags });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────
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
    for (const key of allowed)
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (updates.caption) updates.mentions = parseMentions(updates.caption);

    Object.assign(post, updates);
    await post.save();
    res.json({ success: true, data: post });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE ───────────────────────────────────────────────────────────
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

// ── TOGGLE LIKE ──────────────────────────────────────────────────────
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
    if (post.visibility === "only_me" && ownerId !== callerId) {
      res.status(403).json({ success: false, message: "Post is private" });
      return;
    }

    const existing = await LikeModel.findOne({ postId, userId: callerId });

    if (existing) {
      // Unlike
      await LikeModel.deleteOne({ _id: existing._id });
      const newCount = Math.max(0, await LikeModel.countDocuments({ postId }));
      await PostModel.findByIdAndUpdate(postId, { likeCount: newCount });
      onUnlike(callerId, postId);
      res.json({ success: true, liked: false, likeCount: newCount });
      return;
    }

    // Like
    await LikeModel.create({ postId, userId: callerId, emoji });
    const newCount = await LikeModel.countDocuments({ postId });
    await PostModel.findByIdAndUpdate(postId, { likeCount: newCount });

    if (ownerId !== callerId && shouldSendLikeNotif(callerId, postId)) {
      const likerResp = await wieUserClient
        .getUsersByIds([callerId])
        .catch(() => ({ users: [] }));
      const liker = (likerResp.users ?? [])[0];
      const likerName = liker?.username ?? liker?.name ?? "Someone";
      await createNotification({
        userId: ownerId,
        type: emoji !== "❤️" ? "post_reacted" : "post_liked",
        title:
          emoji !== "❤️"
            ? `${likerName} reacted ${emoji} to your post`
            : `${likerName} liked your post`,
        message:
          emoji !== "❤️"
            ? `${likerName} reacted ${emoji} to your post`
            : `${likerName} liked your post ❤️`,
        fromUserId: callerId,
        metadata: {
          postId,
          likerName,
          emoji,
          likerAvatar: liker?.profile_picture ?? null,
        },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    res.json({ success: true, liked: true, likeCount: newCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET LIKES ────────────────────────────────────────────────────────
export const getPostLikes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const post = await PostModel.findOne({ _id: postId, isDeleted: false })
      .select("likesHidden userId")
      .lean();
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const isOwner = (post as any).userId?.toString() === callerId;
    const hasLiked = !!(await LikeModel.findOne({ postId, userId: callerId }));
    const total = await LikeModel.countDocuments({ postId });

    if ((post as any).likesHidden && !isOwner) {
      res.json({ success: true, total: null, hidden: true, hasLiked });
      return;
    }
    if (!isOwner) {
      res.json({ success: true, total, hasLiked });
      return;
    }

    const likeDocs = await LikeModel.find({ postId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const userIds = likeDocs.map((l) => l.userId.toString()).filter(Boolean);
    const usersResp = userIds.length
      ? await wieUserClient.getUsersByIds(userIds).catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = likeDocs.map((l) => {
      const u = userMap.get(l.userId.toString());
      return {
        userId: l.userId,
        emoji: l.emoji ?? "❤️",
        createdAt: l.createdAt,
        name: u?.name,
        username: u?.username,
        profile_picture: u?.profile_picture ?? null,
      };
    });

    res.json({ success: true, likes: enriched, total, hasLiked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── ADD COMMENT ──────────────────────────────────────────────────────
export const addComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const text = (req.body.text ?? "").trim();
    const gifUrl = req.body.gifUrl ?? null;
    const stickerUrl = req.body.stickerUrl ?? null;

    if (!text && !gifUrl && !stickerUrl) {
      res
        .status(400)
        .json({ success: false, message: "Comment content is required" });
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

    const comment = await CommentModel.create({
      postId,
      userId: callerId,
      text,
      gifUrl,
      stickerUrl,
    });
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

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
        message: text
          ? `${callerName} commented: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`
          : `${callerName} replied with media`,
        fromUserId: callerId,
        metadata: { postId, commentText: text, callerName },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    const callerInfoResp = await wieUserClient
      .getUsersByIds([callerId])
      .catch(() => ({ users: [] }));
    const callerInfo = (callerInfoResp.users ?? [])[0];

    res.status(201).json({
      success: true,
      comment: {
        _id: comment._id,
        userId: callerId,
        text,
        gifUrl,
        stickerUrl,
        likes: [],
        likeCount: 0,
        replies: [],
        replyCount: 0,
        createdAt: comment.createdAt,
        name: callerInfo?.name ?? callerInfo?.username ?? "Someone",
        username: callerInfo?.username ?? "",
        profile_picture: callerInfo?.profile_picture ?? null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET COMMENTS ─────────────────────────────────────────────────────
export const getPostComments = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { postId } = req.params;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 20));
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      CommentModel.find({ postId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommentModel.countDocuments({ postId, isDeleted: false }),
    ]);

    const userIds = [...new Set(comments.map((c) => c.userId.toString()))];
    const usersResp = userIds.length
      ? await wieUserClient.getUsersByIds(userIds).catch(() => ({ users: [] }))
      : { users: [] };
    const userMap = new Map<string, any>(
      (usersResp.users ?? []).map((u: any) => [(u._id ?? u.id).toString(), u]),
    );

    const enriched = comments.map((c) => {
      const user = userMap.get(c.userId.toString());
      return {
        _id: c._id?.toString(),
        userId: c.userId,
        text: c.text,
        likes: c.likedBy ?? [],
        likeCount: c.likeCount ?? 0,
        replies: (c.replies ?? []).map((r: any) => {
          const ru = userMap.get(r.userId?.toString());
          return {
            _id: r._id?.toString(),
            userId: r.userId,
            text: r.text,
            likes: r.likedBy ?? [],
            likeCount: r.likeCount ?? 0,
            createdAt: r.createdAt,
            name: ru?.name ?? ru?.username ?? "Someone",
            username: ru?.username ?? "",
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

// ── REPLY TO COMMENT ─────────────────────────────────────────────────
export const replyToComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId } = req.params;
    const text = (req.body.text ?? "").trim();
    const gifUrl = req.body.gifUrl ?? null;
    const stickerUrl = req.body.stickerUrl ?? null;

    if (!text && !gifUrl && !stickerUrl) {
      res
        .status(400)
        .json({ success: false, message: "Reply content is required" });
      return;
    }

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const post = await PostModel.findOne({
      _id: postId,
      isDeleted: false,
    }).select("commentsDisabled userId");
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

    const reply = {
      userId: callerId,
      text,
      gifUrl,
      stickerUrl,
      likeCount: 0,
      likedBy: [],
      createdAt: new Date(),
    };
    await CommentModel.findByIdAndUpdate(commentId, {
      $push: { replies: reply },
      $inc: { replyCount: 1 },
    });

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
        message: text
          ? `${callerName}: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`
          : `${callerName} replied with media`,
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

// ── LIKE COMMENT ─────────────────────────────────────────────────────
export const likeComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId } = req.params;

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const alreadyLiked = comment.likedBy.includes(callerId);
    if (alreadyLiked) {
      await CommentModel.findByIdAndUpdate(commentId, {
        $pull: { likedBy: callerId },
        $inc: { likeCount: -1 },
      });
    } else {
      await CommentModel.findByIdAndUpdate(commentId, {
        $addToSet: { likedBy: callerId },
        $inc: { likeCount: 1 },
      });
      const commentAuthorId = comment.userId?.toString();
      if (commentAuthorId && commentAuthorId !== callerId) {
        const likerResp = await wieUserClient
          .getUsersByIds([callerId])
          .catch(() => ({ users: [] }));
        const liker = (likerResp.users ?? [])[0];
        const likerName = liker?.username ?? liker?.name ?? "Someone";
        await createNotification({
          userId: commentAuthorId,
          type: "comment_liked",
          title: `${likerName} liked your comment`,
          message: `${likerName} liked your comment: "${(comment.text ?? "").slice(0, 60)}…"`,
          fromUserId: callerId,
          metadata: { postId, commentId, likerName },
          link: `/post/${postId}`,
        }).catch(() => {});
      }
    }

    res.json({ success: true, liked: !alreadyLiked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LIKE COMMENT REPLY ───────────────────────────────────────────────
export const likeCommentReply = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId, replyId } = req.params;

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const reply = comment.replies.find(
      (r: any) => r._id?.toString() === replyId,
    );
    if (!reply) {
      res.status(404).json({ success: false, message: "Reply not found" });
      return;
    }

    const alreadyLiked = (reply.likedBy ?? []).includes(callerId);
    const op = alreadyLiked ? "$pull" : "$addToSet";
    const inc = alreadyLiked ? -1 : 1;

    await CommentModel.findByIdAndUpdate(
      commentId,
      {
        [op]: { "replies.$[r].likedBy": callerId },
        $inc: { "replies.$[r].likeCount": inc },
      },
      { arrayFilters: [{ "r._id": reply._id }] },
    );

    res.json({ success: true, liked: !alreadyLiked });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE COMMENT ───────────────────────────────────────────────────
export const deleteComment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId, commentId } = req.params;

    const comment = await CommentModel.findOne({
      _id: commentId,
      postId,
      isDeleted: false,
    });
    if (!comment) {
      res.status(404).json({ success: false, message: "Comment not found" });
      return;
    }

    const post = await PostModel.findById(postId).select("userId");
    const isPostOwner = post?.userId?.toString() === callerId;
    const isCommentOwner = comment.userId?.toString() === callerId;
    if (!isPostOwner && !isCommentOwner) {
      res.status(403).json({ success: false, message: "Not authorized" });
      return;
    }

    await CommentModel.findByIdAndUpdate(commentId, { isDeleted: true });
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
    res.json({ success: true, message: "Comment deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── SHARE ────────────────────────────────────────────────────────────
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
    const firstMedia = (post as any).mediaItems?.[0] ?? {};

    const results: {
      receiverId: string;
      chatId?: string;
      messageId?: string;
      error?: string;
    }[] = [];

    // Insert share records + send chat messages
    await Promise.all(
      receiverIds.map(async (receiverId) => {
        try {
          await ShareModel.create({ postId, userId: callerId, receiverId });
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
            postUrl: `/post/${postId}`,
          });
          const chatRes = await chatClient.sendSystemMessage({
            sender_id: callerId,
            receiver_id: receiverId,
            message_type: "post_share",
            content,
            metadata_json: JSON.stringify({
              postId,
              mediaUrl: firstMedia.url ?? null,
              sharerName: callerName,
              type: "post_share",
            }),
          });
          results.push({
            receiverId,
            chatId: chatRes.chat_id,
            messageId: chatRes.message_id,
          });
        } catch (e) {
          results.push({ receiverId, error: "Failed to send" });
        }
      }),
    );

    const newShareCount = await ShareModel.countDocuments({ postId });
    await PostModel.findByIdAndUpdate(postId, { shareCount: newShareCount });

    const ownerId = (post as any).userId?.toString();
    if (ownerId && ownerId !== callerId) {
      await createNotification({
        userId: ownerId,
        type: "post_shared",
        title: `${callerName} shared your post`,
        message: `${callerName} shared your post`,
        fromUserId: callerId,
        metadata: { postId, callerName },
        link: `/post/${postId}`,
      }).catch(() => {});
    }

    res.json({ success: true, message: "Post shared", results });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TOGGLE SAVE ──────────────────────────────────────────────────────
export const toggleSave = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const callerId = req.userId!.toString();
    const { postId } = req.params;
    const post = await PostModel.findOne({ _id: postId, isDeleted: false });
    if (!post) {
      res.status(404).json({ success: false, message: "Post not found" });
      return;
    }

    const existing = await SaveModel.findOne({ postId, userId: callerId });
    if (existing) {
      await SaveModel.deleteOne({ _id: existing._id });
      const newCount = await SaveModel.countDocuments({ postId });
      await PostModel.findByIdAndUpdate(postId, { saveCount: newCount });
      res.json({ success: true, saved: false, saveCount: newCount });
      return;
    }

    await SaveModel.create({
      postId,
      userId: callerId,
      collection: req.body.collection,
    });
    const newCount = await SaveModel.countDocuments({ postId });
    await PostModel.findByIdAndUpdate(postId, { saveCount: newCount });
    res.json({ success: true, saved: true, saveCount: newCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── TAG USERS ────────────────────────────────────────────────────────
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
    res.json({ success: true, taggedUsers: post.taggedUsers });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET TAGS ─────────────────────────────────────────────────────────
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
        name: user?.name ?? "Someone",
        username: user?.username ?? "",
        profile_picture: user?.profile_picture ?? null,
      };
    });

    res.json({ success: true, taggedUsers: enriched });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST SETTINGS ────────────────────────────────────────────────────
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
    for (const key of allowed)
      if (req.body[key] !== undefined) updates[key] = req.body[key];
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
// ── GIPHY SEARCH
export const searchGiphy = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const q = (req.query.q as string)?.trim() ?? "";
    const type =
      (req.query.type as string) === "stickers" ? "stickers" : "gifs";
    const offset = Number(req.query.offset) || 0;
    const apiKey = process.env.STICKER_API_KEY ?? "";
    if (!apiKey) {
      res.status(503).json({ success: false, message: "Giphy not configured" });
      return;
    }

    const endpoint = q
      ? `https://api.giphy.com/v1/${type}/search`
      : `https://api.giphy.com/v1/${type}/trending`;
    const params = new URLSearchParams({
      api_key: apiKey,
      limit: "20",
      offset: String(offset),
      rating: "pg-13",
      ...(q ? { q } : {}),
    });
    const response = await fetch(`${endpoint}?${params}`);
    if (!response.ok) {
      res.status(502).json({ success: false, message: "Giphy request failed" });
      return;
    }

    const data = (await response.json()) as GiphyResponse;
    const items = data.data.map((g) => ({
      id: g.id,
      title: g.title,
      preview:
        g.images.fixed_width_small?.url ?? g.images.preview_gif?.url ?? "",
      url: g.images.fixed_width?.url ?? g.images.downsized?.url ?? "",
      original: g.images.original?.url ?? "",
    }));

    res
      .status(200)
      .json({ success: true, data: items, pagination: data.pagination });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Internal server error",
    });
  }
};
