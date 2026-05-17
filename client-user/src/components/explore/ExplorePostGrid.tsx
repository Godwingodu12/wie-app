"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Play, Images, Heart, MessageCircle, Bookmark } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import type { Post } from "@/types/post";
import PreviewPost from "@/components/post/PreviewPost";

interface ExplorePostGridProps {
  posts: Post[];
  loading: boolean;
}

export default function ExplorePostGrid({ posts, loading }: ExplorePostGridProps) {
  const { themeStyles, isDark } = useTheme();
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse" style={{ background: themeStyles.pillBg }} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) return null;

  // Layout: first item spans 2 rows if there are enough items
  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post, idx) => {
          const first = post.mediaItems?.[0];
          const isVideo = first?.type === "video";
          const isMulti = (post.mediaItems?.length ?? 0) > 1;
          const isBig = idx === 0 || idx === 7; // big cells at position 0 and 7

          return (
            <button
              key={post._id}
              onClick={() => setPreviewPostId(post._id)}
              className={`relative overflow-hidden group bg-black ${isBig ? "col-span-1 row-span-2" : "aspect-square"}`}
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

              {/* Hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-white">
                    <Heart size={14} fill="white" />
                    <span className="text-xs font-bold">{post.likeCount ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white">
                    <MessageCircle size={14} fill="white" />
                    <span className="text-xs font-bold">{post.commentCount ?? 0}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {previewPostId && (
        <PreviewPost postId={previewPostId} onClose={() => setPreviewPostId(null)} />
      )}
    </>
  );
}