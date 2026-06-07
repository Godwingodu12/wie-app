import axios, { AxiosInstance } from "axios";
import type {
  ConnectionProfile,
  ConnectionPhoto,
  FaceVerification,
  StartSessionResponse,
  SubmitFrameResponse,
  VerifyFaceResponse,
  UploadPhotosResponse,
  MatchSuggestion,
  ConnectionRequest,
} from "../types/connection";

const CONNECTION_API_URL =
  process.env.NEXT_PUBLIC_CONNECTION_API_URL || "http://localhost:5012/api";

function makeClient(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
  });

  // Attach JWT from localStorage on every request
  client.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Redirect to login on 401
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return Promise.reject(err);
    },
  );

  return client;
}

const profileApi = makeClient(`${CONNECTION_API_URL}/connection-profile`);
const purposeApi = makeClient(`${CONNECTION_API_URL}/connection-purpose`);
const matchApi = makeClient(`${CONNECTION_API_URL}/connection-match`);
const requestApi = makeClient(`${CONNECTION_API_URL}/connection-request`);

// PROFILE
export const createProfile = async (data: Partial<ConnectionProfile>) => {
  const res = await profileApi.post("/create-profile", data);
  return res.data;
};

export const getProfile = async (): Promise<{
  success: boolean;
  data: ConnectionProfile;
}> => {
  const res = await profileApi.get("/get-profile");
  return res.data;
};
export const getProfileStatus = async () => {
  const res = await profileApi.get("/profile-status");
  return res.data;
};
export const getProfileById = async (profileId: string) => {
  const res = await profileApi.get(`/get-profile/${profileId}`);
  return res.data;
};

export const updateProfile = async (data: Partial<ConnectionProfile>) => {
  const res = await profileApi.put("/update-profile", data);
  return res.data;
};

export const updateStatus = async (status: string) => {
  const res = await profileApi.patch("/update-status", { status });
  return res.data;
};

export const updatePrivacy = async (privacy: Record<string, any>) => {
  const res = await profileApi.patch("/update-privacy", privacy);
  return res.data;
};

export const acceptTerms = async () => {
  const res = await profileApi.post("/accept-terms");
  return res.data;
};

