import axios from "axios";

const MEDIA_API_URL =
  process.env.NEXT_PUBLIC_MEDIA_API_URL || "http://localhost:5010/api";

const locationApi = axios.create({
  baseURL: MEDIA_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Add auth token to requests
locationApi.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

locationApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Location API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  },
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  category: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  city: string;
  country: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * GET /api/location/search?q=...
 * Autocomplete / search for places via the backend (proxied Google Places API).
 */
export const searchLocations = async (
  query: string,
  sessionToken?: string,
): Promise<PlaceSuggestion[]> => {
  const params: Record<string, string> = { q: query };
  if (sessionToken) params.session = sessionToken;

  const res = await locationApi.get<{
    success: boolean;
    data: PlaceSuggestion[];
  }>("/location/search", { params });

  return res.data.data ?? [];
};

/**
 * GET /api/location/details/:placeId
 * Fetch full details (lat/lng, city, country) for a selected place.
 */
export const getLocationDetails = async (
  placeId: string,
): Promise<PlaceDetails> => {
  const res = await locationApi.get<{
    success: boolean;
    data: PlaceDetails;
  }>(`/location/details/${placeId}`);

  return res.data.data;
};
/**
 * GET /api/location/reverse?lat=...&lng=...
 * Server-proxied reverse geocode — never exposes the Google API key to the browser.
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<{ label: string; city: string; country: string }> => {
  const res = await locationApi.get<{
    success: boolean;
    data: { label: string; city: string; country: string };
  }>("/location/reverse", { params: { lat, lng } });

  return res.data.data;
};
// ── Helpers

/** Map a place category string to an emoji icon for the UI. */
export const categoryIcon = (category?: string): string => {
  switch (category) {
    case "city":
      return "🏙️";
    case "landmark":
      return "🏛️";
    case "food":
      return "🍽️";
    case "shopping":
      return "🛍️";
    case "transit":
      return "✈️";
    case "nature":
      return "🌿";
    case "institution":
      return "🏫";
    case "business":
      return "🏢";
    default:
      return "📍";
  }
};

export default locationApi;
