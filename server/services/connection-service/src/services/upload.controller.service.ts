import { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import { UploadService } from "./upload.service";
import ConnectionProfile from "../models/ConnectionProfile";
import { checkPhotoMatchesProfile } from "./face-verification.service";

const uploadService = new UploadService();
const FACE_SERVICE_URL = process.env.FACE_DETECTOR_URL;
const MAX_PHOTOS_ALLOWED = 6;

const ALLOWED_MIMETYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

// ── Call Python /validate-photo for a single file 
async function validatePhotoWithPython(
  fileBuffer: Buffer,
  mimetype: string,
  originalname: string,
): Promise<{ passed: boolean; code: string; message: string }> {
  try {
    const form = new FormData();
    form.append("photo", fileBuffer, {
      filename: originalname || "photo.jpg",
      contentType: mimetype,
    });

    const response = await axios.post(
      `${FACE_SERVICE_URL}/validate-photo`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 20000,
      },
    );

    return response.data;
  } catch (err: any) {
    // Log the full error detail so you can see exactly what's failing
    console.error("[PHOTO VALIDATE] Failed to reach face service:");
    console.error("  URL        :", `${FACE_SERVICE_URL}/validate-photo`);
    console.error("  Error code :", err.code);            // e.g. ECONNREFUSED
    console.error("  HTTP status:", err.response?.status);
    console.error("  Message    :", err.message);
    console.error("  Response   :", err.response?.data);

    // If the face service is unreachable (network/startup issue),
    // allow the upload to proceed rather than blocking the user.
    // The face-match check later (checkPhotoMatchesProfile) will
    // still enforce identity matching for verified profiles.
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT") {
      console.warn("[PHOTO VALIDATE] Face service is down — skipping validation, allowing upload.");
      return {
        passed: true,
        code: "service_unavailable",
        message: "Validation service unavailable — upload allowed.",
      };
    }

    // For 4xx/5xx responses from the face service itself, surface the real message
    const serverMessage = err.response?.data?.message || err.response?.data?.detail;
    if (serverMessage) {
      return {
        passed: false,
        code: err.response?.data?.code || "validation_error",
        message: serverMessage,
      };
    }

    // Unknown error — allow through and log for investigation
    console.warn("[PHOTO VALIDATE] Unknown error — allowing upload through.");
    return {
      passed: true,
      code: "unknown_error",
      message: "Validation check skipped due to an unexpected error.",
    };
  }
}

