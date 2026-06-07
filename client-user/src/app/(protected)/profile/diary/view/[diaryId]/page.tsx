"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Heart, Send, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import {
  getDiaryById, toggleFluxLike, getFluxLikes,
} from "@/services/mediaService";
import type { Diary } from "@/services/mediaService";
import { useAuth } from "@/hooks/useAuth";
import { getUserById } from "@/services/wieUserService";

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

// ── Render all flux overlays exactly as posted ─────────────────────────────
function FluxOverlays({ flux }: { flux: any }) {
  const LOCATION_THEMES = [
    { bg: "rgba(0,0,0,0.62)", color: "#fff", border: "rgba(255,255,255,0.18)", blur: true },
    { bg: "#fff", color: "#1a1a2e", border: "transparent", blur: false },
    { bg: "linear-gradient(135deg,#8860D9,#B3B8E2)", color: "#fff", border: "transparent", blur: false },
    { bg: "transparent", color: "#fff", border: "rgba(255,255,255,0.85)", blur: false },
    { bg: "linear-gradient(135deg,#f953c6,#b91d73)", color: "#fff", border: "transparent", blur: false },
    { bg: "transparent", color: "rgba(255,255,255,0.85)", border: "transparent", blur: false },
  ];

  return (
    <>
      {/* Text layers — positioned exactly as authored */}
      {Array.isArray(flux.textLayers) && flux.textLayers.length > 0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }}>
          {flux.textLayers.map((layer: any) => {
            const getEffect = (): React.CSSProperties => {
              switch (layer.effect) {
                case "neon":      return { textShadow: `0 0 6px ${layer.color}, 0 0 14px ${layer.color}` };
                case "gradient":  return { background: "linear-gradient(45deg,#ff6b6b,#f7d794,#a8edea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };
                case "shadow":    return { textShadow: "2px 2px 8px rgba(0,0,0,0.9)" };
                case "highlight": return { background: "rgba(0,0,0,0.7)", padding: "3px 8px", borderRadius: 4 };
                default:          return {};
              }
            };
            return (
              <div
                key={layer.id}
                style={{
                  position:   "absolute",
                  left:       `${layer.x}%`,
                  top:        `${layer.y}%`,
                  transform:  `translate(-50%, -50%) scale(${layer.scale ?? 1}) rotate(${layer.rotate ?? 0}deg)`,
                  color:      layer.color ?? "#fff",
                  fontFamily: layer.font  ?? "Inter",
                  fontSize:   layer.fontSize ?? 32,
                  textAlign:  (layer.align ?? "center") as any,
                  whiteSpace: "pre-wrap",
                  wordBreak:  "break-word",
                  maxWidth:   "80%",
                  lineHeight: 1.3,
                  fontWeight: 600,
                  ...getEffect(),
                }}
              >
                {layer.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Stickers */}
      {Array.isArray(flux.stickers) && flux.stickers.length > 0 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9 }}>
          {flux.stickers.map((s: any) => (
            <div key={s.id} style={{
              position:  "absolute",
              left:      `${s.x}%`,
              top:       `${s.y}%`,
              transform: `translate(-50%,-50%) scale(${s.scale ?? 1}) rotate(${s.rotate ?? 0}deg)`,
              zIndex:    9,
            }}>
              <img src={s.url} alt="sticker" style={{ width: 56, height: 56, objectFit: "contain", display: "block" }} draggable={false} />
            </div>
          ))}
        </div>
      )}

      {/* Location sticker */}
      {flux.locationLabel && (
        <div style={{
          position:  "absolute",
          left:      `${flux.locationStickerX ?? 50}%`,
          top:       `${flux.locationStickerY ?? 75}%`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          zIndex:    10,
        }}>
          {(() => {
            const themes = LOCATION_THEMES;
            const t = themes[(flux.locationStickerTheme ?? 0) % themes.length];
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

      {/* Music badge */}
      {flux.musicTitle && (
        <div style={{
          position: "absolute", top: 16, left: 16, zIndex: 6,
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px 6px 6px", borderRadius: 22,
          background: "rgba(0,0,0,0.58)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.12)", maxWidth: 200,
        }}>
          {flux.musicAlbumArt ? (
            <img src={flux.musicAlbumArt} alt="album" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, background: "linear-gradient(135deg,#8860D9,#B3B8E2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎵</div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{flux.musicTitle}</p>
            {flux.musicArtist && <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{flux.musicArtist}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export default function OtherDiaryViewPage() {
  const { diaryId } = useParams<{ diaryId: string }>();
  const router      = useRouter();
  const { user }    = useAuth(true);

  const [diary,        setDiary]        = useState<Diary | null>(null);
  const [idx,          setIdx]          = useState(0);
  const [progress,     setProgress]     = useState(0);
  const [paused,       setPaused]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<{ username: string; profile_picture: string | null } | null>(null);
  const [liked,        setLiked]        = useState<Record<number, boolean>>({});
  const [likeCounts,   setLikeCounts]   = useState<Record<number, number>>({});
  const [likeAnim,     setLikeAnim]     = useState(false);
  const [showMore,     setShowMore]     = useState(false);
  const [toast,        setToast]        = useState<string | null>(null);

  const rafRef      = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);

  const stories = diary?.fluxes ?? [];
  const current = stories[idx]  ?? null;

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // Load diary + owner profile
  useEffect(() => {
    if (!diaryId) return;
    (async () => {
      try {
        const d = await getDiaryById(diaryId);
        setDiary(d);

        // Fetch owner profile
        const ownerId = (d as any).userId;
        if (ownerId) {
          getUserById(ownerId).then((u) => {
            if (u) setOwnerProfile({ username: u.username ?? "user", profile_picture: u.profile_picture ?? null });
          }).catch(() => {});
        }

        // Pre-fetch likes for first flux
        if (d.fluxes?.[0]?.fluxId) {
          getFluxLikes(d.fluxes[0].fluxId).then((res) => {
            setLikeCounts((p) => ({ ...p, 0: res.total ?? 0 }));
            setLiked((p) => ({ ...p, 0: res.hasLiked ?? false }));
          }).catch(() => {});
        }
      } catch { router.back(); }
      finally { setLoading(false); }
    })();
  }, [diaryId]);

  // Fetch likes when story changes
  useEffect(() => {
    const fluxId = stories[idx]?.fluxId;
    if (!fluxId || likeCounts[idx] !== undefined) return;
    getFluxLikes(fluxId).then((res) => {
      setLikeCounts((p) => ({ ...p, [idx]: res.total ?? 0 }));
      setLiked((p) => ({ ...p, [idx]: res.hasLiked ?? false }));
    }).catch(() => {});
  }, [idx, stories]);

  // Music
  useEffect(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    const url = current?.musicPreviewUrl ?? null;
    if (!url) return;
    const a = new Audio(url); a.loop = true; a.volume = 0.45;
    audioRef.current = a;
    if (!paused && !loading && !showMore) a.play().catch(() => {});
    return () => { a.pause(); a.src = ""; };
  }, [idx, stories]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (paused || showMore) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }, [paused, showMore]);

  const goNext = useCallback(() => {
    setProgress(0); pausedAtRef.current = 0;
    if (idx >= stories.length - 1) {
      audioRef.current?.pause();
      // Go back to owner's profile
      const ownerId = (diary as any)?.userId;
      router.push(ownerId ? `/profile/${ownerId}` : "/home");
      return;
    }
    setIdx((p) => p + 1);
  }, [idx, stories.length, diary, router]);

  const goPrev = useCallback(() => {
    setProgress(0); pausedAtRef.current = 0;
    setIdx((p) => (p > 0 ? p - 1 : 0));
  }, []);

  const startProgress = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const dur = current?.mediaType === "video"
      ? (videoRef.current?.duration ? videoRef.current.duration * 1000 : STORY_MS)
      : STORY_MS;
    const base = performance.now() - (pausedAtRef.current / 100) * dur;
    const tick = (now: number) => {
      const pct = Math.min(((now - base) / dur) * 100, 100);
      setProgress(pct);
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick); }
      else { pausedAtRef.current = 0; goNext(); }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [current, goNext]);

  useEffect(() => {
    if (paused || loading || stories.length === 0 || showMore) {
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.pause();
    } else {
      startProgress();
      videoRef.current?.play().catch(() => {});
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, paused, loading, stories.length, startProgress, showMore]);

  const handleLike = async () => {
    const fluxId = current?.fluxId;
    if (!fluxId) return;
    const newLiked = !liked[idx];
    setLiked((p) => ({ ...p, [idx]: newLiked }));
    setLikeCounts((p) => ({ ...p, [idx]: (p[idx] ?? 0) + (newLiked ? 1 : -1) }));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try {
      await toggleFluxLike(fluxId);
    } catch {
      setLiked((p) => ({ ...p, [idx]: !newLiked }));
      setLikeCounts((p) => ({ ...p, [idx]: (p[idx] ?? 0) + (newLiked ? -1 : 1) }));
    }
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
      <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>No stories in this diary</p>
      <button onClick={() => router.back()} style={{ background: GRADIENT, border: "none", borderRadius: 24, padding: "10px 24px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Go Back</button>
    </div>
  );

  const isCF = (diary as any).isCloseFriends;

  return (
    <div style={{ height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, padding: "10px 22px", borderRadius: 24, background: "rgba(30,30,35,0.96)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Left nav arrow */}
      <button
        onClick={goPrev}
        disabled={idx === 0}
        style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.25 : 1, flexShrink: 0, marginRight: 12 }}
      >
        <ChevronLeft size={20} color="#fff" />
      </button>

      <div style={{ width: "min(100vw,400px)", height: "100vh", position: "relative", background: "#0A0A0C", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Progress bars */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "10px 10px 0", display: "flex", gap: 3, zIndex: 30 }}>
          {stories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "#fff", borderRadius: 2, width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%", transition: i === idx ? "none" : undefined }} />
            </div>
          ))}
        </div>

        {/* ── 2. Header ── */}
        <div style={{ position: "absolute", top: 20, left: 0, right: 0, padding: "0 14px", display: "flex", alignItems: "center", gap: 10, zIndex: 30 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: isCF ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.3)", background: GRADIENT }}>
            {ownerProfile?.profile_picture && <img src={ownerProfile.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{ownerProfile?.username ?? "user"}</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flexShrink: 0 }}>·</span>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{diary.title}</span>
              {isCF && <span style={{ fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, padding: "1px 6px", fontWeight: 700, flexShrink: 0 }}>⭐ CF</span>}
            </div>
            {/* Time + music in header subtitle */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, flexShrink: 0 }}>
                {current?.addedAt ? timeAgo(current.addedAt) : ""}
              </span>
              {(current as any)?.musicTitle && (
                <>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>·</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                    {(current as any).musicAlbumArt
                      ? <img src={(current as any).musicAlbumArt} alt="album" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ fontSize: 11 }}>🎵</span>
                    }
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {(current as any).musicTitle}{(current as any).musicArtist ? ` – ${(current as any).musicArtist}` : ""}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          {paused && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.6)", flexShrink: 0 }} />}
          <button onClick={() => { audioRef.current?.pause(); router.back(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex", padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        {/* ── 3. Flux content canvas ── */}
        <div
          style={{ position: "absolute", top: 70, left: 0, right: 0, bottom: 90, overflow: "hidden" }}
          onMouseDown={() => { pausedAtRef.current = progress; setPaused(true); }}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => { pausedAtRef.current = progress; setPaused(true); }}
          onTouchEnd={() => setPaused(false)}
        >
          {/* Media */}
          {(() => {
            const isText = !current?.mediaUrl || current.mediaUrl.trim() === "" || (current as any).mediaType === "text";
            if (isText) {
              const bg = (current as any).textBg ?? "linear-gradient(135deg,#1a1a2e,#2d1b4e)";
              return <div style={{ position: "absolute", inset: 0, background: bg }} />;
            }
            if (current?.mediaType === "video") {
              return (
                <video
                  key={current.fluxId}
                  ref={videoRef}
                  src={current.mediaUrl}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  muted playsInline
                  onLoadedData={() => { if (!paused) videoRef.current?.play().catch(() => {}); }}
                />
              );
            }
            return <img key={current?.fluxId} src={current?.mediaUrl} alt="story" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
          })()}

          {/* Overlays at exact authored positions */}
          {current && <FluxOverlays flux={current} />}
        </div>

        {/* ── 4. Bottom bar (outside flux, below canvas) ── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 90, background: "#0A0A0C", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 20 }}>
          {/* Pause/play */}
          <button
            onClick={() => setPaused((p) => !p)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            {paused
              ? <svg width="12" height="14" viewBox="0 0 10 12" fill="white"><path d="M1 1l8 5-8 5V1z"/></svg>
              : <svg width="12" height="14" viewBox="0 0 10 12" fill="white"><rect x="1" y="1" width="2.5" height="10" rx="1"/><rect x="6.5" y="1" width="2.5" height="10" rx="1"/></svg>
            }
          </button>

          {/* Like + count */}
          <button
            onClick={handleLike}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transform: likeAnim ? "scale(1.3)" : "scale(1)", transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={liked[idx] ? "#e53e3e" : "none"} stroke={liked[idx] ? "#e53e3e" : "rgba(255,255,255,0.8)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span style={{ color: liked[idx] ? "#e53e3e" : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }}>
              {(likeCounts[idx] ?? 0) > 0 ? likeCounts[idx] : "Like"}
            </span>
          </button>

          {/* Share */}
          <button
            onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/profile/diary/view/${diaryId}`); showToast("Link copied!"); }}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
          >
            <Send size={24} color="rgba(255,255,255,0.8)" />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Share</span>
          </button>
        </div>
      </div>

      {/* Right nav arrow */}
      <button
        onClick={goNext}
        style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginLeft: 12 }}
      >
        <ChevronRight size={20} color="#fff" />
      </button>
    </div>
  );
}