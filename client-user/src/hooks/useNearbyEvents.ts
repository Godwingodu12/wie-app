import { useState, useEffect } from 'react';
import {
  getNearbyEvents,
  getNearbyEventsFromCurrentLocation,
} from '@/services/ticketUserService';
import { NearbyEventsParams } from '@/types/ticket';
export const useNearbyEvents = (autoLoad: boolean = false) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<any>(null);
  const fetchNearbyEvents = async (params: NearbyEventsParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNearbyEvents(params);
      setEvents(response.data.events);
      setSearchLocation(response.data.search_location);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby events');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  const fetchFromCurrentLocation = async (radius: number = 30) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNearbyEventsFromCurrentLocation(radius);
      setEvents(response.data.events);
      setSearchLocation(response.data.search_location);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby events');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      fetchFromCurrentLocation();
    }
  }, [autoLoad]);

  return {
    events,
    loading,
    error,
    searchLocation,
    fetchNearbyEvents,
    fetchFromCurrentLocation,
  };
};