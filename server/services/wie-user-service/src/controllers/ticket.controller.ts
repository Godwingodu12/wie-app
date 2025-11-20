import { Request, Response } from 'express';
import WIEUSER from '../models/wieuser.model';
import COUNTRY from '../models/country.model';
import axios from 'axios';
import {
  getAllLiveEvents,
  getAllGroups,
  getTicketById,
  getGroupById,
} from '../rabbit/ticketServiceClient';
import { getUserProfile } from '../services/wie-user.service';
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
export const getCategoryBasedEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { 
      category, 
      latitude, 
      longitude, 
      location, 
      userId 
    } = req.query;

    let userLat: number | null = null;
    let userLng: number | null = null;
    let userLocation: string | null = null;
    let userCountryCode: string | null = null;
    let userCountryName: string | null = null;
    let locationSource: 'gps' | 'manual' | 'saved' | 'country' | 'none' = 'none';
    const searchRadius = parseFloat(process.env.DEFAULT_SEARCH_RADIUS_KM || '100');

    // Get user profile if userId provided
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId as string);
        if (userProfile) {
          userCountryCode = userProfile.country_code;
          userCountryName = userProfile.country_name;
          
          // Get saved location from user profile
          if (userProfile.latitude && userProfile.longitude) {
            userLat = userProfile.latitude;
            userLng = userProfile.longitude;
            locationSource = 'saved';
          } else if (userProfile.location) {
            userLocation = userProfile.location;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
      }
    }

    // Priority 1: GPS coordinates from query (overrides saved location)
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (isValidCoordinate(lat, lng)) {
        userLat = lat;
        userLng = lng;
        locationSource = 'gps';
        userLocation = null;
        
        // Save GPS location to user
        if (userId) {
          try {
            await WIEUSER.updateLocation(userId as string, {
              latitude: userLat,
              longitude: userLng,
              location: null,
            });
          } catch (err) {
            console.warn('Failed to save GPS location:', err);
          }
        }
      }
    }

    // Priority 2: Manual location string from query
    if (!userLat && !userLng && location && typeof location === 'string' && location.trim()) {
      userLocation = location.trim();
      locationSource = 'manual';
      
      // Try to geocode the location
      try {
        const coordinates = await geocodeLocation(userLocation);
        if (coordinates) {
          userLat = coordinates.lat;
          userLng = coordinates.lng;
          
          // Save location to user
          if (userId) {
            try {
              await WIEUSER.updateLocation(userId as string, {
                latitude: userLat,
                longitude: userLng,
                location: userLocation,
              });
            } catch (err) {
              console.warn('Failed to save manual location:', err);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to geocode location:', err);
      }
    }

    // Fetch all live events
    const result = await getAllLiveEvents();
    let events: any[] = Array.isArray(result) ? result : (result?.tickets || []);

    // ALWAYS filter by country first if user has country
    if (userCountryName) {
      const countryLower = userCountryName.toLowerCase();
      
      events = events.filter((event: any) => {
        // Check main event address for country
        const mainAddress = event.exact_map_location?.address?.toLowerCase() || '';
        
        if (mainAddress.includes(countryLower)) {
          return true;
        }

        // Check sub-events
        if (event.sub_events && Array.isArray(event.sub_events)) {
          return event.sub_events.some((subEvent: any) => {
            const subAddress = subEvent.exact_map_location?.address?.toLowerCase() || '';
            return subAddress.includes(countryLower);
          });
        }

        return false;
      });
    }

    // Filter by category if provided
    if (category && typeof category === 'string' && category.trim()) {
      const categoryLower = category.trim().toLowerCase();
      events = events.filter((event: any) => 
        event.event_category?.toLowerCase() === categoryLower
      );
    }

    // If no events found in user's country
    if (events.length === 0) {
      res.status(200).json({
        success: true,
        message: userCountryName 
          ? `No events found in ${userCountryName}${category ? ` for category "${category}"` : ''}`
          : 'No events found',
        data: {
          locationAvailable: false,
          locationSource: userCountryName ? 'country' : 'none',
          searchLocation: userCountryName || null,
          categories: [],
          eventsByCategory: {},
          totalEvents: 0,
          countryCode: userCountryCode,
          countryName: userCountryName,
        },
      });
      return;
    }

    // Case 1: User has coordinates - Use distance-based sorting (within same country)
    if (userLat && userLng) {
      const eventsWithDistance = events.map((event: any) => {
        try {
          let closestDistance: number | null = null;
          let mainEventDistance: number | null = null;
          let nearbySubEvents: any[] = [];

          // Check main event location
          const mainLat = event.exact_map_location?.latitude;
          const mainLng = event.exact_map_location?.longitude;
          
          if (mainLat && mainLng && isValidCoordinate(mainLat, mainLng)) {
            mainEventDistance = calculateDistance(userLat, userLng, mainLat, mainLng);
            closestDistance = mainEventDistance;
          }

          // Check sub-events
          if (event.sub_events && Array.isArray(event.sub_events)) {
            event.sub_events.forEach((subEvent: any) => {
              const subLat = subEvent.exact_map_location?.latitude;
              const subLng = subEvent.exact_map_location?.longitude;
              
              if (subLat && subLng && isValidCoordinate(subLat, subLng)) {
                const subDistance = calculateDistance(userLat, userLng, subLat, subLng);
                
                if (closestDistance === null || subDistance < closestDistance) {
                  closestDistance = subDistance;
                }
                
                nearbySubEvents.push({
                  ...subEvent,
                  distance: Math.round(subDistance * 100) / 100,
                });
              }
            });
          }

          return {
            ...event,
            distance: closestDistance !== null ? Math.round(closestDistance * 100) / 100 : null,
            distance_unit: 'km',
            main_event_distance: mainEventDistance !== null ? Math.round(mainEventDistance * 100) / 100 : null,
            nearby_sub_events: nearbySubEvents.sort((a: any, b: any) => a.distance - b.distance),
          };
        } catch (error) {
          console.error('Error processing event:', event._id, error);
          return {
            ...event,
            distance: null,
            distance_unit: 'km',
          };
        }
      });

      // Sort all events by distance (no radius limit, just sort)
      const sortedEvents = eventsWithDistance
        .filter((event: any) => event.distance !== null)
        .sort((a: any, b: any) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

      // If no events have valid coordinates, return all events unsorted
      const finalEvents = sortedEvents.length > 0 ? sortedEvents : eventsWithDistance;

      const eventsByCategory = finalEvents.reduce((acc: any, event: any) => {
        const cat = event.event_category || 'Uncategorized';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(event);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        message: category 
          ? `Events for category "${category}" in ${userCountryName || 'your country'} fetched successfully`
          : `Events in ${userCountryName || 'your country'} fetched successfully`,
        data: {
          locationAvailable: true,
          locationSource,
          searchLocation: {
            latitude: userLat,
            longitude: userLng,
          },
          searchRadius,
          categories: Object.keys(eventsByCategory).sort(),
          eventsByCategory,
          totalEvents: finalEvents.length,
          eventsWithLocation: sortedEvents.length,
          totalEventsBeforeFilter: events.length,
          countryCode: userCountryCode,
          countryName: userCountryName,
        },
      });
      return;
    }

    // Case 2: User has location text but no coordinates - Filter by location text (within same country)
    if (userLocation) {
      const locationLower = userLocation.toLowerCase();
      
      const filteredEvents = events.filter((event: any) => {
        // Check main event address
        const mainAddress = event.exact_map_location?.address?.toLowerCase() || '';
        const mainLocation = event.location?.toLowerCase() || '';
        const mainVenue = event.venue?.toLowerCase() || '';
        
        if (mainAddress.includes(locationLower) || 
            mainLocation.includes(locationLower) || 
            mainVenue.includes(locationLower)) {
          return true;
        }

        // Check sub-events
        if (event.sub_events && Array.isArray(event.sub_events)) {
          return event.sub_events.some((subEvent: any) => {
            const subAddress = subEvent.exact_map_location?.address?.toLowerCase() || '';
            const subLocation = subEvent.location?.toLowerCase() || '';
            const subVenue = subEvent.venue?.toLowerCase() || '';
            
            return subAddress.includes(locationLower) || 
                   subLocation.includes(locationLower) || 
                   subVenue.includes(locationLower);
          });
        }

        return false;
      });

      const eventsByCategory = filteredEvents.reduce((acc: any, event: any) => {
        const cat = event.event_category || 'Uncategorized';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(event);
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        message: category 
          ? `Events for category "${category}" in "${userLocation}", ${userCountryName} fetched successfully`
          : `Events in "${userLocation}", ${userCountryName} fetched successfully`,
        data: {
          locationAvailable: true,
          locationSource: 'manual',
          searchLocation: userLocation,
          categories: Object.keys(eventsByCategory).sort(),
          eventsByCategory,
          totalEvents: filteredEvents.length,
          totalEventsBeforeFilter: events.length,
          countryCode: userCountryCode,
          countryName: userCountryName,
        },
      });
      return;
    }

    // Case 3: Only country filter (no specific location)
    const eventsByCategory = events.reduce((acc: any, event: any) => {
      const cat = event.event_category || 'Uncategorized';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(event);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: category 
        ? `Events for category "${category}" in ${userCountryName || 'your country'} fetched successfully`
        : `Events in ${userCountryName || 'your country'} fetched successfully`,
      data: {
        locationAvailable: false,
        locationSource: 'country',
        searchLocation: userCountryName,
        categories: Object.keys(eventsByCategory).sort(),
        eventsByCategory,
        totalEvents: events.length,
        countryCode: userCountryCode,
        countryName: userCountryName,
      },
    });
  } catch (error: any) {
    console.error('Error in getCategoryBasedEvents controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category-based events',
      error: error.message,
    });
  }
};
