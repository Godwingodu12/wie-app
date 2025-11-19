import api from './ticketAxios';
import {
  NearbyEventsParams,
  NearbyEventsResponse,
  LiveEventsResponse,
  SingleEventResponse,
  ActiveGroupsResponse,
  Coordinates,
  TicketApiResponse,
  EventDetailResponse
} from '@/types/ticket';
export const getLiveEvents = async (): Promise<LiveEventsResponse> => {
  try {
    const res = await api.get('/tickets/live-events');
    return res.data;
  } catch (err) {
    console.error('❌ getLiveEvents error:', err);
    throw err;
  }
};
export const getActiveGroups = async (): Promise<ActiveGroupsResponse> => {
  try {
    const res = await api.get('/tickets/active-groups');
    return res.data;
  } catch (err) {
    console.error('❌ getActiveGroups error:', err);
    throw err;
  }
};
export const getEventById = async (ticketId: string): Promise<EventDetailResponse> => {
  try {
    const res = await api.get(`/tickets/event/${ticketId}`);
    return res.data;
  } catch (err) {
    console.error('❌ getEventById error:', err);
    throw err;
  }
};
export const getGroupById = async (groupId: string): Promise<SingleEventResponse> => {
  try {
    const res = await api.get(`/tickets/group/${groupId}`);
    return res.data;
  } catch (err) {
    console.error('❌ getGroupById error:', err);
    throw err;
  }
};
export const getNearbyEvents = async (
  params: NearbyEventsParams
): Promise<NearbyEventsResponse> => {
  try {
    // Validate input
    if (!params.latitude && !params.longitude && !params.location) {
      throw new Error('Either (latitude and longitude) or (location) must be provided');
    }
    const queryParams = new URLSearchParams();
    if (params.latitude && params.longitude) {
      queryParams.append('latitude', params.latitude.toString());
      queryParams.append('longitude', params.longitude.toString());
    } else if (params.location) {
      queryParams.append('location', params.location);
    }

    if (params.radius) {
      queryParams.append('radius', params.radius.toString());
    }

    const res = await api.get(`/tickets/nearby-events?${queryParams.toString()}`);
    return res.data;
  } catch (err) {
    console.error('❌ getNearbyEvents error:', err);
    throw err;
  }
};
export const getNearbyEventsByGPS = async (
  latitude: number,
  longitude: number,
  radius: number = 30
): Promise<NearbyEventsResponse> => {
  return getNearbyEvents({ latitude, longitude, radius });
};
export const getNearbyEventsByLocation = async (
  location: string,
  radius: number = 30
): Promise<NearbyEventsResponse> => {
  return getNearbyEvents({ location, radius });
};
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};
export const getNearbyEventsFromCurrentLocation = async (
  radius: number = 30
): Promise<NearbyEventsResponse> => {
  try {
    const location = await getCurrentLocation();
    return getNearbyEventsByGPS(location.latitude, location.longitude, radius);
  } catch (err) {
    console.error('❌ Failed to get current location:', err);
    throw err;
  }
};
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; 
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};
export const sortEventsByDistance = (events: any[]): any[] => {
  return [...events].sort((a, b) => (a.distance || 0) - (b.distance || 0));
};
export const filterEventsByDistance = (events: any[], maxDistance: number): any[] => {
  return events.filter((event) => event.distance && event.distance <= maxDistance);
};
