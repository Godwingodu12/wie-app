'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Navigation, Loader2, Search, LocateFixed } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: {
    latitude: number;
    longitude: number;
    address?: string;
    name?: string;
    isLive: boolean;
    liveExpiry?: string;
  }) => void;
}

// ── Script loader ─────────────────────────────────────────────────────────────
let _scriptPromise: Promise<void> | null = null;

function loadGMaps(apiKey: string): Promise<void> {
  if (_scriptPromise) return _scriptPromise;
  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return (_scriptPromise = Promise.resolve());
  }
  _scriptPromise = new Promise((resolve, reject) => {
    const script  = document.createElement('script');
    script.src    = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async  = true;
    script.onload  = () => resolve();
    script.onerror = () => { _scriptPromise = null; reject(new Error('GMaps load failed')); };
    document.head.appendChild(script);
  });
  return _scriptPromise;
}

// ── Reverse geocode ────────────────────────────────────────────────────────────
function reverseGeocode(lat: number, lng: number): Promise<{ address: string; name: string }> {
  return new Promise(resolve => {
    if (!window.google?.maps?.Geocoder) {
      return resolve({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, name: 'Selected Location' });
    }
    new window.google.maps.Geocoder().geocode(
      { location: { lat, lng } },
      (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          const comps = results[0].address_components || [];
          const name  =
            comps.find((c: any) =>
              c.types.some((t: string) =>
                ['point_of_interest', 'establishment', 'route', 'neighborhood'].includes(t),
              ),
            )?.long_name ||
            comps[0]?.long_name ||
            'Selected Location';
          resolve({ address: results[0].formatted_address, name });
        } else {
          resolve({ address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, name: 'Selected Location' });
        }
      },
    );
  });
}

// ── IP-based location fallback (no permission needed) ─────────────────────────
async function getIPLocation(): Promise<{ lat: number; lng: number } | null> {
  try {
    const r    = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
    const data = await r.json();
    if (data.latitude && data.longitude) {
      return { lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) };
    }
  } catch { /* silent */ }
  return null;
}

// ── Dark map style ─────────────────────────────────────────────────────────────
const DARK_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry',         stylers: [{ color: '#2c2c54' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water',   elementType: 'geometry', stylers: [{ color: '#0d1b2a' }] },
  { featureType: 'poi',     elementType: 'geometry', stylers: [{ color: '#1e1e3f' }] },
  { featureType: 'poi.park',elementType: 'geometry', stylers: [{ color: '#16213e' }] },
];

declare global { interface Window { google: any } }

