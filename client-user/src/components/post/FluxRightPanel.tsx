"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Play, Heart, Check, VolumeX } from "lucide-react";
import Image from "next/image";
import { searchMusic, getTrendingMusic,mentionFlux } from "@/services/mediaService";
import { getFollowing }  from "@/services/followService";
import { searchUsers }   from "@/services/wieUserService";
import { useAuth }       from "@/hooks/useAuth";
import { searchLocations, getLocationDetails, categoryIcon } from '@/services/locationService';
import type { PlaceSuggestion } from '@/services/locationService';
import type { SpotifyTrack } from "@/types/media";
import type { FluxTool } from "@/types/flux";
interface MUser {
  id:       string;
  name:     string;
  username: string;
  avatar:   string | null;
}
export interface StickerItem {
  id: string; type: string; url: string;
  width: number; height: number; title: string;
}

export const FILTER_PRESETS = [
  { id: "normal",  name: "Normal",  value: "none" },
  { id: "warm",    name: "Warm",    value: "brightness(1.1) saturate(1.4) sepia(0.15)" },
  { id: "cool",    name: "Cool",    value: "contrast(1.15) hue-rotate(200deg) saturate(0.9)" },
  { id: "vintage", name: "Vintage", value: "sepia(0.55) contrast(0.88) brightness(0.95)" },
  { id: "bw",      name: "B&W",     value: "grayscale(1) contrast(1.1)" },
  { id: "bright",  name: "Bright",  value: "brightness(1.3) saturate(1.1)" },
  { id: "fade",    name: "Fade",    value: "brightness(1.1) saturate(0.7) contrast(0.85)" },
  { id: "vivid",   name: "Vivid",   value: "saturate(1.8) contrast(1.1)" },
  { id: "drama",   name: "Drama",   value: "contrast(1.4) brightness(0.9) saturate(1.2)" },
];

