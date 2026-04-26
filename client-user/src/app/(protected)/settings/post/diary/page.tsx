"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Plus, Trash2, Globe, Users, Star, Lock,
  ChevronRight, Check, Edit3, MoreHorizontal, Grid,
  List as ListIcon, Clock, BarChart2, Sparkles, MapPin,
  Tag, Archive, MessageCircle, Heart, Share2, Repeat2,
  RefreshCw, Zap, ChevronDown,
} from "lucide-react";
import {
  getUserDiaries, deleteDiary, editDiary,
  getDiarySettings, updateDiarySettings,
} from "@/services/mediaService";
import type { Diary, DiarySettings } from "@/services/mediaService";

// ── Constants ─────────────────────────────────────────────────────────────────
const PURPLE = "linear-gradient(135deg,#8860D9,#B3B8E2)";
const BLUE   = "linear-gradient(135deg,#3b82f6,#6366f1)";

const VIS_OPTIONS = [
  { value: "public",        icon: <Globe  size={13}/>, label: "Public",        color: "#3b82f6" },
  { value: "followers",     icon: <Users  size={13}/>, label: "Followers",     color: "#8860D9" },
  { value: "close_friends", icon: <Star   size={13}/>, label: "Close Friends", color: "#22c55e" },
  { value: "only_me",       icon: <Lock   size={13}/>, label: "Only Me",       color: "#ef4444" },
] as const;

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 999, padding: "10px 22px", borderRadius: 24,
      background: ok ? "rgba(34,197,94,0.92)" : "rgba(239,68,68,0.9)",
      color: "#fff", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
      boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", gap: 7,
    }}>
      {ok ? <Check size={14} strokeWidth={3}/> : "✕"} {msg}
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 800,
      letterSpacing: 1.2, textTransform: "uppercase", margin: "0 0 10px 4px",
    }}>{label}</p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: 16, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden",
      marginBottom: 16, ...style,
    }}>{children}</div>
  );
}

function SettingRow({
  icon, label, sub, children, noBorder,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "13px 16px",
      borderBottom: noBorder ? "none" : "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: "rgba(136,96,217,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#9575CD",
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
        {sub && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: "2px 0 0" }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// Toggle switch
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 26, borderRadius: 13, border: "none",
        background: value ? "#8860D9" : "rgba(255,255,255,0.12)",
        position: "relative", cursor: "pointer", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3,
        left: value ? 21 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }}/>
    </button>
  );
}

// Segment control (2–3 options)
function Segment<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{
      display: "flex", background: "rgba(255,255,255,0.06)",
      borderRadius: 10, padding: 3, gap: 2, flexShrink: 0,
    }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: "5px 12px", borderRadius: 8, border: "none",
            background: value === o.value ? "#8860D9" : "transparent",
            color: value === o.value ? "#fff" : "rgba(255,255,255,0.4)",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            transition: "all 0.15s",
          }}
        >{o.label}</button>
      ))}
    </div>
  );
}

// Visibility badge (for diary list)
function VisBadge({ vis }: { vis: string }) {
  const v = VIS_OPTIONS.find((x) => x.value === vis) ?? VIS_OPTIONS[1];
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
  onCancel, onConfirm, loading,
}: { onCancel: () => void; onConfirm: () => void; loading: boolean }) {
  return (
    <>
      <div onClick={onCancel} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      }}/>
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)", zIndex: 201,
        width: 320, borderRadius: 16, background: "#1a1a1f",
        border: "1px solid rgba(255,255,255,0.1)", padding: 24,
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Delete diary?
        </h3>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          This diary and all its flux links will be permanently removed. Flux content itself won't be deleted.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, height: 40, borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent", color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, height: 40, borderRadius: 20, border: "none",
            background: "rgba(239,68,68,0.9)", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer",
          }}>{loading ? "Deleting…" : "Delete"}</button>
        </div>
      </div>
    </>
  );
}

