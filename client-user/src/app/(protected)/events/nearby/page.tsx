'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getNearbyEventsFromCurrentLocation,
  getNearbyEventsByLocation,
  searchEventsByName,
  getFilteredEvents,
  getCategoryBasedEvents,
  getPopularEvents,
  getCancelledEvents,
  getRehostedEvents,
} from '@/services/ticketUserService';
import { getUserLikedEvents, getUserSavedEvents, getUserCancelledBookings } from '@/services/transactionService';
import { NearbyEvent, EventWithLocation, FilterEventsParams } from '@/types/ticket';
import { Loader2, ChevronLeft, ChevronRight, ArrowRight, AlertCircle } from 'lucide-react';
import SideBar from '@/components/home/SideBar';
import { useSidebar } from '@/context/SidebarContext';
import { EventCard } from '@/components/events/EventCard';
import EventCategoryList from '@/components/events/Eventcategorylist';
import FilterSearchEvents from '@/components/events/FilterSearchEvents';
// Asset imports — adjust paths if your assets differ
import SearchIcon from '@/assets/Event/serachIcon.png';
import FilterButtonIcon from '@/assets/Event/FilterButton.png';
const DISTANCE_BANDS = [5, 10, 50, 100, 150, 200, 300, 400, 500,600,700,800,900,1000];

function getBand(dist: number): number {
  for (const b of DISTANCE_BANDS) {
    if (dist <= b) return b;
  }
  return 9999;
}

function bandLabel(band: number): string {
  return band === 9999 ? '500+ km' : `Within ${band} km`;
}

