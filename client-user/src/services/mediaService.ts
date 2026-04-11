import axios, { AxiosProgressEvent } from "axios";
import type { TextLayer } from "@/components/post/actions/StoryTextCanvas";
const MEDIA_API_URL =
  process.env.NEXT_PUBLIC_MEDIA_API_URL || "http://localhost:5010/api";

const mediaApi = axios.create({
  baseURL: MEDIA_API_URL,
  headers: { "Content-Type": "application/json" },
});

mediaApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

mediaApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Media API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export type FluxVisibility =
  | "public"
  | "followers"
  | "close_friends"
  | "only_me";
export type FluxMediaType = "image" | "video";
export type RingStatus = "unseen" | "seen" | "none";

export interface FluxView {
  viewerId: string;
  viewedAt: string;
}

export interface FluxReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface FluxReply {
  senderId: string;
  message: string;
  createdAt: string;
}

export interface Flux {
  _id: string;
  userId: string;
  mediaUrl: string;
  mediaType: FluxMediaType;
  caption?: string;
  visibility: FluxVisibility;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  stickers?: Record<string, any>[];
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartAt?: number;
  musicPreviewUrl?: string;
  musicAlbumArt?: string;
  musicMode?: "music_only" | "lyrics";
  musicLyricsStyle?: "karaoke" | "line" | "floating";
  musicTrimStart?: number;
  musicTrimEnd?: number;
  locationLabel?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
  locationCategory?: string;
  locationStickerX?: number;
  locationStickerY?: number;
  locationStickerTheme?: number;
  duration?: 15 | 30 | 60;
  textLayers?: TextLayer[];
  textBg?: string;
  filterName?: string;
  filterValue?: string;
  overlays?: Record<string, any>[];
  // flat viewer list (unique, populated by $addToSet)
  viewers: string[];
  hiddenFrom: string[];
  views: FluxView[];
  reactions: FluxReaction[];
  replies: FluxReply[];
  expiresAt: string;
  isArchived: boolean;
  isDeleted: boolean;
  // virtuals returned by toJSON
  viewCount: number;
  reactionCount: number;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeedFluxGroup {
  _id: string; // ownerId
  fluxes: Partial<Flux>[];
  latestAt: string;
  isSelf: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    profile_picture: string;
    account_privacy: string;
    is_verified: boolean;
  } | null;
}

export interface DiaryFlux {
  fluxId: string;
  mediaUrl: string;
  mediaType: FluxMediaType;
  caption?: string;
  addedAt: string;
  // Music
  musicTitle?: string;
  musicArtist?: string;
  musicPreviewUrl?: string;
  musicAlbumArt?: string;
  musicStartAt?: number;
  // Location
  locationLabel?: string;
  locationStickerX?: number;
  locationStickerY?: number;
  locationStickerTheme?: number;
}

