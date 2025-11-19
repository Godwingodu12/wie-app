'use client';

import { useState, useEffect } from 'react';
import {
  getNearbyEventsFromCurrentLocation,
  getNearbyEventsByLocation,
  formatDistance,
} from '@/services/ticketUserService';

export default function NearbyEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [radius, setRadius] = useState(30);

  // Load nearby events using GPS
  const loadNearbyEventsGPS = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getNearbyEventsFromCurrentLocation(radius);
      setEvents(response.data.events);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby events');
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
      const response = await getNearbyEventsByLocation(searchLocation, radius);
      setEvents(response.data.events);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch nearby events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Nearby Events</h1>

      {/* Search Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* GPS Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Use My Location
            </label>
            <button
              onClick={loadNearbyEventsGPS}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Find Events Near Me'}
            </button>
          </div>

          {/* Manual Location */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Or Enter Location
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="Enter city or place..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={loadNearbyEventsByLocation}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Search Radius: {radius} km
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Events List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
            {/* Event Image */}
            {event.event_banner && (
              <img
                src={event.event_banner}
                alt={event.event_name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
            )}

            <div className="p-4">
              {/* Event Name */}
              <h3 className="text-xl font-semibold mb-2">{event.event_name}</h3>

              {/* Distance Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  📍 {formatDistance(event.distance)}
                </span>
                {event.has_nearby_sub_events && (
                  <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    +{event.nearby_sub_events_count} sub-events
                  </span>
                )}
              </div>

              {/* Category */}
              <p className="text-gray-600 text-sm mb-2">{event.event_category}</p>

              {/* Location */}
              <p className="text-gray-500 text-sm mb-3">
                📍 {event.location || 'Online Event'}
              </p>

              {/* View Button */}
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* No Events */}
      {!loading && events.length === 0 && !error && (
        <div className="text-center text-gray-500 py-12">
          No events found nearby. Try increasing the search radius.
        </div>
      )}
    </div>
  );
}