"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Film, Star, ChevronRight, MessageCircle, Archive, Eye,
  Trash2, Settings2,
} from "lucide-react";
import { getMyFluxes, toggleFluxComments, archiveFlux } from "@/services/mediaService";
import type { Flux } from "@/services/mediaService";

const PURPLE  = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";
const GREEN   = "linear-gradient(135deg,#22c55e,#16a34a)";

// ── Tiny toast ──────────────────────────────────────────────────────────────
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, padding: "10px 22px", borderRadius: 24,
      background: "rgba(30,30,35,0.96)", border: "1px solid rgba(255,255,255,0.12)",
      backdropFilter: "blur(12px)", color: "#fff", fontSize: 13, fontWeight: 600,
      whiteSpace: "nowrap", boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      {msg}
    </div>
  );
}

// ── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{
      borderRadius: 16, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 12,
    }}>
      {title && (
        <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", margin: 0 }}>
            {title}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Nav row (tappable row that goes to sub-page) ─────────────────────────────
function NavRow({
  icon, label, sub, href, accent = "rgba(136,96,217,0.15)", accentColor = "#8860D9",
}: {
  icon: React.ReactNode; label: string; sub?: string;
  href: string; accent?: string; accentColor?: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        width: "100%", padding: "14px 16px", background: "transparent",
        border: "none", cursor: "pointer", textAlign: "left",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, background: accent,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {React.cloneElement(icon as any, { size: 17, color: accentColor })}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>{label}</p>
        {sub && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{sub}</p>}
      </div>
      <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
    </button>
  );
}

export default function FluxSettingsPage() {
  const router  = useRouter();
  const [fluxes,  setFluxes]  = useState<Flux[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    getMyFluxes()
      .then(setFluxes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleComments = async (flux: Flux) => {
    if (working) return;
    setWorking(flux._id);
    try {
      const res = await toggleFluxComments(flux._id);
      setFluxes((prev) => prev.map((f) => f._id === flux._id ? { ...f, commentsDisabled: res.commentsDisabled } : f));
      showToast(res.message);
    } catch { showToast("Failed — try again"); }
    setWorking(null);
  };

  const handleArchive = async (flux: Flux) => {
    if (working) return;
    setWorking(flux._id);
    try {
      const res = await archiveFlux(flux._id);
      setFluxes((prev) => prev.map((f) => f._id === flux._id ? { ...f, isArchived: res.isArchived } : f));
      showToast(res.message);
    } catch { showToast("Failed — try again"); }
    setWorking(null);
  };

  return (
    <div style={{
      minHeight: "100%", background: "transparent", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      padding: "24px",
    }}>
      {toast && <Toast msg={toast} />}

      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 20 }}>
        Flux Settings
      </p>

      {/* ── Core Flux Controls ── */}
      <SectionCard title="Controls">
        {/* Story Settings — main sub-page */}
        <NavRow
          icon={<Film />}
          label="Story Settings"
          sub="Privacy, interactions, sharing & advanced"
          href="/settings/post/flux/story-settings"
          accent="rgba(136,96,217,0.18)"
          accentColor="#9575CD"
        />
        {/* Close Friends */}
        <NavRow
          icon={<Star />}
          label="Close Friends"
          sub="Manage who sees your close-friends fluxes"
          href="/settings/post/flux/close-friends"
          accent="rgba(34,197,94,0.15)"
          accentColor="#22c55e"
        />
      </SectionCard>

      {/* ── Active Fluxes ── */}
      <SectionCard title="Your Active Fluxes">
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", padding: 28 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              border: "2px solid #8860D9", borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && fluxes.length === 0 && (
          <div style={{ padding: "28px 20px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No active fluxes</p>
          </div>
        )}

        {!loading && fluxes.map((flux, i) => {
          const isWorking   = working === flux._id;
          const cfDisabled  = (flux as any).commentsDisabled ?? false;
          const archived    = flux.isArchived ?? false;
          const thumb       = flux.mediaUrl;
          const isVideo     = flux.mediaType === "video";
          const timeStr     = flux.createdAt
            ? new Date(flux.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : "";

          return (
            <div
              key={flux._id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 16px",
                borderBottom: i < fluxes.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0,
                background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)",
              }}>
                {thumb && !isVideo ? (
                  <img src={thumb} alt="flux" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                    🎬
                  </div>
                )}
              </div>

              {/* Info + toggles */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0 }}>{timeStr}</p>
                  {archived && (
                    <span style={{ fontSize: 10, background: "rgba(136,96,217,0.2)", color: "#9575CD", padding: "1px 7px", borderRadius: 8, fontWeight: 600 }}>
                      Archived
                    </span>
                  )}
                  {cfDisabled && (
                    <span style={{ fontSize: 10, background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "1px 7px", borderRadius: 8, fontWeight: 600 }}>
                      No comments
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <ActionBtn
                    label={cfDisabled ? "Comments off" : "Comments on"}
                    icon={<MessageCircle size={11} />}
                    danger={cfDisabled}
                    disabled={!!working}
                    loading={isWorking}
                    onClick={() => handleToggleComments(flux)}
                  />
                  <ActionBtn
                    label={archived ? "Unarchive" : "Archive"}
                    icon={<Archive size={11} />}
                    disabled={!!working}
                    loading={isWorking}
                    onClick={() => handleArchive(flux)}
                  />
                  <ActionBtn
                    label="View"
                    icon={<Eye size={11} />}
                    onClick={() => router.push(`/post/flux-view?fluxId=${flux._id}`)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

function ActionBtn({
  label, icon, danger = false, disabled = false, loading = false, onClick,
}: {
  label: string; icon: React.ReactNode; danger?: boolean;
  disabled?: boolean; loading?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
        borderRadius: 16, fontSize: 11, fontWeight: 600,
        cursor: disabled ? "wait" : "pointer",
        border: `1px solid ${danger ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.12)"}`,
        background: danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)",
        color: danger ? "#ef4444" : "rgba(255,255,255,0.6)",
        opacity: loading ? 0.5 : 1, transition: "all 0.15s",
      }}
    >
      {icon} {label}
    </button>
  );
}