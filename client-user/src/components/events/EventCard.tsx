'use client';
import { useState, useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { EventWithLocation } from '@/types/ticket';
import { getEventStats } from '@/services/transactionService';
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Tag,
  Globe,
  MapPinned,
  Video,
  Heart,
  TrendingUp
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface EventCardProps {
  event: EventWithLocation;
  showDistance?: boolean;
}

export function EventCard({ event, showDistance = false }: EventCardProps) {
  const router = useRouter();
  const [eventStats, setEventStats] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const handleCardClick = () => {
    router.push(`/events/${event._id}`);
  };
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  useEffect(() => {
  const fetchStats = async () => {
    try {
      const response = await getEventStats(event._id);
      if (response.success) {
        setEventStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  fetchStats();
}, [event._id]);

  // Get event start date
  const getEventStartDate = () => {
    if (event.event_dates && event.event_dates.length > 0) {
      return formatDate(event.event_dates[0].start_date);
    }
    return 'Date TBA';
  };

  // Get event start time
  const getEventStartTime = () => {
    if (event.event_dates && event.event_dates.length > 0 && event.event_dates[0].start_time) {
      return event.event_dates[0].start_time;
    }
    return null;
  };

  // Get location icon based on location type
  const getLocationIcon = () => {
    switch (event.location_type) {
      case 'online':
        return <Globe className="w-4 h-4" />;
      case 'recorded':
        return <Video className="w-4 h-4" />;
      case 'offline':
      default:
        return <MapPinned className="w-4 h-4" />;
    }
  };

  // Get location display text
  const getLocationText = () => {
    if (event.location_type === 'online') {
      return 'Online Event';
    }
    if (event.location_type === 'recorded') {
      return 'Recorded Event';
    }
    return event.location || event.venue || 'Location TBA';
  };

  // Get ticket price range
  const getPriceDisplay = () => {
    if (event.payment_type === 'free') {
      return 'FREE';
    }
    
    if (event.ticket_types && event.ticket_types.length > 0) {
      const prices = event.ticket_types.map(t => t.ticket_price).filter(p => p > 0);
      if (prices.length === 0) return 'FREE';
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return `₹${minPrice}`;
      }
      return `₹${minPrice} - ₹${maxPrice}`;
    }
    
    return 'Price TBA';
  };

  // Get total capacity
  const getCapacity = () => {
    if (event.total_capacity) {
      return event.total_capacity;
    }
    if (event.ticket_types && event.ticket_types.length > 0) {
      const total = event.ticket_types.reduce((sum, t) => sum + (t.max_capacity || 0), 0);
      return total > 0 ? total.toString() : null;
    }
    return null;
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Event Image */}
      <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
        {event.event_banner ? (
          <img
            src={event.event_banner}
            alt={event.event_name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Distance Badge */}
        {showDistance && event.distance !== null && event.distance !== undefined && (
          <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {event.distance} km
          </div>
        )}

        {/* Event Type Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
          {event.event_type === 'public' ? 'Public' : 'Private'}
        </div>
        {/* Sub-Event Badge */}
        {'isSubEvent' in event && event.isSubEvent && (
          <div className="absolute top-3 left-3 mt-8 bg-purple-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
            Sub Event
          </div>
        )}
        {/* Like Badge */}
        {eventStats && eventStats.likes > 0 && (
          <div className="absolute bottom-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Heart className="w-3 h-3 fill-current" />
            {eventStats.likes}
          </div>
        )}
      </div>
      {/* Event Details */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category */}
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-600">
            {event.event_category}
          </span>
        </div>

        {/* Event Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {event.event_name}
        </h3>
        {/* Show parent event name if it's a sub-event */}
        {'isSubEvent' in event && event.isSubEvent && event.parentEventName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <span>Part of:</span>
            <span className="font-medium text-purple-600">{event.parentEventName}</span>
          </p>
        )}
        {/* Event Description */}
        {event.event_description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {event.event_description}
          </p>
        )}

        {/* Event Info Grid */}
        <div className="space-y-2 mb-4 flex-1">
          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="truncate">
              {getEventStartDate()}
              {event.event_date_type === 'multi-day' && event.event_dates.length > 1 && (
                <span className="text-xs text-gray-500 ml-1">
                  ({event.event_dates.length} days)
                </span>
              )}
            </span>
          </div>

          {/* Time */}
          {getEventStartTime() && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="truncate">{getEventStartTime()}</span>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {getLocationIcon()}
            <span className="truncate">{getLocationText()}</span>
          </div>

          {/* Capacity */}
          {getCapacity() && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span>Capacity: {getCapacity()}</span>
            </div>
          )}

          {/* Sub Events Count */}
          {event.sub_events && event.sub_events.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>{event.sub_events.length} Sub events</span>
            </div>
          )}      
          {/* NEW: Show parent event name if it's a sub-event */}
          {event.isSubEvent && event.parentEventName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
              <span>Part of:</span>
              <span className="font-medium text-purple-600">{event.parentEventName}</span>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          {/* Price */}
          <div className="flex items-center gap-1">
            <span className={`text-lg font-bold ${
              event.payment_type === 'free' ? 'text-green-600' : 'text-gray-900'
            }`}>
              {getPriceDisplay()}
            </span>
          </div>

          {/* View Details Button */}
          <button
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            View Details
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Event Tags/Languages */}
        {event.event_language && event.event_language.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {event.event_language.slice(0, 3).map((lang, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {lang}
              </span>
            ))}
            {event.event_language.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                +{event.event_language.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Event Features */}
        <div className="flex gap-2 mt-2">
          {event.kids_friendly && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              👶 Kids Friendly
            </span>
          )}
          {event.pet_friendly && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              🐾 Pet Friendly
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}