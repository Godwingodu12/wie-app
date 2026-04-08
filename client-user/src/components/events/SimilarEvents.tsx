'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Event } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';
import { Calendar, MapPin, Heart } from 'lucide-react';

interface SimilarEventsProps {
  similarEvents: Event[];
}

export const SimilarEvents: React.FC<SimilarEventsProps> = ({ similarEvents }) => {
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();

  if (similarEvents.length === 0) return null;

  // Primary purple color for icons and accents
  const purpleAccent = '#A855F7';

  return (
    <div className="mt-12 mb-16 px-4 md:px-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <h2
          className="text-xl md:text-2xl font-bold tracking-tight"
          style={{ color: themeStyles.text }}
        >
          Similar Events
        </h2>
        <button
          onClick={() => router.push('/events/nearby')}
          className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
          style={{ color: purpleAccent }}
        >
          View all
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div
        className="
          flex gap-4 pb-6
          overflow-x-auto
          overscroll-x-contain
          scrollbar-hide
          -mx-4 px-4 md:mx-0 md:px-0
        "
      >
        {similarEvents.map((ev) => {
          const bannerSrc = ev.event_banner || (ev.event_images?.[0]?.path) || '';

          return (
            <div
              key={ev._id}
              className="
                relative
                w-[170px]
                h-[260px]
                rounded-[12px]
                overflow-hidden
                flex-shrink-0
                transition-all duration-300
                hover:translate-y-[-4px]
                group
                cursor-pointer
              "
              style={{
                background: isDark ? 'var(--Event_card_bg, #38383833)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: isDark ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.05)'
              }}
              onClick={() => router.push(`/events/${ev._id}`)}
            >
              {/* Image Container with precise dimensions and offsets */}
              <div
                className="absolute overflow-hidden"
                style={{
                  width: '158px',
                  height: '150px',
                  top: '6px',
                  left: '6px',
                  borderRadius: '6px',
                  background: '#D9D9D9'
                }}
              >
                <img
                  src={bannerSrc}
                  alt={ev.event_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Heart / Like Icon (Top Right relative to card) */}
                <button
                  className="absolute flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
                  style={{
                    width: '34px',
                    height: '34px',
                    top: '3px',   // 9px (from card top) - 6px (image offset)
                    right: '3px', // 9px (from card right) - 6px (image offset)
                    borderRadius: '17px',
                    padding: '8px',
                    background: '#22283199',
                    backdropFilter: 'blur(10px)',
                    border: 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Heart className="w-full h-full text-[#A855F7] fill-[#A855F7]/10 group-hover:fill-[#A855F7]/30 transition-colors" />
                </button>
              </div>

              {/* Card Content area below image (starts around 162px top) */}
              <div className="absolute left-[8px] right-[8px] top-[164px] space-y-2">
                <p
                  className="text-sm font-bold line-clamp-1 group-hover:text-[#A855F7] transition-colors"
                  style={{ color: themeStyles.text }}
                >
                  {ev.event_name}
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <Calendar className="w-3 h-3 shrink-0" style={{ color: purpleAccent }} />
                    <p className="text-[10px] font-bold truncate" style={{ color: '#9CA3AF' }}>
                      {ev.event_dates?.[0]?.start_date
                        ? new Date(ev.event_dates[0].start_date).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Date TBD'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-0.5">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: purpleAccent }} />
                    <p className="text-[10px] font-bold line-clamp-1" style={{ color: '#9CA3AF' }}>
                      {ev.location}
                    </p>
                  </div>

                  {/* Guest Circles */}
                  {ev.guests && ev.guests.length > 0 && (
                    <div className="flex -space-x-1.5 px-0.5 pt-0.5">
                      {ev.guests.slice(0, 3).map((guest: any, idx: number) => (
                        <div key={idx} className="w-5 h-5 rounded-full border border-white shadow-sm overflow-hidden shrink-0 bg-gray-200 flex items-center justify-center relative z-10">
                          {guest.guest_profile ? (
                            <img src={guest.guest_profile} alt={guest.guest_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-bold text-gray-500">{guest.guest_name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                      ))}
                      {ev.guests.length > 3 && (
                        <div className="w-5 h-5 rounded-full border border-white shadow-sm bg-gray-100 flex items-center justify-center shrink-0 relative z-0" style={{ transform: 'translateX(-4px)' }}>
                          <span className="text-[8px] font-bold text-gray-600">+{ev.guests.length - 3}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