// Visibility dropdown (for global settings)
function VisSelect({
  value, onChange,
}: { value: DiarySettings["defaultVisibility"]; onChange: (v: DiarySettings["defaultVisibility"]) => void }) {
  const [open, setOpen] = useState(false);
  const current = VIS_OPTIONS.find((x) => x.value === value) ?? VIS_OPTIONS[1];
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)", cursor: "pointer",
          color: current.color, fontSize: 12, fontWeight: 700,
        }}
      >
        {current.icon} {current.label}
        <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.3)", marginLeft: 2 }}/>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }}/>
          <div style={{
            position: "absolute", right: 0, top: 38, zIndex: 60,
            background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, overflow: "hidden", minWidth: 160,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}>
            {VIS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value as DiarySettings["defaultVisibility"]); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", padding: "10px 14px",
                  background: value === opt.value ? "rgba(136,96,217,0.15)" : "transparent",
                  border: "none", color: opt.color, fontSize: 13, fontWeight: 600,
                  cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = value === opt.value ? "rgba(136,96,217,0.15)" : "transparent")}
              >
                {opt.icon} {opt.label}
                {value === opt.value && <Check size={12} style={{ marginLeft: "auto" }}/>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Default settings shape (used before API loads) ────────────────────────────
const DEFAULT_SETTINGS: DiarySettings = {
  defaultVisibility: "followers",
  interactions: { allowReplies: true, allowReactions: true, allowSharing: true, allowShareAsMessage: true },
  autoHighlight: { enabled: false, basedOnTags: false, basedOnLocation: false, aiSuggestions: false },
  organization: { displayMode: "grid", defaultSortOrder: "newest", enableGrouping: false },
  coverStyle: "story_preview",
  lifecycle: { keepForever: true, autoExpireAfterDays: null, archiveInsteadOfDelete: true },
  analyticsEnabled: true,
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DiarySettingsPage() {
  const router = useRouter();

  // Global settings state
  const [settings,        setSettings]        = useState<DiarySettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [dirty,           setDirty]           = useState(false);
  const [saving,          setSaving]          = useState(false);
  const savedRef = useRef<DiarySettings>(DEFAULT_SETTINGS);

  // Diary list state
  const [diaries,  setDiaries]  = useState<Diary[]>([]);
  const [listLoad, setListLoad] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [working,  setWorking]  = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2600);
  };

  // Load global settings
  useEffect(() => {
    getDiarySettings()
      .then((s) => { setSettings(s); savedRef.current = s; })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  // Load diary list
  useEffect(() => {
    const raw    = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const userId = raw ? (JSON.parse(raw)?.id ?? JSON.parse(raw)?._id) : null;
    if (!userId) { setListLoad(false); return; }
    getUserDiaries(userId)
      .then(setDiaries)
      .catch(() => {})
      .finally(() => setListLoad(false));
  }, []);

  // Generic setter — marks form dirty
  const set = useCallback(<K extends keyof DiarySettings>(
    key: K, value: DiarySettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const setNested = useCallback(<
    Section extends keyof DiarySettings,
    Field extends keyof DiarySettings[Section],
  >(
    section: Section, field: Field, value: DiarySettings[Section][Field],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [field]: value },
    }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateDiarySettings(settings);
      savedRef.current = updated;
      setSettings(updated);
      setDirty(false);
      showToast("Settings saved");
    } catch {
      showToast("Failed to save", false);
    }
    setSaving(false);
  };

  const handleDiscard = () => {
    setSettings(savedRef.current);
    setDirty(false);
  };

  // Diary list actions
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

  const handleCycleVisibility = async (diary: Diary) => {
    const order: Diary["visibility"][] = ["public", "followers", "close_friends", "only_me"];
    const next = order[(order.indexOf(diary.visibility) + 1) % order.length];
    try {
      const updated = await editDiary(diary._id, { visibility: next });
      setDiaries((prev) => prev.map((d) => d._id === diary._id ? updated : d));
      const label = VIS_OPTIONS.find((x) => x.value === next)?.label ?? next;
      showToast(`Visibility → ${label}`);
    } catch { showToast("Failed to update", false); }
  };

  const spinStyle: React.CSSProperties = {
    width: 24, height: 24, borderRadius: "50%",
    border: "3px solid #8860D9", borderTopColor: "transparent",
    animation: "spin 0.7s linear infinite",
  };

  return (
    <div style={{
      minHeight: "100%", background: "transparent", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      padding: "24px", paddingBottom: 80,
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast && <Toast msg={toast.msg} ok={toast.ok}/>}
      {deleting && (
        <ConfirmDialog
          onCancel={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
          loading={!!working}
        />
      )}

      {/* ── Info banner ── */}
      <div style={{
        borderRadius: 14, background: "rgba(59,130,246,0.07)",
        border: "1px solid rgba(59,130,246,0.2)",
        padding: "14px 16px", marginBottom: 24,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: "50%", background: BLUE,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <BookOpen size={11} color="#fff"/>
        </div>
        <div>
          <p style={{ color: "#60a5fa", fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>
            About Diary Settings
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            Global defaults apply to every new diary you create. You can always override settings per diary.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          GLOBAL SETTINGS
      ══════════════════════════════════════════ */}
      <SectionLabel label="Global Defaults"/>

      {settingsLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
          <div style={spinStyle}/>
        </div>
      ) : (
        <>
          {/* ── Default Visibility ── */}
          <Card>
            <SettingRow
              icon={<Globe size={15}/>}
              label="Default Visibility"
              sub="Who sees newly created diaries"
              noBorder
            >
              <VisSelect
                value={settings.defaultVisibility}
                onChange={(v) => set("defaultVisibility", v)}
              />
            </SettingRow>
          </Card>

          {/* ── Interaction defaults ── */}
          <Card>
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
                Interaction Defaults
              </p>
            </div>
            <SettingRow icon={<MessageCircle size={15}/>} label="Allow Replies" sub="Viewers can reply to diary entries">
              <Toggle value={settings.interactions.allowReplies} onChange={(v) => setNested("interactions", "allowReplies", v)}/>
            </SettingRow>
            <SettingRow icon={<Heart size={15}/>} label="Allow Reactions" sub="Viewers can react with emojis">
              <Toggle value={settings.interactions.allowReactions} onChange={(v) => setNested("interactions", "allowReactions", v)}/>
            </SettingRow>
            <SettingRow icon={<Share2 size={15}/>} label="Allow Sharing" sub="Viewers can share diary to their story">
              <Toggle value={settings.interactions.allowSharing} onChange={(v) => setNested("interactions", "allowSharing", v)}/>
            </SettingRow>
            <SettingRow icon={<Repeat2 size={15}/>} label="Allow Share as Message" sub="Viewers can DM the diary" noBorder>
              <Toggle value={settings.interactions.allowShareAsMessage} onChange={(v) => setNested("interactions", "allowShareAsMessage", v)}/>
            </SettingRow>
          </Card>

          {/* ── Organisation ── */}
          <Card>
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
                Organisation
              </p>
            </div>
            <SettingRow icon={<Grid size={15}/>} label="Display Mode" sub="How your diaries appear on profile">
              <Segment
                value={settings.organization.displayMode}
                options={[{ value: "grid", label: "Grid" }, { value: "scroll", label: "Scroll" }]}
                onChange={(v) => setNested("organization", "displayMode", v as "grid" | "scroll")}
              />
            </SettingRow>
            <SettingRow icon={<RefreshCw size={15}/>} label="Default Sort" sub="Order of fluxes inside a diary">
              <Segment
                value={settings.organization.defaultSortOrder}
                options={[
                  { value: "newest", label: "Newest" },
                  { value: "oldest", label: "Oldest" },
                  { value: "custom", label: "Custom" },
                ]}
                onChange={(v) => setNested("organization", "defaultSortOrder", v as "newest" | "oldest" | "custom")}
              />
            </SettingRow>
            <SettingRow icon={<ListIcon size={15}/>} label="Enable Grouping" sub="Group diaries into folders (e.g. Travel → Goa)" noBorder>
              <Toggle value={settings.organization.enableGrouping} onChange={(v) => setNested("organization", "enableGrouping", v)}/>
            </SettingRow>
          </Card>

          {/* ── Auto Highlight ── */}
          <Card>
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
                  Auto Highlight
                </p>
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6,
                  background: "rgba(136,96,217,0.2)", color: "#B3B8E2", letterSpacing: 0.5,
                }}>BETA</span>
              </div>
            </div>
            <SettingRow icon={<Zap size={15}/>} label="Enable Auto Highlight" sub="Let Wie suggest diary additions automatically">
              <Toggle value={settings.autoHighlight.enabled} onChange={(v) => setNested("autoHighlight", "enabled", v)}/>
            </SettingRow>
            <SettingRow
              icon={<Sparkles size={15}/>} label="AI Suggestions"
              sub="AI detects events, faces & themes"
            >
              <Toggle
                value={settings.autoHighlight.aiSuggestions && settings.autoHighlight.enabled}
                onChange={(v) => setNested("autoHighlight", "aiSuggestions", v)}
              />
            </SettingRow>
            <SettingRow icon={<Tag size={15}/>} label="Based on Tags" sub="Auto-group by hashtag topics">
              <Toggle
                value={settings.autoHighlight.basedOnTags && settings.autoHighlight.enabled}
                onChange={(v) => setNested("autoHighlight", "basedOnTags", v)}
              />
            </SettingRow>
            <SettingRow icon={<MapPin size={15}/>} label="Based on Location" sub="Auto-group by place visited" noBorder>
              <Toggle
                value={settings.autoHighlight.basedOnLocation && settings.autoHighlight.enabled}
                onChange={(v) => setNested("autoHighlight", "basedOnLocation", v)}
              />
            </SettingRow>
          </Card>

          {/* ── Lifecycle ── */}
          <Card>
            <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
                Lifecycle
              </p>
            </div>
            <SettingRow icon={<Clock size={15}/>} label="Keep Diaries Forever" sub="Never auto-expire diaries">
              <Toggle value={settings.lifecycle.keepForever} onChange={(v) => setNested("lifecycle", "keepForever", v)}/>
            </SettingRow>
            <SettingRow icon={<Archive size={15}/>} label="Archive Instead of Delete" sub="Moves diary to archive rather than deleting" noBorder>
              <Toggle value={settings.lifecycle.archiveInsteadOfDelete} onChange={(v) => setNested("lifecycle", "archiveInsteadOfDelete", v)}/>
            </SettingRow>
          </Card>

          {/* ── Analytics ── */}
          <Card>
            <SettingRow icon={<BarChart2 size={15}/>} label="Analytics" sub="Track views, taps & exit rates per diary" noBorder>
              <Toggle value={settings.analyticsEnabled} onChange={(v) => set("analyticsEnabled", v)}/>
            </SettingRow>
          </Card>

          {/* ── Save / Discard bar ── */}
          {dirty && (
            <div style={{
              display: "flex", gap: 10, marginBottom: 24,
              padding: "14px 16px", borderRadius: 16,
              background: "rgba(136,96,217,0.1)", border: "1px solid rgba(136,96,217,0.25)",
            }}>
              <button
                onClick={handleDiscard}
                style={{
                  flex: 1, height: 40, borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "rgba(255,255,255,0.6)",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Discard</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, height: 40, borderRadius: 20, border: "none",
                  background: PURPLE, color: "#fff",
                  fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {saving ? (
                  <><div style={{ ...spinStyle, width: 16, height: 16, borderWidth: 2 }}/> Saving…</>
                ) : (
                  <><Check size={14}/> Save Changes</>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════
          ACTIONS
      ══════════════════════════════════════════ */}
      <SectionLabel label="Actions"/>
      <Card>
        <button
          onClick={() => router.push("/diary/create")}
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 16px", width: "100%",
            background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 11, background: PURPLE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Plus size={18} color="#fff"/>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>Create New Diary</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Start a new curated flux collection</p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.25)"/>
        </button>
      </Card>

      {/* ══════════════════════════════════════════
          DIARY LIST
      ══════════════════════════════════════════ */}
      <SectionLabel label={`Your Diaries (${diaries.length})`}/>

      {listLoad && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
          <div style={spinStyle}/>
        </div>
      )}

      {!listLoad && diaries.length === 0 && (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          borderRadius: 16, background: "rgba(255,255,255,0.02)",
          border: "1px dashed rgba(255,255,255,0.08)", marginBottom: 16,
        }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>📓</div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No diaries yet</p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
            Create your first diary to start archiving and curating your flux stories.
          </p>
          <button
            onClick={() => router.push("/diary/create")}
            style={{
              padding: "8px 24px", borderRadius: 20, border: "none",
              background: PURPLE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >Create Diary</button>
        </div>
      )}

      {!listLoad && diaries.length > 0 && (
        <Card>
          {diaries.map((diary, i) => {
            const isLast    = i === diaries.length - 1;
            const isMenuOpen = menuOpen === diary._id;
            return (
              <div key={diary._id} style={{ position: "relative" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                }}>
                  {/* Cover */}
                  <div style={{
                    width: 50, height: 50, borderRadius: 10, flexShrink: 0,
                    overflow: "hidden", background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {diary.coverImage
                      ? <img src={diary.coverImage} alt={diary.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
                      : <span style={{ fontSize: 20 }}>📓</span>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: "#fff", fontSize: 14, fontWeight: 600,
                      margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{diary.title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <VisBadge vis={diary.visibility}/>
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
                        {diary.fluxCount ?? 0} flux{(diary.fluxCount ?? 0) !== 1 ? "es" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Menu trigger */}
                  <button
                    onClick={() => setMenuOpen(isMenuOpen ? null : diary._id)}
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    <MoreHorizontal size={15} color="rgba(255,255,255,0.6)"/>
                  </button>
                </div>

                {/* Dropdown */}
                {isMenuOpen && (
                  <>
                    <div onClick={() => setMenuOpen(null)} style={{ position: "fixed", inset: 0, zIndex: 80 }}/>
                    <div style={{
                      position: "absolute", right: 12, top: 56, zIndex: 90,
                      background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, overflow: "hidden",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: 190,
                    }}>
                      {[
                        { icon: <BookOpen size={14}/>, label: "View Diary",    action: () => { router.push(`/diary/${diary._id}`); setMenuOpen(null); } },
                        { icon: <Edit3     size={14}/>, label: "Edit Diary",    action: () => { router.push(`/diary/${diary._id}/edit`); setMenuOpen(null); } },
                        { icon: <Globe     size={14}/>, label: `Visibility: ${VIS_OPTIONS.find(x=>x.value===diary.visibility)?.label}`, action: () => { handleCycleVisibility(diary); setMenuOpen(null); } },
                        { icon: <Trash2    size={14}/>, label: "Delete Diary",  danger: true, action: () => { setDeleting(diary._id); setMenuOpen(null); } },
                      ].map((item, mi, arr) => (
                        <button
                          key={mi}
                          onClick={item.action}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            width: "100%", padding: "11px 16px", background: "transparent",
                            border: "none",
                            borderBottom: mi < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
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

      {/* ══════════════════════════════════════════
          ARCHIVE SHORTCUT
      ══════════════════════════════════════════ */}
      <SectionLabel label="Archive"/>
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
            width: 38, height: 38, borderRadius: 11,
            background: "rgba(136,96,217,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BookOpen size={17} color="#9575CD"/>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>Archived Fluxes</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>Browse your expired & archived stories</p>
          </div>
          <ChevronRight size={16} color="rgba(255,255,255,0.25)"/>
        </button>
      </Card>
    </div>
  );
}