"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Play, Images, Lock } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import { getUserPosts, deletePost } from "@/services/postService";
import type { Post } from "@/types/post";
import PostDetailModal from "./PostDetailModal";

interface PostGridProps {
  userId:         string;
  isOwnProfile?:  boolean;
  canView?:       boolean;
  currentUserId?: string;
}

export default function PostGrid({
  userId,
  isOwnProfile  = false,
  canView       = true,
  currentUserId,
}: PostGridProps) {
  const { themeStyles } = useTheme();
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [selected, setSelected] = useState<Post | null>(null);

  const fetchPosts = useCallback(async (pg: number) => {
    if (!canView) { setLoading(false); return; }
    try {
      const res = await getUserPosts(userId, pg, 12);
      setPosts((prev) => (pg === 1 ? res.data : [...prev, ...res.data]));
      setHasMore(res.pagination.hasMore);
    } catch { /* silently fail */ }
    finally  { setLoading(false); }
  }, [userId, canView]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setPage(1);
    fetchPosts(1);
  }, [userId, fetchPosts]);

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setSelected(null);
    } catch { console.error("Delete failed"); }
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: themeStyles.pillBg }}>
          <Lock size={28} style={{ color: themeStyles.textSecondary }} />
        </div>
        <p className="text-sm font-medium" style={{ color: themeStyles.textSecondary }}>
          This account is private
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse"
            style={{ background: themeStyles.pillBg }} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: themeStyles.pillBg }}>
          <Images size={28} style={{ color: themeStyles.textSecondary }} />
        </div>
        <p className="text-sm font-medium" style={{ color: themeStyles.textSecondary }}>
          {isOwnProfile ? "Share your first post" : "No posts yet"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => {
          const first = post.mediaItems?.[0];
          return (
            <button key={post._id}
              className="relative aspect-square overflow-hidden group"
              onClick={() => setSelected(post)}>
              {first?.type === "video" ? (
                <video src={first.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted playsInline />
              ) : first?.url ? (
                <Image src={first.url} alt="" fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="33vw" unoptimized />
              ) : (
                <div className="w-full h-full" style={{ background: themeStyles.pillBg }} />
              )}
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {(post.mediaItems?.length ?? 0) > 1 && (
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-black/60">
                    <Images size={11} className="text-white" />
                  </div>
                )}
                {first?.type === "video" && (
                  <div className="w-5 h-5 rounded flex items-center justify-center bg-black/60">
                    <Play size={11} className="text-white fill-white" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <span className="text-white text-xs font-bold">❤️ {post.likeCount}</span>
                <span className="text-white text-xs font-bold">💬 {post.commentCount}</span>
              </div>
            </button>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => { const next = page + 1; setPage(next); fetchPosts(next); }}
            className="px-6 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}>
            Load more
          </button>
        </div>
      )}

      {selected && (
        <PostDetailModal
          post={selected}
          onClose={() => setSelected(null)}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onPostUpdated={(updated) =>
            setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
          }
        />
      )}
    </>
  );
}