import { useNearbyEvents } from '@/hooks/useNearbyEvents';

export function NearbyEventsList() {
  const { events, loading, error, fetchFromCurrentLocation } = useNearbyEvents();

  return (
    <div>
      <button onClick={() => fetchFromCurrentLocation(50)}>
        Find Events Within 50km
      </button>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <ul>
        {events.map((event) => (
          <li key={event._id}>
            {event.event_name} - {event.distance} km away
          </li>
        ))}
      </ul>
    </div>
  );
}
