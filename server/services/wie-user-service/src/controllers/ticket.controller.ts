import { Request, Response } from 'express';
import axios from 'axios';
import {
  getAllLiveEvents,
  getAllGroups,
  getTicketById,
  getGroupById,
} from '../rabbit/ticketServiceClient';
export const getLiveEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {    
    const result = await getAllLiveEvents();

    res.status(200).json({
      success: true,
      message: 'Live events fetched successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error in getLiveEvents controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live events',
      error: error.message,
    });
  }
};
export const getActiveGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {    
    const result = await getAllGroups();
    res.status(200).json({
      success: true,
      message: 'Active groups fetched successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error in getActiveGroups controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active groups',
      error: error.message,
    });
  }
};
export const getGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({
        success: false,
        message: 'Group ID is required',
      });
      return;
    }    
    const group = await getGroupById(groupId);

    res.status(200).json({
      success: true,
      message: 'Group fetched successfully',
      data: group,
    });
  } catch (error: any) {
    console.error('Error in getGroup controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group',
      error: error.message,
    });
  }
};
// Haversine formula to calculate distance between two coordinates in kilometers
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Geocode location string to coordinates using Google Maps API
const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const apiKey = process.env.GOOGLE_MAP_API;
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: location,
          key: apiKey,
        },
      }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
};

