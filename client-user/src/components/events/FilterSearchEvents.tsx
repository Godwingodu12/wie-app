'use client';

import { useState, useEffect } from 'react';
import { X, RotateCcw, Calendar } from 'lucide-react';
import { getCategoryBasedEvents, getFilteredEvents } from '@/services/ticketUserService';
import { FilterEventsParams, EVENT_CATEGORIES } from '@/types/ticket';

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

      if (selectedCategory) params.category = selectedCategory;
      if (selectedSubcategory) params.subcategory = selectedSubcategory;
      if (location.trim()) params.location = location.trim();
      if (currentDistance) params.radius = currentDistance;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Pass user GPS coords if available and no manual location
      if (userLocation && !location.trim()) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      }

      const response = await getFilteredEvents(params);
      onApply(response, params);
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
        className="relative w-full max-w-[507px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#1C2024', border: '1px solid #2D3139' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-white text-xl font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {/* Categories */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Categories</h3>
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
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #5B8DEF 0%, #8860D9 100%)'
                        : '#2D3139',
                      color: isActive ? '#fff' : '#9CA3AF',
                      border: isActive ? 'none' : '1px solid #3D4149',
                    }}
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
              <h3 className="text-white text-sm font-semibold mb-3">Sub categories</h3>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => {
                  const isActive = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(isActive ? '' : sub)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, #5B8DEF 0%, #8860D9 100%)'
                          : '#2D3139',
                        color: isActive ? '#fff' : '#9CA3AF',
                        border: isActive ? 'none' : '1px solid #3D4149',
                      }}
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
            <h3 className="text-white text-sm font-semibold mb-3">Location</h3>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location manually"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
              style={{ background: '#2D3139', border: '1px solid #3D4149' }}
            />
          </div>

          {/* Distance */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Distance</h3>
            <input
              type="range"
              min={0}
              max={DISTANCE_STEPS.length}
              step={1}
              value={distanceIndex}
              onChange={(e) => setDistanceIndex(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #8860D9 0%, #8860D9 ${(distanceIndex / DISTANCE_STEPS.length) * 100}%, #3D4149 ${(distanceIndex / DISTANCE_STEPS.length) * 100}%, #3D4149 100%)`,
                accentColor: '#8860D9',
              }}
            />
            <div className="flex justify-between text-xs text-white/50 mt-2">
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
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500/50"
                  style={{ background: '#2D3139', border: '1px solid #3D4149' }}
                  min={51}
                />
              </div>
            )}
          </div>

          {/* Event Date */}
          <div>
            <h3 className="text-white text-sm font-semibold mb-3">Event date</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/50 text-xs mb-1.5">From</p>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white/70 outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none"
                    style={{
                      background: '#2D3139',
                      border: '1px solid #3D4149',
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1.5">To</p>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white/70 outline-none focus:ring-1 focus:ring-purple-500/50 appearance-none"
                    style={{
                      background: '#2D3139',
                      border: '1px solid #3D4149',
                      colorScheme: 'dark',
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
          style={{ borderTop: '1px solid #2D3139' }}
        >
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-colors"
              style={{ background: '#2D3139' }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #A78BFA 0%, #8860D9 50%, #7C3AED 100%)',
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