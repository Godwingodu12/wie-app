"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Heart, Smile } from "lucide-react";
import { getFluxComments, addFluxComment, likeFluxComment } from "@/services/mediaService";
import { useAuth } from "@/hooks/useAuth";

interface Comment {
  _id:       string;
  userId:    string;
  text:      string;
  likes:     string[];
  createdAt: string;
  name?:     string;
  avatar?:   string;
  username?: string;
}

interface CommentSheetProps {
  fluxId:   string;
  isOwner:  boolean;
  onClose:  () => void;
}

const QUICK_EMOJIS = ["🔥", "❤️", "😂", "😮", "👏", "💯", "✨", "👀"];

export default function CommentSheet({ fluxId, isOwner, onClose }: CommentSheetProps) {
  const { user }                           = useAuth(true);
  const [comments,    setComments]         = useState<Comment[]>([]);
  const [input,       setInput]            = useState("");
  const [sending,     setSending]          = useState(false);
  const [loading,     setLoading]          = useState(true);
  const [replyTo,     setReplyTo]          = useState<Comment | null>(null);
  const [showEmoji,   setShowEmoji]        = useState(false);
  const [likedMap,    setLikedMap]         = useState<Record<string, boolean>>({});
  const inputRef                           = useRef<HTMLInputElement>(null);
  const listRef                            = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const data = await getFluxComments(fluxId);
      if (data.success) {
        setComments(data.comments ?? []);
        // Build liked map for current user
        const userId = String(user?.id ?? "");
        const map: Record<string, boolean> = {};
        (data.comments ?? []).forEach((c: Comment) => {
          map[c._id] = (c.likes ?? []).includes(userId);
        });
        setLikedMap(map);
      }
    } catch {}
    setLoading(false);
  }, [fluxId, user?.id]);

  useEffect(() => {
    fetchComments();
    // Auto-focus input
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [fetchComments]);

  const handleSend = async () => {
    const text = replyTo
      ? `@${replyTo.username ?? "user"} ${input.trim()}`
      : input.trim();
    if (!text || sending) return;

    setSending(true);
    const optimistic: Comment = {
      _id:       `temp-${Date.now()}`,
      userId:    String(user?.id ?? ""),
      text,
      likes:     [],
      createdAt: new Date().toISOString(),
      name:      (user as any)?.name ?? (user as any)?.username ?? "You",
      avatar:    (user as any)?.profile_picture ?? null,
      username:  (user as any)?.username ?? "me",
    };

    setComments((prev) => [optimistic, ...prev]);
    setInput("");
    setReplyTo(null);

    try {
      await addFluxComment(fluxId, text);
    } catch {}
    setSending(false);
  };

  const handleLikeComment = async (comment: Comment) => {
    const was = likedMap[comment._id];
    // Optimistic
    setLikedMap((p) => ({ ...p, [comment._id]: !was }));
    setComments((prev) =>
      prev.map((c) =>
        c._id === comment._id
          ? { ...c, likes: was ? c.likes.filter((id) => id !== String(user?.id)) : [...c.likes, String(user?.id)] }
          : c,
      ),
    );
    try {
      await likeFluxComment(fluxId, comment._id);
    } catch {
      // Revert
      setLikedMap((p) => ({ ...p, [comment._id]: was }));
    }
  };

  const handleQuickEmoji = (emoji: string) => {
    setInput((p) => p + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      />

      {/* Sheet */}
      <div style={{
        position:      "fixed",
        bottom:        0,
        left:          "50%",
        transform:     "translateX(-50%)",
        width:         "min(430px, 100vw)",
        height:        "68vh",
        zIndex:        61,
        background:    "#16161A",
        borderRadius:  "16px 16px 0 0",
        border:        "1px solid rgba(255,255,255,0.08)",
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        animation:     "sheetUp 0.28s cubic-bezier(0.32,0.72,0,1)",
      }}>
        <style>{`
          @keyframes sheetUp { from { transform: translateX(-50%) translateY(100%); } to { transform: translateX(-50%) translateY(0); } }
          @keyframes heartPop { 0%{transform:scale(1)} 40%{transform:scale(1.4)} 100%{transform:scale(1)} }
          .comment-heart-btn:active { animation: heartPop 0.25s ease; }
        `}</style>

        {/* Drag handle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          padding:        "12px 20px",
          borderBottom:   "1px solid rgba(255,255,255,0.06)",
          flexShrink:     0,
          position:       "relative",
        }}>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
            Comments {comments.length > 0 && <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: 13 }}>({comments.length})</span>}
          </span>
          <button onClick={onClose} style={{ position: "absolute", right: 16, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.45)", display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "8px 16px" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 100 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #8860D9", borderTopColor: "transparent", animation: "csspin 0.75s linear infinite" }} />
              <style>{`@keyframes csspin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 140, gap: 8 }}>
              <span style={{ fontSize: 32 }}>💬</span>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>No comments yet</p>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Be the first to reply!</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c._id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {/* Avatar */}
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#2a2a35,#3d3950)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, overflow: "hidden" }}>
                  {c.avatar && <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{c.username ?? "user"}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.45 }}>{c.text}</p>
                  {/* Reply */}
                  {!isOwner && (
                    <button
                      onClick={() => { setReplyTo(c); inputRef.current?.focus(); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 11, padding: "4px 0 0", marginTop: 2 }}
                    >
                      Reply
                    </button>
                  )}
                </div>
                {/* Like comment — not available to flux owner on their own flux */}
                {!isOwner && (
                  <button
                    className="comment-heart-btn"
                    onClick={() => handleLikeComment(c)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0, padding: "2px 0" }}
                  >
                    <Heart size={13} color={likedMap[c._id] ? "#e53e3e" : "rgba(255,255,255,0.3)"} fill={likedMap[c._id] ? "#e53e3e" : "none"} />
                    {c.likes?.length > 0 && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{c.likes.length}</span>}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Quick emoji row */}
        {showEmoji && (
          <div style={{ display: "flex", gap: 6, padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
            {QUICK_EMOJIS.map((em) => (
              <button key={em} onClick={() => handleQuickEmoji(em)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "2px 6px", borderRadius: 8, flexShrink: 0 }}>
                {em}
              </button>
            ))}
          </div>
        )}

        {/* Reply indicator */}
        {replyTo && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px", background: "rgba(136,96,217,0.15)", borderTop: "1px solid rgba(136,96,217,0.2)", flexShrink: 0 }}>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
              Replying to <strong style={{ color: "#8860D9" }}>@{replyTo.username}</strong>
            </span>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex" }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div style={{
          display:      "flex",
          alignItems:   "center",
          gap:          8,
          padding:      "10px 16px 16px",
          borderTop:    "1px solid rgba(255,255,255,0.06)",
          flexShrink:   0,
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}>
          {/* My avatar */}
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#8860D9,#B3B8E2)", flexShrink: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            {(user as any)?.profile_picture && <img src={(user as any).profile_picture} alt="me" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>

          {/* Input */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "0 12px", height: 38 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Write a reply…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13 }}
            />
            <button onClick={() => setShowEmoji((p) => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", padding: 0 }}>
              <Smile size={16} />
            </button>
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              width:        36, height: 36, borderRadius: "50%", flexShrink: 0, border: "none",
              background:   input.trim() ? "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" : "rgba(255,255,255,0.1)",
              cursor:       input.trim() ? "pointer" : "default",
              display:      "flex", alignItems: "center", justifyContent: "center",
              transition:   "background 0.2s",
            }}
          >
            <Send size={14} color={input.trim() ? "#fff" : "rgba(255,255,255,0.3)"} />
          </button>
        </div>
      </div>
    </>
  );
}