'use client';

import { useState, useEffect } from 'react';
import { MapPin, X, Navigation, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';

interface EnableLocationProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationGranted: (coords: { latitude: number; longitude: number; displayName?: string }) => void;
  onManualLocation: (location: string) => void;
}

type Step = 'prompt' | 'loading' | 'manual' | 'success' | 'denied';

export default function EnableLocation({
  isOpen,
  onClose,
  onLocationGranted,
  onManualLocation,
}: EnableLocationProps) {
  const { themeStyles, isDark } = useTheme();
  const [step, setStep] = useState<Step>('prompt');
  const [manualInput, setManualInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) setStep('prompt');
  }, [isOpen]);

  const handleEnableGPS = () => {
    setStep('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Reverse geocode for display name
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API;
          if (apiKey) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
            );
            const data = await res.json();
            if (data.status === 'OK' && data.results.length > 0) {
              // Extract city/area name
              const components = data.results[0].address_components;
              const city =
                components.find((c: any) => c.types.includes('locality'))?.long_name ||
                components.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name ||
                components.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name ||
                '';
              setDisplayName(city);
              onLocationGranted({ latitude: lat, longitude: lng, displayName: city });
            } else {
              onLocationGranted({ latitude: lat, longitude: lng });
            }
          } else {
            onLocationGranted({ latitude: lat, longitude: lng });
          }
        } catch {
          onLocationGranted({ latitude: lat, longitude: lng });
        }
        setStep('success');
        setTimeout(() => onClose(), 1500);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStep('denied');
        } else {
          setErrorMsg('Unable to get location. Please try manually.');
          setStep('manual');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    onManualLocation(trimmed);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet / Modal */}
      <div
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: themeStyles.cardBg.includes('gradient') ? '#1C2024' : themeStyles.cardBg,
          backgroundImage: themeStyles.cardBg.includes('gradient') ? themeStyles.cardBg : 'none',
          border: `1px solid ${themeStyles.border}`
        }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: themeStyles.border }} />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" style={{ color: themeStyles.textSecondary }} />
        </button>

        <div className="px-6 pt-4 pb-8 sm:pt-6">

          {/* ── PROMPT step ── */}
          {step === 'prompt' && (
            <div className="text-center">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #5B8DEF22 0%, #8860D922 100%)', border: '1px solid #8860D940' }}
              >
                <MapPin className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: themeStyles.text }}>Find Events Near You</h2>
              <p className="text-sm mb-7 leading-relaxed" style={{ color: themeStyles.textSecondary }}>
                Enable location to discover events happening nearby, or enter your city manually.
              </p>

              {/* GPS button */}
              <button
                onClick={handleEnableGPS}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white mb-3 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #5B8DEF 0%, #8860D9 50%, #7C3AED 100%)',
                  boxShadow: '0 4px 20px rgba(136,96,217,0.35)',
                }}
              >
                <Navigation className="w-4 h-4" />
                Use My Current Location
              </button>

              {/* Manual entry toggle */}
              <button
                onClick={() => setStep('manual')}
                className="w-full py-3.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ backgroundColor: themeStyles.hoverBg, color: themeStyles.textSecondary, border: `1px solid ${themeStyles.border}` }}
              >
                Enter Location Manually
              </button>
            </div>
          )}

          {/* ── LOADING step ── */}
          {step === 'loading' && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: themeStyles.hoverBg }}
              >
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: themeStyles.text }}>Getting Your Location</h2>
              <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Please allow location access in your browser…</p>
            </div>
          )}

          {/* ── SUCCESS step ── */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34,197,94,0.12)' }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: themeStyles.text }}>Location Enabled!</h2>
              {displayName && (
                <p className="text-green-400 text-sm font-medium">{displayName}</p>
              )}
              <p className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>Finding events near you…</p>
            </div>
          )}

          {/* ── DENIED step ── */}
          {step === 'denied' && (
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(239,68,68,0.1)' }}
              >
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: themeStyles.text }}>Location Access Denied</h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: themeStyles.textSecondary }}>
                You've blocked location access. Please update your browser settings, or enter your location manually below.
              </p>
              <button
                onClick={() => setStep('manual')}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #5B8DEF 0%, #8860D9 100%)',
                }}
              >
                Enter Location Manually
              </button>
            </div>
          )}

          {/* ── MANUAL step ── */}
          {step === 'manual' && (
            <div>
              <button
                onClick={() => { setStep('prompt'); setErrorMsg(''); }}
                className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
                style={{ color: themeStyles.textSecondary }}
              >
                ← Back
              </button>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: themeStyles.hoverBg }}
              >
                <Search className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: themeStyles.text }}>Enter Your Location</h2>
              <p className="text-sm mb-5" style={{ color: themeStyles.textSecondary }}>
                City, district, state or country (e.g. Kochi, Kerala, Dubai)
              </p>
              {errorMsg && (
                <p className="text-red-400 text-xs mb-3">{errorMsg}</p>
              )}
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Type your location…"
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500/60 mb-4"
                style={{ backgroundColor: themeStyles.hoverBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.text }}
              />
              <button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #5B8DEF 0%, #8860D9 100%)',
                }}
              >
                Search Events Here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
