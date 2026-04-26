import express from "express";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import * as diaryController from "../controllers/diary.controller";
const router: express.Router = express.Router();
router.use(authenticate);
//Global diary settings (MUST be before /:diaryId routes)
router.get("/settings", diaryController.getDiarySettings);
router.patch("/settings", diaryController.updateDiarySettings);
//Diary CRUD
router.post("/create", upload.single("cover"), diaryController.createDiary);
router.get("/user/:userId", diaryController.getUserDiaries);
router.post("/highlight", diaryController.highlightFlux);
router.get("/:diaryId", diaryController.getDiaryById);
router.patch("/:diaryId", upload.single("cover"), diaryController.editDiary);
router.delete("/:diaryId", diaryController.deleteDiary);
//Flux management inside a diary
router.post("/:diaryId/add-flux", diaryController.addFluxToDiary);
router.delete("/:diaryId/flux/:fluxId", diaryController.removeFluxFromDiary);
router.patch("/:diaryId/reorder", diaryController.reorderDiaryFluxes);
router.patch("/:diaryId/pin", diaryController.togglePinDiary);
export default router;
