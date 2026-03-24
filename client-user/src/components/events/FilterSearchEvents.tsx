'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Calendar } from 'lucide-react';
import { getCategoryBasedEvents, getFilteredEvents } from '@/services/ticketUserService';
import { FilterEventsParams, EVENT_CATEGORIES } from '@/types/ticket';
import { useTheme } from '@/components/home/ThemeContext';

// Sub-category map — extend as needed
const SUBCATEGORY_MAP: Record<string, string[]> = {
  'Sports, Fitness, & Adventure': ['Football', 'Cricket', 'Basketball', 'Yoga', 'Marathon', 'Cycling', 'Swimming', 'Hiking'],
  'Music': ['Jazz', 'Classical', 'Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Folk', 'Indie'],
  'Arts, Culture, & Literature': ['Painting', 'Sculpture', 'Photography', 'Poetry', 'Theatre', 'Literature', 'Craft'],
  'Dance': ['Classical', 'Hip-Hop', 'Salsa', 'Ballet', 'Bharatanatyam', 'Contemporary', 'Folk'],
  'Business & Innovation': ['Startup', 'Tech', 'Finance', 'Marketing', 'Leadership', 'Networking', 'AI'],
  'Food, Lifestyle, & Wellness': ['Cooking', 'Nutrition', 'Wellness', 'Meditation', 'Fashion', 'Beauty'],
  'Film, Media, & Gaming': ['Film Screening', 'Gaming', 'Animation', 'Podcast', 'Media', 'Esports'],
  'Travel, Holidays, & Tourism': ['Adventure Travel', 'Beach', 'Mountains', 'City Tours', 'Cultural'],
  'Festivals & Celebrations': ['Cultural Festival', 'Music Festival', 'Food Festival', 'Religious', 'New Year'],
  'Environment, Sustainability, & Agriculture': ['Conservation', 'Organic Farming', 'Climate', 'Recycling'],
  'Religious & Spiritual Events': ['Prayer', 'Meditation', 'Satsang', 'Pilgrimage', 'Interfaith'],
  'Education & Learning': ['Workshop', 'Seminar', 'Conference', 'Hackathon', 'Bootcamp', 'Webinar'],
  'Entertainment & Performing Arts': ['Comedy', 'Magic Show', 'Drama', 'Circus', 'Stand-up', 'Opera'],
};

const DISTANCE_STEPS = [10, 20, 30, 50];

interface FilterSearchEventsProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (results: any, filters: FilterEventsParams) => void;
  initialFilters?: FilterEventsParams;
  userLocation?: { latitude: number; longitude: number } | null;
}

export default function FilterSearchEvents({
  isOpen,
  onClose,
  onApply,
  initialFilters,
  userLocation,
}: FilterSearchEventsProps) {
  const { themeStyles, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters?.category || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialFilters?.subcategory || '');
  const [location, setLocation] = useState<string>(initialFilters?.location || '');
  const [distanceIndex, setDistanceIndex] = useState<number>(2); // default 30km
  const [customDistance, setCustomDistance] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(initialFilters?.startDate || '');
  const [endDate, setEndDate] = useState<string>(initialFilters?.endDate || '');
  const [isLoading, setIsLoading] = useState(false);

  const isAny = distanceIndex >= DISTANCE_STEPS.length;
  const currentDistance = isAny
    ? customDistance ? parseInt(customDistance) : undefined
    : DISTANCE_STEPS[distanceIndex];

  const subcategories = selectedCategory ? (SUBCATEGORY_MAP[selectedCategory] || []) : [];

  // Reset subcategory when category changes
  useEffect(() => {
    setSelectedSubcategory('');
  }, [selectedCategory]);

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setLocation('');
    setDistanceIndex(2);
    setCustomDistance('');
    setStartDate('');
    setEndDate('');
  };
