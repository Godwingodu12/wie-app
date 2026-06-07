import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as fluxController from "../controllers/flux.controller";
const router: express.Router = express.Router();

router.use(authenticate);

// ── POST & REELS ENDPOINTS ──────────────────────────────────
// As per WIE_Posts_Reels_API_Documentation.pdf

// Static / Non-parameterized
router.post("/create", upload.array("media", 10), fluxController.createFlux); // Post creation supports up to 10 media items
router.get("/feed", fluxController.getFluxFeed); // Personalised post feed
router.get("/explore", fluxController.getExploreFeed);
router.get("/reels", fluxController.getReelsFeed);
router.get("/saved", fluxController.getSavedFluxes);
router.get("/user/:userId", fluxController.getUserFluxes);

// Parameterized Routes
router.get("/:fluxId", fluxController.getFluxById);
router.patch("/:fluxId", fluxController.updatePost);
router.delete("/:fluxId", fluxController.deleteFlux);

// Interactions
router.patch("/:fluxId/settings", fluxController.updatePostSettings);
router.post("/:fluxId/like", fluxController.toggleFluxLike);
router.get("/:fluxId/likes", fluxController.getFluxLikes);
router.post("/:fluxId/save", fluxController.toggleSaveFlux);
router.post("/:fluxId/share", fluxController.shareFlux);

// Tags
router.post("/:fluxId/tags", fluxController.setTaggedUsers);
router.get("/:fluxId/tags", fluxController.getTaggedUsers);

// Comments
router.post("/:fluxId/comments", fluxController.addFluxComment);
router.get("/:fluxId/comments", fluxController.getFluxComments);
router.delete("/:fluxId/comments/:commentId", fluxController.deleteFluxComment);
router.post("/:fluxId/comments/:commentId/reply", fluxController.addCommentReply);
router.post("/:fluxId/comments/:commentId/replies/:replyId/like", fluxController.likeCommentReply);

// Analytics
router.get("/:fluxId/analytics", fluxController.getFluxAnalytics);

export default router;
