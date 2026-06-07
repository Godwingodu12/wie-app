"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, MessageCircle, Heart, Share2, Save,
  Archive, Star, Clock, BarChart2, Camera, ChevronRight,
  Check, Users, Globe, Lock, UserCheck, Loader2,
} from "lucide-react";
import {
  getStorySettings,updateStorySettings,getHideFromList,updateFluxVisibility,getScreenshotBlockSetting,type StorySettings,
  type HiddenUser,type FluxVisibility,
} from "@/services/mediaService";

type Audience = "public" | "followers" | "close_friends" | "only_me";
type ReplyMode = "everyone" | "mutual" | "off";


const DEFAULT: StorySettings = {
  visibility: "public",
  audience: "public",
  hideFrom: [],
  allowReplies: "everyone",
  allowReactions: true,
  allowMessageReplies: true,
  allowShareToStory: true,
  allowShareAsMessage: true,
  allowExternalShare: false,
  saveToDevice: false,
  saveToArchive: true,
  autosaveDrafts: true,
  duration: 24,
  showAnalytics: true,
  restrictScreenshots: false,
};

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800,
      letterSpacing: 1.2, textTransform: "uppercase",
      margin: "0 0 10px", paddingLeft: 4,
    }}>
      {label}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden", marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 16px" }} />;
}

function Row({
  icon, label, sub, children, last = false,
}: {
  icon: React.ReactNode; label: string; sub?: string;
  children?: React.ReactNode; last?: boolean;
}) {
  return (
    <>
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px", minHeight: 56,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>{label}</p>
          {sub && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>{sub}</p>}
        </div>
        {children}
      </div>
      {!last && <Divider />}
    </>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: value ? "#22c55e" : "rgba(255,255,255,0.15)",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function AudienceCard({
  value, current, label, sub, icon, onSelect,
}: {
  value: Audience; current: Audience; label: string; sub: string;
  icon: React.ReactNode; onSelect: (v: Audience) => void;
}) {
  const active = value === current;
  return (
    <button
      onClick={() => onSelect(value)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", width: "100%",
        background: active ? "rgba(136,96,217,0.14)" : "transparent",
        border: "none", cursor: "pointer", textAlign: "left",
        borderLeft: active ? "3px solid #8860D9" : "3px solid transparent",
        transition: "all 0.15s",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: active ? "rgba(136,96,217,0.25)" : "rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        transition: "background 0.15s",
      }}>
        {React.cloneElement(icon as any, { size: 16, color: active ? "#9575CD" : "rgba(255,255,255,0.4)" })}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: active ? "#fff" : "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, margin: "0 0 1px" }}>
          {label}
        </p>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>{sub}</p>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: `2px solid ${active ? "#8860D9" : "rgba(255,255,255,0.2)"}`,
        background: active ? "#8860D9" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.15s",
      }}>
        {active && <Check size={10} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  );
}