const handleApply = async () => {
  setIsLoading(true);
  try {
    const params: FilterEventsParams = {};
    if (selectedCategory)    params.category = selectedCategory;
    if (selectedSubcategory) params.subcategory = selectedSubcategory;
    if (startDate)           params.startDate = startDate;
    if (endDate)             params.endDate = endDate;

    if (location.trim()) {
      // Manual location typed — use location search
      params.location = location.trim();
      if (currentDistance) params.radius = currentDistance;

      const { searchEventsByLocation } = await import('@/services/ticketUserService');
      const locRes = await searchEventsByLocation({
        location: params.location,
        radius: params.radius ?? 500,
      });

      // Deduplicate across all categories + suggestions
      const raw = [
        ...Object.values(locRes.data?.eventsByCategory ?? {}).flat(),
        ...Object.values(locRes.data?.suggestionsByCategory ?? {}).flat(),
      ] as any[];

      const seen = new Set<string>();
      const deduped = raw.filter((ev) => {
        const id = ev._id?.toString() || '';
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      // Rebuild as single "All Results" category for the page to render
      const syntheticResponse = {
        ...locRes,
        data: {
          ...locRes.data,
          eventsByCategory: deduped.length > 0 ? { 'Events Near Location': deduped } : {},
        },
      };

      onApply(syntheticResponse, params);
      onClose();
      return;
    }

    // GPS-based or category/date only
    if (userLocation) {
      params.latitude  = userLocation.latitude;
      params.longitude = userLocation.longitude;
      if (currentDistance) params.radius = currentDistance;
    }

    const response = await getFilteredEvents(params);

    // Deduplicate within filtered results too
    const byCategory = response.data?.eventsByCategory ?? {};
    const globalSeen = new Set<string>();
    const dedupedByCategory: Record<string, any[]> = {};
    Object.entries(byCategory).forEach(([cat, evs]) => {
      const filtered = (evs as any[]).filter((ev) => {
        const id = ev._id?.toString() || '';
        if (!id || globalSeen.has(id)) return false;
        globalSeen.add(id);
        return true;
      });
      if (filtered.length > 0) dedupedByCategory[cat] = filtered;
    });

    const dedupedResponse = {
      ...response,
      data: { ...response.data, eventsByCategory: dedupedByCategory },
    };

    onApply(dedupedResponse, params);
    onClose();
  } catch (error) {
    console.error('Filter apply error:', error);
  } finally {
    setIsLoading(false);
  }
};
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[507px] rounded-2xl overflow-hidden shadow-2xl transition-colors duration-200"
        style={{
          backgroundColor: isDark ? '#1D2022' : '#F3F4F6',
          backgroundImage: isDark ? themeStyles.cardBg : 'none',
          border: `1px solid ${themeStyles.border}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold" style={{ color: themeStyles.text }}>Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" style={{ color: themeStyles.textSecondary }} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: themeStyles.text }}>Categories</h3>
            <div className="flex flex-wrap gap-2">
              {EVENT_CATEGORIES.map((cat) => {
                // Show short label
                const shortLabel = cat.split(',')[0].split('&')[0].trim().split(' ').slice(0, 1).join(' ');
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isActive ? '' : cat)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={
                      isActive
                        ? {
                            background: 'var(--chat_color, #5494FF)',
                            color: '#fff',
                            border: 'none',
                          }
                        : {
                            background: themeStyles.hoverBg,
                            color: themeStyles.textSecondary,
                            border: `1px solid ${themeStyles.border}`,
                          }
                    }
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub Categories — only show when a category is selected */}
          {selectedCategory && subcategories.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: themeStyles.text }}>Sub categories</h3>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => {
                  const isActive = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(isActive ? '' : sub)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={
                        isActive
                          ? {
                              background: 'var(--chat_color, #5494FF)',
                              color: '#fff',
                              border: 'none',
                            }
                          : {
                              background: themeStyles.hoverBg,
                              color: themeStyles.textSecondary,
                              border: `1px solid ${themeStyles.border}`,
                            }
                      }
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: themeStyles.text }}>Location</h3>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                userLocation
                  ? `Current location active — or type to override`
                  : `Enter city, state or country (e.g. Kochi, Kerala)`
              }
              className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              style={{ backgroundColor: themeStyles.hoverBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.text }}
            />
            {/* Show active GPS badge when no manual override */}
            {userLocation && !location.trim() && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400/80 text-xs">Using your GPS location</span>
              </div>
            )}
          </div>

          {/* Distance */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: themeStyles.text }}>Distance</h3>
            <input
              type="range"
              min={0}
              max={DISTANCE_STEPS.length}
              step={1}
              value={distanceIndex}
              onChange={(e) => setDistanceIndex(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8860D9 0%, #8860D9 ${(distanceIndex / DISTANCE_STEPS.length) * 100}%, ${themeStyles.border} ${(distanceIndex / DISTANCE_STEPS.length) * 100}%, ${themeStyles.border} 100%)`,
                accentColor: '#8860D9',
              }}
            />
            <div className="flex justify-between text-xs mt-2" style={{ color: themeStyles.textSecondary }}>
              {DISTANCE_STEPS.map((d) => (
                <span key={d}>{d}km</span>
              ))}
              <span>Any</span>
            </div>

            {/* Custom km input when "Any" */}
            {isAny && (
              <div className="mt-3">
                <input
                  type="number"
                  value={customDistance}
                  onChange={(e) => setCustomDistance(e.target.value)}
                  placeholder="Enter custom distance (km)"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500/50"
                  style={{ backgroundColor: themeStyles.hoverBg, border: `1px solid ${themeStyles.border}`, color: themeStyles.text }}
                  min={51}
                />
              </div>
            )}
          </div>

          {/* Event Date */}
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: themeStyles.text }}>Event date</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>From</p>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none"
                    style={{
                      backgroundColor: themeStyles.hoverBg,
                      border: `1px solid ${themeStyles.border}`,
                      color: themeStyles.text,
                      colorScheme: isDark ? 'dark' : 'light',
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs mb-1.5" style={{ color: themeStyles.textSecondary }}>To</p>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none"
                    style={{
                      backgroundColor: themeStyles.hoverBg,
                      border: `1px solid ${themeStyles.border}`,
                      color: themeStyles.text,
                      colorScheme: isDark ? 'dark' : 'light',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: `1px solid ${themeStyles.border}` }}
        >
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: themeStyles.textSecondary }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset all
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center text-sm font-semibold transition-colors"
              style={{
                width: 132,
                height: 38,
                borderRadius: 25,
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.textSecondary,
                padding: '8px 12px',
                gap: 10,
                opacity: 1,
                background: 'transparent',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="flex items-center justify-center text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                width: 132,
                height: 38,
                borderRadius: 25,
                padding: '8px 12px',
                gap: 10,
                opacity: 1,
                background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                color: '#fff',
                border: 'none',
              }}
            >
              {isLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