function FilterPanel({
  selectedFilter,
  onSelect,
  mediaPreview,
  mediaType,
}: {
  selectedFilter: string;
  onSelect:       (id: string, value: string) => void;
  mediaPreview:   string | null;
  mediaType:      "image" | "video" | null;
}) {
  const current = FILTER_PRESETS.find(f => f.id === selectedFilter) ?? FILTER_PRESETS[0];
  const startX  = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    const diff = startX.current - e.changedTouches[0].clientX;
    const idx  = FILTER_PRESETS.findIndex(f => f.id === selectedFilter);
    if (diff > 50 && idx < FILTER_PRESETS.length - 1) onSelect(FILTER_PRESETS[idx + 1].id, FILTER_PRESETS[idx + 1].value);
    else if (diff < -50 && idx > 0)                    onSelect(FILTER_PRESETS[idx - 1].id, FILTER_PRESETS[idx - 1].value);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", flexShrink: 0 }}>
        Filters · <span style={{ color: "#8860D9" }}>{current.name}</span>
      </p>

      {/* Live preview */}
      {mediaPreview && (
        <div
          style={{ width: "100%", height: 160, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {mediaType === "video" ? (
            <video src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover", filter: current.value }} muted autoPlay loop playsInline />
          ) : (
            <img src={mediaPreview} style={{ width: "100%", height: "100%", objectFit: "cover", filter: current.value, transition: "filter 0.3s ease" }} alt="preview" />
          )}
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
            padding: "3px 12px", borderRadius: 20,
            color: "#fff", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
          }}>
            {current.name}
          </div>
          <p style={{ position: "absolute", bottom: -18, width: "100%", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 9 }}>
            swipe to change
          </p>
        </div>
      )}

      {!mediaPreview && (
        <div style={{
          width: "100%", height: 80, borderRadius: 10, flexShrink: 0,
          background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Add media to preview filters</p>
        </div>
      )}

      {/* Filter thumbnails */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, paddingTop: 8 }}>
          {FILTER_PRESETS.map(f => {
            const isActive = selectedFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelect(f.id, f.value)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "transparent", border: "none", cursor: "pointer", padding: 2,
                }}
              >
                <div style={{
                  width: "100%", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                  border: isActive ? "2px solid #8860D9" : "2px solid rgba(255,255,255,0.1)",
                  background: "#111",
                  boxShadow: isActive ? "0 0 8px rgba(136,96,217,0.6)" : "none",
                  transition: "border 0.15s, box-shadow 0.15s",
                }}>
                  {mediaPreview && !mediaPreview.startsWith("linear") && !mediaPreview.startsWith("radial") ? (
                    <img
                      src={mediaPreview}
                      alt={f.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", filter: f.value }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      background: `linear-gradient(135deg, rgba(136,96,217,0.4), rgba(179,184,226,0.3))`,
                      filter: f.value,
                    }} />
                  )}
                </div>
                <span style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: isActive ? 700 : 400 }}>
                  {f.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
const STICKER_EMOJIS = ["🍀", "🎩", "🏅", "☘️", "🌈", "📅", "🛢️", "🎫", "🍺", "🧝", "⛑️", "🎈", "❤️", "🪙", "🪄", "🎺", "🎟️", "🎟️", "🎟️", "🎟️"];

const FONT_STYLES = ["SF Pro", "Roboto", "Road Rage", "SF Pro", "SF Pro"];
const FONT_COLORS = ["#ccc", "#e53e3e", "#3182ce", "#38a169", "#d69e2e", "#d53f8c", "#dd6b20", "#805ad5", "#c53030", "conic-gradient(red,orange,yellow,green,blue,purple,red)"];
const ANIMATIONS   = ["None", "Left", "Right", "Top", "None"];
const TEXT_EFFECTS = ["None", "Shine", "Multiple", "Faded", "None"];

const FOLLOWERS = Array.from({ length: 8 }, (_, i) => ({
  id: String(i),
  name: i === 0 ? "Joyal" : "Sangeeth",
  username: i === 0 ? "_joyal_124" : "s_an_geeth",
  checked: i < 5,
}));

const GRADIENT = "linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)";

function MusicPanel({
  selectedSong,
  onSelect,
}: {
  selectedSong: string | null;
  onSelect: (
    id: string,
    title: string,
    artist: string,
    previewUrl: string | null,
    albumArt: string | null,
    mode: "music_only" | "lyrics",
    lyricsStyle: "karaoke" | "line" | "floating",
    trimStart: number,
    trimEnd: number,
  ) => void;
}) {
  const [tab,          setTab]         = useState<"foryou" | "trending" | "liked">("trending");
  const [query,        setQuery]       = useState("");
  const [tracks,       setTracks]      = useState<SpotifyTrack[]>([]);
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState<string | null>(null);
  const [mode,         setMode]        = useState<"music_only" | "lyrics">("music_only");
  const [lyricsStyle,  setLyricsStyle] = useState<"karaoke" | "line" | "floating">("line");
  const [trimStart,    setTrimStart]   = useState(0);
  const [trimEnd,      setTrimEnd]     = useState(15);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadTrending = async () => {
    setLoading(true); setError(null);
    try { const data = await getTrendingMusic(); setTracks(data); }
    catch { setError("Could not load music"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTrending(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { loadTrending(); return; }
    debounceRef.current = setTimeout(() => {
      setLoading(true); setError(null);
      searchMusic(query.trim(), 10)
        .then(setTracks).catch(() => setError("Search failed"))
        .finally(() => setLoading(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const PILL = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

  const LYRICS_STYLES: { id: "karaoke" | "line" | "floating"; label: string; icon: string; desc: string }[] = [
    { id: "karaoke",  label: "Karaoke",  icon: "🎤", desc: "Word-by-word highlight" },
    { id: "line",     label: "Line",     icon: "📝", desc: "One line at a time"     },
    { id: "floating", label: "Floating", icon: "💫", desc: "Animated movement"      },
  ];

  const handleTrackSelect = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setTrimStart(0);
    setTrimEnd(Math.min(15, 30));
    onSelect(track.id, track.title, track.artist, track.previewUrl, track.albumArt, mode, lyricsStyle, trimStart, trimEnd);
  };

  // Re-fire onSelect when mode/style/trim changes for already-selected track
  useEffect(() => {
    if (!selectedTrack) return;
    onSelect(selectedTrack.id, selectedTrack.title, selectedTrack.artist, selectedTrack.previewUrl, selectedTrack.albumArt, mode, lyricsStyle, trimStart, trimEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, lyricsStyle, trimStart, trimEnd]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>

      {/* Title */}
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", flexShrink: 0 }}>
        Choose song
      </p>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 10, flexShrink: 0,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <Search size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
        <input
          type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 12 }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <X size={12} color="rgba(255,255,255,0.4)" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {(["foryou", "trending", "liked"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
            cursor: "pointer", border: "none",
            background: tab === t ? PILL : "rgba(255,255,255,0.08)", color: "#fff",
            outline: tab === t ? "none" : "1px solid rgba(255,255,255,0.14)",
          }}>
            {t === "foryou" ? "For you" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column",
        gap: 2, scrollbarWidth: "none", paddingRight: 2,
      }}>
        <style>{`div::-webkit-scrollbar{display:none} @keyframes spin{to{transform:rotate(360deg)}} @keyframes bounce{from{transform:scaleY(0.4)}to{transform:scaleY(1)}}`}</style>
        {error ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center", paddingTop: 24 }}>{error}</p>
        ) : loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #8860D9", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : tracks.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", paddingTop: 24 }}>No results</p>
        ) : (
          tracks.map((track) => {
            const isSelected = selectedSong === track.id;
            const hasPreview = Boolean(track.previewUrl);
            return (
              <button
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 8px", borderRadius: 10, width: "100%",
                  textAlign: "left", cursor: "pointer",
                  background: isSelected ? "rgba(136,96,217,0.2)" : "transparent",
                  border: isSelected ? "1px solid rgba(136,96,217,0.45)" : "1px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#6B3FA0,#2979FF)" }}>
                  {track.albumArt && <img src={track.albumArt} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  {isSelected && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 12 }}>
                        {[55, 100, 70].map((h, i) => (
                          <div key={i} style={{ width: 2, borderRadius: 2, background: "#fff", height: `${h}%`, animation: "bounce 0.6s ease infinite alternate", animationDelay: `${i * 0.12}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {!hasPreview && (
                    <div style={{ position: "absolute", bottom: 0, right: 0, background: "rgba(0,0,0,0.7)", borderRadius: "4px 0 8px 0", padding: "1px 3px" }}>
                      <VolumeX size={7} color="rgba(255,255,255,0.5)" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#fff", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>{track.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                    {track.artist} • {track.duration}
                    {!hasPreview && <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>no preview</span>}
                  </p>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isSelected ? PILL : "rgba(255,255,255,0.07)",
                  border: isSelected ? "none" : "1px solid rgba(255,255,255,0.14)",
                }}>
                  {isSelected ? <Check size={10} color="#fff" /> : <Heart size={10} color="rgba(255,255,255,0.3)" />}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* ── Mode + Options — only shown when a track is selected ── */}
      {selectedTrack && (
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>

          {/* Helper text */}
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textAlign: "center" }}>
            Choose how your music appears
          </p>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, padding: "3px", borderRadius: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {(["music_only", "lyrics"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 18, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", border: "none", transition: "all 0.2s",
                  background: mode === m ? PILL : "transparent",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.45)",
                }}
              >
                {m === "music_only" ? "🎵 Music Only" : "🎤 Lyrics"}
              </button>
            ))}
          </div>

          {/* Lyrics style — only when lyrics mode */}
          {mode === "lyrics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn 0.2s ease" }}>
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Lyrics style</p>
              <div style={{ display: "flex", gap: 5 }}>
                {LYRICS_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLyricsStyle(s.id)}
                    style={{
                      flex: 1, padding: "7px 4px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                      cursor: "pointer", border: "none", transition: "all 0.15s",
                      background: lyricsStyle === s.id ? "rgba(136,96,217,0.45)" : "rgba(255,255,255,0.07)",
                      outline: lyricsStyle === s.id ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.1)",
                      color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{s.icon}</span>
                    <span>{s.label}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 400 }}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trim slider */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>⏱ Trim segment</p>
              <span style={{ color: "#8860D9", fontSize: 10, fontWeight: 700 }}>{trimStart}s – {trimEnd}s</span>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, width: 20 }}>Start</span>
              <input
                type="range" min={0} max={25} value={trimStart}
                onChange={(e) => { const v = Number(e.target.value); setTrimStart(Math.min(v, trimEnd - 5)); }}
                style={{ flex: 1, accentColor: "#8860D9" }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, width: 20 }}>End</span>
              <input
                type="range" min={5} max={30} value={trimEnd}
                onChange={(e) => { const v = Number(e.target.value); setTrimEnd(Math.max(v, trimStart + 5)); }}
                style={{ flex: 1, accentColor: "#8860D9" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type LocationSelectDetails = {
  placeId?:  string;
  lat?:      number;
  lng?:      number;
  category?: string;
};
function LocationPanel({
  selectedLocation,
  onSelect,
}: {
  selectedLocation: string | null;
  onSelect: (loc: string, details?: LocationSelectDetails) => void;
}) {
  const [query,         setQuery]         = useState('');
  const [suggestions,   setSuggestions]   = useState<PlaceSuggestion[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [loadingId,     setLoadingId]     = useState<string | null>(null);
  const [gpsLoading,    setGpsLoading]    = useState(false);
  const [gpsError,      setGpsError]      = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── Debounced autocomplete 
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchLocations(query.trim());
        setSuggestions(results);
      } catch {
        setError('Could not fetch locations.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // ── GPS: use current location 
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode using Google Geocoding API via our backend
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
              // We proxy via backend to hide the key
              ''
            }`,
          );
          // Use our location details API with a special "current" endpoint
          // For now, use Nominatim (free, no key needed for reverse geocode)
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'wie-app/1.0' } }
          );
          const geoData = await geoRes.json() as {
            display_name: string;
            address: {
              city?: string; town?: string; village?: string;
              suburb?: string; state?: string; country?: string;
              road?: string; neighbourhood?: string;
            };
          };

          const addr    = geoData.address;
          const city    = addr.city ?? addr.town ?? addr.village ?? addr.state ?? '';
          const suburb  = addr.suburb ?? addr.neighbourhood ?? addr.road ?? '';
          const label   = suburb && city ? `${suburb} · ${city}` : city || geoData.display_name.split(',')[0];
          onSelect(label, {});
        } catch {
          setGpsError('Could not determine your location. Try searching manually.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow location access in your browser settings.');
        } else {
          setGpsError('Could not get your location. Try searching manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };
  const handleSelect = async (s: PlaceSuggestion) => {
    setLoadingId(s.placeId);
    try {
      const details = await getLocationDetails(s.placeId);
      const label   = details.city && details.city !== details.name
        ? `${details.name} · ${details.city}`
        : details.name;
      onSelect(label, {
        placeId:  details.placeId,
        lat:      details.lat,
        lng:      details.lng,
        category: details.category,
      });
    } catch {
      onSelect(s.name, {});
    } finally {
      setLoadingId(null);
    }
  };

  const PILL = 'linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>

      {/* Title */}
      <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, textAlign: 'center', flexShrink: 0 }}>
        Add location
      </p>

      {/* Use my location button */}
      <button
        onClick={handleUseMyLocation}
        disabled={gpsLoading}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10, flexShrink: 0,
          background: gpsLoading ? 'rgba(136,96,217,0.15)' : 'rgba(136,96,217,0.1)',
          border: '1px solid rgba(136,96,217,0.35)',
          cursor: gpsLoading ? 'wait' : 'pointer',
          transition: 'background 0.15s',
          width: '100%', textAlign: 'left',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(136,96,217,0.25)',
          border: '1px solid rgba(136,96,217,0.4)',
        }}>
          {gpsLoading ? (
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid #8860D9', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
          ) : (
            <span style={{ fontSize: 15 }}>📡</span>
          )}
        </div>
        <div>
          <p style={{ color: '#fff', fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>
            {gpsLoading ? 'Getting your location…' : 'Use my current location'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 1 }}>
            Allow location access when prompted
          </p>
        </div>
      </button>

      {/* GPS error */}
      {gpsError && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, flexShrink: 0,
          background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,60,60,0.25)',
        }}>
          <p style={{ color: 'rgba(255,120,120,0.9)', fontSize: 11, lineHeight: 1.4 }}>
            {gpsError}
          </p>
        </div>
      )}

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>or search</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Search input */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 10, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Search size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City, restaurant, landmark…"
          style={{
            flex: 1, background: 'transparent', border: 'none',
            outline: 'none', color: '#fff', fontSize: 12,
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <X size={12} color="rgba(255,255,255,0.4)" />
          </button>
        )}
      </div>

      {/* Results */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: 2, scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>

        {/* Currently selected */}
        {selectedLocation && !query && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 10, marginBottom: 4,
            background: 'rgba(136,96,217,0.2)',
            border: '1px solid rgba(136,96,217,0.45)',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>
                {selectedLocation}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 }}>
                Currently selected
              </p>
            </div>
            <Check size={12} color="#8860D9" />
          </div>
        )}

        {/* Empty hint */}
        {!loading && suggestions.length === 0 && query.length < 2 && !selectedLocation && (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <p style={{ fontSize: 26, marginBottom: 6 }}>🗺️</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
              Type at least 2 characters to search
            </p>
          </div>
        )}

        {error && (
          <p style={{ color: 'rgba(255,100,100,0.8)', fontSize: 11, textAlign: 'center', paddingTop: 12 }}>
            {error}
          </p>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              border: '2px solid #8860D9', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {!loading && suggestions.map((s) => {
          const isSelected = selectedLocation?.startsWith(s.name) ?? false;
          const isLoading  = loadingId === s.placeId;
          const icon       = categoryIcon(s.category);
          return (
            <button
              key={s.placeId}
              onClick={() => handleSelect(s)}
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10, width: '100%',
                textAlign: 'left', cursor: isLoading ? 'wait' : 'pointer',
                background: isSelected ? 'rgba(136,96,217,0.2)' : 'transparent',
                border: isSelected
                  ? '1px solid rgba(136,96,217,0.45)'
                  : '1px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                background: isSelected ? 'rgba(136,96,217,0.25)' : 'rgba(255,255,255,0.07)',
                border: isSelected
                  ? '1px solid rgba(136,96,217,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
              }}>
                {isLoading ? (
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    border: '2px solid #8860D9', borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                ) : icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: '#fff', fontSize: 12, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                }}>
                  {s.name}
                </p>
                <p style={{
                  color: 'rgba(255,255,255,0.38)', fontSize: 10,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1,
                }}>
                  {s.address}
                </p>
              </div>
              {isSelected && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: PILL,
                }}>
                  <Check size={9} color="#fff" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function MentionPanel({
  selectedMentions,
  onToggle,
  fluxId,
}: {
  selectedMentions: string[];
  onToggle: (id: string, name: string, username: string) => void;
  fluxId?: string;
}) {
  const { user }    = useAuth(true);
  const [query,     setQuery]     = useState("");
  const [following, setFollowing] = useState<MUser[]>([]);
  const [searchRes, setSearchRes] = useState<MUser[]>([]);
  const [loadingF,  setLoadingF]  = useState(false);
  const [loadingS,  setLoadingS]  = useState(false);
  const [adding,    setAdding]    = useState(false);
  const [addError,  setAddError]  = useState<string | null>(null);
  const [addSuccess,setAddSuccess]= useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load following on mount
  useEffect(() => {
    if (!user?.id) return;
    setLoadingF(true);
    getFollowing(user.id)
      .then((res: any) => {
        const list: MUser[] = (res.following ?? res.data ?? []).map((u: any) => ({
          id:       u._id   ?? u.id,
          name:     u.name  ?? u.fullName ?? u.username ?? "",
          username: u.username ?? "",
          avatar:   u.profilePicture ?? u.profile_picture ?? null,
        }));
        setFollowing(list);
      })
      .catch(() => setFollowing([]))
      .finally(() => setLoadingF(false));
  }, [user?.id]);

  // Debounced search — restricted to following
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchRes([]); return; }
    setLoadingS(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await searchUsers(query.trim());
        const found: MUser[] = (res.users ?? res.data ?? []).map((u: any) => ({
          id:       u._id   ?? u.id,
          name:     u.name  ?? u.fullName ?? u.username ?? "",
          username: u.username ?? "",
          avatar:   u.profilePicture ?? u.profile_picture ?? null,
        }));
        const followingIds = new Set(following.map(f => f.id));
        setSearchRes(found.filter(u => followingIds.has(u.id)));
      } catch {
        setSearchRes([]);
      } finally {
        setLoadingS(false);
      }
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [query, following]);

  // Save mentions if fluxId is available (post-creation flow)
  const handleSaveMentions = async () => {
    if (!selectedMentions.length || !fluxId) return;
    setAdding(true);
    setAddError(null);
    try {
      await mentionFlux(fluxId, selectedMentions);
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (err: any) {
      setAddError(err?.response?.data?.message ?? "Failed to save mentions.");
    } finally {
      setAdding(false);
    }
  };

  const displayList = query.trim() ? searchRes : following;
  const loading     = query.trim() ? loadingS : loadingF;
  const pickedUsers = following.filter(u => selectedMentions.includes(u.id));
  const PILL        = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", flexShrink: 0 }}>
        Mention people
      </p>

      {/* Selected chips */}
      {pickedUsers.length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", flexShrink: 0, paddingBottom: 4 }}>
          {pickedUsers.map(u => (
            <div key={u.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg,#6B3FA0,#2979FF)", overflow: "hidden",
                }}>
                  {u.avatar && <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <button
                  onClick={() => onToggle(u.id, u.name, u.username)}
                  style={{
                    position: "absolute", top: -3, right: -3,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "#FF3B30", border: "1px solid #fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff", fontSize: 8, padding: 0,
                  }}
                >✕</button>
              </div>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 9, maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                @{u.username}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 10, flexShrink: 0,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <Search size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people you follow…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 12 }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <X size={11} color="rgba(255,255,255,0.4)" />
          </button>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, textAlign: "center", flexShrink: 0 }}>
        Only people you follow can be mentioned
      </p>

      {/* User list */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: 2 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 20 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #8860D9", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
        {!loading && displayList.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", paddingTop: 20 }}>
            {query ? "No matching people in your following" : "You are not following anyone yet"}
          </p>
        )}
        {!loading && displayList.map(u => {
          const isSel = selectedMentions.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() => onToggle(u.id, u.name, u.username)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 8px", borderRadius: 10, width: "100%",
                textAlign: "left", cursor: "pointer",
                background: isSel ? "rgba(136,96,217,0.2)" : "transparent",
                border: isSel ? "1px solid rgba(136,96,217,0.4)" : "1px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg,#6B3FA0,#2979FF)", overflow: "hidden",
              }}>
                {u.avatar && <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name}
                </p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  @{u.username}
                </p>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isSel ? PILL : "rgba(255,255,255,0.08)",
                border: isSel ? "none" : "1px solid rgba(255,255,255,0.2)",
                transition: "background 0.15s",
              }}>
                {isSel && <Check size={10} color="#fff" />}
              </div>
            </button>
          );
        })}
      </div>
      {/* Save button — only shown when fluxId exists (edit/post-creation) */}
      {fluxId && (
        <div style={{ flexShrink: 0, paddingTop: 6 }}>
          {addError && (
            <p style={{ color: "#ff6b6b", fontSize: 10, textAlign: "center", marginBottom: 6 }}>{addError}</p>
          )}
          <button
            onClick={handleSaveMentions}
            disabled={selectedMentions.length === 0 || adding}
            style={{
              width: "100%", height: 40, borderRadius: 20,
              background: selectedMentions.length > 0 ? PILL : "rgba(255,255,255,0.08)",
              border: "none", color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: selectedMentions.length > 0 ? "pointer" : "default",
              transition: "background 0.2s",
            }}
          >
            {adding ? "Saving…" : addSuccess ? "✓ Saved!" : selectedMentions.length > 0
              ? `Mention ${selectedMentions.length} person${selectedMentions.length > 1 ? "s" : ""}`
              : "Select people to mention"}
          </button>
        </div>
      )}
      {/* Pre-posting confirmation — shown when selecting users before post */}
      {!fluxId && (
        <div style={{
          flexShrink: 0,
          padding: "8px 10px",
          borderRadius: 10,
          background: selectedMentions.length > 0
            ? "rgba(136,96,217,0.12)"
            : "rgba(255,255,255,0.04)",
          border: selectedMentions.length > 0
            ? "1px solid rgba(136,96,217,0.3)"
            : "1px solid rgba(255,255,255,0.07)",
          transition: "all 0.2s",
        }}>
          <p style={{ color: selectedMentions.length > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontSize: 10, textAlign: "center", lineHeight: 1.5 }}>
            {selectedMentions.length > 0
              ? `✓ ${selectedMentions.length} person${selectedMentions.length > 1 ? "s" : ""} will be mentioned when you post — notifications will be sent automatically`
              : "Select people above to mention them in your flux"}
          </p>
        </div>
      )}
    </div>
  );
}

