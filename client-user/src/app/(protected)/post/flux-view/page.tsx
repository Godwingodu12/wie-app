"use client";

import React, {
  useEffect, useRef, useState, useCallback,
} from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth"; 
// ── Action panels 
import ShareBar     from "@/components/post/actions/Sharebar";
import MentionBar   from "@/components/post/actions/MentionBar";
import ViewersPanel from "@/components/post/actions/Viewerspanel";
import MoreModal    from "@/components/post/actions/Moremodal";

// ── Assets 
import LeftArrow   from "@/assets/post/leftArrow.png";
import RightArrow  from "@/assets/post/rightArrow.png";
import ShareIconImg  from "@/assets/post/shareIcon.png";
import MentionIconImg from "@/assets/post/mentionIcon.png";
import MoreIconImg  from "@/assets/post/moreIcon.png";
import {
  getMyFluxes,
  getUserFluxes,
  deleteFlux,
  getFluxViewers,
  recordFluxView,
  getFluxMentions,
  getReMentions,
  reMentionFlux,
  getFluxById
} from "@/services/mediaService";

export interface Flux {
  _id:          string;
  userId:       string;
  mediaUrl:     string;
  mediaType:    "image" | "video";
  musicTitle?:  string;
  musicArtist?: string;
  createdAt:    string;
  viewCount?:   number;
}

const STORY_DURATION = 15_000; 
const LOCATION_THEMES: {
  bg: string;
  color: string;
  border: string;
  blur: boolean;
}[] = [
  { bg: "rgba(0,0,0,0.55)",                          color: "#fff",                      border: "rgba(255,255,255,0.15)", blur: true  },
  { bg: "#fff",                                       color: "#111",                      border: "transparent",            blur: false },
  { bg: "linear-gradient(135deg,#8860D9,#B3B8E2)",   color: "#fff",                      border: "transparent",            blur: false },
  { bg: "transparent",                                color: "#fff",                      border: "rgba(255,255,255,0.7)",  blur: false },
  { bg: "#E91E8C",                                    color: "#fff",                      border: "transparent",            blur: false },
  { bg: "transparent",                                color: "rgba(255,255,255,0.85)",    border: "transparent",            blur: false },
];

