'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, Calendar, MapPin, Ticket, Search } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/components/home/ThemeContext';
import { getLiveEvents, searchEventsByName } from '@/services/ticketUserService';
import { format } from 'date-fns';

interface EventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (event: {
    eventId: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    venue?: string;
    image?: string;
    ticketUrl?: string;
  }) => void;
}

export default function EventPickerModal({ isOpen, onClose, onSend }: EventPickerModalProps) {
  const { themeStyles, isDark } = useTheme();

  const [liveEvents,    setLiveEvents]    = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchType,    setSearchType]    = useState<'name' | 'location'>('name');
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isSearching,   setIsSearching]   = useState(false);
  const [liveError,     setLiveError]     = useState<string | null>(null);
  const [searchError,   setSearchError]   = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLiveEvents = useCallback(async () => {
    setIsLoadingLive(true);
    setLiveError(null);
    try {
      const data = await getLiveEvents();
      const list =
        data?.data?.tickets  ||
        (data as any)?.data?.events ||
        (data as any)?.liveEvents   ||
        [];
      setLiveEvents(Array.isArray(list) ? list : []);
    } catch {
      setLiveError('Failed to load events');
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSearchError(null);
      loadLiveEvents();
    }
  }, [isOpen, loadLiveEvents]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        let flatList: any[] = [];

        if (searchType === 'name') {
          const res = await searchEventsByName({ searchQuery: searchQuery.trim() });
          // Returns { data: { eventsByCategory: { "Music": [...], "Sports": [...] } } }
          const byCategory = res?.data?.eventsByCategory ?? {};
          flatList = Object.values(byCategory).flat() as any[];
        } else {
          const { searchEventsByLocation } = await import('@/services/ticketUserService');
          const res = await searchEventsByLocation({ location: searchQuery.trim() });
          const byCategory  = res?.data?.eventsByCategory  ?? {};
          const suggestions = res?.data?.suggestionsByCategory ?? {};
          flatList = [
            ...Object.values(byCategory).flat(),
            ...Object.values(suggestions).flat(),
          ] as any[];
        }

        // Deduplicate by _id
        const seen = new Set<string>();
        const deduped = flatList.filter((ev: any) => {
          const id = ev._id || ev.id || ev.eventId;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });

        setSearchResults(deduped);
      } catch {
        setSearchError('Search failed. Try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, searchType]);

const handleSelect = (ev: any) => {
    const resolvedTitle =
      ev.event_name  ||
      ev.title       ||
      ev.name        ||
      'Event';

    const resolvedImage =
      ev.event_portrait ||
      ev.event_banner   ||
      ev.image          ||
      ev.banner         ||
      ev.thumbnail      ||
      '';

    const resolvedStartDate =
      ev.event_dates?.[0]?.start_date ||
      ev.startDate                    ||
      ev.start_date                   ||
      ev.date                         ||
      undefined;

    onSend({
      eventId:     ev._id     || ev.id || ev.eventId || '',
      title:       resolvedTitle,
      description: ev.description || '',
      startDate:   resolvedStartDate,
      endDate:     ev.event_dates?.[0]?.end_date || ev.endDate || ev.end_date || undefined,
      venue:       ev.venue    || ev.location || '',
      image:       resolvedImage,
      ticketUrl:   ev.ticketUrl || ev.link || '',
    });
    onClose();
  };

  // Decide which list to display
  const isSearchMode   = searchQuery.trim().length > 0;
  const displayEvents  = isSearchMode ? searchResults : liveEvents;
  const isLoading      = isSearchMode ? isSearching   : isLoadingLive;
  const error          = isSearchMode ? searchError   : liveError;
    const emptyMsg = isSearchMode
        ? searchType === 'location'
        ? `No events found near "${searchQuery}"`
        : `No events found for "${searchQuery}"`
        : 'No live events available';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className="w-full max-w-md rounded-[24px] overflow-hidden shadow-2xl flex flex-col"
        style={{
          backgroundColor: isDark ? '#121316' : themeStyles.cardBg,
          border:          `0.5px solid ${themeStyles.border}`,
          maxHeight:       '80vh',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${themeStyles.border}` }}
        >
          <h3 className="text-[17px] font-semibold" style={{ color: themeStyles.text }}>
            Share Event
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: themeStyles.textSecondary }}
          >
            <X size={20} />
          </button>
        </div>
        {/* ── Search bar ── */}
        <div
          className="px-4 pt-3 pb-3 flex-shrink-0 flex flex-col gap-2"
          style={{ borderBottom: `1px solid ${themeStyles.border}` }}
        >
          {/* Toggle — Name / Location */}
          <div
            className="flex items-center rounded-full p-0.5 self-start"
            style={{ backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0' }}
          >
            {(['name', 'location'] as const).map(type => (
              <button
                key={type}
                onClick={() => { setSearchType(type); setSearchQuery(''); setSearchResults([]); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all capitalize"
                style={{
                  backgroundColor: searchType === type
                    ? '#F472B6'
                    : 'transparent',
                  color: searchType === type
                    ? '#fff'
                    : themeStyles.textSecondary,
                }}
              >
                {type === 'name' ? (
                  <Search size={11} />
                ) : (
                  <MapPin size={11} />
                )}
                {type === 'name' ? 'By Name' : 'By Location'}
              </button>
            ))}
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              backgroundColor: isDark ? '#1e1e1e' : '#f3f4f6',
              border:          `1px solid ${themeStyles.border}`,
            }}
          >
            {isSearching ? (
              <Loader2 size={15} className="animate-spin flex-shrink-0 text-[#F472B6]" />
            ) : searchType === 'location' ? (
              <MapPin size={15} style={{ color: '#F472B6', flexShrink: 0 }} />
            ) : (
              <Search size={15} style={{ color: themeStyles.textSecondary, flexShrink: 0 }} />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={
                searchType === 'name'
                  ? 'Search events by name…'
                  : 'Search events by location…'
              }
              className="flex-1 bg-transparent outline-none text-[14px] placeholder:opacity-40"
              style={{ color: themeStyles.text }}
            />
            {searchQuery.length > 0 && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                style={{ color: themeStyles.textSecondary }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Section label ── */}
        {!isSearchMode && (
          <div className="px-5 pt-3 pb-1 flex-shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: themeStyles.textSecondary }}>
              Live Events
            </p>
          </div>
        )}

        {/* ── Event list ── */}
        <div className="overflow-y-auto flex-1 px-3 pb-4">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-[#F472B6]" size={26} />
            </div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="text-center py-8">
              <p className="text-[13px] text-red-400 mb-3">{error}</p>
              {!isSearchMode && (
                <button
                  onClick={loadLiveEvents}
                  className="text-[13px] text-[#5494FF] underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && displayEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Calendar size={32} className="text-[#F472B6] opacity-40" />
              <p className="text-[13px] text-center" style={{ color: themeStyles.textSecondary }}>
                {emptyMsg}
              </p>
            </div>
          )}

          {/* Event cards */}
          {!isLoading && !error && displayEvents.length > 0 && (
            <div className="space-y-2 mt-2">
              {displayEvents.map((ev: any) => {
                const evId      = ev._id || ev.id || ev.eventId;
                const startDate =
                  ev.event_dates?.[0]?.start_date ||
                  ev.startDate || ev.start_date || ev.date;
                const imageUrl  =
                  ev.event_portrait || ev.event_banner ||
                  ev.image || ev.banner || ev.thumbnail;
                const eventName =
                  ev.event_name || ev.title || ev.name || 'Untitled Event';
                return (
                  <button
                    key={evId}
                    onClick={() => handleSelect(ev)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-[0.98]"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.backgroundColor = themeStyles.hoverBg)
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: isDark ? '#1e1e1e' : '#f0f0f0' }}
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={eventName}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <Calendar size={24} className="text-[#F472B6]" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[14px] font-semibold truncate"
                        style={{ color: themeStyles.text }}
                      >
                        {eventName}
                      </p>

                      {(ev.venue || ev.location) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="flex-shrink-0" style={{ color: '#F472B6' }} />
                          <p
                            className="text-[11px] truncate"
                            style={{ color: themeStyles.textSecondary }}
                          >
                            {ev.venue || ev.location}
                          </p>
                        </div>
                      )}

                      {startDate && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Ticket size={10} className="flex-shrink-0 text-[#F472B6]" />
                          <p className="text-[11px]" style={{ color: themeStyles.textSecondary }}>
                            {(() => {
                              try {
                                return format(new Date(startDate), 'MMM d, yyyy · h:mm a');
                              } catch {
                                return String(startDate);
                              }
                            })()}
                          </p>
                        </div>
                      )}

                      {ev.description && (
                        <p
                          className="text-[11px] mt-0.5 line-clamp-1 opacity-60"
                          style={{ color: themeStyles.textSecondary }}
                        >
                          {ev.description}
                        </p>
                      )}
                    </div>

                    {/* Send arrow */}
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(244,114,182,0.15)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}