"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Search, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { getFollowing }  from "@/services/followService";
import { searchUsers }   from "@/services/wieUserService";
import { useAuth }       from "@/hooks/useAuth";
import { mentionFlux } from "@/services/mediaService";
const GRADIENT = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

interface MUser {
  id:       string;
  name:     string;
  username: string;
  avatar:   string | null;
}

interface MentionBarProps {
  fluxId:           string;
  selectedMentions: string[];
  onToggle:         (id: string) => void;
  onAdd:            () => void;
  onClose:          () => void;
}

export default function MentionBar({
  fluxId,
  selectedMentions,
  onToggle,
  onAdd,
  onClose,
}: MentionBarProps) {
  const { user }= useAuth(true);
  const [query,     setQuery]     = useState("");
  const [following, setFollowing] = useState<MUser[]>([]);
  const [searchRes, setSearchRes] = useState<MUser[]>([]);
  const [loadingF,  setLoadingF]  = useState(true);
  const [loadingS,  setLoadingS]  = useState(false);
  const searchTimer= useRef<ReturnType<typeof setTimeout>>();
  const [adding,   setAdding]   = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!selectedMentions.length || !fluxId) return;
    setAdding(true);
    setAddError(null);
    try {
      await mentionFlux(fluxId, selectedMentions);
      onAdd();
    } catch (err: any) {
      const msg: string =
        err?.response?.data?.message ?? "Failed to save mentions. Try again.";
      setAddError(msg);
    } finally {
      setAdding(false);
    }
  };
  // Load following on mount
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        setLoadingF(true);
        const res = await getFollowing(user.id);
        const list: MUser[] = (res.following ?? res.data ?? []).map((u: any) => ({
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

  // Debounced search — filtered to following only
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchRes([]); return; }
    setLoadingS(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res   = await searchUsers(query.trim());
        const found: MUser[] = (res.users ?? res.data ?? []).map((u: any) => ({
          id:       u._id ?? u.id,
          name:     u.name ?? u.fullName ?? u.username,
          username: u.username,
          avatar:   u.profilePicture ?? u.profile_picture ?? null,
        }));
        // Restrict to only people you follow
        const followingIds = new Set(following.map((f) => f.id));
        setSearchRes(found.filter((u) => followingIds.has(u.id)));
      } catch {
        setSearchRes([]);
      } finally {
        setLoadingS(false);
      }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query, following]);

  const displayList  = query.trim() ? searchRes : following;
  const pickedUsers  = following.filter((u) => selectedMentions.includes(u.id));

  return (
    <div style={{
      width:         430,
      height:        516,
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
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "18px 20px 12px", position: "relative", flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>Mention</span>
        <button onClick={onClose} style={{
          position: "absolute", right: 18, background: "none",
          border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)",
          display: "flex", padding: 4,
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Selected chips */}
      {pickedUsers.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px 8px", overflowX: "auto",
          scrollbarWidth: "none", flexShrink: 0,
        }}>
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.35)", flexShrink: 0, padding: 2,
          }}>
            <ChevronLeft size={16} />
          </button>
          {pickedUsers.map((u) => (
            <div key={u.id} style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4, flexShrink: 0,
            }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg,#2a2a35,#3d3950)",
                  border: "2px solid rgba(255,255,255,0.12)",
                  overflow: "hidden",
                }}>
                  {u.avatar && (
                    <img src={u.avatar} alt={u.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(u.id); }}
                  style={{
                    position: "absolute", top: -3, right: -3,
                    width: 18, height: 18, borderRadius: "50%",
                    background: "rgba(50,50,60,0.95)",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", padding: 0,
                  }}
                >
                  <X size={9} color="#fff" />
                </button>
              </div>
              <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>{u.name}</span>
            </div>
          ))}
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.35)", flexShrink: 0, padding: 2,
          }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: "12px 16px 6px", flexShrink: 0 }}>
        <div style={{
          width: "100%", height: 44, borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
          boxSizing: "border-box",
        }}>
          <Search size={14} color="rgba(255,255,255,0.3)" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search following…"
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
      </div>

      {/* Hint */}
      <p style={{
        color: "rgba(255,255,255,0.28)", fontSize: 12,
        textAlign: "center", padding: "6px 20px",
        lineHeight: 1.5, flexShrink: 0,
      }}>
        You can only mention people you follow.<br />
        Their username won't be visible on your story.
      </p>

      {/* User list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px", scrollbarWidth: "none" }}>
        {(loadingF && !query) || (loadingS && !!query) ? (
          <div style={{
            display: "flex", justifyContent: "center",
            alignItems: "center", height: 80,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              border: "2px solid #8860D9", borderTopColor: "transparent",
              animation: "mentionSpin 0.75s linear infinite",
            }} />
            <style>{`@keyframes mentionSpin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : displayList.length === 0 ? (
          <p style={{
            color: "rgba(255,255,255,0.25)", fontSize: 13,
            textAlign: "center", padding: "24px 0",
          }}>
            {query ? "No matching users in your following" : "You're not following anyone"}
          </p>
        ) : (
          displayList.map((u) => {
            const sel = selectedMentions.includes(u.id);
            return (
              <button
                key={u.id}
                onClick={() => onToggle(u.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "9px 0",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg,#2a2a35,#3d3950)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0, overflow: "hidden",
                }}>
                  {u.avatar && (
                    <img src={u.avatar} alt={u.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>{u.name}</p>
                  <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 12, lineHeight: 1.3 }}>{u.username}</p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: sel ? GRADIENT : "transparent",
                  border: sel ? "none" : "2px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "background 0.18s",
                }}>
                  {sel && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
              </button>
            );
          })
        )}
      </div>
      {/* Add button */}
      <div style={{ padding: "12px 16px 18px", flexShrink: 0 }}>
        {addError && (
          <p style={{
            color:        "#ff6b6b",
            fontSize:     11,
            textAlign:    "center",
            marginBottom: 8,
            lineHeight:   1.4,
          }}>
            {addError}
          </p>
        )}
        <button
          onClick={handleAdd}
          disabled={selectedMentions.length === 0 || adding}
          style={{
            width: "100%", height: 48, borderRadius: 25,
            background: selectedMentions.length > 0 ? GRADIENT : "rgba(255,255,255,0.08)",
            border: "none", color: "#fff", fontSize: 15, fontWeight: 600,
            cursor: selectedMentions.length > 0 ? "pointer" : "default",
            letterSpacing: 0.2, transition: "background 0.2s",
          }}
        >
          {adding
            ? "Saving…"
            : selectedMentions.length > 0
              ? `Add ${selectedMentions.length} mention${selectedMentions.length > 1 ? "s" : ""}`
              : "Add"}
        </button>
      </div>
    </div>
  );
}
