import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as fluxController from "../controllers/flux.controller";
const router: express.Router = express.Router();

router.use(authenticate);

// ── FLUX (STORY) ENDPOINTS ──────────────────────────────────
// As per WIE_Flux_Media_API_Documentation.pdf

// Static / Global
router.post("/create", upload.array("media", 1), fluxController.createFlux);
router.get("/feed", fluxController.getStoriesFeed); // Feed of active stories
router.get("/mine", fluxController.getMyFluxes);
router.get("/archive", fluxController.getArchivedFluxes);

// Settings
router.get("/settings", fluxController.getFluxSettings);
router.patch("/settings", fluxController.updateFluxSettings);

// Close Friends
router.get("/close-friends", fluxController.getCloseFriends);
router.post("/close-friends/save", fluxController.saveCloseFriends);

// Specific Flux Interactions
router.get("/:fluxId", fluxController.getFluxById);
router.delete("/:fluxId", fluxController.deleteFlux);
router.post("/:fluxId/view", fluxController.recordView);
router.get("/:fluxId/viewers", fluxController.getFluxViewers);
router.post("/:fluxId/react", fluxController.reactToFlux);
router.post("/:fluxId/reply", fluxController.replyFlux);
router.post("/:fluxId/share", fluxController.shareFlux);
router.post("/:fluxId/archive", fluxController.archiveFlux);

// Mentions
router.get("/:fluxId/mentions", fluxController.getFluxMentions);

export default router;
