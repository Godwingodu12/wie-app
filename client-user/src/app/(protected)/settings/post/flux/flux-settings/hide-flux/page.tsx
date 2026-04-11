"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, EyeOff, Eye, Search, X, UserX, Loader2 } from "lucide-react";
import {
  getHideFromList,
  addToHideFromList,
  removeFromHideFromList,
  type HiddenUser,
} from "@/services/mediaService";
import { searchUsers } from "@/services/wieUserService";

interface SearchUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string | null;
  is_verified?: boolean;
}

function Toast({ msg, type = "info" }: { msg: string; type?: "info" | "success" | "error" }) {
  const bg =
    type === "success" ? "rgba(34,197,94,0.92)"
    : type === "error" ? "rgba(239,68,68,0.92)"
    : "rgba(30,30,35,0.96)";
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, padding: "10px 22px", borderRadius: 24, background: bg,
      color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
      boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      {msg}
    </div>
  );
}

function Avatar({ src, name, size = 44 }: { src: string | null; name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#2a2a35,#3d3950)",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {src ? (
        <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: size * 0.35, fontWeight: 700 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

export default function HideFluxPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"hidden" | "search">("hidden");
  const [hiddenUsers, setHiddenUsers] = useState<HiddenUser[]>([]);
  const [loadingHidden, setLoadingHidden] = useState(true);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "info" | "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "info" | "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Load hidden users
  useEffect(() => {
    getHideFromList()
      .then(setHiddenUsers)
      .catch(() => {})
      .finally(() => setLoadingHidden(false));
  }, []);

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
        const normalized: SearchUser[] = users.map((u: any) => ({
            id: u.id ?? u._id ?? u.userId ?? "",
            username: u.username ?? "",
            name: u.name ?? u.fullName ?? u.username ?? "",
            profile_picture: u.profile_picture ?? u.profilePicture ?? u.avatar ?? null,
            is_verified: u.is_verified ?? false,
        }));
        setSearchResults(normalized);
        } catch {
        setSearchResults([]);
        }
        setSearching(false);
    }, 400);
    }, [query]);

  const hiddenIds = new Set(hiddenUsers.map((u) => u.id));

  const handleHide = async (user: SearchUser) => {
    if (actionId) return;
    setActionId(user.id);
    try {
      await addToHideFromList(user.id);
      const newHidden: HiddenUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        profile_picture: user.profile_picture,
        is_verified: user.is_verified ?? false,
      };
      setHiddenUsers((prev) => [...prev, newHidden]);
      showToast(`${user.name} hidden from your flux`, "success");
    } catch {
      showToast("Failed to hide. Try again.", "error");
    }
    setActionId(null);
  };

  const handleUnhide = async (userId: string, userName: string) => {
    if (actionId) return;
    setActionId(userId);
    try {
      await removeFromHideFromList(userId);
      setHiddenUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`${userName} can now see your flux`, "info");
    } catch {
      showToast("Failed to unhide. Try again.", "error");
    }
    setActionId(null);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0C", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "20px 20px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, background: "#0A0A0C", zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#fff", flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
            Hide Flux From
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
            {loadingHidden ? "Loading…" : `${hiddenUsers.length} ${hiddenUsers.length === 1 ? "person" : "people"} hidden`}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div style={{ padding: "14px 20px 0" }}>
        <div style={{
          borderRadius: 12,
          background: "rgba(239,68,68,0.07)",
          border: "1px solid rgba(239,68,68,0.18)",
          padding: "12px 14px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <EyeOff size={16} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            Hidden users won't see any of your future fluxes. They are not notified when hidden or unhidden.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "14px 20px 0", display: "flex", gap: 8 }}>
        {(["hidden", "search"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "7px 18px", borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === t
                ? "linear-gradient(135deg,#8860D9,#9575CD)"
                : "rgba(255,255,255,0.08)",
              color: "#fff", transition: "background 0.15s",
            }}
          >
            {t === "hidden"
              ? `Hidden${hiddenUsers.length > 0 ? ` (${hiddenUsers.length})` : ""}`
              : "Add People"}
          </button>
        ))}
      </div>

      {/* Search bar — only shown on search tab */}
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
              placeholder="Search followers & following…"
              style={{
                flex: 1, background: "transparent", border: "none",
                outline: "none", color: "#fff", fontSize: 14,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "10px 20px 80px" }}>

        {/* Hidden tab */}
        {tab === "hidden" && (
          <>
            {loadingHidden && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
                <Loader2 size={26} color="#8860D9" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
            {!loadingHidden && hiddenUsers.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 60 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <Eye size={32} color="rgba(255,255,255,0.2)" />
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  No one is hidden
                </p>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Use "Add People" to hide specific users from seeing your flux.
                </p>
                <button
                  onClick={() => setTab("search")}
                  style={{
                    padding: "9px 24px", borderRadius: 20, border: "none",
                    background: "linear-gradient(135deg,#8860D9,#9575CD)",
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Add People
                </button>
              </div>
            )}
            {!loadingHidden && hiddenUsers.map((user) => {
              const isWorking = actionId === user.id;
              return (
                <div key={user.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <Avatar src={user.profile_picture} name={user.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <p style={{
                        color: "#fff", fontSize: 14, fontWeight: 600,
                        margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {user.name}
                      </p>
                      {user.is_verified && (
                        <span style={{ color: "#3b82f6", fontSize: 12 }}>✓</span>
                      )}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
                      @{user.username}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 8,
                      background: "rgba(239,68,68,0.15)", color: "#ef4444",
                      fontWeight: 600, whiteSpace: "nowrap",
                    }}>
                      Hidden
                    </span>
                    <button
                      onClick={() => handleUnhide(user.id, user.name)}
                      disabled={!!actionId}
                      style={{
                        height: 32, padding: "0 14px", borderRadius: 16,
                        fontSize: 12, fontWeight: 700,
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.7)",
                        cursor: isWorking ? "wait" : "pointer",
                        opacity: isWorking ? 0.5 : 1,
                        display: "flex", alignItems: "center", gap: 5,
                      }}
                    >
                      {isWorking ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Eye size={11} />}
                      Unhide
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Search / Add tab */}
        {tab === "search" && (
          <>
            {!query && (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <Search size={36} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                  Search for people to hide from your flux
                </p>
              </div>
            )}

            {query && searching && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 30 }}>
                <Loader2 size={24} color="#8860D9" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}

            {query && !searching && searchResults.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 40 }}>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
                  No users found for "{query}"
                </p>
              </div>
            )}

            {query && !searching && searchResults.map((user) => {
              const isHidden = hiddenIds.has(user.id);
              const isWorking = actionId === user.id;
              return (
                <div key={user.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <Avatar src={user.profile_picture} name={user.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <p style={{
                        color: "#fff", fontSize: 14, fontWeight: 600,
                        margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {user.name}
                      </p>
                      {user.is_verified && (
                        <span style={{ color: "#3b82f6", fontSize: 12 }}>✓</span>
                      )}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
                      @{user.username}
                    </p>
                  </div>
                  <button
                    onClick={() => isHidden ? handleUnhide(user.id, user.name) : handleHide(user)}
                    disabled={!!actionId}
                    style={{
                      height: 34, padding: "0 16px", borderRadius: 17,
                      fontSize: 12, fontWeight: 700,
                      border: isHidden ? "1px solid rgba(255,255,255,0.15)" : "none",
                      background: isHidden
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(239,68,68,0.85)",
                      color: isHidden ? "rgba(255,255,255,0.6)" : "#fff",
                      cursor: isWorking ? "wait" : "pointer",
                      opacity: isWorking ? 0.5 : 1,
                      display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                    }}
                  >
                    {isWorking ? (
                      <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                    ) : isHidden ? (
                      <><Eye size={11} /> Unhide</>
                    ) : (
                      <><EyeOff size={11} /> Hide</>
                    )}
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}