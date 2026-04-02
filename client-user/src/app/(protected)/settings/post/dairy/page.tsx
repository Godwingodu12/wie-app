"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Plus, Trash2, Eye, EyeOff,
  Lock, Globe, Users, Star, ChevronRight,
  Check, Edit3, MoreHorizontal,
} from "lucide-react";
import {
  getUserDiaries, deleteDiary, editDiary,
} from "@/services/mediaService";
import type { Diary } from "@/services/mediaService";

const PURPLE  = "linear-gradient(135deg,#8860D9,#B3B8E2)";
const BLUE    = "linear-gradient(135deg,#3b82f6,#6366f1)";

type VisIcon = { icon: React.ReactNode; label: string; color: string };
const VIS_MAP: Record<string, VisIcon> = {
  public:       { icon: <Globe size={12} />,  label: "Public",        color: "#3b82f6" },
  followers:    { icon: <Users size={12} />,  label: "Followers",     color: "#8860D9" },
  close_friends:{ icon: <Star  size={12} />,  label: "Close Friends", color: "#22c55e" },
  only_me:      { icon: <Lock  size={12} />,  label: "Only Me",       color: "#ef4444" },
};

// ── Tiny components ──────────────────────────────────────────────────────────
function Toast({ msg, success = true }: { msg: string; success?: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, padding: "10px 22px", borderRadius: 24,
      background: success ? "rgba(34,197,94,0.92)" : "rgba(239,68,68,0.9)",
      color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", gap: 7,
    }}>
      {success ? <Check size={14} strokeWidth={3} /> : "✕"} {msg}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800,
      letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 10px", paddingLeft: 4,
    }}>
      {label}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

// Visibility badge
function VisBadge({ vis }: { vis: string }) {
  const v = VIS_MAP[vis] ?? VIS_MAP.followers;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700,
      background: `${v.color}22`, color: v.color,
    }}>
      {v.icon} {v.label}
    </span>
  );
}

