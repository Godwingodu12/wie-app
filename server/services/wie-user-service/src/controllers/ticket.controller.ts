import { Request, Response } from "express";
import WIEUSER from "../models/wieuser.model";
import COUNTRY from "../models/country.model";
import axios from "axios";
import {
  getAllLiveEvents,
  getAllGroups,
  getTicketById,
  getGroupById,
  getCancelledEvents,
  getRehostedEvents,
} from "../grpc/ticketClient";
import { getUserProfile } from "../services/wie-user.service";
const DEFAULT_SEARCH_RADIUS_KM = 200;
const MAX_SUGGESTION_RADIUS_KM = 200;
export const getLiveEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await getAllLiveEvents();

    res.status(200).json({
      success: true,
      message: "Live events fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in getLiveEvents controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch live events",
      error: error.message,
    });
  }
};
export const getActiveGroups = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await getAllGroups();
    res.status(200).json({
      success: true,
      message: "Active groups fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Error in getActiveGroups controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active groups",
      error: error.message,
    });
  }
};
export const getGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
      return;
    }
    const group = await getGroupById(groupId);

    res.status(200).json({
      success: true,
      message: "Group fetched successfully",
      data: group,
    });
  } catch (error: any) {
    console.error("Error in getGroup controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch group",
      error: error.message,
    });
  }
};
// Haversine formula to calculate distance between two coordinates in kilometers
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
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
const geocodeLocation = async (
  location: string,
): Promise<{ lat: number; lng: number } | null> => {
  try {
    const apiKey = process.env.GOOGLE_MAP_API;
    if (!apiKey) {
      throw new Error("Google Maps API key not configured");
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: location,
          key: apiKey,
        },
      },
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch (error) {
    console.error("Error geocoding location:", error);
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
  res: Response,
): Promise<void> => {
  try {
    const { latitude, longitude, location, radius = 30 } = req.query;
    let userLat: number;
    let userLng: number;
    // Validate and parse radius (default 30km, max 200km)
    const searchRadius = Math.min(
      Math.max(parseFloat(radius as string) || 30, 1),
      99999,
    );
    // Case 1: User provides GPS coordinates
    if (latitude && longitude) {
      userLat = parseFloat(latitude as string);
      userLng = parseFloat(longitude as string);
      if (!isValidCoordinate(userLat, userLng)) {
        res.status(400).json({
          success: false,
          message:
            "Invalid latitude or longitude values. Latitude must be between -90 and 90, longitude between -180 and 180",
        });
        return;
      }
    }
    // Case 2: User provides location string
    else if (location && typeof location === "string" && location.trim()) {
      const coordinates = await geocodeLocation(location.trim());

      if (!coordinates) {
        res.status(400).json({
          success: false,
          message:
            "Unable to geocode the provided location. Please check the location and try again",
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
        message:
          "Either (latitude and longitude) or (location) must be provided",
      });
      return;
    }

    // Fetch all live events
    const result = await getAllLiveEvents();

    // Handle different response structures
    let events: any[] = [];

    if (Array.isArray(result)) {
      events = result;
    } else if (result && typeof result === "object") {
      // Try different possible structures
      events = result?.tickets || [];
    }
    if (!events || events.length === 0) {
      res.status(200).json({
        success: true,
        message: "No events found",
        data: {
          count: 0,
          search_location: {
            latitude: userLat,
            longitude: userLng,
            radius: searchRadius,
            radius_unit: "km",
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
          if (
            mainEventLat &&
            mainEventLng &&
            isValidCoordinate(mainEventLat, mainEventLng)
          ) {
            mainEventDistance = calculateDistance(
              userLat,
              userLng,
              mainEventLat,
              mainEventLng,
            );
            isMainEventNearby = mainEventDistance <= searchRadius;
          }

          // Process sub-events
          let nearbySubEvents: any[] = [];
          let allSubEventsProcessed: any[] = [];

          if (
            event.sub_events &&
            Array.isArray(event.sub_events) &&
            event.sub_events.length > 0
          ) {
            event.sub_events.forEach((subEvent: any) => {
              try {
                const subEventLat = subEvent.exact_map_location?.latitude;
                const subEventLng = subEvent.exact_map_location?.longitude;

                if (
                  subEventLat &&
                  subEventLng &&
                  isValidCoordinate(subEventLat, subEventLng)
                ) {
                  const subEventDistance = calculateDistance(
                    userLat,
                    userLng,
                    subEventLat,
                    subEventLng,
                  );

                  const processedSubEvent = {
                    ...subEvent,
                    distance: Math.round(subEventDistance * 100) / 100,
                    distance_unit: "km",
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
                    distance_unit: "km",
                    is_nearby: false,
                    location_note: "No valid coordinates",
                  });
                }
              } catch (subEventError) {
                console.error("Error processing sub-event:", subEventError);
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
              closestDistance = Math.min(
                mainEventDistance!,
                nearbySubEvents[0].distance,
              );
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
              distance_unit: "km",
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
          console.error("Error processing event:", event._id, eventError);
          return null;
        }
      })
      .filter((event: any) => event !== null)
      .sort((a: any, b: any) => a.distance - b.distance);
    res.status(200).json({
      success: true,
      message: "Nearby events fetched successfully",
      data: {
        count: nearbyEventsWithDistance.length,
        search_location: {
          latitude: userLat,
          longitude: userLng,
          radius: searchRadius,
          radius_unit: "km",
        },
        events: nearbyEventsWithDistance,
      },
    });
  } catch (error: any) {
    console.error("Error in getNearbyEvents controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby events",
      error: error.message,
    });
  }
};

export const getAllEventsWithDistance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { latitude, longitude, location } = req.query;

    let userLat: number | null = null;
    let userLng: number | null = null;

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      if (isValidCoordinate(lat, lng)) {
        userLat = lat;
        userLng = lng;
      }
    }

    if (
      !userLat &&
      !userLng &&
      location &&
      typeof location === "string" &&
      location.trim()
    ) {
      const coords = await geocodeLocation(location.trim());
      if (coords) {
        userLat = coords.lat;
        userLng = coords.lng;
      }
    }

    const rawResult = await getAllLiveEvents();
    // getAllLiveEvents returns GetAllLiveEventsResponse — unwrap safely
    const rawTickets: any[] = (() => {
      if (Array.isArray(rawResult)) return rawResult;
      if (Array.isArray((rawResult as any)?.tickets))
        return (rawResult as any).tickets;
      if (Array.isArray((rawResult as any)?.data?.tickets))
        return (rawResult as any).data.tickets;
      if (Array.isArray((rawResult as any)?.data))
        return (rawResult as any).data;
      if (rawResult && typeof rawResult === "object") {
        // Try grabbing first array-valued key
        const firstArr = Object.values(rawResult as object).find(Array.isArray);
        if (firstArr) return firstArr as any[];
      }
      return [];
    })();

    if (rawTickets.length === 0) {
      res.status(200).json({
        success: true,
        message: "No events found",
        data: { count: 0, search_location: null, events: [] },
      });
      return;
    }
    const seenIds = new Set<string>();
    const events: any[] = [];

    const calcDistance = (lat: number, lng: number): number | null => {
      if (userLat === null || userLng === null) return null;
      if (!isValidCoordinate(lat, lng)) return null;
      return (
        Math.round(calculateDistance(userLat, userLng, lat, lng) * 100) / 100
      );
    };

    // ── Step 1: Add all MAIN events ──
    for (const ticket of rawTickets) {
      const mainId = ticket._id?.toString() || "";
      if (seenIds.has(mainId)) continue;
      seenIds.add(mainId);

      // Distance: use main event location, fall back to closest sub-event location
      let distance: number | null = null;
      const mLat = ticket.exact_map_location?.latitude;
      const mLng = ticket.exact_map_location?.longitude;
      if (mLat && mLng) {
        distance = calcDistance(mLat, mLng);
      }

      // Check sub-events for a closer distance
      if (ticket.sub_events && Array.isArray(ticket.sub_events)) {
        for (const sub of ticket.sub_events) {
          const sLat = sub.exact_map_location?.latitude;
          const sLng = sub.exact_map_location?.longitude;
          if (sLat && sLng) {
            const d = calcDistance(sLat, sLng);
            if (d !== null && (distance === null || d < distance)) {
              distance = d;
            }
          }
        }
      }

      events.push({
        ...(typeof ticket.toObject === "function" ? ticket.toObject() : ticket),
        distance,
        distance_unit: "km",
        _isSubEvent: false,
      });
    }

    for (const ticket of rawTickets) {
      const mainId = ticket._id?.toString() || ticket.id?.toString() || "";
      if (!mainId || seenIds.has(mainId)) continue;
      seenIds.add(mainId);

      let distance: number | null = null;
      const mLat = ticket.exact_map_location?.latitude;
      const mLng = ticket.exact_map_location?.longitude;
      if (mLat && mLng) {
        distance = calcDistance(mLat, mLng);
      }

      if (ticket.sub_events && Array.isArray(ticket.sub_events)) {
        for (const sub of ticket.sub_events) {
          const sLat = sub.exact_map_location?.latitude;
          const sLng = sub.exact_map_location?.longitude;
          if (sLat && sLng) {
            const d = calcDistance(sLat, sLng);
            if (d !== null && (distance === null || d < distance)) {
              distance = d;
            }
          }
        }
      }

      // Spread plain object directly — gRPC returns plain JS objects, not Mongoose docs
      const plainTicket = { ...ticket };
      events.push({
        ...plainTicket,
        distance,
        distance_unit: "km",
        _isSubEvent: false,
      });
    }

    // ── Step 3: Sort — nearest first, no-location last ──
    events.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    res.status(200).json({
      success: true,
      message: "All events fetched successfully",
      data: {
        count: events.length,
        search_location:
          userLat && userLng ? { latitude: userLat, longitude: userLng } : null,
        events,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getAllEventsWithDistance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all events",
      error: error.message,
    });
  }
};
export const getTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId } = req.params;

    if (!ticketId) {
      res
        .status(400)
        .json({ success: false, message: "Ticket ID is required" });
      return;
    }

    let ticket: any = null;
    try {
      ticket = await getTicketById(ticketId);
    } catch (grpcErr: any) {
      console.warn(
        "⚠️ [getTicket] getTicketById gRPC failed:",
        grpcErr.message,
      );
    }

    if (ticket) {
      res.status(200).json({
        success: true,
        message: "Ticket fetched successfully",
        data: {
          event: ticket,
          isSubEvent: ticket.isSubEvent || false,
          parentEvent: ticket.parentEventId
            ? {
                _id: ticket.parentEventId,
                event_name: (ticket as any).parentEventName,
              }
            : null,
        },
      });
      return;
    }
    try {
      const allTickets = await getAllLiveEvents();
      const events = Array.isArray(allTickets)
        ? allTickets
        : allTickets?.tickets || [];
      const eventData = events.find(
        (e: any) =>
          e._id?.toString() === ticketId || e.id?.toString() === ticketId,
      );

      if (eventData) {
        res.status(200).json({
          success: true,
          message: "Ticket fetched successfully",
          data: {
            event: eventData,
            isSubEvent: eventData.isSubEvent || false,
            parentEvent: eventData.parentEventId
              ? {
                  _id: eventData.parentEventId,
                  event_name: eventData.parentEventName,
                }
              : null,
          },
        });
        return;
      }
    } catch (liveErr: any) {
      console.warn(
        "⚠️ [getTicket] getAllLiveEvents failed (non-fatal):",
        liveErr.message,
      );
    }
    res.status(404).json({ success: false, message: "Event not found" });
  } catch (error: any) {
    console.error("❌ Error in getTicket controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};
const locationMatches = (event: any, locationText: string): boolean => {
  const locationLower = locationText.toLowerCase().trim();
  const address = (event.exact_map_location?.address || "").toLowerCase();
  const locationField = (event.location || "").toLowerCase();
  const venue = (event.venue || "").toLowerCase();
  const locationParts = locationLower
    .split(/[,\s]+/)
    .filter((p) => p.length > 2);
  const fullText = `${address} ${locationField} ${venue}`;
  if (locationParts.length === 1) {
    const words = fullText.split(/[\s,]+/);
    return words.some(
      (word) =>
        word.includes(locationParts[0]) || locationParts[0].includes(word),
    );
  }
  const matchCount = locationParts.filter((part) =>
    fullText.includes(part),
  ).length;
  return matchCount >= Math.ceil(locationParts.length * 0.7); // 70% match threshold
};
const normalizeCategory = (category: string): string => {
  return category
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
};
const categoriesMatch = (
  eventCategory: string,
  filterCategory: string,
): boolean => {
  const normalizedEvent = normalizeCategory(eventCategory || "");
  const normalizedFilter = normalizeCategory(filterCategory || "");

  if (normalizedEvent === normalizedFilter) return true;

  const stripSpecial = (s: string) =>
    s.replace(/[&,]/g, "").replace(/\s+/g, " ").trim();
  if (stripSpecial(normalizedEvent) === stripSpecial(normalizedFilter))
    return true;

  return false;
};
export const getEventsByName = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { searchQuery, userId } = req.query;

    if (
      !searchQuery ||
      typeof searchQuery !== "string" ||
      !searchQuery.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    let userCountryCode: string | null = null;
    let userCountryName: string | null = null;

    // Get user profile for country filtering only
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId as string);
        if (userProfile) {
          userCountryCode = userProfile.country_code;
          userCountryName = userProfile.country_name;
        }
      } catch (err) {
        console.warn("Failed to fetch user profile:", err);
      }
    }

    // Fetch all live events
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];
    let events: any[] = [];

    // Flatten events
    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });

      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
            groupId: mainEvent.groupId,
            userId: mainEvent.userId,
          });
        });
      }
    });

    // Search by event name only (no location filter)
    const searchLower = searchQuery.trim().toLowerCase();
    events = events.filter((event: any) => {
      const eventName = (event.event_name || "").toLowerCase();
      const description = (event.event_description || "").toLowerCase();
      const hashtags = (event.hashtag || []).join(" ").toLowerCase();
      return (
        eventName.includes(searchLower) ||
        description.includes(searchLower) ||
        hashtags.includes(searchLower)
      );
    });

    // Optionally filter by country if available
    if (userCountryName && events.length > 0) {
      const countryLower = userCountryName.toLowerCase();
      const countryFiltered = events.filter((event: any) => {
        const address = (event.exact_map_location?.address || "").toLowerCase();
        const locationField = (event.location || "").toLowerCase();
        return (
          address.includes(countryLower) || locationField.includes(countryLower)
        );
      });
      if (countryFiltered.length > 0) {
        events = countryFiltered;
      }
    }

    // Group by category
    const eventsByCategory = events.reduce((acc: any, event: any) => {
      const cat = event.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(event);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message:
        events.length > 0
          ? `Found ${events.length} event(s) matching "${searchQuery}"`
          : `No events found matching "${searchQuery}"`,
      data: {
        searchQuery: searchQuery,
        categories: Object.keys(eventsByCategory).sort(),
        eventsByCategory,
        totalEvents: events.length,
        countryCode: userCountryCode,
        countryName: userCountryName,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getEventsByName:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search events",
      error: error.message,
    });
  }
};
export const getEventsByLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { latitude, longitude, location, radius, userId } = req.query;

    let userLat: number | null = null;
    let userLng: number | null = null;
    let userLocation: string | null = null;
    let userCountryCode: string | null = null;
    let userCountryName: string | null = null;
    let profileLat: number | null = null;
    let profileLng: number | null = null;
    let locationSource: "gps" | "manual" | "none" = "none";

    const searchRadius = radius
      ? Math.min(Math.max(parseFloat(radius as string), 1), 100)
      : 50; // Default 50km for exact location search
    const MAX_SUGGESTION_RADIUS_KM = 200;
    // Get user profile for suggestions
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId as string);
        if (userProfile) {
          userCountryCode = userProfile.country_code;
          userCountryName = userProfile.country_name;
          if (userProfile.latitude && userProfile.longitude) {
            profileLat = userProfile.latitude;
            profileLng = userProfile.longitude;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile:", err);
      }
    }

    // Priority 1: GPS coordinates from query
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      if (isValidCoordinate(lat, lng)) {
        userLat = lat;
        userLng = lng;
        locationSource = "gps";
      }
    }

    // Priority 2: Manual location string
    if (
      !userLat &&
      !userLng &&
      location &&
      typeof location === "string" &&
      location.trim()
    ) {
      userLocation = location.trim();
      locationSource = "manual";

      try {
        const coordinates = await geocodeLocation(userLocation);
        if (coordinates) {
          userLat = coordinates.lat;
          userLng = coordinates.lng;
        }
      } catch (err) {
        console.warn("Failed to geocode location:", err);
      }
    }

    if (!userLat && !userLng && !userLocation) {
      res.status(400).json({
        success: false,
        message: "Location (coordinates or location name) is required",
      });
      return;
    }

    // Fetch all live events
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];
    let events: any[] = [];

    // Flatten events
    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });

      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
            groupId: mainEvent.groupId,
            userId: mainEvent.userId,
          });
        });
      }
    });

    let mainResults: any[] = [];
    let suggestions: any[] = [];

    if (locationSource === "manual" && userLocation) {
      // STRICT TEXT-BASED MATCHING for manual location entry
      const locationLower = userLocation.toLowerCase().trim();

      // Split into meaningful parts (ignore very short words)
      const locationParts = locationLower
        .split(/[,\s]+/)
        .filter((p) => p.length > 2)
        .map((p) => p.trim());

      mainResults = events.filter((event: any) => {
        const address = (event.exact_map_location?.address || "").toLowerCase();
        const locationField = (event.location || "").toLowerCase();
        const venue = (event.venue || "").toLowerCase();

        // Combine all location fields
        const fullLocationText = `${address} ${locationField} ${venue}`;

        // STRICT: Check if the searched location appears as a distinct part
        // Must match the exact city/area name, not partial matches

        // Method 1: Exact phrase match
        if (fullLocationText.includes(locationLower)) {
          return true;
        }

        // Method 2: All significant parts must be present
        if (locationParts.length > 0) {
          const allPartsMatch = locationParts.every((part) => {
            // Check for word boundary match (not just substring)
            const regex = new RegExp(`\\b${part}\\b`, "i");
            return regex.test(fullLocationText);
          });
          if (allPartsMatch) {
            return true;
          }
        }

        return false;
      });

      // Add distance info if we have geocoded coordinates
      if (userLat && userLng && mainResults.length > 0) {
        mainResults = mainResults
          .map((event: any) => {
            const eventLat = event.exact_map_location?.latitude;
            const eventLng = event.exact_map_location?.longitude;

            if (eventLat && eventLng && isValidCoordinate(eventLat, eventLng)) {
              const distance = calculateDistance(
                userLat!,
                userLng!,
                eventLat,
                eventLng,
              );
              return {
                ...event,
                distance: Math.round(distance * 100) / 100,
                distance_unit: "km",
              };
            }
            return { ...event, distance: null, distance_unit: "km" };
          })
          .sort(
            (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
          );
      }

      // If NO results found with strict matching, get suggestions from profile location
      if (mainResults.length === 0 && profileLat && profileLng) {
        const suggestionsWithDistance = events.map((event: any) => {
          const eventLat = event.exact_map_location?.latitude;
          const eventLng = event.exact_map_location?.longitude;

          if (eventLat && eventLng && isValidCoordinate(eventLat, eventLng)) {
            const distance = calculateDistance(
              profileLat!,
              profileLng!,
              eventLat,
              eventLng,
            );
            return {
              ...event,
              distance: Math.round(distance * 100) / 100,
              distance_unit: "km",
            };
          }
          return { ...event, distance: null, distance_unit: "km" };
        });

        suggestions = suggestionsWithDistance
          .filter(
            (e: any) =>
              e.distance !== null && e.distance <= MAX_SUGGESTION_RADIUS_KM,
          )
          .sort(
            (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
          )
          .slice(0, 10);
      }
    } else if (userLat && userLng) {
      // GPS-based search - use coordinate distance
      const eventsWithDistance = events.map((event: any) => {
        const eventLat = event.exact_map_location?.latitude;
        const eventLng = event.exact_map_location?.longitude;

        if (eventLat && eventLng && isValidCoordinate(eventLat, eventLng)) {
          const distance = calculateDistance(
            userLat!,
            userLng!,
            eventLat,
            eventLng,
          );
          return {
            ...event,
            distance: Math.round(distance * 100) / 100,
            distance_unit: "km",
          };
        }
        return { ...event, distance: null, distance_unit: "km" };
      });

      // Main results within search radius
      mainResults = eventsWithDistance
        .filter((e: any) => e.distance !== null && e.distance <= searchRadius)
        .sort(
          (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
        );

      // If no main results, get suggestions from wider area
      if (mainResults.length === 0) {
        suggestions = eventsWithDistance
          .filter(
            (e: any) =>
              e.distance !== null && e.distance <= MAX_SUGGESTION_RADIUS_KM,
          )
          .sort(
            (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
          )
          .slice(0, 10);
      }
    }

    // Group main results by category
    const eventsByCategory = mainResults.reduce((acc: any, event: any) => {
      const cat = event.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(event);
      return acc;
    }, {});

    // Group suggestions by category
    const suggestionsByCategory = suggestions.reduce((acc: any, event: any) => {
      const cat = event.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(event);
      return acc;
    }, {});

    // Build response message
    let message = "";
    if (mainResults.length > 0) {
      message = userLocation
        ? `Found ${mainResults.length} event(s) in "${userLocation}"`
        : `Found ${mainResults.length} event(s) near your location`;
    } else {
      message = userLocation
        ? `No events found in "${userLocation}"`
        : `No events found near your location`;
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        locationAvailable: !!(userLat && userLng),
        locationSource,
        searchLocation:
          userLocation ||
          (userLat && userLng
            ? { latitude: userLat, longitude: userLng }
            : null),
        searchedLocationName: userLocation || null,
        searchRadius,
        categories: Object.keys(eventsByCategory).sort(),
        eventsByCategory,
        totalEvents: mainResults.length,
        // Suggestions only when no main results
        hasSuggestions: mainResults.length === 0 && suggestions.length > 0,
        suggestionCategories: Object.keys(suggestionsByCategory).sort(),
        suggestionsByCategory:
          mainResults.length === 0 ? suggestionsByCategory : {},
        totalSuggestions: mainResults.length === 0 ? suggestions.length : 0,
        suggestionRadius: MAX_SUGGESTION_RADIUS_KM,
        countryCode: userCountryCode,
        countryName: userCountryName,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getEventsByLocation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};
export const getCategoryBasedEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { category, userId } = req.query;

    let userLat: number | null = null;
    let userLng: number | null = null;
    let userCountryCode: string | null = null;
    let userCountryName: string | null = null;
    let locationSource: "gps" | "manual" | "saved" | "country" | "none" =
      "none";

    // Get user profile
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId as string);
        if (userProfile) {
          userCountryCode = userProfile.country_code;
          userCountryName = userProfile.country_name;
          if (userProfile.latitude && userProfile.longitude) {
            userLat = userProfile.latitude;
            userLng = userProfile.longitude;
            locationSource = "saved";
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile:", err);
      }
    }

    // Fetch all live events
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];
    let events: any[] = [];

    // Flatten events
    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });

      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
            groupId: mainEvent.groupId,
            userId: mainEvent.userId,
          });
        });
      }
    });

    // Filter by category if provided
    if (category && typeof category === "string" && category.trim()) {
      const filterCategory = decodeURIComponent(category).trim();
      events = events.filter((event: any) =>
        categoriesMatch(event.event_category, filterCategory),
      );
    }

    let mainResults: any[] = [];
    let suggestions: any[] = [];
    // Apply location-based filtering if coordinates available
    if (userLat && userLng) {
      const eventsWithDistance = events.map((event: any) => {
        const eventLat = event.exact_map_location?.latitude;
        const eventLng = event.exact_map_location?.longitude;

        if (eventLat && eventLng && isValidCoordinate(eventLat, eventLng)) {
          const distance = calculateDistance(
            userLat!,
            userLng!,
            eventLat,
            eventLng,
          );
          return {
            ...event,
            distance: Math.round(distance * 100) / 100,
            distance_unit: "km",
          };
        }
        return { ...event, distance: null, distance_unit: "km" };
      });

      // Main results within DEFAULT_SEARCH_RADIUS_KM
      const withinRadius = eventsWithDistance
        .filter(
          (e: any) =>
            e.distance !== null && e.distance <= DEFAULT_SEARCH_RADIUS_KM,
        )
        .sort(
          (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
        );

      if (withinRadius.length > 0) {
        mainResults = withinRadius;
      } else if (category) {
        // ── KEY FIX: no nearby results for this category ──
        // Fall back to ALL events in the category (sorted by popularity score
        // so the list matches what getCategoryBasedPopularEvents returns).
        mainResults = eventsWithDistance.sort((a: any, b: any) => {
          const scoreA =
            (a.totalBookings ?? 0) * 3 +
            (a.like ?? 0) * 2 +
            (a.totalTicketsSold ?? 0);
          const scoreB =
            (b.totalBookings ?? 0) * 3 +
            (b.like ?? 0) * 2 +
            (b.totalTicketsSold ?? 0);
          return scoreB - scoreA;
        });
      } else {
        // No category — try suggestions within MAX radius
        suggestions = eventsWithDistance
          .filter(
            (e: any) =>
              e.distance !== null && e.distance <= MAX_SUGGESTION_RADIUS_KM,
          )
          .sort(
            (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
          )
          .slice(0, 10);
      }
    } else if (userCountryName) {
      const countryLower = userCountryName.toLowerCase();
      const countryFiltered = events.filter((event: any) => {
        const address = (event.exact_map_location?.address || "").toLowerCase();
        const locationField = (event.location || "").toLowerCase();
        return (
          address.includes(countryLower) || locationField.includes(countryLower)
        );
      });

      // ── Same fix for country filter ──
      mainResults = countryFiltered.length > 0 ? countryFiltered : events;
      locationSource = "country";
    } else {
      // No location at all — return all events (filtered by category if provided)
      mainResults = events;
    }

    // Group main results by category
    const eventsByCategory = mainResults.reduce((acc: any, event: any) => {
      const cat = event.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(event);
      return acc;
    }, {});

    // Group suggestions by category (same category only)
    const suggestionsByCategory = suggestions.reduce((acc: any, event: any) => {
      const cat = event.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(event);
      return acc;
    }, {});

    const responseMessage = category
      ? mainResults.length > 0
        ? `Found ${mainResults.length} event(s) for "${category}"`
        : `No events found for "${category}" in your area`
      : `Found ${mainResults.length} event(s)`;

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        locationAvailable: !!(userLat && userLng),
        locationSource,
        searchLocation:
          userLat && userLng ? { latitude: userLat, longitude: userLng } : null,
        searchRadius: userLat && userLng ? DEFAULT_SEARCH_RADIUS_KM : null,
        categories: Object.keys(eventsByCategory).sort(),
        eventsByCategory,
        totalEvents: mainResults.length,
        // Suggestions (same category only, when no main results)
        hasSuggestions: mainResults.length === 0 && suggestions.length > 0,
        suggestionCategories: Object.keys(suggestionsByCategory).sort(),
        suggestionsByCategory:
          mainResults.length === 0 ? suggestionsByCategory : {},
        totalSuggestions: mainResults.length === 0 ? suggestions.length : 0,
        suggestionRadius: MAX_SUGGESTION_RADIUS_KM,
        countryCode: userCountryCode,
        countryName: userCountryName,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getCategoryBasedEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};
export const getInitialEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.query;

    let userLat: number | null = null;
    let userLng: number | null = null;
    let userLocation: string | null = null;
    let userCountryCode: string | null = null;
    let userCountryName: string | null = null;
    let locationSource: "gps" | "manual" | "saved" | "country" | "none" =
      "none";

    // Get user profile
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId as string);
        if (userProfile) {
          userCountryCode = userProfile.country_code;
          userCountryName = userProfile.country_name;
          if (userProfile.latitude && userProfile.longitude) {
            userLat = userProfile.latitude;
            userLng = userProfile.longitude;
            locationSource = "saved";
          } else if (userProfile.location) {
            userLocation = userProfile.location;
            locationSource = "saved";
            // Try to geocode
            try {
              const coordinates = await geocodeLocation(userLocation);
              if (coordinates) {
                userLat = coordinates.lat;
                userLng = coordinates.lng;
              }
            } catch (err) {
              console.warn("Failed to geocode saved location:", err);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile:", err);
      }
    }

    // Fetch all live events
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];
    let events: any[] = [];

    // Flatten events
    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });

      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
            groupId: mainEvent.groupId,
            userId: mainEvent.userId,
          });
        });
      }
    });

    // Apply location-based filtering
    if (userLat && userLng) {
      const eventsWithDistance = events.map((event: any) => {
        const eventLat = event.exact_map_location?.latitude;
        const eventLng = event.exact_map_location?.longitude;

        if (eventLat && eventLng && isValidCoordinate(eventLat, eventLng)) {
          const distance = calculateDistance(
            userLat!,
            userLng!,
            eventLat,
            eventLng,
          );
          return {
            ...event,
            distance: Math.round(distance * 100) / 100,
            distance_unit: "km",
          };
        }
        return { ...event, distance: null, distance_unit: "km" };
      });

      events = eventsWithDistance
        .filter(
          (e: any) =>
            e.distance !== null && e.distance <= DEFAULT_SEARCH_RADIUS_KM,
        )
        .sort(
          (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
        );
    } else if (userCountryName) {
      const countryLower = userCountryName.toLowerCase();
      events = events.filter((event: any) => {
        const address = (event.exact_map_location?.address || "").toLowerCase();
        const locationField = (event.location || "").toLowerCase();
        return (
          address.includes(countryLower) || locationField.includes(countryLower)
        );
      });
      locationSource = "country";
    }

    // Group by category
    const eventsByCategory = events.reduce((acc: any, event: any) => {
      const cat = event.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(event);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: `Found ${events.length} event(s)`,
      data: {
        locationAvailable: !!(userLat && userLng),
        locationSource,
        searchLocation:
          userLat && userLng
            ? { latitude: userLat, longitude: userLng }
            : userLocation,
        searchRadius: userLat && userLng ? DEFAULT_SEARCH_RADIUS_KM : null,
        categories: Object.keys(eventsByCategory).sort(),
        eventsByCategory,
        totalEvents: events.length,
        countryCode: userCountryCode,
        countryName: userCountryName,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getInitialEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

export const getFilteredEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      category,
      subcategory,
      location,
      latitude,
      longitude,
      searchQuery,
      radius,
      locationType,
      eventLanguage,
      startDate,
      endDate,
      bookingStartDate,
      bookingEndDate,
      userId,
    } = req.query;

    let userLat: number | null = null;
    let userLng: number | null = null;
    let userLocation: string | null = null;
    let userCountryCode: string | null = null;
    let userCountryName: string | null = null;
    let locationSource: "gps" | "manual" | "saved" | "country" | "none" =
      "none";

    const searchRadius = radius
      ? Math.min(Math.max(parseFloat(radius as string), 1), 500)
      : 200;

    // Get user profile
    if (userId) {
      try {
        const userProfile = await getUserProfile(userId as string);
        if (userProfile) {
          userCountryCode = userProfile.country_code;
          userCountryName = userProfile.country_name;
          if (userProfile.latitude && userProfile.longitude) {
            userLat = userProfile.latitude;
            userLng = userProfile.longitude;
            locationSource = "saved";
          } else if (userProfile.location) {
            userLocation = userProfile.location;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile:", err);
      }
    }

    // Priority 1: GPS coordinates
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      if (isValidCoordinate(lat, lng)) {
        userLat = lat;
        userLng = lng;
        locationSource = "gps";
        userLocation = null;
      }
    }

    // Priority 2: Manual location (OVERRIDE saved)
    if (location && typeof location === "string" && location.trim()) {
      userLocation = location.trim();
      locationSource = "manual";
      userLat = null;
      userLng = null;

      try {
        const coordinates = await geocodeLocation(userLocation);
        if (coordinates) {
          userLat = coordinates.lat;
          userLng = coordinates.lng;
        }
      } catch (err) {
        console.warn("Failed to geocode:", err);
      }
    }

    // Fetch and flatten events
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];
    let events: any[] = [];

    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });
      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
            groupId: mainEvent.groupId,
            userId: mainEvent.userId,
          });
        });
      }
    });

    // Apply filters
    // 1. Search query
    if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
      const searchLower = searchQuery.trim().toLowerCase();
      events = events.filter((event: any) => {
        const name = (event.event_name || "").toLowerCase();
        const cat = (event.event_category || "").toLowerCase();
        const subcat = (event.event_subcategory || "").toLowerCase();
        return (
          name.includes(searchLower) ||
          cat.includes(searchLower) ||
          subcat.includes(searchLower)
        );
      });
    }

    // 2. Category (FIXED)
    if (category && typeof category === "string" && category.trim()) {
      const filterCategory = decodeURIComponent(category as string).trim();
      events = events.filter((event: any) =>
        categoriesMatch(event.event_category, filterCategory),
      );
    }

    // 3. Subcategory
    if (subcategory && typeof subcategory === "string" && subcategory.trim()) {
      const subLower = subcategory.trim().toLowerCase();
      events = events.filter(
        (e: any) => (e.event_subcategory || "").toLowerCase() === subLower,
      );
    }

    // 4. Location type
    if (
      locationType &&
      typeof locationType === "string" &&
      locationType.trim()
    ) {
      const typeLower = locationType.trim().toLowerCase();
      events = events.filter(
        (e: any) => (e.location_type || "").toLowerCase() === typeLower,
      );
    }

    // 5. Language
    if (
      eventLanguage &&
      typeof eventLanguage === "string" &&
      eventLanguage.trim()
    ) {
      const langLower = eventLanguage.trim().toLowerCase();
      events = events.filter((e: any) => {
        if (!e.event_language || !Array.isArray(e.event_language)) return false;
        return e.event_language.some(
          (l: string) => l.toLowerCase() === langLower,
        );
      });
    }

    // 6. Event dates
    if (startDate || endDate) {
      events = events.filter((event: any) => {
        if (!event.event_dates || !Array.isArray(event.event_dates))
          return false;
        return event.event_dates.some((d: any) => {
          const evStart = new Date(d.start_date);
          const evEnd = new Date(d.end_date || d.start_date);
          if (startDate && evEnd < new Date(startDate as string)) return false;
          if (endDate && evStart > new Date(endDate as string)) return false;
          return true;
        });
      });
    }

    // 7. Booking dates
    if (bookingStartDate || bookingEndDate) {
      events = events.filter((e: any) => {
        if (!e.booking_start_date || !e.booking_end_date) return false;
        const bStart = new Date(e.booking_start_date);
        const bEnd = new Date(e.booking_end_date);
        if (bookingStartDate && bEnd < new Date(bookingStartDate as string))
          return false;
        if (bookingEndDate && bStart > new Date(bookingEndDate as string))
          return false;
        return true;
      });
    }

    // 8. Location filtering
    if (userLat && userLng) {
      const eventsWithDist = events.map((e: any) => {
        const eLat = e.exact_map_location?.latitude;
        const eLng = e.exact_map_location?.longitude;
        if (eLat && eLng && isValidCoordinate(eLat, eLng)) {
          const dist = calculateDistance(userLat!, userLng!, eLat, eLng);
          return {
            ...e,
            distance: Math.round(dist * 100) / 100,
            distance_unit: "km",
          };
        }
        return { ...e, distance: null, distance_unit: "km" };
      });
      events = eventsWithDist
        .filter((e: any) => e.distance !== null && e.distance <= searchRadius)
        .sort(
          (a: any, b: any) => (a.distance || 999999) - (b.distance || 999999),
        );
    } else if (userLocation && locationSource === "manual") {
      events = events.filter((e: any) => locationMatches(e, userLocation!));
    }

    // Build response
    const appliedFilters = {
      category: category || null,
      subcategory: subcategory || null,
      searchQuery: searchQuery || null,
      locationType: locationType || null,
      eventLanguage: eventLanguage || null,
      startDate: startDate || null,
      endDate: endDate || null,
      bookingStartDate: bookingStartDate || null,
      bookingEndDate: bookingEndDate || null,
    };

    if (events.length === 0) {
      res.status(200).json({
        success: true,
        message: "No events found matching your filters",
        data: {
          locationAvailable: !!(userLat && userLng),
          locationSource,
          searchLocation:
            userLat && userLng
              ? { latitude: userLat, longitude: userLng }
              : userLocation,
          searchRadius: userLat && userLng ? searchRadius : null,
          appliedFilters,
          categories: [],
          eventsByCategory: {},
          totalEvents: 0,
          countryCode: userCountryCode,
          countryName: userCountryName,
        },
      });
      return;
    }
    // Deduplicate by _id to avoid the same event appearing multiple times
    const seenEventIds = new Set<string>();
    events = events.filter((e: any) => {
      const id = e._id?.toString() || e.id?.toString();
      if (!id || seenEventIds.has(id)) return false;
      seenEventIds.add(id);
      return true;
    });

    const eventsByCategory = events.reduce((acc: any, e: any) => {
      const cat = e.event_category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(e);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: `Found ${events.length} event(s)`,
      data: {
        locationAvailable: !!(userLat && userLng),
        locationSource,
        searchLocation:
          userLat && userLng
            ? { latitude: userLat, longitude: userLng }
            : userLocation,
        searchRadius: userLat && userLng ? searchRadius : null,
        appliedFilters,
        categories: Object.keys(eventsByCategory).sort(),
        eventsByCategory,
        totalEvents: events.length,
        countryCode: userCountryCode,
        countryName: userCountryName,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getFilteredEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filtered events",
      error: error.message,
    });
  }
};