function LocationStickerBadge({
  label,
  theme = 0,
}: {
  label: string;
  theme?: number;
}) {
  const t = LOCATION_THEMES[theme % LOCATION_THEMES.length];
  return (
    <div
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            5,
        padding:        "5px 12px",
        borderRadius:   20,
        background:     t.bg,
        border:         `1px solid ${t.border}`,
        backdropFilter: t.blur ? "blur(8px)" : undefined,
        fontStyle:      theme === 5 ? "italic" : "normal",
        whiteSpace:     "nowrap",
        boxShadow:      "0 2px 8px rgba(0,0,0,0.3)",
      }}
    >
      <span style={{ fontSize: 12 }}>📍</span>
      <span
        style={{
          color:         t.color,
          fontSize:      12,
          fontWeight:    600,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MusicBadge — shows album art, title, artist; auto-plays preview URL
// ─────────────────────────────────────────────────────────────────────────────
function MusicBadge({
  title,
  artist,
  albumArt,
  previewUrl,
  paused,
}: {
  title:       string;
  artist?:     string;
  albumArt?:   string;
  previewUrl?: string;
  paused:      boolean;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Mount/unmount audio when previewUrl changes (i.e. story changes)
  React.useEffect(() => {
    if (!previewUrl) return;
    const audio      = new Audio(previewUrl);
    audio.loop       = true;
    audio.volume     = 0.45;
    audioRef.current = audio;
    audio.play().catch(() => {/* autoplay blocked — silently ignore */});
    return () => {
      audio.pause();
      audio.src        = "";
      audioRef.current = null;
    };
  }, [previewUrl]);

  // Pause / resume when story is held or a modal opens
  React.useEffect(() => {
    if (!audioRef.current) return;
    if (paused) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [paused]);

  return (
    <div
      style={{
        position:       "absolute",
        top:            16,
        left:           16,
        zIndex:         6,
        display:        "flex",
        alignItems:     "center",
        gap:            8,
        padding:        "6px 12px 6px 6px",
        borderRadius:   22,
        background:     "rgba(0,0,0,0.58)",
        backdropFilter: "blur(10px)",
        border:         "1px solid rgba(255,255,255,0.12)",
        maxWidth:       210,
        boxShadow:      "0 2px 12px rgba(0,0,0,0.4)",
      }}
    >
      {/* Album art or music note */}
      {albumArt ? (
        <img
          src={albumArt}
          alt="album"
          style={{
            width:        32,
            height:       32,
            borderRadius: 8,
            objectFit:    "cover",
            flexShrink:   0,
          }}
        />
      ) : (
        <div
          style={{
            width:           32,
            height:          32,
            borderRadius:    8,
            flexShrink:      0,
            background:      "linear-gradient(135deg,#8860D9,#B3B8E2)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            fontSize:        16,
          }}
        >
          🎵
        </div>
      )}

      {/* Title + artist */}
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            color:         "#fff",
            fontSize:      11,
            fontWeight:    600,
            overflow:      "hidden",
            textOverflow:  "ellipsis",
            whiteSpace:    "nowrap",
            lineHeight:    1.3,
          }}
        >
          {title}
        </p>
        {artist && (
          <p
            style={{
              color:        "rgba(255,255,255,0.55)",
              fontSize:     10,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              marginTop:    1,
            }}
          >
            {artist}
          </p>
        )}
      </div>

      {/* Animated equalizer bars (shows music is playing) */}
      {previewUrl && !paused && (
        <div
          style={{
            display:    "flex",
            alignItems: "flex-end",
            gap:        2,
            height:     14,
            flexShrink: 0,
            marginLeft: 2,
          }}
        >
          {[0.6, 1, 0.75].map((h, i) => (
            <div
              key={i}
              style={{
                width:            3,
                height:           `${h * 100}%`,
                borderRadius:     2,
                background:       "#fff",
                animation:        `eq-bounce 0.8s ease-in-out infinite alternate`,
                animationDelay:   `${i * 0.15}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes eq-bounce {
              from { transform: scaleY(0.3); }
              to   { transform: scaleY(1);   }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
export default function FluxViewPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [fluxes,     setFluxes]     = useState<Flux[]>([]);
  const [idx,        setIdx]        = useState(0);
  const [progress,   setProgress]   = useState(0);   // 0–100
  const [paused,     setPaused]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  // ── Panel state 
  const [showShare,   setShowShare]   = useState(false);
  const [showMention, setShowMention] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showMore,    setShowMore]    = useState(false);
  const [mentions,    setMentions]    = useState<string[]>([]);
  const [viewCount,   setViewCount]   = useState(0);
  const [isMentionedInFlux, setIsMentionedInFlux] = useState(false);
  const [hasReMentioned,    setHasReMentioned]    = useState(false);
  const [reMentioning,      setReMentioning]      = useState(false);
  const [reply, setReply] = useState("");

  const rafRef      = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);   
  const { user, loading: authLoading } = useAuth(true);
  const current  = fluxes[idx] ?? null;
  const anyModal = showShare || showMention || showViewers || showMore;
    useEffect(() => {
    if (!user?.id) return;

    (async () => {
        try {
        const targetUserId = searchParams.get("userId");
        const data: Flux[] = targetUserId
          ? await getUserFluxes(targetUserId)
          : await getMyFluxes();
        setFluxes(data);
        const startId = searchParams.get("fluxId");
        if (startId) {
            const i = data.findIndex((f) => f._id === startId);
            if (i >= 0) setIdx(i);
        }
        if (data[0]?.viewCount !== undefined) setViewCount(data[0].viewCount);
        } catch {
        /* silently ignore – UI shows placeholder */
        } finally {
        setLoading(false);
        }
    })();
    }, [user?.id]);  

  // Record a view whenever the story changes
  useEffect(() => {
    if (current?._id) {
      recordFluxView(current._id).catch(() => {});
    }
  }, [current?._id]);

  const goNext = useCallback(() => {
        setProgress(0);
        pausedAtRef.current = 0;
        setIdx((prev) => {
        if (prev < fluxes.length - 1) return prev + 1;
        router.back();
        return prev;
        });
    }, [fluxes.length, router]);

  const goPrev = () => {
    setProgress(0);
    pausedAtRef.current = 0;
    setIdx((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const startProgress = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const alreadyMs = (pausedAtRef.current / 100) * STORY_DURATION;
    const base      = performance.now() - alreadyMs;

    const tick = (now: number) => {
      const pct = Math.min(((now - base) / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        pausedAtRef.current = 0;
        goNext();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [goNext]);

  // Pause/resume
  useEffect(() => {
    if (paused || anyModal || loading) {
      cancelAnimationFrame(rafRef.current);
    } else if (fluxes.length > 0) {
      startProgress();
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, paused, anyModal, loading, fluxes.length, startProgress]);

  const handlePointerDown = () => {
    pausedAtRef.current = progress;
    setPaused(true);
  };
  const handlePointerUp   = () => setPaused(false);

  // ── Fetch viewers when panel opens ────────────────────────────
  useEffect(() => {
    if (showViewers && current?._id) {
      getFluxViewers(current._id)
        .then((res) => setViewCount(res.total ?? 0))
        .catch(() => {});
    }
  }, [showViewers, current?._id]);
// Check if current user is mentioned in this flux
useEffect(() => {
  if (!current?._id || !user?.id) return;

  getReMentions(current._id)
    .then((data) => {
      if (data.success) {
        setHasReMentioned(data.hasReMentioned ?? false);
      }
    })
    .catch(() => {});

  getFluxMentions(current._id)
    .then((data) => {
      if (data.success) {
        const found = (data.mentions ?? []).some(
          (m: any) => m.userId?.toString() === user.id
        );
        setIsMentionedInFlux(found);
      }
    })
    .catch(() => {});
}, [current?._id, user?.id]);
  // ── Delete 
  const handleDelete = async () => {
    if (!current) return;
    try {
      await deleteFlux(current._id);
      const updated = fluxes.filter((_, i) => i !== idx);
      setFluxes(updated);
      if (updated.length === 0) { router.back(); return; }
      setIdx(Math.min(idx, updated.length - 1));
    } catch {}
  };

  const handleCopyLink = () => {
    if (!current) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/post/flux-view?fluxId=${current._id}`
    );
  };

const handleReMention = async () => {
  if (!current?._id || reMentioning || hasReMentioned) return;

  // "Add your flux" — navigate to flux creation page pre-filled with this flux's data
  try {
    const data = await getFluxById(current._id);
    if (data.success && data.flux) {
      const f = data.flux;
      // Build query params to pre-fill the flux creation page
      const params = new URLSearchParams();
      params.set("sourceFluxId",  f._id);
      params.set("mediaUrl",      f.mediaUrl);
      params.set("mediaType",     f.mediaType);
      if (f.musicId)          params.set("musicId",          f.musicId);
      if (f.musicTitle)       params.set("musicTitle",       f.musicTitle);
      if (f.musicArtist)      params.set("musicArtist",      f.musicArtist);
      if (f.musicPreviewUrl)  params.set("musicPreviewUrl",  f.musicPreviewUrl);
      if (f.musicAlbumArt)    params.set("musicAlbumArt",    f.musicAlbumArt);
      if (f.locationLabel)    params.set("locationLabel",    f.locationLabel);
      if (f.locationPlaceId)  params.set("locationPlaceId",  f.locationPlaceId);
      if (f.locationLat != null) params.set("locationLat",   String(f.locationLat));
      if (f.locationLng != null) params.set("locationLng",   String(f.locationLng));
      if (f.locationCategory) params.set("locationCategory", f.locationCategory);
      if (f.locationStickerX != null) params.set("locationStickerX", String(f.locationStickerX));
      if (f.locationStickerY != null) params.set("locationStickerY", String(f.locationStickerY));
      if (f.locationStickerTheme != null) params.set("locationStickerTheme", String(f.locationStickerTheme));

      router.push(`/post/flux?${params.toString()}`);
    }
  } catch {
    // fallback — just navigate without pre-fill
    router.push("/post/flux");
  }
};
    if (authLoading || loading) return (
    <div style={{
        minHeight: "100vh", background: "#0A0A0C",
        display: "flex", alignItems: "center", justifyContent: "center",
    }}>
        <div style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "3px solid #8860D9", borderTopColor: "transparent",
        animation: "spin 0.75s linear infinite",
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
    );
return (
    <div style={{
      height:          "100vh",
      background:      "#0A0A0C",
      color:           "#fff",
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      overflow:        "hidden",
      fontFamily:      "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>

      {/* ── Left arrow ── */}
      <button
        onClick={goPrev}
        disabled={idx === 0}
        style={{
          width:          40,
          height:         40,
          borderRadius:   "50%",
          background:     "rgba(255,255,255,0.07)",
          border:         "1px solid rgba(255,255,255,0.1)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          cursor:         idx === 0 ? "default" : "pointer",
          opacity:        idx === 0 ? 0.25 : 1,
          flexShrink:     0,
          marginRight:    12,
          transition:     "opacity 0.2s",
        }}
      >
        <Image src={LeftArrow} alt="prev" width={16} height={16} />
      </button>

      {/* ── CENTER COLUMN: progress + header + card + bottom bar ── */}
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        flexShrink:     0,
        gap:            8,
      }}>

        {/* Progress bars */}
        <div style={{ display: "flex", gap: 3, width: 320 }}>
          {(fluxes.length > 0 ? fluxes : [null]).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 2.5, borderRadius: 2,
              background: "rgba(255,255,255,0.22)", overflow: "hidden",
            }}>
              <div style={{
                height:       "100%",
                background:   "#fff",
                borderRadius: 2,
                width:        i < idx ? "100%" : i === idx ? `${progress}%` : "0%",
                transition:   "width 0.05s linear",
              }} />
            </div>
          ))}
        </div>

        {/* User row */}
        <div style={{
          width:       320,
          display:     "flex",
          alignItems:  "center",
          gap:         8,
        }}>
          <div style={{
            width:        32,
            height:       32,
            borderRadius: "50%",
            border:       "2px solid rgba(255,255,255,0.18)",
            flexShrink:   0,
            overflow:     "hidden",
            background:   "linear-gradient(135deg,#8860D9,#B3B8E2)",
          }}>
            {user?.profile_picture && (
              <img
                src={user.profile_picture}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          <span style={{ color: "#fff", fontSize: 12, fontWeight: 500, flex: 1 }}>
            {user?.username ?? "my_story"}
          </span>

          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
            {current?.createdAt
              ? new Date(current.createdAt).toLocaleTimeString([], {
                  hour: "2-digit", minute: "2-digit",
                })
              : ""}
          </span>

          {/* Pause / Play */}
          <button
            onClick={() => setPaused((p) => !p)}
            style={{
              width:          28,
              height:         28,
              borderRadius:   "50%",
              background:     "rgba(255,255,255,0.1)",
              border:         "1px solid rgba(255,255,255,0.15)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              cursor:         "pointer",
              flexShrink:     0,
            }}
          >
            {paused ? (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                <path d="M1 1l8 5-8 5V1z" />
              </svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                <rect x="1"   y="1" width="2.5" height="10" rx="1" />
                <rect x="6.5" y="1" width="2.5" height="10" rx="1" />
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            onClick={() => router.back()}
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "rgba(255,255,255,0.55)",
              display:    "flex",
              flexShrink: 0,
              padding:    0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Story card */}
        <div
          style={{
            width:        360,
            height:       500,
            borderRadius: 12,
            overflow:     "hidden",
            background:   "#1a1a1f",
            position:     "relative",
            userSelect:   "none",
            flexShrink:   0,
          }}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
        >
          {/* Media */}
          {current ? (
            current.mediaType === "video" ? (
              <video
                key={current._id}
                src={current.mediaUrl}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                autoPlay muted loop playsInline
              />
            ) : (
              <img
                key={current._id}
                src={current.mediaUrl}
                alt="story"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(180deg,#1a1a2e,#2d1b4e)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                No stories yet
              </p>
            </div>
          )}

          {/* Music badge */}
          {current?.musicTitle && (
            <MusicBadge
              title={current.musicTitle}
              artist={current.musicArtist}
              albumArt={(current as any).musicAlbumArt}
              previewUrl={(current as any).musicPreviewUrl}
              paused={paused || anyModal}
            />
          )}

          {/* Location sticker */}
          {(current as any)?.locationLabel && (
            <div style={{
              position:      "absolute",
              left:          `${(current as any).locationStickerX ?? 50}%`,
              top:           `${(current as any).locationStickerY ?? 75}%`,
              transform:     "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex:        5,
            }}>
              <LocationStickerBadge
                label={(current as any).locationLabel}
                theme={(current as any).locationStickerTheme ?? 0}
              />
            </div>
          )}
          {/* Re-mention button — only shown when viewer is mentioned in this flux */}
          {isMentionedInFlux && current?.userId !== user?.id && (
            <div style={{
              position:  "absolute",
              bottom:    52,
              left:      "50%",
              transform: "translateX(-50%)",
              zIndex:    11,
            }}>
              <button
                onClick={handleReMention}
                disabled={reMentioning}
                style={{
                  padding:       "8px 22px",
                  borderRadius:  22,
                  border:        "1px solid rgba(255,255,255,0.25)",
                  background:    hasReMentioned
                    ? "rgba(136,96,217,0.55)"
                    : "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(10px)",
                  color:          "#fff",
                  fontSize:       12,
                  fontWeight:     600,
                  cursor:         hasReMentioned ? "default" : "pointer",
                  display:        "flex",
                  alignItems:     "center",
                  gap:            6,
                  whiteSpace:     "nowrap",
                  transition:     "background 0.2s",
                }}
              >
                {reMentioning ? "..." : "↩ Add your flux"}
              </button>
            </div>
          )}

         {/* Reply bar */}
          <div style={{
            position:   "absolute",
            bottom:     0, left: 0, right: 0,
            padding:    "12px",
            background: "linear-gradient(0deg,rgba(0,0,0,0.65) 0%,transparent 100%)",
            zIndex:     10,
          }}>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              placeholder="Say anything here..."
              style={{
                width:        "100%",
                height:       32,
                borderRadius: 16,
                background:   "rgba(255,255,255,0.1)",
                border:       "1px solid rgba(255,255,255,0.14)",
                padding:      "0 14px",
                color:        "#fff",
                fontSize:     12,
                outline:      "none",
                boxSizing:    "border-box",
              }}
            />
          </div>
        </div>

        {/* ── Bottom bar: viewer avatars left | 3 icon buttons right ── */}
        <div style={{
          width:          320,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
        }}>

          {/* Viewer avatars */}
          <button
            onClick={() => {
              setShowViewers((v) => !v);
              setShowShare(false);
              setShowMention(false);
              setShowMore(false);
            }}
            style={{
              display:    "flex",
              alignItems: "center",
              gap:        3,
              background: "none",
              border:     "none",
              cursor:     "pointer",
            }}
          >
            {[0, 1].map((i) => (
              <div key={i} style={{
                width:        24,
                height:       24,
                borderRadius: "50%",
                background:   i === 0
                  ? "linear-gradient(135deg,#6a5acd,#b39ddb)"
                  : "linear-gradient(135deg,#5a4abf,#9070c0)",
                border:       "2px solid #0A0A0C",
                marginLeft:   i > 0 ? -7 : 0,
                flexShrink:   0,
              }} />
            ))}
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginLeft: 5 }}>
              {viewCount > 0 ? viewCount : ""}
            </span>
          </button>

          {/* Share | Mention | More */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {([
              {
                icon: ShareIconImg, alt: "share",
                action: () => {
                  setShowShare((v) => !v);
                  setShowMention(false);
                  setShowMore(false);
                  setShowViewers(false);
                },
              },
              {
                icon: MentionIconImg, alt: "mention",
                action: () => {
                  setShowMention((v) => !v);
                  setShowShare(false);
                  setShowMore(false);
                  setShowViewers(false);
                },
              },
              {
                icon: MoreIconImg, alt: "more",
                action: () => {
                  setShowMore((v) => !v);
                  setShowShare(false);
                  setShowMention(false);
                  setShowViewers(false);
                },
              },
            ] as const).map(({ icon, alt, action }) => (
              <button
                key={alt}
                onClick={action}
                style={{
                  width:          32,
                  height:         32,
                  borderRadius:   "50%",
                  background:     "rgba(255,255,255,0.07)",
                  border:         "1px solid rgba(255,255,255,0.1)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  cursor:         "pointer",
                  transition:     "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.15)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.07)")
                }
              >
                <Image src={icon} alt={alt} width={16} height={16} />
              </button>
            ))}
          </div>
        </div>
      </div>{/* end center column */}

      {/* ── Right arrow ── */}
      <button
        onClick={goNext}
        style={{
          width:          40,
          height:         40,
          borderRadius:   "50%",
          background:     "rgba(255,255,255,0.07)",
          border:         "1px solid rgba(255,255,255,0.1)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          cursor:         "pointer",
          flexShrink:     0,
          marginLeft:     12,
        }}
      >
        <Image src={RightArrow} alt="next" width={16} height={16} />
      </button>

      {/* ── ViewersPanel — fixed bottom-left corner of viewport ── */}
      {showViewers && (
        <div style={{
          position: "fixed",
          bottom:   24,
          left:     24,
          zIndex:   50,
        }}>
          <ViewersPanel
            viewCount={viewCount}
            onClose={() => setShowViewers(false)}
            onDeleteStory={() => { handleDelete(); setShowViewers(false); }}
          />
        </div>
      )}
      {/* ── ShareBar / MentionBar / MoreModal — fixed right side, vertical stack ── */}
      {(showShare || showMention || showMore) && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => {
              setShowShare(false);
              setShowMention(false);
              setShowMore(false);
            }}
            style={{
              position:       "fixed",
              inset:          0,
              zIndex:         49,
              background:     "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Panel container */}
          <div style={{
            position:      "fixed",
            right:         24,
            top:           "50%",
            transform:     "translateY(-50%)",
            zIndex:        50,
            display:       "flex",
            flexDirection: "column",
            gap:           12,
            maxHeight:     "90vh",
            overflowY:     "auto",
          }}>
            {showShare && (
              <ShareBar
                fluxId={current?._id ?? ""}
                onClose={() => setShowShare(false)}
              />
            )}
            {showMention && (
              <MentionBar
                fluxId={current?._id ?? ""}
                selectedMentions={mentions}
                onToggle={(id) =>
                  setMentions((p) =>
                    p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
                  )
                }
                onAdd={() => setShowMention(false)}
                onClose={() => setShowMention(false)}
              />
            )}
            {showMore && (
              <MoreModal
                onClose={() => setShowMore(false)}
                onDelete={() => { handleDelete(); setShowMore(false); }}
                onArchive={() => {}}
                onSave={() => {}}
                onHighlight={() => {}}
                onCopyLink={handleCopyLink}
                onShare={() => { setShowMore(false); setShowShare(true); }}
                onMention={() => { setShowMore(false); setShowMention(true); }}
                onSettings={() => {}}
                onComments={() => {}}
              />
            )}
          </div>
        </>
      )}

    </div>
  );
}