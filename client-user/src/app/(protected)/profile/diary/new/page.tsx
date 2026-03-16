"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, X, ZoomIn, ZoomOut } from "lucide-react";
import { getAllMyFluxes, createDiary } from "@/services/mediaService";
import type { Flux } from "@/services/mediaService";

const GRADIENT = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

export default function NewDiaryPage() {
  const router = useRouter();

  const [archivedFluxes, setArchivedFluxes]     = useState<Flux[]>([]);
  const [loading,        setLoading]            = useState(true);
  const [selectedIds,    setSelectedIds]        = useState<string[]>([]);
  const [diaryTitle,     setDiaryTitle]         = useState("");
  const [coverFluxId,    setCoverFluxId]        = useState<string | null>(null);
  const [showCoverEditor, setShowCoverEditor]   = useState(false);
  const [zoom,           setZoom]               = useState(1);
  const [creating,       setCreating]           = useState(false);
  const [step,           setStep]               = useState<"select" | "name">("select");

useEffect(() => {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('token')
         ?? localStorage.getItem('accessToken')
         ?? localStorage.getItem('wie_token'))
      : null;

    if (!token) {
      console.warn('[DiaryNew] No auth token found — cannot fetch fluxes');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const all = await getAllMyFluxes();
        setArchivedFluxes(all);
        console.log(`[DiaryNew] Loaded ${all.length} fluxes for diary picker`);
      } catch (e) {
        console.error('[DiaryNew] Failed to load fluxes:', e);
        setArchivedFluxes([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const coverFlux = coverFluxId
    ? archivedFluxes.find((f) => f._id === coverFluxId)
    : selectedIds.length > 0
    ? archivedFluxes.find((f) => f._id === selectedIds[0])
    : null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // Auto-set cover to first selected
    if (selectedIds.length === 0 && !coverFluxId) {
      setCoverFluxId(id);
    }
  };

    const handleCreate = async () => {
        if (!diaryTitle.trim() || selectedIds.length === 0) return;
        setCreating(true);
        try {
        // Build cover file from the selected cover flux if it's an image
        let coverFile: File | undefined;
        if (coverFlux?.mediaUrl && coverFlux.mediaType === "image") {
            try {
            const resp  = await fetch(coverFlux.mediaUrl);
            const blob  = await resp.blob();
            coverFile   = new File([blob], "diary-cover.jpg", { type: blob.type || "image/jpeg" });
            } catch {
            // Cover fetch failed — backend will auto-use first flux
            }
        }

        await createDiary({
            title:      diaryTitle.trim(),
            visibility: "followers",
            fluxIds:    selectedIds,       // ← send all selected flux IDs
            coverFile,                     // ← send cover if available
        });
        router.push("/profile");
        } catch (e) {
        console.error("Failed to create diary:", e);
        } finally {
        setCreating(false);
        }
    };

  return (
    <div style={{
      minHeight:   "100vh",
      background:  "#0A0A0C",
      color:       "#fff",
      fontFamily:  "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      display:     "flex",
      flexDirection: "column",
    }}>

      {/* ── Top Navigation ── */}
      <div style={{
        height:          56,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        padding:         "0 16px",
        borderBottom:    "1px solid rgba(255,255,255,0.08)",
        background:      "#0A0A0C",
        position:        "sticky",
        top:             0,
        zIndex:          30,
        flexShrink:      0,
      }}>
        <button
          onClick={() => step === "name" ? setStep("select") : router.back()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#fff", display: "flex", alignItems: "center", gap: 6,
            fontSize: 15, fontWeight: 500,
          }}
        >
          <ChevronLeft size={22} />
          Back
        </button>

        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
          New Diary
        </span>

        {step === "select" ? (
          <button
            onClick={() => selectedIds.length > 0 && setStep("name")}
            disabled={selectedIds.length === 0}
            style={{
              background:  selectedIds.length > 0 ? GRADIENT : "rgba(255,255,255,0.1)",
              border:      "none",
              borderRadius: 20,
              padding:     "7px 16px",
              color:       "#fff",
              fontSize:    14,
              fontWeight:  600,
              cursor:      selectedIds.length > 0 ? "pointer" : "default",
              opacity:     selectedIds.length > 0 ? 1 : 0.4,
              transition:  "all 0.2s",
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!diaryTitle.trim() || creating}
            style={{
              background:  diaryTitle.trim() ? GRADIENT : "rgba(255,255,255,0.1)",
              border:      "none",
              borderRadius: 20,
              padding:     "7px 16px",
              color:       "#fff",
              fontSize:    14,
              fontWeight:  600,
              cursor:      diaryTitle.trim() ? "pointer" : "default",
              opacity:     diaryTitle.trim() ? 1 : 0.4,
              transition:  "all 0.2s",
            }}
          >
            {creating ? "Creating…" : "Done"}
          </button>
        )}
      </div>

      {/* ── Step 1: Select Stories ── */}
      {step === "select" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 100px 0" }}>

          {/* Selection count pill */}
          {selectedIds.length > 0 && (
            <div style={{
              padding:        "10px 16px",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
            }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => setSelectedIds([])}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.4)", fontSize: 12,
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Section label */}
          <div style={{ padding: "12px 16px 8px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Previous Fluxes
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: "3px solid #8860D9", borderTopColor: "transparent",
                animation: "spin 0.75s linear infinite",
              }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : archivedFluxes.length === 0 ? (
            /* Empty state */
            <div style={{
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              padding:        "60px 24px",
              gap:            16,
            }}>
              <div style={{ fontSize: 52 }}>📷</div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
                No Stories Available
              </p>
              <p style={{
                color:      "rgba(255,255,255,0.4)",
                fontSize:   13,
                textAlign:  "center",
                lineHeight: 1.5,
              }}>
                Create a story to add it to your diary highlights.
              </p>
              <button
                onClick={() => router.push("/post/flux")}
                style={{
                  background:   GRADIENT,
                  border:       "none",
                  borderRadius: 24,
                  padding:      "12px 28px",
                  color:        "#fff",
                  fontSize:     14,
                  fontWeight:   600,
                  cursor:       "pointer",
                  marginTop:    8,
                }}
              >
                Create Story
              </button>
            </div>
          ) : (
            /* 3-column story grid */
            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap:                 3,
              padding:             "0 3px",
            }}>
              {archivedFluxes.map((flux) => {
                const isSelected = selectedIds.includes(flux._id);
                const selIdx     = selectedIds.indexOf(flux._id) + 1;

                return (
                  <div
                    key={flux._id}
                    onClick={() => toggleSelect(flux._id)}
                    style={{
                      position:     "relative",
                      aspectRatio:  "9/16",
                      cursor:       "pointer",
                      borderRadius: 8,
                      overflow:     "hidden",
                      border:       isSelected
                        ? "2.5px solid #8860D9"
                        : "2.5px solid transparent",
                      transition:   "all 0.15s",
                    }}
                  >
                    {/* Thumbnail */}
                    {flux.mediaType === "video" ? (
                      <div style={{
                        width: "100%", height: "100%",
                        background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <span style={{ fontSize: 28 }}>🎬</span>
                      </div>
                    ) : (
                      <img
                        src={flux.mediaUrl}
                        alt="story"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}

                    {/* Selected overlay */}
                    {isSelected && (
                      <div style={{
                        position:   "absolute",
                        inset:      0,
                        background: "rgba(136,96,217,0.35)",
                      }} />
                    )}

                    {/* Checkmark badge */}
                    <div style={{
                      position:        "absolute",
                      top:             8,
                      right:           8,
                      width:           24,
                      height:          24,
                      borderRadius:    "50%",
                      background:      isSelected ? GRADIENT : "rgba(0,0,0,0.4)",
                      border:          isSelected ? "none" : "1.5px solid rgba(255,255,255,0.5)",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      transition:      "all 0.15s",
                    }}>
                      {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                    </div>

                    {/* Selection order number */}
                    {isSelected && (
                      <div style={{
                        position:        "absolute",
                        bottom:          8,
                        left:            8,
                        width:           20,
                        height:          20,
                        borderRadius:    "50%",
                        background:      "#8860D9",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        fontSize:        10,
                        fontWeight:      700,
                        color:           "#fff",
                      }}>
                        {selIdx}
                      </div>
                    )}

                    {/* Music badge if has music */}
                    {flux.musicTitle && (
                      <div style={{
                        position:   "absolute",
                        bottom:     8,
                        right:      8,
                        background: "rgba(0,0,0,0.55)",
                        borderRadius: 10,
                        padding:    "2px 6px",
                        fontSize:   9,
                        color:      "#fff",
                        display:    "flex",
                        alignItems: "center",
                        gap:        3,
                      }}>
                        🎵
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Name + Cover ── */}
      {step === "name" && (
        <div style={{
          flex:           1,
          overflowY:      "auto",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          padding:        "32px 24px 100px",
          gap:            28,
        }}>

          {/* Cover preview circle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              onClick={() => setShowCoverEditor(true)}
              style={{
                width:        100,
                height:       100,
                borderRadius: "50%",
                overflow:     "hidden",
                border:       "2px solid rgba(255,255,255,0.2)",
                cursor:       "pointer",
                background:   "#1a1a1a",
                flexShrink:   0,
                position:     "relative",
              }}
            >
              {coverFlux?.mediaUrl && coverFlux.mediaType === "image" ? (
                <img
                  src={coverFlux.mediaUrl}
                  alt="cover"
                  style={{
                    width:      "100%",
                    height:     "100%",
                    objectFit:  "cover",
                    transform:  `scale(${zoom})`,
                    transition: "transform 0.2s",
                  }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: GRADIENT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32,
                }}>
                  📔
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCoverEditor(!showCoverEditor)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#8860D9", fontSize: 13, fontWeight: 600,
              }}
            >
              Edit Cover
            </button>
          </div>

          {/* Cover Editor inline panel */}
          {showCoverEditor && (
            <div style={{
              width:        "100%",
              maxWidth:     400,
              background:   "rgba(255,255,255,0.05)",
              borderRadius: 16,
              border:       "1px solid rgba(255,255,255,0.1)",
              padding:      "20px 16px",
              display:      "flex",
              flexDirection: "column",
              gap:          16,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Edit Cover</span>
                <button
                  onClick={() => setShowCoverEditor(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Zoom slider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ZoomOut size={16} color="rgba(255,255,255,0.4)" />
                <input
                  type="range"
                  min={1}
                  max={2}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: "#8860D9" }}
                />
                <ZoomIn size={16} color="rgba(255,255,255,0.4)" />
              </div>

              {/* Story frame selector */}
              <div>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Story Frames
                </p>
                <div style={{
                  display:        "flex",
                  gap:            8,
                  overflowX:      "auto",
                  paddingBottom:  4,
                }}>
                  {archivedFluxes
                    .filter((f) => selectedIds.includes(f._id) && f.mediaType === "image")
                    .map((flux) => (
                      <div
                        key={flux._id}
                        onClick={() => { setCoverFluxId(flux._id); setZoom(1); }}
                        style={{
                          width:        56,
                          height:       80,
                          borderRadius: 8,
                          overflow:     "hidden",
                          flexShrink:   0,
                          cursor:       "pointer",
                          border:       coverFluxId === flux._id
                            ? "2px solid #8860D9"
                            : "2px solid transparent",
                          transition:   "border 0.15s",
                        }}
                      >
                        <img
                          src={flux.mediaUrl}
                          alt="frame"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setShowCoverEditor(false)}
                style={{
                  background:   GRADIENT,
                  border:       "none",
                  borderRadius: 20,
                  padding:      "10px 0",
                  color:        "#fff",
                  fontWeight:   600,
                  fontSize:     14,
                  cursor:       "pointer",
                  width:        "100%",
                }}
              >
                Done
              </button>
            </div>
          )}

          {/* Diary name input */}
          <div style={{ width: "100%", maxWidth: 400 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Diary Name
            </label>
            <input
              type="text"
              value={diaryTitle}
              onChange={(e) => setDiaryTitle(e.target.value.slice(0, 20))}
              placeholder="Travel, Food, Memories…"
              maxLength={20}
              style={{
                width:        "100%",
                height:       48,
                borderRadius: 12,
                background:   "rgba(255,255,255,0.07)",
                border:       "1px solid rgba(255,255,255,0.12)",
                color:        "#fff",
                fontSize:     16,
                fontWeight:   500,
                padding:      "0 16px",
                outline:      "none",
                boxSizing:    "border-box",
                textAlign:    "center",
              }}
            />
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "right", marginTop: 6 }}>
              {diaryTitle.length}/20
            </p>
          </div>

          {/* Selected stories preview row */}
          <div style={{ width: "100%", maxWidth: 400 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
              {selectedIds.length} {selectedIds.length === 1 ? "Story" : "Stories"} Selected
            </p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {selectedIds.map((id) => {
                const flux = archivedFluxes.find((f) => f._id === id);
                if (!flux) return null;
                return (
                  <div
                    key={id}
                    style={{
                      width:        48,
                      height:       68,
                      borderRadius: 8,
                      overflow:     "hidden",
                      flexShrink:   0,
                      position:     "relative",
                    }}
                  >
                    {flux.mediaType === "image" ? (
                      <img
                        src={flux.mediaUrl}
                        alt="story"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%",
                        background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 18,
                      }}>🎬</div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => toggleSelect(id)}
                      style={{
                        position:        "absolute",
                        top:             2,
                        right:           2,
                        width:           16,
                        height:          16,
                        borderRadius:    "50%",
                        background:      "rgba(0,0,0,0.7)",
                        border:          "none",
                        cursor:          "pointer",
                        display:         "flex",
                        alignItems:      "center",
                        justifyContent:  "center",
                        padding:         0,
                      }}
                    >
                      <X size={9} color="#fff" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Create Button (Step 1 only) ── */}
      {step === "select" && selectedIds.length > 0 && (
        <div style={{
          position:       "fixed",
          bottom:         0,
          left:           0,
          right:          0,
          padding:        "16px 24px 28px",
          background:     "linear-gradient(0deg,#0A0A0C 60%,transparent 100%)",
          zIndex:         20,
        }}>
          <button
            onClick={() => setStep("name")}
            style={{
              width:        "100%",
              height:       52,
              borderRadius: 26,
              background:   GRADIENT,
              border:       "none",
              color:        "#fff",
              fontSize:     16,
              fontWeight:   700,
              cursor:       "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Create Diary ({selectedIds.length})
          </button>
        </div>
      )}
    </div>
  );
}