'use client';

import { useState, useEffect } from 'react';
import { X, Filter, MapPin, Calendar, Globe, Search, RotateCcw } from 'lucide-react';
import { EVENT_CATEGORIES, EVENT_LANGUAGES, FilterEventsParams, SUBCATEGORIES } from '@/types/ticket';

interface EventFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterEventsParams) => void;
  initialFilters?: FilterEventsParams;
  loading?: boolean;
}

export const EventFilterModal = ({ isOpen, onClose, onApplyFilters, initialFilters, loading }: EventFilterModalProps) => {
  const [filters, setFilters] = useState<FilterEventsParams>({
    category: '',
    subcategory: '',
    location: '',
    searchQuery: '',
    radius: 50,
    locationType: undefined,
    eventLanguage: '',
    startDate: '',
    endDate: '',
    bookingStartDate: '',
    bookingEndDate: '',
  });

  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  useEffect(() => {
    if (filters.category && SUBCATEGORIES[filters.category]) {
      setAvailableSubcategories(SUBCATEGORIES[filters.category]);
    } else {
      setAvailableSubcategories([]);
      setFilters(prev => ({ ...prev, subcategory: '' }));
    }
  }, [filters.category]);

  const handleInputChange = (field: keyof FilterEventsParams, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFilters({
      category: '',
      subcategory: '',
      location: '',
      searchQuery: '',
      radius: 50,
      locationType: undefined,
      eventLanguage: '',
      startDate: '',
      endDate: '',
      bookingStartDate: '',
      bookingEndDate: '',
    });
  };

  const handleApply = async () => {
    const cleanFilters: FilterEventsParams = {};
    if (filters.category)         cleanFilters.category = filters.category;
    if (filters.subcategory)      cleanFilters.subcategory = filters.subcategory;
    if (filters.searchQuery)      cleanFilters.searchQuery = filters.searchQuery;
    if (filters.radius && filters.radius !== 50) cleanFilters.radius = filters.radius;
    if (filters.locationType)     cleanFilters.locationType = filters.locationType;
    if (filters.eventLanguage)    cleanFilters.eventLanguage = filters.eventLanguage;
    if (filters.startDate)        cleanFilters.startDate = filters.startDate;
    if (filters.endDate)          cleanFilters.endDate = filters.endDate;
    if (filters.bookingStartDate) cleanFilters.bookingStartDate = filters.bookingStartDate;
    if (filters.bookingEndDate)   cleanFilters.bookingEndDate = filters.bookingEndDate;

    // If location text is provided, use searchEventsByLocation
    if (filters.location && filters.location.trim()) {
      cleanFilters.location = filters.location.trim();
      try {
        const { searchEventsByLocation } = await import('@/services/ticketUserService');
        const res = await searchEventsByLocation({
          location: cleanFilters.location,
          radius: cleanFilters.radius ?? 500,
        });
        onApplyFilters({ ...cleanFilters, _locationSearchResult: res } as any);
      } catch (err) {
        console.error('Location search error:', err);
        onApplyFilters(cleanFilters);
      }
      return;
    }

    onApplyFilters(cleanFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.location) count++;
    if (filters.searchQuery) count++;
    if (filters.radius && filters.radius !== 50) count++;
    if (filters.locationType) count++;
    if (filters.eventLanguage) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.bookingStartDate || filters.bookingEndDate) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Filter Events</h2>
              {getActiveFiltersCount() > 0 && (
                <span className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full">
                  {getActiveFiltersCount()} active
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            {/* Event Name Search */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Search className="w-4 h-4" /> Event Name
              </label>
              <input
                type="text"
                value={filters.searchQuery || ''}
                onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                placeholder="Search by event name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">All Categories</option>
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                <select
                  value={filters.subcategory || ''}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  disabled={!filters.category}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Subcategories</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Name / Location Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Search className="w-4 h-4" /> Event Name
                </label>
                <input
                  type="text"
                  value={filters.searchQuery || ''}
                  onChange={(e) => handleInputChange('searchQuery', e.target.value)}
                  placeholder="Search by event name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" /> Location Search
                </label>
                <input
                  type="text"
                  value={filters.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, state, country (e.g. Kochi)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Overrides GPS — searches events in this area
                </p>
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe className="w-4 h-4" /> Event Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '', label: 'All Types' },
                  { value: 'offline', label: 'Offline (In-Person)' },
                  { value: 'online', label: 'Online (Virtual)' },
                  { value: 'recorded', label: 'Recorded' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleInputChange('locationType', type.value || undefined)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      (filters.locationType || '') === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Language */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Language</label>
              <select
                value={filters.eventLanguage || ''}
                onChange={(e) => handleInputChange('eventLanguage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">All Languages</option>
                {EVENT_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Event Dates */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" /> Event Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Booking Dates */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4" /> Booking Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Booking From</label>
                  <input
                    type="date"
                    value={filters.bookingStartDate || ''}
                    onChange={(e) => handleInputChange('bookingStartDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Booking To</label>
                  <input
                    type="date"
                    value={filters.bookingEndDate || ''}
                    onChange={(e) => handleInputChange('bookingEndDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Reset All
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Filter className="w-4 h-4" /> Apply Filters
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
