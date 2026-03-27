import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as fluxController from "../controllers/flux.controller";

const router: express.Router = express.Router();

router.use(authenticate);

// ── Static / non-parameterized routes
router.post("/create", upload.single("media"), fluxController.createFlux);
router.get("/feed", fluxController.getFluxFeed);
router.get("/mine", fluxController.getMyFluxes);
router.get("/all-mine", fluxController.getAllMyFluxes);
router.get("/archive", fluxController.getArchivedFluxes);
// Stickers (must be before /:fluxId)
router.get("/stickers/trending", fluxController.getTrendingStickers);
router.get("/stickers/search", fluxController.searchStickers);

// Close Friends (must be before /:fluxId)
router.get("/close-friends", fluxController.getCloseFriends);
router.get(
  "/close-friends/suggestions",
  fluxController.getCloseFriendSuggestions,
);
router.post("/close-friends/add", fluxController.addCloseFriend);
router.post("/close-friends/remove", fluxController.removeCloseFriend);
// User fluxes
router.get("/user/:userId", fluxController.getUserFluxes);
// Views
router.post("/:fluxId/view", fluxController.viewFlux);
router.post("/:fluxId/record-view", fluxController.recordView);
router.get("/:fluxId/view-list", fluxController.getViewers);
router.get("/:fluxId/viewers", fluxController.getFluxViewers);
// Reactions / likes
router.post("/:fluxId/react", fluxController.reactToFlux);
router.post("/:fluxId/like", fluxController.toggleFluxLike);
router.get("/:fluxId/likes", fluxController.getFluxLikes);
// Comments
router.post("/:fluxId/comments", fluxController.addFluxComment);
router.get("/:fluxId/comments", fluxController.getFluxComments);
router.post(
  "/:fluxId/comments/:commentId/like",
  fluxController.likeFluxComment,
);
router.post("/:fluxId/reply", fluxController.replyFlux);
// Share
router.post("/:fluxId/share", fluxController.shareFlux);

// Mentions
router.post("/:fluxId/mention", fluxController.mentionFlux);
router.get("/:fluxId/mentions", fluxController.getFluxMentions);
router.delete("/:fluxId/mention/remove", fluxController.removeMentionSelf);

// Re-mentions
router.post("/:fluxId/remention", fluxController.reMentionFlux);
router.get("/:fluxId/rementions", fluxController.getReMentions);

// Permissions
router.get("/:fluxId/permissions", fluxController.getFluxPermissions);

// Visibility / hiding
router.patch("/:fluxId/visibility", fluxController.updateFluxVisibility);
router.patch("/:fluxId/hide-from", fluxController.hideFluxFromUser);
router.patch("/:fluxId/unhide-from", fluxController.unhideFluxFromUser);

router.get("/:fluxId", fluxController.getFluxById);
router.delete("/:fluxId", fluxController.deleteFlux);

export default router;
