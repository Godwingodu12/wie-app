"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft, Trash2, Search, X, Loader2, ChevronDown } from "lucide-react";
import {
  getCloseFriends,
  getCloseFriendSuggestions,
  addCloseFriend,
  removeCloseFriend,
  saveCloseFriends,
} from "@/services/mediaService";
import { searchUsers } from "@/services/wieUserService";

const GREEN = "linear-gradient(135deg,#22c55e,#16a34a)";

interface CFUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string | null;
}

const PAGE_SIZE = 10;

function Avatar({ src, name, size = 48, isFriend = false }: {
  src: string | null; name: string; size?: number; isFriend?: boolean;
}) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#2a2a35,#3d3950)",
      border: isFriend ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden", position: "relative",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: size * 0.35, fontWeight: 700 }}>
          {initials}
        </span>
      )}
      {isFriend && (
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: Math.round(size * 0.33), height: Math.round(size * 0.33),
          borderRadius: "50%", background: "#22c55e",
          border: "2px solid #0A0A0C",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Star size={Math.round(size * 0.15)} color="#fff" fill="#fff" />
        </div>
      )}
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, padding: "10px 20px", borderRadius: 20,
      background: "rgba(34,197,94,0.9)", backdropFilter: "blur(10px)",
      color: "#fff", fontSize: 13, fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
    }}>
      {msg}
    </div>
  );
}