function Segment({
  value, current, label, onSelect,
}: { value: ReplyMode; current: ReplyMode; label: string; onSelect: (v: ReplyMode) => void }) {
  const active = value === current;
  return (
    <button
      onClick={() => onSelect(value)}
      style={{
        flex: 1, padding: "7px 4px", borderRadius: 10,
        background: active ? "rgba(136,96,217,0.3)" : "transparent",
        border: `1px solid ${active ? "rgba(136,96,217,0.5)" : "transparent"}`,
        color: active ? "#fff" : "rgba(255,255,255,0.4)",
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function DurBtn({
  value, current, label, onSelect,
}: { value: 24 | 48 | 72; current: 24 | 48 | 72; label: string; onSelect: (v: 24 | 48 | 72) => void }) {
  const active = value === current;
  return (
    <button
      onClick={() => onSelect(value)}
      style={{
        flex: 1, padding: "9px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600,
        background: active ? "rgba(136,96,217,0.25)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${active ? "rgba(136,96,217,0.5)" : "rgba(255,255,255,0.08)"}`,
        color: active ? "#B3B8E2" : "rgba(255,255,255,0.4)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export default function StorySettingsPage() {
  const router = useRouter();
  const [s, setS]                     = useState<StorySettings>(DEFAULT);
  const [saved, setSaved]             = useState(false);
  const [loading, setLoading]         = useState(true);
  const [autoSaving, setAutoSaving]   = useState(false);
  const [hiddenUsers, setHiddenUsers] = useState<HiddenUser[]>([]);
  const [error, setError]             = useState<string | null>(null);
  const [activeFluxId, setActiveFluxId] = useState<string | null>(null);
  const [visibilityUpdating, setVisibilityUpdating] = useState(false);
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Load settings from backend on mount
  useEffect(() => {
    // Read optional ?fluxId= from URL to show per-flux visibility
    const params  = new URLSearchParams(window.location.search);
    const fluxId  = params.get("fluxId") ?? null;
    setActiveFluxId(fluxId);

    const tasks: Promise<any>[] = [getStorySettings(), getHideFromList()];

    // If a specific flux is in context, fetch its current visibility too
    if (fluxId) {
      tasks.push(
        import("@/services/mediaService").then(({ getFluxVisibility }) =>
          getFluxVisibility(fluxId)
        )
      );
    }

    Promise.all(tasks)
      .then(([settings, hidden, fluxVis]) => {
        // Merge per-flux visibility on top of global settings
        const merged: StorySettings = {
          ...settings,
          ...(fluxVis
            ? {
                visibility: fluxVis.visibility,
                audience:   fluxVis.visibility,
              }
            : {}),
        };
        setS(merged);
        setHiddenUsers(hidden);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  // per-flux visibility if a fluxId is present in the URL
  const handleAudienceSelect = async (v: Audience) => {
    // Update both fields atomically in one state mutation → one auto-save
    setS((prev) => {
      const next = { ...prev, audience: v, visibility: v };
      autoSave(next);
      return next;
    });
    setSaved(false);

    if (!activeFluxId) return;

    setVisibilityUpdating(true);
    try {
      await updateFluxVisibility(activeFluxId, v);
    } catch {
      setS((prev) => ({ ...prev, audience: prev.audience, visibility: prev.visibility }));
      setError("Failed to update visibility. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setVisibilityUpdating(false);
    }
  };

  // Debounced auto-save — fires 600ms after the last change
  const autoSave = useCallback(async (latest: StorySettings) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const payload: Partial<StorySettings> = {
          visibility:          latest.visibility,
          audience:            latest.audience,
          allowReplies:        latest.allowReplies,
          allowReactions:      latest.allowReactions,
          allowMessageReplies: latest.allowMessageReplies,
          allowShareToStory:   latest.allowShareToStory,
          allowShareAsMessage: latest.allowShareAsMessage,
          allowExternalShare:  latest.allowExternalShare,
          saveToDevice:        latest.saveToDevice,
          saveToArchive:       latest.saveToArchive,
          autosaveDrafts:      latest.autosaveDrafts,
          duration:            latest.duration,
          showAnalytics:       latest.showAnalytics,
          restrictScreenshots: Boolean(latest.restrictScreenshots),
        };
        const updated = await updateStorySettings(payload);
        setS((prev) => ({
          ...prev,
          ...updated,
          restrictScreenshots: updated.restrictScreenshots ?? prev.restrictScreenshots,
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      } catch {
        setError("Auto-save failed. Please try again.");
        setTimeout(() => setError(null), 3000);
      } finally {
        setAutoSaving(false);
      }
    }, 600);
  }, []);

  // update — mutates state and triggers debounced auto-save
  const update = useCallback(<K extends keyof StorySettings>(key: K, val: StorySettings[K]) => {
    setS((prev) => {
      const next = { ...prev, [key]: val };
      autoSave(next);
      return next;
    });
    setSaved(false);
  }, [autoSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent",
      }}>
        <Loader2 size={28} color="#8860D9" style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100%", background: "transparent", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      padding: "24px", paddingBottom: 80,
    }}>

      {saved && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, padding: "10px 22px", borderRadius: 24,
          background: "rgba(34,197,94,0.92)", color: "#fff",
          fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 7,
        }}>
          <Check size={14} strokeWidth={3} /> Saved automatically
        </div>
      )}
      {error && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 999, padding: "10px 22px", borderRadius: 24,
          background: "rgba(239,68,68,0.92)", color: "#fff",
          fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 7,
        }}>
          ⚠️ {error}
        </div>
      )}
      {autoSaving && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 998, padding: "8px 18px", borderRadius: 24,
          background: "rgba(20,20,25,0.88)", color: "rgba(255,255,255,0.6)",
          fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", gap: 7,
          backdropFilter: "blur(10px)",
        }}>
          <Loader2 size={12} color="#8860D9" style={{ animation: "spin 1s linear infinite" }} />
          Saving…
        </div>
      )}
      {/* ── 1. PRIVACY */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <SectionLabel label="Privacy" />
        {visibilityUpdating && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Loader2 size={12} color="#8860D9" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Updating…</span>
          </div>
        )}
      </div>
      <Card>
        <div style={{ padding: "12px 16px 6px" }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, margin: "0 0 10px" }}>
            Who can view your flux?
          </p>
        </div>
        <Divider />
          <AudienceCard value="public" current={s.audience} onSelect={handleAudienceSelect}
            icon={<Globe />} label="Public" sub="Anyone on Wie can see your flux" />
          <Divider />
          <AudienceCard value="followers" current={s.audience} onSelect={handleAudienceSelect}
            icon={<Users />} label="Followers" sub="Only people who follow you" />
          <Divider />
          <AudienceCard value="close_friends" current={s.audience} onSelect={handleAudienceSelect}
            icon={<Star />} label="Close Friends" sub="Only your close friends list" />
          <Divider />
          <AudienceCard value="only_me" current={s.audience} onSelect={handleAudienceSelect}
            icon={<Lock />} label="Only Me" sub="Completely private" />
        <Divider />

        {/* Hide flux from */}
        <button
          onClick={() => router.push("/settings/post/flux/flux-settings/hide-flux")}
          style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%",
            padding: "13px 16px", background: "transparent", border: "none",
            cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <EyeOff size={16} color="rgba(255,255,255,0.4)" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>Hide flux from</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
              {hiddenUsers.length > 0 ? `${hiddenUsers.length} people hidden` : "Select users to hide from"}
            </p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
        </button>
      </Card>

      {/* ── 2. INTERACTIONS */}
      <SectionLabel label="Interactions" />
      <Card>
        <div style={{ padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle size={16} color="rgba(255,255,255,0.4)" />
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>Allow replies</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Who can reply to your flux</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4 }}>
            <Segment value="everyone" current={s.allowReplies as ReplyMode} label="Everyone" onSelect={(v) => update("allowReplies", v)} />
            <Segment value="mutual" current={s.allowReplies as ReplyMode} label="Mutual" onSelect={(v) => update("allowReplies", v)} />
            <Segment value="off" current={s.allowReplies as ReplyMode} label="Off" onSelect={(v) => update("allowReplies", v)} />
          </div>
        </div>
        <Divider />
        <Row icon={<Heart size={16} color="rgba(255,255,255,0.4)" />} label="Allow reactions" sub="Let people react with emoji">
          <Toggle value={s.allowReactions} onChange={(v) => update("allowReactions", v)} />
        </Row>
        <Row icon={<MessageCircle size={16} color="rgba(255,255,255,0.4)" />} label="Allow message replies" sub="Reply as a direct message" last>
          <Toggle value={s.allowMessageReplies} onChange={(v) => update("allowMessageReplies", v)} />
        </Row>
      </Card>

      {/* ── 3. SHARING */}
      <SectionLabel label="Sharing" />
      <Card>
        <Row icon={<Share2 size={16} color="rgba(255,255,255,0.4)" />} label="Allow resharing to flux" sub="Others can add your flux to theirs">
          <Toggle value={s.allowShareToStory} onChange={(v) => update("allowShareToStory", v)} />
        </Row>
        <Row icon={<MessageCircle size={16} color="rgba(255,255,255,0.4)" />} label="Allow sharing as message" sub="Share directly to chat">
          <Toggle value={s.allowShareAsMessage} onChange={(v) => update("allowShareAsMessage", v)} />
        </Row>
        <Row icon={<Globe size={16} color="rgba(255,255,255,0.4)" />} label="Share to external platforms" sub="Instagram, WhatsApp, etc." last>
          <Toggle value={s.allowExternalShare} onChange={(v) => update("allowExternalShare", v)} />
        </Row>
      </Card>

      {/* 4. SAVE & ARCHIVE */}
      <SectionLabel label="Save & Archive" />
      <Card>
        <Row icon={<Save size={16} color="rgba(255,255,255,0.4)" />} label="Save flux to device" sub="Auto-download after posting">
          <Toggle value={s.saveToDevice} onChange={(v) => update("saveToDevice", v)} />
        </Row>
        <Row icon={<Archive size={16} color="rgba(255,255,255,0.4)" />} label="Save flux to archive" sub="Auto-archive when expired">
          <Toggle value={s.saveToArchive} onChange={(v) => update("saveToArchive", v)} />
        </Row>
        <Row icon={<Save size={16} color="rgba(255,255,255,0.4)" />} label="Auto-save drafts" sub="Keep unposted flux as draft" last>
          <Toggle value={s.autosaveDrafts} onChange={(v) => update("autosaveDrafts", v)} />
        </Row>
      </Card>

      {/* 5. CLOSE FRIENDS */}
      <SectionLabel label="Close Friends" />
      <Card>
        <button
          onClick={() => router.push("/settings/post/flux/close-friends")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", width: "100%", background: "transparent",
            border: "none", cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(34,197,94,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Star size={16} color="#22c55e" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>
              Manage Close Friends
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
              Add or remove people from your list
            </p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
        </button>
      </Card>

      {/* 6. ADVANCED */}
      <SectionLabel label="Advanced" />
      <Card>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={16} color="rgba(255,255,255,0.4)" />
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 500, margin: "0 0 1px" }}>Flux duration</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>How long your flux stays visible</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <DurBtn value={24} current={s.duration as 24 | 48 | 72} label="24 hrs" onSelect={(v) => update("duration", v)} />
            <DurBtn value={48} current={s.duration as 24 | 48 | 72} label="48 hrs" onSelect={(v) => update("duration", v)} />
            <DurBtn value={72} current={s.duration as 24 | 48 | 72} label="72 hrs" onSelect={(v) => update("duration", v)} />
          </div>
        </div>
        <Row icon={<BarChart2 size={16} color="rgba(255,255,255,0.4)" />} label="Flux analytics" sub="Show view & interaction stats">
          <Toggle value={s.showAnalytics} onChange={(v) => update("showAnalytics", v)} />
        </Row>
        <div>
          <Row icon={<Camera size={16} color="rgba(255,255,255,0.4)" />} label="Restrict screenshots" sub="Detect & notify when someone screenshots your flux" last>
            <Toggle value={s.restrictScreenshots} onChange={(v) => update("restrictScreenshots", v)} />
          </Row>
        </div>
      </Card>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}