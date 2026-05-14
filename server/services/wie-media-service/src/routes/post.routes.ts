import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as postController from "../controllers/post.controller";

const router: express.Router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── Feed / Discovery
// GET /api/post/feed?page=1&limit=20
router.get("/feed", postController.getPostFeed);

// GET /api/post/explore?page=1&limit=20
router.get("/explore", postController.getExplorePosts);

// GET /api/post/saved
router.get("/saved", postController.getSavedPosts);

// ── Create
// POST /api/post/create   (multipart: media[] + body fields)
router.post(
  "/create",
  upload.array("media", 10), // up to 10 files per post (carousel)
  postController.createPost,
);

// ── User posts
// GET /api/post/user/:userId?page=1&limit=12
router.get("/user/:userId", postController.getUserPosts);

// ── Single post CRUD
// GET    /api/post/:postId
router.get("/:postId", postController.getPostById);

// PATCH  /api/post/:postId  (update caption / visibility / location)
router.patch("/:postId", postController.updatePost);

// DELETE /api/post/:postId
router.delete("/:postId", postController.deletePost);

// ── Settings
// PATCH /api/post/:postId/settings
// Body: { commentsDisabled?, likesHidden?, visibility?, isPinned? }
router.patch("/:postId/settings", postController.updatePostSettings);

// ── Likes & Reactions
// POST /api/post/:postId/like   Body: { emoji?: string }
router.post("/:postId/like", postController.toggleLike);

// GET  /api/post/:postId/likes
router.get("/:postId/likes", postController.getPostLikes);

// ── Comments
// POST /api/post/:postId/comments             Body: { text }
router.post("/:postId/comments", postController.addComment);

// GET  /api/post/:postId/comments?page=1
router.get("/:postId/comments", postController.getPostComments);

// POST /api/post/:postId/comments/:commentId/reply  Body: { text }
router.post(
  "/:postId/comments/:commentId/reply",
  postController.replyToComment,
);

// POST /api/post/:postId/comments/:commentId/like
router.post("/:postId/comments/:commentId/like", postController.likeComment);

// POST /api/post/:postId/comments/:commentId/replies/:replyId/like
router.post(
  "/:postId/comments/:commentId/replies/:replyId/like",
  postController.likeCommentReply,
);

// DELETE /api/post/:postId/comments/:commentId
router.delete("/:postId/comments/:commentId", postController.deleteComment);

// ── Share
// POST /api/post/:postId/share   Body: { receiverIds: string[] }
router.post("/:postId/share", postController.sharePost);

// ── Save / Bookmark
// POST /api/post/:postId/save   Body: { collection?: string }
// (toggles — same route saves and unsaves)
router.post("/:postId/save", postController.toggleSave);

// ── Tags
// POST /api/post/:postId/tags
// Body: { taggedUsers: [{ userId, x?, y?, mediaIndex? }] }
router.post("/:postId/tags", postController.tagUsers);

// GET  /api/post/:postId/tags
router.get("/:postId/tags", postController.getPostTags);

export default router;
