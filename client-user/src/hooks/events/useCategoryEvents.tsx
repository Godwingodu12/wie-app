import { useState, useEffect } from 'react';
import { getCategoryBasedEvents } from '@/services/ticketUserService';
import { CategoryEventsParams, EventWithLocation } from '@/types/ticket';
import { useAuth } from '@/hooks/useAuth';

export const useCategoryEvents = (category?: string, autoLoad: boolean = false) => {
  const { user } = useAuth();
  const [eventsByCategory, setEventsByCategory] = useState<Record<string, EventWithLocation[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(100);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'saved' | 'country' | 'none'>('none');
  const fetchCategoryEvents = async (params: CategoryEventsParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      // Add userId to params
      if (user?.id) {
        params.userId = user.id;
      }

      // Add country code if available and no location
      if (!params.latitude && !params.longitude && !params.location && user?.country_code) {
        params.countryCode = user.country_code;
      }
      // Add category to params
      if (category) {
        params.category = category;
      }

      const response = await getCategoryBasedEvents(params);
      setEventsByCategory(response.data.eventsByCategory);
      setCategories(response.data.categories);
      setLocationSource(response.data.locationSource);
      setSearchRadius(response.data.searchRadius || 100);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch category events');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationAndFetch = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const params: CategoryEventsParams = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            if (category) {
              params.category = category;
            }

            if (user?.id) {
              params.userId = user.id;
            }

            await fetchCategoryEvents(params);
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        (err) => reject(new Error(err.message))
      );
    });
  };

  useEffect(() => {
    if (autoLoad) {
      fetchCategoryEvents();
    }
  }, [autoLoad, category]);

  return {
    eventsByCategory,
    categories,
    loading,
    error,
    locationSource,
    searchRadius,
    fetchCategoryEvents,
    getCurrentLocationAndFetch,
  };
};