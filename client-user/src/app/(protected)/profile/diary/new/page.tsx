"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Check, X, ZoomIn, ZoomOut, Upload, Image as ImageIcon,
} from "lucide-react";
import { getAllMyFluxes, getDiaryById, createDiary } from "@/services/mediaService";
import type { Flux } from "@/services/mediaService";

const GRADIENT = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

// ── Cover source: a device-uploaded file, OR a flux selected from the grid ──
type CoverSource =
  | { type: "device"; file: File; previewUrl: string }
  | { type: "flux";   fluxId: string; url: string }
  | null;

export default function NewDiaryPage() {
  const router = useRouter();

  const [archivedFluxes,   setArchivedFluxes]   = useState<Flux[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [selectedIds,      setSelectedIds]      = useState<string[]>([]);
  const [diaryTitle,       setDiaryTitle]       = useState("");
  const [coverSource,      setCoverSource]      = useState<CoverSource>(null);
  const [showCoverEditor,  setShowCoverEditor]  = useState(false);
  const [zoom,             setZoom]             = useState(1);
  const [creating,         setCreating]         = useState(false);
  const [step,             setStep]             = useState<"select" | "name">("select");
  // Tab inside the cover editor
  const [coverTab, setCoverTab] = useState<"device" | "flux">("flux");

  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // ── Edit mode: is there a ?edit= param? ──────────────────────────────────
  const editId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("edit")
      : null;

  useEffect(() => {
    (async () => {
      try {
        const all = await getAllMyFluxes();
        setArchivedFluxes(all);

        if (editId) {
          const existing = await getDiaryById(editId);
          setDiaryTitle(existing.title);
          const ids = existing.fluxes.map((f: any) => f.fluxId);
          setSelectedIds(ids);
          // Pre-set cover to first flux image if diary has a coverImage
          if (existing.coverImage && ids.length > 0) {
            // Try to match cover to a known flux
            const matchedFlux = all.find((f) => f.mediaUrl === existing.coverImage && ids.includes(f._id));
            if (matchedFlux) {
              setCoverSource({ type: "flux", fluxId: matchedFlux._id, url: matchedFlux.mediaUrl });
            }
          }
        }
      } catch (e) {
        console.error("[DiaryNew] Failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Derived: what URL/File to use as the effective cover ─────────────────
  // Priority: 1. device upload  2. selected flux  3. last selected image flux
  const effectiveCoverUrl: string | null = (() => {
    if (coverSource?.type === "device") return coverSource.previewUrl;
    if (coverSource?.type === "flux")   return coverSource.url;
    // Fallback: last added image flux from selectedIds
    const lastImageFlux = [...selectedIds]
      .reverse()
      .map((id) => archivedFluxes.find((f) => f._id === id))
      .find((f) => f && f.mediaType === "image");
    return lastImageFlux?.mediaUrl ?? null;
  })();

  // ── Device file picker handler ────────────────────────────────────────────
  const handleDeviceFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    setCoverSource({ type: "device", file, previewUrl });
    setZoom(1);
    // Reset input so re-picking the same file triggers onChange again
    e.target.value = "";
  }, []);

  // ── Flux selection toggle ─────────────────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // If removing the flux that was the cover source, clear cover source
        if (coverSource?.type === "flux" && coverSource.fluxId === id) {
          setCoverSource(null);
        }
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  // ── Create / Edit handler ─────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!diaryTitle.trim() || selectedIds.length === 0) return;
    setCreating(true);
    try {
      // Resolve the cover file to upload
      let coverFile: File | undefined;

      if (coverSource?.type === "device") {
        // User picked from device — upload this directly
        coverFile = coverSource.file;
      } else {
        // Use a flux image as cover: fetch its URL and convert to File
        const coverUrl =
          coverSource?.type === "flux"
            ? coverSource.url
            : // fallback: last image flux
              [...selectedIds]
                .reverse()
                .map((id) => archivedFluxes.find((f) => f._id === id))
                .find((f) => f && f.mediaType === "image")?.mediaUrl ?? null;

        if (coverUrl) {
          try {
            const resp = await fetch(coverUrl);
            const blob = await resp.blob();
            coverFile  = new File([blob], "diary-cover.jpg", {
              type: blob.type || "image/jpeg",
            });
          } catch {
            // Non-fatal — server will use first flux if no cover
          }
        }
      }

      if (editId) {
        const {
          editDiary, addFluxToDiary, removeFluxFromDiary, getDiaryById: getById,
        } = await import("@/services/mediaService");

        const current    = await getById(editId);
        const currentIds = new Set(current.fluxes.map((f: any) => f.fluxId));
        const newIds     = new Set(selectedIds);

        for (const id of selectedIds) {
          if (!currentIds.has(id)) await addFluxToDiary(editId, id).catch(() => {});
        }
        for (const f of current.fluxes) {
          if (!newIds.has(f.fluxId)) await removeFluxFromDiary(editId, f.fluxId).catch(() => {});
        }
        await editDiary(editId, { title: diaryTitle.trim(), coverFile });
      } else {
        await createDiary({
          title:      diaryTitle.trim(),
          visibility: "followers",
          fluxIds:    selectedIds,
          coverFile,
        });
      }

      router.push("/profile");
    } catch (e) {
      console.error("Failed to save diary:", e);
    } finally {
      setCreating(false);
    }
  };

  // ── Image fluxes available in current selection (for flux cover picker) ──
  const imageFluxesInSelection = archivedFluxes.filter(
    (f) => selectedIds.includes(f._id) && f.mediaType === "image",
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0C", color: "#fff",
      fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      display: "flex", flexDirection: "column",
    }}>

      {/* ── Top Nav ── */}
      <div style={{
        height: 56, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 16px",
        borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0A0A0C",
        position: "sticky", top: 0, zIndex: 30, flexShrink: 0,
      }}>
        <button
          onClick={() => step === "name" ? setStep("select") : router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 500 }}
        >
          <ChevronLeft size={22} /> Back
        </button>

        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
          {editId ? "Edit Diary" : "New Diary"}
        </span>

        {step === "select" ? (
          <button
            onClick={() => selectedIds.length > 0 && setStep("name")}
            disabled={selectedIds.length === 0}
            style={{
              background: selectedIds.length > 0 ? GRADIENT : "rgba(255,255,255,0.1)",
              border: "none", borderRadius: 20, padding: "7px 16px",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: selectedIds.length > 0 ? "pointer" : "default",
              opacity: selectedIds.length > 0 ? 1 : 0.4, transition: "all 0.2s",
            }}
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={!diaryTitle.trim() || creating}
            style={{
              background: diaryTitle.trim() ? GRADIENT : "rgba(255,255,255,0.1)",
              border: "none", borderRadius: 20, padding: "7px 16px",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: diaryTitle.trim() ? "pointer" : "default",
              opacity: diaryTitle.trim() ? 1 : 0.4, transition: "all 0.2s",
            }}
          >
            {creating ? "Saving…" : "Done"}
          </button>
        )}
      </div>

      {/* ══ STEP 1: Select Stories ══════════════════════════════════════════ */}
      {step === "select" && (
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
          {selectedIds.length > 0 && (
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={() => { setSelectedIds([]); setCoverSource(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}
              >
                Clear all
              </button>
            </div>
          )}

          <div style={{ padding: "12px 16px 8px" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Your Fluxes
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #8860D9", borderTopColor: "transparent", animation: "spin 0.75s linear infinite" }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : archivedFluxes.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", gap: 16 }}>
              <div style={{ fontSize: 52 }}>📷</div>
              <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>No Fluxes Available</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", lineHeight: 1.5 }}>
                Create a flux to add it to your diary.
              </p>
              <button
                onClick={() => router.push("/post/flux")}
                style={{ background: GRADIENT, border: "none", borderRadius: 24, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
              >
                Create Flux
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, padding: "0 3px" }}>
              {archivedFluxes.map((flux) => {
                const isSelected = selectedIds.includes(flux._id);
                const selIdx     = selectedIds.indexOf(flux._id) + 1;
                return (
                  <div
                    key={flux._id}
                    onClick={() => toggleSelect(flux._id)}
                    style={{
                      position: "relative", aspectRatio: "9/16", cursor: "pointer",
                      borderRadius: 8, overflow: "hidden",
                      border: isSelected ? "2.5px solid #8860D9" : "2.5px solid transparent",
                      transition: "all 0.15s",
                    }}
                  >
                    {flux.mediaType === "video" ? (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 28 }}>🎬</span>
                      </div>
                    ) : (
                      <img src={flux.mediaUrl} alt="story" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                    {isSelected && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(136,96,217,0.35)" }} />
                    )}
                    <div style={{
                      position: "absolute", top: 8, right: 8, width: 24, height: 24,
                      borderRadius: "50%", background: isSelected ? GRADIENT : "rgba(0,0,0,0.4)",
                      border: isSelected ? "none" : "1.5px solid rgba(255,255,255,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                    }}>
                      {isSelected && <Check size={13} color="#fff" strokeWidth={3} />}
                    </div>
                    {isSelected && (
                      <div style={{
                        position: "absolute", bottom: 8, left: 8, width: 20, height: 20,
                        borderRadius: "50%", background: "#8860D9",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "#fff",
                      }}>
                        {selIdx}
                      </div>
                    )}
                    {flux.musicTitle && (
                      <div style={{
                        position: "absolute", bottom: 8, right: 8,
                        background: "rgba(0,0,0,0.55)", borderRadius: 10,
                        padding: "2px 6px", fontSize: 9, color: "#fff",
                        display: "flex", alignItems: "center", gap: 3,
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

      {/* ══ STEP 2: Name + Cover ════════════════════════════════════════════ */}
      {step === "name" && (
        <div style={{
          flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
          alignItems: "center", padding: "32px 24px 100px", gap: 28,
        }}>

          {/* ── Cover Preview ── */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {/* Circle preview */}
            <div
              onClick={() => setShowCoverEditor(true)}
              style={{
                width: 100, height: 100, borderRadius: "50%", overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.2)", cursor: "pointer",
                background: "#1a1a1a", flexShrink: 0, position: "relative",
              }}
            >
              {effectiveCoverUrl ? (
                <img
                  src={effectiveCoverUrl}
                  alt="cover"
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transition: "transform 0.2s" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: GRADIENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                  📔
                </div>
              )}
              {/* Edit overlay hint */}
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%", opacity: 0, transition: "opacity 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
              >
                <ImageIcon size={22} color="#fff" />
              </div>
            </div>

            <button
              onClick={() => setShowCoverEditor(!showCoverEditor)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8860D9", fontSize: 13, fontWeight: 600 }}
            >
              {showCoverEditor ? "Close Editor" : "Edit Cover"}
            </button>
          </div>

          {/* ── Cover Editor Panel ── */}
          {showCoverEditor && (
            <div style={{
              width: "100%", maxWidth: 400,
              background: "rgba(255,255,255,0.05)", borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
            }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                {([
                  { key: "flux",   label: "From Selection", icon: <ImageIcon size={13} /> },
                  { key: "device", label: "Upload Photo",   icon: <Upload size={13} /> },
                ] as const).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setCoverTab(key)}
                    style={{
                      flex: 1, padding: "12px 8px", background: "transparent", border: "none",
                      borderBottom: coverTab === key ? "2px solid #8860D9" : "2px solid transparent",
                      color: coverTab === key ? "#fff" : "rgba(255,255,255,0.4)",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      transition: "all 0.15s",
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              <div style={{ padding: "16px" }}>
                {/* ── TAB: Upload from device ── */}
                {coverTab === "device" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Hidden file input */}
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleDeviceFile}
                    />

                    {/* Upload zone */}
                    <button
                      onClick={() => coverFileInputRef.current?.click()}
                      style={{
                        width: "100%", padding: "28px 16px", borderRadius: 14,
                        border: "2px dashed rgba(136,96,217,0.4)",
                        background: "rgba(136,96,217,0.06)", cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#8860D9"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(136,96,217,0.12)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(136,96,217,0.4)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(136,96,217,0.06)"; }}
                    >
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(136,96,217,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Upload size={20} color="#9575CD" />
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: "0 0 3px" }}>
                          {coverSource?.type === "device" ? "Replace photo" : "Choose a photo"}
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0 }}>
                          JPG, PNG, WEBP · any size
                        </p>
                      </div>
                    </button>

                    {/* Preview of uploaded photo */}
                    {coverSource?.type === "device" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <img
                          src={coverSource.previewUrl}
                          alt="uploaded cover"
                          style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "#22c55e", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>✓ Photo selected</p>
                          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {coverSource.file.name}
                          </p>
                        </div>
                        <button
                          onClick={() => setCoverSource(null)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0 }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB: Select from flux frames ── */}
                {coverTab === "flux" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {imageFluxesInSelection.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "28px 12px" }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🖼️</div>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                          No image fluxes selected yet.
                        </p>
                        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>
                          Go back and select some image fluxes, or upload a photo.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: 0 }}>
                          Tap a frame to set as cover
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                          {imageFluxesInSelection.map((flux) => {
                            const isCover =
                              coverSource?.type === "flux" && coverSource.fluxId === flux._id;
                            // Also highlight if fallback cover (no source set, this is the last image)
                            const isFallback =
                              !coverSource &&
                              [...selectedIds].reverse()
                                .map((id) => archivedFluxes.find((f) => f._id === id))
                                .find((f) => f && f.mediaType === "image")?._id === flux._id;
                            const isActive = isCover || isFallback;

                            return (
                              <div
                                key={flux._id}
                                onClick={() => {
                                  setCoverSource({ type: "flux", fluxId: flux._id, url: flux.mediaUrl });
                                  setZoom(1);
                                }}
                                style={{
                                  aspectRatio: "1 / 1.4", borderRadius: 10, overflow: "hidden",
                                  cursor: "pointer", position: "relative",
                                  border: isActive ? "2.5px solid #8860D9" : "2.5px solid transparent",
                                  transition: "border 0.15s",
                                }}
                              >
                                <img
                                  src={flux.mediaUrl}
                                  alt="frame"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                                {isActive && (
                                  <div style={{
                                    position: "absolute", inset: 0, background: "rgba(136,96,217,0.3)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    <div style={{
                                      width: 24, height: 24, borderRadius: "50%", background: "#8860D9",
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                      <Check size={13} color="#fff" strokeWidth={3} />
                                    </div>
                                  </div>
                                )}
                                {isFallback && !isCover && (
                                  <div style={{
                                    position: "absolute", bottom: 4, left: 0, right: 0,
                                    textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.7)",
                                    background: "rgba(0,0,0,0.5)", padding: "2px 0",
                                  }}>
                                    auto
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Zoom slider (applies to both modes when cover is set) ── */}
                {effectiveCoverUrl && (
                  <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <ZoomOut size={15} color="rgba(255,255,255,0.4)" />
                    <input
                      type="range" min={1} max={2} step={0.05}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      style={{ flex: 1, accentColor: "#8860D9" }}
                    />
                    <ZoomIn size={15} color="rgba(255,255,255,0.4)" />
                  </div>
                )}

                <button
                  onClick={() => setShowCoverEditor(false)}
                  style={{
                    marginTop: 14, width: "100%", height: 42, borderRadius: 21,
                    background: GRADIENT, border: "none", color: "#fff",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── Diary title input ── */}
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
                width: "100%", height: 48, borderRadius: 12,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff", fontSize: 16, fontWeight: 500, padding: "0 16px",
                outline: "none", boxSizing: "border-box", textAlign: "center",
              }}
            />
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "right", marginTop: 6 }}>
              {diaryTitle.length}/20
            </p>
          </div>

          {/* ── Selected stories preview row ── */}
          <div style={{ width: "100%", maxWidth: 400 }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
              {selectedIds.length} {selectedIds.length === 1 ? "Story" : "Stories"} Selected
            </p>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {selectedIds.map((id) => {
                const flux = archivedFluxes.find((f) => f._id === id);
                if (!flux) return null;
                return (
                  <div key={id} style={{ width: 48, height: 68, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                    {flux.mediaType === "image" ? (
                      <img src={flux.mediaUrl} alt="story" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a1a2e,#2d1b4e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎬</div>
                    )}
                    <button
                      onClick={() => toggleSelect(id)}
                      style={{
                        position: "absolute", top: 2, right: 2, width: 16, height: 16,
                        borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
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
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "16px 24px 28px",
          background: "linear-gradient(0deg,#0A0A0C 60%,transparent 100%)", zIndex: 20,
        }}>
          <button
            onClick={() => setStep("name")}
            style={{
              width: "100%", height: 52, borderRadius: 26, background: GRADIENT,
              border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
            }}
          >
            Continue ({selectedIds.length} selected)
          </button>
        </div>
      )}
    </div>
  );
}
