import { useState, useEffect } from 'react';
import { getCategoryBasedEvents } from '@/services/ticketUserService';
import { updateUserLocation } from '@/services/wieUserService';
import { CategoryEventsParams, EventWithLocation } from '@/types/ticket';
import { useAuth } from '@/hooks/useAuth';

export const useCategoryEvents = (category?: string, autoLoad: boolean = false) => {
  const { user } = useAuth();
  const [eventsByCategory, setEventsByCategory] = useState<Record<string, EventWithLocation[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'saved' | 'country' | 'none'>('none');
  const [searchRadius, setSearchRadius] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCategoryEvents = async (params: CategoryEventsParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Build params
      const fetchParams: CategoryEventsParams = { ...params };

      if (user?.id) {
        fetchParams.userId = user.id;
      }

      // Use provided category or hook's category
      if (params.category) {
        fetchParams.category = params.category;
      } else if (category) {
        fetchParams.category = category;
      }

      // Add search query if exists
      if (searchQuery.trim() && !fetchParams.searchQuery) {
        fetchParams.searchQuery = searchQuery.trim();
      }

      console.log('🔍 fetchCategoryEvents params:', fetchParams);

      const response = await getCategoryBasedEvents(fetchParams);
      
      setEventsByCategory(response.data.eventsByCategory);
      setCategories(response.data.categories);
      setLocationSource(response.data.locationSource);
      setSearchRadius(response.data.searchRadius || 100);
      
      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch category events';
      setError(errorMsg);
      console.error('❌ fetchCategoryEvents error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Search by event name
  const searchByEventName = async (query: string) => {
    try {
      setSearchQuery(query);
      
      const params: CategoryEventsParams = {
        searchQuery: query,
      };

      if (category) {
        params.category = category;
      }

      if (user?.id) {
        params.userId = user.id;
      }

      await fetchCategoryEvents(params);
    } catch (err) {
      throw err;
    }
  };

  // Get current GPS location and fetch
  const getCurrentLocationAndFetch = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Save location to user profile
            if (user?.id) {
              try {
                await updateUserLocation({
                  latitude: lat,
                  longitude: lng,
                  location: null,
                });
              } catch (err) {
                console.warn('Failed to save GPS location:', err);
              }
            }

            const params: CategoryEventsParams = {
              latitude: lat,
              longitude: lng,
            };

            if (category) {
              params.category = category;
            }

            if (user?.id) {
              params.userId = user.id;
            }

            if (searchQuery.trim()) {
              params.searchQuery = searchQuery.trim();
            }

            await fetchCategoryEvents(params);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Search by manual location text
  const searchByManualLocation = async (locationText: string) => {
    try {
      const trimmedLocation = locationText.trim();
      
      // Save to user profile
      if (user?.id && trimmedLocation) {
        try {
          await updateUserLocation({
            location: trimmedLocation,
            latitude: null,
            longitude: null,
          });
        } catch (err) {
          console.warn('Failed to save manual location:', err);
        }
      }

      const params: CategoryEventsParams = {
        location: trimmedLocation,
      };

      if (category) {
        params.category = category;
      }

      if (user?.id) {
        params.userId = user.id;
      }

      if (searchQuery.trim()) {
        params.searchQuery = searchQuery.trim();
      }

      await fetchCategoryEvents(params);
    } catch (err) {
      throw err;
    }
  };

  // Clear location and fetch all events
  const clearLocationAndFetch = async () => {
    try {
      if (user?.id) {
        try {
          await updateUserLocation({
            location: null,
            latitude: null,
            longitude: null,
          });
        } catch (err) {
          console.warn('Failed to clear location:', err);
        }
      }

      // Fetch without location params
      await fetchCategoryEvents({ userId: user?.id });
    } catch (err) {
      throw err;
    }
  };

  // Clear search query
  const clearSearch = async () => {
    setSearchQuery('');
    // Don't refetch here - let the parent component decide
  };

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      fetchCategoryEvents();
    }
  }, [autoLoad]);
  return {
    eventsByCategory,
    categories,
    loading,
    error,
    locationSource,
    searchRadius,
    searchQuery,
    fetchCategoryEvents,
    getCurrentLocationAndFetch,
    searchByManualLocation,
    clearLocationAndFetch,
    searchByEventName,
    setSearchQuery,
    clearSearch,
  };
};