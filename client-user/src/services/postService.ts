import axios, { AxiosProgressEvent } from "axios";
import type {
  Post,
  PostFeedResponse,
  CreatePostPayload,
  PostComment,
  PostCommentReply,
  PostVisibility,
  ReactionEmoji,
} from "@/types/post";

const MEDIA_API_URL =
  process.env.NEXT_PUBLIC_MEDIA_API_URL || "http://localhost:5010/api";

const postApi = axios.create({
  baseURL: MEDIA_API_URL,
  headers: { "Content-Type": "application/json" },
});

postApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

postApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Post API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

// CRUD

export const createPost = async (
  payload: CreatePostPayload,
  onUploadProgress?: (e: AxiosProgressEvent) => void,
): Promise<Post> => {
  const form = new FormData();
  payload.files.forEach((f) => form.append("media", f));
  if (payload.caption) form.append("caption", payload.caption);
  if (payload.visibility) form.append("visibility", payload.visibility);
  if (payload.locationLabel)
    form.append("locationLabel", payload.locationLabel);
  if (payload.locationPlaceId)
    form.append("locationPlaceId", payload.locationPlaceId);
  if (payload.locationLat != null)
    form.append("locationLat", String(payload.locationLat));
  if (payload.locationLng != null)
    form.append("locationLng", String(payload.locationLng));
  if (payload.taggedUsers?.length)
    form.append("taggedUsers", JSON.stringify(payload.taggedUsers));

  const res = await postApi.post<{ success: boolean; data: Post }>(
    "/post/create",
    form,
    { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress },
  );
  return res.data.data;
};

export const getPostFeed = async (
  page = 1,
  limit = 20,
): Promise<PostFeedResponse> => {
  const res = await postApi.get<PostFeedResponse>("/post/feed", {
    params: { page, limit },
  });
  return res.data;
};

export const getExplorePosts = async (
  page = 1,
  limit = 20,
): Promise<PostFeedResponse> => {
  const res = await postApi.get<PostFeedResponse>("/post/explore", {
    params: { page, limit },
  });
  return res.data;
};

export const getUserPosts = async (
  userId: string,
  page = 1,
  limit = 12,
): Promise<PostFeedResponse> => {
  const res = await postApi.get<PostFeedResponse>(`/post/user/${userId}`, {
    params: { page, limit },
  });
  return res.data;
};

export const getSavedPosts = async (
  page = 1,
  limit = 12,
): Promise<PostFeedResponse> => {
  const res = await postApi.get<PostFeedResponse>("/post/saved", {
    params: { page, limit },
  });
  return res.data;
};

export const getPostById = async (postId: string): Promise<Post> => {
  const res = await postApi.get<{ success: boolean; data: Post }>(
    `/post/${postId}`,
  );
  return res.data.data;
};

export const deletePost = async (postId: string): Promise<void> => {
  await postApi.delete(`/post/${postId}`);
};

export const updatePost = async (
  postId: string,
  fields: {
    caption?: string;
    visibility?: PostVisibility;
    locationLabel?: string;
  },
): Promise<Post> => {
  const res = await postApi.patch<{ success: boolean; data: Post }>(
    `/post/${postId}`,
    fields,
  );
  return res.data.data;
};

// ── Likes

export const toggleLike = async (
  postId: string,
  emoji: ReactionEmoji = "❤️",
): Promise<{ liked: boolean; likeCount: number }> => {
  const res = await postApi.post<{
    success: boolean;
    liked: boolean;
    likeCount: number;
  }>(`/post/${postId}/like`, { emoji });
  return res.data;
};

export const getPostLikes = async (postId: string) => {
  const res = await postApi.get(`/post/${postId}/likes`);
  return res.data;
};

// ── Comments
export const addComment = async (
  postId: string,
  text: string,
): Promise<PostComment> => {
  const res = await postApi.post<{ success: boolean; comment: PostComment }>(
    `/post/${postId}/comments`,
    { text },
  );
  return res.data.comment;
};

export const getPostComments = async (
  postId: string,
  page = 1,
  limit = 20,
): Promise<{ comments: PostComment[]; total: number }> => {
  const res = await postApi.get<{
    success: boolean;
    comments: PostComment[];
    total: number;
  }>(`/post/${postId}/comments`, { params: { page, limit } });
  return res.data;
};

export const replyToComment = async (
  postId: string,
  commentId: string,
  text: string,
): Promise<PostCommentReply> => {
  const res = await postApi.post<{ success: boolean; reply: PostCommentReply }>(
    `/post/${postId}/comments/${commentId}/reply`,
    { text },
  );
  return res.data.reply;
};

export const likeComment = async (
  postId: string,
  commentId: string,
): Promise<{ liked: boolean }> => {
  const res = await postApi.post<{ success: boolean; liked: boolean }>(
    `/post/${postId}/comments/${commentId}/like`,
  );
  return res.data;
};

export const deleteComment = async (
  postId: string,
  commentId: string,
): Promise<void> => {
  await postApi.delete(`/post/${postId}/comments/${commentId}`);
};

// ── Share
export const sharePost = async (
  postId: string,
  receiverIds: string[],
): Promise<void> => {
  await postApi.post(`/post/${postId}/share`, { receiverIds });
};

// ── Save
export const toggleSave = async (
  postId: string,
): Promise<{ saved: boolean; saveCount: number }> => {
  const res = await postApi.post<{
    success: boolean;
    saved: boolean;
    saveCount: number;
  }>(`/post/${postId}/save`);
  return res.data;
};

//  Settings
export const updatePostSettings = async (
  postId: string,
  settings: {
    commentsDisabled?: boolean;
    likesHidden?: boolean;
    visibility?: PostVisibility;
    isPinned?: boolean;
  },
): Promise<void> => {
  await postApi.patch(`/post/${postId}/settings`, settings);
};

export default postApi;
