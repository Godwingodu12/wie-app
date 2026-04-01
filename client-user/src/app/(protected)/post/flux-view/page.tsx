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
import CommentSheet from "@/components/post/actions/CommentSheet";

// ── Assets 
import LeftArrow   from "@/assets/post/leftArrow.png";
import RightArrow  from "@/assets/post/rightArrow.png";
import ShareIconImg  from "@/assets/post/shareIcon.png";
import MentionIconImg from "@/assets/post/mentionIcon.png";
import MoreIconImg  from "@/assets/post/moreIcon.png";
import {
  getMyFluxes,getUserFluxes,deleteFlux,getFluxViewers,recordFluxView,getFluxMentions,getReMentions,reMentionFlux,
  getFluxPermissions,removeMentionSelf,getFluxById,toggleFluxLike,getFluxLikes,shareFluxAsMessage,replyFluxAsMessage,
  type Flux,
} from "@/services/mediaService";
import {getUserById} from "@/services/wieUserService";
import { TextLayer } from "@/components/post/actions/StoryTextCanvas";

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

// MusicBadge — shows album art, title, artist; auto-plays preview URL
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

function LyricsOverlay({
  title, artist, albumArt, previewUrl, lyricsStyle, paused, progress,
}: {
  title: string; artist: string; albumArt?: string; previewUrl?: string;
  lyricsStyle: "karaoke" | "line" | "floating"; paused: boolean; progress: number;
}) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fake lyric lines derived from title (real implementation would use a lyrics API)
  const lines = React.useMemo(() => [
    title, artist, "♪ ♫ ♪", title, artist,
  ], [title, artist]);

  const lineIndex = Math.floor((progress / 100) * lines.length);

  React.useEffect(() => {
    if (!previewUrl) return;
    const audio = new Audio(previewUrl);
    audio.loop = true; audio.volume = 0.45;
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => { audio.pause(); audio.src = ""; audioRef.current = null; };
  }, [previewUrl]);

  React.useEffect(() => {
    if (!audioRef.current) return;
    if (paused) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }, [paused]);

  const containerStyle: React.CSSProperties = {
    position: "absolute", bottom: 80, left: 0, right: 0,
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 4, zIndex: 8, pointerEvents: "none", padding: "0 20px",
  };

  if (lyricsStyle === "karaoke") {
    const words = (lines[lineIndex] ?? "").split(" ");
    const wordIdx = Math.floor((progress % (100 / lines.length)) / (100 / lines.length) * words.length);
    return (
      <div style={containerStyle}>
        <style>{`@keyframes kfade{from{opacity:0}to{opacity:1}}`}</style>
        <div style={{
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
          borderRadius: 12, padding: "10px 16px", textAlign: "center",
        }}>
          <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>
            {words.map((w, i) => (
              <span key={i} style={{
                color: i <= wordIdx ? "#fff" : "rgba(255,255,255,0.3)",
                marginRight: 6, transition: "color 0.2s",
              }}>{w}</span>
            ))}
          </p>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>{artist}</p>
      </div>
    );
  }

  if (lyricsStyle === "floating") {
    return (
      <div style={{ ...containerStyle, bottom: 100 }}>
        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes lFade{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}`}</style>
        {lines.slice(Math.max(0, lineIndex - 1), lineIndex + 2).map((line, i) => (
          <p key={`${lineIndex}-${i}`} style={{
            color: i === (lineIndex > 0 ? 1 : 0) ? "#fff" : "rgba(255,255,255,0.35)",
            fontSize: i === (lineIndex > 0 ? 1 : 0) ? 16 : 12,
            fontWeight: 700, textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            animation: `float 3s ease-in-out infinite, lFade 0.4s ease`,
            animationDelay: `${i * 0.1}s`,
          }}>{line}</p>
        ))}
      </div>
    );
  }

  // Default: line mode
  return (
    <div style={containerStyle}>
      <style>{`@keyframes lineFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        background: "rgba(0,0,0,0.58)", backdropFilter: "blur(10px)",
        borderRadius: 16, padding: "12px 20px", textAlign: "center",
        border: "1px solid rgba(255,255,255,0.1)",
        animation: "lineFade 0.35s ease",
      }} key={lineIndex}>
        {albumArt && (
          <img src={albumArt} alt="album" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", marginBottom: 6 }} />
        )}
        <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>
          {lines[lineIndex] ?? title}
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 4 }}>{artist}</p>
      </div>
    </div>
  );
}

