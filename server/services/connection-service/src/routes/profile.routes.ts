import express from "express";
import * as profileService from "../services/profile.service";
import * as uploadControllerService from "../services/upload.controller.service";
import * as faceVerificationController from "../controllers/face-verification.controller";
import { upload } from "../services/upload.service";
import { authMiddleware } from "../middleware/auth.middleware";

const router: express.Router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Profile management routes
router.post("/create-profile", profileService.createProfile);
router.get("/get-profile", profileService.getProfile);
router.get("/profile-status", profileService.getProfileStatus);
router.get("/get-photos", profileService.getPhotos);
router.get("/get-profile/:profileId", profileService.getProfileById);
router.put("/update-profile", profileService.updateProfile);
router.patch("/update-status", profileService.updateStatus);
router.patch("/update-privacy", profileService.updatePrivacySettings);
router.post("/accept-terms", profileService.acceptTerms);
router.post("/add-photos", profileService.addPhotos);
router.patch("/increment-analytics", profileService.incrementAnalytics);

// Photo management routes
router.post(
  "/upload-photos",
  upload.array("photos", 8),
  uploadControllerService.uploadProfilePhotos,
);
router.delete(
  "/delete-photo/:publicId",
  uploadControllerService.deleteProfilePhoto,
);
router.patch(
  "/replace-photo/:publicId",
  upload.single("photo"),
  uploadControllerService.replaceProfilePhoto,
);

router.patch("/set-primary-photo", uploadControllerService.setPrimaryPhoto);
// Face verification routes
router.post(
  "/face/register",
  faceVerificationController.registerFaceFromProfile,
);
router.post(
  "/face/start-session",
  faceVerificationController.startVerificationSession,
);
router.post(
  "/face/submit-frame",
  upload.single("frame"),
  faceVerificationController.submitLivenessFrame,
);
router.post(
  "/face/verify",
  faceVerificationController.completeFaceVerification,
);
router.post(
  "/face/appeal",
  faceVerificationController.submitVerificationAppeal,
);
router.get("/face/status", faceVerificationController.getVerificationStatus);

export default router;
