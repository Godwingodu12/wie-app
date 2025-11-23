import { useState } from 'react';
import { getFilteredEvents } from '@/services/ticketUserService';
import { FilterEventsParams, EventWithLocation } from '@/types/ticket';
import { useAuth } from '@/hooks/useAuth';

export const useFilteredEvents = () => {
  const { user } = useAuth();
  const [eventsByCategory, setEventsByCategory] = useState<Record<string, EventWithLocation[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<any>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [locationSource, setLocationSource] = useState<string>('none');
  const [searchRadius, setSearchRadius] = useState<number | null>(null);

  const filterEvents = async (filters: FilterEventsParams) => {
    try {
      setLoading(true);
      setError(null);

      // Add userId if available
      const requestFilters: FilterEventsParams = { ...filters };
      if (user?.id) {
        requestFilters.userId = user.id;
      }

      // Add user coordinates if no location specified
      if (!requestFilters.location && !requestFilters.latitude && !requestFilters.longitude) {
        if (user?.latitude && user?.longitude) {
          requestFilters.latitude = user.latitude;
          requestFilters.longitude = user.longitude;
        }
      }

      console.log('🔍 filterEvents params:', requestFilters);

      const response = await getFilteredEvents(requestFilters);

      if (response.success) {
        setEventsByCategory(response.data.eventsByCategory || {});
        setCategories(response.data.categories || []);
        setAppliedFilters(response.data.appliedFilters);
        setTotalEvents(response.data.totalEvents || 0);
        setLocationSource(response.data.locationSource || 'none');
        setSearchRadius(response.data.searchRadius || null);
      } else {
        setError(response.message || 'Failed to fetch filtered events');
      }

      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch filtered events';
      setError(errorMsg);
      console.error('❌ filterEvents error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setEventsByCategory({});
    setCategories([]);
    setAppliedFilters(null);
    setTotalEvents(0);
    setLocationSource('none');
    setSearchRadius(null);
    setError(null);
  };
  return {
    eventsByCategory,
    categories,
    loading,
    error,
    appliedFilters,
    totalEvents,
    locationSource,
    searchRadius,
    filterEvents,
    clearFilters,
  };
};