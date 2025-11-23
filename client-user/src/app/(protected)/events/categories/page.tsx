'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { useEventSearch } from '@/hooks/events/useEventSearch';
import { useFilteredEvents } from '@/hooks/events/useFilteredEvents';
import { MapPin, Navigation, Search, Filter, X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { EVENT_CATEGORIES, FilterEventsParams } from '@/types/ticket';
import { EventCard } from '@/components/events/EventCard';
import { EventFilterModal } from '@/components/events/EventFilterModal';

export default function CategoryEventsPage() {
  const { user } = useAuth(true);
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [locationInput, setLocationInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [hasActiveSearch, setHasActiveSearch] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterEventsParams>({});
  const [isUsingAdvancedFilter, setIsUsingAdvancedFilter] = useState(false);

  const {
    eventsByCategory,
    categories,
    totalEvents,
    suggestionsByCategory,
    suggestionCategories,
    hasSuggestions,
    totalSuggestions,
    loading,
    error,
    locationSource,
    searchRadius,
    currentSearchType,
    fetchInitialEvents,
    searchByName,
    searchByLocation,
    searchByCategory,
    searchByCurrentLocation,
    clearAndReset,
  } = useEventSearch();

  const {
    eventsByCategory: filteredEventsByCategory,
    loading: filterLoading,
    error: filterError,
    appliedFilters,
    totalEvents: filteredTotalEvents,
    filterEvents,
    clearFilters,
  } = useFilteredEvents();

  const displayEventsByCategory = isUsingAdvancedFilter ? filteredEventsByCategory : eventsByCategory;
  const displayLoading = isUsingAdvancedFilter ? filterLoading : loading;
  const displayError = isUsingAdvancedFilter ? filterError : error;

  // Initial load
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setHasActiveSearch(true);
      searchByCategory(categoryFromUrl);
    } else {
      fetchInitialEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFromUrl]);

  // Handle GPS location search
  const handleUseCurrentLocation = async () => {
    try {
      setIsUsingAdvancedFilter(false);
      setSelectedCategory(undefined);
      await searchByCurrentLocation();
      setLocationInput('');
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || 'Failed to get location');
    }
  };

  // Handle manual location search
  const handleManualLocationSearch = async () => {
    if (!locationInput.trim()) return;
    try {
      setIsUsingAdvancedFilter(false);
      setSelectedCategory(undefined);
      await searchByLocation({ location: locationInput.trim() });
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || 'Failed to search location');
    }
  };

  // Handle event name search
  const handleEventNameSearch = async () => {
    if (!searchInput.trim()) return;
    try {
      setIsUsingAdvancedFilter(false);
      setSelectedCategory(undefined);
      await searchByName(searchInput.trim());
      setHasActiveSearch(true);
    } catch (err: any) {
      alert(err.message || 'Failed to search events');
    }
  };

  // Handle category click
  const handleCategoryClick = async (category: string) => {
    if (isUsingAdvancedFilter) {
      const newCategory = category === activeFilters.category ? undefined : category;
      const newFilters = { ...activeFilters, category: newCategory };
      setActiveFilters(newFilters);
      try {
        await filterEvents(newFilters);
      } catch (err) {
        console.error('Filter error:', err);
      }
    } else {
      const newCategory = category === selectedCategory ? undefined : category;
      setSelectedCategory(newCategory);
      setLocationInput('');
      setSearchInput('');
      
      if (newCategory) {
        setHasActiveSearch(true);
        await searchByCategory(newCategory);
      } else {
        setHasActiveSearch(false);
        await fetchInitialEvents();
      }
    }
  };

  // Handle clear all
  const handleClearSearch = async () => {
    setSelectedCategory(undefined);
    setLocationInput('');
    setSearchInput('');
    setHasActiveSearch(false);
    setIsUsingAdvancedFilter(false);
    setActiveFilters({});
    clearFilters();
    
    try {
      await clearAndReset();
    } catch (err: any) {
      alert(err.message || 'Failed to reset search');
    }
  };

  // Handle advanced filters
  const handleApplyAdvancedFilters = async (filters: FilterEventsParams) => {
    try {
      setActiveFilters(filters);
      setIsUsingAdvancedFilter(true);
      setHasActiveSearch(true);
      
      if (user?.latitude && user?.longitude && !filters.location) {
        filters.latitude = user.latitude;
        filters.longitude = user.longitude;
      }
      
      await filterEvents(filters);
      setIsFilterModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to apply filters');
    }
  };

  const getActiveFiltersCount = () => {
    if (!isUsingAdvancedFilter) return 0;
    let count = 0;
    if (activeFilters.category) count++;
    if (activeFilters.subcategory) count++;
    if (activeFilters.location) count++;
    if (activeFilters.searchQuery) count++;
    if (activeFilters.radius && activeFilters.radius !== 200) count++;
    if (activeFilters.locationType) count++;
    if (activeFilters.eventLanguage) count++;
    if (activeFilters.startDate || activeFilters.endDate) count++;
    if (activeFilters.bookingStartDate || activeFilters.bookingEndDate) count++;
    return count;
  };

  const getStatusText = () => {
    if (isUsingAdvancedFilter && appliedFilters) {
      const parts: string[] = [];
      if (appliedFilters.searchQuery) parts.push(`"${appliedFilters.searchQuery}"`);
      if (appliedFilters.category) parts.push(appliedFilters.category);
      if (appliedFilters.locationType) parts.push(appliedFilters.locationType);
      return parts.length > 0 ? `Filtering by: ${parts.join(', ')}` : 'Advanced filters applied';
    }
    
    switch (currentSearchType) {
      case 'name':
        return `Searching for events`;
      case 'location':
        return locationInput ? `Searching in: ${locationInput}` : 'Searching by location';
      case 'category':
        return selectedCategory ? `Category: ${selectedCategory}` : '';
      default:
        if (locationSource === 'saved') return 'Showing events near your saved location';
        if (locationSource === 'country') return `Showing events in ${user?.country_name || 'your country'}`;
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title="Explore Events"
          subtitle={
            isUsingAdvancedFilter
              ? `${filteredTotalEvents} events found`
              : totalEvents > 0
              ? `${totalEvents} events found`
              : 'Discover events near you'
          }
        />

        {/* Quick Search & Advanced Filter Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="bg-green-50 border-green-200">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-green-600" />
                Search by Event Name
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEventNameSearch()}
                  placeholder="Search events..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleEventNameSearch}
                  disabled={displayLoading || !searchInput.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple-600" />
                Advanced Filters
              </h3>
              <button
                onClick={() => setIsFilterModalOpen(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Open Filter Panel
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-white text-purple-600 text-xs px-2 py-0.5 rounded-full ml-2">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Location Search */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Search by Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleUseCurrentLocation}
                disabled={displayLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Navigation className="w-4 h-4" />
                Use Current Location
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSearch()}
                  placeholder="Enter city, area, or place..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={handleManualLocationSearch}
                  disabled={displayLoading || !locationInput.trim()}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Status */}
        {(hasActiveSearch || locationSource !== 'none') && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{getStatusText()}</span>
            {searchRadius && <span className="text-gray-400">• {searchRadius}km radius</span>}
          </div>
        )}

        {/* Clear All Button */}
        {hasActiveSearch && (
          <div className="mb-6">
            <button
              onClick={handleClearSearch}
              disabled={displayLoading}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <X className="h-4 w-4" />
              Clear All & Show All Events
            </button>
          </div>
        )}

        {/* Category Quick Filter */}
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {EVENT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                disabled={displayLoading}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                  (isUsingAdvancedFilter ? activeFilters.category : selectedCategory) === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {displayLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        )}

        {/* Error State */}
        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{displayError}</p>
          </div>
        )}

        {/* Main Results */}
        {!displayLoading && Object.keys(displayEventsByCategory).length > 0 && (
          <div className="space-y-8">
            {Object.entries(displayEventsByCategory).map(([category, events]) => (
              <div key={category}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {category}
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({events.length} event{events.length !== 1 ? 's' : ''})
                  </span>
                </h2>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                    {events.map((event) => (
                      <div key={event._id} className="w-80 flex-shrink-0">
                        <EventCard 
                          event={event} 
                          showDistance={locationSource === 'gps' || locationSource === 'saved'} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State with Suggestions */}
        {!displayLoading && Object.keys(displayEventsByCategory).length === 0 && (
          <Card className="text-center py-12 mb-8">
            <div className="max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                {currentSearchType === 'location' && locationInput
                  ? `No events found in "${locationInput}"`
                  : currentSearchType === 'category' && selectedCategory
                  ? `No events found for "${selectedCategory}" in your area`
                  : currentSearchType === 'name' && searchInput
                  ? `No events found matching "${searchInput}"`
                  : 'No events found'}
              </p>
              {currentSearchType === 'location' && locationInput && (
                <p className="text-gray-500 text-sm mb-4">
                  There are currently no events scheduled in this location.
                </p>
              )}
              <button
                onClick={handleClearSearch}
                className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
              >
                Clear filters and view all events
              </button>
            </div>
          </Card>
        )}
        {/* Suggestions Section (only when no main results and has suggestions) */}
        {!displayLoading && !isUsingAdvancedFilter && hasSuggestions && totalEvents === 0 && Object.keys(suggestionsByCategory).length > 0 && (
          <div className="mt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {currentSearchType === 'location' && locationInput
                  ? `Suggested Events Near Your Profile Location`
                  : currentSearchType === 'category' && selectedCategory
                  ? `Suggested "${selectedCategory}" Events (within 500km)`
                  : `Suggested Events Nearby`}
              </h3>
              <p className="text-sm text-yellow-700">
                {currentSearchType === 'location' && locationInput
                  ? `No events in "${locationInput}", but we found ${totalSuggestions} event(s) near your saved location`
                  : `We found ${totalSuggestions} event(s) that might interest you`}
              </p>
            </div>
            
            <div className="space-y-8">
              {Object.entries(suggestionsByCategory).map(([category, events]) => (
                <div key={`suggestion-${category}`}>
                  <h2 className="text-xl font-bold text-gray-700 mb-4">
                    {category}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({events.length} suggested)
                    </span>
                  </h2>
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                      {events.map((event) => (
                        <div key={event._id} className="w-80 flex-shrink-0 opacity-90">
                          <EventCard event={event} showDistance={true} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Show location name when events are found */}
        {!displayLoading && currentSearchType === 'location' && locationInput && totalEvents > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">
              ✓ Found {totalEvents} event(s) in "{locationInput}"
            </p>
          </div>
        )}
        {/* Suggestions Section (only when no main results) */}
        {!displayLoading && !isUsingAdvancedFilter && hasSuggestions && Object.keys(suggestionsByCategory).length > 0 && (
          <div className="mt-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Suggested Events Nearby (within 500km)
              </h3>
              <p className="text-sm text-yellow-700">
                {currentSearchType === 'category' && selectedCategory
                  ? `We found ${totalSuggestions} "${selectedCategory}" event(s) in nearby areas`
                  : `We found ${totalSuggestions} event(s) in nearby areas that might interest you`}
              </p>
            </div>
            
            <div className="space-y-8">
              {Object.entries(suggestionsByCategory).map(([category, events]) => (
                <div key={`suggestion-${category}`}>
                  <h2 className="text-xl font-bold text-gray-700 mb-4">
                    {category}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({events.length} suggested)
                    </span>
                  </h2>
                  <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
                      {events.map((event) => (
                        <div key={event._id} className="w-80 flex-shrink-0 opacity-90">
                          <EventCard event={event} showDistance={true} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Filter Modal */}
      <EventFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyAdvancedFilters}
        initialFilters={activeFilters}
        loading={filterLoading}
      />
    </div>
  );
}