// PHOTOS
export const uploadPhotos = async (
  files: File[],
): Promise<UploadPhotosResponse> => {
  const form = new FormData();
  files.forEach((f) => form.append("photos", f));
  const res = await profileApi.post("/upload-photos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deletePhoto = async (publicId: string) => {
  const res = await profileApi.delete(
    `/delete-photo/${encodeURIComponent(publicId)}`,
  );
  return res.data;
};

export const getPhotos = async (): Promise<{
  success: boolean;
  data: {
    photos: ConnectionPhoto[];
    count: number;
    canUpload: boolean;
    remaining: number;
  };
}> => {
  const res = await profileApi.get("/get-photos");
  return res.data;
};

export const replacePhoto = async (
  publicId: string,
  file: File,
): Promise<{
  success: boolean;
  data: {
    photo: { url: string; publicId: string };
    profileCompleteness: number;
  };
  message: string;
}> => {
  const form = new FormData();
  form.append("photo", file);
  const res = await profileApi.patch(
    `/replace-photo/${encodeURIComponent(publicId)}`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
};
export const setPrimaryPhoto = async (publicId: string) => {
  const res = await profileApi.patch("/set-primary-photo", { publicId });
  return res.data;
};

// FACE VERIFICATION
/** Step 1 — register embeddings from already-uploaded profile photos */
export const registerFaceFromProfile = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const res = await profileApi.post("/face/register");
  return res.data;
};

/** Step 2 — get session_id + challenge sequence */
export const startFaceSession = async (): Promise<StartSessionResponse> => {
  const res = await profileApi.post("/face/start-session");
  return res.data;
};

/** Step 3 — submit one camera frame (called every ~700ms) */
export const submitFaceFrame = async (
  sessionId: string,
  frameBlob: Blob,
): Promise<SubmitFrameResponse> => {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("frame", frameBlob, "frame.jpg");
  const res = await profileApi.post("/face/submit-frame", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/** Step 4 — run final face match after liveness is complete */
export const completeFaceVerification = async (
  sessionId: string,
): Promise<VerifyFaceResponse> => {
  const res = await profileApi.post("/face/verify", { session_id: sessionId });
  return res.data;
};

/** Get current verification status */
export const getFaceVerificationStatus = async (): Promise<{
  success: boolean;
  data: FaceVerification;
}> => {
  const res = await profileApi.get("/face/status");
  return res.data;
};

/** Submit re-verification appeal */
export const submitVerificationAppeal = async (reason: string) => {
  const res = await profileApi.post("/face/appeal", { reason });
  return res.data;
};

// PURPOSES

export const createTravelPurpose = async (data: any) =>
  (await purposeApi.post("/create-travel", data)).data;
export const updateTravelPurpose = async (id: string, data: any) =>
  (await purposeApi.put(`/update-travel/${id}`, data)).data;
export const getTravelPurpose = async (id: string) =>
  (await purposeApi.get(`/get-travel/${id}`)).data;

export const createRelationshipPurpose = async (data: any) =>
  (await purposeApi.post("/create-relationship", data)).data;
export const updateRelationshipPurpose = async (id: string, data: any) =>
  (await purposeApi.put(`/update-relationship/${id}`, data)).data;

export const createLocationPurpose = async (data: any) =>
  (await purposeApi.post("/create-location", data)).data;
export const updateLocationPurpose = async (id: string, data: any) =>
  (await purposeApi.put(`/update-location/${id}`, data)).data;

export const createProfessionalPurpose = async (data: any) =>
  (await purposeApi.post("/create-professional", data)).data;
export const createConcertPurpose = async (data: any) =>
  (await purposeApi.post("/create-concert", data)).data;
export const createSkillPurpose = async (data: any) =>
  (await purposeApi.post("/create-skill", data)).data;
export const createDayOutingPurpose = async (data: any) =>
  (await purposeApi.post("/create-day-outing", data)).data;

export const getUserPurposes = async () =>
  (await purposeApi.get("/get-user-purposes")).data;
export const deletePurpose = async (purposeCode: string, id: string) =>
  (await purposeApi.delete(`/delete-purpose/${purposeCode}/${id}`)).data;

// MATCHING
export const getMatchSuggestions = async (
  purposeCode: string,
  limit = 50,
): Promise<{ success: boolean; data: MatchSuggestion[] }> => {
  const res = await matchApi.get(`/get-suggestions/${purposeCode}`, {
    params: { limit },
  });
  return res.data;
};

export const calculateMatchScore = async (
  targetUserId: string,
  purposeCode: string,
) => {
  const res = await matchApi.post("/calculate-score", {
    targetUserId,
    purposeCode,
  });
  return res.data;
};

export const trackView = async (suggestedUserId: string, purposeCode: string) =>
  (await matchApi.post(`/track-view/${suggestedUserId}`, { purposeCode })).data;

export const trackSkip = async (suggestedUserId: string, purposeCode: string) =>
  (await matchApi.post(`/track-skip/${suggestedUserId}`, { purposeCode })).data;

export const getConnections = async (page = 1, limit = 20, status?: string) =>
  (await matchApi.get("/get-connections", { params: { page, limit, status } }))
    .data;

export const getConnectionById = async (id: string) =>
  (await matchApi.get(`/get-connection/${id}`)).data;

export const provideFeedback = async (connectionId: string, data: any) =>
  (await matchApi.post(`/provide-feedback/${connectionId}`, data)).data;

// CONNECTION REQUESTS
export const sendConnectionRequest = async (data: {
  receiverId: string;
  purposeCode: string;
  message?: string;
}): Promise<{ success: boolean; data: ConnectionRequest }> => {
  const res = await requestApi.post("/send-request", data);
  return res.data;
};

export const getSentRequests = async () =>
  (await requestApi.get("/get-sent-requests")).data;
export const getReceivedRequests = async () =>
  (await requestApi.get("/get-received-requests")).data;
export const getRequestById = async (id: string) =>
  (await requestApi.get(`/get-request/${id}`)).data;

export const acceptRequest = async (requestId: string) =>
  (await requestApi.post(`/accept-request/${requestId}`)).data;

export const rejectRequest = async (requestId: string) =>
  (await requestApi.post(`/reject-request/${requestId}`)).data;

export const cancelRequest = async (requestId: string) =>
  (await requestApi.post(`/cancel-request/${requestId}`)).data;

export const markRequestViewed = async (requestId: string) =>
  (await requestApi.patch(`/mark-viewed/${requestId}`)).data;
