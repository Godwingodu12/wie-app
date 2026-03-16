"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Play, Heart, Check, VolumeX } from "lucide-react";
import Image from "next/image";
import { searchMusic, getTrendingMusic } from "@/services/mediaService";
import { searchLocations, getLocationDetails, categoryIcon } from '@/services/locationService';
import type { PlaceSuggestion } from '@/services/locationService';
import type { SpotifyTrack } from "@/types/media";
import type { FluxTool } from "@/types/flux";
// ── Dummy data 
const SONGS = [
  { id: "1", title: "Pon Veene Duet",   artist: "M G Sreekumer", duration: "2:30", liked: false },
  { id: "2", title: "Kaderum Komba",    artist: "Jakes Bejoy",   duration: "2:30", liked: true  },
  { id: "3", title: "Pon Veene Duet",   artist: "M G Sreekumer", duration: "2:30", liked: false },
  { id: "4", title: "Pon Veene Duet",   artist: "M G Sreekumer", duration: "2:30", liked: false },
  { id: "5", title: "Pon Veene Duet",   artist: "M G Sreekumer", duration: "2:30", liked: false },
  { id: "6", title: "Pon Veene Duet",   artist: "M G Sreekumer", duration: "2:30", liked: false },
];

const LOCATIONS = [
  "Vismaya Cinemas, Perinthalmanna",
  "Plaza Movies, Perinthalmanna",
  "Parambikkulam Tiger Reserve",
  "Nagarhole Tiger Reserve",
  "Kabani Tiger Reserve",
  "Periyar Tiger Reserve",
];

const FILTERS = [
  { id: "none",  label: "None",            color: null },
  { id: "star1", label: "Star pattern",    color: "#6B3FA0" },
  { id: "bw",    label: "Black and white", color: "#222" },
  { id: "star2", label: "Star pattern",    color: "#5B2D8E" },
  { id: "star3", label: "Star pattern",    color: "#4A1A7A" },
  { id: "star4", label: "Star pattern",    color: "#7B3FB5" },
];

