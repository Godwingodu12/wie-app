"use client";

import React, {
  useEffect, useRef, useState, useCallback,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Heart, MessageCircle, Send, MoreHorizontal } from "lucide-react";
import { getDiaryById, deleteDiary,editDiary  } from "@/services/mediaService";
import type { Diary } from "@/services/mediaService";
import { useAuth } from "@/hooks/useAuth";

const STORY_DURATION = 15_000; // 15 seconds per story
const GRADIENT       = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m    = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DiaryViewPage() {
  const { diaryId }  = useParams<{ diaryId: string }>();
  const router       = useRouter();
  const { user }     = useAuth(true);

  const [diary,    setDiary]    = useState<Diary | null>(null);
  const [idx,      setIdx]      = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused,   setPaused]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [reply,    setReply]    = useState("");
  const [liked,    setLiked]    = useState<Record<number, boolean>>({});
  const [showMore, setShowMore] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting,          setDeleting]          = useState(false);
  const rafRef      = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const stories = diary?.fluxes ?? [];
  const current = stories[idx] ?? null;

  useEffect(() => {
    if (!diaryId) return;
    (async () => {
      try {
        const d = await getDiaryById(diaryId);
        setDiary(d);
      } catch {
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [diaryId]);

const goNext = useCallback(() => {
    setProgress(0);
    pausedAtRef.current = 0;
    setIdx((prev) => {
      if (prev < stories.length - 1) return prev + 1;
      // Stop audio before navigating
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      router.push("/profile");
      return prev;
    });
  }, [stories.length, router]);

  const goPrev = useCallback(() => {
    setProgress(0);
    pausedAtRef.current = 0;
    setIdx((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const startProgress = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    // For video stories use actual duration; for images use 5s
    const duration   = current?.mediaType === "video"
      ? (videoRef.current?.duration ? videoRef.current.duration * 1000 : STORY_DURATION)
      : STORY_DURATION;
    const alreadyMs  = (pausedAtRef.current / 100) * duration;
    const base       = performance.now() - alreadyMs;

    const tick = (now: number) => {
      const pct = Math.min(((now - base) / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        pausedAtRef.current = 0;
        goNext();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [current, goNext]);

useEffect(() => {
    if (paused || loading || stories.length === 0) {
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.pause();
      audioRef.current?.pause();
    } else {
      startProgress();
      videoRef.current?.play().catch(() => {});
      audioRef.current?.play().catch(() => {});
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [idx, paused, loading, stories.length, startProgress]);

  // Music: mount/unmount audio when story changes 
  useEffect(() => {
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current     = null;
    }

    const previewUrl = stories[idx]?.musicPreviewUrl ?? null;

    if (!previewUrl) return;

    const audio      = new Audio(previewUrl);
    audio.loop       = true;
    audio.volume     = 0.5;
    audioRef.current = audio;

    if (!paused && !loading) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [idx, stories]);

  const handlePointerDown = () => {
    pausedAtRef.current = progress;
    setPaused(true);
  };
  const handlePointerUp = () => setPaused(false);

  // Tap navigation
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect  = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const tapX  = e.clientX - rect.left;
    const half  = rect.width / 2;
    if (tapX < half) goPrev();
    else             goNext();
  };

  if (loading) return (
    <div style={{
      height: "100vh", background: "#0A0A0C",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "3px solid #8860D9", borderTopColor: "transparent",
        animation: "spin 0.75s linear infinite",
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!diary || stories.length === 0) return (
    <div style={{
      height: "100vh", background: "#0A0A0C",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <span style={{ fontSize: 48 }}>📔</span>
      <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>No stories in this diary</p>
      <button
        onClick={() => router.back()}
        style={{
          background: GRADIENT, border: "none", borderRadius: 24,
          padding: "10px 24px", color: "#fff", fontSize: 14,
          fontWeight: 600, cursor: "pointer",
        }}
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div style={{
      height:          "100vh",
      background:      "#000",
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      overflow:        "hidden",
      fontFamily:      "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      {/* ── Story card ── */}
      <div style={{
        width:        "min(100vw, 420px)",
        height:       "100vh",
        position:     "relative",
        background:   "#0A0A0C",
        overflow:     "hidden",
        display:      "flex",
        flexDirection: "column",
      }}>

        {/* ── Progress bars ── */}
        <div style={{
          position: "absolute",
          top:      0, left: 0, right: 0,
          padding:  "10px 10px 0",
          display:  "flex",
          gap:      3,
          zIndex:   30,
        }}>
          {stories.map((_, i) => (
            <div
              key={i}
              style={{
                flex:         1,
                height:       3,
                borderRadius: 2,
                background:   "rgba(255,255,255,0.25)",
                overflow:     "hidden",
              }}
            >
              <div style={{
                height:       "100%",
                background:   "#fff",
                borderRadius: 2,
                width: i < idx
                  ? "100%"
                  : i === idx
                  ? `${progress}%`
                  : "0%",
                transition: i === idx ? "none" : undefined,
              }} />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div style={{
          position:  "absolute",
          top:       20,
          left:      0, right: 0,
          padding:   "0 14px",
          display:   "flex",
          alignItems: "center",
          gap:       10,
          zIndex:    30,
        }}>
          {/* Avatar */}
          <div style={{
            width:        36,
            height:       36,
            borderRadius: "50%",
            overflow:     "hidden",
            flexShrink:   0,
            border:       "2px solid rgba(255,255,255,0.3)",
            background:   GRADIENT,
          }}>
            {user?.profile_picture && (
              <img
                src={user.profile_picture}
                alt="avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>

          {/* Username + diary title + time */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                color: "#fff", fontSize: 13, fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user?.username ?? "me"}
              </span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>·</span>
              <span style={{
                color: "#fff", fontSize: 13, fontWeight: 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {diary.title}
              </span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
              {current?.addedAt ? timeAgo(current.addedAt) : ""}
            </span>
          </div>

          {/* Pause indicator dot */}
          {paused && (
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "rgba(255,255,255,0.6)",
              flexShrink: 0,
            }} />
          )}
{/* Edit + Delete + Close buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {/* Edit diary */}
            <button
              onClick={() => {
                setPaused(true);
                router.push(`/profile/diary/new?edit=${diaryId}`);
              }}
              style={{
                background:     "rgba(255,255,255,0.1)",
                border:         "1px solid rgba(255,255,255,0.15)",
                borderRadius:   "50%",
                width:          32,
                height:         32,
                cursor:         "pointer",
                color:          "#fff",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       14,
              }}
              title="Edit diary"
            >
              ✏️
            </button>

            {/* Delete diary */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background:     "rgba(229,62,62,0.15)",
                border:         "1px solid rgba(229,62,62,0.3)",
                borderRadius:   "50%",
                width:          32,
                height:         32,
                cursor:         "pointer",
                color:          "#E53E3E",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       14,
              }}
              title="Delete diary"
            >
              🗑️
            </button>

            {/* Close */}
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current = null;
                }
                router.push("/profile");
              }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,0.75)",
                display: "flex", padding: 4,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── Media — tap zones on top ── */}
        <div
          style={{ flex: 1, position: "relative", cursor: "pointer" }}
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
          onClick={handleTap}
        >
          {/* Media content */}
          {current ? (
            current.mediaType === "video" ? (
              <video
                key={current.fluxId}
                ref={videoRef}
                src={current.mediaUrl}
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                muted
                playsInline
                onLoadedData={() => { if (!paused) videoRef.current?.play().catch(() => {}); }}
              />
            ) : (
              <img
                key={current.fluxId}
                src={current.mediaUrl}
                alt="story"
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
              />
            )
          ) : (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg,#1a1a2e,#2d1b4e)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 48 }}>📔</span>
            </div>
          )}
          {/* Music badge — shows when story has music */}
          {current?.musicTitle && (
            <div style={{
              position:       "absolute",
              top:            70,
              left:           14,
              zIndex:         6,
              display:        "flex",
              alignItems:     "center",
              gap:            8,
              padding:        "6px 12px 6px 6px",
              borderRadius:   22,
              background:     "rgba(0,0,0,0.58)",
              backdropFilter: "blur(10px)",
              border:         "1px solid rgba(255,255,255,0.12)",
              maxWidth:       200,
            }}>
              {current.musicAlbumArt ? (
                <img
                  src={current.musicAlbumArt}
                  alt="album"
                  style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: "linear-gradient(135deg,#8860D9,#B3B8E2)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                }}>
                  🎵
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  color: "#fff", fontSize: 11, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {current.musicTitle}
                </p>
                {current.musicArtist && (
                  <p style={{
                    color: "rgba(255,255,255,0.55)", fontSize: 10,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {current.musicArtist}
                  </p>
                )}
              </div>
              {!paused && (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 14, flexShrink: 0 }}>
                  {[0.6, 1, 0.75].map((h, i) => (
                    <div key={i} style={{
                      width: 3, height: `${h * 100}%`, borderRadius: 2, background: "#fff",
                      animation: "eq-bounce 0.8s ease-in-out infinite alternate",
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                  <style>{`@keyframes eq-bounce{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}`}</style>
                </div>
              )}
            </div>
          )}
          {/* Caption overlay */}
          {current?.caption && (
            <div style={{
              position:   "absolute",
              bottom:     80,
              left:       16, right: 16,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding:    "8px 12px",
              pointerEvents: "none",
            }}>
              <p style={{ color: "#fff", fontSize: 13, lineHeight: 1.4 }}>
                {current.caption}
              </p>
            </div>
          )}

          {/* Tap zone indicators (invisible, just for ux) */}
          <div style={{
            position: "absolute", inset: 0,
            display:  "flex", pointerEvents: "none",
          }}>
            <div style={{ flex: 1 }} />
            <div style={{ flex: 1 }} />
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          position:   "absolute",
          bottom:     0, left: 0, right: 0,
          background: "linear-gradient(0deg,rgba(0,0,0,0.75) 0%,transparent 100%)",
          padding:    "16px 16px 24px",
          zIndex:     20,
        }}>
          {/* Reply input */}
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            marginBottom: 14,
          }}>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              placeholder={`Reply to ${diary.title}…`}
              style={{
                flex:         1,
                height:       40,
                borderRadius: 20,
                background:   "rgba(255,255,255,0.1)",
                border:       "1px solid rgba(255,255,255,0.18)",
                padding:      "0 16px",
                color:        "#fff",
                fontSize:     13,
                outline:      "none",
                boxSizing:    "border-box",
              }}
            />
            {reply.trim() && (
              <button
                onClick={() => setReply("")}
                style={{
                  width:           36,
                  height:          36,
                  borderRadius:    "50%",
                  background:      GRADIENT,
                  border:          "none",
                  cursor:          "pointer",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  flexShrink:      0,
                }}
              >
                <Send size={16} color="#fff" />
              </button>
            )}
          </div>

          {/* Action icons row */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-around",
          }}>
            {/* Like */}
            <button
              onClick={() => setLiked((p) => ({ ...p, [idx]: !p[idx] }))}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
              }}
            >
              <Heart
                size={24}
                color={liked[idx] ? "#E91E8C" : "#fff"}
                fill={liked[idx] ? "#E91E8C" : "none"}
                strokeWidth={liked[idx] ? 0 : 2}
                style={{ transition: "all 0.2s" }}
              />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Like</span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setPaused((p) => !p)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
              }}
            >
              <MessageCircle size={24} color="#fff" />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Reply</span>
            </button>

            {/* Share */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/profile/diary/${diaryId}`
                );
              }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
              }}
            >
              <Send size={24} color="#fff" />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>Share</span>
            </button>

            {/* More */}
            <button
              onClick={() => { setShowMore((v) => !v); setPaused(true); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3,
              }}
            >
              <MoreHorizontal size={24} color="#fff" />
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>More</span>
            </button>
          </div>
        </div>

        {/* ── More options sheet ── */}
        {showMore && (
          <>
            <div
              onClick={() => { setShowMore(false); setPaused(false); }}
              style={{
                position: "fixed", inset: 0, zIndex: 40,
                background: "rgba(0,0,0,0.5)",
              }}
            />
            <div style={{
              position:      "absolute",
              bottom:        0, left: 0, right: 0,
              background:    "#1a1a1f",
              borderRadius:  "20px 20px 0 0",
              padding:       "8px 0 32px",
              zIndex:        50,
              border:        "1px solid rgba(255,255,255,0.08)",
            }}>
              {/* Handle */}
              <div style={{
                width:        36, height: 4,
                borderRadius: 2,
                background:   "rgba(255,255,255,0.2)",
                margin:       "8px auto 16px",
              }} />

              {[
                { label: "Save Story",    icon: "💾", action: () => {} },
                { label: "Copy Link",     icon: "🔗", action: () => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/profile/diary/${diaryId}`
                  );
                }},
                { label: "Edit Diary",    icon: "✏️",  action: () => router.push(`/profile/diary/edit/${diaryId}`) },
                { label: "Delete Story",  icon: "🗑️",  action: () => {}, danger: true },
              ].map(({ label, icon, action, danger }) => (
                <button
                  key={label}
                  onClick={() => { action(); setShowMore(false); setPaused(false); }}
                  style={{
                    width:      "100%",
                    background: "none",
                    border:     "none",
                    padding:    "14px 24px",
                    display:    "flex",
                    alignItems: "center",
                    gap:        14,
                    cursor:     "pointer",
                    textAlign:  "left",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{
                    fontSize:   15,
                    fontWeight: 500,
                    color:      (danger as any) ? "#E53E3E" : "#fff",
                  }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── End screen ── */}
        {idx === stories.length - 1 && progress >= 99 && (
          <div style={{
            position:        "absolute",
            inset:           0,
            background:      "rgba(0,0,0,0.85)",
            display:         "flex",
            flexDirection:   "column",
            alignItems:      "center",
            justifyContent:  "center",
            gap:             20,
            zIndex:          40,
          }}>
            <div style={{ fontSize: 52 }}>📔</div>
            <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
              End of {diary.title}
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              {stories.length} {stories.length === 1 ? "story" : "stories"}
            </p>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current = null;
                }
                router.push("/profile");
              }}
              style={{
                background:   GRADIENT,
                border:       "none",
                borderRadius: 24,
                padding:      "12px 32px",
                color:        "#fff",
                fontSize:     15,
                fontWeight:   600,
                cursor:       "pointer",
                marginTop:    8,
              }}
            >
              Back to Profile
            </button>
          </div>
        )}
      {/* ── Delete confirm modal ── */}
        {showDeleteConfirm && (
          <>
            <div
              onClick={() => { setShowDeleteConfirm(false); setPaused(false); }}
              style={{
                position: "fixed", inset: 0, zIndex: 60,
                background: "rgba(0,0,0,0.7)",
              }}
            />
            <div style={{
              position:        "absolute",
              top:             "50%",
              left:            "50%",
              transform:       "translate(-50%,-50%)",
              background:      "#1a1a1f",
              borderRadius:    20,
              padding:         "28px 24px",
              zIndex:          70,
              width:           280,
              border:          "1px solid rgba(255,255,255,0.1)",
              textAlign:       "center",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                Delete Diary?
              </p>
              <p style={{
                color:        "rgba(255,255,255,0.5)",
                fontSize:     13,
                lineHeight:   1.5,
                marginBottom: 24,
              }}>
                "{diary?.title}" will be permanently deleted. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setPaused(false); }}
                  style={{
                    flex:         1,
                    height:       44,
                    borderRadius: 22,
                    background:   "rgba(255,255,255,0.08)",
                    border:       "1px solid rgba(255,255,255,0.12)",
                    color:        "#fff",
                    fontSize:     14,
                    fontWeight:   600,
                    cursor:       "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await deleteDiary(diaryId);
                      router.push("/profile");
                    } catch {
                      setDeleting(false);
                      setShowDeleteConfirm(false);
                    }
                  }}
                  disabled={deleting}
                  style={{
                    flex:         1,
                    height:       44,
                    borderRadius: 22,
                    background:   "#E53E3E",
                    border:       "none",
                    color:        "#fff",
                    fontSize:     14,
                    fontWeight:   600,
                    cursor:       deleting ? "wait" : "pointer",
                    opacity:      deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}