"use client";
import React, { useEffect, useRef, useState } from "react";
import { Search, X, Check, Star } from "lucide-react";
import {
  getCloseFriends,
  getCloseFriendSuggestions,
  addCloseFriend,
  removeCloseFriend,
} from "@/services/mediaService";

const GRADIENT = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";
const GREEN    = "linear-gradient(135deg,#22c55e,#16a34a)";

interface CFUser {
  id:              string;
  username:        string;
  name:            string;
  profile_picture: string | null;
}

interface CloseFriendsPanelProps {
  onClose: () => void;
}

export default function CloseFriendsPanel({ onClose }: CloseFriendsPanelProps) {
  const [tab,          setTab]          = useState<"list" | "suggestions">("list");
  const [query,        setQuery]        = useState("");
  const [friends,      setFriends]      = useState<CFUser[]>([]);
  const [suggestions,  setSuggestions]  = useState<CFUser[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await getCloseFriends();
      setFriends(data);
    } catch {}
    setLoading(false);
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await getCloseFriendSuggestions();
      setSuggestions(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadFriends(); loadSuggestions(); }, []);

  const friendIds = new Set(friends.map(f => f.id));

  const handleAdd = async (user: CFUser) => {
    setActionId(user.id);
    try {
      await addCloseFriend(user.id);
      setFriends(prev => [...prev, user]);
      setSuggestions(prev => prev.filter(s => s.id !== user.id));
    } catch {}
    setActionId(null);
  };

  const handleRemove = async (userId: string) => {
    setActionId(userId);
    try {
      await removeCloseFriend(userId);
      setFriends(prev => prev.filter(f => f.id !== userId));
    } catch {}
    setActionId(null);
  };

  const displayList = tab === "list"
    ? friends.filter(f =>
        !query || f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.username.toLowerCase().includes(query.toLowerCase())
      )
    : suggestions.filter(s =>
        !query || s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.username.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div style={{
      width:         400,
      maxHeight:     "85vh",
      borderRadius:  16,
      background:    "#16161A",
      border:        "1px solid rgba(255,255,255,0.07)",
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
      boxShadow:     "0 24px 64px rgba(0,0,0,0.7)",
    }}>
      {/* Header */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "18px 20px 12px",
        borderBottom:   "1px solid rgba(255,255,255,0.06)",
        flexShrink:     0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: GREEN,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Star size={13} color="#fff" fill="#fff" />
          </div>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Close Friends</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex" }}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "10px 16px 0", gap: 8, flexShrink: 0 }}>
        {(["list", "suggestions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding:      "6px 16px",
              borderRadius: 20,
              fontSize:     12,
              fontWeight:   600,
              cursor:       "pointer",
              border:       "none",
              background:   tab === t ? GREEN : "rgba(255,255,255,0.08)",
              color:        "#fff",
              transition:   "background 0.15s",
            }}
          >
            {t === "list"
              ? `Your List${friends.length > 0 ? ` (${friends.length})` : ""}`
              : "Suggestions"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: "10px 16px 6px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "8px 12px",
        }}>
          <Search size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search people…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13 }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <X size={12} color="rgba(255,255,255,0.4)" />
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        margin:       "0 16px 8px",
        padding:      "8px 12px",
        borderRadius: 8,
        background:   "rgba(34,197,94,0.08)",
        border:       "1px solid rgba(34,197,94,0.2)",
        flexShrink:   0,
      }}>
        <p style={{ color: "rgba(34,197,94,0.85)", fontSize: 11, lineHeight: 1.5 }}>
          {tab === "list"
            ? "Only close friends can see stories shared with them. They won't be notified when added."
            : "Suggestions based on who you follow."}
        </p>
      </div>

      {/* User list */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 16px 16px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #22c55e", borderTopColor: "transparent", animation: "cfSpin 0.75s linear infinite" }} />
            <style>{`@keyframes cfSpin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && displayList.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              {tab === "list" ? "No close friends yet" : "No suggestions available"}
            </p>
            {tab === "list" && (
              <button
                onClick={() => setTab("suggestions")}
                style={{
                  marginTop: 12, padding: "6px 16px", borderRadius: 20,
                  background: GREEN, border: "none", color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Browse Suggestions
              </button>
            )}
          </div>
        )}

        {!loading && displayList.map(user => {
          const isFriend  = friendIds.has(user.id);
          const isLoading = actionId === user.id;
          return (
            <div
              key={user.id}
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         12,
                padding:     "9px 0",
                borderBottom:"1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#2a2a35,#3d3950)",
                border: isFriend ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden", position: "relative",
              }}>
                {user.profile_picture && (
                  <img src={user.profile_picture} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {isFriend && (
                  <div style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#22c55e", border: "1.5px solid #16161A",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Star size={7} color="#fff" fill="#fff" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  @{user.username}
                </p>
              </div>

              {/* Action button */}
              <button
                onClick={() => isFriend ? handleRemove(user.id) : handleAdd(user)}
                disabled={isLoading}
                style={{
                  padding:      "6px 14px",
                  borderRadius: 20,
                  fontSize:     11,
                  fontWeight:   600,
                  cursor:       isLoading ? "wait" : "pointer",
                  border:       "none",
                  background:   isFriend ? "rgba(239,68,68,0.15)" : GREEN,
                  color:        isFriend ? "#ef4444" : "#fff",
                  transition:   "background 0.15s",
                  flexShrink:   0,
                  minWidth:     60,
                }}
              >
                {isLoading ? "…" : isFriend ? "Remove" : "Add"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}