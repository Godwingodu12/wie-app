'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventWithLocation } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';

interface PopularEventBannerProps {
  events: EventWithLocation[];
  onViewAll?: () => void;
  title?: string;
}

export default function PopularEventBanner({
  events,
  onViewAll,
  title = "Popular Events",
}: PopularEventBannerProps) {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (rowRef.current) {
      // Width of a card + gap.
      // Card is 536px on desktop (lg), and 85vw or 480px on smaller screens.
      const isMobile = window.innerWidth < 1024;
      const cardWidth = isMobile ? rowRef.current.clientWidth * 0.85 : 536;
      const scrollAmount = cardWidth + 24; // 24px is gap-6 (gap-6 is 1.5rem = 24px)
      rowRef.current.scrollBy({
        left: dir === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleCardClick = (event: EventWithLocation) => {
    const id = event._id || (event as any).id;
    if (id) router.push(`/events/${id}`);
  };

  if (!events.length) return null;

  return (
    <div className="mb-14 px-4 sm:px-0">
      {/* Header Section */}
      <div className="flex items-end justify-between mb-6 px-1">
        <h2 className="font-semibold text-2xl sm:text-3xl tracking-tight" style={{ color: themeStyles.text }}>
          {title}
        </h2>
      </div>

      {/* Carousel Wrapper */}
      <div className="relative group/carousel">
        {/* Horizontal scroll container */}
        <div
          ref={rowRef}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4 px-1 snap-x snap-mandatory"
        >
          {events.map((event, index) => {
            const desktopImage = (event as any).event_banner || null;
            const mobileImage = (event as any).event_portrait || (event as any).event_banner || null;

            return (
              <div
                key={event._id || index}
                onClick={() => handleCardClick(event)}
                className="relative flex-shrink-0 snap-start select-none transition-all duration-300 shadow-xl overflow-hidden group
                           w-[85vw] sm:w-[480px] lg:w-[536px] h-[200px] sm:h-[260px] lg:h-[312px]"
                style={{
                  borderRadius: 12,
                  opacity: 1,
                  transform: 'rotate(0deg)',
                }}
              >
                {/* Background Image Layers */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={desktopImage || mobileImage}
                    alt={event.event_name}
                    className="hidden sm:block absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
                  />
                  <img
                    src={mobileImage || desktopImage}
                    alt={event.event_name}
                    className="block sm:hidden absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
                </div>

                {/* Event Details Content - Glassmorphic overlay at the bottom */}
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6 z-10">
                  <div className="space-y-2 w-full">
                    <h3 className="text-white font-semibold text-lg sm:text-xl lg:text-2xl leading-tight tracking-tight drop-shadow-md line-clamp-2 group-hover:text-purple-200 transition-colors duration-300">
                      {event.event_name}
                    </h3>

                    <div className="flex items-center gap-4 text-white/95 text-[11px] sm:text-xs font-semibold">
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-sm">
                        <Calendar size={13} className="text-[#8860D9]" />
                        <span>
                          {event.event_dates?.[0]?.start_date
                            ? new Date(event.event_dates[0].start_date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                            : 'TBA'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Left Scroll Button */}
        {events.length > 1 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 border"
            style={{
              background: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
              borderColor: themeStyles.border,
              backdropFilter: "blur(8px)"
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" style={{ color: themeStyles.text }} />
          </button>
        )}

        {/* Right Scroll Button */}
        {events.length > 1 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 border"
            style={{
              background: isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
              borderColor: themeStyles.border,
              backdropFilter: "blur(8px)"
            }}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" style={{ color: themeStyles.text }} />
          </button>
        )}
      </div>
    </div>
  );
}
