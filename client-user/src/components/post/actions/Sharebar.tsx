"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, Search, Link2, Copy, Check } from "lucide-react";
import { getFollowing } from "@/services/followService";
import { searchUsers }  from "@/services/wieUserService";
import { useAuth }      from "@/hooks/useAuth";

const GRADIENT = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

interface ShareUser {
  id:       string;
  name:     string;
  username: string;
  avatar:   string | null;
}

interface ShareBarProps {
  onClose: () => void;
  fluxId:  string;
}

const SOCIAL_APPS = [
  {
    label: "Copy Link",
    icon:  <Copy size={20} color="#fff" />,
    bg:    "rgba(255,255,255,0.13)",
    action: (url: string) => {
      navigator.clipboard.writeText(url).catch(() => {});
    },
  },
  {
    label: "WhatsApp",
    icon:  <span style={{ fontSize: 22 }}>💬</span>,
    bg:    "#25D366",
    action: (url: string) =>
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank"),
  },
  {
    label: "Telegram",
    icon:  <span style={{ fontSize: 22 }}>✈️</span>,
    bg:    "#229ED9",
    action: (url: string) =>
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}`, "_blank"),
  },
  {
    label: "Instagram",
    icon:  <span style={{ fontSize: 20 }}>📸</span>,
    bg:    "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
    action: (_url: string) =>
      window.open("https://www.instagram.com/", "_blank"),
  },
  {
    label: "Facebook",
    icon:  <span style={{ color: "#fff", fontWeight: 700, fontSize: 20 }}>f</span>,
    bg:    "#1877F2",
    action: (url: string) =>
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank"),
  },
  {
    label: "X (Twitter)",
    icon:  <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>𝕏</span>,
    bg:    "#000",
    action: (url: string) =>
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank"),
  },
  {
    label: "Email",
    icon:  <span style={{ fontSize: 20 }}>✉️</span>,
    bg:    "rgba(255,255,255,0.13)",
    action: (url: string) =>
      window.open(`mailto:?body=${encodeURIComponent(url)}`, "_blank"),
  },
  {
    label: "Share",
    icon:  <span style={{ fontSize: 20 }}>⬆️</span>,
    bg:    "rgba(255,255,255,0.13)",
    action: (url: string) => {
      if (navigator.share) {
        navigator.share({ url }).catch(() => {});
      }
    },
  },
] as const;

export default function ShareBar({ onClose, fluxId }: ShareBarProps) {
  const { user }                          = useAuth(true);
  const [query,       setQuery]           = useState("");
  const [following,   setFollowing]       = useState<ShareUser[]>([]);
  const [searchRes,   setSearchRes]       = useState<ShareUser[]>([]);
  const [selected,    setSelected]        = useState<string[]>([]);
  const [message,     setMessage]         = useState("");
  const [sending,     setSending]         = useState(false);
  const [sent,        setSent]            = useState(false);
  const [copied,      setCopied]          = useState(false);
  const [loadingF,    setLoadingF]        = useState(true);
  const [loadingS,    setLoadingS]        = useState(false);
  const searchTimer                       = useRef<ReturnType<typeof setTimeout>>();

  const fluxUrl = typeof window !== "undefined"
    ? `${window.location.origin}/post/flux-view?fluxId=${fluxId}`
    : "";

  // Load following on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        setLoadingF(true);
        const res = await getFollowing(user.id);
        const list: ShareUser[] = (res.following ?? res.data ?? []).map((u: any) => ({
          id:       u._id ?? u.id,
          name:     u.name ?? u.fullName ?? u.username,
          username: u.username,
          avatar:   u.profilePicture ?? u.profile_picture ?? null,
        }));
        setFollowing(list);
      } catch {
        setFollowing([]);
      } finally {
        setLoadingF(false);
      }
    })();
  }, [user?.id]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchRes([]); return; }
    setLoadingS(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query.trim());
        const list: ShareUser[] = (res.users ?? res.data ?? []).map((u: any) => ({
          id:       u._id ?? u.id,
          name:     u.name ?? u.fullName ?? u.username,
          username: u.username,
          avatar:   u.profilePicture ?? u.profile_picture ?? null,
        }));
        setSearchRes(list);
      } catch {
        setSearchRes([]);
      } finally {
        setLoadingS(false);
      }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query]);

  const displayList = query.trim() ? searchRes : following;

  const toggle = (id: string) =>
    setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fluxUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!selected.length) return;
    setSending(true);
    // TODO: replace with your actual DM/send API
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    setSent(true);
    setTimeout(onClose, 1100);
  };

  return (
    <div
      style={{
        width:         430,
        height:        516,
        borderRadius:  12,
        background:    "#16161A",
        border:        "1px solid rgba(255,255,255,0.07)",
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
        boxShadow:     "0 24px 64px rgba(0,0,0,0.6)",
      }}
    >
      {/* Header */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "18px 20px 12px",
        position:       "relative",
        flexShrink:     0,
        borderBottom:   "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>Share</span>
        <button onClick={onClose} style={{
          position: "absolute", right: 18, background: "none",
          border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)",
          display: "flex", padding: 4,
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div style={{ display: "flex", gap: 8, padding: "14px 16px 10px", flexShrink: 0 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10,
          height: 44, borderRadius: 8,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)",
          padding: "0 14px",
        }}>
          <Search size={14} color="rgba(255,255,255,0.3)" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", color: "#fff", fontSize: 14,
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)", padding: 0, display: "flex",
            }}>
              <X size={14} />
            </button>
          )}
        </div>
        {/* Copy link button */}
        <button
          onClick={handleCopyLink}
          title="Copy link"
          style={{
            width: 44, height: 44, borderRadius: 8, flexShrink: 0, cursor: "pointer",
            background: copied ? "#4CAF50" : "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.7)", transition: "background 0.25s",
          }}
        >
          {copied ? <Check size={18} color="#fff" /> : <Link2 size={18} />}
        </button>
      </div>

      {/* Users grid */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "4px 16px 0",
        scrollbarWidth: "none",
      }}>
        {loadingF && !query ? (
          <div style={{
            display: "flex", justifyContent: "center",
            alignItems: "center", height: 80,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid #8860D9", borderTopColor: "transparent",
              animation: "spin 0.75s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : loadingS && query ? (
          <div style={{
            display: "flex", justifyContent: "center",
            alignItems: "center", height: 80,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid #8860D9", borderTopColor: "transparent",
              animation: "spin2 0.75s linear infinite",
            }} />
            <style>{`@keyframes spin2{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : displayList.length === 0 ? (
          <p style={{
            color: "rgba(255,255,255,0.25)", fontSize: 13,
            textAlign: "center", padding: "24px 0",
          }}>
            {query ? "No users found" : "You're not following anyone yet"}
          </p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "18px 8px",
          }}>
            {displayList.map((u) => {
              const sel = selected.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 7,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: "50%",
                      background: "linear-gradient(135deg,#2a2a35,#3d3950)",
                      border: sel ? "2.5px solid #8860D9" : "2px solid rgba(255,255,255,0.08)",
                      overflow: "hidden", transition: "border-color 0.18s",
                    }}>
                      {u.avatar && (
                        <img src={u.avatar} alt={u.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </div>
                    {sel && (
                      <div style={{
                        position: "absolute", bottom: 2, right: 2,
                        width: 20, height: 20, borderRadius: "50%",
                        background: GRADIENT, border: "2px solid #16161A",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span style={{
                    color: "rgba(255,255,255,0.75)", fontSize: 11,
                    textAlign: "center", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90,
                  }}>
                    {u.username ?? u.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom: social row OR message+send */}
      {selected.length === 0 ? (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 16px 18px",
          display: "flex", gap: 16, flexShrink: 0,
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {SOCIAL_APPS.map((app, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 5, flexShrink: 0,
            }}>
              <button
                onClick={() => app.action(fluxUrl)}
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: app.bg as string,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {app.icon}
              </button>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{app.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: "12px 16px 18px", flexShrink: 0,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message…"
            style={{
              width: "100%", background: "transparent", border: "none",
              outline: "none", color: "#6F7680", fontSize: 12,
              marginBottom: 14, display: "block",
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              width: "100%", height: 48, borderRadius: 25,
              background: sent ? "#4CAF50" : GRADIENT,
              border: "none", cursor: sending ? "wait" : "pointer",
              color: "#fff", fontSize: 15, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.3s, transform 0.1s",
              transform: sending ? "scale(0.98)" : "scale(1)",
            }}
          >
            {sent ? "✓ Sent!" : sending ? "Sending…" : `Send (${selected.length})`}
          </button>
        </div>
      )}
    </div>
  );
}