function StickerPanel({ onSelect }: { onSelect: (s: StickerItem) => void }) {
  const [tab,     setTab]     = useState<"trending" | "search">("trending");
  const [query,   setQuery]   = useState("");
  const [stickers,setStickers]= useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadTrending = () => {
    setLoading(true);
    import("@/services/mediaService")
      .then(m => m.getTrendingStickers())
      .then(setStickers).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTrending(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { loadTrending(); return; }
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      import("@/services/mediaService")
        .then(m => m.searchStickers(query.trim()))
        .then(setStickers).catch(() => {})
        .finally(() => setLoading(false));
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const PILL = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", flexShrink: 0 }}>Add sticker</p>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 12px", borderRadius: 10, flexShrink: 0,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
      }}>
        <Search size={13} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setTab("search"); }}
          placeholder="Search GIFs & stickers…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 12 }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setTab("trending"); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <X size={11} color="rgba(255,255,255,0.4)" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {(["trending", "search"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
            cursor: "pointer", border: "none",
            background: tab === t ? PILL : "rgba(255,255,255,0.08)",
            color: "#fff",
          }}>
            {t === "trending" ? "🔥 Trending" : "🔍 Search"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #8860D9", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : stickers.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", paddingTop: 20 }}>No stickers found</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
            {stickers.map(s => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                style={{
                  aspectRatio: "1", borderRadius: 10, overflow: "hidden",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", padding: 0,
                }}
              >
                <img src={s.url} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function TextPanel({
  onFontChange,
  onColorChange,
  onAnimationChange,
  onEffectChange,
  onCreateText,
  textLayers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: {
  onFontChange:      (f: string) => void;
  onColorChange:     (c: string) => void;
  onAnimationChange: (a: string) => void;
  onEffectChange:    (e: string) => void;
  onCreateText:      () => void;
  textLayers:        any[];
  selectedLayerId:   string | null;
  onSelectLayer:     (id: string) => void;
  onUpdateLayer:     (id: string, updates: any) => void;
}) {
  // Always read fresh from textLayers — never cache in local var
  const getSelected = () => textLayers.find(l => l.id === selectedLayerId) ?? null;
  const selected = getSelected();

  const FONTS = ["Inter", "Poppins", "Courier New", "Georgia", "Impact"];
  const FONT_LABELS = ["Inter", "Poppins", "Typewriter", "Serif", "Bold"];
  const COLORS_LIST = [
    "#ffffff","#000000","#FF3B30","#FF9500","#FFCC00",
    "#34C759","#007AFF","#5856D6","#FF2D55","#AF52DE",
    "#ff6b6b","#feca57","#48dbfb","#ff9ff3","#54a0ff",
  ];
  const ANIMS = [
    { id: "none",    label: "None"   },
    { id: "fade",    label: "Fade"   },
    { id: "slideUp", label: "Slide↑" },
    { id: "zoom",    label: "Zoom"   },
    { id: "bounce",  label: "Bounce" },
    { id: "pulse",   label: "Pulse"  },
  ];
  const EFFECTS = [
    { id: "none",      label: "None"      },
    { id: "neon",      label: "Neon"      },
    { id: "gradient",  label: "Gradient"  },
    { id: "shadow",    label: "Shadow"    },
    { id: "highlight", label: "Highlight" },
  ];

  const update = (updates: any) => {
    if (!selected) return;
    onUpdateLayer(selected.id, updates);
  };

  return (
    <div
      className="flex flex-col gap-4 h-full overflow-y-auto"
      style={{ scrollbarWidth: "none" }}
    >
      {/* ── Live text textarea */}
      <div>
        <p className="text-white text-[12px] font-semibold mb-2 opacity-60">
          {textLayers.length === 0 ? "Add text" : selected ? "Editing layer" : "Select a layer below"}
        </p>
        <textarea
          value={selected?.text ?? ""}
          onChange={(e) => {
            if (!selected) { onCreateText(); return; }
            update({ text: e.target.value });
          }}
          onFocus={() => { if (textLayers.length === 0) onCreateText(); }}
          placeholder="Tap here to start typing…"
          rows={3}
          style={{
            width:        "100%",
            background:   selected ? "rgba(136,96,217,0.08)" : "rgba(255,255,255,0.06)",
            border:       `1px solid ${selected ? "rgba(136,96,217,0.6)" : "rgba(255,255,255,0.12)"}`,
            borderRadius: 10,
            color:        "#fff",
            fontSize:     13,
            padding:      "8px 10px",
            outline:      "none",
            resize:       "none",
            fontFamily:   selected?.font ?? "Inter",
            boxSizing:    "border-box",
            transition:   "border-color 0.2s, background 0.2s",
          }}
        />
        {!selected && textLayers.length > 0 && (
          <p style={{ color: "rgba(136,96,217,0.7)", fontSize: 10, marginTop: 4 }}>
            👆 Click a text on the preview or select a layer below
          </p>
        )}
        {textLayers.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, marginTop: 4 }}>
            Click the textarea above or press + Add Text
          </p>
        )}
      </div>

      {/* ── Font size */}
      <div style={{ opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <p className="text-white text-[12px] font-semibold opacity-60">Size</p>
          <span style={{ color: "#8860D9", fontSize: 12, fontWeight: 700 }}>
            {selected?.fontSize ?? 32}px
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => update({ fontSize: Math.max(12, (selected?.fontSize ?? 32) - 4) })}
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >−</button>
          <input
            type="range" min={12} max={80}
            value={selected?.fontSize ?? 32}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            style={{ flex: 1, accentColor: "#8860D9" }}
          />
          <button
            onClick={() => update({ fontSize: Math.min(80, (selected?.fontSize ?? 32) + 4) })}
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >+</button>
        </div>
      </div>

      {/* ── Font */}
      <div style={{ opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
        <p className="text-white text-[12px] font-semibold mb-2 opacity-60">Font</p>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
          {FONTS.map((f, i) => {
            const isActive = selected?.font === f;
            return (
              <button
                key={f}
                onClick={() => { onFontChange(f); update({ font: f }); }}
                style={{
                  flexShrink:   0,
                  padding:      "6px 12px",
                  borderRadius: 20,
                  fontSize:     11,
                  fontFamily:   f,
                  cursor:       "pointer",
                  border:       "none",
                  background:   isActive ? "rgba(136,96,217,0.5)" : "rgba(255,255,255,0.08)",
                  color:        "#fff",
                  outline:      isActive ? "2px solid #8860D9" : "none",
                  outlineOffset: 1,
                  whiteSpace:   "nowrap",
                  transition:   "background 0.15s",
                }}
              >
                {FONT_LABELS[i]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Color */}
      <div style={{ opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
        <p className="text-white text-[12px] font-semibold mb-2 opacity-60">Text Color</p>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {COLORS_LIST.map((c) => {
            const isActive = selected?.color === c;
            return (
              <button
                key={c}
                onClick={() => { onColorChange(c); update({ color: c }); }}
                style={{
                  width:        28,
                  height:       28,
                  borderRadius: "50%",
                  background:   c,
                  border:       isActive ? "3px solid #fff" : "2px solid rgba(255,255,255,0.15)",
                  cursor:       "pointer",
                  boxShadow:    isActive ? "0 0 0 2px #8860D9" : "none",
                  transition:   "box-shadow 0.15s, border 0.15s",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Alignment */}
      <div style={{ opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
        <p className="text-white text-[12px] font-semibold mb-2 opacity-60">Align</p>
        <div style={{ display: "flex", gap: 6 }}>
          {(["left", "center", "right"] as const).map(a => {
            const isActive = (selected?.align ?? "center") === a;
            return (
              <button
                key={a}
                onClick={() => update({ align: a })}
                style={{
                  flex:         1,
                  padding:      "7px 0",
                  borderRadius: 8,
                  background:   isActive ? "rgba(136,96,217,0.45)" : "rgba(255,255,255,0.08)",
                  border:       isActive ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.1)",
                  color:        isActive ? "#fff" : "rgba(255,255,255,0.55)",
                  fontSize:     16,
                  cursor:       "pointer",
                  transition:   "background 0.15s, border 0.15s",
                  fontWeight:   isActive ? 700 : 400,
                }}
              >
                {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Animation */}
      <div style={{ opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
        <p className="text-white text-[12px] font-semibold mb-2 opacity-60">Animation</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ANIMS.map(a => {
            const isActive = (selected?.animation ?? "none") === a.id;
            return (
              <button
                key={a.id}
                onClick={() => { onAnimationChange(a.id); update({ animation: a.id }); }}
                style={{
                  padding:      "5px 10px",
                  borderRadius: 20,
                  fontSize:     11,
                  cursor:       "pointer",
                  border:       isActive ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.12)",
                  background:   isActive ? "rgba(136,96,217,0.5)" : "rgba(255,255,255,0.07)",
                  color:        "#fff",
                  transition:   "background 0.15s, border 0.15s",
                  fontWeight:   isActive ? 700 : 400,
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Effect */}
      <div style={{ opacity: selected ? 1 : 0.35, pointerEvents: selected ? "auto" : "none" }}>
        <p className="text-white text-[12px] font-semibold mb-2 opacity-60">Effect</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {EFFECTS.map(ef => {
            const isActive = (selected?.effect ?? "none") === ef.id;
            return (
              <button
                key={ef.id}
                onClick={() => { onEffectChange(ef.id); update({ effect: ef.id }); }}
                style={{
                  padding:      "5px 10px",
                  borderRadius: 20,
                  fontSize:     11,
                  cursor:       "pointer",
                  border:       isActive ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.12)",
                  background:   isActive ? "rgba(136,96,217,0.5)" : "rgba(255,255,255,0.07)",
                  color:        "#fff",
                  transition:   "background 0.15s, border 0.15s",
                  fontWeight:   isActive ? 700 : 400,
                }}
              >
                {ef.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Delete selected layer */}
      {selected && (
        <button
          onClick={() => {
            onUpdateLayer(selected.id, { _delete: true });
          }}
          style={{
            padding: "6px 0", borderRadius: 8,
            background: "rgba(255,59,48,0.15)", border: "1px solid rgba(255,59,48,0.3)",
            color: "#FF3B30", fontSize: 12, cursor: "pointer", fontWeight: 600,
          }}
        >
          🗑 Delete this text
        </button>
      )}

      {/* ── Layer list */}
      {textLayers.length > 0 && (
        <div>
          <p className="text-white text-[12px] font-semibold mb-2 opacity-60">
            Layers ({textLayers.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {textLayers.map((l, i) => {
              const isActive = selectedLayerId === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => onSelectLayer(l.id)}
                  style={{
                    padding:      "7px 10px",
                    borderRadius: 8,
                    background:   isActive ? "rgba(136,96,217,0.3)" : "rgba(255,255,255,0.06)",
                    border:       isActive ? "1px solid #8860D9" : "1px solid rgba(255,255,255,0.08)",
                    color:        "#fff",
                    fontSize:     11,
                    textAlign:    "left",
                    cursor:       "pointer",
                    overflow:     "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:   "nowrap",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          6,
                  }}
                >
                  <span style={{ opacity: 0.4, fontSize: 9 }}>T</span>
                  {l.text || `Text layer ${i + 1}`}
                  {isActive && <span style={{ marginLeft: "auto", color: "#8860D9", fontSize: 9 }}>● editing</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Text + Open Full Editor */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto", paddingTop: 8 }}>
        <button
          onClick={() => {
            const id = `txt_${Date.now()}`;
            onUpdateLayer("__new__", { __new__: true, id });
            onCreateText();
          }}
          style={{
            width: "100%", height: 36, borderRadius: 18,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          + Add new text
        </button>
        <button
          onClick={onCreateText}
          style={{
            width: "100%", height: 38, borderRadius: 19,
            background: GRADIENT, border: "none", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          ✏️ Open Full Editor
        </button>
      </div>
    </div>
  );
}
//  Main Export 

interface FluxRightPanelProps {
  activeTool:       FluxTool;
  selectedSong:     string | null;
  selectedLocation: string | null;
  selectedMentions: string[];
  selectedFilter:   string;
  fluxId?: string;
  mediaPreview:     string | null;
  mediaType:        "image" | "video" | null;
  onSongSelect: (id: string, title: string, artist: string, previewUrl: string | null, albumArt: string | null, mode?: "music_only" | "lyrics", lyricsStyle?: "karaoke" | "line" | "floating", trimStart?: number, trimEnd?: number) => void;
  onLocationSelect: (loc: string, details?: { placeId?: string; lat?: number; lng?: number; category?: string }) => void;
  onMentionToggle:  (id: string, name: string, username: string) => void;
  onFilterSelect:   (id: string, value: string) => void;
  onStickerSelect:  (s: StickerItem) => void;
  onFontChange:     (f: string) => void;
  onColorChange:    (c: string) => void;
  onAnimationChange:(a: string) => void;
  onEffectChange:   (e: string) => void;
  onCreateText:     () => void;
  textLayers:       any[];
  selectedLayerId:  string | null;
  onSelectLayer:    (id: string) => void;
  onUpdateLayer:    (id: string, updates: any) => void;
}

export default function FluxRightPanel({
  activeTool,
  selectedSong,
  selectedLocation,
  selectedMentions,
  selectedFilter,
  fluxId,
  mediaPreview,
  mediaType,
  onSongSelect,
  onLocationSelect,
  onMentionToggle,
  onFilterSelect,
  onStickerSelect,
  onFontChange,
  onColorChange,
  onAnimationChange,
  onEffectChange,
  onCreateText,
  textLayers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: FluxRightPanelProps) {
  if (!activeTool) return null;

return (
    <div className="flex flex-col h-full w-full">
      {activeTool === "music"    && (
        <MusicPanel selectedSong={selectedSong} onSelect={onSongSelect} />
      )}
      {activeTool === "filter" && (
        <FilterPanel
          selectedFilter={selectedFilter}
          onSelect={onFilterSelect}
          mediaPreview={mediaPreview}
          mediaType={mediaType}
        />
      )}
      {activeTool === "location" && (
        <LocationPanel
          selectedLocation={selectedLocation}
          onSelect={(loc, details) => onLocationSelect(loc, details)}
        />
      )}
      {activeTool === "mention" && (
        <MentionPanel
          selectedMentions={selectedMentions}
          onToggle={onMentionToggle}
          fluxId={fluxId} 
        />
      )}
      {activeTool === "sticker" && (
        <StickerPanel onSelect={onStickerSelect} />
      )}
      {activeTool === "text" && (
        <TextPanel
          onFontChange={onFontChange}
          onColorChange={onColorChange}
          onAnimationChange={onAnimationChange}
          onEffectChange={onEffectChange}
          onCreateText={onCreateText}
          textLayers={textLayers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={onSelectLayer}
          onUpdateLayer={onUpdateLayer}
        />
      )}
    </div>
  );
}