// ─────────────────────────────────────────────────────────────────────────────
export default function LocationPickerModal({ isOpen, onClose, onSend }: LocationPickerModalProps) {
  const { themeStyles, isDark } = useTheme();

  const mapDivRef      = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<any>(null);          // google.maps.Map instance
  const markerRef      = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapBuiltRef    = useRef(false);              // guard: map built exactly once

  const [mapsReady,    setMapsReady]    = useState(false);
  const [mapsError,    setMapsError]    = useState<string | null>(null);
  const [isLocating,   setIsLocating]   = useState(false);
  const [locationMsg,  setLocationMsg]  = useState('Finding your location…');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isLive,       setIsLive]       = useState(false);
  const [liveDuration, setLiveDuration] = useState<15 | 60 | 480>(15);
  const [selected, setSelected] = useState<{
    lat: number; lng: number; address?: string; name?: string;
  } | null>(null);

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_API || '';

  // ── Move/place the draggable marker ────────────────────────────────────────
  const placeMarker = useCallback(async (lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;

    const pos = { lat, lng };
    map.panTo(pos);
    map.setZoom(16);

    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position:  pos,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        icon: {
          path:         window.google.maps.SymbolPath.CIRCLE,
          scale:        11,
          fillColor:    '#5494FF',
          fillOpacity:  1,
          strokeColor:  '#fff',
          strokeWeight: 2.5,
        },
      });
      markerRef.current.addListener('dragend', async () => {
        const p   = markerRef.current.getPosition();
        const geo = await reverseGeocode(p.lat(), p.lng());
        setSelected({ lat: p.lat(), lng: p.lng(), ...geo });
      });
    }

    const geo = await reverseGeocode(lat, lng);
    setSelected({ lat, lng, ...geo });
  }, []);

  // ── Build map once (called after mapDivRef is guaranteed rendered) ──────────
  const buildMap = useCallback((initialLat: number, initialLng: number) => {
    if (mapBuiltRef.current || !mapDivRef.current || !window.google?.maps?.Map) return;
    mapBuiltRef.current = true;

    const map = new window.google.maps.Map(mapDivRef.current, {
      center:             { lat: initialLat, lng: initialLng },
      zoom:               13,
      disableDefaultUI:   true,
      zoomControl:        true,
      fullscreenControl:  false,
      gestureHandling:    'greedy',
      styles:             isDark ? DARK_STYLE : [],
    });
    mapRef.current = map;

    // Tap map → move marker
    map.addListener('click', (e: any) => {
      placeMarker(e.latLng.lat(), e.latLng.lng());
    });

    // Autocomplete on search input
    if (searchInputRef.current && window.google.maps.places?.Autocomplete) {
      const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ['geometry', 'formatted_address', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (place.geometry?.location) {
          placeMarker(place.geometry.location.lat(), place.geometry.location.lng());
        }
      });
    }
  }, [isDark, placeMarker]);

  // ── GPS fetch — tries high-accuracy, falls back to IP ──────────────────────
  const fetchGPS = useCallback(() => {
    return new Promise<{ lat: number; lng: number; source: string }>((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 0, lng: 0, source: 'none' });
        return;
      }

      // Timeout: after 10 s fall back to IP location
      let settled = false;
      const fallbackTimer = setTimeout(async () => {
        if (settled) return;
        settled = true;
        setLocationMsg('GPS timed out, using network location…');
        const ip = await getIPLocation();
        resolve(ip ? { ...ip, source: 'ip' } : { lat: 20.5937, lng: 78.9629, source: 'default' });
      }, 10000);

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          if (settled) return;
          settled = true;
          clearTimeout(fallbackTimer);
          resolve({ lat: coords.latitude, lng: coords.longitude, source: 'gps' });
        },
        async (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(fallbackTimer);

          if (err.code === err.PERMISSION_DENIED) {
            setLocationMsg('Location access denied, using network location…');
          } else {
            setLocationMsg('GPS unavailable, using network location…');
          }

          const ip = await getIPLocation();
          resolve(ip ? { ...ip, source: 'ip' } : { lat: 20.5937, lng: 78.9629, source: 'default' });
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 },
      );
    });
  }, []);

  // ── Click: re-centre to current GPS ────────────────────────────────────────
  const handleLocateMe = useCallback(async () => {
    if (!mapRef.current) return;           // map not built yet
    setIsLocating(true);
    setLocationMsg('Finding your location…');

    const { lat, lng } = await fetchGPS();
    setIsLocating(false);
    await placeMarker(lat, lng);
  }, [fetchGPS, placeMarker]);

  // ── On modal open: load GMaps SDK ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Full reset
    mapBuiltRef.current = false;
    mapRef.current      = null;
    if (markerRef.current) { markerRef.current.setMap?.(null); markerRef.current = null; }
    setSelected(null);
    setMapsError(null);
    setMapsReady(false);
    setSearchQuery('');
    setLocationMsg('Finding your location…');

    if (!API_KEY) {
      setMapsError('NEXT_PUBLIC_GOOGLE_MAP_API is not set.');
      return;
    }

    loadGMaps(API_KEY)
      .then(() => setMapsReady(true))
      .catch(() => setMapsError('Google Maps failed to load. Check your API key & billing.'));
  }, [isOpen, API_KEY]);

  // ── Once SDK ready AND div is rendered: build map, then get GPS ───────────
  useEffect(() => {
    if (!mapsReady || !isOpen) return;

    // Small rAF to guarantee mapDivRef.current is in the DOM
    const raf = requestAnimationFrame(async () => {
      setIsLocating(true);

      // 1. Get GPS / IP location first
      const { lat, lng } = await fetchGPS();
      setIsLocating(false);

      // 2. Build map centred at real location
      buildMap(lat, lng);

      // 3. Drop marker at real location
      //    use setTimeout to allow Map constructor to finish rendering
      setTimeout(() => placeMarker(lat, lng), 300);
    });

    return () => cancelAnimationFrame(raf);
  }, [mapsReady, isOpen, fetchGPS, buildMap, placeMarker]);

  const handleSend = () => {
    if (!selected) return;
    onSend({
      latitude:   selected.lat,
      longitude:  selected.lng,
      address:    selected.address,
      name:       selected.name,
      isLive,
      liveExpiry: isLive
        ? new Date(Date.now() + liveDuration * 60 * 1000).toISOString()
        : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}
    >
      <div
        className="w-full max-w-lg rounded-t-[24px] flex flex-col overflow-hidden"
        style={{
          height:          '90vh',
          backgroundColor: isDark ? '#121316' : '#ffffff',
          border:          `0.5px solid ${themeStyles.border}`,
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${themeStyles.border}` }}
        >
          <h3 className="text-[17px] font-semibold" style={{ color: themeStyles.text }}>
            Share Location
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: themeStyles.textSecondary }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Search ── */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${themeStyles.border}` }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              backgroundColor: isDark ? '#1e1e1e' : '#f3f4f6',
              border:          `1px solid ${themeStyles.border}`,
            }}
          >
            <Search size={15} style={{ color: themeStyles.textSecondary, flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for a place…"
              className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-40"
              style={{ color: themeStyles.text }}
            />
          </div>
        </div>

        {/* ── Map (fills remaining space) ── */}
        <div className="relative flex-1 min-h-0">

          {/* Actual map div — always rendered so ref is stable */}
          <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

          {/* Overlay: loading / error */}
          {(isLocating || !mapsReady) && !mapsError && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
              style={{ backgroundColor: isDark ? 'rgba(18,19,22,0.82)' : 'rgba(232,240,254,0.82)' }}
            >
              <Loader2 className="animate-spin text-[#5494FF]" size={30} />
              <span className="text-[13px]" style={{ color: themeStyles.textSecondary }}>
                {locationMsg}
              </span>
            </div>
          )}

          {mapsError && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center"
              style={{ backgroundColor: isDark ? '#1a1d23' : '#e8f0fe' }}
            >
              <MapPin size={30} className="text-red-400" />
              <span className="text-[13px] text-red-400">{mapsError}</span>
            </div>
          )}

          {/* Locate-me button */}
          {mapsReady && !mapsError && (
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              title="Jump to my current location"
              className="absolute bottom-4 right-4 flex items-center justify-center rounded-full shadow-xl transition-all active:scale-95 hover:opacity-85"
              style={{
                width:           '44px',
                height:          '44px',
                backgroundColor: isDark ? '#1e1e2e' : '#ffffff',
                border:          `1.5px solid ${isLocating ? '#5494FF' : themeStyles.border}`,
              }}
            >
              {isLocating
                ? <Loader2 size={18} className="animate-spin text-[#5494FF]" />
                : <LocateFixed size={18} style={{ color: '#5494FF' }} />
              }
            </button>
          )}
        </div>

        {/* ── Address preview ── */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{
            borderTop:       `1px solid ${themeStyles.border}`,
            minHeight:       '58px',
            backgroundColor: isDark ? '#121316' : '#ffffff',
          }}
        >
          {selected ? (
            <div className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 flex-shrink-0 text-[#5494FF]" />
              <div className="flex-1 min-w-0">
                {selected.name && selected.name !== 'Selected Location' && (
                  <p className="text-[13px] font-semibold truncate" style={{ color: themeStyles.text }}>
                    {selected.name}
                  </p>
                )}
                {selected.address && (
                  <p
                    className="text-[11px] leading-relaxed mt-0.5"
                    style={{ color: themeStyles.textSecondary, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {selected.address}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[12px]" style={{ color: themeStyles.textSecondary }}>
              Tap the map to pick a location
            </p>
          )}
        </div>

        {/* ── Live toggle ── */}
        <div
          className="px-5 py-3 flex-shrink-0"
          style={{
            borderTop:       `1px solid ${themeStyles.border}`,
            backgroundColor: isDark ? '#121316' : '#ffffff',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium" style={{ color: themeStyles.text }}>
                Share Live Location
              </p>
              <p className="text-[11px]" style={{ color: themeStyles.textSecondary }}>
                Real-time position updates
              </p>
            </div>
            <button
              onClick={() => setIsLive(v => !v)}
              className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors"
              style={{ backgroundColor: isLive ? '#5494FF' : (isDark ? '#333' : '#ccc') }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ transform: isLive ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {isLive && (
            <div className="flex gap-2 mt-2.5">
              {([15, 60, 480] as const).map(mins => (
                <button
                  key={mins}
                  onClick={() => setLiveDuration(mins)}
                  className="flex-1 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    backgroundColor: liveDuration === mins ? '#5494FF' : (isDark ? '#1e1e1e' : '#f0f0f0'),
                    color:           liveDuration === mins ? '#fff' : themeStyles.textSecondary,
                    border:          `1px solid ${liveDuration === mins ? '#5494FF' : themeStyles.border}`,
                  }}
                >
                  {mins < 60 ? `${mins} min` : mins === 60 ? '1 hr' : '8 hrs'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            borderTop:       `1px solid ${themeStyles.border}`,
            backgroundColor: isDark ? '#121316' : '#ffffff',
          }}
        >
          <button
            onClick={onClose}
            className="text-[14px] font-medium px-6 py-2.5 rounded-full transition-opacity hover:opacity-70"
            style={{
              backgroundColor: isDark ? '#1e1e1e' : '#f3f4f6',
              color:           themeStyles.textSecondary,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={!selected}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-semibold transition-all active:scale-95"
            style={{
              background:  selected
                ? 'linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 54%,#9DC1FF 100%)'
                : (isDark ? '#2a2a2a' : '#e5e7eb'),
              color:       selected ? '#fff' : themeStyles.textSecondary,
              minWidth:    '148px',
              opacity:     selected ? 1 : 0.55,
            }}
          >
            <Navigation size={14} />
            {isLive ? 'Share Live' : 'Send Location'}
          </button>
        </div>
      </div>
    </div>
  );
}