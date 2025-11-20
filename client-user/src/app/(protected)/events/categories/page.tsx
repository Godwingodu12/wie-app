'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { useCategoryEvents } from '@/hooks/events/useCategoryEvents';
import { MapPin, Navigation, Search, Filter } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/types/ticket';
import { EventCard } from '@/components/events/EventCard';

export default function CategoryEventsPage() {
  const { user } = useAuth(true);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [locationInput, setLocationInput] = useState('');
  const [hasActiveSearch, setHasActiveSearch] = useState(false);

  const {
    eventsByCategory,
    categories,
    loading,
    error,
    locationSource,
    searchRadius,
    fetchCategoryEvents,
    getCurrentLocationAndFetch,
  } = useCategoryEvents(selectedCategory, false);

  useEffect(() => {
    // Auto-load events on mount with user's country
    fetchCategoryEvents().then(() => {
      setHasActiveSearch(false);
    });
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCategoryEvents({ category: selectedCategory, userId: user?.id });
      setHasActiveSearch(true);
    }
  }, [selectedCategory]);

  const handleUseCurrentLocation = async () => {
    try {
      await getCurrentLocationAndFetch();
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || 'Failed to get location');
    }
  };

  const handleManualLocationSearch = async () => {
    if (!locationInput.trim()) return;
    try {
      await fetchCategoryEvents({ 
        location: locationInput,
        category: selectedCategory,
        userId: user?.id 
      });
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || 'Failed to search location');
    }
  };

  const handleCategoryClick = (category: string) => {
    const newCategory = category === selectedCategory ? undefined : category;
    setSelectedCategory(newCategory);
    setHasActiveSearch(!!newCategory || locationSource !== 'none');
  };

  const handleClearSearch = async () => {
    setSelectedCategory(undefined);
    setLocationInput('');
    setHasActiveSearch(false);
    
    try {
      await fetchCategoryEvents({ userId: user?.id });
    } catch (err: any) {
      alert(err.message || 'Failed to reset search');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
        title="Explore Events by Category"
        subtitle={
            locationSource === 'gps' || locationSource === 'saved'
            ? `Discover events near you within ${searchRadius}km, organized by interest`
            : locationSource === 'manual'
            ? `Discover events in your selected location, organized by interest`
            : locationSource === 'country' && user?.country_name
            ? `Discover events in ${user.country_name}, organized by interest`
            : `Discover events organized by interest`
        }
        />
        {/* Location Search - Always Visible */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Find Events Near You
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Use Current Location */}
              <button
                onClick={handleUseCurrentLocation}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Navigation className="w-5 h-5" />
                Use Current Location
              </button>
              
              {/* Manual Location Search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSearch()}
                  placeholder="You can enter manually or turn on location"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleManualLocationSearch}
                  disabled={loading || !locationInput.trim()}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Location Status */}
        {locationSource !== 'none' && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-600">
            <MapPin className="w-4 h-4" />
            <span>
            {locationSource === 'gps' || locationSource === 'saved'
                ? `Location active (${locationSource}) - Showing events within ${searchRadius}km sorted by distance`
                : locationSource === 'manual'
                ? `Searching in your selected location`
                : locationSource === 'country' && user?.country_name
                ? `Showing events in ${user.country_name}`
                : 'Location filter active'}
            </span>
        </div>
        )}
        {/* Clear Search Button */}
        {hasActiveSearch && (
          <div className="mb-6">
            <button
              onClick={handleClearSearch}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
              Clear All Filters
            </button>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                disabled={loading}
                className={`px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-50 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <p className="mt-3 text-sm text-gray-600">
              Showing only: <span className="font-semibold">{selectedCategory}</span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Events by Category */}
        {!loading && Object.keys(eventsByCategory).length > 0 && (
          <div className="space-y-8">
            {Object.entries(eventsByCategory).map(([category, events]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {category}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({events.length} event{events.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                    {events.map((event) => (
                      <div key={event._id} className="w-80 flex-shrink-0">
                        <EventCard event={event} showDistance={locationSource !== 'none'} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Empty State */}
        {!loading && Object.keys(eventsByCategory).length === 0 && (
        <Card className="text-center py-12">
            <div className="max-w-md mx-auto">
            <p className="text-gray-600 text-lg mb-2">
                {selectedCategory 
                ? `No events found for "${selectedCategory}"`
                : 'No events found'}
            </p>
            {user?.country_name && (
                <p className="text-gray-500 text-sm mb-4">
                in {user.country_name}
                {locationSource === 'saved' || locationSource === 'gps' 
                    ? ' near your location' 
                    : locationSource === 'manual' && locationInput
                    ? ` in ${locationInput}`
                    : ''}
                </p>
            )}
            {selectedCategory && (
                <button
                onClick={() => setSelectedCategory(undefined)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
                >
                View all categories
                </button>
            )}
            </div>
        </Card>
        )}
      </div>
    </div>
  );
}