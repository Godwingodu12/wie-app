'use client';
import React, { useEffect, useState, useRef } from 'react';
import {
  X, Heart, MessageCircle, Bookmark, ChevronLeft, ChevronRight,
  Play, Pause, Volume2, VolumeX, Loader2, Share2, MapPin, Eye
} from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';
import { getPostById } from '@/services/postService';
import { getUserById } from '@/services/wieUserService';
import type { Post } from '@/types/post';
import CommentSheet from "@/components/post/CommentSheet";
import PostShareBar from "@/components/post/actions/PostShareBar";
import { toggleLike, toggleSave } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";

interface PreviewPostProps {
  postId: string;
  onClose: () => void;
}

interface PostAuthor {
  _id: string;
  name: string;
  username: string;
  profile_picture?: string;
  is_verified?: boolean;
}

export default function PreviewPost({ postId, onClose }: PreviewPostProps) {
  const { themeStyles, isDark } = useTheme();
  const [post, setPost]       = useState<Post | null>(null);
  const [author, setAuthor]   = useState<PostAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [isMuted, setIsMuted]           = useState(true);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(false);
  const [hasLikedLocal,  setHasLikedLocal]  = useState(false);
  const [likeCountLocal, setLikeCountLocal] = useState(0);
  const [hasSavedLocal,  setHasSavedLocal]  = useState(false);
  const [showComments,   setShowComments]   = useState(false);
  const [showShare,      setShowShare]      = useState(false);
  const [commentCount,   setCommentCount]   = useState(0);
  const [actionLoading,  setActionLoading]  = useState(false);

  // ── Fetch post then author 
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(false);
        setAuthor(null);

        const data = await getPostById(postId);
        if (cancelled) return;
        setPost(data);

        // userId lives at data.userId (raw) or data.author?._id (enriched)
        const uid =
          (data as any).userId?.toString?.() ||
          (data as any).author?._id?.toString?.() ||
          (data as any).user?._id?.toString?.();

        if (uid) {
          try {
            const user = await getUserById(uid);
            if (!cancelled) {
              setAuthor({
                _id:             user.id || uid,
                name:            user.name || user.username || 'Unknown',
                username:        user.username || '',
                profile_picture: user.profile_picture ?? undefined,
                is_verified:     user.is_verified ?? false,
              });
            }
          } catch {
            // Author fetch failed — fall back to enriched field if present
            if (!cancelled) {
              const a = (data as any).author;
              if (a) {
                setAuthor({
                  _id:             a._id || uid,
                  name:            a.name || a.username || 'Unknown',
                  username:        a.username || '',
                  profile_picture: a.profile_picture ?? undefined,
                  is_verified:     a.is_verified ?? false,
                });
              }
            }
          }
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [postId]);
  useEffect(() => {
    if (!post) return;
    setHasLikedLocal((post as any).hasLiked  ?? false);
    setLikeCountLocal(post.likeCount ?? (post as any).likes?.length ?? 0);
    setHasSavedLocal((post as any).hasSaved  ?? false);
    setCommentCount(post.commentCount ?? (post as any).comments?.length ?? 0);
  }, [post]);
  // ── Keyboard navigation 
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   setCurrentIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight')  setCurrentIndex(i =>
        Math.min((post?.mediaItems?.length ?? 1) - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [post, onClose]);

  // ── Video helpers 
  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
    setIsPlaying(p => !p);
  };
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(m => !m);
  };
  const handleLike = async () => {
    if (actionLoading || !post) return;
    setActionLoading(true);
    const prev = { hasLikedLocal, likeCountLocal };
    setHasLikedLocal(v => !v);
    setLikeCountLocal(c => hasLikedLocal ? c - 1 : c + 1);
    try {
      const res = await toggleLike(post._id);
      setHasLikedLocal(res.liked);
      setLikeCountLocal(res.likeCount);
    } catch {
      setHasLikedLocal(prev.hasLikedLocal);
      setLikeCountLocal(prev.likeCountLocal);
    } finally { setActionLoading(false); }
  };

  const handleSave = async () => {
    if (!post) return;
    setHasSavedLocal(v => !v);
    try { await toggleSave(post._id); }
    catch { setHasSavedLocal(v => !v); }
  };

  // Derived
  const currentMedia = post?.mediaItems?.[currentIndex];
  const isVideo      = currentMedia?.type === 'video';
  const totalMedia   = post?.mediaItems?.length ?? 0;

  const likeCount    = post?.likeCount    ?? (post as any)?.likes?.length    ?? 0;
  const shareCount   = (post as any)?.shareCount ?? (post as any)?.shares?.length ?? 0;
  const saveCount    = (post as any)?.saveCount  ?? (post as any)?.saves?.length  ?? 0;
  const viewCount    = (post as any)?.viewCount  ?? 0;
  const hasLiked     = (post as any)?.hasLiked  ?? false;
  const hasSaved     = (post as any)?.hasSaved  ?? false;

  const authorName     = author?.name     || (post as any)?.author?.name     || 'Unknown';
  const authorUsername = author?.username || (post as any)?.author?.username || '';
  const authorAvatar   = author?.profile_picture || (post as any)?.author?.profile_picture;
  const authorVerified = author?.is_verified     || (post as any)?.author?.is_verified;

  // ── Styles
  const bg      = isDark ? '#0e0e0e' : '#fff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textPrimary   = isDark ? '#fff' : '#111';
  const textSecondary = isDark ? '#888' : '#666';
  const statBg  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(14px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}
      >
        <X size={18} />
      </button>

      {/* Card */}
      <div
        className="relative flex w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxWidth:  760,
          maxHeight: '88vh',
          background: bg,
          border: `1px solid ${border}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center w-full" style={{ minHeight: 440 }}>
            <Loader2 className="animate-spin" size={34} style={{ color: '#5494FF' }} />
          </div>
        )}

        {/* ── Error ── */}
        {!loading && (error || !post) && (
          <div className="flex flex-col items-center justify-center w-full gap-3 p-10" style={{ minHeight: 440 }}>
            <span style={{ fontSize: 44 }}>📭</span>
            <p className="text-sm font-medium" style={{ color: textSecondary }}>
              Post unavailable or has been deleted
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-full text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 100%)' }}
            >
              Close
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!loading && !error && post && (
          <>
            {/* LEFT — Media panel */}
            <div
              className="relative flex-shrink-0 flex items-center justify-center bg-black"
              style={{ width: '54%', minHeight: 440, maxHeight: '88vh' }}
            >
              {currentMedia ? (
                isVideo ? (
                  <>
                    <video
                      ref={videoRef}
                      src={currentMedia.url}
                      className="max-w-full max-h-full object-contain"
                      style={{ maxHeight: '88vh' }}
                      loop muted={isMuted} playsInline
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {/* Video controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                      >
                        {isPlaying
                          ? <Pause  size={13} color="#fff" />
                          : <Play   size={13} color="#fff" />}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                      >
                        {isMuted
                          ? <VolumeX size={13} color="#fff" />
                          : <Volume2 size={13} color="#fff" />}
                      </button>
                    </div>
                  </>
                ) : (
                  <img
                    src={currentMedia.url}
                    alt="Post"
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: '88vh' }}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 opacity-40">
                  <span style={{ fontSize: 48 }}>🖼️</span>
                  <span className="text-white text-xs">No media</span>
                </div>
              )}

              {/* Multi-media nav */}
              {totalMedia > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20 hover:scale-105"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <ChevronLeft size={16} color="#fff" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex(i => Math.min(totalMedia - 1, i + 1))}
                    disabled={currentIndex === totalMedia - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-20 hover:scale-105"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <ChevronRight size={16} color="#fff" />
                  </button>
                  {/* Dot indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {post.mediaItems?.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className="rounded-full transition-all"
                        style={{
                          width:  i === currentIndex ? 18 : 6,
                          height: 6,
                          background: i === currentIndex
                            ? '#5494FF'
                            : 'rgba(255,255,255,0.45)',
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — Info panel */}
            <div
              className="flex flex-col flex-1 overflow-hidden"
              style={{ minHeight: 440, maxHeight: '88vh' }}
            >
              {/* Author header */}
              <div
                className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
                style={{ borderBottom: `1px solid ${divider}` }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#B3B8E2,#8860D9)' }}
                >
                  {authorAvatar ? (
                    <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    authorName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Name + location */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>
                      {authorName}
                    </p>
                    {authorVerified && (
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    )}
                  </div>
                  {authorUsername && (
                    <p className="text-xs truncate" style={{ color: textSecondary }}>
                      @{authorUsername}
                    </p>
                  )}
                  {post.locationLabel && (
                    <p className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: textSecondary }}>
                      <MapPin size={10} />
                      {post.locationLabel}
                    </p>
                  )}
                </div>

                {/* Media counter */}
                {totalMedia > 1 && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: statBg, color: textSecondary }}
                  >
                    {currentIndex + 1}/{totalMedia}
                  </span>
                )}
              </div>

              {/* Scrollable body — caption */}
              <div
                className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {post.caption ? (
                  <div className="mb-3">
                    <span className="text-sm font-semibold mr-1.5" style={{ color: textPrimary }}>
                      {authorUsername || authorName}
                    </span>
                    <span className="text-sm" style={{ color: isDark ? '#ccc' : '#333' }}>
                      {post.caption}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: textSecondary }}>No caption</p>
                )}

                {/* Tagged users */}
                {(post as any).taggedUsers?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(post as any).taggedUsers.map((u: any) => (
                      <span
                        key={u._id || u}
                        className="text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: statBg, color: '#5494FF' }}
                      >
                        @{u.username || u}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                {(post as any).createdAt && (
                  <p className="text-[11px] mt-4 uppercase tracking-wider" style={{ color: isDark ? '#444' : '#bbb' }}>
                    {new Date((post as any).createdAt).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                )}
              </div>

              {/* Action bar + stats footer */}
              <div
                className="px-4 py-3 flex-shrink-0"
                style={{ borderTop: `1px solid ${divider}` }}
              >
                {/* Primary action buttons */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Like */}
                    <button
                      onClick={handleLike}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 transition-transform active:scale-90"
                    >
                      <Heart
                        size={22}
                        style={{ color: hasLikedLocal ? "#FF4B6E" : textSecondary }}
                        fill={hasLikedLocal ? "#FF4B6E" : "none"}
                      />
                      <span className="text-sm font-semibold" style={{ color: hasLikedLocal ? "#FF4B6E" : textPrimary }}>
                        {likeCountLocal.toLocaleString()}
                      </span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => setShowComments(true)}
                      className="flex items-center gap-1.5 transition-transform active:scale-90"
                    >
                      <MessageCircle size={22} style={{ color: textSecondary }} />
                      <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                        {commentCount.toLocaleString()}
                      </span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => setShowShare(true)}
                      className="flex items-center gap-1.5 transition-transform active:scale-90"
                    >
                      <Share2 size={22} style={{ color: textSecondary }} />
                      <span className="text-sm font-semibold" style={{ color: textPrimary }}>
                        {shareCount.toLocaleString()}
                      </span>
                    </button>
                  </div>

                  {/* Save */}
                  <button
                    onClick={handleSave}
                    className="transition-transform active:scale-90"
                  >
                    <Bookmark
                      size={22}
                      style={{ color: hasSavedLocal ? "#F59E0B" : textSecondary }}
                      fill={hasSavedLocal ? "#F59E0B" : "none"}
                    />
                  </button>
                </div>

                {/* Secondary stats */}
                <div className="grid grid-cols-2 gap-2">
                  {shareCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: statBg }}>
                      <Share2 size={14} style={{ color: textSecondary }} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: textPrimary }}>{shareCount.toLocaleString()}</p>
                        <p className="text-[10px]" style={{ color: textSecondary }}>Shares</p>
                      </div>
                    </div>
                  )}
                  {saveCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: statBg }}>
                      <Bookmark size={14} style={{ color: textSecondary }} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: textPrimary }}>{saveCount.toLocaleString()}</p>
                        <p className="text-[10px]" style={{ color: textSecondary }}>Saves</p>
                      </div>
                    </div>
                  )}
                  {viewCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl col-span-2" style={{ background: statBg }}>
                      <Eye size={14} style={{ color: textSecondary }} />
                      <div>
                        <p className="text-xs font-bold" style={{ color: textPrimary }}>{viewCount.toLocaleString()}</p>
                        <p className="text-[10px]" style={{ color: textSecondary }}>Views</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment sheet */}
              {post && (
                <CommentSheet
                  postId={post._id}
                  isOpen={showComments}
                  onClose={() => setShowComments(false)}
                  commentCount={commentCount}
                  onCommentAdded={() => setCommentCount(c => c + 1)}
                  currentUserId={user?.id}
                />
              )}

              {/* Share bar */}
              {post && showShare && (
                <div
                  className="fixed inset-0 z-[9999] flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
                  onClick={() => setShowShare(false)}
                >
                  <div onClick={e => e.stopPropagation()}>
                    <PostShareBar
                      postId={post._id}
                      postOwnerId={(post as any).userId?.toString?.()}
                      onClose={() => setShowShare(false)}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
