// Shared Enums & Primitives

export type FluxVisibility = 'public' | 'followers' | 'close_friends' | 'only_me';
export type FluxMediaType = 'image' | 'video';
export type RingStatus = 'unseen' | 'seen' | 'none';
export type DiaryVisibility = FluxVisibility;

//  Embedded Sub-documents

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

export interface FluxSticker {
  type: string;
  value?: string;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
  [key: string]: any;
}

//  Core Flux (Story) 

export interface Flux {
  _id: string;
  userId: string;

  // Media
  mediaUrl: string;
  mediaType: FluxMediaType;
  cloudinaryPublicId: string;
  cloudinaryResourceType: string;
  caption?: string;
  duration?: number;       // seconds — video only
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;

  // Overlays (client-side rendered)
  stickers?: FluxSticker[];
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartAt?: number;   // seconds offset into track

  // Privacy
  visibility: FluxVisibility;

  // Engagement
  views: FluxView[];
  reactions: FluxReaction[];
  replies: FluxReply[];

  // Lifecycle
  expiresAt: string;       // ISO — 24h from creation
  isArchived: boolean;
  isDeleted: boolean;

  // Virtuals (server-computed, read-only)
  viewCount: number;
  reactionCount: number;
  isExpired: boolean;

  createdAt: string;
  updatedAt: string;
}

// ── Flux as it appears inside a Feed group 
export interface FeedFluxItem {
  _id: string;
  mediaUrl: string;
  mediaType: FluxMediaType;
  caption?: string;
  visibility: FluxVisibility;
  expiresAt: string;
  createdAt: string;
  musicTitle?: string;
  musicArtist?: string;
  duration?: number;
  viewCount: number;
}

export interface FeedFluxUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string;
  account_privacy: 'public' | 'private';
  is_verified: boolean;
}

export interface FeedFluxGroup {
  _id: string;                   // ownerId
  fluxes: FeedFluxItem[];
  latestAt: string;              // ISO — most recent flux createdAt
  isSelf: boolean;               // true when group belongs to the viewer
  user: FeedFluxUser | null;
}

// ── Flux Viewer List (owner-only analytics) 

export interface FluxViewer {
  id: string;
  username: string;
  name: string;
  profile_picture: string;
  is_verified: boolean;
}

export interface FluxViewersResponse {
  viewers: FluxViewer[];
  reactions: FluxReaction[];
  viewCount: number;
}

//  Ring Status 
/** Per-user ring status used to colour the avatar ring in the story bar. */
export interface UserRingStatus {
  ownerId: string;
  status: RingStatus;
}

//  Diary (Highlight) 

export interface DiaryFlux {
  fluxId: string;
  mediaUrl: string;
  mediaType: FluxMediaType;
  caption?: string;
  addedAt: string;
}

export interface Diary {
  _id: string;
  userId: string;
  title: string;
  coverImage?: string;
  coverCloudinaryPublicId?: string;
  fluxes: DiaryFlux[];
  visibility: DiaryVisibility;
  isDeleted: boolean;

  // Virtual (server-computed, read-only)
  fluxCount: number;

  createdAt: string;
  updatedAt: string;
}

// API Request Payloads 

export interface CreateFluxPayload {
  file: File;
  caption?: string;
  visibility?: FluxVisibility;
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartAt?: number;
  stickers?: FluxSticker[];
}

export interface CreateDiaryPayload {
  title: string;
  visibility?: DiaryVisibility;
  coverFile?: File;
}

export interface EditDiaryPayload {
  title?: string;
  visibility?: DiaryVisibility;
  coverFile?: File;
}

export interface AddFluxToDiaryPayload {
  fluxId: string;
}

export interface ReactToFluxPayload {
  emoji: string;
}

// API Response Wrappers 

export interface MediaApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface FluxFeedResponse {
  success: boolean;
  data: FeedFluxGroup[];
}

export interface UserFluxesResponse {
  success: boolean;
  data: Flux[];
}

export interface DiariesResponse {
  success: boolean;
  data: Diary[];
}

export interface SingleDiaryResponse {
  success: boolean;
  data: Diary;
}

export interface SingleFluxResponse {
  success: boolean;
  data: Flux;
}

//  Upload Progress 

export interface FluxUploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

//  UI State Types 

/** State for the flux viewer modal/overlay */
export interface FluxViewerState {
  isOpen: boolean;
  currentGroupIndex: number;
  currentFluxIndex: number;
  isPaused: boolean;
}

/** State for the flux creator flow */
export type FluxCreatorStep = 'pick' | 'edit' | 'settings' | 'uploading' | 'done';

export interface FluxCreatorState {
  step: FluxCreatorStep;
  file: File | null;
  preview: string | null;
  mediaType: FluxMediaType | null;
  caption: string;
  visibility: FluxVisibility;
  stickers: FluxSticker[];
  musicId?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicStartAt?: number;
  uploadProgress: number;
  error: string | null;
}

/** State for diary management sheet/modal */
export interface DiaryManagerState {
  isOpen: boolean;
  selectedDiaryId: string | null;
  mode: 'view' | 'edit' | 'create' | 'add-flux';
}

// gRPC-shaped responses (used when other services call media-service) 

export interface GrpcFluxItem {
  id: string;
  user_id: string;
  media_url: string;
  media_type: FluxMediaType;
  caption: string;
  visibility: FluxVisibility;
  view_count: number;
  reaction_count: number;
  expires_at: string;
  created_at: string;
  music_title: string;
  music_artist: string;
  duration: number;
  is_archived: boolean;
}

export interface GrpcDiaryItem {
  id: string;
  user_id: string;
  title: string;
  cover_image: string;
  flux_count: number;
  visibility: DiaryVisibility;
  created_at: string;
  updated_at: string;
}

export interface GrpcOwnerRingStatus {
  owner_id: string;
  status: RingStatus;
}

export interface GrpcMediaStats {
  fluxCount: number;
  diaryCount: number;
  archivedFluxCount: number;
  error: string;
}

//  Spotify / Music 

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