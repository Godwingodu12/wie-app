"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import {
  X, Send, Heart, ChevronDown, Loader2,
  Smile, Image as ImageIcon, Search,
} from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import {
  getPostComments, addComment, replyToComment,
  likeComment, searchGiphy,
} from "@/services/postService";
import type { PostComment, PostCommentReply } from "@/types/post";

// ── Types ─────────────────────────────────────────────────────────────────
interface CommentSheetProps {
  postId:         string;
  isOpen:         boolean;
  onClose:        () => void;
  commentCount:   number;
  onCommentAdded: () => void;
  currentUserId?: string;
}

type MediaTab = "emoji" | "gif" | "sticker";

interface GiphyItem {
  id:      string;
  title:   string;
  preview: string;
  url:     string;
}

// ── Emoji data (grouped) ──────────────────────────────────────────────────
const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: ["😀","😂","🤣","😅","😊","😇","🥰","😍","🤩","😘","😗","😙",
             "😚","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐",
             "😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤",
             "😴","😷","🤒","🤕","🤢","🤧","🥵","🥶","😵","🤯","🤠","🥳"],
  },
  {
    label: "Gestures",
    emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘",
             "🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛",
             "🤜","👏","🙌","👐","🤲","🤝","🙏","💪","🦾","🦿"],
  },
  {
    label: "Hearts",
    emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕",
             "💞","💓","💗","💖","💘","💝","💟","♥️","❤️‍🔥","❤️‍🩹"],
  },
  {
    label: "Reactions",
    emojis: ["👀","👁","👅","💋","💄","💅","🤳","💁","🙆","🙅","🤦","🤷",
             "💃","🕺","🎉","🎊","🔥","⚡","✨","💫","🌟","⭐","🌈","🎭"],
  },
  {
    label: "Animals",
    emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁",
             "🐮","🐷","🐸","🐵","🙈","🙉","🙊","🦄","🐔","🐧","🐦","🦅"],
  },
  {
    label: "Food",
    emojis: ["🍕","🍔","🌮","🌯","🥙","🧆","🥚","🍳","🥘","🍲","🥗","🍿",
             "🧁","🎂","🍰","🍩","🍪","🍫","🍬","🍭","🍦","🍧","🍨","🧋"],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

// ── Main component ────────────────────────────────────────────────────────
export default function CommentSheet({
  postId, isOpen, onClose, commentCount, onCommentAdded, currentUserId,
}: CommentSheetProps) {
  const { themeStyles, isDark } = useTheme();

  // Core state
  const [comments,   setComments]   = useState<PostComment[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [text,       setText]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo,    setReplyTo]    = useState<{ commentId: string; name: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [mounted,    setMounted]    = useState(false);

  // Media picker state
  const [mediaTab,     setMediaTab]     = useState<MediaTab>("emoji");
  const [showPicker,   setShowPicker]   = useState(false);
  const [emojiSearch,  setEmojiSearch]  = useState("");
  const [gifSearch,    setGifSearch]    = useState("");
  const [gifItems,     setGifItems]     = useState<GiphyItem[]>([]);
  const [stickerItems, setStickerItems] = useState<GiphyItem[]>([]);
  const [gifLoading,   setGifLoading]   = useState(false);
  const [selectedGif,  setSelectedGif]  = useState<string | null>(null);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  const inputRef    = useRef<HTMLInputElement>(null);
  const gifTimer    = useRef<ReturnType<typeof setTimeout>>();

  // ── Mount guard ────────────────────────────────────────────────────────
  useEffect(() => { setMounted(true); }, []);

  // ── Load comments ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getPostComments(postId, 1, 30)
      .then(({ comments: c }) => setComments(c))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, postId]);

  // ── Auto-focus ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, replyTo]);

  // ── Body scroll lock ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ── Load GIFs/stickers when tab changes or search changes ──────────────
  useEffect(() => {
    if (!showPicker) return;
    if (mediaTab !== "gif" && mediaTab !== "sticker") return;

    clearTimeout(gifTimer.current);
    const type = mediaTab === "gif" ? "gifs" : "stickers";

    gifTimer.current = setTimeout(async () => {
      setGifLoading(true);
      try {
        const results = await searchGiphy(gifSearch, type);
        if (mediaTab === "gif") setGifItems(results);
        else setStickerItems(results);
      } catch { /* silently fail */ }
      finally { setGifLoading(false); }
    }, gifSearch ? 400 : 0);

    return () => clearTimeout(gifTimer.current);
  }, [showPicker, mediaTab, gifSearch]);

  // ── Submit comment / reply ─────────────────────────────────────────────
  const handleSubmit = async () => {
    const hasContent = text.trim() || selectedGif || selectedSticker;
    if (!hasContent || submitting) return;
    setSubmitting(true);

    try {
      if (replyTo) {
        const reply = await replyToComment(
          postId,
          replyTo.commentId,
          text.trim(),
          selectedGif ?? undefined,
          selectedSticker ?? undefined,
        );
        setComments(prev =>
          prev.map(c =>
            c._id === replyTo.commentId
              ? { ...c, replies: [...(c.replies ?? []), reply] }
              : c,
          ),
        );
        setReplyTo(null);
      } else {
        const newComment = await addComment(
          postId,
          text.trim(),
          selectedGif ?? undefined,
          selectedSticker ?? undefined,
        );
        setComments(prev => [newComment, ...prev]);
        onCommentAdded();
      }

      // Reset input
      setText("");
      setSelectedGif(null);
      setSelectedSticker(null);
      setShowPicker(false);
    } catch (e) {
      console.error("Comment submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Like comment ───────────────────────────────────────────────────────
  const handleLikeComment = async (commentId: string) => {
    const prev = comments.find(c => c._id === commentId);
    if (!prev) return;
    const alreadyLiked = prev.likes.includes(currentUserId ?? "");
    setComments(cs =>
      cs.map(c =>
        c._id === commentId
          ? {
              ...c,
              likeCount: alreadyLiked ? c.likeCount - 1 : c.likeCount + 1,
              likes: alreadyLiked
                ? c.likes.filter(id => id !== currentUserId)
                : [...c.likes, currentUserId ?? ""],
            }
          : c,
      ),
    );
    try {
      await likeComment(postId, commentId);
    } catch {
      setComments(cs => cs.map(c => (c._id === commentId ? prev : c)));
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  // ── Emoji filtered list ────────────────────────────────────────────────
  const filteredEmojis = emojiSearch.trim()
    ? EMOJI_GROUPS.flatMap(g => g.emojis).filter(e =>
        e.includes(emojiSearch) ||
        EMOJI_GROUPS.find(g => g.emojis.includes(e))?.label
          .toLowerCase()
          .includes(emojiSearch.toLowerCase()),
      )
    : null; // null = show grouped

  // ── Clear selected media ───────────────────────────────────────────────
  const clearMedia = () => {
    setSelectedGif(null);
    setSelectedSticker(null);
  };

  if (!isOpen || !mounted) return null;

  // ─────────────────────────────────────────────────────────────────────
  const pickerBg    = isDark ? "#1c1c22" : "#f5f5f7";
  const pickerBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const inputBg     = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  const sheet = (
    <>
      {/* Backdrop */}
      <div
        style={{
          position:        "fixed",
          inset:           0,
          zIndex:          9998,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter:  "blur(4px)",
        }}
        onClick={() => { setShowPicker(false); onClose(); }}
      />

      {/* Sheet */}
      <div
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        9999,
          maxHeight:     "88vh",
          display:       "flex",
          flexDirection: "column",
          background:    themeStyles.cardBg,
          borderRadius:  "24px 24px 0 0",
          border:        `1px solid ${themeStyles.border}`,
          borderBottom:  "none",
          boxShadow:     "0 -8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center pt-3 pb-2 px-4 flex-shrink-0">
          <div className="w-10 h-1 rounded-full mb-3" style={{ background: themeStyles.border }} />
          <div className="flex items-center justify-between w-full">
            <h3 className="text-[15px] font-semibold" style={{ color: themeStyles.text }}>
              Comments {commentCount > 0 && `· ${commentCount}`}
            </h3>
            <button
              onClick={() => { setShowPicker(false); onClose(); }}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Comments list ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-5 min-h-0">
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Text bubble */}
                      {(comment.text || (!comment.gifUrl && !comment.stickerUrl)) && (
                        <div
                          className="px-3 py-2 rounded-2xl text-sm leading-relaxed inline-block max-w-full"
                          style={{ background: themeStyles.pillBg }}
                        >
                          <span className="font-semibold mr-1" style={{ color: themeStyles.text }}>
                            {comment.username ?? comment.name}
                          </span>
                          <span style={{ color: themeStyles.text }}>{comment.text}</span>
                        </div>
                      )}
                      {/* GIF */}
                      {(comment as any).gifUrl && (
                        <div className="mt-1 rounded-xl overflow-hidden inline-block max-w-[200px]">
                          {comment.text && (
                            <p className="text-xs font-semibold mb-1" style={{ color: themeStyles.textSecondary }}>
                              {comment.username ?? comment.name}
                            </p>
                          )}
                          <img
                            src={(comment as any).gifUrl}
                            alt="GIF"
                            className="rounded-xl max-w-[200px] max-h-[150px] object-cover"
                          />
                        </div>
                      )}

                      {/* Sticker */}
                      {(comment as any).stickerUrl && (
                        <div className="mt-1 inline-block">
                          {comment.text && (
                            <p className="text-xs font-semibold mb-1" style={{ color: themeStyles.textSecondary }}>
                              {comment.username ?? comment.name}
                            </p>
                          )}
                          <img
                            src={(comment as any).stickerUrl}
                            alt="Sticker"
                            className="w-20 h-20 object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Like button */}
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

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1 ml-1">
                    <span className="text-[11px]" style={{ color: themeStyles.textSecondary }}>
                      {comment.createdAt ? timeAgo(String(comment.createdAt)) : ""}
                    </span>
                    <button
                      className="text-[11px] font-semibold"
                      style={{ color: themeStyles.textSecondary }}
                      onClick={() => {
                        setReplyTo({ commentId: comment._id, name: comment.name });
                        setShowPicker(false);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                    >
                      Reply
                    </button>
                    {(comment.replies?.length ?? 0) > 0 && (
                      <button
                        className="flex items-center gap-1 text-[11px] font-semibold text-[#8860D9]"
                        onClick={() => toggleReplies(comment._id)}
                      >
                        <ChevronDown
                          size={12}
                          style={{
                            transform:  expandedReplies.has(comment._id) ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        />
                        {expandedReplies.has(comment._id) ? "Hide" : comment.replies.length} replies
                      </button>
                    )}
                  </div>

                  {/* Replies */}
                  {expandedReplies.has(comment._id) &&
                    (comment.replies ?? []).map((reply: PostCommentReply, ri: number) => (
                      <div key={reply._id ?? `${comment._id}-r-${ri}`} className="flex gap-2 mt-3 ml-2">
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
                        <div className="flex-1 min-w-0">
                          {(reply.text || (!((reply as any).gifUrl) && !((reply as any).stickerUrl))) && (
                            <div
                              className="px-3 py-1.5 rounded-2xl text-sm leading-relaxed inline-block"
                              style={{ background: themeStyles.pillBg }}
                            >
                              <span className="font-semibold mr-1" style={{ color: themeStyles.text }}>
                                {reply.name}
                              </span>
                              <span style={{ color: themeStyles.text }}>{reply.text}</span>
                            </div>
                          )}
                          {(reply as any).gifUrl && (
                            <img src={(reply as any).gifUrl} alt="GIF"
                              className="rounded-xl max-w-[160px] max-h-[120px] object-cover mt-1" />
                          )}
                          {(reply as any).stickerUrl && (
                            <img src={(reply as any).stickerUrl} alt="Sticker"
                              className="w-16 h-16 object-contain mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Media Picker ─────────────────────────────────────────────── */}
        {showPicker && (
          <div
            className="flex-shrink-0 border-t"
            style={{
              background:  pickerBg,
              borderColor: pickerBorder,
              maxHeight:   320,
              display:     "flex",
              flexDirection: "column",
            }}
          >
            {/* Tab bar */}
            <div
              className="flex items-center gap-1 px-3 pt-2 pb-1 flex-shrink-0"
              style={{ borderBottom: `1px solid ${pickerBorder}` }}
            >
              {(["emoji", "gif", "sticker"] as MediaTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setMediaTab(tab); setGifSearch(""); }}
                  className="px-3 py-1 rounded-full text-[12px] font-semibold capitalize transition-all"
                  style={{
                    background: mediaTab === tab
                      ? "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)"
                      : "transparent",
                    color: mediaTab === tab ? "#fff" : themeStyles.textSecondary,
                  }}
                >
                  {tab === "emoji" ? "😊 Emoji" : tab === "gif" ? "🎬 GIF" : "✨ Sticker"}
                </button>
              ))}

              {/* Search for emoji/gif/sticker */}
              <div
                className="flex-1 flex items-center gap-2 px-3 rounded-full ml-2"
                style={{ background: inputBg, height: 30 }}
              >
                <Search size={12} style={{ color: themeStyles.textSecondary }} />
                <input
                  value={mediaTab === "emoji" ? emojiSearch : gifSearch}
                  onChange={e =>
                    mediaTab === "emoji"
                      ? setEmojiSearch(e.target.value)
                      : setGifSearch(e.target.value)
                  }
                  placeholder={`Search ${mediaTab}s…`}
                  className="flex-1 bg-transparent outline-none text-[12px]"
                  style={{ color: themeStyles.text }}
                />
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>

              {/* ── Emoji tab ── */}
              {mediaTab === "emoji" && (
                <div>
                  {filteredEmojis ? (
                    <div className="flex flex-wrap gap-0.5">
                      {filteredEmojis.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setText(t => t + emoji);
                            inputRef.current?.focus();
                          }}
                          className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-90"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  ) : (
                    EMOJI_GROUPS.map(group => (
                      <div key={group.label} className="mb-3">
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider mb-1 px-1"
                          style={{ color: themeStyles.textSecondary }}
                        >
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-0.5">
                          {group.emojis.map((emoji, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setText(t => t + emoji);
                                inputRef.current?.focus();
                              }}
                              className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors active:scale-90"
                              title={emoji}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── GIF tab ── */}
              {mediaTab === "gif" && (
                gifLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 size={24} className="animate-spin text-[#8860D9]" />
                  </div>
                ) : gifItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <span className="text-3xl">🎬</span>
                    <p className="text-xs" style={{ color: themeStyles.textSecondary }}>
                      {gifSearch ? "No GIFs found" : "Search for GIFs"}
                    </p>
                  </div>
                ) : (
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                  >
                    {gifItems.map(gif => (
                      <button
                        key={gif.id}
                        onClick={() => {
                          setSelectedGif(gif.url);
                          setSelectedSticker(null);
                          setShowPicker(false);
                        }}
                        className="relative aspect-video rounded-lg overflow-hidden hover:ring-2 hover:ring-[#8860D9] transition-all active:scale-95"
                      >
                        <img
                          src={gif.preview || gif.url}
                          alt={gif.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* ── Sticker tab ── */}
              {mediaTab === "sticker" && (
                gifLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 size={24} className="animate-spin text-[#8860D9]" />
                  </div>
                ) : stickerItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <span className="text-3xl">✨</span>
                    <p className="text-xs" style={{ color: themeStyles.textSecondary }}>
                      {gifSearch ? "No stickers found" : "Search for stickers"}
                    </p>
                  </div>
                ) : (
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: "repeat(4, 1fr)" }}
                  >
                    {stickerItems.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedSticker(s.url);
                          setSelectedGif(null);
                          setShowPicker(false);
                        }}
                        className="aspect-square rounded-xl overflow-hidden p-1 hover:bg-white/10 transition-all active:scale-95"
                      >
                        <img
                          src={s.preview || s.url}
                          alt={s.title}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* ── Input area ───────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0"
          style={{
            borderTop:     `1px solid ${themeStyles.border}`,
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
            background:    themeStyles.cardBg,
          }}
        >
          {/* Reply-to pill */}
          {replyTo && (
            <div
              className="mx-4 mt-2 mb-1 flex items-center justify-between px-3 py-1.5 rounded-xl text-xs"
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

          {/* Selected GIF/Sticker preview */}
          {(selectedGif || selectedSticker) && (
            <div className="mx-4 mt-2 mb-1 relative inline-block">
              <img
                src={(selectedGif || selectedSticker)!}
                alt="Selected"
                className={selectedGif
                  ? "rounded-xl max-h-[100px] max-w-[160px] object-cover"
                  : "w-16 h-16 object-contain rounded-xl"
                }
              />
              <button
                onClick={clearMedia}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "#FF453A" }}
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          )}

          {/* Input row */}
          <div className="flex items-center gap-2 px-4 pt-2">
            {/* Emoji / GIF / Sticker toggle */}
            <button
              onClick={() => setShowPicker(p => !p)}
              className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all"
              style={{
                background: showPicker
                  ? "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)"
                  : themeStyles.pillBg,
                color: showPicker ? "#fff" : themeStyles.textSecondary,
              }}
              title="Emoji / GIF / Sticker"
            >
              <Smile size={18} />
            </button>

            {/* Text input */}
            <div
              className="flex-1 flex items-center rounded-2xl px-3"
              style={{
                background: inputBg,
                border:     `1px solid ${themeStyles.border}`,
                minHeight:  40,
              }}
            >
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                }}
                placeholder={
                  replyTo
                    ? `Reply to ${replyTo.name}…`
                    : "Add a comment…"
                }
                className="flex-1 bg-transparent outline-none text-sm py-2"
                style={{ color: themeStyles.text }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && !selectedGif && !selectedSticker) || submitting}
              className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 disabled:opacity-40 transition-all active:scale-90"
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
      </div>
    </>
  );
  return ReactDOM.createPortal(sheet, document.body);
}