// Confirm dialog
function ConfirmDialog({
  title, body, onCancel, onConfirm, loading,
}: { title: string; body: string; onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 201, width: 320, borderRadius: 16, background: "#1a1a1f",
        border: "1px solid rgba(255,255,255,0.1)", padding: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{body}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 40, borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)", background: "transparent",
            color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, height: 40, borderRadius: 20, border: "none",
            background: "rgba(239,68,68,0.9)", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
          }}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DiarySettingsPage() {
  const router = useRouter();
  const [diaries,  setDiaries]  = useState<Diary[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);   // diaryId to confirm delete
  const [working,  setWorking]  = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    // ── We need the viewer's own userId — read from localStorage or auth context.
    // For now we grab it safely so the build doesn't break.
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const userId = raw ? (JSON.parse(raw)?.id ?? JSON.parse(raw)?._id) : null;
    if (!userId) { setLoading(false); return; }

    getUserDiaries(userId)
      .then(setDiaries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (diaryId: string) => {
    setWorking(diaryId);
    try {
      await deleteDiary(diaryId);
      setDiaries((prev) => prev.filter((d) => d._id !== diaryId));
      showToast("Diary deleted");
    } catch { showToast("Failed to delete", false); }
    setWorking(null);
    setDeleting(null);
  };

  const handleToggleVisibility = async (diary: Diary) => {
    const next: Diary["visibility"] =
      diary.visibility === "public" ? "followers" :
      diary.visibility === "followers" ? "close_friends" :
      diary.visibility === "close_friends" ? "only_me" : "public";
    try {
      const updated = await editDiary(diary._id, { visibility: next });
      setDiaries((prev) => prev.map((d) => d._id === diary._id ? updated : d));
      showToast(`Visibility → ${VIS_MAP[next]?.label ?? next}`);
    } catch { showToast("Failed to update", false); }
  };

  return (
    <div style={{
      minHeight: "100%", background: "transparent", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      padding: "24px", paddingBottom: 80,
    }}>
      {toast && <Toast msg={toast.msg} success={toast.ok} />}
      {deleting && (
        <ConfirmDialog
          title="Delete diary?"
          body={`This diary and all its flux links will be permanently removed. Flux content itself won't be deleted.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
          loading={!!working}
        />
      )}

      {/* ── Info card ── */}
      <div style={{
        borderRadius: 14, background: "rgba(59,130,246,0.07)",
        border: "1px solid rgba(59,130,246,0.2)", padding: "14px 16px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={11} color="#fff" />
          </div>
          <span style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700 }}>About Diaries</span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          Diaries let you curate collections of your fluxes — like a story album. Set each diary's visibility independently.
        </p>
      </div>

      {/* ── Create new diary ── */}
      <SectionLabel label="Actions" />
      <Card>
        <button
          onClick={() => router.push("/diary/create")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", width: "100%", background: "transparent",
            border: "none", cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 11, background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plus size={18} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>Create New Diary</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Start a new curated flux collection</p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
        </button>
      </Card>

      {/* ── Diary list ── */}
      <SectionLabel label={`Your Diaries (${diaries.length})`} />

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            border: "3px solid #8860D9", borderTopColor: "transparent",
            animation: "spin 0.7s linear infinite",
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!loading && diaries.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          borderRadius: 16, background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No diaries yet</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, lineHeight: 1.6 }}>
            Create your first diary to start archiving and curating your flux stories.
          </p>
          <button
            onClick={() => router.push("/diary/create")}
            style={{
              marginTop: 16, padding: "8px 24px", borderRadius: 20, border: "none",
              background: PURPLE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Create Diary
          </button>
        </div>
      )}

      {!loading && diaries.length > 0 && (
        <Card>
          {diaries.map((diary, i) => {
            const isLast = i === diaries.length - 1;
            const isMenuOpen = menuOpen === diary._id;
            return (
              <div key={diary._id} style={{ position: "relative" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                }}>
                  {/* Cover / placeholder */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)",
                    position: "relative",
                  }}>
                    {diary.coverImage ? (
                      <img src={diary.coverImage} alt={diary.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                        📓
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {diary.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <VisBadge vis={diary.visibility} />
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                        {diary.fluxCount ?? 0} flux{diary.fluxCount !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions menu trigger */}
                  <button
                    onClick={() => setMenuOpen(isMenuOpen ? null : diary._id)}
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <MoreHorizontal size={15} color="rgba(255,255,255,0.6)" />
                  </button>
                </div>

                {/* Dropdown menu */}
                {isMenuOpen && (
                  <>
                    <div
                      onClick={() => setMenuOpen(null)}
                      style={{ position: "fixed", inset: 0, zIndex: 80 }}
                    />
                    <div style={{
                      position: "absolute", right: 12, top: 56, zIndex: 90,
                      background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: 180,
                    }}>
                      {[
                        {
                          icon: <Eye size={14} />, label: "View Diary",
                          action: () => { router.push(`/diary/${diary._id}`); setMenuOpen(null); },
                        },
                        {
                          icon: <Edit3 size={14} />, label: "Edit Diary",
                          action: () => { router.push(`/diary/${diary._id}/edit`); setMenuOpen(null); },
                        },
                        {
                          icon: <Globe size={14} />, label: `Visibility: ${VIS_MAP[diary.visibility]?.label}`,
                          action: () => { handleToggleVisibility(diary); setMenuOpen(null); },
                        },
                        {
                          icon: <Trash2 size={14} />, label: "Delete Diary",
                          danger: true,
                          action: () => { setDeleting(diary._id); setMenuOpen(null); },
                        },
                      ].map((item, mi) => (
                        <button
                          key={mi}
                          onClick={item.action}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "11px 16px", background: "transparent",
                            border: "none", borderBottom: mi < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
                            cursor: "pointer", textAlign: "left",
                            color: (item as any).danger ? "#ef4444" : "rgba(255,255,255,0.75)",
                            fontSize: 13, fontWeight: 500,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {/* ── Archived fluxes shortcut ── */}
      <SectionLabel label="Archive" />
      <Card>
        <button
          onClick={() => router.push("/post/flux-view?archive=true")}
          style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
            width: "100%", background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 11, background: "rgba(136,96,217,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={17} color="#9575CD" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>Archived Fluxes</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Browse your expired & archived stories</p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
        </button>
      </Card>
    </div>
  );
}