// Validate coordinate values
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const getNearbyEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { latitude, longitude, location, radius = 30 } = req.query;

    let userLat: number;
    let userLng: number;

    // Validate and parse radius (default 30km, max 100km)
    const searchRadius = Math.min(Math.max(parseFloat(radius as string) || 30, 1), 100);

    // Case 1: User provides GPS coordinates
    if (latitude && longitude) {
      userLat = parseFloat(latitude as string);
      userLng = parseFloat(longitude as string);

      if (!isValidCoordinate(userLat, userLng)) {
        res.status(400).json({
          success: false,
          message: 'Invalid latitude or longitude values. Latitude must be between -90 and 90, longitude between -180 and 180',
        });
        return;
      }
    }
    // Case 2: User provides location string
    else if (location && typeof location === 'string' && location.trim()) {
      const coordinates = await geocodeLocation(location.trim());
      
      if (!coordinates) {
        res.status(400).json({
          success: false,
          message: 'Unable to geocode the provided location. Please check the location and try again',
        });
        return;
      }

      userLat = coordinates.lat;
      userLng = coordinates.lng;
    }
    // Case 3: No valid input
    else {
      res.status(400).json({
        success: false,
        message: 'Either (latitude and longitude) or (location) must be provided',
      });
      return;
    }

    // Fetch all live events
    const result = await getAllLiveEvents();
    
    // Handle different response structures
    let events: any[] = [];
    
    if (Array.isArray(result)) {
      events = result;
    } else if (result && typeof result === 'object') {
      // Try different possible structures
      events = result?.tickets || [];
    }
    if (!events || events.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No events found',
        data: {
          count: 0,
          search_location: {
            latitude: userLat,
            longitude: userLng,
            radius: searchRadius,
            radius_unit: 'km',
          },
          events: [],
        },
      });
      return;
    }

    // Process events with main events and sub-events
    const nearbyEventsWithDistance = events
      .map((event: any) => {
        try {
          // Check main event location
          const mainEventLat = event.exact_map_location?.latitude;
          const mainEventLng = event.exact_map_location?.longitude;
          
          let mainEventDistance: number | null = null;
          let isMainEventNearby = false;
          
          // Calculate distance for main event if coordinates exist
          if (mainEventLat && mainEventLng && isValidCoordinate(mainEventLat, mainEventLng)) {
            mainEventDistance = calculateDistance(userLat, userLng, mainEventLat, mainEventLng);
            isMainEventNearby = mainEventDistance <= searchRadius;
          }
          
          // Process sub-events
          let nearbySubEvents: any[] = [];
          let allSubEventsProcessed: any[] = [];
          
          if (event.sub_events && Array.isArray(event.sub_events) && event.sub_events.length > 0) {            
            event.sub_events.forEach((subEvent: any) => {
              try {
                const subEventLat = subEvent.exact_map_location?.latitude;
                const subEventLng = subEvent.exact_map_location?.longitude;
                
                if (subEventLat && subEventLng && isValidCoordinate(subEventLat, subEventLng)) {
                  const subEventDistance = calculateDistance(
                    userLat,
                    userLng,
                    subEventLat,
                    subEventLng
                  );
                  
                  const processedSubEvent = {
                    ...subEvent,
                    distance: Math.round(subEventDistance * 100) / 100,
                    distance_unit: 'km',
                    is_nearby: subEventDistance <= searchRadius,
                  };
                  
                  allSubEventsProcessed.push(processedSubEvent);
                  
                  // Add to nearby list if within radius
                  if (subEventDistance <= searchRadius) {
                    nearbySubEvents.push(processedSubEvent);
                  }
                } else {
                  // Sub-event without valid coordinates
                  allSubEventsProcessed.push({
                    ...subEvent,
                    distance: null,
                    distance_unit: 'km',
                    is_nearby: false,
                    location_note: 'No valid coordinates',
                  });
                }
              } catch (subEventError) {
                console.error('Error processing sub-event:', subEventError);
              }
            });
            
            // Sort nearby sub-events by distance
            nearbySubEvents.sort((a: any, b: any) => a.distance - b.distance);
          }
          
          // Include event if main event OR any sub-event is nearby
          const hasNearbySubEvents = nearbySubEvents.length > 0;
          
          if (isMainEventNearby || hasNearbySubEvents) {
            // Determine the closest distance
            let closestDistance: number;
            
            if (isMainEventNearby && hasNearbySubEvents) {
              // Both main and sub-events nearby - use closest
              closestDistance = Math.min(mainEventDistance!, nearbySubEvents[0].distance);
            } else if (isMainEventNearby) {
              // Only main event nearby
              closestDistance = mainEventDistance!;
            } else {
              // Only sub-events nearby
              closestDistance = nearbySubEvents[0].distance;
            }
            
            return {
              ...event,
              distance: Math.round(closestDistance * 100) / 100,
              distance_unit: 'km',
              main_event_distance: mainEventDistance 
                ? Math.round(mainEventDistance * 100) / 100 
                : null,
              is_main_event_nearby: isMainEventNearby,
              has_nearby_sub_events: hasNearbySubEvents,
              nearby_sub_events_count: nearbySubEvents.length,
              nearby_sub_events: nearbySubEvents,
              total_sub_events: event.sub_events?.length || 0,
              // Optional: Keep all sub-events with distance info
              all_sub_events_with_distance: allSubEventsProcessed,
            };
          }
          
          return null;
        } catch (eventError) {
          console.error('Error processing event:', event._id, eventError);
          return null;
        }
      })
      .filter((event: any) => event !== null)
      .sort((a: any, b: any) => a.distance - b.distance);
    res.status(200).json({
      success: true,
      message: 'Nearby events fetched successfully',
      data: {
        count: nearbyEventsWithDistance.length,
        search_location: {
          latitude: userLat,
          longitude: userLng,
          radius: searchRadius,
          radius_unit: 'km',
        },
        events: nearbyEventsWithDistance,
      },
    });
  } catch (error: any) {
    console.error('Error in getNearbyEvents controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby events',
      error: error.message,
    });
  }
};
export const getTicket = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
      });
      return;
    }

    let isSubEvent = false;
    let parentEvent = null;
    let eventData: any = null;

    // Fetch all live events first
    const allTickets = await getAllLiveEvents();
    const events = Array.isArray(allTickets) ? allTickets : (allTickets?.tickets || []);

    // Search through all events
    for (const event of events) {
      // Check if this is the main event
      if (event._id?.toString() === ticketId) {
        eventData = event;
        isSubEvent = false;
        break;
      }

      // Check sub-events
      if (event.sub_events && Array.isArray(event.sub_events)) {
        const foundSubEvent = event.sub_events.find((sub: any) => 
          sub._id?.toString() === ticketId
        );
        
        if (foundSubEvent) {
          isSubEvent = true;
          eventData = foundSubEvent;
          parentEvent = {
            _id: event._id,
            event_name: event.event_name,
            event_category: event.event_category,
            event_banner: event.event_banner,
            event_logo: event.event_logo,
            location: event.location,
            event_dates: event.event_dates,
          };
          break;
        }
      }
    }

    // If not found in events array, try to fetch directly from ticket service
    if (!eventData) {
      try {
        const ticket = await getTicketById(ticketId);
        eventData = ticket;
      } catch (ticketError) {
        console.error('❌ Ticket not found in main events or ticket service:', ticketError);
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Ticket fetched successfully',
      data: {
        event: eventData,
        isSubEvent,
        parentEvent,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in getTicket controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message,
    });
  }
};
