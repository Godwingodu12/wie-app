import axios from "axios";
import FormData from "form-data";

const FACE_SERVICE_URL = process.env.FACE_DETECTOR_URL;
export interface RegisterFaceResult {
  success: boolean;
  embeddings_stored?: number;
  error?: string;
}

export interface StartSessionResult {
  success: boolean;
  session_id?: string;
  challenge_sequence?: string[];
  expires_in_seconds?: number;
  error?: string;
}

export interface SubmitFrameResult {
  status: string;
  detected_pose?: string;
  current_step?: number;
  total_steps?: number;
  completed_steps?: string[];
  liveness_complete?: boolean;
  message?: string;
}

export interface VerifyFaceResult {
  verified: boolean;
  liveness: boolean;
  similarity: number;
  threshold: number;
  status: string;
  message: string;
}

export interface PhotoMatchResult {
  matched: boolean;
  similarity: number;
  error?: string;
}

// ─────────────────────────────────────────────────────────────────
// 1. Register face embeddings (called during first photo upload)
//    Sends image buffers to Python → stores 128-d embeddings per user
// ─────────────────────────────────────────────────────────────────
export async function registerFaceEmbeddings(
  userId: string,
  imageBuffers: { buffer: Buffer; mimetype: string; originalname: string }[],
): Promise<RegisterFaceResult> {
  try {
    const form = new FormData();
    form.append("user_id", userId);

    imageBuffers.forEach((img) => {
      form.append("images", img.buffer, {
        filename: img.originalname || "photo.jpg",
        contentType: img.mimetype || "image/jpeg",
      });
    });

    const response = await axios.post(
      `${FACE_SERVICE_URL}/register-face`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000,
      },
    );

    return {
      success: true,
      embeddings_stored: response.data.embeddings_stored,
    };
  } catch (err: any) {
    const detail =
      err.response?.data?.detail ||
      "Failed to register face embeddings due to an internal service error.";
    return { success: false, error: detail };
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. Start a liveness verification session
//    Returns session_id + random challenge sequence
// ─────────────────────────────────────────────────────────────────
export async function startVerificationSession(
  userId: string,
): Promise<StartSessionResult> {
  try {
    const form = new FormData();
    form.append("user_id", userId);

    const response = await axios.post(
      `${FACE_SERVICE_URL}/start-verification`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 10000,
      },
    );

    return {
      success: true,
      session_id: response.data.session_id,
      challenge_sequence: response.data.challenge_sequence,
      expires_in_seconds: response.data.expires_in_seconds,
    };
  } catch (err: any) {
    const detail =
      err.response?.data?.detail ||
      "Failed to register face embeddings due to an internal service error.";
    return { success: false, error: detail };
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. Submit a single camera frame for liveness detection
//    Called every ~700ms from the frontend during head rotation
// ─────────────────────────────────────────────────────────────────
export async function submitLivenessFrame(
  sessionId: string,
  frameBuffer: Buffer,
  mimetype = "image/jpeg",
): Promise<SubmitFrameResult> {
  try {
    const form = new FormData();
    form.append("session_id", sessionId);
    form.append("frame", frameBuffer, {
      filename: "frame.jpg",
      contentType: mimetype,
    });

    const response = await axios.post(
      `${FACE_SERVICE_URL}/submit-frame`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 15000,
      },
    );

    return response.data;
  } catch (err: any) {
    return { status: "error", message: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────
// 4. Final face match — called after liveness completes
//    Compares best captured frame against stored profile embeddings
// ─────────────────────────────────────────────────────────────────
export async function verifyFaceMatch(
  sessionId: string,
): Promise<VerifyFaceResult> {
  try {
    const form = new FormData();
    form.append("session_id", sessionId);

    const response = await axios.post(`${FACE_SERVICE_URL}/verify-face`, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    });

    return response.data;
  } catch (err: any) {
    return {
      verified: false,
      liveness: false,
      similarity: 0,
      threshold: 0.65,
      status: "error",
      message: err.response?.data?.detail || err.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// 5. Check a single new photo against existing verified embeddings
//    Used on every new photo upload AFTER profile is already verified
//    → Prevents uploading another person's photo later
// ─────────────────────────────────────────────────────────────────
export async function checkPhotoMatchesProfile(
  userId: string,
  imageBuffer: Buffer,
  mimetype = "image/jpeg",
): Promise<PhotoMatchResult> {
  try {
    // Re-use the register endpoint with a single image in check-only mode
    // We do a register + immediate verify pattern:
    //   1. Temporarily register single image under a check-session user ID
    //   2. Compare against the real user's stored embeddings

    // Simpler: we call a dedicated /check-photo endpoint
    const form = new FormData();
    form.append("user_id", userId);
    form.append("photo", imageBuffer, {
      filename: "check.jpg",
      contentType: mimetype,
    });

    const response = await axios.post(`${FACE_SERVICE_URL}/check-photo`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    return {
      matched: response.data.matched,
      similarity: response.data.similarity,
    };
  } catch (err: any) {
    return {
      matched: false,
      similarity: 0,
      error: err.response?.data?.detail || err.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// 6. Health check — verifies Python service is reachable
// ─────────────────────────────────────────────────────────────────
export async function checkFaceServiceHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${FACE_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return res.data?.status === "running";
  } catch {
    return false;
  }
}
