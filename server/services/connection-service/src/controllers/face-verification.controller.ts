import { Request, Response } from "express";
import axios from "axios";
import ConnectionProfile from "../models/ConnectionProfile";
import * as faceService from "../services/face-verification.service";

const FACE_SERVICE_URL =
  process.env.FACE_DETECTOR_URL || "http://127.0.0.1:8002";

// ── Local type for faceVerification subdocument
interface IFaceVerification {
  status?: string;
  embeddingsRegistered?: boolean;
  registeredAt?: Date;
  verifiedAt?: Date;
  profileLocked?: boolean;
  similarity?: number;
  failedAttempts?: number;
  lastFailedAt?: Date;
  appealPending?: boolean;
  appealReason?: string;
  appealRequestedAt?: Date;
}

// 1. Register face embeddings from existing profile photos
//    POST /api/connection-profile/face/register
export const registerFaceFromProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id; // ← safe access

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Plain string query
    const profile = await ConnectionProfile.findOne({ userId });

    if (!profile) {
      res
        .status(404)
        .json({ success: false, message: "Connection profile not found" });
      return;
    }

    const photos = profile.photos.filter((p) => p.status !== "rejected");
    if (photos.length < 2) {
      res.status(400).json({
        success: false,
        message: "Minimum 2 profile photos required before face registration.",
      });
      return;
    }

    const fv = (profile.faceVerification || {}) as IFaceVerification;
    if (fv.status === "verified" && !fv.appealPending) {
      res.status(400).json({
        success: false,
        message: "Profile is already verified.",
      });
      return;
    }

    //  First check Python service is reachable
    try {
      await axios.get(`${FACE_SERVICE_URL}/health`, { timeout: 5000 });
    } catch {
      res.status(503).json({
        success: false,
        message:
          "Verification service is temporarily unavailable. Please try again in a moment.",
      });
      return;
    }

    //  Download photo buffers from Cloudinary
    const imageBuffers: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
    }[] = [];

    for (const photo of photos.slice(0, 4)) {
      try {
        const response = await axios.get(photo.url, {
          responseType: "arraybuffer",
          timeout: 15000,
        });
        imageBuffers.push({
          buffer: Buffer.from(response.data),
          mimetype: "image/jpeg",
          originalname: `photo_${photo.publicId}.jpg`,
        });
      } catch (fetchErr: any) {
        console.error(
          `[REGISTER FACE] Failed to fetch photo ${photo.url}:`,
          fetchErr.message,
        );
        // skip photos that can't be fetched — continue with others
      }
    }

    if (imageBuffers.length < 2) {
      res.status(422).json({
        success: false,
        message:
          "Could not fetch enough photos from storage. Please ensure your photos are uploaded correctly.",
      });
      return;
    }

    const result = await faceService.registerFaceEmbeddings(
      userId,
      imageBuffers,
    );

    if (!result.success) {
      res.status(422).json({ success: false, message: result.error });
      return;
    }

    await ConnectionProfile.updateOne(
      { userId },
      {
        $set: {
          "faceVerification.status": "pending_verification",
          "faceVerification.embeddingsRegistered": true,
          "faceVerification.registeredAt": new Date(),
          "faceVerification.failedAttempts": 0,
          "faceVerification.appealPending": false,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: `Face embeddings registered from ${result.embeddings_stored} photos. Ready for verification.`,
    });
  } catch (error: any) {
    console.error("[registerFaceFromProfile ERROR]", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Start liveness verification session
//    POST /api/connection-profile/face/start-session
export const startVerificationSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const profile = await ConnectionProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    const fv = (profile.faceVerification || {}) as IFaceVerification;

    if (!fv.embeddingsRegistered) {
      res.status(400).json({
        success: false,
        message: "Face embeddings not registered. Call /face/register first.",
      });
      return;
    }

    if ((fv.failedAttempts ?? 0) >= 3 && fv.lastFailedAt) {
      const hoursSince =
        (Date.now() - new Date(fv.lastFailedAt).getTime()) / 3600000;
      if (hoursSince < 24) {
        res.status(429).json({
          success: false,
          message: "Too many failed attempts. Account locked for 24 hours.",
          unlockAt: new Date(new Date(fv.lastFailedAt).getTime() + 86400000),
        });
        return;
      }
      await ConnectionProfile.updateOne(
        { userId },
        { $set: { "faceVerification.failedAttempts": 0 } },
      );
    }

    const result = await faceService.startVerificationSession(userId);
    if (!result.success) {
      res.status(502).json({ success: false, message: result.error });
      return;
    }

    res.status(200).json({
      success: true,
      session_id: result.session_id,
      challenge_sequence: result.challenge_sequence,
      expires_in_seconds: result.expires_in_seconds,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Submit live camera frame
//    POST /api/connection-profile/face/submit-frame
export const submitLivenessFrame = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { session_id } = req.body;
    const frameFile = (req as any).file as Express.Multer.File | undefined;

    if (!session_id) {
      res.status(400).json({ success: false, message: "session_id required" });
      return;
    }
    if (!frameFile) {
      res.status(400).json({ success: false, message: "frame image required" });
      return;
    }

    const result = await faceService.submitLivenessFrame(
      session_id,
      frameFile.buffer,
      frameFile.mimetype,
    );
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

// 4. Complete face verification (final match)
//    POST /api/connection-profile/face/verify
export const completeFaceVerification = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { session_id } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!session_id) {
      res.status(400).json({ success: false, message: "session_id required" });
      return;
    }

    const result = await faceService.verifyFaceMatch(session_id);

    if (result.verified) {
      await ConnectionProfile.updateOne(
        { userId },
        {
          $set: {
            "faceVerification.status": "verified",
            "faceVerification.verifiedAt": new Date(),
            "faceVerification.failedAttempts": 0,
            "faceVerification.appealPending": false,
            "faceVerification.similarity": result.similarity,
            "faceVerification.profileLocked": true,
          },
        },
      );
      res.status(200).json({
        success: true,
        verified: true,
        similarity: result.similarity,
        message: "Identity verified.",
      });
    } else {
      const profile = await ConnectionProfile.findOne({ userId });
      const fv = (profile?.faceVerification || {}) as IFaceVerification;
      const newFailCount = (fv.failedAttempts ?? 0) + 1;

      await ConnectionProfile.updateOne(
        { userId },
        {
          $set: {
            "faceVerification.failedAttempts": newFailCount,
            "faceVerification.lastFailedAt": new Date(),
            "faceVerification.status":
              newFailCount >= 3 ? "locked" : "pending_verification",
          },
        },
      );

      res.status(200).json({
        success: false,
        verified: false,
        similarity: result.similarity,
        failedAttempts: newFailCount,
        message:
          newFailCount >= 3
            ? "Too many failed attempts. Account locked for 24 hours."
            : result.message || "Face did not match profile photos.",
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Appeal re-verification
//    POST /api/connection-profile/face/appeal
export const submitVerificationAppeal = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { reason } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const profile = await ConnectionProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    const fv = (profile.faceVerification || {}) as IFaceVerification;

    if (fv.status !== "verified") {
      res.status(400).json({
        success: false,
        message: "Appeals are only available for verified profiles.",
      });
      return;
    }
    if (fv.appealPending) {
      res
        .status(400)
        .json({ success: false, message: "An appeal is already pending." });
      return;
    }

    await ConnectionProfile.updateOne(
      { userId },
      {
        $set: {
          "faceVerification.appealPending": true,
          "faceVerification.appealReason": reason || "",
          "faceVerification.appealRequestedAt": new Date(),
          "faceVerification.status": "appeal_pending",
          "faceVerification.failedAttempts": 0,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "Appeal submitted. Re-register your face to verify again.",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get verification status
//    GET /api/connection-profile/face/status
export const getVerificationStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const profile = await ConnectionProfile.findOne(
      { userId },
      { faceVerification: 1, photos: 1 },
    );

    if (!profile) {
      res.status(404).json({ success: false, message: "Profile not found" });
      return;
    }

    const fv = (profile.faceVerification || {}) as IFaceVerification;

    res.status(200).json({
      success: true,
      data: {
        status: fv.status ?? "not_started",
        verified: fv.status === "verified",
        embeddingsRegistered: fv.embeddingsRegistered ?? false,
        profileLocked: fv.profileLocked ?? false,
        verifiedAt: fv.verifiedAt ?? null,
        failedAttempts: fv.failedAttempts ?? 0,
        appealPending: fv.appealPending ?? false,
        photoCount: profile.photos.length,
        canStartVerification:
          (fv.embeddingsRegistered === true && fv.status !== "verified") ||
          fv.appealPending === true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