const FILTER_TABS = ["Patterns", "Colours", "Gradient", "Gradient", "Gradient"];

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
    albumArt: string | null
  ) => void;
}) {
  const [tab,     setTab]     = useState<"foryou" | "trending" | "liked">("trending");
  const [query,   setQuery]   = useState("");
  const [tracks,  setTracks]  = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingMusic();
      setTracks(data);
    } catch {
      setError("Could not load music");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    loadTrending();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      loadTrending();
      return;
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchMusic(query.trim(), 10)
        .then(setTracks)
        .catch(() => setError("Search failed"))
        .finally(() => setLoading(false));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const PILL = "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10 }}>

      {/* Title */}
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, textAlign: "center", flexShrink: 0 }}>
        Choose song
      </p>

      {/* Search */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 12px", borderRadius: 10, flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Search size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 12,
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <X size={12} color="rgba(255,255,255,0.4)" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {(["foryou", "trending", "liked"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 500,
              cursor: "pointer", border: "none",
              background: tab === t ? PILL : "rgba(255,255,255,0.08)",
              color: "#fff",
              outline: tab === t ? "none" : "1px solid rgba(255,255,255,0.14)",
            }}
          >
            {t === "foryou" ? "For you" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          msOverflowStyle: "none",
          scrollbarWidth: "none",
          paddingRight: 2,
        }}
      >
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {error ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center", paddingTop: 24 }}>
            {error}
          </p>
        ) : loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 24 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: "2px solid #8860D9", borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : tracks.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", paddingTop: 24 }}>
            No results
          </p>
        ) : (
          tracks.map((track) => {
            const isSelected = selectedSong === track.id;
            const hasPreview = Boolean(track.previewUrl);
            return (
              <button
                key={track.id}
                // Direct onClick — this IS a user gesture so audio.play() will work
                onClick={() => {
                  console.log("🖱️ Track clicked:", track.title, "previewUrl:", track.previewUrl);
                  onSelect(track.id, track.title, track.artist, track.previewUrl, track.albumArt);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 8px", borderRadius: 10, width: "100%",
                  textAlign: "left", cursor: "pointer",
                  background: isSelected ? "rgba(136,96,217,0.2)" : "transparent",
                  border: isSelected
                    ? "1px solid rgba(136,96,217,0.45)"
                    : "1px solid transparent",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                {/* Album art */}
                <div style={{
                  position: "relative", width: 36, height: 36, borderRadius: 8,
                  flexShrink: 0, overflow: "hidden",
                  background: "linear-gradient(135deg,#6B3FA0,#2979FF)",
                }}>
                  {track.albumArt && (
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                  {isSelected && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 12 }}>
                        {[55, 100, 70].map((h, i) => (
                          <div key={i} style={{
                            width: 2, borderRadius: 2, background: "#fff",
                            height: `${h}%`,
                            animation: "bounce 0.6s ease infinite alternate",
                            animationDelay: `${i * 0.12}s`,
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* No preview badge */}
                  {!hasPreview && (
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      background: "rgba(0,0,0,0.7)", borderRadius: "4px 0 8px 0",
                      padding: "1px 3px",
                    }}>
                      <VolumeX size={7} color="rgba(255,255,255,0.5)" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: "#fff", fontSize: 12, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    lineHeight: 1.3,
                  }}>
                    {track.title}
                  </p>
                  <p style={{
                    color: "rgba(255,255,255,0.4)", fontSize: 10,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginTop: 1,
                  }}>
                    {track.artist} • {track.duration}
                    {!hasPreview && <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>no preview</span>}
                  </p>
                </div>

                {/* Select indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isSelected
                    ? PILL
                    : "rgba(255,255,255,0.07)",
                  border: isSelected ? "none" : "1px solid rgba(255,255,255,0.14)",
                }}>
                  {isSelected
                    ? <Check size={10} color="#fff" />
                    : <Heart size={10} color="rgba(255,255,255,0.3)" />
                  }
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Inline keyframes for spin + bounce */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }
      `}</style>
    </div>
  );
}

function FilterPanel({
  selectedFilter,
  onSelect,
}: {
  selectedFilter: string;
  onSelect: (id: string) => void;
}) {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex flex-col h-full">
      {/* Filter tab bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {FILTER_TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              background: tab === i ? "rgba(255,255,255,0.15)" : "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filter list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className="flex items-center gap-4 p-2 rounded-xl transition-all text-left"
            style={{
              border:
                selectedFilter === f.id
                  ? "2px solid #8860D9"
                  : "2px solid transparent",
            }}
          >
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background:
                  f.color ||
                  "rgba(255,255,255,0.08)",
                border:
                  selectedFilter === f.id
                    ? "2px solid #fff"
                    : "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {f.id === "none" && (
                <span className="text-white/50 text-[18px]">∅</span>
              )}
            </div>
            <span className="text-white text-[14px]">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10">
        <button className="text-white/50 hover:text-white transition-colors">
          <span className="text-[20px]">🗑️</span>
        </button>
        <button
          className="px-5 py-2 rounded-full text-white text-[13px] font-semibold"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          Done
        </button>
      </div>
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
}: {
  selectedMentions: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = FOLLOWERS.filter(
    (f) =>
      f.name.toLowerCase().includes(query.toLowerCase()) ||
      f.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-white font-semibold text-[16px] text-center mb-4">
        Add mentions
      </h3>

      {/* Selected chips */}
      {selectedMentions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          <button className="text-white/40 flex-shrink-0">{"<"}</button>
          {selectedMentions.map((id) => {
            const user = FOLLOWERS.find((f) => f.id === id);
            if (!user) return null;
            return (
              <div key={id} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ background: "linear-gradient(135deg,#6B3FA0,#2979FF)" }}
                  />
                  <button
                    onClick={() => onToggle(id)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"
                  >
                    <X size={8} className="text-white" />
                  </button>
                </div>
                <span className="text-white/60 text-[10px]">{user.name}</span>
              </div>
            );
          })}
          <button className="text-white/40 flex-shrink-0">{">"}</button>
        </div>
      )}

      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Search size={14} className="text-white/40" />
        <input
          className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-white/40"
          placeholder="Search here.."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-2">
        {filtered.map((user) => {
          const isSelected = selectedMentions.includes(user.id);
          return (
            <button
              key={user.id}
              onClick={() => onToggle(user.id)}
              className="flex items-center gap-3 p-2 rounded-xl text-left transition-all"
            >
              <div
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#6B3FA0,#2979FF)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-[14px] font-semibold">{user.name}</p>
                <p className="text-white/50 text-[12px]">{user.username}</p>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                style={{
                  background: isSelected ? GRADIENT : "transparent",
                  borderColor: isSelected ? "transparent" : "rgba(255,255,255,0.3)",
                }}
              >
                {isSelected && <Check size={12} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StickerPanel({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [tab, setTab]     = useState<"foryou" | "trending">("foryou");
  const [query, setQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-white font-semibold text-[16px] text-center mb-4">
        Add stickers
      </h3>
      <div
        className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <Search size={14} className="text-white/40" />
        <input
          className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-white/40"
          placeholder="Search your stickers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mb-4">
        {(["foryou", "trending"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-full text-[12px] font-medium transition-all"
            style={{
              background: tab === t ? "rgba(255,255,255,0.15)" : "transparent",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {t === "foryou" ? "For you" : "Trending"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="grid grid-cols-4 gap-3">
          {STICKER_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => onSelect(emoji)}
              className="aspect-square rounded-xl flex items-center justify-center text-[28px] transition-all hover:scale-110 hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TextPanel({
  onFontChange,
  onColorChange,
  onAnimationChange,
  onEffectChange,
}: {
  onFontChange: (f: string) => void;
  onColorChange: (c: string) => void;
  onAnimationChange: (a: string) => void;
  onEffectChange: (e: string) => void;
}) {
  const [selectedFont,      setSelectedFont]      = useState(0);
  const [selectedColor,     setSelectedColor]     = useState(0);
  const [selectedAnimation, setSelectedAnimation] = useState(0);
  const [selectedEffect,    setSelectedEffect]    = useState(0);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Font styles */}
      <div>
        <p className="text-white text-[14px] font-semibold mb-3">Font styles</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {FONT_STYLES.map((f, i) => (
            <button
              key={i}
              onClick={() => { setSelectedFont(i); onFontChange(f); }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-medium transition-all"
              style={{
                background: selectedFont === i ? "rgba(255,255,255,0.18)" : "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                fontFamily: f === "Road Rage" ? "serif" : "sans-serif",
                fontWeight: f === "Road Rage" ? 800 : 500,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Font colors */}
      <div>
        <p className="text-white text-[14px] font-semibold mb-3">Font colours</p>
        <div className="flex gap-3 flex-wrap">
          {FONT_COLORS.map((color, i) => (
            <button
              key={i}
              onClick={() => { setSelectedColor(i); onColorChange(color); }}
              className="transition-all hover:scale-110"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: color.startsWith("conic") ? color : color,
                border: selectedColor === i ? "2px solid #fff" : "2px solid transparent",
                outline: selectedColor === i ? "2px solid rgba(255,255,255,0.4)" : "none",
              }}
            >
              {i === 0 && (
                <span className="text-[14px] text-white/60">✎</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Animations */}
      <div>
        <p className="text-white text-[14px] font-semibold mb-3">Animations</p>
        <div className="flex gap-2 flex-wrap">
          {ANIMATIONS.map((a, i) => (
            <button
              key={i}
              onClick={() => { setSelectedAnimation(i); onAnimationChange(a); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: selectedAnimation === i ? "rgba(255,255,255,0.18)" : "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {i === 0 && "⊘"} {i === 1 && "→"} {i === 2 && "←"} {i === 3 && "↓"} {i === 4 && "↑"}
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Text effects */}
      <div>
        <p className="text-white text-[14px] font-semibold mb-3">Text effects</p>
        <div className="flex gap-2 flex-wrap">
          {TEXT_EFFECTS.map((e, i) => (
            <button
              key={i}
              onClick={() => { setSelectedEffect(i); onEffectChange(e); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: selectedEffect === i ? GRADIENT : "transparent",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {i === 0 && "⊘"} {i === 1 && "✦"} {i === 2 && "▣"} {i === 3 && "◉"} {i === 4 && "↑"}
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/10">
        <button className="text-white/50 hover:text-white">
          <span className="text-[20px]">🗑️</span>
        </button>
        <button className="text-white/50 hover:text-white">
          <span className="text-[20px]">☰</span>
        </button>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[14px]"
          style={{ background: GRADIENT }}
        >
          T
        </div>
        <button
          className="px-5 py-2 rounded-full text-white text-[13px] font-semibold"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

//  Main Export 

interface FluxRightPanelProps {
  activeTool: FluxTool;
  selectedSong: string | null;
  selectedLocation: string | null;
  selectedMentions: string[];
  selectedFilter: string;
  onSongSelect: (id: string, title: string, artist: string, previewUrl: string | null, albumArt: string | null) => void;
  onLocationSelect:  (loc: string, details?: { placeId?: string; lat?: number; lng?: number; category?: string }) => void;
  onMentionToggle: (id: string) => void;
  onFilterSelect: (id: string) => void;
  onStickerSelect: (emoji: string) => void;
  onFontChange: (f: string) => void;
  onColorChange: (c: string) => void;
  onAnimationChange: (a: string) => void;
  onEffectChange: (e: string) => void;
}

export default function FluxRightPanel({
  activeTool,
  selectedSong,
  selectedLocation,
  selectedMentions,
  selectedFilter,
  onSongSelect,
  onLocationSelect,
  onMentionToggle,
  onFilterSelect,
  onStickerSelect,
  onFontChange,
  onColorChange,
  onAnimationChange,
  onEffectChange,
}: FluxRightPanelProps) {
  if (!activeTool) return null;

return (
    <div className="flex flex-col h-full w-full">
      {activeTool === "music"    && (
        <MusicPanel
          selectedSong={selectedSong}
          onSelect={onSongSelect}
        />
      )}
      {activeTool === "filter"   && (
        <FilterPanel
          selectedFilter={selectedFilter}
          onSelect={onFilterSelect}
        />
      )}
      {activeTool === "location" && (
        <LocationPanel
          selectedLocation={selectedLocation}
          onSelect={(loc, details) => onLocationSelect(loc, details)}
        />
      )}
      {activeTool === "mention"  && (
        <MentionPanel
          selectedMentions={selectedMentions}
          onToggle={onMentionToggle}
        />
      )}
      {activeTool === "sticker"  && (
        <StickerPanel onSelect={onStickerSelect} />
      )}
      {activeTool === "text"     && (
        <TextPanel
          onFontChange={onFontChange}
          onColorChange={onColorChange}
          onAnimationChange={onAnimationChange}
          onEffectChange={onEffectChange}
        />
      )}
    </div>
  );
}