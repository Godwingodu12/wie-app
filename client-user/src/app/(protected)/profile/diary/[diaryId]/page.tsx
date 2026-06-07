"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Heart, Send, MoreHorizontal, Plus, Trash2, Edit3, Pin } from "lucide-react";
import {
  getDiaryById, deleteDiary, editDiary,
  removeFluxFromDiary, getAllMyFluxes, addFluxToDiary,
  reorderDiaryFluxes, togglePinDiary,  toggleFluxLike, getFluxLikes, getFluxViewers, getFluxComments,
} from "@/services/mediaService";
import type { Diary, Flux } from "@/services/mediaService";
import { useAuth } from "@/hooks/useAuth";

const STORY_MS = 15_000;
const GRADIENT = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}
function FluxMedia({ flux, videoRef, paused }: { flux: any; videoRef: React.RefObject<HTMLVideoElement>; paused: boolean }) {
  const isText = !flux.mediaUrl || flux.mediaUrl.trim() === "" || flux.mediaType === "text";
  if (isText) {
    const bg = flux.textBg ?? "linear-gradient(135deg,#1a1a2e,#2d1b4e)";
    return <div style={{ position: "absolute", inset: 0, background: bg }} />;
  }
  if (flux.mediaType === "video") {
    return (
      <video
        key={flux.fluxId}
        ref={videoRef}
        src={flux.mediaUrl}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        muted
        playsInline
        onLoadedData={() => { if (!paused) videoRef.current?.play().catch(() => {}); }}
      />
    );
  }
  return (
    <img
      key={flux.fluxId}
      src={flux.mediaUrl}
      alt="story"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}
// Only text, stickers, location — NO music badge here (shown in header)
function FluxOverlays({ flux }: { flux: any }) {
  const LOCATION_THEMES = [
    { bg: "rgba(0,0,0,0.62)", color: "#fff",    border: "rgba(255,255,255,0.18)", blur: true  },
    { bg: "#fff",             color: "#1a1a2e", border: "transparent",            blur: false },
    { bg: "linear-gradient(135deg,#8860D9,#B3B8E2)", color: "#fff", border: "transparent", blur: false },
    { bg: "transparent",      color: "#fff",    border: "rgba(255,255,255,0.85)", blur: false },
    { bg: "linear-gradient(135deg,#f953c6,#b91d73)", color: "#fff", border: "transparent", blur: false },
    { bg: "transparent",      color: "rgba(255,255,255,0.85)", border: "transparent", blur: false },
  ];

  const getEffect = (layer: any): React.CSSProperties => {
    switch (layer.effect) {
      case "neon":      return { textShadow: `0 0 6px ${layer.color}, 0 0 14px ${layer.color}` };
      case "gradient":  return { background: "linear-gradient(45deg,#ff6b6b,#f7d794,#a8edea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
      case "shadow":    return { textShadow: "2px 2px 8px rgba(0,0,0,0.9)" };
      case "highlight": return { background: "rgba(0,0,0,0.7)", padding: "3px 8px", borderRadius: 4 };
      default:          return {};
    }
  };

  return (
    <>
      {/* Text layers — positioned exactly as authored */}
      {Array.isArray(flux.textLayers) && flux.textLayers.length > 0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }}>
          {flux.textLayers.map((layer: any) => (
            <div
              key={layer.id}
              style={{
                position:   "absolute",
                left:       `${layer.x}%`,
                top:        `${layer.y}%`,
                transform:  `translate(-50%, -50%) scale(${layer.scale ?? 1}) rotate(${layer.rotate ?? 0}deg)`,
                color:      layer.color     ?? "#fff",
                fontFamily: layer.font      ?? "Inter",
                fontSize:   layer.fontSize  ?? 32,
                textAlign:  (layer.align    ?? "center") as any,
                whiteSpace: "pre-wrap",
                wordBreak:  "break-word",
                maxWidth:   "80%",
                lineHeight: 1.3,
                fontWeight: 600,
                ...getEffect(layer),
              }}
            >
              {layer.text}
            </div>
          ))}
        </div>
      )}

      {/* Stickers */}
      {Array.isArray(flux.stickers) && flux.stickers.length > 0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9 }}>
          {flux.stickers.map((s: any) => (
            <div
              key={s.id}
              style={{
                position:  "absolute",
                left:      `${s.x}%`,
                top:       `${s.y}%`,
                transform: `translate(-50%,-50%) scale(${s.scale ?? 1}) rotate(${s.rotate ?? 0}deg)`,
                zIndex:    9,
              }}
            >
              <img src={s.url} alt="sticker" style={{ width: 56, height: 56, objectFit: "contain", display: "block" }} draggable={false} />
            </div>
          ))}
        </div>
      )}

      {/* Location sticker */}
      {flux.locationLabel && (
        <div
          style={{
            position:      "absolute",
            left:          `${flux.locationStickerX ?? 50}%`,
            top:           `${flux.locationStickerY ?? 75}%`,
            transform:     "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex:        10,
          }}
        >
          {(() => {
            const t = LOCATION_THEMES[(flux.locationStickerTheme ?? 0) % LOCATION_THEMES.length];
            return (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px 5px 7px", borderRadius: 20,
                background: t.bg, border: `1px solid ${t.border}`,
                backdropFilter: t.blur ? "blur(8px)" : undefined,
                boxShadow: "0 2px 12px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: 12 }}>📍</span>
                <span style={{ color: t.color, fontSize: 12, fontWeight: 600 }}>{flux.locationLabel}</span>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
export default function DiaryViewPage() {
  const { diaryId } = useParams<{ diaryId: string }>();
  const router      = useRouter();
  const { user }    = useAuth(true);

  const [diary,    setDiary]    = useState<Diary | null>(null);
  const [idx,      setIdx]      = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [reply,    setReply]    = useState("");
  // Panels
  const [showMore,          setShowMore]          = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditTitle,     setShowEditTitle]     = useState(false);
  const [showAddFlux,       setShowAddFlux]       = useState(false);
  const [editTitle,         setEditTitle]         = useState("");
  const [deleting,          setDeleting]          = useState(false);
  const [saving,            setSaving]            = useState(false);
  const [toast,             setToast]             = useState<string | null>(null);

  // Add-flux picker
  const [allFluxes,    setAllFluxes]    = useState<Flux[]>([]);
  const [fluxLoading,  setFluxLoading]  = useState(false);
  const [addingFluxId, setAddingFluxId] = useState<string | null>(null);

  const rafRef      = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  const stories = diary?.fluxes ?? [];
  const current = stories[idx]  ?? null;
  const [liked,setLiked]        = useState<Record<number, boolean>>({});
  const [likeCounts,setLikeCounts]   = useState<Record<number, number>>({});
  const [likeAnim,setLikeAnim]     = useState(false);
  const [showViewers,setShowViewers]  = useState(false);
  const [viewerTab,setViewerTab]    = useState<"views" | "likes" | "comments">("views");
  const [viewerCount,setViewerCount]  = useState(0);
  const [viewerCounts,setViewerCounts] = useState({ views: 0, likes: 0, comments: 0 });
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  // Load diary
  useEffect(() => {
    if (!diaryId) return;
    (async () => {
      try {
        const d = await getDiaryById(diaryId);
        setDiary(d);
        setEditTitle(d.title);
      } catch { router.back(); }
      finally { setLoading(false); }
    })();
  }, [diaryId]);
  // Progress timer
  const goNext = useCallback(() => {
    setProgress(0); pausedAtRef.current = 0;
    setIdx((prev) => {
      if (prev < stories.length - 1) return prev + 1;
      audioRef.current?.pause();
      router.push("/profile");
      return prev;
    });
  }, [stories.length, router]);

  const goPrev = useCallback(() => {
    setProgress(0); pausedAtRef.current = 0;
    setIdx((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const startProgress = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const dur = current?.mediaType === "video"
      ? (videoRef.current?.duration ? videoRef.current.duration * 1000 : STORY_MS)
      : STORY_MS;
    const alreadyMs = (pausedAtRef.current / 100) * dur;
    const base = performance.now() - alreadyMs;
    const tick = (now: number) => {
      const pct = Math.min(((now - base) / dur) * 100, 100);
      setProgress(pct);
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick); }
      else { pausedAtRef.current = 0; goNext(); }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [current, goNext]);

  useEffect(() => {
    const anyPanel = showMore || showDeleteConfirm || showEditTitle || showAddFlux;
    if (paused || loading || stories.length === 0 || anyPanel) {
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.pause();
      audioRef.current?.pause();
    } else {
      startProgress();
      videoRef.current?.play().catch(() => {});
      audioRef.current?.play().catch(() => {});
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, paused, loading, stories.length, startProgress, showMore, showDeleteConfirm, showEditTitle, showAddFlux]);

  // Music
  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    const url = stories[idx]?.musicPreviewUrl ?? null;
    if (!url) return;
    const a = new Audio(url); a.loop = true; a.volume = 0.5;
    audioRef.current = a;
    if (!paused && !loading) a.play().catch(() => {});
    return () => { a.pause(); a.src = ""; };
  }, [idx, stories]);

  useEffect(() => {
    const fluxId = stories[idx]?.fluxId;
    if (!fluxId) return;

    // Likes
    getFluxLikes(fluxId).then((res) => {
      setLikeCounts((p) => ({ ...p, [idx]: res.total ?? 0 }));
      setLiked((p) => ({ ...p, [idx]: res.hasLiked ?? false }));
    }).catch(() => {});

    // Views + comments for owner stats panel
    getFluxViewers(fluxId).then((res) => {
      setViewerCount(res.total ?? res.viewCount ?? 0);
      setViewerCounts((p) => ({ ...p, views: res.total ?? 0 }));
    }).catch(() => {});

    getFluxComments(fluxId).then((res) => {
      setViewerCounts((p) => ({ ...p, comments: res.total ?? 0 }));
    }).catch(() => {});
  }, [idx, stories]);
  const handlePointerDown = () => { pausedAtRef.current = progress; setPaused(true); };
  const handlePointerUp   = () => setPaused(false);
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX - rect.left < rect.width / 2) goPrev(); else goNext();
  };
  const handleLike = async () => {
    const fluxId = current?.fluxId;
    if (!fluxId) return;
    const newLiked = !liked[idx];
    setLiked((p) => ({ ...p, [idx]: newLiked }));
    setLikeCounts((p) => ({ ...p, [idx]: Math.max(0, (p[idx] ?? 0) + (newLiked ? 1 : -1)) }));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try {
      await toggleFluxLike(fluxId);
      setViewerCounts((p) => ({ ...p, likes: Math.max(0, p.likes + (newLiked ? 1 : -1)) }));
    } catch {
      setLiked((p) => ({ ...p, [idx]: !newLiked }));
      setLikeCounts((p) => ({ ...p, [idx]: Math.max(0, (p[idx] ?? 0) + (newLiked ? -1 : 1)) }));
    }
  };
  // Edit title
  const handleEditTitle = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      const updated = await editDiary(diaryId, { title: editTitle.trim() });
      setDiary(updated);
      setShowEditTitle(false);
      showToast("Title updated");
    } catch { showToast("Failed to update"); }
    setSaving(false);
  };

  // Toggle pin
  const handlePin = async () => {
    try {
      const res = await togglePinDiary(diaryId);
      setDiary((prev) => prev ? { ...prev, isPinned: res.isPinned } : prev);
      showToast(res.isPinned ? "Diary pinned" : "Diary unpinned");
    } catch { showToast("Failed"); }
  };

  // Delete current flux from diary
  const handleRemoveCurrentFlux = async () => {
    if (!current) return;
    try {
      const updated = await removeFluxFromDiary(diaryId, current.fluxId);
      setDiary(updated);
      if (idx >= updated.fluxes.length) setIdx(Math.max(0, updated.fluxes.length - 1));
      showToast("Removed from diary");
    } catch { showToast("Failed to remove"); }
  };

  // Load fluxes for picker
  const openAddFlux = async () => {
    setShowAddFlux(true);
    if (allFluxes.length > 0) return;
    setFluxLoading(true);
    try {
      const fluxes = await getAllMyFluxes();
      const existing = new Set(diary?.fluxes.map((f) => f.fluxId) ?? []);
      setAllFluxes(fluxes.filter((f) => !existing.has(f._id)));
    } catch {}
    setFluxLoading(false);
  };

  const handleAddFlux = async (fluxId: string) => {
    setAddingFluxId(fluxId);
    try {
      const updated = await addFluxToDiary(diaryId, fluxId);
      setDiary(updated);
      setAllFluxes((prev) => prev.filter((f) => f._id !== fluxId));
      showToast("Added to diary!");
    } catch (e: any) {
      showToast(e?.message ?? "Failed to add");
    }
    setAddingFluxId(null);
  };

  if (loading) return (
    <div style={{ height: "100vh", background: "#0A0A0C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #8860D9", borderTopColor: "transparent", animation: "spin 0.75s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!diary || stories.length === 0) return (
    <div style={{ height: "100vh", background: "#0A0A0C", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <span style={{ fontSize: 48 }}>📔</span>
      <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>No fluxes in this diary</p>
      <button onClick={() => router.back()} style={{ background: GRADIENT, border: "none", borderRadius: 24, padding: "10px 24px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Go Back</button>
    </div>
  );
const isCF     = (diary as any).isCloseFriends;
  const isPinned = (diary as any).isPinned;

  return (
    <div style={{ height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, padding: "10px 22px", borderRadius: 24, background: "rgba(30,30,35,0.96)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* ── Main card ── */}
      <div style={{ width: "min(100vw,420px)", height: "100vh", position: "relative", background: "#0A0A0C", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── 1. Progress bars ── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 10px 0", display: "flex", gap: 3, zIndex: 30 }}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#fff", borderRadius: 2, width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%" }} />
            </div>
          ))}
        </div>

        {/* ── 2. Header (outside flux content) ── */}
        <div style={{ position: "absolute", top: 20, left: 0, right: 0, padding: "0 14px", display: "flex", alignItems: "center", gap: 10, zIndex: 30 }}>
          {/* Avatar */}
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: isCF ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.3)", background: GRADIENT }}>
            {user?.profile_picture && <img src={user.profile_picture} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>

          {/* Username · diary title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap", overflow: "hidden" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{user?.username ?? "me"}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flexShrink: 0 }}>·</span>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{diary.title}</span>
              {isCF && <span style={{ fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, padding: "1px 6px", fontWeight: 700, flexShrink: 0 }}>⭐ CF</span>}
            </div>
            {/* Time ago + music title in header */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, flexShrink: 0 }}>
                {current?.addedAt ? timeAgo(current.addedAt) : ""}
              </span>
              {current?.musicTitle && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>·</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                    {current.musicAlbumArt
                      ? <img src={current.musicAlbumArt} alt="album" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ fontSize: 11 }}>🎵</span>
                    }
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {current.musicTitle}{current.musicArtist ? ` – ${current.musicArtist}` : ""}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {paused && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.6)", flexShrink: 0 }} />}

          {/* Header buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button onClick={openAddFlux} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <Plus size={13} />
            </button>
            <button onClick={() => { setShowMore(true); setPaused(true); }} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <MoreHorizontal size={13} />
            </button>
            <button onClick={() => { audioRef.current?.pause(); router.push("/profile"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex", padding: 4 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 3. Flux content canvas (tap to navigate) ── */}
        <div
          style={{ position: "absolute", top: 70, left: 0, right: 0, bottom: 100, overflow: "hidden" }}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onClick={handleTap}
        >
          {/* Media background */}
          <FluxMedia flux={current} videoRef={videoRef} paused={paused} />

          {/* Overlays at exact authored positions */}
          {current && <FluxOverlays flux={current} />}
        </div>

        {/* ── 4. Bottom bar (outside flux content, below it) ── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "#0A0A0C", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 16px", gap: 10, zIndex: 20 }}>

          {/* Pause/play + like + share row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Left: pause button */}
            <button
              onClick={() => setPaused((p) => !p)}
              style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {paused ? (
                <svg width="12" height="14" viewBox="0 0 10 12" fill="white"><path d="M1 1l8 5-8 5V1z"/></svg>
              ) : (
                <svg width="12" height="14" viewBox="0 0 10 12" fill="white"><rect x="1" y="1" width="2.5" height="10" rx="1"/><rect x="6.5" y="1" width="2.5" height="10" rx="1"/></svg>
              )}
            </button>

            {/* Center: viewers panel trigger (owner only) */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Like count + button */}
              <button
                onClick={() => setLiked((p) => ({ ...p, [idx]: !p[idx] }))}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              >
                <Heart
                  size={22}
                  color={liked[idx] ? "#E91E8C" : "rgba(255,255,255,0.8)"}
                  fill={liked[idx] ? "#E91E8C" : "none"}
                  strokeWidth={liked[idx] ? 0 : 2}
                  style={{ transition: "all 0.2s" }}
                />
                {(likeCounts[idx] ?? 0) > 0 && (
                  <span style={{ color: liked[idx] ? "#E91E8C" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600 }}>
                    {likeCounts[idx]}
                  </span>
                )}
              </button>

              {/* Share */}
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/profile/diary/${diaryId}`); showToast("Link copied!"); }}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
              >
                <Send size={22} color="rgba(255,255,255,0.8)" />
              </button>
            </div>

            {/* Right: eye icon (views) */}
            <button
              onClick={() => { setShowViewers(true); setPaused(true); }}
              style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {(viewerCount ?? 0) > 0 && (
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600 }}>
                  {viewerCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Viewers / stats panel ── */}
        {showViewers && current && (
          <>
            <div onClick={() => { setShowViewers(false); setPaused(false); }} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.55)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a1a1f", borderRadius: "20px 20px 0 0", maxHeight: "60vh", display: "flex", flexDirection: "column", zIndex: 50, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "10px auto 14px" }} />
              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                {(["views", "likes", "comments"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewerTab(tab)}
                    style={{ flex: 1, padding: "10px 0", background: "none", border: "none", cursor: "pointer", color: viewerTab === tab ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: viewerTab === tab ? 700 : 400, borderBottom: viewerTab === tab ? "2px solid #8860D9" : "2px solid transparent", transition: "all 0.15s" }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {viewerTab === tab && viewerCounts[tab] > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>({viewerCounts[tab]})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 24px" }}>
                {viewerTab === "views" && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingTop: 24 }}>
                    {viewerCounts.views} {viewerCounts.views === 1 ? "view" : "views"}
                  </p>
                )}
                {viewerTab === "likes" && (
                  viewerCounts.likes === 0
                    ? <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingTop: 24 }}>No likes yet</p>
                    : <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingTop: 24 }}>{viewerCounts.likes} {viewerCounts.likes === 1 ? "like" : "likes"}</p>
                )}
                {viewerTab === "comments" && (
                  viewerCounts.comments === 0
                    ? <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingTop: 24 }}>No comments yet</p>
                    : <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", paddingTop: 24 }}>{viewerCounts.comments} {viewerCounts.comments === 1 ? "comment" : "comments"}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Sheets & modals (unchanged) ── */}
        {showMore && (
          <>
            <div onClick={() => { setShowMore(false); setPaused(false); }} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a1a1f", borderRadius: "20px 20px 0 0", padding: "8px 0 40px", zIndex: 50, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "8px auto 20px" }} />
              {[
                { label: "Edit title",          icon: <Edit3 size={18} />,  action: () => { setShowEditTitle(true); setShowMore(false); } },
                { label: isPinned ? "Unpin diary" : "Pin diary", icon: <Pin size={18} />, action: () => { handlePin(); setShowMore(false); setPaused(false); } },
                { label: "Add more flux",        icon: <Plus size={18} />,   action: () => { openAddFlux(); setShowMore(false); } },
                { label: "Remove this flux",     icon: <Trash2 size={18} />, action: () => { handleRemoveCurrentFlux(); setShowMore(false); setPaused(false); }, danger: true },
                { label: "Delete diary",         icon: <Trash2 size={18} />, action: () => { setShowDeleteConfirm(true); setShowMore(false); }, danger: true },
                { label: "Copy link",            icon: <span style={{ fontSize: 16 }}>🔗</span>, action: () => { navigator.clipboard.writeText(`${window.location.origin}/profile/diary/${diaryId}`); showToast("Copied!"); setShowMore(false); setPaused(false); } },
              ].map(({ label, icon, action, danger }) => (
                <button key={label} onClick={action} style={{ width: "100%", background: "none", border: "none", padding: "13px 24px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                  <span style={{ color: (danger as any) ? "#E53E3E" : "rgba(255,255,255,0.5)" }}>{icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: (danger as any) ? "#E53E3E" : "#fff" }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {showEditTitle && (
          <>
            <div onClick={() => setShowEditTitle(false)} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a1a1f", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", zIndex: 60, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 20px" }} />
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Edit diary title</p>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value.slice(0, 20))} maxLength={20} autoFocus style={{ width: "100%", height: 48, borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", color: "#fff", fontSize: 15, padding: "0 16px", outline: "none", boxSizing: "border-box" }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "right", marginTop: 6 }}>{editTitle.length}/20</p>
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => setShowEditTitle(false)} style={{ flex: 1, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleEditTitle} disabled={saving || !editTitle.trim()} style={{ flex: 1, height: 44, borderRadius: 22, background: GRADIENT, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </>
        )}

        {showAddFlux && (
          <>
            <div onClick={() => setShowAddFlux(false)} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.6)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#1a1a1f", borderRadius: "20px 20px 0 0", maxHeight: "65vh", display: "flex", flexDirection: "column", zIndex: 60, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "12px 20px 8px", flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 16px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Add flux</p>
                  <button onClick={() => setShowAddFlux(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}><X size={18} /></button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 32px" }}>
                {fluxLoading ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #8860D9", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : allFluxes.length === 0 ? (
                  <p style={{ color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "32px 0", fontSize: 14 }}>No more fluxes to add</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                    {allFluxes.map((flux) => {
                      const adding = addingFluxId === flux._id;
                      return (
                        <div key={flux._id} onClick={() => !adding && handleAddFlux(flux._id)} style={{ position: "relative", aspectRatio: "9/16", borderRadius: 8, overflow: "hidden", cursor: adding ? "wait" : "pointer", opacity: adding ? 0.6 : 1 }}>
                          {flux.mediaType === "video"
                            ? <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 24 }}>🎬</span></div>
                            : <img src={flux.mediaUrl} alt="flux" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          }
                          {adding && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #fff", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} /></div>}
                          {(flux as any).visibility === "close_friends" && <div style={{ position: "absolute", top: 4, left: 4, width: 16, height: 16, borderRadius: "50%", background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>⭐</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {showDeleteConfirm && (
          <>
            <div onClick={() => { setShowDeleteConfirm(false); setPaused(false); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.7)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#1a1a1f", borderRadius: 20, padding: "28px 24px", zIndex: 70, width: 280, border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Delete Diary?</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.5, marginBottom: 24 }}>"{diary?.title}" will be permanently deleted.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setShowDeleteConfirm(false); setPaused(false); }} style={{ flex: 1, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={async () => { setDeleting(true); try { await deleteDiary(diaryId); router.push("/profile"); } catch { setDeleting(false); setShowDeleteConfirm(false); } }} disabled={deleting} style={{ flex: 1, height: 44, borderRadius: 22, background: "#E53E3E", border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: deleting ? "wait" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </>
        )}

        {idx === stories.length - 1 && progress >= 99 && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 40 }}>
            <div style={{ fontSize: 52 }}>📔</div>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>End of {diary.title}</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{stories.length} {stories.length === 1 ? "flux" : "fluxes"}</p>
            <button onClick={() => { audioRef.current?.pause(); router.push("/profile"); }} style={{ background: GRADIENT, border: "none", borderRadius: 24, padding: "12px 32px", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>Back to Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}
