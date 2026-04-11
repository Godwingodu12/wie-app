import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as fluxController from "../controllers/flux.controller";
const router: express.Router = express.Router();
router.use(authenticate);
// ── Static / non-parameterized routes (ALL must come before /:fluxId)
router.post("/create", upload.single("media"), fluxController.createFlux);
router.get("/feed", fluxController.getFluxFeed);
router.get("/mine", fluxController.getMyFluxes);
router.get("/all-mine", fluxController.getAllMyFluxes);
router.get("/archive", fluxController.getArchivedFluxes);
// Stickers
router.get("/stickers/trending", fluxController.getTrendingStickers);
router.get("/stickers/search", fluxController.searchStickers);
// Close Friends
router.get("/close-friends", fluxController.getCloseFriends);
router.get(
  "/close-friends/suggestions",
  fluxController.getCloseFriendSuggestions,
);
router.post("/close-friends/add", fluxController.addCloseFriend);
router.post("/close-friends/remove", fluxController.removeCloseFriend);
router.post("/close-friends/save", fluxController.saveCloseFriends);
// Flux Settings
router.get("/settings", fluxController.getFluxSettings);
router.post("/invalidate-feed", fluxController.invalidateFollowFeedCache);
router.patch("/settings", fluxController.updateFluxSettings);
router.get("/settings/hide-from", fluxController.getGlobalHideFromList);
router.patch("/settings/hide-from", fluxController.updateGlobalHideFrom);
router.post("/settings/hide-from/add", fluxController.addToGlobalHideFrom);
router.post(
  "/settings/hide-from/remove",
  fluxController.removeFromGlobalHideFrom,
);
router.get(
  "/settings/screenshot-block",
  fluxController.getScreenshotBlockSetting,
);
router.get("/:fluxId/analytics", fluxController.getFluxAnalytics);
router.post("/:fluxId/screenshot", fluxController.reportScreenshot);
router.get("/:fluxId/owner-settings", fluxController.getFluxOwnerSettings);
// User fluxes
router.get("/user/:userId", fluxController.getUserFluxes);
// ── Parameterized routes (/:fluxId must come after all static routes)
router.patch("/:fluxId/persistent", fluxController.toggleFluxPersistent);
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
router.patch("/:fluxId/comments/toggle", fluxController.toggleFluxComments);
// Archive
router.post("/:fluxId/archive", fluxController.archiveFlux);
// Reply
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
// Visibility / hiding (per-flux)
router.patch("/:fluxId/visibility", fluxController.updateFluxVisibility);
router.get("/:fluxId/visibility",   fluxController.getFluxVisibility);
router.patch("/:fluxId/hide-from", fluxController.hideFluxFromUser);
router.patch("/:fluxId/unhide-from", fluxController.unhideFluxFromUser);
// CRUD
router.get("/:fluxId", fluxController.getFluxById);
router.delete("/:fluxId", fluxController.deleteFlux);
export default router;
