"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { Play, Heart, MessageCircle, Volume2, VolumeX, Pause } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import type { Post } from "@/types/post";
import PreviewPost from "@/components/post/PreviewPost";

interface ExploreReelGridProps {
  reels: Post[];
  loading: boolean;
}

function ReelCard({ reel, onOpen }: { reel: Post; onOpen: () => void }) {
  const { themeStyles } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const first = reel.mediaItems?.[0];
  const thumb = reel.mediaItems?.find(m => m.type === "image")?.url;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
  };

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black cursor-pointer group" onClick={onOpen}>
      {first?.url && (
        <video
          ref={videoRef}
          src={first.url}
          poster={thumb}
          className="absolute inset-0 w-full h-full object-cover"
          loop muted={muted} playsInline
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Play overlay */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
            <Play size={22} className="text-white ml-1" fill="white" />
          </div>
        </button>
      )}
      {playing && (
        <button onClick={togglePlay} className="absolute inset-0 z-10" />
      )}

      {/* Controls */}
      <button
        onClick={(e) => { e.stopPropagation(); if (videoRef.current) { videoRef.current.muted = !muted; setMuted(m => !m); } }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-20"
        style={{ background: "rgba(0,0,0,0.5)" }}
      >
        {muted ? <VolumeX size={12} className="text-white" /> : <Volume2 size={12} className="text-white" />}
      </button>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-10 pointer-events-none">
        {reel.owner?.name && (
          <p className="text-white text-xs font-semibold truncate mb-1">{reel.owner.name}</p>
        )}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white/80">
            <Heart size={12} />
            <span className="text-[10px]">{reel.likeCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-1 text-white/80">
            <MessageCircle size={12} />
            <span className="text-[10px]">{reel.commentCount ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExploreReelGrid({ reels, loading }: ExploreReelGridProps) {
  const { themeStyles } = useTheme();
  const [previewId, setPreviewId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {Array(6).fill(null).map((_, i) => (
          <div key={i} className="aspect-[9/16] rounded-xl animate-pulse" style={{ background: themeStyles.pillBg }} />
        ))}
      </div>
    );
  }

  if (reels.length === 0) return (
    <div className="flex flex-col items-center py-16 gap-3">
      <span className="text-5xl">🎬</span>
      <p className="text-sm" style={{ color: themeStyles.textSecondary }}>No reels yet</p>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {reels.map(r => <ReelCard key={r._id} reel={r} onOpen={() => setPreviewId(r._id)} />)}
      </div>
      {previewId && <PreviewPost postId={previewId} onClose={() => setPreviewId(null)} />}
    </>
  );
}