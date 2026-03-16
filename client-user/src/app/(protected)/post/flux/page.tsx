"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Upload, Loader2, Users } from "lucide-react";

import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/components/home/ThemeContext";

import FluxTopOptions from "@/components/post/FluxTopOptions";
import FluxRightPanel from "@/components/post/FluxRightPanel";
import FluxMusicBar   from "@/components/post/FluxMusicBar";

import { createFlux } from "@/services/mediaService";
import type { FluxVisibility } from "@/types/media";
import FluxToolbar from "@/components/post/FluxToolbar";
import type { FluxTool } from "@/types/flux";
import Cancel from "@/assets/post/cancelIcon.png";
import Delete from "@/assets/post/deleteIcon.png";
import LocationIcon from "@/assets/post/locationIcon.png";

const GRADIENT = "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)";

export default function FluxPage() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { themeStyles } = useTheme();
  const searchParams = useSearchParams();
  // ── Media state 
  const fileInputRef           = useRef<HTMLInputElement>(null);
  const [mediaFile,    setMediaFile]    = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType,    setMediaType]    = useState<"image" | "video" | null>(null);
  const [isDragging,   setIsDragging]   = useState(false);

  // ── Tool / panel state 
  const [activeTool,        setActiveTool]        = useState<FluxTool>(null);
  const [duration,          setDuration]          = useState<15 | 30 | 60>(15);
  const [selectedSongId,    setSelectedSongId]    = useState<string | null>(null);
  const [selectedSongTitle, setSelectedSongTitle] = useState("");
  const [selectedSongArtist,setSelectedSongArtist]= useState("");
  const [selectedLocation,  setSelectedLocation]  = useState<string | null>(null);
  const [locationPos,setLocationPos] = useState({ x: 20, y: 60 });
  const [locationTheme, setLocationTheme] = useState(0);
  const [locationPlaceId,        setLocationPlaceId]        = useState<string | null>(null);
  const [locationLat,            setLocationLat]            = useState<number | null>(null);
  const [locationLng,            setLocationLng]            = useState<number | null>(null);
  const [locationCategory,       setLocationCategory]       = useState<string | null>(null);
  const locationDragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const previewRef      = useRef<HTMLDivElement>(null);
  const [selectedMentions,  setSelectedMentions]  = useState<string[]>([]);
  const [selectedFilter,    setSelectedFilter]    = useState("none");
  const [visibility,        setVisibility]        = useState<FluxVisibility>("followers");

  // ── Upload state 
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const [uploadError,setUploadError]= useState<string | null>(null);

// ── History (undo/redo stub) 
  const [history, setHistory] = useState<any[]>([]);
  const [future,  setFuture]  = useState<any[]>([]);
  const [selectedSongPreview,  setSelectedSongPreview]  = useState<string | null>(null);
  const [selectedSongAlbumArt, setSelectedSongAlbumArt] = useState<string | null>(null);

  // ── Shared audio ref — single source of truth for playback 
  const sharedAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

