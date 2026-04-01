"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, Star, Check, Users } from "lucide-react";
import {
  getCloseFriends,
  getCloseFriendSuggestions,
  addCloseFriend,
  removeCloseFriend,
  saveCloseFriends,
} from "@/services/mediaService";

const GREEN = "linear-gradient(135deg,#22c55e,#16a34a)";

interface CFUser {
  id: string;
  username: string;
  name: string;
  profile_picture: string | null;
}

interface CloseFriendsPanelProps {
  onClose: () => void;
  /** Called after a successful save — passes the saved friend list */
  onSaved?: (friends: CFUser[]) => void;
  /** If true, shows a "Post for Close Friends" button */
  showPostButton?: boolean;
  onPostForCloseFriends?: () => void;
}

export default function CloseFriendsPanel({
  onClose,
  onSaved,
  showPostButton = false,
  onPostForCloseFriends,
}: CloseFriendsPanelProps) {
  const [tab, setTab] = useState<"list" | "suggestions">("list");
  const [query, setQuery] = useState("");
  const [friends, setFriends] = useState<CFUser[]>([]);
  const [suggestions, setSuggestions] = useState<CFUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const originalIdsRef = useRef<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [fl, sg] = await Promise.all([
        getCloseFriends(),
        getCloseFriendSuggestions(),
      ]);
      setFriends(fl);
      setSuggestions(sg);
      originalIdsRef.current = new Set(fl.map((f) => f.id));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const checkChanges = useCallback((newFriends: CFUser[]) => {
    const newIds = new Set(newFriends.map((f) => f.id));
    const orig = originalIdsRef.current;
    const changed =
      newIds.size !== orig.size ||
      Array.from(newIds).some((id) => !orig.has(id));
    setHasChanges(changed);
  }, []);
  const handleAdd = async (user: CFUser) => {
    setActionId(user.id);
    try {
      await addCloseFriend(user.id);
      const updated = [...friends, user];
      setFriends(updated);
      setSuggestions((prev) => prev.filter((s) => s.id !== user.id));
      checkChanges(updated);
    } catch {}
    setActionId(null);
  };

  const handleRemove = async (userId: string) => {
    setActionId(userId);
    try {
      await removeCloseFriend(userId);
      const updated = friends.filter((f) => f.id !== userId);
      setFriends(updated);
      checkChanges(updated);
    } catch {}
    setActionId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCloseFriends(friends.map((f) => f.id));
      originalIdsRef.current = new Set(friends.map((f) => f.id));
      setHasChanges(false);
      setSavedCount(friends.length);
      onSaved?.(friends);
      setTimeout(() => setSavedCount(null), 2500);
    } catch {}
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
        width: 420,
        maxHeight: "88vh",
        borderRadius: 16,
        background: "#16161A",
        border: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.75)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: GREEN,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Star size={13} color="#fff" fill="#fff" />
          </div>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>
            Close Friends
          </span>
          {friends.length > 0 && (
            <span
              style={{
                fontSize: 11,
                background: "rgba(34,197,94,0.15)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 10,
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              {friends.length} people
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            display: "flex",
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{ display: "flex", padding: "10px 16px 0", gap: 8, flexShrink: 0 }}
      >
        {(["list", "suggestions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px",
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

      {/* ── Search ── */}
      <div style={{ padding: "10px 16px 6px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          <Search size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
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
              fontSize: 13,
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <X size={12} color="rgba(255,255,255,0.4)" />
            </button>
          )}
        </div>
      </div>

      {/* ── Info banner ── */}
      <div
        style={{
          margin: "0 16px 8px",
          padding: "8px 12px",
          borderRadius: 8,
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          flexShrink: 0,
        }}
      >
        <p style={{ color: "rgba(34,197,94,0.85)", fontSize: 11, lineHeight: 1.5 }}>
          {tab === "list"
            ? "Only close friends can see stories shared with them. They won't be notified."
            : "People you follow — tap Add to include them."}
        </p>
      </div>

      {/* ── Save success toast ── */}
      {savedCount !== null && (
        <div
          style={{
            margin: "0 16px 8px",
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(34,197,94,0.18)",
            border: "1px solid rgba(34,197,94,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Check size={14} color="#22c55e" />
          <span style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>
            Saved {savedCount} close {savedCount === 1 ? "friend" : "friends"}!
          </span>
        </div>
      )}

      {/* ── User list ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "0 16px 8px",
        }}
      >
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: "2px solid #22c55e",
                borderTopColor: "transparent",
                animation: "cfSpin 0.75s linear infinite",
              }}
            />
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
                  marginTop: 12,
                  padding: "6px 16px",
                  borderRadius: 20,
                  background: GREEN,
                  border: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
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
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "linear-gradient(135deg,#2a2a35,#3d3950)",
                    border: isFriend
                      ? "2px solid #22c55e"
                      : "1px solid rgba(255,255,255,0.08)",
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
                        bottom: -1,
                        right: -1,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "1.5px solid #16161A",
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
                      fontSize: 13,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.name}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    @{user.username}
                  </p>
                </div>

                {/* Action */}
                <button
                  onClick={() =>
                    isFriend ? handleRemove(user.id) : handleAdd(user)
                  }
                  disabled={isLoading}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: isLoading ? "wait" : "pointer",
                    border: "none",
                    background: isFriend ? "rgba(239,68,68,0.15)" : GREEN,
                    color: isFriend ? "#ef4444" : "#fff",
                    transition: "background 0.15s",
                    flexShrink: 0,
                    minWidth: 60,
                  }}
                >
                  {isLoading ? "…" : isFriend ? "Remove" : "Add"}
                </button>
              </div>
            );
          })}
      </div>

      {/* ── Footer: Save + optional Post button ── */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {/* Save list button */}
        <button
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 21,
            border: "none",
            background: hasChanges || saving ? GREEN : "rgba(255,255,255,0.08)",
            color: hasChanges || saving ? "#fff" : "rgba(255,255,255,0.3)",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving || loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {saving ? (
            <>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  animation: "cfSpin 0.7s linear infinite",
                }}
              />
              Saving…
            </>
          ) : (
            <>
              <Check size={14} />
              Save List
            </>
          )}
        </button>

        {/* Post for Close Friends button — only shown on flux page */}
        {showPostButton && onPostForCloseFriends && (
          <button
            onClick={async () => {
              // Always save the current list before posting
              if (hasChanges) {
                setSaving(true);
                try {
                  await saveCloseFriends(friends.map((f) => f.id));
                  originalIdsRef.current = new Set(friends.map((f) => f.id));
                  setHasChanges(false);
                  onSaved?.(friends);
                } catch {
                  // Save failed — still allow post with existing list
                } finally {
                  setSaving(false);
                }
              }
              onClose();
              onPostForCloseFriends();
            }}
            disabled={friends.length === 0}
            style={{
              flex: 1,
              height: 42,
              borderRadius: 21,
              border: "none",
              background:
                friends.length === 0
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg,#22c55e,#16a34a)",
              color: friends.length === 0 ? "rgba(255,255,255,0.2)" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: friends.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Star size={14} fill={friends.length > 0 ? "#fff" : "none"} />
            Post for CF
          </button>
        )}
      </div>
    </div>
  );
}