export default function CloseFriendsSettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "suggestions" | "search">("list");

  const [friends, setFriends] = useState<CFUser[]>([]);
  const [suggestions, setSuggestions] = useState<CFUser[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CFUser[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [fl, sg] = await Promise.all([getCloseFriends(), getCloseFriendSuggestions()]);
      setFriends(fl);
      setSuggestions(sg);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchUsers(query.trim(), 1, 20);
        const users = res?.users ?? res ?? [];
        const normalized: CFUser[] = users.map((u: any) => ({
          id: u.id ?? u._id ?? u.userId ?? "",
          username: u.username ?? "",
          name: u.name ?? u.fullName ?? u.username ?? "",
          profile_picture: u.profile_picture ?? u.profilePicture ?? u.avatar ?? null,
        }));
        setSearchResults(normalized);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  }, [query]);

  const friendIds = new Set(friends.map((f) => f.id));

  const handleAdd = async (user: CFUser) => {
    if (actionId) return;
    setActionId(user.id);
    try {
      await addCloseFriend(user.id);
      const updated = [...friends, user];
      setFriends(updated);
      setSuggestions((prev) => prev.filter((s) => s.id !== user.id));
      await saveCloseFriends(updated.map((f) => f.id));
      showToast(`${user.name} added to close friends`);
    } catch {
      showToast("Failed to add. Please try again.");
    }
    setActionId(null);
  };

  const handleRemove = async (userId: string, userName: string) => {
    if (actionId) return;
    setActionId(userId);
    try {
      await removeCloseFriend(userId);
      const updated = friends.filter((f) => f.id !== userId);
      setFriends(updated);
      await saveCloseFriends(updated.map((f) => f.id));
      showToast(`${userName} removed`);
    } catch {
      showToast("Failed to remove. Please try again.");
    }
    setActionId(null);
  };

  const handleClearAll = async () => {
    setSaving(true);
    try {
      await saveCloseFriends([]);
      setFriends([]);
      setShowClearConfirm(false);
      showToast("Close friends list cleared");
    } catch {
      showToast("Failed to clear. Please try again.");
    }
    setSaving(false);
  };

  const visibleSuggestions = suggestions.slice(0, visibleCount);
  const hasMore = visibleCount < suggestions.length;

  const UserRow = ({ user, isList }: { user: CFUser; isList: boolean }) => {
    const isFriend = friendIds.has(user.id);
    const isWorking = actionId === user.id;
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "12px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <Avatar src={user.profile_picture} name={user.name} isFriend={isFriend} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {user.name}
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>
            @{user.username}
          </p>
        </div>
        <button
          onClick={() => isFriend ? handleRemove(user.id, user.name) : handleAdd(user)}
          disabled={!!actionId}
          style={{
            height: 36, padding: "0 18px", borderRadius: 18,
            fontSize: 12, fontWeight: 700,
            cursor: isWorking ? "wait" : "pointer",
            border: isFriend ? "1px solid rgba(239,68,68,0.4)" : "none",
            background: isFriend ? "rgba(239,68,68,0.12)" : GREEN,
            color: isFriend ? "#ef4444" : "#fff",
            transition: "all 0.15s", flexShrink: 0, minWidth: 70,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            opacity: isWorking ? 0.6 : 1,
          }}
        >
          {isWorking ? (
            <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
          ) : isFriend ? "Remove" : (
            <><span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add</>
          )}
        </button>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0C", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      {toast && <Toast msg={toast} />}

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <>
          <div onClick={() => setShowClearConfirm(false)} style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 201, width: 320, borderRadius: 16,
            background: "#1a1a1f", border: "1px solid rgba(255,255,255,0.1)",
            padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
          }}>
            <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Clear close friends list?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              This will remove all {friends.length} people from your list.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowClearConfirm(false)} style={{
                flex: 1, height: 40, borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "transparent", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleClearAll} disabled={saving} style={{
                flex: 1, height: 40, borderRadius: 20, border: "none",
                background: "rgba(239,68,68,0.9)", color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer",
              }}>
                {saving ? "Clearing…" : "Clear All"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 20px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, background: "#0A0A0C", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff",
          }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>Close Friends</h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
              {loading ? "Loading…" : `${friends.length} ${friends.length === 1 ? "person" : "people"} in your list`}
            </p>
          </div>
        </div>
        {friends.length > 0 && (
          <button onClick={() => setShowClearConfirm(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(239,68,68,0.1)", color: "#ef4444",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            <Trash2 size={12} /> Clear All
          </button>
        )}
      </div>

      {/* Info card */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{
          borderRadius: 12, background: "rgba(34,197,94,0.07)",
          border: "1px solid rgba(34,197,94,0.18)", padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: GREEN,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Star size={11} color="#fff" fill="#fff" />
            </div>
            <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
              How Close Friends works
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            Only people on this list can see your Close Friends fluxes. They are not notified when added or removed.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: 8 }}>
        {(["list", "suggestions", "search"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t !== "search") setQuery(""); }}
            style={{
              padding: "7px 14px", borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === t ? GREEN : "rgba(255,255,255,0.08)",
              color: "#fff", transition: "background 0.15s", whiteSpace: "nowrap",
            }}
          >
            {t === "list"
              ? `Your List${friends.length > 0 ? ` (${friends.length})` : ""}`
              : t === "suggestions"
              ? `Suggestions${suggestions.length > 0 ? ` (${suggestions.length})` : ""}`
              : "Search"}
          </button>
        ))}
      </div>

      {/* Search input — only shown on search tab */}
      {tab === "search" && (
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, padding: "10px 14px",
          }}>
            <Search size={15} color="rgba(255,255,255,0.3)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people to add…"
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", color: "#fff", fontSize: 14,
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.4)", padding: 0,
              }}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lists */}
      <div style={{ padding: "8px 20px 80px" }}>

        {/* YOUR LIST TAB */}
        {tab === "list" && (
          <>
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                <Loader2 size={26} color="#22c55e" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {!loading && friends.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>⭐</div>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  Your list is empty
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Switch to Suggestions or Search to find people to add.
                </p>
                <button onClick={() => setTab("suggestions")} style={{
                  padding: "9px 22px", borderRadius: 20, border: "none",
                  background: GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                  Browse Suggestions
                </button>
              </div>
            )}
            {!loading && friends.map((user) => (
              <UserRow key={user.id} user={user} isList={true} />
            ))}
          </>
        )}

        {/* SUGGESTIONS TAB */}
        {tab === "suggestions" && (
          <>
            {loading && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                <Loader2 size={26} color="#22c55e" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {!loading && suggestions.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  No suggestions available
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Follow more people or use Search to find friends.
                </p>
                <button onClick={() => setTab("search")} style={{
                  padding: "9px 22px", borderRadius: 20, border: "none",
                  background: GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}>
                  Search People
                </button>
              </div>
            )}
            {!loading && visibleSuggestions.map((user) => (
              <UserRow key={user.id} user={user} isList={false} />
            ))}
            {/* Load more button */}
            {!loading && hasMore && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}>
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 22px", borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <ChevronDown size={15} />
                  Show more ({suggestions.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* SEARCH TAB */}
        {tab === "search" && (
          <>
            {!query && (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <Search size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                  Search for people to add to Close Friends
                </p>
              </div>
            )}
            {query && searching && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 30 }}>
                <Loader2 size={24} color="#22c55e" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {query && !searching && searchResults.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                  No users found for "{query}"
                </p>
              </div>
            )}
            {query && !searching && searchResults.map((user) => (
              <UserRow key={user.id} user={user} isList={false} />
            ))}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
