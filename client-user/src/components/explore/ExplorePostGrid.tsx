"use client";
import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Play, Images, Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import type { Post } from "@/types/post";
import PreviewPost from "@/components/post/PreviewPost";
import CommentSheet from "@/components/post/CommentSheet";
import PostShareBar from "@/components/post/actions/PostShareBar";
import { toggleLike, toggleSave } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";

interface ExplorePostGridProps {
  posts: Post[];
  loading: boolean;
}

export default function ExplorePostGrid({ posts, loading }: ExplorePostGridProps) {
  const { themeStyles } = useTheme();
  const { user } = useAuth(false);
  const [previewPostId,  setPreviewPostId]  = useState<string | null>(null);
  const [commentPostId,  setCommentPostId]  = useState<string | null>(null);
  const [sharePostId,    setSharePostId]    = useState<string | null>(null);
  const [shareOwnerId,   setShareOwnerId]   = useState<string | undefined>();
  const normalizePosts = (raw: Post[]) =>
    raw.map(p => ({
      ...p,
      hasLiked: (p as any).hasLiked === true,
      hasSaved: (p as any).hasSaved === true,
      likeCount: p.likeCount ?? (p as any).likes?.length ?? 0,
      commentCount: p.commentCount ?? (p as any).comments?.length ?? 0,
    }));

  const [localPosts, setLocalPosts] = useState<Post[]>(() => normalizePosts(posts));

  // Sync when parent posts change (new data loaded)
  React.useEffect(() => {
    setLocalPosts(prev => {
      const normalized = normalizePosts(posts);
      // Preserve any optimistic local changes (likes/saves done in this session)
      return normalized.map(np => {
        const existing = prev.find(p => p._id === np._id);
        if (!existing) return np;
        // Keep local state if it was interacted with
        return {
          ...np,
          hasLiked: (existing as any)._interacted ? (existing as any).hasLiked : np.hasLiked,
          hasSaved: (existing as any)._interacted ? (existing as any).hasSaved : np.hasSaved,
          likeCount: (existing as any)._interacted ? existing.likeCount : np.likeCount,
        };
      });
    });
  }, [posts]);

  const handleLike = useCallback(async (e: React.MouseEvent, post: Post) => {
      e.stopPropagation();
      const prev = localPosts.find(p => p._id === post._id);
      if (!prev) return;
      const wasLiked  = (prev as any).hasLiked === true;
      const prevCount = prev.likeCount ?? 0;
      // Optimistic update — mark as interacted so sync doesn't overwrite
      setLocalPosts(ps => ps.map(p =>
        p._id === post._id
          ? { ...p, hasLiked: !wasLiked, likeCount: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1, _interacted: true } as any
          : p,
      ));
      try {
        const res = await toggleLike(post._id);
        setLocalPosts(ps => ps.map(p =>
          p._id === post._id
            ? { ...p, hasLiked: res.liked, likeCount: res.likeCount, _interacted: true } as any
            : p,
        ));
      } catch {
        setLocalPosts(ps => ps.map(p => p._id === post._id ? { ...prev, _interacted: false } as any : p));
      }
    }, [localPosts]);
const handleSave = useCallback(async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    const prev = localPosts.find(p => p._id === post._id);
    if (!prev) return;
    const wasSaved = (prev as any).hasSaved === true;
    setLocalPosts(ps => ps.map(p =>
      p._id === post._id ? { ...p, hasSaved: !wasSaved, _interacted: true } as any : p,
    ));
    try {
      await toggleSave(post._id);
    } catch {
      setLocalPosts(ps => ps.map(p => p._id === post._id ? { ...prev, _interacted: false } as any : p));
    }
  }, [localPosts]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse" style={{ background: themeStyles.pillBg }} />
        ))}
      </div>
    );
  }

  if (localPosts.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {localPosts.map((post, idx) => {
          const first    = post.mediaItems?.[0];
          const isVideo  = first?.type === "video";
          const isMulti  = (post.mediaItems?.length ?? 0) > 1;
          const isBig    = idx === 0 || idx === 7;
          const hasLiked = (post as any).hasLiked ?? false;
          const hasSaved = (post as any).hasSaved ?? false;
          const likes    = post.likeCount ?? (post as any).likes?.length ?? 0;
          const comments = post.commentCount ?? (post as any).comments?.length ?? 0;

          return (
            <div
              key={post._id}
              onClick={() => setPreviewPostId(post._id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === "Enter" && setPreviewPostId(post._id)}
              className={`relative overflow-hidden group bg-black cursor-pointer ${isBig ? "col-span-1 row-span-2" : "aspect-square"}`}
              style={isBig ? { aspectRatio: "1/2" } : {}}
            >
              {first?.url ? (
                isVideo ? (
                  <video
                    src={first.url}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted playsInline
                  />
                ) : (
                  <Image
                    src={first.url} alt="" fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="33vw" unoptimized
                  />
                )
              ) : (
                <div className="absolute inset-0" style={{ background: themeStyles.pillBg }} />
              )}

              {/* Badges */}
              <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
                {isMulti && (
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                    <Images size={10} className="text-white" />
                  </div>
                )}
                {isVideo && (
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
                    <Play size={10} className="text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                <div className="flex items-center gap-5">
                  {/* Like count — red heart if already liked */}
                  <div className="flex items-center gap-1.5">
                    <Heart
                      size={20}
                      fill={hasLiked ? "#ef4444" : "white"}
                      stroke={hasLiked ? "#ef4444" : "white"}
                      style={{
                        filter: hasLiked
                          ? "drop-shadow(0 0 6px rgba(239,68,68,0.7))"
                          : "none",
                        transition: "fill 0.15s, stroke 0.15s",
                      }}
                    />
                    <span className="text-sm font-bold text-white drop-shadow">
                      {likes >= 1_000 ? (likes / 1_000).toFixed(1) + "K" : likes}
                    </span>
                  </div>
                  {/* Comment count */}
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={20} fill="white" stroke="white" />
                    <span className="text-sm font-bold text-white drop-shadow">
                      {comments >= 1_000 ? (comments / 1_000).toFixed(1) + "K" : comments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PreviewPost modal */}
      {previewPostId && (
        <PreviewPost postId={previewPostId} onClose={() => setPreviewPostId(null)} />
      )}

      {/* Comment sheet */}
      {commentPostId && (
        <CommentSheet
          postId={commentPostId}
          isOpen={!!commentPostId}
          onClose={() => setCommentPostId(null)}
          commentCount={localPosts.find(p => p._id === commentPostId)?.commentCount ?? 0}
          onCommentAdded={() =>
            setLocalPosts(ps =>
              ps.map(p =>
                p._id === commentPostId
                  ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } as any
                  : p,
              ),
            )
          }
          currentUserId={user?.id}
        />
      )}

      {/* Share bar */}
      {sharePostId && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSharePostId(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <PostShareBar
              postId={sharePostId}
              postOwnerId={shareOwnerId}
              onClose={() => setSharePostId(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
