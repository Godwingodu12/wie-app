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

  const fetchCategoryEvents = async (params: CategoryEventsParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      if (user?.id) {
        params.userId = user.id;
      }

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
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Save GPS coordinates and clear manual location
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

  const searchByManualLocation = async (locationText: string) => {
    try {
      // Save manual location and clear coordinates
      if (user?.id && locationText.trim()) {
        try {
          await updateUserLocation({
            location: locationText.trim(),
            latitude: null,
            longitude: null,
          });
        } catch (err) {
          console.warn('Failed to save manual location:', err);
        }
      }

      const params: CategoryEventsParams = {
        location: locationText,
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

  const clearLocationAndFetch = async () => {
    try {
      // Clear all location data
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

      await fetchCategoryEvents({ userId: user?.id });
    } catch (err) {
      throw err;
    }
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
    searchByManualLocation,
    clearLocationAndFetch,
  };
};
