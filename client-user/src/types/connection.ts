// ── Profile ───────────────────────────────────────────────────────
export interface ConnectionPhoto {
  url: string;
  publicId: string;
  isPrimary: boolean;
  isVerified: boolean;
  isAIGenerated: boolean;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FaceVerification {
  status: 'not_started' | 'pending_verification' | 'verified' | 'locked' | 'appeal_pending';
  verified: boolean;
  embeddingsRegistered: boolean;
  profileLocked: boolean;
  verifiedAt: string | null;
  failedAttempts: number;
  appealPending: boolean;
  photoCount: number;
  canStartVerification: boolean;
}

export interface ConnectionProfile {
  _id: string;
  userId: string;
  displayName: string;
  age: number;
  gender: string;
  location: { city: string; state: string; country: string };
  photos: ConnectionPhoto[];
  status: 'draft' | 'active' | 'paused' | 'suspended' | 'deleted';
  profileCompleteness: number;
  faceVerification?: FaceVerification;
}

// ── Face verification session ─────────────────────────────────────
export interface StartSessionResponse {
  success: boolean;
  session_id: string;
  challenge_sequence: PoseLabel[];
  expires_in_seconds: number;
}

export interface SubmitFrameResponse {
  status: string;
  detected_pose?: string;
  current_step: number;
  total_steps: number;
  completed_steps: string[];
  liveness_complete: boolean;
  message?: string;
}

export interface VerifyFaceResponse {
  success: boolean;
  verified: boolean;
  similarity: number;
  message: string;
  failedAttempts?: number;
}

export type PoseLabel = 'center' | 'left' | 'right' | 'up' | 'down';

// ── Photo upload ──────────────────────────────────────────────────
export interface UploadPhotosResponse {
  success: boolean;
  data: { photos: { url: string; publicId: string }[]; profileCompleteness: number };
  message: string;
}

// ── Purposes ──────────────────────────────────────────────────────
export interface TravelPurpose {
  _id?: string;
  destination: string;
  travelDates: { from: string; to: string };
  travelStyle: string;
  accommodation: string;
  budget: string;
}

export interface RelationshipPurpose {
  _id?: string;
  lookingFor: string;
  ageRange: { min: number; max: number };
  dealBreakers: string[];
}

export interface LocationPurpose {
  _id?: string;
  lookingFor: string;
  yourNeed: string;
  nearLocation: string;
  activities: string[];
}

export interface SkillPurpose {
  _id?: string;
  category: string;
  subCategory: string;
  stage: number;
}

// ── Connection requests 
export interface ConnectionRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  purposeCode: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface MatchSuggestion {
  userId: string;
  profileId: string;
  displayName: string;
  matchScore: number;
  matchReasons: string[];
  distance: number;
}