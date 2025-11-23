import { useState } from 'react';
import { 
  getInitialEvents, 
  searchEventsByName, 
  searchEventsByLocation, 
  getCategoryBasedEvents 
} from '@/services/ticketUserService';
import { 
  EventWithLocation, 
  LocationSearchParams, 
  NameSearchParams,
  CategorySearchParams
} from '@/types/ticket';
import { useAuth } from '@/hooks/useAuth';

export const useEventSearch = () => {
  const { user } = useAuth();
  
  // Main results
  const [eventsByCategory, setEventsByCategory] = useState<Record<string, EventWithLocation[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  
  // Suggestions (shown when no main results)
  const [suggestionsByCategory, setSuggestionsByCategory] = useState<Record<string, EventWithLocation[]>>({});
  const [suggestionCategories, setSuggestionCategories] = useState<string[]>([]);
  const [hasSuggestions, setHasSuggestions] = useState(false);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'manual' | 'saved' | 'country' | 'none'>('none');
  const [searchRadius, setSearchRadius] = useState<number | null>(null);
  const [currentSearchType, setCurrentSearchType] = useState<'initial' | 'name' | 'location' | 'category'>('initial');
  const [searchedLocationName, setSearchedLocationName] = useState<string | null>(null);

  // Clear suggestions
  const clearSuggestions = () => {
    setSuggestionsByCategory({});
    setSuggestionCategories([]);
    setHasSuggestions(false);
    setTotalSuggestions(0);
  };

  // 1. Fetch initial events (page load)
  const fetchInitialEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSearchType('initial');
      clearSuggestions();

      const response = await getInitialEvents(user?.id);
      
      setEventsByCategory(response.data.eventsByCategory);
      setCategories(response.data.categories);
      setTotalEvents(response.data.totalEvents);
      setLocationSource(response.data.locationSource);
      setSearchRadius(response.data.searchRadius || null);
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Search by event name (no location filtering)
  const searchByName = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSearchType('name');
      clearSuggestions();

      const params: NameSearchParams = {
        searchQuery,
        userId: user?.id,
      };

      const response = await searchEventsByName(params);
      
      setEventsByCategory(response.data.eventsByCategory);
      setCategories(response.data.categories);
      setTotalEvents(response.data.totalEvents);
      setLocationSource('none');
      setSearchRadius(null);
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to search events');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 3. Search by location (with suggestions if no results)
  const searchByLocation = async (params: Omit<LocationSearchParams, 'userId'>) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSearchType('location');
      clearSuggestions();

      // Store the searched location name
      setSearchedLocationName(params.location || null);

      const searchParams: LocationSearchParams = {
        ...params,
        userId: user?.id,
      };
      const response = await searchEventsByLocation(searchParams);
      setEventsByCategory(response.data.eventsByCategory);
      setCategories(response.data.categories);
      setTotalEvents(response.data.totalEvents);
      setLocationSource(response.data.locationSource);
      setSearchRadius(response.data.searchRadius);
      if (response.data.hasSuggestions) {
        setSuggestionsByCategory(response.data.suggestionsByCategory);
        setSuggestionCategories(response.data.suggestionCategories);
        setHasSuggestions(true);
        setTotalSuggestions(response.data.totalSuggestions);
      }
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to search by location');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // 4. Search by category (with suggestions if no results)
  const searchByCategory = async (category: string) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentSearchType('category');
      clearSuggestions();

      const params: CategorySearchParams = {
        category,
        userId: user?.id,
      };

      const response = await getCategoryBasedEvents(params);
      
      setEventsByCategory(response.data.eventsByCategory);
      setCategories(response.data.categories);
      setTotalEvents(response.data.totalEvents);
      setLocationSource(response.data.locationSource);
      setSearchRadius(response.data.searchRadius || null);
      
      // Handle suggestions (same category only)
      if (response.data.hasSuggestions) {
        setSuggestionsByCategory(response.data.suggestionsByCategory || {});
        setSuggestionCategories(response.data.suggestionCategories || []);
        setHasSuggestions(true);
        setTotalSuggestions(response.data.totalSuggestions || 0);
      }
      
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch category events');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get current location and search
  const searchByCurrentLocation = async () => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await searchByLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
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

  // Clear all and reset to initial
  const clearAndReset = async () => {
    clearSuggestions();
    setError(null);
    await fetchInitialEvents();
  };

  return {
    // Main results
    eventsByCategory,
    categories,
    totalEvents,
    
    // Suggestions
    suggestionsByCategory,
    suggestionCategories,
    hasSuggestions,
    totalSuggestions,
    // State
    loading,
    error,
    locationSource,
    searchRadius,
    currentSearchType,
    searchedLocationName,
    // Actions
    fetchInitialEvents,
    searchByName,
    searchByLocation,
    searchByCategory,
    searchByCurrentLocation,
    clearAndReset,
  };
};