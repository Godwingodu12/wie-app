"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft, Users, Trash2 } from "lucide-react";
import {
  getCloseFriends,
  getCloseFriendSuggestions,
  addCloseFriend,
  removeCloseFriend,
  saveCloseFriends,
} from "@/services/mediaService";

const GREEN = "linear-gradient(135deg,#22c55e,#16a34a)";
const PURPLE = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

interface CFUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string | null;
}

export default function CloseFriendsSettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"list" | "suggestions">("list");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState<CFUser[]>([]);
  const [suggestions, setSuggestions] = useState<CFUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [fl, sg] = await Promise.all([
        getCloseFriends(),
        getCloseFriendSuggestions(),
      ]);
      setFriends(fl);
      setSuggestions(sg);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (user: CFUser) => {
    setActionId(user.id);
    try {
      await addCloseFriend(user.id);
      const updated = [...friends, user];
      setFriends(updated);
      setSuggestions((prev) => prev.filter((s) => s.id !== user.id));
      // Auto-save on add
      await saveCloseFriends(updated.map((f) => f.id));
      showToast(`${user.name} added to close friends`);
    } catch {
      showToast("Failed to add. Please try again.");
    }
    setActionId(null);
  };

  const handleRemove = async (userId: string, userName: string) => {
    setActionId(userId);
    try {
      await removeCloseFriend(userId);
      const updated = friends.filter((f) => f.id !== userId);
      setFriends(updated);
      // Auto-save on remove
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

  const friendIds = new Set(friends.map((f) => f.id));

  const displayList =
    tab === "list"
      ? friends.filter(
          (f) =>
            !query ||
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.username.toLowerCase().includes(query.toLowerCase()),
        )
      : suggestions.filter(
          (s) =>
            !query ||
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.username.toLowerCase().includes(query.toLowerCase()),
        );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0C",
        color: "#fff",
        fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            padding: "10px 20px",
            borderRadius: 20,
            background: "rgba(34,197,94,0.9)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {/* Clear confirm dialog */}
      {showClearConfirm && (
        <>
          <div
            onClick={() => setShowClearConfirm(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              zIndex: 201,
              width: 320,
              borderRadius: 16,
              background: "#1a1a1f",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
            }}
          >
            <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Clear close friends list?
            </h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              This will remove all {friends.length} people from your list. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={saving}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 20,
                  border: "none",
                  background: "rgba(239,68,68,0.9)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "wait" : "pointer",
                }}
              >
                {saving ? "Clearing…" : "Clear All"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          background: "#0A0A0C",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>
              Close Friends
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
              {loading ? "Loading…" : `${friends.length} ${friends.length === 1 ? "person" : "people"} in your list`}
            </p>
          </div>
        </div>

        {friends.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 20,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>

      {/* Info card */}
      <div style={{ padding: "16px 24px 0" }}>
        <div
          style={{
            borderRadius: 12,
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.18)",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: GREEN,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Star size={11} color="#fff" fill="#fff" />
            </div>
            <span style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
              How Close Friends works
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            When you post a flux with "Close Friends" audience, only the people on this list can see it. They won't be notified when added or removed.
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {(["list", "suggestions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: tab === t ? GREEN : "rgba(255,255,255,0.08)",
                color: "#fff",
                transition: "background 0.15s",
              }}
            >
              {t === "list"
                ? `Your List${friends.length > 0 ? ` (${friends.length})` : ""}`
                : `Suggestions${suggestions.length > 0 ? ` (${suggestions.length})` : ""}`}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 14,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* User list */}
      <div style={{ padding: "8px 24px 80px" }}>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "3px solid #22c55e",
                borderTopColor: "transparent",
                animation: "cfSpin2 0.75s linear infinite",
              }}
            />
            <style>{`@keyframes cfSpin2{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && displayList.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {tab === "list" ? "Your list is empty" : "No suggestions found"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, lineHeight: 1.6 }}>
              {tab === "list"
                ? "Switch to Suggestions to find people to add."
                : "Follow more people to get suggestions here."}
            </p>
            {tab === "list" && (
              <button
                onClick={() => setTab("suggestions")}
                style={{
                  marginTop: 16,
                  padding: "8px 22px",
                  borderRadius: 20,
                  background: GREEN,
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Browse Suggestions
              </button>
            )}
          </div>
        )}

        {!loading &&
          displayList.map((user) => {
            const isFriend = friendIds.has(user.id);
            const isLoading = actionId === user.id;
            return (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(135deg,#2a2a35,#3d3950)",
                    border: isFriend ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {user.profile_picture && (
                    <img
                      src={user.profile_picture}
                      alt={user.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {isFriend && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "2px solid #0A0A0C",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Star size={7} color="#fff" fill="#fff" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 2,
                    }}
                  >
                    {user.name}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    @{user.username}
                  </p>
                </div>

                {/* Action button */}
                <button
                  onClick={() =>
                    isFriend
                      ? handleRemove(user.id, user.name)
                      : handleAdd(user)
                  }
                  disabled={isLoading}
                  style={{
                    height: 36,
                    padding: "0 18px",
                    borderRadius: 18,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: isLoading ? "wait" : "pointer",
                    border: isFriend ? "1px solid rgba(239,68,68,0.4)" : "none",
                    background: isFriend ? "rgba(239,68,68,0.12)" : GREEN,
                    color: isFriend ? "#ef4444" : "#fff",
                    transition: "all 0.15s",
                    flexShrink: 0,
                    minWidth: 70,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {isLoading ? (
                    "…"
                  ) : isFriend ? (
                    "Remove"
                  ) : (
                    <>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add
                    </>
                  )}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}