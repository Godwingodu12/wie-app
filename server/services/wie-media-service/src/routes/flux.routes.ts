import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as fluxController from "../controllers/flux.controller";

const router: express.Router = express.Router();

router.use(authenticate);
router.post("/create", upload.single("media"), fluxController.createFlux);
router.get("/feed", fluxController.getFluxFeed);
router.get("/mine", fluxController.getMyFluxes);
router.get("/all-mine", fluxController.getAllMyFluxes);
router.get("/archive", fluxController.getArchivedFluxes);
router.get("/user/:userId", fluxController.getUserFluxes);
router.post("/:fluxId/mention", fluxController.mentionFlux);
router.post("/:fluxId/view", fluxController.viewFlux);
router.post("/:fluxId/react", fluxController.reactToFlux);
router.post("/:fluxId/record-view", fluxController.recordView);
router.post("/:fluxId/remention", fluxController.reMentionFlux);
router.get("/:fluxId/rementions", fluxController.getReMentions);
router.get("/:fluxId/viewers", fluxController.getFluxViewers);
router.get("/:fluxId/view-list", fluxController.getViewers);
router.get("/:fluxId/mentions", fluxController.getFluxMentions);
router.get("/:fluxId", fluxController.getFluxById);
// Sticker routes
router.get("/stickers/trending", fluxController.getTrendingStickers);
router.get("/stickers/search", fluxController.searchStickers);
router.delete("/:fluxId", fluxController.deleteFlux);
router.patch("/:fluxId/visibility", fluxController.updateFluxVisibility);
router.patch("/:fluxId/hide-from", fluxController.hideFluxFromUser);
router.patch("/:fluxId/unhide-from", fluxController.unhideFluxFromUser);
export default router;