// Upload profile photos
export const uploadProfilePhotos = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id as string;
    const files = req.files as Express.Multer.File[];

    // ── Basic guards
    if (!userId) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: "No files uploaded" });
      return;
    }

    if (files.length > MAX_PHOTOS_ALLOWED) {
      res.status(400).json({
        success: false,
        message: `Maximum ${MAX_PHOTOS_ALLOWED} photos allowed per upload.`,
      });
      return;
    }

    // ── File type validation
    for (const file of files) {
      if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
        res.status(400).json({
          success: false,
          message: `Invalid file type: ${file.originalname}. Allowed formats: JPG, JPEG, PNG, WebP, AVIF.`,
        });
        return;
      }
      // 25MB hard limit
      if (file.size > 25 * 1024 * 1024) {
        res.status(400).json({
          success: false,
          message: `File ${file.originalname} exceeds the 25 MB size limit.`,
        });
        return;
      }
    }

    // ── FIX: query by plain string — NOT ObjectId
    // userId in ConnectionProfile schema is type String.
    // Wrapping with new mongoose.Types.ObjectId() throws:
    // "input must be a 24 character hex string..." when JWT sub ≠ ObjectId format.
    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res.status(404).json({
        success: false,
        message:
          "Connection profile not found. Please create your profile first.",
      });
      return;
    }

    // ── Check total photo count ───────────────────────────────────
    if (profile.photos.length + files.length > MAX_PHOTOS_ALLOWED) {
      res.status(400).json({
        success: false,
        message: `You already have ${profile.photos.length} photo(s). Maximum ${MAX_PHOTOS_ALLOWED} total allowed.`,
      });
      return;
    }

    // ── Per-image validation via Python service ───────────────────
    for (const file of files) {
      const validation = await validatePhotoWithPython(
        file.buffer,
        file.mimetype,
        file.originalname,
      );

      if (!validation.passed) {
        res.status(422).json({
          success: false,
          code: validation.code,
          message: validation.message,
          filename: file.originalname,
        });
        return;
      }
    }

    // ── Face verification check (only after profile is verified) ──
    if (profile.faceVerification?.status === "verified") {
      for (const file of files) {
        const match = await checkPhotoMatchesProfile(
          userId,
          file.buffer,
          file.mimetype,
        );
        if (!match.matched) {
          res.status(422).json({
            success: false,
            code: "face_mismatch",
            message:
              "Uploaded photo does not match your verified identity. Only your own photos are allowed.",
            similarity: match.similarity,
          });
          return;
        }
      }
    }

    // ── Upload to Cloudinary ──────────────────────────────────────
    const uploadedPhotos = await uploadService.uploadMultiplePhotos(
      files,
      userId,
    );

    // AI check (placeholder — returns false until real model is integrated)
    const withAI = await Promise.all(
      uploadedPhotos.map(async (p) => ({
        ...p,
        isAIGenerated: await uploadService.detectAIImage(p.url),
      })),
    );

    if (withAI.some((p) => p.isAIGenerated)) {
      await Promise.all(
        withAI.map((p) => uploadService.deletePhoto(p.publicId)),
      );
      res.status(400).json({
        success: false,
        code: "ai_image_detected",
        message:
          "AI-generated images detected. Please use real photos of yourself.",
      });
      return;
    }

    // ── Add photos to profile document ────────────────────────────
    const hasPrimary = profile.photos.some((p) => p.isPrimary);

    uploadedPhotos.forEach((photo, index) => {
      profile.photos.push({
        url: photo.url,
        publicId: photo.publicId,
        isPrimary: !hasPrimary && index === 0,
        isVerified: false,
        isAIGenerated: false,
        uploadedAt: new Date(),
        status: "pending",
      } as any);
    });

    profile.profileCompleteness = profile.calculateCompleteness();
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        photos: uploadedPhotos,
        profileCompleteness: profile.profileCompleteness,
      },
      message: `${uploadedPhotos.length} photo(s) uploaded successfully.`,
    });
  } catch (error: any) {
    console.error("[uploadProfilePhotos ERROR]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// Delete profile photo
// ─────────────────────────────────────────────────────────────────
export const deleteProfilePhoto = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id as string;
    const { publicId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    // ── FIX: plain string query ───────────────────────────────────
    const profile = await ConnectionProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    const photoIndex = profile.photos.findIndex((p) => p.publicId === publicId);
    if (photoIndex === -1) {
      res.status(404).json({ success: false, message: "Photo not found" });
      return;
    }

    // Block deletion of verified/locked photos
    if (
      profile.faceVerification?.profileLocked &&
      profile.photos[photoIndex].isVerified
    ) {
      res.status(403).json({
        success: false,
        message:
          "Verified photos cannot be deleted. Submit an appeal to update your profile.",
      });
      return;
    }

    await uploadService.deletePhoto(publicId);
    profile.photos.splice(photoIndex, 1);

    if (profile.photos.length > 0 && !profile.photos.some((p) => p.isPrimary)) {
      profile.photos[0].isPrimary = true;
    }

    profile.profileCompleteness = profile.calculateCompleteness();
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
      data: { profileCompleteness: profile.profileCompleteness },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// Set primary photo
// ─────────────────────────────────────────────────────────────────
export const setPrimaryPhoto = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id as string;
    const { publicId } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    // ── FIX: plain string query ───────────────────────────────────
    const profile = await ConnectionProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    const photo = profile.photos.find((p) => p.publicId === publicId);
    if (!photo) {
      res.status(404).json({ success: false, message: "Photo not found" });
      return;
    }

    if (profile.faceVerification?.profileLocked) {
      const currentPrimary = profile.photos.find((p) => p.isPrimary);
      if (currentPrimary?.isVerified) {
        res.status(403).json({
          success: false,
          message:
            "Primary verified photo cannot be reordered. Submit an appeal to change.",
        });
        return;
      }
    }

    profile.photos.forEach((p) => (p.isPrimary = false));
    photo.isPrimary = true;
    await profile.save();

    res
      .status(200)
      .json({ success: true, message: "Primary photo set successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replaceProfilePhoto = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id as string;
    const { publicId } = req.params;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!file) {
      res
        .status(400)
        .json({ success: false, message: "No replacement photo provided" });
      return;
    }

    if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed: JPG, PNG, WebP, AVIF.`,
      });
      return;
    }

    const profile = await ConnectionProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    // Find the photo being replaced
    const photoIndex = profile.photos.findIndex((p) => p.publicId === publicId);
    if (photoIndex === -1) {
      res.status(404).json({ success: false, message: "Photo not found" });
      return;
    }

    // Block replacing verified/locked photos
    if (
      profile.faceVerification?.profileLocked &&
      profile.photos[photoIndex].isVerified
    ) {
      res.status(403).json({
        success: false,
        message: "Verified photos cannot be replaced.",
      });
      return;
    }

    // Validate new photo with Python service
    const validation = await validatePhotoWithPython(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    if (!validation.passed) {
      res.status(422).json({
        success: false,
        code: validation.code,
        message: validation.message,
      });
      return;
    }

    // Delete old photo from Cloudinary
    try {
      await uploadService.deletePhoto(publicId);
    } catch {
      /* ignore cloudinary delete error */
    }

    // Upload new photo
    const [uploaded] = await uploadService.uploadMultiplePhotos([file], userId);

    // Replace in profile array
    const wasPrimary = profile.photos[photoIndex].isPrimary;
    profile.photos[photoIndex] = {
      url: uploaded.url,
      publicId: uploaded.publicId,
      isPrimary: wasPrimary,
      isVerified: false,
      isAIGenerated: false,
      uploadedAt: new Date(),
      status: "pending",
    } as any;

    profile.profileCompleteness = profile.calculateCompleteness();
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        photo: uploaded,
        profileCompleteness: profile.profileCompleteness,
      },
      message: "Photo replaced successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