export default function FluxViewPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [fluxes,     setFluxes]     = useState<Flux[]>([]);
  const [idx,        setIdx]        = useState(0);
  const [allFluxes,  setAllFluxes]  = useState<Flux[]>([]);
  const [globalIdx,  setGlobalIdx]  = useState(0);
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
  const [isOwner,     setIsOwner]     = useState(false);
  const [isMentioned, setIsMentioned] = useState(false);
  const [hasReMentioned,    setHasReMentioned]    = useState(false);
  const [reMentioning,      setReMentioning]      = useState(false);
  const [reply, setReply] = useState("");
  const [fluxOwnerProfile, setFluxOwnerProfile] = useState<{ username: string; profile_picture: string | null } | null>(null);
  const ownerCacheRef = useRef<Record<string, { username: string; profile_picture: string | null }>>({});
  const rafRef      = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);   
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const { user, loading: authLoading } = useAuth(true);
  const current = allFluxes[globalIdx] ?? fluxes[idx] ?? null;  
  const [showComments,  setShowComments]  = useState(false);
  const [hasLiked,      setHasLiked]      = useState(false);
  const [likeCount,     setLikeCount]     = useState(0);
  const [likeAnim,      setLikeAnim]      = useState(false);
  const [replySending, setReplySending] = useState(false);
  const [viewerPreviews, setViewerPreviews] = useState<{ id: string; profile_picture: string | null }[]>([]);
  const anyModal = showShare || showMention || showViewers || showMore || showComments;
  const STORY_DURATION = ((current as any)?.duration ?? 15) * 1_000;
  // ── Helper: extract owner id string from any flux shape ──
  const getFluxOwnerId = (flux: Flux | null): string => {
    if (!flux) return "";
    return String(
      (flux as any)?.userId?._id ??
      (flux as any)?.userId ??
      (flux as any)?.user?._id ??
      (flux as any)?.owner?._id ??
      ""
    );
  };

  // ── Helper: extract embedded owner profile from flux ──
  const getEmbeddedOwner = (flux: Flux | null): { username: string; profile_picture: string | null } | null => {
    if (!flux) return null;
    const ownerData =
      (flux as any)?.user ??
      (flux as any)?.owner ??
      ((flux as any)?.userId && typeof (flux as any).userId === "object"
        ? (flux as any).userId
        : null);
    if (!ownerData) return null;
    const username =
      ownerData.username ??
      ownerData.name ??
      ownerData.displayName ??
      null;
    const profile_picture =
      ownerData.profile_picture ??
      ownerData.profilePicture ??
      ownerData.avatar ??
      ownerData.photo ??
      null;
    if (!username && !profile_picture) return null;
    return { username: username ?? "user", profile_picture };
  };
  useEffect(() => {
  if (!user?.id) return;

  (async () => {
    try {
      const targetUserId = searchParams.get("userId");
      const startId      = searchParams.get("fluxId");
      const primaryData: Flux[] = targetUserId
        ? await getUserFluxes(targetUserId)
        : await getMyFluxes();

      const safeData = targetUserId
        ? primaryData.filter((f) => (f as any).visibility !== "close_friends" || false)
        : primaryData; 
      setFluxes(safeData);

      // 2. Set starting index within primary user
      let startIdx = 0;
      if (startId) {
        const i = primaryData.findIndex((f) => f._id === startId);
        if (i >= 0) startIdx = i;
      }
      setIdx(startIdx);

      // 3. Build allFluxes: primary user first, then others
      //    For simplicity, allFluxes starts with primary; more users
      //    can be fetched here if you have a "get all active fluxes" endpoint.
      //    For now we use primaryData as the flat list (extend as needed).
      setAllFluxes(primaryData);

      // Global index = same as local start index
      setGlobalIdx(startIdx);

      // 4. Owner profile
      if (primaryData[0]?.viewCount !== undefined)
        setViewCount(primaryData[0].viewCount);
        const ownerIdToFetch = targetUserId ?? (primaryData[0] as any)?.userId?._id ?? (primaryData[0] as any)?.userId ?? null;
      // Try embedded first
      const ownerData =
        (primaryData[0] as any)?.user   ??
        (primaryData[0] as any)?.owner  ??
        ((primaryData[0] as any)?.userId && typeof (primaryData[0] as any).userId === "object"
          ? (primaryData[0] as any).userId
          : null);

        if (ownerData?.username) {
          const profile = {
            username:        ownerData.username        ?? ownerData.name ?? "user",
            profile_picture: ownerData.profile_picture ?? ownerData.profilePicture ?? ownerData.avatar ?? null,
          };
          setFluxOwnerProfile(profile);
          if (ownerIdToFetch) ownerCacheRef.current[String(ownerIdToFetch)] = profile;
        }

        // Always fetch fresh via getUserById for accuracy
        if (ownerIdToFetch) {
          getUserById(String(ownerIdToFetch))
            .then((userData) => {
              if (!userData) return;
              const profile = {
                username:
                  userData.username ??
                  userData.name     ??
                  "user",
                profile_picture:
                  userData.profile_picture ??
                  null,
              };
              setFluxOwnerProfile(profile);
              ownerCacheRef.current[String(ownerIdToFetch)] = profile;
            })
            .catch(() => {});
        }
    } catch {
      /* silently ignore */
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
  useEffect(() => {
    // Cleanup previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    const previewUrl = (current as any)?.musicPreviewUrl;
    if (!previewUrl) return;

    const audio = new Audio(previewUrl);
    audio.loop   = true;
    audio.volume = 0.45;
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [current?._id]); 

  // Pause/resume audio when story is held or modal opens
  useEffect(() => {
    if (!audioRef.current) return;
    if (paused || anyModal) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [paused, anyModal]);


  const goNext = useCallback(() => {
  setProgress(0);
  pausedAtRef.current = 0;

  const nextGlobal = globalIdx + 1;
  if (nextGlobal >= allFluxes.length) {
    // No more fluxes from any user → go home
    router.push("/");
    return;
  }

  const nextFlux = allFluxes[nextGlobal];
  setGlobalIdx(nextGlobal);

  // Check if next flux belongs to a different user
  const currentOwnerId = String(
    (allFluxes[globalIdx] as any)?.userId?._id ??
    (allFluxes[globalIdx] as any)?.userId ?? ""
  );
  const nextOwnerId = String(
    (nextFlux as any)?.userId?._id ??
    (nextFlux as any)?.userId ?? ""
  );

  if (nextOwnerId !== currentOwnerId) {
    // Different user — re-fetch their flux list for progress bar
    setFluxes(allFluxes.filter((f) => {
      const oid = String((f as any)?.userId?._id ?? (f as any)?.userId ?? "");
      return oid === nextOwnerId;
    }));
    // Update owner profile from embedded data
    const ownerData =
      (nextFlux as any)?.user   ??
      (nextFlux as any)?.owner  ??
      ((nextFlux as any)?.userId && typeof (nextFlux as any).userId === "object"
        ? (nextFlux as any).userId
        : null);
    if (ownerData) {
      setFluxOwnerProfile({
        username:        ownerData.username        ?? ownerData.name ?? "user",
        profile_picture: ownerData.profile_picture ?? ownerData.profilePicture ?? ownerData.avatar ?? null,
      });
    }
  }

  // Find index of nextFlux within the (possibly new) per-user slice
  const userFluxes = allFluxes.filter((f) => {
    const oid = String((f as any)?.userId?._id ?? (f as any)?.userId ?? "");
    return oid === nextOwnerId;
  });
  const localIdx = userFluxes.findIndex((f) => f._id === nextFlux._id);
  setIdx(localIdx >= 0 ? localIdx : 0);
}, [globalIdx, allFluxes, router]);

const goPrev = useCallback(() => {
  setProgress(0);
  pausedAtRef.current = 0;

  if (globalIdx === 0) return; // Already at the very first flux

  const prevGlobal = globalIdx - 1;
  const prevFlux   = allFluxes[prevGlobal];
  setGlobalIdx(prevGlobal);

  const currentOwnerId = String(
    (allFluxes[globalIdx] as any)?.userId?._id ??
    (allFluxes[globalIdx] as any)?.userId ?? ""
  );
  const prevOwnerId = String(
    (prevFlux as any)?.userId?._id ??
    (prevFlux as any)?.userId ?? ""
  );

  if (prevOwnerId !== currentOwnerId) {
    setFluxes(allFluxes.filter((f) => {
      const oid = String((f as any)?.userId?._id ?? (f as any)?.userId ?? "");
      return oid === prevOwnerId;
    }));
    const ownerData =
      (prevFlux as any)?.user   ??
      (prevFlux as any)?.owner  ??
      ((prevFlux as any)?.userId && typeof (prevFlux as any).userId === "object"
        ? (prevFlux as any).userId
        : null);
    if (ownerData) {
      setFluxOwnerProfile({
        username:        ownerData.username        ?? ownerData.name ?? "user",
        profile_picture: ownerData.profile_picture ?? ownerData.profilePicture ?? ownerData.avatar ?? null,
      });
    }
  }

  const userFluxes = allFluxes.filter((f) => {
    const oid = String((f as any)?.userId?._id ?? (f as any)?.userId ?? "");
    return oid === prevOwnerId;
  });
  const localIdx = userFluxes.findIndex((f) => f._id === prevFlux._id);
  setIdx(localIdx >= 0 ? localIdx : 0);
}, [globalIdx, allFluxes]);

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
  const currentFluxId = fluxes[idx]?._id ?? null;
  useEffect(() => {
    if (!currentFluxId) return;

    // Don't reset to 0 immediately — keep previous values visible while loading
    const timer = setTimeout(() => {
      getFluxViewers(currentFluxId)
        .then((res) => {
          // ✅ Backend returns total + viewers for ALL users (owner and non-owner)
          const total = res.total ?? res.viewCount ?? 0;
          setViewCount(total);

          const rawViewers: any[] = res.viewers ?? [];
          const previews = rawViewers.slice(0, 3).map((v: any) => ({
            id: v.id ?? v._id ?? "",
            profile_picture:
              v.profile_picture ??
              v.profilePicture  ??
              v.avatar          ??
              v.photo           ??
              null,
          }));
          setViewerPreviews(previews);
        })
        .catch(() => {
          // On error keep whatever was shown before
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [currentFluxId]);

  useEffect(() => {
    if (!current?._id || !user?.id || loading) return;

    // Reset per-flux state
    setIsOwner(false);
    setIsMentioned(false);
    setHasReMentioned(false);

    const fluxId   = current._id;
    const viewerId = String(user.id);
    const ownerId  = getFluxOwnerId(current);
    const ownerFlag = ownerId === viewerId;
    setIsOwner(ownerFlag);

    if (ownerFlag) {
      // Viewing own flux — use logged-in user's own profile
      setFluxOwnerProfile({
        username:        user.username        ?? "me",
        profile_picture: user.profile_picture ?? null,
      });
    } else {
      // Reset first so stale data doesn't linger
      setFluxOwnerProfile(null);

      // 1. Check in-memory cache (instant)
      if (ownerId && ownerCacheRef.current[ownerId]) {
        setFluxOwnerProfile(ownerCacheRef.current[ownerId]);
      }
      // 2. Try embedded owner data (no network)
      else {
        const embedded = getEmbeddedOwner(current);
        if (embedded && embedded.username && embedded.username !== "user") {
          setFluxOwnerProfile(embedded);
          if (ownerId) ownerCacheRef.current[ownerId] = embedded;
        }
        // 3. Always fetch fresh from getUserById — most reliable
        if (ownerId) {
          getUserById(ownerId)
            .then((userData) => {
              if (!userData) return;
              const profile = {
                username:
                  userData.username ??
                  userData.name     ??
                  "user",
                profile_picture:
                  userData.profile_picture ??
                  null,
              };
              setFluxOwnerProfile(profile);
              ownerCacheRef.current[ownerId] = profile;
            })
            .catch(() => {});
        }
      }
    }
    // Mentions
    getFluxMentions(fluxId)
      .then((data) => {
        if (data.success) {
          const amIMentioned = (data.mentions ?? []).some(
            (m: any) => String(m.userId) === viewerId,
          );
          setIsMentioned(amIMentioned);
        }
      })
      .catch(() => { setIsMentioned(false); });

    // Re-mentions
    getReMentions(fluxId)
      .then((data) => {
        if (data.success) setHasReMentioned(data.hasReMentioned ?? false);
      })
      .catch(() => {});

    // Likes
    getFluxLikes(fluxId)
      .then((data) => {
        setLikeCount(data.total ?? 0);
        if (!ownerFlag) setHasLiked(data.hasLiked ?? false);
      })
      .catch(() => {});

  }, [current?._id, user?.id, loading]);
    
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
  const handleRemoveMention = async () => {
    if (!current) return;
    try {
      await removeMentionSelf(current._id);
      // Optimistically hide the mention — close story view
      setIsMentioned(false);
      setHasReMentioned(false);
      router.back();
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
    setReMentioning(true);
    try {
      const data = await getFluxById(current._id);
      if (data.success && data.flux) {
        const f = data.flux;
        const params = new URLSearchParams();
        params.set("mentionedFluxId",   f._id);
        params.set("sourceFluxId",      f._id);
        params.set("mediaUrl",          f.mediaUrl ?? "");
        params.set("mediaType",         f.mediaType ?? "image");
        if (f.musicId)               params.set("musicId",             f.musicId);
        if (f.musicTitle)            params.set("musicTitle",          f.musicTitle);
        if (f.musicArtist)           params.set("musicArtist",         f.musicArtist);
        if (f.musicPreviewUrl)       params.set("musicPreviewUrl",     f.musicPreviewUrl);
        if (f.musicAlbumArt)         params.set("musicAlbumArt",       f.musicAlbumArt);
        if (f.locationLabel)         params.set("locationLabel",       f.locationLabel);
        if (f.locationPlaceId)       params.set("locationPlaceId",     f.locationPlaceId);
        if (f.locationLat  != null)  params.set("locationLat",         String(f.locationLat));
        if (f.locationLng  != null)  params.set("locationLng",         String(f.locationLng));
        if (f.locationCategory)      params.set("locationCategory",    f.locationCategory);
        if (f.locationStickerX != null) params.set("locationStickerX", String(f.locationStickerX));
        if (f.locationStickerY != null) params.set("locationStickerY", String(f.locationStickerY));
        if (f.locationStickerTheme != null) params.set("locationStickerTheme", String(f.locationStickerTheme));

        // ✅ FIX: Pass textLayers
        if (Array.isArray(f.textLayers) && f.textLayers.length > 0)
          params.set("textLayers", encodeURIComponent(JSON.stringify(f.textLayers)));

        // ✅ FIX: Pass textBg
        if (f.textBg)
          params.set("textBg", encodeURIComponent(f.textBg));

        // Stickers
        if (Array.isArray(f.stickers) && f.stickers.length > 0)
          params.set("stickers", encodeURIComponent(JSON.stringify(f.stickers)));
        // Filter
        if (f.filterName)  params.set("filterName",  f.filterName);
        if (f.filterValue) params.set("filterValue", encodeURIComponent(f.filterValue));

        router.push(`/post/flux?${params.toString()}`);
      } else {
        router.push(`/post/flux?mentionedFluxId=${current._id}`);
      }
    } catch (err) {
      console.error("reMention navigation failed:", err);
      router.push(`/post/flux?mentionedFluxId=${current._id}`);
    } finally {
      setReMentioning(false);
    }
  };

  const handleLike = async () => {
    if (isOwner || !current) return;
    const newLiked = !hasLiked;
    setHasLiked(newLiked);
    setLikeCount((p) => newLiked ? p + 1 : Math.max(0, p - 1));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    try {
      await toggleFluxLike(current._id);
    } catch {
      // Revert
      setHasLiked(!newLiked);
      setLikeCount((p) => newLiked ? Math.max(0, p - 1) : p + 1);
    }
  };

  const handleSendReply = async () => {
    if (!current?._id || !reply.trim() || replySending || isOwner) return;
    setReplySending(true);
    const text = reply.trim();
    setReply("");
    try {
      await replyFluxAsMessage(current._id, text);
      // Optionally show a brief toast/confirmation
    } catch (e) {
      console.warn("flux reply failed:", e);
      setReply(text); // restore on failure
    } finally {
      setReplySending(false);
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
          {/* Avatar */}
          <div style={{
            width:        32,
            height:       32,
            borderRadius: "50%",
            border:       current?.visibility === "close_friends"
              ? "2px solid #22c55e"
              : "2px solid rgba(255,255,255,0.18)",
            flexShrink:   0,
            overflow:     "hidden",
            background:   "linear-gradient(135deg,#8860D9,#B3B8E2)",
          }}>
            {/* ✅ Show flux owner's picture when viewing others, own picture when viewing own */}
            {(() => {
              const pic = fluxOwnerProfile?.profile_picture ?? null;
              return pic ? (
                <img
                  src={pic}
                  alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null;
            })()}
          </div>

          {/* Username */}
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fluxOwnerProfile?.username ?? "user"}
            {current?.visibility === "close_friends" && (
              <span style={{
                marginLeft:     6,
                fontSize:       10,
                background:     "linear-gradient(135deg,#22c55e,#16a34a)",
                color:          "#fff",
                padding:        "1px 7px",
                borderRadius:   10,
                fontWeight:     700,
                verticalAlign:  "middle",
              }}>⭐</span>
            )}
          </span>

          {current?.musicTitle && (
            <div
              style={{
                flex:         1,
                minWidth:     0,
                display:      "flex",
                alignItems:   "center",
                gap:          5,
                padding:      "3px 8px",
                borderRadius: 12,
                background:   "rgba(255,255,255,0.08)",
                border:       "1px solid rgba(255,255,255,0.1)",
                overflow:     "hidden",
                cursor:       "default",
              }}
            >
              <span style={{
                color:        "rgba(229,231,235,0.88)",
                fontSize:     11,
                fontWeight:   500,
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
                lineHeight:   1.2,
              }}>
                {current.musicTitle}
                {current.musicArtist && (
                  <span style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}>
                    {" – "}{current.musicArtist}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Time */}
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flexShrink: 0 }}>
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
            border:       "none",
            outline:      "none",
            boxShadow:    "none",
          }}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
        >
          {/* Media */}
          {current ? (
            (() => {
              // Text-only flux: no mediaUrl or mediaType is "text"
              const isTextFlux =
                !current.mediaUrl ||
                (current as any).mediaType === "text" ||
                current.mediaUrl.trim() === "";

              if (isTextFlux) {
                // Render plain coloured background — no image or border
                const textBg = (current as any).textBg ?? "linear-gradient(135deg,#1a1a2e,#2d1b4e)";
                return (
                  <div
                    style={{
                      width:      "100%",
                      height:     "100%",
                      background: textBg,
                      display:    "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                );
              }

              if (current.mediaType === "video") {
                return (
                  <video
                    key={current._id}
                    src={current.mediaUrl}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", border: "none", outline: "none" }}
                    autoPlay muted loop playsInline
                  />
                );
              }

              return (
                <img
                  key={current._id}
                  src={current.mediaUrl}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", border: "none", outline: "none" }}
                  alt=""
                />
              );
            })()
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
          {/* Text layers overlay */}
          {(current as any)?.textLayers?.length > 0 && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }}>
              {((current as any).textLayers as TextLayer[]).map((layer: any) => (
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
                    textAlign:  layer.align ?? "center",
                    whiteSpace: "pre-wrap",
                    wordBreak:  "break-word",
                    maxWidth:   260,
                    lineHeight: 1.3,
                  }}
                >
                  {layer.text}
                </div>
              ))}
            </div>
          )}
          {(current as any)?.stickers?.length > 0 && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 9 }}>
              {((current as any).stickers as any[]).map((s: any) => (
                <div
                  key={s.id}
                  style={{
                    position:  "absolute",
                    left:      `${s.x}%`,
                    top:       `${s.y}%`,
                    transform: `translate(-50%,-50%) scale(${s.scale ?? 1}) rotate(${s.rotate ?? 0}deg)`,
                    pointerEvents: "none",
                    zIndex:    9,
                  }}
                >
                  <img
                    src={s.url}
                    alt="sticker"
                    style={{
                      width:     56,
                      height:    56,
                      objectFit: "contain",
                      display:   "block",
                    }}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          )}
          {isMentioned && !isOwner && !hasReMentioned && (
            <div style={{
              position:  "absolute",
              bottom:    72,
              left:      "50%",
              transform: "translateX(-50%)",
              zIndex:    12,
            }}>
              <button
                onClick={handleReMention}
                disabled={reMentioning}
                style={{
                  padding:        "9px 24px",
                  borderRadius:   22,
                  border:         "1px solid rgba(255,255,255,0.25)",
                  background:     "rgba(0,0,0,0.60)",
                  backdropFilter: "blur(10px)",
                  color:          "#fff",
                  fontSize:       12,
                  fontWeight:     600,
                  cursor:         reMentioning ? "default" : "pointer",
                  display:        "flex",
                  alignItems:     "center",
                  gap:            6,
                  whiteSpace:     "nowrap",
                  transition:     "background 0.2s",
                  opacity:        reMentioning ? 0.6 : 1,
                }}
              >
                {reMentioning ? "Opening..." : "↩ Add your flux"}
              </button>
            </div>
          )}
          {/* Reply bar — sends as chat message with flux reference */}
          <div style={{
            position:   "absolute",
            bottom:     0, left: 0, right: 0,
            padding:    "12px",
            background: "linear-gradient(0deg,rgba(0,0,0,0.65) 0%,transparent 100%)",
            zIndex:     10,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && reply.trim() && current && !isOwner) {
                    e.preventDefault();
                    await handleSendReply();
                  }
                }}
                placeholder="Reply to this flux..."
                style={{
                  flex:         1,
                  height:       36,
                  borderRadius: 18,
                  background:   "rgba(255,255,255,0.1)",
                  border:       "1px solid rgba(255,255,255,0.14)",
                  padding:      "0 14px",
                  color:        "#fff",
                  fontSize:     13,
                  outline:      "none",
                  boxSizing:    "border-box",
                }}
              />
              {reply.trim() && !isOwner && (
                <button
                  onClick={handleSendReply}
                  style={{
                    width:          36,
                    height:         36,
                    borderRadius:   "50%",
                    border:         "none",
                    background:     "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)",
                    color:          "#fff",
                    cursor:         "pointer",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    flexShrink:     0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          width:          360,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "0 4px",
        }}>
          {/* Left: viewer count — OWNER ONLY */}
          {isOwner ? (
            <div
              onClick={() => {
                setShowViewers((v) => !v);
                setShowShare(false);
                setShowMention(false);
                setShowMore(false);
                setShowComments(false);
              }}
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        6,
                cursor:     "pointer",
                padding:    "4px 0",
                minWidth:   0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {(() => {
                  if (viewCount === 0) return null;
                  const realPreviews = viewerPreviews.slice(0, 3);
                  const merged: { id: string; src: string | null }[] = [
                    ...realPreviews.map((v) => ({
                      id:  v.id,
                      src: v.profile_picture ?? null,
                    })),
                  ];
                  if (merged.length === 0 && user?.profile_picture) {
                    merged.push({ id: "self", src: user.profile_picture });
                  }
                  if (merged.length === 0) return null;
                  return merged.map((v, i) => (
                    <div
                      key={v.id || i}
                      style={{
                        width:        22,
                        height:       22,
                        borderRadius: "50%",
                        border:       "2px solid #0A0A0C",
                        marginLeft:   i > 0 ? -7 : 0,
                        flexShrink:   0,
                        overflow:     "hidden",
                        background:   "linear-gradient(135deg,#6a5acd,#b39ddb)",
                        zIndex:       merged.length - i,
                        position:     "relative",
                      }}
                    >
                      <img
                        src={v.src ?? ""}
                        alt="viewer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        style={{
                          width:     "100%",
                          height:    "100%",
                          objectFit: "cover",
                          display:   v.src ? "block" : "none",
                        }}
                      />
                    </div>
                  ));
                })()}
              </div>
              {viewCount > 0 && (
                <span style={{
                  color:      "rgba(255,255,255,0.55)",
                  fontSize:   11,
                  minWidth:   12,
                  flexShrink: 0,
                }}>
                  {viewCount}
                </span>
              )}
            </div>
          ) : (
            <div style={{ minWidth: 40 }} /> // spacer to keep right buttons aligned
          )}
          {/* Right: action buttons — Like | Comment | Share | Mention | More */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* ❤️ Like — hidden for owner */}
            {!isOwner && (
              <button
                onClick={handleLike}
                style={{
                  display:    "flex", flexDirection: "column", alignItems: "center", gap: 1,
                  background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
                  transform:  likeAnim ? "scale(1.35)" : "scale(1)",
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={hasLiked ? "#e53e3e" : "none"} stroke={hasLiked ? "#e53e3e" : "rgba(255,255,255,0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likeCount > 0 && (
                  <span style={{ color: hasLiked ? "#e53e3e" : "rgba(255,255,255,0.45)", fontSize: 9, lineHeight: 1 }}>{likeCount}</span>
                )}
              </button>
            )}

            {/* 💬 Comment */}
            <button
              onClick={() => {
                setShowComments((v) => !v);
                setShowShare(false);
                setShowMention(false);
                setShowMore(false);
                setShowViewers(false);
              }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: showComments ? "rgba(136,96,217,0.25)" : "rgba(255,255,255,0.07)",
                border: `1px solid ${showComments ? "rgba(136,96,217,0.5)" : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            {/* ↗ Share */}
            <button
              onClick={() => {
                setShowShare((v) => !v);
                setShowMention(false);
                setShowMore(false);
                setShowViewers(false);
                setShowComments(false);
              }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Image src={ShareIconImg} alt="share" width={16} height={16} />
            </button>

            {/* @ Mention — owner only */}
            {isOwner && (
              <button
                onClick={() => {
                  setShowMention((v) => !v);
                  setShowShare(false);
                  setShowMore(false);
                  setShowViewers(false);
                  setShowComments(false);
                }}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Image src={MentionIconImg} alt="mention" width={16} height={16} />
              </button>
            )}

            {/* ⋯ More */}
            <button
              onClick={() => {
                setShowMore((v) => !v);
                setShowShare(false);
                setShowMention(false);
                setShowViewers(false);
                setShowComments(false);
              }}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Image src={MoreIconImg} alt="more" width={16} height={16} />
            </button>
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
      {/* ViewersPanel — owner only */}
      {showViewers && isOwner && (
        <div style={{
          position: "fixed",
          bottom:   24,
          left:     24,
          zIndex:   50,
        }}>
          <ViewersPanel
            fluxId={current?._id ?? ""}
            viewCount={viewCount}
            isOwner={isOwner}
            onClose={() => setShowViewers(false)}
            onDeleteStory={() => { handleDelete(); setShowViewers(false); }}
          />
        </div>
      )}
      {/* ── ShareBar / MentionBar / MoreModal — fixed right side, vertical stack ── */}
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
          onRemoveMention={() => { handleRemoveMention(); setShowMore(false); }}
          isOwner={isOwner}
          isMentioned={isMentioned}
        />
      )}
      {/* ── ShareBar / MentionBar  — right side panel ── */}
      {(showShare || showMention) && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => {
              setShowShare(false);
              setShowMention(false);
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
          </div>
        </>
      )}
      {/* ── CommentSheet — rendered at root level as a bottom sheet ── */}
      {showComments && current && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowComments(false)}
            style={{
              position:       "fixed",
              inset:          0,
              zIndex:         59,
              background:     "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />
          <CommentSheet
            fluxId={current._id}
            isOwner={isOwner}
            onClose={() => setShowComments(false)}
          />
        </>
      )}
    </div>
  );
}
