'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import {
  getNearbyEventsFromCurrentLocation,
  getNearbyEventsByLocation,
  formatDistance,
} from '@/services/ticketUserService';
import { NearbyEvent } from '@/types/ticket';
import { MapPin, Calendar, Users, Loader2, AlertCircle, Navigation, CheckCircle } from 'lucide-react';
import axios from 'axios';
export default function NearbyEventsPage() {
  useAuth(true);

  const [events, setEvents] = useState<NearbyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [radius, setRadius] = useState(30);
  const [searchType, setSearchType] = useState<'gps' | 'manual'>('gps');
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Reverse geocode coordinates to get address
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API;
      if (!apiKey) {
        console.warn('Google Maps API key not configured');
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        // Get the formatted address (usually the first result is most accurate)
        const result = response.data.results[0];
        
        // Try to get a concise address (city, state, country)
        const addressComponents = result.address_components;
        let city = '';
        let state = '';
        let country = '';

        addressComponents.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (component.types.includes('country')) {
            country = component.long_name;
          }
        });

        if (city && state) {
          return `${city}, ${state}, ${country}`;
        } else if (city) {
          return `${city}, ${country}`;
        }
        
        return result.formatted_address;
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Load nearby events using GPS
  const loadNearbyEventsGPS = async () => {
    try {
      setLoading(true);
      setFetchingLocation(true);
      setError(null);
      setSearchType('gps');
      
      const response = await getNearbyEventsFromCurrentLocation(radius);
      setEvents(response.data.events);
      
      // Store the location details
      const { latitude, longitude } = response.data.search_location;
      
      // Get address from coordinates
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      setCurrentLocation({
        latitude,
        longitude,
        address,
      });
      
      setFetchingLocation(false);
    } catch (err: any) {
      setFetchingLocation(false);
      if (err.code === 1) {
        setError('Location access denied. Please enable location services or search manually.');
      } else {
        setError(err.message || 'Failed to fetch nearby events');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load nearby events using location string
  const loadNearbyEventsByLocation = async () => {
    if (!searchLocation.trim()) {
      setError('Please enter a location');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchType('manual');
      setCurrentLocation(null); // Clear GPS location when searching manually
      
      const response = await getNearbyEventsByLocation(searchLocation, radius);
      setEvents(response.data.events);
      
      // Store the searched location details
      const { latitude, longitude } = response.data.search_location;
      setCurrentLocation({
        latitude,
        longitude,
        address: searchLocation,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadNearbyEventsByLocation();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          title="Find Nearby Events"
          subtitle="Discover events happening around you"
        />

        {/* Search Controls */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* GPS Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Use My Current Location
                </label>
                <button
                  onClick={loadNearbyEventsGPS}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  {loading && searchType === 'gps' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {fetchingLocation ? 'Getting Location...' : 'Finding Events...'}
                    </>
                  ) : (
                    <>
                      <Navigation className="w-5 h-5" />
                      Find Events Near Me
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Allow location access to find events nearby
                </p>
              </div>

              {/* Manual Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Or Search by Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter city, place, or address..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={loadNearbyEventsByLocation}
                    disabled={loading || !searchLocation.trim()}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading && searchType === 'manual' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Search'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Try: "Thrissur", "Mumbai", "Bangalore, Karnataka"
                </p>
              </div>
            </div>

            {/* Current Location Display */}
            {currentLocation && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">
                      {searchType === 'gps' ? 'Current Location Detected' : 'Searching Location'}
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      📍 {currentLocation.address}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Radius Slider */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Search Radius
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {radius} km
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results Count */}
        {events.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-700">
              Found <span className="font-bold text-blue-600">{events.length}</span> event
              {events.length !== 1 ? 's' : ''} within {radius} km
              {currentLocation && (
                <span className="text-gray-600"> of {currentLocation.address}</span>
              )}
            </p>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event._id} className="hover:shadow-xl transition-shadow overflow-hidden">
              {/* Event Image */}
              {event.event_banner && (
                <div className="relative h-48 w-full">
                  <img
                    src={event.event_banner}
                    alt={event.event_name}
                    className="w-full h-full object-cover"
                  />
                  {event.event_logo && (
                    <img
                      src={event.event_logo}
                      alt="Event logo"
                      className="absolute bottom-2 right-2 w-16 h-16 rounded-full border-4 border-white shadow-lg"
                    />
                  )}
                </div>
              )}

              <div className="p-5">
                {/* Event Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {event.event_name}
                </h3>

                {/* Distance & Sub-events Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {formatDistance(event.distance)}
                  </span>
                  
                  {event.has_nearby_sub_events && (
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                      +{event.nearby_sub_events_count} sub-event
                      {event.nearby_sub_events_count !== 1 ? 's' : ''}
                    </span>
                  )}

                  {event.payment_type === 'free' && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                      FREE
                    </span>
                  )}
                </div>

                {/* Category */}
                <p className="text-gray-600 text-sm mb-2 font-medium">
                  {event.event_category}
                </p>

                {/* Location */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {event.location || 'Online Event'}
                  </p>
                </div>

                {/* Date */}
                {event.event_dates?.[0] && (
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-500 text-sm">
                      {new Date(event.event_dates[0].start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* View Button */}
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2.5 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium">
                  View Details
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* No Events Found */}
        {!loading && events.length === 0 && !error && (
          <Card className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600 mb-6">
              Try increasing the search radius or searching a different location.
            </p>
            <button
              onClick={() => setRadius(Math.min(radius + 20, 100))}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Increase Radius
            </button>
          </Card>
        )}
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}