const playSharedAudio = (previewUrl: string) => {
    console.log("🎵 Playing:", previewUrl);

    if (sharedAudioRef.current) {
      sharedAudioRef.current.pause();
      sharedAudioRef.current = null;
    }
    setIsAudioPlaying(false);

    if (!previewUrl) return;

    const audio = new Audio(previewUrl);
    audio.volume = 1;
    sharedAudioRef.current = audio;

    audio.play()
      .then(() => setIsAudioPlaying(true))
      .catch((err) => {
        console.error("❌ play() failed:", err.message);
        setIsAudioPlaying(false);
      });

    audio.onended = () => setIsAudioPlaying(false);
  };



  const stopSharedAudio = () => {
    if (sharedAudioRef.current) {
      sharedAudioRef.current.pause();
      sharedAudioRef.current.src = "";
      sharedAudioRef.current = null;
    }
    setIsAudioPlaying(false);
  };

  const toggleSharedAudio = () => {
    const audio = sharedAudioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
    } else {
      audio.play().then(() => setIsAudioPlaying(true)).catch(console.error);
    }
  };

  const toggleSharedMute = (muted: boolean) => {
    if (sharedAudioRef.current) {
      sharedAudioRef.current.muted = muted;
    }
  };

  // File handling 
  const handleFile = (file: File) => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return;

    setMediaFile(file);
    setMediaType(isVideo ? "video" : "image");
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
    setActiveTool(null);
  };

  // Pre-fill from sourceFlux query params (re-mention flow)
  useEffect(() => {
    const mediaUrl   = searchParams.get("mediaUrl");
    const mType      = searchParams.get("mediaType") as "image" | "video" | null;

    if (!mediaUrl || !mType) return;

    // Fetch the remote media and convert to a File object
    // so the existing preview + upload flow works unchanged
    const loadRemoteFile = async () => {
      try {
        const response = await fetch(mediaUrl);
        const blob     = await response.blob();
        const ext      = mType === "video" ? "mp4" : "jpg";
        const file     = new File([blob], `repost.${ext}`, { type: blob.type });

        handleFile(file);   // this sets mediaFile, mediaPreview, mediaType
      } catch {
        // fallback: just show preview without a File (upload will use URL)
        setMediaPreview(mediaUrl);
        setMediaType(mType);
      }
    };

    loadRemoteFile();

    // Music
    const musicId         = searchParams.get("musicId");
    const musicTitle      = searchParams.get("musicTitle");
    const musicArtist     = searchParams.get("musicArtist");
    const musicPreviewUrl = searchParams.get("musicPreviewUrl");
    const musicAlbumArt   = searchParams.get("musicAlbumArt");
    if (musicId)         setSelectedSongId(musicId);
    if (musicTitle)      setSelectedSongTitle(musicTitle);
    if (musicArtist)     setSelectedSongArtist(musicArtist);
    if (musicPreviewUrl) {
      setSelectedSongPreview(musicPreviewUrl);
      playSharedAudio(musicPreviewUrl);
    }
    if (musicAlbumArt)   setSelectedSongAlbumArt(musicAlbumArt);

    // Location
    const locationLabel        = searchParams.get("locationLabel");
    const locationPlaceIdParam = searchParams.get("locationPlaceId");
    const locationLatParam     = searchParams.get("locationLat");
    const locationLngParam     = searchParams.get("locationLng");
    const locationCategoryParam= searchParams.get("locationCategory");
    const locationStickerXParam= searchParams.get("locationStickerX");
    const locationStickerYParam= searchParams.get("locationStickerY");
    const locationThemeParam   = searchParams.get("locationStickerTheme");

    if (locationLabel)         setSelectedLocation(locationLabel);
    if (locationPlaceIdParam)  setLocationPlaceId(locationPlaceIdParam);
    if (locationLatParam)      setLocationLat(parseFloat(locationLatParam));
    if (locationLngParam)      setLocationLng(parseFloat(locationLngParam));
    if (locationCategoryParam) setLocationCategory(locationCategoryParam);
    if (locationStickerXParam) setLocationPos(prev => ({ ...prev, x: parseFloat(locationStickerXParam) }));
    if (locationStickerYParam) setLocationPos(prev => ({ ...prev, y: parseFloat(locationStickerYParam) }));
    if (locationThemeParam)    setLocationTheme(parseInt(locationThemeParam));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleToolSelect = (tool: FluxTool) => {
    setActiveTool(tool);
    // if switching to mention/location from toolbar, sync top options
  };

  //  Mention toggle 
  const handleMentionToggle = (id: string) => {
    setSelectedMentions((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // ── Post flux 
const handlePost = async (target: "story" | "close_friends") => {
    const sourceMediaUrl = searchParams.get("mediaUrl");
    if (!mediaFile && !sourceMediaUrl) return;
    try {
      setUploading(true);
      setUploadError(null);
      const vis: FluxVisibility = target === "close_friends" ? "close_friends" : visibility;
      await createFlux((mediaFile ?? sourceMediaUrl)!, {
        caption:    selectedLocation || undefined,  
        visibility: 'public',
        musicId:          selectedSongId         || undefined,
        musicTitle:       selectedSongTitle       || undefined,
        musicArtist:      selectedSongArtist      || undefined,
        musicPreviewUrl:  selectedSongPreview     || undefined,
        musicAlbumArt:    selectedSongAlbumArt    || undefined,
        // Location — full structured data + canvas position
        locationLabel:        selectedLocation    || undefined,
        locationPlaceId:      locationPlaceId     || undefined,
        locationLat:          locationLat         ?? undefined,
        locationLng:          locationLng         ?? undefined,
        locationCategory:     locationCategory    || undefined,
        locationStickerX:     locationPos.x,
        locationStickerY:     locationPos.y,
        locationStickerTheme: locationTheme,
        onUploadProgress: (e) => {
          setUploadPct(Math.round(((e.loaded ?? 0) * 100) / (e.total ?? 1)));
        },
      });
      router.push("/home");
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  };

  const marginLeft = isMobile ? 0 : 281;

  return (
    <div
      className="min-h-screen flex overflow-hidden font-sans"
      style={{ background: "#0A0A0C", color: "#fff" }}
    >
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <SideBar />

      {/* ── Main content ────────────────────────────────────── */}
      <main
        className="flex-1 flex flex-col"
        style={{ marginLeft, minHeight: "100vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
            >
              <Image src={Cancel} alt="close" width={18} height={18} />
            </button>
            <h1 className="text-white text-[18px] font-semibold tracking-tight">
              Add your flux
            </h1>
          </div>
        </div>

        {/* ── Three-column layout ──────────────────────────── */}
        <div
          className="flex flex-1 items-start gap-4 px-6 pb-6"
          style={{ overflow: "visible", minHeight: 0 }}
        >
        {/* ── LEFT: Toolbar ─────────────────────────────── */}
        <div className="flex-shrink-0 flex flex-col items-center pt-2">
            <FluxToolbar
            activeTool={activeTool}
            onSelect={handleToolSelect}
            onUndo={() => {}}
            onRedo={() => {}}
            />
        </div>

            {/* ── CENTER: Preview + Music bar ───────────────── */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            {/* Media preview frame — reduced to fit alongside panel */}
            <div
              ref={previewRef}
              className="relative overflow-hidden flex items-center justify-center"
              style={{
                width: 340,
                height: 520,
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: isDragging
                  ? "2px dashed #8860D9"
                  : "1px solid rgba(255,255,255,0.08)",
                transition: "border-color 0.2s",
              }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {mediaPreview ? (
                <>
                  {mediaType === "image" ? (
                    <Image
                      src={mediaPreview}
                      alt="Flux preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  )}

                  {/* Filter overlay */}
                  {selectedFilter === "bw" && (
                    <div
                      className="absolute inset-0"
                      style={{ background: "rgba(0,0,0,0.5)", mixBlendMode: "color" }}
                    />
                  )}

                    {/* Location sticker — draggable + tap to cycle themes */}
                    {selectedLocation && (() => {
                    const THEMES = [
                        // 0 — Dark glass (default)
                        {
                        background:     'rgba(0,0,0,0.62)',
                        backdropFilter: 'blur(12px)',
                        border:         '1px solid rgba(255,255,255,0.18)',
                        color:          '#ffffff',
                        textTransform:  'none'  as const,
                        fontWeight:     600,
                        fontStyle:      'normal' as const,
                        textShadow:     'none',
                        letterSpacing:  0.2,
                        },
                        // 1 — Solid white
                        {
                        background:     '#ffffff',
                        backdropFilter: 'none',
                        border:         'none',
                        color:          '#1a1a2e',
                        textTransform:  'none'  as const,
                        fontWeight:     700,
                        fontStyle:      'normal' as const,
                        textShadow:     'none',
                        letterSpacing:  0.3,
                        },
                        // 2 — Gradient purple
                        {
                        background:     'linear-gradient(135deg,#8860D9,#B3B8E2)',
                        backdropFilter: 'none',
                        border:         'none',
                        color:          '#ffffff',
                        textTransform:  'none'  as const,
                        fontWeight:     700,
                        fontStyle:      'normal' as const,
                        textShadow:     '0 1px 3px rgba(0,0,0,0.3)',
                        letterSpacing:  0.2,
                        },
                        // 3 — Transparent outlined
                        {
                        background:     'transparent',
                        backdropFilter: 'none',
                        border:         '2px solid rgba(255,255,255,0.85)',
                        color:          '#ffffff',
                        textTransform:  'none'  as const,
                        fontWeight:     600,
                        fontStyle:      'normal' as const,
                        textShadow:     '0 1px 4px rgba(0,0,0,0.6)',
                        letterSpacing:  0.3,
                        },
                        // 4 — Vivid pink
                        {
                        background:     'linear-gradient(135deg,#f953c6,#b91d73)',
                        backdropFilter: 'none',
                        border:         'none',
                        color:          '#ffffff',
                        textTransform:  'uppercase' as const,
                        fontWeight:     800,
                        fontStyle:      'normal' as const,
                        textShadow:     '0 1px 3px rgba(0,0,0,0.25)',
                        letterSpacing:  1.2,
                        },
                        // 5 — Minimal / no background
                        {
                        background:     'transparent',
                        backdropFilter: 'none',
                        border:         'none',
                        color:          '#ffffff',
                        textTransform:  'none'  as const,
                        fontWeight:     500,
                        fontStyle:      'italic' as const,
                        textShadow:     '0 1px 6px rgba(0,0,0,0.8)',
                        letterSpacing:  0.4,
                        },
                    ];

                    const theme = THEMES[locationTheme % THEMES.length];

                    return (
                        <div
                        style={{
                            position:    'absolute',
                            left:        `${locationPos.x}%`,
                            top:         `${locationPos.y}%`,
                            transform:   'translate(-50%, -50%)',
                            cursor:      'grab',
                            userSelect:  'none',
                            touchAction: 'none',
                            zIndex:      10,
                        }}
                        onMouseDown={(e) => {
                            // Only drag on the wrapper div, not the remove button
                            if ((e.target as HTMLElement).closest('button')) return;
                            e.preventDefault();
                            const rect = previewRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            locationDragRef.current = {
                            startX:    e.clientX,
                            startY:    e.clientY,
                            startPosX: locationPos.x,
                            startPosY: locationPos.y,
                            };
                            const onMove = (me: MouseEvent) => {
                            if (!locationDragRef.current) return;
                            const dx = ((me.clientX - locationDragRef.current.startX) / rect.width)  * 100;
                            const dy = ((me.clientY - locationDragRef.current.startY) / rect.height) * 100;
                            setLocationPos({
                                x: Math.min(90, Math.max(10, locationDragRef.current.startPosX + dx)),
                                y: Math.min(90, Math.max(10, locationDragRef.current.startPosY + dy)),
                            });
                            };
                            const onUp = () => {
                            locationDragRef.current = null;
                            window.removeEventListener('mousemove', onMove);
                            window.removeEventListener('mouseup',  onUp);
                            };
                            window.addEventListener('mousemove', onMove);
                            window.addEventListener('mouseup',   onUp);
                        }}
                        >
                        {/* Sticker pill — tap to cycle theme */}
                        <div
                            onClick={() => setLocationTheme((t) => (t + 1) % THEMES.length)}
                            style={{
                            display:        'flex',
                            alignItems:     'center',
                            gap:            5,
                            padding:        '5px 10px 5px 7px',
                            borderRadius:   20,
                            background:     theme.background,
                            backdropFilter: theme.backdropFilter,
                            border:         theme.border,
                            whiteSpace:     'nowrap',
                            cursor:         'pointer',
                            boxShadow:      '0 2px 12px rgba(0,0,0,0.35)',
                            transition:     'all 0.2s ease',
                            }}
                        >
                            {/* Location icon */}
                            <Image
                            src={LocationIcon}
                            alt="location"
                            width={12}
                            height={12}
                            style={{
                                flexShrink: 0,
                                filter: theme.color === '#1a1a2e'
                                ? 'invert(0)'       // dark icon on white bg
                                : 'brightness(0) invert(1)', // white icon on dark bg
                            }}
                            />

                            {/* Location name */}
                            <span
                            style={{
                                color:          theme.color,
                                fontSize:       12,
                                fontWeight:     theme.fontWeight,
                                fontStyle:      theme.fontStyle,
                                textTransform:  theme.textTransform,
                                textShadow:     theme.textShadow,
                                letterSpacing:  theme.letterSpacing,
                                lineHeight:     1.2,
                            }}
                            >
                            {selectedLocation}
                            </span>

                            {/* Remove × */}
                            <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLocation(null);
                                setLocationTheme(0);
                            }}
                            style={{
                                marginLeft:     4,
                                background:     'rgba(255,255,255,0.2)',
                                border:         'none',
                                borderRadius:   '50%',
                                width:          14,
                                height:         14,
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                cursor:         'pointer',
                                padding:        0,
                                color:          'rgba(255,255,255,0.85)',
                                fontSize:       9,
                                lineHeight:     1,
                                flexShrink:     0,
                            }}
                            >
                            ✕
                            </button>
                        </div>

                        {/* Tap hint */}
                        <div style={{
                            textAlign:     'center',
                            marginTop:     3,
                            fontSize:      9,
                            color:         'rgba(255,255,255,0.3)',
                            pointerEvents: 'none',
                            letterSpacing: 0.2,
                        }}>
                            tap to change style · drag to move
                        </div>
                        </div>
                    );
                    })()}

                  {/* Mention tags overlay */}
                  {selectedMentions.length > 0 && (
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1 rounded-full text-white text-[11px] font-medium"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
                    >
                      <Users size={11} />
                      {selectedMentions.length} mentioned
                    </div>
                  )}

                  {/* Upload progress */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                      <Loader2 size={32} className="animate-spin text-[#8860D9]" />
                      <div className="w-40 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${uploadPct}%`, background: GRADIENT }}
                        />
                      </div>
                      <p className="text-white/60 text-[12px]">{uploadPct}%</p>
                    </div>
                  )}

                  {/* Remove media button */}
                  {!uploading && (
                    <button
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                        setMediaType(null);
                      }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 transition-all"
                    >
                      <Image src={Delete} alt="remove" width={12} height={12} />
                    </button>
                  )}
                </>
              ) : (
                /* Empty drop zone */
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-4 text-white/30 hover:text-white/50 transition-colors group"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Upload size={22} />
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-medium">Drop media here</p>
                    <p className="text-[11px] mt-1 text-white/20">
                      or click to browse · photo, video
                    </p>
                  </div>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {/* Music bar — reduced width to match preview */}
            {selectedSongId && (
              <FluxMusicBar
                songTitle={selectedSongTitle}
                artistName={selectedSongArtist}
                albumArt={selectedSongAlbumArt}
                previewUrl={selectedSongPreview}
                isPlaying={isAudioPlaying}
                onPlayPause={toggleSharedAudio}
                onMuteToggle={toggleSharedMute}
                onRemove={() => {
                  stopSharedAudio();
                  setSelectedSongId(null);
                  setSelectedSongTitle("");
                  setSelectedSongArtist("");
                  setSelectedSongPreview(null);
                  setSelectedSongAlbumArt(null);
                }}
              />
            )}

            {uploadError && (
              <p className="text-red-400 text-[12px] text-center">{uploadError}</p>
            )}
          </div>

          {/* ── RIGHT: Top options + panel + buttons ─────── */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {/* Top options row */}
            <FluxTopOptions
              duration={duration}
              onDurationChange={setDuration}
              onMentionClick={() =>
                setActiveTool(activeTool === "mention" ? null : "mention")
              }
              onLocationClick={() =>
                setActiveTool(activeTool === "location" ? null : "location")
              }
              activeTool={activeTool}
            />

            {/* Right panel */}
            {activeTool && (
              <div
                style={{
                  borderRadius: 12,
                  background: "rgba(18,18,20,0.92)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(24px)",
                  padding: "14px 12px",
                  height: 520,         // matches preview height
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 280,
                  maxWidth: 340,
                }}
              >
                <FluxRightPanel
                  activeTool={activeTool}
                  selectedSong={selectedSongId}
                  selectedLocation={selectedLocation}
                  selectedMentions={selectedMentions}
                  selectedFilter={selectedFilter}
                  onSongSelect={(id, title, artist, previewUrl, albumArt) => {
                    if (previewUrl) {
                      playSharedAudio(previewUrl);
                    } else {
                      stopSharedAudio();
                    }
                    setSelectedSongId(id);
                    setSelectedSongTitle(title);
                    setSelectedSongArtist(artist);
                    setSelectedSongPreview(previewUrl ?? null);
                    setSelectedSongAlbumArt(albumArt ?? null);
                  }}
                  onLocationSelect={(loc, details) => {
                    setSelectedLocation(loc);
                    if (details) {
                      setLocationPlaceId(details.placeId ?? null);
                      setLocationLat(details.lat ?? null);
                      setLocationLng(details.lng ?? null);
                      setLocationCategory(details.category ?? null);
                    }
                    setActiveTool(null);
                  }}
                  onMentionToggle={handleMentionToggle}
                  onFilterSelect={setSelectedFilter}
                  onStickerSelect={() => {}}
                  onFontChange={() => {}}
                  onColorChange={() => {}}
                  onAnimationChange={() => {}}
                  onEffectChange={() => {}}
                />
              </div>
            )}

            {/* Bottom action buttons */}
            <div className="flex items-center gap-3 mt-auto pt-2">
              <button
                onClick={() => setActiveTool(null)}
                className="flex items-center justify-center text-white text-[13px] font-semibold transition-all hover:opacity-80"
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 25,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Close groups
              </button>

              <button
                onClick={() => handlePost("story")}
                disabled={!mediaFile || uploading}
                className="flex items-center justify-center gap-2 text-white text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 25,
                  background: GRADIENT,
                }}
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Users size={15} />
                    Your story
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}