export const getPopularEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { limit = "10" } = req.query;
    const maxResults = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      50,
    );

    // Fetch all live events via gRPC
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];

    // Flatten main events + sub-events
    let events: any[] = [];
    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });
      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
          });
        });
      }
    });

    // Filter: only events that have a displayable image
    events = events.filter((e: any) => e.event_banner || e.event_portrait);

    // Score each event using stats already present on the ticket object
    // (populated by getAllLiveEvents via gRPC normalisation in ticketClient.ts)
    // Score = (totalBookings × 3) + (like × 2) + (totalTicketsSold × 1)
    const scored: Array<{ event: any; score: number }> = events.map(
      (ev: any) => ({
        event: ev,
        score:
          (ev.totalBookings ?? 0) * 3 +
          (ev.like ?? 0) * 2 +
          (ev.totalTicketsSold ?? 0) * 1,
      }),
    );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const popularEvents = scored
      .slice(0, maxResults)
      .map(({ event, score }) => ({
        ...event,
        popularity_score: score,
      }));

    res.status(200).json({
      success: true,
      message: `Found ${popularEvents.length} popular event(s)`,
      data: {
        count: popularEvents.length,
        events: popularEvents,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getPopularEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch popular events",
      error: error.message,
    });
  }
};

export const getCategoryBasedPopularEvents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { category, limit = "10", searchQuery } = req.query;
    const maxResults = Math.min(
      Math.max(parseInt(limit as string) || 10, 1),
      50,
    );

    // Fetch all live events via gRPC
    const result = await getAllLiveEvents();
    let allEvents: any[] = Array.isArray(result)
      ? result
      : result?.tickets || [];

    // Flatten main events + sub-events
    let events: any[] = [];
    allEvents.forEach((mainEvent: any) => {
      events.push({
        ...mainEvent,
        isSubEvent: false,
        parentEventId: null,
        parentEventName: null,
      });
      if (mainEvent.sub_events && Array.isArray(mainEvent.sub_events)) {
        mainEvent.sub_events.forEach((subEvent: any) => {
          events.push({
            ...subEvent,
            isSubEvent: true,
            parentEventId: mainEvent._id,
            parentEventName: mainEvent.event_name,
            parentEventCategory: mainEvent.event_category,
            parentEventBanner: mainEvent.event_banner,
            parentEventLogo: mainEvent.event_logo,
          });
        });
      }
    });

    // Filter by category if provided
    if (category && typeof category === "string" && category.trim()) {
      const filterCategory = decodeURIComponent(category as string).trim();
      events = events.filter((event: any) =>
        categoriesMatch(event.event_category, filterCategory),
      );
    }

    // Filter by search query if provided (and no category filter applied or as an additional filter)
    if (searchQuery && typeof searchQuery === "string" && searchQuery.trim()) {
      const query = decodeURIComponent(searchQuery as string)
        .trim()
        .toLowerCase();
      events = events.filter(
        (event: any) =>
          (event.event_name &&
            event.event_name.toLowerCase().includes(query)) ||
          (event.event_category &&
            event.event_category.toLowerCase().includes(query)) ||
          (event.event_subcategory &&
            event.event_subcategory.toLowerCase().includes(query)),
      );
    }

    // Filter: only events that have a displayable image
    events = events.filter((e: any) => e.event_banner || e.event_portrait);

    // Deduplicate by _id
    const seenIds = new Set<string>();
    events = events.filter((e: any) => {
      const id = e._id?.toString() || e.id?.toString();
      if (!id || seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

    // Score each event
    const scored: Array<{ event: any; score: number }> = events.map(
      (ev: any) => ({
        event: ev,
        score:
          (ev.totalBookings ?? 0) * 3 +
          (ev.like ?? 0) * 2 +
          (ev.totalTicketsSold ?? 0) * 1,
      }),
    );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    const popularEvents = scored
      .slice(0, maxResults)
      .map(({ event, score }) => ({
        ...event,
        popularity_score: score,
      }));

    res.status(200).json({
      success: true,
      message:
        category || searchQuery
          ? `Found ${popularEvents.length} popular event(s) for "${category || searchQuery}"`
          : `Found ${popularEvents.length} popular event(s)`,
      data: {
        category: category || null,
        searchQuery: searchQuery || null,
        count: popularEvents.length,
        events: popularEvents,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in getCategoryBasedPopularEvents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch category popular events",
      error: error.message,
    });
  }
};

export const saveUserLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, displayName, latitude, longitude, source } = req.body;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ success: false, message: "userId is required" });
      return;
    }

    await WIEUSER.saveUserLocation(
      userId,
      displayName || "",
      latitude ?? null,
      longitude ?? null,
      source === "gps" || source === "manual" ? source : "manual",
    );

    res.status(200).json({ success: true, message: "Location saved" });
  } catch (error: any) {
    console.error("❌ saveUserLocation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save location",
      error: error.message,
    });
  }
};

