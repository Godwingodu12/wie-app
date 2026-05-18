"use client";
import React, {
  useState, useEffect, useRef, useCallback,
} from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X, Heart, MessageCircle, Share2, Bookmark,
  Volume2, VolumeX, Play, Pause,
  ChevronUp, ChevronDown, MoreVertical,
  Music2, Eye,
} from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import { toggleLike, toggleSave, getReelsFeed } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";
import type { Post } from "@/types/post";
import CommentSheet from "@/components/post/CommentSheet";
import PostShareBar from "@/components/post/actions/PostShareBar";

// ── helpers ──────────────────────────────────────────────
const fmt = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

// ── single reel card ─────────────────────────────────────
interface ReelCardProps {
  reel:        Post;
  isActive:    boolean;
  globalMuted: boolean;
  onMuteToggle: () => void;
  onLike:      (id: string, liked: boolean, count: number) => void;
  onSave:      (id: string, saved: boolean) => void;
  onComment:   (reel: Post) => void;
  onShare:     (reel: Post) => void;
}

function SingleReelCard({
  reel, isActive, globalMuted, onMuteToggle,
  onLike, onSave, onComment, onShare,
}: ReelCardProps) {
  const { isDark } = useTheme();
  const { user }   = useAuth(false);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const [playing,    setPlaying]    = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [liked,      setLiked]      = useState((reel as any).hasLiked ?? false);
  const [likeCount,  setLikeCount]  = useState(reel.likeCount ?? 0);
  const [saved,      setSaved]      = useState((reel as any).hasSaved ?? false);
  const [expanded,   setExpanded]   = useState(false);

  // Sync props → state when reel changes
  useEffect(() => {
    setLiked((reel as any).hasLiked  ?? false);
    setLikeCount(reel.likeCount ?? 0);
    setSaved((reel as any).hasSaved  ?? false);
    setProgress(0);
    setPlaying(false);
  }, [reel._id]);

  // Play/pause based on isActive
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.currentTime = 0;
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [isActive]);

  // Mute sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = globalMuted;
  }, [globalMuted]);

  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().catch(() => {}); setPlaying(true); }
  };

  const handleLike = async () => {
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
    try {
      const res = await toggleLike(reel._id);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
      onLike(reel._id, res.liked, res.likeCount);
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    }
  };

  const handleSave = async () => {
    const prev = saved;
    setSaved(!saved);
    try { await toggleSave(reel._id); onSave(reel._id, !prev); }
    catch { setSaved(prev); }
  };

  const first  = reel.mediaItems?.[0];
  const owner  = reel.owner as any;
  const commentCount = reel.commentCount ?? 0;
  const shareCount   = (reel as any).shareCount ?? 0;
  const caption      = reel.caption ?? "";
  const captionShort = caption.length > 80 ? caption.slice(0, 80) + "…" : caption;

  return (
    <div className="relative w-full h-full flex-shrink-0 bg-black overflow-hidden snap-start">
      {/* Video */}
      {first?.url && (
        <video
          ref={videoRef}
          src={first.url}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={globalMuted}
          playsInline
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (v && v.duration) setProgress(v.currentTime / v.duration);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Tap to play/pause */}
      <div className="absolute inset-0 z-10" onClick={togglePlayPause} />

      {/* Play indicator */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* ── RIGHT action panel ─────────────────────────── */}
      <div className="absolute right-3 bottom-24 z-30 flex flex-col items-center gap-5">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
            <Heart
              size={22}
              fill={liked ? "#8860D9" : "none"}
              stroke={liked ? "#8860D9" : "white"}
            />
          </div>
          <span className="text-white text-xs font-semibold">{fmt(likeCount)}</span>
        </button>

        {/* Comment */}
        <button onClick={() => onComment(reel)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
            <MessageCircle size={22} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold">{fmt(commentCount)}</span>
        </button>

        {/* Share */}
        <button onClick={() => onShare(reel)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
            <Share2 size={22} className="text-white" />
          </div>
          <span className="text-white text-xs font-semibold">{fmt(shareCount)}</span>
        </button>

        {/* Save */}
        <button onClick={handleSave} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
            <Bookmark
              size={22}
              fill={saved ? "#F59E0B" : "none"}
              stroke={saved ? "#F59E0B" : "white"}
            />
          </div>
        </button>

        {/* Mute */}
        <button onClick={onMuteToggle} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
          <div className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
            {globalMuted
              ? <VolumeX size={20} className="text-white" />
              : <Volume2 size={20} className="text-white" />}
          </div>
        </button>
      </div>

      {/* ── BOTTOM info panel ──────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-16 z-30 p-4 pb-6">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30">
            {owner?.profile_picture ? (
              <img src={owner.profile_picture} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] to-[#8860D9] flex items-center justify-center text-white text-xs font-bold">
                {(owner?.name ?? "U")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">
              {owner?.username ?? owner?.name ?? "User"}
            </span>
            {owner?.is_verified && (
              <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            )}
            <button
              className="px-3 py-0.5 rounded-full border border-white/60 text-white text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              Follow
            </button>
          </div>
        </div>

        {/* Caption */}
        {caption && (
          <p className="text-white text-xs leading-relaxed mb-1.5">
            {expanded ? caption : captionShort}
            {caption.length > 80 && !expanded && (
              <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                className="text-white/60 ml-1">more</button>
            )}
          </p>
        )}

        {/* Music tag */}
        <div className="flex items-center gap-1.5">
          <Music2 size={11} className="text-white/70" />
          <span className="text-white/70 text-[10px] truncate max-w-[200px]">
            {(reel as any).musicName ?? "Original Audio"}
          </span>
        </div>

        {/* Comment preview row */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-white/50 text-[10px]">
            {owner?.username ?? ""} and {fmt(commentCount)} others commented
          </span>
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-40">
        <div
          className="h-full bg-white transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main ReelViewer ──────────────────────────────────────
interface ReelViewerProps {
  initialReels: Post[];
  startIndex?:  number;
  onClose:      () => void;
}

export default function ReelViewer({
  initialReels,
  startIndex = 0,
  onClose,
}: ReelViewerProps) {
  const { isDark } = useTheme();
  const [reels,       setReels]       = useState<Post[]>(initialReels);
  const [activeIdx,   setActiveIdx]   = useState(startIndex);
  const [globalMuted, setGlobalMuted] = useState(false);
  const [commentReel, setCommentReel] = useState<Post | null>(null);
  const [shareReel,   setShareReel]   = useState<Post | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page,        setPage]        = useState(1);
  const containerRef  = useRef<HTMLDivElement>(null);
  const { user } = useAuth(false);

  // ── Snap scroll → update activeIdx ──────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
      // Load more when near end
      if (idx >= reels.length - 3 && !loadingMore) {
        loadMore();
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [reels.length, loadingMore]);

  // Scroll to startIndex on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = startIndex * el.clientHeight;
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res  = await getReelsFeed(next, 10);
      setReels(prev => [...prev, ...(res.data ?? [])]);
      setPage(next);
    } catch {}
    finally { setLoadingMore(false); }
  };

  const scrollTo = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
  };

  const handleLikeUpdate = (id: string, liked: boolean, count: number) => {
    setReels(rs => rs.map(r => r._id === id ? { ...r, hasLiked: liked, likeCount: count } as any : r));
  };
  const handleSaveUpdate = (id: string, saved: boolean) => {
    setReels(rs => rs.map(r => r._id === id ? { ...r, hasSaved: saved } as any : r));
  };

  // Desktop layout: reel in center, nav arrows on sides
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

  const viewer = (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ fontFamily: "inherit" }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      >
        <X size={20} className="text-white" />
      </button>

      {/* Desktop: centered column with max width */}
      <div className="relative w-full h-full md:flex md:items-center md:justify-center">
        {/* Reel container — snap scroll */}
        <div
          ref={containerRef}
          className="w-full h-full md:w-[400px] md:h-[85vh] md:rounded-2xl overflow-hidden overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {reels.map((reel, idx) => (
            <div key={reel._id} className="w-full h-full md:h-[85vh] flex-shrink-0 snap-start">
              <SingleReelCard
                reel={reel}
                isActive={idx === activeIdx}
                globalMuted={globalMuted}
                onMuteToggle={() => setGlobalMuted(m => !m)}
                onLike={handleLikeUpdate}
                onSave={handleSaveUpdate}
                onComment={setCommentReel}
                onShare={setShareReel}
              />
            </div>
          ))}
          {loadingMore && (
            <div className="w-full h-20 flex items-center justify-center flex-shrink-0 snap-start">
              <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Desktop nav arrows — right of the reel column */}
        <div className="hidden md:flex flex-col gap-3 ml-4">
          <button
            onClick={() => scrollTo(Math.max(0, activeIdx - 1))}
            disabled={activeIdx === 0}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}
          >
            <ChevronUp size={22} className="text-white" />
          </button>
          <button
            onClick={() => scrollTo(Math.min(reels.length - 1, activeIdx + 1))}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}
          >
            <ChevronDown size={22} className="text-white" />
          </button>
        </div>
      </div>

      {/* Comment sheet */}
      {commentReel && (
        <CommentSheet
          postId={commentReel._id}
          isOpen={!!commentReel}
          onClose={() => setCommentReel(null)}
          commentCount={commentReel.commentCount ?? 0}
          onCommentAdded={() =>
            setReels(rs => rs.map(r =>
              r._id === commentReel._id
                ? { ...r, commentCount: (r.commentCount ?? 0) + 1 } as any
                : r,
            ))
          }
          currentUserId={user?.id}
        />
      )}

      {/* Share bar */}
      {shareReel && (
        <div
          className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShareReel(null)}
        >
          <div onClick={e => e.stopPropagation()}>
            <PostShareBar
              postId={shareReel._id}
              postOwnerId={(shareReel as any).userId?.toString?.() ?? shareReel.owner?.id}
              onClose={() => setShareReel(null)}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") return null;
  return ReactDOM.createPortal(viewer, document.body);
}