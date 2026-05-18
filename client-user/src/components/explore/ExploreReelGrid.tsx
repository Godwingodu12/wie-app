"use client";
import React, { useState, useRef } from "react";
import { Play, Heart, MessageCircle } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import type { Post } from "@/types/post";
import ReelViewer from "@/components/post/reels/ReelViewer";

interface ExploreReelGridProps {
  reels: Post[];
  loading: boolean;
  hideEmptyState?: boolean;  
}

function ReelThumbnail({ reel, onClick }: { reel: Post; onClick: () => void }) {
  const { themeStyles } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);

  const first    = reel.mediaItems?.[0];
  const likes    = reel.likeCount    ?? 0;
  const comments = reel.commentCount ?? 0;

  const fmt = (n: number) =>
    n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + "M"
    : n >= 1_000   ? (n / 1_000).toFixed(1) + "K"
    : String(n);

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-xl bg-black group w-full"
      style={{ aspectRatio: "9/16" }}
      onMouseEnter={() => {
        setHovered(true);
        videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        setHovered(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      {/* Video — plays on hover */}
      {first?.url && (
        <video
          ref={videoRef}
          src={first.url}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          muted
          playsInline
          loop
          preload="metadata"
        />
      )}

      {/* No media fallback */}
      {!first?.url && (
        <div
          className="absolute inset-0"
          style={{ background: themeStyles.pillBg }}
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Play icon — visible when not hovered */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
        style={{ opacity: hovered ? 0 : 1 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Play size={18} className="text-white ml-0.5" fill="white" />
        </div>
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1">
          <Heart
            size={11}
            fill={reel.hasLiked   ? "#ef4444" : "white"}
            stroke={reel.hasLiked ? "#ef4444" : "white"}
            style={{
              filter: reel.hasLiked
                ? "drop-shadow(0 0 3px rgba(239,68,68,0.8))"
                : "none",
            }}
          />
          <span className="text-[10px] font-semibold text-white/90">
            {fmt(likes)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-white/90">
          <MessageCircle size={11} />
          <span className="text-[10px] font-semibold">{fmt(comments)}</span>
        </div>
      </div>

      {/* Owner avatar — top left */}
      {reel.owner && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40 flex-shrink-0">
            {reel.owner.profile_picture ? (
              <img
                src={reel.owner.profile_picture}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] to-[#8860D9] flex items-center justify-center text-white text-[8px] font-bold">
                {(reel.owner.name ?? "U")[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

export default function ExploreReelGrid({ reels, loading,hideEmptyState = false, }: ExploreReelGridProps) {
  const { themeStyles } = useTheme();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const openViewer = (idx: number) => {
    setStartIndex(idx);
    setViewerOpen(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {Array(6).fill(null).map((_, i) => (
          <div
            key={i}
            className="rounded-xl animate-pulse w-full"
            style={{
              aspectRatio: "9/16",
              background: themeStyles.pillBg,
            }}
          />
        ))}
      </div>
    );
  }

 if (reels.length === 0) {
    if (hideEmptyState) return null;
      return (
        <div
          className="flex flex-col items-center justify-center py-10 rounded-2xl gap-3"
          style={{ background: themeStyles.pillBg }}
        >
          <span className="text-4xl">🎬</span>
          <p className="text-sm font-medium" style={{ color: themeStyles.textSecondary }}>
            No reels available
          </p>
        </div>
      );
    }
  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {reels.map((reel, idx) => (
          <ReelThumbnail
            key={reel._id}
            reel={reel}
            onClick={() => openViewer(idx)}
          />
        ))}
      </div>

      {viewerOpen && (
        <ReelViewer
          initialReels={reels}
          startIndex={startIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
