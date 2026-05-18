export type PostVisibility = "public" | "followers" | "only_me";
export type PostMediaType = "image" | "video";
export type ReactionEmoji = "❤️" | "🔥" | "😂" | "😮" | "👏" | "🚀";

export interface PostMediaItem {
  url: string;
  type: PostMediaType;
  publicId: string;
  width?: number;
  height?: number;
  duration?: number;
  aspectRatio?: string;
  order: number;
}

export interface PostOwner {
  id: string;
  username: string;
  name: string;
  profile_picture: string | null;
  is_verified: boolean;
}

export interface PostCommentReply {
  _id: string;
  userId: string;
  name: string;
  profile_picture: string | null;
  text: string;
  likes: string[];
  likeCount: number;
  createdAt: string;
}

export interface PostComment {
  _id: string;
  userId: string;
  name: string;
  username: string;
  profile_picture: string | null;
  text: string;
  likes: string[];
  gifUrl?: string;
  stickerUrl?: string;
  likeCount: number;
  replies: PostCommentReply[];
  createdAt: string;
}

export interface TaggedUser {
  userId: string;
  x?: number;
  y?: number;
  mediaIndex?: number;
}

export interface Post {
  _id: string;
  userId: string;
  owner?: PostOwner;
  mediaItems: PostMediaItem[];
  contentType?: "post" | "reel"; 
  caption?: string;
  visibility: PostVisibility;
  locationLabel?: string;
  taggedUsers?: TaggedUser[];
  mentions?: string[];
  likeCount: number;
  commentCount: number;
  saveCount: number;
  shareCount: number;
  commentsDisabled: boolean;
  likesHidden: boolean;
  isPinned: boolean;
  hasLiked?: boolean;
  hasSaved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PostFeedResponse {
  success: boolean;
  data: Post[];
  pagination: PostPagination;
}

export interface CreatePostPayload {
  files: File[];
  caption?: string;
  visibility?: PostVisibility;
  contentType?: "post" | "reel";
  taggedUsers?: TaggedUser[];
  locationLabel?: string;
  locationPlaceId?: string;
  locationLat?: number;
  locationLng?: number;
}