function PopularEventBanner({
  events,
  onViewAll,
}: {
  events: NearbyEvent[];
  onViewAll: () => void;
}) {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActive((p) => (p + 1) % events.length);
    }, 3000);
  }, [events.length]);

  useEffect(() => {
    if (events.length < 2) return;
    reset();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reset]);

  if (!events.length) return null;

  const ev = events[active];

  const bannerSrc = (ev as any).event_portrait || ev.event_banner;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-lg">Popular event</h2>
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
        className="relative w-full overflow-hidden cursor-pointer group"
        style={{ height: 240, borderRadius: 16 }}
        onClick={() => router.push(`/events/${ev._id}`)}
      >
        {bannerSrc ? (
          <img
            src={bannerSrc}
            alt={ev.event_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #1C2024 0%, #2D3139 100%)',
            }}
          />
        )}

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
          }}
        />

        <div className="absolute bottom-4 left-4 right-14">
          <p className="text-white font-bold text-base line-clamp-1">{ev.event_name}</p>
          <p className="text-white/60 text-xs mt-0.5">
            {ev.event_dates?.[0]?.start_date
              ? new Date(ev.event_dates[0].start_date).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''}
          </p>
        </div>

        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {events.slice(0, 6).map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setActive(i); reset(); }}
              className="transition-all"
              style={{
                width: i === active ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === active ? '#8860D9' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventRow({
  title,
  events,
  onSeeAll,
  likedIds = new Set<string>(),
  savedIds  = new Set<string>(),
}: {
  title: string;
  events: EventWithLocation[];
  onSeeAll?: () => void;
  likedIds?: Set<string>;
  savedIds?:  Set<string>;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    rowRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  if (!events.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-xs font-medium"
            style={{
              background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            see all
          </button>
        )}
      </div>

      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: '#2D3139', border: '1px solid #3D4149' }}
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: '#2D3139', border: '1px solid #3D4149' }}
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>

        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
        >
          {events.map((ev) => (
            <EventCard
              key={ev._id}
              event={ev}
              showDistance
              isLiked={likedIds.has(ev._id)}
              isSaved={savedIds.has(ev._id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryBreak({ category, events }: { category: string; events: EventWithLocation[] }) {
  const router = useRouter();
  if (!events.length) return null;

  return (
    <div
      className="mb-8 p-4 rounded-2xl"
      style={{ background: '#1C2024', border: '1px solid #2D3139' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-0.5">
            You might also like
          </p>
          <h3 className="text-white font-semibold text-sm">{category}</h3>
        </div>
        <button
          onClick={() =>
            router.push(
              `/events/categories?category=${encodeURIComponent(category)}`
            )
          }
          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {events.slice(0, 6).map((ev) => (
          <EventCard key={ev._id} event={ev} />
        ))}
      </div>
    </div>
  );
}

function UserCancelledSection({ events, router }: { events: any[]; router: any }) {
  if (!events.length) return null;

  return (
    <div
      className="mb-6 p-4 rounded-2xl"
      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        <h3 className="text-red-400 font-semibold text-sm">Your Cancelled Events</h3>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
        >
          {events.length} event{events.length > 1 ? 's' : ''}
        </span>
        <span className="text-white/30 text-[10px] ml-auto">Events you booked were cancelled by host</span>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {events.map((ev) => (
          <div
            key={ev.eventId}
            className="relative flex-shrink-0"
            style={{ width: 220 }}
          >
            {/* Banner */}
            <div
              className="relative overflow-hidden"
              style={{ height: 110, borderRadius: 10 }}
            >
              {ev.event_banner ? (
                <img
                  src={ev.event_banner}
                  alt={ev.event_name}
                  className="w-full h-full object-cover grayscale-[70%]"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg, #2a1a1a 0%, #3d1a1a 100%)' }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }}
              />
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
              >
                ✕ CANCELLED
              </div>
            </div>

            {/* Info */}
            <div className="mt-1.5 px-0.5">
              <p className="text-white/80 font-medium text-xs line-clamp-1">{ev.event_name}</p>
              {ev.cancellation_reason && (
                <p className="text-white/40 text-[10px] mt-0.5 line-clamp-1 italic">
                  "{ev.cancellation_reason}"
                </p>
              )}
              {/* Refund status */}
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      ev.refundStatus === 'COMPLETED' ? 'rgba(34,197,94,0.15)' :
                      ev.refundStatus === 'PROCESSING' ? 'rgba(234,179,8,0.15)' :
                      'rgba(239,68,68,0.15)',
                    color:
                      ev.refundStatus === 'COMPLETED' ? '#22c55e' :
                      ev.refundStatus === 'PROCESSING' ? '#eab308' :
                      '#ef4444',
                  }}
                >
                  {ev.refundStatus === 'COMPLETED'  ? '✓ Refunded' :
                   ev.refundStatus === 'PROCESSING' ? '↻ Processing' :
                   '⏳ Refund Pending'}
                </span>
                {ev.refundAmount && (
                  <span className="text-white/50 text-[10px]">₹{ev.refundAmount}</span>
                )}
              </div>
            </div>

            {/* Track refund button */}
            {ev.refundStatus !== 'COMPLETED' && ev.bookingId && (
              <button
                onClick={() => router.push(`/bookings/${ev.bookingId}/refund`)}
                className="mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold text-white"
                style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)' }}
              >
                Track Refund →
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RehostedEventsSection({ events }: { events: any[] }) {
  const router = useRouter();
  if (!events.length) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#22c55e' }}
          />
          <h3 className="text-white font-semibold text-base">Back & Live</h3>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
          >
            Re-hosted
          </span>
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
        {events.map((ev) => (
          <div
            key={ev.eventId || ev._id}
            className="relative flex-shrink-0 cursor-pointer group"
            style={{ width: 200 }}
            onClick={() =>
              router.push(
                ev.isSubEvent && ev.parentEventId
                  ? `/events/${ev.parentEventId}`
                  : `/events/${ev.eventId || ev._id}`
              )
            }
          >
            {/* Banner */}
            <div
              className="relative overflow-hidden"
              style={{ height: 120, borderRadius: 12 }}
            >
              {ev.event_banner ? (
                <img
                  src={ev.event_banner}
                  alt={ev.event_name}
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg, #0d2318 0%, #133d26 100%)' }}
                />
              )}

              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
                }}
              />

              {/* Re-hosted badge */}
              <div
                className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                style={{
                  background: 'rgba(34,197,94,0.9)',
                  color: '#fff',
                  boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                }}
              >
                <span>↩</span> BACK
              </div>

              {/* Live badge */}
              {ev.event_status === 'live' && (
                <div
                  className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-0.5 animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}
                >
                  <span
                    className="w-1 h-1 rounded-full inline-block"
                    style={{ background: '#fff' }}
                  />
                  LIVE
                </div>
              )}

              {ev.isSubEvent && (
                <div
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                  style={{ background: 'rgba(139,92,246,0.85)', color: '#fff' }}
                >
                  SUB
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-2 px-0.5">
              <p className="text-white font-medium text-xs line-clamp-1">{ev.event_name}</p>
              {ev.event_dates?.[0]?.start_date && (
                <p className="text-green-400/70 text-[10px] mt-0.5">
                  {new Date(ev.event_dates[0].start_date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
              {ev.venue && (
                <p className="text-white/30 text-[10px] mt-0.5 line-clamp-1">{ev.venue}</p>
              )}
            </div>

            {/* Book again CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  ev.isSubEvent && ev.parentEventId
                    ? `/events/${ev.parentEventId}`
                    : `/events/${ev.eventId || ev._id}`
                );
              }}
              className="mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                boxShadow: '0 2px 8px rgba(34,197,94,0.25)',
              }}
            >
              Book Again →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function NearbyEventsPage() {
  useAuth(true);
  const router = useRouter();
  const { isCollapsed, isMobile } = useSidebar();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popularEvents, setPopularEvents] = useState<NearbyEvent[]>([]);
  const [nearbyByBand, setNearbyByBand] = useState<Map<number, NearbyEvent[]>>(new Map());
  const [categoryBreaks, setCategoryBreaks] = useState<Map<number, { cat: string; events: EventWithLocation[] }>>(new Map());
  const [searchResults, setSearchResults] = useState<EventWithLocation[] | null>(null);
  const [filterResults, setFilterResults] = useState<EventWithLocation[] | null>(null);
  const [filterResultsByCategory, setFilterResultsByCategory] = useState<Record<string, EventWithLocation[]>>({});
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterEventsParams>({});
  const [hasSearched, setHasSearched] = useState(false);
  const [cancelledEvents, setCancelledEvents] = useState<any[]>([]);
  const [rehostedEvents, setRehostedEvents] = useState<any[]>([]);
  const [likedTicketIds, setLikedTicketIds] = useState<Set<string>>(new Set());
  const [savedTicketIds, setSavedTicketIds] = useState<Set<string>>(new Set());
  const [userCancelledBookings, setUserCancelledBookings] = useState<any[]>([]);

  // ── Load everything on mount ──
  useEffect(() => {
    loadInitialData();
  }, []);

 const loadInitialData = async () => {
    setLoading(true);
    try {
        Promise.all([
          getRehostedEvents().catch(() =>  ({ data: { events: [] } })),
          getUserLikedEvents().catch(() => ({ data: { ticketIds: [] } })),
          getUserSavedEvents().catch(() => ({ data: { ticketIds: [] } })),
          // getUserCancelledBookings fetches the user's own cancelled bookings
          // (events they BOOKED that got admin-cancelled) — not all cancelled events globally
          getUserCancelledBookings().catch(() => ({ data: { cancelledBookings: [] } })),
        ]).then(([rehostedRes, likedRes, savedRes, cancelledBookingsRes]) => {
          setRehostedEvents(rehostedRes?.data?.events ?? []);
          setLikedTicketIds(new Set(likedRes?.data?.ticketIds  ?? []));
          setSavedTicketIds(new Set(savedRes?.data?.ticketIds ?? []));

        // Build cancelled event display objects from the user's cancelled bookings
        const cancelledFromBookings = (cancelledBookingsRes?.data?.cancelledBookings ?? [])
          .filter((b: any) => b.isAdminCancelled) // only host-cancelled, not user-self-cancelled
          .map((b: any) => ({
            eventId:             b.ticketId,
            event_name:          (b.eventDetails as any)?.eventName || 'Event',
            event_banner:        (b.eventDetails as any)?.event_banner || null,
            cancelled_at:        b.cancelledAt,
            cancellation_reason: b.cancellationReason,
            isSubEvent:          false,
            parentEventId:       null,
            refundAmount:        b.refundAmount,
            refundStatus:        b.refundStatus,
            bookingId:           b.id,
          }));
        setUserCancelledBookings(cancelledFromBookings);
        // Keep the global cancelledEvents state empty — we no longer show it to all users
        setCancelledEvents([]);
      });
      // 1. Try GPS
      const res = await getNearbyEventsFromCurrentLocation(500);
      const events: NearbyEvent[] = res.data.events;
      const loc = res.data.search_location;
      setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });

      // Separate popular (top 6 closest) vs the rest
      const sorted = [...events].sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      setPopularEvents(sorted.slice(0, 6));

      // Group rest by distance band
      const bandMap = new Map<number, NearbyEvent[]>();
      sorted.forEach((ev) => {
        const b = getBand(ev.distance ?? 999);
        if (!bandMap.has(b)) bandMap.set(b, []);
        bandMap.get(b)!.push(ev);
      });
      setNearbyByBand(bandMap);

      // Build category breaks — 1 per every 2 bands (max 6 events each)
      await buildCategoryBreaks(sorted);
    } catch {
      // GPS denied or failed — page still shows UI
    } finally {
      setLoading(false);
    }
  };

  const buildCategoryBreaks = async (events: NearbyEvent[]) => {
    // Get unique categories from loaded events
    const cats = Array.from(new Set(events.map((e) => e.event_category).filter(Boolean) as string[]));
    const breaks = new Map<number, { cat: string; events: EventWithLocation[] }>();

    // After every 2 distance bands, insert a category break
    const bandsSorted = DISTANCE_BANDS.filter((b) =>
      events.some((e) => getBand(e.distance ?? 999) <= b)
    );

    for (let i = 0; i < bandsSorted.length; i += 2) {
      const cat = cats[Math.floor(i / 2) % cats.length];
      if (!cat) continue;
      try {
        const catRes = await getCategoryBasedEvents({ category: cat });
        const catEvents = Object.values(catRes.data.eventsByCategory).flat() as EventWithLocation[];
        if (catEvents.length > 0) {
          breaks.set(bandsSorted[i], { cat, events: catEvents.slice(0, 6) });
        }
      } catch {
        // skip
      }
    }
    setCategoryBreaks(breaks);
  };

  // ── Search handler ──
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchEventsByName({ searchQuery: searchQuery.trim() });
      const flat = Object.values(res.data.eventsByCategory ?? {}).flat() as EventWithLocation[];
      setSearchResults(flat);
      setFilterResults(null);
    } catch {
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter handler ──
  const handleFilterApply = (response: any, filters: FilterEventsParams) => {
    const byCategory = response.data?.eventsByCategory ?? {};
    setFilterResultsByCategory(byCategory);
    const flat = Object.values(byCategory).flat() as EventWithLocation[];
    setFilterResults(flat);
    setSearchResults(null);
    setActiveFilters(filters);
    setHasSearched(true);
  };

  // ── Render distance band sections ──
  const renderBands = () => {
    const bands = Array.from(nearbyByBand.keys()).sort((a, b) => a - b);
    const elements: JSX.Element[] = [];
    let bandCount = 0;

    bands.forEach((band) => {
      const evs = nearbyByBand.get(band) ?? [];
      elements.push(
        <EventRow
          key={`band-${band}`}
          title={bandLabel(band)}
          events={evs as unknown as EventWithLocation[]}
          onSeeAll={() => router.push(`/events/categories?radius=${band}`)}
          likedIds={likedTicketIds}
          savedIds={savedTicketIds}
        />
      );
      bandCount++;

      // Insert category break after every 2 bands
      if (bandCount % 2 === 0 && categoryBreaks.has(band)) {
        const brk = categoryBreaks.get(band)!;
        elements.push(
          <CategoryBreak
            key={`break-${band}`}
            category={brk.cat}
            events={brk.events}
          />
        );
      }
    });

    return elements;
  };

  const sidebarWidth = isMobile ? 0 : isCollapsed ? 92 : 281;

  return (
    <div className="min-h-screen" style={{ background: '#0C1014' }}>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <SideBar />

      <main
        className="transition-all duration-300 min-h-screen"
        style={{ marginLeft: sidebarWidth, paddingBottom: isMobile ? 80 : 40 }}
      >
        <div className="max-w-[1194px] mx-auto px-4 sm:px-6 pt-6">

          {/* ── Search Bar + Filter Button ── */}
          <div className="flex items-center gap-3 mb-6">
            {/* Search field */}
            <div
              className="flex items-center gap-3 flex-1 px-4"
              style={{
                height: 44,
                borderRadius: 8,
                background: '#38383866',
                border: '1px solid #3D4149',
              }}
            >
              <Image
                src={SearchIcon}
                alt="Search"
                width={18}
                height={18}
                style={{ opacity: 0.5, flexShrink: 0 }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search events, location, categories etc.."
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults(null); setHasSearched(false); }}
                  className="text-white/40 hover:text-white/70 text-xs transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: '#38383866',
                border: '1px solid #3D4149',
              }}
            >
              <Image
                src={FilterButtonIcon}
                alt="Filter"
                width={20}
                height={20}
              />
            </button>
          </div>

          {/* ── Active filter chips ── */}
          {Object.keys(activeFilters).length > 0 && (filterResults || filterResultsByCategory) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeFilters.category && (
                <span
                  className="px-3 py-1 rounded-full text-xs text-white/80"
                  style={{ background: '#2D3139', border: '1px solid #3D4149' }}
                >
                  {activeFilters.category.split(',')[0].trim()}
                </span>
              )}
              {activeFilters.radius && (
                <span
                  className="px-3 py-1 rounded-full text-xs text-white/80"
                  style={{ background: '#2D3139', border: '1px solid #3D4149' }}
                >
                  {activeFilters.radius} km
                </span>
              )}
              {activeFilters.startDate && (
                <span
                  className="px-3 py-1 rounded-full text-xs text-white/80"
                  style={{ background: '#2D3139', border: '1px solid #3D4149' }}
                >
                  From {activeFilters.startDate}
                </span>
              )}
              <button
                onClick={() => {
                  setActiveFilters({});
                  setFilterResults(null);
                  setFilterResultsByCategory({});
                  setHasSearched(false);
                }}
                className="px-3 py-1 rounded-full text-xs text-red-400 hover:text-red-300 transition-colors"
                style={{ background: '#2D3139', border: '1px solid #3D4149' }}
              >
                Clear filters
              </button>
            </div>
          )}

          {/* ── Event Categories ── */}
          <div className="mb-6">
            <EventCategoryList />
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* ── Search Results ── */}
              {searchResults !== null && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-white font-semibold text-lg">
                      Search results
                      <span className="text-white/40 text-sm font-normal ml-2">
                        ({searchResults.length} found)
                      </span>
                    </h2>
                    <button
                      onClick={() => { setSearchResults(null); setHasSearched(false); }}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {searchResults.map((ev) => (
                        <EventCard key={ev._id} event={ev} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm py-8 text-center">
                      No events found for "{searchQuery}"
                    </p>
                  )}
                </div>
              )}

              {/* ── Filter Results ── */}
              {filterResults !== null && searchResults === null && (
                <div className="mb-8">
                  {Object.keys(filterResultsByCategory).length > 0 ? (
                    Object.entries(filterResultsByCategory).map(([cat, evs]) => (
                      <EventRow
                      key={cat}
                      title={cat}
                      events={evs as EventWithLocation[]}
                      onSeeAll={() =>
                        router.push(`/events/categories?category=${encodeURIComponent(cat)}`)
                      }
                      likedIds={likedTicketIds}
                      savedIds={savedTicketIds}
                    />
                    ))
                  ) : (
                    <p className="text-white/40 text-sm py-8 text-center">
                      No events match your filters.
                    </p>
                  )}
                </div>
              )}
              {!hasSearched && (
                <>
                  {userCancelledBookings.length > 0 && (
                    <UserCancelledSection
                      events={userCancelledBookings}
                      router={router}
                    />
                  )}

                  {/* Popular event banner */}
                  <PopularEventBanner
                    events={popularEvents}
                    onViewAll={() => router.push('/events/popular')}
                  />

                  {/* Re-hosted live events */}
                  <RehostedEventsSection events={rehostedEvents} />

                  {/* Nearby events by distance band + category breaks */}
                  {nearbyByBand.size > 0 ? (
                    renderBands()
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-white/40 text-sm">
                        Enable location access or use the search bar to find events near you.
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Filter Modal */}
      <FilterSearchEvents
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFilterApply}
        initialFilters={activeFilters}
        userLocation={userLocation}
      />
    </div>
  );
}
