"use client";
import React, { useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Heart, MessageCircle, Send, Bookmark,
  MoreHorizontal, MapPin, Play, Volume2,
  VolumeX, ChevronLeft, ChevronRight, Verified,
} from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import { toggleLike, toggleSave } from "@/services/postService";
import type { Post, ReactionEmoji } from "@/types/post";
import CommentSheet from "./CommentSheet";
import PostShareBar from "./actions/PostShareBar";
interface PostCardProps {
  post:           Post;
  currentUserId?: string;
  onDelete?:      (postId: string) => void;
  onPostUpdated?: (updated: Post) => void;
}

const REACTIONS: ReactionEmoji[] = ["❤️", "🔥", "😂", "😮", "👏", "🚀"];

const formatCount = (n: number): string => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return String(n);
};

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString();
};

export default function PostCard({
  post, currentUserId, onDelete, onPostUpdated,
}: PostCardProps) {
  const { themeStyles } = useTheme();
  const router          = useRouter();

  // ── Interaction state ──────────────────────────────────
  const [liked,        setLiked]        = useState<boolean>(post.hasLiked  ?? false);
  const [likeCount,    setLikeCount]    = useState<number>(
    post.likeCount ?? (post as any).likes?.length ?? 0,
  );
  const [commentCount, setCommentCount] = useState<number>(
    post.commentCount ?? (post as any).comments?.length ?? 0,
  );
  const [shareCount]                    = useState<number>(post.shareCount ?? 0);
  const [saved,        setSaved]        = useState<boolean>(post.hasSaved  ?? false);
  const [saveCount,    setSaveCount]    = useState<number>(post.saveCount  ?? 0);

  // ── Carousel ───────────────────────────────────────────
  const [mediaIdx, setMediaIdx] = useState(0);
  const media = post.mediaItems ?? [];

  // ── Double-tap overlay ─────────────────────────────────
  const [showOverlay,   setShowOverlay]   = useState(false);

  // ── Reaction picker ────────────────────────────────────
  const [showReactions, setShowReactions] = useState(false);
  const likeHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Caption expand ─────────────────────────────────────
  const [expanded, setExpanded] = useState(false);

  // ── Video state 
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(true);

  // ── Comment sheet 
  const [showComments, setShowComments] = useState(false);

  // ── Menu 
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  // ── Handlers 
  const handleLike = useCallback(async (emoji: ReactionEmoji = "❤️") => {
    const prevLiked = liked;
    const prevCount = likeCount;

    // Optimistic update
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await toggleLike(post._id, emoji);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      // Rollback
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }, [liked, likeCount, post._id]);

  const handleDoubleTap = useCallback(() => {
    if (!liked) {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), 900);
      handleLike("❤️");
    }
  }, [liked, handleLike]);

  const handleSave = async () => {
    const prev      = saved;
    const prevCount = saveCount;
    setSaved(!prev);
    setSaveCount(prev ? saveCount - 1 : saveCount + 1);
    try {
      const res = await toggleSave(post._id);
      setSaved(res.saved);
      setSaveCount(res.saveCount);
    } catch {
      setSaved(prev);
      setSaveCount(prevCount);
    }
  };

  const handleVideoTap = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else         { videoRef.current.play();  setPlaying(true);  }
  };

  const handleLikeHoldStart = () => {
    likeHoldTimer.current = setTimeout(() => setShowReactions(true), 500);
  };
  const handleLikeHoldEnd = () => {
    if (likeHoldTimer.current) clearTimeout(likeHoldTimer.current);
  };

  const handleReactionPick = (emoji: ReactionEmoji) => {
    setShowReactions(false);
    handleLike(emoji);
  };

  // ── Derived ────────────────────────────────────────────
  const isOwner        = currentUserId === post.userId;
  const owner          = post.owner;
  const caption        = post.caption ?? "";
  const captionWords   = caption.split(" ");
  const needsTruncate  = captionWords.length > 20;
  const displayCaption = expanded || !needsTruncate
    ? caption
    : captionWords.slice(0, 20).join(" ") + "…";

  return (
    <article
      className="flex flex-col gap-0 mb-6"
      style={{
        background:   themeStyles.cardBg,
        border:       `1px solid ${themeStyles.border}`,
        borderRadius: 20,
        overflow:     "hidden",
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          className="flex items-center gap-3"
          onClick={() =>
            router.push(
              isOwner ? "/profile" : `/profile/${owner?.username ?? post.userId}`,
            )
          }
        >
          <div
            className="w-10 h-10 rounded-full overflow-hidden relative flex-shrink-0"
            style={{ border: `2px solid ${themeStyles.border}` }}
          >
            {owner?.profile_picture ? (
              <Image
                src={owner.profile_picture}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                {(owner?.name ?? "U")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              <span
                className="text-[13px] font-semibold leading-none"
                style={{ color: themeStyles.text }}
              >
                {owner?.name ?? owner?.username ?? "User"}
              </span>
              {owner?.is_verified && (
                <Verified size={13} className="text-[#8860D9]" fill="#8860D9" />
              )}
            </div>
            {post.locationLabel && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} style={{ color: themeStyles.textSecondary }} />
                <span
                  className="text-[11px]"
                  style={{ color: themeStyles.textSecondary }}
                >
                  {post.locationLabel}
                </span>
              </div>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span
            className="text-[11px]"
            style={{ color: themeStyles.textSecondary }}
          >
            {timeAgo(post.createdAt)}
          </span>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ color: themeStyles.textSecondary }}
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 w-44 z-50 rounded-2xl overflow-hidden py-1 shadow-2xl"
                  style={{
                    background: themeStyles.cardBg,
                    border:     `1px solid ${themeStyles.border}`,
                  }}
                >
                  {isOwner ? (
                    <>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-medium hover:opacity-70 transition-opacity"
                        style={{ color: themeStyles.text }}
                        onClick={() => {
                          setShowMenu(false);
                          router.push(`/post/edit/${post._id}`);
                        }}
                      >
                        Edit Post
                      </button>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#FF453A] hover:opacity-70 transition-opacity"
                        onClick={() => {
                          setShowMenu(false);
                          onDelete?.(post._id);
                        }}
                      >
                        Delete Post
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#FF453A] hover:opacity-70 transition-opacity">
                        Report
                      </button>
                      <button
                        className="w-full text-left px-4 py-2.5 text-sm font-medium hover:opacity-70 transition-opacity"
                        style={{ color: themeStyles.text }}
                        onClick={() => setShowMenu(false)}
                      >
                        Not Interested
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Media ──────────────────────────────────────── */}
      {media.length > 0 && (
        <div
          className="relative w-full"
          style={{ aspectRatio: "4/5", maxHeight: 600, background: "#0a0a0a" }}
        >
          {/* Double-tap heart overlay */}
          {showOverlay && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <Heart
                size={80}
                className="text-white drop-shadow-2xl"
                fill="white"
                style={{ animation: "heartPop 0.8s ease forwards" }}
              />
            </div>
          )}

          {(() => {
            const item = media[mediaIdx];
            if (!item) return null;
            return item.type === "video" ? (
              <div
                className="relative w-full h-full"
                onDoubleClick={handleDoubleTap}
              >
                <video
                  ref={videoRef}
                  src={item.url}
                  className="w-full h-full object-contain"
                  loop
                  muted={muted}
                  playsInline
                  onClick={handleVideoTap}
                />
                {!playing && (
                  <button
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={handleVideoTap}
                  >
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Play size={24} className="text-white ml-1" fill="white" />
                    </div>
                  </button>
                )}
                <button
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                  onClick={() => setMuted(!muted)}
                >
                  {muted
                    ? <VolumeX size={14} className="text-white" />
                    : <Volume2 size={14} className="text-white" />}
                </button>
              </div>
            ) : (
              <div
                className="relative w-full h-full"
                onDoubleClick={handleDoubleTap}
              >
                <Image
                  src={item.url}
                  alt="post media"
                  fill
                  className="object-contain"
                  unoptimized
                  sizes="(max-width: 700px) 100vw, 700px"
                />
              </div>
            );
          })()}

          {/* Carousel nav */}
          {media.length > 1 && (
            <>
              {mediaIdx > 0 && (
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-10"
                  onClick={() => setMediaIdx((i) => i - 1)}
                >
                  <ChevronLeft size={18} className="text-white" />
                </button>
              )}
              {mediaIdx < media.length - 1 && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-10"
                  onClick={() => setMediaIdx((i) => i + 1)}
                >
                  <ChevronRight size={18} className="text-white" />
                </button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {media.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setMediaIdx(i)}
                    className="transition-all duration-200"
                    style={{
                      width:        i === mediaIdx ? 16 : 6,
                      height:       6,
                      borderRadius: 3,
                      background:   i === mediaIdx
                        ? "#8860D9"
                        : "rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Action Bar ─────────────────────────────────── */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-4">

          {/* Like + reaction picker */}
          <div className="relative">
            {showReactions && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowReactions(false)}
                />
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-1 px-3 py-2 rounded-full z-40 shadow-2xl"
                  style={{
                    background: themeStyles.cardBg,
                    border:     `1px solid ${themeStyles.border}`,
                  }}
                >
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      className="text-xl hover:scale-125 transition-transform active:scale-90"
                      onClick={() => handleReactionPick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button
              onMouseDown={handleLikeHoldStart}
              onMouseUp={handleLikeHoldEnd}
              onTouchStart={handleLikeHoldStart}
              onTouchEnd={handleLikeHoldEnd}
              onClick={() => { if (!showReactions) handleLike(); }}
              className="flex items-center gap-1.5 group active:scale-90 transition-transform"
            >
              <Heart
                size={22}
                fill={liked ? "#8860D9" : "none"}
                stroke={liked ? "#8860D9" : themeStyles.textSecondary}
                style={{ transition: "transform 0.2s, fill 0.2s" }}
              />
              {!post.likesHidden && (
                <span
                  className="text-[13px] font-medium"
                  style={{ color: liked ? "#8860D9" : themeStyles.textSecondary }}
                >
                  {formatCount(likeCount)}
                </span>
              )}
            </button>
          </div>

          {/* Comment */}
          <button
            className="flex items-center gap-1.5 active:scale-90 transition-transform"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle size={22} style={{ color: themeStyles.textSecondary }} />
            <span
              className="text-[13px] font-medium"
              style={{ color: themeStyles.textSecondary }}
            >
              {formatCount(commentCount)}
            </span>
          </button>
          <button
            className="flex items-center gap-1.5 active:scale-90 transition-transform"
            onClick={() => setShowShareModal(true)}
          >
            <Send size={20} style={{ color: themeStyles.textSecondary }} />
            {shareCount > 0 && (
              <span
                className="text-[13px] font-medium"
                style={{ color: themeStyles.textSecondary }}
              >
                {formatCount(shareCount)}
              </span>
            )}
          </button>
        </div>

        {/* Save */}
        <button className="active:scale-90 transition-transform" onClick={handleSave}>
          <Bookmark
            size={22}
            fill={saved ? "#8860D9" : "none"}
            stroke={saved ? "#8860D9" : themeStyles.textSecondary}
            style={{ transition: "fill 0.2s, stroke 0.2s" }}
          />
        </button>
      </div>

      {/* ── Caption ────────────────────────────────────── */}
      {caption && (
        <div className="px-4 pb-3">
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: themeStyles.text }}
          >
            <span className="font-semibold mr-1">
              {owner?.username ?? "user"}
            </span>
            {displayCaption}
            {needsTruncate && !expanded && (
              <button
                className="ml-1 text-[13px] font-medium"
                style={{ color: themeStyles.textSecondary }}
                onClick={() => setExpanded(true)}
              >
                more
              </button>
            )}
          </p>
          {commentCount > 0 && (
            <button
              className="mt-1 text-[12px] font-medium"
              style={{ color: themeStyles.textSecondary }}
              onClick={() => setShowComments(true)}
            >
              View all {commentCount} comments
            </button>
          )}
        </div>
      )}

      {/* ── Comment Sheet  */}
      <CommentSheet
        postId={post._id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentCount={commentCount}
        onCommentAdded={() => setCommentCount((c) => c + 1)}
        currentUserId={currentUserId}
      />
      {/* Share Modal */}
      {showShareModal && typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 9999, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowShareModal(false)}
          >
            <div onClick={e => e.stopPropagation()}>
              <PostShareBar
                postId={post._id}
                postOwnerId={post.userId}
                onClose={() => setShowShareModal(false)}
              />
            </div>
          </div>,
          document.body
        )
      }
      <style jsx global>{`
        @keyframes heartPop {
          0%   { transform: scale(0);   opacity: 1; }
          60%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>
    </article>
  );
}