export interface Diary {
  _id: string;
  userId: string;
  title: string;
  coverImage?: string;
  fluxes: DiaryFlux[];
  visibility: FluxVisibility;
  fluxCount: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface FluxViewersResponse {
  viewers: {
    id: string;
    username: string;
    name: string;
    profile_picture: string;
    is_verified: boolean;
  }[];
  reactions: FluxReaction[];
  viewCount: number;
  total: number;
  // Optional owner info some backends embed in the response
  owner?: {
    username?: string;
    name?: string;
    profile_picture?: string;
    profilePicture?: string;
    avatar?: string;
  };
  fluxOwner?: {
    username?: string;
    name?: string;
    profile_picture?: string;
    profilePicture?: string;
    avatar?: string;
  };
  user?: {
    username?: string;
    name?: string;
    profile_picture?: string;
    profilePicture?: string;
    avatar?: string;
  };
}
export interface CreateFluxOptions {
  caption?: string;
  visibility?: FluxVisibility;
  // Music
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartAt?: number;
  musicPreviewUrl?: string;
  musicAlbumArt?: string;
  musicMode?: "music_only" | "lyrics";
  musicLyricsStyle?: "karaoke" | "line" | "floating";
  musicTrimStart?: number;
  musicTrimEnd?: number;
  // Location sticker
  locationLabel?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
  locationCategory?: string;
  locationStickerX?: number;
  locationStickerY?: number;
  duration?: 15 | 30 | 60;
  textLayers?: TextLayer[];
  textBg?: string;
  filterName?: string;
  filterValue?: string;
  locationStickerTheme?: number;
  stickers?: Record<string, any>[];
  mentions?: string[];
  overlays?: Record<string, any>[];
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export interface CreateDiaryOptions {
  title: string;
  visibility?: FluxVisibility;
  coverFile?: File;
  fluxIds?: string[];
}

export interface EditDiaryOptions {
  title?: string;
  visibility?: FluxVisibility;
  coverFile?: File;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Flux — CRUD
export const createFlux = async (
  file: File | string | null,
  options: CreateFluxOptions = {},
): Promise<Flux> => {
  const { onUploadProgress, stickers, ...fields } = options;
  const formData = new FormData();

  if (file instanceof File) {
    formData.append("media", file);
  } else if (typeof file === "string" && file.startsWith("http")) {
    formData.append("mediaUrl", file);
  }
  if (fields.caption) formData.append("caption", fields.caption);
  if (fields.visibility) formData.append("visibility", fields.visibility);
  // Music
  if (fields.musicId) formData.append("musicId", fields.musicId);
  if (fields.musicTitle) formData.append("musicTitle", fields.musicTitle);
  if (fields.musicArtist) formData.append("musicArtist", fields.musicArtist);
  if (fields.musicStartAt !== undefined)
    formData.append("musicStartAt", String(fields.musicStartAt));
  if (fields.musicPreviewUrl)
    formData.append("musicPreviewUrl", fields.musicPreviewUrl);
  if (fields.musicAlbumArt)
    formData.append("musicAlbumArt", fields.musicAlbumArt);
  // Location
  if (fields.locationLabel)
    formData.append("locationLabel", fields.locationLabel);
  if (fields.locationPlaceId)
    formData.append("locationPlaceId", fields.locationPlaceId);
  if (fields.locationLat !== undefined)
    formData.append("locationLat", String(fields.locationLat));
  if (fields.locationLng !== undefined)
    formData.append("locationLng", String(fields.locationLng));
  if (fields.locationCategory)
    formData.append("locationCategory", fields.locationCategory);
  if (fields.locationStickerX !== undefined)
    formData.append("locationStickerX", String(fields.locationStickerX));
  if (fields.locationStickerY !== undefined)
    formData.append("locationStickerY", String(fields.locationStickerY));
  if (fields.locationStickerTheme !== undefined)
    formData.append(
      "locationStickerTheme",
      String(fields.locationStickerTheme),
    );
  if (options.duration) formData.append("duration", String(options.duration));
  // Text story data
  if (fields.textLayers && fields.textLayers.length > 0)
    formData.append("textLayers", JSON.stringify(fields.textLayers));
  if (fields.textBg) formData.append("textBg", fields.textBg);
  if (fields.filterName) formData.append("filterName", fields.filterName);
  if (fields.filterValue) formData.append("filterValue", fields.filterValue);
  // Overlays
  if (stickers) formData.append("stickers", JSON.stringify(stickers));
  if (fields.overlays)
    formData.append("overlays", JSON.stringify(fields.overlays));
  if (fields.mentions && fields.mentions.length > 0)
    formData.append("mentions", JSON.stringify(fields.mentions));
  const res = await mediaApi.post<ApiResponse<Flux>>("/flux/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
  return res.data.data;
};

/**
 * GET /flux/feed — all users with active fluxes the viewer follows.
 * Returns grouped by user, ordered by recency + interaction.
 */
export const getFluxFeed = async (): Promise<FeedFluxGroup[]> => {
  const res = await mediaApi.get<ApiResponse<FeedFluxGroup[]>>("/flux/feed");
  return res.data.data;
};
/**
 * POST /flux/invalidate-feed
 * Call this immediately after User A follows User B
 * so User B's fluxes appear in User A's feed without waiting for cache TTL.
 */
export const invalidateFluxFeedCache = async (ownerId: string): Promise<void> => {
  await mediaApi.post("/flux/invalidate-feed", { ownerId });
};
/**
 * GET /flux/mine — current user's own active fluxes, newest first.
 * Used by the flux-view page.
 */
export const getMyFluxes = async (): Promise<Flux[]> => {
  const res = await mediaApi.get<ApiResponse<Flux[]>>("/flux/mine");
  return res.data.data;
};

/**
 * GET /flux/all-mine — all non-deleted fluxes (active + expired + archived).
 * Used by diary creation to show full story history.
 */
export const getAllMyFluxes = async (): Promise<Flux[]> => {
  try {
    const res = await mediaApi.get<ApiResponse<Flux[]>>("/flux/all-mine");

    if (!res.data.success) {
      console.error("[getAllMyFluxes] API error:", res.data.message);
      return [];
    }

    return res.data.data ?? [];
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;
    console.error(`[getAllMyFluxes] ${status ?? "Network"} error: ${message}`);

    if (status === 401) {
      console.warn(
        "[getAllMyFluxes] Token missing or expired — user may need to log in again",
      );
    }

    return [];
  }
};
/**
 * GET /flux/user/:userId — all active fluxes for any user profile.
 */
export const getUserFluxes = async (userId: string): Promise<Flux[]> => {
  const res = await mediaApi.get<ApiResponse<Flux[]>>(`/flux/user/${userId}`);
  return res.data.data;
};

/**
 * GET /flux/archive — own expired / archived fluxes.
 */
export const getArchivedFluxes = async (): Promise<Flux[]> => {
  const res = await mediaApi.get<ApiResponse<Flux[]>>("/flux/archive");
  return res.data.data;
};
/**
 * PATCH /flux/:fluxId/persistent — toggle no-expiry "pinned story"
 */
export const toggleFluxPersistent = async (
  fluxId: string,
): Promise<{ isPersistent: boolean; message: string }> => {
  const res = await mediaApi.patch(`/flux/${fluxId}/persistent`);
  return res.data;
};
/**
 * POST /flux/:fluxId/archive — toggle archive on a flux (owner only).
 */
export const archiveFlux = async (
  fluxId: string,
): Promise<{ isArchived: boolean; message: string }> => {
  const res = await mediaApi.post(`/flux/${fluxId}/archive`);
  return res.data;
};

/**
 * PATCH /flux/:fluxId/comments/toggle — owner toggles comments on/off.
 */
export const toggleFluxComments = async (
  fluxId: string,
): Promise<{ commentsDisabled: boolean; message: string }> => {
  const res = await mediaApi.patch(`/flux/${fluxId}/comments/toggle`);
  return res.data;
};

/**
 * POST /diary/highlight — add flux to a diary or auto-create one.
 * Returns action: 'added' | 'created' | 'pick' (user needs to choose diary)
 */
export const highlightFlux = async (
  fluxId: string,
  diaryId?: string,
  newDiaryTitle?: string,
): Promise<{
  success: boolean;
  action: "added" | "created" | "pick";
  data?: Diary;
  diaries?: Diary[];
}> => {
  const res = await mediaApi.post("/diary/highlight", {
    fluxId,
    diaryId,
    newDiaryTitle,
  });
  return res.data;
};

/**
 * Save a flux image to device by downloading it.
 */
export const saveFluxToDevice = async (mediaUrl: string): Promise<void> => {
  const response = await fetch(mediaUrl);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `flux-${Date.now()}.${blob.type.includes("video") ? "mp4" : "jpg"}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getFluxById = async (
  fluxId: string,
): Promise<{
  success: boolean;
  flux: any;
}> => {
  const res = await mediaApi.get(`/flux/${fluxId}`);
  return res.data;
};

/**
 * DELETE /flux/:fluxId — soft-delete a flux.
 */
export const deleteFlux = async (fluxId: string): Promise<void> => {
  await mediaApi.delete(`/flux/${fluxId}`);
};

// Flux — interactions

/**
 * POST /flux/:fluxId/view — mark a flux as viewed (existing handler, no dedup).
 */
export const viewFlux = async (fluxId: string): Promise<void> => {
  await mediaApi.post(`/flux/${fluxId}/view`);
};

/**
 * POST /flux/:fluxId/record-view — deduped view via $addToSet.
 * Returns the updated unique-viewer count.
 * Use this in the flux-view page instead of viewFlux.
 */
export const recordFluxView = async (
  fluxId: string,
): Promise<{ viewCount: number }> => {
  const res = await mediaApi.post<{ success: boolean; viewCount: number }>(
    `/flux/${fluxId}/record-view`,
  );
  return { viewCount: res.data.viewCount };
};

/**
 * POST /flux/:fluxId/react — react with an emoji.
 */
export const reactToFlux = async (
  fluxId: string,
  emoji: string,
): Promise<void> => {
  await mediaApi.post(`/flux/${fluxId}/react`, { emoji });
};
/**
 * POST /flux/:fluxId/mention — mention following users in a flux.
 */
export const mentionFlux = async (
  fluxId: string,
  mentionedUserIds: string[],
): Promise<{
  success: boolean;
  mentions: any[];
  rejected?: string[];
  warning?: string;
}> => {
  const res = await mediaApi.post(`/flux/${fluxId}/mention`, {
    mentionedUserIds,
  });
  return res.data;
};
/**
 * GET /flux/:fluxId/mentions — get all mentions for a flux.
 */
export const getFluxMentions = async (
  fluxId: string,
): Promise<{
  success: boolean;
  mentions: any[];
  total: number;
}> => {
  const res = await mediaApi.get(`/flux/${fluxId}/mentions`);
  return res.data;
};
/**
 * GET /flux/:fluxId/permissions — isOwner + isMentioned for current viewer
 */
export const getFluxPermissions = async (
  fluxId: string,
): Promise<{
  success: boolean;
  isOwner: boolean;
  isMentioned: boolean;
  ownerId: string;
}> => {
  const res = await mediaApi.get(`/flux/${fluxId}/permissions`);
  return res.data;
};

/**
 * DELETE /flux/:fluxId/mention/remove — soft-remove self from mentions (User B only)
 */
export const removeMentionSelf = async (
  fluxId: string,
): Promise<{ success: boolean; message: string }> => {
  const res = await mediaApi.delete(`/flux/${fluxId}/mention/remove`);
  return res.data;
};
/**
 * POST /flux/:fluxId/remention — re-mention a flux you are mentioned in.
 */
export const reMentionFlux = async (
  fluxId: string,
  comment?: string,
): Promise<{
  success: boolean;
  message: string;
}> => {
  const res = await mediaApi.post(`/flux/${fluxId}/remention`, { comment });
  return res.data;
};

/**
 * GET /flux/:fluxId/rementions — get all re-mentions for a flux.
 */
export const getReMentions = async (
  fluxId: string,
): Promise<{
  success: boolean;
  reMentions: any[];
  total: number;
  hasReMentioned: boolean;
}> => {
  const res = await mediaApi.get(`/flux/${fluxId}/rementions`);
  return res.data;
};

export const getFluxViewers = async (
  fluxId: string,
): Promise<FluxViewersResponse> => {
  const res = await mediaApi.get(`/flux/${fluxId}/viewers`);
  // Backend returns { success, total, viewers, viewCount } directly — not nested under .data
  const body = res.data;
  return {
    total: body.total ?? body.viewCount ?? 0,
    viewCount: body.viewCount ?? body.total ?? 0,
    viewers: body.viewers ?? [],
    reactions: body.reactions ?? [],
  };
};

/**
 * GET /flux/:fluxId/view-list — raw viewer IDs + total count (owner only).
 * Used by ViewersPanel to show the count badge.
 */
export const getFluxViewList = async (
  fluxId: string,
): Promise<{ total: number; viewers: string[] }> => {
  const res = await mediaApi.get<{
    success: boolean;
    total: number;
    viewers: string[];
  }>(`/flux/${fluxId}/view-list`);
  return { total: res.data.total, viewers: res.data.viewers };
};

// ─────────────────────────────────────────────────────────────────────────────
// Diary
// ─────────────────────────────────────────────────────────────────────────────
export const createDiary = async (
  options: CreateDiaryOptions,
): Promise<Diary> => {
  const formData = new FormData();
  formData.append("title", options.title);
  if (options.visibility) formData.append("visibility", options.visibility);
  if (options.coverFile) formData.append("cover", options.coverFile);
  if (options.fluxIds?.length)
    formData.append("fluxIds", JSON.stringify(options.fluxIds));

  const res = await mediaApi.post<ApiResponse<Diary>>(
    "/diary/create",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.data;
};
export const getUserDiaries = async (userId: string): Promise<Diary[]> => {
  const res = await mediaApi.get<ApiResponse<Diary[]>>(`/diary/user/${userId}`);
  return res.data.data;
};

export const getDiaryById = async (diaryId: string): Promise<Diary> => {
  const res = await mediaApi.get<ApiResponse<Diary>>(`/diary/${diaryId}`);
  return res.data.data;
};

export const editDiary = async (
  diaryId: string,
  options: EditDiaryOptions,
): Promise<Diary> => {
  const formData = new FormData();
  if (options.title) formData.append("title", options.title);
  if (options.visibility) formData.append("visibility", options.visibility);
  if (options.coverFile) formData.append("cover", options.coverFile);

  const res = await mediaApi.patch<ApiResponse<Diary>>(
    `/diary/${diaryId}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.data;
};

export const addFluxToDiary = async (
  diaryId: string,
  fluxId: string,
): Promise<Diary> => {
  const res = await mediaApi.post<ApiResponse<Diary>>(
    `/diary/${diaryId}/add-flux`,
    { fluxId },
  );
  return res.data.data;
};

export const removeFluxFromDiary = async (
  diaryId: string,
  fluxId: string,
): Promise<Diary> => {
  const res = await mediaApi.delete<ApiResponse<Diary>>(
    `/diary/${diaryId}/flux/${fluxId}`,
  );
  return res.data.data;
};

export const deleteDiary = async (diaryId: string): Promise<void> => {
  await mediaApi.delete(`/diary/${diaryId}`);
};
/**
 * PATCH /diary/:diaryId/reorder — reorder fluxes inside a diary
 */
export const reorderDiaryFluxes = async (
  diaryId: string,
  orderedFluxIds: string[],
): Promise<Diary> => {
  const res = await mediaApi.patch<ApiResponse<Diary>>(
    `/diary/${diaryId}/reorder`,
    { orderedFluxIds },
  );
  return res.data.data;
};

/**
 * PATCH /diary/:diaryId/pin — toggle pin a diary on profile
 */
export const togglePinDiary = async (
  diaryId: string,
): Promise<{ isPinned: boolean; data: Diary }> => {
  const res = await mediaApi.patch(`/diary/${diaryId}/pin`);
  return res.data;
};
// ─────────────────────────────────────────────────────────────────────────────
// Music (iTunes)
// ─────────────────────────────────────────────────────────────────────────────

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  previewUrl: string | null;
  durationMs: number;
  duration: string;
  spotifyUrl: string | null;
  popularity: number;
}

export interface MusicSearchResponse {
  success: boolean;
  data: SpotifyTrack[];
}

export const searchMusic = async (
  query: string,
  limit: number = 10,
): Promise<SpotifyTrack[]> => {
  const res = await mediaApi.get<MusicSearchResponse>("/music/search", {
    params: { q: query, limit },
  });
  return res.data.data;
};

export const getTrack = async (trackId: string): Promise<SpotifyTrack> => {
  const res = await mediaApi.get<{ success: boolean; data: SpotifyTrack }>(
    `/music/track/${trackId}`,
  );
  return res.data.data;
};

export const getTrendingMusic = async (): Promise<SpotifyTrack[]> => {
  const res = await mediaApi.get<MusicSearchResponse>("/music/trending");
  return res.data.data;
};
/**
 * Set who can view a flux: 'public' | 'followers' | 'close_friends' | 'only_me'
 */
export const updateFluxVisibility = async (
  fluxId: string,
  visibility: FluxVisibility,
): Promise<{ _id: string; visibility: FluxVisibility }> => {
  const res = await mediaApi.patch<{
    success: boolean;
    data: { _id: string; visibility: FluxVisibility };
  }>(`/flux/${fluxId}/visibility`, { visibility });
  return res.data.data;
};

/**
 * Hide a specific flux from a specific user.
 */
export const hideFluxFromUser = async (
  fluxId: string,
  hideUserId: string,
): Promise<void> => {
  await mediaApi.patch(`/flux/${fluxId}/hide-from`, { hideUserId });
};

/**
 * Remove a user from the hidden list of a flux.
 */
export const unhideFluxFromUser = async (
  fluxId: string,
  unhideUserId: string,
): Promise<void> => {
  await mediaApi.patch(`/flux/${fluxId}/unhide-from`, { unhideUserId });
};
export const getTrendingStickers = async () => {
  const res = await mediaApi.get("/flux/stickers/trending");
  return res.data.stickers as {
    id: string;
    type: string;
    url: string;
    width: number;
    height: number;
    title: string;
  }[];
};

export const searchStickers = async (q: string) => {
  const res = await mediaApi.get("/flux/stickers/search", { params: { q } });
  return res.data.stickers as {
    id: string;
    type: string;
    url: string;
    width: number;
    height: number;
    title: string;
  }[];
};

// Close Friends
const normalizeUser = (u: any) => ({
  id: u.id ?? u.userId ?? u._id ?? "",
  username: u.username ?? "",
  name: u.name ?? u.fullName ?? u.displayName ?? u.username ?? "",
  profile_picture: u.profilePicture ?? u.profile_picture ?? u.avatar ?? null,
});

export const getCloseFriends = async () => {
  const res = await mediaApi.get("/flux/close-friends");
  const raw = res.data.data ?? [];
  return raw.map(normalizeUser) as {
    id: string;
    username: string;
    name: string;
    profile_picture: string | null;
  }[];
};

export const getCloseFriendSuggestions = async () => {
  const res = await mediaApi.get("/flux/close-friends/suggestions");
  const raw = res.data.data ?? [];
  return raw.map(normalizeUser) as {
    id: string;
    username: string;
    name: string;
    profile_picture: string | null;
  }[];
};

export const addCloseFriend = async (friendId: string) => {
  const res = await mediaApi.post("/flux/close-friends/add", { friendId });
  return res.data;
};

export const removeCloseFriend = async (friendId: string) => {
  const res = await mediaApi.post("/flux/close-friends/remove", { friendId });
  return res.data;
};
export const saveCloseFriends = async (friendIds: string[]): Promise<void> => {
  await mediaApi.post("/flux/close-friends/save", { friendIds });
};

export const shareFluxAsMessage = async (
  fluxId: string,
  receiverIds: string[],
): Promise<{ success: boolean; results: any[] }> => {
  const res = await mediaApi.post(`/flux/${fluxId}/share`, { receiverIds });
  return res.data;
};

export const addFluxComment = async (
  fluxId: string,
  text: string,
): Promise<{ success: boolean; comment: any }> => {
  const res = await mediaApi.post(`/flux/${fluxId}/comments`, { text });
  return res.data;
};

export const getFluxComments = async (
  fluxId: string,
): Promise<{ success: boolean; comments: any[]; total: number }> => {
  const res = await mediaApi.get(`/flux/${fluxId}/comments`);
  return res.data;
};
/**
 * POST /flux/:fluxId/reply — send a reply to a flux as a chat message.
 */
export const replyFluxAsMessage = async (
  fluxId: string,
  text: string,
): Promise<{ success: boolean; message: any }> => {
  const res = await mediaApi.post(`/flux/${fluxId}/reply`, { text });
  return res.data;
};

export const likeFluxComment = async (
  fluxId: string,
  commentId: string,
): Promise<{ success: boolean; liked: boolean }> => {
  const res = await mediaApi.post(`/flux/${fluxId}/comments/${commentId}/like`);
  return res.data;
};

export const toggleFluxLike = async (
  fluxId: string,
  emoji?: string,
): Promise<{ success: boolean; liked: boolean; likeCount: number }> => {
  const res = await mediaApi.post(`/flux/${fluxId}/like`, { emoji });
  return res.data;
};

export const getFluxLikes = async (
  fluxId: string,
): Promise<{
  success: boolean;
  likes?: any[];
  total: number;
  hasLiked?: boolean;
}> => {
  const res = await mediaApi.get(`/flux/${fluxId}/likes`);
  return res.data;
};
// ── Flux Settings
export interface StorySettings {
  // Visibility
  visibility: "public" | "followers" | "close_friends" | "only_me";
  audience: "public" | "followers" | "close_friends" | "only_me"; // alias
  hideFrom: string[];
  // Interactions
  allowReplies: "everyone" | "mutual" | "off";
  allowReactions: boolean;
  allowMessageReplies: boolean;
  // Sharing
  allowShareToStory: boolean;
  allowShareAsMessage: boolean;
  allowExternalShare: boolean;
  // Save
  saveToDevice: boolean;
  saveToArchive: boolean;
  autosaveDrafts: boolean;
  // Advanced
  duration: 24 | 48 | 72;
  showAnalytics: boolean;
  restrictScreenshots: boolean;
}

export interface HiddenUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string | null;
  is_verified: boolean;
}

export const getStorySettings = async (): Promise<StorySettings> => {
  const res = await mediaApi.get<{ success: boolean; data: StorySettings }>(
    "/flux/settings",
  );
  return res.data.data;
};

export const updateStorySettings = async (
  settings: Partial<StorySettings>,
): Promise<StorySettings> => {
  const res = await mediaApi.patch<{ success: boolean; data: StorySettings }>(
    "/flux/settings",
    settings,
  );
  return res.data.data;
};

export const getHideFromList = async (): Promise<HiddenUser[]> => {
  const res = await mediaApi.get<{ success: boolean; data: HiddenUser[] }>(
    "/flux/settings/hide-from",
  );
  return res.data.data;
};

export const updateHideFromList = async (userIds: string[]): Promise<void> => {
  await mediaApi.patch("/flux/settings/hide-from", { userIds });
};

export const addToHideFromList = async (hideUserId: string): Promise<void> => {
  await mediaApi.post("/flux/settings/hide-from/add", { hideUserId });
};

export const removeFromHideFromList = async (
  unhideUserId: string,
): Promise<void> => {
  await mediaApi.post("/flux/settings/hide-from/remove", { unhideUserId });
};
export const reportFluxScreenshot = async (
  fluxId: string,
  platform: string = "web",
): Promise<{ alerted: boolean; count?: number; reason?: string }> => {
  try {
    const res = await mediaApi.post<{
      success: boolean;
      alerted: boolean;
      count?: number;
      reason?: string;
    }>(`/flux/${fluxId}/screenshot`, { platform });
    return res.data;
  } catch {
    // Silent — never block UX on screenshot report failure
    return { alerted: false };
  }
};

export interface FluxAnalytics {
  analyticsEnabled: boolean;
  viewCount: number;
  likeCount: number;
  reactionBreakdown: Record<string, number>;
  commentCount: number;
  mentionCount: number;
  screenshots: {
    count: number;
    uniqueUsers: number;
    recentUsers: {
      id: string;
      username: string;
      name: string;
      profile_picture: string | null;
    }[];
  };
}

export const getFluxAnalytics = async (
  fluxId: string,
): Promise<FluxAnalytics> => {
  const res = await mediaApi.get<{ success: boolean } & FluxAnalytics>(
    `/flux/${fluxId}/analytics`,
  );
  return res.data;
};
/**
 * GET /flux/:fluxId/visibility — get current visibility of a flux (owner only)
 */
export const getFluxVisibility = async (
  fluxId: string,
): Promise<{ _id: string; visibility: FluxVisibility }> => {
  const res = await mediaApi.get<{
    success: boolean;
    data: { _id: string; visibility: FluxVisibility };
  }>(`/flux/${fluxId}/visibility`);
  return res.data.data;
};

export const getFluxOwnerSettings = async (fluxId: string): Promise<{
  allowReplies:        "everyone" | "mutual" | "off";
  allowReactions:      boolean;
  allowMessageReplies: boolean;
  allowShareToStory:   boolean;
  allowShareAsMessage: boolean;
  allowExternalShare:  boolean;
  screenshotAlert:     boolean;
  saveToDevice:        boolean;
}> => {
  const res = await mediaApi.get<{
    success: boolean;
    data: {
      allowReplies:        "everyone" | "mutual" | "off";
      allowReactions:      boolean;
      allowMessageReplies: boolean;
      allowShareToStory:   boolean;
      allowShareAsMessage: boolean;
      allowExternalShare:  boolean;
      screenshotAlert:     boolean;
      saveToDevice:        boolean;
    };
  }>(`/flux/${fluxId}/owner-settings`);
  return res.data.data;
};
/**
 * GET /flux/settings/screenshot-block — check if current user has screenshot blocking on
 */
export const getScreenshotBlockSetting = async (): Promise<{
  screenshotAlert: boolean;
}> => {
  const res = await mediaApi.get<{
    success: boolean;
    data: { screenshotAlert: boolean };
  }>("/flux/settings/screenshot-block");
  return res.data.data;
};
export default mediaApi;
