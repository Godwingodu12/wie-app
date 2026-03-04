'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EventWithLocation } from '@/types/ticket';
import { getEventStats, toggleLike, unlikeEvent } from '@/services/transactionService';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, MapPin, Heart } from 'lucide-react';

interface EventCardProps {
  event: EventWithLocation;
  showDistance?: boolean;
  isLiked?: boolean;
  isSaved?: boolean;
  isCancelled?: boolean;
}

export function EventCard({
  event,
  showDistance = false,
  isLiked: isLikedProp,
  isSaved: isSavedProp,
  isCancelled,
}: EventCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(isLikedProp ?? false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const eventCancelled =
    isCancelled ?? (event as any)?.event_status === 'cancelled';

  useEffect(() => {
    if (isLikedProp !== undefined) setIsLiked(isLikedProp);
  }, [isLikedProp]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await getEventStats(event._id);
      if (response.success && response.data) {
        const stats = response.data.stats;
        setLikeCount(stats.like ?? stats.likes ?? 0);
        if (isLikedProp === undefined) {
          setIsLiked(response.data?.userInteractions?.liked ?? false);
        }
      }
    } catch {
      // silent fail
    }
  }, [event._id, isLikedProp]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLoading) return;

    setIsLoading(true);
    const wasLiked = isLiked;

    setIsLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));

    try {
      if (wasLiked) {
        await unlikeEvent(event._id);
      } else {
        await toggleLike(event._id);
      }
      setTimeout(fetchStats, 300);
    } catch {
      setIsLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (ds: string) => {
    try {
      return new Date(ds).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return ds;
    }
  };

  const startDate = event.event_dates?.[0]?.start_date
    ? formatDate(event.event_dates[0].start_date)
    : 'Date TBA';

  const locationText =
    event.location_type === 'online'
      ? 'Online Event'
      : event.location_type === 'recorded'
      ? 'Recorded'
      : event.location || event.venue || 'Location TBA';

  const trimmed = (s: string, max = 18) =>
    s.length > max ? s.slice(0, max) + '…' : s;

  const guests = event.guests?.slice(0, 4) ?? [];

  return (
    <div
      className={`relative flex-shrink-0 transition-transform duration-200 ${
        eventCancelled
          ? 'cursor-not-allowed opacity-75'
          : 'cursor-pointer hover:scale-[1.02]'
      }`}
      style={{
        width: 170,
        height: 260,
        borderRadius: 12,
        background: '#38383833',
        border: eventCancelled
          ? '1px solid rgba(239,68,68,0.3)'
          : '1px solid #3D4149',
      }}
      onClick={() => !eventCancelled && router.push(`/events/${event._id}`)}
    >
      {/* Banner image */}
      <div
        className="absolute overflow-hidden"
        style={{ top: 6, left: 6, width: 158, height: 133, borderRadius: 6 }}
      >
        {event.event_banner ? (
          <img
            src={event.event_banner}
            alt={event.event_name}
            className="w-full h-full object-cover"
            style={eventCancelled ? { filter: 'grayscale(60%)' } : undefined}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, #2D3139 0%, #1C2024 100%)',
            }}
          >
            <Calendar className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Cancelled overlay */}
        {eventCancelled && (
          <>
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            />
            <div
              className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white"
              style={{
                background: 'rgba(239,68,68,0.92)',
                letterSpacing: '0.03em',
              }}
            >
              <span>✕</span> CANCELLED
            </div>
          </>
        )}

        {/* Distance badge */}
        {!eventCancelled && showDistance && event.distance != null && (
          <div
            className="absolute bottom-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(88,96,219,0.85)' }}
          >
            {event.distance} km
          </div>
        )}
      </div>

      {/* Like button — single instance, hidden when cancelled */}
      {!eventCancelled && (
        <button
          onClick={handleLike}
          disabled={isLoading || !user}
          className="absolute flex items-center justify-center transition-all"
          style={{
            top: 9,
            left: 127,
            width: 34,
            height: 34,
            borderRadius: 17,
            background: 'rgba(28,32,36,0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.08)',
            zIndex: 2,
          }}
        >
          <Heart
            className="w-4 h-4 transition-colors"
            style={{
              color: isLiked ? '#EF4444' : '#fff',
              fill: isLiked ? '#EF4444' : 'none',
            }}
          />
        </button>
      )}

      {/* Text content */}
      <div
        className="absolute px-2"
        style={{ top: 145, left: 0, right: 0 }}
      >
        <p
          className="text-white font-semibold leading-tight mb-2 line-clamp-2"
          style={{ fontSize: 11 }}
        >
          {event.event_name}
        </p>

        <div
          className="flex items-center gap-1 mb-1"
          style={{ width: 138, height: 16 }}
        >
          <Calendar
            className="flex-shrink-0"
            style={{ width: 10, height: 10, color: '#8860D9' }}
          />
          <span
            className="text-white/60 truncate"
            style={{ fontSize: 10 }}
          >
            {startDate}
          </span>
        </div>

        <div
          className="flex items-center gap-1 mb-2"
          style={{ width: 138, height: 16 }}
        >
          <MapPin
            className="flex-shrink-0"
            style={{ width: 10, height: 10, color: '#8860D9' }}
          />
          <span
            className="text-white/60 truncate"
            style={{ fontSize: 10 }}
          >
            {trimmed(locationText)}
          </span>
        </div>

        {/* Guest avatars */}
        {guests.length > 0 && (
          <div className="flex items-center" style={{ marginTop: 2 }}>
            {guests.map((g, i) => (
              <div
                key={g._id ?? `guest-${i}`}
                className="overflow-hidden flex-shrink-0"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 100,
                  border: '2px solid #38383833',
                  marginLeft: i === 0 ? 0 : -6,
                  background: '#2D3139',
                  zIndex: guests.length - i,
                  position: 'relative',
                }}
              >
                {g.guest_profile ? (
                  <img
                    src={g.guest_profile}
                    alt={g.guest_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold"
                    style={{ fontSize: 7, background: '#5B6AD9' }}
                  >
                    {g.guest_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
