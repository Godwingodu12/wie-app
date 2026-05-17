'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EventWithLocation } from '@/types/ticket';
import { toggleLike, unlikeEvent, getEventStats } from '@/services/transactionService';
import { useAuth } from '@/hooks/useAuth';
import { Heart } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';
import CalendarIcon from "@/assets/Event/CalenderIcon.svg";
import LocationIcon from "@/assets/Event/LocationIcon.svg";

interface NearbyEventCardProps {
  event: EventWithLocation;
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function NearbyEventCard({
  event,
  isLiked: isLikedProp,
}: NearbyEventCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { themeStyles, isDark } = useTheme();
  const [isLiked, setIsLiked] = useState(isLikedProp ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const response = await getEventStats(event._id);
      if (response.success && response.data) {
        setLikeCount(response.data.stats.like ?? response.data.stats.likes ?? 0);
        if (isLikedProp === undefined) {
          setIsLiked(response.data.userInteractions?.liked ?? false);
        }
      }
    } catch (err) {
      console.error('Error fetching event stats:', err);
    }
  }, [event._id, isLikedProp]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (isLikedProp !== undefined) {
      setIsLiked(isLikedProp);
    }
  }, [isLikedProp]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLoading) return;

    setIsLoading(true);
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);

    try {
      if (wasLiked) {
        await unlikeEvent(event._id);
      } else {
        await toggleLike(event._id);
      }
      fetchStats();
    } catch (err) {
      setIsLiked(wasLiked);
      console.error('Error toggling like:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date TBA';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const startDate = event.event_dates?.[0]?.start_date || (event as any).startDate;
  const displayDate = formatDate(startDate);
  const guests = event.guests?.slice(0, 4) ?? [];

  return (
    <div
      onClick={() => router.push(`/events/${event._id}`)}
      className={`group relative flex flex-row cursor-pointer transition-all duration-300 hover:brightness-105 w-full sm:w-[650px] md:w-[680px] xl:w-full min-h-[183px] h-auto overflow-hidden rounded-[12px] shadow-lg border ${
        isDark ? 'border-white/5' : 'border-black/5'
      }`}
      style={{
        background: themeStyles.cardBg,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#B3B8E2" />
            <stop offset="50%" stopColor="#8860D9" />
            <stop offset="100%" stopColor="#9575CD" />
          </linearGradient>
        </defs>
      </svg>

      {/* Image Section - Left */}
      <div
        className={`relative flex-shrink-0 w-[120px] h-[120px] xs:w-[140px] xs:h-[140px] sm:w-[157px] sm:h-[157px] mt-[13px] ml-[13px] mb-[13px] overflow-hidden rounded-[6px] ${
          isDark ? 'bg-white/5' : 'bg-black/5'
        }`}
      >
        {event.event_banner ? (
          <img
            src={event.event_banner}
            alt={event.event_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <img src={CalendarIcon.src} className={`w-8 h-8 ${isDark ? 'opacity-20' : 'opacity-20'}`} alt="Calendar" />
          </div>
        )}
      </div>

      {/* Like Button - Absolute Top Right of the card */}
      <button
        onClick={handleLike}
        disabled={isLoading || !user}
        className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 outline-none ${
          isDark ? 'bg-black/40' : 'bg-white/80 shadow-sm'
        }`}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            !isLiked ? (isDark ? 'text-white/70' : 'text-black/40') : ''
          }`}
          fill={isLiked ? 'url(#icon-gradient)' : 'none'}
          stroke={isLiked ? 'url(#icon-gradient)' : 'currentColor'}
          strokeWidth={2}
        />
      </button>

      {/* Content Section */}
      <div className="flex-1 flex flex-col p-4 sm:p-5 justify-between min-w-0">
        <div className="flex flex-col gap-2">
          {/* 1. Event Name */}
          <h3
            className="text-[14px] sm:text-[19px] font-bold leading-tight line-clamp-2 tracking-tight pr-8"
            style={{ color: themeStyles.text }}
          >
            {event.event_name}
          </h3>

          <div className="flex flex-col gap-1.5">
            {/* 2. Date */}
            <div className="flex items-center gap-2">
              <img src={CalendarIcon.src} className="w-3.5 h-3.5 shrink-0" alt="Calendar" />
              <span
                className="text-[12px] sm:text-[13px] font-semibold truncate"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)' }}
              >
                {displayDate}
              </span>
            </div>

            {/* 3. Location */}
            <div className="flex items-center gap-2">
              <img src={LocationIcon.src} className="w-3.5 h-3.5 shrink-0" alt="Location" />
              <span
                className="text-[11px] sm:text-[12px] font-medium line-clamp-1"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
              >
                {event.location || event.venue || 'Location TBA'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Joined People */}
        <div className="flex items-center mt-2">
          {guests.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2 shrink-0">
                {guests.map((guest, i) => (
                  <div
                    key={guest._id || i}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 overflow-hidden ${
                      isDark ? 'border-black bg-neutral-800' : 'border-white bg-neutral-200'
                    }`}
                  >
                    {guest.guest_profile ? (
                      <img
                        src={guest.guest_profile}
                        alt={guest.guest_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}>
                        {guest.guest_name?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
                {event.guests && event.guests.length > 4 && (
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${
                      isDark ? 'border-black bg-[#333333] text-white/80' : 'border-white bg-neutral-100 text-black/60'
                    }`}
                  >
                    +{event.guests.length - 4}
                  </div>
                )}
              </div>
              <span
                className="text-[10px] sm:text-[11px] font-medium whitespace-nowrap"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }}
              >
                joining the event
              </span>
            </div>
          ) : (
            <span
              className="text-[10px] sm:text-[11px] font-medium"
              style={{ color: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.3)' }}
            >
              Be the first to join
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