export const getSavedUserLocation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ success: false, message: "userId is required" });
      return;
    }

    const saved = await WIEUSER.getSavedUserLocation(userId);

    if (!saved) {
      res.status(200).json({ success: true, data: null });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        displayName: saved.location ?? "",
        latitude: saved.latitude ?? null,
        longitude: saved.longitude ?? null,
        source:
          saved.locationSource === "gps" || saved.locationSource === "manual"
            ? saved.locationSource
            : "manual",
      },
    });
  } catch (error: any) {
    console.error("❌ getSavedUserLocation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get saved location",
      error: error.message,
    });
  }
};

export const getCancelledEventsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || undefined;
    const events = await getCancelledEvents(userId);
    res.status(200).json({
      success: true,
      message: `Found ${events.length} cancelled event(s)`,
      data: { events, count: events.length },
    });
  } catch (error: any) {
    console.error("❌ getCancelledEventsController error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cancelled events",
      error: error.message,
    });
  }
};

export const getRehostedEventsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || undefined;
    const events = await getRehostedEvents(userId);
    res.status(200).json({
      success: true,
      message: `Found ${events.length} rehosted event(s)`,
      data: { events, count: events.length },
    });
  } catch (error: any) {
    console.error("❌ getRehostedEventsController error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rehosted events",
      error: error.message,
    });
  }
};
