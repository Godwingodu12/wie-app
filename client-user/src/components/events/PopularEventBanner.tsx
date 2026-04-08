'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EventWithLocation } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';

interface PopularEventBannerProps {
  events: EventWithLocation[];
  onViewAll: () => void;
  title?: string;
}

export default function PopularEventBanner({
  events,
  onViewAll,
  title = "Popular event",
}: PopularEventBannerProps) {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((p) => (p + 1) % events.length);
    }, 3000);
  }, [events.length]);

  useEffect(() => {
    if (events.length < 2) {
      setActive(0);
      return;
    }
    reset();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reset, events.length]);

  if (!events.length) return null;

  const ev = events[active];

  if (!ev) return null;

  // Desktop: event_banner, Mobile: event_portrait (fallback to event_banner)
  const desktopSrc = (ev as any).event_banner || null;
  const mobileSrc  = (ev as any).event_portrait || (ev as any).event_banner || null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg" style={{ color: themeStyles.text }}>{title}</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-medium text-transparent bg-clip-text"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
            WebkitBackgroundClip: 'text',
          }}
        >
          see all
        </button>
      </div>

      {/* Banner */}
      <div
        className="relative w-full overflow-hidden cursor-pointer group mx-auto"
        style={{ borderRadius: 12, maxWidth: 1147, opacity: 1 }}
        onClick={() => {
          const id = ev._id || (ev as any).id;
          if (id) router.push(`/events/${id}`);
        }}
      >
        {/* Desktop banner — hidden on mobile */}
        <div
          className="hidden sm:block w-full"
          style={{ height: 312 }}
        >
          {desktopSrc ? (
            <img
              src={desktopSrc}
              alt={ev.event_name}
              className="w-full h-full transition-transform duration-700 group-hover:scale-[1.01]"
              style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg, #1C2024 0%, #2D3139 100%)' }}
            />
          )}
        </div>

        {/* Mobile portrait — hidden on desktop */}
        <div
          className="block sm:hidden w-full"
          style={{ aspectRatio: '4 / 5' }}
        >
          {mobileSrc ? (
            <img
              src={mobileSrc}
              alt={ev.event_name}
              className="w-full h-full transition-transform duration-700 group-hover:scale-[1.01]"
              style={{ objectFit: 'cover', display: 'block', width: '100%', height: '100%' }}
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg, #1C2024 0%, #2D3139 100%)' }}
            />
          )}
        </div>

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
          }}
        />

        {/* Event info */}
        <div className="absolute bottom-4 left-4 right-14">
          <p className="text-white font-bold text-sm sm:text-base line-clamp-1">{ev.event_name}</p>
          <p className="text-white/70 text-[10px] sm:text-xs mt-0.5">
            {ev.event_dates?.[0]?.start_date
              ? new Date(ev.event_dates[0].start_date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''}
          </p>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {events.slice(0, 6).map((item, i) => (
            <button
              key={`dot-${item._id || (item as any).id || i}-${i}`}
              onClick={(e) => { e.stopPropagation(); setActive(i); reset(); }}
              className="transition-all"
              style={{
                width: i === active ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === active ? '#8860D9' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
