"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import { X, Send, Heart, ChevronDown, Loader2 } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import {
  getPostComments, addComment, replyToComment, likeComment,
} from "@/services/postService";
import type { PostComment, PostCommentReply } from "@/types/post";

interface CommentSheetProps {
  postId:         string;
  isOpen:         boolean;
  onClose:        () => void;
  commentCount:   number;
  onCommentAdded: () => void;
  currentUserId?: string;
}

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export default function CommentSheet({
  postId, isOpen, onClose, commentCount, onCommentAdded, currentUserId,
}: CommentSheetProps) {
  const { themeStyles } = useTheme();
  const [comments,      setComments]      = useState<PostComment[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [text,          setText]          = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [replyTo,       setReplyTo]       = useState<{ commentId: string; name: string } | null>(null);
  const [expandedReply, setExpandedReply] = useState<Set<string>>(new Set());
  const [mounted,       setMounted]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure we're on the client before using portals
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getPostComments(postId, 1, 30)
      .then(({ comments: c }) => setComments(c))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, postId]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, replyTo]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      if (replyTo) {
        const reply = await replyToComment(postId, replyTo.commentId, text.trim());
        setComments(prev =>
          prev.map(c =>
            c._id === replyTo.commentId
              ? { ...c, replies: [...(c.replies ?? []), reply] }
              : c,
          ),
        );
        setReplyTo(null);
      } else {
        const newComment = await addComment(postId, text.trim());
        setComments(prev => [newComment, ...prev]);
        onCommentAdded();
      }
      setText("");
    } catch (e) {
      console.error("Comment submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    const prev = comments.find(c => c._id === commentId);
    if (!prev) return;
    const alreadyLiked = prev.likes.includes(currentUserId ?? "");
    setComments(c =>
      c.map(comment =>
        comment._id === commentId
          ? {
              ...comment,
              likeCount: alreadyLiked ? comment.likeCount - 1 : comment.likeCount + 1,
              likes: alreadyLiked
                ? comment.likes.filter(id => id !== currentUserId)
                : [...comment.likes, currentUserId ?? ""],
            }
          : comment,
      ),
    );
    try {
      await likeComment(postId, commentId);
    } catch {
      setComments(c => c.map(comment => (comment._id === commentId ? prev : comment)));
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReply(prev => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  if (!isOpen || !mounted) return null;

  const sheet = (
    <>
      {/* Backdrop — portaled to body so it covers full viewport */}
      <div
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          9998,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter:  "blur(4px)",
        }}
        onClick={onClose}
      />

      {/* Sheet — anchored to real viewport bottom */}
      <div
        style={{
          position:     "fixed",
          bottom:       0,
          left:         0,
          right:        0,
          zIndex:       9999,
          maxHeight:    "80vh",
          display:      "flex",
          flexDirection:"column",
          background:   themeStyles.cardBg,
          borderRadius: "24px 24px 0 0",
          border:       `1px solid ${themeStyles.border}`,
          borderBottom: "none",
          boxShadow:    "0 -8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Handle + header */}
        <div className="flex flex-col items-center pt-3 pb-2 px-4">
          <div
            className="w-10 h-1 rounded-full mb-3"
            style={{ background: themeStyles.border }}
          />
          <div className="flex items-center justify-between w-full">
            <h3 className="text-[15px] font-semibold" style={{ color: themeStyles.text }}>
              Comments {commentCount > 0 && `· ${commentCount}`}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-[#8860D9]" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <span className="text-3xl">💬</span>
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>
                No comments yet. Be the first!
              </p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment._id ?? `c-${Math.random()}`} className="flex gap-3">
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative"
                  style={{ border: `1px solid ${themeStyles.border}` }}
                >
                  {comment.profile_picture ? (
                    <Image src={comment.profile_picture} alt="" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center text-white text-xs font-bold">
                      {(comment.name ?? "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="px-3 py-2 rounded-2xl text-sm leading-relaxed"
                      style={{ background: themeStyles.pillBg }}
                    >
                      <span className="font-semibold mr-1" style={{ color: themeStyles.text }}>
                        {comment.username ?? comment.name}
                      </span>
                      <span style={{ color: themeStyles.text }}>{comment.text}</span>
                    </div>
                    <button
                      className="flex flex-col items-center gap-0.5 pt-1 flex-shrink-0"
                      onClick={() => handleLikeComment(comment._id)}
                    >
                      <Heart
                        size={14}
                        fill={comment.likes.includes(currentUserId ?? "") ? "#8860D9" : "none"}
                        stroke={comment.likes.includes(currentUserId ?? "") ? "#8860D9" : themeStyles.textSecondary}
                      />
                      {comment.likeCount > 0 && (
                        <span className="text-[10px]" style={{ color: themeStyles.textSecondary }}>
                          {comment.likeCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <span className="text-[11px]" style={{ color: themeStyles.textSecondary }}>
                      {timeAgo(comment.createdAt)}
                    </span>
                    <button
                      className="text-[11px] font-semibold"
                      style={{ color: themeStyles.textSecondary }}
                      onClick={() => {
                        setReplyTo({ commentId: comment._id, name: comment.name });
                        inputRef.current?.focus();
                      }}
                    >
                      Reply
                    </button>
                    {comment.replies?.length > 0 && (
                      <button
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#8860D9]"
                        onClick={() => toggleReplies(comment._id)}
                      >
                        <ChevronDown
                          size={12}
                          style={{
                            transform:  expandedReply.has(comment._id) ? "rotate(180deg)" : "rotate(0)",
                            transition: "transform 0.2s",
                          }}
                        />
                        {expandedReply.has(comment._id) ? "Hide" : comment.replies.length} replies
                      </button>
                    )}
                  </div>

                  {/* Replies */}
                  {expandedReply.has(comment._id) &&
                    (comment.replies ?? []).map((reply: PostCommentReply, replyIdx: number) => (
                      <div
                        key={reply._id ?? `${comment._id}-reply-${replyIdx}`}
                        className="flex gap-2 mt-3 ml-2"
                      >
                        <div
                          className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 relative"
                          style={{ border: `1px solid ${themeStyles.border}` }}
                        >
                          {reply.profile_picture ? (
                            <Image src={reply.profile_picture} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] to-[#8860D9] flex items-center justify-center text-white text-[9px] font-bold">
                              {(reply.name ?? "U")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-2xl text-sm leading-relaxed flex-1"
                          style={{ background: themeStyles.pillBg }}
                        >
                          <span className="font-semibold mr-1" style={{ color: themeStyles.text }}>
                            {reply.name}
                          </span>
                          <span style={{ color: themeStyles.text }}>{reply.text}</span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div
          className="relative flex items-center gap-3 px-4 py-3"
          style={{
            borderTop:     `1px solid ${themeStyles.border}`,
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
          }}
        >
          {/* Reply-to pill */}
          {replyTo && (
            <div
              className="absolute -top-9 left-4 right-4 flex items-center justify-between px-3 py-1.5 rounded-xl text-xs"
              style={{ background: themeStyles.pillBg }}
            >
              <span style={{ color: themeStyles.textSecondary }}>
                Replying to{" "}
                <span className="font-semibold text-[#8860D9]">@{replyTo.name}</span>
              </span>
              <button onClick={() => setReplyTo(null)}>
                <X size={12} style={{ color: themeStyles.textSecondary }} />
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSubmit()}
            placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Add a comment…"}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: themeStyles.text }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="flex items-center justify-center w-8 h-8 rounded-full disabled:opacity-40 transition-opacity"
            style={{
              background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)",
            }}
          >
            {submitting
              ? <Loader2 size={14} className="text-white animate-spin" />
              : <Send    size={14} className="text-white" />
            }
          </button>
        </div>
      </div>
    </>
  );
  // Portal mounts directly on document.body — completely outside the post card DOM tree
  return ReactDOM.createPortal(sheet, document.body);
}
