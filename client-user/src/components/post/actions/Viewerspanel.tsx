"use client";
import React, { useEffect, useState } from "react";
import { X, Eye, Trash2, Send, Heart, MessageCircle } from "lucide-react";
import { getFluxViewers, getFluxLikes, getFluxComments } from "@/services/mediaService";

interface ViewerUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string;
  is_verified?: boolean;
}

interface LikeUser {
  userId: string;
  emoji:  string;
  name?:  string;
  avatar?: string;
  username?: string;
}

interface CommentUser {
  _id:       string;
  userId:    string;
  text:      string;
  likes:     string[];
  createdAt: string;
  name?:     string;
  avatar?:   string;
  username?: string;
}

interface ViewersPanelProps {
  fluxId:        string;
  viewCount:     number;
  isOwner:       boolean;
  onClose:       () => void;
  onDeleteStory: () => void;
}

type Tab = "viewers" | "likes" | "comments";

export default function ViewersPanel({
  fluxId,
  viewCount,
  isOwner,
  onClose,
  onDeleteStory,
}: ViewersPanelProps) {
  const [tab,          setTab]          = useState<Tab>("viewers");
  const [viewers,      setViewers]      = useState<ViewerUser[]>([]);
  const [likes,        setLikes]        = useState<LikeUser[]>([]);
  const [comments,     setComments]     = useState<CommentUser[]>([]);
  const [likeCount,    setLikeCount]    = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!fluxId) return;
    setLoading(true);

    Promise.all([
      getFluxViewers(fluxId).catch(() => ({ viewers: [], total: 0, reactions: [], viewCount: 0 })),
      getFluxLikes(fluxId).catch(() => ({ success: false, total: 0, likes: [] })),
      getFluxComments(fluxId).catch(() => ({ success: false, comments: [], total: 0 })),
    ]).then(([viewersData, likesData, commentsData]) => {
      setViewers(viewersData.viewers ?? []);
      setLikeCount(likesData.total ?? 0);
      setCommentCount(commentsData.total ?? 0);
      if (isOwner) {
        setLikes(likesData.likes ?? []);
        setComments(commentsData.comments ?? []);
      }
    }).finally(() => setLoading(false));
  }, [fluxId, isOwner]);

  const TAB_CONFIG: { key: Tab; label: string; count: number }[] = [
    { key: "viewers",  label: "Views",    count: viewCount    },  
    { key: "likes",    label: "Likes",    count: likeCount     },
    { key: "comments", label: "Comments", count: commentCount  },
  ];

return (
    <div style={{
      width:         360,
      height:        520,
      borderRadius:  12,
      background:    "#16161A",
      border:        "1px solid rgba(255,255,255,0.07)",
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
      boxShadow:     "0 24px 64px rgba(0,0,0,0.6)",
    }}>
      {/* Header */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "18px 20px 0",
        flexShrink:     0,
      }}>
        <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>
          {isOwner ? "Story Insights" : "Story Info"}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isOwner && (
            <button onClick={onDeleteStory} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
              <Trash2 size={15} color="#e53e3e" />
            </button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display:      "flex",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding:      "10px 20px 0",
        gap:          4,
        flexShrink:   0,
      }}>
        {TAB_CONFIG.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => isOwner && setTab(key)}
            style={{
              flex:          1,
              padding:       "8px 4px",
              background:    "none",
              border:        "none",
              borderBottom:  tab === key ? "2px solid #8860D9" : "2px solid transparent",
              cursor:        isOwner ? "pointer" : "default",
              color:         tab === key ? "#8860D9" : "rgba(255,255,255,0.45)",
              fontSize:      12,
              fontWeight:    600,
              transition:    "color 0.15s, border-color 0.15s",
              display:       "flex",
              flexDirection: "column",
              alignItems:    "center",
              gap:           2,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: tab === key ? "#fff" : "rgba(255,255,255,0.7)" }}>
              {count}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Content — identical to before */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "8px 20px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 120 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #8860D9", borderTopColor: "transparent", animation: "vspin 0.75s linear infinite" }} />
            <style>{`@keyframes vspin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : !isOwner ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, gap: 8 }}>
            <Eye size={32} color="rgba(255,255,255,0.2)" />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center" }}>
              Only the story owner can see<br />the full viewer list
            </p>
          </div>
        ) : (
          <>
            {tab === "viewers" && (
              viewers.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No viewers yet</p>
              ) : viewers.map((v) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#2a2a35,#3d3950)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, overflow: "hidden" }}>
                    {v.profile_picture && <img src={v.profile_picture} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name || v.username}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>@{v.username}</p>
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4, color: "rgba(255,255,255,0.35)" }}>
                    <Send size={13} />
                  </button>
                </div>
              ))
            )}

            {tab === "likes" && (
              likes.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No likes yet</p>
              ) : likes.map((l, i) => (
                <div key={`${l.userId}-${i}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#2a2a35,#3d3950)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, overflow: "hidden" }}>
                    {l.avatar && <img src={l.avatar} alt={l.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{l.name || l.username || "Someone"}</p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>@{l.username}</p>
                  </div>
                  <span style={{ fontSize: 18 }}>{l.emoji ?? "❤️"}</span>
                </div>
              ))
            )}

            {tab === "comments" && (
              comments.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "32px 0" }}>No comments yet</p>
              ) : comments.map((c) => (
                <div key={c._id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2a2a35,#3d3950)", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, overflow: "hidden" }}>
                    {c.avatar && <img src={c.avatar} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginBottom: 2 }}>@{c.username ?? "user"}</p>
                    <p style={{ color: "#fff", fontSize: 13 }}>{c.text}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <Heart size={11} color="rgba(255,255,255,0.35)" />
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{c.likes?.length ?? 0}</span>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
