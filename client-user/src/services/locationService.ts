import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_MEDIA_API_URL ?? 'http://localhost:5010/api';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : '';

const headers = () => ({ Authorization: `Bearer ${getToken()}` });

export interface PlaceSuggestion {
  placeId:  string;
  name:     string;
  address:  string;
  category: string;
}

export interface PlaceDetails {
  placeId:  string;
  name:     string;
  address:  string;
  lat:      number;
  lng:      number;
  category: string;
  city:     string;
  country:  string;
}

// Unique session token per search session (improves billing)
let _sessionToken: string | null = null;
const getSession = () => {
  if (!_sessionToken) _sessionToken = crypto.randomUUID();
  return _sessionToken;
};
const resetSession = () => { _sessionToken = null; };

export const searchLocations = async (query: string): Promise<PlaceSuggestion[]> => {
  const { data } = await axios.get(`${BASE}/location/search`, {
    params:  { q: query, session: getSession() },
    headers: headers(),
  });
  return data.data ?? [];
};

export const getLocationDetails = async (placeId: string): Promise<PlaceDetails> => {
  const { data } = await axios.get(`${BASE}/location/details/${placeId}`, {
    headers: headers(),
  });
  resetSession(); // New session after a place is selected (Google billing best practice)
  return data.data;
};

// Category → emoji map for the sticker
export const categoryIcon = (category: string): string => {
  const map: Record<string, string> = {
    city:        '🏙️',
    landmark:    '🗺️',
    food:        '🍽️',
    shopping:    '🛍️',
    transit:     '✈️',
    nature:      '🌿',
    institution: '🏛️',
    business:    '📍',
    place:       '📍',
  };
  return map[category] ?? '📍';
};